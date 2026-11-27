// node pipeline/change002/shell-script-caption.mjs: line 1 of change note 003 through the site's own engine and caption panel in a browser, in real time.
// The site as built does not start while the beats of config/showcase.json cannot hold the new lines, so the page behind the panel is a kept still of the careers page.
// It writes shell-script-caption.json and the pictures shell-pictures/script-line1-phrases.png and script-loud.png.
// With --place Y it does one thing instead: the longest phrase of line 1 on the careers page with the panel's lower edge at CAPTION.low and at Y, one picture under the other (shell-pictures/script-caption-place.png).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { at, writeJson } from '../../tools/lib/paths.mjs'

const VIEW = { width: 1200, height: 675 }
const out = at('pipeline', 'change002')
const pictures = path.join(out, 'shell-pictures')
const still = at('out', 'stills', 'key-marketing-top-hd-final.jpg')
const { build } = await import('vite')
const { serve } = await import('../../tools/lib/serve.mjs')
const { launch } = await import('../../tools/lib/browser.mjs')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-script-caption-'))
await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: { engine: at('src', 'audio', 'index.ts'), said: at('src', 'ui', 'said.ts') }, formats: ['es'] } } })
if (fs.existsSync(still)) fs.copyFileSync(still, path.join(dir, 'page.jpg'))
const css = fs.readdirSync(dir).filter((f) => f.endsWith('.css'))
const js = (name) => fs.readdirSync(dir).find((f) => f.startsWith(name) && /\.m?js$/.test(f))
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>caption</title>${css.map((f) => `<link rel="stylesheet" href="./${f}">`).join('')}<body style="margin:0;background:#16130f url(./page.jpg) center/cover no-repeat;height:100vh"><script type="module">
import { makeSound } from './${js('engine')}'
import { makeCaption } from './${js('said')}'
let ctx = null
const AC = window.AudioContext
window.AudioContext = function (...x) { ctx = new AC(...x); return ctx }
window.AudioContext.prototype = AC.prototype
const sound = makeSound({ base: './audio/', caption: makeCaption })
sound.page('marketing')
window.now = () => (ctx ? ctx.currentTime : null)
window.said = () => sound.said()
window.log = () => sound.log()
window.panel = () => { const el = document.querySelector('[data-narrator-caption]'); return el && el.style.display !== 'none' ? el.textContent : null }
window.loud = (words) => { const t = performance.now(); makeCaption(() => ({ now: (performance.now() - t) / 1000, lines: [{ id: 'loud', words, start: 0, end: 60, loud: true }] })).wake() }
window.show = (words, low) => { const t = performance.now(); const c = makeCaption(() => ({ now: (performance.now() - t) / 1000, lines: [{ id: 'place', words, start: 0, end: 600 }] })); c.place(low); c.wake() }
window.ready = location.search ? Promise.resolve(true) : sound.unlock().then(() => true)
</script>`)
const site = await serve(dir, { mounts: { '/audio/': at('public', 'audio') } })
const launched = await launch(['--autoplay-policy=no-user-gesture-required'])
const record = { made: 'node pipeline/change002/shell-script-caption.mjs', browser: launched.version, view: VIEW, behind: fs.existsSync(still) ? 'a kept still of the careers page, not the running site' : 'a plain page' }
try {
  const context = await launched.browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message)))
  const placeAt = process.argv.indexOf('--place')
  if (placeAt > 0) {
    const y = Number(process.argv[placeAt + 1])
    const n = JSON.parse(fs.readFileSync(at('content', 'narration.json'), 'utf8'))
    const words = n.film['marketing.stroll'][0].text.split(n.pauseMark).map((x) => x.trim()).sort((a, b) => b.length - a.length)[0]
    const files = []
    for (const low of [undefined, y]) {
      await page.goto(`${site.url}/index.html?place`)
      await page.evaluate(([w, l]) => window.show(w, l), [words, low ?? null])
      await new Promise((r) => setTimeout(r, 600))
      const box = await page.evaluate(() => { const el = [...document.querySelectorAll('[data-narrator-caption]')].find((e) => e.style.display !== 'none'); const r = el?.getBoundingClientRect(); return r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null })
      const k = 1920 / VIEW.width
      console.log(`place: lower edge asked ${low ?? 'CAPTION.low'}, panel in page pixels top ${box ? Math.round(box.top * k) : '-'} bottom ${box ? Math.round(box.bottom * k) : '-'} left ${box ? Math.round(box.left * k) : '-'} right ${box ? Math.round(box.right * k) : '-'}, words: ${words}`)
      const file = path.join(dir, `place-${files.length}.png`)
      await page.screenshot({ path: file })
      files.push(file)
    }
    const top = Math.round(VIEW.height * 0.55)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', files[0], '-i', files[1], '-filter_complex', `[0:v]crop=${VIEW.width}:${VIEW.height - top}:0:${top}[a];[1:v]crop=${VIEW.width}:${VIEW.height - top}:0:${top}[b];[a][b]vstack=inputs=2[o]`, '-map', '[o]', '-frames:v', '1', path.join(pictures, 'script-caption-place.png')])
    await context.close()
    await launched.browser.close()
    await site.close?.()
    process.exit(0)
  }
  await page.goto(`${site.url}/index.html`)
  await page.evaluate(() => window.ready)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  let said = []
  for (let i = 0; i < 50 && !said.length; i++) { said = await page.evaluate(() => window.said().lines); if (!said.length) await wait(40) }
  const shots = []
  const seen = []
  for (const p of said) {
    const mid = (p.start + p.end) / 2
    while ((await page.evaluate(() => window.now())) < mid) await wait(20)
    const got = await page.evaluate(() => ({ t: window.now(), words: window.panel() }))
    const file = path.join(dir, `phrase-${shots.length}.png`)
    await page.screenshot({ path: file })
    shots.push(file)
    seen.push({ id: p.id, words: p.words, from: Number(p.start.toFixed(3)), to: Number(p.end.toFixed(3)), lookedAt: Number(got.t.toFixed(3)), panelShows: got.words, same: got.words === p.words })
  }
  const last = said[said.length - 1]
  while ((await page.evaluate(() => window.now())) < last.end + 0.3) await wait(20)
  record.line1 = { phrases: seen, seconds: Number((last.end - said[0].start).toFixed(3)), panelAfterTheLine: await page.evaluate(() => window.panel()), log: await page.evaluate(() => window.log()) }
  const band = { y: Math.round(VIEW.height * 0.8), high: Math.round(VIEW.height * 0.2) }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...shots.flatMap((f) => ['-i', f]), '-filter_complex', `${shots.map((_, i) => `[${i}:v]crop=${VIEW.width}:${band.high}:0:${band.y}[s${i}]`).join(';')};${shots.map((_, i) => `[s${i}]`).join('')}vstack=inputs=${shots.length}[o]`, '-map', '[o]', '-frames:v', '1', path.join(pictures, 'script-line1-phrases.png')])
  record.line1.picture = { file: 'shell-pictures/script-line1-phrases.png', what: `the lowest fifth of the page at the middle of each phrase, one under the other, in order` }
  await page.evaluate(() => window.loud('one word'))
  await wait(300)
  record.loud = { asked: 'one word', panelShows: await page.evaluate(() => [...document.querySelectorAll('[data-narrator-caption]')].map((el) => (el.style.display !== 'none' ? { words: el.textContent, fontPx: getComputedStyle(el).fontSize, transform: getComputedStyle(el).textTransform } : null))) }
  await page.screenshot({ path: path.join(pictures, 'script-loud.png') })
  record.pageErrors = errors
  await context.close()
} finally {
  await launched.browser.close()
  await site.close()
}
writeJson(path.join(out, 'shell-script-caption.json'), record)
console.log(JSON.stringify(record, null, 1))
