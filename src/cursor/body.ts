import { config, stepHz } from '../config'
import { hash01 } from '../core/random'
import type { Emit } from '../stage/types'
import { FEEL, FEEL_EASE, FEEL_KEYS, freshFeel, reactionPose, type Feel } from './act/feel'
import { OUTLINE, STRIP_AXIS, UNIT } from './contract'

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
// Layer 1, where it goes. rock is how far it tips from tip to heel corner on each hop, dip how deep it squashes on each footfall.
// The walk is plain, the strut confident and proud, the tiptoe nervous and scared, the drag exhausted.
const GAIT: Record<Acting, { stiff: number; damp: number; stride: number; hop: number; top: number; rock: number; dip: number }> = {
  plain: { stiff: 420, damp: 30, stride: 96, hop: 10, top: 5200, rock: 0.12, dip: 1.2 },
  confident: { stiff: 380, damp: 26, stride: 120, hop: 22, top: 5200, rock: 0.24, dip: 2.2 },
  nervous: { stiff: 300, damp: 30, stride: 44, hop: 6, top: 2600, rock: 0.06, dip: 0.6 },
  shocked: { stiff: 520, damp: 30, stride: 96, hop: 14, top: 6000, rock: 0.1, dip: 1.2 },
  angry: { stiff: 560, damp: 30, stride: 80, hop: 16, top: 6000, rock: 0.18, dip: 2.4 },
  scared: { stiff: 640, damp: 34, stride: 60, hop: 12, top: 7000, rock: 0.07, dip: 0.8 },
  proud: { stiff: 340, damp: 26, stride: 130, hop: 26, top: 4200, rock: 0.28, dip: 2.4 },
  exhausted: { stiff: 110, damp: 20, stride: 70, hop: 0, top: 900, rock: 0, dip: 0 }
}
const SPRING = { squash: { k: 620, c: 26 }, lean: { k: 330, c: 17 }, bend: { k: 260, c: 13 }, sprout: { k: 2400, c: 58 } }
// A hit knocks the body over, past upright onto its other shoulder, and it swings back: the knocked cursor of the approved fire image.
const TUMBLE = { far: 1.25, share: 0.6, out: { k: 900, c: 60 }, back: { k: 300, c: 27 } }
const DRAG = { stride: 90, pulse: 0.2, lean: 0.34 }
const ARM = { rest: 62, strain: 70, shed: 0.3 }
// What the body can be drawn at: the springs may ask for more, the pose never does.
// Leaning right is held short of 0.42, where the arrow would stand upright on its tail and stop reading as a cursor.
const LIMIT = { short: 0.55, long: 1.4, left: 0.6, right: 0.34 }
// A limit that is leaned into, never hit: springs stacked on a hit still move the pose all the way.
const soft = (v: number, limit: number): number => limit * Math.tanh(v / limit)
const softSquash = (v: number): number => (v >= 1 ? 1 + soft(v - 1, LIMIT.long - 1) : 1 - soft(1 - v, 1 - LIMIT.short))
const softLean = (v: number): number => (v >= 0 ? soft(v, LIMIT.right) : -soft(-v, LIMIT.left))
const GULP = { every: 2 * stepHz, steps: Math.round(0.55 * stepHz) }
export const STRIPS = 9
// Where a bolt strikes when nobody says where: the middle of the arrow's head, in the outline's units.
export const STRIKE = { x: 4.3, y: 9.4, reach: 2.1 }
const UNIT_PX = config.cursor.heightPxAt1080 / 19

export interface Strip { x: number; y: number; z: number; rot: number; tilt: number }
interface LooseStrip extends Strip { vx: number; vy: number; vz: number; vr: number; vt: number; rest: boolean; tx: number; ty: number; tr: number }
export interface Wound { kind: Damage; at: number; x: number; y: number }

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
  hands: [Place, Place] | null
  onPage: boolean
  inBall: boolean
  taken: boolean
  scale: number
  // The tail's lag behind the body, from its own acceleration.
  bend: number
  // How it feels, eased from state to state.
  feel: Feel
  // A gulp on its way from tip to tail, 0 to 1, or -1 for none.
  gulp: number
  // Every kind of damage with the share of its life that has passed and its place in the outline's units.
  wounds: Wound[]
  // The loose strips of a shredded body: page pixels from each strip's own place, y up the page.
  strips: Strip[] | null
  // The arms: how far they have grown, how hard they pull, how closed each hand is, and how far they are torn off.
  sprout: number
  strain: number
  grip: [number, number]
  shed: number
}

