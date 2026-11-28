// node pipeline/change002/shell-film-captions.mjs [--until 18] [--fps 30] [--size 960x540] [--name list] [--onto film.mp4 --out captioned.mp4] [--proof]
// The captions of the film: one picture of the panel a phrase (the size of the film, clear around the panel), the frames each is on, and the filter that lays them over a film.
// The pictures are drawn at the size of the film they are laid over and are never scaled: with --onto the size and the frames a second are read from that film,
// with --size they are as given, and with neither they are 1920 by 1080. The panel is the page's own, which is drawn smaller on a smaller page.
// The list is kept beside this file when no --name is given: shell-film-captions.json, or shell-film-captions-960x540.json for --size 960x540.
// The lines and their frames are the ones the film gives (timedLines of src/copy.ts); the phrases are those of src/audio/standin.ts; the panel is the one of src/ui/said.ts.
// A line that leaves on a mark of the film (steps.hides of its row) is ended on that mark's frame in cut/CUTLIST.json.
// --proof lays them over a kept still of the careers page held for the length asked, to show the timing; it is not the film.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { args, at, config, readJson, writeJson } from '../../tools/lib/paths.mjs'

const a = args()
const c = config()
const stop = (line) => {
  console.error(`captions: ${line}`)
  process.exit(1)
}
const probe = (file, entries) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', `stream=${entries}`, '-of', 'csv=p=0', file]).toString().trim().split(',')
const onto = typeof a.onto === 'string' ? path.resolve(a.onto) : null
if (onto && !fs.existsSync(onto)) stop(`there is no film at ${a.onto}`)
const film = onto ? probe(onto, 'width,height,r_frame_rate') : null
const rate = film ? film[2].split('/').map(Number) : null
const fps = typeof a.fps === 'string' && Number.isFinite(Number(a.fps)) ? Number(a.fps) : rate ? rate[0] / (rate[1] || 1) : c.film.fps
const name = typeof a.name === 'string' ? a.name : 'shell-film-captions'
const until = typeof a.until === 'string' && Number.isFinite(Number(a.until)) ? Number(a.until) : Infinity
const PAGE = { width: 1920, height: 1080 }
const asked = typeof a.size === 'string' ? /^(\d+)x(\d+)$/.exec(a.size) : null
if (typeof a.size === 'string' && !asked) stop('--size is a width and a height in pixels, as in 960x540')
const SIZE = film ? { width: Number(film[0]), height: Number(film[1]) } : asked ? { width: Number(asked[1]), height: Number(asked[2]) } : PAGE
if (film && asked && (SIZE.width !== Number(asked[1]) || SIZE.height !== Number(asked[2]))) stop(`--size ${a.size} is not the size of the film, ${SIZE.width} by ${SIZE.height}`)
const sized = asked && !film && typeof a.name !== 'string' ? `${SIZE.width}x${SIZE.height}` : ''
const work = at('out', 'work', typeof a.name === 'string' ? `captions-${a.name}` : sized ? `captions-${sized}` : 'captions')
fs.mkdirSync(work, { recursive: true })
if (SIZE.width * PAGE.height !== SIZE.height * PAGE.width) stop(`a picture of ${SIZE.width} by ${SIZE.height} is not the shape of the page, ${PAGE.width} by ${PAGE.height}`)

const { logic } = await import('../../tools/lib/logic.mjs')
const { load, close } = await logic()
const copy = await load('/src/copy.ts')
const cues = await load('/src/audio/cues.ts')
const standin = await load('/src/audio/standin.ts')
const metrics = await load('/src/shell/metrics.ts')
const said = await load('/src/ui/said.ts')
const settled = readJson(at('content', 'narration.json'))
const drafts = fs.existsSync(at('content', 'narration-drafts.json')) ? readJson(at('content', 'narration-drafts.json')).film ?? {} : {}
const script = { ...settled, film: { ...settled.film, ...Object.fromEntries(Object.entries(drafts).filter(([beat, ls]) => ls.length && !(settled.film[beat]?.length))) } }
const lines = copy.timedLines(c, script).map((l) => ({ id: cues.filmLineId(l.beat, l.index), frame: Math.round(l.start * fps) })).filter((l) => l.frame < until * fps)
// Each phrase lies where the live site's panel lies on the page it is said over: `CAPTION.lowOn` for the boss page and the decision page, `CAPTION.low` elsewhere.
// A line set off by the turn of the page (line 9) is given the place of the page turned to for the whole of it, the half second of the turn too.
const unitOf = (key) => c.film.beats.find((b) => b.id === key.slice(0, key.lastIndexOf('.')))?.unit ?? ''
// The film's marks by frame are the cut list's (cut/CUTLIST.json, made by npm run cut). A line whose row names a mark as steps.hides leaves on it: see filmCaptions.
const cutFile = at('cut', 'CUTLIST.json')
const cut = fs.existsSync(cutFile) ? readJson(cutFile) : { fps, events: [] }
const hideNames = new Set(Object.values(cues.spoken).map((row) => row.steps?.hides).filter((n) => n !== undefined))
const marks = cut.events.filter((e) => hideNames.has(e.name)).map((e) => ({ name: e.name, frame: Math.round(e.frame * fps / cut.fps) }))
const caps = standin.filmCaptions(lines, fps, undefined, marks).map((cap) => {
  const page = cues.filmLinePage(cap.key, unitOf(cap.key))
  return { ...cap, page, lowerEdgeY: said.captionLow(page) }
})
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
window.show = async (words, loud, low, step, whole) => {
  line = null
  panel.wake()
  for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r))
  panel.place(low)
  line = { id: words, words, start: 0, end: 2, loud, ...(step ? { step, whole } : {}) }
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
    const seen = await page.evaluate(([w, l, y, st, wh]) => window.show(w, l, y, st, wh), [cap.words, cap.loud, cap.lowerEdgeY, cap.step ?? null, cap.whole ?? null])
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

