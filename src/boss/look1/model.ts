import * as THREE from 'three'
import { roundedRect, sweep, plateProfile } from '../../shell/solids'
import { across, along, boxAt, cutPlate, discAt, glowMaterial, hose, joined, lathe, lookKit, mesh, oct, pillOutline, plateAt, ringPlate, rod, screw, turnedAt, type V3 } from './kit'

// Everything here is in the units of the target sheets (px of the 1920 wide pictures), forward along +x, z up from the ground, the hull's centre over the origin.

import { BTN, CANNON, GUN, HATCH, HIPS, HULL, LEG, SHIELD, WING } from './numbers'

export interface LegParts { upper: THREE.Group; lower: THREE.Group; foot: THREE.Group }
export interface GunParts { root: THREE.Group; barrels: THREE.Group; lamp: THREE.MeshBasicMaterial; flash: THREE.Mesh }
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
  shieldEdge: THREE.Mesh
  own: THREE.Material[]
  guns: [GunParts, GunParts]
  legs: LegParts[]
  cannon: CannonParts
  weak: THREE.MeshBasicMaterial
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
  const bezelOut = pillOutline(BTN.w + 40, BTN.h + 40, BTN.r + 18)
  const bezelIn = pillOutline(BTN.w + 12, BTN.h + 12, BTN.r + 5)
  const plate = joined([
    plateAt(oct(hx, hy, c), top - tall, top - 5, 3),
    plateAt(oct(hx - 11, hy - 11, c - 5), top - 6, top, 2.5)
  ])
  const dark = joined([
    plateAt(oct(hx - 16, hy - 14, c - 6), belly, top - tall + 1, 5),
    plateAt(oct(hx - 60, hy - 40, 20), belly - 22, belly + 1, 5)
  ])
  const trim = ringPlate(bezelOut, bezelIn, 7, 2.2).translate(0, 0, top - 0.5)
  const bed = plateAt(pillOutline(BTN.w + 14, BTN.h + 14, BTN.r + 6), top - 0.4, top + 2, 0.5)
  const sc: [number, number][] = [[-268, -98], [268, -98], [-268, 98], [268, 98], [-150, -111], [150, -111], [-150, 111], [150, 111], [0, -111], [0, 111], [-272, 0], [272, 0]]
  const pins = screwsAt(sc, top, 6.5, 3)
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
  const plate = joined([plateAt(shape(0), WING.top - 22, WING.top - 5, 3), plateAt(shape(11), WING.top - 6, WING.top, 2.5)])
  const fins: THREE.BufferGeometry[] = [plateAt(shape(14), WING.top - 70, WING.top - 21, 4)]
  for (let i = 0; i < 6; i++) fins.push(plateAt(shape(8 - (i % 2) * 0), WING.top - 66 + i * 7, WING.top - 63 + i * 7, 1))
  const dark = joined(fins)
  const s = side
  const pins = screwsAt([[-150, s * (y0 + 22)], [150, s * (y0 + 22)], [-112, s * (y1 - 18)], [112, s * (y1 - 18)], [0, s * (y1 - 12)]], WING.top, 6, 5 + side)
  const base = joined([
    turnedAt([[0, 0], [GUN.baseR, 0], [GUN.baseR, 5], [GUN.baseR - 5, 9], [GUN.baseR - 13, 9], [GUN.baseR - 15, 5], [0, 5]], GUN.x, s * GUN.y, WING.top - 0.2, 48),
    screwsAt(Array.from({ length: 6 }, (_, i) => [GUN.x + Math.cos(i * 1.047 + 0.5) * (GUN.baseR - 9), s * GUN.y + Math.sin(i * 1.047 + 0.5) * (GUN.baseR - 9)] as [number, number]), WING.top + 8.6, 3.4, 9)
  ])
  return { plate, dark, pins, base }
}

