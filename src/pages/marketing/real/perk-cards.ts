import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { look } from '../../../post/look'
import { merge, outlineOf, profile, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { dims, mesh, q, shared, srgb } from './careers-solids'

export const SLAB = { frame: 2.6, bevel: 10.5, rise: 3.6, round: 1.8, band: 3.4, flat: 3 }

let hairline: THREE.MeshPhysicalMaterial | null = null

// The line engraved in a card's face and filled with a grey paint.
export function ruleMaterial(): THREE.MeshPhysicalMaterial {
  hairline ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x6f7779), roughness: 0.62, metalness: 0, specularIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }))
  return hairline
}

export function engraved(s: Shape): THREE.Object3D {
  const g = shared(`hair:${q(s.w)}x${q(s.h)}`, () => new THREE.PlaneGeometry(s.w, Math.min(s.h, 1.3)))
  const m = mesh(g, ruleMaterial(), false)
  m.position.z = 0.06
  return m
}

let glassMade: THREE.MeshPhysicalMaterial | null = null

// The perk cards' own glass: paler and greener than the form's cards, frosted, with the light and shade of its ground edge laid into the slab itself.
export function cardGlass(): THREE.MeshPhysicalMaterial {
  if (!glassMade) {
    glassMade = studio(new THREE.MeshPhysicalMaterial(glassOptions()))
  }
  return glassMade
}

export const GLASS = { colour: 0xc4cecb, shade: 0.27, after: 0.6, exit: 1.4, rim: 1.8, glint: 0.25, line: 0.9, wash: 0.13, warm: 0.07, lean: 0.03, caster: 4.2, least: 0.4, most: 4.4, through: 0.8 }

const keyFlat = Math.hypot(look.key.direction[0], look.key.direction[1]) || 1
const KX = look.key.direction[0] / keyFlat
const KY = look.key.direction[1] / keyFlat

const thickOf = (s: Shape): number => s.v?.[0] ?? 12
const bevelOf = (s: Shape): number => SLAB.bevel * Math.min(1, Math.min(s.w, s.h) / 90)

// How far in from a slab's outline its ground edge ends and its flat face begins.
export const groundEdge = (s: Shape): number => SLAB.frame + SLAB.round + bevelOf(s) + SLAB.flat

