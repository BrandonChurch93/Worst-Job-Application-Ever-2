import * as THREE from 'three'
import { studio } from '../../../../post/studio'
import { lit } from '../../light'
import type { Zone } from '../../zone'

export type RGB = [number, number, number]
export type V2 = [number, number]
export type V3 = [number, number, number]
// How a surface answers light: roughness, metalness, clear coat.
export type Surf = [number, number, number]

export const hex = (h: number): RGB => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export const SURF = {
  matte: [0.86, 0, 0] as Surf,
  fabric: [0.97, 0, 0] as Surf,
  paper: [0.8, 0, 0] as Surf,
  satin: [0.5, 0, 0] as Surf,
  plastic: [0.34, 0, 0.25] as Surf,
  gloss: [0.2, 0, 1] as Surf,
  enamel: [0.26, 0, 1] as Surf,
  rubber: [0.78, 0, 0] as Surf,
  steel: [0.3, 1, 0] as Surf,
  brushed: [0.42, 1, 0] as Surf,
  chrome: [0.1, 1, 0] as Surf,
  zinc: [0.48, 1, 0] as Surf,
  glass: [0.07, 0, 1] as Surf,
  laminate: [0.42, 0, 0.5] as Surf
}

const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

export const rrect = (w: number, d: number, r: number, n = 3): V2[] => {
  const out: V2[] = []
  const hw = w / 2
  const hd = d / 2
  const corners: [number, number, number][] = [[hw - r, hd - r, 0], [-hw + r, hd - r, 1], [-hw + r, -hd + r, 2], [hw - r, -hd + r, 3]]
  for (const [cx, cy, q] of corners) for (let i = 0; i <= n; i++) {
    const a = (q + i / n) * Math.PI * 0.5
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return out
}

// A rounded rectangle with the outward direction at each point.
export const rounded = (w: number, d: number, r: number, n = 4): { points: V2[]; out: V2[] } => {
  const points: V2[] = []
  const out: V2[] = []
  const hw = w / 2
  const hd = d / 2
  const corners: [number, number, number][] = [[hw - r, hd - r, 0], [-hw + r, hd - r, 1], [-hw + r, -hd + r, 2], [hw - r, -hd + r, 3]]
  for (const [cx, cy, q] of corners) for (let i = 0; i <= n; i++) {
    const a = (q + i / n) * Math.PI * 0.5
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    out.push([Math.cos(a), Math.sin(a)])
  }
  return { points, out }
}

// Triangles with a place, a normal, a colour and a surface, gathered into one geometry for one draw.
export class Kit {
  private p: number[] = []
  private n: number[] = []
  private c: number[] = []
  private s: number[] = []
  private small: number[][] = [[], [], [], []]
  // How much of the tier's own soft light what follows gives back, on top of the lamps: paper and pale moulding take more of it than dark things.
  lift = 0.16
  // What follows is small trim: it is kept apart, for the one mesh of fine things of the tier.
  fine = false
  private m = new THREE.Matrix4()
  private stack: THREE.Matrix4[] = []
  private flips: boolean[] = []
  private flip = false
  private v = new THREE.Vector3()
  // How far the normals of what follows lean up, so that upright cloth takes the light from above as a soft thing does.
  up = 0

  get triangles(): number {
    return this.p.length / 9
  }

  at(x: number, y: number, z: number, rz = 0, rx = 0, ry = 0): this {
    this.stack.push(this.m.clone())
    this.flips.push(this.flip)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'ZYX'))
    this.m.multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)))
    return this
  }
  back(): this {
    this.m.copy(this.stack.pop()!)
    this.flip = this.flips.pop() ?? false
    return this
  }
  // What follows is built as its mirror image, left for right.
  mirror(): this {
    this.stack.push(this.m.clone())
    this.flips.push(this.flip)
    this.m.multiply(new THREE.Matrix4().makeScale(-1, 1, 1))
    this.flip = !this.flip
    return this
  }
  // What follows is built larger or smaller by one factor, about the place the kit stands at.
  grow(k: number): this {
    this.stack.push(this.m.clone())
    this.flips.push(this.flip)
    this.m.multiply(new THREE.Matrix4().makeScale(k, k, k))
    return this
  }
  where(a: V3): V3 {
    this.v.set(a[0], a[1], a[2]).applyMatrix4(this.m)
    return [this.v.x, this.v.y, this.v.z]
  }

  private vert(a: V3, n: V3, col: RGB, surf: Surf): void {
    const [p, nn, c, ss] = this.fine ? (this.small as [number[], number[], number[], number[]]) : [this.p, this.n, this.c, this.s]
    this.v.set(a[0], a[1], a[2]).applyMatrix4(this.m)
    p.push(this.v.x, this.v.y, this.v.z)
    this.v.set(n[0], n[1], n[2]).transformDirection(this.m)
    if (this.up > 0 && this.v.z > -0.5) {
      this.v.z += this.up
      this.v.normalize()
    }
    nn.push(this.v.x, this.v.y, this.v.z)
    c.push(col[0], col[1], col[2])
    ss.push(surf[0], surf[1], surf[2], this.lift)
  }
  // Takes all the triangles of another kit in among its own.
  take(from: Kit): this {
    for (const x of from.p) this.p.push(x)
    for (const x of from.n) this.n.push(x)
    for (const x of from.c) this.c.push(x)
    for (const x of from.s) this.s.push(x)
    return this
  }
  // Takes the small trim of another kit in among its own triangles.
  takeFine(from: Kit): this {
    const dst = [this.p, this.n, this.c, this.s]
    from.small.forEach((a, i) => {
      const d = dst[i]!
      for (const x of a) d.push(x)
    })
    return this
  }

  tri(a: V3, b: V3, c: V3, na: V3, nb: V3, nc: V3, col: RGB, surf: Surf, colB: RGB = col, colC: RGB = col): this {
    const f = cross(sub(b, a), sub(c, a))
    const flip = (dot(f, [na[0] + nb[0] + nc[0], na[1] + nb[1] + nc[1], na[2] + nb[2] + nc[2]]) < 0) !== this.flip
    this.vert(a, na, col, surf)
    if (flip) {
      this.vert(c, nc, colC, surf)
      this.vert(b, nb, colB, surf)
    } else {
      this.vert(b, nb, colB, surf)
      this.vert(c, nc, colC, surf)
    }
    return this
  }
  quad(a: V3, b: V3, c: V3, d: V3, na: V3, nb: V3, nc: V3, nd: V3, col: RGB, surf: Surf): this {
    return this.tri(a, b, c, na, nb, nc, col, surf).tri(a, c, d, na, nc, nd, col, surf)
  }
  flat(points: V3[], n: V3, col: RGB, surf: Surf): this {
    for (let i = 1; i < points.length - 1; i++) this.tri(points[0]!, points[i]!, points[i + 1]!, n, n, n, col, surf)
    return this
  }

  // A box centred on x, y that stands on z. Its edges are chamfered and the chamfer takes the normals of the two faces it joins, so it shows as a line of light.
  box(x: number, y: number, z: number, w: number, d: number, h: number, col: RGB, surf: Surf, bevel = 1, rz = 0, bottom = false): this {
    this.at(x, y, z + h / 2, rz)
    const hs: V3 = [w / 2, d / 2, h / 2]
    const t = Math.min(bevel, w / 2 - 0.01, d / 2 - 0.01, h / 2 - 0.01)
    const e = (i: number, s: number): V3 => [i === 0 ? s : 0, i === 1 ? s : 0, i === 2 ? s : 0]
    const pt = (vals: [number, number][]): V3 => {
      const q: V3 = [0, 0, 0]
      for (const [i, val] of vals) q[i] = val
      return q
    }
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3
      const k = (i + 2) % 3
      for (const si of [-1, 1]) {
        if (i === 2 && si < 0 && !bottom) continue
        const n = e(i, si)
        const a = hs[j]! - t
        const b = hs[k]! - t
        this.flat([pt([[i, si * hs[i]!], [j, -a], [k, -b]]), pt([[i, si * hs[i]!], [j, a], [k, -b]]), pt([[i, si * hs[i]!], [j, a], [k, b]]), pt([[i, si * hs[i]!], [j, -a], [k, b]])], n, col, surf)
      }
    }
    if (t > 0.01) {
      for (let k = 0; k < 3; k++) {
        const i = (k + 1) % 3
        const j = (k + 2) % 3
        for (const si of [-1, 1]) for (const sj of [-1, 1]) {
          if (!bottom && ((i === 2 && si < 0) || (j === 2 && sj < 0))) continue
          const b = hs[k]! - t
          const ni = e(i, si)
          const nj = e(j, sj)
          const a0 = pt([[i, si * hs[i]!], [j, sj * (hs[j]! - t)], [k, -b]])
          const a1 = pt([[i, si * hs[i]!], [j, sj * (hs[j]! - t)], [k, b]])
          const b0 = pt([[i, si * (hs[i]! - t)], [j, sj * hs[j]!], [k, -b]])
          const b1 = pt([[i, si * (hs[i]! - t)], [j, sj * hs[j]!], [k, b]])
          this.quad(a0, a1, b1, b0, ni, ni, nj, nj, col, surf)
        }
      }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        if (!bottom && sz < 0) continue
        this.tri([sx * hs[0], sy * (hs[1] - t), sz * (hs[2] - t)], [sx * (hs[0] - t), sy * hs[1], sz * (hs[2] - t)], [sx * (hs[0] - t), sy * (hs[1] - t), sz * hs[2]], [sx, 0, 0], [0, sy, 0], [0, 0, sz], col, surf)
      }
    }
    return this.back()
  }

  // A turned shape round a standing axis: the profile is (radius, height), from the foot up the outside to the top.
  lathe(x: number, y: number, z: number, profile: V2[], col: RGB | RGB[], surf: Surf | Surf[], segs = 14, smooth = false): this {
    this.at(x, y, z)
    const ns: V2[] = []
    for (let i = 0; i < profile.length - 1; i++) {
      const dr = profile[i + 1]![0] - profile[i]![0]
      const dz = profile[i + 1]![1] - profile[i]![1]
      const l = Math.hypot(dr, dz) || 1
      ns.push([dz / l, -dr / l])
    }
    const nAt = (seg: number, end: number): V2 => {
      if (!smooth) return ns[seg]!
      const i = seg + end
      const a = ns[Math.max(0, i - 1)]!
      const b = ns[Math.min(ns.length - 1, i)]!
      const l = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1
      return [(a[0] + b[0]) / l, (a[1] + b[1]) / l]
    }
    for (let i = 0; i < profile.length - 1; i++) {
      const [r0, z0] = profile[i]!
      const [r1, z1] = profile[i + 1]!
      const n0 = nAt(i, 0)
      const n1 = nAt(i, 1)
      const cc = Array.isArray(col[0]) ? (col as RGB[])[i]! : (col as RGB)
      const ss = Array.isArray(surf[0]) ? (surf as Surf[])[i]! : (surf as Surf)
      for (let k = 0; k < segs; k++) {
        const a0 = (k / segs) * Math.PI * 2
        const a1 = ((k + 1) / segs) * Math.PI * 2
        const c0 = Math.cos(a0)
        const s0 = Math.sin(a0)
        const c1 = Math.cos(a1)
        const s1 = Math.sin(a1)
        const A: V3 = [r0 * c0, r0 * s0, z0]
        const B: V3 = [r0 * c1, r0 * s1, z0]
        const C: V3 = [r1 * c1, r1 * s1, z1]
        const D: V3 = [r1 * c0, r1 * s0, z1]
        const nA: V3 = [n0[0] * c0, n0[0] * s0, n0[1]]
        const nB: V3 = [n0[0] * c1, n0[0] * s1, n0[1]]
        const nC: V3 = [n1[0] * c1, n1[0] * s1, n1[1]]
        const nD: V3 = [n1[0] * c0, n1[0] * s0, n1[1]]
        if (r0 > 0.001) this.tri(A, B, C, nA, nB, nC, cc, ss)
        if (r1 > 0.001) this.tri(A, C, D, nA, nC, nD, cc, ss)
      }
    }
    return this.back()
  }

  cyl(x: number, y: number, z: number, r: number, h: number, col: RGB, surf: Surf, segs = 14, bevel = 0.6, r1 = r): this {
    const b = Math.min(bevel, r1 * 0.5, h * 0.5)
    return this.lathe(x, y, z, [[r, 0], [r1, h - b], [r1 - b, h], [0, h]], col, surf, segs)
  }

  // A standing outline pulled up from z by h, with a chamfer round its top.
  poly(points: V2[], z: number, h: number, col: RGB, surf: Surf, bevel = 1, top: RGB = col): this {
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!
      const b = points[(i + 1) % points.length]!
      area += a[0] * b[1] - b[0] * a[1]
    }
    const pts = area < 0 ? [...points].reverse() : points
    const N = pts.length
    const out: V2[] = []
    for (let i = 0; i < N; i++) {
      const a = pts[(i + N - 1) % N]!
      const b = pts[i]!
      const c = pts[(i + 1) % N]!
      const e1 = unit([b[0] - a[0], b[1] - a[1], 0])
      const e2 = unit([c[0] - b[0], c[1] - b[1], 0])
      const n = unit([e1[1] + e2[1], -(e1[0] + e2[0]), 0])
      out.push([n[0], n[1]])
    }
    const inner = pts.map((q, i) => [q[0] - out[i]![0] * bevel, q[1] - out[i]![1] * bevel] as V2)
    const up: V3 = [0, 0, 1]
    const tris = THREE.ShapeUtils.triangulateShape(inner.map((q) => new THREE.Vector2(q[0], q[1])), [])
    for (const t of tris) this.tri([inner[t[0]!]![0], inner[t[0]!]![1], z + h], [inner[t[1]!]![0], inner[t[1]!]![1], z + h], [inner[t[2]!]![0], inner[t[2]!]![1], z + h], up, up, up, top, surf)
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N
      const a = pts[i]!
      const b = pts[j]!
      const na: V3 = [out[i]![0], out[i]![1], 0]
      const nb: V3 = [out[j]![0], out[j]![1], 0]
      this.quad([a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z + h - bevel], [a[0], a[1], z + h - bevel], na, nb, nb, na, col, surf)
      if (bevel > 0.01) this.quad([a[0], a[1], z + h - bevel], [b[0], b[1], z + h - bevel], [inner[j]![0], inner[j]![1], z + h], [inner[i]![0], inner[i]![1], z + h], na, nb, up, up, col, surf)
    }
    return this
  }

  // A wall of one section carried round a closed outline: the section is (inset, height) from the foot up the outside, over the top and down the inside.
  ring(points: V2[], out: V2[], profile: V2[], col: RGB | RGB[], surf: Surf | Surf[], smooth = true): this {
    const N = points.length
    const ns: V2[] = []
    for (let j = 0; j < profile.length - 1; j++) {
      const di = profile[j + 1]![0] - profile[j]![0]
      const dz = profile[j + 1]![1] - profile[j]![1]
      const l = Math.hypot(di, dz) || 1
      ns.push([dz / l, di / l])
    }
    const nAt = (seg: number, end: number): V2 => {
      if (!smooth) return ns[seg]!
      const j = seg + end
      const a = ns[Math.max(0, j - 1)]!
      const b = ns[Math.min(ns.length - 1, j)]!
      const l = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1
      return [(a[0] + b[0]) / l, (a[1] + b[1]) / l]
    }
    for (let j = 0; j < profile.length - 1; j++) {
      const [i0, z0] = profile[j]!
      const [i1, z1] = profile[j + 1]!
      const n0 = nAt(j, 0)
      const n1 = nAt(j, 1)
      const cc = Array.isArray(col[0]) ? (col as RGB[])[j]! : (col as RGB)
      const ss = Array.isArray(surf[0]) ? (surf as Surf[])[j]! : (surf as Surf)
      for (let i = 0; i < N; i++) {
        const k = (i + 1) % N
        const p = points[i]!
        const q = points[k]!
        const a = out[i]!
        const b = out[k]!
        this.quad([p[0] - a[0] * i0, p[1] - a[1] * i0, z0], [q[0] - b[0] * i0, q[1] - b[1] * i0, z0], [q[0] - b[0] * i1, q[1] - b[1] * i1, z1], [p[0] - a[0] * i1, p[1] - a[1] * i1, z1],
          [a[0] * n0[0], a[1] * n0[0], n0[1]], [b[0] * n0[0], b[1] * n0[0], n0[1]], [b[0] * n1[0], b[1] * n1[0], n1[1]], [a[0] * n1[0], a[1] * n1[0], n1[1]], cc, ss)
      }
    }
    return this
  }

  // A round wire along a path.
  tube(points: V3[], r: number, col: RGB, surf: Surf, radial = 5, closed = false, ref: V3 = [0, 0, 1]): this {
    const N = points.length
    const rings: { p: V3; n: V3 }[][] = []
    for (let i = 0; i < N; i++) {
      const a = points[closed ? (i + N - 1) % N : Math.max(0, i - 1)]!
      const b = points[closed ? (i + 1) % N : Math.min(N - 1, i + 1)]!
      const t = unit(sub(b, a))
      let rf = ref
      if (Math.abs(dot(t, rf)) > 0.92) rf = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
      const u = unit(cross(t, rf))
      const w = cross(t, u)
      const ring: { p: V3; n: V3 }[] = []
      for (let k = 0; k < radial; k++) {
        const ang = (k / radial) * Math.PI * 2
        const n: V3 = [u[0] * Math.cos(ang) + w[0] * Math.sin(ang), u[1] * Math.cos(ang) + w[1] * Math.sin(ang), u[2] * Math.cos(ang) + w[2] * Math.sin(ang)]
        ring.push({ p: [points[i]![0] + n[0] * r, points[i]![1] + n[1] * r, points[i]![2] + n[2] * r], n })
      }
      rings.push(ring)
    }
    const last = closed ? N : N - 1
    for (let i = 0; i < last; i++) {
      const A = rings[i]!
      const B = rings[(i + 1) % N]!
      for (let k = 0; k < radial; k++) {
        const k1 = (k + 1) % radial
        this.quad(A[k]!.p, A[k1]!.p, B[k1]!.p, B[k]!.p, A[k]!.n, A[k1]!.n, B[k1]!.n, B[k]!.n, col, surf)
      }
    }
    return this
  }

  // A skin over sections that each hold the same count of points, with smooth normals.
  loft(sections: V3[][], col: RGB | ((row: number, k: number) => RGB), surf: Surf, caps = true): this {
    const rows = sections.length
    const cols = sections[0]!.length
    const pos: number[] = []
    for (const s of sections) for (const q of s) pos.push(q[0], q[1], q[2])
    const idx: number[] = []
    for (let i = 0; i < rows - 1; i++) for (let k = 0; k < cols - 1; k++) {
      const a = i * cols + k
      idx.push(a, a + 1, a + cols + 1, a, a + cols + 1, a + cols)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    const nor = g.getAttribute('normal')
    let cx = 0
    let cy = 0
    let cz = 0
    for (let i = 0; i < pos.length; i += 3) {
      cx += pos[i]!
      cy += pos[i + 1]!
      cz += pos[i + 2]!
    }
    const mid: V3 = [(cx / pos.length) * 3, (cy / pos.length) * 3, (cz / pos.length) * 3]
    const P = (i: number): V3 => [pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!]
    let sign = 0
    for (let i = 0; i < rows * cols; i++) sign += dot(sub(P(i), mid), [nor.getX(i), nor.getY(i), nor.getZ(i)])
    const sg = sign < 0 ? -1 : 1
    const Nn = (i: number): V3 => [nor.getX(i) * sg, nor.getY(i) * sg, nor.getZ(i) * sg]
    const flatCol = typeof col === 'function' ? col(0, 0) : col
    const tint = typeof col === 'function' ? col : null
    for (let i = 0; i < idx.length; i += 3) {
      const [a, b, c] = [idx[i]!, idx[i + 1]!, idx[i + 2]!]
      const at = (v: number): RGB => (tint ? tint(Math.floor(v / cols), v % cols) : flatCol)
      this.tri(P(a), P(b), P(c), Nn(a), Nn(b), Nn(c), at(a), surf, at(b), at(c))
    }
    if (caps) {
      for (const r of [0, rows - 1]) {
        const s = sections[r]!
        const other = sections[r === 0 ? 1 : rows - 2]!
        const n = unit(sub(s[0]!, other[0]!))
        this.flat(s, n, tint ? tint(r, 0) : flatCol, surf)
      }
    }
    g.dispose()
    return this
  }

  done(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3))
    g.setAttribute('aSurf', new THREE.Float32BufferAttribute(this.s, 4))
    g.computeBoundingSphere()
    g.computeBoundingBox()
    return g
  }
}

