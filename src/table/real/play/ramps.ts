import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { railOf } from '../../layout'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, ball, box, lathe, look, mat, prism, rod, sweep, wire, type V2, type V3 } from './g'
import { drop, matsOf, part } from './mats'

const WIRE = look(0xf2f5f7, 0.2, 0.5, 1)
const PLATE = look(0xd3d6d9, 0.3, 0.76, 0)
const SPRING = look(0xbfc4c9, 0.24, 0.8, 0)
const WORN = look(0xf0f2f3, 0.1, 0.72, 0)
const SCREW = look(0xd2d5d8, 0.26, 0.76, 0)
const SCREW_SLOT = look(0x242526, 0.7, 1, 0)
const BEAD = look(0xd6d9dc, 0.34, 0.74, 0)
const CLEAR = look(0x566870, 0.05, 0, 1)
const CLEAR_EDGE = look(0xaec3cc, 0.04, 0, 1)
const PAINT = look(0xd9d6ca, 0.55, 0, 0)

export const TRACK = { wire: 2.6, under: 34.56, underUp: 11, side: 53.76, sideUp: 40, hoop: 2.2, hoopR: 55.4, centre: 48, every: 192, bead: 3.4 }
export const TROUGH = { half: 56, wall: 4, tall: 33, under: 3 }
export const FLAP = { wide: 104, long: 66, hinge: 13, lift: 24 }

interface Frame { at: V3; side: V3; up: V3; along: V3; s: number }

const v3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z]

// Frames along a path at even steps of length, with the way across kept level.
function framesOf(curve: THREE.Curve<THREE.Vector3>, step: number): Frame[] {
  const len = curve.getLength()
  const n = Math.max(2, Math.round(len / step))
  const out: Frame[] = []
  const zUp = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const at = curve.getPointAt(u)
    const along = curve.getTangentAt(u).normalize()
    const side = new THREE.Vector3().crossVectors(along, zUp).normalize()
    const up = new THREE.Vector3().crossVectors(side, along).normalize()
    out.push({ at: v3(at), side: v3(side), up: v3(up), along: v3(along), s: u * len })
  }
  return out
}

const put = (f: Frame, across: number, up: number, along = 0): V3 => [
  f.at[0] + f.side[0] * across + f.up[0] * up + f.along[0] * along,
  f.at[1] + f.side[1] * across + f.up[1] * up + f.along[1] * along,
  f.at[2] + f.side[2] * across + f.up[2] * up + f.along[2] * along
]

const pathOf = (z: Zone, id: string): THREE.Vector3[] => railOf(id).points.map((p) => new THREE.Vector3(...localBalls(z, p[0], p[1], p[2])))

function footPlate(b: Bag, fine: Bag, x: number, y: number, turn: number): void {
  const m = mat({ x, y, rz: turn })
  b.add(lathe([[14, 0], [14, 1.8], [13.2, 2.5], [0, 2.5]], 20), PLATE, m)
  for (const side of [-1, 1]) {
    const s = m.clone().multiply(mat({ x: side * 8, z: 2.5 }))
    fine.add(lathe([[3, 0], [3, 0.8], [2.3, 1.3], [0, 1.3]], 8), SCREW, s)
    fine.add(box(4.4, 0.8, 0.4), SCREW_SLOT, s.clone().multiply(mat({ z: 1.3, rz: 0.5 + side })))
  }
}

