import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, OUTLET, PORT, railOf } from '../../layout'
import { local, localBalls, type Zone } from '../zone'
import { Geo, type V2, type V3 } from './geo'
import { TONE, aluOf, breathOf, clearOf, hex, mesh } from './mats'

// The one clear tube of the machine. The feed tube is built to it here; the drain tube and the lift tube are to be built to the same.
export const TUBE = { outer: 53, wall: 3.6, sides: 24, opacity: 0.05, collar: 22, collarOut: 58.5, ferrule: 9, ferruleOut: 56, collarStep: 5.1 * BALL, clampStep: 5.1 * BALL, clampWide: 5, strap: 2, bend: 1.1 * BALL }
const RING = { height: 26, lip: 6, floor: 2.4, slot: 2, mouth: 6, dish: 34, cuts: 9, seat: 13, seatLong: 26, rim: 7 }
// The shadow the tube lays on the page, toward the lower right.
const SHADE = { dx: 56, dy: -38, wide: 1, dark: 0.64, up: 0.5, ease: 70 }
// The rim of light in the port: how dim and how bright it breathes, and how many seconds one breath takes.
const GLOW = { low: 0.25, high: 0.95, seconds: 4.6 }
// The port's answer when the arrow is taken or the ball comes home: the ring is struck down for two frames, which from above is seen as the ring drawn in, and springs back, and the rim of light flashes and dies.
export const ANSWER = { hold: 2 / 60, shrink: 0.034, ring: 0.085, damp: 16, over: 0.32, flash: 3.2, fade: 0.075 }
// How far the ring is down, 1 to 0 and a little past it, `t` seconds after the contact.
export const dipOf = (t: number): number => {
  if (t < 0 || t >= ANSWER.over) return 0
  if (t < ANSWER.hold) return 1
  const u = t - ANSWER.hold
  return Math.exp(-ANSWER.damp * u) * Math.cos((Math.PI * 2 * u) / ANSWER.ring) * (1 - u / (ANSWER.over - ANSWER.hold))
}
// How bright the flash of the rim stands, 1 to 0.
export const flashOf = (t: number): number => (t < 0 || t >= ANSWER.over ? 0 : Math.exp(-t / ANSWER.fade) * (1 - t / ANSWER.over))
interface Ring { x: number; y: number; at: number; runs: { mesh: THREE.Mesh; from: number; rest: Float32Array }[] }
const CUP: [number, number, number] = [0.03, 0.032, 0.036]
// The colour a vertex of the rim of light carries: the tube's material knows it by its blue.
const RIM: [number, number, number] = [1, 1, 0]
const FACE = hex(0x8c9094)
const EDGE = hex(0x6a6e72)
const SOCKET = hex(0x3a3c40)

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

function collar(A: Geo, f: { at: THREE.Vector3; m: THREE.Matrix4 }, long = TUBE.ferrule, out = TUBE.ferruleOut): void {
  const from = A.vertices
  const c = long / 2
  const outline: V2[] = [[TUBE.outer + 0.2, -c], [out - 1.6, -c], [out, -c + 1.6], [out, c - 1.6], [out - 1.6, c], [TUBE.outer + 0.2, c]]
  A.lathe(outline, 0, 0, 28, (i) => (i === 2 ? TONE.aluBright : TONE.alu))
  A.move(from, f.m)
}

function clamp(A: Geo, f: { at: THREE.Vector3; m: THREE.Matrix4 }, ground: number): void {
  const from = A.vertices
  const heads: THREE.Vector3[] = []
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
    heads.push(new THREE.Vector3(side * (r1 + 5.5), -drop + TUBE.strap, 0).applyMatrix4(f.m))
  }
  A.move(from, f.m)
  // The screw of each foot is part of the same metal, so the tube costs no drawing for them.
  for (const p of heads) {
    A.lathe([[3, 0], [2.8, 0.55], [2.3, 0.8], [1.4, 0.8]], p.x, p.y, 10, TONE.aluBright, p.z)
    A.lathe([[1.4, 0.8], [1.26, 0.06], [0, 0.06]], p.x, p.y, 6, SOCKET, p.z)
  }
}