export interface Place { x: number; y: number; z: number }

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
  damage: { kind: Damage; left: number; whole: number; x: number; y: number; fresh: boolean }[]
  windowLeft: number
  leanV: number
  spinV: number
  bend: number
  bendV: number
  foot: number
  drag: number
  ticks: number
  dir: number
  feel: Feel
  gulp: number
  strips: LooseStrip[] | null
  seed: number
  shreds: number
  sprout: number
  sproutV: number
  strain: number
  grip: number
  shed: number
  shedHands: [Place, Place] | null
  arms: boolean
  hands: [Place, Place] | null
  onPage: boolean
  inBall: boolean
  air: { x: number; y: number } | null
  ground: number
  taken: string | null
  takenFor: number
  drive: { x: number; y: number; z: number } | null
  handback: number
  from: { x: number; y: number }
}

const fresh = (x: number, y: number): State => ({
  x, y, z: hover, vx: 0, vy: 0, vz: 0, squash: 1, squashV: 0, lean: 0, spin: 0, stride: 0, fast: 0, acting: 'plain', reaction: null, reactionLeft: 0,
  damage: [], windowLeft: 0, leanV: 0, spinV: 0, bend: 0, bendV: 0, foot: 1, drag: 0, ticks: 0, dir: 1, feel: freshFeel(), gulp: -1,
  strips: null, seed: config.seed, shreds: 0, sprout: 0, sproutV: 0, strain: 0, grip: 0, shed: 0, shedHands: null, arms: false, hands: null, onPage: true, inBall: false, air: null, ground: 0, taken: null, takenFor: 0, drive: null, handback: 1, from: { x, y }
})

export class CursorBody {
  private s: State = fresh(HANDOFF.x, HANDOFF.y)

  reset(x: number, y: number, air = false): void {
    const seed = this.s.seed
    this.s = fresh(x, y)
    this.s.seed = seed
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
    const s = this.s
    s.acting = state
    if (s.ticks > 0) return
    s.feel = { ...FEEL[state] }
    s.squash = s.feel.stretch
    s.lean = s.feel.lean
    s.bend = s.feel.bend
  }

  setSeed(seed: number): void {
    this.s.seed = seed
  }

  react(name: Reaction): void {
    this.s.reaction = name
    this.s.reactionLeft = REACTION_SECONDS[name]
    this.s.dir = this.s.vx < -40 ? -1 : this.s.vx > 40 ? 1 : this.s.dir
    if (name === 'jump') this.s.vz = Math.max(this.s.vz, 420)
    if (name === 'flinch' || name === 'recoil') this.s.squashV -= 4
    if (name === 'doubleTake') this.s.squashV += 5
  }

  // at is the place of the strike on the page, in page pixels. Without it a burn is placed by the knock that follows it in the same step.
  hurt(kind: Damage, seconds: number = healSeconds * 0.85, at?: { x: number; y: number }): void {
    const s = this.s
    if (s.damage.length === 0) s.windowLeft = healSeconds - 2 * dt
    const left = Math.min(healSeconds * 0.85, s.windowLeft, Math.max(dt, seconds))
    s.damage = s.damage.filter((d) => d.kind !== kind)
    if (kind === 'reassembled') s.damage = s.damage.filter((d) => d.kind !== 'shredded')
    let x = STRIKE.x
    let y = STRIKE.y
    if (at) {
      const dx = (at.x - s.x) / UNIT_PX - STRIKE.x
      const dy = (at.y - s.y) / UNIT_PX - STRIKE.y
      const d = Math.hypot(dx, dy)
      const k = d > STRIKE.reach ? STRIKE.reach / d : 1
      x += dx * k
      y += dy * k
    }
    s.damage.push({ kind, left, whole: left, x, y, fresh: !at })
    s.squashV -= kind === 'flattened' ? 9 : 3
    if (kind === 'shredded') {
      s.shreds++
      s.strips = pile(s.seed + s.shreds)
    }
    if (kind === 'reassembled' && !s.strips) {
      s.shreds++
      s.strips = settledPile(s.seed + s.shreds)
    }
  }

  heal(): void {
    this.s.damage = []
    this.s.windowLeft = 0
    this.s.strips = null
  }

