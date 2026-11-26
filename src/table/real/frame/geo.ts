import * as THREE from 'three'

export type RGB = [number, number, number]

// The colour of each edge of an outline: `dark` where the edge lies wholly at one of the given sides (the bottom of a groove), `base` elsewhere.
export const grooved = (outline: [number, number][], sides: number[], base: RGB, dark: RGB): ((edge: number) => RGB) => (edge) => {
  const p = outline[edge]!
  const q = outline[(edge + 1) % outline.length]!
  return sides.some((x) => Math.abs(p[0] - x) < 0.01 && Math.abs(q[0] - x) < 0.01) ? dark : base
}
export type V2 = [number, number]
export type V3 = [number, number, number]

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

export const WHITE: RGB = [1, 1, 1]

// Triangles with a place, a normal, a colour and coordinates in page pixels that run along the grain of the metal: u along it, v across.
export class Geo {
  private p: number[] = []
  private n: number[] = []
  private t: number[] = []
  private c: number[] = []

  get vertices(): number {
    return this.p.length / 3
  }
  get triangles(): number {
    return this.p.length / 9
  }

  private push(a: V3, n: V3, u: number, v: number, col: RGB): void {
    this.p.push(a[0], a[1], a[2])
    this.n.push(n[0], n[1], n[2])
    this.t.push(u, v)
    this.c.push(col[0], col[1], col[2])
  }

  // A flat face through the points, in order round it. The grain runs along `along`.
  face(points: V3[], normal: V3, along: V3, col: RGB): this {
    const nn = unit(normal)
    let al = unit(sub(along, [nn[0] * dot(along, nn), nn[1] * dot(along, nn), nn[2] * dot(along, nn)]))
    if (!Number.isFinite(al[0]) || Math.hypot(al[0], al[1], al[2]) < 0.5) al = unit(cross(nn, [0.3, 0.5, 0.8]))
    const ac = cross(nn, al)
    const flip = dot(cross(sub(points[1]!, points[0]!), sub(points[2]!, points[0]!)), nn) < 0
    for (let i = 1; i < points.length - 1; i++) {
      const tri = flip ? [points[0]!, points[i + 1]!, points[i]!] : [points[0]!, points[i]!, points[i + 1]!]
      for (const q of tri) this.push(q, nn, dot(q, al), dot(q, ac), col)
    }
    return this
  }

