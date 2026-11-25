import * as THREE from 'three'
import { BALL, COLS, LANE_RAMP, TH, TIERS, floorZ, table } from '../../layout'
import type { Zone } from '../zone'
import { Geo, type V2, type V3 } from './geo'
import { TUBE, clamp, collar, frameAt, lengthOf, shells, spot } from './kit'
import { FIN, Screws, TONE, shade } from './mats'

export const LIFT = { centre: TUBE.outer + 1.5, foot: 10.55, face: 2.1, joint: 14, crown: 1.5, elbowOut: 66, bend: 0.75 * BALL, lean: 0, swing: 1.25, decay: 4, beat: 7 }
export const DOOR = { high: 88 }
const tierStep = floorZ(0) - floorZ(1)

export interface Lift { G: Geo; C: Geo; S: Screws; flap: Geo | null; hinge: V3 }

// The lift of one tier: the clear tube lying up the left lane from its cup to the bend or the wall, the door of the tier, the bend at the top.
export function lift(z: Zone): Lift {
  const k = z.tier
  const G = new Geo()
  const C = new Geo()
  const S = new Screws()
  const zc = LIFT.centre
  const elbow = table.openings.find((o) => o.tier === k && o.id.endsWith('.elbow'))
  const door = table.openings.find((o) => o.tier === k && o.id.endsWith('.lift.door'))
  const v = (y: number): number => y - (z.top / BALL)
  // One shaft runs the whole left lane. It lies level over each floor and climbs a tier's step within LANE_RAMP.lift either side of a tier's line, so each tier builds its own length of it up to the lines it ends on.
  const rise = (tierStep * BALL) / 2
  const above = k > 0
  // The frame's housing over the lane is lower than the shaft's crown at the line, so a tier's length stops inside it where its crown is LIFT.crown balls up.
  const under = Math.min(1, (LIFT.crown * BALL - zc - TUBE.outer) / rise)
  const below = k < TIERS.length - 1
  const low = spot(z, COLS.lift, below ? TH - LANE_RAMP.lift : LIFT.foot)
  const base = low
  const path: V3[] = []
  if (below) {
    const line = spot(z, COLS.lift, TH)
    path.push([line[0], line[1], zc - rise])
  }
  path.push([low[0], low[1], zc])
  let fork = -1
  let bendPath: V3[] = []
  if (elbow) {
    const mid = (v(elbow.a[1]) + v(elbow.b[1])) / 2
    const end = spot(z, COLS.lift, mid)
    const r = LIFT.bend
    const cx = end[0] + r
    const cy = end[1] - r
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI - (i / 8) * (Math.PI / 2)
      bendPath.push([cx + r * Math.cos(a), cy + r * Math.sin(a), zc])
    }
    if (!above) path.push([end[0], cy, zc])
    fork = cy
  }
  if (above) {
    const flat = spot(z, COLS.lift, LANE_RAMP.lift)
    const line = spot(z, COLS.lift, 0)
    path.push([flat[0], flat[1], zc], [flat[0] + (line[0] - flat[0]) * under, flat[1] + (line[1] - flat[1]) * under, zc + rise * under])
  }
  shells(C, path)
  const slope = Math.hypot(LANE_RAMP.lift * BALL, rise)
  const from0 = below ? slope : 0
  const sOf = (y: number): number => from0 + y - low[1]
  const ground = 0

  // The cup the tube stands in at the foot of the lowest tier.
  if (!below) {
    const from = G.vertices
    const o = TUBE.outer
    G.f(FIN.alu).lathe([[0, -11], [16, -11], [18, -9], [18, -7.5], [o - 22, -7.5], [o - 20, -6], [o - 20, -4], [o + 2, -4], [o + 7, 1], [o + 7, 11], [o + 4.6, 12.4], [o + 4.6, 15.6], [o + 7, 17], [o + 7, 28], [o + 5, 30], [o + 0.3, 30]], 0, 0, 24, (i) => (i === 10 ? TONE.aluDark : i === 0 || i === 3 || i === 6 ? shade(TONE.alu, LIFT.face * (i === 3 ? 0.84 : 1)) : i < 8 ? shade(TONE.alu, 0.8) : TONE.alu))
    G.move(from, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(base[0], base[1] - 4, zc))
    S.add(base[0], base[1] - 15, zc, 0.9, new THREE.Vector3(0, -1, 0))
    for (const side of [-1, 1]) {
      const a = Math.PI / 2 + side * 0.55
      S.add(base[0] + (o + 7) * Math.cos(a), base[1] + 3, zc + (o + 7) * Math.sin(a), 0.62, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)))
    }
  }

  const length = lengthOf(path)
  const span: [number, number] | null = door ? [sOf(spot(z, COLS.lift, v(Math.max(door.a[1], door.b[1])))[1]), sOf(spot(z, COLS.lift, v(Math.min(door.a[1], door.b[1])))[1])] : null
  const turn: [number, number] | null = fork >= 0 ? [sOf(fork) - 8, sOf(fork) + LIFT.bend + LIFT.elbowOut] : null
  const clear = (s: number, pad: number): boolean => (!span || s < span[0] - pad || s > span[1] + pad) && (!turn || s < turn[0] - pad || s > turn[1] + pad)
  const step = TUBE.collarStep
  const s0 = from0
  const s1 = length - (above ? slope * under : 0)
  // Where no elbow stands at a tier's top the frame's housing reaches twice the ramp down the lane: no ring sits under it.
  const roof = above && !elbow ? s1 - LANE_RAMP.lift * BALL - 13 : s1 - 8
  for (let s = s0 + step * 0.62; s < roof - 22; s += step) {
    const f = frameAt(path, s)
    if (f && clear(s, 46)) collar(G, S, f)
    const g = frameAt(path, s + step / 2)
    if (g && s + step / 2 < roof - 32 && clear(s + step / 2, 20)) clamp(G, S, g, ground)
  }
  // A ring on the level run at each place the shaft turns up or down to the next tier.
  for (const q of [below ? s0 + LIFT.joint : -1, above && elbow ? s1 - LIFT.joint : -1]) {
    const f = q > 0 ? frameAt(path, q) : null
    if (f) collar(G, S, f, { long: 18, out: TUBE.collarOut + 2 })
  }
  if (span) {
    for (const s of [span[0] - 24, span[1] + 24]) {
      const f = s < roof ? frameAt(path, s) : null
      if (f) collar(G, S, f)
    }
  }

  // The bend at the top: moulded in two halves, a seam along its back, a flange with its screws at each end.
  if (elbow && bendPath.length > 0) {
    const R = LIFT.elbowOut
    G.f(FIN.gloss).pipe(bendPath, R, 20, TONE.orange)
    const seam: V3[] = bendPath.map((p) => [p[0], p[1], p[2] + R + 0.2])
    G.pipe(seam, 1.5, 4, TONE.orangeSeam)
    const ends = [frameAt(bendPath, 0.01), frameAt(bendPath, lengthOf(bendPath) - 0.01)]
    ends.forEach((f, i) => {
      if (!f) return
      const from = G.vertices
      const lo = i === 0 ? -7 : -1
      const outline: V2[] = [[R - 1, lo], [R + 7, lo], [R + 8, lo + 1], [R + 8, lo + 7], [R + 7, lo + 8], [R - 1, lo + 8]]
      G.f(FIN.gloss).lathe(outline, 0, 0, 20, TONE.orange)
      if (i === 1) G.f(FIN.dark).lathe([[R - 1, 6.5], [R - 9, 4], [0, 4]], 0, 0, 20, (n) => (n === 0 ? shade(TONE.orange, 0.5) : TONE.pocket))
      G.move(from, f.m)
      for (let n = 0; n < 5; n++) {
        const a = Math.PI / 2 + (n - 2) * 0.62
        const d = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
        const p = d.clone().multiplyScalar(R + 8).add(new THREE.Vector3(0, 0, lo + 4)).applyMatrix4(f.m)
        S.add(p.x, p.y, p.z, 0.6, d.transformDirection(f.m))
      }
    })
    const f0 = frameAt(path, sOf(fork) - 14)
    if (f0) collar(G, S, f0)
  } else if (!above) {
    const f = frameAt(path, length - 16)
    if (f) collar(G, S, f, { long: 26, out: TUBE.collarOut + 3 })
  }

  // The door: a moulded flap hung from a pin under the lintel of a steel frame on the wall's face. It bulges into the tier, so it reads from above.
  let flap: Geo | null = null
  let hinge: V3 = [0, 0, 0]
  if (door) {
    const a = spot(z, door.a[0], v(Math.min(door.a[1], door.b[1])))
    const b = spot(z, door.a[0], v(Math.max(door.a[1], door.b[1])))
    const x = a[0]
    const y0 = b[1]
    const y1 = a[1]
    const high = DOOR.high
    // The scoop is one orange moulding clipped round the shaft: a ring at each end, a cheek down from each ring, a hood between them.
    const R = TUBE.collarOut + 1
    for (const y of [y0 - 4, y1 + 4]) {
      G.f(FIN.gloss).box(x - 2, x + 9, y - 6, y + 6, 0.4, high, TONE.orange, { bevel: 1.4 })
      G.box(x + 9, x + 25, y - 6, y + 6, 0.4, 2.8, TONE.orange)
      S.add(x + 17.5, y, 2.8, 0.8)
      S.add(x + 3.5, y, high, 0.7)
      const f = frameAt(path, Math.min(sOf(y), roof))
      if (f) {
        const from = G.vertices
        G.f(FIN.gloss).lathe([[R - 6, -6], [R + 3, -6], [R + 4, -5], [R + 4, 5], [R + 3, 6], [R - 6, 6]], 0, 0, 20, TONE.orange)
        G.move(from, f.m)
        const d = new THREE.Vector3(0, 1, 0)
        const q = d.clone().multiplyScalar(R + 4).applyMatrix4(f.m)
        S.add(q.x, q.y, q.z, 0.7, d.transformDirection(f.m))
      }
    }
    G.f(FIN.gloss).box(x - 2, x + 11, y0 - 10, y1 + 10, high - 8, high, TONE.orange, { bevel: 1.4 })
    const hz = high - 13
    const hx = x + 7
    G.f(FIN.steel).pipe([[hx, y0 + 1, hz], [hx, y1 - 1, hz]], 2.2, 6, TONE.steel)
    hinge = [hx, (y0 + y1) / 2, hz]
    flap = new Geo()
    const w = (y1 - y0) / 2 - 3.5
    const tall = hz - 5
    const out: V2[] = [[0, 5], [6, 4], [13, -2], [20, -12], [25, -25], [27, -40], [25, -54], [20, -65], [13, -tall]]
    const thick = 5
    const outline: V2[] = [...out, ...out.map((p, i) => [Math.max(-3, p[0] - thick - (i === 0 ? 0 : 1)), p[1] - (i < 2 ? 3 : 0)] as V2).reverse()]
    flap.f(FIN.gloss).prism(outline, [0, -w], [0, w], (e) => (e < out.length - 1 ? TONE.orange : TONE.orangeSeam))
    for (const s of [-0.5, 0, 0.5]) {
      const rib: V2[] = [...out.slice(1).map((p) => [p[0] + 2.2, p[1]] as V2), ...out.slice(1).map((p) => [p[0] - 1, p[1]] as V2).reverse()]
      flap.prism(rib, [0, w * s - 3], [0, w * s + 3], TONE.orange)
    }
    for (const s of [-0.62, 0.62]) flap.pipe([[0, w * s - 12, 0], [0, w * s + 12, 0]], 5.4, 8, TONE.orange)
  }
  return { G, C, S, flap, hinge }
}
