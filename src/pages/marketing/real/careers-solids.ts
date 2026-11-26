import * as THREE from 'three'
import type { Shape } from '../../../stage/types'
import { merge, type Outline } from '../../../shell/solids'

export const q = (v: number): number => Math.round(v * 4) / 4
export const srgb = (hex: number): THREE.Color => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

const geometries = new Map<string, THREE.BufferGeometry>()

export function shared(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geometries.get(key)
  if (!g) {
    g = make()
    geometries.set(key, g)
  }
  return g
}

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true, receive = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = cast
  m.receiveShadow = receive
  return m
}

export const dims = (s: Shape): string => `${s.kind}:${q(s.w)}x${q(s.h)}:${q(s.r ?? 0)}`

// A closed outline given by its radius at each angle. Its normals are taken from its neighbours.
export function polar(radius: (a: number) => number, count: number): Outline {
  const o: Outline = { x: new Float32Array(count), y: new Float32Array(count), nx: new Float32Array(count), ny: new Float32Array(count), count }
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const r = radius(a)
    o.x[i] = Math.cos(a) * r
    o.y[i] = Math.sin(a) * r
  }
  for (let i = 0; i < count; i++) {
    const a = (i + count - 1) % count
    const b = (i + 1) % count
    const tx = o.x[b]! - o.x[a]!
    const ty = o.y[b]! - o.y[a]!
    const l = Math.hypot(tx, ty) || 1
    o.nx[i] = ty / l
    o.ny[i] = -tx / l
  }
  return o
}

// The rim of a medal: round lobes with a sharp valley between them.
export const scalloped = (r: number, lobes: number, deep: number, per = 14): Outline => polar((a) => r - deep + deep * Math.pow(Math.abs(Math.sin((a * lobes) / 2)), 0.8), lobes * per)

// One pressed leaf, lying along x from its stem at 0 to its tip, raised from z = 0 with a rib along its middle.
export function leaf(long: number, wide: number, high: number): THREE.BufferGeometry {
  const nu = 18
  const nv = 8
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= nu; i++) {
    const u = i / nu
    const half = (wide / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.82)), 0.75)
    const body = Math.pow(Math.sin(Math.PI * u), 0.4)
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1
      const dome = Math.pow(Math.max(0, 1 - v * v), 0.6)
      const rib = 0.34 * Math.exp(-(v * v) / 0.012)
      pos.push((u - 0.5) * long, v * half, high * body * dome * (1 - rib))
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j
      const b = a + nv + 1
      idx.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.filter((_, i) => i % 3 !== 2), 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// Copies of one geometry, each turned about z and moved, as one geometry.
export function scattered(g: THREE.BufferGeometry, places: { x: number; y: number; z: number; turn: number }[]): THREE.BufferGeometry {
  const parts = places.map((p) => {
    const c = g.clone()
    c.rotateZ(p.turn)
    c.translate(p.x, p.y, p.z)
    return c
  })
  const out = merge(parts)
  for (const p of parts) p.dispose()
  return out
}

// The same solid again with its under side up: what was built from z = 0 upward now hangs from z = 0 downward.
export function mirrored(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const c = g.clone()
  c.rotateX(Math.PI)
  return c
}
