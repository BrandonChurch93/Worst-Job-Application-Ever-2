import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape, Tone } from '../../stage/types'
import { look } from '../../post/look'
import { materials, type Materials } from '../materials'
import { arc, circle, outlineOf, pocketCut, profile, roundedRect, sweep, type Outline, type ProfilePoint, type Ring } from '../solids'

const q = (v: number): number => Math.round(v * 4) / 4
const geometries = new Map<string, THREE.BufferGeometry>()
const shared = (key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry => {
  let g = geometries.get(key)
  if (!g) {
    g = make()
    geometries.set(key, g)
  }
  return g
}

const TONE_MATERIAL: Record<Tone, keyof Materials> = {
  page: 'ceramic', pocket: 'pocket', raised: 'keycap', metal: 'smoked', accent: 'orange', danger: 'red', paper: 'paper', dark: 'gap', glass: 'glass', light: 'enamel', ink: 'ink', inkLight: 'inkOnOrange'
}
const toneMaterial = (tone: Tone): THREE.Material => materials()[TONE_MATERIAL[tone]] as THREE.Material

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

const dims = (s: Shape): string => `${s.kind}:${q(s.w)}x${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`

// The face of a turned part: its pictures lie across the whole disc once.
function discUv(g: THREE.BufferGeometry, d: number): THREE.BufferGeometry {
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / d + 0.5, uv.getY(i) / d + 0.5)
  return g
}

const RIM = 2.2
const SEAM = 1.1

// The aluminium sleeve of a pocket: a thin flat rim at the surface and a wall that leans in, down to what lies in the pocket.
function sleeve(s: Shape, surface: number, lean: number): THREE.BufferGeometry {
  const top = surface - Math.min(0.7, pocketCut(s).lip)
  const foot = RIM - 0.4 + lean * (top - 0.5)
  const points: ProfilePoint[] = [
    [0.1, top - 1.4, true], [0.1, top - 0.8, true], ...arc(0.1, top - 0.8, 1, 0.8, 4).slice(1), ...bead(RIM - 1.5, top, 1.5, 1, 5).slice(1), [foot, 0, true], [foot, -0.4, true]
  ]
  return sweep(outlineOf(s, 0, 12), profile(points), false)
}

// The inner quarter of a rounded rim: from its flat top down to where the wall begins.
function bead(inset: number, z: number, across: number, fall: number, steps: number): ProfilePoint[] {
  const out: ProfilePoint[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    out.push([inset + across * Math.sin(a), z - fall * (1 - Math.cos(a))])
  }
  return out
}

const SOAK = 8.5
const SOAK_HOLD = 2.5
const SOAK_DEPTH = 0.32
const BOUNCE = 0.24
const BOUNCE_REACH = 10
const GLINT = 0.14
const SOAK_RINGS = [0, 1.5, 3, 5, 7.5, 10.5, 14, 18, 23, 29, 36]

// One ring of a sunk face: a rounded rectangle with extra points along its straight sides, the same count for every ring.
function denseRing(w: number, h: number, r: number, perCorner: number, along: number, across: number): [number, number][] {
  const o = roundedRect(w, h, r, perCorner)
  const n = perCorner + 1
  const out: [number, number][] = []
  for (let c = 0; c < 4; c++) {
    for (let i = 0; i < n; i++) out.push([o.x[c * n + i]!, o.y[c * n + i]!])
    const from = c * n + n - 1
    const to = ((c + 1) % 4) * n
    const steps = c % 2 === 0 ? along : across
    for (let k = 1; k < steps; k++) out.push([o.x[from]! + ((o.x[to]! - o.x[from]!) * k) / steps, o.y[from]! + ((o.y[to]! - o.y[from]!) * k) / steps])
  }
  return out
}

