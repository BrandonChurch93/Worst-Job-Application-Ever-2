import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { materials } from '../../shell/materials'
import { controls } from '../../shell/real/controls'
import { roundedRect, sweep, plateProfile } from '../../shell/solids'
import { config } from '../../config'
import { BODY_Z, FRAME, LEG, SHADE, SHIELD, SIDE, SIDE_OFF, CAP_W, CAP_H, WRECK } from '../body'
import { bossKit, cutPlate, joined, lathe, lying, mesh, moved, screw, PLATE_TONE } from './body-kit'
import { pillGeometry, PILL } from './pill'
import { clearTone, deepTone, fracture, glassKit, paneGeometry, rimGeometry, CLEAR_GLASS, RIM, SHIELD_PANE } from './glass'

const heights = config.scale.heights
const clamp = (t: number): number => Math.min(1, Math.max(0, t))
const smooth = (t: number): number => { const u = clamp(t); return u * u * (3 - 2 * u) }
const prog = (t: number, a: number, b: number): number => smooth((t - a) / (b - a))
const mix = (a: number, b: number, t: number): number => a + (b - a) * t

const shared = new Map<string, THREE.BufferGeometry>()
const geo = (name: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry => {
  let g = shared.get(name)
  if (!g) {
    g = make()
    shared.set(name, g)
  }
  return g
}

function wingOutline(): [number, number][] {
  const hw = FRAME.w / 2
  const hh = FRAME.h / 2
  const r = FRAME.bedH / 2
  const cx = FRAME.bedW / 2 - r
  const pts: [number, number][] = [[-hw, 0.4], [-cx - r, 0.4]]
  for (let i = 1; i < 10; i++) {
    const a = Math.PI - (i / 10) * (Math.PI / 2)
    pts.push([-cx + r * Math.cos(a), r * Math.sin(a)])
  }
  pts.push([-cx, r], [cx, r])
  for (let i = 1; i < 10; i++) {
    const a = Math.PI / 2 - (i / 10) * (Math.PI / 2)
    pts.push([cx + r * Math.cos(a), r * Math.sin(a)])
  }
  pts.push([cx + r, 0.4], [hw, 0.4], [hw, hh - FRAME.cut], [hw - FRAME.cut, hh], [-hw + FRAME.cut, hh], [-hw, hh - FRAME.cut])
  return pts
}

const WING_SCREWS: [number, number][] = [[-172, 14], [172, 14], [-112, 56], [112, 56], [0, 57]]

function bedOutline(): [number, number][] {
  const r = FRAME.bedH / 2 + 3
  const cx = FRAME.bedW / 2 - FRAME.bedH / 2
  const pts: [number, number][] = [[-cx - r, 0.2]]
  for (let i = 1; i < 10; i++) {
    const a = Math.PI - (i / 10) * (Math.PI / 2)
    pts.push([-cx + r * Math.cos(a), r * Math.sin(a)])
  }
  pts.push([-cx, r], [cx, r])
  for (let i = 1; i < 10; i++) {
    const a = Math.PI / 2 - (i / 10) * (Math.PI / 2)
    pts.push([cx + r * Math.cos(a), r * Math.sin(a)])
  }
  pts.push([cx + r, 0.2])
  return pts
}

function lipOutline(): [number, number][] {
  const cx = FRAME.bedW / 2 - FRAME.bedH / 2
  const arc = (r: number): [number, number][] => {
    const pts: [number, number][] = [[-cx - r, 0.4]]
    for (let i = 1; i < 12; i++) {
      const a = Math.PI - (i / 12) * (Math.PI / 2)
      pts.push([-cx + r * Math.cos(a), r * Math.sin(a)])
    }
    pts.push([-cx, r], [cx, r])
    for (let i = 1; i < 12; i++) {
      const a = Math.PI / 2 - (i / 12) * (Math.PI / 2)
      pts.push([cx + r * Math.cos(a), r * Math.sin(a)])
    }
    pts.push([cx + r, 0.4])
    return pts
  }
  return [...arc(FRAME.bedH / 2 + 6.5), ...arc(FRAME.bedH / 2 - 0.2).reverse()]
}

const BREAK: [number, number, number, number] = [-12, 0, 16, 70]

function cut(points: [number, number][], keepLeft: boolean): [number, number][] {
  const [x0, y0, x1, y1] = BREAK
  const side = (p: [number, number]): number => ((p[0] - x0) * (y1 - y0) - (p[1] - y0) * (x1 - x0)) * (keepLeft ? -1 : 1)
  const out: [number, number][] = []
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!
    const a = side(p)
    const c = side(q)
    if (a >= 0) out.push(p)
    if (a >= 0 !== c >= 0) {
      const t = a / (a - c)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  })
  return out
}

