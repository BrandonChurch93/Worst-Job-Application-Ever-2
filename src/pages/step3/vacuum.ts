import type { Acting } from '../../cursor/body'

// The fight with the port. `keys`: how far of the way from the hand to the port the arrow is held, by the seconds of the fight (dragged, digs in, slips, claws back, slips again, hangs on the rim). `slips`: the seconds a slip starts. `end`: the fight's length when the hand does nothing.
// `grip`: the px a hand must travel away from the port to win back the whole way; `gripMost`: the most it can win back; `tire`: how fast what it won is lost again, a second; `stall`: how far a hand that pulls away slows the fight's clock, so a fighting hand lasts `end / (1 - stall)` seconds at most; `hard`: the px a second that count as pulling with all it has.
export const VAC = {
  keys: [[0, 0], [0.6, 0.22], [1.0, 0.25], [1.2, 0.55], [1.8, 0.58], [2.05, 0.79], [2.3, 0.83]],
  slips: [1.0, 1.8],
  end: 2.3,
  grip: 620,
  gripMost: 0.3,
  tire: 0.12,
  stall: 0.55,
  hard: 260,
  // The arrow's length as drawn in each part of the fight, the lunges a second while it claws back and how deep they are, and its shake on the rim (radians, swings a second).
  long: [1.12, 0.8, 1.36, 0.98, 1.42, 1.46],
  lunges: 3.4,
  lunge: 0.2,
  dig: [0.07, 15, 0.4],
  rim: [0.2, 17, 0.25],
  // The film's hand: how far of the way from where the arrow comes on to the port it walks before it is caught, how far back it has pulled when it has clawed back, and how far it has given by the end.
  hand: [0.2, 0.03, 0.26],
  jerks: 3
}
const MOOD: Acting[] = ['shocked', 'nervous', 'shocked', 'angry', 'scared', 'nervous']

const smooth = (u: number): number => {
  const t = Math.max(0, Math.min(1, u))
  return t * t * (3 - 2 * t)
}

// How far of the way to the port the arrow is held after `tau` seconds of the fight.
export function held(tau: number): number {
  const k = VAC.keys
  if (tau <= 0) return 0
  for (let i = 1; i < k.length; i++) {
    if (tau > k[i]![0]!) continue
    const u = (tau - k[i - 1]![0]!) / (k[i]![0]! - k[i - 1]![0]!)
    const slip = VAC.slips.includes(k[i - 1]![0]!)
    return k[i - 1]![1]! + (k[i]![1]! - k[i - 1]![1]!) * (slip ? 1 - (1 - u) * (1 - u) : smooth(u))
  }
  return k[k.length - 1]![1]!
}

// The part of the fight: 0 dragged, 1 digs in, 2 slips, 3 claws back, 4 slips again, 5 on the rim.
export const partAt = (tau: number): number => {
  let i = 0
  while (i + 2 < VAC.keys.length && tau >= VAC.keys[i + 1]![0]!) i++
  return i
}

export interface Fought { state: number[]; x: number; y: number; part: number; began: boolean; lost: boolean; long: number; mood: Acting; pull: number }

// One step of the fight. `state` is the fight's clock, what the hand has won back, the hand's last place and the part. `clock` is the fight's clock when the film sets it, or -1 when the hand's own fight moves it.
export function fight(state: number[], hand: { x: number; y: number }, port: { x: number; y: number }, dt: number, clock: number): Fought {
  const dx = port.x - hand.x
  const dy = port.y - hand.y
  const d = Math.hypot(dx, dy) || 1
  const away = Math.max(0, -((hand.x - state[2]!) * dx + (hand.y - state[3]!) * dy) / d)
  const tau = clock >= 0 ? clock : state[0]! + dt * (1 - VAC.stall * Math.min(1, away / dt / VAC.hard))
  const part = partAt(tau)
  const began = part !== state[4]
  let won = Math.max(0, Math.min(VAC.gripMost, state[1]! + away / VAC.grip) - VAC.tire * dt)
  if (began && (part === 2 || part === 4)) won = 0
  const k = Math.max(0, held(tau) - won)
  const lunge = part === 3 ? VAC.lunge * Math.abs(Math.sin(Math.PI * VAC.lunges * (tau - VAC.keys[3]![0]!))) : 0
  return { state: [tau, won, hand.x, hand.y, part], x: hand.x + dx * k, y: hand.y + dy * k, part, began, lost: tau >= VAC.end, long: VAC.long[part]! + lunge, mood: MOOD[part]!, pull: k }
}

// Where the film's hand is: it walks on from `from`, is caught at `on`, holds, pulls back in jerks while the arrow claws back and gives way before `end`.
export function filmHand(time: number, from: { x: number; y: number }, port: { x: number; y: number }, start: number, on: number, end: number): { x: number; y: number } {
  const tau = (VAC.end * (time - on)) / (end - on)
  const [walk, back, give] = VAC.hand as [number, number, number]
  let f = walk * smooth((time - start) / (on + 0.2 - start))
  const a = VAC.keys[3]![0]!
  const b = VAC.keys[4]![0]!
  if (tau >= a) {
    const u = Math.min(1, (tau - a) / (b - a)) * VAC.jerks
    const done = Math.min(VAC.jerks, Math.floor(u))
    f = walk + (back - walk) * ((done + (done < VAC.jerks ? smooth((u - done) / 0.55) : 0)) / VAC.jerks)
  }
  if (tau > b) f = back + (give - back) * smooth((tau - b) / (VAC.end - b))
  if (time > end) f = give + (1 - give) * smooth((time - end) / 0.3)
  return { x: from.x + (port.x - from.x) * f, y: from.y + (port.y - from.y) * f }
}

// What the pull does to the words of the page: each block slides `px` toward the port and tips by `rot` radians, with a shiver of `shiver` of that, `hz` times a second. `rise` and `fall` are the seconds the pull takes to come on and to die when the port has shut.
export const LEAN = { px: 64, rot: 0.07, shiver: 0.18, hz: 6.5, rise: 0.4, fall: 0.3 }

export function leanOf(box: { x: number; y: number; w: number; h: number }, port: { x: number; y: number }, pull: number, time: number, i: number): { x: number; y: number; rot: number; moved: boolean } {
  const dx = port.x - (box.x + box.w / 2)
  const dy = port.y - (box.y + box.h / 2)
  const d = Math.hypot(dx, dy) || 1
  const k = pull * (1 + LEAN.shiver * Math.sin(6.283185307179586 * LEAN.hz * time + i * 2.1))
  return { x: box.x + (dx / d) * LEAN.px * k, y: box.y + (dy / d) * LEAN.px * k, rot: LEAN.rot * k * (dy >= 0 ? 1 : -1), moved: true }
}
