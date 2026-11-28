import * as THREE from 'three'
import { roundedRect, sweep, plateProfile } from '../../shell/solids'
import { across, along, blot, boxAt, chamfer, clipTo, crackStar, cutPlate, cutTo, discAt, glowMaterial, hose, joined, lathe, lookKit, mesh, oct, pillOutline, plateAt, ringPlate, rod, screw, turnedAt, type V3 } from './kit'

// Everything here is in the units of the target sheets (px of the 1920 wide pictures), forward along +x, z up from the ground, the hull's centre over the origin.

import { hash01 } from '../../core/random'
import { makeGun, type Gun } from './gun'
import { BTN, CANNON, GUN, HATCH, HIPS, HULL, LEG, SHIELD, WING } from './numbers'

export interface LegParts { upper: THREE.Group; lower: THREE.Group; foot: THREE.Group }
export interface CannonParts { carriage: THREE.Group; root: THREE.Group; ribs: THREE.Group; sleeve: THREE.Group; barrel: THREE.Group; window: THREE.MeshBasicMaterial; bore: THREE.MeshBasicMaterial; slits: THREE.MeshBasicMaterial; heat: THREE.MeshBasicMaterial }
export interface Model {
  body: THREE.Group
  hull: THREE.Group
  wings: [THREE.Group, THREE.Group]
  button: THREE.Group
  hatch: THREE.Group
  seam: THREE.MeshBasicMaterial
  bay: THREE.Group
  shield: THREE.Group
  shieldGlass: THREE.Mesh
  lids: THREE.Mesh[]
  slab: THREE.Mesh
  hatchSeam: THREE.Mesh
  shieldEdge: THREE.Mesh
  shieldGlassB: THREE.Mesh
  shieldEdgeB: THREE.Mesh
  shieldStub: THREE.Mesh
  crackB: THREE.Mesh
  own: THREE.Material[]
  damage: [THREE.Group, THREE.Group, THREE.Group]
  guns: [Gun, Gun]
  legs: LegParts[]
  cannon: CannonParts
  weak: THREE.MeshBasicMaterial
  plates: { g: THREE.Group; at: [number, number, number] }[]
  rim: THREE.Group
  left: THREE.Group[]
}

const shared = new Map<string, THREE.BufferGeometry>()
const geo = (name: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry => {
  let g = shared.get(name)
  if (!g) {
    g = make()
    shared.set(name, g)
  }
  return g
}

const screwsAt = (at: [number, number][], z: number, r = 6.5, seed = 1): THREE.BufferGeometry => joined(at.map(([x, y], i) => screw(r, 3.2, seed * 31 + i).translate(x, y, z)))

function hullGeo(): { plate: THREE.BufferGeometry; dark: THREE.BufferGeometry; trim: THREE.BufferGeometry; bed: THREE.BufferGeometry; pins: THREE.BufferGeometry; joints: THREE.BufferGeometry } {
  const { hx, hy, c, top, tall, belly } = HULL
  const bezelOut = pillOutline(BTN.w + 52, BTN.h + 52, BTN.r + 24)
  const bezelIn = pillOutline(BTN.w + 12, BTN.h + 12, BTN.r + 5)
  const plate = chamfer(oct(hx, hy, c), top - tall, top, 5, 5)
  const dark = joined([
    plateAt(oct(hx + 4, hy + 4, c + 2), top - tall - 3, top - 6, 2),
    plateAt(oct(hx - 16, hy - 14, c - 6), belly, top - tall + 1, 5),
    plateAt(oct(hx - 60, hy - 40, 20), belly - 22, belly + 1, 5)
  ])
  const trim = ringPlate(bezelOut, bezelIn, 8, 5).translate(0, 0, top - 0.5)
  const bed = plateAt(pillOutline(BTN.w + 14, BTN.h + 14, BTN.r + 6), top - 0.4, top + 2, 0.5)
  const sc: [number, number][] = [[-268, -98], [268, -98], [-268, 98], [268, 98], [-150, -111], [150, -111], [-150, 111], [150, 111], [0, -111], [0, 111], [-272, 0], [272, 0]]
  const pins = screwsAt(sc, top, 5.8, 3)
  const joints = joined(HIPS.map(([x, y]) => discAt(30, x * 1.0, y * 0.92, LEG.hipZ - 26, LEG.hipZ + 24, 4)))
  return { plate, dark, trim, bed, pins, joints }
}

function wingGeo(side: number): { plate: THREE.BufferGeometry; dark: THREE.BufferGeometry; pins: THREE.BufferGeometry; base: THREE.BufferGeometry } {
  const y0 = HULL.hy - 14
  const y1 = HULL.hy + WING.reach
  const shape = (inset: number): [number, number][] => {
    const pts: [number, number][] = [[-WING.inner + inset, y0], [WING.inner - inset, y0], [WING.outer - inset * 0.8, y1 - inset - 14], [WING.outer - 14 - inset * 0.8, y1 - inset], [-WING.outer + 14 + inset * 0.8, y1 - inset], [-WING.outer + inset * 0.8, y1 - inset - 14]]
    return side > 0 ? pts : pts.map(([x, y]) => [x, -y] as [number, number]).reverse()
  }
  const plate = chamfer(shape(0), WING.top - 22, WING.top, 5, 5)
  const fins: THREE.BufferGeometry[] = [plateAt(shape(14), WING.top - 70, WING.top - 21, 4), plateAt(shape(-6), WING.top - 25, WING.top - 6, 2)]
  for (let i = 0; i < 6; i++) fins.push(plateAt(shape(8 - (i % 2) * 0), WING.top - 66 + i * 7, WING.top - 63 + i * 7, 1))
  const dark = joined(fins)
  const s = side
  const pins = screwsAt([[-150, s * (y0 + 22)], [150, s * (y0 + 22)], [-112, s * (y1 - 18)], [112, s * (y1 - 18)], [0, s * (y1 - 12)]], WING.top, 4.6, 5 + side)
  const base = joined([
    turnedAt([[0, 0], [GUN.baseR, 0], [GUN.baseR, 5], [GUN.baseR - 5, 9], [GUN.baseR - 13, 9], [GUN.baseR - 15, 5], [0, 5]], GUN.x, s * GUN.y, WING.top - 0.2, 48),
    screwsAt(Array.from({ length: 6 }, (_, i) => [GUN.x + Math.cos(i * 1.047 + 0.5) * (GUN.baseR - 9), s * GUN.y + Math.sin(i * 1.047 + 0.5) * (GUN.baseR - 9)] as [number, number]), WING.top + 8.6, 3.4, 9)
  ])
  return { plate, dark, pins, base }
}

function shieldArc(rIn: number, rOut: number, half: number, n = 22, t0 = -1, t1 = 1): [number, number][] {
  const cx = SHIELD.mid - SHIELD.r
  const phi = Math.asin(half / SHIELD.r)
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) { const a = phi * (t0 + (i / n) * (t1 - t0)); pts.push([cx + rOut * Math.cos(a), rOut * Math.sin(a)]) }
  for (let i = n; i >= 0; i--) { const a = phi * (t0 + (i / n) * (t1 - t0)); pts.push([cx + rIn * Math.cos(a), rIn * Math.sin(a)]) }
  return pts
}