export const CROWN = { wing: 0.0011, side: 0.0019 }
export const EDGE = { bevel: 2.4, out: 3, step: 3.4 }

// A cast plate is never dead flat: its top swells by a hair, so the room's light fades across it. Only the normals lean, the top stays level.
function crown(g: THREE.BufferGeometry, lean: number): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  for (let i = 0; i < p.count; i++) {
    if (n.getZ(i) < 0.99) continue
    const x = p.getX(i) * lean
    const y = p.getY(i) * lean
    const l = Math.hypot(x, y, 1)
    n.setXYZ(i, x / l, y / l, 1 / l)
  }
  n.needsUpdate = true
  return g
}

const HALF_AT: [number, number][] = [[-96, 40], [96, 40]]
const HALF_TO: [number, number, number, number][][] = [[[1290, 432, 0.16, 1], [1254, 462, -0.34, 0]], [[1752, 590, 1.42, 1], [1728, 632, 0.98, 0]]]

function wingParts(flip: boolean, half: -1 | 0 | 1): THREE.Group {
  const m = materials()
  const k = bossKit()
  const g = new THREE.Group()
  const name = `${flip}:${half}`
  const shape = (pts: [number, number][]): [number, number][] => (half === 0 ? pts : cut(pts, half < 0))
  const mine = (x: number): boolean => half === 0 || x < 0 === half < 0
  const [ox, oy] = half === 0 ? [0, 0] : HALF_AT[half < 0 ? 0 : 1]!
  const put = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => geometry.translate(-ox, -oy, 0)
  g.add(mesh(geo(`wing:${name}`, () => put(crown(cutPlate(shape(wingOutline()), FRAME.tall, EDGE.bevel, 0, 2), CROWN.wing))), k.plate))
  g.add(mesh(geo(`wingSide:${name}`, () => put(cutPlate(shape(wingOutline()), FRAME.tall - EDGE.step, 1, EDGE.out, 1))), k.plateSide))
  g.add(mesh(geo(`wingBed:${name}`, () => put(cutPlate(shape(bedOutline()), 9, 0.5))), half === 0 ? k.pocket : k.plate, false))
  g.add(mesh(geo(`wingBright:${name}`, () => put(joined([
    ...(half === 0 ? [cutPlate(shape(lipOutline()), 3, 1.1).translate(0, 0, FRAME.tall - 0.4)] : []),
    ...WING_SCREWS.filter(([x]) => mine(x)).map(([x, y], i) => moved(screw(4.6, 1.8, i + (flip ? 9 : 0) + (half > 0 ? 3 : 0)), x, y, FRAME.tall)),
    ...(flip ? [] : [-1, 1].filter(mine).flatMap((e) => [0, 1, 2].map((i) => moved(lying([[0, 0], [4.6, 0], [4.6, 9], [0, 9]], 20), e * 168 + 15 - i * 10.5, 0, FRAME.tall - 0.5))))
  ]))), m.aluminiumEdge, false))
  g.position.set(ox, oy, 0)
  return g
}