function gunGeo(): { housing: THREE.BufferGeometry; dark: THREE.BufferGeometry; pin: THREE.BufferGeometry; barrels: THREE.BufferGeometry; barrelDark: THREE.BufferGeometry } {
  const a = GUN.axis
  const housing = joined([
    turnedAt([[0, 0], [45, 0], [45, 6], [40, 10], [0, 10]], 0, 0, 0, 40),
    boxAt(-52, -24, 8, 46, 24, a + 15, 4),
    boxAt(-64, -15, 12, -50, 15, a + 9, 2),
    boxAt(-30, 24, 10, 26, 40, a + 6, 2.5),
    boxAt(-20, -36, 12, 12, -24, a + 2, 2),
    along([[0, 44], [22, 44], [24, 48], [24, 58], [19, 62], [0, 62]], 24).translate(0, 0, a)
  ])
  const dark = joined([boxAt(-40, -17, a + 14.5, 30, 17, a + 19, 1.5), boxAt(-26, 26, a + 5.5, 22, 38, a + 9, 1)])
  const pin = joined([across(6, 28, 1.5, 12).translate(-36, 0, a + 4), screwsAt([[-44, -17], [-44, 17], [36, -17], [36, 17]], a + 19, 3, 11)])
  const bs: THREE.BufferGeometry[] = []
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * Math.PI * 2
    bs.push(along([[0, 56], [4.6, 56], [4.6, 168], [0, 168]], 8).translate(0, Math.cos(an) * 11, Math.sin(an) * 11))
  }
  bs.push(along([[5, 84], [18, 84], [18, 91], [5, 91]], 20), along([[5, 128], [18, 128], [18, 135], [5, 135]], 20))
  bs.push(along([[0, 150], [17, 150], [20.5, 156], [20.5, GUN.reach - 4], [18, GUN.reach], [13, GUN.reach], [13, GUN.reach - 14]], 24))
  const barrels = joined(bs)
  const barrelDark = along([[0, GUN.reach - 15], [13.2, GUN.reach - 15]], 20)
  return { housing, dark, pin, barrels, barrelDark }
}

function shieldArc(rIn: number, rOut: number, half: number, n = 22): [number, number][] {
  const cx = SHIELD.mid - SHIELD.r
  const phi = Math.asin(half / SHIELD.r)
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) { const a = -phi + (i / n) * 2 * phi; pts.push([cx + rOut * Math.cos(a), rOut * Math.sin(a)]) }
  for (let i = n; i >= 0; i--) { const a = -phi + (i / n) * 2 * phi; pts.push([cx + rIn * Math.cos(a), rIn * Math.sin(a)]) }
  return pts
}

function legGeo(): { upper: Record<string, THREE.BufferGeometry>; lower: Record<string, THREE.BufferGeometry>; foot: Record<string, THREE.BufferGeometry> } {
  const A = LEG.a
  const B = LEG.b
  const side = (len: number, y: number, w: number, h: number): THREE.BufferGeometry => {
    const pts: [number, number][] = [[-h * 0.5, -h * 0.5], [len * 0.2, -h * 0.62], [len * 0.8, -h * 0.5], [len + h * 0.4, -h * 0.4], [len + h * 0.4, h * 0.4], [len * 0.8, h * 0.5], [len * 0.2, h * 0.62], [-h * 0.5, h * 0.5]]
    const g = cutPlate(pts, w, 1.6)
    g.rotateX(Math.PI / 2)
    g.translate(0, y + w / 2, 0)
    return g
  }
  const upper = {
    plate: joined([side(A, -21, 9, 50), side(A, 21, 9, 50), boxAt(A * 0.3, -18, -8, A * 0.72, 18, 4, 2)]),
    joint: joined([across(31, 30, 3).translate(0, 0, 0), across(13, 34, 2, 16).translate(A * 0.5, 0, -2)]),
    pin: joined([across(9, 33, 1.5, 12), rod([A * 0.16, 0, 12], [A * 0.86, 0, 14], 5.5, 10), rod([A * 0.16, 0, 12], [A * 0.5, 0, 13], 8.5, 12)]),
    orange: joined([hose([[8, -9, 20], [A * 0.3, -10, 34], [A * 0.7, -8, 30], [A - 6, -9, 20]], 5.2), hose([[10, 9, 18], [A * 0.35, 11, 30], [A * 0.72, 9, 27], [A - 4, 9, 18]], 4.4)])
  }
  const lower = {
    plate: joined([side(B, -15, 8, 40), side(B, 15, 8, 40), boxAt(B * 0.5, -12, -6, B * 0.86, 12, 5, 2)]),
    joint: joined([across(34, 27, 3), across(22, 31, 2, 20)]),
    pin: joined([across(10, 34, 1.5, 12), rod([B * 0.12, 0, 6], [B * 0.92, 0, 4], 6, 10), rod([B * 0.4, 0, 5], [B * 0.92, 0, 4], 9.5, 12)]),
    orange: joined([hose([[6, 0, 26], [B * 0.25, 5, 30], [B * 0.55, -4, 20], [B * 0.8, 0, 14]], 4.6)])
  }
  const toe = (ang: number, len: number, w: number): THREE.BufferGeometry => {
    const pts: [number, number][] = [[10, -w / 2], [len * 0.7, -w / 2], [len, -w * 0.18], [len, w * 0.18], [len * 0.7, w / 2], [10, w / 2]]
    return cutPlate(pts, 20, 3).rotateZ(ang)
  }
  const foot = {
    plate: joined([toe(0.34, 96, 26), toe(-0.34, 96, 26), toe(Math.PI, 58, 30), toe(1.75, 52, 20), toe(-1.75, 52, 20)]),
    joint: joined([discAt(34, 0, 0, 0, 26, 4), across(24, 22, 3).translate(0, 0, LEG.ankle)]),
    pin: joined([across(8, 26, 1.5, 12).translate(0, 0, LEG.ankle), screwsAt([[18, 0], [-9, 15.6], [-9, -15.6]], 26, 4, 21)])
  }
  return { upper, lower, foot }
}