function legGeo(): { upper: Record<string, THREE.BufferGeometry>; lower: Record<string, THREE.BufferGeometry>; foot: Record<string, THREE.BufferGeometry> } {
  const A = LEG.a
  const B = LEG.b
  // A slim link: two side rails with a rounded lug on each end, an axle through each lug, a ram and its rod between the rails, hoses beside the ram.
  const link = (len: number, R: number, deep: number): Record<string, THREE.BufferGeometry> => {
    const rail = (s: number): THREE.BufferGeometry[] => [
      cutPlate(pillOutline(len + R * 1.3, R * 0.5, R * 0.25, 5).map(([x, y]) => [x + len / 2, y + s * (R - R * 0.25)] as [number, number]), deep * 2, 3).translate(0, 0, -deep),
      discAt(R * 0.56, 0, s * (R - R * 0.3), -deep, deep + 3, 3, 20),
      discAt(R * 0.56, len, s * (R - R * 0.3), -deep, deep + 3, 3, 20)
    ]
    const ram = R * 0.36
    return {
      plate: joined([...rail(1), ...rail(-1), boxAt(len * 0.44, -R * 0.62, -deep + 4, len * 0.52, R * 0.62, deep - 2, 2)]),
      joint: joined([along([[0, len * 0.1], [ram * 0.7, len * 0.1], [ram, len * 0.14], [ram, len * 0.46], [ram * 0.8, len * 0.5], [0, len * 0.5]], 16), across(R * 0.3, R * 0.98, 2, 14), across(R * 0.3, R * 0.98, 2, 14).translate(len, 0, 0)]),
      pin: joined([along([[0, len * 0.5], [ram * 0.46, len * 0.5], [ram * 0.46, len * 0.9], [0, len * 0.9]], 10), discAt(R * 0.2, 0, R * 0.7, deep + 2, deep + 6, 1.2, 12), discAt(R * 0.2, 0, -R * 0.7, deep + 2, deep + 6, 1.2, 12), discAt(R * 0.2, len, R * 0.7, deep + 2, deep + 6, 1.2, 12), discAt(R * 0.2, len, -R * 0.7, deep + 2, deep + 6, 1.2, 12)]),
      dark: boxAt(R * 0.4, -R * 0.52, -deep + 1, len - R * 0.4, R * 0.52, -deep + 5, 1)
    }
  }
  const upper = {
    ...link(A, 50, 22),
    orange: joined([hose([[10, -12, 6], [A * 0.3, -17, 15], [A * 0.62, 15, 15], [A - 12, 12, 6]], 4.2, 20, 7), hose([[14, 13, 4], [A * 0.3, 17, 11], [A * 0.58, -15, 11], [A - 16, -12, 4]], 3.6, 20, 7)])
  }
  const lower = {
    ...link(B, 44, 20),
    orange: joined([hose([[12, 11, 5], [B * 0.3, 15, 13], [B * 0.6, -13, 12], [B - 18, -10, 5]], 3.8, 20, 7)])
  }
  // A claw of two short thick hooks: each leaves the ankle high, turns inward at its knuckle and sinks its tip into the ground.
  const hook = (side: number): THREE.BufferGeometry[] => {
    const root = cutPlate(pillOutline(74, 40, 20, 6).map(([x, y]) => [x + 30, y] as [number, number]), 34, 9).rotateY(0.16).translate(0, 0, 26)
    const tip = cutPlate(pillOutline(60, 34, 17, 6).map(([x, y]) => [x + 24, y] as [number, number]), 30, 9).rotateY(0.26).rotateZ(-side * 0.5).translate(60, 0, 8)
    return [root, tip].map((g) => g.rotateZ(side * 0.42).translate(0, side * 10, 0))
  }
  const foot = {
    plate: joined([...hook(1), ...hook(-1)]),
    joint: joined([boxAt(-34, -32, 6, 22, 32, 52, 7), across(14, 38, 2, 14).translate(0, 0, 46)]),
    pin: joined([discAt(6, 26, 30, 54, 58, 1.2, 10), discAt(6, 26, -30, 54, 58, 1.2, 10)]),
    dark: boxAt(-38, -24, 2, -30, 24, 30, 1)
  }
  return { upper, lower, foot }
}

