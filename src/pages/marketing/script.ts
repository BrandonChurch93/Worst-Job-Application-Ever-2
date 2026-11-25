import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'

export interface Marks {
  start: { x: number; y: number }
  lane: { x: number; y: number }
  cards: { x: number; y: number }[]
  off: { x: number; y: number }
  medal: { x: number; y: number }
  stand: { x: number; y: number }
  press: { x: number; y: number }
}

interface Key { t: number; x: number; y: number }

export const PRESS_AT = 12.3
export const PRESS_FOR = 0.15

export function path(m: Marks): Key[] {
  const [a, b, c] = m.cards as [Key, Key, Key]
  return [
    { t: 0, ...m.start }, { t: 0.25, ...m.start },
    { t: 1.85, ...m.lane },
    { t: 2.5, x: a.x, y: a.y }, { t: 3.75, x: a.x, y: a.y },
    { t: 4.5, x: b.x, y: b.y }, { t: 5.45, x: b.x, y: b.y },
    { t: 6.2, x: c.x, y: c.y }, { t: 7.25, x: c.x, y: c.y },
    { t: 7.95, ...m.off },
    { t: 8.85, ...m.medal }, { t: 9.5, ...m.medal },
    { t: 10.7, ...m.stand }, { t: 11.7, ...m.stand },
    { t: 12.2, ...m.press }
  ]
}

export function rejectedPath(m: Marks): Key[] {
  return [{ t: 0, x: HANDOFF.x, y: HANDOFF.y }, { t: 0.5, x: HANDOFF.x, y: HANDOFF.y }, { t: 1.35, ...m.stand }]
}

const ease = (u: number): number => u * u * (3 - 2 * u)

export function along(keys: Key[], time: number): { x: number; y: number } {
  const first = keys[0]!
  if (time <= first.t) return { x: first.x, y: first.y }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!
    const b = keys[i]!
    if (time > b.t) continue
    const u = ease((time - a.t) / (b.t - a.t))
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
  { at: 8.9, act: 'proud', react: 'dustOff' },
  { at: 9.5, act: 'confident' },
  { at: 11.4, react: 'anticipate' }
]

export const REJECTED_CUES: Cue[] = [{ at: 0, act: 'exhausted' }]
