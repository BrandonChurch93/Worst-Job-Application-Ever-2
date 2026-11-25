import { ShapeUtils, Vector2 } from 'three'
import { hash01 } from '../../core/random'
import { OUTLINE } from '../contract'

export const AXIS: [number, number] = [0.409, 0.912]
export const CENTRE: [number, number] = [4.2, 9.5]
export const TOP = 2.3
const ENAMEL_AT = 0.63
// The finish paints the band black where the distance it is handed is under this.
const INK_AT = 0.56
const BEAD = { in: 0.09, deep: 0.05 }
// The rounded form stands this far outside the outline, so that its rounded corners still reach the outline's own: the arrow keeps its configured height.
const GROW = 0.22
const SHOULDER = 1.0
const FOOT = { in: 0.34, tall: 0.62 }
const CROWN = 1.76
const DOME = 0.1
const RISE = TOP - CROWN - DOME
const ROLL = 2.2
const SOFT = 6
const POWER = 5
const BLEND = { from: 0.9, over: 0.5 }

// The edge band's section: how far in from the outline, how high, in outline units. A full round from the foot, tucked under, out to the outline and over to the enamel.
const BAND: [number, number][] = []
for (const turn of [0, 22.5, 45, 67.5, 90]) {
  const a = (turn * Math.PI) / 180
  BAND.push([FOOT.in * (1 - Math.sin(a)), FOOT.tall * (1 - Math.cos(a))])
}
const WALL_FROM = BAND.length - 1
for (const turn of [12, 24, 36, 48, 60, 72, 82, 90]) {
  const a = (turn * Math.PI) / 180
  BAND.push([(ENAMEL_AT - BEAD.in) * (1 - Math.cos(a)), FOOT.tall + (CROWN - FOOT.tall) * Math.sin(a)])
}
BAND.push([ENAMEL_AT - BEAD.in * 0.45, CROWN - BEAD.deep * 0.4], [ENAMEL_AT - 0.005, CROWN - BEAD.deep])
// The distance handed to the finish for a distance in from the outline: the band ends where the finish expects it.
const told = (t: number): number => (t < ENAMEL_AT ? (Math.max(0, t) * INK_AT) / ENAMEL_AT : t - ENAMEL_AT + INK_AT)
const LIP = [0, 0.04, 0.1, 0.18, 0.27, 0.36, 0.48, 0.62, 0.78]
const NARROW = 1.47
const RADII = [0.5, 0.62, 0.36, 0.9, 0.9, 0.36, 0.62]
const ARC = 11
const SPACING = 0.75

export const shoulderInset = (turnDeg: number): number => ENAMEL_AT + (SHOULDER * turnDeg) / 90

const smooth01 = (v: number): number => {
  const t = Math.min(1, Math.max(0, v))
  return t * t * (3 - 2 * t)
}

// How high the edge band stands at a distance in from the outline.
function bandAt(d: number): number {
  if (d <= 0) return FOOT.tall
  for (let i = WALL_FROM; i < BAND.length - 1; i++) {
    const a = BAND[i]!
    const b = BAND[i + 1]!
    if (d <= b[0]) return a[1] + ((b[1] - a[1]) * (d - a[0])) / Math.max(1e-6, b[0] - a[0])
  }
  return CROWN - BEAD.deep
}

// How high the enamel stands where the distance in from the outline is d: one soft roll up from the band, then a shallow dome to the middle.
function enamelAt(d: number): number {
  const k = Math.min(1, Math.max(0, d - ENAMEL_AT) / SHOULDER)
  return CROWN - BEAD.deep + (RISE + BEAD.deep) * (1 - Math.pow(1 - k, ROLL)) + DOME * smooth01((d - 1.2) / 2.2)
}

// How high the underside of the band stands at a distance in from the outline, as the finish is told it: the foot is tucked under.
export function underAt(toldInset: number): number {
  const t = (toldInset * ENAMEL_AT) / INK_AT
  if (t >= FOOT.in) return 0
  const k = 1 - Math.max(0, t) / FOOT.in
  return FOOT.tall * (1 - Math.sqrt(Math.max(0, 1 - k * k)))
}
export const UNDER_TOP = FOOT.tall

