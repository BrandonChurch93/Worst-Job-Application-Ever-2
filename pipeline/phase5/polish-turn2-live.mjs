// node pipeline/phase5/polish-turn2-live.mjs OUT_DIR NTH BEFORE AFTER [LEVEL]: the pack's visitor walks the built live site, stepped, at 2 device pixels to a pixel of the
// 960 by 540 window (a picture of 1920 by 1080). It walks twice: once without drawing, to find the step at which the NTH page turn starts (1 is the turn into step 1),
// and once more to keep the picture of every step from BEFORE steps before that step to AFTER steps after it. rows.json holds the steps and the step of the start.
import fs from 'node:fs'
import path from 'node:path'
import { at, config } from '../../tools/lib/paths.mjs'
import { ensureBuild } from '../../tools/lib/capture.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { VISITOR, keyBlock, makeVisitor } from '../../tools/lib/pack-site.mjs'

const [out, nthArg = '1', beforeArg = '4', afterArg = '16', level = 'high'] = process.argv.slice(2)
if (!out) throw new Error('give the folder to write into')
const nth = Number(nthArg)
const before = Number(beforeArg)
const after = Number(afterArg)
const cfg = config()
const f = cfg.formats.preview
fs.mkdirSync(out, { recursive: true })

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

ensureBuild()
const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
const { browser } = await launch()
const rows = []
const problems = []
const visit = async (each) => {
  const context = await browser.newContext({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: 2 })
  const page = await context.newPage()
  page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
  await page.goto(`${server.url}/index.html?mode=live&format=${f.id}&assets=web&clock=steps&quality=${level}`)
  await page.evaluate(() => window.showcase.ready)
  await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const v = makeVisitor(f.width / cfg.formats.hd.width, VISITOR, keyBlock(cfg))
  let t = await tell(page, 0)
  const most = VISITOR.mostSeconds * VISITOR.hz
  for (let i = 0; i <= most; i++) {
    if (t.finished || (await each(i, t, page))) break
    for (const a of v.act(t)) await send(page, a)
    t = await tell(page, 1 / VISITOR.hz)
  }
  await context.close()
}
try {
  let turns = 0
  let was = false
  let start = -1
  await visit(async (i, t) => {
    if (t.turning && !was) turns++
    was = t.turning
    if (turns === nth) start = i
    return start >= 0
  })
  if (start < 0) throw new Error(`the visit has no turn ${nth}`)
  await visit(async (i, t, page) => {
    if (i < start - before) return false
    fs.writeFileSync(path.join(out, `step-${String(i).padStart(6, '0')}.png`), await shot(page))
    rows.push({ step: i, page: t.page, turning: t.turning, hero: t.hero })
    return i >= start + after
  })
  fs.writeFileSync(path.join(out, 'rows.json'), JSON.stringify({ nth, start, level, rows, problems }, null, 1) + '\n')
  console.log(`live: turn ${nth} starts at step ${start}; ${rows.length} pictures in ${out}; problems ${problems.length}`)
} finally {
  await browser.close()
  await server.close()
}
