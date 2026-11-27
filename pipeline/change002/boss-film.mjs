// node pipeline/change002/boss-film.mjs [--every 1]
// The film's step 4 played without rendering: every event of the fight with its second of the unit, the beat that should hold it, and the boss's health each second.
import { args } from '../../tools/lib/paths.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const a = args()
const every = Number(a.every ?? 0.5)
const { load, close } = await logic()
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { config, stepHz } = await load('/src/config.ts')
const beats = config.film.beats.filter((b) => b.unit === 'boss')
const stage = new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const end = Math.max(...beats.map((b) => b.to))
const quiet = new Set(['dart-fire', 'dart-hit', 'shot-round', 'shield-glance', 'step'])
let seen = 0
let tally = {}
for (let t = 0; t < end; t += every) {
  stage.advance(Math.round(every * stepHz))
  if (stage.page.id !== 'step4') break
  const f = stage.page.save().fight
  for (const e of stage.events.slice(seen)) {
    if (quiet.has(e.name)) tally[e.name] = (tally[e.name] ?? 0) + 1
    else console.log(`  ${(e.step / stepHz).toFixed(2).padStart(6)}  ${e.name}${e.hitsCursor ? ' (on the arrow)' : ''}`)
  }
  seen = stage.events.length
  const beat = beats.find((b) => stage.time >= b.from && stage.time < b.to)
  let open = ''
  if (f) {
    const b = Math.atan2(stage.cursor.y + 32 - f.y, stage.cursor.x + 18 - f.x)
    const off = Math.abs(Math.atan2(Math.sin(b - f.face), Math.cos(b - f.face)))
    open = `arrow ${stage.cursor.x.toFixed(0)},${stage.cursor.y.toFixed(0)} is ${off.toFixed(2)} rad off the shield's middle and ${Math.hypot(stage.cursor.x + 18 - f.x, stage.cursor.y + 32 - f.y).toFixed(0)} px from the boss`
  }
  console.log(`${stage.time.toFixed(2).padStart(5)} s  ${String(stage.page.gag()).padEnd(14)} ${f ? `health ${f.health.toFixed(1)} flat ${Math.max(0, f.flat).toFixed(2)} boss ${f.x.toFixed(0)},${f.y.toFixed(0)} ${open}` : ''}  ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  tally = {}
}
for (const b of beats) {
  const e = b.event ? stage.events.filter((x) => x.name === b.event).map((x) => (x.step / stepHz).toFixed(2)) : []
  console.log(`beat ${b.id.padEnd(16)} ${b.from} to ${b.to}  ${b.event ?? ''} at ${e.join(', ') || 'never'}`)
}
await close()
