// node pipeline/change002/pinball-run.mjs [--from S] [--to S] [--all] [--trace]: replays the film's run of step 3 with the kept take and prints the events of the scene with their seconds, and the strikes a second. --trace prints where the clear ball is every 4 steps.
import { args, config } from '../../tools/lib/paths.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const a = args()
const c = config()
const hz = c.sim.stepHz
const unitSeconds = c.film.units.find((u) => u.id === 'pinball').seconds
const { load, close } = await logic()
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
let fastest = 0
while (!stage.finished && stage.time < unitSeconds + 1) {
  stage.advance(4)
  if (stage.page.id !== 'step3') continue
  const b = stage.page.save().m.balls[0]
  if (b && b.mode === 'plane') fastest = Math.max(fastest, Math.hypot(b.vx, b.vy))
  if (a.trace && b && stage.time >= Number(a.from ?? 0) && stage.time < Number(a.to ?? 1e9)) console.log(`${stage.time.toFixed(3)} ${b.mode} tier ${b.tier} at ${b.x.toFixed(2)} ${(b.y - 15.25 - 11.25 * b.tier).toFixed(2)} going ${b.vx.toFixed(1)} ${b.vy.toFixed(1)}`)
}
const from = Number(a.from ?? 0)
const to = Number(a.to ?? 1e9)
const seen = stage.events.map((e) => ({ t: e.step / hz, name: e.name })).filter((e) => e.t >= from && e.t < to)
const strikes = seen.filter((e) => e.name.startsWith('strike:'))
const per = {}
for (const e of strikes) per[Math.floor(e.t)] = (per[Math.floor(e.t)] ?? 0) + 1
if (a.all) for (const e of seen) console.log(`${e.t.toFixed(3)}  ${e.name}`)
else for (const e of seen) if (!e.name.startsWith('strike:') && e.name !== 'loot' && e.name !== 'flasher' && e.name !== 'flipper') console.log(`${e.t.toFixed(3)}  ${e.name}`)
console.log(`strikes in each second: ${Object.entries(per).map(([k, v]) => `${k}:${v}`).join(' ')}`)
console.log(`strikes in all: ${strikes.length}; hard 3: ${strikes.filter((e) => e.name.endsWith(':3')).length}; fastest the clear ball went on a floor: ${fastest.toFixed(1)} balls a second; finished: ${stage.finished}`)
for (const b of c.film.beats.filter((x) => x.unit === 'pinball' && x.event)) {
  const at = stage.events.filter((e) => e.name === b.event).map((e) => e.step / hz)
  console.log(`${at.length > 0 && at.every((t) => t >= b.from && t <= b.to) ? 'inside ' : 'OUTSIDE'} ${b.id} ${b.event} ${at.map((t) => t.toFixed(2)).join(' ')} (beat ${b.from} to ${b.to})`)
}
await close()