function port(A: Geo, G: Geo | null, z: Zone, c: { x: number; y: number; ring: number; cup: number }, toward: number | null = null): void {
  const p = localBalls(z, c.x, c.y)
  const R = (c.ring / 2) * BALL
  const r = (c.cup / 2) * BALL
  const h = RING.height
  const bowl: V2[] = [[r + RING.lip - RING.rim * 0.5, h - 3 - RING.rim]]
  for (let i = 1; i <= RING.cuts; i++) {
    const t = (i / RING.cuts) * (Math.PI / 2)
    bowl.push([r + RING.lip - (RING.lip + RING.dish) * (1 - Math.cos(t)), h - 3 - (h - 3 - RING.floor) * Math.sin(t)])
  }
  // The ring is one plain turned face of satin aluminium with a round outer edge and a bevel into the bowl.
  const outline: V2[] = [[R, 0], [R, h - 7], [R - 2, h - 2.4], [R - 7, h], [r + RING.lip + 5, h], [r + RING.lip, h - 3]]
  const tone = (i: number): [number, number, number] => (i === 1 || i === 2 || i === 4 ? EDGE : FACE)
  const first = A.vertices
  if (toward === null) A.lathe(outline, p[0], p[1], 72, tone)
  else {
    // The tube leaves through a slot cut in the ring: the rim is broken where it passes, and a collar on the ring's outside holds it.
    const half = TUBE.outer + RING.slot
    A.slotted(outline, p[0], p[1], 72, tone, toward, half)
    const from = A.vertices
    const wall = Math.sqrt(Math.max(0, (r + RING.lip) * (r + RING.lip) - half * half))
    A.box(wall, Math.sqrt(R * R - half * half), -half, half, 0, RING.floor, EDGE)
    A.move(from, new THREE.Matrix4().makeTranslation(p[0], p[1], 0).multiply(new THREE.Matrix4().makeRotationZ(toward)))
  }
  // The ring's brushed face is dark toward the top of the page and light toward its lower right, as a turned face under one soft lamp.
  const side = (x: number, y: number): number => Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(y - p[1], x - p[0]) - 1.75), 1.2)
  A.tint(first, (x, y, zz) => (zz < h - 8 ? 1 : 1.3 - 0.7 * side(x, y)))
  // Under the ring's lip a rim of light, then the plain dark bowl: lit from the upper left, so its lower right wall is the paler.
  if (G) G.lathe([[r + RING.lip, h - 3], bowl[0]!], p[0], p[1], 72, RIM)
  if (G) {
    // The ring's own soft shadow on the page, toward the lower right: drawn, so the port costs no drawing in the shadow pass.
    const cx = p[0] + SHADE.dx * 0.5
    const cy = p[1] + SHADE.dy * 0.5
    const rings: [number, number][] = [[R - 34, 1], [R, 1], [R + 14, 0.45], [R + 34, 0]]
    for (let k = 1; k < rings.length; k++) {
      for (let i = 0; i < 48; i++) {
        const a0 = (i / 48) * Math.PI * 2
        const a1 = ((i + 1) / 48) * Math.PI * 2
        const at = (rr: number, a: number): V3 => [cx + rr * Math.cos(a), cy + rr * Math.sin(a), SHADE.up]
        const c0: [number, number, number] = [0, rings[k - 1]![1] * SHADE.dark * 0.9, 0]
        const c1: [number, number, number] = [0, rings[k]![1] * SHADE.dark * 0.9, 0]
        G.shaded([at(rings[k - 1]![0], a0), at(rings[k]![0], a0), at(rings[k]![0], a1), at(rings[k - 1]![0], a1)], [0, 0, 1], [c0, c1, c1, c0])
      }
    }
  }
  const dark = A.vertices
  A.lathe([[r + RING.lip, h - 3], ...bowl], p[0], p[1], 72, CUP)
  A.lathe([[r - RING.dish, RING.floor], [BALL * 0.5, RING.floor - 1.2], [0, RING.floor - 1.6]], p[0], p[1], 72, CUP)
  A.tint(dark, (x, y) => 0.4 + 2.4 * side(x, y) * side(x, y))
}

