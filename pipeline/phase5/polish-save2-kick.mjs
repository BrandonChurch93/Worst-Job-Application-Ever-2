// The kick of the gate's save for five ways into the gate on both tiers, stepped without a browser: the steps of the take and of the kick, the ball's state on the kick's step, and a hash of all of it with the 40 steps after the kick.
// node pipeline/phase5/polish-save2-kick.mjs   (run on two commits, the last line must be equal; tests/polish-save2.test.ts holds it)
import { createHash } from 'node:crypto'
import { logic } from '../../tools/lib/logic.mjs'

const { load, close } = await logic()
const { TIER_Y } = await load('/src/table/layout.ts')
const P = await load('/src/table/physics.ts')
await P.prepare()
const ways = [{ x: 10.1, vx: 0, vy: 4 }, { x: 9.8, vx: 1.3, vy: 6 }, { x: 10.2, vx: -3, vy: 5 }, { x: 9.85, vx: 6, vy: 24 }, { x: 10, vx: 0, vy: 0.5 }]
const all = []
for (const k of [0, 1]) for (const w of ways) {
  const m = new P.Machine()
  m.live = true
  m.gate = [false, false, false]
  m.toPlane(0, w.x, TIER_Y[k] + 10.2, w.vx, w.vy)
  let take = -1
  let kick = -1
  const after = []
  for (let n = 1; n < 700 && (kick < 0 || n <= kick + 40); n++) {
    const names = m.step(false, false).filter((e) => e.ball === 0).map((e) => e.name)
    const b = m.balls[0]
    if (take < 0 && names.includes('gate-take')) take = n
    if (kick < 0 && names.includes('ball-save')) kick = n
    if (kick >= 0) after.push([b.x, b.y, b.vx, b.vy])
  }
  all.push([take, kick, after])
  console.log(`tier ${k}, way ${JSON.stringify(w)}: take on step ${take}, kick on step ${kick} (${kick - take} steps), the ball at the kick ${after[0].map((v) => v.toFixed(6)).join(', ')}`)
  m.free()
}
console.log(createHash('sha256').update(JSON.stringify(all)).digest('hex'))
await close()
