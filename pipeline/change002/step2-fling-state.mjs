// The fling of the rotary dial started from one and the same state of the arrow's body, to tell the fling's own path from what the arrow brings to it.
// node pipeline/change002/step2-fling-state.mjs take <repo> <file>          writes the springs of the arrow's body on the last step before the fling, in the film of that repo
// node pipeline/change002/step2-fling-state.mjs give <repo> <file> <label>  runs the film of that repo to the same step, sets those springs, and writes pipeline/change002/step2-fling-<label>.json for `step2-fling.mjs compare`
import fs from 'node:fs'
import path from 'node:path'

const [, , verb, repo, file, label] = process.argv
const here = path.dirname(new URL(import.meta.url).pathname)
const FLING = ['whip', 'snag', 'fly', 'skid']
const SPRINGS = ['squash', 'squashV', 'lean', 'leanV', 'spin', 'spinV', 'bend', 'bendV']
const { logic } = await import(path.join(repo, 'tools/lib/logic.mjs'))
const { load, close } = await logic()
const { stepHz } = await load('/src/config.ts')
const { pages } = await load('/src/pages/index.ts')
const { DIAL, scaleOf } = await load('/src/pages/step2/layout.ts')
const m = scaleOf ? scaleOf(0) : { k: 1, x: (v) => v, y: (v) => v, backAir: (v) => v }
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const film = () => new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
let first = 0
{
  const s = film()
  while (first < 40 * stepHz && !FLING.includes(s.page.save().dial.phase)) { s.advance(1); first++ }
}
const s = film()
s.advance(first - 1)
const body = s.cursor.s
if (verb === 'take') {
  const out = { step: first - 1, springs: Object.fromEntries(SPRINGS.map((k) => [k, body[k]])), feel: { ...body.feel } }
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n')
  console.log(JSON.stringify(out))
} else {
  const taken = JSON.parse(fs.readFileSync(file, 'utf8'))
  const was = Object.fromEntries(SPRINGS.map((k) => [k, body[k]]))
  for (const k of SPRINGS) body[k] = taken.springs[k]
  Object.assign(body.feel, taken.feel)
  const q = (v) => Math.round(v * 1e6) / 1e6
  const rows = []
  for (let i = 0; i < 10 * stepHz; i++) {
    s.advance(1)
    const d = s.page.save().dial
    if (!FLING.includes(d.phase)) break
    const p = s.cursor.pose()
    rows.push({ n: rows.length, phase: d.phase, wheel: q(d.a), x: q((p.x - m.x(DIAL.cx)) / m.k), y: q((p.y - m.y(DIAL.cy)) / m.k), z: q(m.backAir(p.z)), squash: q(p.squash), lean: q(p.lean), spin: q(p.spin), acting: p.acting, reaction: p.reaction, damage: p.damage.join('+'), scale: q(p.scale ?? 1) })
  }
  fs.writeFileSync(path.join(here, `step2-fling-${label}.json`), JSON.stringify({ stepHz, factor: m.k, centre: { x: m.x(DIAL.cx), y: m.y(DIAL.cy) }, runs: { film: rows } }, null, 1) + '\n')
  console.log(`step ${first - 1}: the springs were ${JSON.stringify(was)} and are set to ${JSON.stringify(taken.springs)}; ${rows.length} steps of the fling`)
}
await close()
