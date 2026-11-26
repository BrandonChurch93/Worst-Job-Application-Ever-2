import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { materials } from '../../shell/materials'
import { controls } from '../../shell/real/controls'
import { roundedRect, sweep, plateProfile } from '../../shell/solids'
import { config } from '../../config'
import { BODY_Z, FRAME, LEG, SHIELD, SIDE, CAP_W, CAP_H } from '../body'
import { bossKit, cutPlate, joined, lathe, lying, mesh, moved, screw } from './body-kit'

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

const WING_SCREWS: [number, number][] = [[-170, 30], [170, 30], [-118, 56], [118, 56], [0, 56]]

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

function wing(flip: boolean): THREE.Group {
  const m = materials()
  const k = bossKit()
  const g = new THREE.Group()
  const turnZ = flip ? Math.PI : 0
  g.add(mesh(geo(`wing:${flip}`, () => cutPlate(wingOutline(), FRAME.tall, 2.4).rotateZ(turnZ)), m.aluminium))
  g.add(mesh(geo(`wingBed:${flip}`, () => cutPlate(bedOutline(), 4, 0.5).rotateZ(turnZ)), k.bed))
  g.add(mesh(geo(`wingLip:${flip}`, () => cutPlate(lipOutline(), 2.6, 1).translate(0, 0, FRAME.tall - 0.4).rotateZ(turnZ)), m.aluminiumEdge))
  g.add(mesh(geo(`wingScrews:${flip}`, () => joined([
    ...WING_SCREWS.map(([x, y], i) => moved(screw(4.2, 1.6, i + (flip ? 9 : 0)), x, y, FRAME.tall)),
    ...[-168, 168].map((x) => moved(lathe([[12, 0], [12, 2.2], [10.5, 3.4], [7.5, 3.4], [7.5, 1.2], [0, 1.2]], 40), x, 50, FRAME.tall))
  ]).rotateZ(turnZ)), m.steel))
  const tail = mesh(geo(`tail:${flip}`, () => cutPlate(flip ? [[0, -34], [28, -20], [28, -0.3], [0, -0.3]] : [[0, 0.3], [28, 0.3], [28, 20], [0, 34]], 5, 1.1).translate(0, 0, 0.5)), m.aluminiumSatin)
  g.add(tail)
  g.userData.tail = tail
  if (!flip) g.add(mesh(geo('knuckles', () => joined([-1, 1].flatMap((s) => [0, 1, 2].map((i) => moved(lying([[0, 0], [4.2, 0], [4.2, 9], [0, 9]], 20), s * 168 + 15 - i * 10.5, 0, FRAME.tall - 0.5))))), m.steel))
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
  const fold = (1 - k) * (Math.PI / 2)
  a!.rotation.set(-fold, 0, split * 0.34)
  b!.rotation.set(fold, 0, split * -1.5)
  a!.position.set(split * -46, split * 62, 0)
  b!.position.set(split * 524, split * -226, 0)
  const out = mix(FRAME.w / 2 - 31, FRAME.w / 2 - 3, prog(k, 0.7, 1))
  ;(a!.userData.tail as THREE.Mesh).position.x = out
  ;(b!.userData.tail as THREE.Mesh).position.x = out
}

function side(i: number): THREE.Object3D {
  const m = materials()
  const sign = i === 0 ? 1 : -1
  const root = new THREE.Group()
  const hw = SIDE.w / 2
  const hh = SIDE.h / 2
  const turnZ = i === 0 ? 0 : Math.PI
  root.add(mesh(geo(`side:${i}`, () => cutPlate([[-hw, -hh], [hw, -hh], [hw, -hh + 16], [hw - SIDE.lean, hh], [-hw + SIDE.lean, hh], [-hw, -hh + 16]], SIDE.tall, 1.4).rotateZ(turnZ)), m.aluminium))
  root.add(mesh(geo(`sideParts:${i}`, () => joined([
    moved(lathe([[45, 0], [45, 1.2], [43.6, 2.4], [40, 2.4], [40, 0.6], [0, 0.6]], 64), -10, -8 * sign, SIDE.tall),
    ...[[-100, -24], [100, -24], [-78, 26], [78, 26]].map(([x, y], n) => moved(screw(3.6, 1.4, 20 + n + i * 5), x!, y! * sign, SIDE.tall))
  ])), m.steel))
  return root
}

