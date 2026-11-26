import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { BALL, PLUNGER, TIER_Y } from '../../layout'
import { zoneAt } from '../../draw'
import { local, whole, type Zone } from '../zone'
import { PLUNGE, drain, plunger } from './apron'
import { Geo } from './geo'
import { TUBE } from './kit'
import { LIFT, lift } from './lift'
import { FIN, TONE, drop, mesh, metalOf, tubeOf as clearTube } from './mats'
import { GATE, SLING, tier } from './tier'

export const VERSION = 'hardware-3'
const STEEL_BALLS = 8
const TURN = 0.34
// The lift's rings stand upright and are seen on their flat faces from the player's end, so they keep more of their tone.
const RING = 0.62
const SOFT = [FIN.rubber, FIN.gloss, FIN.satin]
const tubeOf = (z: Zone): THREE.Material => clearTube(z, TUBE.opacity)

const part = (o: THREE.Object3D, name: string): THREE.Object3D | undefined => o.children.find((c) => c.name === name)
const since = (ctx: RealContext, id: string): number => ctx.byId.get(id)?.v?.[0] ?? 9

function buildHardware(z: Zone): THREE.Object3D {
  const o = new THREE.Group()
  o.name = `hardware.${z.id}`
  const m = metalOf(z)
  if (z.tier >= 0) {
    const t = tier(z)
    o.add(mesh(t.G.turn(TURN, SOFT), m, 'hardware.static', { cast: true }))
    const all = t.S.mesh(m, 'hardware.screws')
    if (all) o.add(all)
    if (t.F.vertices > 0) o.add(mesh(t.F.turn(TURN, SOFT), m, 'hardware.fine', { fine: true }))
    const band = mesh(t.B, m, 'hardware.bands', { cast: true })
    band.userData.slings = t.slings
    o.add(band)
    const gate = mesh(t.gate.mesh, m, 'hardware.gate')
    gate.position.set(...t.gate.at)
    gate.rotation.x = GATE.shut
    o.add(gate)
    if (t.tip) {
      const tip = mesh(t.tip, m, 'hardware.tip', { cast: true })
      tip.position.set(...t.tipAt)
      tip.userData.home = t.tipAt[1]
      o.add(tip)
    }
    const ball = new Geo().f(FIN.chrome).ball(0, 0, 0, BALL / 2, 48, TONE.chrome)
    const balls = new THREE.InstancedMesh(ball.done(), m, STEEL_BALLS)
    balls.name = 'hardware.balls'
    balls.castShadow = true
    balls.receiveShadow = true
    balls.count = 0
    balls.frustumCulled = false
    o.add(balls)
  } else if (z.id === 'apron') {
    const p = mesh(plunger(z).turn(TURN, SOFT), m, 'hardware.plunger', { cast: true })
    o.add(p)
  } else if (z.id === 'last') {
    const d = drain(z)
    o.add(mesh(d.G.turn(TURN, SOFT), m, 'hardware.static', { cast: true }))
    const tube = mesh(d.C, tubeOf(z), 'hardware.tube')
    tube.renderOrder = 3
    o.add(tube)
    const sc = d.S.mesh(m, 'hardware.screws')
    if (sc) o.add(sc)
  }
  return o
}

const at = new THREE.Matrix4()

function poseHardware(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  if (z.tier >= 0) {
    const band = part(o, 'hardware.bands') as THREE.Mesh | undefined
    if (band?.morphTargetInfluences) {
      const ids = band.userData.slings as string[]
      for (let i = 0; i < ids.length; i++) {
        const t = since(ctx, `sling.${ids[i]}.3`)
        band.morphTargetInfluences[i] = t > 0.4 ? 0 : Math.exp(-SLING.decay * t) * Math.cos((2 * Math.PI * t) / SLING.period)
      }
    }
    const gate = part(o, 'hardware.gate')
    if (gate) gate.rotation.x = (ctx.byId.get(`gate.${z.tier}`)?.v?.[0] ?? 0) > 0.5 ? GATE.open : GATE.shut
    const tip = part(o, 'hardware.tip')
    if (tip) tip.position.y = (tip.userData.home as number) - pullOf(ctx) * PLUNGE.tip + ringOf(ctx)
    const balls = part(o, 'hardware.balls') as THREE.InstancedMesh | undefined
    if (balls) {
      let n = 0
      for (let i = 1; i <= STEEL_BALLS; i++) {
        const s = ctx.byId.get(`ball.steel.${i}`)
        if (!s || zoneAt(s.y + s.h / 2) !== z.id) continue
        const p = local(z, s.x + s.w / 2, s.y + s.h / 2, s.z0 + s.h / 2)
        at.makeRotationZ(i * 1.7).setPosition(p[0], p[1], p[2])
        balls.setMatrixAt(n++, at)
      }
      if (n > 0 || balls.count > 0) {
        balls.count = n
        balls.instanceMatrix.needsUpdate = true
      }
    }
  } else if (z.id === 'apron') {
    const p = part(o, 'hardware.plunger') as THREE.Mesh | undefined
    if (p?.morphTargetInfluences) p.morphTargetInfluences[0] = pullOf(ctx) - ringOf(ctx) / PLUNGE.travel
  }
}

const pullOf = (ctx: RealContext): number => ctx.byId.get('plunger.knob')?.v?.[0] ?? 0

// How far the plunger stands past its rest after a shot. It rings by how far the ball it struck has gone up the lane, so it keeps no clock.
function ringOf(ctx: RealContext): number {
  if (pullOf(ctx) > 0.001) return 0
  const b = ctx.byId.get('ball.clear')
  if (!b) return 0
  const x = (b.x + b.w / 2) / BALL
  const d = PLUNGER[1] - (b.y + b.h / 2) / BALL
  if (Math.abs(x - PLUNGER[0]) > 0.4 || d < 0.02 || d > TIER_Y[2]! - TIER_Y[0]!) return 0
  return PLUNGE.ring * Math.exp(-d / PLUNGE.fade) * Math.sin((2 * Math.PI * d) / PLUNGE.wave)
}

function buildLift(z: Zone): THREE.Object3D {
  const o = new THREE.Group()
  o.name = `lift.${z.id}`
  const m = metalOf(z)
  const l = lift(z)
  o.add(mesh(l.G.turn(RING, SOFT), m, 'lift.static', { cast: true }))
  const tube = mesh(l.C, tubeOf(z), 'lift.tube')
  tube.renderOrder = 3
  o.add(tube)
  const sc = l.S.mesh(m, 'lift.screws')
  if (sc) o.add(sc)
  if (l.flap) {
    const flap = mesh(l.flap, m, 'lift.flap', { cast: true })
    flap.position.set(...l.hinge)
    flap.rotation.y = LIFT.lean
    o.add(flap)
  }
  return o
}

function poseLift(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const flap = part(o, 'lift.flap')
  if (!flap) return
  const t = since(ctx, `lift.door.${z.id}`)
  flap.rotation.y = LIFT.lean + (t > 2 ? 0 : LIFT.swing * Math.exp(-LIFT.decay * t) * Math.abs(Math.cos(LIFT.beat * t)))
}

export const parts: Record<string, PartMaker | null> = {
  'table-hardware': whole('table-hardware', { version: VERSION, build: (z) => buildHardware(z), pose: poseHardware, drop }),
  'lift': whole('lift', { version: VERSION, build: (z) => buildLift(z), pose: poseLift, drop })
}
