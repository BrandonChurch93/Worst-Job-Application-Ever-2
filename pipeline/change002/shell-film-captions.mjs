// node pipeline/change002/shell-film-captions.mjs [--until 18] [--onto film.mp4 --out captioned.mp4] [--proof]
// The captions of the film: one picture of the panel a phrase (1920 by 1080, clear around the panel), the frames each is on, and the filter that lays them over a film.
// The lines and their frames are the ones the film gives (timedLines of src/copy.ts); the phrases are those of src/audio/standin.ts; the panel is the one of src/ui/said.ts.
// --proof lays them over a kept still of the careers page held for the length asked, to show the timing; it is not the film.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { args, at, config, readJson, writeJson } from '../../tools/lib/paths.mjs'

const a = args()
const c = config()
const fps = c.film.fps
const until = typeof a.until === 'string' && Number.isFinite(Number(a.until)) ? Number(a.until) : Infinity
const SIZE = { width: 1920, height: 1080 }
const work = at('out', 'work', 'captions')
fs.mkdirSync(work, { recursive: true })

const { logic } = await import('../../tools/lib/logic.mjs')
const { load, close } = await logic()
const copy = await load('/src/copy.ts')
const cues = await load('/src/audio/cues.ts')
const standin = await load('/src/audio/standin.ts')
const metrics = await load('/src/shell/metrics.ts')
const said = await load('/src/ui/said.ts')
const lines = copy.timedLines(c, readJson(at('content', 'narration.json'))).map((l) => ({ id: cues.filmLineId(l.beat, l.index), frame: Math.round(l.start * fps) })).filter((l) => l.frame < until * fps)
const caps = standin.filmCaptions(lines, fps)
const fonts = [...metrics.FONTS]
const low = said.CAPTION.low
await close()

const { build } = await import('vite')
const { serve } = await import('../../tools/lib/serve.mjs')
const { launch } = await import('../../tools/lib/browser.mjs')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-film-captions-'))
await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: { said: at('src', 'ui', 'said.ts'), metrics: at('src', 'shell', 'metrics.ts') }, formats: ['es'] } } })
const js = (name) => fs.readdirSync(dir).find((f) => f.startsWith(name) && /\.m?js$/.test(f))
const css = fs.readdirSync(dir).filter((f) => f.endsWith('.css'))
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>captions</title>${css.map((f) => `<link rel="stylesheet" href="./${f}">`).join('')}<body style="margin:0;background:transparent"><script type="module">
import { makeCaption } from './${js('said')}'
import { registerFont } from './${js('metrics')}'
for (const name of ${JSON.stringify(fonts)}) registerFont(name, await (await fetch('./fonts/' + name + '.json')).json())
let line = null
const panel = makeCaption(() => ({ now: 1, lines: line ? [line] : [] }))
window.show = async (words, loud) => {
  line = { id: words, words, start: 0, end: 2, loud }
  panel.wake()
  for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r))
  const el = document.querySelector('[data-narrator-caption]')
  const b = el.getBoundingClientRect()
  return { words: el.textContent, glyphs: el.querySelector('svg, canvas, span') !== null, box: [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10) }
}
window.ready = true
</script>`)
const site = await serve(dir, { mounts: { '/fonts/': at('public', 'fonts') } })
const launched = await launch([])
const list = []
try {
  const context = await launched.browser.newContext({ viewport: SIZE, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message)))
  await page.goto(`${site.url}/index.html`)
  await page.waitForFunction(() => window.ready === true)
  await new Promise((r) => setTimeout(r, 300))
  for (const [i, cap] of caps.entries()) {
    const seen = await page.evaluate(([w, l]) => window.show(w, l), [cap.words, cap.loud])
    const file = path.join(work, `${String(i).padStart(3, '0')}-${cap.key}-${cap.phrase}.png`)
    await page.screenshot({ path: file, omitBackground: true })
    list.push({ ...cap, file: path.relative(at(), file), panel: seen })
  }
  if (errors.length) console.log(`captions: page errors: ${errors.join('; ')}`)
  await context.close()
} finally {
  await launched.browser.close()
  await site.close()
}

const filter = list.map((x, i) => `[${i === 0 ? '0:v' : `v${i}`}][${i + 1}:v]overlay=0:0:enable='between(n,${x.first},${x.last})'[v${i + 1}]`).join(';')
const record = {
  made: `node pipeline/change002/shell-film-captions.mjs${Number.isFinite(until) ? ` --until ${until}` : ''}`, browser: launched.version, fps, size: SIZE, lowerEdgeY: low,
  note: 'every line is a silent stand-in; a line with draft true is a draft', lines, captions: list,
  filter, filterUse: 'ffmpeg -i FILM -i each picture in order -filter_complex FILTER -map [vN] -map 0:a? ...; n is the frame of the film'
}
const lay = (film, out) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...film, ...list.flatMap((x) => ['-i', at(x.file)]), '-filter_complex', filter, '-map', `[v${list.length}]`, '-r', String(fps), '-pix_fmt', 'yuv420p', out])
if (typeof a.onto === 'string' && list.length) {
  const out = typeof a.out === 'string' ? path.resolve(a.out) : path.join(work, 'captioned.mp4')
  lay(['-i', path.resolve(a.onto)], out)
  record.laidOver = { film: a.onto, out: path.relative(at(), out) }
}
if (a.proof && list.length) {
  const seconds = Number.isFinite(until) ? until : Math.ceil((list[list.length - 1].last + 1) / fps)
  const out = path.join(work, 'proof.mp4')
  lay(['-loop', '1', '-framerate', String(fps), '-t', String(seconds), '-i', at('out', 'stills', 'key-marketing-top-hd-final.jpg')], out)
  const frames = Number(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out]).toString().trim())
  record.proof = { what: 'the pictures laid over a kept still of the careers page held for the length asked: the timing of the captions, not the film', file: path.relative(at(), out), seconds, frames }
}
writeJson(at('pipeline', 'change002', 'shell-film-captions.json'), record)
console.log(`captions: ${list.length} phrases of ${lines.length} lines${Number.isFinite(until) ? ` that start in the first ${until} s` : ''}, pictures in ${path.relative(at(), work)}, list in pipeline/change002/shell-film-captions.json`)
for (const x of list) console.log(`  frames ${x.first} to ${x.last}${x.draft ? ' (draft)' : ''}: ${x.words}`)
