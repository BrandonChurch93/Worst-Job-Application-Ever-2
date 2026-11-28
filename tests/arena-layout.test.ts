import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARENA, MIDDLE, PAGE, PANES, PILLARS, SEAMS, SLABS, inset, paneBox, pillarBox } from '../src/arena/layout'
import { barDrop, crackHalf, crackTime, KNOCKS, rise, riseLands, rnd, seamLight, seamOpen, shake } from '../src/arena/change'

const dir = join(__dirname, '..', 'src', 'arena')
const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))

describe('arena layout', () => {
  it('breaks the page into nine slabs along sixteen seams, with eight pillars, two panes and four corner guns', () => {
    expect(SLABS).toHaveLength(9)
    expect(SEAMS).toHaveLength(16)
    expect(PILLARS).toHaveLength(8)
    expect(PANES).toHaveLength(2)
    expect(ARENA.corners).toEqual([{ x: 89, y: 82 }, { x: 1831, y: 82 }, { x: 82, y: 987 }, { x: 1824, y: 981 }])
    expect(MIDDLE).toHaveLength(8)
  })

  it('covers the page with its slabs', () => {
    const area = (pts: { x: number; y: number }[]): number => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]!; return a + (p.x * q.y - q.x * p.y) }, 0)) / 2
    const sum = SLABS.reduce((a, s) => a + area(s.outline), 0)
    expect(sum / (PAGE.w * PAGE.h)).toBeGreaterThan(0.995)
    expect(sum / (PAGE.w * PAGE.h)).toBeLessThan(1.005)
    // Drawn in from its seams a slab is smaller, and still a slab.
    for (const s of SLABS) {
      const a = area(inset(s, ARENA.seamHalf))
      expect(a).toBeLessThan(area(s.outline))
      expect(a).toBeGreaterThan(area(s.outline) * 0.8)
    }
  })

  it('keeps every seam on the page and every standing thing off the seams, the bar and the socket', () => {
    for (const s of SEAMS) for (const p of s.points) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(PAGE.w)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(PAGE.h)
    }
    const boxes = [...PILLARS.map(pillarBox), ...PANES.map(paneBox)]
    for (const b of boxes) {
      expect(b.x0 > ARENA.bar.x1 || b.x1 < ARENA.bar.x0 || b.y0 > ARENA.bar.y1 || b.y1 < ARENA.bar.y0).toBe(true)
      expect(b.x1 < ARENA.safe.x0 || b.x0 > ARENA.safe.x1).toBe(true)
    }
    // The four pillars of a side stand two on each side of its pane.
    for (const [pane, mine] of [[PANES[0]!, PILLARS.slice(0, 4)], [PANES[1]!, PILLARS.slice(4)]] as const) {
      expect(mine.filter((p) => p.x < pane.x)).toHaveLength(2)
      expect(mine.filter((p) => p.x > pane.x)).toHaveLength(2)
    }
  })

  it('times the change inside 2.0 to 2.6 s, in order: crack, split, rise, bar', () => {
    expect(ARENA.changeSeconds).toBeGreaterThanOrEqual(2.0)
    expect(ARENA.changeSeconds).toBeLessThanOrEqual(2.6)
    expect(ARENA.crackTo).toBeLessThanOrEqual(ARENA.splitAt)
    expect(ARENA.clearAt).toBeLessThanOrEqual(ARENA.splitAt)
    expect(ARENA.splitAt).toBeLessThan(ARENA.riseAt)
    expect(ARENA.riseTo).toBeLessThanOrEqual(ARENA.changeSeconds)
    expect(ARENA.barLands).toBeLessThanOrEqual(ARENA.changeSeconds)
    for (let i = 0; i < 10; i++) expect(riseLands(i / 9)).toBeLessThanOrEqual(ARENA.riseTo + 1e-9)
  })

  it('moves every part of the change from nothing to done, and never back', () => {
    for (const s of SEAMS) s.points.forEach((_, i) => {
      const at = crackTime(s.id, i)
      expect(at).toBeGreaterThanOrEqual(ARENA.crackFrom)
      expect(at).toBeLessThanOrEqual(ARENA.crackTo + 1e-9)
    })
    let open = -1, light = -1, up = -1, half = -1
    for (let t = -0.7; t <= 3; t += 0.01) {
      const o = seamOpen(t, 0.3), l = seamLight(t), r = rise(t, 0.5), h = crackHalf(t, 0.3)
      // The seam may spring a hair past its width as it opens, never more.
      expect(o).toBeGreaterThanOrEqual(0)
      expect(o).toBeLessThanOrEqual(1.05)
      expect(r).toBeGreaterThanOrEqual(-1e-9)
      expect(h).toBeGreaterThanOrEqual(half - 1e-9)
      expect(l).toBeGreaterThanOrEqual(0)
      open = o; light = l; up = r; half = h
    }
    expect(seamOpen(-0.7, 0)).toBe(0)
    expect(crackHalf(-0.1, 0)).toBe(0)
    expect(rise(ARENA.riseAt, 0)).toBe(0)
    expect(open).toBeCloseTo(1)
    expect(up).toBeCloseTo(1)
    expect(light).toBeGreaterThan(0.5)
    expect(barDrop(ARENA.barAt - 0.01).shown).toBe(0)
    expect(barDrop(ARENA.changeSeconds).lift).toBeLessThan(1)
    expect(barDrop(ARENA.changeSeconds + 1).lift).toBeCloseTo(0)
    expect(barDrop(ARENA.changeSeconds).shown).toBe(1)
  })

  it('shakes by the numbers it gives the camera owner, still before the change and still again after', () => {
    expect(shake(-0.5)).toEqual({ x: 0, y: 0, roll: 0 })
    const far = shake(9)
    expect(Math.hypot(far.x, far.y)).toBeLessThan(0.05)
    let most = 0
    for (let t = 0; t < 3; t += 1 / 120) most = Math.max(most, Math.hypot(shake(t).x, shake(t).y))
    const top = Math.max(...KNOCKS.map((k) => k.px))
    expect(most).toBeGreaterThan(top * 0.5)
    expect(most).toBeLessThanOrEqual(top * 1.6)
    const hit = shake(20.05, [20])
    expect(Math.hypot(hit.x, hit.y)).toBeGreaterThan(3)
    expect(shake(20.05, [20])).toEqual(hit)
  })

  it('draws the same numbers from the same seed', () => {
    expect(rnd(20261124, 3, 4)).toBe(rnd(20261124, 3, 4))
    expect(rnd(20261124, 3, 4)).not.toBe(rnd(20261125, 3, 4))
    for (let i = 0; i < 50; i++) {
      expect(rnd(1, i, 2)).toBeGreaterThanOrEqual(0)
      expect(rnd(1, i, 2)).toBeLessThan(1)
    }
  })
})

describe('arena purity', () => {
  it('draws from the view and the seed alone: no Math.random and no wall clock in the module', () => {
    for (const f of files) {
      const text = readFileSync(join(dir, f), 'utf8')
      expect(text, f).not.toMatch(/Math\.random|Date\.now|new Date|performance\.now|setTimeout|setInterval|requestAnimationFrame/)
    }
  })

  it('keeps three.js out of the numbers', () => {
    for (const f of ['layout.ts', 'change.ts', 'solids.ts', 'breaks.ts']) {
      const text = readFileSync(join(dir, f), 'utf8')
      expect(text, f).not.toMatch(/from 'three'|from "three"|from '\.\/(ground|props|wreck|index)'/)
    }
  })

  it('writes no em dash and no exclamation point in a sentence', () => {
    for (const f of files) {
      const text = readFileSync(join(dir, f), 'utf8')
      expect(text, f).not.toMatch(/\u2014/)
      for (const line of text.split('\n')) if (line.trim().startsWith('//')) expect(line, f).not.toMatch(/!/)
    }
  })
})
