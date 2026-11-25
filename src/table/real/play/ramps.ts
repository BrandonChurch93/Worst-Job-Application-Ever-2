import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, railOf, SPIRAL, table } from '../../layout'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, ball, box, DEG, lathe, look, mat, prism, rod, sweep, wire, type V2, type V3 } from './g'
import { drop, matsOf, part } from './mats'

const WIRE = look(0xf4f6f8, 0.1, 0.9, 0)
const PLATE = look(0xd3d6d9, 0.3, 0.76, 0)
const SPRING = look(0xbfc4c9, 0.24, 0.8, 0)
const WORN = look(0xf0f2f3, 0.1, 0.72, 0)
const SCREW = look(0xd2d5d8, 0.26, 0.76, 0)
const SCREW_SLOT = look(0x242526, 0.7, 1, 0)
const BEAD = look(0xd6d9dc, 0.34, 0.74, 0)
const CLEAR = look(0x8fa4ad, 0.05, 0, 1)
const CLEAR_EDGE = look(0xd4e3ea, 0.04, 0, 1)

export const TRACK = { wire: 2.6, under: 34.56, underUp: 11, side: 53.76, sideUp: 40, hoop: 2.2, hoopR: 55.4, centre: 48, every: 192, bead: 3.4 }
// The clear width of the trough is the width of the layout's opening for the spiral's turn.
const turnOf = table.openings.find((o) => o.id === 'street.spiral.turn')!
export const CLEARANCE = Math.hypot(turnOf.b[0] - turnOf.a[0], turnOf.b[1] - turnOf.a[1]) * BALL
export const TROUGH = { half: CLEARANCE / 2, wall: 4, tall: 33, under: 3 }
// The inner face of the garage's frame, as its owner builds it: 9.1 px inside the layout's `SPIRAL.frame`.
export const FRAME_IN = SPIRAL.frame * BALL - 9.1
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

const KEEP = ['street.police.foot', 'street.inlane.right', 'street.outlane.right']

// How far a place on the floor is from the nearest opening a ball must pass, in pixels.
function clearOf(z: Zone, x: number, y: number): number {
  let best = Infinity
  for (const o of table.openings.filter((q) => KEEP.includes(q.id))) {
    const a = localBalls(z, o.a[0], o.a[1])
    const b = localBalls(z, o.b[0], o.b[1])
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)))
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t))
  }
  return best
}

// A trestle under a hoop: two legs welded to the under wires and spread to two foot plates, with a rung at every ball of height.
function trestle(b: Bag, fine: Bag, f: Frame, turn: number): void {
  const tops = [-1, 1].map((side) => put(f, side * TRACK.under, TRACK.underUp - TRACK.wire * 0.6))
  const tall = Math.min(tops[0]![2], tops[1]![2])
  const spread = Math.min(20, tall * 0.1)
  const r = tall > 240 ? 4.2 : tall > 96 ? 3.6 : TRACK.wire + 0.4
  const feet = tops.map((p, i) => [p[0] + f.side[0] * (i * 2 - 1) * spread, p[1] + f.side[1] * (i * 2 - 1) * spread, 2.4] as V3)
  const at = (i: number, h: number): V3 => {
    const k = (h - feet[i]![2]) / (tops[i]![2] - feet[i]![2])
    return [feet[i]![0] + (tops[i]![0] - feet[i]![0]) * k, feet[i]![1] + (tops[i]![1] - feet[i]![1]) * k, h]
  }
  for (let i = 0; i < 2; i++) {
    footPlate(b, fine, feet[i]![0], feet[i]![1], turn)
    b.add(rod(feet[i]!, tops[i]!, r, 8, r * 0.8), WIRE)
    b.add(lathe([[r + 2.6, 2.4], [r + 2.6, 7], [r + 1, 9], [r, 9.6]], 10), PLATE, mat({ x: feet[i]![0], y: feet[i]![1] }))
    fine.add(ball(TRACK.bead + 0.6, 8, 6), BEAD, mat({ x: tops[i]![0], y: tops[i]![1], z: tops[i]![2] + 0.6, s: [1.25, 1.25, 0.8] }))
  }
  for (let h = tall - 64; h > 44; h -= BALL) {
    const p = at(0, h)
    const q = at(1, h)
    b.add(rod(p, q, 2.3, 6), WIRE)
    for (const e of [p, q]) fine.add(ball(TRACK.bead - 0.2, 8, 6), BEAD, mat({ x: e[0], y: e[1], z: e[2] }))
  }
  if (tall > 240) {
    const h0 = 44 + ((tall - 64 - 44) % BALL)
    b.add(rod(at(0, 14), at(1, h0), 2, 6), WIRE)
    b.add(rod(at(1, 14), at(0, h0), 2, 6), WIRE)
  }
}

