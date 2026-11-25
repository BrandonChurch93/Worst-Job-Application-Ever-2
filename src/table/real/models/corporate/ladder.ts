import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { railOf, table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type V2, type V3 } from './geo'
import { WEDGE } from './wedges'
import { FINISH, drop as free, fin, hex, matsOf, mesh, moved, place, screw, shade } from './mats'

// The wire ramp, as agreed with the owner of the ramps: the rail's height is the underside of the ball.
export const WIRE = { r: 2.6, under: 34.56, underUp: 11, side: 53.76, sideUp: 40, hoop: 55.4, hoopR: 2.2, centre: 48, rung: 48, hoops: 144, clear: 58, weld: 3.4, foot: 14 }
const STEEL = hex(0xd0d4d8)

interface At { p: V3; t: V2; r: V2 }

export function buildLadder(z: Zone, _ctx: RealContext): THREE.Object3D {
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const F = new Geo()
  const raw = railOf('ladder').points.map((p) => localBalls(z, p[0], p[1], p[2]) as V3)
  const dist = (a: V3, b: V3): number => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const lerp = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
  // The rail's corners are bent, as wire is, not folded.
  const path: V3[] = [raw[0]!]
  for (let i = 1; i < raw.length - 1; i++) {
    const c = raw[i]!
    const la = dist(raw[i - 1]!, c)
    const lb = dist(c, raw[i + 1]!)
    const cut = Math.min(44, la * 0.46, lb * 0.46)
    const p0 = lerp(c, raw[i - 1]!, cut / la)
    const p1 = lerp(c, raw[i + 1]!, cut / lb)
    for (let k = 0; k <= 8; k++) path.push(lerp(lerp(p0, c, k / 8), lerp(c, p1, k / 8), k / 8))
  }
  path.push(raw[raw.length - 1]!)
  const run: number[] = [0]
  for (let i = 1; i < path.length; i++) run.push(run[i - 1]! + dist(path[i - 1]!, path[i]!))
  const L = run[run.length - 1]!
  const pos = (s: number): V3 => {
    const q = Math.max(0, Math.min(L, s))
    let i = 1
    while (i < path.length - 1 && run[i]! < q) i++
    return lerp(path[i - 1]!, path[i]!, (q - run[i - 1]!) / Math.max(1e-6, run[i]! - run[i - 1]!))
  }
  const at = (s: number): At => {
    const a = pos(s - 5)
    const b = pos(s + 5)
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const t: V2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
    return { p: pos(s), t, r: [t[1], -t[0]] }
  }
  const pts: V3[] = []
  for (let k = 0; k <= L; k += 6) pts.push(pos(k))
  const near = (q: V3, from = 0, to = pts.length): { d: number; s: number } => {
    let d = Infinity
    let s = 0
    for (let i = from; i < to; i++) {
      const c = pts[i]!
      const l = Math.hypot(c[0] - q[0], c[1] - q[1])
      if (l < d) {
        d = l
        s = i * 6
      }
    }
    return { d, s }
  }
  // The way up and the way down run closer than two lanes: the two are one frame, and a wire stands only where it is on the edge of both.
  const free = (q: V3, need: number): boolean => near(q).d >= need - 2
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const c = pts[i]!
    const n = pts[(i + 1) % pts.length]!
    area += c[0] * n[1] - n[0] * c[1]
  }
  const out = area > 0 ? 1 : -1
  const foot: V3 = [(raw[0]![0] + raw[raw.length - 1]![0]) / 2, (raw[0]![1] + raw[raw.length - 1]![1]) / 2, 0]
  let apex = 0
  let far = 0
  pts.forEach((c, i) => {
    const l = Math.hypot(c[0] - foot[0], c[1] - foot[1])
    if (l > far) {
      far = l
      apex = i
    }
  })
  const sApex = apex * 6
  const mate = (s: number): At => at(near(pos(s), Math.min(pts.length - 1, apex + 4), pts.length).s)
  const inTri = (q: V3 | V2, a: V2, b: V2, c: V2): boolean => {
    const e = (u: V2, v: V2): number => (q[0] - u[0]) * (v[1] - u[1]) - (q[1] - u[1]) * (v[0] - u[0])
    const d0 = e(a, b)
    const d1 = e(b, c)
    const d2 = e(c, a)
    return (d0 >= 0 && d1 >= 0 && d2 >= 0) || (d0 <= 0 && d1 <= 0 && d2 <= 0)
  }
  const plates = (grow: number): V2[][] => table.slings.filter((g) => g.tier === z.tier).map((g) => {
    const c = [g.a, g.b, g.c].map((v) => localBalls(z, v[0], v[1])) as unknown as V2[]
    const m: V2 = [(c[0]![0] + c[1]![0] + c[2]![0]) / 3, (c[0]![1] + c[1]![1] + c[2]![1]) / 3]
    return c.map((v) => {
      const l = Math.hypot(v[0] - m[0], v[1] - m[1]) || 1
      return [v[0] + ((v[0] - m[0]) / l) * grow, v[1] + ((v[1] - m[1]) / l) * grow] as V2
    })
  })
  const over = plates(22)
  const wide = plates((WIRE.foot + 4) * 2)
  // No wire may lie in the marble of a sling plate it passes over.
  const clear = WEDGE.under + WEDGE.thick + WIRE.r + 1.6
  const off = (a: At, lat: number, up: number): V3 => {
    const q: V3 = [a.p[0] + a.r[0] * lat, a.p[1] + a.r[1] * lat, a.p[2] + up]
    if (q[2] < clear && over.some((t) => inTri(q, t[0]!, t[1]!, t[2]!))) q[2] = clear
    return q
  }
  const bead = (q: V3, r = WIRE.weld): void => {
    F.lathe([[0, -r * 0.5], [r, -r * 0.25], [r, r * 0.25], [0, r * 0.5]], q[0], q[1], 7, shade(STEEL, 0.8), q[2])
  }
  const wire = (lat: number, up: number, need: number): void => {
    let line: V3[] = []
    const end = (): void => {
      if (line.length > 2) {
        S.pipe(line, WIRE.r, 6, STEEL)
        for (const q of [line[0]!, line[line.length - 1]!]) S.lathe([[0, -WIRE.r], [WIRE.r, 0], [0, WIRE.r]], q[0], q[1], 5, STEEL, q[2])
      }
      line = []
    }
    for (let s = 0; s <= L; s += 10) {
      const a = at(s)
      const q = off(a, lat, up)
      if (!free(q, need)) {
        end()
        continue
      }
      const last = line[line.length - 1]
      if (last && (q[0] - last[0]) * a.t[0] + (q[1] - last[1]) * a.t[1] < 1.5) continue
      line.push(q)
    }
    end()
  }
  const blocked = (q: V3): boolean => {
    const reach = WIRE.foot + 4
    if (wide.some((t) => inTri(q, t[0]!, t[1]!, t[2]!))) return true
    const round = (c: [number, number], r: number): boolean => {
      const l = localBalls(z, c[0], c[1])
      return Math.hypot(l[0] - q[0], l[1] - q[1]) < r * 96 + reach
    }
    for (const g of table.posts) if (g.tier === z.tier && round(g.c, g.r)) return true
    for (const g of table.inserts) if (g.tier === z.tier && round(g.c, g.r)) return true
    for (const g of table.lamps) if (g.tier === z.tier && round(g.c, 0.2)) return true
    for (const g of table.models) {
      if (g.tier !== z.tier) continue
      const c0 = localBalls(z, g.box[0], g.box[1])
      const c1 = localBalls(z, g.box[0] + g.box[2], g.box[1] + g.box[3])
      if (q[0] > Math.min(c0[0], c1[0]) - reach && q[0] < Math.max(c0[0], c1[0]) + reach && q[1] > Math.min(c0[1], c1[1]) - reach && q[1] < Math.max(c0[1], c1[1]) + reach) return true
    }
    return false
  }
  const hoop = (a: At, from: number, to: number, n: number): V3[] => {
    const line: V3[] = []
    for (let k = 0; k <= n; k++) {
      const th = from + ((to - from) * k) / n
      line.push(off(a, out * Math.sin(th) * WIRE.hoop, WIRE.centre - Math.cos(th) * WIRE.hoop))
    }
    return line
  }
  const stand = (from: V3, a: At): void => {
    if (from[2] < 12) return
    const feet: V3[] = from[2] > 96 ? [[from[0] + a.t[0] * 20, from[1] + a.t[1] * 20, 0], [from[0] - a.t[0] * 20, from[1] - a.t[1] * 20, 0]] : [[from[0], from[1], 0]]
    for (const f of feet) {
      S.pipe([from, [f[0], f[1], 2]], WIRE.r, 5, STEEL)
      S.lathe([[WIRE.foot, 0], [WIRE.foot, 1.7], [WIRE.foot - 0.8, 2.5], [4.6, 2.5], [WIRE.r, 5.2]], f[0], f[1], 14, shade(STEEL, 0.92))
      for (const side of [-7, 7]) screw(F, f[0] + a.r[0] * side, f[1] + a.r[1] * side, 2.5, 2.6, shade(STEEL, 0.85))
    }
    bead(from, WIRE.weld + 0.6)
  }
  fin(S, FINISH.polished, () => {
    wire(out * WIRE.under, WIRE.underUp, WIRE.under)
    wire(out * WIRE.side, WIRE.sideUp, WIRE.side)
    wire(-out * WIRE.under, WIRE.underUp, WIRE.under)
    // A rung every half ball: across one lane where the two stand apart, across both where they run as one.
    for (let s = WIRE.rung / 2; s < L; s += WIRE.rung) {
      const a = at(s)
      const l = off(a, out * WIRE.under, WIRE.underUp - 1.4)
      let r = off(a, -out * WIRE.under, WIRE.underUp - 1.4)
      if (!free(r, WIRE.under)) {
        if (s > sApex - 30) continue
        r = off(mate(s), out * WIRE.under, WIRE.underUp - 1.4)
      }
      S.pipe([l, r], 2.1, 5, shade(STEEL, 0.94))
      bead(l)
      bead(r)
    }
    // A cradle under both lanes from one outer guide wire to the other, and under it a leg down to a foot on the floor.
    for (let s0 = 96; s0 < sApex - 60; s0 += WIRE.hoops) {
      let s = s0
      for (const d of [0, 24, -24, 48, -48, 72]) {
        const a = at(s0 + d)
        const b = mate(s0 + d)
        const m: V3 = [(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2, 0]
        s = s0 + d
        if (!blocked(m) && !blocked([m[0] + a.t[0] * 20, m[1] + a.t[1] * 20, 0]) && !blocked([m[0] - a.t[0] * 20, m[1] - a.t[1] * 20, 0])) break
      }
      const a = at(s)
      const b = mate(s)
      const up = hoop(a, 1.72, 0, 7)
      const down = hoop(b, 0, 1.72, 7)
      S.pipe([...up, ...down], WIRE.hoopR, 5, STEEL)
      const u = up[up.length - 1]!
      const d = down[0]!
      stand([(u[0] + d[0]) / 2, (u[1] + d[1]) / 2, (u[2] + d[2]) / 2], a)
      for (const [w, lat, h] of [[a, WIRE.side, WIRE.sideUp], [a, WIRE.under, WIRE.underUp], [b, WIRE.side, WIRE.sideUp], [b, WIRE.under, WIRE.underUp]] as [At, number, number][]) bead(off(w, out * (lat + 1.6), h - 1.5))
    }
    // Round the turn at the top the cradles stand on their own.
    for (const s of [sApex - 44, sApex + 44]) {
      const a = at(s)
      const line = hoop(a, 1.72, -0.5, 9)
      S.pipe(line, WIRE.hoopR, 5, STEEL)
      for (const [lat, h] of [[WIRE.side, WIRE.sideUp], [WIRE.under, WIRE.underUp]] as V2[]) bead(off(a, out * (lat + 1.6), h - 1.5))
    }
    const top = at(sApex)
    const crown = hoop(top, 1.72, 0, 7)
    S.pipe(crown, WIRE.hoopR, 5, STEEL)
    stand(crown[crown.length - 1]!, { p: top.p, t: top.r, r: top.t })
  })
  F.map(0, () => [(FINISH.polished + 0.5) / 8, 0.5])
  // The flap at the foot, where a ball leaves the floor for the wires.
  const a0 = raw[0]!
  const a1 = raw[raw.length - 1]!
  const my = (a0[1] + a1[1]) / 2
  const half = Math.abs(a0[1] - a1[1]) / 2 + WIRE.under + 6
  moved(S, place(a0[0] - 42, my, 0.7, 0, 0, -0.2), () => {
    fin(S, FINISH.brushed, () => {
      S.box(0, 46, -half, half, 0, 1.7, shade(STEEL, 0.9), { bevel: 0.5, bottom: true, along: [1, 0, 0] })
      for (const s of [-1, 1]) S.box(3, 44, s > 0 ? half - 1.6 : -half, s > 0 ? half : -half + 1.6, 1.7, 5.4, shade(STEEL, 0.9), { bevel: 0.5 })
    })
  })
  fin(S, FINISH.polished, () => {
    S.pipe([[a0[0] - 42, my - half - 2, 1.9], [a0[0] - 42, my + half + 2, 1.9]], 1.9, 6, STEEL)
    for (const s of [-1, 1]) S.box(a0[0] - 52, a0[0] - 43, my + s * (half - 12) - 5, my + s * (half - 12) + 5, 0, 1.3, shade(STEEL, 0.8), { bevel: 0.4 })
  })
  for (const s of [-1, 1]) screw(F, a0[0] - 48.5, my + s * (half - 12), 1.3, 2.2, shade(STEEL, 0.9))
  o.add(mesh(S, mats.solid, `ladder.${z.id}`, { cast: true }))
  o.add(mesh(F, mats.solid, `ladder.welds.${z.id}`, { fine: true }))
  return o
}

export const dropLadder = free
