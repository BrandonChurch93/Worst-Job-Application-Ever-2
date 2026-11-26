import { logic } from '../../tools/lib/logic.mjs'
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const { table, TIER_Y, R } = L
const y0 = TIER_Y[1]
const pts = [[7.9795, 7.3368], [7.962, 7.3518]]
const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) }
for (const q of pts) {
  const p = [q[0], q[1] + y0]
  const out = []
  for (const s of table.segs) if (s.tier === 1) out.push([dseg(p, s.a, s.b), 'seg ' + s.id + ' ' + s.kind + ' ' + JSON.stringify([s.a[0], +(s.a[1] - y0).toFixed(2), s.b[0], +(s.b[1] - y0).toFixed(2)])])
  for (const s of table.posts) if (s.tier === 1) out.push([Math.hypot(p[0] - s.c[0], p[1] - s.c[1]) - s.r, 'post ' + s.id + ' r ' + s.r + ' at ' + s.c[0] + ', ' + (s.c[1] - y0).toFixed(2)])
  for (const s of table.slings) if (s.tier === 1) out.push([Math.min(dseg(p, s.a, s.b), dseg(p, s.b, s.c), dseg(p, s.a, s.c)), 'sling ' + s.id + ' ' + JSON.stringify([s.a, s.b, s.c].map((v) => [v[0], +(v[1] - y0).toFixed(2)]))])
  for (const s of table.bumpers) if (s.tier === 1) out.push([Math.hypot(p[0] - s.c[0], p[1] - s.c[1]) - s.r, 'bumper ' + s.id])
  for (const s of table.inserts) if (s.tier === 1) out.push([Math.hypot(p[0] - s.c[0], p[1] - s.c[1]), 'insert centre ' + s.id + ' r ' + s.r + ' at ' + s.c[0] + ', ' + (s.c[1] - y0).toFixed(2) + ' picture ' + s.picture + ' mode ' + s.mode])
  out.sort((a, b) => a[0] - b[0])
  console.log(q, 'R', R)
  for (const o of out.slice(0, 7)) console.log('  ', o[0].toFixed(3), o[1])
}
await close()