  knock(vx: number, vy: number, vz = 0): void {
    const s = this.s
    s.vx += vx
    s.vy += vy
    s.vz += vz
    const d = Math.hypot(vx, vy)
    if (d < 1) return
    for (const w of s.damage) {
      if (!w.fresh || w.kind !== 'burn') continue
      w.x = STRIKE.x - (vx / d) * STRIKE.reach * 0.6
      w.y = STRIKE.y - (vy / d) * STRIKE.reach * 0.6
      w.fresh = false
    }
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

  setArms(on: boolean, hands?: [Place, Place]): void {
    const s = this.s
    if (!on && s.arms && s.hands && s.sprout > 0.5) {
      s.shed = dt
      s.shedHands = [{ ...s.hands[0] }, { ...s.hands[1] }]
    }
    if (on) {
      s.shed = 0
      s.shedHands = null
    }
    s.arms = on
    s.hands = on ? (hands ?? s.hands) : null
  }

  seal(inBall: boolean): void {
    this.s.inBall = inBall
  }

  setOnPage(on: boolean): void {
    this.s.onPage = on
  }

  setGround(z: number): void {
    this.s.ground = z
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
    if (s.taken !== null && !s.inBall) {
      s.takenFor += dt
      if (s.takenFor >= takenMax - 0.5) this.release()
    }
    if (s.arms && !armsAllowed) {
      s.arms = false
      s.hands = null
    }
    if (s.shed > 0) {
      s.shed += dt
      if (!armsAllowed || s.shed >= ARM.shed) {
        s.shed = 0
        s.shedHands = null
      }
    }
    const ax0 = s.vx
    const ay0 = s.vy
    s.ticks++
    let tx = target.x
    let ty = target.y
    let tz = hover + s.ground
    if (s.air) {
      tx = s.air.x
      ty = s.air.y
      tz = HANDOFF.z
    } else if (s.taken !== null) {
      tx = s.drive ? s.drive.x : s.x
      ty = s.drive ? s.drive.y : s.y
      tz = s.drive ? s.drive.z : hover + s.ground
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
        s.squashV -= gait.dip
        s.foot = -s.foot
      }
      hop = gait.hop * Math.abs(Math.sin(Math.PI * s.stride))
    } else {
      s.stride = 0
      s.foot = 1
    }
    const floor = tz + hop
    s.vz += (-2400 + 700 * Math.max(0, floor - s.z) - 0) * dt
    if (s.air || s.taken !== null) s.vz = (floor - s.z) * 9
    s.z += s.vz * dt
    if (s.z < floor && !s.air && s.taken === null) {
      if (s.vz < -260) s.squashV -= Math.min(8, -s.vz / 160)
      s.z = floor
      s.vz = Math.max(0, s.vz)
    }
    for (const key of FEEL_KEYS) s.feel[key] += (FEEL[s.acting][key] - s.feel[key]) * Math.min(1, (dt * 3) / FEEL_EASE[key])
    const pose = s.reaction ? reactionPose(s.reaction, 1 - s.reactionLeft / REACTION_SECONDS[s.reaction], s.dir) : null
    const dragging = s.acting === 'exhausted' && !s.air && s.taken === null && !s.inBall && now > 30
    if (dragging) s.drag += (now * dt) / DRAG.stride
    const rising = Math.max(0, Math.min(0.22, (s.z - floor) / 160))
    let stretch = s.feel.stretch + (pose ? pose.stretch : 0) + Math.min(0.2, now / 9000) + rising + s.feel.bounce * Math.sin((s.ticks / stepHz) * 3 * Math.PI)
    if (dragging) stretch += DRAG.pulse * Math.sin(s.drag * 2 * Math.PI)
    const ax = Math.max(-1, Math.min(1, (s.vx - ax0) / dt / 90000))
    const ay = Math.max(-1, Math.min(1, (s.vy - ay0) / dt / 90000))
    let lean = Math.max(-0.5, Math.min(0.5, s.vx / 2600)) + s.feel.lean + (pose ? pose.lean : 0)
    if (walking) lean += s.foot * gait.rock * Math.sin(Math.PI * s.stride)
    if (dragging) lean += DRAG.lean * Math.max(-1, Math.min(1, s.vx / 300)) * (0.6 + 0.4 * Math.sin(s.drag * 2 * Math.PI))
    if (s.arms && s.hands) {
      const hx = (s.hands[0].x + s.hands[1].x) / 2 - (s.x + 4.2 * UNIT_PX)
      const hy = (s.hands[0].y + s.hands[1].y) / 2 - (s.y + 10.5 * UNIT_PX)
      const far = Math.hypot(hx, hy)
      const pull = Math.max(0, Math.min(1, (far - ARM.rest) / ARM.strain))
      s.strain += (pull - s.strain) * Math.min(1, dt * 18)
      lean += Math.max(-0.5, Math.min(0.5, Math.atan2(hx, Math.max(20, hy)) * 0.55))
      stretch += 0.1 * s.strain
      s.sproutV += (SPRING.sprout.k * (1 - s.sprout) - SPRING.sprout.c * s.sproutV) * dt
      s.sprout += s.sproutV * dt
      s.grip += ((s.sprout > 0.8 ? 1 : 0) - s.grip) * Math.min(1, dt * 30)
    } else if (s.shed === 0) {
      s.sprout = 0
      s.sproutV = 0
      s.strain = 0
      s.grip = 0
    }
    s.squashV += (SPRING.squash.k * (stretch - s.squash) - SPRING.squash.c * s.squashV) * dt
    s.squash = Math.min(1.6, Math.max(0.35, s.squash + s.squashV * dt))
    const over = s.reaction === 'recoil' && pose && 1 - s.reactionLeft / REACTION_SECONDS.recoil < TUMBLE.share ? TUMBLE.far * s.dir : 0
    const swing = over !== 0 ? TUMBLE.out : TUMBLE.back
    s.spinV += (swing.k * (over - s.spin) - swing.c * s.spinV) * dt
    s.spin += s.spinV * dt
    if (over === 0 && Math.abs(s.spin) < 1e-4 && Math.abs(s.spinV) < 1e-3) {
      s.spin = 0
      s.spinV = 0
    }
    s.leanV += (SPRING.lean.k * (Math.max(-0.9, Math.min(0.9, lean)) - s.lean) - SPRING.lean.c * s.leanV) * dt
    s.lean += s.leanV * dt
    s.bendV += (SPRING.bend.k * (s.feel.bend - ax * 0.9 - ay * 0.35 - s.bend) - SPRING.bend.c * s.bendV) * dt
    s.bend = Math.max(-1, Math.min(1, s.bend + s.bendV * dt))
    const beat = s.ticks % GULP.every
    s.gulp = s.acting === 'nervous' && beat < GULP.steps ? beat / GULP.steps : -1
    if (s.gulp === 0) s.squashV -= 1.6
    if (s.reaction !== null) {
      s.reactionLeft -= dt
      if (s.reactionLeft <= 0) s.reaction = null
    }
    if (s.damage.length) {
      s.windowLeft -= dt
      for (const d of s.damage) {
        d.left -= dt
        d.fresh = false
      }
      const shreds = s.damage.find((d) => d.kind === 'shredded')
      if (shreds && shreds.left <= 0 && s.windowLeft > 6 * dt && !s.damage.some((d) => d.kind === 'reassembled')) {
        const left = Math.min(0.7, s.windowLeft - dt)
        s.damage.push({ kind: 'reassembled', left, whole: left, x: STRIKE.x, y: STRIKE.y, fresh: false })
      }
      s.damage = s.damage.filter((d) => d.left > 0 && s.windowLeft > 0)
      const back = s.damage.find((d) => d.kind === 'reassembled')
      if (s.strips) {
        if (back) {
          const was = s.strips.every((p) => p.x === 0 && p.y === 0 && p.z === 0 && p.rot === 0)
          gather(s.strips, s.seed + s.shreds, 1 - back.left / back.whole)
          if (!was && s.strips.every((p) => p.x === 0 && p.y === 0 && p.z === 0 && p.rot === 0)) s.squashV += 3.4
        } else if (s.damage.some((d) => d.kind === 'shredded')) fall(s.strips)
        else s.strips = null
      }
    } else if (s.strips) s.strips = null
  }

