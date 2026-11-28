// node pipeline/change002/boss-talk.mjs --from 3.8 --to 28 --every 0.5 --out /tmp/talk [--tier draft] [--format preview]
// Film frames of the boss unit at seconds of the unit, one file each, with a list of the seconds and the film frames.
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const unit = plan.units.find((u) => u.id === 'boss')
const out = String(a.out ?? '/tmp/talk')
const every = Number(a.every ?? 0.5)
fs.mkdirSync(out, { recursive: true })
const list = []
for (let t = Number(a.from ?? 0); t <= Number(a.to ?? 10) + 1e-6; t += every) list.push({ second: Number(t.toFixed(3)), frame: Math.min(unit.last, unit.first + Math.round(t * plan.fps)) })
const session = await openSession({ format: String(a.format ?? 'preview'), assets: 'full' })
try {
  for (const k of list) {
    const png = await renderJob(session, { kind: 'film', frame: k.frame, tier: String(a.tier ?? 'draft') })
    k.file = path.join(out, `t${k.second.toFixed(1).padStart(5, '0')}.png`)
    fs.writeFileSync(k.file, png)
    console.log(`second ${k.second} frame ${k.frame}`)
  }
} finally {
  await session.close()
}
fs.writeFileSync(path.join(out, 'list.json'), JSON.stringify({ first: unit.first, last: unit.last, fps: plan.fps, frames: list }, null, 1))
