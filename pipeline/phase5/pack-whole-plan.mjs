// Prints the plan of R4's and R5's packs for a run file written by pack-whole-walk.mjs: the sets, each file's heading, and the facts the headings stand on.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { momentsOf, motionPlan, saveWindow, windowHolds, tierSheet } from '../../tools/lib/pack-site.mjs'
import { splitGroups } from '../../tools/lib/pack-plan.mjs'

const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))
const m = run.moments
console.log(JSON.stringify({ steps: run.rows.length, turn: m.turn, type: m.type, hit: m.hit, saves: m.saves, gate: m.gate, stroke: m.stroke, strokes: m.strokes, falls: m.falls }))
const plan = motionPlan(cfg, run)
console.log(`leftOut ${JSON.stringify(plan.leftOut)} limitTook ${JSON.stringify(plan.limitTook)}`)
for (const [i, s] of splitGroups(plan.groups, cfg.critics.maxFilesPerMessage).entries()) {
  console.log(`set ${i + 1}: ${s.groups.join(', ')}, ${s.items.length} files`)
  for (const f of s.items) console.log(`  [${f.moment}] ${f.steps[0]}..${f.steps[f.steps.length - 1]} (${f.heading.length} chars) ${f.heading}${f.hands ? `\n      marks: ${f.hands.map((h) => h || '.').join(' ')}` : ''}`)
}
const save = plan.items.find((f) => f.moment === 'save')
if (save) {
  const win = saveWindow(cfg, run, save.run)
  console.log(`save window ${JSON.stringify(win)}; holds the gate and both bats in ${save.run.filter((i) => windowHolds(cfg, run, win, i)).length} of ${save.run.length} frames`)
}
const t = tierSheet(cfg, run)
if (t) console.log(`tiers: ${t.steps.join(' ')}\n  (${t.heading.length} chars) ${t.heading}`)
