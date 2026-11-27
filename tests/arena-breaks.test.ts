import { describe, expect, it } from 'vitest'
import type { ViewBreak } from '../src/boss/view'
import { clearOf, holeAt, layOver, lineOf, paintBreak, paintLayer, paintWounds, reachOf, tagOf } from '../src/arena/breaks'
import { ARENA, PILLARS } from '../src/arena/layout'

const W = 480, H = 270, SEED = 20261124
const blast = (id: number, at: number, x0: number, y0: number, x1: number, y1: number): ViewBreak => ({ id, at, x0, y0, x1, y1, width: 130 })
const east = blast(1, 12, 1235, 560, 1920, 590)
const west = blast(2, 20, 685, 560, 0, 600)
const south = blast(3, 28, 800, 760, 420, 1080)
const paint = (list: ViewBreak[]): Uint8Array => { const d = new Uint8Array(W * H * 4); paintWounds(d, W, H, list, SEED); return d }
const count = (d: Uint8Array, ch: number, over: number): number => { let n = 0; for (let i = ch; i < d.length; i += 4) if (d[i]! > over) n++; return n }

describe('arena breaks', () => {
  it('paints the same wounds from the same blasts and seed', () => {
    expect(paint([east, west])).toEqual(paint([east, west]))
    expect(paint([east])).not.toEqual(paint([west]))
    const again: ViewBreak = { ...east, id: 99, at: 400 }
    expect(tagOf(east)).toBe(tagOf(again))
  })

  it('leaves soot, a cut, embers and a hole through the slab, all inside the reach of the line', () => {
    const d = paint([east])
    expect(count(d, 0, 60)).toBeGreaterThan(300)
    expect(count(d, 1, 60)).toBeGreaterThan(100)
    expect(count(d, 2, 60)).toBeGreaterThan(8)
    expect(count(d, 3, 140)).toBeGreaterThan(60)
    const r = reachOf(east, W, H)
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (i >= r.i0 && i <= r.i1 && j >= r.j0 && j <= r.j1) continue
      const at = (j * W + i) * 4
      expect(d[at]! + d[at + 1]! + d[at + 2]! + d[at + 3]!).toBe(0)
    }
    // Nothing is painted where the line has not been: the left half of the page is clean.
    for (let j = 0; j < H; j++) for (let i = 0; i < W / 2; i++) expect(d[(j * W + i) * 4]).toBe(0)
  })

  it('breaks the slab through at the far end of the line only, and never under a foot, a gun, the bar or the socket', () => {
    const l = lineOf(east, SEED)
    expect(l.long).toBeCloseTo(Math.hypot(685, 30))
    expect(l.hole).toBeLessThanOrEqual(l.long * 0.45)
    let holes = 0
    for (let x = 1235; x < 1920; x += 4) for (let y = 480; y < 680; y += 4) {
      if (!holeAt(l, x, y, SEED)) continue
      holes++
      expect(clearOf(x, y)).toBeGreaterThan(0)
    }
    expect(holes).toBeGreaterThan(100)
    for (const p of PILLARS) expect(clearOf(p.x, p.y)).toBe(0)
    for (const c of ARENA.corners) expect(clearOf(c.x, c.y)).toBe(0)
    expect(clearOf(ARENA.slot.x, ARENA.slot.y)).toBe(0)
    expect(clearOf((ARENA.bar.x0 + ARENA.bar.x1) / 2, (ARENA.bar.y0 + ARENA.bar.y1) / 2)).toBe(0)
    expect(clearOf(960, 540)).toBe(1)
    // The middle slab is cut and sooted, never broken through, by a line that starts at the boss.
    for (let x = ARENA.safe.x0; x <= ARENA.safe.x1; x += 8) for (let y = ARENA.safe.y0; y <= ARENA.safe.y1; y += 8) expect(holeAt(l, x, y, SEED)).toBe(false)
  })

  it('paints a blast a few rows at a time to the same picture as at once', () => {
    const whole = paint([east, west, south])
    const d = new Uint8Array(W * H * 4)
    for (const k of [east, west, south]) {
      const layer = new Uint8Array(W * H * 4).fill(77)
      const r = reachOf(k, W, H)
      for (let j = r.j0; j <= r.j1; j += 5) paintLayer(layer, W, H, k, SEED, j, Math.min(r.j1 + 1, j + 5))
      layOver(d, layer, W, H, k)
    }
    expect(d).toEqual(whole)
    const e = new Uint8Array(W * H * 4)
    for (const k of [east, west, south]) paintBreak(e, W, H, k, SEED)
    expect(e).toEqual(whole)
  })

  it('keeps an older hole and the deeper of two wounds where blasts cross, in whatever order they came', () => {
    const other = { ...east, id: 5, at: 40, y1: 520 }
    const a = paint([east]), both = paint([east, other])
    for (let i = 0; i < a.length; i += 4) {
      expect(both[i + 3]!).toBeGreaterThanOrEqual(a[i + 3]!)
      if (both[i + 3] === 0) expect(both[i]!).toBeGreaterThanOrEqual(a[i]!)
      else expect(both[i]! + both[i + 1]! + both[i + 2]!).toBe(0)
    }
    expect(paint([other, east])).toEqual(both)
  })
})