// The face of frosted glass sunk in a pocket. The wall on the light's side throws its shadow into the body of the glass, not only onto its face:
// the nearer the wall, the more of the glass under a point lies in that shadow. The wall on the far side is lit and gives a little light back.
// Both are laid into the face as vertex colour, from the key's direction and the pocket's depth.
function sunkGlass(s: Shape, inset: number, depth: number): THREE.BufferGeometry {
  const w = s.w - inset * 2
  const h = s.h - inset * 2
  const r = Math.max(0.6, (s.r ?? 0) - inset)
  const half = Math.min(w, h) / 2
  const insets = [...SOAK_RINGS.filter((v) => v < half - 2), half - 0.4]
  const along = Math.max(1, Math.ceil(w / 28))
  const across = Math.max(1, Math.ceil(h / 28))
  const rings = insets.map((v) => denseRing(w - v * 2, h - v * 2, Math.min(Math.max(0.6, r - v), half - v), 8, along, across))
  const n = rings[0]!.length
  const [lx, ly, lz] = look.key.direction
  const flat = Math.hypot(lx, ly) || 1
  const dx = lx / flat
  const dy = ly / flat
  const slope = lz / flat
  const outside = (x: number, y: number): boolean => {
    const qx = Math.abs(x) - (w / 2 - r)
    const qy = Math.abs(y) - (h / 2 - r)
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r > 0
  }
  const reach = (x: number, y: number, sign: number): number => {
    let near = 0
    let far = w + h
    for (let k = 0; k < 14; k++) {
      const mid = (near + far) / 2
      if (outside(x + sign * dx * mid, y + sign * dy * mid)) far = mid
      else near = mid
    }
    return near
  }
  const shade = (x: number, y: number): number => 1 - SOAK_DEPTH * Math.exp(-Math.max(0, reach(x, y, 1) * slope - depth - SOAK_HOLD) / SOAK) + BOUNCE * Math.exp(-(reach(x, y, -1) * slope) / BOUNCE_REACH) + GLINT * Math.exp(-Math.max(0, reach(x, y, -1) - 1) / 1.6)
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const put = (x: number, y: number): void => {
    const v = shade(x, y)
    pos.push(x, y, 0)
    col.push(v, v, v)
  }
  for (const ring of rings) for (const [x, y] of ring) put(x, y)
  put(0, 0)
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(k * n + i, k * n + j, (k + 1) * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i)
    }
  }
  const last = (rings.length - 1) * n
  for (let i = 0; i < n; i++) idx.push(rings.length * n, last + i, last + ((i + 1) % n))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.filter((_, i) => i % 3 !== 2), 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

function field(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const surface = -s.z0
  const liner = mesh(shared(`sleeve:${dims(s)}`, () => sleeve(s, surface, 0.12)), m.aluminiumSatin)
  liner.receiveShadow = false
  root.add(liner)
  const glass = mesh(shared(`fieldGlass:${dims(s)}`, () => sunkGlass(s, RIM - 0.6, surface)), m.glassSunk, false)
  root.add(glass)
  return root
}

const CROWN_RAIL = 0.1
const RAIL_BEVEL = 1.3
const RAIL_RISE = 0.8
const COLLAR = 2.2
const CLEARANCE = 1.3
const COLLAR_PROUD = 0.6
const CROWN_BUTTON = 0.4
const FOOT_RING = 6
const FOOT_RISE = 0.34
const FOOT_ROUND = 2.4
const WALL_LEAN = 1.6
const EDGE = 4.6
const FLANGE = 4.4
const BEAD = 1.5
const CONE = 1.3
const GROOVE = 1.5

const currentOf = (ctx: RealContext): Shape | null => ctx.list.find((o) => o.role === 'progressButtonCurrent') ?? null

// The rail, and round the current step's cap a thin collar that stays where it is: the cap stands in it with a dark clearance between.
function rail(s: Shape, ctx: RealContext): THREE.Object3D {
  const under = pocketCut(s).under
  const top = -0.2 + RAIL_RISE
  const m = materials()
  const bar = mesh(shared(`rail:${dims(s)}`, () => sweep(outlineOf(s, 0.15, 16), profile([[0, -under, true], [0, -0.2, true], [RAIL_BEVEL, top, true], [s.h / 2, top + CROWN_RAIL]]))), m.railFlat, false)
  const cur = currentOf(ctx)
  if (!cur) return bar
  const root = new THREE.Group()
  root.add(bar)
  const r = cur.w / 2 + CLEARANCE + COLLAR
  const lip = top + COLLAR_PROUD
  const ring = mesh(shared(`collar:${q(cur.w)}`, () => sweep(circle(r, 72), profile([[0, -0.2, true], [0, lip - 0.4], ...arc(0, lip - 0.4, 0.4, 0.4, 3).slice(1), [COLLAR, lip, true], [COLLAR + 0.1, top, true]]), false)), m.capRim, false)
  const dark = mesh(shared(`collarGap:${q(cur.w)}`, () => sweep(circle(r - COLLAR + 0.2, 72), [{ inset: 0, z: top + 0.08, out: 0, up: 1 }])), m.gap, false)
  for (const o of [ring, dark]) {
    o.position.set(cur.x + cur.w / 2 - (s.x + s.w / 2), s.y + s.h / 2 - (cur.y + cur.h / 2), 0)
    root.add(o)
  }
  return root
}

