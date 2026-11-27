// The save at a gate on the live pinball page, stepped without a browser, per frame of 60 as it lies on the screen (the pack's visitor is `pack`: its hand follows the page's hints a beat late).
// node pipeline/phase5/polish-save2-measure.mjs [--visitor never,pack] [--seed 1] [--nth 1] [--before 6] [--after 40] [--json file]
// Per frame: the page's time, the ball's middle on the screen and its step from the frame before, the wire's turn past shut (rad), the top wire's and the pin's place (px, y down), the wire's lowest point and the px of screen under it,
// the gap of shell and wire (px), the heading of the arrow inside the ball (degrees), the page's scroll and its step, and the events of that frame. The last lines give the sums.
import fs from 'node:fs'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const visitors = arg('visitor', 'never,pack').split(',')
const seed = Number(arg('seed', 1))
const nth = Number(arg('nth', 1))
const before = Number(arg('before', 6))
const after = Number(arg('after', 40))
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const P = await load('/src/table/physics.ts')
const D = await load('/src/table/draw.ts')
const C = await load('/src/stage/camera.ts')
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { TIER_Y, TH, BALL, MID } = L

let mc = null
const step = P.Machine.prototype.step
P.Machine.prototype.step = function (l, r) {
  mc = this
  return step.call(this, l, r)
}
const HAND = 1500 / 240
const makeDriver = (name, s) => {
  if (name === 'never') return { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) }
  const d = { name: 'mouse', x: 960, y: 540, queue: [], left: false, right: false, goal: null }
  d.input = (v) => {
    if ((v.step + s - 1) % 4 === 0) {
      const h = v.turning ? null : v.page.hint()
      d.queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
      const seen = d.queue.length > 11 ? d.queue.shift() : null
      if (seen) { d.goal = seen; d.left = seen.left; d.right = seen.right }
    }
    if (d.goal) {
      const dx = d.goal.x - d.x
      const dy = d.goal.y - d.y
      const far = Math.hypot(dx, dy)
      if (far <= HAND) { d.x = d.goal.x; d.y = d.goal.y } else { d.x += (dx / far) * HAND; d.y += (dy / far) * HAND }
    }
    return { x: d.x, y: d.y, down: false, flipLeft: d.left, flipRight: d.right }
  }
  return d
}
const f1 = (n) => n.toFixed(1)
const f2 = (n) => n.toFixed(2)
const result = {}
for (const name of visitors) {
  mc = null
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  const rows = []
  let ev = []
  let takes = 0
  let take = -1
  let kick = -1
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(1)
    if (!mc) continue
    for (const e of mc.events) if (e.ball === 0 && (e.name === 'gate-take' || e.name === 'ball-save')) {
      ev.push(e.name)
      if (e.name === 'gate-take' && ++takes === nth) take = rows.length
      if (e.name === 'ball-save' && take >= 0 && kick < 0) kick = rows.length
    }
    if (stage.pageStep % 4 !== 0) continue
    const page = stage.page
    const b = mc.balls[0]
    const k = b.tier
    const pose = page.view() ?? C.homePose(page.scroll(), 0)
    const state = D.movingShapes(mc, [false, false, false], false).find((s) => s.id === `gate.${k}`)?.v ?? [0]
    const turn = state[1] ?? 0
    const all = D.WIRE.shut + turn
    const floor = pose.target[2]
    const pinY = (TIER_Y[k] + TH - D.WIRE.pin) * BALL
    const at = (y, z) => C.projectPage(pose, MID * BALL, y, floor + z)
    const top = at(pinY + D.WIRE.tall * Math.sin(all), D.WIRE.axle + D.WIRE.tall * Math.cos(all))
    const pin = at(pinY, D.WIRE.axle)
    const ball = C.projectPage(pose, b.x * BALL, b.y * BALL, floor + 0.5 * BALL)
    const gy = D.WIRE.tall * Math.sin(all) + pinY - b.y * BALL
    const gz = D.WIRE.axle + D.WIRE.tall * Math.cos(all) - 0.5 * BALL
    const low = Math.max(top.y, pin.y) + D.WIRE.thick * top.pxPerUnit
    rows.push({ t: stage.pageTime, k, mode: b.mode, turn, load: state[2] ?? 0, topY: top.y, pinY: pin.y, ballX: ball.x, ballY: ball.y, ballPx: BALL * ball.pxPerUnit, gap: Math.hypot(gy, gz) - 0.5 * BALL - D.WIRE.thick, under: 1080 - low, scroll: page.scroll(), ev: ev.join(' '), taken: mc.taken, low, arrow: ((stage.cursor.pose().lean + stage.cursor.pose().spin) * 180) / Math.PI, vy: b.vy, by: b.y })
    ev = []
    if (kick >= 0 && rows.length > kick + after + 1) break
  }
  if (take < 0 || kick < 0) { console.log(`${name} seed ${seed}: no save number ${nth}`); continue }
  const win = rows.slice(Math.max(0, take - before), kick + after + 1)
  console.log(`${name} seed ${seed}, save ${nth}, tier ${rows[take].k}: take in the frame at page ${f2(rows[take].t)} s, kick in the frame at ${f2(rows[kick].t)} s (${kick - take} frames of 60)`)
  console.log('  n   page s  taken  ball x  ball y   step x  step y  turn rad  wire y   pin y  lowest  under px   gap px  arrow deg  scroll  view step  events')
  win.forEach((r, i) => {
    const p = rows[rows.indexOf(r) - 1] ?? r
    console.log(`${String(i - Math.min(before, take)).padStart(4)} ${f2(r.t).padStart(7)} ${String(r.taken).padStart(5)} ${f1(r.ballX).padStart(7)} ${f1(r.ballY).padStart(7)} ${f1(r.ballX - p.ballX).padStart(8)} ${f1(r.ballY - p.ballY).padStart(7)} ${f2(r.turn).padStart(9)} ${f1(r.topY).padStart(7)} ${f1(r.pinY).padStart(7)} ${f1(r.low).padStart(7)} ${f1(r.under).padStart(9)} ${f2(r.gap).padStart(8)} ${f1(r.arrow).padStart(10)} ${f1(r.scroll).padStart(7)} ${f1(r.scroll - p.scroll).padStart(10)}  ${r.ev}`)
  })
  const held = rows.slice(take, kick)
  const on = held.filter((r) => r.taken > 0 && r.gap < 0.75)
  const rest = rows[take - 1].topY - rows[take - 1].pinY
  const rel = (r) => r.topY - r.pinY
  const deep = Math.max(...held.map(rel))
  const landed = on.length ? rel(on[0]) : rest
  const flung = rows.slice(kick, kick + after + 1)
  const high = Math.min(...flung.map(rel))
  const swings = []
  let side = 0
  let peak = 0
  for (const r of flung) {
    const d = rel(r) - rest
    const sg = Math.sign(d)
    if (sg !== 0 && sg !== side) { if (side !== 0) swings.push(peak); side = sg; peak = 0 }
    if (Math.abs(d) > Math.abs(peak)) peak = d
  }
  if (side !== 0 && Math.abs(peak) > 0.05) swings.push(peak)
  const sum = {
    ballPx: rows[take].ballPx,
    restAbovePin: rest,
    travelLoad: deep - rest,
    travelFromLanding: deep - landed,
    heldDeep: held.filter((r) => rel(r) > deep - 1).length,
    framesLoad: held.filter((r) => rel(r) > rest + 0.5).length,
    gap: [Math.min(...on.map((r) => r.gap)), Math.max(...on.map((r) => r.gap))],
    throwPx: deep - high,
    upPastRest: rest - high,
    swings,
    underAtRest: rows[take - 1].under,
    underLeast: Math.min(...held.map((r) => r.under)),
    ballLowest: Math.max(...held.map((r) => r.ballY + r.ballPx / 2))
  }
  const lying = held.filter((r) => r.taken > 0)
  sum.arrowTurn = lying.length ? Math.max(...lying.map((r) => r.arrow)) - Math.min(...lying.map((r) => r.arrow)) : 0
  sum.viewSteps = rows.slice(take - before, kick + after + 1).map((r) => r.scroll - rows[rows.indexOf(r) - 1].scroll)
  result[name] = { rows: win, sum }
  console.log(`  the ball is ${f1(sum.ballPx)} px wide on the screen. The top wire at rest lies ${f1(rest)} px from its pin (under 0 is up the screen).`)
  console.log(`  the load: the top wire goes ${f1(sum.travelLoad)} px down the screen from its rest place (${f1(sum.travelFromLanding)} px of it after the ball lies on it), over ${sum.framesLoad} frames off its rest place, ${sum.heldDeep} frames within 1 px of the deepest; gap of shell and wire ${f2(sum.gap[0])} to ${f2(sum.gap[1])} px`)
  console.log(`  the throw: ${f1(sum.throwPx)} px up the screen from the deepest, ${f1(sum.upPastRest)} px past the rest place; the swings after the kick about the rest place, px: ${swings.map(f1).join(', ')}`)
  console.log(`  the arrow inside turns ${f1(sum.arrowTurn)} degrees while the ball lies on the wire (taken > 0 to the kick)`)
  console.log(`  screen under the wire's lowest point: ${f1(sum.underAtRest)} px before the take, at least ${f1(sum.underLeast)} px in the hold; the ball's lower edge at its lowest is at y ${f1(sum.ballLowest)} of 1080`)
}
if (arg('json', '')) fs.writeFileSync(arg('json'), JSON.stringify(result))
await close()
