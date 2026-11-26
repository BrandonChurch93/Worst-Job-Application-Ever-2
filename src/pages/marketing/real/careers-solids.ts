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
  const n = g.getAttribute('normal')
  for (let i = 0; i < n.count; i++) if (Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) < 0.5) n.setXYZ(i, 0, 0, 1)
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

// A medal's flange: a flat band whose outer edge is cut in round lobes and whose inner edge is a circle.
// `rings` run from the foot of the outer wall to the inner circle: `d` is how far in from the lobed edge, or, with `t`, how far along to the circle.
export function flange(r: number, lobes: number, deep: number, inner: number, rings: { d?: number; t?: number; z: number }[]): THREE.BufferGeometry {
  const n = lobes * 20
  const pos: number[] = []
  const idx: number[] = []
  for (const ring of rings) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const lobe = 0.5 - 0.5 * Math.cos(a * lobes)
      const edge = r - deep * (1 - Math.pow(lobe, 0.88))
      const at = ring.t !== undefined ? edge + (inner - edge) * ring.t : edge - (ring.d ?? 0)
      pos.push(Math.cos(a) * at, Math.sin(a) * at, ring.z)
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(k * n + i, k * n + j, (k + 1) * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.filter((_, i) => i % 3 !== 2), 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// A solid of turned metal lit from one side: brighter round the part of it that lies toward `toward`, duller round the far part.
// Its picture lies across `across` px once, from the middle. Below the height `wall[0]` it is a wall, and leans by `wall[1]`.
// `bow` is the turned top's own sheen: two bright sectors along the angle `bow[0]`, two dull ones across it, by `bow[1]`.
export function leaned(g: THREE.BufferGeometry, toward: number, amount: number, across: number, wall: [number, number] = [-1, 0], bow: [number, number] = [0, 0]): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const col = new Float32Array(p.count * 3)
  const uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const a = Math.atan2(y, x)
    const top = p.getZ(i) >= wall[0]
    const v = Math.max(0.05, 1 + (top ? amount : wall[1]) * Math.cos(a - toward) + (top ? bow[1] * Math.cos(2 * (a - bow[0])) : 0))
    col.set([v, v, v], i * 3)
    uv.set([x / across + 0.5, y / across + 0.5], i * 2)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g
}

// The dark a lobed medal leaves on the page where its far edge meets it: a thin ring that follows the lobes, deepest under the edge,
// only round the part that lies away from `toward`. `rings` are how far out from the edge, and how dark.
export function contact(r: number, lobes: number, deep: number, toward: number, rings: [number, number][], turn: number): THREE.BufferGeometry {
  const n = lobes * 20
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (const [d, dark] of rings) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const lobe = 0.5 - 0.5 * Math.cos(a * lobes)
      const at = r - deep * (1 - Math.pow(lobe, 0.88)) + d
      pos.push(Math.cos(a) * at, Math.sin(a) * at, 0.08)
      col.push(1, 1, 1, dark * Math.max(0, Math.min(1, -Math.cos(a - toward) * turn)))
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(k * n + i, (k + 1) * n + i, k * n + j, k * n + j, (k + 1) * n + i, (k + 1) * n + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// A flat disc at the height `z`, in rings, so that a colour laid into it can change from the middle outward. Its uv are its x and y.
export function disc(r: number, z: number, around = 144, rings = 20): THREE.BufferGeometry {
  const pos: number[] = [0, 0, z]
  const idx: number[] = []
  for (let k = 1; k <= rings; k++) {
    for (let i = 0; i < around; i++) {
      const a = (i / around) * Math.PI * 2
      pos.push((Math.cos(a) * r * k) / rings, (Math.sin(a) * r * k) / rings, z)
    }
  }
  for (let i = 0; i < around; i++) idx.push(0, 1 + i, 1 + ((i + 1) % around))
  for (let k = 1; k < rings; k++) {
    for (let i = 0; i < around; i++) {
      const j = (i + 1) % around
      const a = 1 + (k - 1) * around
      const b = 1 + k * around
      idx.push(a + i, b + i, b + j, a + i, b + j, a + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.filter((_, i) => i % 3 !== 2), 2))
  g.setIndex(idx)
  return g
}

// The light a turned face gives back: two bright sectors along `axis` and two dull ones across it, laid into the disc as vertex colour,
// none in the middle and all of it at the rim. `cap` is how much duller the dull sectors are in their outer part, from `from` of the
// radius outward: the middle, where words lie, keeps its light.
export function sheen(g: THREE.BufferGeometry, axis: number, depth: number, rim = 1, lean = 0, cap = 0, from = 0.5, narrow = 1): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const col = new Float32Array(p.count * 3)
  let far = 1
  for (let i = 0; i < p.count; i++) far = Math.max(far, Math.hypot(p.getX(i), p.getY(i)))
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const r = Math.hypot(x, y) / far
    const turn = Math.atan2(y, x) - axis
    const out = Math.max(0, Math.min(1, (r - from) / (0.95 - from)))
    const c = Math.cos(2 * turn)
    const lobe = c > 0 ? c ** narrow : -((-c) ** (1 / narrow))
    const v = Math.max(0.05, 1 + (rim - 1 + depth * lobe + lean * Math.cos(turn)) * r - cap * Math.max(0, -c) * out * out * (3 - 2 * out))
    col.set([v, v, v], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}