function wing(flip: boolean): THREE.Group {
  const k = bossKit()
  const g = new THREE.Group()
  const turned = new THREE.Group()
  const turn = flip ? Math.PI : 0
  turned.rotation.z = turn
  const whole = wingParts(flip, 0)
  const halves = [wingParts(flip, -1), wingParts(flip, 1)]
  turned.add(whole, ...halves)
  g.add(turned)
  const tab = (): THREE.Mesh => mesh(geo(`tail:${flip}`, () => cutPlate([[0, 0.3], [28, 0.3], [28, 20], [0, 34]], 5, 1.1).translate(0, 0, 0.5)), k.plate, false)
  const tail = tab()
  if (flip) tail.scale.y = -1
  const gone = tab()
  const far = halves[1]!
  gone.position.set(FRAME.w / 2 - 3 - HALF_AT[1]![0], -HALF_AT[1]![1], 0)
  if (flip) {
    gone.geometry = geo('tail:turned', () => cutPlate([[0, -34], [28, -20], [28, -0.3], [0, -0.3]], 5, 1.1).translate(0, 0, 0.5).rotateZ(Math.PI))
    gone.position.set(-(FRAME.w / 2 - 3) - HALF_AT[0]![0], -HALF_AT[0]![1], 0)
    halves[0]!.add(gone)
  } else far.add(gone)
  g.add(tail)
  g.userData.tail = tail
  g.userData.whole = whole
  g.userData.halves = halves
  return g
}

function frame(): THREE.Object3D {
  const root = new THREE.Group()
  const a = wing(false)
  const b = wing(true)
  root.add(a, b)
  root.userData.wings = [a, b]
  return root
}

function poseFrame(o: THREE.Object3D, s: Shape): void {
  const k = s.v?.[0] ?? 1
  const split = s.v?.[2] ?? 0
  const [a, b] = o.userData.wings as THREE.Group[]
  bossKit().plate.color.copy(PLATE_TONE.live).lerp(PLATE_TONE.dead, prog(s.v?.[1] ?? 0, 0.3, 1))
  const fold = (1 - k) * (Math.PI / 2)
  a!.rotation.set(-fold, 0, 0)
  b!.rotation.set(fold, 0, 0)
  const out = mix(FRAME.w / 2 - 31, FRAME.w / 2 - 3, prog(k, 0.7, 1))
  const broken = split > 0.002
  const ca = Math.cos(WRECK.rot)
  const sa = Math.sin(WRECK.rot)
  ;[a!, b!].forEach((w, n) => {
    const tail = w.userData.tail as THREE.Mesh
    tail.position.x = out
    tail.visible = !broken
    ;(w.userData.whole as THREE.Group).visible = !broken
    const sign = n === 1 ? -1 : 1
    ;(w.userData.halves as THREE.Group[]).forEach((h, i) => {
      h.visible = broken
      const [tx, ty, turn, over] = HALF_TO[n]![i]!
      const dx = tx - WRECK.x
      const dy = ty - WRECK.y
      const lx = (dx * ca + dy * sa) * sign
      const ly = -(-dx * sa + dy * ca) * sign
      h.position.set(mix(HALF_AT[i]![0], lx, split), mix(HALF_AT[i]![1], ly, split), over * FRAME.tall * split)
      h.rotation.z = -(turn - WRECK.rot) * split
    })
  })
}

function side(i: number): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const sign = i === 0 ? 1 : -1
  const root = new THREE.Group()
  const hw = SIDE.w / 2
  const hh = SIDE.h / 2
  const turnZ = i === 0 ? 0 : Math.PI
  const outline: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, -hh + 16], [hw - SIDE.lean, hh], [-hw + SIDE.lean, hh], [-hw, -hh + 16]]
  root.add(mesh(geo(`side:${i}`, () => crown(cutPlate(outline, SIDE.tall, EDGE.bevel, 0, 2).rotateZ(turnZ), CROWN.side)), k.plate))
  root.add(mesh(geo(`sideSide:${i}`, () => cutPlate(outline, SIDE.tall - EDGE.step, 1, EDGE.out, 1).rotateZ(turnZ)), k.plateSide))
  root.add(mesh(geo(`sideParts:${i}`, () => joined([
    ...[[-98, -36], [98, -36], [-70, 38], [70, 38]].map(([x, y], n) => moved(screw(4.2, 1.6, 20 + n + i * 5), x!, y! * sign, SIDE.tall))
  ])), m.aluminiumEdge, false))
  return root
}

const BARREL = { long: 84, r: 13, z: 12.5, out: -8, home: 33 }

