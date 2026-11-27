import { config, stepHz } from '../config'
import { hash01 } from '../core/random'
import type { Emit } from '../stage/types'
import { FEEL, FEEL_EASE, FEEL_KEYS, freshFeel, reactionPose, type Feel } from './act/feel'
import { OUTLINE, STRIP_AXIS, UNIT } from './contract'

export const ACTING = ['plain', 'confident', 'nervous', 'shocked', 'angry', 'scared', 'proud', 'exhausted'] as const
export const REACTIONS = ['anticipate', 'flinch', 'doubleTake', 'recoil', 'dustOff', 'jump', 'duck', 'startle', 'cower', 'rear', 'snap', 'tap', 'dart', 'fume', 'stamp'] as const
export const DAMAGE = ['burn', 'shredded', 'reassembled', 'flattened', 'scorched'] as const
export type Acting = (typeof ACTING)[number]
export type Reaction = (typeof REACTIONS)[number]
export type Damage = (typeof DAMAGE)[number]

export const HANDOFF = { x: 960, y: 540, z: 260 }

const dt = 1 / stepHz
const hover = config.scale.heights.cursorHover
const healSeconds = config.cursor.damageHealSeconds
const takenMax = config.live.controlTakenMaxSeconds
const REACTION_SECONDS: Record<Reaction, number> = { anticipate: 0.35, flinch: 0.3, doubleTake: 0.7, recoil: 0.62, dustOff: 0.9, jump: 0.5, duck: 0.55, startle: 0.42, cower: 0.62, rear: 0.6, snap: 0.8, tap: 0.42, dart: 0.34, fume: 0.44, stamp: 0.5 }
// Layer 1, where it goes. rock is how far it tips from tip to heel corner on each hop, dip how deep it squashes on each footfall.
// The walk is plain, the strut confident and proud, the tiptoe nervous and scared, the drag exhausted.
const GAIT: Record<Acting, { stiff: number; damp: number; stride: number; hop: number; top: number; rock: number; dip: number }> = {
  plain: { stiff: 420, damp: 30, stride: 96, hop: 10, top: 5200, rock: 0.12, dip: 1.2 },
  confident: { stiff: 380, damp: 26, stride: 110, hop: 30, top: 5200, rock: 0.34, dip: 3.4 },
  nervous: { stiff: 300, damp: 30, stride: 44, hop: 6, top: 2600, rock: 0.06, dip: 0.6 },
  shocked: { stiff: 520, damp: 30, stride: 96, hop: 14, top: 6000, rock: 0.1, dip: 1.2 },
  angry: { stiff: 560, damp: 30, stride: 80, hop: 16, top: 6000, rock: 0.18, dip: 2.4 },
  scared: { stiff: 640, damp: 34, stride: 60, hop: 12, top: 7000, rock: 0.07, dip: 0.8 },
  proud: { stiff: 340, damp: 26, stride: 120, hop: 32, top: 4200, rock: 0.36, dip: 3.4 },
  exhausted: { stiff: 110, damp: 20, stride: 70, hop: 0, top: 900, rock: 0, dip: 0 }
}
// A dart for cover goes at a scared body's pace and drops to the ground at once.
const DART = { fall: 9000 }
// A rear gets to its place fast, so the lean is held there.
const REAR = { settle: 0.36 }
// The frame of a hit: the body is short and bent away from the blow at once, with no spring to build it, and stands a body's width along the blow, clear of the flash.
const HIT = { squash: 0.58, bend: 0.5, shove: 60, lift: 0.7, hold: 0.07, back: 0.1 }
// The live site's hand: how the body follows a visitor's mouse, whatever it is acting. A 600 px move is 90% done in 100 ms, goes 2.6% past and is at rest in 271 ms. The film keeps each gait's own numbers.
export const HAND = { stiff: 760, damp: 40, top: 7500 }
const SPRING = { squash: { k: 620, c: 26 }, lean: { k: 330, c: 17 }, bend: { k: 260, c: 13 } }
// A hit knocks the body over, past upright onto its other shoulder, and it swings back: the knocked cursor of the approved fire image.
const TUMBLE = { far: 0.6, share: 0.08, out: { k: 900, c: 60 }, back: { k: 900, c: 58 } }
// Thrown through the air it goes tip first: the arrow turns toward the way it flies, most when that is up or to the right. tip is the angle its tip points at rest.
const DIVE = { tip: 2.09, far: 1.25, high: [5, 18] as [number, number], fast: [150, 400] as [number, number] }
const DRAG = { stride: 90, pulse: 0.2, lean: 0.34 }
// Under a visitor's hand the arrow is not thrown by its own walk. `most` is how far the angle as drawn may stand off the standard angle, leaned into from `knee` on, and `rate` how fast it may change, in radians a second: 12 degrees in a frame of 60. A knock by the page lifts both for `thrown` seconds at least and until it is down again, `longest` at most.
export const LED = { most: 0.61, knee: 0.42, rate: 12.5, thrown: 0.12, longest: 1.5 }
// Through a page turn the visitor's arrow lies on its page, leaving and arriving, at the height it stands at, and goes over with it: the pose says `rides` and the view lays it in the slab's plane. `follow` is how fast it goes to that height.
// `fall` is how it comes down from more than `clear` above what it stands on when nothing threw it: it walked off a raised thing.
export const HOVER = { follow: 30, clear: 20, fall: 14000 }
// The principles every move gets by itself: a pull back against the way it sets off, a stretch along the way while it travels, a squash where it stops.
const MOVE = { off: 60, pull: 3, tip: 2.6, long: 0.3, per: 5200, land: 4.8 }
// The arms: `grow` is the spring they sprout on, so the hands travel to what they grab over four to five frames of 60 and go a little past; `toward` is how far the body leans to the hands while they travel, before it leans back against them; `closed` is the grip from which the hands count as shut.
const ARM = { rest: 40, strain: 13, shed: 0.3, snap: 0.035, lean: 0.35, back: 0.45, grow: { k: 1300, c: 47 }, toward: 0.3, closed: 0.999 }
// The seconds over which the arrow is eased from where a page left it to the pointer, unless the page that gives it back names its own.
const HANDBACK = 0.35
// What the body can be drawn at: the springs may ask for more, the pose never does.
// Leaning right is held short of 0.42, where the arrow would stand upright on its tail and stop reading as a cursor.
const LIMIT = { short: 0.55, long: 1.4, left: 0.6, right: 0.34 }
// A limit that is leaned into, never hit: springs stacked on a hit still move the pose all the way.
const soft = (v: number, limit: number): number => limit * Math.tanh(v / limit)
const smooth01 = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}
const softSquash = (v: number): number => (v >= 1 ? 1 + soft(v - 1, LIMIT.long - 1) : 1 - soft(1 - v, 1 - LIMIT.short))
// The spring's own number for a length as drawn: what softSquash turns back into `v`.
const hard = (v: number, limit: number): number => limit * Math.atanh(Math.min(0.999, v / limit))
const hardSquash = (v: number): number => (v >= 1 ? 1 + hard(v - 1, LIMIT.long - 1) : 1 - hard(1 - v, 1 - LIMIT.short))
// In the glass: the arrow is 74 px from corner to corner at rest and the bore of the ball is 84, so it is never drawn longer than this there.
export const GLASS = { long: 1.06 }
// What a page may ask of the body directly: the lengths a press may set.
export const PRESS = { short: 0.58, long: 1.3 }
const softLean = (v: number): number => (v >= 0 ? soft(v, LIMIT.right) : -soft(-v, LIMIT.left))
const GULP = { every: stepHz, steps: Math.round(0.6 * stepHz) }
export const STRIPS = 15
// Where a bolt strikes when nobody says where: the middle of the arrow's head, in the outline's units.
export const STRIKE = { x: 4.3, y: 9.4, reach: 2.1 }
const UNIT_PX = config.cursor.heightPxAt1080 / 19

