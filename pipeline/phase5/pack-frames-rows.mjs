// node pipeline/phase5/pack-frames-rows.mjs RUN.json OUT.json: cuts from a run file written by pack-whole-walk.mjs what the tests of the close sheets hold:
// the moments of the run, its hits and gags, every row the motion plan reads, and the rows round every release on the page's keyboard.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { COL, KEYS, keyBlock, momentsOf, motionPlan } from '../../tools/lib/pack-site.mjs'

const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))
const read = new Set()
const rows = new Proxy(run.rows, {
  get(target, key) {
    if (typeof key === 'string' && /^\d+$/.test(key)) read.add(Number(key))
    return target[key]
  }
})
const plan = motionPlan(cfg, { ...run, rows })
// Every release of the mouse button over the key block of step 1, with the rows from the step before it to KEYS.rest steps after.
const block = keyBlock(cfg)
const s1 = run.pages.find((p) => p.page === 'step1')
const releases = []
for (let i = s1.first + 1; i <= s1.last; i++) {
  const r = run.rows[i - 1]
  const y = r[COL.pointerY] + r[COL.scroll]
  if (!(r[COL.down] && !run.rows[i][COL.down] && r[COL.pointerX] >= block.x && r[COL.pointerX] <= block.x + block.w && y >= block.y && y <= block.y + block.h)) continue
  releases.push(i)
  for (let j = i - 1; j <= i + KEYS.rest; j++) read.add(j)
}
const out = {
  steps: run.rows.length,
  format: run.format,
  moments: run.moments,
  hits: run.hits,
  gags: run.gags,
  releases,
  sheets: plan.items.length,
  rows: Object.fromEntries([...read].sort((a, b) => a - b).map((i) => [i, run.rows[i]]))
}
fs.writeFileSync(process.argv[3], JSON.stringify(out) + '\n')
console.log(`${process.argv[3]}: ${fs.statSync(process.argv[3]).size} bytes; ${read.size} rows of ${run.rows.length}; ${plan.items.length} sheets; ${releases.length} releases on the keyboard`)
