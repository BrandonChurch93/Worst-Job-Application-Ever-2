// The scene change as numbers: what every part of the arena is doing at a view time. Plain functions of the time, no three.js, no clock.
import { ARENA, CRACK_DISTANCE, CRACK_FARTHEST } from './layout'

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smooth = (v: number): number => {
  const u = clamp01(v)
  return u * u * (3 - 2 * u)
}
const span = (t: number, from: number, to: number): number => clamp01((t - from) / (to - from))

// A whole number to a number from 0 to 1, the same on every machine.
export function rnd(a: number, b = 0, c = 0): number {
  let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b) ^ Math.imul((c | 0) + 0x165667b1, 0xc2b2ae35)) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d) >>> 0
  h ^= h >>> 12
  h = Math.imul(h, 0x297a2d39) >>> 0
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

// When the crack reaches a point of a seam, in view seconds.
export function crackTime(seam: string, index: number): number {
  const d = CRACK_DISTANCE.get(seam)?.[index] ?? 0
  return ARENA.crackFrom + (ARENA.crackTo - ARENA.crackFrom) * Math.pow(d / CRACK_FARTHEST, 0.8)
}

// Half the width of the dark crack at a point, in px, while the page is still whole: a hairline that fattens behind the front.
export function crackHalf(time: number, reached: number): number {
  if (time < reached) return 0
  return 0.6 + 1.1 * smooth((time - reached) / 0.25)
}

// How far a seam has opened at a point, 0 (a crack) to 1 (the full seam). The split starts at ARENA.splitAt everywhere and runs outward from the socket.
export function seamOpen(time: number, reached: number): number {
  const lag = 0.18 * (reached / (ARENA.crackTo || 1))
  const u = span(time, ARENA.splitAt + lag, ARENA.splitTo - 0.18 + lag)
  // It jumps open, runs a little past and settles.
  const over = 1 + 0.12 * Math.sin(u * Math.PI) * (1 - u)
  return clamp01(1 - Math.pow(1 - u, 3)) * over
}

// The light from below: nothing while the page is whole, a surge as the slabs part, then its level at rest.
export function seamLight(time: number): number {
  if (time < ARENA.splitAt) return 0
  const up = smooth(span(time, ARENA.splitAt, ARENA.splitAt + 0.3))
  const surge = 1.6 * Math.exp(-(time - ARENA.splitAt) / 0.35)
  return up * (1 + surge)
}

// How far a standing thing has risen, 0 to 1 with a small run past the top. `order` is its place in the row, 0 to 1.
export function rise(time: number, order: number): number {
  const start = ARENA.riseAt + order * (ARENA.riseTo - ARENA.riseAt - ARENA.riseEach)
  const u = span(time, start, start + ARENA.riseEach)
  if (u <= 0) return 0
  if (u >= 1) return 1
  const e = 1 - Math.pow(1 - u, 2.6)
  return e + 0.06 * Math.sin(u * Math.PI * 2) * (1 - u)
}
export const riseLands = (order: number): number => ARENA.riseAt + order * (ARENA.riseTo - ARENA.riseAt - ARENA.riseEach) + ARENA.riseEach

// The health bar: how high above its place it hangs, in px, and how far it has faded in.
export function barDrop(time: number): { lift: number; shown: number } {
  if (time < ARENA.barAt) return { lift: 220, shown: 0 }
  const u = span(time, ARENA.barAt, ARENA.barLands)
  if (u < 1) return { lift: 220 * (1 - u * u), shown: smooth(u * 4) }
  // One small bounce after it lands.
  const b = time - ARENA.barLands
  return { lift: 7 * Math.abs(Math.sin(b * 16)) * Math.exp(-b * 9), shown: 1 }
}

// The shake for the camera owner: an offset in page px and a roll in radians, at a view time. The sum of decaying knocks, each a pure function of the time.
export const KNOCKS: { at: number; px: number; roll: number; hz: number; decay: number; name: string }[] = [
  { at: 0, px: 14, roll: 0.004, hz: 21, decay: 0.22, name: 'the button breaks out' },
  { at: ARENA.splitAt, px: 22, roll: 0.007, hz: 17, decay: 0.34, name: 'the page splits' },
  { at: riseLands(0), px: 4, roll: 0.001, hz: 26, decay: 0.12, name: 'the first pillars lock' },
  { at: riseLands(0.5), px: 4, roll: 0.001, hz: 26, decay: 0.12, name: 'the panes lock' },
  { at: riseLands(1), px: 5, roll: 0.0015, hz: 26, decay: 0.12, name: 'the corner guns lock' },
  { at: ARENA.barLands, px: 7, roll: 0.002, hz: 24, decay: 0.15, name: 'the health bar lands' }
]
// What a blast of the big cannon adds, counted from its `at`.
export const BLAST_KNOCK = { px: 26, roll: 0.008, hz: 15, decay: 0.4 }

function knock(dt: number, k: { px: number; roll: number; hz: number; decay: number }, seed: number): { x: number; y: number; roll: number } {
  if (dt < 0 || dt > k.decay * 6) return { x: 0, y: 0, roll: 0 }
  const fall = Math.exp(-dt / k.decay)
  const w = dt * k.hz * Math.PI * 2
  const a = rnd(seed, 1) * Math.PI * 2
  return { x: k.px * fall * Math.sin(w + a), y: k.px * fall * Math.sin(w * 1.31 + a * 1.7 + 1), roll: k.roll * fall * Math.sin(w * 0.83 + a) }
}

export function shake(time: number, blasts: number[] = []): { x: number; y: number; roll: number } {
  const out = { x: 0, y: 0, roll: 0 }
  KNOCKS.forEach((k, i) => {
    const s = knock(time - k.at, k, 11 + i)
    out.x += s.x
    out.y += s.y
    out.roll += s.roll
  })
  blasts.forEach((at, i) => {
    const s = knock(time - at, BLAST_KNOCK, 101 + i)
    out.x += s.x
    out.y += s.y
    out.roll += s.roll
  })
  return out
}
