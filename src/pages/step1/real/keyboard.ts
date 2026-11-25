import * as THREE from 'three'
import { hashName } from '../../../core/random'
import type { PartMaker, RealContext } from '../../../real/types'
import { circle, merge, ringPath, roundedRect, sweep, translate, type Ring } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { DECK, HATCH, hatchCentre, seats } from '../keyboard'
import { BRUSH, CAP, capGeometry, kit, lit, scaleUv } from './keyboard-kit'

export const DECK_LOOK = { chamfer: 2.4, depth: 84, corner: 5, field: 7, fieldLip: 1.1, fieldDepth: CAP.skirt + 2.2, hatchHole: HATCH / 2 - 2 }

const capKey = (w: number, h: number): string => `${Math.round(w * 4) / 4}x${Math.round(h * 4) / 4}`
const capGeometries = new Map<string, THREE.BufferGeometry>()
const capShape = (w: number, h: number): THREE.BufferGeometry => {
  const key = capKey(w, h)
  let g = capGeometries.get(key)
  if (!g) {
    g = capGeometry(w, h)
    capGeometries.set(key, g)
  }
  return g
}

const CORE = 0.6
const SHADE = { soft: 0.16, dark: 0.44, spread: 0.25, over: 3, clear: 4.5, core: 0.74, x: 1.8, y: 1.67, least: 0.6, rest: 10, tight: 0.6, grow: -6 }

// The shadow a cap in the air leaves on the bed: a soft dark patch with no picture, its edge fading to nothing.
function shadeGeometry(): THREE.BufferGeometry {
  const f = SHADE.soft
  const steps = [-0.5 - f, -0.5 + f, 0.5 - f, 0.5 + f]
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    pos.push(steps[i]!, steps[j]!, 0)
    col.push(1, 1, 1, i > 0 && i < 3 && j > 0 && j < 3 ? 1 : 0)
  }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const a = j * 4 + i
    idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}
let shadeMaterial: THREE.MeshBasicMaterial | null = null
let ghostMaterial: THREE.MeshBasicMaterial | null = null
const GHOST = { least: 3, under: 7, deep: 12 }
const matrix = new THREE.Matrix4()
const SUNK = 0.24
const LAMP = 0.9
let core: THREE.BufferGeometry | null = null
const coreShape = (w: number, h: number): THREE.BufferGeometry => {
  if (core) return core
  core = capGeometry(w - CORE * 2, h - CORE * 2)
  core.translate(0, 0, -CORE)
  return core
}

const isCap = (s: Shape): boolean => s.role === 'keycap' && s.kind !== 'text'
const isEnter = (s: Shape): boolean => s.id === 'key-enter'

function deckGeometry(w: number, h: number): { metal: THREE.BufferGeometry; seat: THREE.BufferGeometry } {
  const c = DECK_LOOK.chamfer
  const outer = roundedRect(w, h, DECK_LOOK.corner, 8)
  const face = new THREE.Shape(ringPath(outer, c, 0, 0).getPoints())
  const metal: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const ox = DECK.x + DECK.w / 2
  const oy = DECK.y + DECK.h / 2
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (const seat of seats) {
    x0 = Math.min(x0, seat.cx - seat.w / 2)
    x1 = Math.max(x1, seat.cx + seat.w / 2)
    y0 = Math.min(y0, seat.cy - seat.h / 2)
    y1 = Math.max(y1, seat.cy + seat.h / 2)
  }
  const f = DECK_LOOK.field
  const l = DECK_LOOK.fieldLip
  const field = roundedRect(x1 - x0 + f * 2, y1 - y0 + f * 2, CAP.corner + f, 6)
  const fx = (x0 + x1) / 2 - ox
  const fy = -((y0 + y1) / 2 - oy)
  face.holes.push(ringPath(field, -l, fx, fy))
  metal.push(translate(sweep(field, [
    { inset: -l, z: 0, out: -0.7071, up: 0.7071 },
    { inset: 0, z: -l, out: -0.7071, up: 0.7071 }
  ], false), fx, fy))
  dark.push(translate(sweep(field, [
    { inset: 0, z: -l, out: -1, up: 0 },
    { inset: 0, z: -DECK_LOOK.fieldDepth, out: -1, up: 0 }
  ], true), fx, fy))
  for (const side of [0, 1] as const) {
    const at = hatchCentre(side)
    face.holes.push(ringPath(circle(DECK_LOOK.hatchHole, 48), 0, at.x - ox, -(at.y - oy)))
  }
  const top = new THREE.ShapeGeometry(face)
  const p = top.getAttribute('position')
  const uvs = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    uvs[i * 2] = p.getX(i)
    uvs[i * 2 + 1] = p.getY(i)
  }
  top.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  metal.push(top)
  const wall: Ring[] = [
    { inset: 0, z: -DECK_LOOK.depth, out: 1, up: 0 },
    { inset: 0, z: -c, out: 1, up: 0 },
    { inset: 0, z: -c, out: 0.7071, up: 0.7071 },
    { inset: c, z: 0, out: 0.7071, up: 0.7071 }
  ]
  metal.push(sweep(outer, wall, false))
  return { metal: scaleUv(merge(metal), 1 / BRUSH.u, 1 / BRUSH.v), seat: merge(dark) }
}

