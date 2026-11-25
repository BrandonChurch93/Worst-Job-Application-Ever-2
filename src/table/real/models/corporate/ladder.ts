import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { railOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type V2, type V3 } from './geo'
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
  // Where the way up and the way down run side by side, a wire of one may not stand in the path of a ball on the other.
  const crowded = (q: V3, s: number): boolean => {
    for (let k = 0; k <= L; k += 12) {
      if (Math.abs(k - s) < 260) continue
      const c = pos(k)
      if (Math.hypot(c[0] - q[0], c[1] - q[1]) < WIRE.clear && Math.abs(c[2] + WIRE.centre - q[2]) < 70) return true
    }
    return false
  }
  const off = (a: At, lat: number, up: number): V3 => [a.p[0] + a.r[0] * lat, a.p[1] + a.r[1] * lat, a.p[2] + up]
  const wire = (lat: number, up: number, segs: number): void => {
    let line: V3[] = []
    let last: V3 | null = null
    const end = (): void => {
      if (line.length > 1) S.pipe(line, WIRE.r, segs, STEEL)
      if (line.length > 1) for (const q of [line[0]!, line[line.length - 1]!]) S.lathe([[0, -WIRE.r], [WIRE.r, 0], [0, WIRE.r]], q[0], q[1], 5, STEEL, q[2])
      line = []
    }
    for (let s = 0; s <= L; s += 15) {
      const a = at(s)
      const q = off(a, lat, up)
      if (crowded(q, s)) {
        end()
        last = null
        continue
      }
      if (last && (q[0] - last[0]) * a.t[0] + (q[1] - last[1]) * a.t[1] < 1.5) continue
      line.push(q)
      last = q
    }
    end()
  }
  fin(S, FINISH.polished, () => {
    wire(-WIRE.under, WIRE.underUp, 6)
    wire(WIRE.under, WIRE.underUp, 6)
    wire(-WIRE.side, WIRE.sideUp, 6)
    wire(WIRE.side, WIRE.sideUp, 6)
    // A rung every half ball.
    for (let s = WIRE.rung / 2; s < L; s += WIRE.rung) {
      const a = at(s)
      const l = off(a, -WIRE.under, WIRE.underUp - 1.2)
      const r = off(a, WIRE.under, WIRE.underUp - 1.2)
      if (crowded(l, s) || crowded(r, s)) continue
      S.pipe([l, r], 2.1, 5, shade(STEEL, 0.94))
      for (const q of [l, r]) F.lathe([[0, -1.6], [WIRE.weld, -0.8], [WIRE.weld, 0.8], [0, 1.6]], q[0], q[1], 7, shade(STEEL, 0.8), q[2])
    }
    // A hoop round the outside of the four wires, and under it a leg down to a foot on the floor.
    for (let s = WIRE.hoops / 2 + 24; s < L - 30; s += WIRE.hoops) {
      const a = at(s)
      const pt = (th: number): V3 => off(a, Math.sin(th) * WIRE.hoop, WIRE.centre - Math.cos(th) * WIRE.hoop)
      const low = pt(0)
      if (low[2] < 9 || crowded(low, s)) continue
      const arc: V3[] = []
      const n = 8
      let lo = -n
      let hi = n
      for (let k = 1; k <= n; k++) if (crowded(pt((k / n) * 1.72), s)) {
        hi = k - 1
        break
      }
      for (let k = -1; k >= -n; k--) if (crowded(pt((k / n) * 1.72), s)) {
        lo = k + 1
        break
      }
      for (let k = lo; k <= hi; k++) arc.push(pt((k / n) * 1.72))
      if (arc.length > 1) S.pipe(arc, WIRE.hoopR, 5, STEEL)
      for (const [lat, up] of [[-WIRE.under, WIRE.underUp], [WIRE.under, WIRE.underUp], [-WIRE.side, WIRE.sideUp], [WIRE.side, WIRE.sideUp]] as V2[]) {
        const q = off(a, lat, up)
        if (!crowded(q, s)) F.lathe([[0, -1.8], [WIRE.weld, -0.9], [WIRE.weld, 0.9], [0, 1.8]], q[0] + a.r[0] * Math.sign(lat) * 1.6, q[1] + a.r[1] * Math.sign(lat) * 1.6, 7, shade(STEEL, 0.8), q[2] - 1.5)
      }
      const feet: V3[] = low[2] > 96 ? [off(a, -20, -a.p[2]), off(a, 20, -a.p[2])] : [off(a, 0, -a.p[2])]
      for (const f of feet) {
        S.pipe([low, [f[0], f[1], 2]], WIRE.r, 5, STEEL)
        S.lathe([[WIRE.foot, 0], [WIRE.foot, 2.5], [4.6, 2.5], [WIRE.r, 5.2]], f[0], f[1], 12, shade(STEEL, 0.92))
        for (const side of [-7, 7]) screw(F, f[0] + a.r[0] * side, f[1] + a.r[1] * side, 2.5, 3, shade(STEEL, 0.85))
      }
    }
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
