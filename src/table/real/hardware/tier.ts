import * as THREE from 'three'
import { hash01 } from '../../../core/random'
import { BALL, COLS, MID, MOUTH, OUTLANE, PLUNGER, TH, TIERS, railOf, table } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { Geo, circleLoop, roundedLoop, type RGB, type V2, type V3 } from './geo'
import { flat, rounded, spot, wire } from './kit'
import { FIN, Screws, TONE, shade } from './mats'

// What the modellers of the tiers build on: the flat shoulder of a slingshot post, the band under it.
export const POST = { shoulder: 46, shoulderRadius: 7, band: 36, bandThick: 3.2, waist: 5.1, laneRing: 32 }
export const SLING = { bow: 0.2 * BALL, decay: 38, period: 0.085 }
export const GATE = { pin: 7, tall: 30, shut: -0.3, open: 1.45 }
export const WIRE = { radius: 3.1, height: 34, roofRadius: 2.7, roofHeight: 30 }

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function ring(G: Geo, F: Geo, x: number, y: number, zc: number, major: number, minor: number): void {
  const path: V3[] = []
  for (let i = 0; i < 14; i++) path.push([x + major * Math.cos((i / 14) * Math.PI * 2), y + major * Math.sin((i / 14) * Math.PI * 2), zc])
  G.f(FIN.rubber).pipe(path, minor, 6, TONE.rubber, false, [0, Math.PI * 2], true)
  const o = major + minor
  F.f(FIN.rubber).lathe([[o - 0.25, zc - 0.55], [o + 0.4, zc], [o - 0.25, zc + 0.55]], x, y, 10, TONE.rubberLine)
}

// The cap of a lane post, themed to its tier: a brass finial, a grey cap with a push pin in it, a small traffic bollard.
function cap(G: Geo, x: number, y: number, k: number): void {
  if (k === 0) {
    G.f(FIN.brass).lathe([[5.4, 50], [7, 50.8], [7, 52.6], [4.2, 54.4], [3.1, 56.6], [4.8, 59.4], [5.3, 62.2], [3.9, 65.6], [1.6, 67.4], [0, 67.8]], x, y, 10, (i) => (i === 3 ? TONE.brassDark : TONE.brass))
  } else if (k === 1) {
    G.f(FIN.satin).lathe([[5.4, 50], [7.3, 50.6], [7.3, 54.2], [6.3, 55.4], [2.6, 55.4]], x, y, 10, TONE.grey)
    G.f(FIN.steel).lathe([[1.1, 55.4], [1.1, 58]], x, y, 8, TONE.steel)
    G.f(FIN.gloss).lathe([[1.1, 57.6], [4.4, 58.2], [4.7, 59.6], [2.5, 61.2], [2.5, 64.6], [4.3, 66], [4.6, 67.4], [3.2, 68.5], [0, 68.8]], x, y, 10, TONE.pin)
  } else {
    G.f(FIN.satin).lathe([[5.4, 50], [7.4, 50.4], [7.4, 52.2], [5.6, 53.2]], x, y, 10, TONE.black)
    G.lathe([[5.6, 53.2], [5.3, 57], [5.1, 60.5], [4.9, 64], [4.6, 67], [3.4, 69.4], [0, 70]], x, y, 10, (i) => (i === 1 ? TONE.white : i === 3 ? TONE.black : TONE.yellow))
  }
}

function lanePost(G: Geo, F: Geo, x: number, y: number, k: number): void {
  F.f(FIN.alu).lathe([[9.2, 0], [9.2, 1.1], [7, 1.5]], x, y, 10, TONE.aluDark)
  G.f(FIN.steel).lathe([[7, 1.2], [7, 5], [6, 6.6], [6, 22], [6.9, 24], [3.6, 27.5], [3.6, 36.5], [6.9, 40], [6.9, 44], [5.4, 46], [5.4, 50]], x, y, 10, (i) => (i === 2 ? TONE.steelDim : TONE.steel))
  ring(G, F, x, y, POST.laneRing, 6.3, 3.3)
  cap(G, x, y, k)
}