function highway(z: Zone, b: Bag, fine: Bag): Frame[] {
  const pts = pathOf(z, 'highway')
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const frames = framesOf(curve, 16)
  const line = (across: number, up: number, from = 0): V3[] => frames.filter((f) => f.s >= from).map((f) => put(f, across, up))
  const e = frames[frames.length - 1]!
  for (const side of [-1, 1]) {
    b.add(wire(line(side * TRACK.under, TRACK.underUp), TRACK.wire, 8, 1), WIRE)
    b.add(wire(line(side * TRACK.side, TRACK.sideUp, 40), TRACK.wire, 8, 1), WIRE)
    const a = frames.find((f) => f.s >= 40)!
    b.add(wire([put(a, side * TRACK.side, TRACK.sideUp), put(a, side * (TRACK.side + 3), TRACK.sideUp - 6, -14), put(a, side * (TRACK.side + 10), TRACK.sideUp - 18, -26)], TRACK.wire, 8, 4), WIRE)
    for (const [across, up] of [[TRACK.under, TRACK.underUp], [TRACK.side, TRACK.sideUp]] as const) {
      const p = put(e, side * across, up)
      b.add(ball(TRACK.wire, 8, 6), WIRE, mat({ x: p[0], y: p[1], z: p[2] }))
    }
  }
  const total = e.s
  const count = Math.floor((total - 90) / TRACK.every)
  const first = 70 + (total - 90 - count * TRACK.every) / 2
  for (let k = 0; k <= count; k++) {
    const want = first + k * TRACK.every
    const f = frames.reduce((best, x) => (Math.abs(x.s - want) < Math.abs(best.s - want) ? x : best))
    const open = 104 * DEG
    const arc: V3[] = []
    for (let i = 0; i <= 14; i++) {
      const a = -open + (i / 14) * open * 2
      arc.push(put(f, Math.sin(a) * TRACK.hoopR, TRACK.centre - Math.cos(a) * TRACK.hoopR))
    }
    b.add(wire(arc, TRACK.hoop, 8, 1), WIRE)
    for (const side of [-1, 1]) {
      for (const [across, up] of [[TRACK.under, TRACK.underUp], [TRACK.side, TRACK.sideUp]] as const) {
        const d = put(f, side * across * 1.035, up + (up - TRACK.centre) * 0.035)
        fine.add(ball(TRACK.bead, 8, 6), BEAD, mat({ x: d[0], y: d[1], z: d[2], s: [1.25, 1.25, 0.8] }))
      }
    }
    const low = put(f, 0, TRACK.centre - TRACK.hoopR)
    const stand = [-1, 1].every((side) => {
      const p = put(f, side * (TRACK.under + 20), 0)
      return clearOf(z, p[0], p[1]) > CLEARANCE + 16
    })
    if (low[2] > 16 && stand) trestle(b, fine, f, Math.atan2(f.along[1], f.along[0]))
  }
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

// The clear trough of the garage: it starts under the end of the highway, winds down round its newel and ends open over the inlane. The last point of the rail is the ball's fall, so the trough stops one point short of it.
function spiral(z: Zone, clear: Bag): void {
  const all = pathOf(z, 'spiral')
  const pts = all.slice(1, all.length - 1)
  pts.unshift(new THREE.Vector3(all[0]!.x, all[0]!.y, all[1]!.z))
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const flat = framesOf(curve, 13).map((f) => ({ ...f, up: [0, 0, 1] as V3 }))
  const h = TROUGH.half
  const t = TROUGH.wall
  const top = TROUGH.tall
  const u = -TROUGH.under
  const c: [number, number] = [pts[1]!.x + SPIRAL.r * BALL, pts[1]!.y]
  clear.add(sweep([[-h - t, u], [h + t, u], [h + t, u + t], [-h - t, u + t]], flat), CLEAR, undefined, 0.035)
  const far = (f: Frame): number => Math.hypot(f.at[0] - c[0], f.at[1] - c[1])
  const probe = flat[Math.floor(flat.length / 2)]!
  const inner = probe.side[0] * (probe.at[0] - c[0]) + probe.side[1] * (probe.at[1] - c[1]) > 0 ? -1 : 1
  // Round the helix the newel is the inner wall. The inner wall of the trough stands only on its two straight ends.
  const lead = flat.findIndex((f) => far(f) < SPIRAL.r * BALL + 2)
  const trail = flat.length - 1 - [...flat].reverse().findIndex((f) => far(f) < SPIRAL.r * BALL + 2)
  const runs: Frame[][] = [flat]
  const ends: Frame[][] = [flat.slice(0, lead + 2), flat.slice(trail - 1)].filter((r) => r.length > 1)
  for (const side of [-1, 1]) {
    const wall: V2[] = [[side * h, u + t], [side * (h + t), u + t], [side * (h + t), top], [side * (h + 1), top]]
    if (side < 0) wall.reverse()
    const lip: V2[] = [[side * (h - 1.5), top], [side * (h + t + 1), top], [side * (h + t + 1), top + 3.6], [side * (h - 1.5), top + 3.6]]
    if (side < 0) lip.reverse()
    const foot: V2[] = [[side * (h + t - 3), u - 0.8], [side * (h + t + 0.6), u - 0.8], [side * (h + t + 0.6), u + 0.8], [side * (h + t - 3), u + 0.8]]
    if (side < 0) foot.reverse()
    for (const run of side === inner ? ends : runs) {
      clear.add(sweep(wall, run), CLEAR, undefined, 0.09)
      clear.add(sweep(lip, run), CLEAR_EDGE, undefined, 0.78)
      clear.add(sweep(foot, run), CLEAR_EDGE, undefined, 0.36)
    }
  }
  const first = flat[0]!
  const back = Math.atan2(first.side[1], first.side[0])
  clear.add(box(2 * (h + t), t, top - u), CLEAR, mat({ x: first.at[0], y: first.at[1], z: first.at[2] + (top + u) / 2, rz: back }), 0.1)
  const z0 = flat[flat.length - 1]!.at[2] + u
  const z1 = first.at[2] + top + 8
  const core = SPIRAL.r * BALL - h
  clear.add(lathe([[0, z0 - 6], [core - 2, z0 - 6], [core, z0 - 3], [core, z1 - 3], [core - 2, z1], [0, z1]], 20), CLEAR, mat({ x: c[0], y: c[1] }), 0.14)
  clear.add(lathe([[core - 2.4, z1 - 0.4], [core + 0.6, z1 - 3], [core + 0.6, z1 - 6], [core - 0.2, z1 - 6]], 20), CLEAR_EDGE, mat({ x: c[0], y: c[1] }), 0.7)
  let tab = -1
  for (let i = 2; i < flat.length - 2; i++) {
    const f = flat[i]!
    const dx = f.at[0] - c[0]
    const dy = f.at[1] - c[1]
    const d = Math.hypot(dx, dy)
    const quarter = Math.floor(Math.atan2(dy, dx) / (Math.PI / 2) + 4)
    if (Math.abs(d - SPIRAL.r * BALL) < 3 && quarter !== tab) {
      if (tab >= 0) {
        const from = d + h + t - 1
        const mid = (from + FRAME_IN) / 2
        clear.add(box(FRAME_IN - from, 13, 3), CLEAR, mat({ x: c[0] + (dx / d) * mid, y: c[1] + (dy / d) * mid, z: f.at[2] + u + 1.5, rz: Math.atan2(dy, dx) }), 0.22)
      }
      tab = quarter
    }
  }
}

interface Built { flap: THREE.Mesh | null; down: number }

export const flapLift = (open: number): number => (1 - Math.max(0, Math.min(1, open))) * FLAP.lift

export const ramps = whole('ramps', {
  version: 'play-ramps-15',
  build(z) {
    const g = new THREE.Group()
    g.name = `play.ramps.${z.id}`
    const m = matsOf(z)
    const fixed = new Bag()
    const fine = new Bag()
    const clear = new Bag(true)
    const built: Built = { flap: null, down: 0 }
    const frames = highway(z, fixed, fine)
    spiral(z, clear)
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
