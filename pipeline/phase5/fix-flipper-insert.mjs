// The ball over the left lamp window of the office tier after the visitor's first stroke: read from a run of fix-flipper-live.mjs kept with --json.
// node pipeline/phase5/fix-flipper-insert.mjs /tmp/live3long.json
import fs from 'node:fs'
const run = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const INSERT = [8.3, 7.1, 0.62]
const POST = [7.35, 7.45, 0.12]
const R = 0.5
const PULL = 29.4 / 240
const press = run.pressStep
console.log(`key at step ${press} of 240 a second; lamp window office.insert.1 at ${INSERT[0]}, ${INSERT[1]}, radius ${INSERT[2]} (no body in the machine); post office.sling.post.left.c at ${POST[0]}, ${POST[1]}, radius ${POST[2]}; the ball's radius ${R}`)
console.log('visitor step  step  speed   centre to window centre (rings overlap under 1.12)  ball edge to post edge  pushed other than by the slope  magnet (place, pull, reach) and the ball\'s distance to it  events')
let prev = null
let hits = []
let other = 0
for (const r of run.rows) {
  const dv = prev ? Math.hypot(r.vx - prev.vx, r.vy - prev.vy - PULL) : 0
  const k = (r.step - press) / 4
  if (prev && k >= 18 && k <= 40 && dv > 0.002) { hits.push(`step ${r.step} (visitor step +${k.toFixed(2)}): velocity (${prev.vx.toFixed(2)}, ${prev.vy.toFixed(2)}) ${Math.hypot(prev.vx, prev.vy).toFixed(2)} to (${r.vx.toFixed(2)}, ${r.vy.toFixed(2)}) ${Math.hypot(r.vx, r.vy).toFixed(2)}, spin ${prev.spin.toFixed(2)} to ${r.spin.toFixed(2)}, ball edge to the post's edge ${(Math.hypot(r.x - POST[0], r.v - POST[1]) - POST[2] - R).toFixed(3)}, events [${r.events.join(', ')}]`); other++ }
  if (k >= 20 && k <= 36 && Number.isInteger(k)) {
    const m = r.magnet
    const y0 = r.shot ? 0 : 0
    console.log(`+${String(k).padStart(2)}  ${r.step}  ${Math.hypot(r.vx, r.vy).toFixed(2).padStart(5)}  (${r.vx.toFixed(2)}, ${r.vy.toFixed(2)})  window ${Math.hypot(r.x - INSERT[0], r.v - INSERT[1]).toFixed(2)}  post ${(Math.hypot(r.x - POST[0], r.v - POST[1]) - POST[2] - R).toFixed(2)}  ${dv > 0.002 ? 'yes ' + dv.toFixed(2) : 'no'}  magnet ${m ? `${m[0]}, ${(m[1] - 26.5).toFixed(2)}, ${m[2]}, ${m[3]}; ball ${Math.hypot(r.x - m[0], r.v - (m[1] - 26.5)).toFixed(2)} away` : 'none'}  [${r.events.join(', ')}]`)
  }
  prev = r
}
console.log(`steps between visitor steps +18 and +40 in which the ball's velocity changed by anything but the slope's pull: ${other}`)
for (const h of hits) console.log('  ' + h)
