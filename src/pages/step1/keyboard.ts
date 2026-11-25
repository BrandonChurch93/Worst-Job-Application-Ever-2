import { config } from '../../config'
import { Random } from '../../core/random'
import { registerData } from '../../shell/words'
import data from './keyboard.json'

registerData('keyboard', data)

const grid = config.scale.grid
const sizes = config.scale.sizes
const heights = config.scale.heights

export interface Seat { name: string; row: number; x: number; y: number; w: number; h: number; cx: number; cy: number; letter: boolean }

export const keyboardData = data
export const DECK = { x: grid.contentLeft, y: 728, w: grid.contentRight - grid.contentLeft, h: 5 * sizes.keycapMin + 4 * grid.keyGap + 16 }
export const END = 200
export const KEYS = { x: DECK.x + END, y: DECK.y + 8, w: DECK.w - END * 2 }
export const PITCH = (KEYS.w + grid.keyGap) / data.unitsWide
export const KEY_H = sizes.keycapMin
export const HATCH = 124
export const hatchCentre = (side: 0 | 1): { x: number; y: number } => ({ x: side === 0 ? DECK.x + END / 2 : DECK.x + DECK.w - END / 2, y: DECK.y + DECK.h / 2 })

export const seats: Seat[] = []
data.rows.forEach((row, r) => {
  let at = 0
  for (const k of row) {
    const x = KEYS.x + at * PITCH
    const w = k.width * PITCH - grid.keyGap
    const y = KEYS.y + r * (KEY_H + grid.keyGap)
    seats.push({ name: k.name, row: r, x, y, w, h: KEY_H, cx: x + w / 2, cy: y + KEY_H / 2, letter: /^[a-z]$/.test(k.name) })
    at += k.width
  }
})

export const seatIndex: Record<string, number> = Object.fromEntries(seats.map((s, i) => [s.name, i]))
export const letterSeats: number[] = seats.map((s, i) => (s.letter ? i : -1)).filter((i) => i >= 0)
export const homePlaces = (): number[] => seats.map((_, i) => i)
export const legendKey = (name: string): string | null => (name in data.keys ? `data:keyboard.keys.${name}` : null)
export const typed = (name: string): string | null => (data.types as Record<string, string>)[name] ?? null
export const CAP_TOP = heights.keycap
export const DECK_TOP = heights.keyboardDeck
export const TRAVEL = heights.keyTravel

export function shuffled(places: number[], rng: Random): number[] {
  const out = places.slice()
  const order = rng.shuffle(letterSeats.map((i) => places[i]!))
  letterSeats.forEach((key, n) => {
    out[key] = order[n]!
  })
  let moved = 0
  letterSeats.forEach((key) => {
    if (out[key] !== places[key]) moved++
  })
  if (moved < letterSeats.length / 2) {
    const first = out[letterSeats[0]!]!
    for (let n = 0; n < letterSeats.length - 1; n++) out[letterSeats[n]!] = out[letterSeats[n + 1]!]!
    out[letterSeats[letterSeats.length - 1]!] = first
  }
  return out
}

export function keyAt(places: number[], x: number, y: number): number {
  for (let key = 0; key < seats.length; key++) {
    const s = seats[places[key]!]!
    const own = seats[key]!
    const w = own.w
    if (x >= s.cx - w / 2 && x <= s.cx + w / 2 && y >= s.y && y <= s.y + s.h) return key
  }
  return -1
}

export const onDeck = (x: number, y: number): boolean => x >= DECK.x && x <= DECK.x + DECK.w && y >= DECK.y && y <= DECK.y + DECK.h
