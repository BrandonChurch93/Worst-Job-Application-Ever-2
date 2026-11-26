import type { Acting, Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'
import { AT, FILM } from './timeline'

export interface Marks { start: { x: number; y: number }; spot: { x: number; y: number }; drop: { x: number; y: number }; press: { x: number; y: number } }

interface Key { t: number; x: number; y: number }

export interface Cue { at: number; act?: Acting; react?: Reaction }

// The hit of the stamp: it draws back and leans before it falls, the fall speeds up, the rubber gives, the block rocks and comes to rest, and paper dust leaves from under its edges.
export const HIT = { windSeconds: 0.24, windRise: 30, windTilt: -0.13, fallPower: 2.6, over: 9, give: 1.5, giveSeconds: 0.06, rock: 0.03, rockSeconds: 0.11, rockRate: 50, landRock: 0.014, dustSeconds: 0.62, dustReach: 70 } as const

// Struck flat, the cursor sticks to the rubber, is carried off under the block and falls from it to the right as the stamp is laid down: `right` and `down` from the stamp's rest.
export const STUCK = { right: 96, down: 8, toss: 26 } as const

// Set down, the stamp is laid on its side, grip away from the reader, a little off square: `turn` about its long axis, `rot` on the page.
export const LIE = { turn: Math.PI / 2, rot: -0.17 } as const

// The wait: the word is worried. It comes in with the page and stands, tiptoes right, reads the months and shrinks, tiptoes back further than it came, and stands again.
export const PACE = { stand: 0.9, right: [0.9, 1.2], read: 1.24, left: [1.62, 1.92], far: 170, back: -70 } as const
// The letter: the word is hope. It stays put while the sheet falls, hops when it lands, struts to it and reads, looks up at what comes, and freezes.
export const HOPE = { walk: [2.9, 3.5], look: 3.62 } as const
// The button: the word is beaten. Whole again it looks at the one button there is, drags itself there, stands for 0.4 s and presses with no flourish.
export const GIVE = { look: 7.82, walk: [8.25, 8.9] } as const

export const CUES: Cue[] = [
  { at: PACE.right[0] - 0.06, react: 'anticipate' },
  { at: PACE.read, react: 'flinch' },
  { at: HOPE.look, react: 'doubleTake' },
  { at: GIVE.look, react: 'doubleTake' }
]

function keys(m: Marks): Key[] {
  const s = m.start
  const stamped = AT.decide + AT.slam[1]
  return [
    { t: 0, x: s.x, y: s.y },
    { t: PACE.right[0], x: s.x, y: s.y },
    { t: PACE.right[1], x: s.x + PACE.far, y: s.y - 4 },
    { t: PACE.left[0], x: s.x + PACE.far, y: s.y - 4 },
    { t: PACE.left[1], x: s.x + PACE.back, y: s.y + 2 },
    { t: HOPE.walk[0], x: s.x + PACE.back, y: s.y + 2 },
    { t: HOPE.walk[1], x: m.spot.x, y: m.spot.y },
    { t: AT.decide + AT.lift[1], x: m.spot.x, y: m.spot.y },
    { t: AT.decide + AT.lower[1], x: m.drop.x, y: m.drop.y },
    { t: stamped + 3.55, x: m.drop.x, y: m.drop.y },
    { t: stamped + 3.9, x: m.drop.x - 14, y: m.drop.y + 30 },
    { t: GIVE.walk[0], x: m.drop.x - 14, y: m.drop.y + 30 },
    { t: GIVE.walk[1], x: m.press.x, y: m.press.y },
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