export interface Strip { x: number; y: number; z: number; rot: number; tilt: number }
interface LooseStrip extends Strip { vx: number; vy: number; vz: number; vr: number; vt: number; rest: boolean; tx: number; ty: number; tr: number; out: number; slow: number }
export interface Wound { kind: Damage; at: number; x: number; y: number }

export interface Face { x: number; y: number; z: number; back: number }

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
  // In the ball alone: where its face looks (a direction in the sheet's space, z out of the page) and how far back from the ball's middle it lies, in px. Null or absent: flat, face up.
  face?: Face | null
  // In the ball alone: the middle of the outline as it is drawn stands on x, y whatever its lean, its turn and its length. Absent or false: the tip's own place does, as on a page.
  centred?: boolean
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
  // Under a visitor's hand in a page turn: it lies on its page and goes over with it. Absent: it stands in the room while the page turns.
  rides?: boolean
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
  face: Face | null
  air: { x: number; y: number } | null
  ground: number
  aloft: boolean
  taken: string | null
  takenFor: number
  drive: { x: number; y: number; z: number } | null
  handback: number
  shove: { x: number; y: number; t: number } | null
  from: { x: number; y: number; over?: number }
  aimed: number | null
  // What the page asks of the body over its springs: an angle struck and held, a length pressed and held, a reaction held at its phase, a swing that dies away.
  struck: { turn: number; left: number } | null
  pressed: { squash: number; left: number } | null
  held: number
  sway: { amount: number; hz: number; whole: number; t: number } | null
  swing: number
  centred: boolean
  // Under a visitor's hand alone: the seconds since the page knocked the arrow, and the angle as it is drawn.
  thrown?: number
  drawn?: number
}