function cannon(s: Shape, ctx: RealContext): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const root = new THREE.Group()
  const base = mesh(geo('cannonBase', () => lathe([[46, 0], [46, 3], [44.4, 4.6], [42.6, 4.6], [41.8, 2.8], [0, 2.8]], 72)), m.aluminiumTurned)
  const housing = mesh(geo('cannonHousing', () => lathe([[41.5, 0], [41.5, 0.8], [40, 0.9], [39, 0.9], [39, 1], [0, 1]], 72)), k.housing, false)
  const button = controls.make({ ...s, id: 'boss-cannon-button', part: 'shell', kind: 'disc', role: 'progressButton', tone: 'metal', z0: heights.progressRail, z1: heights.progressButton, rot: 0, v: undefined }, ctx)
  const barrel = new THREE.Group()
  const L = BARREL.long
  const r = BARREL.r
  barrel.add(mesh(geo('barrel', () => joined([
    lying([[0, 0], [r, 0], [r, 40], [r + 2.6, 41], [r + 2.6, 50], [r, 51], [r - 2.4, 53], [r - 2.4, L - 23], [r, L - 21], [r, L - 12], [r + 3, L - 11], [r + 3, L - 1.5], [r + 1.8, L], [r - 4, L], [r - 5, L - 2]], 40),
    lying([[r - 2.2, 58], [r - 1.6, 58.6], [r - 1.6, 62], [r - 2.2, 62.6]], 40)
  ])), m.aluminiumSatin))
  barrel.add(mesh(geo('bore', () => lying([[r - 5, L - 2], [r - 5, L - 22], [0, L - 22]], 28)), k.bore, false))
  root.add(base, housing, button, barrel)
  root.userData.c = { housing, button, barrel }
  return root
}

function poseCannon(o: THREE.Object3D, s: Shape): void {
  const c = o.userData.c as { housing: THREE.Mesh; button: THREE.Object3D; barrel: THREE.Group }
  const k = s.v?.[0] ?? 1
  const recoil = s.v?.[1] ?? 0
  const up = prog(k, 0.55, 0.8)
  const outK = prog(k, 0.8, 1)
  const lift = BODY_Z.housing * up
  c.housing.scale.z = Math.max(0.05, lift)
  c.housing.position.z = 2.2
  c.button.position.z = lift
  c.barrel.position.set(mix(BARREL.home, BARREL.out, outK) + recoil * 0.75, 0, 2.6 + Math.max(0.2, up) * (BARREL.z - 2.6))
  const thin = Math.max(0.12, up)
  c.barrel.scale.set(mix(0.78, 1, outK), thin, thin)
}

const GLASS_CRACKS: [number, number][][] = [
  [[-47, 90], [-30, 60], [-12, 36], [4, 5], [22, -29], [36, -62], [47, -97]],
  [[49, 64], [30, 41], [4, 5]],
  [[-12, 36], [-4, 71], [10, 103]],
  [[22, -29], [-6, -52], [-22, -83]]
]

let brokenMade: ReturnType<typeof fracture> | null = null

function brokenGlass(): ReturnType<typeof fracture> {
  if (!brokenMade) {
    brokenMade = fracture(GLASS_CRACKS, SHIELD.tall, 41)
    for (const g of [brokenMade.light, brokenMade.dark, brokenMade.sheet]) g.translate(0, 0, SHIELD.tall / 2)
  }
  return brokenMade
}

// The block leans, so its wall is seen: the picture runs down the wall as well, not only across the faces.
export function walled(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const uv = g.getAttribute('uv')
  for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getX(i) + p.getZ(i), uv.getY(i) + p.getZ(i))
  return g
}

