import type { RigidBody, World } from '@dimforge/rapier2d-deterministic-compat'
import { config } from '../config'
import { COLS, COS25, FLIP, FLIP_REACH, GRAVITY, MID, MOUTH, OUTLANE, R, SIN25, TH, TIERS, TIER_Y, floorZ, holdOf, railAt, railLength, railOf, solids, table, tierAt, type V } from './layout'

let RAPIER!: typeof import('@dimforge/rapier2d-deterministic-compat').default
let ready = false
export async function prepare(): Promise<void> {
  if (ready) return
  const library = (await import('@dimforge/rapier2d-deterministic-compat')).default
  await library.init()
  RAPIER = library
  ready = true
}

export type BallMode = 'none' | 'plane' | 'rail' | 'hold' | 'tow'
export interface BallState {
  mode: BallMode; steel: boolean; x: number; y: number; z: number; vx: number; vy: number; tier: number
  rail: string; s: number; speed: number; hold: string; wait: number; tx: number; ty: number; then: string; cool: number; age: number; fx: number; fy: number
}
export interface TableEvent { name: string; ball: number; id: string; x: number; y: number }
export interface MachineState {
  snap: string; balls: BallState[]; flip: [number, number]; held: [boolean, boolean]; down: boolean[]; bank: number[]; cool: number[]; gate: boolean[]; on: Record<string, boolean>
  mom: boolean; carpet?: boolean; live?: boolean; bounce?: [number, number]; mark?: [number, number, number, number] | null; slid?: number; cut?: boolean; saves: number; magnet: number[] | null; aim?: [number, number, number] | null; shot?: [number, number, number] | null; armed?: boolean[]; score: number; steps: number; last: Record<string, number>
}

const DEG = 0.017453292519943295
const BALLS = 1 + config.live.pinball.extraBallsInReplyAll
const HZ = config.sim.stepHz
const DT = 1 / HZ
const MAX_SPEED = 30
// Live play, set by the page each step and off in the film: the steps of a bat's stroke up and of its fall, the height and the steps of its bounce at rest, and the speed limit of a visitor's ball.
const LIVE = { up: 8, down: 12, bounce: 0.1, back: 10, max: 36 }
// Live play: a stroke has met the ball when the ball gains this many balls/s in one step beside a rising bat.
const MET = 3
const LIFT_SHUT = 0.4
const FOREVER = 1e9
const BAT = { bounce: 0.3, grip: 0.4 }
const KICK = { bumper: 18, sling: 12, face: 0.3 }
const TAKES = 0.6
export const EJECT = { firehouse: [1.4, 4] as V }
const PULSE = { gap: Math.round(0.34 / DT), swell: Math.round(0.4 / DT), rest: Math.round(0.5 / DT), lead: Math.round(0.12 / DT) }
const FLASHERS = new Set([...table.bumpers, ...table.slings, ...table.targets].map((x) => x.id))
const SETTLE = { seconds: 0.16, land: 0.45, sink: 0, hop: 0.07 }
const CARPET = table.flats.find((f) => f.id === 'corporate.carpet')!.box

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
const newBall = (steel: boolean): BallState => ({ mode: 'none', steel, x: 0, y: 0, z: 0, vx: 0, vy: 0, tier: 0, rail: '', s: 0, speed: 0, hold: '', wait: 0, tx: 0, ty: 0, then: '', cool: 0, age: 0, fx: 0, fy: 0 })
const banks = [...new Set(table.targets.filter((t) => t.kind === 'drop').map((t) => t.id.slice(0, t.id.lastIndexOf('.'))))]

