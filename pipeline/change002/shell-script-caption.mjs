// node pipeline/change002/shell-script-caption.mjs: line 1 of change note 003 through the site's own engine and caption panel in a browser, in real time.
// The site as built does not start while the beats of config/showcase.json cannot hold the new lines, so the page behind the panel is a kept still of the careers page.
// It writes shell-script-caption.json and the pictures shell-pictures/script-line1-phrases.png and script-loud.png.
// With --place Y it does one thing instead: the longest phrase of line 1 on the careers page with the panel's lower edge at CAPTION.low and at Y, one picture under the other (shell-pictures/script-caption-place.png).
// With --shout it runs the shout of the boss through the engine on the marks of the boss page, at the times of the stand-in, over a kept still of the fight (shell-pictures/script-shout.png).
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
await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: { engine: at('src', 'audio', 'index.ts'), said: at('src', 'ui', 'said.ts'), metrics: at('src', 'shell', 'metrics.ts') }, formats: ['es'] } } })
if (fs.existsSync(still)) fs.copyFileSync(still, path.join(dir, 'page.jpg'))
const fight = at('out', 'stills', 'key-boss-down-hd-final.jpg')
if (fs.existsSync(fight)) fs.copyFileSync(fight, path.join(dir, 'fight.jpg'))
const standing = at('out', 'stills', 'key-boss-fight-hd-final.jpg')
if (fs.existsSync(standing)) fs.copyFileSync(standing, path.join(dir, 'standing.jpg'))
const decided = at('out', 'stills', 'key-decision-hd-final.jpg')
if (fs.existsSync(decided)) fs.copyFileSync(decided, path.join(dir, 'decision.jpg'))
const css = fs.readdirSync(dir).filter((f) => f.endsWith('.css'))
const js = (name) => fs.readdirSync(dir).find((f) => f.startsWith(name) && /\.m?js$/.test(f))
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>caption</title>${css.map((f) => `<link rel="stylesheet" href="./${f}">`).join('')}<body style="margin:0;background:#16130f url(./page.jpg) center/cover no-repeat;height:100vh"><script type="module">
import { makeSound } from './${js('engine')}'
import { makeCaption } from './${js('said')}'
import { registerFont, FONTS } from './${js('metrics')}'
for (const name of FONTS) registerFont(name, await (await fetch('./fonts/' + name + '.json')).json())
let ctx = null
const AC = window.AudioContext
window.AudioContext = function (...x) { ctx = new AC(...x); return ctx }
window.AudioContext.prototype = AC.prototype
const sound = makeSound({ base: './audio/', caption: makeCaption })
const shout = location.search === '?shout' || location.search === '?standing' || location.search === '?decision'
const on = location.search === '?decision' ? 'step5' : 'step4'
if (shout) document.body.style.backgroundImage = location.search === '?decision' ? 'url(./decision.jpg)' : location.search === '?standing' ? 'url(./standing.jpg)' : 'url(./fight.jpg)'
window.box = () => { const el = [...document.querySelectorAll('[data-narrator-caption]')].find((e) => e.style.display !== 'none'); if (!el) return null; const r = el.getBoundingClientRect(); const k = 1920 / window.innerWidth; return { words: el.textContent, fontPx: Math.round(parseFloat(getComputedStyle(el).fontSize) * k), top: Math.round(r.top * k), bottom: Math.round(r.bottom * k), left: Math.round(r.left * k), type: (() => { const g = document.createRange(); g.selectNodeContents(el); const b = g.getBoundingClientRect(); return { left: Math.round(b.left * k), right: Math.round(b.right * k), wide: Math.round(b.width * k) } })(), right: Math.round(r.right * k), baked: el.dataset.drawn !== undefined } }
sound.page(shout ? on : 'marketing')
window.mark = (name) => sound.event({ name, step: 0, page: on, x: 960, y: 540, hitsCursor: false }, 'live')
window.now = () => (ctx ? ctx.currentTime : null)
window.said = () => sound.said()
window.log = () => sound.log()
window.panel = () => { const el = document.querySelector('[data-narrator-caption]'); return el && el.style.display !== 'none' ? el.textContent : null }
window.loud = (words) => { const t = performance.now(); makeCaption(() => ({ now: (performance.now() - t) / 1000, lines: [{ id: 'loud', words, start: 0, end: 60, loud: true }] })).wake() }
window.show = (words, low) => { const t = performance.now(); const c = makeCaption(() => ({ now: (performance.now() - t) / 1000, lines: [{ id: 'place', words, start: 0, end: 600 }] })); c.place(low); c.wake() }
window.ready = location.search === '?place' ? Promise.resolve(true) : sound.unlock().then(() => true)
</script>`)
const site = await serve(dir, { mounts: { '/audio/': at('public', 'audio'), '/fonts/': at('public', 'fonts') } })
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
  if (process.argv.includes('--shout')) {
    const d = JSON.parse(fs.readFileSync(at('content', 'narration-drafts.json'), 'utf8')).film['boss.finish'][0]
    const marks = [['finish-arms', 0], ...d.standIn.starts.slice(0, -1).map((t) => ['finish-charge', t]), ['finish-fire', d.standIn.starts[d.standIn.starts.length - 1]], ['(no mark: its own end)', d.standIn.seconds + 0.1]]
    const missing = []
    page.on('response', (r) => { if (r.status() === 404) missing.push(r.url().replace(site.url, '')) })
    page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); missing.push(`${page.url().split('?')[1]}: ${m.location().url.replace(site.url, '')}`) } })
    await page.goto(`${site.url}/index.html?shout`)
    await page.waitForFunction(() => typeof window.now === 'function' && window.ready !== undefined, null, { timeout: 8000 }).catch(() => { console.log(`page did not start: ${errors.join('; ')}`); process.exit(1) })
    await page.evaluate(() => window.ready)
    const t0 = await page.evaluate(() => window.now())
    const files = []
    const rows = []
    for (const [name, t] of marks) {
      while ((await page.evaluate(() => window.now())) < t0 + t) await new Promise((r) => setTimeout(r, 5))
      const sent = await page.evaluate((n) => { if (!n.startsWith('(')) window.mark(n); return window.now() }, name)
      if (name === 'finish-arms') { rows.push({ mark: name, at: Number((sent - t0).toFixed(3)), panel: await page.evaluate(() => window.box()) }); continue }
      await new Promise((r) => setTimeout(r, 250))
      rows.push({ mark: name, at: Number((sent - t0).toFixed(3)), panel: await page.evaluate(() => window.box()) })
      const file = path.join(dir, `shout-${files.length}.png`)
      await page.screenshot({ path: file })
      files.push(file)
    }
    const log = await page.evaluate(() => window.log())
    const n = files.length
    const cell = `scale=${VIEW.width / 3}:${VIEW.height / 3}`
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]${cell}[s${i}]`).join(';')};[s0][s1][s2]hstack=inputs=3[a];${n > 5 ? '[s3][s4][s5]hstack=inputs=3[b]' : `[s3][s4]hstack=inputs=2,pad=${VIEW.width}:${VIEW.height / 3}[b]`};[a][b]vstack=inputs=2[o]`, '-map', '[o]', '-frames:v', '1', path.join(pictures, 'script-shout.png')])
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', files[n - 2], '-frames:v', '1', path.join(pictures, 'script-shout-last.png')])
    await page.goto(`${site.url}/index.html?standing`)
    await page.waitForFunction(() => typeof window.mark === 'function' && window.ready !== undefined, null, { timeout: 8000 })
    await page.evaluate(() => window.ready)
    await page.evaluate(() => window.mark('checkbox'))
    await new Promise((r) => setTimeout(r, 700))
    const pill = await page.evaluate(() => window.box())
    await page.screenshot({ path: path.join(pictures, 'script-boss-pill.png') })
    await page.goto(`${site.url}/index.html?decision`)
    await page.waitForFunction(() => typeof window.mark === 'function' && window.ready !== undefined, null, { timeout: 8000 })
    await page.evaluate(() => window.ready)
    await page.evaluate(() => window.mark('stamp'))
    await new Promise((r) => setTimeout(r, 700))
    const decision = await page.evaluate(() => window.box())
    await page.screenshot({ path: path.join(pictures, 'script-decision-pill.png') })
    writeJson(path.join(out, 'shell-script-shout.json'), { made: 'node pipeline/change002/shell-script-caption.mjs --shout', browser: launched.version, behind: 'kept stills of the boss page, not the running site', text: d.text, draft: true, marks: rows, line6OnTheBossPage: pill, line8OnTheDecisionPage: decision, log, pageErrors: errors, missing })
    for (const r of rows) console.log(`shout: ${r.mark} at ${r.at} s, panel ${r.panel === null ? 'shows nothing' : JSON.stringify(r.panel)}`)
    console.log(`line 6 on the boss page: ${JSON.stringify(pill)}`)
    console.log(`line 8 on the decision page: ${JSON.stringify(decision)}`)
    console.log(`page errors: ${errors.length}; 404: ${JSON.stringify(missing)}`)
    await context.close()
    await launched.browser.close()
    await site.close?.()
    process.exit(0)
  }
  await page.goto(`${site.url}/index.html`)
  await page.waitForFunction(() => window.ready !== undefined, null, { timeout: 8000 })
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
