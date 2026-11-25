import RAPIER from '@dimforge/rapier2d-deterministic-compat'
import { config } from '../config'
import { COLS, FLIP, GRAVITY, MID, MOUTH, OUTLANE, R, TH, TIERS, TIER_Y, floorZ, holdOf, railAt, railLength, railOf, table, tierAt, type V } from './layout'

let ready = false
export async function prepare(): Promise<void> {
  if (ready) return
  await RAPIER.init()
  ready = true
}

export type BallMode = 'none' | 'plane' | 'rail' | 'hold' | 'tow'
export interface BallState {
  mode: BallMode; steel: boolean; x: number; y: number; z: number; vx: number; vy: number; tier: number
  rail: string; s: number; speed: number; hold: string; wait: number; tx: number; ty: number; then: string; cool: number
}
export interface TableEvent { name: string; ball: number; id: string; x: number; y: number }
export interface MachineState {
  snap: string; balls: BallState[]; flip: [number, number]; held: [boolean, boolean]; down: boolean[]; bank: number[]; cool: number[]; gate: boolean[]; on: Record<string, boolean>
  mom: boolean; saves: number; magnet: [number, number, number] | null; score: number; steps: number
}

const DEG = 0.017453292519943295
const BALLS = 1 + config.live.pinball.extraBallsInReplyAll
const HZ = config.sim.stepHz
const DT = 1 / HZ
const MAX_SPEED = 30
const FOREVER = 1e9

const toBase64 = (bytes: Uint8Array): string => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const fromBase64 = (text: string): Uint8Array => {
  const s = atob(text)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}
const distSeg = (px: number, py: number, a: V, b: V): { d: number; nx: number; ny: number } => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = dx * dx + dy * dy
  const u = l > 0 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0
  const qx = px - (a[0] + dx * u)
  const qy = py - (a[1] + dy * u)
  const d = Math.hypot(qx, qy)
  return { d, nx: d > 0 ? qx / d : 0, ny: d > 0 ? qy / d : -1 }
}
const distBox = (px: number, py: number, b: [number, number, number, number]): number => Math.hypot(Math.max(b[0] - px, 0, px - b[0] - b[2]), Math.max(b[1] - py, 0, py - b[1] - b[3]))
const newBall = (steel: boolean): BallState => ({ mode: 'none', steel, x: 0, y: 0, z: 0, vx: 0, vy: 0, tier: 0, rail: '', s: 0, speed: 0, hold: '', wait: 0, tx: 0, ty: 0, then: '', cool: 0 })
const banks = [...new Set(table.targets.filter((t) => t.kind === 'drop').map((t) => t.id.slice(0, t.id.lastIndexOf('.'))))]

export class Machine {
  private world!: RAPIER.World
  private ballHandles: number[] = []
  private flipHandles: number[] = []
  balls: BallState[] = []
  flip: [number, number] = [0, 0]
  held: [boolean, boolean] = [false, false]
  down: boolean[] = []
  bank: number[] = []
  cool: number[] = []
  gate: boolean[] = [true, true, true]
  on: Record<string, boolean> = {}
  mom = false
  saves = 0
  magnet: [number, number, number] | null = null
  score = 0
  steps = 0
  events: TableEvent[] = []

  constructor() {
    this.build()
  }

