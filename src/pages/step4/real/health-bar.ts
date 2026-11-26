import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { materials } from '../../../shell/materials'
import { arc, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'

const q = (v: number): number => Math.round(v * 4) / 4

export const HEALTH = { proud: 0.6, rim: 2.2, under: 1.5, wall: 0.8, shoulder: 2.2, crown: 0.3, gutter: 2 }
export const TROUGH = { near: 2.15, far: 0.62, shade: 0.42, lit: 1.2 }

let floorMaterial: THREE.MeshPhysicalMaterial | null = null

// The floor of the track: the rail's brushed metal, a stop darker, so the orange stands off it.
function floor(): THREE.MeshPhysicalMaterial {
  if (!floorMaterial) {
    floorMaterial = studio(materials().railSatin.clone())
    floorMaterial.color.setRGB(0.15, 0.166, 0.168)
    floorMaterial.roughness = 0.42
    floorMaterial.normalScale.set(0.09, 0.09)
    floorMaterial.vertexColors = true
  }
  return floorMaterial
}

let rimMaterial: THREE.MeshPhysicalMaterial | null = null

function rimStuff(): THREE.MeshPhysicalMaterial {
  if (!rimMaterial) {
    rimMaterial = studio(materials().aluminiumSatin.clone())
    rimMaterial.metalness = 0.25
    rimMaterial.roughness = 0.5
    rimMaterial.envMapIntensity = 0.35
    rimMaterial.color.setRGB(0.62, 0.64, 0.65)
  }
  return rimMaterial
}

function mesh(g: THREE.BufferGeometry, m: THREE.Material, cast: boolean): THREE.Mesh {
  const out = new THREE.Mesh(g, m)
  out.castShadow = cast
  out.receiveShadow = true
  return out
}

// The track is a tray: a satin rim that stands a hair proud of the page, rolls over and goes down to a brushed floor that is a shallow gutter, so the light grades across it. It has an outer wall, so it is whole while it slides in above the page.
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
  root.add(mesh(sweep(outlineOf(s, 0, 16), profile(points), false), rimStuff(), true))
  const reach = s.h / 2 - (rim - 0.5)
  const gutter: ProfilePoint[] = [0, 0.1, 0.2, 0.32, 0.46, 0.62, 0.8, 0.98].map((t, i): ProfilePoint => [reach * t, 0.05 + HEALTH.gutter * (1 - t) * (1 - t), i === 0])
  const bed = sweep(outlineOf(s, rim - 0.5, 16), profile(gutter))
  const at = bed.getAttribute('position')
  const tint = new Float32Array(at.count * 3)
  for (let i = 0; i < at.count; i++) {
    const along = Math.min(1, Math.max(0, at.getX(i) / s.w + 0.5))
    const across = Math.min(1, Math.max(-1, at.getY(i) / reach))
    const wall = across > 0 ? 1 + (TROUGH.shade - 1) * across * across : 1 + (TROUGH.lit - 1) * across * across
    const v = (TROUGH.near + (TROUGH.far - TROUGH.near) * along) * wall
    tint[i * 3] = v
    tint[i * 3 + 1] = v
    tint[i * 3 + 2] = v
  }
  bed.setAttribute('color', new THREE.BufferAttribute(tint, 3))
  root.add(mesh(bed, floor(), false))
  return root
}

let fillMaterial: THREE.MeshPhysicalMaterial | null = null
export const FILL = { tone: 0.9, room: 0.22, coat: 0, coatRough: 0.18 }

function fillStuff(): THREE.MeshPhysicalMaterial {
  if (!fillMaterial) {
    fillMaterial = studio(materials().orange.clone())
    fillMaterial.color.multiplyScalar(FILL.tone)
    fillMaterial.envMapIntensity = FILL.room
    fillMaterial.clearcoat = FILL.coat
    fillMaterial.clearcoatRoughness = FILL.coatRough
  }
  return fillMaterial
}

let gainMaterial: THREE.MeshPhysicalMaterial | null = null
export const GAIN_GLOW = 1.7

function gainStuff(): THREE.MeshPhysicalMaterial {
  if (!gainMaterial) {
    gainMaterial = studio(materials().orange.clone())
    gainMaterial.emissive.copy(gainMaterial.color)
  }
  return gainMaterial
}

// The fill is one moulded capsule. Its length follows the health: the two ends keep their shape and the middle gives.
function fill(s: Shape, full: number, gain = false): THREE.Object3D {
  const h = s.z1 - s.z0
  const half = s.h / 2
  // A bar of moulded plastic: a short wall, a soft shoulder, and a top that crowns by a hair, so the light lies on the shoulder as a thin line.
  const lip = Math.min(HEALTH.shoulder, half * 0.5)
  const flat = h - HEALTH.crown
  const points: ProfilePoint[] = [[0, 0, true], [0, HEALTH.wall], ...arc(0, HEALTH.wall, lip, flat - HEALTH.wall, 9).slice(1), [lip + (half - lip) * 0.45, flat + HEALTH.crown * 0.7], [half * 0.97, h]]
  const g = sweep(outlineOf({ kind: 'capsule', w: full, h: s.h }, 0, 18), profile(points))
  const at = g.getAttribute('position') as THREE.BufferAttribute
  const m = mesh(g, gain ? gainStuff() : fillStuff(), !gain)
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
    if (s.id === 'health-gain') return `health-gain:${q(s.h)}:${q(s.z1 - s.z0)}:${q(s.v?.[0] ?? s.w)}`
    if (s.id === 'health-track') return `health-track:${q(s.w)}:${q(s.h)}:${q(s.z0)}`
    return null
  },
  make(s: Shape): THREE.Object3D {
    if (s.id === 'health-gain') return fill(s, s.v?.[0] ?? s.w, true)
    return s.id === 'health-fill' ? fill(s, s.v?.[0] ?? s.w) : track(s)
  },
  pose(o: THREE.Object3D, s: Shape, _ctx: RealContext): void {
    if (s.id === 'health-track') {
      o.position.z += s.v?.[0] ?? 0
      return
    }
    const m = o as THREE.Mesh
    if (s.id === 'health-gain') gainStuff().emissiveIntensity = GAIN_GLOW * (s.v?.[1] ?? 0)
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