function shield(): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const root = new THREE.Group()
  const leaf = new THREE.Group()
  const w = SHIELD.w
  const h = SHIELD.h
  const t = SHIELD.tall
  const slab = { kind: 'box', w, h, r: 18 } as Shape
  const gk = glassKit()
  const pane = mesh(geo('glass', () => walled(paneGeometry(slab, t, SHIELD_PANE)).translate(0, 0, t / 2)), gk.clear, false)
  pane.renderOrder = 2
  leaf.add(pane, mesh(geo('glassRim', () => rimGeometry(slab, t, RIM.shield, 0).translate(0, 0, t / 2)), gk.rim, false))
  const cracks = new THREE.Group()
  const f = brokenGlass()
  const sheet = mesh(f.sheet, gk.crackSheet, false, false)
  const dark = mesh(f.dark, gk.crackDark, false, false)
  const light = mesh(f.light, gk.crackLight, false, false)
  sheet.renderOrder = 3
  dark.renderOrder = 4
  light.renderOrder = 5
  cracks.add(sheet, dark, light)
  leaf.add(cracks)
  const pin = mesh(geo('shieldPin', () => joined([-1, 1].map((e) => new THREE.BoxGeometry(11, 18, 9).translate(0, e * 34, 2)))), m.aluminiumSatin, false)
  const tubes = [-1, 1].map((sy) => {
    const g = new THREE.Group()
    g.add(mesh(geo('armTube', () => lying([[0, 0], [5, 0], [5, 82], [3.2, 82]], 20).rotateZ(Math.PI)), m.aluminiumSatin))
    g.userData.sy = sy
    return g
  })
  const rods = [-1, 1].map((sy) => {
    const g = new THREE.Group()
    g.add(mesh(geo('armRod', () => joined([lying([[0, 0], [3.1, 0], [3.1, 82], [0, 82]], 16).rotateZ(Math.PI), lathe([[6.5, -3], [6.5, 3], [0, 3]], 24).rotateX(Math.PI / 2)])), k.pin, false))
    g.userData.sy = sy
    return g
  })
  root.add(leaf, pin, ...tubes, ...rods)
  root.userData.s = { leaf, pin, tubes, rods, cracks }
  return root
}

const X = new THREE.Vector3(1, 0, 0)
const va = new THREE.Vector3()
const vb = new THREE.Vector3()
const vc = new THREE.Vector3()

const TORN = 0.9

function poseShield(o: THREE.Object3D, s: Shape): void {
  const d = o.userData.s as { leaf: THREE.Group; pin: THREE.Mesh; tubes: THREE.Group[]; rods: THREE.Group[]; cracks: THREE.Group }
  const k = s.v?.[0] ?? 1
  const flat = s.v?.[1] ?? 0
  const hurt = s.v?.[5] ?? 0
  const stand = prog(k, 0.55, 1) * (1 - flat)
  glassKit().clear.color.copy(clearTone()).multiplyScalar(1 - (1 - CLEAR_GLASS.up) * stand)
  if (flat > 0) glassKit().clear.color.lerp(deepTone(), flat)
  glassKit().clear.opacity = mix(CLEAR_GLASS.through, CLEAR_GLASS.lying, flat)
  const swing = (1 - prog(k, 0.1, 0.6)) * (Math.PI / 2)
  const lean = stand * (0.62 + 0.07 * clamp(s.v?.[2] ?? 0))
  const half = SHIELD.w / 2
  const low = 4 + stand * 6
  d.leaf.rotation.set(0, 0, 0)
  d.leaf.rotateZ(swing)
  d.leaf.rotateY(-lean)
  const cx = -half + half * Math.cos(lean) + 4 * stand
  d.leaf.position.set(cx * Math.cos(swing), cx * Math.sin(swing), low + half * Math.sin(lean))
  d.cracks.visible = hurt > 0.95 && flat > 0.6
  const px = (-half + 6) * Math.cos(swing)
  const py = (-half + 6) * Math.sin(swing)
  d.pin.rotation.z = swing
  d.pin.position.set(px + 6 * stand, py, low - 1 + 2 * stand)
  const ax = mix(s.v?.[3] ?? 40, -half + 60, flat)
  const ay = -(s.v?.[4] ?? 0) * (1 - flat)
  const az = mix(BODY_Z.frame + 5 - BODY_Z.shield, 5, flat)
  for (let i = 0; i < 2; i++) {
    const sy = i === 0 ? -1 : 1
    const off = sy * 34
    va.set(d.pin.position.x - Math.sin(swing) * off, d.pin.position.y + Math.cos(swing) * off, d.pin.position.z)
    vb.set(ax, ay + off, az)
    vc.copy(vb).sub(va)
    const len = vc.length() || 1
    vc.divideScalar(len)
    const rod = d.rods[i]!
    const tube = d.tubes[i]!
    rod.position.copy(va)
    rod.quaternion.setFromUnitVectors(X, vc)
    rod.scale.x = mix(1, 0.5, flat)
    tube.scale.x = mix(1, 0.3, flat)
    tube.position.copy(vb)
    tube.quaternion.setFromUnitVectors(X, vc.negate())
    tube.visible = len > 20 && flat < TORN
    rod.visible = flat < TORN
  }
  d.pin.visible = flat < TORN
}

