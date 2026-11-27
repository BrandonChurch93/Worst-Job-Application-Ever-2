import type { Acting } from '../../cursor/body'

// The fight with the port. `keys`: how far of the way from the hand to the port the arrow is held, by the seconds of the fight. `kinds`: what the arrow does between one key and the next: 0 dragged, 1 digs in, 2 slips, 3 claws back, 5 hooked on the rim. `end`: the fight's length when the hand does nothing.
// `grip`: the px a hand must travel away from the port to win back the whole way; `gripMost`: the most it can win back; `tire`: how fast what it won is lost again, a second; `quick`: how fast the fight's clock runs on the live site, where the scene has fewer seconds to give, so a hand that does nothing is taken in `end / quick` seconds; `stall`: how far a hand that pulls away slows that clock, so a fighting hand lasts `end / quick / (1 - stall)` seconds at most; `hard`: the px a second that count as pulling with all it has.
export const VAC = {
  keys: [[0, 0], [0.6, 0.2], [1.2, 0.24], [1.6, 0.6], [2.9, 0.3], [3.2, 0.66], [4.3, 0.42], [4.6, 0.7], [5.1, 0.62], [5.3, 0.75], [5.8, 0.77]],
  kinds: [0, 1, 2, 3, 2, 3, 2, 3, 2, 5],
  end: 5.8,
  grip: 620,
  gripMost: 0.3,
  tire: 0.12,
  quick: 1.8125,
  stall: 0.54,
  hard: 260,
  // The arrow's length as drawn in each kind of part, the lunges a second while it claws back and how deep they are, and its shake when it digs in and on the rim (radians, swings a second, seconds).
  long: [1.12, 0.8, 1.42, 0.98, 1, 1.46],
  lunges: 3.4,
  lunge: 0.2,
  dig: [0.07, 15, 0.5],
  rim: [0.2, 17, 0.5],
  // The film's hand: how far of the way from where the arrow comes on to the port it is at each key of the fight. It pulls back in `jerks` jerks while the arrow claws back.
  hand: [0.2, 0.2, 0.2, 0.25, 0.06, 0.14, 0.03, 0.17, 0.1, 0.2, 0.26],
  jerks: 3
}
const MOOD: Acting[] = ['shocked', 'nervous', 'angry', 'nervous', 'nervous', 'scared']

const smooth = (u: number): number => {
  const t = Math.max(0, Math.min(1, u))
  return t * t * (3 - 2 * t)
}

// The part of the fight after `tau` seconds: the number of the key it began at.
export const partAt = (tau: number): number => {
  let i = 0
  while (i + 2 < VAC.keys.length && tau >= VAC.keys[i + 1]![0]!) i++
  return i
}

export const kindAt = (tau: number): number => VAC.kinds[partAt(tau)]!

// How far of the way to the port the arrow is held after `tau` seconds of the fight.
export function held(tau: number): number {
  const k = VAC.keys
  if (tau <= 0) return 0
  if (tau >= k[k.length - 1]![0]!) return k[k.length - 1]![1]!
  const i = partAt(tau)
  const u = (tau - k[i]![0]!) / (k[i + 1]![0]! - k[i]![0]!)
  return k[i]![1]! + (k[i + 1]![1]! - k[i]![1]!) * (VAC.kinds[i] === 2 ? 1 - (1 - u) * (1 - u) : smooth(u))
}

export interface Fought { state: number[]; x: number; y: number; part: number; kind: number; began: boolean; lost: boolean; long: number; mood: Acting; pull: number }

// One step of the fight. `state` is the fight's clock, what the hand has won back, the hand's last place and the part. `clock` is the fight's clock when the film sets it, or -1 when the hand's own fight moves it.
export function fight(state: number[], hand: { x: number; y: number }, port: { x: number; y: number }, dt: number, clock: number): Fought {
  const dx = port.x - hand.x
  const dy = port.y - hand.y
  const d = Math.hypot(dx, dy) || 1
  const away = Math.max(0, -((hand.x - state[2]!) * dx + (hand.y - state[3]!) * dy) / d)
  const tau = clock >= 0 ? clock : state[0]! + dt * VAC.quick * (1 - VAC.stall * Math.min(1, away / dt / VAC.hard))
  const part = partAt(tau)
  const kind = VAC.kinds[part]!
  const began = part !== state[4]
  let won = Math.max(0, Math.min(VAC.gripMost, state[1]! + away / VAC.grip) - VAC.tire * dt)
  if (began && kind === 2) won = 0
  const k = Math.max(0, held(tau) - won)
  const lunge = kind === 3 ? VAC.lunge * Math.abs(Math.sin(Math.PI * VAC.lunges * (tau - VAC.keys[part]![0]!))) : 0
  return { state: [tau, won, hand.x, hand.y, part], x: hand.x + dx * k, y: hand.y + dy * k, part, kind, began, lost: tau >= VAC.end, long: VAC.long[kind]! + lunge, mood: MOOD[kind]!, pull: k }
}

