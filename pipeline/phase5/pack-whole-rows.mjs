// node pipeline/phase5/pack-whole-rows.mjs RUN.json OUT.json: cuts from a run file written by pack-whole-walk.mjs the rows the tests of the pack hold:
// the rows of the save's run, the rows of the key press's run, and the numbers of the turn, the hit and the falls between the tiers.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { COL, handsOff, momentsOf, motionPlan } from '../../tools/lib/pack-site.mjs'

const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))
const m = run.moments
const plan = motionPlan(cfg, run)
const of = (what) => plan.items.filter((f) => f.moment === what)
const cut = (from, to) => Object.fromEntries(Array.from({ length: to - from + 1 }, (_, j) => [from + j, run.rows[from + j]]))
const save = of('save')[0].run
const type = of('type')[0].run
const hit = of('hit')[0].steps
const turn = of('turn')[0].run
let edge = m.turn.first
while (run.rows[edge][COL.page] === run.rows[m.turn.first][COL.page]) edge += 1
let pointer = edge
while (run.rows[pointer][COL.pointerX] === run.rows[pointer - 1][COL.pointerX] && run.rows[pointer][COL.pointerY] === run.rows[pointer - 1][COL.pointerY]) pointer += 1
const out = {
  steps: run.rows.length,
  format: run.format,
  turn: { ...m.turn, edge, pointerMovesAt: pointer, run: [turn[0], turn[turn.length - 1]] },
  hit: { at: m.hit, steps: [hit[0], hit[hit.length - 1]], handsOff: handsOff(run, hit) },
  type: { ...m.type, rows: cut(type[0] - 1, type[type.length - 1]) },
  gate: m.gate,
  save: { rows: cut(save[0], save[save.length - 1]) },
  falls: m.falls,
  reveal: m.reveal,
  stroke: m.stroke
}
fs.writeFileSync(process.argv[3], JSON.stringify(out) + '\n')
console.log(`${process.argv[3]}: ${fs.statSync(process.argv[3]).size} bytes; turn ${JSON.stringify(out.turn)}; hit ${JSON.stringify(out.hit)}; type ${m.type.press} to ${m.type.release}; gate ${JSON.stringify(m.gate)}; falls ${m.falls.length}`)