function highway(z: Zone, b: Bag, fine: Bag): Frame[] {
  const pts = pathOf(z, 'highway')
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const frames = framesOf(curve, 16)
  const line = (across: number, up: number, from = 0): V3[] => frames.filter((f) => f.s >= from).map((f) => put(f, across, up))
  for (const side of [-1, 1]) {
    b.add(wire(line(side * TRACK.under, TRACK.underUp), TRACK.wire, 8, 1), WIRE)
    b.add(wire(line(side * TRACK.side, TRACK.sideUp, 40), TRACK.wire, 8, 1), WIRE)
    const a = frames.find((f) => f.s >= 40)!
    b.add(wire([put(a, side * TRACK.side, TRACK.sideUp), put(a, side * (TRACK.side + 3), TRACK.sideUp - 6, -14), put(a, side * (TRACK.side + 10), TRACK.sideUp - 18, -26)], TRACK.wire, 8, 4), WIRE)
    const e = frames[frames.length - 1]!
    b.add(ball(TRACK.wire, 8, 6), WIRE, mat({ x: put(e, side * TRACK.under, TRACK.underUp)[0], y: put(e, side * TRACK.under, TRACK.underUp)[1], z: put(e, side * TRACK.under, TRACK.underUp)[2] }))
    b.add(ball(TRACK.wire, 8, 6), WIRE, mat({ x: put(e, side * TRACK.side, TRACK.sideUp)[0], y: put(e, side * TRACK.side, TRACK.sideUp)[1], z: put(e, side * TRACK.side, TRACK.sideUp)[2] }))
  }
  const total = frames[frames.length - 1]!.s
  const count = Math.floor((total - 70) / TRACK.every)
  const first = 70 + (total - 70 - count * TRACK.every) / 2
  let n = 0
  for (let k = 0; k <= count; k++) {
    const want = first + k * TRACK.every
    const f = frames.reduce((best, x) => (Math.abs(x.s - want) < Math.abs(best.s - want) ? x : best))
    const open = 104 * (Math.PI / 180)
    const arc: V3[] = []
    for (let i = 0; i <= 14; i++) {
      const a = -open + (i / 14) * open * 2
      arc.push(put(f, Math.sin(a) * TRACK.hoopR, TRACK.centre - Math.cos(a) * TRACK.hoopR))
    }
    b.add(wire(arc, TRACK.hoop, 8, 2), WIRE)
    for (const side of [-1, 1]) {
      for (const [across, up] of [[TRACK.under, TRACK.underUp], [TRACK.side, TRACK.sideUp]] as const) {
        const c = put(f, side * across, up)
        const d = put(f, side * across * 1.035, up + (up - TRACK.centre) * 0.035)
        fine.add(ball(TRACK.bead, 8, 6), BEAD, mat({ x: d[0], y: d[1], z: d[2], s: [1.25, 1.25, 0.8] }))
        void c
      }
    }
    const low = put(f, 0, TRACK.centre - TRACK.hoopR)
    if (low[2] > 16 && (k % 2 === 0 || k === count)) {
      const turn = Math.atan2(f.along[1], f.along[0])
      if (low[2] > 96) {
        const spread = 30
        for (const side of [-1, 1]) {
          const top = put(f, side * 14, TRACK.centre - Math.cos(Math.asin(14 / TRACK.hoopR)) * TRACK.hoopR)
          const fx = low[0] + f.side[0] * side * spread
          const fy = low[1] + f.side[1] * side * spread
          b.add(wire([top, [(top[0] * 2 + fx) / 3, (top[1] * 2 + fy) / 3, top[2] - 14], [fx, fy, 30], [fx, fy, 2]], TRACK.wire + 0.6, 8, 4), WIRE)
          b.add(lathe([[5.2, 2.4], [5.2, 9], [4.2, 10.4], [3.2, 10.4]], 10), PLATE, mat({ x: fx, y: fy }))
          fine.add(ball(TRACK.bead, 8, 6), BEAD, mat({ x: top[0], y: top[1], z: top[2] - 1, s: [1.25, 1.25, 0.8] }))
          fine.add(lathe([[4.4, 2.4], [3, 4.6], [2.6, 4.6]], 8), BEAD, mat({ x: fx, y: fy }))
          footPlate(b, fine, fx, fy, turn)
        }
        const cross = 0.45
        const pa: V3 = [low[0] + f.side[0] * -spread * 0.9, low[1] + f.side[1] * -spread * 0.9, low[2] * cross]
        const pb: V3 = [low[0] + f.side[0] * spread * 0.9, low[1] + f.side[1] * spread * 0.9, low[2] * cross]
        b.add(rod(pa, pb, TRACK.hoop, 6), WIRE)
      } else {
        b.add(rod([low[0], low[1], 2], [low[0], low[1], low[2] + 1], TRACK.wire + 0.6, 8), WIRE)
        b.add(lathe([[5.2, 2.4], [5.2, 9], [4.2, 10.4], [3.2, 10.4]], 10), PLATE, mat({ x: low[0], y: low[1] }))
        fine.add(ball(TRACK.bead, 8, 6), BEAD, mat({ x: low[0], y: low[1], z: low[2] - 1, s: [1.25, 1.25, 0.8] }))
        fine.add(lathe([[4.4, 2.4], [3, 4.6], [2.6, 4.6]], 8), BEAD, mat({ x: low[0], y: low[1] }))
        footPlate(b, fine, low[0], low[1], turn)
      }
      n++
    }
  }
  void n
  return frames
}

function flapGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  const w = FLAP.wide
  const l = FLAP.long
  const outline: V2[] = [[0, -w / 2 + 12], [10, -w / 2], [l - 8, -w / 2], [l, -w / 2 + 8], [l, w / 2 - 8], [l - 8, w / 2], [10, w / 2], [0, w / 2 - 12]]
  b.add(prism(outline, -0.7, 0.7, 0.3, 1), SPRING)
  b.add(prism([[l - 13, -w / 2 + 2], [l - 0.6, -w / 2 + 8.6], [l - 0.6, w / 2 - 8.6], [l - 13, w / 2 - 2]], 0.5, 0.95, 0), WORN)
  for (const y of [-26, 0, 26]) b.add(prism([[8, y - 1.4], [l - 16, y - 1.4], [l - 16, y + 1.4], [8, y + 1.4]], 0.6, 1.3, 0.4, 1), SPRING)
  b.add(rod([0, -w / 2 + 6, 0], [0, w / 2 - 6, 0], 2.4, 8), WIRE)
  for (const y of [-30, 30]) b.add(lathe([[2.6, 0], [2.6, 0.8], [0, 1.1]], 8), SCREW, mat({ x: 10, y, z: 0.7 }))
  return b.done()
}

function spiral(z: Zone, b: Bag, clear: Bag): void {
  const pts = pathOf(z, 'spiral')
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const frames = framesOf(curve, 22)
  const flat = frames.map((f) => ({ ...f, up: [0, 0, 1] as V3 }))
  const h = TROUGH.half
  const t = TROUGH.wall
  const top = TROUGH.tall
  const u = -TROUGH.under
  clear.add(sweep([[-h, u], [h, u], [h - 0.5, u + t], [-h + 0.5, u + t]], flat), CLEAR, undefined, 0.07)
  for (const side of [-1, 1]) {
    const wall: V2[] = side < 0 ? [[-h, u + t], [-h + t, u + t], [-h + t - 1, top], [-h - 3, top]] : [[h - t, u + t], [h, u + t], [h + 3, top], [h - t + 1, top]]
    clear.add(sweep(wall, flat), CLEAR, undefined, 0.07)
    const lip: V2[] = side < 0 ? [[-h - 5.5, top], [-h + t - 1, top], [-h + t - 1, top + 2.4], [-h - 5.5, top + 2.4]] : [[h - t + 1, top], [h + 5.5, top], [h + 5.5, top + 2.4], [h - t + 1, top + 2.4]]
    clear.add(sweep(lip, flat), CLEAR_EDGE, undefined, 0.62)
    const foot: V2[] = side < 0 ? [[-h - 0.8, u - 0.8], [-h + 2.4, u - 0.8], [-h + 2.4, u + 0.8], [-h - 0.8, u + 0.8]] : [[h - 2.4, u - 0.8], [h + 0.8, u - 0.8], [h + 0.8, u + 0.8], [h - 2.4, u + 0.8]]
    clear.add(sweep(foot, flat), CLEAR_EDGE, undefined, 0.4)
  }
  for (let i = 2; i < flat.length - 2; i += 2) {
    const f = flat[i]!
    const turn = Math.atan2(f.side[1], f.side[0])
    const p = put(f, 26, u + t + 0.25)
    b.add(box(22, 2.6, 0.5), PAINT, mat({ x: p[0], y: p[1], z: p[2], rz: turn }))
  }
  const centre = flat.reduce((a, f) => [a[0] + f.at[0] / flat.length, a[1] + f.at[1] / flat.length] as [number, number], [0, 0] as [number, number])
  for (let i = 4; i < flat.length - 2; i += 9) {
    const f = flat[i]!
    const dx = centre[0] - f.at[0]
    const dy = centre[1] - f.at[1]
    const d = Math.hypot(dx, dy)
    const from = h - 1
    const to = d - 44
    const a: V3 = [f.at[0] + (dx / d) * from, f.at[1] + (dy / d) * from, f.at[2] + u + 2]
    const c: V3 = [f.at[0] + (dx / d) * to, f.at[1] + (dy / d) * to, f.at[2] + u + 2]
    const turn = Math.atan2(dy, dx)
    clear.add(box(to - from + 2, 16, 3), CLEAR, mat({ x: (a[0] + c[0]) / 2, y: (a[1] + c[1]) / 2, z: a[2], rz: turn }), 0.18)
    b.add(lathe([[2.6, 0], [2.6, 1], [0, 1.3]], 8), SCREW, mat({ x: c[0] - (dx / d) * 4, y: c[1] - (dy / d) * 4, z: a[2] + 1.5 }))
  }
}

