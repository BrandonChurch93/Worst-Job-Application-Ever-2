import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, OUTLET, PORT, railOf } from '../../layout'
import { local, localBalls, type Zone } from '../zone'
import { Geo, type V2, type V3 } from './geo'
import { Screws, TONE, aluOf, clearOf, hex, mesh, screwOf } from './mats'

// The one clear tube of the machine. The feed tube is built to it here; the drain tube and the lift tube are to be built to the same.
export const TUBE = { outer: 53, wall: 3.6, sides: 24, opacity: 0.05, collar: 22, collarOut: 58.5, ferrule: 9, ferruleOut: 56, collarStep: 5.1 * BALL, clampStep: 5.1 * BALL, clampWide: 5, strap: 2, bend: 1.1 * BALL }
const RING = { height: 26, lip: 6, floor: 2.4, slot: 2, mouth: 6, dish: 34, cuts: 7 }
const BED = { height: 6, land: 5 }
const CUP: [number, number, number] = [0.02, 0.021, 0.024]
const BAND = hex(0x3c3f43)
const FACE = hex(0x74787c)
const EDGE = hex(0x5a5e62)

// The middle line of the tube on the page, in page pixels, its corners rounded.
function line(): V3[] {
  const pts = railOf('feed').points.map((p) => new THREE.Vector3(p[0] * BALL, p[1] * BALL, p[2] * BALL + BALL / 2))
  const out: V3[] = []
  const push = (v: THREE.Vector3): void => {
    out.push([v.x, v.y, v.z])
  }
  push(pts[0]!)
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const c = pts[i + 1]!
    const r = Math.min(TUBE.bend, a.distanceTo(b) * 0.45, b.distanceTo(c) * 0.45)
    const p0 = b.clone().add(a.clone().sub(b).setLength(r))
    const p1 = b.clone().add(c.clone().sub(b).setLength(r))
    for (let k = 0; k <= 8; k++) {
      const t = k / 8
      push(p0.clone().multiplyScalar((1 - t) * (1 - t)).add(b.clone().multiplyScalar(2 * t * (1 - t))).add(p1.clone().multiplyScalar(t * t)))
    }
  }
  const last = pts[pts.length - 1]!
  const before = pts[pts.length - 2]!
  push(last.clone().add(before.clone().sub(last).setLength(0.62 * BALL)))
  // No length is longer than a quarter of a screen, so every zone the tube crosses has points of its own.
  const fine: V3[] = [out[0]!]
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1]!
    const b = out[i]!
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 240))
    for (let k = 1; k <= n; k++) fine.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, a[2] + ((b[2] - a[2]) * k) / n])
  }
  return fine
}

// The part of the line that lies in a zone, in the zone's frame, and how far along the whole line it starts.
function inZone(z: Zone): { path: V3[]; from: number; first: boolean; last: boolean } {
  const all = line()
  const path: V3[] = []
  let run = 0
  let from = -1
  const y0 = z.top
  const y1 = z.top + z.height
  const put = (p: V3): void => {
    path.push(local(z, p[0], p[1], p[2] + 0) as V3)
  }
  const inside = (p: V3): boolean => p[1] >= y0 && p[1] < y1
  for (let i = 0; i < all.length; i++) {
    const p = all[i]!
    if (i > 0) {
      const a = all[i - 1]!
      if (inside(a) !== inside(p)) {
        const edge = inside(p) ? (a[1] < y0 ? y0 : y1) : p[1] < y0 ? y0 : y1
        const t = (edge - a[1]) / (p[1] - a[1])
        const cut: V3 = [a[0] + (p[0] - a[0]) * t, edge, a[2] + (p[2] - a[2]) * t]
        if (from < 0) from = run + Math.hypot(cut[0] - a[0], cut[1] - a[1], cut[2] - a[2])
        put(cut)
      }
      run += Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2])
    }
    if (inside(p)) {
      if (from < 0) from = run
      put(p)
    }
  }
  return { path, from: Math.max(0, from), first: all.length > 0 && inside(all[0]!), last: all.length > 0 && inside(all[all.length - 1]!) }
}

// The path from a way along it on.
function trim(path: V3[], cut: number): V3[] {
  let left = cut
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    if (left < d) {
      const t = left / d
      return [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], ...path.slice(i)]
    }
    left -= d
  }
  return path
}

