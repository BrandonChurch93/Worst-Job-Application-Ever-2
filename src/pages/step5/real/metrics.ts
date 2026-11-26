import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { controls } from '../../../shell/real/controls'
import { arc, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'

const q = (v: number): number => Math.round(v * 4) / 4
const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
const RIM = { inset: 2.9, wide: 1.5, tall: 0.7 }
const PILLOW = { round: 2.6, line: 1.3 }
const SHADE = { rings: [[-8, 0.2], [0, 0.2], [2, 0.13], [5, 0.07], [10, 0.03], [17, 0]] as [number, number][], dx: 4, dy: -5, colour: 0x2c3a36, full: 8 }

let lineMade: THREE.MeshPhysicalMaterial | null = null
let pillowMade: THREE.MeshPhysicalMaterial | null = null
let shadeMade: THREE.MeshBasicMaterial | null = null

// The polished edge of the glass: the line of light that runs all the way round a slab.
function line(): THREE.MeshPhysicalMaterial {
  lineMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xe6ece7), emissive: srgb(0xdfe6e1), emissiveIntensity: 0.42, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }))
  lineMade.name = 'metrics-line'
  return lineMade
}

function pillow(): THREE.MeshPhysicalMaterial {
  pillowMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xc3cdca), roughness: 0.3, metalness: 0, specularIntensity: 0.8, clearcoat: 0.8, clearcoatRoughness: 0.2 }))
  pillowMade.name = 'metrics-pillow'
  return pillowMade
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
  const mesh = solid(g, shade(), false)
  mesh.receiveShadow = false
  mesh.name = 'shade'
  return mesh
}

// The panel is the page's one glass card, with the line of light on its rim and a tinted shade under it.
function panelOf(s: Shape, card: THREE.Object3D): THREE.Object3D {
  const h = s.z1 - s.z0
  const foot = h - Math.min(h * 0.3, 3.6)
  const root = new THREE.Group()
  const bead: ProfilePoint[] = [[RIM.inset, foot - 0.4, true], [RIM.inset + 0.15, foot + RIM.tall * 0.7], [RIM.inset + RIM.wide / 2, foot + RIM.tall], [RIM.inset + RIM.wide - 0.15, foot + RIM.tall * 0.7], [RIM.inset + RIM.wide, foot - 0.2, true]]
  root.add(shadeOf(s), card, solid(sweep(outlineOf(s, 0, 14), profile(bead), false), line(), false))
  return root
}

// A readout is a pillow of the same glass standing on the panel, lighter than it, with its own line of light.
function readoutOf(s: Shape): THREE.Object3D {
  const h = s.z1 - s.z0
  const half = Math.min(s.w, s.h) / 2
  const r = Math.min(PILLOW.round, h - 0.2)
  const root = new THREE.Group()
  const body: ProfilePoint[] = [[0, 0, true], [0, h - r], ...arc(0, h - r - 0.5, r, r, 6).slice(1), [r + 5, h - 0.3], [Math.min(half - 1, r + 16), h - 0.05]]
  root.add(solid(sweep(outlineOf(s, 0, 14), profile(body)), pillow(), true))
  const at = r * 0.3
  const bead: ProfilePoint[] = [[at, h - r * 0.75 - 0.5, true], [at + 0.2, h - 0.6], [at + PILLOW.line / 2, h - 0.3], [at + PILLOW.line, h - 0.5, true]]
  root.add(solid(sweep(outlineOf(s, 0, 14), profile(bead), false), line(), false))
  return root
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
    const under = o.getObjectByName('shade')
    if (!under) return
    under.position.z = -s.z0
    shade().opacity = Math.min(1, (s.z1 - s.z0) / SHADE.full)
  },
  drop(o) {
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (m.isMesh && m.userData.own) m.geometry.dispose()
    })
  }
}
