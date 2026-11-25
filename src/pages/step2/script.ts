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
export const FILM_HOLE = 5
const holeAt = (a: number): P => ({ x: DIAL.cx + DIAL.ring * Math.cos(DIAL.holeAngle(FILM_HOLE) + a), y: DIAL.cy + DIAL.ring * Math.sin(DIAL.holeAngle(FILM_HOLE) + a) })
const hole = holeAt(0)
const wound = holeAt(DIAL.travel(FILM_HOLE))
export const LANDING: P = { x: DIAL.cx - 600, y: DIAL.cy + 30 }
const knob: P = { x: SLOT.leverX, y: SLOT.knobY }
const pulled: P = { x: SLOT.leverX, y: SLOT.knobY + SLOT.pull + 6 }
const watch: P = { x: SLOT.leverX + 6, y: SLOT.y + SLOT.h + 6 }
const hub: P = { x: CRANK.hx, y: CRANK.hy }
const grip: P = { x: CRANK.hx + CRANK.arm, y: CRANK.hy }
const TURNS = 3.06
const caught: P = { x: CRANK.hx + CRANK.arm * Math.cos(TURNS * 2 * Math.PI), y: CRANK.hy + CRANK.arm * Math.sin(TURNS * 2 * Math.PI) }
export const BUTTON: P = { x: 1688, y: 1004 }

const dial = (t: number): Seg[] => [
  arc(t, t + 0.4, dialC, DIAL.ring, DIAL.holeAngle(FILM_HOLE), DIAL.holeAngle(FILM_HOLE) + DIAL.travel(FILM_HOLE) + 0.04),
  line(t + 0.4, t + 0.5, wound, wound),
  line(t + 0.5, t + 0.8, wound, hole)
]

const T = { dial: 3.25, lever: 9.15, crank: 14.7, runaway: 16.33, press: 20.3 }

const path: Seg[] = [
  line(0, 0.6, { x: 1560, y: 440 }, { x: 1560, y: 440 }),
  line(0.6, 1.0, { x: 1560, y: 440 }, { x: 1590, y: 425 }),
  line(1.0, 1.7, { x: 1590, y: 425 }, { x: 1604, y: 432 }),
  line(1.7, 2.22, { x: 1604, y: 432 }, field(0)),
  line(2.22, 2.6, field(0), field(0)),
  line(2.6, 3.1, field(0), hole),
  line(3.1, T.dial, hole, hole),
  ...dial(T.dial),
  line(T.dial + 0.8, T.dial + 0.85, hole, hole),
  ...dial(T.dial + 0.85),
  line(T.dial + 1.65, T.dial + 1.7, hole, hole),
  ...dial(T.dial + 1.7).slice(0, 2),
  line(T.dial + 2.2, T.dial + 2.5, wound, LANDING),
  line(T.dial + 2.5, 7.55, LANDING, LANDING),
  line(7.55, 8.14, LANDING, field(1)),
  line(8.14, 8.5, field(1), field(1)),
  line(8.5, 9.0, field(1), knob),
  line(9.0, T.lever, knob, knob),
  line(T.lever, T.lever + 0.3, knob, pulled),
  line(T.lever + 0.3, T.lever + 0.45, pulled, pulled),
  line(T.lever + 0.45, T.lever + 0.9, pulled, watch),
  line(T.lever + 0.9, 11.6, watch, { x: watch.x + 10, y: watch.y + 4 }),
  line(11.6, 12.0, watch, { x: 1180, y: 850 }),
  line(12.0, 12.6, { x: 1180, y: 850 }, { x: 800, y: 700 }),
  line(12.6, 13.45, { x: 800, y: 700 }, { x: 760, y: 690 }),
  line(13.45, 14.02, { x: 760, y: 690 }, field(2)),
  line(14.02, 14.25, field(2), field(2)),
  line(14.25, 14.62, field(2), grip),
  line(14.62, T.crank + 0.05, grip, grip),
  arc(T.crank + 0.05, T.runaway + 0.04, hub, CRANK.arm, 0, TURNS * 2 * Math.PI, (u) => u * (1.4 - 0.4 * u)),
  line(T.runaway + 0.04, 17.7, caught, caught),
  line(17.7, 19.9, caught, { x: BUTTON.x - 40, y: BUTTON.y - 4 }),
  line(19.9, 20.24, { x: BUTTON.x - 40, y: BUTTON.y - 4 }, BUTTON),
  line(20.24, 21, BUTTON, BUTTON)
]

const presses: [number, number][] = [
  [2.3, 2.42],
  [T.dial, T.dial + 0.45], [T.dial + 0.85, T.dial + 1.3], [T.dial + 1.7, T.dial + 2.15],
  [8.2, 8.32],
  [T.lever, T.lever + 0.36],
  [14.08, 14.2],
  [T.crank, T.runaway + 0.1],
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

const acts: [number, Acting][] = [
  [0, 'confident'], [2.6, 'plain'], [T.dial + 2.15, 'shocked'], [6.9, 'nervous'], [9.5, 'plain'], [11.0, 'shocked'], [11.5, 'scared'], [13.3, 'angry'],
  [T.runaway, 'shocked'], [16.9, 'exhausted'], [20.26, 'plain']
]

export function actingAt(time: number): Acting {
  let out: Acting = 'plain'
  for (const [at, a] of acts) if (time >= at) out = a
  return out
}

export const reactions: [number, Reaction][] = [
  [2.24, 'anticipate'], [7.05, 'doubleTake'], [9.05, 'anticipate'], [11.05, 'doubleTake'], [13.3, 'dustOff'], [14.64, 'anticipate'], [T.runaway + 0.05, 'flinch'], [20.2, 'jump']
]