interface Built { flap: THREE.Mesh | null; down: number }

export const flapLift = (open: number): number => (1 - Math.max(0, Math.min(1, open))) * FLAP.lift

export const ramps = whole('ramps', {
  version: 'play-ramps-6',
  build(z) {
    const g = new THREE.Group()
    g.name = `play.ramps.${z.id}`
    const m = matsOf(z)
    const fixed = new Bag()
    const fine = new Bag()
    const clear = new Bag(true)
    const built: Built = { flap: null, down: 0 }
    const frames = highway(z, fixed, fine)
    spiral(z, fixed, clear)
    const hinge = frames.find((f) => f.at[2] + TRACK.underUp >= FLAP.hinge) ?? frames[1]!
    const at = put(hinge, 0, 0)
    const flap = part(flapGeometry(), m.solid, 'play.ramps.flap', { cast: true })
    flap.rotation.order = 'ZYX'
    flap.rotation.z = Math.atan2(-hinge.along[1], -hinge.along[0])
    flap.position.set(at[0], at[1], FLAP.hinge)
    built.flap = flap
    built.down = Math.asin((FLAP.hinge - 1) / FLAP.long)
    for (const side of [-1, 1]) {
      const p = put(hinge, side * (FLAP.wide / 2 - 2), 0)
      fixed.add(prism([[-5, -4], [5, -4], [5, 4], [-5, 4]], 0, FLAP.hinge + 3.4, 0.5, 1), PLATE, mat({ x: p[0], y: p[1], rz: flap.rotation.z }))
      fixed.add(lathe([[9, 0], [9, 1.4], [0, 1.4]], 14), PLATE, mat({ x: p[0], y: p[1] }))
    }
    g.add(flap)
    g.add(part(fixed.done(), m.solid, 'play.ramps.fixed', { cast: true }))
    g.add(part(fine.done(), m.solid, 'play.ramps.fine', { fine: true }))
    const spiralMesh = part(clear.done(), m.clear, 'play.ramps.clear')
    spiralMesh.renderOrder = 2
    g.add(spiralMesh)
    g.userData.built = built
    return g
  },
  pose(o, _z, ctx: RealContext) {
    const b = o.userData.built as Built
    if (!b.flap) return
    const open = ctx.byId.get('flap.highway')?.v?.[0] ?? 1
    b.flap.rotation.y = b.down - Math.asin(flapLift(open) / FLAP.long)
  },
  drop
})
