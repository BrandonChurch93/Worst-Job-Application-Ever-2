import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'
import { CRANK, DIAL, FH, FW, FX, rowY, SLOT } from './layout'

interface P { x: number; y: number }
interface Seg { from: number; to: number; at: (u: number) => P }

const ease = (u: number): number => u * u * (3 - 2 * u)
const line = (from: number, to: number, a: P, b: P): Seg => ({ from, to, at: (u) => ({ x: a.x + (b.x - a.x) * ease(u), y: a.y + (b.y - a.y) * ease(u) }) })
const arc = (from: number, to: number, c: P, r: number, a0: number, a1: number, shape: (u: number) => number = ease): Seg => ({ from, to, at: (u) => ({ x: c.x + r * Math.cos(a0 + (a1 - a0) * shape(u)), y: c.y + r * Math.sin(a0 + (a1 - a0) * shape(u)) }) })

const strides = (from: number, to: number, a: P, b: P, n: number, rest: number): Seg[] =>
  Array.from({ length: n }, (_, i) => {
    const at = (k: number): P => ({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n })
    const t0 = from + ((to - from) * i) / n
    const t1 = from + ((to - from) * (i + 1)) / n
    return [line(t0, t1 - rest, at(i), at(i + 1)), line(t1 - rest, t1, at(i + 1), at(i + 1))]
  }).flat()

// A strut: each stride is a hop, up off the line of the walk and down on it again.
const strut = (from: number, to: number, a: P, b: P, n: number, hop: number): Seg[] =>
  Array.from({ length: n }, (_, i) => {
    const t0 = from + ((to - from) * i) / n
    const t1 = from + ((to - from) * (i + 1)) / n
    return { from: t0, to: t1, at: (u: number) => ({ x: a.x + ((b.x - a.x) * (i + ease(u))) / n, y: a.y + ((b.y - a.y) * (i + ease(u))) / n - hop * Math.sin(Math.PI * u) }) }
  })

const field = (i: number): P => ({ x: FX + FW * 0.5, y: rowY(i) + FH / 2 })
const dialC: P = { x: DIAL.cx, y: DIAL.cy }
export const FILM_DIGITS = [10, 1, 5]
const holeAt = (k: number, a = 0): P => ({ x: DIAL.cx + DIAL.ring * Math.cos(DIAL.holeAngle(k) + a), y: DIAL.cy + DIAL.ring * Math.sin(DIAL.holeAngle(k) + a) })
const woundAt = (k: number): P => holeAt(k, DIAL.travel(k))
// Between two numbers it rests its tip on the lower right shoulder of the cap. The pointer leads past it first, so the strut is there in time and settles on it.
const shoulder: P = { x: DIAL.cx + 15, y: DIAL.cy + 14 }
const lead: P = { x: DIAL.cx - 17, y: DIAL.cy - 1 }
export const LANDING: P = { x: DIAL.cx - 600, y: DIAL.cy + 30 }
const knob: P = { x: SLOT.leverX, y: SLOT.knobY }
const pulled: P = { x: SLOT.leverX, y: SLOT.knobY + SLOT.pull + 6 }
const watch: P = { x: SLOT.leverX + 44, y: SLOT.y + 64 }
const peer: P = { x: watch.x - 14, y: watch.y + 4 }
const hub: P = { x: CRANK.hx, y: CRANK.hy }
const grip: P = { x: CRANK.hx + CRANK.arm * Math.cos(CRANK.rest), y: CRANK.hy + CRANK.arm * Math.sin(CRANK.rest) }
const TURNS = 3.03
export const AWAY: P = { x: CRANK.hx + 636, y: CRANK.hy - 6 }
const away = AWAY
const caught: P = { x: CRANK.hx + 37, y: CRANK.hy - 100 }
const thrown: P = { x: caught.x + 127, y: caught.y + 27 }
const shrunk: P = { x: thrown.x - 12, y: thrown.y + 26 }
const WARNED = { see: 17.3, back: 17.38, held: 17.96, half: 18.62, stall: 18.95 }
export const BUTTON: P = { x: 1688, y: 1004 }
const beside: P = { x: BUTTON.x - 160, y: BUTTON.y - 30 }
const halfway: P = { x: shrunk.x + (beside.x - shrunk.x) * 0.42, y: shrunk.y + (beside.y - shrunk.y) * 0.42 }
const coiled: P = { x: beside.x - 18, y: beside.y - 9 }

const T = {
  phone: 1.88, zero: 2.31, one: 2.83, third: 3.8,
  birth: 8.2, lever: 9.15,
  volume: 14.0, crank: 14.45, runaway: 15.17, lean: 16.32, press: 20.42
}