const frameAt = (path: V3[], s: number): { at: THREE.Vector3; m: THREE.Matrix4; flat: boolean } | null => {
  let left = s
  for (let i = 1; i < path.length; i++) {
    const a = new THREE.Vector3(...path[i - 1]!)
    const b = new THREE.Vector3(...path[i]!)
    const d = a.distanceTo(b)
    if (left <= d) {
      const t = b.clone().sub(a).normalize()
      const up = new THREE.Vector3(0, 0, 1)
      const side = new THREE.Vector3().crossVectors(up, t).normalize()
      const top = new THREE.Vector3().crossVectors(t, side).normalize()
      const at = a.clone().lerp(b, d > 0 ? left / d : 0)
      return { at, m: new THREE.Matrix4().makeBasis(side, top, t).setPosition(at), flat: Math.abs(t.z) < 0.05 }
    }
    left -= d
  }
  return null
}

function collar(A: Geo, screws: Screws, f: { at: THREE.Vector3; m: THREE.Matrix4 }): void {
  const from = A.vertices
  const c = TUBE.ferrule / 2
  const o = TUBE.ferruleOut
  const outline: V2[] = [[TUBE.outer + 0.2, -c], [o - 1.2, -c], [o, -c + 1.2], [o, c - 1.2], [o - 1.2, c], [TUBE.outer + 0.2, c]]
  A.lathe(outline, 0, 0, 28, TONE.aluDark)
  A.move(from, f.m)
  for (const side of [-1, 1]) {
    const a = Math.PI / 2 + side * 0.5
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
    const p = dir.clone().multiplyScalar(o).add(new THREE.Vector3(0, 0, 0)).applyMatrix4(f.m)
    screws.add(p.x, p.y, p.z, 0.45, side, dir.transformDirection(f.m))
  }
}

function clamp(A: Geo, screws: Screws, f: { at: THREE.Vector3; m: THREE.Matrix4 }, ground: number): void {
  const from = A.vertices
  const w = TUBE.clampWide / 2
  const r0 = TUBE.outer + 0.3
  const r1 = r0 + TUBE.strap
  const drop = f.at.z - ground
  A.lathe([[r0, -w], [r1, -w], [r1, w], [r0, w]], 0, 0, 20, TONE.aluBright, 0, [0, Math.PI])
  for (const side of [-1, 1]) {
    const x0 = side > 0 ? r0 : -r1
    const x1 = side > 0 ? r1 : -r0
    const from2 = A.vertices
    A.box(x0, x1, -w, w, -drop, 0, TONE.aluBright, { along: [0, 0, 1] })
    A.box(side > 0 ? r1 : -r1 - 11, side > 0 ? r1 + 11 : -r1, -w, w, -drop, -drop + TUBE.strap, TONE.aluBright)
    A.move(from2, new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    const p = new THREE.Vector3(side * (r1 + 5.5), -drop + TUBE.strap, 0).applyMatrix4(f.m)
    screws.add(p.x, p.y, p.z, 0.6, side * 0.8)
  }
  A.move(from, f.m)
}

function port(A: Geo, screws: Screws, z: Zone, c: { x: number; y: number; ring: number; cup: number }, toward: number | null = null): void {
  const p = localBalls(z, c.x, c.y)
  const R = (c.ring / 2) * BALL
  const r = (c.cup / 2) * BALL
  const h = RING.height
  const bowl: V2[] = []
  for (let i = 1; i <= RING.cuts; i++) {
    const t = (i / RING.cuts) * (Math.PI / 2)
    bowl.push([r + RING.lip - (RING.lip + RING.dish) * (1 - Math.cos(t)), h - 3 - (h - 3 - RING.floor) * Math.sin(t)])
  }
  const outline: V2[] = [[R, 0], [R, h - 5], [R - 5, h], [R - 22, h], [R - 24, h - 2.2], [R - 34, h - 2.2], [R - 36, h], [r + RING.lip + 4, h], [r + RING.lip, h - 3], ...bowl]
  const tone = (i: number): [number, number, number] => (i >= 8 ? CUP : i === 4 ? BAND : i === 1 || i === 7 ? EDGE : FACE)
  const first = A.vertices
  if (toward === null) A.lathe(outline, p[0], p[1], 72, tone)
  else {
    // The tube leaves through a slot cut in the ring, and lies there on a dark bed; the bowl is whole, and the tube's mouth stands out of its wall.
    const half = TUBE.outer + RING.slot
    A.slotted(outline.slice(0, 9), p[0], p[1], 72, tone, toward, half)
    A.lathe(outline.slice(8), p[0], p[1], 72, CUP)
    const from = A.vertices
    const wall = Math.sqrt(Math.max(0, (r + RING.lip) * (r + RING.lip) - half * half))
    A.box(wall, Math.sqrt(R * R - half * half), -half, half, 0, RING.floor, EDGE)
    A.move(from, new THREE.Matrix4().makeTranslation(p[0], p[1], 0).multiply(new THREE.Matrix4().makeRotationZ(toward)))
  }
  // The ring's brushed face is dark toward the top of the page and light toward its lower right, as a turned face under one soft lamp.
  A.tint(first, (x, y, zz) => (zz < h - 6 ? 1 : 1.25 - 0.8 * Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(y - p[1], x - p[0]) - 1.75), 1.2)))
  A.lathe([[r - RING.dish, RING.floor], [BALL * 0.62, RING.floor - 0.6], [BALL * 0.5, RING.floor - 1.6], [0, RING.floor - 1.8]], p[0], p[1], 48, (i) => (i === 0 ? CUP : [0.006, 0.006, 0.008]))
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4
    if (toward !== null && Math.cos(a - toward) > 0 && Math.abs(Math.sin(a - toward)) * (R - 29) < TUBE.outer + 14) continue
    screws.add(p[0] + (R - 29) * Math.cos(a), p[1] + (R - 29) * Math.sin(a), h - 2.2, 1.15, a * 3.1)
  }
}