function cannonGeo(): Record<string, THREE.BufferGeometry> {
  const C = CANNON
  const r = C.r
  const [b0, b1] = C.breech
  const breech = joined([
    along([[0, b0 - 6], [r.breech - 14, b0 - 6], [r.breech - 6, b0 + 4], [r.breech - 6, b0 + 30], [r.breech, b0 + 36], [r.breech, b1 - 46], [r.breech - 5, b1 - 40], [r.breech - 5, b1 - 14], [r.breech, b1 - 10], [r.breech, b1], [r.ribs - 2, b1 + 3], [0, b1 + 3]], 40),
    boxAt(b0 + 92, -62, 40, b0 + 222, 62, r.breech + 9, 5),
    boxAt(b0 - 20, -30, -30, b0 + 6, 30, 30, 4),
    boxAt(-30, -26, -22, b0 - 4, 26, 22, 5)
  ])
  const breechDark = joined([
    ringPlate([[b0 + 100, -54], [b0 + 214, -54], [b0 + 214, 54], [b0 + 100, 54]], [[b0 + 112, -42], [b0 + 202, -42], [b0 + 202, 42], [b0 + 112, 42]], 5, 1).translate(0, 0, r.breech + 8),
    along([[r.breech + 0.6, b0 + 38], [r.breech + 2.5, b0 + 40], [r.breech + 2.5, b0 + 50], [r.breech + 0.6, b0 + 52]], 40),
    along([[r.breech + 0.6, b1 - 64], [r.breech + 2.5, b1 - 62], [r.breech + 2.5, b1 - 52], [r.breech + 0.6, b1 - 50]], 40)
  ])
  const window = boxAt(b0 + 113, -41, r.breech + 7, b0 + 201, 41, r.breech + 11, 0.5)
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
  const barrel = along([[0, a0 - 380], [r.barrel, a0 - 380], [r.barrel, k0 - 8], [r.brake - 3, k0], [r.brake, k0 + 6], [r.brake, k1 - 30], [r.brake + 5, k1 - 6], [r.brake + 3, k1], [r.barrel - 4, k1], [r.barrel - 4, k1 - 60]], 40)
  void a1
  const bore = along([[0, k1 - 58], [r.barrel - 3.8, k1 - 58]], 32)
  const glow = along([[0, k1 - 40], [r.barrel - 6, k1 - 40]], 32)
  const heat = along([[r.barrel + 0.5, k0 - 120], [r.barrel + 0.5, k0 - 8]], 32)
  return { breech, breechDark, window, slit, yoke, hoses, ribCore, ribs: joined(ribs), sleeve, barrel, bore, glow, heat }
}

