import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'

export interface Marks {
  start: { x: number; y: number }
  stroll: { x: number; y: number }
  wait: { x: number; y: number }
  cards: { x: number; y: number }[]
  away: { x: number; y: number }
  tape: { x: number; y: number }
  stand: { x: number; y: number }
  perch: { x: number; y: number }
  press: { x: number; y: number }
}

type Ease = 'smooth' | 'line'
interface Key { t: number; x: number; y: number; e?: Ease }

export const PRESS_AT = 11.75
export const PRESS_FOR = 0.15
export const TURN_AT = 13.5

// How far down the website the film has scrolled, in px, at each moment: down to the cards, back up to the ticker, back to the top for Apply.
export const SCROLL: [number, number][] = [[0, 0], [2.05, 0], [2.85, 1130], [7.95, 1130], [8.75, 430], [10.05, 430], [10.8, 0]]

// The arrow comes onto each of the first three cards at `on` and stays on it until `off`.
export const VISITS = [{ on: 3.0, at: 3.3, off: 4.3 }, { on: 4.3, at: 4.62, off: 5.75 }, { on: 5.75, at: 6.07, off: 7.2 }]

// Every point is where the arrow is on the screen; the stage adds how far the page has scrolled.
export function path(m: Marks): Key[] {
  const keys: Key[] = [{ t: 0, ...m.start }, { t: 0.2, ...m.start }, { t: 1.1, ...m.stroll, e: 'line' }, { t: 2, ...m.stroll }, { t: 2.4, x: m.wait.x, y: (m.stroll.y + m.wait.y) / 2 }, { t: 2.85, ...m.wait }]
  VISITS.forEach((v, i) => keys.push({ t: v.on, ...(i === 0 ? m.wait : m.cards[i - 1]!) }, { t: v.at, ...m.cards[i]! }, { t: v.off, ...m.cards[i]! }))
  keys.push({ t: 7.55, ...m.away }, { t: 7.95, ...m.away }, { t: 8.75, ...m.tape }, { t: 10.05, ...m.tape })
  keys.push({ t: 10.76, x: m.stand.x - 16, y: m.stand.y, e: 'line' }, { t: 10.9, ...m.stand }, { t: 11.38, ...m.stand })
  keys.push({ t: 11.42, ...m.perch }, { t: PRESS_AT - 0.02, ...m.perch }, { t: PRESS_AT, ...m.press })
  return keys
}

// The arrow comes back with the page. It is let down from the height of the hand-off from `from` to `down`, a little before the page
// lies flat at `lands`, the stage's half turn; `flat` is when it goes flat (`duck`), a moment before it touches. It gets up, stands, then
// takes half a step of `step` px aside, off the line above Apply for a Job, and stays leant from `lean` on.
export const LANDING = { lands: 0.5, from: 0.04, down: 0.25, flat: 0.22, lean: 1.24, step: 46, walk: 2.4 }

export function rejectedPath(m: Marks): Key[] {
  const leant = { x: HANDOFF.x - LANDING.step, y: HANDOFF.y }
  return [{ t: 0, x: HANDOFF.x, y: HANDOFF.y }, { t: LANDING.lean - 0.14, x: HANDOFF.x, y: HANDOFF.y }, { t: LANDING.lean + 0.02, ...leant, e: 'line' }, { t: LANDING.walk, ...leant }, { t: LANDING.walk + 0.85, ...m.stand }]
}

const ease = (u: number): number => u * u * (3 - 2 * u)

export function along(keys: Key[], time: number): { x: number; y: number } {
  const first = keys[0]!
  if (time <= first.t) return { x: first.x, y: first.y }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!
    const b = keys[i]!
    if (time > b.t) continue
    const t = (time - a.t) / (b.t - a.t)
    const u = b.e === 'line' ? t : ease(t)
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
  }
  const last = keys[keys.length - 1]!
  return { x: last.x, y: last.y }
}

export function scrollAt(time: number): number {
  const first = SCROLL[0]!
  if (time <= first[0]) return first[1]
  for (let i = 1; i < SCROLL.length; i++) {
    const a = SCROLL[i - 1]!
    const b = SCROLL[i]!
    if (time > b[0]) continue
    return a[1] + (b[1] - a[1]) * ease((time - a[0]) / (b[0] - a[0]))
  }
  return SCROLL[SCROLL.length - 1]![1]
}

export function pointerAt(m: Marks, time: number, rejected: boolean): Pointer {
  if (rejected) return { ...along(rejectedPath(m), time), down: false }
  return { ...along(path(m), time), down: time >= PRESS_AT && time < PRESS_AT + PRESS_FOR }
}

export interface Cue { at: number; act?: Acting; react?: Reaction }

export const CUES: Cue[] = [
  { at: 0, act: 'confident' },
  { at: 11.02, react: 'anticipate' },
  { at: 11.38, react: 'jump' },
  { at: TURN_AT - 0.2, react: 'anticipate' },
  { at: TURN_AT + 0.16, act: 'shocked', react: 'startle' }
]

export const REJECTED_CUES: Cue[] = [{ at: 0, act: 'exhausted' }, { at: LANDING.flat, react: 'duck' }, { at: LANDING.lean, react: 'recoil' }]
