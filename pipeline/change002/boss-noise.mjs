// node pipeline/change002/boss-noise.mjs --at 32 --out /tmp/noise --tries /tmp/tries.js
// One session: the same film frame of the boss unit drawn twice under each trial, to find which drawn thing is not the same from one drawing to the next.
// Needs one line added to src/main.ts for the run only and never committed: ;(window as unknown as { __app: unknown }).__app = app
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const unit = plan.units.find((u) => u.id === 'boss')
const out = String(a.out ?? '/tmp/noise')
fs.mkdirSync(out, { recursive: true })
const tries = fs.readFileSync(String(a.tries), 'utf8')
const frame = Math.min(unit.last, unit.first + Math.round(Number(a.at ?? 32) * plan.fps))
const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
try {
  const names = await session.page.evaluate(`window.__tries = (${tries}); Object.keys(window.__tries)`)
  await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
  for (const name of names) {
    await session.page.evaluate((n) => window.__tries[n](window.__app), name)
    for (const k of [0, 1]) {
      const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
      fs.writeFileSync(path.join(out, `${name}-${k}.png`), png)
    }
    console.log(`trial ${name} drawn`)
  }
} finally {
  await session.close()
}
