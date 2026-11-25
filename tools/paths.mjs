// npm run paths: the physics of the table without the director and without pictures.
// Reads the machine's layout, drops seeded balls on every tier and rides every rail, then prints what it found and writes out/work/paths.json.
import { args, at, config, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'

const a = args()
const c = config()
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const { Machine } = await load('/src/table/physics.ts')
const { stream } = await load('/src/core/random.ts')
const { table, TIERS, TIER_Y, TH, R, FLIP, COLS } = L
const min = c.table.minClearanceBalls
const hz = c.sim.stepHz
const perTier = Number(a.balls ?? 48)
const maxSeconds = Number(a.seconds ?? 45)
const playSeconds = Number(a.play ?? 15)
const seed = Number(a.seed ?? c.seed)
const problems = []
const r2 = (n) => Number(n.toFixed(2))

const distSeg = (x, y, p, q) => {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const l = dx * dx + dy * dy
  const u = l > 0 ? Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / l)) : 0
  return Math.hypot(x - p[0] - dx * u, y - p[1] - dy * u)
}
const distBox = (x, y, b) => Math.hypot(Math.max(b[0] - x, 0, x - b[0] - b[2]), Math.max(b[1] - y, 0, y - b[1] - b[3]))
const inBox = (x, y, b, grow = 0) => x > b[0] - grow && x < b[0] + b[2] + grow && y > b[1] - grow && y < b[1] + b[3] + grow

const openings = table.openings.map((o) => ({ id: o.id, tier: TIERS[o.tier], width: r2(Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1])) }))
const narrow = openings.filter((o) => o.width < min)
console.log(`openings: ${openings.length} read from the layout, the narrowest ${Math.min(...openings.map((o) => o.width)).toFixed(2)} balls, the least allowed ${min}`)
for (const o of narrow) {
  console.log(`NARROW   ${o.id}: ${o.width.toFixed(2)} balls`)
  problems.push(`opening ${o.id} is ${o.width.toFixed(2)} balls wide, under ${min}`)
}

const place = (name) => {
  const h = table.holds.find((x) => x.id === name)
  if (h) return { kind: 'hold', a: h.c, b: h.c }
  const o = table.openings.find((x) => x.id === name)
  if (o) return { kind: 'opening', a: o.a, b: o.b }
  const r = table.rails.find((x) => x.id === name)
  if (r) return { kind: 'rail', a: r.points[0], b: r.points[r.points.length - 1] }
  return null
}
const railGap = (rail, p) => {
  let d = Infinity
  for (let i = 1; i < rail.points.length; i++) {
    for (const q of [p.a, p.b, [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2]]) d = Math.min(d, distSeg(q[0], q[1], rail.points[i - 1], rail.points[i]))
  }
  return d
}
const rails = table.rails.map((r) => {
  const out = { id: r.id, from: r.from, to: r.to, length: r2(L.railLength(r)), entry: 'none', exit: 'none' }
  for (const [end, name] of [['entry', r.from], ['exit', r.to]]) {
    const p = place(name)
    if (!p) problems.push(`rail ${r.id} has no ${end}: nothing in the layout is called ${name}`)
    else if (railGap(r, p) > 1) problems.push(`rail ${r.id} does not reach its ${end} ${name}: ${railGap(r, p).toFixed(2)} balls away`)
    else out[end] = p.kind
  }
  return out
})
console.log(`rails: ${rails.length} read from the layout, ${rails.filter((r) => r.entry !== 'none' && r.exit !== 'none').length} with an entry and an exit`)
for (const r of rails) if (r.entry === 'none' || r.exit === 'none') console.log(`OPEN RAIL  ${r.id}: entry ${r.entry}, exit ${r.exit}`)

