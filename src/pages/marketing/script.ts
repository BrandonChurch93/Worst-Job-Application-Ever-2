import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'

export interface Marks {
  start: { x: number; y: number }
  corner: { x: number; y: number }
  cards: { x: number; y: number }[]
  lane: { x: number; y: number }
  medal: { x: number; y: number }
  stand: { x: number; y: number }
  perch: { x: number; y: number }
  press: { x: number; y: number }
}

type Ease = 'smooth' | 'line'
interface Key { t: number; x: number; y: number; e?: Ease }

export const PRESS_AT = 11.75
export const PRESS_FOR = 0.15
export const TURN_AT = 13.5

// A card is poked from under its bottom edge: the tip goes `poke` into it, the body stays on the page, and steps `back` as the card starts to turn.
// At the first card it steps `take` further at the double take.
export const TOUCH = { poke: { x: -6, y: -28 }, back: { x: 44, y: 8 }, take: { x: 72, y: 0 }, in: 0.05, out: 0.05, over: 16 }
export const VISITS = [
  { plant: 1.92, poke: 2.02, back: 2.14, take: 2.6, till: 3.44, home: 3.58, leave: 3.98 },
  { plant: 4.76, poke: 4.86, back: 4.98, take: 0, till: 5.6, home: 5.72, leave: 6.08 },
  { plant: 6.86, poke: 6.96, back: 7.08, take: 0, till: 7.7, home: 7.82, leave: 8.9 }
]

export function path(m: Marks): Key[] {
  const T = TOUCH
  const keys: Key[] = [{ t: 0, ...m.start }, { t: 0.2, ...m.start }, { t: 0.92, ...m.corner, e: 'line' }, { t: 1.1, ...m.corner }]
  VISITS.forEach((v, i) => {
    const p = m.cards[i]!
    const poked = { x: p.x + T.poke.x, y: p.y + T.poke.y }
    const back = { x: p.x + T.back.x, y: p.y + T.back.y }
    keys.push({ t: v.plant - 0.12, x: p.x + T.over, y: p.y, e: 'line' }, { t: v.plant, x: p.x, y: p.y }, { t: v.poke, x: p.x, y: p.y })
    keys.push({ t: v.poke + T.in, ...poked }, { t: v.back, ...poked }, { t: v.back + T.out, ...back })
    if (v.take > 0) {
      const taken = { x: back.x + T.take.x, y: back.y + T.take.y }
      keys.push({ t: v.take, ...back }, { t: v.take + T.out, ...taken }, { t: v.till, ...taken })
    } else keys.push({ t: v.till, ...back })
    keys.push({ t: v.home, x: p.x, y: p.y }, { t: v.leave, x: p.x, y: p.y })
  })
  keys.push({ t: 9.55, ...m.lane, e: 'line' }, { t: 9.74, ...m.lane })
  keys.push({ t: 10.26, x: m.stand.x - T.over, y: m.stand.y, e: 'line' }, { t: 10.4, ...m.stand }, { t: 11.38, ...m.stand })
  keys.push({ t: 11.42, ...m.perch }, { t: PRESS_AT - 0.02, ...m.perch }, { t: PRESS_AT, ...m.press })
  return keys
}

// The arrow comes back with the page. It is let down from the height of the hand-off from `from` to `down`, a little before the page
// lies flat at `lands`, the stage's half turn; `flat` is when it goes flat (`duck`), a moment before it touches. It gets up, stands, then
// takes half a step of `step` px toward Apply for a Job and stays leant at it from `lean` on.
export const LANDING = { lands: 0.5, from: 0.04, down: 0.25, flat: 0.22, lean: 1.24, step: 46, walk: 2.4 }

export function rejectedPath(m: Marks): Key[] {
  const toward = Math.sign(m.press.x - HANDOFF.x) || -1
  const leant = { x: HANDOFF.x + toward * LANDING.step, y: HANDOFF.y }
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

export function pointerAt(m: Marks, time: number, rejected: boolean): Pointer {
  if (rejected) return { ...along(rejectedPath(m), time), down: false }
  return { ...along(path(m), time), down: time >= PRESS_AT && time < PRESS_AT + PRESS_FOR }
}

export interface Cue { at: number; act?: Acting; react?: Reaction }

export const CUES: Cue[] = [
  { at: 0, act: 'confident' },
  { at: VISITS[0]!.till, act: 'proud' },
  { at: VISITS[0]!.leave, act: 'confident' },
  { at: VISITS[1]!.till, act: 'proud' },
  { at: VISITS[1]!.leave, act: 'confident' },
  { at: VISITS[2]!.till, act: 'proud' },
  { at: VISITS[2]!.leave, act: 'confident' },
  { at: 11.02, react: 'anticipate' },
  { at: 11.38, react: 'jump' },
  { at: TURN_AT - 0.2, react: 'anticipate' },
  { at: TURN_AT + 0.16, act: 'shocked', react: 'startle' }
]

export const REJECTED_CUES: Cue[] = [{ at: 0, act: 'exhausted' }, { at: LANDING.flat, react: 'duck' }, { at: LANDING.lean, react: 'recoil' }]