// How rounded a ring's own corners are at a distance in from the outline.
function ownRadius(t: number): number {
  if (t < ENAMEL_AT) return 0.12 * smooth01((t - 0.3) / (ENAMEL_AT - 0.3))
  return Math.min(0.34, 0.12 + 0.65 * (t - ENAMEL_AT), Math.max(0.03, 0.45 * (NARROW - t)))
}

const N = OUTLINE.length
const area2 = OUTLINE.reduce((s, p, i) => s + p[0] * OUTLINE[(i + 1) % N]![1] - OUTLINE[(i + 1) % N]![0] * p[1], 0)
const WIND = area2 > 0 ? 1 : -1

interface Edge { px: number; py: number; dx: number; dy: number; nx: number; ny: number; len: number }
const EDGES: Edge[] = OUTLINE.map((p, i) => {
  const q = OUTLINE[(i + 1) % N]!
  const len = Math.hypot(q[0] - p[0], q[1] - p[1])
  const dx = (q[0] - p[0]) / len
  const dy = (q[1] - p[1]) / len
  // The inward normal.
  return { px: p[0], py: p[1], dx, dy, len, nx: -dy * WIND, ny: dx * WIND }
})
const CONVEX: boolean[] = OUTLINE.map((_, i) => {
  const a = EDGES[(i + N - 1) % N]!
  const b = EDGES[i]!
  return (a.dx * b.dy - a.dy * b.dx) * WIND > 0
})
const STEPS: number[] = EDGES.map((e) => Math.max(1, Math.round(e.len / SPACING) - 1))

function miter(i: number, t: number): [number, number] {
  const a = EDGES[(i + N - 1) % N]!
  const b = EDGES[i]!
  const ax = a.px + a.nx * t
  const ay = a.py + a.ny * t
  const bx = b.px + b.nx * t
  const by = b.py + b.ny * t
  const den = a.dx * b.dy - a.dy * b.dx
  const s = ((bx - ax) * b.dy - (by - ay) * b.dx) / den
  return [ax + a.dx * s, ay + a.dy * s]
}

// One closed line at a distance in from the outline, with the corners rounded: the same number of points at every distance.
export function ring(t: number): [number, number][] {
  const out: [number, number][] = []
  const starts: [number, number][] = []
  const ends: [number, number][] = []
  const arcs: [number, number][][] = []
  for (let i = 0; i < N; i++) {
    const a = EDGES[(i + N - 1) % N]!
    const b = EDGES[i]!
    const r = RADII[i]!
    const convex = CONVEX[i]!
    const radius = convex ? Math.max(ownRadius(t), r - t) : r + t
    const c = convex ? miter(i, t - GROW + radius) : miter(i, -r - GROW)
    const sign = convex ? -1 : 1
    const a0 = Math.atan2(a.ny * sign, a.nx * sign)
    let a1 = Math.atan2(b.ny * sign, b.nx * sign)
    while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI
    while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI
    const pts: [number, number][] = []
    for (let j = 0; j < ARC; j++) {
      const ang = a0 + ((a1 - a0) * j) / (ARC - 1)
      pts.push([c[0] + Math.cos(ang) * radius, c[1] + Math.sin(ang) * radius])
    }
    arcs.push(pts)
    starts.push(pts[0]!)
    ends.push(pts[ARC - 1]!)
  }
  for (let i = 0; i < N; i++) {
    out.push(...arcs[i]!)
    const from = ends[i]!
    const to = starts[(i + 1) % N]!
    const m = STEPS[i]!
    for (let j = 1; j <= m; j++) {
      const f = j / (m + 1)
      out.push([from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f])
    }
  }
  return out
}

// How far a point is inside the outline, in outline units. Negative outside.
export function inside(x: number, y: number): number {
  let best = Infinity
  let hit = false
  for (let i = 0; i < N; i++) {
    const e = EDGES[i]!
    const qx = e.px + e.dx * e.len
    const qy = e.py + e.dy * e.len
    const s = Math.min(e.len, Math.max(0, (x - e.px) * e.dx + (y - e.py) * e.dy))
    best = Math.min(best, Math.hypot(x - e.px - e.dx * s, y - e.py - e.dy * s))
    if (e.py > y !== qy > y && x < e.px + ((y - e.py) / (qy - e.py)) * (qx - e.px)) hit = !hit
  }
  return hit ? best : -best
}

