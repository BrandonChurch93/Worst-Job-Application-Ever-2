// node pipeline/phase5/pack-frames-rows.mjs RUN.json OUT.json: cuts from a run file written by pack-whole-walk.mjs what the tests of the close sheets hold:
// the moments of the run, its hits and gags, every row the motion plan reads, the rows at the events of the scripted scene's sheet, the rows round every release on the page's keyboard,
// and the rows of the scripted scene of the machine page: from the step before the site gives the flippers to the film's first frames, round every gag and every hit of that page, and round the scene's save.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { CLOSE, COL, DROP, KEYS, SAVE, SCENE as SHOWN, VISITOR, keyBlock, momentsOf, motionPlan } from '../../tools/lib/pack-site.mjs'

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
// The sheet of the machine page's scripted scene takes its steps from the scene's events: the row of each, and the one before it, are kept.
for (const f of plan.items) if (f.moment === SHOWN.moment) for (const i of f.steps) for (const j of [i - 1, i]) read.add(j)
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
// The machine page plays its scene as a film on the live site (change note 002 item 8): the arrow stands sealed and the rows hold no ball, so the plan reads no row round the scene's events.
// Kept for the tests: the rows from the step before the flippers are given to SCENE.after steps after the film takes the page, and from SCENE.before steps before to SCENE.after after every gag and hit of the page and the scene's save.
const SCENE = { before: Math.max(DROP.before, CLOSE.before, SAVE.before), after: Math.max(DROP.after, CLOSE.after, SAVE.after) }
const s3 = run.pages.find((p) => p.unit === 'pinball')
if (s3) {
  const keep = (from, to) => {
    for (let j = Math.max(s3.first, from); j <= Math.min(s3.last, to); j++) read.add(j)
  }
  const sealed = run.moments.flippers
  if (sealed !== null) {
    let film = sealed
    while (film <= s3.last && run.rows[film][COL.control]) film += 1
    keep(sealed - 1, film + SCENE.after)
    // The scene's own save, which the scene does not mark as a hit: its step is the film's first step and the event's time in the scene.
    const scene = JSON.parse(fs.readFileSync(new URL('../../src/pages/step3/video/manifest.json', import.meta.url), 'utf8'))
    for (const e of scene.events) {
      if (!SAVE.names.includes(e.name)) continue
      const at = Math.round(film + (e.at / scene.stepHz) * VISITOR.hz)
      keep(at - SCENE.before, at + SCENE.after)
    }
  }
  for (const e of [...run.gags, ...run.hits]) if (e.step >= s3.first && e.step <= s3.last) keep(e.step - SCENE.before, e.step + SCENE.after)
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
