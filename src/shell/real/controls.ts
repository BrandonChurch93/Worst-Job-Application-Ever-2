import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape, Tone } from '../../stage/types'
import { look } from '../../post/look'
import { materials, type Materials } from '../materials'
import { arc, circle, outlineOf, pocketCut, profile, roundedRect, sweep, type Outline, type ProfilePoint } from '../solids'

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

const RIM = 2.6
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

const SOAK = 7
const SOAK_HOLD = 2.5
const SOAK_DEPTH = 0.24
const BOUNCE = 0.2
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

const CROWN_RAIL = 1.2
const CROWN_BUTTON = 1.3
const FOOT_RING = 6
const SHOULDER = 13
const FLANGE = 5.6

function rail(s: Shape): THREE.Object3D {
  const under = pocketCut(s).under
  return mesh(shared(`rail:${dims(s)}`, () => sweep(outlineOf(s, 0.15, 16), profile([[0, -under, true], [0, -0.2, true], ...[0.8, 0.6, 0.4, 0.2, 0.05].map((t): ProfilePoint => [(s.h / 2) * (1 - t), -0.2 + CROWN_RAIL * (1 - t * t)])]))), materials().aluminium, false)
}

function socket(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const surface = -s.z0
  root.add(mesh(shared(`socketSleeve:${dims(s)}`, () => sleeve(s, surface, 0.1)), m.aluminium))
  root.add(mesh(shared(`socketFloor:${dims(s)}`, () => sweep(outlineOf(s, RIM - 0.6, 16), [{ inset: 0, z: 0.05, out: 0, up: 1 }])), m.gap, false))
  return root
}

const SEAT = 2.4
const SEAT_RISE = 1.2