  // A closed outline of (side, height) pulled from a to b on the page. The side runs to the right of the way from a to b.
  prism(outline: V2[], a: V2, b: V2, col: RGB | ((edge: number) => RGB), caps: [boolean, boolean] = [true, true], base = 0): this {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const d: V3 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len, 0]
    const r: V3 = [d[1], -d[0], 0]
    let area = 0
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i]!
      const q = outline[(i + 1) % outline.length]!
      area += p[0] * q[1] - q[0] * p[1]
    }
    const sign = area > 0 ? 1 : -1
    const at = (end: V2, o: V2): V3 => [end[0] + r[0] * o[0], end[1] + r[1] * o[0], base + o[1]]
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i]!
      const q = outline[(i + 1) % outline.length]!
      const es = q[0] - p[0]
      const ez = q[1] - p[1]
      if (Math.hypot(es, ez) < 1e-6) continue
      const ns = sign * ez
      const nz = -sign * es
      this.face([at(a, p), at(b, p), at(b, q), at(a, q)], [r[0] * ns, r[1] * ns, nz], d, typeof col === 'function' ? col(i) : col)
    }
    if (caps[0] || caps[1]) {
      const tris = THREE.ShapeUtils.triangulateShape(outline.map((o) => new THREE.Vector2(o[0], o[1])), [])
      const c0 = typeof col === 'function' ? col(0) : col
      for (const tri of tris) {
        if (caps[0]) this.face(tri.map((k) => at(a, outline[k]!)), [-d[0], -d[1], 0], r, c0)
        if (caps[1]) this.face(tri.map((k) => at(b, outline[k]!)), d, r, c0)
      }
    }
    return this
  }

  // A flat outline on the page pulled up from z0 to z1, with its top face and, if asked, a bevel round the top.
  slab(loop: V2[], z0: number, z1: number, col: RGB, o: { bevel?: number; along?: V3; top?: RGB; bottom?: boolean; sides?: boolean } = {}): this {
    const bevel = o.bevel ?? 0
    const along = o.along ?? [1, 0, 0]
    let area = 0
    for (let i = 0; i < loop.length; i++) {
      const p = loop[i]!
      const q = loop[(i + 1) % loop.length]!
      area += p[0] * q[1] - q[0] * p[1]
    }
    const ccw = area > 0 ? 1 : -1
    const n = loop.length
    const outN: V2[] = loop.map((p, i) => {
      const q = loop[(i + 1) % n]!
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
      return [(ccw * (q[1] - p[1])) / l, (-ccw * (q[0] - p[0])) / l]
    })
    const inner: V2[] = loop.map((p, i) => {
      if (bevel <= 0) return p
      const a = outN[(i + n - 1) % n]!
      const b = outN[i]!
      const mx = a[0] + b[0]
      const my = a[1] + b[1]
      const k = bevel / Math.max(0.3, 1 + a[0] * b[0] + a[1] * b[1])
      return [p[0] - mx * k, p[1] - my * k]
    })
    const tris = THREE.ShapeUtils.triangulateShape(inner.map((q) => new THREE.Vector2(q[0], q[1])), [])
    for (const tri of tris) this.face(tri.map((k) => [inner[k]![0], inner[k]![1], z1] as V3), [0, 0, 1], along, o.top ?? col)
    if (o.bottom) for (const tri of tris) this.face(tri.map((k) => [loop[k]![0], loop[k]![1], z0] as V3), [0, 0, -1], along, col)
    if (o.sides === false) return this
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const p = loop[i]!
      const q = loop[j]!
      const nn = outN[i]!
      const d: V3 = [q[0] - p[0], q[1] - p[1], 0]
      if (Math.hypot(d[0], d[1]) < 1e-6) continue
      const zs = z1 - bevel
      this.face([[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], zs], [p[0], p[1], zs]], [nn[0], nn[1], 0], d, col)
      if (bevel > 0) this.face([[p[0], p[1], zs], [q[0], q[1], zs], [inner[j]![0], inner[j]![1], z1], [inner[i]![0], inner[i]![1], z1]], [nn[0], nn[1], 1], d, col)
    }
    return this
  }

  // A turned thing: (radius, height) pairs from the bottom up, spun round a centre. Smooth round the axis, crisp along the outline.
  lathe(outline: V2[], cx: number, cy: number, segs: number, col: RGB | ((step: number) => RGB), base = 0, arc: [number, number] = [0, Math.PI * 2]): this {
    for (let k = 0; k < outline.length - 1; k++) {
      const p = outline[k]!
      const q = outline[k + 1]!
      const dr = q[0] - p[0]
      const dz = q[1] - p[1]
      const l = Math.hypot(dr, dz)
      if (l < 1e-6) continue
      const nr = dz / l
      const nz = -dr / l
      const colour = typeof col === 'function' ? col(k) : col
      for (let i = 0; i < segs; i++) {
        const a0 = arc[0] + ((arc[1] - arc[0]) * i) / segs
        const a1 = arc[0] + ((arc[1] - arc[0]) * (i + 1)) / segs
        const c0 = Math.cos(a0)
        const s0 = Math.sin(a0)
        const c1 = Math.cos(a1)
        const s1 = Math.sin(a1)
        const v = (r: number, c: number, s: number, z: number): V3 => [cx + r * c, cy + r * s, base + z]
        const n0: V3 = [nr * c0, nr * s0, nz]
        const n1: V3 = [nr * c1, nr * s1, nz]
        const rm = Math.max(1, (p[0] + q[0]) / 2)
        const quad: [V3, V3, number, number][] = [[v(p[0], c0, s0, p[1]), n0, a0 * rm, 0], [v(p[0], c1, s1, p[1]), n1, a1 * rm, 0], [v(q[0], c1, s1, q[1]), n1, a1 * rm, l], [v(q[0], c0, s0, q[1]), n0, a0 * rm, l]]
        const order = sign(quad[0]![0], quad[1]![0], quad[2]![0], quad[3]![0], n0) ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]
        for (const m of order) this.push(quad[m]![0], quad[m]![1], quad[m]![2], quad[m]![3] + p[0], colour)
      }
    }
    return this
  }

  // A turned thing with a slot cut through it. Both walls of the slot run parallel, `half` either side of the line from the centre toward `toward`.
  slotted(outline: V2[], cx: number, cy: number, segs: number, col: RGB | ((step: number) => RGB), toward: number, half: number): this {
    const open = (r: number): number => (r > half ? Math.asin(half / r) : Math.PI / 2)
    const angle = (r: number, i: number): number => toward + open(r) + ((Math.PI * 2 - 2 * open(r)) * i) / segs
    const v = (r: number, a: number, z: number): V3 => [cx + r * Math.cos(a), cy + r * Math.sin(a), z]
    for (let k = 0; k < outline.length - 1; k++) {
      const p = outline[k]!
      const q = outline[k + 1]!
      const dr = q[0] - p[0]
      const dz = q[1] - p[1]
      const l = Math.hypot(dr, dz)
      if (l < 1e-6) continue
      const nr = dz / l
      const nz = -dr / l
      const colour = typeof col === 'function' ? col(k) : col
      const rm = Math.max(1, (p[0] + q[0]) / 2)
      const n = (a: number): V3 => [nr * Math.cos(a), nr * Math.sin(a), nz]
      for (let i = 0; i < segs; i++) {
        const p0 = angle(p[0], i)
        const p1 = angle(p[0], i + 1)
        const q0 = angle(q[0], i)
        const q1 = angle(q[0], i + 1)
        const quad: [V3, V3, number, number][] = [[v(p[0], p0, p[1]), n(p0), p0 * rm, 0], [v(p[0], p1, p[1]), n(p1), p1 * rm, 0], [v(q[0], q1, q[1]), n(q1), q1 * rm, l], [v(q[0], q0, q[1]), n(q0), q0 * rm, l]]
        const order = sign(quad[0]![0], quad[1]![0], quad[2]![0], quad[3]![0], n(p0)) ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]
        for (const m of order) this.push(quad[m]![0], quad[m]![1], quad[m]![2], quad[m]![3] + p[0], colour)
      }
      if (Math.abs(dr) < 1e-6) continue
      for (const [i, turn] of [[0, -1], [segs, 1]] as [number, number][]) {
        const a = angle(p[0], i)
        const b = angle(q[0], i)
        this.face([v(p[0], a, p[1]), v(q[0], b, q[1]), v(q[0], b, 0), v(p[0], a, 0)], [-turn * Math.sin(toward), turn * Math.cos(toward), 0], [Math.cos(toward), Math.sin(toward), 0], colour)
      }
    }
    return this
  }

  // A round pipe along a path of points. `inward` turns its faces to the inside.
  pipe(path: V3[], radius: number, segs: number, col: RGB, inward = false, arc: [number, number] = [0, Math.PI * 2]): this {
    const frames: { o: V3; s: V3; u: V3 }[] = []
    let run = 0
    const runs: number[] = []
    for (let i = 0; i < path.length; i++) {
      const a = path[Math.max(0, i - 1)]!
      const b = path[Math.min(path.length - 1, i + 1)]!
      const t = unit(sub(b, a))
      const ref: V3 = Math.abs(t[2]) > 0.92 ? [1, 0, 0] : [0, 0, 1]
      const prev = frames[i - 1]?.s
      const kept: V3 | null = prev ? sub(prev, [t[0] * dot(prev, t), t[1] * dot(prev, t), t[2] * dot(prev, t)]) : null
      const s = unit(kept && Math.hypot(...kept) > 0.2 ? kept : cross(t, ref))
      const u = unit(cross(s, t))
      frames.push({ o: path[i]!, s, u })
      if (i > 0) run += Math.hypot(...sub(path[i]!, path[i - 1]!))
      runs.push(run)
    }
    for (let i = 0; i < path.length - 1; i++) {
      for (let k = 0; k < segs; k++) {
        const a0 = arc[0] + ((arc[1] - arc[0]) * k) / segs
        const a1 = arc[0] + ((arc[1] - arc[0]) * (k + 1)) / segs
        const corner = (f: { o: V3; s: V3; u: V3 }, a: number, at: number): [V3, V3, number, number] => {
          const c = Math.cos(a)
          const s = Math.sin(a)
          const nn: V3 = [f.s[0] * c + f.u[0] * s, f.s[1] * c + f.u[1] * s, f.s[2] * c + f.u[2] * s]
          return [[f.o[0] + nn[0] * radius, f.o[1] + nn[1] * radius, f.o[2] + nn[2] * radius], inward ? [-nn[0], -nn[1], -nn[2]] : nn, at, a * radius]
        }
        const quad = [corner(frames[i]!, a0, runs[i]!), corner(frames[i + 1]!, a0, runs[i + 1]!), corner(frames[i + 1]!, a1, runs[i + 1]!), corner(frames[i]!, a1, runs[i]!)]
        const order = sign(quad[0]![0], quad[1]![0], quad[2]![0], quad[3]![0], quad[0]![1]) ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]
        for (const m of order) this.push(quad[m]![0], quad[m]![1], quad[m]![2], quad[m]![3], col)
      }
    }
    return this
  }

  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: RGB, o: { bevel?: number; along?: V3; top?: RGB; bottom?: boolean } = {}): this {
    return this.slab([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, col, { along: o.along ?? (x1 - x0 >= y1 - y0 ? [1, 0, 0] : [0, 1, 0]), ...o })
  }

  // Everything added since `from` is moved by the matrix.
  // Shades the colour of every vertex from `from` on by its place: a turned face that is lighter on one side.
  tint(from: number, by: (x: number, y: number, z: number) => number): this {
    for (let i = from; i < this.vertices; i++) {
      const k = by(this.p[i * 3]!, this.p[i * 3 + 1]!, this.p[i * 3 + 2]!)
      this.c[i * 3] = this.c[i * 3]! * k
      this.c[i * 3 + 1] = this.c[i * 3 + 1]! * k
      this.c[i * 3 + 2] = this.c[i * 3 + 2]! * k
    }
    return this
  }

  move(from: number, m: THREE.Matrix4): this {
    const v = new THREE.Vector3()
    const nm = new THREE.Matrix3().getNormalMatrix(m)
    for (let i = from; i < this.vertices; i++) {
      v.set(this.p[i * 3]!, this.p[i * 3 + 1]!, this.p[i * 3 + 2]!).applyMatrix4(m)
      this.p[i * 3] = v.x
      this.p[i * 3 + 1] = v.y
      this.p[i * 3 + 2] = v.z
      v.set(this.n[i * 3]!, this.n[i * 3 + 1]!, this.n[i * 3 + 2]!).applyMatrix3(nm).normalize()
      this.n[i * 3] = v.x
      this.n[i * 3 + 1] = v.y
      this.n[i * 3 + 2] = v.z
    }
    return this
  }

  // The coordinates of everything added since `from` are set anew by a rule of the place.
  map(from: number, uv: (x: number, y: number, z: number) => V2): this {
    for (let i = from; i < this.vertices; i++) {
      const q = uv(this.p[i * 3]!, this.p[i * 3 + 1]!, this.p[i * 3 + 2]!)
      this.t[i * 2] = q[0]
      this.t[i * 2 + 1] = q[1]
    }
    return this
  }

  done(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3))
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3))
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.t), 2))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3))
    g.computeBoundingSphere()
    g.computeBoundingBox()
    return g
  }
}

function sign(a: V3, b: V3, c: V3, d: V3, n: V3): boolean {
  const x = cross(sub(b, a), sub(c, a))
  const y = cross(sub(c, a), sub(d, a))
  return dot([x[0] + y[0], x[1] + y[1], x[2] + y[2]], n) >= 0
}

export const circleLoop = (cx: number, cy: number, r: number, segs: number): V2[] => Array.from({ length: segs }, (_, i) => [cx + r * Math.cos((i / segs) * Math.PI * 2), cy + r * Math.sin((i / segs) * Math.PI * 2)] as V2)

export const roundedLoop = (x0: number, x1: number, y0: number, y1: number, r: number, steps = 4): V2[] => {
  const out: V2[] = []
  const corners: [number, number, number][] = [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]]
  for (const c of corners) for (let i = 0; i <= steps; i++) out.push([c[0] + r * Math.cos(c[2] + (i / steps) * (Math.PI / 2)), c[1] + r * Math.sin(c[2] + (i / steps) * (Math.PI / 2))])
  return out
}
