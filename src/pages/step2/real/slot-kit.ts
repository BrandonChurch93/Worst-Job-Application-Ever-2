import * as THREE from 'three'
import { hash01 } from '../../../core/random'
import type { Outline } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'

export type LathePoint = [number, number, boolean?]

export const srgb = (hex: number): THREE.Color => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))
export const smooth = (t: number): number => {
  const u = clamp01(t)
  return u * u * (3 - 2 * u)
}

// A turned solid: a line of (radius, height, sharp) swept round the z axis, from the outside foot up and in to the centre.
// A sharp point keeps its edge, any other is rounded over. With `disc` the face reads one picture across its width.
export function lathe(line: LathePoint[], segments = 64, disc = 0, tiles = 1): THREE.BufferGeometry {
  const points: LathePoint[] = []
  for (const p of line) {
    const last = points[points.length - 1]
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 1e-6) last[2] = last[2] || p[2]
    else points.push([p[0], p[1], p[2]])
  }
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const seg: [number, number][] = []
  for (let i = 0; i < points.length - 1; i++) {
    const dr = points[i + 1]![0] - points[i]![0]
    const dz = points[i + 1]![1] - points[i]![1]
    const l = Math.hypot(dr, dz) || 1
    seg.push([dz / l, -dr / l])
  }
  const rows: { r: number; z: number; nr: number; nz: number; run: number; joins: boolean }[] = []
  let run = 0
  points.forEach((p, i) => {
    if (i > 0) run += Math.hypot(p[0] - points[i - 1]![0], p[1] - points[i - 1]![1])
    const before = seg[i - 1]
    const after = seg[i]
    if (before && after && !p[2]) {
      const a = before[0] + after[0]
      const b = before[1] + after[1]
      const l = Math.hypot(a, b) || 1
      rows.push({ r: p[0], z: p[1], nr: a / l, nz: b / l, run, joins: true })
      return
    }
    if (before) rows.push({ r: p[0], z: p[1], nr: before[0], nz: before[1], run, joins: false })
    if (after) rows.push({ r: p[0], z: p[1], nr: after[0], nz: after[1], run, joins: true })
  })
  const n = segments + 1
  rows.forEach((row, k) => {
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      const c = Math.cos(a)
      const s = Math.sin(a)
      pos.push(row.r * c, row.r * s, row.z)
      nor.push(row.nr * c, row.nr * s, row.nz)
      if (disc > 0) uv.push((row.r * c) / disc + 0.5, (row.r * s) / disc + 0.5)
      else uv.push((i / segments) * tiles, row.run / 256)
    }
    if (k === 0 || !rows[k - 1]!.joins) return
    const a0 = (k - 1) * n
    const b0 = k * n
    for (let i = 0; i < segments; i++) idx.push(a0 + i, a0 + i + 1, b0 + i, a0 + i + 1, b0 + i + 1, b0 + i)
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

// A quarter round between two points of a turned line, bulging outward.
export function round(r0: number, z0: number, r1: number, z1: number, steps = 6): LathePoint[] {
  const out: LathePoint[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    out.push([r0 + (r1 - r0) * (1 - Math.cos(a)), z0 + (z1 - z0) * Math.sin(a)])
  }
  return out
}

// Several solids as one, with or without an index of their own.
export function fuse(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (const g of parts) {
    const base = pos.length / 3
    const p = g.getAttribute('position')
    const n = g.getAttribute('normal')
    const u = g.getAttribute('uv')
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i))
      nor.push(n.getX(i), n.getY(i), n.getZ(i))
      uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0)
    }
    const index = g.getIndex()
    if (index) for (let i = 0; i < index.count; i++) idx.push(base + index.getX(i))
    else for (let i = 0; i < p.count; i++) idx.push(base + i)
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  out.setIndex(idx)
  return out
}

export function moved(g: THREE.BufferGeometry, x: number, y: number, z: number, turn = 0): THREE.BufferGeometry {
  if (turn !== 0) g.rotateZ(turn)
  g.translate(x, y, z)
  return g
}

export function mesh(g: THREE.BufferGeometry, m: THREE.Material, cast = true, receive = true): THREE.Mesh {
  const o = new THREE.Mesh(g, m)
  o.castShadow = cast
  o.receiveShadow = receive
  o.frustumCulled = false
  return o
}

// A closed outline from a list of points and their outward normals.
export function outline(points: [number, number, number, number][]): Outline {
  const count = points.length
  const o: Outline = { x: new Float32Array(count), y: new Float32Array(count), nx: new Float32Array(count), ny: new Float32Array(count), count }
  points.forEach((p, i) => {
    o.x[i] = p[0]
    o.y[i] = p[1]
    o.nx[i] = p[2]
    o.ny[i] = p[3]
  })
  return o
}

// A machine comes up out of its tray: the page sends the part's height, the part is built at its full height.
export function rise(o: THREE.Object3D, s: Shape, full: number): number {
  const up = clamp01((s.z1 - s.z0) / full)
  o.scale.z = Math.max(0.001, up)
  o.visible = up > 0.02
  return up
}

export function noise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const a = hash01(x0, y0, seed)
  const b = hash01(x0 + 1, y0, seed)
  const c = hash01(x0, y0 + 1, seed)
  const d = hash01(x0 + 1, y0 + 1, seed)
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

// A picture made from numbers: `paint` gives red, green, blue and alpha from 0 to 1 for a place from 0 to 1.
export function picture(w: number, h: number, colour: boolean, paint: (u: number, v: number) => [number, number, number, number]): THREE.DataTexture {
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = paint((x + 0.5) / w, (y + 0.5) / h)
      const i = (y * w + x) * 4
      for (let k = 0; k < 4; k++) data[i + k] = Math.round(clamp01(p[k]!) * 255)
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}
