import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { materials } from '../../../shell/materials'
import { arc, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'

const q = (v: number): number => Math.round(v * 4) / 4

export const HEALTH = { proud: 0.9, rim: 2.6, under: 1.5, wall: 0.8 }

let floorMaterial: THREE.MeshPhysicalMaterial | null = null

// The floor of the track: the rail's brushed metal, a stop darker, so the orange stands off it.
function floor(): THREE.MeshPhysicalMaterial {
  if (!floorMaterial) {
    floorMaterial = studio(materials().railSatin.clone())
    floorMaterial.color.setRGB(0.21, 0.222, 0.238)
    floorMaterial.roughness = 0.42
  }
  return floorMaterial
}

function mesh(g: THREE.BufferGeometry, m: THREE.Material, cast: boolean): THREE.Mesh {
  const out = new THREE.Mesh(g, m)
  out.castShadow = cast
  out.receiveShadow = true
  return out
}

// The track is a tray: a polished rim that stands a hair proud of the page, rolls over and goes down to a brushed floor. It has an outer wall, so it is whole while it slides in above the page.
function track(s: Shape): THREE.Object3D {
  const surface = -s.z0
  const top = surface + HEALTH.proud
  const rim = HEALTH.rim
  const points: ProfilePoint[] = [
    [0.2, -HEALTH.under, true], [0.2, surface - 0.3, true], [-1.6, surface + 0.05, true], [-1.6, top - 0.6],
    ...arc(-1.6, top - 0.6, 0.9, 0.6, 5).slice(1), [0.5, top],
    ...[1, 2, 3, 4, 5, 6].map((i): ProfilePoint => {
      const a = (i / 6) * (Math.PI / 2)
      return [0.5 + (rim - 0.9) * Math.sin(a), top - 1.2 * (1 - Math.cos(a))]
    }),
    [rim - 0.2, 0.5], [rim - 0.2, -0.4, true]
  ]
  const root = new THREE.Group()
  root.add(mesh(sweep(outlineOf(s, 0, 16), profile(points), false), materials().chrome, true))
  root.add(mesh(sweep(outlineOf(s, rim - 0.5, 16), [{ inset: 0, z: 0.05, out: 0, up: 1 }]), floor(), false))
  return root
}

// The fill is one moulded capsule. Its length follows the health: the two ends keep their shape and the middle gives.
function fill(s: Shape, full: number): THREE.Object3D {
  const h = s.z1 - s.z0
  const half = s.h / 2
  // A rod of moulded plastic: a short wall, then one round back from edge to crest, so the light lies on it as a narrow band.
  const points: ProfilePoint[] = [[0, 0, true], [0, HEALTH.wall], ...arc(0, HEALTH.wall, half * 0.97, h - HEALTH.wall, 14).slice(1)]
  const g = sweep(outlineOf({ kind: 'capsule', w: full, h: s.h }, 0, 18), profile(points))
  const at = g.getAttribute('position') as THREE.BufferAttribute
  const m = mesh(g, materials().orange, true)
  m.userData.rest = Float32Array.from(at.array as ArrayLike<number>)
  m.userData.full = full
  m.userData.now = full
  m.frustumCulled = false
  return m
}

export const healthBar: PartMaker | null = {
  key(s: Shape): string | null {
    if (s.kind === 'text') return null
    if (s.id === 'health-fill') return `health-fill:${q(s.h)}:${q(s.z1 - s.z0)}:${q(s.v?.[0] ?? s.w)}`
    if (s.id === 'health-track') return `health-track:${q(s.w)}:${q(s.h)}:${q(s.z0)}`
    return null
  },
  make(s: Shape): THREE.Object3D {
    return s.id === 'health-fill' ? fill(s, s.v?.[0] ?? s.w) : track(s)
  },
  pose(o: THREE.Object3D, s: Shape, _ctx: RealContext): void {
    if (s.id === 'health-track') {
      o.position.z += s.v?.[0] ?? 0
      return
    }
    const m = o as THREE.Mesh
    const full = m.userData.full as number
    const w = Math.min(full, Math.max(s.h, s.w))
    if (Math.abs(w - (m.userData.now as number)) < 0.01) return
    m.userData.now = w
    const rest = m.userData.rest as Float32Array
    const at = m.geometry.getAttribute('position') as THREE.BufferAttribute
    const shift = (full - w) / 2
    for (let i = 0; i < at.count; i++) {
      const x = rest[i * 3]!
      at.setX(i, x > 0.01 ? x - shift : x < -0.01 ? x + shift : x)
    }
    at.needsUpdate = true
  },
  drop(o: THREE.Object3D): void {
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
    })
  }
}