const BEZEL = 3.4
const BEZEL_PROUD = 1.1

// The socket of a button: a polished bezel that stands a hair proud of the page, rolls over into the socket and goes down to a dark floor.
function socket(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const surface = -s.z0
  const top = surface + BEZEL_PROUD
  const points: ProfilePoint[] = [[-1.2, surface - 0.4, true], [-1.2, surface + 0.2], ...arc(-1.2, surface + 0.2, 1.4, BEZEL_PROUD - 0.2, 5).slice(1), [1, top], ...bead(1, top, 1.6, 1.3, 6).slice(1), [BEZEL - 0.6, 0.6], [BEZEL - 0.6, -0.4, true]]
  root.add(mesh(shared(`socketBezel:${dims(s)}`, () => sweep(outlineOf(s, 0, 16), profile(points), false)), m.chrome))
  root.add(mesh(shared(`socketFloor:${dims(s)}`, () => sweep(outlineOf(s, BEZEL - 0.8, 16), [{ inset: 0, z: 0.05, out: 0, up: 1 }])), m.gap, false))
  return root
}

export const WAITING_TOP = 2.4
const WAITING_EDGE = 2.2
const WAITING_CROWN = 0.3
const LIP_WIDE = 3.5
const LIP_DEEP = 2.7

export const isWaiting = (s: Shape | undefined): boolean => !!s && s.role === 'button' && s.tone === 'metal' && s.part === 'shell'

// The socket of a button that waits: no bezel stands proud. The page rolls over into the socket as a wide soft lip, lit on the side that faces the key and dark on the other, down to a narrow dark gap round the cap.
function waitingSocket(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const surface = -s.z0
  const points: ProfilePoint[] = [[-0.6, surface - 0.4, true], [-0.6, surface, true]]
  for (let i = 1; i <= 8; i++) {
    const t = i / 8
    points.push([-0.6 + (LIP_WIDE + 0.6) * t, surface - LIP_DEEP * (1 - Math.cos((t * Math.PI) / 2)) ** 0.8])
  }
  points.push([LIP_WIDE, 0.2, true], [LIP_WIDE, -0.4, true])
  const lip = mesh(shared(`waitingLip:${dims(s)}`, () => sweep(outlineOf(s, 0, 16), profile(points), false)), m.socketLip, false)
  root.add(lip)
  root.add(mesh(shared(`waitingFloor:${dims(s)}`, () => sweep(outlineOf(s, LIP_WIDE - 0.3, 16), [{ inset: 0, z: 0.05, out: 0, up: 1 }])), m.cardSeal, false))
  return root
}

// The cap of a button that waits: frosted, its top a little under the page, a small soft edge, no gloss.
function waitingCap(s: Shape): THREE.Object3D {
  const half = Math.min(s.w, s.h) / 2
  const top = WAITING_TOP - WAITING_CROWN
  const points: ProfilePoint[] = [[0, 0, true], [0, top - WAITING_EDGE * 0.8], ...arc(0, top - WAITING_EDGE * 0.8, WAITING_EDGE, WAITING_EDGE * 0.8, 8).slice(1), ...[0.75, 0.5, 0.25, 0.05].map((t): ProfilePoint => [half - (half - WAITING_EDGE) * t, top + WAITING_CROWN * (1 - t * t)])]
  return mesh(shared(`waitingCap:${dims(s)}`, () => sweep(outlineOf(s, 0, 18), profile(points))), materials().frosted, false)
}

const BUTTON_SHOULDER = 8
const BUTTON_CROWN = 0.9
const CHIP_SHADE = 9
const CHIP_SHADE_DEPTH = 0.36
const CHIP_CROWN = 0.5
let shadeMaterial: THREE.MeshBasicMaterial | undefined