function slingPost(G: Geo, F: Geo, x: number, y: number): void {
  const w = POST.waist
  const s = POST.shoulderRadius
  const b = POST.band
  F.f(FIN.alu).lathe([[9.6, 0], [9.6, 1.1], [7.2, 1.5]], x, y, 10, TONE.aluDark)
  G.f(FIN.steel).lathe([[s, 1.2], [s, 6], [6, 7.6], [6, 28], [s, 30], [w, b - 3.8], [w, b + 3.8], [s, b + 5.6], [s, POST.shoulder], [0, POST.shoulder]], x, y, 10, (i) => (i === 2 ? TONE.steelDim : TONE.steel))
}

function screwPost(G: Geo, F: Geo, S: Screws, x: number, y: number): void {
  F.f(FIN.alu).lathe([[8.6, 0], [8.6, 1.2], [6.4, 1.6]], x, y, 10, TONE.aluDark)
  G.f(FIN.zinc).lathe([[6.4, 1.2], [6.4, 45], [5.6, 46.2]], x, y, 6, TONE.zinc)
  F.f(FIN.alu).lathe([[5.6, 46.2], [8, 46.2], [8, 47.6], [5, 47.6]], x, y, 10, TONE.alu)
  S.add(x, y, 47.6, 0.9)
}

// One rubber ring round the three posts of a slingshot. The side that kicks is the one from a to c.
function band(B: Geo, tri: [V2, V2, V2], index: number): void {
  let pts: V2[] = [tri[0], tri[1], tri[2]]
  const area = (pts[1]![0] - pts[0]![0]) * (pts[2]![1] - pts[0]![1]) - (pts[2]![0] - pts[0]![0]) * (pts[1]![1] - pts[0]![1])
  if (area < 0) pts = [pts[0]!, pts[2]!, pts[1]!]
  const R = POST.waist + POST.bandThick
  const path: V3[] = []
  const normal = (p: V2, q: V2): V2 => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
    return [(q[1] - p[1]) / l, -(q[0] - p[0]) / l]
  }
  for (let i = 0; i < 3; i++) {
    const p = pts[i]!
    const q = pts[(i + 1) % 3]!
    const r = pts[(i + 2) % 3]!
    const n = normal(p, q)
    const n2 = normal(q, r)
    const kick = (p === tri[0] && q === tri[2]) || (p === tri[2] && q === tri[0])
    const cuts = kick ? 10 : 1
    for (let s = 0; s <= cuts; s++) path.push([p[0] + (q[0] - p[0]) * (s / cuts) + n[0] * R, p[1] + (q[1] - p[1]) * (s / cuts) + n[1] * R, POST.band])
    const a0 = Math.atan2(n[1], n[0])
    let a1 = Math.atan2(n2[1], n2[0])
    while (a1 < a0) a1 += Math.PI * 2
    for (let s = 1; s < 4; s++) path.push([q[0] + R * Math.cos(a0 + ((a1 - a0) * s) / 4), q[1] + R * Math.sin(a0 + ((a1 - a0) * s) / 4), POST.band])
  }
  const from = B.vertices
  B.f(FIN.rubber).pipe(path, POST.bandThick, 6, TONE.rubber, false, [0, Math.PI * 2], true)
  const a = tri[0]
  const c = tri[2]
  const b = tri[1]
  let n = normal(a, c)
  if ((b[0] - a[0]) * n[0] + (b[1] - a[1]) * n[1] > 0) n = [-n[0], -n[1]]
  const len = Math.hypot(c[0] - a[0], c[1] - a[1])
  const d: V2 = [(c[0] - a[0]) / len, (c[1] - a[1]) / len]
  B.morph(index, from, B.vertices, (x, y) => {
    const t = ((x - a[0]) * d[0] + (y - a[1]) * d[1]) / len
    const off = (x - a[0]) * n[0] + (y - a[1]) * n[1]
    if (t <= 0 || t >= 1 || off < R - POST.bandThick - 0.6) return null
    const k = Math.sin(Math.PI * t) * SLING.bow
    return [n[0] * k, n[1] * k, 0]
  })
}

