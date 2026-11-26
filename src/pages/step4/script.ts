import type { Reaction } from '../../cursor/body'
import { FALLEN } from '../../boss/plan'
import type { Pointer } from '../../stage/types'
import type { Step4Layout } from './layout'

type Key = [number, number, number]

export interface FilmScript { pointer(time: number): Pointer; reactions: { at: number; name: Reaction }[]; tickAt: number }

// The film's cues, in seconds of the unit. Each idea has a wind-up, a move, a pose and a hold of 0.4 s or more.
// The doubt: it comes to the box and hangs back from it, creeps in, flinches off, stands and sweats, winds up and drops its weight on the box.
// The horror: a jump at the crack, a tall shocked hold while it backs off, a dart to the far edge of the card, and pale and stiff there while the machine builds.
// The anger: a loaded point before the first shot, a snap aside two frames after the first slab of the salvo is fired.
// The collapse: it ducks two frames after the power goes, then walks to the fallen button and sags there through the key.
// The press: it gathers itself, sets its point on the button's edge and drops its whole weight on it (the page cues the stamp and the relief that is held after it).
export const ACT = { flinch: 2.72, windup: 3.36, tap: 3.72, take: 4.7, jump: 6.15, hide: 6.95, steel: 8.75, load: 9.45, snap: 11.78, charge: 24.2, ram: 26.9, duck: 27.31, gather: 29.5, press: 29.88 } as const

export function makeScript(L: Step4Layout): FilmScript {
  const cb = L.checkbox
  const tickAt = 3.8
  const path: Key[] = [
    [0, 960, 560], [0.6, 960, 560],
    [1.25, cb.cx + 100, cb.cy + 52], [2.3, cb.cx + 100, cb.cy + 52], [2.7, cb.cx + 26, cb.cy + 14], [3.05, cb.cx + 96, cb.cy + 56], [3.45, cb.cx + 96, cb.cy + 56], [3.75, cb.cx, cb.cy + 2], [3.92, cb.cx, cb.cy + 2],
    [4.4, cb.cx + 430, cb.cy + 44], [5.3, cb.cx + 430, cb.cy + 44], [6.0, 820, 890], [6.12, 824, 894], [6.5, 600, 800], [6.95, 580, 790], [7.45, L.card.x - 36, L.card.y + 150], [8.7, L.card.x - 36, L.card.y + 150], [9.2, 430, 850],
    [9.45, 430, 880], [10.3, 430, 880], [10.75, 420, 700], [11.5, 420, 700], [11.95, 450, 900], [14.9, 450, 900], [15.3, 400, 720], [17.35, 400, 720],
    [17.8, 520, 900], [24.1, 520, 900], [25.4, 960, 770], [26.6, 1300, 800], [27.1, 1330, 880],
    [27.4, 1380, 934], [28.0, 1380, 934], [28.6, FALLEN.x - 215, FALLEN.y + 62], [29.5, FALLEN.x - 215, FALLEN.y + 62], [29.86, FALLEN.x - 122, FALLEN.y - 28], [32, FALLEN.x - 122, FALLEN.y - 28]
  ]
  const clicks: number[] = [tickAt]
  const burst = (from: number, to: number, every: number): void => {
    for (let t = from; t < to - 1e-6; t += every) clicks.push(Number(t.toFixed(3)))
  }
  burst(9.82, 12.3, 0.34)
  clicks.push(15.27)
  clicks.push(16.45, 16.85, 17.25, 17.55)
  clicks.push(18.0, 18.16, 18.32, 18.6, 18.8)
  clicks.push(19.05, 19.3, 19.52, 19.72, 19.9, 20.07)
  clicks.push(21.1, 21.3, 21.48)
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
      const e = u * u * (3 - 2 * u)
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
    { at: ACT.jump, name: 'jump' },
    { at: ACT.hide, name: 'dart' },
    { at: ACT.steel, name: 'anticipate' },
    { at: ACT.load, name: 'anticipate' },
    { at: ACT.snap, name: 'snap' },
    { at: ACT.charge, name: 'anticipate' },
    { at: ACT.ram, name: 'stamp' },
    { at: ACT.duck, name: 'duck' },
    { at: ACT.gather, name: 'anticipate' }
  ]
  return { pointer, reactions, tickAt }
}