function chipShade(s: Shape): THREE.Mesh {
  shadeMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false })
  const reach = CHIP_SHADE
  const around = { kind: s.kind, w: s.w + reach * 2, h: s.h + reach * 2, r: (s.r ?? 0) + reach }
  const g = shared(`chipShade:${dims(s)}`, () => {
    const rings: Ring[] = []
    for (let i = 0; i <= 9; i++) rings.push({ inset: (reach * i) / 9 + (i === 9 ? 1.5 : 0), z: 0, out: 0, up: 1 })
    const geo = sweep(outlineOf(around, 0, 18), rings)
    const at = geo.getAttribute('position')
    const colour = new Float32Array(at.count * 3)
    const r = Math.min(s.w, s.h) / 2
    for (let i = 0; i < at.count; i++) {
      const qx = Math.max(Math.abs(at.getX(i)) - (s.w / 2 - r), 0)
      const qy = Math.max(Math.abs(at.getY(i)) - (s.h / 2 - r), 0)
      const far = Math.min(1, Math.max(0, (Math.hypot(qx, qy) - r + 1.5) / (reach + 1.5)))
      const v = 1 - CHIP_SHADE_DEPTH * (1 - far) * (1 - far)
      colour[i * 3] = v
      colour[i * 3 + 1] = v
      colour[i * 3 + 2] = v
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colour, 3))
    return geo
  })
  const shade = new THREE.Mesh(g, shadeMaterial)
  shade.position.set(reach * 0.42, -reach * 0.4, 0.06)
  shade.renderOrder = 1
  return shade
}

const CHIP_REVEAL = 2.6
const CHIP_LIP = 1.2
const CHIP_FLOOR = 0.64
const CHIP_WALL = 0.3
const CHIP_GLINT = 0.85
const CHIP_SHADOW = 0.12

// The pocket a chip sits in, drawn on the glass as light and shade: a lip, a wall that is lit on the side that faces the key and dark on the other, and a floor in shadow.
function chipPocket(s: Shape): THREE.Mesh {
  shadeMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false })
  const reach = CHIP_REVEAL + CHIP_LIP
  const around = { kind: s.kind, w: s.w + reach * 2, h: s.h + reach * 2, r: (s.r ?? 0) + reach }
  const g = shared(`chipPocket:${dims(s)}`, () => {
    const outline = outlineOf(around, 0, 18)
    const steps: [number, number, number][] = [[0, 1, 0], [CHIP_LIP * 0.5, 1, 0.1], [CHIP_LIP, 0.84, CHIP_WALL], [CHIP_LIP + 0.9, CHIP_FLOOR + 0.08, CHIP_WALL * 0.8], [reach, CHIP_FLOOR, CHIP_WALL * 0.4], [reach + 1.2, CHIP_FLOOR, 0]]
    const geo = sweep(outline, steps.map(([inset]) => ({ inset, z: 0, out: 1, up: 0 })), false)
    const nor = geo.getAttribute('normal')
    const colour = new Float32Array(nor.count * 3)
    for (let i = 0; i < nor.count; i++) {
      const [, level, lit] = steps[Math.floor(i / outline.count)]!
      const d = (nor.getX(i) * 0.724 - nor.getY(i) * 0.69) * lit
      const v = level + (d > 0 ? d : d * 1.5)
      colour[i * 3] = v
      colour[i * 3 + 1] = v
      colour[i * 3 + 2] = v
      nor.setXYZ(i, 0, 0, 1)
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colour, 3))
    return geo
  })
  const pocket = new THREE.Mesh(g, shadeMaterial)
  pocket.position.set(0, 0, 0.05)
  pocket.renderOrder = 1
  return pocket
}

