// The fling of the rotary dial, step by step, relative to the dial: where the arrow is and how it is posed.
// node pipeline/change002/step2-fling.mjs record <label>   writes pipeline/change002/step2-fling-<label>.json
// node pipeline/change002/step2-fling.mjs compare <a> <b>   prints the largest difference of every number
import fs from 'node:fs'
import path from 'node:path'
import { logic } from '../../tools/lib/logic.mjs'

const here = path.dirname(new URL(import.meta.url).pathname)
const file = (label) => path.join(here, `step2-fling-${label}.json`)
const [, , verb, a, b] = process.argv
const FLING = ['whip', 'snag', 'fly', 'skid']

if (verb === 'record') {
  const { load, close } = await logic()
  const { stepHz, config } = await load('/src/config.ts')
  const { pages } = await load('/src/pages/index.ts')
  const { DIAL } = await load('/src/pages/step2/layout.ts')
  const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
  const follow = { name: 'bot', input: (v) => { const h = v.page.hint(); return h ? { x: h.dodge ? h.dodge.x : h.x, y: h.dodge ? h.dodge.y : h.y, down: h.down, ...(h.key !== undefined ? { key: h.key } : {}) } : { x: 300, y: 900, down: false } } }
  const runs = { film: new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }), live: new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: follow, seed: config.seed }) }
  const out = { stepHz, dial: { r: DIAL.r, ring: DIAL.ring, hole: DIAL.hole }, runs: {} }
  for (const [name, s] of Object.entries(runs)) {
    const rows = []
    let seen = false
    for (let i = 0; i < 40 * stepHz && s.page.id === 'step2'; i++) {
      s.advance(1)
      const d = s.page.save().dial
      const on = FLING.includes(d.phase)
      if (!on && seen) break
      if (!on) continue
      seen = true
      const p = s.cursor.pose()
      const q = (v) => Math.round(v * 1e6) / 1e6
      rows.push({ n: rows.length, phase: d.phase, wheel: q(d.a), x: q(p.x - DIAL.cx), y: q(p.y - DIAL.cy), z: q(p.z), squash: q(p.squash), lean: q(p.lean), spin: q(p.spin), acting: p.acting, reaction: p.reaction, damage: p.damage.join('+'), scale: q(p.scale) })
    }
    out.runs[name] = rows
  }
  fs.writeFileSync(file(a), JSON.stringify(out, null, 1) + '\n')
  for (const [name, rows] of Object.entries(out.runs)) console.log(name, rows.length, 'steps of the fling', JSON.stringify(rows[0]), JSON.stringify(rows.at(-1)))
  await close()
} else if (verb === 'compare') {
  const A = JSON.parse(fs.readFileSync(file(a), 'utf8'))
  const B = JSON.parse(fs.readFileSync(file(b), 'utf8'))
  const LIMIT = 0.001
  let bad = 0
  for (const name of Object.keys(A.runs)) {
    const ra = A.runs[name]
    const rb = B.runs[name]
    const most = {}
    let words = 0
    for (let i = 0; i < Math.max(ra.length, rb.length); i++) {
      const x = ra[i]
      const y = rb[i]
      if (!x || !y) continue
      for (const k of Object.keys(x)) {
        if (typeof x[k] === 'number') most[k] = Math.max(most[k] ?? 0, Math.abs(x[k] - y[k]))
        else if (x[k] !== y[k]) words++
      }
    }
    const worst = Math.max(...Object.values(most))
    if (ra.length !== rb.length || worst > LIMIT || words > 0) bad++
    console.log(`${name}: steps ${ra.length} and ${rb.length}; largest difference ${JSON.stringify(most)}; words that differ ${words}`)
  }
  console.log(`limit ${LIMIT} page px and radians on every step: ${bad === 0 ? 'the fling is the same' : 'the fling differs'}`)
  process.exit(bad === 0 ? 0 : 1)
} else {
  console.log('record <label> | compare <a> <b>')
}
