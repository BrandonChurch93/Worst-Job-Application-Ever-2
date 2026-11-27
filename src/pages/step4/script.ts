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
// The fight: it steps out of cover and bounces once, rears as the big turret locks over the button, and fires at the shield, where its darts glance off. It snaps aside and goes round over the top to the open flank, where its darts count.
// When the shield has come round it goes round again; a corner cannon's bullet flattens it, it peels itself up and the boss wins a little back. A pop-up stops its darts until it has shot the pop-up down; it leaves the line of the big blast, and fires from the far side while the turret is busy.
// At the last it takes the low side, the high side and the low side again, each before the shield has come round, firing faster and faster.
// The collapse: it ducks two frames after the power goes, then walks to the fallen button and sags as it gets there, so it is scorched and sagging at the key.
// The press: it gathers itself, sets its point on the button and drops its whole weight on it (the page cues the stamp and the relief that is held after it).
export const ACT = { flinch: 1.95, windup: 3.36, tap: 3.72, take: 4.62, hide: 7.1, cower: 7.6, steel: 8.75, load: 9.25, brace: 10.55, snap: 11.5, charge: 23.65, ram: 27.15, duck: 27.56, gather: 29.5, press: 29.88 } as const

export const STAND = { x: 150, y: 96, near: 190 } as const
const SHORT = { x: 70, y: 60 } as const
const ANSWER = { x: 64, y: 172 } as const
const SHOCK = { x: 610, y: 800 } as const
const COVER = { x: 446, y: 688 } as const
const PRESS_AT = { x: 88, y: 20 } as const
// Where it stands in the fight, in the order it comes to them: before the shield, on the open flank, on the other side where the corner cannon's bullet finds it, on the right, behind a pillar on the line of the big blast, aside from that line.
const GLANCE = { x: 470, y: 500 } as const
const FLANK = { x: 1400, y: 380 } as const
const OTHER = { x: 440, y: 790 } as const
const RIGHT = { x: 1400, y: 500 } as const
// The last charge is three stands on opposite sides of the boss, each one taken before the shield has come round.
const LOW = { x: 1300, y: 880 } as const
const OVER = { x: 1340, y: 240 } as const

export function makeScript(L: Step4Layout): FilmScript {
  const cb = L.checkbox
  const tickAt = 3.8
  const short = { x: cb.cx + SHORT.x, y: cb.cy + SHORT.y }
  const back = { x: cb.cx + STAND.x, y: cb.cy + STAND.y }
  const answer = { x: cb.cx + ANSWER.x, y: cb.cy + ANSWER.y }
  const path: Key[] = [
    [0, 960, 560], [0.5, 960, 560],
    [1.2, short.x, short.y, 'out'], [1.97, short.x, short.y], [2.2, back.x, back.y, 'out'], [3.45, back.x, back.y], [3.72, cb.cx, cb.cy + 2, 'in'], [3.98, cb.cx, cb.cy + 2],
    [4.34, answer.x, answer.y, 'out'], [5.3, answer.x, answer.y], [6.04, 820, 890], [6.1, 822, 892], [6.25, SHOCK.x, SHOCK.y, 'out'], [ACT.hide, SHOCK.x, SHOCK.y], [7.46, COVER.x, COVER.y, 'out'], [8.7, COVER.x, COVER.y], [9.2, 462, 560],
    [9.45, GLANCE.x, GLANCE.y, 'out'], [11.55, GLANCE.x, GLANCE.y], [11.75, 940, 236], [11.95, FLANK.x, FLANK.y, 'out'],
    [13.3, FLANK.x, FLANK.y], [13.44, 720, 236], [13.58, 440, 430], [13.72, OTHER.x, OTHER.y, 'out'],
    [17.2, OTHER.x, OTHER.y], [17.36, 900, 950], [17.55, RIGHT.x, RIGHT.y, 'out'], [20.4, RIGHT.x, RIGHT.y], [20.56, 940, 236], [20.75, GLANCE.x, GLANCE.y, 'out'],
    [23.65, GLANCE.x, GLANCE.y],
    [23.82, 940, 236], [24.0, OVER.x, OVER.y, 'out'], [25.0, OVER.x, OVER.y], [25.14, 940, 236], [25.28, GLANCE.x, GLANCE.y, 'out'],
    [26.2, GLANCE.x, GLANCE.y], [26.34, 940, 236], [26.48, OVER.x, OVER.y, 'out'], [27.75, OVER.x, OVER.y], [28.7, FALLEN.x - 150, FALLEN.y + 74], [29.5, FALLEN.x - 150, FALLEN.y + 74], [29.76, FALLEN.x - PRESS_AT.x, FALLEN.y - PRESS_AT.y, 'in'], [32, FALLEN.x - PRESS_AT.x, FALLEN.y - PRESS_AT.y]
  ]
  const clicks: number[] = [tickAt]
  const burst = (from: number, to: number, every: number): void => {
    for (let t = from; t < to - 1e-6; t += every) clicks.push(Number(t.toFixed(3)))
  }
  burst(10.85, 11.5, 0.17)
  burst(12.05, 13.28, 0.17)
  burst(13.8, 14.9, 0.17)
  burst(16.0, 16.5, 0.17)
  burst(17.6, 20.35, 0.17)
  burst(20.8, 22.4, 0.17)
  burst(24.05, 24.95, 0.17)
  burst(25.32, 26.15, 0.15)
  burst(26.5, 27.3, 0.1)
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
