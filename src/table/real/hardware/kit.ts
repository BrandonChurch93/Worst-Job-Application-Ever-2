import * as THREE from 'three'
import { BALL, TIER_Y } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { TUBE } from '../frame/loader'
import { Geo, type RGB, type V2, type V3 } from './geo'
import { FIN, Screws, TONE, shade } from './mats'

export { TUBE }

// A place on a tier, given in balls across and down the tier, in the frame of the tier's zone.
export const spot = (z: Zone, u: number, v: number): V2 => {
  const p = localBalls(z, u, TIER_Y[z.tier]! + v)
  return [p[0], p[1]]
}
export const flat = (z: Zone, c: [number, number]): V2 => {
  const p = localBalls(z, c[0], c[1])
  return [p[0], p[1]]
}

const unit2 = (x: number, y: number): V2 => {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

// The collar a wire or a post stands in where it enters the floor, with its washer.
export function foot(G: Geo, x: number, y: number, r: number, tone: RGB = TONE.alu): void {
  G.f(FIN.alu).lathe([[r + 4.2, 0.3], [r + 4.2, 1.2], [r + 2.4, 1.6], [r + 2.4, 3.6], [r, 4.6]], x, y, 10, tone)
}

// A wire bent out of the floor, along the points at a height, and back into the floor. Corners are rounded.
export function wire(G: Geo, F: Geo, pts: V2[], h: number, r: number, o: { legs?: number[]; feet?: boolean; tone?: RGB; round?: number } = {}): void {
  const tone = o.tone ?? TONE.steel
  const bend = Math.min(9, h * 0.45)
  const path: V3[] = []
  const a = pts[0]!
  const d0 = unit2(pts[1]![0] - a[0], pts[1]![1] - a[1])
  path.push([a[0], a[1], -1], [a[0], a[1], h - bend])
  for (let i = 1; i <= 3; i++) {
    const t = (i / 3) * (Math.PI / 2)
    path.push([a[0] + d0[0] * bend * (1 - Math.cos(t)), a[1] + d0[1] * bend * (1 - Math.cos(t)), h - bend + bend * Math.sin(t)])
  }
  const R = o.round ?? 8
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1]!
    const b = pts[i]!
    const c = pts[i + 1]!
    const rr = Math.min(R, Math.hypot(b[0] - p[0], b[1] - p[1]) * 0.45, Math.hypot(c[0] - b[0], c[1] - b[1]) * 0.45)
    const u0 = unit2(p[0] - b[0], p[1] - b[1])
    const u1 = unit2(c[0] - b[0], c[1] - b[1])
    for (let k = 0; k <= 4; k++) {
      const t = k / 4
      const w0 = (1 - t) * (1 - t)
      const w1 = 2 * t * (1 - t)
      const w2 = t * t
      path.push([(b[0] + u0[0] * rr) * w0 + b[0] * w1 + (b[0] + u1[0] * rr) * w2, (b[1] + u0[1] * rr) * w0 + b[1] * w1 + (b[1] + u1[1] * rr) * w2, h])
    }
  }
  const e = pts[pts.length - 1]!
  const q = pts[pts.length - 2]!
  const d1 = unit2(q[0] - e[0], q[1] - e[1])
  for (let i = 3; i >= 1; i--) {
    const t = (i / 3) * (Math.PI / 2)
    path.push([e[0] + d1[0] * bend * (1 - Math.cos(t)), e[1] + d1[1] * bend * (1 - Math.cos(t)), h - bend + bend * Math.sin(t)])
  }
  path.push([e[0], e[1], h - bend], [e[0], e[1], -1])
  G.f(FIN.steel).pipe(path, r, 7, tone)
  if (o.feet !== false) {
    foot(F, a[0], a[1], r)
    foot(F, e[0], e[1], r)
  }
  for (const i of o.legs ?? []) {
    const p = pts[i]!
    G.f(FIN.steel).pipe([[p[0], p[1], -1], [p[0], p[1], h - r * 0.4]], r * 0.92, 7, tone)
    foot(F, p[0], p[1], r)
    F.f(FIN.steel).ball(p[0], p[1], h - r * 0.9, r * 1.28, 8, shade(tone, 0.82))
  }
}

// A frame on a path: where it is and which way it runs, with the tube's own top.
export function frameAt(path: V3[], s: number): { at: THREE.Vector3; m: THREE.Matrix4; flat: boolean } | null {
  let left = s
  for (let i = 1; i < path.length; i++) {
    const a = new THREE.Vector3(...path[i - 1]!)
    const b = new THREE.Vector3(...path[i]!)
    const d = a.distanceTo(b)
    if (left <= d || i === path.length - 1) {
      const t = b.clone().sub(a).normalize()
      const up = Math.abs(t.z) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
      const side = new THREE.Vector3().crossVectors(up, t).normalize()
      const top = new THREE.Vector3().crossVectors(t, side).normalize()
      const at = a.clone().lerp(b, d > 0 ? Math.min(1, left / d) : 0)
      return { at, m: new THREE.Matrix4().makeBasis(side, top, t).setPosition(at), flat: Math.abs(t.z) < 0.05 }
    }
    left -= d
  }
  return null
}