  pose(): CursorPose {
    const s = this.s
    let healing = 0
    for (const d of s.damage) healing = Math.max(healing, 1 - d.left / Math.max(d.whole, dt))
    const shed = s.shed > 0 && s.shedHands !== null
    const arms = s.arms || shed
    const hands = s.arms ? s.hands : s.shedHands
    return {
      x: s.x, y: s.y, z: s.z, squash: softSquash(s.squash), lean: softLean(s.lean), spin: s.spin, acting: s.acting, reaction: s.reaction,
      reactionAt: s.reaction ? 1 - s.reactionLeft / REACTION_SECONDS[s.reaction] : 0,
      damage: s.damage.map((d) => d.kind), healing, arms: arms && hands !== null, hands: arms && hands ? [{ ...hands[0] }, { ...hands[1] }] : null, onPage: s.onPage, inBall: s.inBall, taken: s.taken !== null, scale: 1,
      bend: s.bend, feel: { ...s.feel }, gulp: s.gulp,
      wounds: s.damage.map((d) => ({ kind: d.kind, at: Math.min(1, Math.max(0, 1 - d.left / Math.max(d.whole, dt))), x: d.x, y: d.y })),
      strips: s.strips ? s.strips.map((p) => ({ x: p.x, y: p.y, z: p.z, rot: p.rot, tilt: p.tilt })) : null,
      sprout: s.sprout, strain: s.strain, grip: [s.grip, s.grip], shed: shed ? s.shed / ARM.shed : 0
    }
  }