// The same distance with its creases smoothed away, so the enamel's dome has no ridge where two edges are equally near.
export function softInside(x: number, y: number): number {
  let sum = 0
  for (let i = 0; i < N; i++) {
    const e = EDGES[i]!
    const s = Math.min(e.len, Math.max(0, (x - e.px) * e.dx + (y - e.py) * e.dy))
    sum += Math.exp(-SOFT * Math.hypot(x - e.px - e.dx * s, y - e.py - e.dy * s))
  }
  return -Math.log(sum) / SOFT
}

// The distance the dome is built on: the true one near the outline, and further in one that every edge has a say in, so no ridge runs down the stem or into a corner.
export function domeInside(x: number, y: number): number {
  const d = inside(x, y) + GROW
  if (d <= BLEND.from) return d
  let sum = 0
  for (let i = 0; i < N; i++) {
    const e = EDGES[i]!
    const s = Math.min(e.len, Math.max(0, (x - e.px) * e.dx + (y - e.py) * e.dy))
    sum += Math.pow(Math.max(1e-3, Math.hypot(x - e.px - e.dx * s, y - e.py - e.dy * s) + GROW), -POWER)
  }
  const all = Math.pow(sum, -1 / POWER)
  return d + (all - d) * smooth01((d - BLEND.from) / BLEND.over)
}

// How high the enamel stands over a point, by the smoothed distance alone: the dome with no crease, for the directions it faces.
export function domeAt(x: number, y: number): number {
  return enamelAt(domeInside(x, y))
}

// How high the top of the body stands over a point of the outline's plane.
export function heightAt(x: number, y: number): number {
  const d = inside(x, y) + GROW
  if (d < ENAMEL_AT) return bandAt(d)
  return enamelAt(domeInside(x, y))
}

export interface Solid {
  // x, y, z of every vertex at rest, in outline units: y runs down the page, z up off it.
  rest: Float32Array
  ink: Float32Array
  inset: Float32Array
  index: Uint32Array
  ringSize: number
}

// A Delaunay triangulation of a handful of points, by insertion.
function triangulate(pts: [number, number][]): number[] {
  const n = pts.length
  const all: [number, number][] = [...pts, [-200, -200], [400, -200], [100, 600]]
  let tris: [number, number, number][] = [[n, n + 1, n + 2]]
  const within = (p: [number, number], t: [number, number, number]): boolean => {
    const [ax, ay] = all[t[0]]!
    const [bx, by] = all[t[1]]!
    const [cx, cy] = all[t[2]]!
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    if (Math.abs(d) < 1e-12) return false
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d
    return Math.hypot(p[0] - ux, p[1] - uy) < Math.hypot(ax - ux, ay - uy) - 1e-9
  }
  for (let i = 0; i < n; i++) {
    const keep: [number, number, number][] = []
    const edges = new Map<number, [number, number]>()
    for (const t of tris) {
      if (!within(all[i]!, t)) {
        keep.push(t)
        continue
      }
      for (let k = 0; k < 3; k++) {
        const a = t[k]!
        const b = t[(k + 1) % 3]!
        const key = Math.min(a, b) * 65536 + Math.max(a, b)
        if (edges.has(key)) edges.delete(key)
        else edges.set(key, [a, b])
      }
    }
    for (const [a, b] of edges.values()) keep.push([a, b, i])
    tris = keep
  }
  const out: number[] = []
  for (const t of tris) if (t[0] < n && t[1] < n && t[2] < n) out.push(t[0], t[1], t[2])
  return out
}

let cached: Solid | null = null

