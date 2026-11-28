import { describe, expect, it } from 'vitest'
import type { BossView, ViewBreak, ViewCorner } from '../src/boss/view'
import { ARENA, MIDDLE, PANES, PILLARS, SLABS, paneBox, pillarBox } from '../src/arena/layout'
import { boxToSegment, breaksBox, brokenBy, solids, standing, STANDS, toSegment } from '../src/arena/solids'

const view = (time: number, breaks: ViewBreak[] = []): BossView => {
  const gun = { aim: 0, tell: 0, firedAt: null }
  return {
    time, phase: time < 2.9 ? 'form' : 'fight',
    boss: { x: 960, y: 550, vx: 0, vy: 0, heading: 0, walked: 0, form: 1, turret: 1, locked: true, health: 1, stage: 0, shield: { glancedAt: null, half: 0.6 }, guns: [gun, { ...gun }], big: null, weak: null, healedAt: null, hitAt: null, beaten: 0 },
    bullets: [], darts: [], hits: [],
    corners: ARENA.corners.map((c, i) => ({ id: i, x: c.x, y: c.y, aim: 0, tell: 0, firedAt: null })) as [ViewCorner, ViewCorner, ViewCorner, ViewCorner],
    arrow: { x: 960, y: 900, flat: 0, flatAt: null }, breaks
  }
}
const blast = (id: number, at: number, x0: number, y0: number, x1: number, y1: number, width = 130): ViewBreak => ({ id, at, x0, y0, x1, y1, width })

describe('arena solids', () => {
  it('measures a point and a box against a segment', () => {
    expect(toSegment(5, 3, 0, 0, 10, 0).d).toBeCloseTo(3)
    expect(toSegment(-4, 3, 0, 0, 10, 0).d).toBeCloseTo(5)
    expect(boxToSegment({ x0: 0, y0: 0, x1: 10, y1: 10 }, -5, 5, 20, 5)).toBe(0)
    expect(boxToSegment({ x0: 0, y0: 0, x1: 10, y1: 10 }, 2, 2, 3, 3)).toBe(0)
    expect(boxToSegment({ x0: 0, y0: 0, x1: 10, y1: 10 }, -5, 30, 20, 30)).toBeCloseTo(20)
    expect(boxToSegment({ x0: 0, y0: 0, x1: 10, y1: 10 }, 13, 14, 40, 14)).toBeCloseTo(5)
  })

  it('has nothing standing until the change is over, then eight pillars and two panes', () => {
    expect(solids(view(0)).standing).toEqual([])
    expect(solids(view(ARENA.changeSeconds - 0.01)).standing).toEqual([])
    const s = solids(view(ARENA.changeSeconds))
    expect(s.standing.filter((x) => x.kind === 'pillar')).toHaveLength(8)
    expect(s.standing.filter((x) => x.kind === 'pane')).toHaveLength(2)
    expect(new Set(s.standing.map((x) => x.id)).size).toBe(10)
    PILLARS.forEach((p, i) => expect(s.standing[i]!.box).toEqual(pillarBox(p)))
    PANES.forEach((p, i) => expect(s.standing[8 + i]!.box).toEqual(paneBox(p)))
  })

  it('gives the middle slab as its eight joints, with a rectangle that lies wholly on it', () => {
    const s = solids(view(10))
    expect(s.slab).toHaveLength(8)
    expect(s.slab).toEqual(MIDDLE.map((p) => ({ x: p.x, y: p.y })))
    const within = (pts: { x: number; y: number }[], x: number, y: number): boolean => {
      let odd = false
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i]!, b = pts[j]!
        if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) odd = !odd
      }
      return odd
    }
    const real = SLABS[0]!.outline
    expect(SLABS[0]!.id).toBe('middle')
    const r = ARENA.inside
    for (let u = 0; u <= 1; u += 0.05) for (const [x, y] of [[r.x0 + (r.x1 - r.x0) * u, r.y0], [r.x0 + (r.x1 - r.x0) * u, r.y1], [r.x0, r.y0 + (r.y1 - r.y0) * u], [r.x1, r.y0 + (r.y1 - r.y0) * u]] as [number, number][]) {
      expect(within(MIDDLE, x, y)).toBe(true)
      expect(within(real, x, y)).toBe(true)
    }
    // The fight's own rectangle for the boss's centre is wider: its middle is on the slab, its corners are not.
    expect(within(real, (ARENA.safe.x0 + ARENA.safe.x1) / 2, (ARENA.safe.y0 + ARENA.safe.y1) / 2)).toBe(true)
    expect(within(real, ARENA.safe.x0, ARENA.safe.y0)).toBe(false)
  })

  it('breaks what lies within half the width of the line, from the time of the blast on', () => {
    const p = PILLARS[4]!
    const k = blast(1, 12, 1235, p.y + 90, 1920, p.y + 90)
    // 90 px from the centre: the near face is 62 px away, inside 65.
    expect(breaksBox(k, pillarBox(p))).toBe(true)
    expect(breaksBox(blast(1, 12, 1235, p.y + 96, 1920, p.y + 96), pillarBox(p))).toBe(false)
    expect(solids(view(11.99, [k])).standing.map((x) => x.id)).toContain(p.id)
    expect(solids(view(12, [k])).standing.map((x) => x.id)).not.toContain(p.id)
    expect(solids(view(500, [k])).standing.map((x) => x.id)).not.toContain(p.id)
    // A line that starts beyond a thing does not break it.
    expect(breaksBox(blast(2, 12, p.x + 200, p.y, 1920, p.y), pillarBox(p))).toBe(false)
  })

  it('breaks a pane a line crosses and leaves the far side whole', () => {
    const k = blast(3, 20, 1235, 550, 1920, 550)
    const s = solids(view(21, [k])).standing.map((x) => x.id)
    expect(s).not.toContain(PANES[1]!.id)
    expect(s).toContain(PANES[0]!.id)
    PILLARS.slice(0, 4).forEach((p) => expect(s).toContain(p.id))
  })

  it('names the first blast in time as the one that broke a thing', () => {
    const s = STANDS[8 + 1]!
    const a = blast(7, 30, 1235, 550, 1920, 550), b = blast(4, 22, 1235, 600, 1920, 640)
    expect(brokenBy([a, b], 40, s)).toBe(b)
    expect(brokenBy([a, b], 25, s)).toBe(b)
    expect(brokenBy([a, b], 21, s)).toBe(null)
    expect(standing(view(40, [a, b])).some((x) => x.id === s.id)).toBe(false)
  })

  it('is the same for the same view, and does not hand out its own boxes', () => {
    const k = blast(1, 12, 1235, 550, 1920, 550)
    const one = solids(view(15, [k])), two = solids(view(15, [k]))
    expect(one).toEqual(two)
    one.standing[0]!.box.x0 = -999
    one.slab[0]!.x = -999
    expect(solids(view(15, [k]))).toEqual(two)
  })
})
