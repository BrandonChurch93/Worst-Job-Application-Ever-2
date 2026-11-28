import * as THREE from 'three'
import type { BossView } from '../view'
import type { Emitter } from '../../real/types'
import { buildModel, type Model } from './model'
import { CANNON, GUN, HATCH, SHIELD, WING, HULL } from './numbers'
import { BENT, DEFAULTS, FLY, K, LEFT, clamp01, poseOf, type LookOptions, type Pose } from './pose'
import { hash01 } from '../../core/random'
import { setGlow } from './kit'
import { makeFx, type Fx } from './fx'
import { poseGun } from './gun'
import { makeShade } from './shade'

export { poseOf, muzzleOf, bigMuzzleOf, weakOf, wordAt, buttonAt, SIZE, K, FALL, FORM, GONE, LEFT, PRESS, TURRET, TIMES, WORD, DEFAULTS } from './pose'
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
  const whole = m.shieldGlass.visible
  m.shieldStub.visible = whole && torn && p.shield.rise >= 1
  m.shieldGlass.visible = whole && !m.shieldStub.visible
  m.shieldEdge.visible = m.shieldGlass.visible
  m.shieldGlassB.visible = m.shieldGlass.visible
  m.shieldEdgeB.visible = m.shieldGlass.visible

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

  for (const q of m.plates) q.g.visible = false
  for (const g of m.left) g.visible = false
  m.rim.visible = false
  if (p.gone > 0) {
    const [wx, wy] = p.blow
    const cyaw = Math.cos(-p.body.yaw)
    const syaw = Math.sin(-p.body.yaw)
    const bx = wx * cyaw - wy * syaw
    const by = wx * syaw + wy * cyaw
    // A piece leaves to its own side of the beam first and is carried down it after: nothing crosses the button that stays.
    const fling = (o: THREE.Object3D, k: number, id: number, dx: number, dy: number, ox: number, oy: number): void => {
      if (k <= 0) return
      if (k >= 1) { o.visible = false; return }
      const e = k * k * (0.35 + 0.65 * k)
      const d = Math.hypot(ox, oy) || 1
      const h = (n: number): number => hash01(id, n, 77) - 0.5
      const across = ((ox / d) * -dy + (oy / d) * dx) + h(1) * 0.5
      const side = (Math.abs(across) < FLY.least ? (across < 0 || (across === 0 && h(2) < 0) ? -FLY.least : FLY.least) : across) * FLY.wide * Math.pow(k, 1.2)
      const back = Math.min(0, (ox / d) * dx + (oy / d) * dy) * FLY.wide * 0.25 * Math.sin(Math.PI * Math.min(1, k * 1.6))
      o.position.x += dx * (FLY.far * e + back) - dy * side
      o.position.y += dy * (FLY.far * e + back) + dx * side
      o.position.z += FLY.high * Math.sqrt(k)
      o.rotation.x += h(3) * 11 * e
      o.rotation.y += h(4) * 9 * e
      o.rotation.z += h(5) * 6 * e
    }
    fling(m.shield, p.away.shield, 0, bx, by, 1, 0)
    m.wings.forEach((w, i) => fling(w, p.away.wings[i]!, 1 + i, bx, by, 0, i === 0 ? 1 : -1))
    m.guns.forEach((g, i) => fling(g.root, p.away.guns[i]!, 3 + i, bx, by, 0, i === 0 ? 1 : -1))
    p.legs.forEach((l, i) => {
      const g = m.legs[i]!
      ;[g.upper, g.lower, g.foot].forEach((o, n) => fling(o, clamp01(p.away.legs[i]! * (1 + 0.12 * n) - 0.06 * n), 5 + i * 3 + n, wx, wy, l.foot[0] - l.hip[0], l.foot[1] - l.hip[1]))
    })
    fling(m.bay, p.away.bay, 20, bx, by, -0.4, 0.3)
    if (p.away.hull > 0) {
      m.hull.visible = false
      m.plates.forEach((q, i) => {
        q.g.visible = true
        q.g.position.set(q.at[0] + p.hull.x, q.at[1] + p.hull.y, q.at[2] + p.hull.z)
        q.g.rotation.set(0, 0, 0)
        const k = p.away.plates[i]!
        const jump = 1 - Math.pow(1 - Math.min(1, k * 3), 3)
        const d = Math.hypot(q.at[0], q.at[1]) || 1
        q.g.position.x += (q.at[0] / d) * FLY.burst[0] * jump
        q.g.position.y += (q.at[1] / d) * FLY.burst[1] * jump
        fling(q.g, k, 30 + i, bx, by, q.at[0], q.at[1])
      })
      m.rim.visible = true
    }
    if (p.left > 0) {
      const u = p.left
      m.left.forEach((g, i) => {
        const lie = LEFT.lie[i]!
        const e = 1 - (1 - u) * (1 - u)
        const hop = u < 1 ? 4 * u * (1 - u) : 0
        g.visible = true
        g.position.set((lie[0] / K) * e, (-lie[1] / K) * e, i === 0 ? -14 + 240 * hop : 2 + 240 * hop)
        g.scale.setScalar(i >= 2 ? 1.5 : i === 1 ? 1.25 : 1)
        g.rotation.set((1 - e) * (5 + i * 2), (1 - e) * (4 - i), lie[2] + (1 - e) * 3)
      })
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
  const burnt = p.gone > 0.08
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
  for (const g of model.left) figure.add(g)
  const shade = makeShade()
  figure.add(shade.object)
  for (const g of [model.hull, model.bay, model.hatch, model.shield, ...model.wings, model.cannon.barrel, ...model.legs.flatMap((l) => [l.upper, l.lower, l.foot])]) g.traverse((c) => { c.castShadow = false })
  model.button.traverse((c) => { c.castShadow = true })
  object.add(figure)
  const fx: Fx = makeFx(o, ctx.level ?? null)
  object.add(fx.object)
  const pose = (view: BossView, _dt: number, light?: (e: Emitter) => void): void => {
    const p = poseOf(view, o)
    figure.visible = p.shown
    figure.position.set(p.x, p.y, 0)
    if (p.shown) { apply(model, figure, p); shade.pose(p) }
    fx.pose(view, p, light)
  }
  const dispose = (): void => {
    fx.dispose()
    shade.dispose()
    for (const mat of model.own) mat.dispose()
    for (const g of model.guns) g.dispose()
  }
  return { object, pose, setLevel: (l) => fx.setLevel(l), dispose }
}