  save(): unknown {
    return JSON.parse(JSON.stringify(this.s))
  }

  load(state: unknown): void {
    this.s = JSON.parse(JSON.stringify(state)) as State
  }
}

// Each strip of the cut body: its middle and half its length along the tail, in page pixels with y up the page.
const CUTS: { x: number; y: number; half: number }[] = (() => {
  const across = (p: [number, number]): number => p[0] * STRIP_AXIS[1] - p[1] * STRIP_AXIS[0]
  const along = (p: [number, number]): number => p[0] * STRIP_AXIS[0] + p[1] * STRIP_AXIS[1]
  const reach = OUTLINE.map(across)
  const lo = Math.min(...reach)
  const width = (Math.max(...reach) - lo) / STRIPS
  const clip = (poly: [number, number][], limit: number, above: boolean): [number, number][] => {
    const out: [number, number][] = []
    const side = (p: [number, number]): number => (above ? across(p) - limit : limit - across(p))
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length]!
      const sa = side(a)
      const sb = side(b)
      if (sa >= 0) out.push(a)
      if (sa >= 0 !== sb >= 0) out.push([a[0] + ((b[0] - a[0]) * sa) / (sa - sb), a[1] + ((b[1] - a[1]) * sa) / (sa - sb)])
    })
    return out
  }
  const out: { x: number; y: number; half: number }[] = []
  for (let i = 0; i < STRIPS; i++) {
    const piece = clip(clip(OUTLINE, lo + i * width, true), lo + (i + 1) * width, false)
    const run = piece.map(along)
    const from = Math.min(...run)
    const to = Math.max(...run)
    const mid = lo + (i + 0.5) * width
    const m = (from + to) / 2
    out.push({ x: (m * STRIP_AXIS[0] + mid * STRIP_AXIS[1]) * UNIT, y: -(m * STRIP_AXIS[1] - mid * STRIP_AXIS[0]) * UNIT, half: ((to - from) / 2) * UNIT })
  }
  return out
})()

// Where a strip comes to lie: the pile is the arrow fanned open, every strip swung about its top end, slid along itself and pushed apart from its neighbours, each on its own layer.
const FAN = { pinch: [14, -10], pull: 0.18, from: -0.3, to: 0.36, wobble: 0.14, stagger: 12, across: 2.3 }

function lie(i: number, seed: number): Strip {
  const h = (k: number) => hash01(i, k + 40, seed)
  const cut = CUTS[i]!
  const rot = FAN.from + ((FAN.to - FAN.from) * i) / (STRIPS - 1) + (h(1) - 0.5) * FAN.wobble
  const c = Math.cos(rot)
  const n = Math.sin(rot)
  const ax = STRIP_AXIS[0]
  const ay = -STRIP_AXIS[1]
  const dx = ax * c - ay * n
  const dy = ax * n + ay * c
  const side = (i - (STRIPS - 1) / 2) * FAN.across
  const slide = (h(2) - 0.5) * FAN.stagger
  const topX = cut.x - ax * cut.half
  const topY = cut.y - ay * cut.half
  const toX = topX + (FAN.pinch[0]! - topX) * FAN.pull - ay * side + ax * slide
  const toY = topY + (FAN.pinch[1]! - topY) * FAN.pull + ax * side + ay * slide
  return { x: toX + dx * cut.half - cut.x, y: toY + dy * cut.half - cut.y, z: layer(i), rot, tilt: 0 }
}