export function loader(z: Zone, _ctx: RealContext): THREE.Object3D {
  const o = new THREE.Group()
  o.name = `loader.${z.id}`
  const A = new Geo()
  const G = new Geo()
  const whole = inZone(z)
  const { first, last } = whole
  let { path, from } = whole
  let seat = -1
  let ring: { a: [number, number]; g: [number, number]; x: number; y: number } | null = null
  const ringed = (c: { x: number; y: number }, build: () => void): void => {
    const a = A.vertices
    const g = G.vertices
    build()
    const q = localBalls(z, c.x, c.y)
    ring = { a: [a, A.vertices], g: [g, G.vertices], x: q[0], y: q[1] }
  }
  const run = (m: THREE.Mesh, r: [number, number]): { mesh: THREE.Mesh; from: number; rest: Float32Array } => ({ mesh: m, from: r[0], rest: (m.geometry.getAttribute('position').array as Float32Array).slice(r[0] * 3, r[1] * 3) })
  if (first && path.length > 1) {
    // The tube's mouth stands at the wall of the cup, so the ball is seen lying in the cup before it goes.
    const cut = (PORT.cup / 2) * BALL - RING.mouth
    const a = path[0]!
    const b = path[1]!
    ringed(PORT, () => port(A, G, z, PORT, Math.atan2(b[1] - a[1], b[0] - a[0])))
    path = trim(path, cut)
    from += cut
    seat = (PORT.ring / 2) * BALL - cut + RING.seatLong / 2 - 3
  } else if (z.id === 'first') ringed(PORT, () => port(A, G, z, PORT))
  if (z.id === 'last') ringed(OUTLET, () => port(A, G, z, OUTLET))
  if (path.length > 1) {
    G.pipe(path, TUBE.outer, TUBE.sides, [1, 1, 1])
    G.pipe(path, TUBE.outer - TUBE.wall, TUBE.sides, [1, 1, 1], true)
    let length = 0
    for (let i = 1; i < path.length; i++) length += Math.hypot(path[i]![0] - path[i - 1]![0], path[i]![1] - path[i - 1]![1], path[i]![2] - path[i - 1]![2])
    const ground = z.tier >= 0 ? -z.floor : 0
    // Collars stand at even steps along the whole tube, so they fall where they would if it were one piece; a clamp stands half a step from each.
    const step = TUBE.collarStep
    // On the page by the port the collars stand three to a step: the tube is seen to be held all the way from the ring.
    const near = first ? step / 3 : step
    for (let s = Math.ceil((from + 30) / near) * near - from; s < length - 20; s += near) {
      const f = frameAt(path, s)
      if (f && Math.abs(s - seat) > 60) first ? collar(A, f, 17, TUBE.outer + 7.5) : collar(A, f)
    }
    for (let s = Math.ceil((from + 30 - step / 2) / step) * step + step / 2 - from; s < length - 20; s += TUBE.clampStep) {
      const f = frameAt(path, s)
      if (f && f.flat && f.at.z - ground > 20 && f.at.z - ground < 90) clamp(A, f, ground)
    }
    if (z.tier < 0) {
      // Over the page the tube lays a soft shadow toward the lower right.
      const hw = TUBE.outer * SHADE.wide
      const cross: [number, number][] = [[-1.35, 0], [-0.8, 0.55], [-0.3, 1], [0.3, 1], [0.8, 0.55], [1.35, 0]]
      const start = seat > 0 ? seat + RING.seatLong / 2 : 0
      const at: number[] = [0]
      for (let i = 1; i < path.length; i++) at.push(at[i - 1]! + Math.hypot(path[i]![0] - path[i - 1]![0], path[i]![1] - path[i - 1]![1], path[i]![2] - path[i - 1]![2]))
      const row = (i: number): V3[] => {
        const a = path[Math.max(0, i - 1)]!
        const b = path[Math.min(path.length - 1, i + 1)]!
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        const q = path[i]!
        const k = 1 + (q[2] - BALL / 2) / (BALL * 2)
        return cross.map(([t]) => [q[0] + SHADE.dx * k - ((b[1] - a[1]) / l) * hw * t, q[1] + SHADE.dy * k + ((b[0] - a[0]) / l) * hw * t, SHADE.up] as V3)
      }
      const fade = (i: number): number => SHADE.dark * Math.min(1, Math.max(0, (at[i]! - start) / SHADE.ease))
      for (let i = 1; i < path.length; i++) {
        if (at[i]! <= start || Math.max(path[i - 1]![2], path[i]![2]) > BALL * 0.75) continue
        const r0 = row(i - 1)
        const r1 = row(i)
        for (let j = 0; j < cross.length - 1; j++) {
          const c = (n: number, m: number): [number, number, number] => [0, cross[m]![1] * fade(n), 0]
          G.shaded([r0[j]!, r0[j + 1]!, r1[j + 1]!, r1[j]!], [0, 0, 1], [c(i - 1, j), c(i - 1, j + 1), c(i, j + 1), c(i, j)])
        }
      }
    }
    if (seat > 0) {
      const f = frameAt(path, Math.min(length - 1, seat))
      if (f) collar(A, f, RING.seatLong, TUBE.outer + RING.seat)
      const g = frameAt(path, 3)
      if (g) collar(A, g, 6, TUBE.outer + 3.2)
    }
    if (last) {
      const f = frameAt(path, length - TUBE.collar / 2 - 0.5)
      if (f) collar(A, f)
    }
  }
  if (A.vertices > 0) {
    const metal = mesh(A, aluOf(z), `loader.metal.${z.id}`)
    o.add(metal)
    const r = ring as { a: [number, number]; g: [number, number]; x: number; y: number } | null
    if (r) o.userData.ring = { x: r.x, y: r.y, at: 0, runs: [run(metal, r.a)] } satisfies Ring
  }
  if (G.vertices > 0) {
    const tube = mesh(G, clearOf(z, 'tube', TUBE.opacity), path.length > 1 ? `loader.tube.${z.id}` : `loader.light.${z.id}`)
    tube.renderOrder = 3
    o.add(tube)
    const r = ring as { a: [number, number]; g: [number, number]; x: number; y: number } | null
    if (r && o.userData.ring) (o.userData.ring as Ring).runs.push(run(tube, r.g))
  }
  return o
}

// The rim of light in the port breathes slowly: it is the one thing on the resting page that moves. Both ports answer a contact: the page gives each ring the seconds since it.
export function loaderPose(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  if (z.id !== 'first' && z.id !== 'last') return
  const t = ctx.byId.get(z.id === 'first' ? 'loader.ring' : 'outlet.ring')?.v?.[0] ?? 9
  const rest = z.id === 'first' ? GLOW.low + (GLOW.high - GLOW.low) * (0.5 - 0.5 * Math.cos((ctx.time * Math.PI * 2) / GLOW.seconds)) : GLOW.low
  breathOf(z).value = rest + ANSWER.flash * flashOf(t)
  const r = o.userData.ring as Ring | undefined
  if (!r) return
  const d = dipOf(t)
  if (d === r.at) return
  r.at = d
  const k = 1 - ANSWER.shrink * d
  for (const part of r.runs) {
    const pos = part.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const a = pos.array as Float32Array
    for (let i = 0; i < part.rest.length; i += 3) {
      const j = part.from * 3 + i
      a[j] = r.x + (part.rest[i]! - r.x) * k
      a[j + 1] = r.y + (part.rest[i + 1]! - r.y) * k
    }
    pos.needsUpdate = true
  }
}
