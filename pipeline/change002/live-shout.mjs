// node pipeline/change002/live-shout.mjs --dump out/work/live-shout/cases.json [--only a,c] [--level high]
// The shout on the built live site, stepped, from step 4: the pack's visitor fights the boss until the arms come out, then the button is pressed as each case says.
// A strip for each case: a picture every 0.1 s from the press to 0.5 s after the blast, the words on screen drawn by the site's own panel (src/ui/said.ts).
// The stepped site has no sound code, so the words are the ones the sound code was measured to show for the same case by tests/b-live-shout.test.ts,
// which writes them to the file named by LIVE_SHOUT_DUMP: `LIVE_SHOUT_DUMP=out/work/live-shout/cases.json npx vitest run tests/b-live-shout.test.ts`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config } from '../../tools/lib/paths.mjs'
import { ensureBuild } from '../../tools/lib/capture.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { VISITOR, keyBlock, makeVisitor } from '../../tools/lib/pack-site.mjs'

const a = args()
const level = String(a.level ?? 'high')
const cfg = config()
const f = cfg.formats.preview
const out = at('pipeline', 'change002', 'proof', 'live-shout')
const raw = String(a.raw ?? at('out', 'work', 'live-shout', 'frames'))
fs.mkdirSync(out, { recursive: true })
fs.mkdirSync(raw, { recursive: true })
const dump = JSON.parse(fs.readFileSync(String(a.dump ?? at('out', 'work', 'live-shout', 'cases.json')), 'utf8'))
const hz = VISITOR.hz
const CASES = {
  a: { says: 'a plain click at 2.0 s', down: (u) => u >= 2 && u < 2 + 1 / hz },
  b: { says: 'a hold of 0.6 s from 2.0 s', down: (u) => u >= 2 && u < 2.6 },
  c: { says: 'a hold of 1.2 s from 2.0 s', down: (u) => u >= 2 && u < 3.2 },
  d: { says: 'a hold of 3 s from 2.0 s', down: (u) => u >= 2 && u < 5 },
  e: { says: 'no press', down: () => false },
  f: { says: 'a plain click at 0.2 s', down: (u) => u >= 0.2 && u < 0.2 + 1 / hz }
}
const only = a.only ? String(a.only).split(',') : ['a', 'c']
const EVERY = 0.1
const AFTER = 0.5
const COLS = 6
const TILE = [480, 270]

const send = async (page, act) => {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down({ button: act.down })
  else if (act.up) await page.mouse.up({ button: act.up })
  else if (act.wheel) await page.mouse.wheel(0, act.wheel)
  else if (act.press) await page.keyboard.press(act.press)
  else if (act.keyDown) await page.keyboard.down(act.keyDown)
  else if (act.keyUp) await page.keyboard.up(act.keyUp)
}
const tell = (page, dt) =>
  page.evaluate((d) => {
    if (d > 0) window.liveRun.advance(d, true)
    const t = window.liveRun.told()
    return { time: t.time, pageTime: t.pageTime, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control }
  }, dt)

const { build } = await import('vite')
const lib = fs.mkdtempSync(path.join(os.tmpdir(), 'live-shout-'))
await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: lib, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: { said: at('src', 'ui', 'said.ts'), metrics: at('src', 'shell', 'metrics.ts') }, formats: ['es'] } } })
const js = (name) => fs.readdirSync(lib).find((x) => x.startsWith(name) && /\.m?js$/.test(x))
const { logic } = await import('../../tools/lib/logic.mjs')
const { load, close } = await logic()
const fonts = [...(await load('/src/shell/metrics.ts')).FONTS]
await close()

