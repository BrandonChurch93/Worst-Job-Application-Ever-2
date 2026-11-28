// node pipeline/change002/camera-live.mjs [--only hold,click,never] [--level high] [--place x,y --at step --tag name]
// `--place`: where the visitor's pointer is put, in px of the window, from the moment the finish begins, or from step `--at` of the walk when that is given (a few steps before the boss falls, so that the arrow is elsewhere at the fall); `--tag` names the files of that run.
// The built live site, stepped, from step 4: the pack's visitor fights the boss until the arms come out, then a hand as named below takes the button.
// Each kind: a strip of twenty pictures at even steps from just before the arms to just after the boss is gone, and the seconds a picture costs with the lens low and from above. Software GL.
import fs from 'node:fs'
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
const out = at('pipeline', 'change002', 'proof', 'camera')
const raw = String(a.raw ?? '/tmp/cam/live')
fs.mkdirSync(out, { recursive: true })
fs.mkdirSync(raw, { recursive: true })
const KINDS = {
  hold: { says: 'holds 2 s and lets go', down: (t) => t >= 0.3 && t < 2.3, fire: 2.858 },
  click: { says: 'clicks once', down: (t) => t >= 0.3 && t < 0.38, fire: 1.796 },
  never: { says: 'never presses', down: () => false, fire: 6.004 }
}
const LEAD = 0
const GONE = 3.433
const AFTER = 0.6
const SHOTS = 20
const only = a.only ? String(a.only).split(',') : Object.keys(KINDS)
const place = a.place ? String(a.place).split(',').map(Number) : null
const early = a.at === undefined ? null : Number(a.at)
const tag = a.tag ? `-${a.tag}` : ''

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
const shot = async (page) => Buffer.from((await page.evaluate(() => window.liveRun.state().png)).split(',')[1], 'base64')
const cost = (page, times) =>
  page.evaluate((n) => {
    const c = document.querySelector('canvas')
    const draws = []
    for (let i = 0; i < n; i++) {
      const t0 = performance.now()
      window.liveRun.state()
      const t1 = performance.now()
      c.toDataURL('image/png')
      draws.push(t1 - t0 - (performance.now() - t1))
    }
    draws.sort((p, q) => p - q)
    return draws[Math.floor(n / 2)]
  }, times)

ensureBuild()
const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
const { browser, version } = await launch()
const report = { level, browser: version, window: [f.width, f.height, 2], kinds: {} }
try {
  for (const name of only) {
    const kind = KINDS[name]
    const context = await browser.newContext({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: 2 })
    const page = await context.newPage()
    const problems = []
    page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
    await page.goto(`${server.url}/index.html?mode=live&format=${f.id}&assets=web&clock=steps&quality=${level}&step=4`)
    await page.evaluate(() => window.showcase.ready)
    await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
    const v = makeVisitor(f.width / cfg.formats.hd.width, VISITOR, keyBlock(cfg))
    let t = await tell(page, 0)
    let steps = 0
    while (!t.gags.includes('boss.finish') && steps < VISITOR.mostSeconds * VISITOR.hz && !t.finished) {
      const away = place && early !== null && steps >= early
      if (away && steps === early) await send(page, { move: place })
      for (const act of v.act(t)) if (!away || !('move' in act)) await send(page, act)
      t = await tell(page, 1 / VISITOR.hz)
      steps += 1
    }
    if (!t.gags.includes('boss.finish')) throw new Error(`${name}: the arms never came out in ${steps} steps`)
    for (const act of v.end()) await send(page, act)
    if (place) await send(page, { move: place })
    const hero = t.hero ? [Math.round(t.hero.x), Math.round(t.hero.y)] : null
    const arms = t.time
    const span = Math.round((LEAD + kind.fire + GONE + AFTER) * VISITOR.hz)
    const wanted = Array.from({ length: SHOTS }, (_, i) => Math.round((i * span) / (SHOTS - 1)) - Math.round(LEAD * VISITOR.hz))
    const tiles = []
    const rows = []
    const costs = { above: null, low: null, after: null }
    let held = false
    const w = 300
    const h = 169
    for (let i = 0; i <= wanted.at(-1); i++) {
      const since = i / VISITOR.hz
      const want = kind.down(since)
      if (want !== held) await send(page, want ? { down: 'left' } : { up: 'left' })
      held = want
      if (i > 0) t = await tell(page, 1 / VISITOR.hz)
      if (i === 0) costs.above = await cost(page, Number(a.draws ?? 7))
      if (i === Math.round(Math.max(1.2, kind.fire - 0.2) * VISITOR.hz) && name !== 'click') costs.low = await cost(page, Number(a.draws ?? 7))
      if (name === 'click' && i === Math.round((kind.fire + 0.4) * VISITOR.hz)) costs.low = await cost(page, Number(a.draws ?? 7))
      if (i === wanted.at(-1)) costs.after = await cost(page, Number(a.draws ?? 7))
      if (!wanted.includes(i)) continue
      const png = await shot(page)
      const file = path.join(raw, `${name}-${String(i).padStart(4, '0')}.png`)
      fs.writeFileSync(file, png)
      tiles.push({ input: await sharp(png).resize(w, h).png().toBuffer(), left: (tiles.length % 4) * w, top: Math.floor(tiles.length / 4) * h })
      rows.push({ sixtieths: i, seconds: Math.round((t.time - arms) * 1000) / 1000, held, gag: t.gags.at(-1), control: t.control })
    }
    await sharp({ create: { width: w * 4, height: h * Math.ceil(SHOTS / 4), channels: 3, background: '#000' } }).composite(tiles).jpeg({ quality: 90 }).toFile(path.join(out, `live-${name}${tag}.jpg`))
    report.kinds[name] = { says: kind.says, place, placedAtStep: early, heroAtArms: hero, stepsToArms: steps, armsAt: arms, rows, drawMs: costs, problems: [...new Set(problems)].slice(0, 5) }
    console.log(name, 'arms at', arms, 'draw ms', JSON.stringify(costs), 'problems', problems.length)
    await context.close()
  }
  fs.writeFileSync(path.join(out, `live${tag}.json`), JSON.stringify(report, null, 1) + '\n')
} finally {
  await browser.close()
  await server.close()
}