// Each idea of the acting has its own times: the wind-up, the move, the pose and how long it is held.
// It looks easy: it stands between the rows, strolls to the first field and taps it as if it owned the page.
// The page arrives with the cursor in the air at the hand-off place and sets it down there at 0.5 s. The pointer waits under it and then walks to where it stands at rest, so the cursor does not dash across the page after a pointer that stood somewhere else.
const ARRIVE = { look: 0.52, there: 0.8 }
const HAUL = 0.42
const EASY = { eye: 1.02, load: 1.03, stroll: 1.12, there: 1.66, tap: T.phone - 0.14, steps: 3, hop: 14, tall: 1.26, low: 0.9, land: 0.05, chest: 0.14 }
// A row opens under it. The first time it only starts, the second time it rears, the third time it has lost its temper and stamps the field open.
const DREAD = { phone: { start: T.phone + 0.08, go: T.phone + 0.27 }, birth: { rear: T.birth + 0.08, go: T.birth + 0.5 } }
// The lever: it has learnt to be careful, so it draws the knob up a little before it pulls.
const PULL = { there: 8.9, back: 8.93, up: 9.08, rise: 12 }
// The coins: it hides, shakes them off where it is safe, and comes back angry. The temper is spent on the stamp: it takes the crank with a cool head.
// The reels: it leans in to watch them, small and tight. The coins: it goes flat under them where it stands, held, and then darts for cover.
const STRUCK = { tight: T.lever + 0.9, brace: 10.55, read: 10.9, near: 11.9, duck: 12.0, flee: 12.56 }
const TEMPER = { safe: 12.74, dust: 12.78, fume: 13.3, red: 13.5, march: 13.52, there: 13.86, stamp: T.volume - 0.1, go: T.volume + 0.22, spent: T.volume + 0.16 }
// The crank throws it clear. It cowers where it lands, and then goes back in to stop it.
// Flat, it drags itself to the button and stops short of it. Half way it heaves and falls flat again. There it peels up and fills out, standing still, draws back, and throws itself at the button.
const RISE = { heave: 18.45, heaved: 2.35, there: 19.6, flop: 19.77, life: 0.6, back: 20.37, coiled: 20.385, on: 20.41 }
export const PEEL_AT = RISE.flop + RISE.life * 0.5
export const TOSS = { at: 0.05, air: 0.28, skid: 0.1 }
const THROWN = { see: T.runaway + TOSS.at, off: T.runaway + TOSS.at + 0.12, look: T.runaway + TOSS.at + TOSS.air + TOSS.skid + 0.02, tall: 0.37, snap: 0.59, back: T.lean - 0.08, turn: -0.9, off2: 0.45, again: -1.15, square: -2.3 }
const idle: P = { x: 1575, y: 392 }
const refuge: P = { x: 1796, y: 704 }
const hand: P = { x: HANDOFF.x, y: HANDOFF.y }

const wind = (t: number, k: number, long: number): Seg[] => [
  arc(t, t + long, dialC, DIAL.ring, DIAL.holeAngle(k), DIAL.holeAngle(k) + DIAL.travel(k) + 0.04, (u) => u),
  line(t + long, t + long + 0.02, woundAt(k), woundAt(k))
]

