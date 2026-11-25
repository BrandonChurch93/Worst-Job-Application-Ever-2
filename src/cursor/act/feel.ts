import type { Acting, Reaction } from '../body'

// Layer 2, how it feels: what each acting state asks of the body. The sim eases toward these, so a change of state is seen.
export interface Feel { stretch: number; lean: number; bend: number; puff: number; tremble: number; pale: number; heat: number; melt: number; sweat: number; steam: number; bounce: number }

export const FEEL_KEYS = ['stretch', 'lean', 'bend', 'puff', 'tremble', 'pale', 'heat', 'melt', 'sweat', 'steam', 'bounce'] as const

const feel = (f: Partial<Feel>): Feel => ({ stretch: 1, lean: 0, bend: 0, puff: 0, tremble: 0, pale: 0, heat: 0, melt: 0, sweat: 0, steam: 0, bounce: 0, ...f })

export const FEEL: Record<Acting, Feel> = {
  plain: feel({}),
  confident: feel({ stretch: 1.05, lean: -0.05, puff: 0.15, bounce: 0.05 }),
  nervous: feel({ stretch: 0.95, lean: -0.07, tremble: 0.5, sweat: 1 }),
  shocked: feel({ stretch: 1.34, lean: -0.08, tremble: 0.15 }),
  angry: feel({ stretch: 1.03, lean: 0.17, puff: 0.35, tremble: 0.3, heat: 1, steam: 1 }),
  scared: feel({ stretch: 0.9, lean: -0.3, bend: -0.2, pale: 1, tremble: 0.7 }),
  proud: feel({ stretch: 1.1, lean: -0.1, puff: 0.7, bounce: 0.03 }),
  exhausted: feel({ stretch: 0.78, lean: 0.3, bend: 0.45, melt: 1, sweat: 0.25 })
}

// Seconds for each number to cover most of the way to a new state.
export const FEEL_EASE: Record<(typeof FEEL_KEYS)[number], number> = { stretch: 0.08, lean: 0.1, bend: 0.14, puff: 0.16, tremble: 0.1, pale: 0.3, heat: 0.45, melt: 0.6, sweat: 0.35, steam: 0.4, bounce: 0.2 }

export const freshFeel = (): Feel => ({ ...FEEL.plain })

const ramp = (u: number, a: number, b: number): number => Math.min(1, Math.max(0, (u - a) / (b - a)))

// Layer 3, what just happened: each reaction as a wind-up, a pose and a hold, in shares of its length. The springs of the sim chase these.
export function reactionPose(name: Reaction, u: number, dir: number): { stretch: number; lean: number; puff: number } {
  switch (name) {
    case 'anticipate':
      return u < 0.62 ? { stretch: -0.3, lean: -0.14 * dir, puff: 0 } : { stretch: 0.24, lean: 0.1 * dir, puff: 0 }
    case 'flinch':
      return u < 0.55 ? { stretch: -0.26, lean: -0.3, puff: 0 } : { stretch: -0.1, lean: -0.12, puff: 0 }
    case 'doubleTake':
      if (u < 0.2) return { stretch: -0.04, lean: 0.3, puff: 0 }
      if (u < 0.36) return { stretch: 0, lean: -0.16, puff: 0 }
      if (u < 0.52) return { stretch: -0.12, lean: 0.42, puff: 0 }
      return u < 0.86 ? { stretch: 0.42, lean: 0, puff: 0 } : { stretch: 0, lean: 0, puff: 0 }
    case 'recoil':
      return u < 0.5 ? { stretch: -0.22, lean: 0.46 * dir, puff: 0 } : { stretch: 0.1, lean: 0.14 * dir, puff: 0 }
    case 'dustOff':
      return { stretch: 0.08, lean: 0.22 * Math.sin(u * Math.PI * 8) * (1 - ramp(u, 0.7, 1)), puff: 0.35 * (1 - ramp(u, 0.8, 1)) }
    case 'jump':
      return u < 0.5 ? { stretch: 0.28, lean: 0, puff: 0 } : { stretch: 0, lean: 0, puff: 0 }
  }
}