export function loader(z: Zone, _ctx: RealContext): THREE.Object3D {
  const o = new THREE.Group()
  o.name = `loader.${z.id}`
  const A = new Geo()
  const G = new Geo()
  const screws = new Screws()
  const whole = inZone(z)
  const { first, last } = whole
  let { path, from } = whole
  if (first && path.length > 1) {
    // The tube's mouth stands at the wall of the cup, so the ball is seen lying in the cup before it goes.
    const cut = (PORT.cup / 2) * BALL - RING.mouth
    const a = path[0]!
    const b = path[1]!
    port(A, screws, z, PORT, Math.atan2(b[1] - a[1], b[0] - a[0]))
    path = trim(path, cut)
    from += cut
  } else if (z.id === 'first') port(A, screws, z, PORT)
  if (z.id === 'last') port(A, screws, z, OUTLET)
  if (path.length > 1) {
    G.pipe(path, TUBE.outer, TUBE.sides, [1, 1, 1])
    G.pipe(path, TUBE.outer - TUBE.wall, TUBE.sides, [1, 1, 1], true)
    let length = 0
    for (let i = 1; i < path.length; i++) length += Math.hypot(path[i]![0] - path[i - 1]![0], path[i]![1] - path[i - 1]![1], path[i]![2] - path[i - 1]![2])
    const ground = z.tier >= 0 ? -z.floor : 0
    // Collars stand at even steps along the whole tube, so they fall where they would if it were one piece; a clamp stands half a step from each.
    const step = TUBE.collarStep
    for (let s = Math.ceil((from + 30) / step) * step - from; s < length - 20; s += step) {
      const f = frameAt(path, s)
      if (f) collar(A, screws, f)
    }
    for (let s = Math.ceil((from + 30 - step / 2) / step) * step + step / 2 - from; s < length - 20; s += TUBE.clampStep) {
      const f = frameAt(path, s)
      if (f && f.flat && f.at.z - ground > 20 && f.at.z - ground < 90) clamp(A, screws, f, ground)
    }
    if (z.tier < 0) {
      // Over the page the tube lies in a bed: two low rails of aluminium cut to its round.
      const up = TUBE.outer + 0.6
      const edge = (h: number): number => Math.sqrt(up * up - (BALL / 2 - h) * (BALL / 2 - h))
      const bed: V2[] = [[edge(0), 0], [edge(3), 3], [edge(BED.height), BED.height], [edge(BED.height) + BED.land, BED.height], [edge(BED.height) + BED.land + 2, BED.height - 2], [edge(BED.height) + BED.land + 2, 0]]
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]!
        const b = path[i]!
        if (Math.abs(a[2] - BALL / 2) > 1.5 || Math.abs(b[2] - BALL / 2) > 1.5) continue
        A.prism(bed, [a[0], a[1]], [b[0], b[1]], TONE.alu, [false, false])
        A.prism(bed.map((q) => [-q[0], q[1]] as V2), [a[0], a[1]], [b[0], b[1]], TONE.alu, [false, false])
      }
    }
    if (first) {
      const f = frameAt(path, Math.min(length - 1, PORT.ring * BALL * 0.5 + TUBE.collar - from))
      if (f) collar(A, screws, f)
    }
    if (last) {
      const f = frameAt(path, length - TUBE.collar / 2 - 0.5)
      if (f) collar(A, screws, f)
    }
  }
  if (A.vertices > 0) o.add(mesh(A, aluOf(z), `loader.metal.${z.id}`))
  if (G.vertices > 0) {
    const tube = mesh(G, clearOf(z, 'tube', TUBE.opacity), `loader.tube.${z.id}`)
    tube.renderOrder = 3
    o.add(tube)
  }
  const sc = screws.mesh(screwOf(z), `loader.screws.${z.id}`)
  if (sc) o.add(sc)
  return o
}