function capsule(s: Shape, round: number): THREE.Object3D {
  const h = s.z1 - s.z0
  const r = Math.min(round, h * 0.6, Math.min(s.w, s.h) / 2 - 1)
  if (s.role !== 'chip') return mesh(shared(`cap:${dims(s)}:${round}`, () => sweep(outlineOf(s, 0, 18), profile([[0, 0, true], [0, h - r], ...arc(0, h - r, r, r, 8).slice(1)]))), toneMaterial(s.tone))
  // A chip's edge is a wide soft round that starts 40 degrees up from its wall, so no part of it looks at the floor.
  const from = (40 * Math.PI) / 180
  const big = Math.min(6, Math.min(s.w, s.h) / 2 - 1)
  const soft: ProfilePoint[] = [[0, 0, true], [0, h - big + big * Math.sin(from), true]]
  for (let i = 1; i <= 8; i++) {
    const t = from + ((Math.PI / 2 - from) * i) / 8
    soft.push([big * (Math.cos(from) - Math.cos(t)), h - big + big * Math.sin(t)])
  }
  const cap = mesh(shared(`chipCap:${dims(s)}`, () => sweep(outlineOf(s, 0, 18), profile(soft))), toneMaterial(s.tone))
  // A chip stands in a seat: a low glass collar, a narrow dark clearance inside it, and the cap rising out of that.
  const root = new THREE.Group()
  const out = SEAM + SEAT
  const around = { kind: s.kind, w: s.w + out * 2, h: s.h + out * 2, r: (s.r ?? 0) + out }
  const collar: ProfilePoint[] = [[0, 0, true], [0.5, SEAT_RISE - 0.5, true], [1, SEAT_RISE, true], [SEAT - 0.5, SEAT_RISE, true], [SEAT, SEAT_RISE - 0.5, true], [SEAT, 0.1, true]]
  root.add(mesh(shared(`seatCollar:${dims(s)}`, () => sweep(outlineOf(around, 0, 18), profile(collar), false)), materials().glassThick))
  root.add(mesh(shared(`seat:${dims(s)}`, () => sweep(outlineOf(around, SEAT - 0.1, 18), [{ inset: 0, z: 0.12, out: 0, up: 1 }])), materials().cardSeal, false))
  root.add(cap)
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
    const points: ProfilePoint[] = [
      [0, foot - 0.5, true], [0, foot + up * 0.1], ...arc(0, foot + up * 0.1, FOOT_RING - 1, up * 0.3, 7).slice(1), [FOOT_RING, foot + up * 0.42], [FOOT_RING + 0.5, foot + up * 0.52],
      ...arc(FOOT_RING + 0.5, foot + up * 0.52, SHOULDER, up * 0.48 - CROWN_BUTTON, 11).slice(1),
      ...[0.82, 0.64, 0.46, 0.28, 0.12].map((t): ProfilePoint => [d / 2 - (d / 2 - FOOT_RING - 0.5 - SHOULDER) * t, h - CROWN_BUTTON * t * t])
    ]
    return mesh(shared(`progress:${dims(s)}:1`, () => sweep(circle(d / 2, 72), profile(points))), m.orange)
  }
  const root = new THREE.Group()
  const flange: ProfilePoint[] = [[0, foot - 0.5, true], [0, foot + up * 0.34, true], [0.5, foot + up * 0.4, true], [FLANGE, foot + up * 0.8, true], [FLANGE + 0.7, foot + up * 0.8, true], [FLANGE + 0.9, foot + up * 0.6, true], [FLANGE + 1.9, foot + up * 0.6, true], [FLANGE + 2.1, h - 0.4, true], [FLANGE + 2.5, h, true]]
  root.add(mesh(shared(`progressFlange:${dims(s)}`, () => sweep(circle(d / 2, 72), profile(flange), false)), m.aluminiumEdge))
  root.add(mesh(shared(`progressFace:${dims(s)}`, () => discUv(sweep(circle(d / 2 - FLANGE - 2.5, 72), [{ inset: 0, z: h, out: 0, up: 1 }]), d - (FLANGE + 2.5) * 2)), m.aluminiumTurned))
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
const BEVEL = 12.5

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
  const points: ProfilePoint[] = [[0, 0.05, true], [0, foot - 1.8, true], ...arc(0, foot - 1.8, 1.8, 1.8, 5).slice(1), [1.8 + BEVEL * k * 0.5, foot + rise * 0.52], [1.8 + BEVEL * k - 1.2, top - 0.12], [1.8 + BEVEL * k, top - 0.02], [1.8 + BEVEL * k + 1.2, top]]
  root.add(mesh(shared(`cardGlass:${dims(s)}:${zone ? 1 : 0}`, () => placed(sweep(outlineOf(s, FRAME, 14), profile(points)), s, zone)), m.glassCard, false))
  if (zone) root.add(dashes(s, top))
  return root
}

let dashMaterial: THREE.MeshPhysicalMaterial | null = null

// The dashed line engraved in an upload zone: short grooves along a rounded path, drawn as one instanced mesh.
function dashes(s: Shape, h: number): THREE.Object3D {
  const inset = 26
  const w = s.w - inset * 2
  const hh = s.h - inset * 2
  const r = Math.max(6, (s.r ?? 0) - inset * 0.4)
  const straightX = w - 2 * r
  const straightY = hh - 2 * r
  const turn = (Math.PI / 2) * r
  const total = 2 * (straightX + straightY) + 4 * turn
  const count = Math.max(8, Math.round(total / 30))
  const pitch = total / count
  const at = (d: number): [number, number, number] => {
    let t = ((d % total) + total) % total
    const legs: [number, (u: number) => [number, number, number]][] = [
      [straightX, (u) => [-straightX / 2 + u, hh / 2, 0]],
      [turn, (u) => [straightX / 2 + r * Math.sin(u / r), hh / 2 - r + r * Math.cos(u / r), -u / r]],
      [straightY, (u) => [w / 2, straightY / 2 - u, -Math.PI / 2]],
      [turn, (u) => [w / 2 - r + r * Math.cos(u / r), -straightY / 2 - r * Math.sin(u / r), -Math.PI / 2 - u / r]],
      [straightX, (u) => [straightX / 2 - u, -hh / 2, Math.PI]],
      [turn, (u) => [-straightX / 2 - r * Math.sin(u / r), -hh / 2 + r - r * Math.cos(u / r), Math.PI - u / r]],
      [straightY, (u) => [-w / 2, -straightY / 2 + u, Math.PI / 2]],
      [turn, (u) => [-w / 2 + r - r * Math.cos(u / r), straightY / 2 + r * Math.sin(u / r), Math.PI / 2 - u / r]]
    ]
    for (const [length, place] of legs) {
      if (t <= length) return place(t)
      t -= length
    }
    return [0, 0, 0]
  }
  dashMaterial ??= Object.assign(materials().ink.clone(), { transparent: true, opacity: 0.42, depthWrite: false })
  const unit = shared('dash', () => new THREE.PlaneGeometry(1, 1))
  const group = new THREE.InstancedMesh(unit, dashMaterial, count)
  const one = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const [x, y, a] = at((i + 0.5) * pitch)
    one.position.set(x, y, h + 0.06)
    one.rotation.set(0, 0, a)
    one.scale.set(pitch * 0.56, 1.7, 1)
    one.updateMatrix()
    group.setMatrixAt(i, one.matrix)
  }
  group.instanceMatrix.needsUpdate = true
  group.receiveShadow = true
  return group
}

