// The view while the ball rides an upper outlane rail to a gate that is still shut, on every frame of 60, stepped without a browser.
// node pipeline/phase5/polish-save2-shut.mjs
// Three cases. One: the visit of the hand that follows the page's hint a little late, seed 4, which loses the ball down the office's left outlane 22.63 s into the page with the office's gate shut; the frames from 22.60 s to 23.80 s. Two: a ride forced on the lobby's left outlane (Machine.ride) in the visit of the visitor who never moves, on the first step the ball plays on the lobby's floor with the gate shut. Three: a ride forced on the same rail in the same visit a given number of steps before the scene's clock opens the lobby's gate, so the gate opens under the ride: 60 steps before (the ball is on the rail's long leg when the gate opens) and 8 steps before (it is on the first leg). The forced rides are not rides a visit came to by itself.
// Each line: the frame, the page's seconds, the view's scroll, its step from the frame before, where the ball is, the gate.
import { logic } from '../../tools/lib/logic.mjs'

const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { Machine, prepare } = await load('/src/table/physics.ts')
await prepare()
let mc = null
const step = Machine.prototype.step
Machine.prototype.step = function (l, r) {
  mc = this
  return step.call(this, l, r)
}
const HAND = 1500 / 240
const hand = (s) => {
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
const still = { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) }
const visit = (driver, seed) => {
  mc = null
  return new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed })
}
const where = (k) => {
  const b = mc.balls[0]
  return `${b.mode === 'rail' ? b.rail : mc.taken >= 0 ? 'on the gate' : b.mode === 'hold' ? `held at ${b.hold}` : b.mode === 'tow' ? `towed to ${b.then}` : b.mode}, gate ${mc.gate[k] ? 'open' : 'shut'}`
}
const frames = (stage, k, count, from) => {
  let was = stage.page.scroll()
  let most = 0
  let down = 0
  const start = was
  for (let f = 1; f <= count; f++) {
    stage.advance(4)
    const y = stage.page.scroll()
    if (stage.pageTime >= from) {
      console.log(`  ${String(f).padStart(3)}  ${stage.pageTime.toFixed(3)} s  ${y.toFixed(1)}  ${(y - was).toFixed(1)}  ${where(k)}`)
      most = Math.max(most, Math.abs(y - was))
      down = Math.max(down, y - start)
    }
    was = y
  }
  console.log(`  the largest step ${most.toFixed(1)} px, the view's furthest place below its place on the first frame ${down.toFixed(1)} px`)
}

console.log('1. the hand, seed 4: the office\'s left outlane with the office\'s gate shut, 22.60 s to 23.80 s')
let stage = visit(hand(4), 4)
while (stage.entryIndex === 0 && stage.pageTime < 22.6 - 1.5 / 60) stage.advance(4)
frames(stage, 1, 73, 22.6 - 0.5 / 60)

console.log('2. forced: the lobby\'s left outlane with the lobby\'s gate shut, the visitor who never moves')
stage = visit(still, 1)
while (stage.entryIndex === 0 && stage.time < 60 && !(mc && mc.balls[0] && mc.balls[0].mode === 'plane' && mc.balls[0].tier === 0 && !mc.gate[0] && mc.taken < 0 && stage.pageStep % 4 === 0 && mc.balls[0].y - 15.25 > 3)) stage.advance(1)
console.log(`  set on the rail at page ${stage.pageTime.toFixed(3)} s`)
mc.ride(0, 'outlane.corporate.left')
frames(stage, 0, 72, 0)

stage = visit(still, 1)
let opens = 0
while (stage.entryIndex === 0 && stage.time < 60 && !(mc && mc.gate[0])) {
  stage.advance(1)
  opens++
}
for (const early of [60, 8]) {
  console.log(`2b. forced: the lobby's left outlane, set on the rail ${early} steps before the lobby's gate opens (step ${opens}), the visitor who never moves`)
  stage = visit(still, 1)
  for (let i = 0; i < opens - early; i++) stage.advance(1)
  while (stage.pageStep % 4 !== 0) stage.advance(1)
  const b = mc.balls[0]
  console.log(`  set on the rail at page ${stage.pageTime.toFixed(3)} s; the ball was ${b.mode === 'hold' ? `held at ${b.hold}` : b.mode}, gate ${mc.gate[0] ? 'open' : 'shut'}`)
  mc.ride(0, 'outlane.corporate.left')
  frames(stage, 0, Math.ceil(early / 4) + 36, 0)
}
Machine.prototype.step = step
await close()
