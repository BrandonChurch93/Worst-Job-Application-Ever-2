// node pipeline/change002/shell-shout-row.mjs [--name list]
// The line that builds on marks (the applicant's shout) as the page's own panel draws it, at each of its steps, in four windows:
// the picture's place in the window as the live site fits it, the size of the type, the panel's box, and how many rows the words stand in.
// The list is kept beside this file, shell-shout-row.json, with the sha1 of src/ui/said.ts it was made from; tests/b-shell-shout-row.test.ts reads it.
// A picture of each step is kept in out/work/shout-row. --name keeps the list and the pictures in out/work/shout-row-NAME instead.
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { args, at, config, readJson, writeJson } from '../../tools/lib/paths.mjs'

// The windows the line is drawn in, width by height in CSS pixels: the film at full and at half size, and two small windows of a visitor.
const WINDOWS = [[1920, 1080], [960, 540], [1280, 720], [1024, 640]]

const a = args()
const c = config()
const work = at('out', 'work', typeof a.name === 'string' ? `shout-row-${a.name}` : 'shout-row')
fs.mkdirSync(work, { recursive: true })

const { logic } = await import('../../tools/lib/logic.mjs')
const { load, close } = await logic()
const copy = await load('/src/copy.ts')
const cues = await load('/src/audio/cues.ts')
const standin = await load('/src/audio/standin.ts')
const metrics = await load('/src/shell/metrics.ts')
const levelFit = await load('/src/core/levelFit.ts')
const settled = readJson(at('content', 'narration.json'))
const drafts = fs.existsSync(at('content', 'narration-drafts.json')) ? readJson(at('content', 'narration-drafts.json')).film ?? {} : {}
const script = { ...settled, film: { ...settled.film, ...Object.fromEntries(Object.entries(drafts).filter(([beat, ls]) => ls.length && !(settled.film[beat]?.length))) } }
const fps = c.film.fps
const lines = copy.timedLines(c, script).map((l) => ({ id: cues.filmLineId(l.beat, l.index), frame: Math.round(l.start * fps) }))
const steps = standin.filmCaptions(lines, fps).filter((cap) => cap.step)
const fonts = [...metrics.FONTS]
const fits = WINDOWS.map(([w, h]) => levelFit.fitPicture(w, h, 1, 1, false))
await close()
if (!steps.length) {
  console.error('shout: the script has no line that builds on marks')
  process.exit(1)
}

const { build } = await import('vite')
const { serve } = await import('../../tools/lib/serve.mjs')
const { launch } = await import('../../tools/lib/browser.mjs')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-shout-row-'))
await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: { said: at('src', 'ui', 'said.ts'), metrics: at('src', 'shell', 'metrics.ts') }, formats: ['es'] } } })
const js = (name) => fs.readdirSync(dir).find((f) => f.startsWith(name) && /\.m?js$/.test(f))
const css = fs.readdirSync(dir).filter((f) => f.endsWith('.css'))
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>shout</title>${css.map((f) => `<link rel="stylesheet" href="./${f}">`).join('')}
<style>html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; } body { display: grid; place-items: center; } canvas { display: block; }</style>
<body><canvas id="stage"></canvas><script type="module">
import { makeCaption } from './${js('said')}'
import { registerFont } from './${js('metrics')}'
for (const name of ${JSON.stringify(fonts)}) registerFont(name, await (await fetch('./fonts/' + name + '.json')).json())
let line = null
const panel = makeCaption(() => ({ now: 1, lines: line ? [line] : [] }))
window.fit = (w, h) => {
  const canvas = document.querySelector('canvas')
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
}
window.show = async (words, loud, step, whole) => {
  line = null
  panel.wake()
  for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r))
  line = { id: words, words, start: 0, end: 2, loud, step, whole }
  panel.wake()
  for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r))
  const el = document.querySelector('[data-narrator-caption]')
  const b = el.getBoundingClientRect()
  const p = document.querySelector('canvas').getBoundingClientRect()
  const drawn = [...el.querySelectorAll('svg')].map((s) => s.getBoundingClientRect())
  const range = document.createRange()
  range.selectNodeContents(el)
  const rects = drawn.length ? drawn : [...range.getClientRects()].filter((r) => r.width > 2)
  const round = (v) => Math.round(v * 10) / 10
  return { words: el.textContent, glyphs: drawn.length > 0, fontPx: round(parseFloat(getComputedStyle(el).fontSize)), rows: new Set(rects.map((r) => Math.round(r.top))).size, box: [b.left, b.top, b.width, b.height].map(round), picture: [p.left, p.top, p.width, p.height].map(round) }
}
window.ready = true
</script>`)
const site = await serve(dir, { mounts: { '/fonts/': at('public', 'fonts') } })
const launched = await launch([])
const windows = []
try {
  for (const [i, [width, height]] of WINDOWS.entries()) {
    const context = await launched.browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    await page.goto(`${site.url}/index.html`)
    await page.waitForFunction(() => window.ready === true)
    await page.evaluate(([w, h]) => window.fit(w, h), [fits[i].cssWidth, fits[i].cssHeight])
    await new Promise((r) => setTimeout(r, 300))
    const list = []
    for (const cap of steps) {
      const seen = await page.evaluate(([w, l, st, wh]) => window.show(w, l, st, wh), [cap.words, cap.loud, cap.step, cap.whole])
      const file = path.join(work, `${width}x${height}-${cap.key}-${cap.step.k}.png`)
      await page.screenshot({ path: file, omitBackground: true })
      const { picture, ...panel } = seen
      list.push({ key: cap.key, step: cap.step, whole: cap.whole, loud: cap.loud, file: path.relative(at(), file), picture, panel })
    }
    windows.push({ window: { width, height }, picture: list[0].picture, steps: list.map(({ picture, ...x }) => x) })
    await context.close()
  }
} finally {
  await launched.browser.close()
  await site.close()
}
const record = {
  made: `node pipeline/change002/shell-shout-row.mjs${typeof a.name === 'string' ? ` --name ${a.name}` : ''}`, browser: launched.version,
  source: { file: 'src/ui/said.ts', sha1: crypto.createHash('sha1').update(fs.readFileSync(at('src', 'ui', 'said.ts'))).digest('hex') },
  what: 'the line that builds on marks, drawn by the panel of src/ui/said.ts at each step in each window; picture is the place of the 16 to 9 picture in the window (left, top, width, height), box is the panel (left, top, width, height), all in CSS pixels of the window; rows is the number of rows the words stand in',
  windows
}
const listFile = typeof a.name === 'string' ? path.join(work, 'shell-shout-row.json') : at('pipeline', 'change002', 'shell-shout-row.json')
writeJson(listFile, record)
console.log(`shout: ${steps.length} steps in ${WINDOWS.length} windows, pictures in ${path.relative(at(), work)}, list in ${path.relative(at(), listFile)}`)
for (const w of windows) for (const s of w.steps) console.log(`  ${w.window.width} by ${w.window.height}, step ${s.step.k + 1} of ${s.step.n}: ${s.panel.rows} row${s.panel.rows === 1 ? '' : 's'}, type ${s.panel.fontPx} px, box ${s.panel.box.join(' ')}: ${s.panel.words}`)