function cannonGeo(): Record<string, THREE.BufferGeometry> {
  const C = CANNON
  const r = C.r
  const [b0, b1] = C.breech
  const breech = joined([
    along([[0, b0 - 6], [r.breech - 14, b0 - 6], [r.breech - 6, b0 + 4], [r.breech - 6, b0 + 30], [r.breech, b0 + 36], [r.breech, b1 - 46], [r.breech - 5, b1 - 40], [r.breech - 5, b1 - 14], [r.breech, b1 - 10], [r.breech, b1], [r.ribs - 2, b1 + 3], [0, b1 + 3]], 40),
    boxAt(b0 + 104, -56, 40, b0 + 214, 56, r.breech + 9, 5),
    boxAt(b0 - 20, -30, -30, b0 + 6, 30, 30, 4),
    boxAt(-30, -26, -22, b0 - 4, 26, 22, 5)
  ])
  const breechDark = joined([
    ringPlate(pillOutline(92, 92, 16, 5).map(([x, y]) => [x + b0 + 160, y] as [number, number]), pillOutline(72, 72, 10, 5).map(([x, y]) => [x + b0 + 160, y] as [number, number]), 5, 1.5).translate(0, 0, r.breech + 8),
    along([[r.breech + 0.6, b0 + 38], [r.breech + 2.5, b0 + 40], [r.breech + 2.5, b0 + 50], [r.breech + 0.6, b0 + 52]], 40),
    along([[r.breech + 0.6, b1 - 64], [r.breech + 2.5, b1 - 62], [r.breech + 2.5, b1 - 52], [r.breech + 0.6, b1 - 50]], 40)
  ])
  const window = new THREE.PlaneGeometry(72, 72, 12, 12).translate(b0 + 160, 0, r.breech + 11)
  {
    const pos = window.getAttribute('position')
    const col = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const d = Math.min(1, Math.hypot(pos.getX(i) - b0 - 160, pos.getY(i)) / 46)
      const k = (1 - d * d) * (1 - d * d)
      col.set([0.5 + 2.2 * k, 0.4 + 4.6 * k, 0.3 + 16 * k], i * 3)
    }
    window.setAttribute('color', new THREE.BufferAttribute(col, 3))
  }
  const slit = joined([-1, 1].flatMap((s) => [0, 1, 2].map((i) => boxAt(b1 - 38, -8, r.breech - 4.2, b1 - 18, 8, r.breech + 0.8, 0.4).rotateX(s * (0.5 + i * 0.36)))))
  const yoke = joined([across(38, 58, 4), across(20, 66, 3, 20)])
  const hoses = joined([-1, 1].flatMap((s) => [
    hose([[b0 + 6, s * 44, 26], [b0 - 40, s * 70, 30], [-20, s * 84, -6], [20, s * 74, -70]], 9, 28, 10),
    hose([[b0 + 6, s * 56, -10], [b0 - 34, s * 86, -16], [-6, s * 96, -44], [30, s * 88, -92]], 8, 28, 10)
  ]))
  const [r0, r1] = C.ribs
  const ribCore = along([[0, r0 - 200], [r.core, r0 - 200], [r.core, r1 - 6], [r.core - 6, r1], [0, r1]], 36)
  const ribs: THREE.BufferGeometry[] = []
  for (let i = 0; i < 7; i++) {
    const x = r0 + 12 + i * 31.5
    ribs.push(along([[r.core - 1, x], [r.ribs - 3, x], [r.ribs, x + 3], [r.ribs, x + 15], [r.ribs - 3, x + 18], [r.core - 1, x + 18]], 40))
  }
  const [s0, s1] = C.sleeve
  const sleeve = along([[0, s0 - 220], [r.sleeve, s0 - 220], [r.sleeve, s1 - 22], [r.sleeve + 5, s1 - 18], [r.sleeve + 5, s1 - 6], [r.sleeve - 3, s1], [0, s1]], 36)
  const [a0, a1] = C.barrel
  const [k0, k1] = C.brake
  const barrel = along([[0, a0 - 380], [r.barrel, a0 - 380], [r.barrel, k0 - 6], [r.barrel + 6, k0], [r.barrel + 6, k0 + 10], [r.brake - 3, k1 - 34], [r.brake, k1 - 28], [r.brake, k1 - 6], [r.brake - 3, k1], [r.barrel - 5, k1], [r.barrel - 5, k1 - 60]], 40)
  void a1
  const bore = along([[0, k1 - 58], [r.barrel - 4.8, k1 - 58]], 32)
  const glow = along([[0, k1 - 40], [r.barrel - 6.5, k1 - 40]], 32)
  const heat = along([[r.barrel + 0.5, k0 - 120], [r.barrel + 0.5, k0 - 8]], 32)
  return { breech, breechDark, window, slit, yoke, hoses, ribCore, ribs: joined(ribs), sleeve, barrel, bore, glow, heat }
}

