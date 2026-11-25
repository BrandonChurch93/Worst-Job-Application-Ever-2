import type { Reaction } from '../../cursor/body'
import { FALLEN } from '../../boss/plan'
import type { Pointer } from '../../stage/types'
import type { Step4Layout } from './layout'

type Key = [number, number, number]

export interface FilmScript { pointer(time: number): Pointer; reactions: { at: number; name: Reaction }[]; tickAt: number }

export function makeScript(L: Step4Layout): FilmScript {
  const cb = L.checkbox
  const tickAt = 3.8
  const path: Key[] = [
    [0, 960, 560], [0.6, 960, 560],
    [1.5, cb.cx + 330, cb.cy + 26], [2.3, cb.cx + 70, cb.cy + 26], [2.7, cb.cx + 26, cb.cy + 14], [3.05, cb.cx + 96, cb.cy + 56], [3.45, cb.cx + 96, cb.cy + 56], [3.75, cb.cx, cb.cy + 2], [3.92, cb.cx, cb.cy + 2],
    [4.4, cb.cx + 430, cb.cy + 44], [5.3, cb.cx + 430, cb.cy + 44], [6.0, 820, 890], [6.12, 824, 894], [6.5, 600, 800], [7.4, 450, 830], [9.0, 430, 840],
    [9.45, 430, 880], [10.3, 430, 880], [10.75, 420, 700], [11.85, 420, 700], [12.3, 450, 900], [14.9, 450, 900], [15.3, 400, 720], [17.35, 400, 720],
    [17.8, 520, 900], [23.95, 520, 900], [25.4, 960, 770], [26.6, 1300, 800], [27.1, 1330, 880],
    [27.4, 1380, 934], [28.1, 1380, 934], [28.9, FALLEN.x - 215, FALLEN.y + 62], [29.5, FALLEN.x - 215, FALLEN.y + 62], [30.25, FALLEN.x - 122, FALLEN.y - 28], [32, FALLEN.x - 122, FALLEN.y - 28]
  ]
  const clicks: number[] = [tickAt]
  const burst = (from: number, to: number, every: number): void => {
    for (let t = from; t < to - 1e-6; t += every) clicks.push(Number(t.toFixed(3)))
  }
  burst(9.9, 15.6, 0.66)
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
  clicks.push(30.5)
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
    { at: 3.5, name: 'anticipate' },
    { at: 4.7, name: 'doubleTake' },
    { at: 6.15, name: 'jump' },
    { at: 8.7, name: 'anticipate' },
    { at: 29.45, name: 'anticipate' }
  ]
  return { pointer, reactions, tickAt }
}