// The strips as they leave the shredder: thrown down the page from above their places, each with its own spin, each bound for its place in the fan.
function pile(seed: number): LooseStrip[] {
  const out: LooseStrip[] = []
  for (let i = 0; i < STRIPS; i++) {
    const h = (k: number) => hash01(i, k, seed)
    const to = lie(i, seed)
    out.push({
      x: (h(1) - 0.5) * 6, y: 38 + h(2) * 12, z: 22 + h(3) * 26 + i * 2, rot: (h(4) - 0.5) * 0.5, tilt: (h(5) - 0.5) * 1.4,
      vx: (h(6) - 0.5) * 60, vy: -(210 + h(7) * 60), vz: -90, vr: (h(8) - 0.5) * 5, vt: (h(9) - 0.5) * 10, rest: false,
      tx: to.x, ty: to.y, tr: to.rot
    })
  }
  return out
}

const layer = (i: number): number => 0.4 + ((i * 5) % STRIPS) * 0.36

// One step of the loose strips: each falls, lands on the pile at its own layer, skids to its place in the fan and comes to rest.
function fall(strips: LooseStrip[]): void {
  strips.forEach(drop)
}

function drop(p: LooseStrip, i: number): void {
  if (p.rest) return
  const floor = layer(i)
  const down = p.z <= floor + 0.01 && Math.abs(p.vz) < 1
  const k = down ? 150 : 46
  const c = down ? 21 : 9
  p.vx += (k * (p.tx - p.x) - c * p.vx) * dt
  p.vy += (k * (p.ty - p.y) - c * p.vy) * dt
  p.vr += (k * (p.tr - p.rot) - c * p.vr) * dt
  p.x += p.vx * dt
  p.y += p.vy * dt
  p.rot += p.vr * dt
  if (!down) {
    p.vz -= 2400 * dt
    p.z += p.vz * dt
    p.tilt += p.vt * dt
    if (p.z > floor) return
    p.z = floor
    p.vt *= 0.3
    p.vz = p.vz < -130 ? -p.vz * 0.28 : 0
    return
  }
  p.vz = 0
  p.z = floor
  p.tilt *= Math.exp(-34 * dt)
  if (Math.hypot(p.vx, p.vy) < 2 && Math.abs(p.vr) < 0.04 && Math.abs(p.tilt) < 0.004 && Math.hypot(p.tx - p.x, p.ty - p.y) < 0.15 && Math.abs(p.tr - p.rot) < 0.004) {
    p.x = p.tx
    p.y = p.ty
    p.rot = p.tr
    p.vx = 0
    p.vy = 0
    p.vr = 0
    p.tilt = 0
    p.rest = true
  }
}

// Where a strip stands before it snaps true: a little out of line.
export function askew(i: number, seed: number): Strip {
  const h = (k: number) => hash01(i, k + 20, seed)
  return { x: (h(1) - 0.5) * 1.2, y: (h(2) - 0.5) * 3.2, z: i % 2 ? 0.9 : 0.3, rot: (h(3) - 0.5) * 0.036, tilt: 0 }
}

const GATHER = { stand: 0.42, snap: 0.68, true: 0.76 }

// One step of the reassembly: the strips stand one after another, find their places out of line, hold, then snap true.
function gather(strips: LooseStrip[], seed: number, u: number): void {
  strips.forEach((p, i) => {
    p.rest = false
    if (u >= GATHER.true) {
      p.x = p.y = p.z = p.rot = p.tilt = p.vx = p.vy = p.vz = p.vr = p.vt = 0
      return
    }
    const snap = u >= GATHER.snap
    const start = (i / STRIPS) * GATHER.stand * 0.45
    if (u < start) {
      drop(p, i)
      return
    }
    const to = snap ? { x: 0, y: 0, z: 0, rot: 0, tilt: 0 } : askew(i, seed)
    const lift = snap ? 0 : 9 * Math.max(0, 1 - (u - start) / (GATHER.stand - start))
    const k = snap ? 9000 : 1100
    const c = snap ? 150 : 52
    p.vx += (k * (to.x - p.x) - c * p.vx) * dt
    p.vy += (k * (to.y - p.y) - c * p.vy) * dt
    p.vz += (k * (to.z + lift - p.z) - c * p.vz) * dt
    p.vr += (k * (to.rot - p.rot) - c * p.vr) * dt
    p.vt += (k * (to.tilt - p.tilt) - c * p.vt) * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.z = Math.max(0, p.z + p.vz * dt)
    p.rot += p.vr * dt
    p.tilt += p.vt * dt
  })
}

