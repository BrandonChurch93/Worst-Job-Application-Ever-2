import * as THREE from 'three'
import { look } from '../../../post/look'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { controls } from '../../../shell/real/controls'
import { arc, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'

const q = (v: number): number => Math.round(v * 4) / 4
const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
const RIM = { inset: 2.9, wide: 1.5, tall: 0.7 }
const PILLOW = { shoulder: 8, turn: 1.25, glint: 0.7 }
const POLISH = { inset: 2.6, from: 1.8, wide: 10.5, tail: 9, near: 0.8, far: 0.42, lee: 0.42 }
const SHADE = { rings: [[-8, 0.2], [0, 0.2], [2, 0.13], [5, 0.07], [10, 0.03], [17, 0]] as [number, number][], dx: 4, dy: -5, colour: 0x2c3a36, full: 8 }

let lineMade: THREE.MeshPhysicalMaterial | null = null
let pillowMade: THREE.MeshPhysicalMaterial | null = null
let shadeMade: THREE.MeshBasicMaterial | null = null
let sheenMade: THREE.MeshPhysicalMaterial | null = null

// The polished edge of the glass: the line of light that runs all the way round a slab.
function line(): THREE.MeshPhysicalMaterial {
  lineMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xe6ece7), emissive: srgb(0xdfe6e1), emissiveIntensity: 0.42, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }))
  lineMade.name = 'metrics-line'
  return lineMade
}

function pillow(): THREE.MeshPhysicalMaterial {
  pillowMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xc3cdca), roughness: 0.3, metalness: 0, specularIntensity: 0.8, clearcoat: 0.8, clearcoatRoughness: 0.2, vertexColors: true }))
  pillowMade.name = 'metrics-pillow'
  return pillowMade
}

function sheen(): THREE.MeshPhysicalMaterial {
  if (!sheenMade) {
    sheenMade = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xeef3ee), emissive: srgb(0xe2eae4), emissiveIntensity: 0.5, roughness: 0.35, metalness: 0, vertexColors: true, transparent: true, depthWrite: false }))
    sheenMade.name = 'metrics-sheen'
    sheenMade.polygonOffset = true
    sheenMade.polygonOffsetFactor = -1
    sheenMade.polygonOffsetUnits = -2
  }
  return sheenMade
}

