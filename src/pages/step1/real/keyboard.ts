import * as THREE from 'three'
import { hashName } from '../../../core/random'
import type { PartMaker, RealContext } from '../../../real/types'
import { circle, merge, ringPath, roundedRect, sweep, translate, type Ring } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { DECK, HATCH, hatchCentre, seats } from '../keyboard'
import { BRUSH, CAP, capGeometry, kit, lit, scaleUv } from './keyboard-kit'

export const DECK_LOOK = { chamfer: 2.4, depth: 84, corner: 18, field: 7, fieldLip: 1.1, fieldDepth: CAP.skirt + 2.2, hatchHole: HATCH / 2 - 2 }

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

interface CapSlot { mesh: THREE.InstancedMesh; index: number }
interface DeckData { plate: THREE.Group; caps: Map<string, CapSlot>; meshes: THREE.InstancedMesh[]; owned: THREE.BufferGeometry[] }

const m4 = new THREE.Matrix4()
const quat = new THREE.Quaternion()
const euler = new THREE.Euler()
const at = new THREE.Vector3()
const one = new THREE.Vector3(1, 1, 1)

const tumble = (s: Shape, hop: number): THREE.Quaternion => {
  if (hop <= 0.01) return quat.identity()
  const n = hashName(s.id)
  const a = ((n & 255) / 255 - 0.5) * 0.02 * hop
  const b = (((n >> 8) & 255) / 255 - 0.5) * 0.02 * hop
  const c = (((n >> 16) & 255) / 255 - 0.5) * 0.006 * hop
  return quat.setFromEuler(euler.set(a, b, c))
}

function makeDeck(s: Shape, ctx: RealContext): THREE.Object3D {
  const k = kit()
  const root = new THREE.Group()
  const plate = new THREE.Group()
  const g = deckGeometry(s.w, s.h)
  plate.add(new THREE.Mesh(g.metal, k.deck), new THREE.Mesh(g.seat, k.seat))
  root.add(plate)
  const groups = new Map<string, Shape[]>()
  for (const c of ctx.list) {
    if (!isCap(c)) continue
    const key = (isEnter(c) ? 'accent:' : 'cap:') + capKey(c.w, c.h)
    const list = groups.get(key)
    if (list) list.push(c)
    else groups.set(key, [c])
  }
  const caps = new Map<string, CapSlot>()
  const meshes: THREE.InstancedMesh[] = []
  for (const [key, list] of groups) {
    const first = list[0]!
    const mesh = new THREE.InstancedMesh(capShape(first.w, first.h), key.startsWith('accent') ? k.orange : k.cap, list.length)
    mesh.frustumCulled = false
    list.forEach((c, index) => caps.set(c.id, { mesh, index }))
    meshes.push(mesh)
    root.add(mesh)
  }
  lit(root)
  const data: DeckData = { plate, caps, meshes, owned: [g.metal, g.seat] }
  root.userData.deck = data
  return root
}

function poseDeck(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const data = o.userData.deck as DeckData
  data.plate.position.z = s.z1 - s.z0
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  for (const mesh of data.meshes) mesh.count = 0
  for (const [id, slot] of data.caps) {
    const c = ctx.byId.get(id)
    if (!c) continue
    const hop = Math.max(0, c.v && c.v.length > 1 ? c.v[1]! : c.z0 - s.z1)
    at.set(c.x + c.w / 2 - cx, -(c.y + c.h / 2 - cy), c.z1 - s.z0)
    slot.mesh.setMatrixAt(slot.index, m4.compose(at, tumble(c, hop), one))
    slot.mesh.count = Math.max(slot.mesh.count, slot.index + 1)
  }
  for (const mesh of data.meshes) mesh.instanceMatrix.needsUpdate = true
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

// The deck, its seats and every cap on it are one object: the caps are instanced, one mesh for each size of cap.
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
    for (const mesh of data.meshes) mesh.dispose()
  }
}