// A strip between two loops of the same count, each at its own height.
function strip(G: Geo, a: V2[], za: number | ((i: number) => number), b: V2[], zb: number | ((i: number) => number), col: RGB | ((i: number) => RGB)): void {
  const n = a.length
  const h = (z: number | ((i: number) => number), i: number): number => (typeof z === 'function' ? z(i) : z)
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const p0: V3 = [a[i]![0], a[i]![1], h(za, i)]
    const p1: V3 = [a[j]![0], a[j]![1], h(za, j)]
    const q0: V3 = [b[i]![0], b[i]![1], h(zb, i)]
    const q1: V3 = [b[j]![0], b[j]![1], h(zb, j)]
    const e1 = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
    const e2 = new THREE.Vector3(q0[0] - p0[0], q0[1] - p0[1], q0[2] - p0[2])
    const nn = new THREE.Vector3().crossVectors(e1, e2)
    if (nn.lengthSq() < 1e-9) continue
    if (nn.z < 0) nn.negate()
    G.face([p0, p1, q1, q0], [nn.x, nn.y, nn.z], [e1.x, e1.y, e1.z], typeof col === 'function' ? col(i) : col)
  }
}

// A pocket lined with dark steel: a chamfered lip worn bright, a wall that falls away, a dark bottom. `back` is where the ramp rises, if it has one.
function pocket(G: Geo, at: (grow: number) => V2[], centre: V2, o: { lip?: number; high?: number; back?: V2 } = {}): void {
  const lip = o.lip ?? 5.5
  const h = o.high ?? 4.6
  const ramp = (loop: V2[]) => (i: number): number => {
    if (!o.back) return 0
    const p = loop[i]!
    const l = Math.hypot(p[0] - centre[0], p[1] - centre[1]) || 1
    return Math.max(0, ((p[0] - centre[0]) / l) * o.back[0] + ((p[1] - centre[1]) / l) * o.back[1])
  }
  G.f(FIN.zinc)
  strip(G, at(lip), 0.4, at(lip - 1.8), h, TONE.steelDim)
  strip(G, at(lip - 1.8), h, at(0.8), h, TONE.steel)
  G.f(FIN.steel)
  strip(G, at(0.8), h, at(-1.4), h - 1.5, TONE.steelDim)
  G.f(FIN.dark)
  const wall = at(-5)
  const deep = at(-17)
  const r1 = ramp(wall)
  const r2 = ramp(deep)
  strip(G, at(-1.4), h - 1.5, wall, (i) => 1.4 + r1(i) * (h - 3.4), (i) => mix(TONE.pocketWall, TONE.steelDim, r1(i) * 0.5))
  strip(G, wall, (i) => 1.4 + r1(i) * (h - 3.4), deep, (i) => 1 + r2(i) * 0.6, (i) => mix(TONE.pocketDeep, TONE.pocketWall, r2(i) * 0.9))
  G.slab(deep, 0.6, 1, TONE.pocket, { sides: false })
}

