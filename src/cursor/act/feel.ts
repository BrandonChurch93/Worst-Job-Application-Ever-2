import type { Acting, Reaction } from '../body'

// Layer 2, how it feels: what each acting state asks of the body. The sim eases toward these, so a change of state is seen.
export interface Feel { stretch: number; lean: number; bend: number; puff: number; tremble: number; pale: number; heat: number; melt: number; sweat: number; steam: number; bounce: number }

export const FEEL_KEYS = ['stretch', 'lean', 'bend', 'puff', 'tremble', 'pale', 'heat', 'melt', 'sweat', 'steam', 'bounce'] as const

const feel = (f: Partial<Feel>): Feel => ({ stretch: 1, lean: 0, bend: 0, puff: 0, tremble: 0, pale: 0, heat: 0, melt: 0, sweat: 0, steam: 0, bounce: 0, ...f })

export const FEEL: Record<Acting, Feel> = {
  plain: feel({}),
  confident: feel({ stretch: 1.08, lean: 0.14, puff: 0.2, bounce: 0.09 }),
  nervous: feel({ stretch: 0.92, lean: -0.12, tremble: 0.5, sweat: 1 }),
  shocked: feel({ stretch: 1.2, lean: -0.08, tremble: 0.15 }),
  angry: feel({ stretch: 1.03, lean: 0.17, puff: 0.35, tremble: 0.3, heat: 1, steam: 1 }),
  scared: feel({ stretch: 0.86, lean: -0.44, bend: -0.3, pale: 1, tremble: 0.7 }),
  proud: feel({ stretch: 1.14, lean: 0.24, puff: 0.8, bounce: 0.04 }),
  exhausted: feel({ stretch: 0.74, lean: -0.4, bend: 0.55, melt: 0.6 })
}

// Seconds for each number to cover most of the way to a new state.
export const FEEL_EASE: Record<(typeof FEEL_KEYS)[number], number> = { stretch: 0.08, lean: 0.1, bend: 0.14, puff: 0.16, tremble: 0.1, pale: 0.3, heat: 0.45, melt: 0.6, sweat: 0.35, steam: 0.4, bounce: 0.2 }

export const freshFeel = (): Feel => ({ ...FEEL.plain })

const ramp = (u: number, a: number, b: number): number => Math.min(1, Math.max(0, (u - a) / (b - a)))

export interface ReactionPose { stretch: number; lean: number; puff: number; turn: number; bend: number }
const at = (stretch: number, lean = 0, turn = 0, bend = 0, puff = 0): ReactionPose => ({ stretch, lean, puff, turn, bend })

// Layer 3, what just happened: each reaction as a wind-up, a pose and a hold, in shares of its length. The springs of the sim chase these.
// stretch and lean are added to the posture, turn swings the whole body round its tip past the limit of a lean, bend curls the tail.
export function reactionPose(name: Reaction, u: number, dir: number): ReactionPose {
  switch (name) {
    case 'anticipate':
      return u < 0.62 ? at(-0.36, -0.26 * dir, -0.12 * dir) : at(0.3, 0.16 * dir)
    case 'flinch':
      return u < 0.55 ? at(-0.34, -0.42, -0.2, -0.3) : at(-0.14, -0.2)
    case 'doubleTake':
      if (u < 0.2) return at(-0.06, 0.3, 0.2)
      if (u < 0.36) return at(0, -0.2, -0.2)
      if (u < 0.52) return at(-0.14, 0.34, 0.3)
      return u < 0.86 ? at(0.44) : at(0)
    case 'recoil':
      if (u < 0.16) return at(-0.6, 0.1 * dir, 0, 0.8 * dir)
      return u < 0.36 ? at(0.44, 0.06 * dir) : at(0, 0)
    case 'dustOff':
      return at(0.08, 0.22 * Math.sin(u * Math.PI * 8) * (1 - ramp(u, 0.7, 1)), 0, 0, 0.35 * (1 - ramp(u, 0.8, 1)))
    case 'jump':
      return u < 0.5 ? at(0.34) : at(0)
    // Flat under a shot: short, laid over on its side, held, then a stretch out of it.
    case 'duck':
      return u < 0.74 ? at(-0.44, -0.5, -0.62, 0.3) : at(0.3, 0, 0)
    // A jump back and a stretch.
    case 'startle':
      return u < 0.14 ? at(-0.2, -0.2) : u < 0.8 ? at(0.42, -0.4, -0.28) : at(0)
    // Small and low under what is coming down.
    case 'cower':
      return u < 0.86 ? at(-0.3, -0.3, -0.36, -0.5) : at(0)
    // A sharp backward lean, held.
    case 'rear':
      return u < 0.08 ? at(-0.2, 0.2) : u < 0.84 ? at(0.24, -0.5, -0.5) : at(0)
    // A sideways snap out of a shot's way: the tip thrown up and over, held.
    case 'snap':
      return u < 0.8 ? at(0.1, 0.2, 0.62) : at(0)
    // A dart for cover: a long reach on the way, then small, low and leaning away from what it left, held.
    case 'dart':
      return u < 0.3 ? at(0.3, -0.3) : at(-0.3, -0.36, -0.4, -0.5)
    // A decided tap: back, down, held.
    case 'tap':
      return u < 0.3 ? at(-0.3, -0.3, -0.16) : u < 0.86 ? at(0.2, 0.3, 0.12) : at(0)
  }
}
