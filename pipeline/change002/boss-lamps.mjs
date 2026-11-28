// node pipeline/change002/boss-lamps.mjs [--every 0.25] [--out /tmp/lamps.json]
// Every film moment `every` seconds apart is posed, not drawn, and the emitters the parts gave off are counted: how many ask for a shadow, and their reach.
// Needs one line added to src/main.ts for the run only and never committed: ;(window as unknown as { __app: unknown }).__app = app
import fs from 'node:fs'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const every = Number(a.every ?? 0.25)
const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
const rows = []
try {
  for (const unit of plan.units) {
    const frames = []
    for (let f = unit.first; f <= unit.last; f += Math.round(every * plan.fps)) frames.push(f)
    const got = await session.page.evaluate((list) => {
      const app = window.__app
      return list.map((i) => {
        const m = app.filmMoment(i)
        const f = app.filmFrame(m.unit, m.time)
        app.put(f.frame, f.page, f.pose)
        const e = app.view.emitters()
        return { frame: i, unit: m.unit, time: Math.round(m.time * 1000) / 1000, page: f.frame.page, lamps: e.length, shadow: e.filter((x) => x.shadow === true).map((x) => Math.round(x.reach)) }
      })
    }, frames)
    rows.push(...got)
    const most = Math.max(0, ...got.map((r) => r.shadow.length))
    console.log(`${unit.id} frames ${unit.first} to ${unit.last}: most lamps ${Math.max(0, ...got.map((r) => r.lamps))}, most shadow lamps ${most}, moments with a shadow lamp ${got.filter((r) => r.shadow.length > 0).length} of ${got.length}`)
  }
} finally {
  await session.close()
}
fs.writeFileSync(String(a.out ?? '/tmp/lamps.json'), JSON.stringify(rows))