function chute(G: Geo, S: Screws, z: Zone, upper: number): void {
  const pts = railOf(`chute.${TIERS[upper]}`).points.map((p) => localBalls(z, p[0], p[1], p[2]) as V3)
  const path = rounded(pts, 46, 6)
  const x = path[0]![0]
  const w = 0.56 * BALL
  const t = 2.4
  const hw = 15
  const up = (p: V3, q: V3): V3 => {
    const l = Math.hypot(q[1] - p[1], q[2] - p[2]) || 1
    const n: V3 = [0, -(q[2] - p[2]) / l, (q[1] - p[1]) / l]
    return n[2] < 0 ? [0, -n[1], -n[2]] : n
  }
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i]!
    const q = path[i + 1]!
    const n = up(p, q)
    const along: V3 = [0, q[1] - p[1], q[2] - p[2]]
    // The transfer channel: a dark pressed floor with two polished runners the ball rides down on.
    G.f(FIN.dark).face([[x - w, p[1], p[2] + 0.8], [x + w, p[1], p[2] + 0.8], [x + w, q[1], q[2] + 0.8], [x - w, q[1], q[2] + 0.8]], n, along, shade(TONE.zinc, i % 2 === 0 ? 0.2 : 0.15))
    for (const side of [-1, 1]) {
      const xr = x + side * w * 0.42
      const lift = (e: V3, d: number): V3 => [e[0], e[1] + n[1] * d, e[2] + 0.8 + n[2] * d]
      G.f(FIN.steel).face([lift([xr - 1.5, p[1], p[2]], 2.2), lift([xr + 1.5, p[1], p[2]], 2.2), lift([xr + 1.5, q[1], q[2]], 2.2), lift([xr - 1.5, q[1], q[2]], 2.2)], n, along, TONE.chrome)
      for (const e of [-1, 1]) G.f(FIN.zinc).face([lift([xr + e * 2.6, p[1], p[2]], 0), lift([xr + e * 1.5, p[1], p[2]], 2.2), lift([xr + e * 1.5, q[1], q[2]], 2.2), lift([xr + e * 2.6, q[1], q[2]], 0)], [e * 0.9, n[1] * 0.44, n[2] * 0.44], along, shade(TONE.zinc, 0.45))
    }
    for (const side of [-1, 1]) {
      const xi = x + side * w
      const xo = x + side * (w + t)
      G.f(FIN.zinc).face([[xi, p[1], p[2]], [xi, q[1], q[2]], [xi, q[1], q[2] + hw], [xi, p[1], p[2] + hw]], [-side, 0, 0], along, shade(TONE.zinc, 0.34))
      G.face([[xo, p[1], p[2]], [xo, q[1], q[2]], [xo, q[1], q[2] + hw], [xo, p[1], p[2] + hw]], [side, 0, 0], along, shade(TONE.zinc, 0.4))
      G.f(FIN.steel).face([[xi, p[1], p[2] + hw], [xo, p[1], p[2] + hw], [xo, q[1], q[2] + hw], [xi, q[1], q[2] + hw]], n, along, TONE.chrome)
    }
  }
  const end = path[path.length - 1]!
  for (const side of [-1, 1]) {
    G.f(FIN.zinc).box(x + side * (w + t) - (side < 0 ? 15 : 0), x + side * (w + t) + (side > 0 ? 15 : 0), end[1] + 6, end[1] + 30, 0.4, 2.6, TONE.zinc)
    S.add(x + side * (w + t + 8), end[1] + 18, 2.6, 0.8)
  }
}

export interface Gate { mesh: Geo; at: V3 }

// The wire gate of the tier's exit, built round its pin.
function gate(G: Geo, S: Screws, z: Zone): Gate {
  const y = TH - 0.15
  const exit = table.openings.find((o) => o.tier === z.tier && o.id.endsWith('.exit'))!
  const a = spot(z, Math.min(exit.a[0], exit.b[0]), y)
  const b = spot(z, Math.max(exit.a[0], exit.b[0]), y)
  const half = (b[0] - a[0]) / 2 - 7
  const mid: V3 = [(a[0] + b[0]) / 2, a[1], GATE.pin]
  for (const side of [-1, 1]) {
    const x = mid[0] + side * (half + 3)
    G.f(FIN.zinc).box(x - 4, x + 4, mid[1] - 7, mid[1] + 7, 0.4, GATE.pin + 6, TONE.zinc, { bevel: 1.2 })
    G.box(x - 4, x + 4, mid[1] + 7, mid[1] + 24, 0.4, 2.6, TONE.zinc)
    S.add(x, mid[1] + 16.5, 2.6, 0.75)
  }
  const M = new Geo()
  M.f(FIN.steel).pipe([[-half, 0, 0], [half, 0, 0]], 2.6, 8, TONE.steel)
  const loop = rounded([[-half + 8, 0, 0], [-half + 8, 0, GATE.tall], [half - 8, 0, GATE.tall], [half - 8, 0, 0]], 7, 4)
  M.pipe(loop, 2.5, 8, TONE.steel)
  for (const s of [-0.34, 0.34]) M.pipe([[half * s, 0, 0], [half * s, 0, GATE.tall]], 2.2, 6, TONE.steel)
  return { mesh: M, at: mid }
}

export interface Tier { G: Geo; F: Geo; S: Screws; B: Geo; slings: string[]; kicks: string[]; gate: Gate; tip: Geo | null; tipAt: V3 }

// The ejector of a seat: a steel slug in a housing at the back of the pocket. It gives way when a ball lands and shoots across the pocket toward the mouth when the ball is sent out.
export const KICK = { reach: 0.92, back: 0.64, head: 15, rod: 6.5, high: 15, strike: 0.035, home: 0.1, give: 0.24, ring: 0.12 }
// How far out the slug stands, 0 at rest and 1 at full reach, from the seconds since a ball landed and since it was sent out.
export const kickOf = (sinceIn: number, sinceOut: number): number => {
  const out = sinceOut < 0 ? 0 : sinceOut < KICK.strike ? 0.45 + 0.55 * (sinceOut / KICK.strike) : Math.exp(-(sinceOut - KICK.strike) / KICK.home) * (sinceOut > 0.8 ? 0 : 1)
  const give = sinceIn < 0 || sinceIn > 0.6 ? 0 : -KICK.give * Math.exp(-7 * sinceIn) * Math.cos((2 * Math.PI * sinceIn) / KICK.ring)
  return out + give
}

