import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { look } from '../../../post/look'
import { materials } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import { outlineOf, profile, roundedRect, sweep, type ProfilePoint } from '../../../shell/solids'
import { TRAY, TRAY_H } from '../layout'

const q = (v: number): number => Math.round(v * 4) / 4
const isTray = (s: Shape): boolean => s.role === 'machineTray' && s.pocket === true

// How far in from the tray's outline its floor begins: the dark joint, the rim and the wall that leans in under it.
export const trayFoot = (depth: number): number => TRAY.joint + TRAY.rim + TRAY.lean * (depth - TRAY.sink)

// The dark joint where the page was parted: a thin groove between the page's lip and the tray's liner.
export function trayJoint(s: Shape): THREE.BufferGeometry {
  const surface = -s.z0
  const z = surface - TRAY.sink - TRAY.jointDeep
  return sweep(outlineOf(s, 0, 12), [{ inset: -0.4, z, out: 0, up: 1 }, { inset: TRAY.joint + 0.3, z, out: 0, up: 1 }], false)
}

const BEAD = Math.PI / 5
const COVE = 7

// How far under the liner's top its rolled rim lies, a given way in from the joint.
const beadDrop = (inset: number): number => {
  const half = TRAY.rim / 2
  const radius = half / Math.sin(BEAD)
  const off = Math.min(half, Math.abs(inset - half))
  return radius - Math.sqrt(radius * radius - off * off)
}

const wallAt = (inset: number, top: number, foot: number): number => {
  const from = TRAY.joint + TRAY.rim
  const z = top - beadDrop(TRAY.rim)
  return z * Math.pow(1 - Math.min(1, Math.max(0, (inset - from) / (foot - from))), TRAY.cove)
}

// The rim: rolled, a hair under the page, polished, so it holds a line of the light all the way round.
export function trayRim(s: Shape): THREE.BufferGeometry {
  const top = -s.z0 - TRAY.sink
  const j = TRAY.joint
  const points: ProfilePoint[] = [[j, top - TRAY.jointDeep - 0.3, true]]
  for (let i = 0; i <= 10; i++) {
    const inset = (TRAY.rim * i) / 10
    points.push([j + inset, top - beadDrop(inset)])
  }
  return sweep(outlineOf(s, 0, 12), profile(points), false)
}

// The wall: satin, leaning in from under the rim down to the floor.
export function trayLiner(s: Shape): THREE.BufferGeometry {
  const surface = -s.z0
  const top = surface - TRAY.sink
  const from = TRAY.joint + TRAY.rim
  const foot = trayFoot(surface)
  const points: ProfilePoint[] = [[from, wallAt(from, top, foot), true]]
  for (let i = 1; i < COVE; i++) {
    const inset = from + ((foot - from) * i) / COVE
    points.push([inset, wallAt(inset, top, foot)])
  }
  points.push([foot, 0], [foot + 0.6, -0.4, true])
  const g = sweep(outlineOf(s, 0, 12), profile(points), false)
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 3).fill(1), 3))
  return g
}

// The wall on the light's side sees neither the key nor much of the room: its shade is painted over the liner, strongest where the wall faces away from the key.
export function trayWallShade(s: Shape): THREE.BufferGeometry {
  const surface = -s.z0
  const top = surface - TRAY.sink
  const outline = outlineOf(s, 0, 12)
  const from = TRAY.joint + TRAY.rim
  const foot = trayFoot(surface)
  const over = 0.06
  const j = TRAY.joint
  const steps: [number, number, number, number][] = [
    [j + TRAY.rim * 0.25, top - beadDrop(TRAY.rim * 0.25) + over, 0, 0],
    [j + TRAY.rim * 0.6, top - beadDrop(TRAY.rim * 0.6) + over, TRAY.rimShade, TRAY.rimShade],
    [from, wallAt(from, top, foot) + over, TRAY.rimShade, TRAY.rimShade],
    [from + 0.6, wallAt(from + 0.6, top, foot) + over, TRAY.wallShade, TRAY.wallShadeTop]
  ]
  for (let i = 1; i <= COVE; i++) {
    const u = i / COVE
    const inset = from + (foot - from) * u
    const fade = 1 - u * u * u
    steps.push([inset, wallAt(inset, top, foot) + over, (TRAY.wallShade + (TRAY.wallFoot - TRAY.wallShade) * u) * fade, (TRAY.wallShadeTop + (TRAY.wallFootTop - TRAY.wallShadeTop) * u) * fade])
  }
  const g = sweep(outline, steps.map(([inset, z]) => ({ inset, z, out: 0, up: 1 })), false)
  const [lx, ly] = look.key.direction
  const l = Math.hypot(lx, ly) || 1
  const n = outline.count
  const colour = new Float32Array(steps.length * n * 3)
  steps.forEach(([, , side, upper], k) => {
    for (let i = 0; i < n; i++) {
      const toward = Math.max(0, (outline.nx[i]! * lx + outline.ny[i]! * ly) / l)
      const up = outline.ny[i]! * outline.ny[i]!
      const dark = (side + (upper - side) * up) * Math.pow(toward, 0.6)
      const v = 1 - dark
      colour.set([v * (1 - TRAY.cool * dark), v, v * (1 - TRAY.cool * 0.3 * dark)], (k * n + i) * 3)
    }
  })
  g.setAttribute('color', new THREE.BufferAttribute(colour, 3))
  return g
}