function capsule(s: Shape, round: number): THREE.Object3D {
  const h = s.z1 - s.z0
  if (isWaiting(s)) return waitingCap(s)
  if (s.role !== 'chip') {
    // A button is moulded plastic: a straight wall, a wide soft shoulder and a top that is crowned by a hair, so the studio's light lies along its upper edge.
    const half = Math.min(s.w, s.h) / 2
    const wide = Math.min(BUTTON_SHOULDER, half - 1)
    const rise = Math.min(BUTTON_SHOULDER * 0.8, h * 0.45)
    const top = h - BUTTON_CROWN
    const points: ProfilePoint[] = [[0, 0, true], [0, top - rise], ...arc(0, top - rise, wide, rise, 10).slice(1), ...[0.75, 0.5, 0.25, 0.05].map((t): ProfilePoint => [half - (half - wide) * t, top + BUTTON_CROWN * (1 - t * t)])]
    return mesh(shared(`cap:${dims(s)}:${round}`, () => sweep(outlineOf(s, 0, 18), profile(points))), s.tone === 'metal' ? materials().waiting : toneMaterial(s.tone))
  }
  // A chip's edge is a wide soft round that starts 40 degrees up from its wall, so no part of it looks at the floor.
  const from = (40 * Math.PI) / 180
  const big = Math.min(4.5, Math.min(s.w, s.h) / 2 - 1)
  const top = h - CHIP_CROWN
  const soft: ProfilePoint[] = [[0, 0, true], [0, top - big + big * Math.sin(from), true]]
  for (let i = 1; i <= 8; i++) {
    const t = from + ((Math.PI / 2 - from) * i) / 8
    soft.push([big * (Math.cos(from) - Math.cos(t)), top - big + big * Math.sin(t)])
  }
  const edge = big * Math.cos(from)
  const half = Math.min(s.w, s.h) / 2
  for (const t of [0.75, 0.5, 0.25, 0.05]) soft.push([half - (half - edge) * t, top + CHIP_CROWN * (1 - t * t)])
  const root = new THREE.Group()
  root.add(chipPocket(s))
  root.add(chipShade(s))
  root.add(mesh(shared(`chipCap:${dims(s)}`, () => {
    const geo = sweep(outlineOf(s, 0, 18), profile(soft))
    const nor = geo.getAttribute('normal')
    const colour = new Float32Array(nor.count * 3)
    for (let i = 0; i < nor.count; i++) {
      const d = nor.getY(i) * 0.69 - nor.getX(i) * 0.724
      const v = 1 + (d > 0 ? CHIP_GLINT * d * d : CHIP_SHADOW * d)
      colour[i * 3] = v
      colour[i * 3 + 1] = v
      colour[i * 3 + 2] = v
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colour, 3))
    return geo
  }), materials().chip))
  return root
}

// A step's button. The current one is moulded plastic: a wide foot and a domed cap. The others are turned on a lathe:
// a wide chamfered flange, a groove and a flat face for the numeral.
function progressButton(s: Shape, current: boolean): THREE.Object3D {
  const m = materials()
  const h = s.z1 - s.z0
  const foot = Math.max(0, -s.z0)
  const up = h - foot
  const d = s.w
  if (current) {
    const ring = foot + up * FOOT_RISE
    const brow = h - CROWN_BUTTON - EDGE * 0.7
    const points: ProfilePoint[] = [
      [0, foot - 0.5, true], [0, ring - FOOT_ROUND], ...arc(0, ring - FOOT_ROUND, FOOT_ROUND, FOOT_ROUND, 6).slice(1), [FOOT_RING - 0.8, ring + 0.3], [FOOT_RING, ring + 1.1],
      [FOOT_RING + WALL_LEAN, brow], ...arc(FOOT_RING + WALL_LEAN, brow, EDGE, EDGE * 0.7, 8).slice(1),
      ...[0.8, 0.6, 0.4, 0.2, 0.06].map((t): ProfilePoint => [d / 2 - (d / 2 - FOOT_RING - WALL_LEAN - EDGE) * t, h - CROWN_BUTTON * t * t])
    ]
    return mesh(shared(`progress:${dims(s)}:1`, () => sweep(circle(d / 2, 72), profile(points))), m.orange)
  }
  const root = new THREE.Group()
  const top = foot + up * 0.86
  const flange: ProfilePoint[] = [
    [0, foot - 0.5, true], [0, top - CONE - BEAD], ...arc(0, top - CONE - BEAD, BEAD, BEAD, 5).slice(1), [FLANGE, top, true],
    [FLANGE + 1, top - GROOVE, true], [FLANGE + 2.2, h - 0.2, true], [FLANGE + 2.5, h, true]
  ]
  root.add(mesh(shared(`progressFlange:${dims(s)}`, () => sweep(circle(d / 2, 72), profile(flange), false)), m.capRim))
  root.add(mesh(shared(`progressFace:${dims(s)}`, () => discUv(sweep(circle(d / 2 - FLANGE - 2.5, 72), [{ inset: 0, z: h, out: 0, up: 1 }]), d - (FLANGE + 2.5) * 2)), m.capFace))
  return root
}

