// node pipeline/change002/boss-same.mjs --runs "32/32,32/31,32" --out /tmp/same [--format hd] [--tier draft]
// Film frames of the boss unit in separate sessions, one session for each run between the slashes, every frame kept as run<i>-<j>-t<second>.png.
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const unit = plan.units.find((u) => u.id === 'boss')
const out = String(a.out ?? '/tmp/same')
fs.mkdirSync(out, { recursive: true })
const runs = String(a.runs ?? '32/32').split('/').map((r) => r.split(',').map(Number))
for (const [i, run] of runs.entries()) {
  const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
  try {
    for (const [j, t] of run.entries()) {
      const frame = Math.min(unit.last, unit.first + Math.round(t * plan.fps))
      const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
      const file = path.join(out, `run${i}-${j}-t${t.toFixed(1)}.png`)
      fs.writeFileSync(file, png)
      console.log(`run ${i} second ${t} frame ${frame} ${file}`)
    }
  } finally {
    await session.close()
  }
}
