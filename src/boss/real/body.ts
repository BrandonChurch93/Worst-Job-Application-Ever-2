import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { materials } from '../../shell/materials'
import { controls } from '../../shell/real/controls'
import { roundedRect, sweep, plateProfile } from '../../shell/solids'
import { config } from '../../config'
import { BODY_Z, FRAME, LEG, SHADE, SHIELD, SIDE, SIDE_OFF, CAP_W, CAP_H } from '../body'
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

function wing(flip: boolean): THREE.Group {
  const m = materials()
  const k = bossKit()
  const g = new THREE.Group()
  const turnZ = flip ? Math.PI : 0
  g.add(mesh(geo(`wing:${flip}`, () => cutPlate(wingOutline(), FRAME.tall, 3.4).rotateZ(turnZ)), k.plate))
  g.add(mesh(geo(`wingBed:${flip}`, () => cutPlate(bedOutline(), 9, 0.5).rotateZ(turnZ)), k.pocket, false))
  g.add(mesh(geo(`wingBright:${flip}`, () => joined([
    cutPlate(lipOutline(), 3, 1.1).translate(0, 0, FRAME.tall - 0.4).rotateZ(turnZ),
    ...WING_SCREWS.map(([x, y], i) => moved(screw(4.6, 1.8, i + (flip ? 9 : 0)), x, y, FRAME.tall).rotateZ(turnZ)),
    ...(flip ? [] : [-1, 1].flatMap((e) => [0, 1, 2].map((i) => moved(lying([[0, 0], [4.6, 0], [4.6, 9], [0, 9]], 20), e * 168 + 15 - i * 10.5, 0, FRAME.tall - 0.5))))
  ])), m.aluminiumEdge, false))
  const tail = mesh(geo(`tail:${flip}`, () => cutPlate(flip ? [[0, -34], [28, -20], [28, -0.3], [0, -0.3]] : [[0, 0.3], [28, 0.3], [28, 20], [0, 34]], 5, 1.1).translate(0, 0, 0.5)), k.plate, false)
  g.add(tail)
  g.userData.tail = tail
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
  const k = bossKit()
  const sign = i === 0 ? 1 : -1
  const root = new THREE.Group()
  const hw = SIDE.w / 2
  const hh = SIDE.h / 2
  const turnZ = i === 0 ? 0 : Math.PI
  root.add(mesh(geo(`side:${i}`, () => cutPlate([[-hw, -hh], [hw, -hh], [hw, -hh + 16], [hw - SIDE.lean, hh], [-hw + SIDE.lean, hh], [-hw, -hh + 16]], SIDE.tall, 3).rotateZ(turnZ)), k.plate))
  root.add(mesh(geo(`sideParts:${i}`, () => joined([
    moved(lathe([[46, 0], [46, 1.4], [44.6, 2.6], [42.4, 2.6], [42.4, 0]], 64), -10, 0, SIDE.tall),
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
  }), m.aluminiumEdge))
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
  const pin = mesh(geo('shieldPin', () => lying([[0, 0], [3.4, 0], [3.4, 170], [0, 170]], 20).rotateZ(Math.PI / 2).translate(0, 85, 0)), k.pin, false)
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

function poseShield(o: THREE.Object3D, s: Shape): void {
  const d = o.userData.s as { leaf: THREE.Group; pin: THREE.Mesh; tubes: THREE.Group[]; rods: THREE.Group[]; cracks: THREE.Mesh }
  const k = s.v?.[0] ?? 1
  const flat = s.v?.[1] ?? 0
  const hurt = s.v?.[5] ?? 0
  const stand = prog(k, 0.55, 1) * (1 - flat)
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
    const body = sweep(roundedRect(L + W, W, W / 2, 10), plateProfile(8, 2.2, 0, 4)).translate(L / 2, 0, -4)
    const under = sweep(roundedRect(L + W, W, W / 2, 10), [{ inset: 0, z: 0, out: 0, up: 1 }]).rotateX(Math.PI).translate(L / 2, 0, -4)
    const slot = sweep(roundedRect(L - 52, 10, 5, 6), [{ inset: 0, z: 3.9, out: 1, up: 0 }, { inset: 0, z: 4.7, out: 0.7, up: 0.7 }, { inset: 1.3, z: 5.5, out: 0, up: 1 }]).translate(L / 2, 0, 0)
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
  const foot = mesh(geo('foot', () => joined([
    lathe([[fr - 1.2, 0], [fr, 1.6], [fr, 8], [fr - 2, 10.2], [fr - 6, 10.2], [fr - 6.8, 9.2], [fr - 7.8, 10.8], [12, 11.8], [11, 10.4], [10, 12], [0, 12.4]], 52),
    new THREE.SphereGeometry(6.5, 24, 16).translate(0, 0, 11.5)
  ])), m.aluminiumSatin)
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
  const d = o.userData.l as { upper: THREE.Mesh; lower: THREE.Mesh; hip: THREE.Mesh; knee: THREE.Mesh; foot: THREE.Mesh; rod: THREE.Mesh }
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
  A.set(fx, fy, fz + 11)
  const far = H.distanceTo(A)
  const reach = Math.min(far, L * 2 - 1)
  U.copy(A).sub(H).normalize()
  const out = Math.sqrt(Math.max(0, L * L - (reach / 2) * (reach / 2)))
  const open = prog(k, 0.2, 0.9)
  N.set(-U.y, U.x, 0)
  if (N.lengthSq() < 1e-6) N.set(sx, 0, 0)
  N.normalize()
  if (N.x < 0) N.negate()
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
  root.add(controls.make({ ...s, id: 'boss-cap-button', part: 'shell', kind: 'capsule', role: 'button', tone: 'accent', w: CAP_W, h: CAP_H, z0: 0, z1: BODY_Z.capTall, rot: 0, v: undefined }, ctx))
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
        const cracks = o.userData.cracks as THREE.Mesh
        const all = cracks.geometry.getAttribute('position').count / 6
        const n = Math.floor(all * prog(s.v?.[0] ?? 0, 0.8, 1))
        cracks.visible = n > 0
        cracks.geometry.setDrawRange(0, n * 6)
        break
      }
      default: break
    }
  }
}
