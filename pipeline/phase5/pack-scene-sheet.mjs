// node pipeline/phase5/pack-scene-sheet.mjs RUN.json OUT_DIR [STEP ...]: builds from a recorded run the motion pack's sheet of the machine page's scripted scene, and keeps beside it
// the visit's own picture of each step named, drawn in the same second visit, to see what the visit's picture holds while the film plays. The pictures are kept in OUT_DIR/cache.
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../../tools/lib/paths.mjs'
import { SCENE, buildSite, momentsOf, motionPlan, replay } from '../../tools/lib/pack-site.mjs'

const [file, out, ...steps] = process.argv.slice(2)
const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(file, 'utf8')))
const plan = motionPlan(cfg, run)
const files = plan.items.filter((f) => f.moment === SCENE.moment).map((f, n) => ({ ...f, name: `${SCENE.moment}-${n + 1}.png` }))
if (!files.length) throw new Error('the run holds no scripted scene: no sheet')
const beside = { kind: 'site-run-sheet', steps: steps.map(Number) }
const whole = steps.length ? [...files, beside] : files
const cache = path.join(out, 'cache')
fs.mkdirSync(out, { recursive: true })
const built = new Map()
const about = new Map()
await buildSite({ cfg, session: null, files, built, about, log: (l) => console.log(l), cache, facts: run, whole })
for (const [name, png] of built) fs.writeFileSync(path.join(out, name), png)
fs.writeFileSync(path.join(out, 'about.json'), JSON.stringify(Object.fromEntries(about), null, 1) + '\n')
if (steps.length) {
  const got = await replay(cfg, run, beside.steps, { plan: whole.flatMap((f) => (f.film ? f.steps.filter((_, n) => f.film[n] === null) : f.steps)), cache, log: (l) => console.log(l) })
  for (const [i, png] of got) fs.writeFileSync(path.join(out, `visit-${String(i).padStart(6, '0')}.png`), png)
  console.log(`visit: ${got.size} pictures of the visit's own`)
}
for (const f of files) console.log(`${f.name}: steps ${f.steps.join(' ')}; film ${f.film.join(' ')}`)
console.log(`sheets: ${built.size} written to ${out}`)
