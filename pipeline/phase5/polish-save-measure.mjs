// Every save of the clear ball at a shut gate in simulated visits of the live pinball page, without a browser.
// node pipeline/phase5/polish-save-measure.mjs [--visitor pack,keen,never,clumsy,held,flap,stroke,wander] [--seeds 1,2] [--rows N]
// For each save: where the ball was on the step before the gate had it, how it came there, where it is thrown from, the jump in ball widths, the two bats' tips, and with --rows N the N steps that follow.
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const visitors = arg('visitor', 'pack,keen,never,clumsy').split(',')
const seeds = arg('seeds', '1,2').split(',').map(Number)
const after = Number(arg('rows', 0))
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const P = await load('/src/table/physics.ts')
const { Stage } = await load('/src/stage/stage.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { pages } = await load('/src/pages/index.ts')
const { TIER_Y, FLIP, FLIP_REACH, TH, BALL, table } = L
const D = await load('/src/table/draw.ts')
// The gap in px between the ball's shell and the top wire of the gate as it is drawn (the turn the picture is given), under 0 when the wire is inside the ball.
const gapOf = (m, k) => {
  const b = m.balls[0]
  const turn = D.WIRE.shut + (D.movingShapes(m, [false, false, false], false).find((s) => s.id === `gate.${k}`)?.v?.[1] ?? 0)
  const y = D.WIRE.tall * Math.sin(turn) + (TH - D.WIRE.pin - (b.y - TIER_Y[k])) * BALL
  const z = D.WIRE.axle + D.WIRE.tall * Math.cos(turn) - 0.5 * BALL
  return Math.hypot(y, z) - 0.5 * BALL - D.WIRE.thick
}
const DEG = Math.PI / 180

let mc = null
const step = P.Machine.prototype.step
P.Machine.prototype.step = function (l, r) {
  mc = this
  return step.call(this, l, r)
}
const HAND = 1500 / 240
const timed = (keys) => ({ name: 'bot', input: (v) => ({ x: 300, y: 900, down: false, ...keys(v.step) }) })
const makeDriver = (name, seed) => {
  const off = (seed - 1) * 37
  if (name === 'never') return timed(() => ({}))
  if (name === 'held') return timed(() => ({ flipLeft: true, flipRight: true }))
  if (name === 'flap') return timed((n) => ({ flipLeft: Math.floor((n + off) / 30) % 2 === 0, flipRight: Math.floor((n + off) / 30) % 2 === 0 }))
  if (name === 'stroke') return timed((n) => ({ flipLeft: (n + off) % 480 < 36, flipRight: (n + off) % 480 < 36 }))
  if (name === 'keen' || name === 'clumsy' || name === 'random' || name === 'skipper') return new BotDriver(name, seed)
  if (name === 'wander') {
    const bot = new BotDriver('random', seed)
    return { name: 'bot', input: (v) => { const p = bot.input(v); delete p.skip; return p } }
  }
  if (name === 'pack') {
    const d = { name: 'mouse', x: 960, y: 540, queue: [], left: false, right: false, goal: null }
    d.input = (v) => {
      if ((v.step + seed - 1) % 4 === 0) {
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
  throw new Error(`no visitor called ${name}`)
}
const f2 = (n) => n.toFixed(2)
const tips = (m, k) => table.flippers.filter((f) => f.tier === k).map((f) => {
  const a = m.flipperAngle(f.side) * DEG
  const dir = f.side === 'left' ? 1 : -1
  return [f.pivot[0] + dir * FLIP_REACH * Math.cos(a), f.pivot[1] + FLIP_REACH * Math.sin(a) - TIER_Y[k]]
})
const lines = []
const all = []
const gaps = []
const took = []
let worst = 0
let atSave = -9
for (const name of visitors) for (const seed of seeds) {
  mc = null
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  let last = -1
  let was = null
  const hist = []
  let tail = 0
  let saves = 0
  let from = null
  let jumpMost = 0
  let where = ''
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(1)
    if (!mc || mc.steps === last) continue
    last = mc.steps
    const b = mc.balls[0]
    const k = b.tier
    const row = { n: last, page: stage.time, mode: b.mode, what: b.mode === 'tow' ? b.then : b.mode === 'rail' ? b.rail : '', k, x: b.x, v: b.y - TIER_Y[k], vx: b.vx, vy: b.vy, tips: tips(mc, k), gap: mc.taken >= 0 ? gapOf(mc, k) : null, taken: mc.taken, ev: mc.events.filter((e) => e.name !== 'flipper').map((e) => `${e.name}:${e.id}`).join(' '), own: mc.own ? [...mc.own] : [0, 0] }
    hist.push(row)
    if (hist.length > 400) hist.shift()
    if (was && was.k === k && (was.mode === 'plane' || was.mode === 'tow') && (b.mode === 'plane' || b.mode === 'tow')) {
      const moved = Math.hypot(row.x - was.x, row.v - was.v)
      const may = Math.max(Math.hypot(was.vx, was.vy), Math.hypot(row.vx, row.vy)) / 240
      if (moved > may + 0.02 && moved - may > jumpMost) { jumpMost = moved - may; where = `${was.mode} ${was.what} (${f2(was.x)}, ${f2(was.v)}) to ${row.mode} ${row.what} (${f2(row.x)}, ${f2(row.v)}) at page ${f2(row.page)} s` }
    }
    if (was && (from || mc.events.some((e) => e.name === 'ball-save' && e.ball === 0))) {
      const moved = Math.hypot(row.x - was.x, row.v - was.v)
      const may = Math.max(Math.hypot(was.vx, was.vy), Math.hypot(row.vx, row.vy)) / 240
      atSave = Math.max(atSave, moved - may)
    }
    const take = mc.events.find((e) => e.name === 'gate-take' && e.ball === 0)
    const save = mc.events.find((e) => e.name === 'ball-save' && e.ball === 0)
    if (take) from = row
    if (save) {
      saves++
      const p = was
      const start = hist.slice().reverse().find((r) => r.mode === 'plane' && r !== row) ?? p
      const way = p.mode === 'rail' ? p.what : p.mode === 'tow' ? 'the mouth' : 'the floor'
      const jump = Math.hypot(row.x - p.x, row.v - p.v)
      all.push({ name, seed, way, jump })
      lines.push(`${name} seed ${seed} page ${f2(row.page)} s tier ${k}  by ${way}`)
      lines.push(`    last step on the floor: (${f2(start.x)}, ${f2(start.v)}) at ${f2(Math.hypot(start.vx, start.vy))} balls/s`)
      lines.push(`    the step before the save: ${p.mode} (${f2(p.x)}, ${f2(p.v)}) v (${f2(p.vx)}, ${f2(p.vy)})`)
      lines.push(`    the save's step: ${row.mode} (${f2(row.x)}, ${f2(row.v)}) v (${f2(row.vx)}, ${f2(row.vy)})  moved ${f2(jump)} balls in one step, its speed allows ${f2(Math.max(Math.hypot(p.vx, p.vy), Math.hypot(row.vx, row.vy)) / 240)}`)
      lines.push(`    tips: left (${f2(row.tips[0][0])}, ${f2(row.tips[0][1])}) right (${f2(row.tips[1][0])}, ${f2(row.tips[1][1])}), the ball's shell is ${f2(Math.hypot(row.x - row.tips[0][0], row.v - row.tips[0][1]) - 0.5 - FLIP.tip)} and ${f2(Math.hypot(row.x - row.tips[1][0], row.v - row.tips[1][1]) - 0.5 - FLIP.tip)} balls from them; the machine's own bat: ${row.own.some((n) => n > 0) ? (row.own[0] > 0 ? 'left' : 'right') : 'none'}`)
      if (from) {
        const held = hist.filter((r) => r.n >= from.n && r !== row)
        const on = held.filter((r) => r.gap !== null && r.gap < 0.75)
        const lies = held.filter((r) => r.taken > 0)
        const still = held.filter((r) => Math.hypot(r.vx, r.vy) < 0.5)
        lines.push(`    taken at (${f2(from.x)}, ${f2(from.v)}) v (${f2(from.vx)}, ${f2(from.vy)}), ${held.length} steps before the kick, ${on.length} of them with the wire on the shell (gap ${f2(Math.min(...on.map((r) => r.gap)))} to ${f2(Math.max(...on.map((r) => r.gap)))} px), ${still.length} under 0.5 balls/s, deepest ${f2(Math.max(...held.map((r) => r.v)))}`)
        gaps.push(...lies.map((r) => r.gap))
        took.push(held.length)
        if (after) for (const r of held.filter((_, n) => n % 4 === 0)) lines.push(`      -${row.n - r.n} ${r.mode.padEnd(5)} (${f2(r.x)}, ${f2(r.v)}) v (${f2(r.vx)}, ${f2(r.vy)}) gap ${f2(r.gap ?? 99)} px`)
      }
      from = null
      tail = after
    } else if (tail > 0) {
      tail--
      const d = row.tips.map((t) => Math.hypot(row.x - t[0], row.v - t[1]) - 0.5 - FLIP.tip)
      lines.push(`      +${after - tail} ${row.mode.padEnd(5)} (${f2(row.x)}, ${f2(row.v)}) v (${f2(row.vx)}, ${f2(row.vy)}) tips at ${f2(d[0])} ${f2(d[1])} flip ${f2(mc.flip[0])} ${f2(mc.flip[1])} ${row.ev}`)
    }
    was = row
  }
  worst = Math.max(worst, jumpMost)
  lines.push(`${name} seed ${seed}: ${saves} saves, the largest move beyond the ball's own speed in one step ${f2(jumpMost)} balls${where ? ` (${where})` : ''}, scene left at page ${f2(stage.time)} s`)
}
const by = {}
for (const s of all) by[s.way] = (by[s.way] ?? 0) + 1
lines.push(`saves by the way in: ${Object.entries(by).map(([k, n]) => `${k} ${n}`).join(', ')}; the jump at a save: ${f2(Math.min(...all.map((s) => s.jump)))} to ${f2(Math.max(...all.map((s) => s.jump)))} balls`)
if (gaps.length) lines.push(`from the ball's landing on the wire to the kick, over ${took.length} saves: the gap of shell and drawn wire ${f2(Math.min(...gaps))} to ${f2(Math.max(...gaps))} px; steps from the take to the kick ${Math.min(...took)} to ${Math.max(...took)}; in the steps of a save, from the take to the kick's own step, the ball's largest move in one step less what its speed allows ${atSave.toFixed(4)} balls (0 or under: never more than its speed); in the whole of the visits ${f2(worst)} balls`)
console.log(lines.join('\n'))
await close()