export interface Mats {
  solid: THREE.MeshPhysicalMaterial
  clear: THREE.MeshPhysicalMaterial
  glow: THREE.MeshPhysicalMaterial
  level: { value: number }
  fill: { value: number }
}

// The grain of a surface, from where it is on its own object: fibres on what is soft, streaks along what is brushed, smudges on what shines. It fades out where a pixel is wider than the grain, so nothing shimmers from far off.
const GRAIN = `
float wjoHash( vec3 p ) {
	p = fract( p * 0.3183099 + 0.1 );
	p *= 17.0;
	return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}
float wjoNoise( vec3 x ) {
	vec3 i = floor( x );
	vec3 f = fract( x );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( wjoHash( i ), wjoHash( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ), mix( wjoHash( i + vec3( 0.0, 1.0, 0.0 ) ), wjoHash( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ), f.y ),
		mix( mix( wjoHash( i + vec3( 0.0, 0.0, 1.0 ) ), wjoHash( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ), mix( wjoHash( i + vec3( 0.0, 1.0, 1.0 ) ), wjoHash( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ), f.y ), f.z );
}
`
const GRAIN_COLOUR = `
	float wjoWide = length( fwidth( vObj ) );
	float wjoNear = 1.0 - smoothstep( 0.35, 1.1, wjoWide );
	float wjoMid = 1.0 - smoothstep( 2.0, 6.0, wjoWide );
	float wjoSoft = smoothstep( 0.7, 0.95, vSurf.x ) * ( 1.0 - vSurf.y );
	float wjoCloth = smoothstep( 0.94, 0.965, vSurf.x ) * ( 1.0 - vSurf.y );
	float wjoFine = ( wjoNoise( vObj * 2.1 ) - 0.5 ) * wjoNear;
	float wjoSmudge = ( wjoNoise( vObj * 0.13 + 7.0 ) - 0.5 ) * wjoMid;
	float wjoStreak = ( wjoNoise( vec3( vObj.x * 0.045, vObj.y * 2.6, vObj.z * 2.6 ) ) - 0.5 ) * wjoNear;
	float wjoWeave = ( sin( vObj.x * 3.6 ) + sin( vObj.y * 3.6 ) + sin( vObj.z * 3.6 ) ) * wjoNear;
	diffuseColor.rgb *= 1.0 + wjoSoft * 0.2 * wjoFine + 0.08 * wjoSmudge + vSurf.y * 0.14 * wjoStreak + wjoCloth * 0.05 * wjoWeave;
`