const path: Seg[] = [
  line(0, ARRIVE.look, hand, hand),
  line(ARRIVE.look, ARRIVE.there, hand, idle),
  line(ARRIVE.there, EASY.stroll, idle, idle),
  ...strut(EASY.stroll, EASY.there, idle, field(0), EASY.steps, EASY.hop),
  line(EASY.there, DREAD.phone.go, field(0), field(0)),
  line(DREAD.phone.go, T.zero - 0.04, field(0), holeAt(10)),
  line(T.zero - 0.04, T.zero, holeAt(10), holeAt(10)),
  ...wind(T.zero, 10, 0.24),
  line(T.zero + 0.26, T.one - 0.06, woundAt(10), holeAt(1)),
  line(T.one - 0.06, T.one, holeAt(1), holeAt(1)),
  ...wind(T.one, 1, 0.1),
  line(T.one + 0.12, T.one + 0.19, woundAt(1), lead),
  line(T.one + 0.19, 3.18, lead, lead),
  line(3.18, 3.2, lead, shoulder),
  line(3.2, 3.5, shoulder, shoulder),
  line(3.5, T.third - 0.2, shoulder, holeAt(5)),
  line(T.third - 0.2, T.third, holeAt(5), holeAt(5)),
  ...wind(T.third, 5, HAUL - 0.01),
  line(T.third + HAUL + 0.01, T.third + 0.9, woundAt(5), woundAt(5)),
  line(T.third + 0.9, T.third + 1.2, woundAt(5), LANDING),
  line(T.third + 1.2, 7.55, LANDING, LANDING),
  line(7.55, T.birth - 0.06, LANDING, field(1)),
  line(T.birth - 0.06, DREAD.birth.go, field(1), field(1)),
  line(DREAD.birth.go, PULL.there, field(1), knob),
  line(PULL.there, PULL.back, knob, knob),
  line(PULL.back, PULL.up, knob, { x: knob.x, y: knob.y - PULL.rise }),
  line(PULL.up, T.lever, { x: knob.x, y: knob.y - PULL.rise }, knob),
  line(T.lever, T.lever + 0.3, knob, pulled),
  line(T.lever + 0.3, T.lever + 0.64, pulled, pulled),
  line(T.lever + 0.64, T.lever + 0.9, pulled, watch),
  line(T.lever + 0.9, STRUCK.near, watch, peer),
  line(STRUCK.near, STRUCK.flee, peer, peer),
  line(STRUCK.flee, TEMPER.safe, peer, refuge),
  line(TEMPER.safe, TEMPER.march, refuge, refuge),
  line(TEMPER.march, TEMPER.there, refuge, field(2)),
  line(TEMPER.there, TEMPER.go, field(2), field(2)),
  line(TEMPER.go, T.crank - 0.05, field(2), grip),
  line(T.crank - 0.05, T.crank, grip, grip),
  arc(T.crank, T.runaway + 0.01, hub, CRANK.arm, CRANK.rest, CRANK.rest + TURNS * 2 * Math.PI, (u) => u * (1.25 - 0.25 * u)),
  line(T.runaway + 0.01, THROWN.see, grip, grip),
  line(THROWN.see, THROWN.off, grip, away),
  line(THROWN.off, T.lean, away, away),
  line(T.lean, T.lean + 0.3, away, caught),
  line(T.lean + 0.3, 16.85, caught, caught),
  line(16.85, 17.0, caught, thrown),
  line(17.0, WARNED.see, thrown, thrown),
  line(WARNED.see, WARNED.back, thrown, shrunk),
  line(WARNED.back, WARNED.held, shrunk, shrunk),
  line(WARNED.held, WARNED.half, shrunk, halfway),
  line(WARNED.half, WARNED.stall, halfway, halfway),
  line(WARNED.stall, RISE.there, halfway, beside),
  line(RISE.there, RISE.back, beside, beside),
  line(RISE.back, RISE.coiled, beside, coiled),
  line(RISE.coiled, RISE.on, coiled, BUTTON),
  line(RISE.on, 21, BUTTON, BUTTON)
]

const presses: [number, number][] = [
  [T.phone, T.phone + 0.1],
  [T.zero, T.zero + 0.25], [T.one, T.one + 0.11], [T.third, T.third + HAUL],
  [T.birth, T.birth + 0.12],
  [PULL.back, T.lever + 0.6],
  [T.volume, T.volume + 0.1],
  [T.crank, T.runaway + 0.05],
  [T.press, T.press + 0.12]
]

export function pointerAt(time: number): Pointer {
  const t = Math.max(0, time)
  let seg = path[path.length - 1]!
  for (const s of path) {
    if (t < s.to) {
      seg = s
      break
    }
  }
  const u = Math.min(1, Math.max(0, (t - seg.from) / Math.max(1e-9, seg.to - seg.from)))
  const p = seg.at(u)
  return { x: p.x, y: p.y, down: presses.some(([a, b]) => t >= a && t < b) }
}

export type Mark = 'fling' | 'strike'
export type Marks = Partial<Record<Mark, number>>

const acts: [number | Mark, Acting][] = [
  [0, 'plain'], [EASY.eye, 'confident'], [T.third + HAUL, 'scared'], ['fling', 'shocked'], [6.5, 'nervous'], [9.5, 'plain'], [STRUCK.tight, 'nervous'], [11.0, 'shocked'], ['strike', 'scared'], [TEMPER.red, 'angry'], [TEMPER.spent, 'plain'],
  [THROWN.see, 'shocked'], [THROWN.back, 'angry'], [16.95, 'exhausted'], [RISE.flop + RISE.life * 0.78, 'plain']
]

export function actingAt(time: number, marks: Marks = {}): Acting {
  let out: Acting = 'plain'
  for (const [at, a] of acts) {
    const from = typeof at === 'number' ? at : marks[at]
    if (from !== undefined && time >= from) out = a
  }
  return out
}

