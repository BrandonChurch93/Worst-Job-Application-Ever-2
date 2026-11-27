// The pack's own visitor at the port of step 3: walks the site once as tools/lib/pack-site.mjs does (or reads a kept walk), then draws every step
// from `before` steps before the ball leaves the port to `after` steps after, at two px to a px of the run, so one px is one px of the 1920 page.
// node pipeline/phase5/polish-port2-visitor.mjs --keep <folder> [--before 66] [--after 76]
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { COL, momentsOf, replay, walk } from '../../tools/lib/pack-site.mjs'

const a = args()
const keep = String(a.keep)
const cfg = config()
const say = (line) => console.log(`${new Date().toISOString().slice(11, 19)} ${line}`)
fs.mkdirSync(keep, { recursive: true })
const file = path.join(keep, 'site-run.json')
let run = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
if (!run) {
  run = await walk(cfg, say)
  fs.writeFileSync(file, JSON.stringify(run) + '\n')
}
const m = momentsOf(cfg, run).moments
say(`the walk has ${run.rows.length} steps; the flippers at step ${m.flippers}, the ball leaves at step ${m.leaves}`)
const steps = []
for (let i = m.leaves - Number(a.before ?? 66); i <= m.leaves + Number(a.after ?? 76); i++) steps.push(i)
const got = await replay(cfg, run, steps, { cache: path.join(keep, 'cache'), log: say, px: 2 })
const list = []
for (const i of steps) {
  const name = `step-${String(i).padStart(6, '0')}.png`
  fs.writeFileSync(path.join(keep, name), got.get(i))
  list.push({ step: i, time: run.rows[i][COL.time], scroll: run.rows[i][COL.scroll], arrow: [run.rows[i][COL.heroX], run.rows[i][COL.heroY]], file: name })
}
fs.writeFileSync(path.join(keep, 'steps.json'), JSON.stringify({ flippers: m.flippers, leaves: m.leaves, list }, null, 2) + '\n')
say(`kept ${list.length} pictures in ${keep}`)