// How much of the lift the models take, all together: it comes down as the tier gets lamps of its own over them.
export const FILL = 0.45

const made = new Map<string, Mats>()

// The materials of the office models, one set for a zone. One opaque material carries every finish: each vertex says how rough, how metal and how coated it is.
export function matsOf(z: Zone): Mats {
  const have = made.get(z.id)
  if (have) return have
  const fill = { value: 0 }
  const solid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 0.9 })
  solid.name = `office.solid.${z.id}`
  lit(studio(solid), z)
  const inner = solid.onBeforeCompile
  solid.onBeforeCompile = function (shader, renderer) {
    inner.call(solid, shader, renderer)
    shader.uniforms.wjoFill = fill
    shader.vertexShader = ('attribute vec4 aSurf;\nvarying vec3 vSurf;\nvarying vec3 vObj;\nvarying float vLift;\n' + shader.vertexShader).replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvSurf = aSurf.xyz;\n\tvObj = position;\n\tvLift = aSurf.w * ( 1.0 - aSurf.y ) * ( 0.3 + 0.7 * max( 0.0, normalize( mat3( modelMatrix ) * normal ).z ) );')
    shader.fragmentShader = ('uniform float wjoFill;\nvarying vec3 vSurf;\nvarying vec3 vObj;\nvarying float vLift;\n' + GRAIN + shader.fragmentShader)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GRAIN_COLOUR)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = clamp( vSurf.x + wjoSmudge * 0.16 * ( 1.0 - wjoSoft ) + vSurf.y * wjoStreak * 0.2, 0.04, 1.0 );')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * vLift * wjoFill;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n\tmetalnessFactor = clamp( vSurf.y, 0.0, 1.0 );')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n\t#ifdef USE_CLEARCOAT\n\tmaterial.clearcoat = clamp( vSurf.z, 0.0, 1.0 );\n\t#endif')
  }
  const key = solid.customProgramCacheKey
  solid.customProgramCacheKey = () => `${key.call(solid)}|office-surf-3`

  const clear = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.34, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1, side: THREE.DoubleSide })
  clear.name = `office.clear.${z.id}`
  clear.forceSinglePass = true
  lit(studio(clear), z)

  const level = { value: 0 }
  const glow = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.2, metalness: 0, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.06 })
  glow.name = `office.glow.${z.id}`
  glow.userData.lit = true
  lit(studio(glow), z)
  const innerGlow = glow.onBeforeCompile
  glow.onBeforeCompile = function (shader, renderer) {
    innerGlow.call(glow, shader, renderer)
    shader.uniforms.wjoLevel = level
    shader.fragmentShader = ('uniform float wjoLevel;\n' + shader.fragmentShader)
      .replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb *= 0.12;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb * wjoLevel;')
  }
  const glowKey = glow.customProgramCacheKey
  glow.customProgramCacheKey = () => `${glowKey.call(glow)}|office-glow`

  const out = { solid, clear, glow, level, fill }
  made.set(z.id, out)
  return out
}

export function meshOf(g: THREE.BufferGeometry, m: THREE.Material, name: string, o: { cast?: boolean; fine?: boolean } = {}): THREE.Mesh {
  const out = new THREE.Mesh(g, m)
  out.name = name
  out.castShadow = o.cast ?? false
  out.receiveShadow = true
  if (o.fine) out.userData.fine = true
  return out
}

// A screw head with a cross slot, for the one instanced mesh of screws of the zone.
export function screwGeometry(): THREE.BufferGeometry {
  const k = new Kit()
  const steel = hex(0xb9bdc2)
  k.lathe(0, 0, 0, [[4.2, 0], [4.2, 0.5], [3.1, 0.7], [3.1, 1.3], [2.5, 2.0], [0, 2.0]], [shade(steel, 0.8), shade(steel, 0.8), steel, steel, steel], SURF.steel, 10)
  const dark = hex(0x2a2c2f)
  k.box(0, 0, 1.75, 3.6, 0.7, 0.3, dark, SURF.matte, 0)
  k.box(0, 0, 1.75, 0.7, 3.6, 0.3, dark, SURF.matte, 0)
  return k.done()
}

export const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