const fresh = (x: number, y: number): State => ({
  x, y, z: hover, vx: 0, vy: 0, vz: 0, squash: 1, squashV: 0, lean: 0, spin: 0, stride: 0, fast: 0, acting: 'plain', reaction: null, reactionLeft: 0,
  damage: [], windowLeft: 0, leanV: 0, spinV: 0, bend: 0, bendV: 0, foot: 1, drag: 0, ticks: 0, dir: 1, feel: freshFeel(), gulp: -1,
  strips: null, seed: config.seed, shreds: 0, sprout: 0, sproutV: 0, strain: 0, grip: 0, shed: 0, shedHands: null, arms: false, hands: null, onPage: true, inBall: false, face: null, air: null, ground: 0, aloft: false, taken: null, takenFor: 0, drive: null, handback: 1, shove: null, from: { x, y }, aimed: null, struck: null, pressed: null, held: 0, sway: null, swing: 0, centred: false
})

export class CursorBody {
  private s: State = fresh(HANDOFF.x, HANDOFF.y)
  // True on the live site, where a visitor's hand moves the body. Not part of the saved state: it never changes in a run.
  hand = false

  reset(x: number, y: number, air = false): void {
    const seed = this.s.seed
    this.s = fresh(x, y)
    this.s.seed = seed
    if (air) {
      this.s.air = { x, y }
      this.s.z = this.hand ? hover : HANDOFF.z
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
    this.s.held = 0
    this.s.dir = this.s.vx < -40 ? -1 : this.s.vx > 40 ? 1 : this.s.dir
    if (name === 'jump' && !this.s.aloft) this.s.vz = Math.max(this.s.vz, 420)
    if (name === 'startle' && !this.s.aloft) this.s.vz = Math.max(this.s.vz, 300)
    if (name === 'flinch' || name === 'duck' || name === 'cower' || name === 'stamp') this.s.squashV -= 4
    if (name === 'recoil') {
      this.s.squash = Math.min(this.s.squash, HIT.squash)
      this.s.squashV = 0
      this.s.bend = HIT.bend * this.s.dir
      this.s.bendV = 0
    }
    if (name === 'doubleTake' || name === 'startle' || name === 'rear') this.s.squashV += 5
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
    if (this.hand) s.thrown = dt
    s.vx += vx
    s.vy += vy
    s.vz += vz * (s.damage.some((w) => w.fresh && w.kind === 'burn') ? HIT.lift : 1)
    const d = Math.hypot(vx, vy)
    if (d < 1) return
    for (const w of s.damage) {
      if (!w.fresh || w.kind !== 'burn') continue
      w.x = STRIKE.x - (vx / d) * STRIKE.reach * 0.6
      w.y = STRIKE.y - (vy / d) * STRIKE.reach * 0.6
      w.fresh = false
      if (s.taken === null && !s.air && !s.inBall) {
        s.x += (vx / d) * HIT.shove
        s.y += (vy / d) * HIT.shove
        s.vx -= vx
        s.vy -= vy
        s.shove = { x: s.x, y: s.y, t: 0 }
        s.dir = vx < -40 ? -1 : vx > 40 ? 1 : s.dir
      }
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

  release(over = HANDBACK): void {
    const s = this.s
    if (s.taken === null) return
    s.taken = null
    s.drive = null
    s.handback = 0
    s.from = over === HANDBACK ? { x: s.x, y: s.y } : { x: s.x, y: s.y, over }
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

  // centred: in the ball the middle of the outline as drawn is kept on the place the body is given, so a page puts it at the ball's middle and nothing else.
  seal(inBall: boolean, centred = false): void {
    this.s.inBall = inBall
    this.s.centred = inBall && centred
    if (!inBall) this.s.face = null
  }

  // The arrow's angle set at once, with no spring to build it, and held for `seconds`. Then the spring takes it back. `turn` is in the sense of `aim`.
  strike(turn: number, seconds: number): void {
    const s = this.s
    s.struck = { turn, left: Math.max(dt, seconds) }
    s.spin = turn - softLean(s.lean)
    s.spinV = 0
  }

  // The body's length as drawn set at once and held for `seconds`: short for a squash on a contact or a brace, long for a reach. Then the spring takes it back.
  press(squash: number, seconds: number): void {
    const s = this.s
    const to = Math.min(s.inBall ? GLASS.long : PRESS.long, Math.max(PRESS.short, squash))
    s.pressed = { squash: to, left: Math.max(dt, seconds) }
    s.squash = hardSquash(to)
    s.squashV = 0
  }

  // The running reaction stops at the phase it has reached and stays there for `seconds`: a held pose. A new reaction ends the hold.
  hold(seconds: number): void {
    if (this.s.reaction !== null) this.s.held = Math.max(0, seconds)
  }

  // A swing of the arrow's angle, `amount` radians to each side at first, `hz` swings a second, that dies away to nothing over `seconds`.
  wobble(amount: number, hz: number, seconds: number): void {
    this.s.sway = { amount, hz, whole: Math.max(dt, seconds), t: 0 }
  }

  aim(turn: number | null): void {
    if (this.s.inBall && (turn === null) !== (this.s.aimed === null)) {
      this.s.spin = turn === null ? 0 : turn - this.s.feel.lean
      this.s.spinV = 0
    }
    this.s.aimed = turn
  }

  turn(face: Face | null): void {
    this.s.face = face ? { ...face } : null
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
    const gait = s.reaction === 'dart' || (s.reaction === 'rear' && s.reactionLeft > REAR.settle) ? GAIT.scared : GAIT[s.acting]
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
      s.handback = Math.min(1, s.handback + dt / (s.from.over ?? HANDBACK))
      const u = s.handback * s.handback * (3 - 2 * s.handback)
      tx = s.from.x + (target.x - s.from.x) * u
      ty = s.from.y + (target.y - s.from.y) * u
    }
    const before = Math.hypot(s.vx, s.vy)
    if (s.shove && !s.air && s.taken === null && !s.inBall) {
      s.shove.t += dt
      const u = Math.min(1, Math.max(0, (s.shove.t - HIT.hold) / HIT.back))
      const k = u * u * (3 - 2 * u)
      s.vx = (s.shove.x + (tx - s.shove.x) * k - s.x) / dt
      s.vy = (s.shove.y + (ty - s.shove.y) * k - s.y) / dt
      const speed = Math.hypot(s.vx, s.vy)
      if (this.hand && speed > HAND.top) {
        s.vx *= HAND.top / speed
        s.vy *= HAND.top / speed
      }
      if (u >= 1) s.shove = null
    } else {
      s.shove = null
      const follow = this.hand && !s.air && s.taken === null && !s.inBall ? HAND : gait
      s.vx += (follow.stiff * (tx - s.x) - follow.damp * s.vx) * dt
      s.vy += (follow.stiff * (ty - s.y) - follow.damp * s.vy) * dt
      const speed = Math.hypot(s.vx, s.vy)
      if (speed > follow.top) {
        s.vx *= follow.top / speed
        s.vy *= follow.top / speed
      }
    }
    s.x += s.vx * dt
    s.y += s.vy * dt
    const now = Math.hypot(s.vx, s.vy)
    if (now >= MOVE.off && before < MOVE.off && s.fast <= 0 && !s.air && s.taken === null && !s.inBall && !s.arms) {
      s.squashV -= MOVE.pull
      s.leanV -= MOVE.tip * Math.sign(s.vx)
    }
    if (now > 320) s.fast = 0.25
    else if (s.fast > 0) {
      s.fast -= dt
      if (now < MOVE.off && before >= MOVE.off) s.squashV -= MOVE.land
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
    const thrown = (s.thrown ?? 0) > 0
    if (this.hand && s.air) tz = hover + s.ground
    const floor = tz + hop
    const high = this.hand && !thrown && !s.air && s.taken === null && !s.inBall && s.z - floor > HOVER.clear
    s.vz += (-(s.reaction === 'dart' ? DART.fall : high ? HOVER.fall : 2400) + 700 * Math.max(0, floor - s.z) - 0) * dt
    if (s.air || s.taken !== null) s.vz = (floor - s.z) * (this.hand && s.air ? HOVER.follow : 9)
    s.z += s.vz * dt
    s.aloft = s.z > floor + 2
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
    let stretch = s.feel.stretch + (pose ? pose.stretch : 0) + Math.min(MOVE.long, now / MOVE.per) + rising + s.feel.bounce * Math.sin((s.ticks / stepHz) * 3 * Math.PI)
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
      const was = s.strain
      s.strain += (pull - s.strain) * Math.min(1, dt * 18)
      lean -= Math.max(-0.6, Math.min(0.6, Math.atan2(hx, Math.max(20, hy)) * ((ARM.lean + ARM.back * s.strain) * s.grip - ARM.toward * (1 - s.grip))))
      stretch += 0.2 * s.strain - Math.min(0.3, (Math.max(0, was - s.strain) / dt) * ARM.snap)
      s.sproutV += (ARM.grow.k * (1 - s.sprout) - ARM.grow.c * s.sproutV) * dt
      s.sprout += s.sproutV * dt
      s.grip += ((s.sprout > 0.8 ? 1 : 0) - s.grip) * Math.min(1, dt * 30)
      if (s.grip > ARM.closed) s.grip = 1
    } else if (s.shed === 0) {
      s.sprout = 0
      s.sproutV = 0
      s.strain = 0
      s.grip = 0
    }
    if (s.inBall) stretch = Math.min(GLASS.long, stretch)
    s.squashV += (SPRING.squash.k * (stretch - s.squash) - SPRING.squash.c * s.squashV) * dt
    s.squash = Math.min(1.6, Math.max(0.35, s.squash + s.squashV * dt))
    if (s.inBall && s.squash > GLASS.long) {
      s.squash = GLASS.long
      s.squashV = Math.min(0, s.squashV)
    }
    if (s.pressed) {
      s.squash = hardSquash(Math.min(s.inBall ? GLASS.long : PRESS.long, s.pressed.squash))
      s.squashV = 0
      s.pressed.left -= dt
      if (s.pressed.left <= dt / 2) s.pressed = null
    }
    const free = !s.air && s.taken === null && !s.inBall
    const flying = free && (!this.hand || thrown) && s.reaction !== 'rear' && s.reaction !== 'dart' && s.reaction !== 'fume' ? smooth01((s.z - floor - DIVE.high[0]) / (DIVE.high[1] - DIVE.high[0])) * smooth01((now - DIVE.fast[0]) / (DIVE.fast[1] - DIVE.fast[0])) : 0
    const aimed = free || s.inBall ? s.aimed : null
    const knocked = s.reaction === 'recoil' && pose && 1 - s.reactionLeft / REACTION_SECONDS.recoil < TUMBLE.share
    const over = (knocked ? TUMBLE.far * s.dir : flying > 0 ? DIVE.far * Math.sin(DIVE.tip - Math.atan2(-s.vy, s.vx)) * flying : 0) + (pose ? pose.turn * (aimed !== null ? 0.3 : 1) : 0) + (aimed !== null ? aimed - s.feel.lean : 0)
    const swing = over !== 0 ? TUMBLE.out : TUMBLE.back
    s.spinV += (swing.k * (over - s.spin) - swing.c * s.spinV) * dt
    s.spin += s.spinV * dt
    if (over === 0 && Math.abs(s.spin) < 1e-4 && Math.abs(s.spinV) < 1e-3) {
      s.spin = 0
      s.spinV = 0
    }
    s.leanV += (SPRING.lean.k * (Math.max(-0.9, Math.min(0.9, lean)) - s.lean) - SPRING.lean.c * s.leanV) * dt
    s.lean += s.leanV * dt
    if (s.struck) {
      s.spin = s.struck.turn - softLean(s.lean)
      s.spinV = 0
      s.struck.left -= dt
      if (s.struck.left <= dt / 2) s.struck = null
    }
    s.swing = 0
    if (s.sway) {
      s.sway.t += dt
      const u = s.sway.t / s.sway.whole
      if (u >= 1) s.sway = null
      else s.swing = s.sway.amount * (1 - u) * (1 - u) * Math.sin(2 * Math.PI * s.sway.hz * s.sway.t)
    }
    if (this.hand) {
      const want = softLean(s.lean) + s.spin + s.swing
      if (thrown) {
        s.thrown = (s.thrown ?? 0) + dt
        if ((s.thrown > LED.thrown && !s.aloft) || s.thrown > LED.longest) s.thrown = 0
      }
      const led = !thrown && !s.inBall && s.taken === null && s.aimed === null && s.struck === null && s.reaction !== 'recoil'
      if (led && s.drawn !== undefined) {
        const to = Math.abs(want) <= LED.knee ? want : Math.sign(want) * (LED.knee + soft(Math.abs(want) - LED.knee, LED.most - LED.knee))
        s.drawn += Math.max(-LED.rate * dt, Math.min(LED.rate * dt, to - s.drawn))
      } else s.drawn = want
    }
    s.bendV += (SPRING.bend.k * (s.feel.bend + (pose ? pose.bend : 0) - ax * 0.9 - ay * 0.35 - s.bend) - SPRING.bend.c * s.bendV) * dt
    s.bend = Math.max(-1, Math.min(1, s.bend + s.bendV * dt))
    const beat = s.ticks % GULP.every
    s.gulp = s.acting === 'nervous' && beat < GULP.steps ? beat / GULP.steps : -1
    if (s.gulp === 0) s.squashV -= 1.6
    if (s.reaction !== null) {
      if (s.held > dt / 2) s.held -= dt
      else {
        s.held = 0
        s.reactionLeft -= dt
        if (s.reactionLeft <= 0) s.reaction = null
      }
    } else s.held = 0
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
        } else if (shreds) {
          fall(s.strips)
          stir(s.strips, shreds.left)
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
      ...(this.hand && s.air ? { rides: true } : {}), x: s.x, y: s.y, z: s.z, squash: softSquash(s.squash), lean: softLean(s.lean), spin: this.hand && s.drawn !== undefined ? s.drawn - softLean(s.lean) : s.spin + s.swing, acting: s.acting, reaction: s.reaction,
      reactionAt: s.reaction ? 1 - s.reactionLeft / REACTION_SECONDS[s.reaction] : 0,
      damage: s.damage.map((d) => d.kind), healing, arms: arms && hands !== null, hands: arms && hands ? [{ ...hands[0] }, { ...hands[1] }] : null, onPage: s.onPage, inBall: s.inBall, face: s.inBall && s.face ? { ...s.face } : null, centred: s.inBall && s.centred, taken: s.taken !== null, scale: 1,
      bend: s.bend, feel: { ...s.feel }, gulp: s.gulp,
      wounds: s.damage.map((d) => ({ kind: d.kind, at: Math.min(1, Math.max(0, 1 - d.left / Math.max(d.whole, dt))), x: d.x, y: d.y })),
      strips: s.strips ? s.strips.map(emerged) : null,
      sprout: s.sprout, strain: s.strain, grip: [s.grip, s.grip], shed: shed ? s.shed / ARM.shed : 0
    }
  }

  save(): unknown {
    return JSON.parse(JSON.stringify(this.s))
  }

  load(state: unknown): void {
    this.s = { ...fresh(0, 0), ...(JSON.parse(JSON.stringify(state)) as State) }
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
const FAN = { away: [34, -58], pinch: [14, -10], pull: 0.18, from: -0.38, to: 0.42, wobble: 0.12, stagger: 6, across: 0.9 }

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
  return { x: FAN.away[0]! + toX + dx * cut.half - cut.x, y: FAN.away[1]! + toY + dy * cut.half - cut.y, z: layer(i), rot, tilt: 0 }
}

// How the strips come out of the shredder's mouth: the least and the most seconds a strip takes, and how far up under the hood it starts, in page pixels, lying low until it is out.
const EMERGE = { least: 0.05, most: 0.12, under: 18 }

function emerged(p: LooseStrip): Strip {
  const e = Math.min(1, Math.max(0, p.out))
  return { x: p.x, y: p.y + (1 - e) * EMERGE.under, z: p.z * e * e, rot: p.rot, tilt: p.tilt * e }
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
      tx: to.x, ty: to.y, tr: to.rot, out: 0, slow: EMERGE.least + h(10) * (EMERGE.most - EMERGE.least)
    })
  }
  return out
}

