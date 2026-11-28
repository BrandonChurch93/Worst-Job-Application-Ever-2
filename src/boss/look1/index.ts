import * as THREE from 'three'
import type { BossView } from '../view'
import type { Emitter } from '../../real/types'
import { buildModel, type Model } from './model'
import { CANNON, GUN, HATCH, SHIELD, WING, HULL } from './numbers'
import { BENT, DEFAULTS, K, poseOf, type LookOptions, type Pose } from './pose'
import { setGlow } from './kit'
import { makeFx, type Fx } from './fx'
import { poseGun } from './gun'

export { poseOf, muzzleOf, bigMuzzleOf, weakOf, wordAt, SIZE, K, FALL, FORM, GONE, TURRET, TIMES, WORD, DEFAULTS } from './pose'
export type { LookOptions, Pose } from './pose'
export { EVENTS } from './events'
export { makeGun, poseGun } from './gun'
export type { Gun, GunState } from './gun'

export interface BossLookContext extends Partial<LookOptions> {
  // The live site's level, or null for a computed picture with everything on.
  level?: 'low' | 'medium' | 'high' | null
}

export interface BossLook {
  object: THREE.Object3D
  pose(view: BossView, dt: number, light?: (e: Emitter) => void): void
  setLevel(level: 'low' | 'medium' | 'high' | null): void
  dispose(): void
}