let glowMaterial: THREE.MeshBasicMaterial | null = null
let coreMaterial: THREE.MeshBasicMaterial | null = null

// The ring of light round a field in focus: a thin bright line on the rim and its spill on the page and on the glass.
function focusRing(f: Shape): THREE.Object3D {
  const root = new THREE.Group()
  coreMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.42, 0.07), toneMapped: false })
  glowMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const outline = outlineOf(f, 0, 12)
  const core = mesh(shared(`focusCore:${dims(f)}`, () => sweep(outline, profile([[-0.7, 0.1, true], [-0.4, 0.5], [0.5, 0.6], [1.4, 0.5], [1.7, 0.1, true]]), false)), coreMaterial, false)
  core.receiveShadow = false
  root.add(core)
  const spill = shared(`focusGlow:${dims(f)}`, () => {
    const steps: [number, number, number][] = [[-34, 0.25, 0], [-20, 0.25, 0.07], [-11, 0.25, 0.2], [-5, 0.25, 0.48], [-0.7, 0.3, 1], [1.7, 0.3, 1], [RIM + 0.2, f.z0 + 0.4, 0.55], [10, f.z0 + 0.4, 0.26], [18, f.z0 + 0.4, 0.1], [28, f.z0 + 0.4, 0]]
    const g = sweep(outline, steps.map(([inset, z]) => ({ inset, z, out: 0, up: 1 })), false)
    const n = outline.count
    const colour = new Float32Array(steps.length * n * 3)
    steps.forEach(([, , a], k) => {
      for (let i = 0; i < n; i++) colour.set([0.72 * a, 0.2 * a, 0.03 * a], (k * n + i) * 3)
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
    return `${s.role ?? 'plate'}:${dims(s)}:${s.tone}:${s.pocket ? 1 : 0}:${s.id.endsWith('-zone') ? 1 : 0}`
  },
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    if (s.id === 'field-focus') {
      const f = holder(s, ctx)
      return f ? focusRing(f) : plate(s)
    }
    if (s.id === 'field-caret') return mesh(shared(`caret:${dims(s)}`, () => new THREE.BoxGeometry(s.w, s.h, 0.3).translate(0, 0, 0.15)), materials().ink, false)
    switch (s.role) {
      case 'rule': return rule(s)
      case 'progressRail': return s.pocket ? rail(s) : plate(s)
      case 'progressButton': return progressButton(s, false)
      case 'progressButtonCurrent': return progressButton(s, true)
      case 'field': return s.pocket ? field(s) : plate(s)
      case 'buttonSocket': return s.pocket ? socket(s) : plate(s)
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
      coreMaterial?.color.setRGB(1.5 * (1 + 0.7 * hit), 0.42 * (1 + 0.7 * hit), 0.07 * (1 + 0.7 * hit))
    }
  }
}
