import type { Acting, Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'
import { AT, FILM } from './timeline'

export interface Marks { start: { x: number; y: number }; spot: { x: number; y: number }; press: { x: number; y: number } }

interface Key { t: number; x: number; y: number }

export interface Cue { at: number; act?: Acting; react?: Reaction }

// The hit of the stamp: it draws back and leans before it falls, the fall speeds up, the rubber gives, the block rocks and comes to rest, and paper dust leaves from under its edges.
export const HIT = { windSeconds: 0.24, windRise: 30, windTilt: -0.13, fallPower: 2.6, over: 9, give: 1.5, giveSeconds: 0.06, rock: 0.03, rockSeconds: 0.11, rockRate: 50, landRock: 0.014, dustSeconds: 0.62, dustReach: 70 } as const

export const CUES: Cue[] = [
  { at: 0.55, react: 'anticipate' },
  { at: 1.3, react: 'flinch' },
  { at: 3.72, react: 'doubleTake' },
  { at: 7.92, react: 'doubleTake' },
  { at: FILM.press - 0.12, react: 'anticipate' }
]

function keys(m: Marks): Key[] {
  const s = m.start
  const stamped = AT.decide + AT.slam[1]
  return [
    { t: 0, x: s.x, y: s.y },
    { t: 0.85, x: s.x, y: s.y },
    { t: 1.15, x: s.x + 74, y: s.y - 4 },
    { t: 1.45, x: s.x + 74, y: s.y - 4 },
    { t: 1.8, x: s.x - 8, y: s.y },
    { t: 2.05, x: s.x - 8, y: s.y },
    { t: 2.3, x: s.x + 96, y: s.y + 22 },
    { t: 2.9, x: s.x + 96, y: s.y + 22 },
    { t: 3.5, x: m.spot.x, y: m.spot.y },
    { t: stamped + 3.55, x: m.spot.x, y: m.spot.y },
    { t: stamped + 3.9, x: m.spot.x + 18, y: m.spot.y + 40 },
    { t: 8.25, x: m.spot.x + 18, y: m.spot.y + 40 },
    { t: 8.9, x: m.press.x, y: m.press.y },
    { t: 12, x: m.press.x, y: m.press.y }
  ]
}

const smooth = (u: number): number => u * u * (3 - 2 * u)

export function pointerAt(m: Marks, time: number): Pointer {
  const k = keys(m)
  const down = time >= FILM.press && time < FILM.press + 0.2
  if (time <= k[0]!.t) return { x: k[0]!.x, y: k[0]!.y, down }
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!
    const b = k[i]!
    if (time <= b.t) {
      const u = smooth((time - a.t) / Math.max(1e-6, b.t - a.t))
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, down }
    }
  }
  const last = k[k.length - 1]!
  return { x: last.x, y: last.y, down }
}