function leg(): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const root = new THREE.Group()
  const L = LEG.link
  const W = LEG.wide
  const link = (): THREE.Mesh => mesh(geo('link', () => {
    const body = sweep(roundedRect(L + W, W, W / 2, 10), plateProfile(8, 2.2, 0, 4)).translate(L / 2, 0, -4)
    const under = sweep(roundedRect(L + W, W, W / 2, 10), [{ inset: 0, z: 0, out: 0, up: 1 }]).rotateX(Math.PI).translate(L / 2, 0, -4)
    const slot = sweep(roundedRect(L - 46, 6, 3, 6), [{ inset: 0, z: 3.9, out: 1, up: 0 }, { inset: 0, z: 4.7, out: 0.7, up: 0.7 }, { inset: 1.3, z: 5.5, out: 0, up: 1 }]).translate(L / 2, 0, 0)
    return joined([body, under, slot])
  }), k.link)
  const upper = link()
  const lower = link()
  const kr = LEG.knee / 2
  const knuckle = (): THREE.Mesh => mesh(geo('knee', () => lathe([[kr, -9], [kr, 7.8], [kr - 1.8, 9.6], [kr - 5.4, 9.6], [kr - 6.4, 8.2], [8, 8.2], [8, 10.8], [6, 12], [0, 12]], 48)), m.aluminiumSatin)
  const hip = knuckle()
  const knee = knuckle()
  const rod = mesh(geo('legRod', () => lying([[0, 0], [4.4, 0], [4.4, 1], [0, 1]], 16).rotateZ(Math.PI)), k.pin, false)
  const fr = LEG.foot / 2
  const foot = mesh(geo('foot', () => lathe([[fr - 1.2, 0], [fr, 1.6], [fr, 8], [fr - 2, 10.2], [fr - 6, 10.2], [fr - 6.8, 9.2], [fr - 7.8, 10.8], [12, 11.8], [11, 10.4], [10, 12], [0, 12.4]], 52)), m.aluminiumSatin)
  const stem = mesh(geo('ankleStem', () => lathe([[7.4, 0], [7.4, 0.06], [5.2, 0.12], [5.2, 1], [0, 1]], 24)), m.aluminiumSatin)
  const ball = mesh(geo('ankleBall', () => new THREE.SphereGeometry(6.5, 24, 16)), m.aluminiumSatin)
  root.add(upper, lower, hip, knee, foot, stem, ball, rod)
  root.userData.l = { upper, lower, hip, knee, foot, stem, ball, rod }
  return root
}

export const ANKLE = 52

const H = new THREE.Vector3()
const A = new THREE.Vector3()
const K = new THREE.Vector3()
const U = new THREE.Vector3()
const N = new THREE.Vector3()
const P = new THREE.Vector3()
const Y = new THREE.Vector3()
const S = new THREE.Vector3()
const M4 = new THREE.Matrix4()

function aim(o: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, pinAxis: THREE.Vector3): void {
  U.copy(to).sub(from).normalize()
  Y.copy(pinAxis).cross(U).normalize()
  N.copy(U).cross(Y).normalize()
  M4.makeBasis(U, Y, N)
  o.quaternion.setFromRotationMatrix(M4)
  o.position.copy(from)
}