function rule(s: Shape): THREE.Object3D {
  const h = s.z1 - s.z0
  const r = Math.min(s.h / 2, h)
  const g = shared(`rule:${dims(s)}`, () => sweep(roundEnds(s), profile([[0, 0, true], ...arc(0, h - r, r, r, 5)])))
  return mesh(g, materials().aluminium)
}

const roundEnds = (s: Shape): Outline => outlineOf({ kind: 'capsule', w: s.w, h: s.h }, 0, 6)

const FRAME = 2.6
const BEVEL = 10.5

// Where each point of a slab lies on its card, for the glass's material: the place, the card's half size, its corner and whether a panel is sunk in it.
function placed(g: THREE.BufferGeometry, s: Shape, panel: boolean): THREE.BufferGeometry {
  const pos = g.getAttribute('position')
  const at = new Float32Array(pos.count * 4)
  const edge = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    at.set([pos.getX(i), pos.getY(i), s.w / 2, s.h / 2], i * 4)
    edge.set([Math.max(0.6, s.r ?? 0), panel ? 1 : 0], i * 2)
  }
  g.setAttribute('slab', new THREE.BufferAttribute(at, 4))
  g.setAttribute('slabEdge', new THREE.BufferAttribute(edge, 2))
  return g
}

// A glass card standing on the page: a thin dark seal round its foot and a slab whose edge is ground to a wide bevel.
// An upload zone has a panel sunk a hair into its face, inside the engraved line. The light goes through the slab: only the band throws a shadow.
function card(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const h = s.z1 - s.z0
  const zone = s.id.endsWith('-zone')
  const k = Math.min(1, Math.min(s.w, s.h) / 90)
  const rise = Math.min(h * 0.3, 3.6)
  const top = h
  const foot = top - rise
  const band = Math.min(3.4, Math.max(1, foot - 2.5))
  root.add(mesh(shared(`cardFrame:${dims(s)}`, () => sweep(outlineOf(s, 0, 14), profile([[0, 0, true], [0, band - 0.5, true], [0.5, band, true], [FRAME - 0.4, band, true], [FRAME, band - 0.4, true], [FRAME, 0.2, true]]), false)), m.cardSeal))
  const points: ProfilePoint[] = [[0, 0.05, true], [0, foot - 1.8, true], ...arc(0, foot - 1.8, 1.8, 1.8, 5).slice(1), ...[0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1].map((t): ProfilePoint => [1.8 + BEVEL * k * t, foot + rise * Math.sin((t * Math.PI) / 2)])]
  root.add(mesh(shared(`cardGlass:${dims(s)}:${zone ? 1 : 0}`, () => placed(sweep(outlineOf(s, FRAME, 14), profile(points)), s, zone)), m.glassCard, false))
  return root
}

let glowMaterial: THREE.MeshBasicMaterial | null = null
let coreMaterial: THREE.MeshBasicMaterial | null = null

// The ring of light round a field in focus: a thin bright line on the rim and its spill on the page and on the glass.
function focusRing(f: Shape): THREE.Object3D {
  const root = new THREE.Group()
  coreMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.34, 0.045), toneMapped: false })
  glowMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const outline = outlineOf(f, 0, 12)
  const core = mesh(shared(`focusCore:${dims(f)}`, () => sweep(outline, profile([[-0.7, 0.1, true], [-0.4, 0.5], [0.5, 0.6], [1.4, 0.5], [1.7, 0.1, true]]), false)), coreMaterial, false)
  core.receiveShadow = false
  root.add(core)
  const spill = shared(`focusGlow:${dims(f)}`, () => {
    const steps: [number, number, number][] = [[-17, 0.25, 0], [-10, 0.25, 0.07], [-5.5, 0.25, 0.2], [-2.6, 0.25, 0.5], [-0.7, 0.3, 1], [1.7, 0.3, 1], [RIM + 0.2, f.z0 + 0.4, 0.5], [6, f.z0 + 0.4, 0.2], [10, f.z0 + 0.4, 0.07], [15, f.z0 + 0.4, 0]]
    const g = sweep(outline, steps.map(([inset, z]) => ({ inset, z, out: 0, up: 1 })), false)
    const n = outline.count
    const colour = new Float32Array(steps.length * n * 3)
    steps.forEach(([, , a], k) => {
      for (let i = 0; i < n; i++) colour.set([0.74 * a, 0.15 * a, 0.015 * a], (k * n + i) * 3)
    })
    g.setAttribute('color', new THREE.BufferAttribute(colour, 3))
    return g
  })
  const glow = mesh(spill, glowMaterial, false)
  glow.receiveShadow = false
  root.add(glow)
  return root
}

