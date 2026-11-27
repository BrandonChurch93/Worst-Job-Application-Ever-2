import * as THREE from 'three'
import type { BossView } from '../view'
import type { Emitter } from '../../real/types'
import { buildModel, type Model } from './model'
import { CANNON, GUN, HATCH, SHIELD, WING, HULL } from './numbers'
import { DEFAULTS, K, poseOf, type LookOptions, type Pose } from './pose'
import { setGlow } from './kit'
import { makeFx, type Fx } from './fx'
import { poseGun } from './gun'

export { poseOf, muzzleOf, bigMuzzleOf, weakOf, wordAt, SIZE, K, FORM, TURRET, TIMES, DEFAULTS } from './pose'
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

  m.guns.forEach((g, i) => {
    const q = p.guns[i]!
    const side = i === 0 ? 1 : -1
    const out = p.wings[i]!
    g.root.visible = p.hull.show && q.rise > 0.001
    g.root.position.set(GUN.x + p.hull.x, side * GUN.y + p.hull.y - side * (1 - out) * (WING.reach + 6), GUN.z - 3 + p.hull.z - (1 - q.rise) * 70)
    poseGun(g, q)
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
  m.damage[0].visible = p.damage >= 1
  m.damage[1].visible = p.damage >= 2
  m.damage[2].visible = p.damage >= 3
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
