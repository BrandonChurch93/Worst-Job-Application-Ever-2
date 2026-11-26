import type { Acting, Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'
import { CRANK, DIAL, FH, FW, FX, rowY, SLOT } from './layout'

interface P { x: number; y: number }
interface Seg { from: number; to: number; at: (u: number) => P }

const ease = (u: number): number => u * u * (3 - 2 * u)
const line = (from: number, to: number, a: P, b: P): Seg => ({ from, to, at: (u) => ({ x: a.x + (b.x - a.x) * ease(u), y: a.y + (b.y - a.y) * ease(u) }) })
const arc = (from: number, to: number, c: P, r: number, a0: number, a1: number, shape: (u: number) => number = ease): Seg => ({ from, to, at: (u) => ({ x: c.x + r * Math.cos(a0 + (a1 - a0) * shape(u)), y: c.y + r * Math.sin(a0 + (a1 - a0) * shape(u)) }) })

const field = (i: number): P => ({ x: FX + FW * 0.5, y: rowY(i) + FH / 2 })
const dialC: P = { x: DIAL.cx, y: DIAL.cy }
export const FILM_DIGITS = [10, 1, 5]
const holeAt = (k: number, a = 0): P => ({ x: DIAL.cx + DIAL.ring * Math.cos(DIAL.holeAngle(k) + a), y: DIAL.cy + DIAL.ring * Math.sin(DIAL.holeAngle(k) + a) })
const woundAt = (k: number): P => holeAt(k, DIAL.travel(k))
export const LANDING: P = { x: DIAL.cx - 600, y: DIAL.cy + 30 }
const knob: P = { x: SLOT.leverX, y: SLOT.knobY }
const pulled: P = { x: SLOT.leverX, y: SLOT.knobY + SLOT.pull + 6 }
const watch: P = { x: SLOT.leverX + 6, y: SLOT.y + SLOT.h + 6 }
const hub: P = { x: CRANK.hx, y: CRANK.hy }
const grip: P = { x: CRANK.hx + CRANK.arm * Math.cos(CRANK.rest), y: CRANK.hy + CRANK.arm * Math.sin(CRANK.rest) }
const TURNS = 3.03
const away: P = { x: CRANK.hx + 636, y: CRANK.hy - 6 }
const caught: P = { x: CRANK.hx + 37, y: CRANK.hy - 100 }
export const BUTTON: P = { x: 1688, y: 1004 }

const T = {
  phone: 1.88, zero: 2.33, one: 2.99, third: 4.25,
  birth: 8.2, lever: 9.15,
  volume: 14.0, crank: 14.45, runaway: 15.17, lean: 16.32, press: 20.3
}

// Each idea of the acting has its own times: the wind-up, the move, the pose and how long it is held.
// It looks easy: it stands between the rows, strolls to the first field and taps it as if it owned the page.
const EASY = { stroll: 1.06, there: 1.62, tap: T.phone - 0.14 }
// A row opens under it. The first time it only starts, the second time it rears, the third time it has lost its temper and stamps the field open.
const DREAD = { phone: { start: T.phone + 0.08, go: T.phone + 0.27 }, birth: { rear: T.birth + 0.08, go: T.birth + 0.5 } }
// The lever: it has learnt to be careful, so it draws the knob up a little before it pulls.
const PULL = { there: 8.98, back: 9.03, up: 9.11, rise: 12 }
// The coins: it hides, shakes them off where it is safe, and comes back angry.
const TEMPER = { safe: 12.7, dust: 12.76, red: 13.36, march: 13.52, there: 13.86, stamp: T.volume - 0.1, go: T.volume + 0.22 }
// The crank throws it clear. It cowers where it lands, and then goes back in to stop it.
const THROWN = { see: T.runaway + 0.05, cower: T.runaway + 0.43, back: T.lean - 0.08 }
const idle: P = { x: 1575, y: 395 }
const refuge: P = { x: 800, y: 700 }

const wind = (t: number, k: number, long: number): Seg[] => [
  arc(t, t + long, dialC, DIAL.ring, DIAL.holeAngle(k), DIAL.holeAngle(k) + DIAL.travel(k) + 0.04, (u) => u),
  line(t + long, t + long + 0.02, woundAt(k), woundAt(k))
]

const path: Seg[] = [
  line(0, EASY.stroll, idle, idle),
  line(EASY.stroll, EASY.there, idle, field(0)),
  line(EASY.there, DREAD.phone.go, field(0), field(0)),
  line(DREAD.phone.go, T.zero - 0.04, field(0), holeAt(10)),
  line(T.zero - 0.04, T.zero, holeAt(10), holeAt(10)),
  ...wind(T.zero, 10, 0.3),
  line(T.zero + 0.32, T.one - 0.06, woundAt(10), holeAt(1)),
  line(T.one - 0.06, T.one, holeAt(1), holeAt(1)),
  ...wind(T.one, 1, 0.1),
  line(T.one + 0.12, 3.5, woundAt(1), woundAt(1)),
  line(3.5, T.third - 0.2, woundAt(1), holeAt(5)),
  line(T.third - 0.2, T.third, holeAt(5), holeAt(5)),
  ...wind(T.third, 5, 0.55),
  line(T.third + 0.57, T.third + 0.9, woundAt(5), woundAt(5)),
  line(T.third + 0.9, T.third + 1.2, woundAt(5), LANDING),
  line(T.third + 1.2, 7.55, LANDING, LANDING),
  line(7.55, T.birth - 0.06, LANDING, field(1)),
  line(T.birth - 0.06, DREAD.birth.go, field(1), field(1)),
  line(DREAD.birth.go, PULL.there, field(1), knob),
  line(PULL.there, PULL.back, knob, knob),
  line(PULL.back, PULL.up, knob, { x: knob.x, y: knob.y - PULL.rise }),
  line(PULL.up, T.lever, { x: knob.x, y: knob.y - PULL.rise }, knob),
  line(T.lever, T.lever + 0.3, knob, pulled),
  line(T.lever + 0.3, T.lever + 0.45, pulled, pulled),
  line(T.lever + 0.45, T.lever + 0.9, pulled, watch),
  line(T.lever + 0.9, 11.98, watch, { x: watch.x + 10, y: watch.y + 4 }),
  line(11.98, 12.25, { x: watch.x + 10, y: watch.y + 4 }, { x: 1180, y: 850 }),
  line(12.25, TEMPER.safe, { x: 1180, y: 850 }, refuge),
  line(TEMPER.safe, TEMPER.march, refuge, refuge),
  line(TEMPER.march, TEMPER.there, refuge, field(2)),
  line(TEMPER.there, TEMPER.go, field(2), field(2)),
  line(TEMPER.go, T.crank - 0.05, field(2), grip),
  line(T.crank - 0.05, T.crank, grip, grip),
  arc(T.crank, T.runaway + 0.01, hub, CRANK.arm, CRANK.rest, CRANK.rest + TURNS * 2 * Math.PI, (u) => u * (1.25 - 0.25 * u)),
  line(T.runaway + 0.01, T.runaway + 0.36, grip, away),
  line(T.runaway + 0.36, T.lean, away, away),
  line(T.lean, T.lean + 0.3, away, caught),
  line(T.lean + 0.3, 17.7, caught, caught),
  line(17.7, 19.9, caught, { x: BUTTON.x - 40, y: BUTTON.y - 4 }),
  line(19.9, 20.24, { x: BUTTON.x - 40, y: BUTTON.y - 4 }, BUTTON),
  line(20.24, 21, BUTTON, BUTTON)
]

const presses: [number, number][] = [
  [T.phone, T.phone + 0.1],
  [T.zero, T.zero + 0.31], [T.one, T.one + 0.11], [T.third, T.third + 0.56],
  [T.birth, T.birth + 0.12],
  [T.lever, T.lever + 0.36],
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
  [0, 'confident'], [T.third + 0.56, 'scared'], ['fling', 'shocked'], [6.5, 'nervous'], [9.5, 'plain'], [11.0, 'shocked'], ['strike', 'scared'], [TEMPER.red, 'angry'],
  [THROWN.see, 'shocked'], [THROWN.back, 'angry'], [16.95, 'exhausted'], [20.28, 'plain']
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
  [EASY.tap, 'tap'], [DREAD.phone.start, 'startle'], [3.3, 'jump'], [T.third - 0.12, 'anticipate'], [6.6, 'doubleTake'], [DREAD.birth.rear, 'rear'], [TEMPER.dust, 'dustOff'],
  [TEMPER.stamp, 'stamp'], [THROWN.cower, 'cower']
]