function apply(m: Model, legsRoot: THREE.Group, p: Pose): void {
  const b = m.body
  b.position.set(0, 0, 0)
  b.rotation.set(0, 0, p.body.yaw)
  b.rotation.order = 'ZYX'
  const cy = Math.cos(p.body.yaw)
  const sy = Math.sin(p.body.yaw)
  b.position.set(p.body.x * cy - p.body.y * sy, p.body.x * sy + p.body.y * cy, p.body.z)
  b.rotation.set(p.body.roll, p.body.pitch, p.body.yaw)

  for (const o of [m.hull, m.bay, m.shield, ...m.wings, ...m.guns.map((g) => g.root), ...m.legs.flatMap((l) => [l.upper, l.lower, l.foot])]) o.scale.set(1, 1, 1)
  m.shield.rotation.set(0, 0, 0)
  for (const w of m.wings) w.rotation.set(0, 0, 0)
  m.hull.visible = p.hull.show
  m.hull.position.set(p.hull.x, p.hull.y, p.hull.z)
  m.bay.visible = p.hull.show
  m.bay.position.copy(m.hull.position)

  m.button.position.set(p.button.jx, p.button.jy, p.button.z)
  m.button.scale.set(p.button.sx, p.button.sy, 1)

  m.wings.forEach((w, i) => {
    const side = i === 0 ? 1 : -1
    const out = p.wings[i]!
    w.visible = p.hull.show && out > 0.001
    w.position.set(p.hull.x, p.hull.y - side * (1 - out) * (WING.reach + 6), p.hull.z - (1 - Math.min(1, out)) * 4)
    w.rotation.x = -side * 0.1 * p.sag
    w.position.z -= 10 * p.sag
  })

  m.hatch.visible = p.hull.show && p.hatch.gone < 1
  m.hatch.position.set(p.hatch.x + p.hull.x - 260 * p.hatch.gone, p.hull.y + 180 * p.hatch.gone, p.hatch.z + p.hull.z + 300 * Math.sin(Math.PI * p.hatch.gone))
  m.hatch.rotation.set(2 * p.hatch.gone, 3 * p.hatch.gone, 0)
  setGlow(m.seam, p.hatch.seam)

  m.shield.visible = p.shield.show
  m.shield.position.set(-(1 - p.shield.slide) * 110, 0, 0)
  m.shieldGlass.scale.set(1, 1, Math.max(0.02, p.shield.rise))
  m.shieldGlass.position.z = (1 - Math.max(0.02, p.shield.rise)) * (SHIELD.z0 + 18)
  m.shieldGlass.visible = p.shield.broken < 0.02
  m.shieldEdge.visible = m.shieldGlass.visible
  m.shieldEdge.position.z = -(1 - Math.max(0.02, p.shield.rise)) * (SHIELD.z1 - SHIELD.z0 - 18)
  const torn = p.damage >= 2
  m.shieldGlassB.scale.copy(m.shieldGlass.scale)
  m.shieldGlassB.position.z = m.shieldGlass.position.z
  m.shieldEdgeB.position.z = m.shieldEdge.position.z
  m.shieldGlassB.visible = m.shieldGlass.visible && !torn
  m.shieldEdgeB.visible = m.shieldGlassB.visible
  m.shieldStub.visible = torn && p.shield.rise >= 1
  m.crackB.visible = !torn

  m.guns.forEach((g, i) => {
    const q = p.guns[i]!
    const side = i === 0 ? 1 : -1
    const out = p.wings[i]!
    g.root.visible = p.hull.show && q.rise > 0.001
    g.root.position.set(GUN.x + p.hull.x, side * GUN.y + p.hull.y - side * (1 - out) * (WING.reach + 6), GUN.z - 3 + p.hull.z - (1 - q.rise) * 70)
    poseGun(g, q)
    const bent = p.damage >= (i === 0 ? 1 : 2) ? 1 : 0
    g.barrels.rotation.order = 'ZYX'
    g.barrels.rotation.z = bent * BENT.yaw * (i === 0 ? 1 : -1)
    g.barrels.rotation.y = bent * BENT.droop
    g.root.rotation.set(-side * 0.16 * p.sag, 0.2 * p.sag * side, 0)
    g.root.position.z -= 22 * p.sag
  })

  p.legs.forEach((l, i) => {
    const g = m.legs[i]!
    const on = l.show > 0
    g.upper.visible = on
    g.lower.visible = on
    g.foot.visible = on
    if (!on) return
    g.upper.position.set(...l.hip)
    g.upper.rotation.set(0, -l.up, l.yaw)
    g.lower.position.set(...l.knee)
    g.lower.rotation.set(0, -l.down, l.yaw2)
    g.foot.position.set(...l.foot)
    g.foot.rotation.set(0, 0, l.footYaw)
  })
  void legsRoot

  if (p.gone > 0) {
    const [wx, wy] = p.blow
    const cyaw = Math.cos(-p.body.yaw)
    const syaw = Math.sin(-p.body.yaw)
    const bx = wx * cyaw - wy * syaw
    const by = wx * syaw + wy * cyaw
    const fling = (o: THREE.Object3D, k: number, id: number, dx: number, dy: number, ox: number, oy: number): void => {
      if (k <= 0) return
      const e = k * k
      const d = Math.hypot(ox, oy) || 1
      o.position.x += (dx * 560 + (ox / d) * 220) * e
      o.position.y += (dy * 560 + (oy / d) * 220) * e
      o.position.z += 240 * Math.sin(Math.PI * Math.min(1, k * 0.8))
      o.rotation.x += (3 + id) * 0.9 * e
      o.rotation.y += (2 - id * 0.7) * e
      o.scale.setScalar(Math.max(0.001, 1 - e * e))
      if (k >= 1) o.visible = false
    }
    fling(m.shield, p.away.shield, 0, bx, by, 1, 0)
    m.wings.forEach((w, i) => fling(w, p.away.wings[i]!, 1 + i, bx, by, 0, i === 0 ? 1 : -1))
    m.guns.forEach((g, i) => fling(g.root, p.away.guns[i]!, 3 + i, bx, by, 0, i === 0 ? 1 : -1))
    p.legs.forEach((l, i) => {
      const g = m.legs[i]!
      for (const o of [g.upper, g.lower, g.foot]) fling(o, p.away.legs[i]!, 5 + i, wx, wy, l.foot[0] - l.hip[0], l.foot[1] - l.hip[1])
    })
    const h = p.away.hull
    if (h > 0) {
      const e = h * h
      for (const o of [m.hull, m.bay]) {
        o.scale.set(1 - 0.55 * e, 1 - 0.55 * e, Math.max(0.02, 1 - e))
        o.position.z -= 40 * e
        if (h >= 1) o.visible = false
      }
    }
  }

  const c = m.cannon
  c.carriage.visible = p.cannon.show
  if (p.cannon.show) {
    const o = p.cannon.off
    c.carriage.position.set(p.cannon.x - 520 * o, 240 * o, p.cannon.z + 520 * Math.sin(Math.PI * Math.min(1, o * 1.1)) - 140 * o)
    c.root.rotation.set(5 * o, -p.cannon.elev + 2.2 * o, p.cannon.yaw + 1.4 * o)
    c.ribs.position.x = p.cannon.ribs
    c.sleeve.position.x = p.cannon.sleeve
    c.barrel.position.x = p.cannon.barrel
    setGlow(c.window, p.cannon.window)
    setGlow(c.bore, p.cannon.bore)
    setGlow(c.slits, p.cannon.slits)
    c.heat.opacity = p.cannon.heat * 0.85
    setGlow(c.heat, 1 + 3 * p.cannon.heat)
  }
  setGlow(m.weak, p.weak)
  m.lids.forEach((l, i) => { l.position.y = (i === 0 ? -1 : 1) * 17 * p.weakOpen })
  m.slab.visible = p.weakOpen > 0
  m.hatchSeam.visible = p.weakOpen < 0.5
  const burnt = p.away.hull > 0.5
  m.damage[0].visible = p.damage >= 1 && !burnt
  m.damage[1].visible = p.damage >= 2 && !burnt
  m.damage[2].visible = p.damage >= 3 && !burnt
  void CANNON
  void HATCH
  void HULL
}

export function makeBoss(ctx: BossLookContext = {}): BossLook {
  const o: LookOptions = { seed: ctx.seed ?? DEFAULTS.seed, socket: ctx.socket ?? DEFAULTS.socket, home: ctx.home ?? DEFAULTS.home, ground: ctx.ground ?? DEFAULTS.ground, pit: ctx.pit ?? DEFAULTS.pit }
  const object = new THREE.Group()
  object.name = 'boss-look1'
  const figure = new THREE.Group()
  figure.scale.setScalar(K)
  const model = buildModel()
  figure.add(model.body)
  for (const l of model.legs) figure.add(l.upper, l.lower, l.foot)
  object.add(figure)
  const fx: Fx = makeFx(o, ctx.level ?? null)
  object.add(fx.object)
  const pose = (view: BossView, _dt: number, light?: (e: Emitter) => void): void => {
    const p = poseOf(view, o)
    figure.visible = p.shown
    figure.position.set(p.x, p.y, 0)
    if (p.shown) apply(model, figure, p)
    fx.pose(view, p, light)
  }
  const dispose = (): void => {
    fx.dispose()
    for (const mat of model.own) mat.dispose()
    for (const g of model.guns) g.dispose()
  }
  return { object, pose, setLevel: (l) => fx.setLevel(l), dispose }
}
