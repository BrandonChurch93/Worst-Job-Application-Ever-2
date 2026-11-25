import * as THREE from 'three'
import { AXIS, solid } from './shape'

export interface StripSet {
  count: number
  // x, y, z at rest and the distance in from the outline, for every corner of every triangle.
  rest: Float32Array
  ink: Float32Array
  // The direction each corner faces at rest, in the body's own space.
  normal: Float32Array
  strip: Uint16Array
  from: number
  width: number
}

interface Corner { x: number; y: number; z: number; ink: number; inset: number; nx: number; ny: number; nz: number }

const sets = new Map<number, StripSet>()
let restNormals: Float32Array | null = null

function normalsAtRest(): Float32Array {
  if (restNormals) return restNormals
  const s = solid()
  const p = new Float32Array(s.rest)
  for (let i = 1; i < p.length; i += 3) p[i] = -p[i]!
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(p, 3))
  g.setIndex(new THREE.BufferAttribute(s.index, 1))
  g.computeVertexNormals()
  restNormals = new Float32Array(g.getAttribute('normal').array)
  g.dispose()
  return restNormals
}

const across = (c: { x: number; y: number }): number => c.x * AXIS[1] - c.y * AXIS[0]

export function cutBand(count: number): { from: number; width: number } {
  const s = solid()
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < s.rest.length; i += 3) {
    const v = s.rest[i]! * AXIS[1] - s.rest[i + 1]! * AXIS[0]
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  return { from: lo - 0.001, width: (hi - lo + 0.002) / count }
}

function clip(poly: Corner[], limit: number, keepAbove: boolean, cut: Corner[]): Corner[] {
  const out: Corner[] = []
  const side = (c: Corner): number => (keepAbove ? across(c) - limit : limit - across(c))
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const sa = side(a)
    const sb = side(b)
    if (sa >= 0) out.push(a)
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb)
      const m: Corner = {
        x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, ink: a.ink + (b.ink - a.ink) * t, inset: a.inset + (b.inset - a.inset) * t,
        nx: a.nx + (b.nx - a.nx) * t, ny: a.ny + (b.ny - a.ny) * t, nz: a.nz + (b.nz - a.nz) * t
      }
      out.push(m)
      cut.push(m)
    }
  }
  return out
}

// The solid cut into strips along the tail, each closed with a face at its cuts.
export function stripSet(count: number): StripSet {
  const have = sets.get(count)
  if (have) return have
  const s = solid()
  const n = normalsAtRest()
  const band = cutBand(count)
  const rest: number[] = []
  const ink: number[] = []
  const normal: number[] = []
  const strip: number[] = []
  const corner = (i: number): Corner => ({ x: s.rest[i * 3]!, y: s.rest[i * 3 + 1]!, z: s.rest[i * 3 + 2]!, ink: s.ink[i]!, inset: s.inset[i]!, nx: n[i * 3]!, ny: n[i * 3 + 1]!, nz: n[i * 3 + 2]! })
  const push = (c: Corner, k: number): void => {
    rest.push(c.x, c.y, c.z, c.inset)
    ink.push(c.ink)
    normal.push(c.nx, c.ny, c.nz)
    strip.push(k)
  }
  const cap = (a: Corner, b: Corner, k: number, sign: number): void => {
    if (a.z < 1e-4 && b.z < 1e-4) return
    const nx = AXIS[1] * sign
    const ny = AXIS[0] * sign
    const mk = (c: Corner, z: number): Corner => ({ ...c, z, ink: 1, nx, ny, nz: 0 })
    const quad = [mk(a, a.z), mk(b, b.z), mk(b, 0), mk(a, 0)]
    // Seen from outside the strip, the face's corners run anticlockwise.
    const ex = quad[1]!.x - quad[0]!.x
    const ey = -(quad[1]!.y - quad[0]!.y)
    const ez = quad[1]!.z - quad[0]!.z
    const fx = quad[3]!.x - quad[0]!.x
    const fy = -(quad[3]!.y - quad[0]!.y)
    const fz = quad[3]!.z - quad[0]!.z
    const facing = (ey * fz - ez * fy) * nx + (ez * fx - ex * fz) * ny
    const order = facing >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]
    for (const i of order) push(quad[i]!, k)
  }
  for (let t = 0; t < s.index.length; t += 3) {
    const tri = [corner(s.index[t]!), corner(s.index[t + 1]!), corner(s.index[t + 2]!)]
    const lo = Math.min(across(tri[0]!), across(tri[1]!), across(tri[2]!))
    const hi = Math.max(across(tri[0]!), across(tri[1]!), across(tri[2]!))
    const k0 = Math.max(0, Math.floor((lo - band.from) / band.width))
    const k1 = Math.min(count - 1, Math.floor((hi - band.from) / band.width))
    for (let k = k0; k <= k1; k++) {
      const a = band.from + k * band.width
      const b = a + band.width
      const cutA: Corner[] = []
      const cutB: Corner[] = []
      let poly = tri
      if (k > 0) poly = clip(poly, a, true, cutA)
      if (k < count - 1 && poly.length >= 3) poly = clip(poly, b, false, cutB)
      if (poly.length < 3) continue
      for (let i = 1; i + 1 < poly.length; i++) {
        push(poly[0]!, k)
        push(poly[i]!, k)
        push(poly[i + 1]!, k)
      }
      if (cutA.length === 2) cap(cutA[0]!, cutA[1]!, k, -1)
      if (cutB.length === 2) cap(cutB[0]!, cutB[1]!, k, 1)
    }
  }
  const set: StripSet = { count, rest: new Float32Array(rest), ink: new Float32Array(ink), normal: new Float32Array(normal), strip: new Uint16Array(strip), from: band.from, width: band.width }
  sets.set(count, set)
  return set
}