  private build(): void {
    if (!ready) throw new Error('The physics library is not started: await prepare() from src/pages/step3 first')
    const world = new RAPIER.World({ x: 0, y: GRAVITY })
    world.timestep = DT
    const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    const rest = { wall: 0.35, guide: 0.2, rubber: 0.65 }
    for (const s of table.segs) world.createCollider(RAPIER.ColliderDesc.segment({ x: s.a[0], y: s.a[1] }, { x: s.b[0], y: s.b[1] }).setRestitution(rest[s.kind]).setFriction(0.1), fixed)
    for (const p of table.posts) world.createCollider(RAPIER.ColliderDesc.ball(p.r).setTranslation(p.c[0], p.c[1]).setRestitution(0.6).setFriction(0.1), fixed)
    for (const b of table.bumpers) world.createCollider(RAPIER.ColliderDesc.ball(b.r).setTranslation(b.c[0], b.c[1]).setRestitution(0.7).setFriction(0.05), fixed)
    for (const m of table.models) {
      if (!m.solid) continue
      world.createCollider(RAPIER.ColliderDesc.cuboid(m.box[2] / 2, m.box[3] / 2).setTranslation(m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2).setRestitution(0.3).setFriction(0.1), fixed)
    }
    for (const s of table.slings) {
      for (const [a, b, r] of [[s.a, s.b, 0.3], [s.b, s.c, 0.3], [s.a, s.c, 0.65]] as [V, V, number][]) world.createCollider(RAPIER.ColliderDesc.segment({ x: a[0], y: a[1] }, { x: b[0], y: b[1] }).setRestitution(r).setFriction(0.1), fixed)
    }
    this.flipHandles = table.flippers.map((f) => {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(f.pivot[0], f.pivot[1]).setRotation((f.side === 'left' ? FLIP.rest : -FLIP.rest) * DEG))
      const half = FLIP.length / 2
      world.createCollider(RAPIER.ColliderDesc.cuboid(half, FLIP.radius).setTranslation(f.side === 'left' ? half : -half, 0).setRestitution(0.3).setFriction(0.4), body)
      return body.handle
    })
    this.balls = []
    this.ballHandles = []
    for (let i = 0; i < BALLS; i++) {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-50 - i * 3, -50).setCcdEnabled(true).setCanSleep(false))
      world.createCollider(RAPIER.ColliderDesc.ball(R).setRestitution(0.45).setFriction(0.1).setDensity(i === 0 ? 1 : 3), body)
      body.setEnabled(false)
      this.ballHandles.push(body.handle)
      this.balls.push(newBall(i > 0))
    }
    this.world = world
    this.flip = [0, 0]
    this.held = [false, false]
    this.down = table.targets.map(() => false)
    this.bank = banks.map(() => 0)
    this.cool = [...table.bumpers.map(() => 0), ...table.slings.map(() => 0), ...table.targets.map(() => 0), 0]
    this.gate = [true, true, true]
    this.on = Object.fromEntries(table.holds.map((h) => [h.id, true]))
    this.mom = false
    this.saves = 0
    this.magnet = null
    this.score = 0
    this.steps = 0
    this.events = []
  }

  reset(): void {
    this.world.free()
    this.build()
  }

  free(): void {
    this.world.free()
  }

  save(): MachineState {
    return {
      snap: toBase64(this.world.takeSnapshot()), balls: this.balls.map((b) => ({ ...b })), flip: [...this.flip], held: [...this.held], down: [...this.down], bank: [...this.bank], cool: [...this.cool], gate: [...this.gate],
      on: { ...this.on }, mom: this.mom, saves: this.saves, magnet: this.magnet ? [...this.magnet] : null, score: this.score, steps: this.steps
    }
  }

  load(s: MachineState): void {
    this.world.free()
    this.world = RAPIER.World.restoreSnapshot(fromBase64(s.snap))
    this.world.timestep = DT
    this.balls = s.balls.map((b) => ({ ...b }))
    this.flip = [...s.flip]
    this.held = [...s.held]
    this.down = [...s.down]
    this.bank = [...s.bank]
    this.cool = [...s.cool]
    this.gate = [...s.gate]
    this.on = { ...s.on }
    this.mom = s.mom
    this.saves = s.saves
    this.magnet = s.magnet ? [...s.magnet] : null
    this.score = s.score
    this.steps = s.steps
    this.events = []
  }

  private body(i: number): RAPIER.RigidBody {
    return this.world.getRigidBody(this.ballHandles[i]!)
  }

  private say(name: string, ball: number, id: string): void {
    const b = this.balls[ball]!
    this.events.push({ name, ball, id, x: b.x, y: b.y })
  }

  toPlane(i: number, x: number, y: number, vx: number, vy: number): void {
    const b = this.balls[i]!
    const body = this.body(i)
    body.setEnabled(true)
    body.setTranslation({ x, y }, true)
    body.setLinvel({ x: vx, y: vy }, true)
    body.setAngvel(0, true)
    b.mode = 'plane'
    b.x = x
    b.y = y
    b.vx = vx
    b.vy = vy
    b.tier = tierAt(y)
    b.z = floorZ(b.tier)
    b.cool = 0.45
  }

  private offPlane(i: number): void {
    const body = this.body(i)
    if (body.isEnabled()) body.setEnabled(false)
  }

  ride(i: number, id: string, speed?: number): void {
    const b = this.balls[i]!
    const r = railOf(id)
    this.offPlane(i)
    b.mode = 'rail'
    b.rail = id
    b.s = 0
    b.speed = speed ?? r.speed
    const p = railAt(r, 0)
    b.x = p.x
    b.y = p.y
    b.z = p.z
  }

  hold(i: number, id: string, wait: number): void {
    const b = this.balls[i]!
    const h = holdOf(id)
    this.offPlane(i)
    b.mode = 'hold'
    b.hold = id
    b.wait = wait
    b.x = h.c[0]
    b.y = h.c[1]
    b.vx = 0
    b.vy = 0
    if (h.tier >= 0 && h.tier < 3) b.z = floorZ(h.tier)
  }

  tow(i: number, x: number, y: number, speed: number, then: string): void {
    const b = this.balls[i]!
    this.offPlane(i)
    b.mode = 'tow'
    b.tx = x
    b.ty = y
    b.speed = speed
    b.then = then
  }

  remove(i: number): void {
    this.offPlane(i)
    this.balls[i]!.mode = 'none'
  }

  release(i: number): void {
    const b = this.balls[i]!
    if (b.mode === 'hold') b.wait = 0
  }

  kick(i: number, vx: number, vy: number): void {
    const b = this.balls[i]!
    if (b.mode !== 'plane') return
    this.body(i).setLinvel({ x: vx, y: vy }, true)
    b.vx = vx
    b.vy = vy
  }

  private then(i: number, what: string): void {
    const [kind, id] = what.split(':') as [string, string]
    if (kind === 'hold') this.hold(i, id, FOREVER)
    else if (kind === 'rail') {
      this.ride(i, id)
      if (id === 'highway' || id === 'ladder') this.say('ramp-roll', i, id)
    }
    else if (kind === 'gate') this.atGate(i, Number(id))
    else this.toPlane(i, this.balls[i]!.x, this.balls[i]!.y, 0, 0)
  }

  private atGate(i: number, k: number): void {
    const b = this.balls[i]!
    if (b.steel) {
      this.say('steel-out', i, `${TIERS[k]}.gate`)
      this.remove(i)
      return
    }
    if (!this.gate[k]) {
      this.saves++
      this.toPlane(i, MID, TIER_Y[k]! + 10.55, this.saves % 2 === 0 ? 1.2 : -1.2, -24)
      this.say('ball-save', i, `${TIERS[k]}.gate`)
      return
    }
    if (k < 2) {
      this.ride(i, `chute.${TIERS[k]}`)
      this.say('tier-fall', i, `${TIERS[k]}.gate`)
    } else {
      this.ride(i, 'drain')
      this.say('drain', i, 'street.gate')
    }
  }

  private railEnd(i: number): void {
    const b = this.balls[i]!
    const r = railOf(b.rail)
    const id = b.rail
    if (id === 'feed') {
      this.hold(i, 'plunger', this.on['plunger'] ? 0.8 : FOREVER)
      this.say('at-plunger', i, 'plunger')
    } else if (id === 'drain') {
      this.hold(i, 'outlet', FOREVER)
      this.say('at-outlet', i, 'outlet')
    } else if (id.startsWith('outlane.')) this.atGate(i, TIERS.indexOf(id.split('.')[1] as never))
    else if (id === 'highway') {
      this.ride(i, 'spiral')
      this.say('spiral', i, 'street.garage')
    } else {
      this.toPlane(i, b.x, b.y, r.out[0], r.out[1])
      this.say('rail-out', i, id)
    }
  }

  private holdEnd(i: number): void {
    const b = this.balls[i]!
    const id = b.hold
    if (id === 'loader') {
      this.ride(i, 'feed')
      this.say('tube-run', i, id)
    } else if (id === 'plunger') {
      this.ride(i, 'launch')
      this.say('plunger', i, id)
    } else if (id === 'corporate.revolving') {
      this.toPlane(i, b.x, b.y, 0, -14)
      this.say('spinner', i, id)
    } else if (id === 'corporate.doors') {
      this.toPlane(i, b.x, b.y, 2.5, 6)
      this.say('doors-open', i, id)
    } else if (id === 'office.inbox') {
      this.toPlane(i, b.x, b.y, -7, 3)
      this.say('eject', i, id)
    } else if (id === 'street.firehouse') {
      this.toPlane(i, b.x, b.y, 5, 6)
      this.say('scoop-kick', i, id)
    } else if (id === 'street.mom') {
      this.toPlane(i, b.x, b.y, 0, -22)
      this.say('mom-save', i, id)
    } else if (id === 'outlet') {
      this.remove(i)
      this.say('ball-open', i, id)
    } else this.toPlane(i, b.x, b.y, 0, 0)
    b.cool = 0.6
  }

  private sense(i: number): void {
    const b = this.balls[i]!
    const k = b.tier
    const y0 = TIER_Y[k]!
    const v = b.y - y0
    if (b.x < COLS.left - 0.7 || b.x > COLS.right + 0.7 || v < -0.4 || v > TH + 0.7) {
      this.say('escape', i, `${TIERS[k]}`)
      this.atGate(i, k)
      return
    }
    if (v > MOUTH.v && Math.abs(b.x - MID) < MOUTH.half) {
      this.atGate(i, k)
      return
    }
    if (v > OUTLANE.v && (b.x < OUTLANE.inner || b.x > 20 - OUTLANE.inner)) {
      const side = b.x < MID ? 'left' : 'right'
      this.ride(i, `outlane.${TIERS[k]}.${side}`)
      this.say('outlane', i, `${TIERS[k]}.outlane.${side}`)
      return
    }
    if (k === 2 && !this.mom && !b.steel && this.on['street.mom'] && b.x < OUTLANE.inner && v > 8.9 && v < OUTLANE.v) {
      this.mom = true
      this.hold(i, 'street.mom', 0.5)
      this.say('mom-hatch', i, 'street.mom')
      return
    }
    if (k === 1 && b.x < COLS.left + 0.05 && v > 4.5 && v < 5.9) {
      this.ride(i, 'lift.office')
      this.say('lift', i, 'office.lift.door')
      return
    }
    if (k === 2 && b.x < COLS.left + 0.05 && v > 0.35 && v < 1.7) {
      this.ride(i, 'lift.street')
      this.say('lift', i, 'street.lift.door')
      return
    }
    const speed = Math.hypot(b.vx, b.vy)
    let n = 0
    for (const m of table.bumpers) {
      const c = n++
      if (m.tier !== k || this.cool[c]! > 0) continue
      const dx = b.x - m.c[0]
      const dy = b.y - m.c[1]
      const d = Math.hypot(dx, dy)
      if (d > m.r + R + 0.05 || d === 0) continue
      const out = Math.max(15, speed * 0.9)
      this.kick(i, (dx / d) * out, (dy / d) * out)
      this.cool[c] = 0.08
      this.score += 1000
      this.say('bumper', i, m.id)
    }
    for (const s of table.slings) {
      const c = n++
      if (s.tier !== k || this.cool[c]! > 0) continue
      const q = distSeg(b.x, b.y, s.a, s.c)
      const inward = s.side === 'left' ? 1 : -1
      if (q.d > R + 0.06 || q.nx * inward <= 0 || b.vx * q.nx + b.vy * q.ny > 1) continue
      this.kick(i, b.vx + q.nx * 11, b.vy + q.ny * 11)
      this.cool[c] = 0.15
      this.score += 500
      this.say('sling', i, s.id)
    }
    for (const t of table.targets) {
      const c = n++
      if (t.tier !== k || this.cool[c]! > 0) continue
      if (t.kind === 'drop' && this.down[t.index]) continue
      if (distBox(b.x, b.y, t.box) > R + (t.kind === 'spinner' ? -0.1 : 0.08)) continue
      this.cool[c] = 0.4
      this.score += 2500
      if (t.kind === 'drop') {
        this.down[t.index] = true
        this.say('drop-target', i, t.id)
        const name = t.id.slice(0, t.id.lastIndexOf('.'))
        if (table.targets.every((o) => !o.id.startsWith(`${name}.`) || this.down[o.index])) this.bank[banks.indexOf(name)] = 1.5
      } else this.say(t.kind, i, t.id)
    }
    if (b.steel) return
    if (k === 0 && Math.abs(b.x - MID) < 0.8 && v < 5.25 && v > 4.4 && b.vy < 0 && this.on['corporate.doors'] && this.cool[n]! <= 0) {
      this.cool[n] = 1
      this.hold(i, 'corporate.doors', 0.75)
      this.say('doors-slam', i, 'corporate.hq')
      return
    }
    if (b.cool > 0) return
    for (const h of table.holds) {
      if (h.tier !== k || !this.on[h.id] || h.id === 'corporate.doors' || (h.kind !== 'scoop' && h.kind !== 'kicker')) continue
      if (Math.hypot(b.x - h.c[0], b.y - h.c[1]) > (h.kind === 'kicker' ? 0.6 : 0.45)) continue
      this.hold(i, h.id, h.kind === 'kicker' ? 0.35 : 1)
      this.say(h.kind === 'kicker' ? 'kicker-in' : 'scoop-in', i, h.id)
      return
    }
    if (k === 0) {
      const p = railOf('ladder').points[0]!
      if (this.on['corporate.ladder'] !== false && Math.hypot(b.x - p[0], b.y - p[1]) < 0.45 && (b.vy < -3 || b.vx > 3)) {
        this.ride(i, 'ladder')
        this.say('ramp-roll', i, 'ladder')
      }
    }
    if (k === 2) {
      const p = railOf('highway').points[0]!
      if (this.on['street.flap'] !== false && Math.hypot(b.x - p[0], b.y - p[1]) < 0.45 && b.vy < -3) {
        this.ride(i, 'highway')
        this.say('ramp-roll', i, 'highway')
      }
    }
  }

  step(left: boolean, right: boolean): TableEvent[] {
    this.events = []
    const want: [boolean, boolean] = [left, right]
    for (let s = 0; s < 2; s++) {
      if (want[s] && !this.held[s]) this.events.push({ name: 'flipper', ball: -1, id: s === 0 ? 'left' : 'right', x: s === 0 ? FLIP.pivotU : 20 - FLIP.pivotU, y: 0 })
      this.held[s] = want[s]!
      const to = want[s] ? 1 : 0
      const d = DT / FLIP.seconds
      this.flip[s] = to > this.flip[s]! ? Math.min(to, this.flip[s]! + d) : Math.max(to, this.flip[s]! - d)
    }
    for (const f of table.flippers) {
      const pos = this.flip[f.side === 'left' ? 0 : 1]!
      const angle = (FLIP.rest + (FLIP.up - FLIP.rest) * pos) * DEG
      this.world.getRigidBody(this.flipHandles[f.index]!).setNextKinematicRotation(f.side === 'left' ? angle : -angle)
    }
    const m = this.magnet
    if (m && this.balls[0]!.mode === 'plane') {
      const b = this.balls[0]!
      const dx = m[0] - b.x
      const dy = m[1] - b.y
      const d = Math.hypot(dx, dy)
      if (d > 0.05) this.kick(0, b.vx + (dx / d) * m[2] * DT, b.vy + (dy / d) * m[2] * DT)
    }
    this.world.step()
    for (let c = 0; c < this.cool.length; c++) if (this.cool[c]! > 0) this.cool[c] = this.cool[c]! - DT
    for (let k = 0; k < this.bank.length; k++) {
      if (this.bank[k]! <= 0) continue
      this.bank[k] = this.bank[k]! - DT
      if (this.bank[k]! <= 0) for (const t of table.targets) if (t.id.startsWith(`${banks[k]}.`)) this.down[t.index] = false
    }
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i]!
      if (b.cool > 0) b.cool -= DT
      if (b.mode === 'plane') {
        const body = this.body(i)
        const p = body.translation()
        const v = body.linvel()
        const sp = Math.hypot(v.x, v.y)
        if (sp > MAX_SPEED) body.setLinvel({ x: (v.x / sp) * MAX_SPEED, y: (v.y / sp) * MAX_SPEED }, true)
        b.x = p.x
        b.y = p.y
        b.vx = sp > MAX_SPEED ? (v.x / sp) * MAX_SPEED : v.x
        b.vy = sp > MAX_SPEED ? (v.y / sp) * MAX_SPEED : v.y
        this.sense(i)
      } else if (b.mode === 'rail') {
        const r = railOf(b.rail)
        b.s += b.speed * DT
        const p = railAt(r, b.s)
        b.x = p.x
        b.y = p.y
        b.z = p.z
        b.vx = p.dx * b.speed
        b.vy = p.dy * b.speed
        if (b.s >= railLength(r)) this.railEnd(i)
      } else if (b.mode === 'hold') {
        b.wait -= DT
        if (b.wait <= 0) this.holdEnd(i)
      } else if (b.mode === 'tow') {
        const dx = b.tx - b.x
        const dy = b.ty - b.y
        const d = Math.hypot(dx, dy)
        const go = b.speed * DT
        if (d <= go) {
          b.x = b.tx
          b.y = b.ty
          this.then(i, b.then)
        } else {
          b.x += (dx / d) * go
          b.y += (dy / d) * go
          b.vx = (dx / d) * b.speed
          b.vy = (dy / d) * b.speed
        }
      }
    }
    for (let i = 1; i < this.balls.length; i++) {
      const a = this.balls[0]!
      const b = this.balls[i]!
      const c = this.cool.length - 1
      if (a.mode === 'plane' && b.mode === 'plane' && this.cool[c]! <= 0 && Math.hypot(a.x - b.x, a.y - b.y) < 2 * R + 0.04) {
        this.cool[c] = 0.25
        this.say('ball-hit', 0, `steel.${i}`)
      }
    }
    this.steps++
    return this.events
  }

  flipperAngle(side: 'left' | 'right'): number {
    const pos = this.flip[side === 'left' ? 0 : 1]!
    return FLIP.rest + (FLIP.up - FLIP.rest) * pos
  }

  wants(from = 1.2): [boolean, boolean] {
    const b = this.balls[0]!
    const out: [boolean, boolean] = [false, false]
    if (b.mode !== 'plane') return out
    const y0 = TIER_Y[b.tier]!
    for (let s = 0; s < 2; s++) {
      const px = s === 0 ? FLIP.pivotU : 20 - FLIP.pivotU
      const dir = s === 0 ? 1 : -1
      const ax = 0.9063077870366499 * dir
      const ay = 0.42261826174069944
      const rx = b.x - px
      const ry = b.y - (y0 + FLIP.pivotV)
      const along = rx * ax + ry * ay
      const above = -(rx * -ay * dir + ry * ax * dir) * dir
      out[s] = along > from && along < FLIP.length + 0.3 && above > 0 && above < 1.0 && b.vy > -3
    }
    return out
  }
}
