// The room under a gate on the live pinball page, stepped without a browser: every time the view's target begins its way down, whether a take followed, and how far the view went when none did.
// node pipeline/phase5/polish-gate-miss.mjs [--visitor never,pack] [--seeds 1,2,3,4]
import fs from 'node:fs'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const visitors = arg('visitor', 'never,pack').split(',')
const seeds = arg('seeds', '1,2,3,4').split(',').map(Number)
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
for (const name of visitors) for (const seed of seeds) {
  mc = null
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  let open = null
  const all = []
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(1)
    if (!mc) continue
    const kept = stage.page.save()
    const room = (kept.s ?? kept.state?.s ?? kept).room ?? 0
    const scroll = stage.page.scroll()
    const k = mc.balls[0].tier
    if (!open && room > 0) open = { t: stage.pageTime, k, from: scroll, far: 0, top: 0, take: false, steps: 0, same: true }
    if (open) {
      open.steps++
      open.top = Math.max(open.top, room)
      if (k !== open.k) open.same = false
      if (open.same) open.far = Math.max(open.far, scroll - open.from)
      if (mc.taken >= 0) open.take = true
      if (room === 0) { all.push(open); open = null }
    }
  }
  const miss = all.filter((o) => !o.take)
  console.log(`${name} seed ${seed}: the room began ${all.length} times, a take followed ${all.length - miss.length} times, none followed ${miss.length} times`)
  for (const o of miss) console.log(`  no take: page ${o.t.toFixed(2)} s, tier ${o.k}, ${(o.steps / 4).toFixed(1)} frames long, the target's share at most ${o.top.toFixed(2)}, the view went ${o.far.toFixed(1)} px down and came back${o.same ? '' : ' (the ball left the tier meanwhile)'}`)
}
await close()