export class Machine {
  private world!: World
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
  carpet = false
  live = false
  bounce: [number, number] = [0, 0]
  saves = 0
  magnet: number[] | null = null
  mark: [number, number, number, number] | null = null
  slid = 0
  cut = false
  aim: [number, number, number] | null = null
  shot: [number, number, number] | null = null
  armed: [boolean, boolean] = [false, false]
  score = 0
  steps = 0
  last: Record<string, number> = {}
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
      for (const [x, y, w, h] of solids(m)) world.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, h / 2).setTranslation(x + w / 2, y + h / 2).setRestitution(0.3).setFriction(0.1), fixed)
    }
    for (const s of table.slings) {
      for (const [a, b, r] of [[s.a, s.b, 0.3], [s.b, s.c, 0.3], [s.a, s.c, 0.65]] as [V, V, number][]) world.createCollider(RAPIER.ColliderDesc.segment({ x: a[0], y: a[1] }, { x: b[0], y: b[1] }).setRestitution(r).setFriction(0.1), fixed)
    }
    this.flipHandles = table.flippers.map((f) => {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(f.pivot[0], f.pivot[1]).setRotation((f.side === 'left' ? FLIP.rest : -FLIP.rest) * DEG))
      const far = f.side === 'left' ? FLIP_REACH : -FLIP_REACH
      const flank = RAPIER.ColliderDesc.convexHull(new Float32Array([0, -FLIP.radius, far, -FLIP.tip, far, FLIP.tip, 0, FLIP.radius]))!
      for (const c of [RAPIER.ColliderDesc.ball(FLIP.radius), RAPIER.ColliderDesc.ball(FLIP.tip).setTranslation(far, 0), flank]) world.createCollider(c.setRestitution(BAT.bounce).setFriction(BAT.grip), body)
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
    this.carpet = false
    this.live = false
    this.bounce = [0, 0]
    this.mark = null
    this.slid = 0
    this.cut = false
    this.saves = 0
    this.magnet = null
    this.aim = null
    this.shot = null
    this.armed = [false, false]
    this.score = 0
    this.steps = 0
    this.last = {}
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
      on: { ...this.on }, mom: this.mom, carpet: this.carpet, ...(this.live ? { live: true, bounce: [...this.bounce] as [number, number], mark: this.mark ? [...this.mark] as [number, number, number, number] : null, slid: this.slid, cut: this.cut } : {}), saves: this.saves, magnet: this.magnet ? [...this.magnet] : null, aim: this.aim ? [...this.aim] : null, shot: this.shot ? [...this.shot] : null, armed: [...this.armed], score: this.score, steps: this.steps, last: { ...this.last }
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
    this.carpet = s.carpet === true
    this.live = s.live === true
    this.bounce = s.bounce ? [...s.bounce] : [0, 0]
    this.mark = s.mark ? [...s.mark] : null
    this.slid = s.slid ?? 0
    this.cut = s.cut === true
    this.saves = s.saves
    this.magnet = s.magnet ? [...s.magnet] : null
    this.aim = s.aim ? [...s.aim] : null
    this.shot = s.shot ? [...s.shot] : null
    this.armed = [!!s.armed?.[0], !!s.armed?.[1]]
    this.score = s.score
    this.steps = s.steps
    this.last = { ...(s.last ?? {}) }
    this.events = []
  }

  private body(i: number): RigidBody {
    return this.world.getRigidBody(this.ballHandles[i]!)
  }

  private say(name: string, ball: number, id: string): void {
    const b = this.balls[ball]!
    this.events.push({ name, ball, id, x: b.x, y: b.y })
    this.last[id] = this.steps
    this.last[`${name}:${id}`] = this.steps
    if (!FLASHERS.has(id)) return
    const k = (TIERS as string[]).indexOf(id.slice(0, id.indexOf('.')))
    if (this.steps - (this.last[`rise.${k}`] ?? -PULSE.gap) < PULSE.gap) return
    this.last[`rise.${k}`] = this.steps
    this.last[`flash.${k}`] = this.steps
  }

  private swell(): void {
    if (!this.balls.some((b) => b.steel && b.mode !== 'none')) return
    if (this.steps - (this.last['swell.1'] ?? -PULSE.swell) < PULSE.swell || this.steps - (this.last['flash.1'] ?? -PULSE.rest) < PULSE.rest) return
    if (this.steps + PULSE.lead - (this.last['rise.1'] ?? -PULSE.gap) < PULSE.gap) return
    this.last['swell.1'] = this.steps
    this.last['rise.1'] = this.steps + PULSE.lead
  }

  // Seconds since a thing was last named in an event (`office.bumper.1`), or since one kind of event at it (`scoop-kick:street.firehouse`): 9 when that never was, or was longer ago.
  since(key: string): number {
    const at = this.last[key]
    return at === undefined ? 9 : Math.min(9, (this.steps - at) * DT)
  }

  get seconds(): number {
    return this.steps * DT
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
    const soft = (h.kind === 'scoop' || h.kind === 'kicker') && b.mode === 'plane'
    b.mode = 'hold'
    b.hold = id
    b.wait = wait
    b.age = soft ? 0 : SETTLE.seconds
    const c = h.stand ?? h.c
    b.fx = soft ? b.x - c[0] : 0
    b.fy = soft ? b.y - c[1] : 0
    if (!soft) {
      b.x = c[0]
      b.y = c[1]
    }
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

  // Where a bumper or a slingshot throws the clear ball when the director has named a place: the arc that lands there at this speed, when that leaves the face within its cone. Otherwise nothing, and the face throws straight.
  private aimed(i: number, nx: number, ny: number, speed: number, high = false): V | null {
    const a = this.aim
    const b = this.balls[i]!
    if (!a || i !== 0) return null
    const dx = a[0] - b.x
    const dy = a[1] - b.y
    const d2 = dx * dx + dy * dy
    if (d2 < 0.25) return null
    const k = speed * speed + dy * GRAVITY
    const under = k * k - GRAVITY * GRAVITY * d2
    if (under < 0) return null
    const time = Math.sqrt((high ? k + Math.sqrt(under) : k - Math.sqrt(under)) / (GRAVITY * GRAVITY * 0.5))
    const vx = dx / time
    const vy = dy / time - GRAVITY * time * 0.5
    return (vx * nx + vy * ny) / speed < a[2] ? null : [vx, vy]
  }

  private then(i: number, what: string): void {
    const [kind, id] = what.split(':') as [string, string]
    if (kind === 'hold') {
      this.hold(i, id, FOREVER)
      const h = holdOf(id)
      if (h.kind === 'scoop' || h.kind === 'kicker') this.say(h.kind === 'kicker' ? 'kicker-in' : 'scoop-in', i, id)
    } else if (kind === 'rail') {
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
      if (k < 2) this.ride(i, `chute.${TIERS[k]}`)
      else this.remove(i)
      return
    }
    if (!this.gate[k]) {
      this.saves++
      this.toPlane(i, MID, TIER_Y[k]! + 10.55, this.saves % 2 === 0 ? 1.2 : -1.2, -24)
      if (this.live && i === 0 && this.mark) {
        const keep = this.aim
        this.aim = [this.mark[0], this.mark[1], -1]
        const to = this.aimed(0, 0, -1, this.mark[2], this.mark[3] === 1)
        this.aim = keep
        if (to) this.kick(0, to[0], to[1])
      }
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
    if (b.steel && id.startsWith('chute.')) this.remove(i)
    else if (id === 'feed') {
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
      this.toPlane(i, b.x, b.y, -0.4, -14)
      this.say('spinner', i, id)
    } else if (id === 'corporate.doors') {
      this.toPlane(i, b.x, b.y, 1.0, 6)
      this.say('doors-open', i, id)
    } else if (id === 'office.inbox') {
      this.toPlane(i, b.x, b.y, -10.8, 1.2)
      this.say('eject', i, id)
    } else if (id === 'street.firehouse') {
      this.toPlane(i, b.x, b.y, EJECT.firehouse[0], EJECT.firehouse[1])
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
    if (v > MOUTH.v && b.vy > 0 && Math.abs(b.x - MID) < MOUTH.half) {
      this.tow(i, MID, y0 + MOUTH.hole, Math.max(12, Math.hypot(b.vx, b.vy)), `gate:${k}`)
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
    if (this.on['lifts'] === false && b.x < COLS.left + 0.05 && ((k === 1 && v > 4.5 && v < 5.9) || (k === 2 && v > 0.35 && v < 1.7))) {
      if (b.vx < 0) this.kick(i, -b.vx * LIFT_SHUT, b.vy)
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
      const out = Math.max(KICK.bumper, speed * 0.9)
      const to = this.aimed(i, dx / d, dy / d, out)
      this.kick(i, to ? to[0] : (dx / d) * out, to ? to[1] : (dy / d) * out)
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
      const to = this.aimed(i, q.nx, q.ny, this.live ? Math.max(KICK.sling, speed * 0.9) : KICK.sling)
      this.kick(i, to ? to[0] : b.vx + q.nx * KICK.sling, to ? to[1] : b.vy + q.ny * KICK.sling)
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
      const c = h.mouth ?? h.stand ?? h.c
      if (Math.hypot(b.x - c[0], b.y - c[1]) > TAKES) continue
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
    this.swell()
    const dead = this.live && this.cut
    const want: [boolean, boolean] = dead ? [false, false] : [left, right]
    let done = -1
    let beside = false
    if (dead) this.dark()
    for (let s = 0; s < 2; s++) {
      if (want[s] && !this.held[s]) {
        this.events.push({ name: 'flipper', ball: -1, id: s === 0 ? 'left' : 'right', x: s === 0 ? FLIP.pivotU : 20 - FLIP.pivotU, y: 0 })
        const o = this.over(s)
        this.armed[s] = !!o && o.along > 0.2 && o.along < FLIP_REACH + 0.15 && o.above > 0 && o.above < FLIP.radius + R + 0.2
      }
      this.held[s] = want[s]!
      const to = want[s] ? 1 : 0
      const d = this.live ? 1 / (want[s] ? LIVE.up : LIVE.down) : DT / FLIP.seconds
      const was = this.flip[s]!
      this.flip[s] = to > was ? Math.min(to, was + d) : Math.max(to, was - d)
      if (this.live) this.rebound(s, want[s]!, was)
      if (this.live && this.flip[s]! > was && this.near(s)) beside = true
      if (!want[s]) this.armed[s] = false
      else if (this.armed[s] && was < 1 && this.flip[s] === 1) done = s
    }
    for (const f of table.flippers) {
      const pos = this.flip[f.side === 'left' ? 0 : 1]!
      const angle = (FLIP.rest + (FLIP.up - FLIP.rest) * pos) * DEG
      this.world.getRigidBody(this.flipHandles[f.index]!).setNextKinematicRotation(f.side === 'left' ? angle : -angle)
    }
    const m = this.magnet
    if (m && this.balls[0]!.mode === 'plane') {
      const b = this.balls[0]!
      const dx = m[0]! - b.x
      const dy = m[1]! - b.y
      const d = Math.hypot(dx, dy)
      if (d > 0.05 && (m[3] === undefined || d < m[3]!)) this.kick(0, b.vx + (dx / d) * m[2]! * DT, b.vy + (dy / d) * m[2]! * DT)
    }
    const before = beside ? Math.hypot(this.balls[0]!.vx, this.balls[0]!.vy) : 0
    this.world.step()
    if (beside) {
      const v = this.body(0).linvel()
      if (Math.hypot(v.x, v.y) - before > MET) this.last['met'] = this.steps
    }
    if (done >= 0) this.strike(done)
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
        const most = this.live ? LIVE.max : MAX_SPEED
        if (sp > most) body.setLinvel({ x: (v.x / sp) * most, y: (v.y / sp) * most }, true)
        b.x = p.x
        b.y = p.y
        b.vx = sp > most ? (v.x / sp) * most : v.x
        b.vy = sp > most ? (v.y / sp) * most : v.y
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
        if (b.age < SETTLE.seconds) {
          const h = holdOf(b.hold)
          b.age = Math.min(SETTLE.seconds, b.age + DT)
          const u = b.age / SETTLE.seconds
          const left = (1 - u) * (1 - u)
          const hop = u < SETTLE.land ? 0 : 4 * ((u - SETTLE.land) / (1 - SETTLE.land)) * (1 - (u - SETTLE.land) / (1 - SETTLE.land))
          const c = h.stand ?? h.c
          b.x = c[0] + b.fx * left
          b.y = c[1] + b.fy * left
          if (h.tier >= 0 && h.tier < 3) b.z = floorZ(h.tier) - (h.kind === 'scoop' ? SETTLE.sink * Math.min(1, u / SETTLE.land) : 0) + SETTLE.hop * hop
        }
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
    const lead = this.balls[0]!
    const rolling = lead.mode === 'plane' || lead.mode === 'tow'
    const over = rolling && lead.x > CARPET[0] && lead.x < CARPET[0] + CARPET[2] && lead.y > CARPET[1] && lead.y < CARPET[1] + CARPET[3]
    if (over && !this.carpet) this.say('carpet-roll', 0, 'corporate.carpet')
    if (rolling) this.carpet = over
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

  // Live play: a bat that falls back to rest bounces once, low, before it lies still.
  private rebound(s: number, want: boolean, was: number): void {
    if (want) {
      this.bounce[s] = 0
      return
    }
    if (this.bounce[s]! > 0) {
      this.bounce[s] = this.bounce[s]! - 1
      const u = this.bounce[s]! / LIVE.back
      this.flip[s] = LIVE.bounce * 4 * u * (1 - u)
    } else if (was > 0 && this.flip[s] === 0) this.bounce[s] = LIVE.back
  }

  // Live play: the bats' power is cut, and the lamps of the ball's tier flicker for as long as it is, no faster than the machine's own flashes.
  private dark(): void {
    const k = this.balls[0]!.tier
    if (this.steps - (this.last[`rise.${k}`] ?? -PULSE.gap) < PULSE.gap) return
    this.last[`rise.${k}`] = this.steps
    this.last[`flash.${k}`] = this.steps
  }

  private near(s: number): boolean {
    const o = this.over(s)
    return !!o && o.above > 0 && Math.hypot(o.along, o.above) < FLIP.length + R + 0.5
  }

  // Where the clear ball is over a bat at rest: how far along it from the pivot and how far above its middle line.
  private over(s: number): { along: number; above: number } | null {
    const b = this.balls[0]!
    if (b.mode !== 'plane') return null
    const px = s === 0 ? FLIP.pivotU : 20 - FLIP.pivotU
    const dir = s === 0 ? 1 : -1
    const rx = b.x - px
    const ry = b.y - (TIER_Y[b.tier]! + FLIP.pivotV)
    return { along: rx * COS25 * dir + ry * SIN25, above: rx * SIN25 * dir - ry * COS25 }
  }

  wants(from = 1.2, rising = -3): [boolean, boolean] {
    const out: [boolean, boolean] = [false, false]
    for (let s = 0; s < 2; s++) {
      const o = this.over(s)
      out[s] = !!o && o.along > from && o.along < FLIP.length + 0.3 && o.above > 0 && o.above < FLIP.radius + R + 0.3 && this.balls[0]!.vy > rising
    }
    return out
  }

  // A bat that began its stroke under the ball ends it by sending the ball where the director asked, in the arc that gets it there.
  private strike(s: number): void {
    this.armed[s] = false
    if (this.live) return
    const sh = this.shot
    const b = this.balls[0]!
    if (!sh || b.mode !== 'plane') return
    const dx = sh[0] - b.x
    const dy = sh[1] - b.y
    const d = Math.hypot(dx, dy)
    if (d < 1) return
    const time = d / sh[2]
    this.kick(0, dx / time, dy / time - 0.5 * GRAVITY * time)
    this.say('shot', 0, s === 0 ? 'left' : 'right')
  }
}