// Light that has gone through the glass comes out at the edge away from the lamp: a band painted on the ground edge, fullest on that side.
function lightBand(s: Shape, inset: number, rings: [number, number, number][], lee: number): THREE.Mesh {
  const o = outlineOf(s, inset, 14)
  const n = o.count
  const [lx, ly] = look.key.direction
  const ll = Math.hypot(lx, ly) || 1
  const pos: number[] = []
  const nor: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (const [d, z, a] of rings) {
    for (let i = 0; i < n; i++) {
      const away = Math.max(0, -(o.nx[i]! * lx + o.ny[i]! * ly) / ll)
      pos.push(o.x[i]! - d * o.nx[i]!, o.y[i]! - d * o.ny[i]!, z)
      nor.push(0, 0, 1)
      col.push(1, 1, 1, a * (lee + (1 - lee) * away))
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
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  const mesh = solid(g, sheen(), false)
  mesh.receiveShadow = false
  return mesh
}

function shade(): THREE.MeshBasicMaterial {
  shadeMade ??= new THREE.MeshBasicMaterial({ color: srgb(SHADE.colour), vertexColors: true, transparent: true, depthWrite: false })
  shadeMade.name = 'metrics-shade'
  return shadeMade
}

function solid(g: THREE.BufferGeometry, m: THREE.Material, cast: boolean): THREE.Mesh {
  const mesh = new THREE.Mesh(g, m)
  mesh.castShadow = cast
  mesh.receiveShadow = true
  mesh.userData.own = true
  return mesh
}

function shadeOf(s: Shape): THREE.Mesh {
  const first = outlineOf(s, 0, 8)
  const n = first.count
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (const [d, a] of SHADE.rings) {
    const o = outlineOf({ ...s, w: s.w + d * 2, h: s.h + d * 2, r: Math.max(0.6, (s.r ?? 0) + d) }, 0, 8)
    for (let i = 0; i < n; i++) {
      pos.push(o.x[i]! + SHADE.dx, o.y[i]! + SHADE.dy, 0.05)
      col.push(1, 1, 1, a)
    }
  }
  for (let k = 0; k < SHADE.rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(k * n + i, k * n + j, (k + 1) * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  const mesh = solid(g, shade().clone(), false)
  mesh.receiveShadow = false
  mesh.name = 'shade'
  return mesh
}

// The panel is the page's one glass card, with the line of light on its rim and a tinted shade under it.
export function panelOf(s: Shape, card: THREE.Object3D): THREE.Object3D {
  const h = s.z1 - s.z0
  const foot = h - Math.min(h * 0.3, 3.6)
  const root = new THREE.Group()
  const bead: ProfilePoint[] = [[RIM.inset, foot - 0.4, true], [RIM.inset + 0.15, foot + RIM.tall * 0.7], [RIM.inset + RIM.wide / 2, foot + RIM.tall], [RIM.inset + RIM.wide - 0.15, foot + RIM.tall * 0.7], [RIM.inset + RIM.wide, foot - 0.2, true]]
  root.add(shadeOf(s), card, solid(sweep(outlineOf(s, 0, 14), profile(bead), false), line(), false))
  const k = Math.min(1, Math.min(s.w, s.h) / 90)
  const rise = h - foot
  const up = 0.08
  const rings: [number, number, number][] = [[POLISH.from * 0.5, foot - 0.9 + up, 0]]
  for (let i = 0; i <= 6; i++) {
    const u = i / 6
    rings.push([POLISH.from + POLISH.wide * k * u, foot + rise * Math.sin((u * Math.PI) / 2) + up, POLISH.near + (POLISH.far - POLISH.near) * u])
  }
  rings.push([POLISH.from + POLISH.wide * k + POLISH.tail, h + up, 0])
  root.add(lightBand(s, POLISH.inset, rings, POLISH.lee))
  return root
}

// Glass turns the light round: the shoulder that faces the lamp shows the dark under it, the far shoulder gathers the light.
function refracted(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const nor = g.getAttribute('normal')
  const [lx, ly] = look.key.direction
  const col = new Float32Array(nor.count * 3)
  for (let i = 0; i < nor.count; i++) {
    const l = Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i)) || 1
    const tone = Math.max(0.3, 1 - PILLOW.turn * ((nor.getX(i) * lx + nor.getY(i) * ly) / l))
    col.set([tone, tone, tone], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

// A readout is a pillow of the same glass standing on the panel, lighter than it, with a broad round shoulder and its own line of light.
function readoutOf(s: Shape): THREE.Object3D {
  const h = s.z1 - s.z0
  const half = Math.min(s.w, s.h) / 2
  const wide = Math.min(PILLOW.shoulder, half - 2)
  const root = new THREE.Group()
  const top = h - 0.3
  const body: ProfilePoint[] = [[0, 0, true], [0, 0.5], ...arc(0, 0.5, wide, top - 0.5, 9).slice(1), [Math.min(half - 1, wide + 10), top]]
  root.add(solid(refracted(sweep(outlineOf(s, 0, 14), profile(body))), pillow(), false))
  const shoulder = arc(0, 0.5, wide, top - 0.5, 6)
  const glint: [number, number, number][] = shoulder.map(([d, z], i) => [d, z + 0.08, i === 0 ? 0 : PILLOW.glint * Math.sin((i / 6) * Math.PI) ** 0.6])
  glint[glint.length - 1]![2] = 0
  root.add(lightBand(s, 0, glint, 0))
  return root
}

export function panelPose(o: THREE.Object3D, s: Shape): void {
  const under = o.getObjectByName('shade')
  if (!under) return
  under.position.z = -s.z0
  ;((under as THREE.Mesh).material as THREE.Material).opacity = Math.min(1, (s.z1 - s.z0) / SHADE.full)
}

export function panelDrop(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (!m.isMesh || !m.userData.own) return
    m.geometry.dispose()
    if (m.name === 'shade') (m.material as THREE.Material).dispose()
  })
}

export const metrics: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text') return null
    if (s.role === 'card') return `panel:${controls.key(s, ctx)}`
    if (s.role === 'readout') return `readout:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
    return null
  },
  make(s, ctx) {
    if (s.role === 'card') return panelOf(s, controls.make(s, ctx))
    return readoutOf(s)
  },
  pose(o, s) {
    panelPose(o, s)
  },
  drop(o) {
    panelDrop(o)
  }
}