export function buildModel(): Model {
  const kit = lookKit()
  const body = new THREE.Group()
  const hull = new THREE.Group()
  const hg = geo('hull', () => { const h = hullGeo(); shared.set('hull.dark', h.dark); shared.set('hull.trim', h.trim); shared.set('hull.bed', h.bed); shared.set('hull.pins', h.pins); shared.set('hull.joints', h.joints); return h.plate })
  hull.add(mesh(hg, kit.hull), mesh(shared.get('hull.dark')!, kit.dark), mesh(shared.get('hull.trim')!, kit.bezel), mesh(shared.get('hull.bed')!, kit.bed), mesh(shared.get('hull.pins')!, kit.pin), mesh(shared.get('hull.joints')!, kit.joint))
  body.add(hull)

  const wings = [1, -1].map((side) => {
    const g = new THREE.Group()
    const name = `wing${side}`
    const p = geo(name, () => { const w = wingGeo(side); shared.set(`${name}.dark`, w.dark); shared.set(`${name}.pins`, w.pins); shared.set(`${name}.base`, w.base); return w.plate })
    g.add(mesh(p, kit.wing), mesh(shared.get(`${name}.dark`)!, kit.dark), mesh(shared.get(`${name}.pins`)!, kit.pin), mesh(shared.get(`${name}.base`)!, kit.joint))
    body.add(g)
    return g
  }) as [THREE.Group, THREE.Group]

  const button = new THREE.Group()
  button.add(mesh(geo('button', () => sweep(roundedRect(BTN.w, BTN.h, BTN.r, 14), plateProfile(BTN.tall, 13, 0, 8))), kit.button))
  button.position.set(0, 0, BTN.z)
  body.add(button)

  const bay = new THREE.Group()
  const bo = oct(HATCH.hx, HATCH.hy, HATCH.c, HATCH.cx, 0)
  const bi = oct(HATCH.hx - 20, HATCH.hy - 20, HATCH.c - 8, HATCH.cx, 0)
  bay.add(
    mesh(geo('bay.frame', () => joined([ringPlate(bo, bi, 62, 3).translate(0, 0, HATCH.top - 70), plateAt(oct(22, 60, 8, HULL.hx - HULL.hx * 2 + 16, 0), HULL.top - 40, HULL.top - 12, 3)])), kit.plate),
    mesh(geo('bay.floor', () => joined([plateAt(bo, HATCH.top - 88, HATCH.top - 66, 3), boxAt(HATCH.cx - 60, -70, HATCH.top - 66, HATCH.cx + 50, -40, HATCH.top - 40, 3), boxAt(HATCH.cx - 30, 30, HATCH.top - 66, HATCH.cx + 60, 74, HATCH.top - 34, 3)])), kit.bed),
    mesh(geo('bay.hoses', () => joined([hose([[HATCH.cx + 70, -80, 110], [HATCH.cx + 20, -50, 124], [HATCH.cx - 40, -76, 112], [HATCH.cx - 80, -40, 104]], 7), hose([[HATCH.cx + 76, 60, 108], [HATCH.cx + 10, 86, 122], [HATCH.cx - 60, 60, 110]], 6)])), kit.orange)
  )
  body.add(bay)

  const hatch = new THREE.Group()
  const seam = glowMaterial(0xff7a1e, 1.6)
  const ho = oct(HATCH.hx - 3, HATCH.hy - 3, HATCH.c - 2)
  const hatchSeam = mesh(geo('hatch.seam', () => joined([boxAt(-HATCH.hx + 22, -2.6, -4.6, -24, 2.6, -2.4, 0.3), boxAt(-24, -2.6, -4.6, -19, 12, -2.4, 0.3), boxAt(-24, 7, -4.6, 44, 12, -2.4, 0.3), boxAt(40, -2.6, -4.6, 45, 12, -2.4, 0.3), boxAt(40, -2.6, -4.6, HATCH.hx - 22, 2.6, -2.4, 0.3)])), seam, false, false)
  hatch.add(
    mesh(geo('hatch.plate', () => joined([chamfer(ho, -14, -4, 10, 4.5), ringPlate(oct(HATCH.hx - 12, HATCH.hy - 12, HATCH.c - 6), oct(HATCH.hx - 19, HATCH.hy - 19, HATCH.c - 9), 3, 0.8).translate(0, 0, -4.4)])), kit.hatch),
    hatchSeam,
    mesh(geo('hatch.pins', () => screwsAt([[-80, -100], [80, -100], [-80, 100], [80, 100]], 0, 5, 7)), kit.pin)
  )
  const weak = glowMaterial(0xff2a12, 0)
  const lids = [-1, 1].map((side) => {
    const lid = mesh(geo(`hatch.lid${side}`, () => chamfer(oct(HATCH.hx - 20, 58, 14, 0, side * 64), -5, 0.6, 7, 3)), kit.hatch)
    hatch.add(lid)
    return lid
  })
  const slab = mesh(geo('hatch.weak', () => boxAt(-HATCH.hx + 26, -22, -5, HATCH.hx - 26, 22, -3.4, 0.3)), weak, false, false)
  hatch.add(slab)
  hatch.position.set(HATCH.cx, 0, HATCH.top)
  body.add(hatch)

  const shield = new THREE.Group()
  const CUT = -0.12
  const glassOf = (name: string, t0: number, t1: number): THREE.Mesh => {
    const g = mesh(geo(name, () => plateAt(shieldArc(SHIELD.r - SHIELD.thick, SHIELD.r, SHIELD.half, 14, t0, t1), SHIELD.z0 + 18, SHIELD.z1, 3)), kit.glass, true, false)
    g.renderOrder = 5
    g.userData.order = 5
    return g
  }
  const edgeOf = (name: string, t0: number, t1: number): THREE.Mesh => mesh(geo(name, () => plateAt(shieldArc(SHIELD.r - SHIELD.thick - 0.4, SHIELD.r + 0.4, SHIELD.half + 0.4, 14, t0, t1), SHIELD.z1 - 0.5, SHIELD.z1 + 3, 1.2)), kit.glassEdge, false, false)
  const shieldGlass = glassOf('shield.glass', CUT, 1)
  const shieldGlassB = glassOf('shield.glassB', -1, CUT)
  const shieldEdgeB = edgeOf('shield.edgeB', -1, CUT)
  // The glass at the last stage: the whole arc still stands, bitten along its top edge, so nothing is open that the rules do not honour.
  const bitten = (): [number, number][] => {
    const phi = Math.asin(SHIELD.half / SHIELD.r)
    const cx = SHIELD.mid - SHIELD.r
    const n = 60
    const bite = (i: number, id: number): number => { const h = hash01(i, id, 17); return h > 0.62 ? (h - 0.62) * 1.9 * SHIELD.thick : 0 }
    const pts: [number, number][] = []
    for (let i = 0; i <= n; i++) { const q = phi * (-1 + (2 * i) / n); const r = SHIELD.r - (i > 0 && i < n ? bite(i, 1) : 0); pts.push([cx + r * Math.cos(q), r * Math.sin(q)]) }
    for (let i = n; i >= 0; i--) { const q = phi * (-1 + (2 * i) / n); const r = SHIELD.r - SHIELD.thick + (i > 0 && i < n ? bite(i, 2) * 0.5 : 0); pts.push([cx + r * Math.cos(q), r * Math.sin(q)]) }
    return pts
  }
  const shieldStub = mesh(geo('shield.stub', () => plateAt(bitten(), SHIELD.z0 + 18, SHIELD.z1 - 8, 2)), kit.glass, true, false)
  shieldStub.renderOrder = 5
  shieldStub.userData.order = 5
  shieldStub.visible = false
  const hullFace = oct(HULL.hx - 5, HULL.hy - 5, HULL.c - 2)
  const wingFace = (side: number): [number, number][] => [[WING.inner - 12, side * (HULL.hy + 2)], [WING.outer - 8, side * (HULL.hy + WING.reach - 10)], [-WING.outer + 8, side * (HULL.hy + WING.reach - 10)], [-WING.inner + 12, side * (HULL.hy + 2)]]
  const struts: THREE.BufferGeometry[] = []
  for (const y of [-150, -52, 52, 150]) struts.push(rod([HULL.hx - 20 - Math.abs(y) * 0.12, y * 0.74, 132], [SHIELD.mid - SHIELD.thick - (y * y) / (2 * SHIELD.r) + 4, y, 118], 6.5, 10))
  const shieldEdge = edgeOf('shield.edge', CUT, 1)
  shield.add(
    shieldGlass,
    shieldEdge,
    shieldGlassB,
    shieldEdgeB,
    shieldStub,
    mesh(geo('shield.base', () => joined([plateAt(shieldArc(SHIELD.r - SHIELD.thick - 6, SHIELD.r + 5, SHIELD.half + 6), SHIELD.z0 - 22, SHIELD.z0 + 20, 3), ...[-1, 1].map((s) => boxAt(SHIELD.mid - 62, s * (SHIELD.half + 1) - 7, SHIELD.z0 - 22, SHIELD.mid - 24, s * (SHIELD.half + 1) + 7, SHIELD.z1 + 2, 2).rotateZ(0))])), kit.plate),
    mesh(geo('shield.struts', () => joined(struts)), kit.pin)
  )
  body.add(shield)

  const guns = [1, -1].map((side) => {
    const g = makeGun()
    g.root.position.set(GUN.x, side * GUN.y, GUN.z - 3)
    body.add(g.root)
    return g
  }) as [Gun, Gun]

  const lg = geo('leg', () => {
    const l = legGeo()
    for (const [part, set] of Object.entries(l)) for (const [name, g] of Object.entries(set as Record<string, THREE.BufferGeometry>)) shared.set(`leg.${part}.${name}`, g)
    return l.upper.plate!
  })
  void lg

  const legs: LegParts[] = HIPS.map(() => {
    const part = (name: string): THREE.Group => {
      const g = new THREE.Group()
      g.add(mesh(shared.get(`leg.${name}.plate`)!, kit.plateLight), mesh(shared.get(`leg.${name}.joint`)!, kit.limb), mesh(shared.get(`leg.${name}.pin`)!, kit.pin))
      const o = shared.get(`leg.${name}.orange`)
      if (o) g.add(mesh(o, kit.orange))
      const d = shared.get(`leg.${name}.dark`)
      if (d) g.add(mesh(d, kit.dark))
      g.rotation.order = 'ZYX'
      return g
    }
    return { upper: part('upper'), lower: part('lower'), foot: part('foot') }
  })

  const cg = geo('cannon', () => { const c = cannonGeo(); for (const [name, g] of Object.entries(c)) shared.set(`cannon.${name}`, g); return c.breech! })
  const c = (name: string): THREE.BufferGeometry => shared.get(`cannon.${name}`)!
  const carriage = new THREE.Group()
  const root = new THREE.Group()
  const window = glowMaterial(0xff7a14, 0.4)
  window.vertexColors = true
  const bore = glowMaterial(0xff9a3a, 0.05)
  const slits = glowMaterial(0xff8a22, 0.3)
  const heat = glowMaterial(0xff5a10, 0)
  heat.transparent = true
  heat.opacity = 0
  heat.depthWrite = false
  root.add(mesh(cg, kit.steel), mesh(c('breechDark'), kit.bed), mesh(c('window'), window, false, false), mesh(c('slit'), slits, false, false), mesh(c('yoke'), kit.joint), mesh(c('hoses'), kit.orange))
  const ribs = new THREE.Group()
  ribs.add(mesh(c('ribCore'), kit.steel), mesh(c('ribs'), kit.orange))
  const sleeve = new THREE.Group()
  sleeve.add(mesh(c('sleeve'), kit.steel))
  const barrel = new THREE.Group()
  const heatMesh = mesh(c('heat'), heat, false, false)
  heatMesh.scale.set(1, 1.02, 1.02)
  barrel.add(mesh(c('barrel'), kit.steel), mesh(c('bore'), kit.bore, false, false), mesh(c('glow'), bore, false, false), heatMesh)
  root.add(ribs, sleeve, barrel)
  root.rotation.order = 'ZYX'
  carriage.add(root)
  body.add(carriage)

  // What the fight leaves on him: soot and cracks from the first stage, torn plates and loose hoses from the second, char when he is beaten.
  const at = (g: THREE.BufferGeometry, x: number, y: number, z: number, turn = 0): THREE.BufferGeometry => g.rotateZ(turn).translate(x, y, z)
  const scorch = (seed: number, r: number, x: number, y: number, z: number): THREE.BufferGeometry[] => [at(blot(seed, r, 22), x, y, z), at(blot(seed + 50, r * 0.74, 20), x + r * 0.06, y - r * 0.05, z + 0.15), at(blot(seed + 90, r * 0.46, 16), x - r * 0.05, y + r * 0.04, z + 0.3)]
  const ember = glowMaterial(0xff5a14, 1.7)
  const star = (seed: number, arms: number, core: number, reach: number, wide: number, x: number, y: number, z: number): THREE.BufferGeometry => at(crackStar(seed, arms, (q) => [Math.cos(q) * core, Math.sin(q) * core], reach, wide), x, y, z)
  const onGlass = (seed: number, arms: number, reach: number, y: number): THREE.BufferGeometry => star(seed, arms, 4, reach, 4.6, SHIELD.mid - SHIELD.thick / 2 - (y * y) / (2 * SHIELD.r), y, SHIELD.z1 + 3.6)
  const inGlass = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => {
    const phi = Math.asin(SHIELD.half / SHIELD.r)
    const cx = SHIELD.mid - SHIELD.r
    const pt = (r: number, q: number): [number, number] => [cx + r * Math.cos(q), r * Math.sin(q)]
    const all = joined(parts)
    return joined([-1, 0].map((h) => clipTo(all, [pt(SHIELD.r - SHIELD.thick, h * phi), pt(SHIELD.r + 1, h * phi), pt(SHIELD.r + 1, (h + 1) * phi), pt(SHIELD.r - SHIELD.thick, (h + 1) * phi)])))
  }
  const onHull = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => clipTo(joined(parts), hullFace)
  const onWing = (side: number, parts: THREE.BufferGeometry[]): THREE.BufferGeometry => clipTo(joined(parts), wingFace(side))
  const HZ = HULL.top + 0.5
  const WZ = WING.top + 0.5
  const d1 = new THREE.Group()
  const crackB = mesh(geo('dmg1.crackB', () => inGlass([onGlass(37, 7, 84, -118), onGlass(39, 6, 60, -58)])), kit.glassCrack, false, false)
  d1.add(
    mesh(geo('dmg1.soot', () => joined([onHull([...scorch(1, 128, 215, 92, HZ), ...scorch(3, 80, 240, -96, HZ)]), onWing(1, scorch(2, 108, -105, 222, WZ))])), kit.soot, false, false),
    mesh(geo('dmg1.crack', () => joined([onHull([star(31, 8, 6, 100, 3.4, 215, 100, HZ + 0.5)]), onWing(1, [star(32, 7, 5, 80, 3, -105, 222, WZ + 0.5)])])), kit.crack, false, false),
    mesh(geo('dmg1.glass', () => inGlass([onGlass(36, 8, 96, 64), onGlass(40, 6, 64, 150)])), kit.glassCrack, false, false),
    crackB,
    mesh(geo('dmg1.ember', () => joined([onHull([star(41, 6, 3, 58, 2.6, 215, 100, HZ + 0.8)]), onWing(1, [star(42, 5, 3, 44, 2.2, -105, 222, WZ + 0.8)])])), ember, false, false),
    mesh(geo('dmg1.hole', () => joined([onHull([at(blot(8, 26, 9), 262, 100, HZ + 1)]), at(blot(9, 24, 9), -105, 222, WZ + 1)])), kit.bore, false, false)
  )
  const d2 = new THREE.Group()
  const hx = HATCH.cx + 10
  const hy = -HATCH.hy
  d2.add(
    mesh(geo('dmg2.soot', () => joined([onHull([...scorch(4, 118, 150, -104, HZ), ...scorch(6, 84, -40, 112, HZ)]), onWing(-1, scorch(5, 100, -100, -214, WZ))])), kit.soot, false, false),
    mesh(geo('dmg2.crack', () => joined([onHull([star(33, 8, 6, 112, 3.4, 150, -108, HZ + 0.5)]), onWing(-1, [star(34, 7, 5, 88, 3, -100, -214, WZ + 0.5)])])), kit.crack, false, false),
    mesh(geo('dmg2.glass', () => inGlass([onGlass(38, 7, 70, 10), onGlass(46, 7, 80, -150), onGlass(47, 6, 60, 110)])), kit.glassCrack, false, false),
    mesh(geo('dmg2.ember', () => joined([onHull([star(43, 7, 3, 70, 2.8, 150, -108, HZ + 0.8)]), onWing(-1, [star(44, 6, 3, 52, 2.4, -100, -214, WZ + 0.8)])])), ember, false, false),
    mesh(geo('dmg2.hole', () => joined([onHull([at(blot(18, 30, 9), 262, -100, HZ + 1)]), at(blot(19, 30, 9), -100, -214, WZ + 1), boxAt(hx - 62, hy + 6, HATCH.top + 0.6, hx + 62, hy + 60, HATCH.top + 1.6, 0.4)])), kit.bore, false, false),
    mesh(geo('dmg2.plate', () => joined([
      boxAt(-40, -30, 0, 40, 30, 6, 1.5).rotateY(-0.5).rotateZ(0.4).translate(258, 108, HULL.top + 14),
      boxAt(-32, -24, 0, 32, 24, 5, 1.2).rotateX(0.6).rotateZ(-0.3).translate(-150, 226, WING.top + 12),
      chamfer([[-66, -40], [66, -40], [66, 40], [-66, 40]], 0, 8, 6, 3).rotateX(0.95).rotateZ(0.16).translate(hx - 6, hy - 22, HATCH.top - 30)
    ])), kit.plate),
    mesh(geo('dmg2.hose', () => joined([hose([[226, 80, HULL.top - 4], [250, 60, HULL.top + 34], [292, 84, HULL.top + 26], [312, 124, HULL.top - 30]], 6.5, 16, 7), hose([[-150, 190, WING.top - 4], [-178, 204, WING.top + 26], [-202, 244, WING.top - 20]], 5.5, 12, 7), hose([[hx - 40, hy + 40, HATCH.top - 6], [hx - 20, hy + 14, HATCH.top + 16], [hx + 14, hy + 30, HATCH.top + 8], [hx + 36, hy + 12, HATCH.top - 10]], 5, 14, 7)])), kit.orange)
  )
  const d3 = new THREE.Group()
  d3.add(mesh(geo('dmg3.soot', () => joined([onHull([...scorch(11, 104, -262, -60, HZ), ...scorch(12, 100, 262, 40, HZ)]), onWing(-1, scorch(13, 96, 30, -212, WZ)), onWing(1, scorch(14, 90, -40, 208, WZ))])), kit.soot, false, false))
  d1.visible = false
  d2.visible = false
  d3.visible = false
  body.add(d1, d2, d3)

  const weakLamp = mesh(geo('weak', () => joined([discAt(11, HATCH.cx - HATCH.hx - 2, 0, 128, 140, 2, 18).rotateY(0), boxAt(HATCH.cx - HATCH.hx - 9, -34, 120, HATCH.cx - HATCH.hx - 4, 34, 146, 1.5)])), weak, false, false)
  bay.add(weakLamp)

  // The finishing blast: the hull in pieces along a fan of cuts, each piece turning about its own middle.
  const fan = [0.25, 1.1, 1.85, 2.8, 3.55, 4.4, 5.35]
  const mid: [number, number] = [-34, 14]
  const plates = fan.map((a0, i) => {
    const a1 = i + 1 < fan.length ? fan[i + 1]! : fan[0]! + Math.PI * 2
    const am = (a0 + a1) / 2
    const ray = (a: number, r: number): [number, number] => [mid[0] + Math.cos(a) * r, mid[1] + Math.sin(a) * r]
    const cut = [mid, ray(a0, 900), ray(am, 900), ray(a1, 900)]
    const at: [number, number, number] = [mid[0] + Math.cos(am) * 190, mid[1] + Math.sin(am) * 120, HULL.top - HULL.tall / 2]
    const piece = (name: string, from: string): THREE.BufferGeometry => geo(`${name}${i}`, () => cutTo(shared.get(from)!, cut).translate(-at[0], -at[1], -at[2]))
    const g = new THREE.Group()
    g.add(mesh(piece('piece', 'hull'), kit.hull), mesh(piece('piece.dark', 'hull.dark'), kit.dark), mesh(piece('piece.trim', 'hull.trim'), kit.bezel))
    g.rotation.order = 'ZYX'
    g.visible = false
    body.add(g)
    return { g, at }
  })

  // What is left: the button's own rim, scorched, and a claw, a bent plate and two bolts lying about.
  const rim = new THREE.Group()
  const rimOut = pillOutline(BTN.w + 38, BTN.h + 38, BTN.r + 17)
  rim.add(
    mesh(geo('rim', () => ringPlate(rimOut, pillOutline(BTN.w + 4, BTN.h + 4, BTN.r + 2), 12, 4)), kit.scorched),
    mesh(geo('rim.pins', () => joined([-0.36, -0.12, 0.12, 0.36].flatMap((k) => [1, -1].map((s2) => discAt(4.2, k * BTN.w, s2 * (BTN.h / 2 + 11), 11, 14, 1, 10))))), kit.pin)
  )
  rim.visible = false
  button.add(rim)
  const claw = legs[0]!.foot.clone()
  const bent = new THREE.Group()
  bent.add(mesh(geo('left.plate', () => joined([
    plateAt([[-70, -30], [6, -40], [10, 34], [-58, 30]], 0, 6, 2),
    plateAt([[0, -40], [62, -22], [84, 8], [56, 40], [0, 34]], 0, 6, 2).rotateY(-0.24).translate(8, 0, 1),
    plateAt([[-70, -30], [-58, 30], [-96, 12], [-90, -34]], 0, 6, 2).rotateY(0.18).translate(-4, 0, 0)
  ])), kit.wing))
  const bolt = (): THREE.Group => {
    const g = new THREE.Group()
    g.add(mesh(geo('left.bolt', () => joined([along([[0, -16], [6, -16], [6, 12], [0, 12]], 12), along([[0, 12], [10.5, 12], [10.5, 20], [0, 20]], 6)]).translate(0, 0, 10.5)), kit.steel))
    return g
  }
  const left = [claw, bent, bolt(), bolt()]
  for (const g of left) { g.rotation.order = 'ZYX'; g.visible = false }

  return { plates, rim, left, body, hull, wings, button, hatch, seam, bay, shield, shieldGlass, shieldEdge, shieldGlassB, shieldEdgeB, shieldStub, crackB, lids, slab, hatchSeam, damage: [d1, d2, d3], own: [seam, window, bore, slits, heat, weak, ember], guns, legs, cannon: { carriage, root, ribs, sleeve, barrel, window, bore, slits, heat }, weak }
}

