import { config, stepHz } from '../config'
import type { Emit } from '../stage/types'

export const ACTING = ['plain', 'confident', 'nervous', 'shocked', 'angry', 'scared', 'proud', 'exhausted'] as const
export const REACTIONS = ['anticipate', 'flinch', 'doubleTake', 'recoil', 'dustOff', 'jump'] as const
export const DAMAGE = ['burn', 'shredded', 'reassembled', 'flattened', 'scorched'] as const
export type Acting = (typeof ACTING)[number]
export type Reaction = (typeof REACTIONS)[number]
export type Damage = (typeof DAMAGE)[number]

export const HANDOFF = { x: 960, y: 540, z: 260 }

const dt = 1 / stepHz
const hover = config.scale.heights.cursorHover
const healSeconds = config.cursor.damageHealSeconds
const takenMax = config.live.controlTakenMaxSeconds
const REACTION_SECONDS: Record<Reaction, number> = { anticipate: 0.35, flinch: 0.3, doubleTake: 0.7, recoil: 0.45, dustOff: 0.9, jump: 0.5 }
const GAIT: Record<Acting, { stiff: number; damp: number; stride: number; hop: number; top: number }> = {
  plain: { stiff: 420, damp: 30, stride: 96, hop: 10, top: 5200 },
  confident: { stiff: 380, damp: 26, stride: 120, hop: 22, top: 5200 },
  nervous: { stiff: 300, damp: 30, stride: 44, hop: 6, top: 2600 },
  shocked: { stiff: 520, damp: 30, stride: 96, hop: 14, top: 6000 },
  angry: { stiff: 560, damp: 30, stride: 80, hop: 16, top: 6000 },
  scared: { stiff: 640, damp: 34, stride: 60, hop: 12, top: 7000 },
  proud: { stiff: 340, damp: 26, stride: 130, hop: 26, top: 4200 },
  exhausted: { stiff: 110, damp: 20, stride: 70, hop: 0, top: 900 }
}

export interface CursorPose {
  x: number
  y: number
  z: number
  squash: number
  lean: number
  spin: number
  acting: Acting
  reaction: Reaction | null
  reactionAt: number
  damage: Damage[]
  healing: number
  arms: boolean
  onPage: boolean
  inBall: boolean
  taken: boolean
  scale: number
}

interface State {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  squash: number
  squashV: number
  lean: number
  spin: number
  stride: number
  fast: number
  acting: Acting
  reaction: Reaction | null
  reactionLeft: number
  damage: { kind: Damage; left: number; whole: number }[]
  windowLeft: number
  arms: boolean
  onPage: boolean
  inBall: boolean
  air: { x: number; y: number } | null
  taken: string | null
  takenFor: number
  drive: { x: number; y: number; z: number } | null
  handback: number
  from: { x: number; y: number }
}

const fresh = (x: number, y: number): State => ({
  x, y, z: hover, vx: 0, vy: 0, vz: 0, squash: 1, squashV: 0, lean: 0, spin: 0, stride: 0, fast: 0, acting: 'plain', reaction: null, reactionLeft: 0,
  damage: [], windowLeft: 0, arms: false, onPage: true, inBall: false, air: null, taken: null, takenFor: 0, drive: null, handback: 1, from: { x, y }
})

export class CursorBody {
  private s: State = fresh(HANDOFF.x, HANDOFF.y)

  reset(x: number, y: number, air = false): void {
    this.s = fresh(x, y)
    if (air) {
      this.s.air = { x, y }
      this.s.z = HANDOFF.z
    }
  }

  get x(): number { return this.s.x }
  get y(): number { return this.s.y }
  get z(): number { return this.s.z }
  get speed(): number { return Math.hypot(this.s.vx, this.s.vy) }
  get acting(): Acting { return this.s.acting }
  get arms(): boolean { return this.s.arms }
  get inBall(): boolean { return this.s.inBall }
  get onPage(): boolean { return this.s.onPage }
  get taken(): boolean { return this.s.taken !== null }
  get inAir(): boolean { return this.s.air !== null }
  get damaged(): boolean { return this.s.damage.length > 0 }
  readonly scale = 1

  act(state: Acting): void {
    this.s.acting = state
  }

  react(name: Reaction): void {
    this.s.reaction = name
    this.s.reactionLeft = REACTION_SECONDS[name]
    if (name === 'jump') this.s.vz = Math.max(this.s.vz, 420)
    if (name === 'flinch' || name === 'recoil') this.s.squashV -= 4
    if (name === 'doubleTake') this.s.squashV += 5
  }

  hurt(kind: Damage): void {
    const s = this.s
    if (s.damage.length === 0) s.windowLeft = healSeconds - 2 * dt
    const left = Math.min(healSeconds * 0.85, s.windowLeft)
    s.damage = s.damage.filter((d) => d.kind !== kind)
    if (kind === 'reassembled') s.damage = s.damage.filter((d) => d.kind !== 'shredded')
    s.damage.push({ kind, left, whole: left })
    s.squashV -= kind === 'flattened' ? 9 : 3
  }

  heal(): void {
    this.s.damage = []
    this.s.windowLeft = 0
  }

  knock(vx: number, vy: number, vz = 0): void {
    this.s.vx += vx
    this.s.vy += vy
    this.s.vz += vz
  }

  take(by: string): void {
    if (this.s.taken === null) this.s.takenFor = 0
    this.s.taken = by
  }

  drive(x: number, y: number, z = hover): void {
    this.s.drive = { x, y, z }
  }