interface CapSlot { start: number; count: number; from: Float32Array; facing: Float32Array; pose: [number, number, number, number, number]; leaned: boolean; shade: number }
interface DeckData { plate: THREE.Group; caps: Map<string, CapSlot>; body: THREE.Mesh; accent: THREE.Mesh | null; shades: THREE.InstancedMesh; ghosts: THREE.InstancedMesh; owned: THREE.BufferGeometry[] }

const quat = new THREE.Quaternion()
const euler = new THREE.Euler()
const at = new THREE.Vector3()
const v3 = new THREE.Vector3()

// A cap in the air leans a few degrees, by its name. It sinks by what the lean lifts under its legend, so the flat legend is never under the plastic.
const tumble = (s: Shape, hop: number): number => {
  if (hop <= 0.01) {
    quat.identity()
    return 0
  }
  const n = hashName(s.id)
  const k = Math.min(hop, 32) * 0.0045
  const a = ((n & 255) / 255 - 0.5) * k
  const b = (((n >> 8) & 255) / 255 - 0.5) * k
  quat.setFromEuler(euler.set(a, b, 0))
  return (Math.abs(a) + Math.abs(b)) * 11
}

function makeDeck(s: Shape, ctx: RealContext): THREE.Object3D {
  const k = kit()
  const root = new THREE.Group()
  const plate = new THREE.Group()
  const g = deckGeometry(s.w, s.h)
  const bed = new THREE.Mesh(g.seat, k.bed)
  plate.add(new THREE.Mesh(g.metal, k.deck), bed)
  root.add(plate)
  const cream = ctx.list.filter(isCap)
  const enter = cream.find(isEnter)
  const total = cream.reduce((n, c) => n + (isEnter(c) ? coreShape(c.w, c.h) : capShape(c.w, c.h)).getAttribute('position').count, 0)
  const position = new Float32Array(total * 3)
  const normal = new Float32Array(total * 3)
  const uv = new Float32Array(total * 2)
  const index: number[] = []
  const caps = new Map<string, CapSlot>()
  let start = 0
  for (const c of cream) {
    const shape = isEnter(c) ? coreShape(c.w, c.h) : capShape(c.w, c.h)
    const from = shape.getAttribute('position').array as Float32Array
    const facing = shape.getAttribute('normal').array as Float32Array
    const count = from.length / 3
    normal.set(facing, start * 3)
    uv.set(shape.getAttribute('uv').array as Float32Array, start * 2)
    for (const i of shape.getIndex()!.array) index.push(start + i)
    caps.set(c.id, { start, count, from, facing, pose: [NaN, 0, 0, 0, 0], leaned: false, shade: 1 })
    start += count
  }
  const all = new THREE.BufferGeometry()
  const spots = new THREE.BufferAttribute(position, 3)
  const faces = new THREE.BufferAttribute(normal, 3)
  spots.setUsage(THREE.DynamicDrawUsage)
  faces.setUsage(THREE.DynamicDrawUsage)
  all.setAttribute('position', spots)
  all.setAttribute('normal', faces)
  all.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  const tints = new THREE.BufferAttribute(new Float32Array(total * 3).fill(1), 3)
  tints.setUsage(THREE.DynamicDrawUsage)
  all.setAttribute('color', tints)
  all.setIndex(index)
  const body = new THREE.Mesh(all, k.cap)
  body.frustumCulled = false
  root.add(body)
  let accent: THREE.Mesh | null = null
  if (enter) {
    accent = new THREE.Mesh(capShape(enter.w, enter.h), k.lamp)
    accent.frustumCulled = false
    root.add(accent)
  }
  lit(root)
  bed.castShadow = false
  bed.receiveShadow = false
  if (accent) accent.castShadow = false
  body.castShadow = false
  shadeMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.011, 0.01), vertexColors: true, transparent: true, opacity: SHADE.dark, depthWrite: false, toneMapped: false })
  const patch = shadeGeometry()
  const shades = new THREE.InstancedMesh(patch, shadeMaterial, cream.length * 2)
  shades.count = 0
  shades.frustumCulled = false
  shades.castShadow = false
  shades.receiveShadow = false
  root.add(shades)
  ghostMaterial ??= new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  const block = new THREE.BoxGeometry(1, 1, 1)
  const ghosts = new THREE.InstancedMesh(block, ghostMaterial, cream.length)
  ghosts.count = 0
  ghosts.frustumCulled = false
  ghosts.castShadow = true
  ghosts.receiveShadow = false
  root.add(ghosts)
  const data: DeckData = { plate, caps, body, accent, shades, ghosts, owned: [g.metal, g.seat, all, patch, block] }
  root.userData.deck = data
  return root
}

