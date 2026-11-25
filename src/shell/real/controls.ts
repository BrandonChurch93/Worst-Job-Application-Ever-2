import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape, Tone } from '../../stage/types'
import { materials, type Materials } from '../materials'
import { arc, circle, outlineOf, pocketCut, profile, sweep, type Outline, type ProfilePoint } from '../solids'

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

const RIM = 2.4
const GLASS_FIELD = 5

// The aluminium sleeve of a pocket: a thin flat rim at the surface and a wall that leans in, down to what lies in the pocket.
function sleeve(s: Shape, surface: number, lean: number): THREE.BufferGeometry {
  const top = surface - 0.2
  const points: ProfilePoint[] = [
    [0.1, top - 0.7, true], [0.5, top, true], [RIM - 0.9, top, true], [RIM - 0.4, top - 0.45, true], [RIM - 0.4 + lean * (top - 0.45), 0, true], [RIM - 0.4 + lean * (top - 0.45), -0.4, true]
  ]
  return sweep(outlineOf(s, 0, 12), profile(points), false)
}

function field(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const surface = -s.z0
  root.add(mesh(shared(`sleeve:${dims(s)}`, () => sleeve(s, surface, 0.55)), m.aluminium))
  const glass = mesh(shared(`fieldGlass:${dims(s)}`, () => sweep(outlineOf(s, RIM - 0.6, 12), profile([[0, -GLASS_FIELD, true], [0, 0, true]]))), m.glass, false)
  root.add(glass)
  return root
}

function rail(s: Shape): THREE.Object3D {
  const under = pocketCut(s).under
  return mesh(shared(`rail:${dims(s)}`, () => sweep(outlineOf(s, 0.15, 16), profile([[0, -under, true], [0, -0.3, true], [0.3, 0, true]]))), materials().aluminium, false)
}

function socket(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const surface = -s.z0
  root.add(mesh(shared(`socketSleeve:${dims(s)}`, () => sleeve(s, surface, 0.1)), m.aluminium))
  root.add(mesh(shared(`socketFloor:${dims(s)}`, () => sweep(outlineOf(s, RIM - 0.6, 16), [{ inset: 0, z: 0.05, out: 0, up: 1 }])), m.gap, false))
  return root
}

function capsule(s: Shape, round: number): THREE.Object3D {
  const h = s.z1 - s.z0
  const r = Math.min(round, h * 0.6, Math.min(s.w, s.h) / 2 - 1)
  const g = shared(`cap:${dims(s)}:${round}`, () => sweep(outlineOf(s, 0, 18), profile([[0, 0, true], [0, h - r], ...arc(0, h - r, r, r, 8).slice(1)])))
  return mesh(g, toneMaterial(s.tone))
}

// A step's button, turned on a lathe: a flange with a chamfer, a short neck and a flat face for its numeral.
function progressButton(s: Shape, current: boolean): THREE.Object3D {
  const m = materials()
  const h = s.z1 - s.z0
  const foot = Math.max(0, -s.z0)
  const up = h - foot
  const d = s.w
  const points: ProfilePoint[] = current
    ? [[0, foot - 0.5, true], [0, foot + up * 0.16], ...arc(0, foot + up * 0.16, 3.4, up * 0.2, 5).slice(1), [5.2, foot + up * 0.36], [5.6, foot + up * 0.4], [5.6, foot + up * 0.66], ...arc(5.6, foot + up * 0.66, 9, up * 0.34, 8).slice(1)]
    : [[0, foot - 0.5, true], [0, foot + up * 0.3, true], [3.2, foot + up * 0.62, true], [5.2, foot + up * 0.62, true], [5.2, foot + up * 0.84], ...arc(5.2, foot + up * 0.84, 1.6, up * 0.16, 4).slice(1)]
  const g = shared(`progress:${dims(s)}:${current}`, () => discUv(sweep(circle(d / 2, 72), profile(points)), d))
  return mesh(g, current ? m.orange : m.aluminiumTurned)
}

function rule(s: Shape): THREE.Object3D {
  const h = s.z1 - s.z0
  const r = Math.min(s.h / 2, h)
  const g = shared(`rule:${dims(s)}`, () => sweep(roundEnds(s), profile([[0, 0, true], ...arc(0, h - r, r, r, 5)])))
  return mesh(g, materials().aluminium)
}

const roundEnds = (s: Shape): Outline => outlineOf({ kind: 'capsule', w: s.w, h: s.h }, 0, 6)

const FRAME = 2.2

// A glass card standing on the page: an aluminium band round its foot and a slab with a wide rounded shoulder.
function card(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const h = s.z1 - s.z0
  const rise = Math.min(h * 0.5, 6)
  const across = Math.min(11, Math.min(s.w, s.h) / 4)
  const band = h - rise
  root.add(mesh(shared(`cardFrame:${dims(s)}`, () => sweep(outlineOf(s, 0, 14), profile([[0, 0, true], [0, band - 0.5, true], [0.5, band, true], [FRAME - 0.4, band, true], [FRAME, band - 0.5, true], [FRAME, 0.2, true]]), false)), m.aluminium))
  root.add(mesh(shared(`cardGlass:${dims(s)}`, () => sweep(outlineOf(s, FRAME - 0.3, 14), profile([[0, 0.05, true], [0, band], ...arc(0, band, across, rise, 10).slice(1)]))), m.glassThick))
  if (s.id.endsWith('-zone')) root.add(dashes(s, h))
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
  const core = mesh(shared(`focusCore:${dims(f)}`, () => sweep(outline, profile([[-0.9, 0, true], [-0.5, 0.7], [0.9, 0.9], [2.0, 0.7], [2.4, 0, true]]), false)), coreMaterial, false)
  core.receiveShadow = false
  root.add(core)
  const spill = shared(`focusGlow:${dims(f)}`, () => {
    const steps: [number, number, number][] = [[-22, 0.25, 0], [-12, 0.25, 0.12], [-5, 0.25, 0.42], [-0.9, 0.3, 1], [2.4, 0.3, 1], [2.6, f.z0 + 0.4, 0.5], [9, f.z0 + 0.4, 0.22], [20, f.z0 + 0.4, 0]]
    const g = sweep(outline, steps.map(([inset, z]) => ({ inset, z, out: 0, up: 1 })), false)
    const n = outline.count
    const colour = new Float32Array(steps.length * n * 3)
    steps.forEach(([, , a], k) => {
      for (let i = 0; i < n; i++) colour.set([0.55 * a, 0.14 * a, 0.02 * a], (k * n + i) * 3)
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
    else o.position.set(f.x + f.w / 2 - 960, 540 - (f.y + f.h / 2), 0)
  }
}
