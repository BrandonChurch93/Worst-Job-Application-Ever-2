import * as THREE from 'three'

export type V2 = [number, number]
export type V3 = [number, number, number]
export type RGB = [number, number, number]

export const rgb = (hex: number): RGB => {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b]
}
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

// The kinds of surface the paint material knows: the third number of the `face` attribute.
export const KIND = { plain: 0, brick: 1, block: 2, concrete: 3, shingle: 4, board: 5, stucco: 6, gloss: 7, sheeting: 8, tar: 9, painted: 10, enamel: 11 }

// Triangles with a place, a normal, a colour and a `face` attribute: two coordinates in page pixels along the face and the kind of surface.
export class Geo {
  private p: number[] = []
  private n: number[] = []
  private c: number[] = []
  private f: number[] = []

  mark(): number {
    return this.p.length / 3
  }
  get triangles(): number {
    return this.p.length / 9
  }

  private push(a: V3, n: V3, col: RGB, u: number, v: number, kind: number): void {
    this.p.push(a[0], a[1], a[2])
    this.n.push(n[0], n[1], n[2])
    this.c.push(col[0], col[1], col[2])
    this.f.push(u, v, kind)
  }

  private uv(n: V3): (q: V3) => V2 {
    if (Math.abs(n[2]) > 0.999) return (q) => [q[0], q[1]]
    const t = unit(cross([0, 0, 1], n))
    const b = cross(n, t)
    return (q) => [dot(q, t), dot(q, b)]
  }

  // A flat face through the points, in order, seen from outside counter clockwise.
  face(points: V3[], col: RGB, kind = 0, normal?: V3): this {
    const nn = normal ? unit(normal) : unit(cross(sub(points[1]!, points[0]!), sub(points[2]!, points[0]!)))
    const at = this.uv(nn)
    const flat = Math.abs(nn[2]) > 0.5 ? kind + 0.25 : kind
    for (let i = 1; i < points.length - 1; i++) {
      for (const q of [points[0]!, points[i]!, points[i + 1]!]) {
        const w = at(q)
        this.push(q, nn, col, w[0], w[1], flat)
      }
    }
    return this
  }

  quad(a: V3, b: V3, c: V3, d: V3, col: RGB, kind = 0): this {
    return this.face([a, b, c, d], col, kind)
  }