function ejector(G: Geo, B: Geo, S: Screws, c: V2, toward: V2, r: number, index: number): void {
  const l = Math.hypot(toward[0] - c[0], toward[1] - c[1]) || 1
  const d: V2 = [(toward[0] - c[0]) / l, (toward[1] - c[1]) / l]
  const turn = Math.atan2(d[1], d[0])
  const place = (along: number): THREE.Matrix4 => new THREE.Matrix4().makeRotationZ(turn).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)).setPosition(c[0] + d[0] * along, c[1] + d[1] * along, KICK.high)
  // The housing straddles the far rim of the pocket.
  let from = G.vertices
  G.f(FIN.zinc).box(-r - 22, -r + 6, -19, 19, 0.4, KICK.high + 13, shade(TONE.zinc, 0.5), { bevel: 2.2, top: shade(TONE.zinc, 0.72) })
  G.f(FIN.dark).box(-r + 5.6, -r + 6.3, -9, 9, KICK.high - 8, KICK.high + 8, TONE.pocket)
  G.move(from, new THREE.Matrix4().makeRotationZ(turn).setPosition(c[0], c[1], 0))
  for (const side of [-1, 1]) S.add(c[0] - d[0] * (r + 8) - d[1] * side * 13, c[1] - d[1] * (r + 8) + d[0] * side * 13, KICK.high + 13, 0.75)
  from = B.vertices
  B.f(FIN.chrome).lathe([[KICK.rod, -r * 0.9], [KICK.rod, 0], [KICK.head - 2, 0], [KICK.head, 2], [KICK.head, 6], [KICK.head - 2.5, 8.5], [0, 9.4]], 0, 0, 14, (i) => (i === 0 ? TONE.steelDim : i === 5 ? TONE.rubberWorn : TONE.chrome))
  B.move(from, place(-r * KICK.back))
  B.morph(index, from, B.vertices, () => [d[0] * r * KICK.reach, d[1] * r * KICK.reach, 0])
}