// Where the film's hand is: it walks on from `from`, is caught at `on`, pulls back in jerks while the arrow claws back, is dragged on at each slip, and gives way after `end`.
export function filmHand(time: number, from: { x: number; y: number }, port: { x: number; y: number }, start: number, on: number, end: number): { x: number; y: number } {
  const tau = (VAC.end * (time - on)) / (end - on)
  const h = VAC.hand
  let f = h[0]! * smooth((time - start) / (on + 0.2 - start))
  if (tau > 0 && tau < VAC.end) {
    const i = partAt(tau)
    const u = (tau - VAC.keys[i]![0]!) / (VAC.keys[i + 1]![0]! - VAC.keys[i]![0]!)
    const jerk = Math.min(VAC.jerks, Math.floor(u * VAC.jerks))
    const way = VAC.kinds[i] === 3 ? (jerk + smooth((u * VAC.jerks - jerk) / 0.55)) / VAC.jerks : smooth(u)
    f = Math.min(f, h[0]!) + (h[i]! - h[0]!) + (h[i + 1]! - h[i]!) * way
  }
  const give = h[h.length - 1]!
  if (tau >= VAC.end) f = give + (1 - give) * smooth((time - end) / 0.3)
  return { x: from.x + (port.x - from.x) * f, y: from.y + (port.y - from.y) * f }
}

// What the pull does to the words of the page: each block slides `px` toward the port and tips by `rot` radians, with a shiver of `shiver` of that, `hz` times a second. `rise` and `fall` are the seconds the pull takes to come on and to die when the port has shut. On the live site the port winds up to `early` of the whole pull over `wind` seconds from `from` on, before it has the arrow.
export const LEAN = { px: 64, rot: 0.07, shiver: 0.18, hz: 6.5, rise: 0.4, fall: 0.3, early: 0.5, wind: 1.4, from: 0.7 }

export const windOf = (time: number): number => LEAN.early * Math.min(1, Math.max(0, time - LEAN.from) / LEAN.wind)

export function leanOf(box: { x: number; y: number; w: number; h: number }, port: { x: number; y: number }, pull: number, time: number, i: number): { x: number; y: number; rot: number; moved: boolean } {
  const dx = port.x - (box.x + box.w / 2)
  const dy = port.y - (box.y + box.h / 2)
  const d = Math.hypot(dx, dy) || 1
  const k = pull * (1 + LEAN.shiver * Math.sin(6.283185307179586 * LEAN.hz * time + i * 2.1))
  return { x: box.x + (dx / d) * LEAN.px * k, y: box.y + (dy / d) * LEAN.px * k, rot: LEAN.rot * k * (dy >= 0 ? 1 : -1), moved: true }
}

// The words the pull tears off the page: one word in `every` of the paragraph, each let go `at` seconds after the port has the arrow. A word flies to the port in `flight` seconds, slow at first (`grow`), swings `bend` px to one side on the way, turns `spin` radians and rides `lift` px over the page; `rows` and `lead` say where in the paragraph's box it starts.
export const LOOSE = { every: 2, at: [0.5, 1.2, 1.35, 1.9, 2.5, 2.9, 3.05, 3.6, 4.2, 4.35, 4.8, 5.1], flight: 1.3, grow: 1.3, bend: 46, spin: 1.1, lift: 8, rows: 4, lead: 34 }

export function looseOf(i: number, age: number, box: { x: number; y: number; w: number }, port: { x: number; y: number }): { x: number; y: number; rot: number } | null {
  const u = (age - LOOSE.at[i]!) / LOOSE.flight
  if (u < 0 || u >= 1) return null
  const side = i % 2 === 0 ? 1 : -1
  const fx = box.x + box.w * (((i * 0.37) % 1) * 0.8 + 0.1)
  const fy = box.y + (i % LOOSE.rows) * LOOSE.lead
  const dx = port.x - fx
  const dy = port.y - fy
  const d = Math.hypot(dx, dy) || 1
  const e = Math.pow(u, LOOSE.grow)
  const off = side * LOOSE.bend * Math.sin(Math.PI * u)
  return { x: fx + dx * e - (dy / d) * off, y: fy + dy * e + (dx / d) * off, rot: side * LOOSE.spin * e }
}
