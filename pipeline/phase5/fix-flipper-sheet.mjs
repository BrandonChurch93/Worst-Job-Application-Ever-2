// The pinball page in the browser as a visitor plays it, drawn step by step round the first flipper press, with the site's own numbers beside each picture.
// The visitor is the pack tool's own (tools/lib/pack-site.mjs): real pointer and key events, the Shift keys 11 steps after the page's hint.
// node pipeline/phase5/fix-flipper-sheet.mjs --name NAME [--format hd] [--frames 24] [--lead 3] [--hold N] [--fine] [--phase K]
//   --hold N   the first flipper key is let go after N visitor steps and no flipper key is pressed again (without it the visitor follows the hint)
//   --fine     one picture for every step of the physics (1/240 s) in place of every visitor step (1/60 s)
//   --phase K  K steps of the physics are run before the visitor starts, so its 1/60 s grid falls K steps later
import fs from 'node:fs'
import path from 'node:path'
import { at, config } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'
import { LEVEL, VISITOR, makeVisitor } from '../../tools/lib/pack-site.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)
const name = arg('name', 'run')
const format = arg('format', 'hd')
const frames = Number(arg('frames', 24))
const lead = Number(arg('lead', 3))
const hold = arg('hold', null)
const fine = has('fine')
const phase = Number(arg('phase', 0))
const cfg = config()
const f = cfg.formats[format]
const k = f.width / cfg.formats.hd.width
const dir = at('out', 'work', 'fix-flipper', name)
fs.mkdirSync(dir, { recursive: true })

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
    return { time: t.time, pageTime: t.pageTime, page: t.page, turning: t.turning, scroll: t.scroll, hint: t.hint, hero: t.hero, control: t.control, finished: t.finished }
  }, dt)

const session = await openSession({ format: f.id, assets: 'web', mode: 'live', query: `&clock=steps&quality=${LEVEL}&step=3` })
const rows = []
try {
  const page = session.page
  await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const v = makeVisitor(k)
  let t = await tell(page, phase / 240)
  let hinted = -1
  let pressed = -1
  let released = false
  let shots = 0
  const keys = { left: false, right: false }
  for (let i = 0; i < VISITOR.hz * 60; i++) {
    if (hinted < 0 && t.hint && (t.hint.flipLeft === true || t.hint.flipRight === true)) hinted = i
    const from = hinted < 0 ? Infinity : hinted + VISITOR.reactSteps - lead
    let list = v.act(t)
    if (hold !== null && pressed >= 0) list = list.filter((a) => !a.keyDown && !a.keyUp)
    if (hold !== null && pressed >= 0 && !released && i - pressed >= Number(hold)) {
      list.push(...['ShiftLeft', 'ShiftRight'].filter((c) => keys[c === 'ShiftLeft' ? 'left' : 'right']).map((c) => ({ keyUp: c })))
      released = true
    }
    for (const a of list) {
      if (a.keyDown === 'ShiftLeft') keys.left = true
      if (a.keyDown === 'ShiftRight') keys.right = true
      if (a.keyUp === 'ShiftLeft') keys.left = false
      if (a.keyUp === 'ShiftRight') keys.right = false
      await send(page, a)
    }
    if (pressed < 0 && (keys.left || keys.right)) pressed = i
    const parts = fine && i >= from ? 4 : 1
    for (let p = 0; p < parts; p++) {
      t = await tell(page, 1 / VISITOR.hz / parts)
      if (i >= from && shots < frames) {
        const shot = await page.evaluate(() => window.liveRun.state().png)
        const file = `${String(shots).padStart(3, '0')}.png`
        fs.writeFileSync(path.join(dir, file), Buffer.from(shot.split(',')[1], 'base64'))
        rows.push({ n: shots, file, visitorStep: i, part: p, time: t.time, pageTime: t.pageTime, heroX: t.hero.x, heroY: t.hero.y, scroll: t.scroll, left: keys.left, right: keys.right, sincePress: pressed < 0 ? null : i - pressed })
        shots++
        console.log(`picture ${shots} of ${frames}: page time ${t.pageTime.toFixed(4)} s, the arrow at ${t.hero.x.toFixed(1)}, ${t.hero.y.toFixed(1)}, keys ${keys.left ? 'L' : '.'}${keys.right ? 'R' : '.'}`)
      }
    }
    if (shots >= frames || t.finished) break
  }
  fs.writeFileSync(path.join(dir, 'rows.json'), JSON.stringify({ name, format: f.id, level: LEVEL, hold, fine, phase, hinted, pressed, rows, problems: [...new Set(session.problems)].slice(0, 8) }, null, 1) + '\n')
  console.log(`hint at visitor step ${hinted}, key at ${pressed}; ${shots} pictures in ${dir}`)
} finally {
  await session.close()
}