function poseLeg(o: THREE.Object3D, s: Shape): void {
  const d = o.userData.l as { upper: THREE.Mesh; lower: THREE.Mesh; hip: THREE.Mesh; knee: THREE.Mesh; foot: THREE.Mesh; stem: THREE.Mesh; ball: THREE.Mesh; rod: THREE.Mesh }
  const v = s.v ?? []
  const k = v[3] ?? 1
  const sx = v[4] ?? 1
  const flat = v[5] ?? 0
  const sy = v[6] ?? 1
  const lift = v[2] ?? 0
  const L = LEG.link
  const hz = mix(BODY_Z.hip, 9, flat) + (flat > 0 ? lift : 0)
  H.set(0, 0, hz)
  const fx = mix(-sx * 44, v[0] ?? 0, k)
  const fy = mix(sy * 4, -(v[1] ?? 0), k)
  const fz = mix(BODY_Z.frame - 14, 0, prog(k, 0.25, 1)) * (1 - flat) + lift
  const ankle = mix(11, ANKLE, prog(k, 0.5, 1) * (1 - flat))
  A.set(fx, fy, fz + ankle)
  const far = H.distanceTo(A)
  const reach = Math.min(far, L * 2 - 1)
  U.copy(A).sub(H).normalize()
  const out = Math.sqrt(Math.max(0, L * L - (reach / 2) * (reach / 2)))
  const open = prog(k, 0.2, 0.9)
  N.set(-U.y, U.x, 0)
  if (N.lengthSq() < 1e-6) N.set(sx, 0, 0)
  N.normalize()
  if (N.x * sx < 0) N.negate()
  N.multiplyScalar(mix(-1, 1, open))
  N.z += 0.16 * open * (1 - flat)
  N.addScaledVector(U, -N.dot(U)).normalize()
  K.copy(H).addScaledVector(U, reach / 2).addScaledVector(N, out)
  P.copy(U).cross(N).normalize()
  if (P.z < 0) P.negate()
  S.copy(A).sub(K).normalize()
  const more = Math.max(0, K.distanceTo(A) - L)
  d.hip.position.copy(H)
  d.hip.quaternion.setFromUnitVectors(Z, P)
  aim(d.upper, H, K, P)
  d.upper.position.addScaledVector(P, 4.2)
  aim(d.rod, K, A, P)
  d.rod.position.addScaledVector(P, -4.2)
  d.rod.scale.set(Math.max(0.01, more + L * 0.5), 1, 1)
  d.rod.visible = more > 0.5
  H.copy(K).addScaledVector(S, more)
  aim(d.lower, H, A, P)
  d.lower.position.addScaledVector(P, -4.2)
  d.knee.position.copy(K)
  d.knee.quaternion.setFromUnitVectors(Z, P)
  d.foot.position.set(fx, fy, fz)
  d.stem.position.set(fx, fy, fz + 10)
  d.stem.scale.set(1, 1, Math.max(0.01, ankle - 10))
  d.stem.visible = ankle > 13
  d.ball.position.set(fx, fy, fz + ankle + 0.5)
}

const Z = new THREE.Vector3(0, 0, 1)

const CAP_CRACKS: [number, number][][] = [
  [[-144, -6], [-126, -2], [-112, -9], [-96, -4], [-84, -12]],
  [[-112, -9], [-104, 6], [-110, 18]],
  [[144, 10], [128, 4], [116, 11], [100, 5], [92, 14], [78, 12]],
  [[116, 11], [112, -6], [120, -20]],
  [[-34, 36], [-30, 25], [-38, 17], [-33, 8], [-40, 0], [-36, -8]],
  [[-38, 17], [-50, 14], [-56, 20]],
  [[58, -36], [54, -26], [61, -18], [56, -10]]
]

