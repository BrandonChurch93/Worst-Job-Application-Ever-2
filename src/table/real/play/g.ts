import * as THREE from 'three'
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type RGB = [number, number, number]
export type V2 = [number, number]
export type V3 = [number, number, number]
// How a surface is finished: its roughness, how much of it is metal, and how much clear coat lies on it.
export type Finish = [number, number, number]
export interface Look { col: RGB; fin: Finish }

export const DEG = Math.PI / 180

export const rgb = (hex: number): RGB => {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b]
}
export const look = (hex: number, rough: number, metal = 0, coat = 0): Look => ({ col: rgb(hex), fin: [rough, metal, coat] })

const clean = (g: THREE.BufferGeometry, creaseDeg: number): THREE.BufferGeometry => {
  const out = toCreasedNormals(g, creaseDeg * DEG)
  if (out !== g) g.dispose()
  out.deleteAttribute('uv')
  return out
}

// A profile of (radius, height) turned round the z axis, from the bottom up for a face that looks outward.
export const lathe = (points: V2[], segs = 24, creaseDeg = 35): THREE.BufferGeometry => clean(new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(Math.max(p[0], 0.001), p[1])), segs).rotateX(Math.PI / 2), creaseDeg)

// An outline on the floor pulled up from z0 to z1, with a rounded edge top and bottom.
export const prism = (outline: V2[], z0: number, z1: number, bevel = 0, bevelSegs = 2, creaseDeg = 35): THREE.BufferGeometry => {
  const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p[0], p[1])))
  const g = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0 - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: bevelSegs, curveSegments: 1 })
  g.translate(0, 0, z0 + bevel)
  return clean(g, creaseDeg)
}

export const box = (w: number, h: number, d: number): THREE.BufferGeometry => clean(new THREE.BoxGeometry(w, h, d), 20)
export const ball = (r: number, w = 10, h = 6): THREE.BufferGeometry => clean(new THREE.SphereGeometry(r, w, h), 80)

// A round wire through the points.
export const wire = (points: V3[], r: number, radial = 8, per = 3, closed = false, straight = false): THREE.BufferGeometry => {
  const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  const curve = straight ? polyline(pts) : new THREE.CatmullRomCurve3(pts, closed, 'centripetal')
  return clean(new THREE.TubeGeometry(curve, Math.max(1, (points.length - (closed ? 0 : 1)) * per), r, radial, closed), 80)
}

const polyline = (pts: THREE.Vector3[]): THREE.CurvePath<THREE.Vector3> => {
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(pts[i - 1]!, pts[i]!))
  return path
}

// A straight round rod from a to b, with flat ends.
export const rod = (a: V3, b: V3, r: number, radial = 8, r2 = r): THREE.BufferGeometry => {
  const va = new THREE.Vector3(a[0], a[1], a[2])
  const vb = new THREE.Vector3(b[0], b[1], b[2])
  const len = va.distanceTo(vb)
  const g = new THREE.CylinderGeometry(r2, r, len, radial, 1, false)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()))
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
  return clean(g, 50)
}

// A closed section of (across, up) swept along a path. `frames` gives the place, the way across and the way up at every step.
export const sweep = (section: V2[], frames: { at: V3; side: V3; up: V3 }[], creaseDeg = 50): THREE.BufferGeometry => {
  const p: number[] = []
  const at = (f: { at: V3; side: V3; up: V3 }, s: V2): V3 => [f.at[0] + f.side[0] * s[0] + f.up[0] * s[1], f.at[1] + f.side[1] * s[0] + f.up[1] * s[1], f.at[2] + f.side[2] * s[0] + f.up[2] * s[1]]
  const quad = (a: V3, b: V3, c: V3, d: V3): void => {
    p.push(...a, ...b, ...c, ...a, ...c, ...d)
  }
  for (let i = 1; i < frames.length; i++) {
    const f0 = frames[i - 1]!
    const f1 = frames[i]!
    for (let k = 0; k < section.length; k++) {
      const s0 = section[k]!
      const s1 = section[(k + 1) % section.length]!
      quad(at(f0, s0), at(f1, s0), at(f1, s1), at(f0, s1))
    }
  }
  for (const [f, flip] of [[frames[0]!, false], [frames[frames.length - 1]!, true]] as const) {
    const tris = THREE.ShapeUtils.triangulateShape(section.map((s) => new THREE.Vector2(s[0], s[1])), [])
    for (const t of tris) {
      const a = at(f, section[t[0]!]!)
      const b = at(f, section[t[1]!]!)
      const c = at(f, section[t[2]!]!)
      if (flip) p.push(...a, ...b, ...c)
      else p.push(...a, ...c, ...b)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.computeVertexNormals()
  return clean(g, creaseDeg)
}

export const mat = (o: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number | V3 }): THREE.Matrix4 => {
  const s = o.s === undefined ? [1, 1, 1] : typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s
  return new THREE.Matrix4().compose(new THREE.Vector3(o.x ?? 0, o.y ?? 0, o.z ?? 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, 'ZYX')), new THREE.Vector3(s[0], s[1], s[2]))
}

// Collects pieces, each with its colour and finish, into one geometry.
export class Bag {
  private list: THREE.BufferGeometry[] = []
  private alpha: boolean
  constructor(alpha = false) {
    this.alpha = alpha
  }
  add(g: THREE.BufferGeometry, l: Look, m?: THREE.Matrix4, a = 1, by?: (nx: number, ny: number, nz: number) => number): this {
    if (g.index) {
      const flat = g.toNonIndexed()
      g.dispose()
      g = flat
    }
    if (m) {
      g.applyMatrix4(m)
      if (m.determinant() < 0) {
        const pos = g.getAttribute('position')
        const nor = g.getAttribute('normal')
        for (const attr of [pos, nor]) {
          for (let i = 0; i < attr.count; i += 3) {
            const x = attr.getX(i + 1)
            const y = attr.getY(i + 1)
            const z = attr.getZ(i + 1)
            attr.setXYZ(i + 1, attr.getX(i + 2), attr.getY(i + 2), attr.getZ(i + 2))
            attr.setXYZ(i + 2, x, y, z)
          }
        }
      }
    }
    const n = g.getAttribute('position').count
    const size = this.alpha ? 4 : 3
    const c = new Float32Array(n * size)
    const f = new Float32Array(n * 3)
    const nor = by ? g.getAttribute('normal') : null
    for (let i = 0; i < n; i++) {
      const k = by && nor ? by(nor.getX(i), nor.getY(i), nor.getZ(i)) : 1
      c[i * size] = l.col[0] * k
      c[i * size + 1] = l.col[1] * k
      c[i * size + 2] = l.col[2] * k
      if (this.alpha) c[i * size + 3] = a
      f[i * 3] = l.fin[0]
      f[i * 3 + 1] = l.fin[1]
      f[i * 3 + 2] = l.fin[2]
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, size))
    g.setAttribute('wjpFinish', new THREE.BufferAttribute(f, 3))
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'wjpFinish'].includes(name)) g.deleteAttribute(name)
    this.list.push(g)
    return this
  }
  get empty(): boolean {
    return this.list.length === 0
  }
  done(): THREE.BufferGeometry {
    const out = mergeGeometries(this.list, false)
    for (const g of this.list) g.dispose()
    this.list = []
    out.computeBoundingSphere()
    out.computeBoundingBox()
    return out
  }
}

export const ease = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
