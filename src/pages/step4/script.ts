import type { Reaction } from '../../cursor/body'
import { FALLEN } from '../../boss/plan'
import type { Pointer } from '../../stage/types'
import type { Step4Layout } from './layout'

type Ease = 'out' | 'in'
type Key = [number, number, number, Ease?]

export interface FilmScript { pointer(time: number): Pointer; reactions: { at: number; name: Reaction }[]; tickAt: number }

// The film's cues, in seconds of the unit. Each idea is one move, one pose and a hold of 0.2 s or more, and no cue lands inside another's pose.
// The doubt: one quick move that stops short of the box and holds, a flinch and a pull back that is held with the sweat, a wind-up, the commit onto the box and a stamp on the click, then it stands under the answer, clear of the card, and looks at it.
// The horror: it is at the button when the page cracks, is thrown back from it in two frames and holds laid back, starts when the machine opens, darts behind the card, on the side away from the machine, and cowers there while the machine builds.
// The fight: it steps out of cover and bounces once, rears as the first slab is fired at it and holds that, steps out of its way, and only then fires back; a snap aside two frames after the first slab of the salvo is fired; the slab that strikes it throws it back and it lies where it was thrown.
// The collapse: it ducks two frames after the power goes, then walks to the fallen button and sags as it gets there, so it is scorched and sagging at the key.
// The press: it gathers itself, sets its point on the button and drops its whole weight on it (the page cues the stamp and the relief that is held after it).
export const ACT = { flinch: 1.95, windup: 3.36, tap: 3.72, take: 4.62, hide: 7.1, cower: 7.6, steel: 8.75, load: 9.25, brace: 9.96, snap: 11.94, charge: 24.2, ram: 26.9, duck: 27.31, gather: 29.5, press: 29.88 } as const

export const STAND = { x: 150, y: 96, near: 190 } as const
const SHORT = { x: 70, y: 60 } as const
const ANSWER = { x: 64, y: 172 } as const
const SHOCK = { x: 610, y: 800 } as const
const COVER = { x: 86, y: 520 } as const
const THROWN = { at: 13.1, x: 368, y: 922 } as const
const PRESS_AT = { x: 88, y: 20 } as const
const BAR = { x: 820, y: 306 } as const
const BLOCKED = { x: 430, y: 800 } as const
const ROUND = { x: 560, y: 650 } as const
const STRUCK = { at: 20.24, x: 470, y: 668 } as const

export function makeScript(L: Step4Layout): FilmScript {
  const cb = L.checkbox
  const tickAt = 3.8
  const short = { x: cb.cx + SHORT.x, y: cb.cy + SHORT.y }
  const back = { x: cb.cx + STAND.x, y: cb.cy + STAND.y }
  const answer = { x: cb.cx + ANSWER.x, y: cb.cy + ANSWER.y }
  const path: Key[] = [
    [0, 960, 560], [0.5, 960, 560],
    [1.2, short.x, short.y, 'out'], [1.97, short.x, short.y], [2.2, back.x, back.y, 'out'], [3.45, back.x, back.y], [3.72, cb.cx, cb.cy + 2, 'in'], [3.98, cb.cx, cb.cy + 2],
    [4.34, answer.x, answer.y, 'out'], [5.3, answer.x, answer.y], [6.04, 820, 890], [6.1, 822, 892], [6.25, SHOCK.x, SHOCK.y, 'out'], [ACT.hide, SHOCK.x, SHOCK.y], [7.46, COVER.x, COVER.y, 'out'], [8.7, COVER.x, COVER.y], [9.2, 430, 850],
    [9.45, 430, 880], [10.42, 430, 880], [10.75, 420, 700, 'out'], [11.66, 420, 700], [12.11, 450, 900], [THROWN.at, 450, 900], [THROWN.at + 0.16, THROWN.x, THROWN.y, 'out'], [14.9, THROWN.x, THROWN.y], [15.3, 400, 720], [17.6, 400, 720], [17.9, BLOCKED.x, BLOCKED.y], [18.12, BLOCKED.x, BLOCKED.y], [18.5, ROUND.x, ROUND.y, 'out'], [STRUCK.at, ROUND.x, ROUND.y], [STRUCK.at + 0.16, STRUCK.x, STRUCK.y, 'out'], [22.4, STRUCK.x, STRUCK.y], [22.62, BAR.x + 26, 580], [22.86, BAR.x, BAR.y, 'out'], [24.15, BAR.x, BAR.y], [25.4, 960, 770], [26.6, 1262, 804], [27.1, 1296, 884],
    [27.4, 1380, 934], [28.0, 1380, 934], [28.6, FALLEN.x - 150, FALLEN.y + 74], [29.5, FALLEN.x - 150, FALLEN.y + 74], [29.76, FALLEN.x - PRESS_AT.x, FALLEN.y - PRESS_AT.y, 'in'], [32, FALLEN.x - PRESS_AT.x, FALLEN.y - PRESS_AT.y]
  ]
  const clicks: number[] = [tickAt]
  const burst = (from: number, to: number, every: number): void => {
    for (let t = from; t < to - 1e-6; t += every) clicks.push(Number(t.toFixed(3)))
  }
  burst(10.84, 12.3, 0.17)
  clicks.push(15.27)
  clicks.push(16.45, 16.85, 17.25, 17.55)
  clicks.push(18.0)
  burst(18.6, 20.2, 0.17)
  clicks.push(21.28)
  let at = 23.99
  let gap = 0.42
  for (let i = 0; i < 17; i++) {
    clicks.push(Number(at.toFixed(3)))
    at += Math.max(0.095, gap)
    gap *= 0.87
  }
  clicks.push(ACT.press)
  const pointer = (time: number): Pointer => {
    let x = path[0]![1]
    let y = path[0]![2]
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!
      const b = path[i]!
      if (time >= b[0]) {
        x = b[1]
        y = b[2]
        continue
      }
      const u = Math.min(1, Math.max(0, (time - a[0]) / (b[0] - a[0])))
      const e = b[3] === 'out' ? 1 - (1 - u) ** 3 : b[3] === 'in' ? u ** 2.4 : u * u * (3 - 2 * u)
      x = a[1] + (b[1] - a[1]) * e
      y = a[2] + (b[2] - a[2]) * e
      break
    }
    let down = false
    for (const c of clicks) if (time >= c && time < c + 0.07) down = true
    return { x, y, down }
  }
  const reactions: { at: number; name: Reaction }[] = [
    { at: ACT.flinch, name: 'flinch' },
    { at: ACT.windup, name: 'anticipate' },
    { at: ACT.tap, name: 'stamp' },
    { at: ACT.take, name: 'doubleTake' },
    { at: ACT.hide, name: 'dart' },
    { at: ACT.cower, name: 'cower' },
    { at: ACT.steel, name: 'anticipate' },
    { at: ACT.load, name: 'jump' },
    { at: ACT.brace, name: 'rear' },
    { at: ACT.snap, name: 'snap' },
    { at: ACT.charge, name: 'anticipate' },
    { at: ACT.ram, name: 'stamp' },
    { at: ACT.duck, name: 'duck' },
    { at: ACT.gather, name: 'anticipate' }
  ]
  return { pointer, reactions, tickAt }
}
