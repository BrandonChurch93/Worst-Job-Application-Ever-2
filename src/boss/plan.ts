import { config } from '../config'

export const HEALTH = 100
export const PHASES = config.live.boss.phases
export const MAX_SECONDS = config.live.boss.maxSeconds
export const SLOW_SECONDS = config.live.bossSlowSeconds
export const GAG_MAX = config.live.skipLinkAfterSeconds

export const SOCKET = { x: 960, y: 960 }
export const HOME = { x: 1600, y: 628 }
export const FALLEN = { x: 1344, y: 640, rot: 0.26 }
export const ARENA = { x0: 40, y0: 330, x1: 1880, y1: 1050 }
export const SLAB_H = 64

export const UNFOLD = { crack: 0.7, lift: 0.75, open: 1.3, plates: [1.3, 2.0], legs: [1.6, 2.5], cannons: [1.9, 2.9], shield: [2.5, 3.3], bar: [2.3, 3.3], end: 3.6 } as const
export const COLLAPSE_SECONDS = 2
export const WAKE_AFTER_TICK = { film: 1.6, live: 7, near: 2.2 }
export const DOUBT_SECONDS = 1.7

export const THRESHOLD = [51, 25, 0] as const
export const CAPS = [12.5, 14.5, 13] as const
export const RAMP = [3, 1.8, 6] as const
export const FLOOR = [3.9, 4, 3] as const
export const EXPIRED_GAIN = 10
export const LAST_CLEAR = 28.75
// A click is a volley. What a dart is worth changes with the phase, so each phase takes about as many clicks as it did when the phases ended at 75 and 40.
export const DART = { speed: 2300, damage: [1.9, 0.75 * (26 / 35), 0.75 * 0.7] as const, life: 1.4, volley: 4, gap: 0.085 }
// In the first phase the boss opens with one slab, then fires salvos of three: one at the cursor, one below it, one above it.
export const SLAB = { speed: [880, 1150, 1150] as const, windup: 0.45, rest: 0.5, restLate: 0.7, out: 0.44, overshoot: 170, every: [1.58, 2.8, 0.85] as const, first: 0.4, late: 2, salvo: 3, salvoGap: 0.11, fan: 0.2, again: 1.7, through: 8, drive: 480, skid: 9, grip: 60, bounce: 7 }
export const LOOK_EASE = 0.25
export const POPUP = { hp: 12, first: 0.3, gaps: [1.8, 1, 1] as const, again: 1.6, late: 2, close: 0.25, read: 1, aim: 0.3, armed: 6, hold: 0.34, kick: [300, 120, 560] as const, spring: 420, damp: 13, lean: 13 }
export const HIT = { safe: 1.2, knock: 1500 }
export const BODY = { rx: 196, ry: 118 }

// The glass shield stands on the cursor's side of the body: a dart that comes from the left stops on it.
export const SHIELD = { x: -290, half: 122, z: 92, clear: 60, drift: 0.06, spread: 40 }

// What the fight calls the firing of the boss's own guns. It is still the name the film's beat and the narrator's line hang on; `bullet-fire` is asked for in the notes.
export const EVENT = { gun: 'slab-fire' } as const
