// node pipeline/change002/boss-dump.mjs --runs "32/32,32/31,32" --out /tmp/dump --body /tmp/dump_body.js
// What the scene holds at each moment of a film frame (a second of the boss unit, or `unit:second`), one session for each run, to find what a frame keeps from the frames drawn before it.
// Needs one line added to src/main.ts for the run only and never committed: ;(window as unknown as { __app: unknown }).__app = app
// Needs as well, for the run only, a call of window.__dump at each moment of the shutter in renderFilmFrame of src/app.ts.
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const out = String(a.out ?? '/tmp/dump')
const body = fs.readFileSync(String(a.body), 'utf8')
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
      await session.page.evaluate(`window.__dump = ${body}; window.__dumps = []`)
      const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
      const name = `run${i}-${j}-t${t.toFixed(1)}`
      fs.writeFileSync(path.join(out, `${name}.png`), png)
      const state = await session.page.evaluate(() => window.__dumps)
      fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(state, null, 1))
      console.log(`run ${i} second ${t} frame ${frame} ${name}`)
    }
  } finally {
    await session.close()
  }
}
