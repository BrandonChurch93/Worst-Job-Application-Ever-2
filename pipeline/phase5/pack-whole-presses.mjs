// node pipeline/phase5/pack-whole-presses.mjs RUN.json: for every press of a flipper by the pack's visitor in the machine, where the ball is over that bat on the step of the press,
// how far that is from the bat's reach, how many steps the page had wanted the press for, and whether a blow follows while the bat rises.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { COL, MACHINE, momentsOf, overBat, reachGap } from '../../tools/lib/pack-site.mjs'

const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))
const rows = run.rows
const s3 = run.pages.find((p) => p.unit === 'pinball')
const m = run.moments
const out = []
for (let i = s3.first + 1; i <= s3.last; i++) {
  for (const [side, col] of [['left', COL.left], ['right', COL.right]]) {
    if (!(rows[i][col] && !rows[i - 1][col])) continue
    const o = overBat(cfg, rows[i], side)
    let wanted = 0
    while (i - wanted - 1 > s3.first && inWant(overBat(cfg, rows[i - wanted - 1], side))) wanted += 1
    let held = 0
    while (rows[i + held] && rows[i + held][col]) held += 1
    const stroke = m.blows.find((x) => x.press === i && x.side === side)
    out.push({ step: i, side, along: r2(o.along), above: r2(o.above), fromReach: r2(reachGap(cfg, o)), wantedFor: wanted, held, meets: stroke ? `step ${stroke.step}, kick ${stroke.kick} px a step` : 'no' })
  }
}
function inWant(o) {
  return o.along > MACHINE.wantFrom && o.along < cfg.table.flipperBalls + 0.3 && o.above > 0 && o.above < MACHINE.radius + 0.5 + 0.3
}
function r2(n) {
  return Math.round(n * 100) / 100
}
console.log(`presses of a flipper by the visitor in the machine: ${out.length}; within the bat's reach on the step of the press: ${out.filter((x) => x.fromReach === 0).length}; with a blow of the bat on the ball: ${out.filter((x) => x.meets !== 'no').length}, of which hard enough to be shown (MEETS.share of the hardest): ${m.strokes.length}`)
for (const x of out) console.log(JSON.stringify(x))
console.log(`saves: ${JSON.stringify(m.saves)}; shown ${JSON.stringify(m.save)}; strokes ${JSON.stringify(m.strokes)}; shown ${JSON.stringify(m.stroke)}`)
