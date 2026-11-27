// The older turns of the live pinball view, with the nine steps round each: every frame after which the view turns round at more than 2 px a frame on both sides, in four visits stepped without a browser (the visitor who never moves seed 1, the hand that follows the hint seeds 3 and 4, the keen bot seed 1).
// node pipeline/phase5/polish-save2-turns.mjs
// Each line: the page's seconds, the view's scroll, its step, the ball, the room under a gate in px, the three gates (s shut, o open), the page's phase and the second its leaving move began.
const root = process.cwd()
const { logic } = await import(`${root}/tools/lib/logic.mjs`)
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { Machine } = await load('/src/table/physics.ts')
let mc = null
const step = Machine.prototype.step
Machine.prototype.step = function (l, r) { mc = this; return step.call(this, l, r) }
const HAND = 1500 / 240
const makeDriver = (name, s) => {
  if (name !== 'never' && name !== 'pack') return new BotDriver(name, s)
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
      const dx = d.goal.x - d.x, dy = d.goal.y - d.y, far = Math.hypot(dx, dy)
      if (far <= HAND) { d.x = d.goal.x; d.y = d.goal.y } else { d.x += (dx / far) * HAND; d.y += (dy / far) * HAND }
    }
    return { x: d.x, y: d.y, down: false, flipLeft: d.left, flipRight: d.right }
  }
  return d
}
for (const [name, seed] of [['never', 1], ['pack', 3], ['pack', 4], ['keen', 1]]) {
  mc = null
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  const rows = []
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(4)
    if (stage.entryIndex !== 0) break
    const st = stage.page.save()
    const b = mc ? mc.balls[0] : null
    rows.push({ t: stage.pageTime, y: stage.page.scroll(), ball: b ? `${b.mode}${b.mode === 'rail' ? ' ' + b.rail : b.mode === 'hold' ? ' ' + b.hold : b.mode === 'tow' ? ' to ' + b.then : ''} tier ${b.tier} y ${b.y.toFixed(2)}` : '', room: st.s.room ? st.s.room[0].toFixed(1) : '-', gates: mc ? mc.gate.map((g) => (g ? 'o' : 's')).join('') : '', phase: st.s.phase, out: st.s.out ? st.s.out[0] : '' })
  }
  for (let i = 2; i < rows.length - 1; i++) {
    const d = rows[i].y - rows[i - 1].y
    const c = rows[i + 1].y - rows[i].y
    if (!(Math.abs(d) > 2 && Math.abs(c) > 2 && c * d < 0)) continue
    console.log(`${name} seed ${seed}, turn after ${rows[i].t.toFixed(3)} s`)
    for (let j = i - 4; j <= i + 4; j++) console.log(`  ${rows[j].t.toFixed(3)}  scroll ${rows[j].y.toFixed(1)}  step ${(rows[j].y - rows[j - 1].y).toFixed(1)}  ${rows[j].ball}  room ${rows[j].room}  gates ${rows[j].gates}  ${rows[j].phase} out ${typeof rows[j].out === 'number' ? rows[j].out.toFixed(2) : rows[j].out}`)
  }
}
Machine.prototype.step = step
await close()
