// node pipeline/phase5/pack-frames-sheets.mjs RUN.json OUT_DIR MOMENT [MOMENT ...]: builds only the motion pack's sheets of the moments named from a recorded run,
// to look at a sheet without building the whole pack. The pictures of the run are kept in OUT_DIR/cache.
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../../tools/lib/paths.mjs'
import { buildSite, momentsOf, motionPlan } from '../../tools/lib/pack-site.mjs'

const [file, out, ...moments] = process.argv.slice(2)
const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(file, 'utf8')))
const plan = motionPlan(cfg, run)
const seen = {}
const files = plan.items.filter((f) => moments.includes(f.moment)).map((f) => {
  seen[f.moment] = (seen[f.moment] || 0) + 1
  return { ...f, name: `${f.moment}-${seen[f.moment]}.png` }
})
fs.mkdirSync(out, { recursive: true })
const built = new Map()
const about = new Map()
await buildSite({ cfg, session: null, files, built, about, log: (l) => console.log(l), cache: path.join(out, 'cache'), facts: run, whole: files })
for (const [name, png] of built) fs.writeFileSync(path.join(out, name), png)
fs.writeFileSync(path.join(out, 'about.json'), JSON.stringify(Object.fromEntries(about), null, 1) + '\n')
console.log(`sheets: ${built.size} written to ${out}`)