const outside = list.filter((x) => x.panel.box[0] < 0 || x.panel.box[1] < 0 || x.panel.box[0] + x.panel.box[2] > SIZE.width || x.panel.box[1] + x.panel.box[3] > SIZE.height).map((x) => `${x.key} phrase ${x.phrase}`)
const filter = list.map((x, i) => `[${i === 0 ? '0:v' : `v${i}`}][${i + 1}:v]overlay=0:0:enable='between(n,${x.first},${x.last})'[v${i + 1}]`).join(';')
const record = {
  made: `node pipeline/change002/shell-film-captions.mjs${Number.isFinite(until) ? ` --until ${until}` : ''}${typeof a.fps === 'string' ? ` --fps ${fps}` : ''}${asked ? ` --size ${a.size}` : ''}${onto ? ` --onto ${a.onto}` : ''}`, browser: launched.version, fps, size: SIZE,
  drawn: 'each picture is drawn at this size, the size of the film it is laid over, and is laid without scaling; lowerEdgeY and lowerEdgeYOn are in pixels of the 1920 by 1080 page, each box is in pixels of the picture',
  outside, lowerEdgeY: low, lowerEdgeYOn: said.CAPTION.lowOn,
  note: 'every line is a silent stand-in; a line with draft true is a draft', lines, captions: list,
  hides: { what: 'the marks of the cut list on which a caption leaves before its line ends (steps.hides of its row in src/audio/cues.ts), by frame at the frames a second of this list; none when the film sends no such mark', names: [...hideNames], marks },
  filter, filterUse: 'ffmpeg -i FILM -i each picture in order -filter_complex FILTER -map [vN] -map 0:a? ...; n is the frame of the film'
}
const lay = (film, out, fit = false) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...film, ...list.flatMap((x) => ['-i', at(x.file)]), '-filter_complex', fit ? `[0:v]scale=${SIZE.width}:${SIZE.height}[v0];${filter.replace('[0:v]', '[v0]')}` : filter, '-map', `[v${list.length}]`, '-r', String(fps), '-pix_fmt', 'yuv420p', out])
if (onto && list.length) {
  const out = typeof a.out === 'string' ? path.resolve(a.out) : path.join(work, 'captioned.mp4')
  lay(['-i', onto], out)
  record.laidOver = { film: a.onto, out: path.relative(at(), out) }
}
if (a.proof && list.length) {
  const seconds = Number.isFinite(until) ? until : Math.ceil((list[list.length - 1].last + 1) / fps)
  const out = path.join(work, 'proof.mp4')
  lay(['-loop', '1', '-framerate', String(fps), '-t', String(seconds), '-i', at('out', 'stills', 'key-marketing-top-hd-final.jpg')], out, true)
  const frames = Number(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out]).toString().trim())
  record.proof = { what: 'the pictures laid over a kept still of the careers page, fitted to their size and held for the length asked: the timing of the captions, not the film', file: path.relative(at(), out), seconds, frames }
}
const listFile = typeof a.name === 'string' ? path.join(work, `${name}.json`) : at('pipeline', 'change002', sized ? `shell-film-captions-${sized}.json` : 'shell-film-captions.json')
writeJson(listFile, record)
if (outside.length) console.log(`captions: OUTSIDE THE PICTURE: ${outside.join(', ')}`)
console.log(`captions: ${list.length} phrases of ${lines.length} lines${Number.isFinite(until) ? ` that start in the first ${until} s` : ''}, drawn at ${SIZE.width} by ${SIZE.height} for ${fps} frames a second, pictures in ${path.relative(at(), work)}, list in ${path.relative(at(), listFile)}`)
for (const x of list) console.log(`  frames ${x.first} to ${x.last}${x.draft ? ' (draft)' : ''}, ${x.page}, box ${x.panel.box.join(' ')}: ${x.words}`)
