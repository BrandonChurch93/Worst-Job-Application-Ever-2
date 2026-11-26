import { table, type Sling } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type Buckets, type RGB, type V2, type V3 } from './geo'
import { KIND, TONE, framed, mix, rgb, shade, site } from './kit'

// How high the shoulder of a sling post stands, and so the underside of the plate that sits on it.
export const PLATE = { z: 46, thick: 2, out: 6, corner: 9 }

const clip = (poly: V2[], a: V2, b: V2): V2[] => {
  const out: V2[] = []
  const side = (p: V2): number => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!
    const q = poly[(i + 1) % poly.length]!
    const sp = side(p)
    const sq = side(q)
    if (sp >= 0) out.push(p)
    if (sp >= 0 !== sq >= 0) {
      const t = sp / (sp - sq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

// A counter clockwise triangle with each edge moved outward by `d` (inward when negative) and its corners rounded by `corner`.
const grown = (tri: V2[], d: number, corner: number): V2[] => {
  const lines = tri.map((p, i) => {
    const q = tri[(i + 1) % 3]!
    const l = Math.hypot(q[0] - p[0], q[1] - p[1])
    const n: V2 = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l]
    const k = d - corner
    return { p: [p[0] + n[0] * k, p[1] + n[1] * k] as V2, t: [(q[0] - p[0]) / l, (q[1] - p[1]) / l] as V2, n }
  })
  const out: V2[] = []
  for (let i = 0; i < 3; i++) {
    const a = lines[(i + 2) % 3]!
    const c = lines[i]!
    const det = a.t[0] * c.t[1] - a.t[1] * c.t[0]
    const u = ((c.p[0] - a.p[0]) * c.t[1] - (c.p[1] - a.p[1]) * c.t[0]) / det
    const v: V2 = [a.p[0] + a.t[0] * u, a.p[1] + a.t[1] * u]
    if (corner <= 0) {
      out.push(v)
      continue
    }
    const n0 = Math.atan2(a.n[1], a.n[0])
    let n1 = Math.atan2(c.n[1], c.n[0])
    while (n1 < n0) n1 += Math.PI * 2
    const steps = 6
    for (let k = 0; k <= steps; k++) {
      const ang = n0 + ((n1 - n0) * k) / steps
      out.push([v[0] + Math.cos(ang) * corner, v[1] + Math.sin(ang) * corner])
    }
  }
  return out
}

// One road sign: a pressed plate on the three posts of a sling, yellow sheeting with black chevrons that point inward, a rolled edge, four rivets.
export function roadSign(z: Zone, s: Sling): { geo: Geo; rivets: V3[] } {
  const g = new Geo()
  let tri: V2[] = [s.a, s.b, s.c].map((p) => {
    const q = localBalls(z, p[0], p[1])
    return [q[0], q[1]] as V2
  })
  const area = (tri[1]![0] - tri[0]![0]) * (tri[2]![1] - tri[0]![1]) - (tri[1]![1] - tri[0]![1]) * (tri[2]![0] - tri[0]![0])
  if (area < 0) tri = [tri[0]!, tri[2]!, tri[1]!]
  const mx = (tri[0]![0] + tri[1]![0] + tri[2]![0]) / 3
  const my = (tri[0]![1] + tri[1]![1] + tri[2]![1]) / 3
  const edge = grown(tri, PLATE.out, PLATE.corner)
  const z0 = PLATE.z
  const z1 = z0 + PLATE.thick
  g.slab(edge, z0, z1, TONE.alu, { top: TONE.yellow, topKind: KIND.sheeting, under: true, kind: KIND.gloss })
  // The rolled edge.
  for (let i = 0; i < edge.length; i++) {
    const p = edge[i]!
    const q = edge[(i + 1) % edge.length]!
    g.rod([p[0], p[1], z1 - 0.1], [q[0], q[1], z1 - 0.1], 1.7, 8, rgb(0xe4e7ea), KIND.gloss, false)
  }
  // A black line inside the edge, then the chevrons, each two arms that meet at a point toward the middle of the table.
  const inner = grown(tri, PLATE.out - 4, PLATE.corner - 4)
  const line = grown(tri, PLATE.out - 2, PLATE.corner - 2)
  for (let i = 0; i < inner.length; i++) {
    const j = (i + 1) % inner.length
    g.face([[inner[i]![0], inner[i]![1], z1 + 0.1], [line[i]![0], line[i]![1], z1 + 0.1], [line[j]![0], line[j]![1], z1 + 0.1], [inner[j]![0], inner[j]![1], z1 + 0.1]], TONE.black, KIND.sheeting, [0, 0, 1])
  }
  const field = grown(tri, PLATE.out - 6.5, 0)
  const dir = s.side === 'left' ? 1 : -1
  const xs = tri.map((p) => p[0])
  const ys = tri.map((p) => p[1])
  const ym = Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * 0.3
  const t = 17
  const L = 200
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  for (let x = lo - 20; x < hi + 40; x += t * 2.25) {
    const tip = dir > 0 ? x : lo + hi - x
    for (const up of [1, -1]) {
      let arm: V2[] = [[tip, ym], [tip - dir * t, ym], [tip - dir * (t + L), ym + up * L], [tip - dir * L, ym + up * L]]
      const turn = (arm[1]![0] - arm[0]![0]) * (arm[2]![1] - arm[0]![1]) - (arm[1]![1] - arm[0]![1]) * (arm[2]![0] - arm[0]![0])
      if (turn < 0) arm = arm.reverse()
      for (let i = 0; i < field.length && arm.length > 2; i++) arm = clip(arm, field[i]!, field[(i + 1) % field.length]!)
      if (arm.length > 2) g.face(arm.map((p) => [p[0], p[1], z1 + 0.1] as V3), TONE.black, KIND.sheeting, [0, 0, 1])
    }
  }
  // Grime along the lower edge: a dull band that fades upward.
  const y0 = Math.min(...ys)
  let band: V2[] = [[lo - 20, y0 - 20], [hi + 20, y0 - 20], [hi + 20, y0 + 5], [lo - 20, y0 + 5]]
  for (let i = 0; i < line.length && band.length > 2; i++) band = clip(band, line[i]!, line[(i + 1) % line.length]!)
  if (band.length > 2) g.face(band.map((p) => [p[0], p[1], z1 + 0.16] as V3), mix(TONE.yellow, rgb(0x4a4130), 0.55), KIND.stucco, [0, 0, 1])
  const rivets: V3[] = tri.map((p) => [p[0], p[1], z1 + 0.1] as V3)
  rivets.push([mx, my, z1 + 0.1])
  for (const r of rivets) g.lathe([[2.6, 0], [2.3, 0.9], [1.2, 1.4], [0, 1.5]], r[0], r[1], 12, TONE.alu, { base: r[2], kind: KIND.gloss })
  return { geo: g, rivets }
}

// A street lamp: a tapered post, a curved arm and a head whose underside is lit.
export function lamp(b: Buckets, x: number, y: number, turn: number, tall = 62): void {
  framed(b, x, y, 0, turn, () => {
    b.paint.lathe([[3.4, 0], [3.4, 1.6], [2.2, 3], [1.6, 9], [1.2, tall]], 0, 0, 12, TONE.iron, { kind: KIND.gloss })
    const pts: V3[] = [[0, 0, tall], [0, -3.5, tall + 4.5], [0, -9, tall + 6.5], [0, -15, tall + 6.5]]
    for (let k = 0; k < pts.length - 1; k++) b.paint.rod(pts[k]!, pts[k + 1]!, 1, 8, TONE.iron, KIND.gloss)
    b.paint.box(-2.6, 2.6, -22, -12, tall + 5.6, tall + 8, TONE.iron, { bevel: 0.9, kind: KIND.gloss })
    b.glow.box(-2, 2, -21.2, -13, tall + 4.6, tall + 5.6, [1.9, 1.5, 0.9], { under: true, skip: 't' })
    b.screws.push([2.4, 2.4, 1.6, 0.7], [-2.4, -2.4, 1.6, 0.7])
  })
}

export function hydrant(b: Buckets, x: number, y: number): void {
  const red = shade(TONE.red, 0.6)
  b.paint.lathe([[3.6, 0], [3.6, 1.2], [2.5, 1.8], [2.5, 8.2], [3.1, 8.6], [3.1, 9.6], [2.4, 10.6], [1.2, 11.6], [0, 11.8]], x, y, 16, red, { kind: KIND.gloss })
  b.paint.rod([x - 4.4, y, 6.2], [x + 4.4, y, 6.2], 1.25, 10, red, KIND.gloss)
  b.paint.rod([x, y - 4.2, 5.4], [x, y, 5.4], 1.5, 10, red, KIND.gloss)
  b.metal.lathe([[0.9, 0], [0.9, 1.1], [0, 1.1]], x, y, 6, TONE.steel, { base: 11.8 })
}

// A parked toy car: a pressed body, a cabin with dark glass, four wheels, bright bumpers. Its nose is toward +x.
export function car(b: Buckets, x: number, y: number, turn: number, col: RGB): void {
  framed(b, x, y, 0, turn, () => {
    const g = b.paint
    g.box(-19, 19, -8, 8, 3, 9.4, col, { bevel: 1.8, kind: KIND.gloss, under: true })
    g.box(-10, 8, -6.9, 6.9, 9.4, 14.6, [0.03, 0.04, 0.05], { bevel: 1.6, kind: KIND.gloss, top: col })
    g.box(-9.2, 7.2, -6, 6, 14.6, 15.1, col, { bevel: 0.5, kind: KIND.gloss })
    for (const sx of [-12.5, 12]) for (const sy of [-1, 1]) {
      g.rod([sx, sy * 6.4, 3.6], [sx, sy * 8.7, 3.6], 3.6, 14, TONE.black)
      b.metal.rod([sx, sy * 8.7, 3.6], [sx, sy * 8.9, 3.6], 1.9, 10, TONE.chrome)
    }
    b.metal.box(19, 20, -7.4, 7.4, 3.6, 5.6, TONE.chrome, { under: true, bevel: 0.4 })
    b.metal.box(-20, -19, -7.4, 7.4, 3.6, 5.6, TONE.chrome, { under: true, bevel: 0.4 })
    for (const sy of [-5.2, 5.2]) {
      b.glow.box(19, 19.4, sy - 1.4, sy + 1.4, 6.3, 8, [0.5, 0.48, 0.4], { skip: 'l' })
      g.box(-19.4, -19, sy - 1.4, sy + 1.4, 6.3, 7.8, rgb(0x7a1512), { skip: 'r', kind: KIND.gloss })
    }
  })
}

// A bus shelter: four posts, a roof, a bench, a back of dark glass and a lit panel with nothing on it.
export function shelter(b: Buckets, x: number, y: number, turn: number): void {
  framed(b, x, y, 0, turn, () => {
    const g = b.paint
    g.box(-30, 30, -10, 10, 0, 1.6, TONE.stone, { bevel: 0.5, kind: KIND.block })
    for (const sx of [-27.5, 27.5]) for (const sy of [-7.5, 7.5]) b.metal.rod([sx, sy, 1.6], [sx, sy, 28], 0.9, 8, TONE.alu)
    g.box(-30, 30, -11, 10, 28, 29.6, TONE.iron, { bevel: 0.6, kind: KIND.gloss, under: true })
    g.box(-27, 27, 7.2, 7.8, 4, 27, [0.05, 0.07, 0.08], { kind: KIND.gloss })
    g.box(-16, 4, 1.5, 6, 8.4, 9.6, TONE.wood, { bevel: 0.3, under: true })
    for (const sx of [-14, 2]) g.box(sx - 0.6, sx + 0.6, 2.4, 5, 1.6, 8.4, TONE.iron)
    b.metal.box(10.4, 26.6, 5.6, 7.2, 4.4, 26.6, TONE.alu, { under: true })
    b.glow.face([[11.6, 5.55, 5.6], [25.4, 5.55, 5.6], [25.4, 5.55, 25.4], [11.6, 5.55, 25.4]], [0.75, 0.72, 0.66], 0, [0, -1, 0])
    b.screws.push([-28.6, -8.8, 1.6, 0.8], [28.6, -8.8, 1.6, 0.8])
  })
}

// What stands on the two shoulders of the street, where no ball can come: lamps, a hydrant, a bus shelter, two parked cars.
export function streetThings(b: Buckets, z: Zone): void {
  const mom = site(z, 'street.mom')
  const rows = (['left', 'right'] as const).map((row) => table.models.filter((m) => m.part === 'model-houses' && m.id.includes(`.${row}.`)).map((m) => site(z, m.id)))
  const left = rows[0]!
  const right = rows[1]!
  if (left.length === 0 || right.length === 0) return
  const lx1 = Math.max(...left.map((s) => s.x1))
  const lyb = left[0]!.yb
  // Between Mom's house and the row of houses below it: the shelter, by the kerb, and a car parked beside it.
  const gapY = (mom.yf + lyb) / 2
  shelter(b, mom.x1 + 40, lyb + 22, 0)
  car(b, mom.cx - 6, gapY - 1, 0, rgb(0x24364e))
  hydrant(b, mom.x1 + 8, mom.yf + 4)
  lamp(b, mom.x1 + 6, mom.yb - 4, Math.PI, 56)
  lamp(b, lx1 + 14, left[0]!.cy, Math.PI * 0.75, 56)
  // On the right: a car before the houses, a lamp at each end of the row, a hydrant.
  const rx0 = Math.min(...right.map((s) => s.x0))
  const rx1 = Math.max(...right.map((s) => s.x1))
  const ryf = right[0]!.yf
  car(b, (rx0 + rx1) / 2 + 22, ryf - 15, Math.PI, rgb(0x2a2f36))
  hydrant(b, rx0 + 6, ryf - 9)
  lamp(b, rx0 + 10, right[0]!.yb + 16, Math.PI * 0.8, 56)
  lamp(b, rx1 - 3, ryf - 12, 0, 56)
}

export { shade }