export const lengthOf = (path: V3[]): number => {
  let d = 0
  for (let i = 1; i < path.length; i++) d += Math.hypot(path[i]![0] - path[i - 1]![0], path[i]![1] - path[i - 1]![1], path[i]![2] - path[i - 1]![2])
  return d
}

// The collar of the one clear tube, as the frame's owner wrote it down: turned aluminium with a groove and two screws on top.
export function collar(G: Geo, S: Screws, f: { m: THREE.Matrix4 }, o: { long?: number; out?: number; tone?: RGB; fin?: number; screws?: boolean } = {}): void {
  const from = G.vertices
  const c = (o.long ?? TUBE.collar) / 2
  const r = o.out ?? TUBE.collarOut
  const tone = o.tone ?? TONE.alu
  const outline: V2[] = [[TUBE.outer + 0.2, -c], [r - 2, -c], [r, -c + 2], [r, -3.4], [r - 1.6, -2.4], [r - 1.6, 2.4], [r, 3.4], [r, c - 2], [r - 2, c], [TUBE.outer + 0.2, c]]
  G.f(o.fin ?? FIN.alu).lathe(outline, 0, 0, 20, (i) => (i === 4 ? shade(tone, 0.72) : tone))
  G.move(from, f.m)
  if (o.screws === false) return
  for (const side of [-1, 1]) {
    const a = Math.PI / 2 + side * 0.5
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
    const p = dir.clone().multiplyScalar(r).add(new THREE.Vector3(0, 0, side * 6.5)).applyMatrix4(f.m)
    S.add(p.x, p.y, p.z, 0.62, dir.transformDirection(f.m))
  }
}

// A strap over the top half of the tube with a leg and a screwed foot each side.
export function clamp(G: Geo, S: Screws, f: { at: THREE.Vector3; m: THREE.Matrix4 }, ground: number): void {
  const from = G.vertices
  const w = TUBE.clampWide / 2
  const r0 = TUBE.outer + 0.3
  const r1 = r0 + TUBE.strap
  const down = f.at.z - ground
  G.f(FIN.steel).lathe([[r0, -w], [r1, -w], [r1, w], [r0, w]], 0, 0, 12, TONE.steel, 0, [0, Math.PI])
  for (const side of [-1, 1]) {
    const x0 = side > 0 ? r0 : -r1
    const x1 = side > 0 ? r1 : -r0
    const from2 = G.vertices
    G.box(x0, x1, -w, w, -down, 0, TONE.steel, { along: [0, 0, 1] })
    G.box(side > 0 ? r1 : -r1 - 8.5, side > 0 ? r1 + 8.5 : -r1, -w, w, -down, -down + TUBE.strap, TONE.steel)
    G.move(from2, new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    const p = new THREE.Vector3(side * (r1 + 4.4), -down + TUBE.strap, 0).applyMatrix4(f.m)
    S.add(p.x, p.y, p.z, 0.55)
  }
  G.move(from, f.m)
}

// A path with its corners rounded, as the tube is bent.
export function rounded(points: V3[], bend: number, steps = 8): V3[] {
  const pts = points.map((p) => new THREE.Vector3(...p))
  const out: V3[] = [points[0]!]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const c = pts[i + 1]!
    const r = Math.min(bend, a.distanceTo(b) * 0.45, b.distanceTo(c) * 0.45)
    const p0 = b.clone().add(a.clone().sub(b).setLength(r))
    const p1 = b.clone().add(c.clone().sub(b).setLength(r))
    for (let k = 0; k <= steps; k++) {
      const t = k / steps
      const v = p0.clone().multiplyScalar((1 - t) * (1 - t)).add(b.clone().multiplyScalar(2 * t * (1 - t))).add(p1.clone().multiplyScalar(t * t))
      out.push([v.x, v.y, v.z])
    }
  }
  out.push(points[points.length - 1]!)
  return out
}

// The two shells of the clear tube along a path.
export function shells(C: Geo, path: V3[]): void {
  C.pipe(path, TUBE.outer, TUBE.sides, [1, 1, 1])
  C.pipe(path, TUBE.outer - TUBE.wall, TUBE.sides, [1, 1, 1], true)
}

// A coil spring along z from 0 to `long`.
export function coil(G: Geo, radius: number, thick: number, turns: number, long: number, tone: RGB): void {
  const path: V3[] = []
  const n = Math.round(turns * 14)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = t * turns * Math.PI * 2
    const flatEnd = Math.min(1, t * turns, (1 - t) * turns)
    const zz = long * (t + (0.5 - t) * 0.12 * (1 - flatEnd))
    path.push([radius * Math.cos(a), radius * Math.sin(a), zz])
  }
  G.pipe(path, thick, 5, tone)
}

export const PX = BALL
