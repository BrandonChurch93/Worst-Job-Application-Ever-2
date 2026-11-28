// The fling of the rotary dial, step by step, relative to the dial: where the arrow is and how it is posed.
// node pipeline/change002/step2-fling.mjs record <label>   writes pipeline/change002/step2-fling-<label>.json
// node pipeline/change002/step2-fling.mjs compare <a> <b>   prints the largest difference of every number
// x and y are from the dial's centre on the page, divided by the factor the dial is drawn at; z is the arrow's height taken back through the stage's height map; pageZ is its height on the page.
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
  const { DIAL, scaleOf } = await load('/src/pages/step2/layout.ts')
  const m = scaleOf ? scaleOf(0) : { k: 1, x: (v) => v, y: (v) => v, backAir: (v) => v }
  const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
  const follow = { name: 'bot', input: (v) => { const h = v.page.hint(); return h ? { x: h.dodge ? h.dodge.x : h.x, y: h.dodge ? h.dodge.y : h.y, down: h.down, ...(h.key !== undefined ? { key: h.key } : {}) } : { x: 300, y: 900, down: false } } }
  const runs = { film: new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }), live: new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: follow, seed: config.seed }) }
  const out = { stepHz, dial: { r: DIAL.r, ring: DIAL.ring, hole: DIAL.hole }, factor: m.k, centre: { x: m.x(DIAL.cx), y: m.y(DIAL.cy) }, runs: {} }
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
      rows.push({ n: rows.length, phase: d.phase, wheel: q(d.a), x: q((p.x - m.x(DIAL.cx)) / m.k), y: q((p.y - m.y(DIAL.cy)) / m.k), z: q(m.backAir(p.z)), ...(m.k !== 1 ? { pageZ: q(p.z) } : {}), squash: q(p.squash), lean: q(p.lean), spin: q(p.spin), acting: p.acting, reaction: p.reaction, damage: p.damage.join('+'), scale: q(p.scale) })
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
  const PLACE = ['wheel', 'x', 'y', 'scale', 'turn']
  let bad = 0
  console.log(`the dial is drawn at ${A.factor ?? 1} and ${B.factor ?? 1} times, its centre at ${JSON.stringify(A.centre ?? null)} and ${JSON.stringify(B.centre ?? null)}`)
  for (const name of Object.keys(A.runs)) {
    if (!B.runs[name]) continue
    const ra = A.runs[name].map((r) => ({ ...r, turn: r.lean + r.spin }))
    const rb = B.runs[name].map((r) => ({ ...r, turn: r.lean + r.spin }))
    const most = {}
    const over = {}
    let words = 0
    for (let i = 0; i < Math.max(ra.length, rb.length); i++) {
      const x = ra[i]
      const y = rb[i]
      if (!x || !y) continue
      for (const k of Object.keys(x)) {
        if (y[k] === undefined) continue
        if (typeof x[k] === 'number') {
          const d = Math.abs(x[k] - y[k])
          most[k] = Math.max(most[k] ?? 0, d)
          if (d > LIMIT) over[k] = { steps: (over[k]?.steps ?? 0) + 1, last: i }
        } else if (x[k] !== y[k]) words++
      }
    }
    const round = Object.fromEntries(Object.entries(most).map(([k, v]) => [k, Math.round(v * 1e6) / 1e6]))
    if (ra.length !== rb.length || words > 0 || PLACE.some((k) => most[k] > LIMIT)) bad++
    console.log(`${name}: steps ${ra.length} and ${rb.length}; words that differ ${words}`)
    console.log(`  largest difference ${JSON.stringify(round)}`)
    console.log(`  over ${LIMIT}, steps and the last of them: ${JSON.stringify(over)}`)
  }
  console.log(`turn is lean and spin added. Limit ${LIMIT} px of the dial as built and radians, on every step, for ${PLACE.join(', ')}: ${bad === 0 ? 'the path of the fling is the same' : 'the path of the fling differs'}`)
  process.exit(bad === 0 ? 0 : 1)
} else {
  console.log('record <label> | compare <a> <b>')
}