  place(x: number, y: number, z = hover): void {
    const s = this.s
    s.x = x
    s.y = y
    s.z = z
    s.vx = 0
    s.vy = 0
    s.vz = 0
    s.drive = { x, y, z }
  }

  release(): void {
    const s = this.s
    if (s.taken === null) return
    s.taken = null
    s.drive = null
    s.handback = 0
    s.from = { x: s.x, y: s.y }
  }

  setArms(on: boolean): void {
    this.s.arms = on
  }

  seal(inBall: boolean): void {
    this.s.inBall = inBall
  }

  setOnPage(on: boolean): void {
    this.s.onPage = on
  }

  lift(x: number = HANDOFF.x, y: number = HANDOFF.y): void {
    this.s.air = { x, y }
  }

  land(): void {
    this.s.air = null
  }

  step(target: { x: number; y: number }, emit: Emit, armsAllowed: boolean): void {
    const s = this.s
    const gait = GAIT[s.acting]
    if (s.taken !== null) {
      s.takenFor += dt
      if (s.takenFor >= takenMax - 0.5) this.release()
    }
    if (s.arms && !armsAllowed) s.arms = false
    let tx = target.x
    let ty = target.y
    let tz = hover
    if (s.air) {
      tx = s.air.x
      ty = s.air.y
      tz = HANDOFF.z
    } else if (s.taken !== null) {
      tx = s.drive ? s.drive.x : s.x
      ty = s.drive ? s.drive.y : s.y
      tz = s.drive ? s.drive.z : hover
    } else if (s.handback < 1) {
      s.handback = Math.min(1, s.handback + dt / 0.35)
      const u = s.handback * s.handback * (3 - 2 * s.handback)
      tx = s.from.x + (target.x - s.from.x) * u
      ty = s.from.y + (target.y - s.from.y) * u
    }
    const before = Math.hypot(s.vx, s.vy)
    s.vx += (gait.stiff * (tx - s.x) - gait.damp * s.vx) * dt
    s.vy += (gait.stiff * (ty - s.y) - gait.damp * s.vy) * dt
    const speed = Math.hypot(s.vx, s.vy)
    if (speed > gait.top) {
      s.vx *= gait.top / speed
      s.vy *= gait.top / speed
    }
    s.x += s.vx * dt
    s.y += s.vy * dt
    const now = Math.hypot(s.vx, s.vy)
    if (now > 320) s.fast = 0.25
    else if (s.fast > 0) {
      s.fast -= dt
      if (now < 60 && before >= 60) s.squashV -= 3.2
    }
    let hop = 0
    const walking = !s.air && s.taken === null && !s.inBall && now > 180 && gait.hop > 0
    if (walking) {
      s.stride += (now * dt) / gait.stride
      if (s.stride >= 1) {
        s.stride -= Math.floor(s.stride)
        emit('step', s.x, s.y, false)
        s.squashV -= 1.2
      }
      hop = gait.hop * Math.abs(Math.sin(Math.PI * s.stride))
    } else s.stride = 0
    const floor = tz + hop
    s.vz += (-2400 + 700 * Math.max(0, floor - s.z) - 0) * dt
    if (s.air || s.taken !== null) s.vz = (floor - s.z) * 9
    s.z += s.vz * dt
    if (s.z < floor && !s.air && s.taken === null) {
      if (s.vz < -260) s.squashV -= Math.min(8, -s.vz / 160)
      s.z = floor
      s.vz = Math.max(0, s.vz)
    }
    s.squashV += (620 * (1 - s.squash) - 26 * s.squashV) * dt
    s.squash = Math.min(1.6, Math.max(0.35, s.squash + s.squashV * dt))
    const lean = Math.max(-0.5, Math.min(0.5, s.vx / 2600))
    s.lean += (lean - s.lean) * Math.min(1, dt * 14)
    if (s.reaction !== null) {
      s.reactionLeft -= dt
      if (s.reactionLeft <= 0) s.reaction = null
    }
    if (s.damage.length) {
      s.windowLeft -= dt
      for (const d of s.damage) d.left -= dt
      s.damage = s.damage.filter((d) => d.left > 0 && s.windowLeft > 0)
    }
  }

  pose(): CursorPose {
    const s = this.s
    let healing = 0
    for (const d of s.damage) healing = Math.max(healing, 1 - d.left / Math.max(d.whole, dt))
    return {
      x: s.x, y: s.y, z: s.z, squash: s.squash, lean: s.lean, spin: s.spin, acting: s.acting, reaction: s.reaction,
      reactionAt: s.reaction ? 1 - s.reactionLeft / REACTION_SECONDS[s.reaction] : 0,
      damage: s.damage.map((d) => d.kind), healing, arms: s.arms, onPage: s.onPage, inBall: s.inBall, taken: s.taken !== null, scale: 1
    }
  }

  save(): unknown {
    return JSON.parse(JSON.stringify(this.s))
  }

  load(state: unknown): void {
    this.s = JSON.parse(JSON.stringify(state)) as State
  }
}

export function blendPose(a: CursorPose, b: CursorPose, t: number): CursorPose {
  const mix = (p: number, q: number) => p + (q - p) * t
  return { ...b, x: mix(a.x, b.x), y: mix(a.y, b.y), z: mix(a.z, b.z), squash: mix(a.squash, b.squash), lean: mix(a.lean, b.lean), spin: mix(a.spin, b.spin), healing: mix(a.healing, b.healing) }
}
