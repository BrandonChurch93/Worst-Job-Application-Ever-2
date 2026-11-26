import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { look } from '../../../post/look'
import { merge, outlineOf, profile, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { dims, mesh, q, shared, srgb } from './careers-solids'
import { glassPicture, PICTURE } from './glass-picture'

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

export const GLASS = { colour: 0xc4cecb, shade: 0.62, exit: 0.72, glint: 0.36, wash: 0.13, warm: 0.07, lean: 0.03, caster: 6.4, least: 0.4, most: 4.4, through: 0.8, grain: 0.024, mostSide: 0.7, fade: [3, 13] as [number, number], bend: 7, topShort: 0.3, wall: 2.4, wallUp: 0.85, spark: 0.5, sparkAt: [8.6, 3.8, 0.8] as [number, number, number] }

const keyFlat = Math.hypot(look.key.direction[0], look.key.direction[1]) || 1
const KX = look.key.direction[0] / keyFlat
const KY = look.key.direction[1] / keyFlat

const thickOf = (s: Shape): number => s.v?.[0] ?? 12
const bevelOf = (s: Shape): number => SLAB.bevel * Math.min(1, Math.min(s.w, s.h) / 90)

// How far in from a slab's outline its ground edge ends and its flat face begins.
export const groundEdge = (s: Shape): number => SLAB.frame + SLAB.round + bevelOf(s) + SLAB.flat

// How the ground edge shows, read off the approved card. `d` is how far in from the slab's outline, in page pixels.
// The side toward the light: a bright hairline on the rounded top of the wall, then the edge's own shade on the page under the slab, seen through the glass:
// a thin dark line, a paler line where the bevel meets the face, and a soft shade that is longer the more the edge faces the light.
// The far side: the light leaves there, so the face brightens toward the edge, dips, and ends in a white rim.
// In the corner that is turned full away from the light the two edges throw their light to one place: a short bright bow a little way in.
const NEAR: [number, number][] = [[0, -0.9], [0.9, -0.9], [1.7, 0.8], [3.6, 1], [5.4, 0.92], [6.8, 0.74], [8.4, 0.9], [10, 0.96], [12.3, 0.94]]
// The edge that lies across the light's way, the top one, read off the approved card too: its dark line is thinner, a pale line follows it, and its shade is lighter and shorter.
const NEAR_TOP: [number, number][] = [[0, -0.6], [0.9, -0.6], [1.7, 0.9], [3.6, 1.02], [5.2, 1.2], [6.6, 0.72], [8.2, 0.3], [10, 0.62], [11.9, 0.74], [12.3, 0.74]]
const FAR: [number, number][] = [[0, 1.2], [1.8, 1.2], [2.8, 0.85], [3.6, 0.45], [4.5, 0.18], [6, 0.26], [8, 0.38], [10, 0.38], [12, 0.34], [14, 0.27], [16, 0.19], [18, 0.14], [20, 0.09], [24, 0.04], [28, 0]]

const along = (table: [number, number][], d: number): number => {
  if (d <= table[0]![0]) return table[0]![1]
  for (let i = 1; i < table.length; i++) {
    const [d1, v1] = table[i]!
    const [d0, v0] = table[i - 1]!
    if (d <= d1) return v0 + ((v1 - v0) * (d - d0)) / (d1 - d0 || 1)
  }
  return table[table.length - 1]![1]
}

// What the glass's own colour is multiplied by at `d` px in from the outline, where the outline faces the light by `side` (1 toward it, -1 away).
export function edgeLight(d: number, facing: number, reach = 1, top = 0): number {
  const G = GLASS
  const side = Math.max(-G.mostSide, Math.min(G.mostSide, facing)) / G.mostSide
  if (side >= 0) {
    const end = 12.3 + (G.fade[0] + G.fade[1] * side) * reach * (1 - G.topShort * top)
    const last = 0.94 + (0.74 - 0.94) * top
    const shade = d <= 12.3 ? along(NEAR, d) * (1 - top) + along(NEAR_TOP, d) * top : last * (1 - smooth((d - 12.3) / (end - 12.3)))
    return shade < 0 ? 1 - side * shade * G.glint : 1 - side * G.shade * shade
  }
  return 1 - side * G.exit * along(FAR, d)
}

const smooth = (t: number): number => {
  const u = Math.max(0, Math.min(1, t))
  return u * u * (3 - 2 * u)
}

// One face of the slab, from the middle of its wall to the middle of its face. `d` is how far in from the edge a ring lies, `z` its height.
// A ring further in than the corner's radius keeps its corners square, so no ring ever folds over itself.
// The picture coordinates of the ground edge are pushed outward, so what shows through the edge is bent as a rounded edge of glass bends it,
// and further outward down the wall by its depth, so the picture lies down the wall as closely as on the face.
function face(s: Shape, half: number, flip: number, open: boolean): THREE.BufferGeometry {
  const bevel = bevelOf(s)
  const foot = half - SLAB.rise
  const G = GLASS
  const k = bevel / SLAB.bevel
  const top = SLAB.round + bevel
  const lowest = Math.min(s.w, s.h) / 2 - SLAB.frame
  const rings: { d: number; z: number; lean: number }[] = [
    { d: 0, z: 0, lean: 1 },
    { d: 0, z: foot - SLAB.round, lean: 1 },
    { d: 0.5, z: foot - 0.5, lean: 0.5 },
    { d: 1.1, z: foot - 0.1, lean: 0.2 },
    { d: SLAB.round, z: foot, lean: G.lean * 2 },
    { d: SLAB.round + 1.8 * k, z: foot + SLAB.rise * 0.24, lean: G.lean },
    { d: SLAB.round + 3.4 * k, z: foot + SLAB.rise * 0.45, lean: G.lean },
    { d: SLAB.round + 4.8 * k, z: foot + SLAB.rise * 0.62, lean: G.lean },
    { d: SLAB.round + 6.4 * k, z: foot + SLAB.rise * 0.8, lean: G.lean },
    { d: SLAB.round + 8.2 * k, z: foot + SLAB.rise * 0.94, lean: G.lean },
    { d: top - 0.4, z: half, lean: 0.05 },
    { d: top + SLAB.flat, z: half, lean: 0 }
  ]
  const reach = open ? 0.12 : Math.min(1, Math.max(0.12, (lowest - 2 - top - SLAB.flat) / (G.fade[0] + G.fade[1] - SLAB.flat)))
  if (!open) {
    const last = top + SLAB.flat + (G.fade[0] + G.fade[1] - SLAB.flat) * reach
    const steps = Math.max(2, Math.round((last - top - SLAB.flat) / 2.2))
    for (let i = 1; i <= steps; i++) rings.push({ d: top + SLAB.flat + ((last - top - SLAB.flat) * i) / steps, z: half, lean: 0 })
    for (const f of [0.3, 0.65]) rings.push({ d: last + f * Math.max(0, lowest - last - 1), z: half, lean: 0 })
  }
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
  const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, v: number, warm: number, ux: number, uy: number): void => {
    const wash = 1 + G.wash * ((x * KX + flip * y * KY) / span)
    pos.push(x, y, z)
    nor.push(nx, ny, nz)
    uv.push(ux, uy)
    col.push(v * wash * (1 + warm * 0.6), v * wash, v * wash * (1 - warm))
  }
  rings.forEach((ring, r) => {
    const before = rings[Math.max(0, r - 1)]!
    const after = rings[Math.min(rings.length - 1, r + 1)]!
    const run = after.d - before.d
    const up = after.z - before.z
    const l = Math.hypot(run, up) || 1
    const dd = ring.d / k
    const bend = G.bend * Math.max(0, 1 - ring.d / top) ** 2
    for (let i = 0; i < n; i++) {
      const ox = outline.nx[i]!
      const oy = outline.ny[i]!
      const side = ox * KX + flip * oy * KY
      const turned = Math.max(0, (-side - G.sparkAt[2]) / (1 - G.sparkAt[2]))
      const spark = 1 + G.spark * turned * turned * Math.max(0, 1 - ((dd - G.sparkAt[0]) / G.sparkAt[1]) ** 2)
      const v = r === 0 && side > 0 ? 0.9 : edgeLight(dd, side, reach, oy * oy) * spark * (r < 2 && side < 0 ? 1 + (G.wall - 1) * Math.min(1, -side / G.mostSide) : 1)
      const out = (up / l) * (r < 2 && side < 0 ? ring.lean * (1 - G.wallUp * Math.min(1, -side / G.mostSide)) : ring.lean)
      const rise = Math.sqrt(Math.max(0, 1 - out * out))
      const x = Math.max(-(wide - ring.d), Math.min(wide - ring.d, outline.x[i]! - ring.d * ox))
      const y = Math.max(-(tall - ring.d), Math.min(tall - ring.d, outline.y[i]! - ring.d * oy))
      const warm = side < 0 && dd < 3 ? -side * G.warm * (1 - dd / 3) : 0
      const down = bend + Math.max(0, foot - ring.z)
      put(x, y, ring.z, ox * out, oy * out, rise, v, warm, x + ox * down, y + oy * down)
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
    put(0, 0, half, 0, 0, 1, 1, 0, 0, 0)
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

// The glass's own colour is multiplied by its picture (what shows through it), and the page's own grain is read again as its normal, far weaker: the frost of its face.
export const glassOptions = (): THREE.MeshPhysicalMaterialParameters => ({
  color: srgb(GLASS.colour).multiplyScalar(1 / PICTURE.level), map: glassPicture(), roughness: 0.34, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.22, specularIntensity: 0.6, vertexColors: true, shadowSide: THREE.BackSide,
  normalMap: materials().ceramic.normalMap, normalScale: new THREE.Vector2(GLASS.grain, GLASS.grain)
})

let spillMade: THREE.MeshPhysicalMaterial | null = null

// The light that comes through a slab of glass and falls on the page beyond its far edge: the page's own ceramic, warm as light is that has
// passed through a ground edge, laid thin over the slab's shadow. It takes no shadow, so where it lies the shadow is paler and warmer.
const spillMaterial = (): THREE.MeshPhysicalMaterial =>
  (spillMade ??= studio(new THREE.MeshPhysicalMaterial({
    color: srgb(0xf2f1ee).multiply(new THREE.Color(SPILL.tint[0], SPILL.tint[1], SPILL.tint[2])), roughness: 0.74, metalness: 0, specularIntensity: 0.6, vertexColors: true, transparent: true, depthWrite: false,
    normalMap: materials().ceramic.normalMap, normalScale: new THREE.Vector2(0.04, 0.04), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2
  })))

export const SPILL = { tint: [1, 0.9, 0.7] as [number, number, number], rings: [[-2, 0.3], [0, 0.26], [2, 0.2], [4, 0.17], [6, 0.22], [8, 0.3], [10, 0.32], [14, 0.24], [20, 0.1], [28, 0]] as [number, number][], turn: 1.6 }

// The ring of spilled light round a slab's far edges, lying on the page.
export function spillGeometry(s: Shape): THREE.BufferGeometry {
  const outline = outlineOf(s, SLAB.frame, 14)
  const n = outline.count
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (const [d, a] of SPILL.rings) {
    for (let i = 0; i < n; i++) {
      const side = outline.nx[i]! * KX + outline.ny[i]! * KY
      pos.push(outline.x[i]! + d * outline.nx[i]!, outline.y[i]! + d * outline.ny[i]!, 0.06)
      col.push(1, 1, 1, a * Math.max(0, Math.min(1, -side * SPILL.turn)))
    }
  }
  for (let r = 0; r < SPILL.rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(r * n + i, (r + 1) * n + i, r * n + j, r * n + j, (r + 1) * n + i, (r + 1) * n + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.filter((_, i) => i % 3 !== 2), 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

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
  const glass = mesh(shared(`perkSlab:${dims(s)}:${q(thick)}:${fallKey(s)}`, () => darker(slabGeometry(s, thick), s)), own, false)
  glass.name = 'glass'
  root.add(glass)
  const print = mesh(shared(`perkPrint:${dims(s)}`, () => sweep(outlineOf(s, SLAB.frame + 0.6, 8), profile([[0, -0.3, true], [0, 0.3, true]]))), cardGlass(), true, false)
  print.name = 'foot'
  root.add(print)
  const seal = mesh(shared(`perkSeal:${dims(s)}`, () => sealGeometry(s)), materials().ceramic, false)
  seal.name = 'seal'
  root.add(seal)
  const trough = mesh(shared(`perkTrough:${dims(s)}`, () => troughGeometry(s)), troughMaterial(), false, false)
  trough.name = 'trough'
  root.add(trough)
  root.userData.glass = own
  return root
}

export const TROUGH = { colour: 0xe6e4df, steps: 28, clear: 7.5, rim: 0.98, dark: 0.46, low: 0.8, lit: 1 }

let troughMade: THREE.MeshPhysicalMaterial | null = null

const troughMaterial = (): THREE.MeshPhysicalMaterial =>
  (troughMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(TROUGH.colour), roughness: 0.78, metalness: 0, specularIntensity: 0.35, vertexColors: true })))

// The bed a card turns in: a round trough of the page's own ceramic, as deep as half the card is tall. Its light is laid into it, and its normals stand straight up so that the key adds none of its own:
// the wall under the lip toward the light is in the lip's shade, the far wall takes the light, and the bottom lies between.
export function troughGeometry(s: Shape): THREE.BufferGeometry {
  const T = TROUGH
  const half = s.h / 2
  const deep = half + T.clear
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const shade = (t: number): number => {
    const u = t / Math.PI
    const fall = T.dark + (T.lit - T.dark) * smooth((u - 0.12) / 0.8)
    const lip = Math.exp(-u / 0.04) * (T.rim - T.dark) + Math.exp(-(1 - u) / 0.04) * (T.rim - T.lit)
    return fall + lip - (T.lit - T.low) * 0.5 * Math.sin(t) ** 2 * u
  }
  for (let i = 0; i <= T.steps; i++) {
    const t = (i / T.steps) * Math.PI
    const y = half * Math.cos(t)
    const z = -0.4 - deep * Math.sin(t)
    const v = shade(t)
    for (const side of [-1, 1]) {
      pos.push((side * s.w) / 2, y, z)
      col.push(v, v, v)
    }
  }
  for (let i = 0; i < T.steps; i++) {
    const k = i * 2
    idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3)
  }
  for (const side of [-1, 1]) {
    const base = pos.length / 3
    const x = side * (s.w / 2 - 1.5)
    const end = side * KX > 0 ? T.dark : T.lit
    pos.push(x, 0, -0.4)
    col.push(end, end, end)
    for (let i = 0; i <= T.steps; i++) {
      const t = (i / T.steps) * Math.PI
      pos.push(x, half * Math.cos(t), -0.4 - deep * Math.sin(t))
      const v = end * 0.6 + shade(t) * 0.4
      col.push(v, v, v)
    }
    for (let i = 0; i < T.steps; i++) {
      idx.push(base, base + 1 + i, base + 2 + i, base, base + 2 + i, base + 1 + i)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setIndex(idx)
  return g
}

// Glass further from the lamp, toward the page's right, is darker, by the approved image: its colour falls by `per` for each page pixel, which the
// light already on it turns into about 1.5, 5 and 7.5 hundredths at the three cards of a row.
export const FALL = { at: 1.02, per: 0.000115 }
export const fallAt = (x: number): number => FALL.at - FALL.per * x
export const fallOf = (s: Shape): number => fallAt(s.x + s.w / 2)
const fallKey = (s: Shape): string => fallOf(s).toFixed(3)

export function darker(g: THREE.BufferGeometry, s: Shape): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const had = g.getAttribute('color')
  const size = had?.itemSize ?? 3
  const col = new Float32Array(p.count * size).fill(1)
  if (had) col.set(had.array as Float32Array)
  for (let i = 0; i < p.count; i++) {
    const by = fallAt(s.x + s.w / 2 + p.getX(i))
    for (let k = 0; k < 3; k++) col[i * size + k]! *= by
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, size))
  return g
}

export const slabKey = (s: Shape): string => `restSlab:${dims(s)}:${q(s.z1 - s.z0)}:${fallKey(s)}`

// A card at rest on the page: the same slab, lying with its under side on the surface. Glass lets most of the light through, so the shadow on the
// page is thrown by the printed foot of the slab alone, which lies inside the glass and is never seen.
export function restingSlab(s: Shape): THREE.Object3D {
  const thick = s.z1 - s.z0
  const glass = mesh(shared(`perkSlab:${dims(s)}:${q(thick)}:${fallKey(s)}`, () => darker(slabGeometry(s, thick), s)), cardGlass(), false)
  glass.name = 'glass'
  glass.position.z = thick / 2
  const root = new THREE.Group()
  root.add(glass)
  const foot = mesh(shared(`perkFoot:${dims(s)}`, () => sweep(outlineOf(s, SLAB.frame + 0.6, 8), profile([[0, 0, true], [0, GLASS.caster, true]]))), cardGlass(), true, false)
  foot.name = 'foot'
  root.add(foot)
  const spill = mesh(shared(`perkSpill:${dims(s)}`, () => spillGeometry(s)), spillMaterial(), false, false)
  spill.name = 'spill'
  root.add(spill)
  return root
}

export const perkCards: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.id.endsWith('-slab')) return `perkSlab:${dims(s)}:${q(s.v?.[0] ?? 12)}:${fallKey(s)}`
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
    const trough = o.getObjectByName('trough')
    if (trough) {
      trough.rotation.x = -turn
      trough.position.copy(seal.position)
    }
  },
  drop(o) {
    const own = o.userData.glass as THREE.MeshPhysicalMaterial | undefined
    own?.dispose()
  }
}
