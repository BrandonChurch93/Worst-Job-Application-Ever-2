// Every pass of the clear ball over or beside a lamp window, stepped without a browser.
// node pipeline/phase5/polish-lamps-measure.mjs film [--near 1] [--rows]: the film of the pinball page, one line a film frame of 60 on which the ball's shell is within --near ball widths of a window's glass.
// node pipeline/phase5/polish-lamps-measure.mjs run RUN.json [--from S --to S]: the same from the rows of a walk of the pack's visitor (tools/lib/pack-site.mjs), read from the ball's place alone.
// node pipeline/phase5/polish-lamps-measure.mjs heights: how high each part of a window stands over the floor the ball's foot rolls on.
import fs from 'node:fs'
import { logic } from '../../tools/lib/logic.mjs'

const [what, ...rest] = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = rest.indexOf(`--${name}`)
  return i < 0 ? fallback : rest[i + 1]
}
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const { BALL, table } = L
const LV = await load('/src/table/real/lights/levels.ts')
const ART = await load('/src/table/real/art/inserts.ts')
const Z = await load('/src/table/real/zone.ts')
const D = await load('/src/table/draw.ts')
const f2 = (n) => n.toFixed(2)
const f1 = (n) => n.toFixed(1)
const FILM_FIRST = 4020

// The glow the window's glass is given, as `pose` of src/table/real/art/index.ts gives it.
const glowOf = (ctx, z, n) => {
  if (ART.glowOf) return ART.glowOf(ctx, z, n)
  const general = LV.levels(ctx, z).general
  const rest = ART.INSERT_GLOW.off + (ART.INSERT_GLOW.rest - ART.INSERT_GLOW.off) * general
  const lit = rest + (ART.INSERT_GLOW.on - rest) * (ctx.byId.get(`insert.${n.id}`)?.v?.[0] ?? 0)
  return lit + (ART.INSERT_GLOW.hit - lit) * general * (LV.answer ? LV.answer(ctx, `insert.${n.id}`) : LV.near(ctx, `insert.${n.id}`, LV.ANSWER.reach, 0.8))
}

if (what === 'heights') {
  const W = await load('/src/table/real/art/windows.ts')
  const z = Z.zone('street')
  const flat = W.windowGeometry(z, { segments: 56, inset: 0.975, dome: 0.45 })
  const at = flat.geometry.getAttribute('position')
  let low = 9
  let high = -9
  for (let i = 0; i < at.count; i++) {
    low = Math.min(low, at.getZ(i))
    high = Math.max(high, at.getZ(i))
  }
  console.log(`glass, in its own mesh: ${f2(low)} to ${f2(high)} units; the mesh stands at the plate's top 0.5 + lift 0.35, so ${f2(low + 0.85)} to ${f2(high + 0.85)} px over the zone's floor`)
  console.log(`one unit of the model is one px of the 1920 page; the ball is ${BALL} px; the glass is ${f1(table.inserts[0].r * BALL * 2)} px across`)
} else if (what === 'film') {
  const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
  const { pages } = await load('/src/pages/index.ts')
  const P = await load('/src/table/physics.ts')
  await P.prepare()
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const near = Number(arg('near', 1))
  const frames = Number(arg('frames', 2520))
  const out = []
  let last = null
  for (let f = 0; f < frames; f++) {
    const frame = s.frameAt(f / 60)
    const byId = new Map(frame.list.map((x) => [x.id, x]))
    const b = byId.get('ball.clear')
    if (!b) { last = null; continue }
    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    const speed = last ? Math.hypot(cx - last[0], cy - last[1]) : 0
    last = [cx, cy]
    const zone = Z.zone(D.zoneAt(cy))
    if (zone.tier < 0) continue
    const ctx = { byId }
    const lv = LV.levels(ctx, zone)
    for (const n of table.inserts) {
      if (n.tier !== zone.tier) continue
      const sh = byId.get(`insert.${n.id}`)
      if (!sh || Math.abs(b.z0 - sh.z0) > 0.6 * b.w) continue
      const d = Math.hypot(cx - (sh.x + sh.w / 2), cy - (sh.y + sh.h / 2))
      const gap = (d - sh.w / 2 - b.w / 2) / b.w
      if (gap > near) continue
      const k = table.inserts.filter((q) => q.tier === n.tier).indexOf(n) + 1
      out.push({ film: FILM_FIRST + f, unit: f, t: f / 60, id: n.id, d, gap, speed, lit: sh.v?.[0] ?? 0, v: sh.v, general: lv.general, lamp: lv.byName[`insert.${k}`], glow: glowOf(ctx, zone, n), view: frame.view?.name ?? frame.view?.id ?? '' })
    }
  }
  for (const r of out) console.log(`film ${r.film} (unit ${r.unit}, ${f2(r.t)} s) ${r.id}: middle ${f1(r.d)} px from the window's middle, gap ${f2(r.gap)} balls, ball moved ${f1(r.speed)} px, shape v ${JSON.stringify((r.v ?? []).map((x) => Math.round(x * 1000) / 1000))}, general ${f2(r.general)}, lamp ${f2(r.lamp)}, glass glow ${f2(r.glow)}`)
  const set = [...new Set(out.map((r) => r.film))]
  const runs = []
  for (const f of set) {
    const r = runs[runs.length - 1]
    if (r && f - r[1] <= 1) r[1] = f
    else runs.push([f, f])
  }
  console.log(`film frames with the ball within ${near} ball widths of a window: ${set.length}, in runs ${runs.map((r) => `${r[0]} to ${r[1]}`).join(', ')}`)
} else if (what === 'run') {
  const run = JSON.parse(fs.readFileSync(rest[0], 'utf8'))
  const from = Number(arg('from', 0))
  const to = Number(arg('to', 1e9))
  const near = Number(arg('near', 0.6))
  let last = null
  const ins = table.inserts.map((n) => ({ n, x: n.c[0] * BALL, y: n.c[1] * BALL, r: n.r * BALL }))
  const smooth = (t) => t * t * (3 - 2 * t)
  const clamp = (x) => Math.max(0, Math.min(1, x))
  run.rows.forEach((row, i) => {
    const [time, page, , x, y] = row
    if (page !== 'step3' || time < from || time > to) { last = null; return }
    const speed = last ? Math.hypot(x - last[0], y - last[1]) : 0
    last = [x, y]
    for (const w of ins) {
      const d = Math.hypot(x - w.x, y - w.y)
      const gap = (d - w.r - BALL / 2) / BALL
      if (gap > near) continue
      const t = clamp(-gap / 0.8) * 0.5 + clamp(1 - gap / LV.ANSWER.reach) * 0.5
      const a = smooth(t)
      console.log(`step ${i} (${Math.floor(time / 60)}:${(time % 60).toFixed(2).padStart(5, '0')}) ${w.n.id}: middle ${f1(d)} px from the window's middle, gap ${f2(gap)} balls, ball moved ${f1(speed)} px, answer of today's law ${f2(a)}, glass glow lit ${f2(0.64 + 0.36 * a)} unlit ${f2(0.34 + 0.66 * a)}`)
    }
  })
} else {
  console.log('say film, run or heights')
}
await close()
