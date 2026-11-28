// node pipeline/change002/boss-same.mjs --runs "32/32,32/step1:5,31" --out /tmp/same [--format hd] [--tier draft]
// Film frames in separate sessions, one session for each run between the slashes, every frame kept as run<i>-<j>-t<second>.png.
// A time is a second of the boss unit, or `unit:second` for another unit of the film.
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const out = String(a.out ?? '/tmp/same')
fs.mkdirSync(out, { recursive: true })
const runs = String(a.runs ?? '32/32').split('/').map((r) => r.split(',').map((w) => {
  const [id, second] = w.includes(':') ? w.split(':') : ['boss', w]
  const unit = plan.units.find((u) => u.id === id)
  if (!unit) throw new Error(`no film unit ${id}`)
  return { unit, t: Number(second) }
}))
for (const [i, run] of runs.entries()) {
  const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
  try {
    for (const [j, { unit, t }] of run.entries()) {
      const frame = Math.min(unit.last, unit.first + Math.round(t * plan.fps))
      const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
      const file = path.join(out, `run${i}-${j}-t${t.toFixed(1)}.png`)
      fs.writeFileSync(file, png)
      console.log(`run ${i} ${unit.id} second ${t} frame ${frame} ${file}`)
    }
  } finally {
    await session.close()
  }
}