// One face of the slab, from the middle of its wall to the middle of its face. `d` is how far in from the edge a ring lies, `z` its height,
// `lit` what the side toward the light shows there and `away` what the far side shows: the near bevel lies in the glass's own shade with a
// bright line where it meets the face, the far bevel lets the light out and ends in a bright line at the very edge.
// A ring further in than the corner's radius keeps its corners square, so no ring ever folds over itself.
function face(s: Shape, half: number, flip: number, open: boolean): THREE.BufferGeometry {
  const bevel = bevelOf(s)
  const foot = half - SLAB.rise
  const G = GLASS
  const rings: { d: number; z: number; lit: number; away: number; lean: number; warm?: number }[] = [
    { d: 0, z: 0, lit: G.glint, away: 0.9, lean: 1 },
    { d: 0, z: foot - SLAB.round, lit: G.glint, away: 1, lean: 1 },
    { d: 0.5, z: foot - 0.5, lit: G.glint, away: G.rim, lean: 0.5, warm: 1 },
    { d: SLAB.round, z: foot, lit: G.shade, away: G.rim, lean: G.lean * 2, warm: 1 },
    { d: SLAB.round + 1.4, z: foot + SLAB.rise * 0.2, lit: G.shade, away: G.exit, lean: G.lean, warm: 0.5 },
    { d: SLAB.round + bevel * 0.42, z: foot + SLAB.rise * 0.62, lit: G.shade - 0.02, away: G.exit - 0.04, lean: G.lean },
    { d: SLAB.round + bevel - 1.6, z: foot + SLAB.rise * 0.97, lit: G.shade + 0.02, away: G.exit - 0.02, lean: G.lean },
    { d: SLAB.round + bevel - 0.4, z: half, lit: G.line, away: G.exit, lean: 0.05 },
    { d: SLAB.round + bevel + 1, z: half, lit: G.line, away: G.exit, lean: 0 },
    { d: SLAB.round + bevel + SLAB.flat, z: half, lit: open ? 0.9 : G.after, away: open ? 1.04 : G.exit - 0.02, lean: 0 }
  ]
  if (!open) rings.push({ d: SLAB.round + bevel + SLAB.flat + bevel * 0.6, z: half, lit: (1 + G.after) / 2 + 0.05, away: (1 + G.exit) / 2 - 0.03, lean: 0 }, { d: SLAB.round + bevel + SLAB.flat + bevel * 1.4, z: half, lit: 1, away: 1, lean: 0 })
  const lowest = Math.min(s.w, s.h) / 2
  if (!open) for (const f of [0.3, 0.65]) rings.push({ d: SLAB.round + bevel * 2.4 + SLAB.flat + f * (lowest - SLAB.round - bevel * 2.4 - SLAB.flat - 1), z: half, lit: 1, away: 1, lean: 0 })
  const outline = outlineOf(s, SLAB.frame, 14)
  const n = outline.count
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const span = Math.hypot(s.w / 2, s.h / 2)
  let wide = 0
  let tall = 0
  for (let i = 0; i < n; i++) {
    wide = Math.max(wide, outline.x[i]!)
    tall = Math.max(tall, outline.y[i]!)
  }
  const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, v: number, warm = 0): void => {
    const wash = 1 + G.wash * ((x * KX + flip * y * KY) / span)
    pos.push(x, y, z)
    nor.push(nx, ny, nz)
    uv.push(x, y)
    col.push(v * wash * (1 + warm * 0.6), v * wash, v * wash * (1 - warm))
  }
  rings.forEach((ring, r) => {
    const before = rings[Math.max(0, r - 1)]!
    const after = rings[Math.min(rings.length - 1, r + 1)]!
    const run = after.d - before.d
    const up = after.z - before.z
    const l = Math.hypot(run, up) || 1
    for (let i = 0; i < n; i++) {
      const ox = outline.nx[i]!
      const oy = outline.ny[i]!
      const side = ox * KX + flip * oy * KY
      const v = side > 0 ? 1 + side * (ring.lit - 1) : 1 - side * (ring.away - 1)
      const out = (up / l) * ring.lean
      const rise = Math.sqrt(Math.max(0, 1 - out * out))
      const x = Math.max(-(wide - ring.d), Math.min(wide - ring.d, outline.x[i]! - ring.d * ox))
      const y = Math.max(-(tall - ring.d), Math.min(tall - ring.d, outline.y[i]! - ring.d * oy))
      put(x, y, ring.z, ox * out, oy * out, rise, v, side < 0 ? -side * (ring.warm ?? 0) * G.warm : 0)
    }
  })
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(r * n + i, r * n + j, (r + 1) * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i)
    }
  }
  const last = (rings.length - 1) * n
  if (!open) {
    put(0, 0, half, 0, 0, 1, 1)
    for (let i = 0; i < n; i++) idx.push(rings.length * n, last + i, last + ((i + 1) % n))
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// One slab of glass with both of its faces: each face is ground to the same wide bevel, with a short wall between them.
// It is built round its middle, so it turns about its own long axis. The under side carries its light and shade as it will lie when it is up.
export function slabGeometry(s: Shape, thick: number, open = false): THREE.BufferGeometry {
  const upper = face(s, thick / 2, 1, open)
  const lower = face(s, thick / 2, 1, open)
  lower.rotateX(Math.PI)
  const colour = new Float32Array([...(upper.getAttribute('color').array as Float32Array), ...(lower.getAttribute('color').array as Float32Array)])
  const g = merge([upper, lower])
  g.setAttribute('color', new THREE.BufferAttribute(colour, 3))
  return g
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
    pos.push(ox, oy, 0.04, x, y, 0.04, x, y, -3)
    nor.push(0, 0, 1, 0, 0, 1, -inner.nx[i]!, -inner.ny[i]!, 0)
    uv.push(ox, oy, x, y, x, y)
  }
  for (let i = 0; i < n; i++) {
    const a = i * 3
    const b = ((i + 1) % n) * 3
    idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

const AXIS = new THREE.Vector3(1, 0, 0)

export const glassOptions = (): THREE.MeshPhysicalMaterialParameters => ({ color: srgb(GLASS.colour), roughness: 0.34, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.22, specularIntensity: 0.6, vertexColors: true, shadowSide: THREE.BackSide })

const keyLength = Math.hypot(look.key.direction[0], look.key.direction[1], look.key.direction[2]) || 1
const KEY_Y = look.key.direction[1] / keyLength
const KEY_Z = look.key.direction[2] / keyLength

// A slab of frosted glass is lit through its body as well as on its face, so the face that is up changes far less with its angle to the
// light than a painted plate would. even() is what the face's colour is multiplied by at a turn of `turn` about the long axis.
export function even(turn: number): number {
  const up = Math.cos(turn) >= 0 ? 1 : -1
  const lit = up * (-Math.sin(turn) * KEY_Y + Math.cos(turn) * KEY_Z)
  const f = Math.max(GLASS.least, Math.min(GLASS.most, KEY_Z / Math.max(lit, 0.12)))
  return 1 + (f - 1) * GLASS.through
}

// The turning card. It has a material of its own, because its colour follows its turn, and its shadow is thrown by the print in its middle.
function glassSlab(s: Shape, thick: number): THREE.Object3D {
  const root = new THREE.Group()
  const own = studio(new THREE.MeshPhysicalMaterial(glassOptions()))
  const glass = mesh(shared(`perkSlab:${dims(s)}:${q(thick)}`, () => slabGeometry(s, thick)), own, false)
  glass.name = 'glass'
  root.add(glass)
  const print = mesh(shared(`perkPrint:${dims(s)}`, () => sweep(outlineOf(s, SLAB.frame + 0.6, 8), profile([[0, -0.3, true], [0, 0.3, true]]))), cardGlass(), true, false)
  print.name = 'foot'
  root.add(print)
  const seal = mesh(shared(`perkSeal:${dims(s)}`, () => sealGeometry(s)), materials().ceramic, false)
  seal.name = 'seal'
  root.add(seal)
  root.userData.glass = own
  return root
}

export const slabKey = (s: Shape): string => `restSlab:${dims(s)}:${q(s.z1 - s.z0)}`

// A card at rest on the page: the same slab, lying with its under side on the surface. Glass lets most of the light through, so the shadow on the
// page is thrown by the printed foot of the slab alone, which lies inside the glass and is never seen.
export function restingSlab(s: Shape): THREE.Object3D {
  const thick = s.z1 - s.z0
  const glass = mesh(shared(`perkSlab:${dims(s)}:${q(thick)}`, () => slabGeometry(s, thick)), cardGlass(), false)
  glass.name = 'glass'
  glass.position.z = thick / 2
  const root = new THREE.Group()
  root.add(glass)
  const foot = mesh(shared(`perkFoot:${dims(s)}`, () => sweep(outlineOf(s, SLAB.frame + 0.6, 8), profile([[0, 0, true], [0, GLASS.caster, true]]))), cardGlass(), true, false)
  foot.name = 'foot'
  root.add(foot)
  return root
}

export const perkCards: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.id.endsWith('-slab')) return `perkSlab:${dims(s)}:${q(s.v?.[0] ?? 12)}`
    if (s.role === 'cardRule') return `perkRule:${q(s.w)}x${q(s.h)}`
    if (s.role === 'card') return slabKey(s)
    return null
  },
  make(s) {
    if (s.id.endsWith('-slab')) return glassSlab(s, s.v?.[0] ?? 12)
    if (s.role === 'card') return restingSlab(s)
    return engraved(s)
  },
  pose(o, s) {
    if (!s.id.endsWith('-slab')) return
    const seal = o.getObjectByName('seal')
    if (!seal) return
    const turn = o.rotation.x
    const print = o.getObjectByName('foot')
    if (print) print.position.z = -(thickOf(s) / 2 - GLASS.caster) * Math.cos(turn)
    const own = o.userData.glass as THREE.MeshPhysicalMaterial
    own.color.copy(srgb(GLASS.colour)).multiplyScalar(even(turn))
    seal.rotation.x = -turn
    seal.position.set(0, 0, -s.z0).applyAxisAngle(AXIS, -turn)
  },
  drop(o) {
    const own = o.userData.glass as THREE.MeshPhysicalMaterial | undefined
    own?.dispose()
  }
}