function capCracks(): THREE.BufferGeometry {
  const pos: number[] = []
  CAP_CRACKS.forEach((line) => {
    for (let i = 0; i < line.length - 1; i++) {
      const [x0, y0] = line[i]!
      const [x1, y1] = line[i + 1]!
      const l = Math.hypot(x1 - x0, y1 - y0) || 1
      const w0 = 1.5 * (1 - i / line.length)
      const w1 = 1.5 * (1 - (i + 1) / line.length)
      const nx = -(y1 - y0) / l
      const ny = (x1 - x0) / l
      pos.push(x0 - nx * w0, y0 - ny * w0, 0, x1 - nx * w1, y1 - ny * w1, 0, x0 + nx * w0, y0 + ny * w0, 0, x0 + nx * w0, y0 + ny * w0, 0, x1 - nx * w1, y1 - ny * w1, 0, x1 + nx * w1, y1 + ny * w1, 0)
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const nor = new Float32Array(pos.length)
  for (let i = 2; i < nor.length; i += 3) nor[i] = 1
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  return g
}

function cap(s: Shape, ctx: RealContext): THREE.Object3D {
  const root = new THREE.Group()
  const cracks = mesh(geo('capCracks', capCracks), bossKit().crack, false, false)
  cracks.position.z = BODY_Z.capTall - 0.75
  root.add(cracks)
  root.userData.cracks = cracks
  const flat = controls.make({ ...s, id: 'boss-cap-button', part: 'shell', kind: 'capsule', role: 'button', tone: 'accent', w: CAP_W, h: CAP_H, z0: 0, z1: BODY_Z.capTall, rot: 0, v: undefined }, ctx)
  root.add(flat)
  const pill = mesh(pillGeometry(), materials().orange)
  pill.visible = false
  root.add(pill)
  root.userData.flat = flat
  root.userData.pill = pill
  return root
}

const SHADE_N = 28

// The dark under the body: how far a point of the page is inside the body's outline seen from above, 0 to 1.
export function shadeAt(px: number, py: number): number {
  const box = (x: number, y: number, hw: number, hh: number): number => {
    const dx = Math.abs(x) - hw
    const dy = Math.abs(y) - hh
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0)
  }
  const d = Math.min(box(px, py, FRAME.w / 2, FRAME.h / 2), box(px, py, SIDE.w / 2 - 14, SIDE_OFF[1]![1] + SIDE.h / 2))
  return 1 - smooth((d + 24) / SHADE.soft)
}

let shadeMaterial: THREE.MeshBasicMaterial | null = null

function shade(): THREE.Object3D {
  shadeMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.019, 0.018), vertexColors: true, transparent: true, depthWrite: false, toneMapped: false })
  const o = new THREE.Group()
  o.add(mesh(geo('shade', () => {
    const g = new THREE.PlaneGeometry(SHADE.w, SHADE.h, SHADE_N, SHADE_N)
    const p = g.getAttribute('position')
    const colour = new Float32Array(p.count * 4)
    for (let i = 0; i < p.count; i++) colour.set([1, 1, 1, shadeAt(p.getX(i), p.getY(i))], i * 4)
    g.setAttribute('color', new THREE.BufferAttribute(colour, 4))
    return g
  }), shadeMaterial, false, false))
  return o
}

export const bossBody: PartMaker = {
  key(s: Shape): string | null {
    if (s.kind === 'text') return null
    switch (s.role) {
      case 'bossLeg': return 'leg'
      case 'bossSide': return `side:${s.v?.[2] ?? 0}`
      case 'bossFrame': return 'frame'
      case 'bossShield': return 'shield'
      case 'bossCannon': return 'cannon'
      case 'bossCap': return 'cap'
      case 'bossShade': return 'shade'
      default: return null
    }
  },
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    switch (s.role) {
      case 'bossLeg': return leg()
      case 'bossSide': return side(s.v?.[2] ?? 0)
      case 'bossFrame': return frame()
      case 'bossShield': return shield()
      case 'bossCannon': return cannon(s, ctx)
      case 'bossShade': return shade()
      default: return cap(s, ctx)
    }
  },
  pose(o: THREE.Object3D, s: Shape): void {
    switch (s.role) {
      case 'bossLeg': poseLeg(o, s); break
      case 'bossFrame': poseFrame(o, s); break
      case 'bossShield': poseShield(o, s); break
      case 'bossCannon': poseCannon(o, s); break
      case 'bossShade': if (shadeMaterial) shadeMaterial.opacity = 0.46 * clamp(s.v?.[0] ?? 0); break
      case 'bossCap': {
        const t = s.v?.[2] ?? 0
        o.position.y += BODY_Z.capTall * Math.sin(t)
        o.position.z += BODY_Z.capTall * (1 - Math.cos(t))
        const down = s.v?.[3] ?? 0
        const pill = o.userData.pill as THREE.Mesh
        pill.visible = down > 0
        ;(o.userData.flat as THREE.Object3D).visible = down <= 0
        pill.scale.z = (s.z1 - s.z0) / PILL.tall
        const cracks = o.userData.cracks as THREE.Mesh
        cracks.position.z = s.z1 - s.z0 - 0.75
        const all = cracks.geometry.getAttribute('position').count / 6
        const n = Math.floor(all * prog(s.v?.[0] ?? 0, 0.8, 1))
        cracks.visible = n > 0 && down <= 0
        cracks.geometry.setDrawRange(0, n * 6)
        break
      }
      default: break
    }
  }
}
