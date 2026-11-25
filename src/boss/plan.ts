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

export const THRESHOLD = [75, 40, 0] as const
export const CAPS = [12, 14.5, 13.5] as const
export const RAMP = [3, 1.8, 6] as const
export const FLOOR = [4, 4, 3] as const
export const EXPIRED_GAIN = 10
export const LAST_CLEAR = 20
export const DART = { speed: 2300, damage: 3, life: 1.4 }
export const SLAB = { speed: 880, windup: 0.45, rest: 1.5, restLate: 0.7, out: 0.22, overshoot: 170, every: [1.1, 2.3, 0.85] as const, first: 0.4 }
export const POPUP = { hp: 3, first: 0.3, every: 1.7, again: 1.6, close: 0.25, read: 1 }
export const HIT = { safe: 1.2, knock: 820 }
export const BODY = { rx: 196, ry: 118 }
