import * as THREE from 'three'
import { BALL, COLS, table } from '../../layout'
import type { Zone } from '../zone'
import { Geo, type V2, type V3 } from './geo'
import { TUBE, clamp, collar, frameAt, lengthOf, shells, spot } from './kit'
import { FIN, Screws, TONE, shade } from './mats'

export const LIFT = { centre: TUBE.outer + 1.5, foot: 10.55, elbowOut: 66, bend: 0.75 * BALL, lean: 0.44, swing: 1.05, decay: 4, beat: 7 }

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
  const base = spot(z, COLS.lift, LIFT.foot)
  let top: V3
  let bendPath: V3[] = []
  if (elbow) {
    const mid = (v(elbow.a[1]) + v(elbow.b[1])) / 2
    const end = spot(z, COLS.lift, mid)
    const r = LIFT.bend
    const cx = end[0] + r
    const cy = end[1] - r
    top = [end[0], cy, zc]
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI - (i / 8) * (Math.PI / 2)
      bendPath.push([cx + r * Math.cos(a), cy + r * Math.sin(a), zc])
    }
  } else {
    const end = spot(z, COLS.lift, 0)
    top = [end[0], end[1] + 4, zc]
  }
  const path: V3[] = [[base[0], base[1], zc], top]
  shells(C, path)
  const ground = 0

  // The cup the tube stands in at the foot of the tier.
  {
    const from = G.vertices
    const o = TUBE.outer
    G.f(FIN.alu).lathe([[0, -11], [20, -10], [o - 14, -4], [o + 4, 0], [o + 7, 3], [o + 7, 11], [o + 4.6, 12.4], [o + 4.6, 15.6], [o + 7, 17], [o + 7, 28], [o + 5, 30], [o + 0.3, 30]], 0, 0, 20, (i) => (i === 6 ? TONE.aluDark : i < 3 ? shade(TONE.alu, 0.86) : TONE.alu))
    G.move(from, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(base[0], base[1] - 4, zc))
    for (const side of [-1, 1]) {
      const a = Math.PI / 2 + side * 0.55
      S.add(base[0] + (o + 7) * Math.cos(a), base[1] + 3, zc + (o + 7) * Math.sin(a), 0.62, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)))
    }
  }

  const length = lengthOf(path)
  const span: [number, number] | null = door ? [spot(z, COLS.lift, v(Math.max(door.a[1], door.b[1])))[1] - base[1], spot(z, COLS.lift, v(Math.min(door.a[1], door.b[1])))[1] - base[1]] : null
  const clear = (s: number, pad: number): boolean => !span || s < span[0] - pad || s > span[1] + pad
  const step = TUBE.collarStep
  for (let s = step * 0.62; s < length - 30; s += step) {
    const f = frameAt(path, s)
    if (f && clear(s, 26)) collar(G, S, f)
    const g = frameAt(path, s + step / 2)
    if (g && s + step / 2 < length - 40 && clear(s + step / 2, 20)) clamp(G, S, g, ground)
  }
  if (span) {
    for (const s of [span[0] - 13, span[1] + 13]) {
      const f = frameAt(path, s)
      if (f) collar(G, S, f, { long: 18, out: TUBE.collarOut + 2 })
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
    const f0 = frameAt(path, length - 14)
    if (f0) collar(G, S, f0)
  } else {
    const f = frameAt(path, length - 16)
    if (f) collar(G, S, f, { long: 26, out: TUBE.collarOut + 3 })
  }

  // The door: a flap hung from a pin in a steel frame set in the wall between the lane and the floor.
  let flap: Geo | null = null
  let hinge: V3 = [0, 0, 0]
  if (door) {
    const a = spot(z, door.a[0], v(Math.min(door.a[1], door.b[1])))
    const b = spot(z, door.a[0], v(Math.max(door.a[1], door.b[1])))
    const x = spot(z, (COLS.liftB + COLS.left) / 2, 0)[0]
    const t = ((COLS.left - COLS.liftB) * BALL) / 2 + 1.5
    const y0 = b[1]
    const y1 = a[1]
    const high = 84
    for (const y of [y0 - 5, y1 + 5]) G.f(FIN.zinc).box(x - t, x + t, y - 5, y + 5, 0.4, high, TONE.zinc, { bevel: 1.4 })
    G.box(x - t, x + t, y0 - 10, y1 + 10, high - 9, high, TONE.zinc, { bevel: 1.4 })
    G.f(FIN.steel).pipe([[x + t + 2, y0 - 2, high - 6], [x + t + 2, y1 + 2, high - 6]], 2.4, 8, TONE.steel)
    for (const y of [y0 - 5, y1 + 5]) {
      S.add(x, y, high, 0.7)
      G.f(FIN.zinc).box(x + t, x + t + 18, y - 6, y + 6, 0.4, 2.8, TONE.zinc)
      S.add(x + t + 10, y, 2.8, 0.8)
    }
    hinge = [x + t + 2, (y0 + y1) / 2, high - 6]
    flap = new Geo()
    const w = (y1 - y0) / 2 - 3
    const tall = high - 12
    flap.f(FIN.gloss)
    const loop: V2[] = [[-w, 0], [-w, -tall + 9], [-w + 3, -tall + 3], [-w + 9, -tall], [w - 9, -tall], [w - 3, -tall + 3], [w, -tall + 9], [w, 0]]
    const from = flap.vertices
    flap.slab(loop, -2.6, 2.6, TONE.orange, { bevel: 1.2, bottom: true })
    flap.slab(loop.map((p) => [p[0] * 0.8, p[1] * 0.8 - 6] as V2), 2.6, 4.2, TONE.orange, { bevel: 1.2 })
    flap.move(from, new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)))
    for (const s of [-0.6, 0.6]) flap.f(FIN.gloss).pipe([[0, w * s - 9, 0], [0, w * s + 9, 0]], 4.6, 10, TONE.orange)
  }
  return { G, C, S, flap, hinge }
}
