import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import { arc, merge, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { dims, mesh, mirrored, q, shared, srgb } from './careers-solids'

export const SLAB = { frame: 2.6, bevel: 10.5, rise: 3.6, round: 1.8, band: 3.4 }

let hairline: THREE.MeshPhysicalMaterial | null = null
let lining: THREE.MeshPhysicalMaterial | null = null

// The line engraved in a card's face and filled with a grey paint.
export function ruleMaterial(): THREE.MeshPhysicalMaterial {
  hairline ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x6f7779), roughness: 0.62, metalness: 0, specularIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }))
  return hairline
}

function liningMaterial(): THREE.MeshPhysicalMaterial {
  lining ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x8f9291), roughness: 0.7, metalness: 0 }))
  return lining
}

export function engraved(s: Shape): THREE.Object3D {
  const g = shared(`hair:${q(s.w)}x${q(s.h)}`, () => new THREE.PlaneGeometry(s.w, Math.min(s.h, 1.3)))
  const m = mesh(g, ruleMaterial(), false)
  m.position.z = 0.06
  return m
}

// Where each point of the slab lies on its card, as the shared glass wants it.
function placed(g: THREE.BufferGeometry, s: Shape): THREE.BufferGeometry {
  const pos = g.getAttribute('position')
  const at = new Float32Array(pos.count * 4)
  const edge = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    at.set([pos.getX(i), pos.getY(i), s.w / 2, s.h / 2], i * 4)
    edge.set([Math.max(0.6, s.r ?? 0), 0], i * 2)
  }
  g.setAttribute('slab', new THREE.BufferAttribute(at, 4))
  g.setAttribute('slabEdge', new THREE.BufferAttribute(edge, 2))
  return g
}

// One slab of glass with both of its faces: each face is ground to the same wide bevel, with a short wall between them.
// It is built round its middle, so it turns about its own long axis.
function slabGeometry(s: Shape, thick: number): THREE.BufferGeometry {
  const half = thick / 2
  const k = Math.min(1, Math.min(s.w, s.h) / 90)
  const foot = half - SLAB.rise
  const wall = Math.max(0.2, foot - SLAB.round)
  const points: ProfilePoint[] = [[0, 0, true], [0, wall, true], ...arc(0, wall, SLAB.round, foot - wall, 5).slice(1), ...[0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1].map((t): ProfilePoint => [SLAB.round + SLAB.bevel * k * t, foot + SLAB.rise * Math.sin((t * Math.PI) / 2)])]
  const upper = sweep(outlineOf(s, SLAB.frame, 14), profile(points))
  const lower = mirrored(upper)
  return placed(merge([upper, lower]), s)
}

// The seal the card sits in. It stays in the mouth of the well while the slab turns, and squares the well's corners off to the card's round ones.
function sealGeometry(s: Shape): THREE.BufferGeometry {
  const inner = outlineOf(s, 0, 14)
  const n = inner.count
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const hw = s.w / 2 + 0.6
  const hh = s.h / 2 + 0.6
  for (let i = 0; i < n; i++) {
    const x = inner.x[i]! - SLAB.frame * inner.nx[i]!
    const y = inner.y[i]! - SLAB.frame * inner.ny[i]!
    const ox = Math.abs(inner.nx[i]!) > 0.001 && Math.abs(inner.ny[i]!) > 0.001 ? Math.sign(inner.nx[i]!) * hw : Math.abs(inner.nx[i]!) > 0.5 ? Math.sign(inner.nx[i]!) * hw : inner.x[i]!
    const oy = Math.abs(inner.nx[i]!) > 0.001 && Math.abs(inner.ny[i]!) > 0.001 ? Math.sign(inner.ny[i]!) * hh : Math.abs(inner.ny[i]!) > 0.5 ? Math.sign(inner.ny[i]!) * hh : inner.y[i]!
    pos.push(ox, oy, 0.5, x, y, 0.5, x, y, -3)
    nor.push(0, 0, 1, 0, 0, 1, -inner.nx[i]!, -inner.ny[i]!, 0)
    uv.push(ox, oy, x, y, x, y)
  }
  for (let i = 0; i < n; i++) {
    const a = i * 3
    const b = ((i + 1) % n) * 3
    idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

const AXIS = new THREE.Vector3(1, 0, 0)

function turningSlab(s: Shape): THREE.Object3D {
  const root = new THREE.Group()
  const thick = s.v?.[0] ?? 12
  const glass = mesh(shared(`perkSlab:${dims(s)}:${q(thick)}`, () => slabGeometry(s, thick)), materials().glassCard, true)
  root.add(glass)
  const seal = mesh(shared(`perkSeal:${dims(s)}`, () => sealGeometry(s)), liningMaterial(), false)
  seal.name = 'seal'
  root.add(seal)
  return root
}

export const perkCards: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.id.endsWith('-slab')) return `perkSlab:${dims(s)}`
    if (s.role === 'cardRule') return `perkRule:${q(s.w)}x${q(s.h)}`
    if (s.role === 'card') return controls.key(s, ctx)
    return null
  },
  make(s, ctx) {
    if (s.id.endsWith('-slab')) return turningSlab(s)
    if (s.role === 'card') return controls.make(s, ctx)
    return engraved(s)
  },
  pose(o, s) {
    if (!s.id.endsWith('-slab')) return
    const seal = o.getObjectByName('seal')
    if (!seal) return
    const turn = o.rotation.x
    seal.rotation.x = -turn
    seal.position.set(0, 0, -s.z0).applyAxisAngle(AXIS, -turn)
  }
}
