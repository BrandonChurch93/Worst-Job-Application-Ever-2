// The six outlane rails and the view: where each rail lies against the next tier's line, and the view on every frame of a ride put on each of them by hand, with the tier's gate spent (the ball goes on down the chute or the drain) and with it shut (the ball is saved).
// node pipeline/phase5/polish-save2-lanes.mjs
// The visitor never moves. The ride is forced: on the first step the ball plays on the tier's floor with the gate in that state it is set on the rail (Machine.ride), so these are not rides a visit came to by itself. A jerk is a frame on which the view steps more than 2 px one way while it steps the other way on the frame before and on the frame after.
import { logic } from '../../tools/lib/logic.mjs'

const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { Machine, prepare } = await load('/src/table/physics.ts')
const { TIERS, TIER_Y, TH, railOf, tierAt } = await load('/src/table/layout.ts')
await prepare()
let mc = null
const step = Machine.prototype.step
Machine.prototype.step = function (l, r) {
  mc = this
  return step.call(this, l, r)
}
for (let k = 0; k < 3; k++) for (const side of ['left', 'right']) {
  const id = `outlane.${TIERS[k]}.${side}`
  const p = railOf(id).points
  const line = TIER_Y[k] + TH
  console.log(`${id}: the next tier's line is at ${line.toFixed(2)}, the rail's lowest point at ${p[1][1].toFixed(2)} (tier ${tierAt(p[1][1])}), its end at ${p[p.length - 1][1].toFixed(2)} (tier ${tierAt(p[p.length - 1][1])}): ${tierAt(p[1][1]) !== tierAt(p[p.length - 1][1]) ? 'the end comes back up over a tier line' : 'no tier line is crossed back'}`)
  for (const spent of [true, false]) {
    mc = null
    const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) }, seed: 1 })
    while (stage.entryIndex === 0 && stage.time < 60 && !(mc && mc.balls[0] && mc.balls[0].mode === 'plane' && mc.balls[0].tier === k && mc.gate[k] === spent && mc.taken < 0 && stage.pageStep % 4 === 0 && mc.balls[0].y - TIER_Y[k] > 3)) stage.advance(1)
    if (!mc || !mc.balls[0] || mc.balls[0].tier !== k || mc.balls[0].mode !== 'plane' || mc.gate[k] !== spent) { console.log(`  gate ${spent ? 'spent' : 'shut'}: no ball on the floor of tier ${k} in the visit`); continue }
    mc.ride(0, id)
    const at = stage.pageTime
    const rows = [{ y: stage.page.scroll(), on: id }]
    for (let f = 0; f < 70; f++) {
      stage.advance(4)
      const b = mc.balls[0]
      rows.push({ y: stage.page.scroll(), on: b.mode === 'rail' ? b.rail : mc.taken >= 0 ? 'on the gate' : b.mode })
    }
    const steps = rows.slice(1).map((r, i) => r.y - rows[i].y)
    const jerks = []
    for (let i = 1; i < steps.length - 1; i++) if (Math.abs(steps[i]) > 2 && steps[i - 1] * steps[i] < 0 && steps[i + 1] * steps[i] < 0) jerks.push(i + 1)
    const end = rows.findIndex((r) => r.on !== id)
    const turns = steps.filter((d, i) => i > 0 && steps[i - 1] * d < 0).length
    console.log(`  gate ${spent ? 'spent' : 'shut'}, set on the rail at page ${at.toFixed(2)} s: the ride ends on frame ${end} (${rows[end].on}); ${jerks.length} one-frame jerks${jerks.length ? ` (frame ${jerks.join(', ')})` : ''}; the view changes its way ${turns} times in 70 frames; the view's travel from the start at frame ${end - 1}, ${end + 6}, 69: ${(rows[end - 1].y - rows[0].y).toFixed(1)}, ${(rows[end + 6].y - rows[0].y).toFixed(1)}, ${(rows[69].y - rows[0].y).toFixed(1)} px`)
    console.log(`    steps on frames ${end - 4} to ${end + 4}: ${steps.slice(end - 5, end + 4).map((d) => d.toFixed(1)).join(', ')}`)
  }
}
Machine.prototype.step = step
await close()
