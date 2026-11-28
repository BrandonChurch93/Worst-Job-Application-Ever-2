// Where the standing figure of the power-up may stand: clear of every standing thing of the arena as it is drawn. Plain numbers.
import type { ViewBox } from './view'
import { ARENA, PAGE } from '../arena/layout'
import { STANDS } from '../arena/solids'
import { RAISE } from './tune'

// The box a standing thing is drawn in: its foot, and its body leaning up the screen and to the left by the arena's own lean.
export function drawnBoxes(): { id: string; box: ViewBox }[] {
  const out: { id: string; box: ViewBox }[] = []
  for (const s of STANDS) {
    const high = s.kind === 'pillar' ? ARENA.pillar.high : ARENA.pane.high
    const grow = s.kind === 'pillar' ? (ARENA.pillar.foot - ARENA.pillar.side) / 2 : 0
    out.push({ id: s.id, box: { x0: s.box.x0 - grow + ARENA.leanX * high, y0: s.box.y0 - grow - ARENA.lean * high, x1: s.box.x1 + grow, y1: s.box.y1 + grow } })
  }
  ARENA.corners.forEach((c, i) => out.push({ id: `gun.${i}`, box: { x0: c.x - ARENA.gun.reach, y0: c.y - ARENA.gun.reach, x1: c.x + ARENA.gun.reach, y1: c.y + ARENA.gun.reach } }))
  return out
}

// The box of the figure with its ring of flames when the arrow it stands in for is at p.
export const figureBox = (p: { x: number; y: number }): ViewBox => ({ x0: p.x + RAISE.box.x0, y0: p.y + RAISE.box.y0, x1: p.x + RAISE.box.x1, y1: p.y + RAISE.box.y1 })

const meets = (a: ViewBox, b: ViewBox): boolean => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

export function isClear(p: { x: number; y: number }, things = drawnBoxes()): boolean {
  const b = figureBox(p)
  if (b.x0 < 0 || b.y0 < 0 || b.x1 > PAGE.w || b.y1 > PAGE.h) return false
  return !things.some((t) => meets(b, t.box))
}

// The nearest spot to p at which the figure is clear: p itself where it is, else the first found on rings that grow by `step` px.
export function clearSpot(p: { x: number; y: number }): { x: number; y: number } {
  const things = drawnBoxes()
  if (isClear(p, things)) return { x: p.x, y: p.y }
  for (let r = RAISE.step; r <= RAISE.most; r += RAISE.step) {
    for (let i = 0; i < RAISE.turns; i++) {
      const a = (i / RAISE.turns) * Math.PI * 2
      const q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r }
      if (isClear(q, things)) return q
    }
  }
  return { x: p.x, y: p.y }
}