// Everything the hardware has on one tier that stands still, with the parts that move kept apart.
export function tier(z: Zone): Tier {
  const k = z.tier
  const name = TIERS[k]!
  const G = new Geo()
  const F = new Geo()
  const B = new Geo()
  const S = new Screws()
  const slings: string[] = []
  const kicks: string[] = []

  for (const p of table.posts) {
    if (p.tier !== k || p.lamp) continue
    const c = flat(z, p.c)
    if (p.id.includes('.sling.post.')) slingPost(G, F, c[0], c[1])
    else if (p.id.includes('.lane.post.')) lanePost(G, F, c[0], c[1], k)
    else screwPost(G, F, S, c[0], c[1])
  }
  for (const s of table.slings) {
    if (s.tier !== k) continue
    band(B, [flat(z, s.a), flat(z, s.b), flat(z, s.c)], slings.length)
    slings.push(s.id)
  }

  const guides = table.segs.filter((s) => s.tier === k && s.kind === 'guide')
  const seg = (id: string): V2[] | null => {
    const s = guides.find((g) => g.id === `${name}.${id}`)
    return s ? [flat(z, s.a), flat(z, s.b)] : null
  }
  const pull = (from: V2, to: V2, by: number): V2 => {
    const l = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
    return [from[0] + ((to[0] - from[0]) / l) * by, from[1] + ((to[1] - from[1]) / l) * by]
  }
  for (const side of ['left', 'right']) {
    const lane = seg(`lane.guide.${side}`)
    const rail = seg(`inlane.floor.${side}`)
    if (lane && rail) {
      wire(G, F, [pull(lane[0]!, lane[1]!, 17), lane[1]!, pull(rail[1]!, rail[0]!, 22)], WIRE.height, WIRE.radius, { legs: [1] })
      const m = lane[1]!
      const out = side === 'left' ? -1 : 1
      S.add(m[0] + out * 20, m[1] - 14, 0.4, 0.85)
      S.add(rail[1]![0] + out * 6, rail[1]![1] - 24, 0.4, 0.85)
    }
  }
  const tl = seg('top.guide.left')
  const tr = seg('top.guide.right')
  if (tl && tr) wire(G, F, [tl[0]!, tl[1]!, tr[1]!], WIRE.height, WIRE.radius, { legs: [1], round: 40 })
  for (const s of guides) {
    if (!s.id.endsWith('.roof')) continue
    const a = flat(z, s.a)
    const b = flat(z, s.b)
    wire(G, F, [pull(a, b, 10), b], WIRE.roofHeight, WIRE.roofRadius)
    const m: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    S.add(m[0], m[1] + 20, 0.4, 0.8)
  }

  for (const side of ['left', 'right']) {
    const wide = OUTLANE.inner - COLS.left - 0.2
    const u = side === 'left' ? COLS.left + 0.1 : 2 * MID - COLS.left - 0.1 - wide
    const a = spot(z, u, MOUTH.v)
    const b = spot(z, u + wide, MOUTH.hole + 0.1)
    const x0 = Math.min(a[0], b[0])
    const x1 = Math.max(a[0], b[0])
    const y0 = Math.min(a[1], b[1])
    const y1 = Math.max(a[1], b[1])
    pocket(G, (g) => roundedLoop(x0 - g, x1 + g, y0 - g, y1 + g, 20 + g, 3), [(x0 + x1) / 2, (y0 + y1) / 2], { back: [0, -1] })
    for (const sx of [-1, 1]) S.add((x0 + x1) / 2 + sx * ((x1 - x0) / 2 + 15), y1 + 4 + hash01(k, sx, 3) * 6, 0.4, 0.8)
  }
  for (const h of table.holds) {
    if (h.tier !== k || (h.kind !== 'scoop' && h.kind !== 'hatch')) continue
    const c = flat(z, h.c)
    const r = (h.r + 0.08) * BALL
    pocket(G, (g) => circleLoop(c[0], c[1], r - 5.5 + g, 24), c, { back: h.kind === 'hatch' ? [0, -1] : [0, 1], high: 5.4 })
    if (h.kind === 'scoop') {
      ejector(F, B, S, c, flat(z, h.mouth ?? [h.c[0], h.c[1] + 0.45]), r, slings.length + kicks.length)
      kicks.push(`model.${h.id}`)
    }
    for (let i = 0; i < 3; i++) {
      const a = (h.kind === 'hatch' ? Math.PI / 2 : -Math.PI / 2) + (i - 1) * 1.25
      S.add(c[0] + (r + 9) * Math.cos(a), c[1] + (r + 9) * Math.sin(a), 0.4, 0.8)
    }
  }

  if (k > 0) chute(G, S, z, k - 1)
  const g = gate(G, S, z)

  let tip: Geo | null = null
  let tipAt: V3 = [0, 0, 0]
  if (k === 2) {
    const p = flat(z, PLUNGER)
    tipAt = [p[0], p[1] - BALL / 2, BALL / 2]
    tip = new Geo()
    const turn = new THREE.Matrix4().makeRotationX(Math.PI / 2)
    tip.f(FIN.rubber).lathe([[0, 0], [9.5, 0], [11.5, 2], [11.5, 12], [9, 14]], 0, 0, 14, TONE.rubberBlack)
    tip.f(FIN.steel).lathe([[9, 14], [9, 17], [5.5, 17], [5.5, 90]], 0, 0, 12, TONE.steel)
    tip.move(0, turn)
    const yb = spot(z, PLUNGER[0], TH)[1] + 9
    G.f(FIN.spring).box(p[0] - 17, p[0] + 17, yb - 12, yb, BALL / 2 - 17, BALL / 2 + 17, TONE.alu, { bevel: 2 })
    G.f(FIN.zinc).box(p[0] - 30, p[0] + 30, yb - 12, yb + 6, 0.4, 3, TONE.zinc)
    S.add(p[0] - 24, yb, 3, 0.75)
    S.add(p[0] + 24, yb, 3, 0.75)
  }
  return { G, F, S, B, slings, kicks, gate: g, tip, tipAt }
}