  // A flat quad whose colour runs between its four corners.
  blend(q: V3[], cols: RGB[], normal: V3, kind = 0): this {
    const nn = unit(normal)
    const at = this.uv(nn)
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const w = at(q[k]!)
      this.push(q[k]!, nn, cols[k]!, w[0], w[1], kind)
    }
    return this
  }

  // A smooth quad: each corner has its own normal.
  smooth(q: [V3, V3][], col: RGB, kind = 0, uvs?: V2[]): this {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const w = uvs ? uvs[k]! : ([q[k]![0][0], q[k]![0][1]] as V2)
      this.push(q[k]![0], q[k]![1], col, w[0], w[1], kind)
    }
    return this
  }

  // A box. `bevel` cuts the edges round its top; `skip` leaves out faces: any of the letters of x- 'l', x+ 'r', y- 'f', y+ 'b', top 't', bottom 'u'. The bottom is left out unless `under` is set.
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: RGB, o: { bevel?: number; top?: RGB; skip?: string; under?: boolean; kind?: number; topKind?: number } = {}): this {
    const b = Math.min(o.bevel ?? 0, (x1 - x0) / 2, (y1 - y0) / 2, z1 - z0)
    const skip = o.skip ?? ''
    const k = o.kind ?? 0
    const zs = z1 - b
    if (!skip.includes('f')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, zs], [x0, y0, zs], col, k)
    if (!skip.includes('b')) this.quad([x1, y1, z0], [x0, y1, z0], [x0, y1, zs], [x1, y1, zs], col, k)
    if (!skip.includes('l')) this.quad([x0, y1, z0], [x0, y0, z0], [x0, y0, zs], [x0, y1, zs], col, k)
    if (!skip.includes('r')) this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, zs], [x1, y0, zs], col, k)
    if (!skip.includes('t')) this.quad([x0 + b, y0 + b, z1], [x1 - b, y0 + b, z1], [x1 - b, y1 - b, z1], [x0 + b, y1 - b, z1], o.top ?? col, o.topKind ?? k)
    if (o.under) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0], col, k)
    if (b > 0) {
      const hi = mix(col, [1, 1, 1], 0.12)
      if (!skip.includes('f')) this.quad([x0, y0, zs], [x1, y0, zs], [x1 - b, y0 + b, z1], [x0 + b, y0 + b, z1], hi, k)
      if (!skip.includes('b')) this.quad([x1, y1, zs], [x0, y1, zs], [x0 + b, y1 - b, z1], [x1 - b, y1 - b, z1], hi, k)
      if (!skip.includes('l')) this.quad([x0, y1, zs], [x0, y0, zs], [x0 + b, y0 + b, z1], [x0 + b, y1 - b, z1], hi, k)
      if (!skip.includes('r')) this.quad([x1, y0, zs], [x1, y1, zs], [x1 - b, y1 - b, z1], [x1 - b, y0 + b, z1], hi, k)
    }
    return this
  }

  // A turned thing: (radius, height) pairs from the bottom up, spun round a centre. Smooth round the axis, crisp along the outline. `wave` flutes it: [count, depth].
  lathe(outline: V2[], cx: number, cy: number, segs: number, col: RGB | ((step: number) => RGB), o: { base?: number; arc?: V2; kind?: number; wave?: V2; soft?: boolean } = {}): this {
    const base = o.base ?? 0
    const arc = o.arc ?? [0, Math.PI * 2]
    const kind = o.kind ?? 0
    const wave = o.wave
    const rad = (r: number, a: number): number => (wave ? r * (1 - wave[1] * (0.5 + 0.5 * Math.cos(a * wave[0]))) : r)
    const flat: V2[] = []
    for (let k = 0; k < outline.length - 1; k++) {
      const dr = outline[k + 1]![0] - outline[k]![0]
      const dz = outline[k + 1]![1] - outline[k]![1]
      const l = Math.hypot(dr, dz) || 1
      flat.push([dz / l, -dr / l])
    }
    // With `soft` the outline is smooth too: each point takes the mean of the two lengths that meet in it.
    const at = (k: number): V2 => {
      const a = flat[Math.max(0, k - 1)]!
      const c = flat[Math.min(flat.length - 1, k)]!
      const l = Math.hypot(a[0] + c[0], a[1] + c[1]) || 1
      return [(a[0] + c[0]) / l, (a[1] + c[1]) / l]
    }
    for (let k = 0; k < outline.length - 1; k++) {
      const p = outline[k]!
      const q = outline[k + 1]!
      const dr = q[0] - p[0]
      const dz = q[1] - p[1]
      const l = Math.hypot(dr, dz)
      if (l < 1e-6) continue
      const np = o.soft ? at(k) : flat[k]!
      const nq = o.soft ? at(k + 1) : flat[k]!
      const colour = typeof col === 'function' ? col(k) : col
      for (let i = 0; i < segs; i++) {
        const a0 = arc[0] + ((arc[1] - arc[0]) * i) / segs
        const a1 = arc[0] + ((arc[1] - arc[0]) * (i + 1)) / segs
        const corner = (r: number, z: number, a: number, n: V2): [V3, V3] => {
          const c = Math.cos(a)
          const s = Math.sin(a)
          const lean = wave ? wave[1] * wave[0] * 0.5 * Math.sin(a * wave[0]) : 0
          return [[cx + rad(r, a) * c, cy + rad(r, a) * s, base + z], unit([n[0] * c - lean * s * n[0], n[0] * s + lean * c * n[0], n[1]])]
        }
        const rm = Math.max(1, (p[0] + q[0]) / 2)
        this.smooth([corner(p[0], p[1], a0, np), corner(p[0], p[1], a1, np), corner(q[0], q[1], a1, nq), corner(q[0], q[1], a0, nq)], colour, kind, [[a0 * rm, p[1]], [a1 * rm, p[1]], [a1 * rm, q[1]], [a0 * rm, q[1]], [a0 * rm, p[1]], [a1 * rm, q[1]]].filter((_, j) => j < 4) as V2[])
      }
    }
    return this
  }

  // A flat outline on the page, counter clockwise, pulled up from z0 to z1 with its top face.
  slab(loop: V2[], z0: number, z1: number, col: RGB, o: { top?: RGB; kind?: number; topKind?: number; sides?: boolean; under?: boolean } = {}): this {
    const k = o.kind ?? 0
    const tris = THREE.ShapeUtils.triangulateShape(loop.map((q) => new THREE.Vector2(q[0], q[1])), [])
    for (const tri of tris) this.face(tri.map((i) => [loop[i]![0], loop[i]![1], z1] as V3), o.top ?? col, o.topKind ?? k, [0, 0, 1])
    if (o.under) for (const tri of tris) this.face([tri[0]!, tri[2]!, tri[1]!].map((i) => [loop[i]![0], loop[i]![1], z0] as V3), col, k, [0, 0, -1])
    if (o.sides === false) return this
    for (let i = 0; i < loop.length; i++) {
      const p = loop[i]!
      const q = loop[(i + 1) % loop.length]!
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) continue
      this.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], col, k)
    }
    return this
  }

  // A round bar from a to b.
  rod(a: V3, b: V3, r: number, segs: number, col: RGB, kind = 0, caps = true): this {
    const t = unit(sub(b, a))
    const ref: V3 = Math.abs(t[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]
    const s = unit(cross(t, ref))
    const u = cross(s, t)
    const ring = (o: V3, k: number): [V3, V3] => {
      const ang = (k / segs) * Math.PI * 2
      const nn: V3 = [s[0] * Math.cos(ang) + u[0] * Math.sin(ang), s[1] * Math.cos(ang) + u[1] * Math.sin(ang), s[2] * Math.cos(ang) + u[2] * Math.sin(ang)]
      return [[o[0] + nn[0] * r, o[1] + nn[1] * r, o[2] + nn[2] * r], nn]
    }
    for (let k = 0; k < segs; k++) this.smooth([ring(a, k + 1), ring(a, k), ring(b, k), ring(b, k + 1)], col, kind)
    if (caps) {
      const top: V3[] = []
      const bot: V3[] = []
      for (let k = 0; k < segs; k++) {
        top.push(ring(b, segs - k)[0])
        bot.push(ring(a, k)[0])
      }
      this.face(top, col, kind, t)
      this.face(bot, col, kind, [-t[0], -t[1], -t[2]])
    }
    return this
  }

  // Everything added since `from` is moved by the matrix.
  move(from: number, m: THREE.Matrix4): this {
    const nm = new THREE.Matrix3().getNormalMatrix(m)
    const v = new THREE.Vector3()
    for (let i = from * 3; i < this.p.length; i += 3) {
      v.set(this.p[i]!, this.p[i + 1]!, this.p[i + 2]!).applyMatrix4(m)
      this.p[i] = v.x
      this.p[i + 1] = v.y
      this.p[i + 2] = v.z
      v.set(this.n[i]!, this.n[i + 1]!, this.n[i + 2]!).applyMatrix3(nm).normalize()
      this.n[i] = v.x
      this.n[i + 1] = v.y
      this.n[i + 2] = v.z
    }
    return this
  }

  // The same, by a turn about the z axis through the origin and then a shift.
  place(from: number, x: number, y: number, z = 0, turn = 0): this {
    return this.move(from, new THREE.Matrix4().makeRotationZ(turn).setPosition(x, y, z))
  }

  add(other: Geo): this {
    for (const k of ['p', 'n', 'c', 'f'] as const) for (const x of other[k]) this[k].push(x)
    return this
  }

  done(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    if (this.p.length === 0) this.face([[0, 0, -1], [0.01, 0, -1], [0, 0.01, -1]], [0.1, 0.1, 0.1])
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3))
    g.setAttribute('face', new THREE.Float32BufferAttribute(this.f, 3))
    g.computeBoundingSphere()
    g.computeBoundingBox()
    return g
  }
}

// The buckets a model writes into: one geometry for each material of the zone.
export interface Buckets {
  paint: Geo
  metal: Geo
  glow: Geo
  glass: Geo
  // Screws, as [x, y, z, radius].
  screws: [number, number, number, number][]
}

export const buckets = (): Buckets => ({ paint: new Geo(), metal: new Geo(), glow: new Geo(), glass: new Geo(), screws: [] })