const BARREL = { long: 84, r: 12, z: 12.5, out: -8, home: 33 }

function cannon(s: Shape, ctx: RealContext): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const root = new THREE.Group()
  const base = mesh(geo('cannonBase', () => lathe([[36, 0], [36, 1.6], [33, 2.6], [0, 2.6]], 56)), k.housing)
  const housing = mesh(geo('cannonHousing', () => lathe([[33, 0], [33, 0.82], [31.5, 0.9], [29, 0.9], [29, 1], [0, 1]], 56)), k.housing)
  const button = controls.make({ ...s, id: 'boss-cannon-button', part: 'shell', kind: 'disc', role: 'progressButton', tone: 'metal', z0: heights.progressRail, z1: heights.progressButton, rot: 0, v: undefined }, ctx)
  const barrel = new THREE.Group()
  const L = BARREL.long
  const r = BARREL.r
  barrel.add(mesh(geo('barrel', () => lying([[0, 0], [r, 0], [r, 34], [r + 2, 34], [r + 2, 44], [r, 44], [r - 2.2, 46], [r - 2.2, L - 17], [r - 0.6, L - 15], [r + 1.4, L - 12], [r + 1.4, L - 2], [r + 0.4, L], [r - 3.4, L], [r - 4.2, L - 1.6]], 40)), m.aluminiumSatin))
  barrel.add(mesh(geo('bore', () => lying([[r - 4.2, L - 1.6], [r - 4.2, L - 20], [0, L - 20]], 28)), k.bore, false))
  barrel.add(mesh(geo('barrelBand', () => lying([[r - 2, L - 30], [r - 2 + 0.3, L - 24]], 36)), k.pin))
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