const layer = (i: number): number => 0.4 + ((i * 7) % STRIPS) * 0.22

// One step of the loose strips: each falls, lands on the pile at its own layer, skids to its place in the fan and comes to rest.
function fall(strips: LooseStrip[]): void {
  strips.forEach(drop)
}

function drop(p: LooseStrip, i: number): void {
  if (p.out < 1) p.out = Math.min(1, p.out + dt / p.slow)
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

// The pile stirs before it stands: in its last moments on the page each strip at rest twitches about its place and lifts a little, more and more.
const STIR = { seconds: 0.42, rot: 0.11, lift: 5, rate: 34 }
function stir(strips: LooseStrip[], left: number): void {
  if (left > STIR.seconds) return
  const u = 1 - Math.max(0, left) / STIR.seconds
  strips.forEach((p, i) => {
    if (!p.rest) return
    const wave = Math.sin(u * STIR.rate + i * 2.4)
    p.rot = p.tr + STIR.rot * u * wave
    p.z = layer(i) + STIR.lift * u * Math.abs(wave)
  })
}

// Where a strip stands before it snaps true: out of line, every other strip a step up or down its own length, so the ends make a ragged comb that reads from far.
const ASKEW = { across: 0.7, along: 4, step: 3.4, rot: 0.05 }
export function askew(i: number, seed: number): Strip {
  const h = (k: number) => hash01(i, k + 20, seed)
  const along = (i % 2 ? 1 : -1) * ASKEW.step + (h(2) - 0.5) * ASKEW.along
  const across = (h(1) - 0.5) * ASKEW.across
  return { x: along * STRIP_AXIS[0] + across * STRIP_AXIS[1], y: -along * STRIP_AXIS[1] + across * STRIP_AXIS[0], z: i % 2 ? 0.9 : 0.3, rot: (h(3) - 0.5) * ASKEW.rot, tilt: 0 }
}

const GATHER = { stand: 0.4, snap: 0.8, true: 0.87 }

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
  const face = a.face && b.face ? { x: mix(a.face.x, b.face.x), y: mix(a.face.y, b.face.y), z: mix(a.face.z, b.face.z), back: mix(a.face.back, b.face.back) } : b.face ?? null
  return {
    ...b, face, x: mix(a.x, b.x), y: mix(a.y, b.y), z: mix(a.z, b.z), squash: mix(a.squash, b.squash), lean: mix(a.lean, b.lean), spin: mix(a.spin, b.spin), healing: mix(a.healing, b.healing), hands,
    bend: mix(a.bend, b.bend), feel, gulp: a.gulp >= 0 && b.gulp >= a.gulp ? mix(a.gulp, b.gulp) : b.gulp, wounds, strips,
    sprout: mix(a.sprout, b.sprout), strain: mix(a.strain, b.strain), grip: [mix(a.grip[0], b.grip[0]), mix(a.grip[1], b.grip[1])], shed: b.shed >= a.shed ? mix(a.shed, b.shed) : b.shed
  }
}