const sealed = table.sealed.map((id) => table.models.find((m) => m.id === id)).filter(Boolean)
const ways = []
for (const m of sealed) {
  if (!m.solid) ways.push(`${m.id} is not solid`)
  for (const o of table.openings) if (inBox((o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2, m.box)) ways.push(`opening ${o.id} lies in ${m.id}`)
  for (const h of table.holds) if (inBox(h.c[0], h.c[1], m.box)) ways.push(`hold ${h.id} lies in ${m.id}`)
  for (const r of table.rails) if (r.points.some((p) => inBox(p[0], p[1], m.box))) ways.push(`rail ${r.id} passes through ${m.id}`)
}
if (sealed.length !== table.sealed.length) ways.push('a sealed box named in the layout is not a model of the layout')

const solidGap = (x, y, k) => {
  let d = Infinity
  for (const s of table.segs) if (s.tier === k) d = Math.min(d, distSeg(x, y, s.a, s.b))
  for (const p of table.posts) if (p.tier === k) d = Math.min(d, Math.hypot(x - p.c[0], y - p.c[1]) - p.r)
  for (const b of table.bumpers) if (b.tier === k) d = Math.min(d, Math.hypot(x - b.c[0], y - b.c[1]) - b.r)
  for (const m of table.models) if (m.tier === k && m.solid) d = Math.min(d, distBox(x, y, m.box))
  for (const s of table.slings) if (s.tier === k) d = Math.min(d, distSeg(x, y, s.a, s.b), distSeg(x, y, s.b, s.c), distSeg(x, y, s.a, s.c))
  for (const f of table.flippers) {
    if (f.tier !== k) continue
    const dir = f.side === 'left' ? 1 : -1
    d = Math.min(d, distSeg(x, y, f.pivot, [f.pivot[0] + dir * FLIP.length * L.COS25, f.pivot[1] + FLIP.length * L.SIN25]) - FLIP.radius)
  }
  return d
}
const inShoulder = (x, y, k) => {
  const walls = table.segs.filter((s) => s.tier === k && /\.(inlane\.floor|shoulder\.edge)\./.test(s.id))
  return walls.some((s) => {
    const lo = Math.min(s.a[0], s.b[0])
    const hi = Math.max(s.a[0], s.b[0])
    if (x < lo || x > hi || hi === lo) return false
    return y > s.a[1] + ((s.b[1] - s.a[1]) * (x - s.a[0])) / (s.b[0] - s.a[0])
  })
}
const inSling = (x, y, s) => {
  const side = (p, q) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0])
  const d = [side(s.a, s.b), side(s.b, s.c), side(s.c, s.a)]
  return d.every((v) => v > 0) || d.every((v) => v < 0)
}

const machine = new Machine()
const balls = []
function run(label, start, flips) {
  machine.reset()
  start(machine)
  const b = machine.balls[0]
  const out = { ball: label, flips, end: '', seconds: 0, x: 0, y: 0, tiers: [], events: {} }
  let still = 0
  const limit = maxSeconds * hz
  for (let n = 0; n < limit; n++) {
    const w = flips && n < playSeconds * hz ? machine.wants() : [false, false]
    const ev = machine.step(w[0], w[1])
    for (const e of ev) {
      if (e.ball !== 0) continue
      out.events[e.name] = (out.events[e.name] ?? 0) + 1
      if (e.name === 'escape') out.end = `left the machine at ${e.x.toFixed(2)}, ${e.y.toFixed(2)} on ${e.id}`
    }
    if (b.mode === 'plane') {
      if (!out.tiers.includes(TIERS[b.tier])) out.tiers.push(TIERS[b.tier])
      for (const m of sealed) if (inBox(b.x, b.y, m.box, -0.05) && !ways.includes(`ball ${label} got into ${m.id}`)) ways.push(`ball ${label} got into ${m.id}`)
      for (const m of table.models) if (m.solid && m.tier === b.tier && inBox(b.x, b.y, m.box, -0.2) && !out.end) out.end = `passed into the solid ${m.id}`
      still = Math.hypot(b.vx, b.vy) < 0.08 ? still + 1 : 0
      if (still > 2 * hz) {
        const o = table.openings.find((q) => q.tier === b.tier && distSeg(b.x, b.y, q.a, q.b) < R)
        out.end = o ? `stuck in the opening ${o.id}` : 'came to rest outside a hold'
      }
    }
    if (b.mode === 'hold' && b.hold === 'outlet') out.end = 'drain'
    if (out.end) {
      out.seconds = r2((n + 1) / hz)
      break
    }
  }
  if (!out.end) {
    out.end = b.mode === 'hold' ? `held for good in ${b.hold}` : `still in play after ${maxSeconds} s`
    out.seconds = maxSeconds
  }
  out.x = r2(b.x)
  out.y = r2(b.y)
  balls.push(out)
  if (out.end !== 'drain') {
    console.log(`BALL     ${label}: ${out.end} (at ${out.x}, ${out.y}, after ${out.seconds} s)`)
    problems.push(`ball ${label} ${out.end}`)
  }
  return out
}