const holder = (s: Shape, ctx: RealContext): Shape | null => {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  for (const o of ctx.list) if (o.role === 'field' && o.pocket && cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h) return o
  return null
}

function plate(s: Shape): THREE.Object3D {
  const h = Math.max(0.05, s.z1 - s.z0)
  const r = Math.min(1.2, h / 2)
  const g = shared(`plate:${dims(s)}`, () => (s.kind === 'ball' ? new THREE.SphereGeometry(s.w / 2, 40, 24).translate(0, 0, s.w / 2) : sweep(outlineOf(s, 0, 8), profile([[0, 0, true], [0, h - r], ...arc(0, h - r, r, r, 3).slice(1)]))))
  return mesh(g, toneMaterial(s.tone))
}

export const controls: PartMaker = {
  key(s: Shape, ctx: RealContext): string | null {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.id === 'field-focus') {
      const f = holder(s, ctx)
      return f ? `focus:${dims(f)}` : `plate:${dims(s)}:${s.tone}`
    }
    if (s.id === 'field-caret') return `caret:${dims(s)}`
    const waits = s.role === 'buttonSocket' ? isWaiting(ctx.byId.get(`${s.id}-cap`)) : isWaiting(s)
    const base = `${s.role ?? 'plate'}:${dims(s)}:${s.tone}:${s.pocket ? 1 : 0}:${s.id.endsWith('-zone') ? 1 : 0}${waits ? ':waits' : ''}`
    if (s.role !== 'progressRail') return base
    const cur = currentOf(ctx)
    return cur ? `${base}:${q(cur.x - s.x)}:${q(cur.y - s.y)}:${q(cur.w)}` : base
  },
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    if (s.id === 'field-focus') {
      const f = holder(s, ctx)
      return f ? focusRing(f) : plate(s)
    }
    if (s.id === 'field-caret') return mesh(shared(`caret:${dims(s)}`, () => new THREE.BoxGeometry(s.w, s.h, 0.3).translate(0, 0, 0.15)), materials().ink, false)
    switch (s.role) {
      case 'rule': return rule(s)
      case 'progressRail': return s.pocket ? rail(s, ctx) : plate(s)
      case 'progressButton': return progressButton(s, false)
      case 'progressButtonCurrent': return progressButton(s, true)
      case 'field': return s.pocket ? field(s) : plate(s)
      case 'buttonSocket': return !s.pocket ? plate(s) : isWaiting(ctx.byId.get(`${s.id}-cap`)) ? waitingSocket(s) : socket(s)
      case 'button': case 'heroButton': return capsule(s, 6.5)
      case 'chip': return capsule(s, 3.5)
      case 'card': return card(s)
      default: return plate(s)
    }
  },
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    if (s.id !== 'field-focus' && s.id !== 'field-caret') return
    const f = holder(s, ctx)
    if (!f) return
    if (s.id === 'field-caret') o.position.z = f.z0 + 0.04
    else {
      o.position.set(f.x + f.w / 2 - 960, 540 - (f.y + f.h / 2), 0)
      const hit = Math.min(1, Math.max(0, s.v?.[0] ?? 0))
      glowMaterial?.color.setScalar(0.8 + 1.6 * hit)
      coreMaterial?.color.setRGB(1.5 * (1 + 0.7 * hit), 0.34 * (1 + 0.7 * hit), 0.045 * (1 + 0.7 * hit))
    }
  }
}