// One reaction for one cause, and no reaction twice: the page itself adds a recoil where the dial throws it down and a flinch under the coins.
export const reactions: [number, Reaction][] = [
  [EASY.tap, 'tap'], [DREAD.phone.start, 'startle'], [3.3, 'jump'], [T.third - 0.12, 'anticipate'], [DREAD.birth.rear, 'rear'], [STRUCK.duck, 'duck'], [STRUCK.flee, 'dart'], [TEMPER.dust, 'dustOff'], [TEMPER.fume, 'fume'],
  [TEMPER.stamp, 'stamp'], [THROWN.look, 'doubleTake'], [T.press + 0.2, 'snap']
]

// What the body is told outright, where a state and a reaction do not say enough: a turn of the whole arrow that is kept, a length that is held, and the flat body laid down again so that it peels where it is seen.
export type Pose = [number, 'aim', number | null] | [number, 'press', number, number] | [number, 'flat', number] | [number, 'hold', number] | [number, 'wobble', number, number, number]
export const poses: Pose[] = [
  [EASY.eye, 'aim', EASY.chest], [EASY.load, 'press', EASY.tall, EASY.stroll - EASY.load],
  ...Array.from({ length: EASY.steps }, (_, i): Pose[] => {
    const long = (EASY.there - EASY.stroll) / EASY.steps
    return [[EASY.stroll + i * long, 'press', EASY.tall, long - EASY.land], [EASY.stroll + (i + 1) * long - EASY.land, 'press', EASY.low, EASY.land]]
  }).flat(),
  [EASY.there, 'press', EASY.tall, 0.05], [EASY.there + 0.04, 'aim', null],
  [DREAD.phone.go - 0.05, 'press', 0.7, 0.06], [DREAD.phone.go + 0.01, 'press', 1.32, 0.1],
  [T.zero, 'aim', 0.5], [T.zero, 'press', 1.26, 0.22], [T.zero + 0.24, 'press', 0.66, 0.1], [T.zero + 0.26, 'aim', null],
  [T.third, 'aim', 0.85], [T.third, 'press', 1.36, HAUL - 0.06], [T.third + HAUL - 0.06, 'press', 0.62, 0.06], [T.third + HAUL - 0.01, 'aim', null],
  [6.5, 'aim', 0.9], [6.5, 'press', 0.7, 0.5], [7.5, 'aim', null],
  [PULL.back, 'aim', 0.5], [PULL.back, 'press', 0.78, PULL.up - PULL.back], [T.lever, 'aim', null],
  [T.lever + 0.02, 'press', 1.38, 0.2],
  [T.lever + 0.3, 'press', 0.72, 0.3],
  [STRUCK.tight, 'aim', -0.5],
  [STRUCK.brace, 'press', 0.74, STRUCK.read - STRUCK.brace],
  [STRUCK.read, 'aim', 0.34], [STRUCK.read, 'press', 1.3, 0.5],
  [STRUCK.near, 'aim', null], [STRUCK.duck + 0.3, 'hold', 0.2],
  [TEMPER.safe, 'wobble', 0.5, 9, 0.5], [TEMPER.safe, 'aim', -1], [TEMPER.safe + 0.04, 'press', 0.66, TEMPER.fume - TEMPER.safe - 0.04], [TEMPER.fume, 'aim', null], [TEMPER.fume, 'press', 1.3, 0.12],
  [THROWN.look + 0.02, 'aim', THROWN.turn], [THROWN.look + 0.13, 'aim', THROWN.off2], [THROWN.look + 0.25, 'aim', THROWN.again], [THROWN.look + THROWN.tall, 'press', 1.42, THROWN.snap - THROWN.tall], [THROWN.look + THROWN.snap, 'press', 0.7, 0.06],
  [T.lean, 'aim', THROWN.square], [T.lean + 0.3, 'press', 1.22, 0.16],
  [WARNED.see, 'aim', -1.1], [WARNED.see + 0.02, 'wobble', 0.6, 11, 0.4], [WARNED.held - 0.04, 'aim', null], [WARNED.half, 'aim', -0.7], [WARNED.stall, 'aim', null],
  [RISE.heave, 'flat', RISE.heaved], [RISE.flop, 'flat', RISE.life],
  [RISE.back, 'press', 0.78, RISE.coiled - RISE.back],
  [RISE.coiled, 'press', 1.28, RISE.on - RISE.coiled],
  [T.press, 'press', 0.55, 0.12], [T.press + 0.12, 'press', 1.36, 0.08]
]