// Every cap is one stretch of one mesh. The caps take shadows and cast none: a seated cap that shades its own top goes mottled under this light. A cap in the air casts through a block that is not drawn, and leaves a soft patch on the bed. A cap that moved since the last frame has its stretch written again, the others are left.
function poseDeck(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const data = o.userData.deck as DeckData
  data.plate.position.z = s.z1 - s.z0
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const spots = data.body.geometry.getAttribute('position') as THREE.BufferAttribute
  const faces = data.body.geometry.getAttribute('normal') as THREE.BufferAttribute
  const tints = data.body.geometry.getAttribute('color') as THREE.BufferAttribute
  const p = spots.array as Float32Array
  const n = faces.array as Float32Array
  let moved = false
  let turned = false
  let shaded = false
  let patches = 0
  let casters = 0
  const floor = s.z1 - s.z0 - DECK_LOOK.fieldDepth + 0.35
  let crest = floor
  for (const id of data.caps.keys()) {
    const c = ctx.byId.get(id)
    if (c) crest = Math.max(crest, c.z1 - s.z0 - Math.max(0, c.v && c.v.length > 1 ? c.v[1]! : 0))
  }
  const place = (c: Shape): boolean => {
    const hop = Math.max(0, c.v && c.v.length > 1 ? c.v[1]! : c.z0 - s.z1)
    const sink = tumble(c, hop)
    at.set(c.x + c.w / 2 - cx, -(c.y + c.h / 2 - cy), c.z1 - s.z0 - sink)
    return hop > 0.01
  }
  for (const [id, slot] of data.caps) {
    const c = ctx.byId.get(id)
    const to = slot.start * 3
    if (!c) {
      if (!Number.isNaN(slot.pose[0])) {
        p.fill(0, to, to + slot.count * 3)
        slot.pose[0] = NaN
        moved = true
      }
      continue
    }
    const leaning = place(c)
    const hop = Math.max(0, c.v && c.v.length > 1 ? c.v[1]! : 0)
    if (hop > SHADE.clear) {
      const wide = c.w - 6 + hop * SHADE.spread
      const tall = c.h - 6 + hop * SHADE.spread
      matrix.makeScale(wide, tall, 1)
      matrix.setPosition(at.x + hop * SHADE.x, at.y - hop * SHADE.y, crest + SHADE.over)
      data.shades.setMatrixAt(patches++, matrix)
      matrix.makeScale(wide * SHADE.core, tall * SHADE.core, 1)
      matrix.setPosition(at.x + hop * SHADE.x, at.y - hop * SHADE.y, crest + SHADE.over + 0.2)
      data.shades.setMatrixAt(patches++, matrix)
    } else if (hop > SHADE.least) {
      matrix.makeScale(c.w - 6, c.h - 6, 1)
      matrix.setPosition(at.x + hop * SHADE.x, at.y - hop * SHADE.y, floor)
      data.shades.setMatrixAt(patches++, matrix)
    } else {
      const off = SHADE.rest * (1 - SHADE.tight * Math.min(1, Math.max(0, c.v && c.v.length > 0 ? c.v[0]! : 0)))
      matrix.makeScale(c.w + SHADE.grow, c.h + SHADE.grow * 1.4, 1)
      matrix.setPosition(at.x + off, at.y - off, floor)
      data.shades.setMatrixAt(patches++, matrix)
    }
    if (hop > GHOST.least) {
      matrix.makeScale(c.w - 8, c.h - 8, GHOST.deep)
      matrix.setPosition(at.x, at.y, at.z - GHOST.under - GHOST.deep / 2)
      data.ghosts.setMatrixAt(casters++, matrix)
    }
    const shade = 1 - SUNK * Math.min(1, Math.max(0, c.v && c.v.length > 0 ? c.v[0]! : 0))
    if (shade !== slot.shade) {
      slot.shade = shade
      ;(tints.array as Float32Array).fill(shade, to, to + slot.count * 3)
      shaded = true
    }
    const was = slot.pose
    if (was[0] === at.x && was[1] === at.y && was[2] === at.z && was[3] === quat.x && was[4] === quat.y) continue
    slot.pose = [at.x, at.y, at.z, quat.x, quat.y]
    moved = true
    if (!leaning) {
      for (let i = 0; i < slot.count * 3; i += 3) {
        p[to + i] = slot.from[i]! + at.x
        p[to + i + 1] = slot.from[i + 1]! + at.y
        p[to + i + 2] = slot.from[i + 2]! + at.z
      }
      if (slot.leaned) {
        n.set(slot.facing, to)
        slot.leaned = false
        turned = true
      }
      continue
    }
    for (let i = 0; i < slot.count * 3; i += 3) {
      v3.set(slot.from[i]!, slot.from[i + 1]!, slot.from[i + 2]!).applyQuaternion(quat)
      p[to + i] = v3.x + at.x
      p[to + i + 1] = v3.y + at.y
      p[to + i + 2] = v3.z + at.z
      v3.set(slot.facing[i]!, slot.facing[i + 1]!, slot.facing[i + 2]!).applyQuaternion(quat)
      n[to + i] = v3.x
      n[to + i + 1] = v3.y
      n[to + i + 2] = v3.z
    }
    slot.leaned = true
    turned = true
  }
  if (moved) spots.needsUpdate = true
  if (turned) faces.needsUpdate = true
  if (shaded) tints.needsUpdate = true
  if (patches > 0 || data.shades.count > 0) {
    data.shades.count = patches
    data.shades.instanceMatrix.needsUpdate = true
  }
  if (casters > 0 || data.ghosts.count > 0) {
    data.ghosts.count = casters
    data.ghosts.instanceMatrix.needsUpdate = true
  }
  if (data.accent) {
    const c = ctx.byId.get('key-enter')
    data.accent.visible = !!c
    kit().lamp.emissiveIntensity = c ? LAMP * Math.min(1, Math.max(0, c.v && c.v.length > 0 ? c.v[0]! : 0)) : 0
    if (c) {
      place(c)
      data.accent.position.copy(at)
      data.accent.quaternion.copy(quat)
    }
  }
}

function makeLoneCap(s: Shape): THREE.Object3D {
  const k = kit()
  const root = new THREE.Group()
  const mesh = new THREE.Mesh(capShape(s.w, s.h), isEnter(s) ? k.orange : k.cap)
  root.add(mesh)
  lit(root)
  root.userData.cap = mesh
  return root
}

// The deck, its bed and every cap on it are one object: the caps are one mesh of one draw, the orange Enter a second that casts no shadow of its own.
export const keyboard: PartMaker = {
  key(s, ctx) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.role === 'keyboardDeck') return `deck:${s.w}:${s.h}`
    if (isCap(s)) return ctx.byId.has('keyboard-deck') ? '' : `cap:${capKey(s.w, s.h)}:${isEnter(s) ? 1 : 0}`
    return null
  },
  make(s, ctx) {
    return s.role === 'keyboardDeck' ? makeDeck(s, ctx) : makeLoneCap(s)
  },
  pose(o, s, ctx) {
    if (o.userData.deck) poseDeck(o, s, ctx)
    else (o.userData.cap as THREE.Mesh).position.z = s.z1 - s.z0
  },
  drop(o) {
    const data = o.userData.deck as DeckData | undefined
    if (!data) return
    for (const g of data.owned) g.dispose()
  }
}