// The whole arrow as one closed solid: the underside, the black edge band, the groove, the enamel's shoulder and its domed face.
export function solid(): Solid {
  if (cached) return cached
  const rows: { t: number; z: number; ink: number }[] = []
  for (const [t, z] of BAND) rows.push({ t, z, ink: 1 })
  for (const more of LIP) rows.push({ t: ENAMEL_AT + more, z: -1, ink: 0 })
  const first = ring(rows[0]!.t)
  const size = first.length
  const xs: number[] = []
  const inks: number[] = []
  const insets: number[] = []
  const index: number[] = []
  for (const row of rows) {
    const field = row.z < 0 ? smooth01((row.t - ENAMEL_AT) / (BLEND.from - ENAMEL_AT)) : 0
    for (const p of ring(row.t)) {
      xs.push(p[0], p[1], row.z < 0 ? enamelAt(row.t + (field > 0 ? (domeInside(p[0], p[1]) - row.t) * field : 0)) : row.z)
      inks.push(row.ink)
      insets.push(told(row.t))
    }
  }
  const signed = (a: number, b: number, c: number): number =>
    (xs[b * 3]! - xs[a * 3]!) * (xs[c * 3 + 1]! - xs[a * 3 + 1]!) - (xs[c * 3]! - xs[a * 3]!) * (xs[b * 3 + 1]! - xs[a * 3 + 1]!)
  // y runs down the page, so a face that looks up off the page has its corners in this order.
  const up = (a: number, b: number, c: number): void => {
    if (signed(a, b, c) < 0) index.push(a, b, c)
    else index.push(a, c, b)
  }
  for (let r = 0; r + 1 < rows.length; r++) {
    for (let i = 0; i < size; i++) {
      const a = r * size + i
      const b = r * size + ((i + 1) % size)
      const c = (r + 1) * size + ((i + 1) % size)
      const d = (r + 1) * size + i
      if (WIND > 0) index.push(a, c, b, a, d, c)
      else index.push(a, b, c, a, c, d)
    }
  }
  const under = ShapeUtils.triangulateShape(first.map((p) => new Vector2(p[0], p[1])), [])
  for (const t of under) {
    if (signed(t[0]!, t[1]!, t[2]!) < 0) index.push(t[0]!, t[2]!, t[1]!)
    else index.push(t[0]!, t[1]!, t[2]!)
  }
  const lastRow = rows.length - 1
  const inner = ring(rows[lastRow]!.t)
  const base = lastRow * size
  const reach = rows[lastRow]!.t
  // Points of the ring that fall together at a sharp corner count once.
  const pts: [number, number][] = []
  const names: number[] = []
  const alias: number[] = []
  for (let i = 0; i < size; i++) {
    const p = inner[i]!
    const same = pts.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-5)
    if (same >= 0) alias.push(same)
    else {
      alias.push(pts.length)
      pts.push([p[0], p[1]])
      names.push(base + i)
    }
  }
  const pitch = 0.28
  let line = 0
  for (let y = 0.4; y < 19; y += pitch * 0.866, line++) {
    for (let x0 = 0.2 + (line % 2) * pitch * 0.5; x0 < 12; x0 += pitch) {
      const x = x0 + (hash01(Math.round(x0 * 100), line, 7) - 0.5) * 0.08
      const d = inside(x, y) + GROW
      if (d < reach + 0.3) continue
      pts.push([x, y])
      names.push(xs.length / 3)
      xs.push(x, y, enamelAt(domeInside(x, y)))
      inks.push(0)
      insets.push(told(d))
    }
  }
  const face = triangulate(pts)
  // A triangle of the face belongs only where its middle is inside the innermost ring.
  const within = (x: number, y: number): boolean => {
    let hit = false
    for (let i = 0, j = size - 1; i < size; j = i++) {
      const p = inner[i]!
      const q = inner[j]!
      if (p[1] > y !== q[1] > y && x < p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0])) hit = !hit
    }
    return hit
  }
  for (let i = 0; i < face.length; i += 3) {
    const a = pts[face[i]!]!
    const b = pts[face[i + 1]!]!
    const c = pts[face[i + 2]!]!
    if (!within((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3)) continue
    up(names[face[i]!]!, names[face[i + 1]!]!, names[face[i + 2]!]!)
  }
  void alias
  cached = { rest: new Float32Array(xs), ink: new Float32Array(inks), inset: new Float32Array(insets), index: new Uint32Array(index), ringSize: size }
  return cached
}

// The volume a closed mesh holds. Positive when its faces look outward.
export function volume(position: ArrayLike<number>, index: ArrayLike<number>): number {
  let v = 0
  for (let i = 0; i < index.length; i += 3) {
    const a = index[i]! * 3
    const b = index[i + 1]! * 3
    const c = index[i + 2]! * 3
    v +=
      position[a]! * (position[b + 1]! * position[c + 2]! - position[b + 2]! * position[c + 1]!) +
      position[a + 1]! * (position[b + 2]! * position[c]! - position[b]! * position[c + 2]!) +
      position[a + 2]! * (position[b]! * position[c + 1]! - position[b + 1]! * position[c]!)
  }
  return v / 6
}