export function buildModel(): Model {
  const kit = lookKit()
  const body = new THREE.Group()
  const hull = new THREE.Group()
  const hg = geo('hull', () => { const h = hullGeo(); shared.set('hull.dark', h.dark); shared.set('hull.trim', h.trim); shared.set('hull.bed', h.bed); shared.set('hull.pins', h.pins); shared.set('hull.joints', h.joints); return h.plate })
  hull.add(mesh(hg, kit.plate), mesh(shared.get('hull.dark')!, kit.dark), mesh(shared.get('hull.trim')!, kit.housing), mesh(shared.get('hull.bed')!, kit.bed), mesh(shared.get('hull.pins')!, kit.pin), mesh(shared.get('hull.joints')!, kit.joint))
  body.add(hull)

  const wings = [1, -1].map((side) => {
    const g = new THREE.Group()
    const name = `wing${side}`
    const p = geo(name, () => { const w = wingGeo(side); shared.set(`${name}.dark`, w.dark); shared.set(`${name}.pins`, w.pins); shared.set(`${name}.base`, w.base); return w.plate })
    g.add(mesh(p, kit.plate), mesh(shared.get(`${name}.dark`)!, kit.dark), mesh(shared.get(`${name}.pins`)!, kit.pin), mesh(shared.get(`${name}.base`)!, kit.joint))
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
  hatch.add(
    mesh(geo('hatch.plate', () => joined([plateAt(ho, -14, -4, 3), ringPlate(oct(HATCH.hx - 12, HATCH.hy - 12, HATCH.c - 6), oct(HATCH.hx - 19, HATCH.hy - 19, HATCH.c - 9), 3, 0.8).translate(0, 0, -4.4), plateAt(oct(HATCH.hx - 20, 58, 14, 0, -64), -5, 0, 2), plateAt(oct(HATCH.hx - 20, 58, 14, 0, 64), -5, 0, 2)])), kit.plateLight),
    mesh(geo('hatch.seam', () => joined([boxAt(-HATCH.hx + 22, -2.6, -4.6, -24, 2.6, -2.4, 0.3), boxAt(-24, -2.6, -4.6, -19, 12, -2.4, 0.3), boxAt(-24, 7, -4.6, 44, 12, -2.4, 0.3), boxAt(40, -2.6, -4.6, 45, 12, -2.4, 0.3), boxAt(40, -2.6, -4.6, HATCH.hx - 22, 2.6, -2.4, 0.3)])), seam, false, false),
    mesh(geo('hatch.pins', () => screwsAt([[-80, -100], [80, -100], [-80, 100], [80, 100]], 0, 5, 7)), kit.pin)
  )
  hatch.position.set(HATCH.cx, 0, HATCH.top)
  body.add(hatch)

  const shield = new THREE.Group()
  const shieldGlass = mesh(geo('shield.glass', () => plateAt(shieldArc(SHIELD.r - SHIELD.thick, SHIELD.r, SHIELD.half), SHIELD.z0 + 18, SHIELD.z1, 3)), kit.glass, true, false)
  shieldGlass.renderOrder = 5
  shieldGlass.userData.order = 5
  const struts: THREE.BufferGeometry[] = []
  for (const y of [-150, -52, 52, 150]) struts.push(rod([HULL.hx - 20 - Math.abs(y) * 0.12, y * 0.74, 132], [SHIELD.mid - SHIELD.thick - (y * y) / (2 * SHIELD.r) + 4, y, 118], 6.5, 10))
  const shieldEdge = mesh(geo('shield.edge', () => plateAt(shieldArc(SHIELD.r - SHIELD.thick - 0.4, SHIELD.r + 0.4, SHIELD.half + 0.4), SHIELD.z1 - 0.5, SHIELD.z1 + 3, 1.2)), kit.glassEdge, false, false)
  shield.add(
    shieldGlass,
    shieldEdge,
    mesh(geo('shield.base', () => joined([plateAt(shieldArc(SHIELD.r - SHIELD.thick - 6, SHIELD.r + 5, SHIELD.half + 6), SHIELD.z0 - 22, SHIELD.z0 + 20, 3), ...[-1, 1].map((s) => boxAt(SHIELD.mid - 62, s * (SHIELD.half + 1) - 7, SHIELD.z0 - 22, SHIELD.mid - 24, s * (SHIELD.half + 1) + 7, SHIELD.z1 + 2, 2).rotateZ(0))])), kit.plate),
    mesh(geo('shield.struts', () => joined(struts)), kit.pin)
  )
  body.add(shield)

  const gg = geo('gun', () => { const g = gunGeo(); shared.set('gun.dark', g.dark); shared.set('gun.pin', g.pin); shared.set('gun.barrels', g.barrels); shared.set('gun.bore', g.barrelDark); return g.housing })
  const guns = [1, -1].map((side) => {
    const root = new THREE.Group()
    const lamp = glowMaterial(0xff5a14, 0.2)
    const barrels = new THREE.Group()
    barrels.add(mesh(shared.get('gun.barrels')!, kit.joint), mesh(shared.get('gun.bore')!, kit.bore, false, false))
    barrels.position.z = GUN.axis
    const flash = mesh(geo('gun.flash', () => joined([along([[0, 0], [16, 6], [30, 40], [14, 110], [0, 150]], 12), along([[0, -4], [44, 8], [0, 22]], 12)])), glowMaterial(0xffb060, 5), false, false)
    flash.position.set(GUN.reach, 0, GUN.axis)
    flash.visible = false
    root.add(mesh(gg, kit.housing), mesh(shared.get('gun.dark')!, kit.bed), mesh(shared.get('gun.pin')!, kit.pin), barrels, flash, mesh(geo('gun.lamp', () => discAt(5.5, -22, 0, GUN.axis + 18.5, GUN.axis + 21.5, 0.8, 14)), lamp, false, false))
    root.position.set(GUN.x, side * GUN.y, GUN.z - 3)
    body.add(root)
    return { root, barrels, lamp, flash }
  }) as [GunParts, GunParts]

  const lg = geo('leg', () => {
    const l = legGeo()
    for (const [part, set] of Object.entries(l)) for (const [name, g] of Object.entries(set as Record<string, THREE.BufferGeometry>)) shared.set(`leg.${part}.${name}`, g)
    return l.upper.plate!
  })
  void lg
  const legs: LegParts[] = HIPS.map(() => {
    const part = (name: string): THREE.Group => {
      const g = new THREE.Group()
      g.add(mesh(shared.get(`leg.${name}.plate`)!, kit.plateLight), mesh(shared.get(`leg.${name}.joint`)!, kit.joint), mesh(shared.get(`leg.${name}.pin`)!, kit.pin))
      const o = shared.get(`leg.${name}.orange`)
      if (o) g.add(mesh(o, kit.orange))
      g.rotation.order = 'ZYX'
      return g
    }
    return { upper: part('upper'), lower: part('lower'), foot: part('foot') }
  })

  const cg = geo('cannon', () => { const c = cannonGeo(); for (const [name, g] of Object.entries(c)) shared.set(`cannon.${name}`, g); return c.breech! })
  const c = (name: string): THREE.BufferGeometry => shared.get(`cannon.${name}`)!
  const carriage = new THREE.Group()
  const root = new THREE.Group()
  const window = glowMaterial(0xff8a1c, 0.4)
  const bore = glowMaterial(0xff9a3a, 0.05)
  const slits = glowMaterial(0xffa23a, 0.3)
  const heat = glowMaterial(0xff5a10, 0)
  heat.transparent = true
  heat.opacity = 0
  heat.depthWrite = false
  root.add(mesh(cg, kit.housing), mesh(c('breechDark'), kit.bed), mesh(c('window'), window, false, false), mesh(c('slit'), slits, false, false), mesh(c('yoke'), kit.joint), mesh(c('hoses'), kit.orange))
  const ribs = new THREE.Group()
  ribs.add(mesh(c('ribCore'), kit.dark), mesh(c('ribs'), kit.orange))
  const sleeve = new THREE.Group()
  sleeve.add(mesh(c('sleeve'), kit.housing))
  const barrel = new THREE.Group()
  const heatMesh = mesh(c('heat'), heat, false, false)
  heatMesh.scale.set(1, 1.02, 1.02)
  barrel.add(mesh(c('barrel'), kit.joint), mesh(c('bore'), kit.bore, false, false), mesh(c('glow'), bore, false, false), heatMesh)
  root.add(ribs, sleeve, barrel)
  root.rotation.order = 'ZYX'
  carriage.add(root)
  body.add(carriage)

  const weak = glowMaterial(0xff3a1a, 0)
  const weakLamp = mesh(geo('weak', () => joined([discAt(11, HATCH.cx - HATCH.hx - 2, 0, 128, 140, 2, 18).rotateY(0), boxAt(HATCH.cx - HATCH.hx - 9, -34, 120, HATCH.cx - HATCH.hx - 4, 34, 146, 1.5)])), weak, false, false)
  bay.add(weakLamp)

  return { body, hull, wings, button, hatch, seam, bay, shield, shieldGlass, shieldEdge, own: [seam, window, bore, slits, heat, weak, ...guns.map((g) => g.lamp)], guns, legs, cannon: { carriage, root, ribs, sleeve, barrel, window, bore, slits, heat }, weak }
}