function shield(): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const root = new THREE.Group()
  const leaf = new THREE.Group()
  const w = SHIELD.w
  const h = SHIELD.h
  leaf.add(mesh(geo('glass', () => sweep(roundedRect(w - 12, h - 12, 9, 10), [{ inset: 0, z: 1, out: 0, up: 1 }, { inset: 0, z: SHIELD.tall - 1.2, out: 0, up: 1 }], true)), k.glass))
  
  leaf.add(mesh(geo('glassRim', () => {
    const ring = roundedRect(w, h, 15, 12)
    const t = SHIELD.tall
    return sweep(ring, [{ inset: 7, z: 0, out: 0, up: -1 }, { inset: 0.8, z: 0, out: 0, up: -1 }, { inset: 0, z: 0.8, out: 1, up: 0 }, { inset: 0, z: t - 3, out: 1, up: 0 }, { inset: 0.9, z: t - 1.2, out: 0.8, up: 0.6 }, { inset: 2.8, z: t, out: 0.3, up: 0.95 }, { inset: 4.4, z: t, out: -0.3, up: 0.95 }, { inset: 6.4, z: t - 1.2, out: -0.6, up: 0.8 }], false)
  }), k.glassEdge))
  const cracks = mesh(geo('glassCracks', () => {
    const pos: number[] = []
    const line = (x0: number, y0: number, x1: number, y1: number, wide: number): void => {
      const dx = x1 - x0
      const dy = y1 - y0
      const l = Math.hypot(dx, dy) || 1
      const nx = (-dy / l) * wide * 0.5
      const ny = (dx / l) * wide * 0.5
      pos.push(x0 - nx, y0 - ny, 0, x1, y1, 0, x0 + nx, y0 + ny, 0)
    }
    const hub: [number, number] = [8, -22]
    const ends: [number, number][] = [[-52, -60], [-30, 20], [10, 96], [52, 30], [50, -44], [20, -98], [-48, -98]]
    ends.forEach(([x, y], i) => {
      const mx = (hub[0] + x) / 2 + ((i * 37) % 11) - 5
      const my = (hub[1] + y) / 2 + ((i * 53) % 13) - 6
      line(hub[0], hub[1], mx, my, 1.5)
      line(mx, my, x, y, 1.1)
      if (i % 2 === 0) line(mx, my, mx + (y - my) * 0.4, my - (x - mx) * 0.4, 0.9)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    const nor = new Float32Array(pos.length)
    for (let i = 2; i < nor.length; i += 3) nor[i] = 1
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
    return g.translate(0, 0, SHIELD.tall + 0.12)
  }), k.bore, false)
  leaf.add(cracks)
  const pin = mesh(geo('shieldPin', () => lying([[0, 0], [3.4, 0], [3.4, 170], [0, 170]], 20).rotateZ(Math.PI / 2).translate(0, 85, 0)), k.pin)
  const tubes = [-1, 1].map((sy) => {
    const g = new THREE.Group()
    g.add(mesh(geo('armTube', () => lying([[0, 0], [5, 0], [5, 50], [3.2, 50]], 20).rotateZ(Math.PI)), m.aluminiumSatin))
    g.userData.sy = sy
    return g
  })
  const rods = [-1, 1].map((sy) => {
    const g = new THREE.Group()
    g.add(mesh(geo('armRod', () => lying([[0, 0], [3.1, 0], [3.1, 52], [0, 52]], 16).rotateZ(Math.PI)), k.pin))
    g.add(mesh(geo('armEye', () => lathe([[6.5, -3], [6.5, 3], [0, 3]], 24).rotateX(Math.PI / 2)), m.aluminiumSatin))
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

function poseShield(o: THREE.Object3D, s: Shape): void {
  const d = o.userData.s as { leaf: THREE.Group; pin: THREE.Mesh; tubes: THREE.Group[]; rods: THREE.Group[]; cracks: THREE.Mesh }
  const k = s.v?.[0] ?? 1
  const flat = s.v?.[1] ?? 0
  const hurt = s.v?.[5] ?? 0
  const stand = prog(k, 0.55, 1) * (1 - flat)
  const swing = (1 - prog(k, 0.1, 0.6)) * (Math.PI / 2)
  const lean = stand * 0.62
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
  const az = mix(BODY_Z.frame + 5 - BODY_Z.side, 5, flat)
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
    tube.position.copy(vb)
    tube.quaternion.setFromUnitVectors(X, vc.negate())
    tube.visible = len > 20
  }
}

function leg(): THREE.Object3D {
  const m = materials()
  const k = bossKit()
  const root = new THREE.Group()
  const L = LEG.link
  const W = LEG.wide
  const link = (): THREE.Mesh => mesh(geo('link', () => {
    const body = sweep(roundedRect(L + W, W, W / 2, 10), plateProfile(7, 1.8, 0, 4)).translate(L / 2, 0, -3.5)
    const under = sweep(roundedRect(L + W, W, W / 2, 10), [{ inset: 0, z: 0, out: 0, up: 1 }]).rotateX(Math.PI).translate(L / 2, 0, -3.5)
    const slot = sweep(roundedRect(L - 40, 7, 3.5, 6), [{ inset: 0, z: 3.5, out: 0, up: 1 }, { inset: 1.2, z: 2.3, out: -0.7, up: 0.7 }, { inset: 1.2, z: 2.3, out: 0, up: 1 }]).translate(L / 2, 0, 0.03)
    return joined([body, under, slot])
  }), k.link)
  const upper = link()
  const lower = link()
  const hip = mesh(geo('hipBall', () => new THREE.SphereGeometry(9, 28, 18)), k.pin)
  const kr = LEG.knee / 2
  const knee = mesh(geo('knee', () => lathe([[kr, -7], [kr, 5.6], [kr - 1.4, 7], [kr - 4.2, 7], [kr - 5, 5.8], [6, 5.8], [6, 8.2], [4.4, 9.2], [0, 9.2]], 44)), m.aluminiumEdge)
  const rod = mesh(geo('legRod', () => lying([[0, 0], [3.6, 0], [3.6, 1], [0, 1]], 16).rotateZ(Math.PI)), k.pin)
  const foot = new THREE.Group()
  const fr = LEG.foot / 2
  foot.add(mesh(geo('footPad', () => lathe([[fr - 1.4, 0], [fr - 0.8, 2.4], [0, 2.4]], 44)), m.rubber))
  foot.add(mesh(geo('foot', () => lathe([[fr, 1.8], [fr, 7], [fr - 1.8, 9], [fr - 5.5, 9], [fr - 6.2, 8.2], [fr - 7, 9.6], [11, 10.6], [10, 9.4], [9, 10.8], [0, 11.2]], 52)), m.aluminiumTurned))
  foot.add(mesh(geo('ankle', () => new THREE.SphereGeometry(6, 24, 16).translate(0, 0, 10.5)), k.pin))
  root.add(upper, lower, hip, knee, foot, rod)
  root.userData.l = { upper, lower, hip, knee, foot, rod }
  return root
}

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
  const d = o.userData.l as { upper: THREE.Mesh; lower: THREE.Mesh; hip: THREE.Mesh; knee: THREE.Mesh; foot: THREE.Group; rod: THREE.Mesh }
  const v = s.v ?? []
  const k = v[3] ?? 1
  const sx = v[4] ?? 1
  const flat = v[5] ?? 0
  const sy = v[6] ?? 1
  const lift = v[2] ?? 0
  const L = LEG.link
  const hz = mix(BODY_Z.hip, 6, flat) + (flat > 0 ? lift : 0)
  H.set(0, 0, hz)
  const fx = mix(-sx * 44, v[0] ?? 0, k)
  const fy = mix(sy * 4, -(v[1] ?? 0), k)
  const fz = mix(BODY_Z.frame - 14, 0, prog(k, 0.25, 1)) * (1 - flat) + lift
  A.set(fx, fy, fz + 9)
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
  aim(d.upper, H, K, P)
  d.upper.position.addScaledVector(P, 3.2)
  aim(d.rod, K, A, P)
  d.rod.position.addScaledVector(P, -3.2)
  d.rod.scale.set(Math.max(0.01, more + L * 0.5), 1, 1)
  d.rod.visible = more > 0.5
  H.copy(K).addScaledVector(S, more)
  aim(d.lower, H, A, P)
  d.lower.position.addScaledVector(P, -3.2)
  d.knee.position.copy(K)
  d.knee.quaternion.setFromUnitVectors(Z, P)
  d.foot.position.set(fx, fy, fz)
}

const Z = new THREE.Vector3(0, 0, 1)

const CAP_CRACKS: [number, number][][] = [
  [[-144, -6], [-126, -2], [-112, -9], [-96, -4], [-84, -12]],
  [[-112, -9], [-104, 6], [-110, 18]],
  [[144, 10], [128, 4], [116, 11], [100, 5], [92, 14], [78, 12]],
  [[116, 11], [112, -6], [120, -20]],
  [[-40, 36], [-36, 22], [-46, 12], [-42, 2]]
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
  root.add(controls.make({ ...s, id: 'boss-cap-button', part: 'shell', kind: 'capsule', role: 'button', tone: 'accent', w: CAP_W, h: CAP_H, z0: 0, z1: BODY_Z.capTall, rot: 0, v: undefined }, ctx))
  return root
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
      default: return cap(s, ctx)
    }
  },
  pose(o: THREE.Object3D, s: Shape): void {
    switch (s.role) {
      case 'bossLeg': poseLeg(o, s); break
      case 'bossFrame': poseFrame(o, s); break
      case 'bossShield': poseShield(o, s); break
      case 'bossCannon': poseCannon(o, s); break
      case 'bossCap': {
        const t = s.v?.[2] ?? 0
        o.position.y += BODY_Z.capTall * Math.sin(t)
        o.position.z += BODY_Z.capTall * (1 - Math.cos(t))
        const cracks = o.userData.cracks as THREE.Mesh
        const all = cracks.geometry.getAttribute('position').count / 6
        const n = Math.floor(all * prog(s.v?.[0] ?? 0, 0.5, 1))
        cracks.visible = n > 0
        cracks.geometry.setDrawRange(0, n * 6)
        break
      }
      default: break
    }
  }
}
