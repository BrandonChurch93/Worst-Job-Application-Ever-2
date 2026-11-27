// What stands in the arena and stops a shot, from the view alone. Plain numbers, no three.js.
import type { BossView, SolidsOf, ViewBox, ViewBreak, ViewSolid } from '../boss/view'
import { ARENA, MIDDLE, PANES, PILLARS, paneBox, pillarBox } from './layout'

// How far a point is from a segment.
export function toSegment(px: number, py: number, x0: number, y0: number, x1: number, y1: number): { d: number; t: number } {
  const dx = x1 - x0, dy = y1 - y0
  const l2 = dx * dx + dy * dy
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2)) : 0
  return { d: Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t)), t }
}

const cross = (ax: number, ay: number, bx: number, by: number): number => ax * by - ay * bx
function segmentsMeet(a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): boolean {
  const d = cross(a1x - a0x, a1y - a0y, b1x - b0x, b1y - b0y)
  if (Math.abs(d) < 1e-9) return false
  const t = cross(b0x - a0x, b0y - a0y, b1x - b0x, b1y - b0y) / d
  const u = cross(b0x - a0x, b0y - a0y, a1x - a0x, a1y - a0y) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

// How far a box is from a segment: 0 where they touch.
export function boxToSegment(b: ViewBox, x0: number, y0: number, x1: number, y1: number): number {
  const inside = (x: number, y: number): boolean => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1
  if (inside(x0, y0) || inside(x1, y1)) return 0
  const c: [number, number][] = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]]
  let best = Infinity
  for (let i = 0; i < 4; i++) {
    const p = c[i]!, q = c[(i + 1) % 4]!
    if (segmentsMeet(p[0], p[1], q[0], q[1], x0, y0, x1, y1)) return 0
    best = Math.min(best, toSegment(p[0], p[1], x0, y0, x1, y1).d, toSegment(x0, y0, p[0], p[1], q[0], q[1]).d, toSegment(x1, y1, p[0], p[1], q[0], q[1]).d)
  }
  return best
}

// The one rule of a blast: a thing breaks when its box is within half the blast's width of the blast's line.
export const breaksBox = (k: ViewBreak, b: ViewBox): boolean => boxToSegment(b, k.x0, k.y0, k.x1, k.y1) <= k.width / 2

export interface Stand { id: string; kind: 'pillar' | 'pane'; box: ViewBox }

export const STANDS: Stand[] = [
  ...PILLARS.map((p): Stand => ({ id: p.id, kind: 'pillar', box: pillarBox(p) })),
  ...PANES.map((p): Stand => ({ id: p.id, kind: 'pane', box: paneBox(p) }))
]

// The blast that broke a thing, the first in time, or null while it stands.
export function brokenBy(breaks: readonly ViewBreak[], time: number, s: Stand): ViewBreak | null {
  let first: ViewBreak | null = null
  for (const k of breaks) {
    if (k.at > time || !breaksBox(k, s.box)) continue
    if (!first || k.at < first.at || (k.at === first.at && k.id < first.id)) first = k
  }
  return first
}

// A thing stops shots once it has risen: from the moment the scene change is over.
export const standing = (view: BossView): Stand[] => (view.time < ARENA.changeSeconds ? [] : STANDS.filter((s) => brokenBy(view.breaks, view.time, s) === null))

export const solids: SolidsOf = (view) => ({
  standing: standing(view).map((s): ViewSolid => ({ id: s.id, kind: s.kind, box: { ...s.box } })),
  slab: MIDDLE.map((p) => ({ x: p.x, y: p.y }))
})