for (let k = 0; k < 3; k++) {
  const rnd = stream(`paths.${TIERS[k]}`, seed)
  let made = 0
  let tries = 0
  while (made < perTier && tries++ < perTier * 200) {
    const x = rnd.range(COLS.left + 0.5, COLS.right - 0.5)
    const y = TIER_Y[k] + rnd.range(0.8, TH - 1.4)
    const vx = rnd.range(-8, 8)
    const vy = rnd.range(-8, 8)
    if (solidGap(x, y, k) < R + 0.08) continue
    if (table.models.some((m) => m.tier === k && m.solid && inBox(x, y, m.box, R))) continue
    if (table.slings.some((s) => s.tier === k && inSling(x, y, s))) continue
    if (inShoulder(x, y, k)) continue
    if (table.holds.some((h) => h.tier === k && Math.hypot(x - h.c[0], y - h.c[1]) < h.r + R)) continue
    made++
    run(`${TIERS[k]}.${made}`, (m) => m.toPlane(0, x, y, vx, vy), made % 2 === 0)
  }
  if (made < perTier) problems.push(`only ${made} of ${perTier} balls found a free place on ${TIERS[k]}`)
}
for (const r of table.rails) {
  if (r.id === 'feed') run('rail.feed', (m) => m.hold(0, 'loader', 0), false)
  else run(`rail.${r.id}`, (m) => m.ride(0, r.id), false)
}
machine.free()

for (const w of ways) {
  console.log(`WAY IN   ${w}`)
  problems.push(`a way into the Retirement box: ${w}`)
}
console.log(`ways into the Retirement box: ${ways.length ? ways.length : 'none'} (sealed: ${table.sealed.join(', ')})`)
const drained = balls.filter((b) => b.end === 'drain')
const longest = balls.reduce((m, b) => Math.max(m, b.seconds), 0)
console.log(`balls: ${balls.length} run (${perTier} dropped on each of ${TIERS.join(', ')}, half of them with the flippers played for ${playSeconds} s, and one down every rail), ${drained.length} left by the drain, the longest in play ${longest.toFixed(1)} s`)
const seen = {}
for (const b of balls) for (const [n, v] of Object.entries(b.events)) seen[n] = (seen[n] ?? 0) + v
console.log(`contacts: ${Object.entries(seen).sort((p, q) => q[1] - p[1]).map(([n, v]) => `${n} ${v}`).join(', ')}`)
writeJson(at('out', 'work', 'paths.json'), { made: new Date().toISOString(), seed, minClearanceBalls: min, openings, narrow, rails, sealed: table.sealed, ways, balls, contacts: seen, problems })
for (const p of problems) console.log(`PROBLEM  ${p}`)
console.log(problems.length ? `paths: ${problems.length} problem${problems.length === 1 ? '' : 's'}` : 'paths: all clear')
await close()
process.exit(problems.length ? 1 : 0)