let shadeMaterial: THREE.MeshBasicMaterial | null = null

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

const RINGS = [0, 1.5, 3, 5, 7.5, 10.5, 14, 18, 23, 29, 36, 45, 56, 70]

// The floor: frosted glass lying in the shade of the wall on the light's side. The shade is laid into the face as vertex colour, from the key's
// direction and the tray's depth, the way a field's is, but deeper and longer: a tray is the deepest opening of the page.
export function trayFloor(s: Shape, paint: { soak: number; hold: number; reach: number; bounce: number; bounceReach: number; base: number; side?: number; cool?: number; far?: number; farReach?: number; warm?: number } = TRAY.floor): THREE.BufferGeometry {
  const depth = -s.z0
  const inset = trayFoot(depth) - 0.5
  const w = Math.max(1, s.w - inset * 2)
  const h = Math.max(1, s.h - inset * 2)
  const r = Math.max(0.6, Math.min((s.r ?? 0) - inset, w / 2, h / 2))
  const half = Math.min(w, h) / 2
  const insets = [...RINGS.filter((v) => v < half - 2), Math.max(0, half - 0.4)]
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
  const side = paint.side ?? 0
  const under = (x: number, y: number): number =>
    side > 0 ? Math.min(reach(x, y, 1), (w / 2 - x * Math.sign(dx)) / side, (h / 2 - y * Math.sign(dy)) / side) : reach(x, y, 1)
  const shade = (x: number, y: number): number => {
    const d = Math.max(0, under(x, y) * slope - depth * paint.hold)
    return paint.base * (1 - paint.soak * Math.exp(-d / paint.reach) - (paint.far ?? 0) * Math.exp(-d / (paint.farReach ?? 1))) + paint.bounce * Math.exp(-(reach(x, y, -1) * slope) / paint.bounceReach)
  }
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const put = (x: number, y: number): void => {
    const v = shade(x, y)
    const dark = Math.max(0, 1 - v) * (paint.cool ?? 0)
    pos.push(x, y, 0)
    col.push(v * (1 - dark), v, v * (1 - dark * 0.3) * (1 - (paint.warm ?? 0)))
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

interface TrayKit { joint: THREE.BufferGeometry; rim: THREE.BufferGeometry; liner: THREE.BufferGeometry; floor: THREE.BufferGeometry; shade: THREE.BufferGeometry; soak: THREE.BufferGeometry }
let open: { key: string; kit: TrayKit } | null = null

const trayKey = (s: Shape): string => `tray:${q(s.w)}x${q(s.h)}:${q(s.r ?? 0)}:${q(s.z0)}`
const makeKit = (s: Shape): TrayKit => ({ joint: trayJoint(s), rim: trayRim(s), liner: trayLiner(s), floor: trayFloor(s), shade: trayWallShade(s), soak: trayFloor(s, TRAY.soak) })

// Every tray of the page has the same plan when it is open, so the open tray's solids are built once and kept. A tray on its way open is built for its height and dropped after.
function tray(s: Shape): THREE.Object3D {
  const m = materials()
  const whole = s.h >= TRAY_H
  const key = trayKey(s)
  let kit: TrayKit
  if (whole) {
    if (!open || open.key !== key) open = { key, kit: makeKit(s) }
    kit = open.kit
  } else kit = makeKit(s)
  const root = new THREE.Group()
  const add = (g: THREE.BufferGeometry, material: THREE.Material, cast: boolean, receive: boolean): THREE.Mesh => {
    const mesh = new THREE.Mesh(g, material)
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    root.add(mesh)
    return mesh
  }
  add(kit.joint, m.gap, false, true)
  add(kit.rim, m.aluminiumSatin, true, true)
  add(kit.liner, m.glassSunk, true, true)
  add(kit.floor, m.glassSunk, false, true)
  shadeMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
  add(kit.shade, shadeMaterial, false, false)
  add(kit.soak, shadeMaterial, false, false).position.z = TRAY.soakOver
  root.userData.passing = !whole
  return root
}

// A hole in the page that a machine comes up through: the page's own ceramic turned down into it. A bevelled lip at the surface that takes the light,
// a wall that leans in and goes dark with its depth, darker on the light's side, and a floor in the dark.
const isHole = (s: Shape): boolean => isTray(s) && s.id.endsWith('-hole')
const holeKey = (s: Shape): string => `hole:${q(s.w)}x${q(s.h)}:${q(s.r ?? 0)}:${q(s.z0)}`
const PIT = { lip: 5, lipDrop: 3.2, lit: 0.5, deep: 0.86, side: 0.34, ease: 0.8, cool: 0.1, steps: 8 }

function pitWall(s: Shape): { wall: THREE.BufferGeometry; shade: THREE.BufferGeometry } {
  const depth = -s.z0
  const outline = outlineOf(s, 0, 16)
  const foot = trayFoot(depth)
  const lip = Math.min(PIT.lip, foot * 0.8)
  const drop = Math.min(PIT.lipDrop, depth * 0.5)
  const points: ProfilePoint[] = [[-0.3, depth + 0.02, true], [lip, depth - drop, true]]
  for (let i = 1; i <= PIT.steps; i++) points.push([lip + ((foot - lip) * i) / PIT.steps, (depth - drop) * (1 - i / PIT.steps)])
  const wall = sweep(outline, profile(points), false)
  const rungs: [number, number, number][] = [[lip * 0.5, depth - drop * 0.5 + 0.06, 0], [lip, depth - drop + 0.06, 0.04]]
  for (let i = 1; i <= PIT.steps; i++) rungs.push([lip + ((foot - lip) * i) / PIT.steps, (depth - drop) * (1 - i / PIT.steps) + 0.06, Math.pow((i / PIT.steps) * Math.min(1, depth / 40), PIT.ease)])
  const shade = sweep(outline, rungs.map(([inset, z]) => ({ inset, z, out: 0, up: 1 })), false)
  const [lx, ly] = look.key.direction
  const l = Math.hypot(lx, ly) || 1
  const n = outline.count
  const colour = new Float32Array(rungs.length * n * 3)
  rungs.forEach(([, , down], k) => {
    for (let i = 0; i < n; i++) {
      const facing = (outline.nx[i]! * lx + outline.ny[i]! * ly) / l
      const dark = Math.min(0.94, down * PIT.deep * (1 - PIT.lit * Math.max(0, -facing)) + (k > 0 ? PIT.side * Math.pow(Math.max(0, facing), 0.6) * (1 - down * 0.5) : 0))
      const v = 1 - dark
      colour.set([v * (1 - PIT.cool * dark), v, v * (1 - PIT.cool * 0.3 * dark)], (k * n + i) * 3)
    }
  })
  shade.setAttribute('color', new THREE.BufferAttribute(colour, 3))
  return { wall, shade }
}

function hole(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const { wall, shade } = pitWall(s)
  const sides = new THREE.Mesh(wall, m.ceramic)
  sides.receiveShadow = true
  root.add(sides)
  const floor = new THREE.Mesh(trayFloor(s), m.gap)
  floor.receiveShadow = true
  root.add(floor)
  shadeMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
  root.add(new THREE.Mesh(shade, shadeMaterial))
  root.userData.passing = true
  return root
}

export const rows: PartMaker = {
  key: (s: Shape, ctx: RealContext): string | null => (isHole(s) ? holeKey(s) : isTray(s) ? trayKey(s) : controls.key(s, ctx)),
  make: (s: Shape, ctx: RealContext): THREE.Object3D => (isHole(s) ? hole(s) : isTray(s) ? tray(s) : controls.make(s, ctx)),
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    if (!isTray(s)) controls.pose?.(o, s, ctx)
  },
  drop(o: THREE.Object3D): void {
    if (o.userData.passing !== true) return
    o.traverse((c) => {
      const mesh = c as THREE.Mesh
      if (mesh.isMesh) mesh.geometry.dispose()
    })
  }
}