ensureBuild()
const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full'), '/panel/': lib, '/panel-fonts/': at('public', 'fonts') } })
const { browser, version } = await launch()
const report = { level, browser: version, window: [f.width, f.height, 2], take: dump.take, cases: {} }
try {
  for (const name of only) {
    const kind = CASES[name]
    const measured = dump.cases[name]
    if (!kind || !measured) throw new Error(`no case ${name}`)
    const context = await browser.newContext({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: 2 })
    const page = await context.newPage()
    const problems = []
    page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
    await page.goto(`${server.url}/index.html?mode=live&format=${f.id}&assets=web&clock=steps&quality=${level}&step=4`)
    await page.evaluate(() => window.showcase.ready)
    await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
    await page.evaluate(async ([said, metrics, names]) => {
      const { makeCaption, captionLow } = await import(`/panel/${said}`)
      const { registerFont } = await import(`/panel/${metrics}`)
      for (const n of names) registerFont(n, await (await fetch(`/panel-fonts/${n}.json`)).json())
      window.shoutSaid = { now: 0, lines: [] }
      window.shoutPanel = makeCaption(() => window.shoutSaid)
      window.shoutPanel.place(captionLow('step4'))
    }, [js('said'), js('metrics'), fonts])
    const v = makeVisitor(f.width / cfg.formats.hd.width, VISITOR, keyBlock(cfg))
    let t = await tell(page, 0)
    let steps = 0
    while (!t.gags.includes('boss.finish') && steps < VISITOR.mostSeconds * hz && !t.finished) {
      for (const act of v.act(t)) await send(page, act)
      t = await tell(page, 1 / hz)
      steps += 1
    }
    if (!t.gags.includes('boss.finish')) throw new Error(`${name}: the arms never came out in ${steps} steps`)
    for (const act of v.end()) await send(page, act)
    const arms = t.time
    const press = measured.press ?? measured.file[0].start
    const last = Math.round((measured.blast + AFTER) * hz)
    const first = Math.round(press * hz)
    const tiles = []
    const rows = []
    let held = false
    for (let i = 0; i <= last; i++) {
      const u = i / hz
      const want = kind.down(u + 1e-9)
      if (want !== held) await send(page, want ? { down: 'left' } : { up: 'left' })
      held = want
      if (i > 0) t = await tell(page, 1 / hz)
      if (i < first || (i - first) % Math.round(EVERY * hz) !== 0) continue
      const since = t.time - arms
      const words = await page.evaluate(async ([now, lines]) => {
        window.liveRun.state()
        window.shoutSaid = { now, lines: lines.map((l, k) => ({ id: `shout#${k}`, line: 'shout', draft: false, ...l })) }
        window.shoutPanel.wake()
        for (let n = 0; n < 4; n++) await new Promise((r) => requestAnimationFrame(r))
        window.liveRun.state()
        const el = document.querySelector('[data-narrator-caption]')
        return el && getComputedStyle(el).display !== 'none' ? el.textContent : ''
      }, [since, measured.said])
      const png = await page.screenshot()
      fs.writeFileSync(path.join(raw, `${name}-${String(i).padStart(4, '0')}.png`), png)
      const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TILE[0]}" height="26"><rect width="100%" height="100%" fill="#000"/><text x="8" y="18" font-family="monospace" font-size="15" fill="#fff">${since.toFixed(2)} s after the arms, ${(since - press).toFixed(2)} after the press${held ? ', held' : ''}</text></svg>`)
      const tile = await sharp(png).resize(TILE[0], TILE[1]).composite([{ input: label, left: 0, top: 0 }]).png().toBuffer()
      tiles.push({ input: tile, left: (tiles.length % COLS) * TILE[0], top: Math.floor(tiles.length / COLS) * TILE[1] })
      rows.push({ afterArms: Math.round(since * 1000) / 1000, afterPress: Math.round((since - press) * 1000) / 1000, held, words })
    }
    await sharp({ create: { width: TILE[0] * COLS, height: TILE[1] * Math.ceil(tiles.length / COLS), channels: 3, background: '#000' } }).composite(tiles).jpeg({ quality: 88 }).toFile(path.join(out, `strip-${name}.jpg`))
    report.cases[name] = { says: kind.says, armsAt: arms, press, blast: measured.blast, pictures: rows, problems: [...new Set(problems)].slice(0, 5) }
    console.log(`case ${name}: arms at ${arms}, press ${press}, blast ${measured.blast}, ${rows.length} pictures, problems ${problems.length}`)
    for (const r of rows) console.log(`  ${r.afterArms.toFixed(2)} s after the arms: ${r.words || '(no words)'}`)
    await context.close()
  }
  fs.writeFileSync(path.join(out, 'strips.json'), `${JSON.stringify(report, null, 1)}\n`)
} finally {
  await browser.close()
  await server.close()
}