function settledPile(seed: number): LooseStrip[] {
  const strips = pile(seed)
  for (let i = 0; i < stepHz * 2 && strips.some((p) => !p.rest); i++) fall(strips)
  return strips
}

const bare = (p: LooseStrip): Strip => ({ x: p.x, y: p.y, z: p.z, rot: p.rot, tilt: p.tilt })

// The pile a seed gives, after so many seconds of falling. The same seed gives the same pile.
export function pileAt(seed: number, seconds: number): Strip[] {
  const strips = pile(seed)
  for (let i = 0; i < Math.round(seconds * stepHz); i++) fall(strips)
  return strips.map(bare)
}

// The strips of a reassembly, at a share of its length, from a settled pile.
export function gatheredAt(seed: number, u: number, seconds = 0.8): Strip[] {
  const strips = settledPile(seed)
  const n = Math.round(seconds * stepHz)
  for (let i = 0; i < Math.round(n * u); i++) gather(strips, seed, i / n)
  return strips.map(bare)
}

export function restPose(x: number, y: number, extra: Partial<CursorPose> = {}): CursorPose {
  const pose: CursorPose = {
    x, y, z: hover, squash: 1, lean: 0, spin: 0, acting: 'plain', reaction: null, reactionAt: 0, damage: [], healing: 0, arms: false, hands: null, onPage: true, inBall: false, taken: false, scale: 1,
    bend: 0, feel: freshFeel(), gulp: -1, wounds: [], strips: null, sprout: 1, strain: 0, grip: [1, 1], shed: 0, ...extra
  }
  if (!('feel' in extra)) pose.feel = { ...FEEL[pose.acting] }
  if (!('wounds' in extra)) pose.wounds = pose.damage.map((kind) => ({ kind, at: pose.healing, x: STRIKE.x, y: STRIKE.y }))
  return pose
}

export function blendPose(a: CursorPose, b: CursorPose, t: number): CursorPose {
  const mix = (p: number, q: number) => p + (q - p) * t
  const place = (p: Place, q: Place): Place => ({ x: mix(p.x, q.x), y: mix(p.y, q.y), z: mix(p.z, q.z) })
  const hands: [Place, Place] | null = a.hands && b.hands ? [place(a.hands[0], b.hands[0]), place(a.hands[1], b.hands[1])] : b.hands
  const feel = { ...b.feel }
  for (const key of FEEL_KEYS) feel[key] = mix(a.feel[key], b.feel[key])
  const wounds = b.wounds.map((w) => {
    const was = a.wounds.find((o) => o.kind === w.kind)
    return was && was.at <= w.at ? { ...w, at: mix(was.at, w.at) } : { ...w }
  })
  const strips = a.strips && b.strips && a.strips.length === b.strips.length
    ? b.strips.map((q, i) => {
        const p = a.strips![i]!
        return { x: mix(p.x, q.x), y: mix(p.y, q.y), z: mix(p.z, q.z), rot: mix(p.rot, q.rot), tilt: mix(p.tilt, q.tilt) }
      })
    : b.strips
  return {
    ...b, x: mix(a.x, b.x), y: mix(a.y, b.y), z: mix(a.z, b.z), squash: mix(a.squash, b.squash), lean: mix(a.lean, b.lean), spin: mix(a.spin, b.spin), healing: mix(a.healing, b.healing), hands,
    bend: mix(a.bend, b.bend), feel, gulp: a.gulp >= 0 && b.gulp >= a.gulp ? mix(a.gulp, b.gulp) : b.gulp, wounds, strips,
    sprout: mix(a.sprout, b.sprout), strain: mix(a.strain, b.strain), grip: [mix(a.grip[0], b.grip[0]), mix(a.grip[1], b.grip[1])], shed: b.shed >= a.shed ? mix(a.shed, b.shed) : b.shed
  }
}
