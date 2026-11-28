import { describe, expect, it } from 'vitest'
import type { BossView } from '../src/boss/view'
import { PAGE } from '../src/arena/layout'
import { SCORCH, aimOf, chipsOf, edgeAt, paintScorch, scorchFrom, scorchOf, scorchReach, shownAt } from '../src/arena/scorch'

const W = 480, H = 270, SEED = 20261124
const LINE = { x0: 420, y0: 640, x1: 960, y1: 650 }
const s = scorchFrom(LINE)
const paint = (line = LINE): Uint8Array => {
  const d = new Uint8Array(W * H * 4)
  const sc = scorchFrom(line)
  const r = scorchReach(sc, W, H)
  paintScorch(d, W, H, sc, SEED, r.j0, r.j1 + 1)
  return d
}
const texel = (d: Uint8Array, x: number, y: number): number[] => {
  const i = Math.floor(x / (PAGE.w / W)), j = Math.floor((PAGE.h - y) / (PAGE.h / H))
  return [...d.subarray((j * W + i) * 4, (j * W + i) * 4 + 4)]
}
const view = (o: { time?: number; gone?: number; finish?: BossView['finish']; charge?: number; scorch?: unknown }): BossView => ({ time: o.time ?? 50, boss: { gone: o.gone }, arrow: { x: 300, y: 300, charge: o.charge }, finish: o.finish, scorch: o.scorch }) as unknown as BossView

describe('arena scorch', () => {
  it('starts in front of the arrow, runs through the fallen boss and leaves the page', () => {
    expect(Math.hypot(s.sx - LINE.x0, s.sy - LINE.y0)).toBeCloseTo(SCORCH.ahead)
    expect(s.ux).toBeGreaterThan(0.99)
    expect(s.ex).toBeGreaterThan(PAGE.w)
    expect(s.at).toBeCloseTo(Math.hypot(540, 10) - SCORCH.ahead)
    // A line that points up and left leaves by the top or the left.
    const up = scorchFrom({ x0: 1500, y0: 900, x1: 960, y1: 650 })
    expect(up.ex < 0 || up.ey < 0).toBe(true)
  })

  it('paints the same scorch from the same line and seed, and the same a few rows at a time', () => {
    const whole = paint()
    expect(paint()).toEqual(whole)
    const parts = new Uint8Array(W * H * 4)
    const r = scorchReach(s, W, H)
    for (let j = r.j0; j <= r.j1; j += 7) paintScorch(parts, W, H, s, SEED, j, Math.min(r.j1 + 1, j + 7))
    expect(parts).toEqual(whole)
    expect(paint({ ...LINE, y0: 300 })).not.toEqual(whole)
  })

  it('is a trench that widens into a round burn where the boss lay, and nothing behind the arrow', () => {
    const d = paint()
    // Black down the middle of the trench and at the boss.
    expect(texel(d, 700, 645)[0]).toBeGreaterThan(150)
    expect(texel(d, 960, 650)[0]).toBeGreaterThan(150)
    expect(texel(d, 1600, 662)[0]).toBeGreaterThan(150)
    // 120 px to the side: black beside the boss, no more than haze beside the trench.
    expect(texel(d, 960, 530)[0]).toBeGreaterThan(150)
    expect(edgeAt(s, 960, 530, SEED).px).toBeLessThan(0)
    expect(edgeAt(s, 640, 524, SEED).px).toBeGreaterThan(40)
    expect(edgeAt(s, 1700, 544, SEED).px).toBeGreaterThan(40)
    // Behind the arrow and far to the side: clean ground.
    expect(texel(d, 380, 640)).toEqual([0, 0, 0, 0])
    expect(texel(d, 960, 200)).toEqual([0, 0, 0, 0])
    expect(texel(d, 300, 1000)).toEqual([0, 0, 0, 0])
    // Embers lie in it, and few: it scorches, it does not glow like a broken slab.
    let embers = 0, sooty = 0
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 2]! > 100) embers++
      if (d[i]! > 150) sooty++
    }
    expect(embers).toBeGreaterThan(10)
    expect(embers).toBeLessThan(sooty * 0.12)
  })

  it('burns in from the arrow outward and from the middle to the rim', () => {
    const d = paint()
    const near = texel(d, 560, 642)[3]!, mid = texel(d, 1200, 655)[3]!, far = texel(d, 1800, 666)[3]!
    expect(near).toBeGreaterThan(0)
    expect(near).toBeLessThan(mid + 30)
    expect(mid).toBeLessThan(far + 30)
    expect(near).toBeLessThan(far)
    // The rim of the burn comes after its middle.
    expect(texel(d, 960, 650)[3]!).toBeLessThan(texel(d, 960, 505)[3]!)
    // Nothing shows before the blast, everything after it.
    for (let w = 0; w <= 1; w += 0.05) {
      expect(shownAt(w, 0)).toBe(0)
      expect(shownAt(w, 1)).toBe(1)
    }
    expect(shownAt(0.2, 0.3)).toBeGreaterThan(shownAt(0.6, 0.3))
  })

  it('reads the line and the share from the view', () => {
    const finish = { ...LINE, power: 1, firedAt: 49 }
    expect(scorchOf(view({}))).toBeNull()
    expect(scorchOf(view({ gone: 0 }))).toBeNull()
    expect(scorchOf(view({ finish, gone: 0.4 }))).toEqual({ line: LINE, share: 0.4 })
    // Without the share the blast's own clock is taken.
    expect(scorchOf(view({ finish, time: 49 + SCORCH.seconds / 2 }))!.share).toBeCloseTo(0.5)
    // After the blast: the line the view keeps, else the one last seen, else from the arrow as it stands.
    expect(scorchOf(view({ gone: 1, scorch: LINE }))).toEqual({ line: LINE, share: 1 })
    expect(scorchOf(view({ gone: 1 }), LINE)).toEqual({ line: LINE, share: 1 })
    expect(scorchOf(view({ gone: 1 }))!.line.x0).toBe(300)
    expect(aimOf(view({ charge: 0.3 }))).toEqual({ x0: 300, y0: 300, x1: 960, y1: 650 })
    expect(aimOf(view({}))).toBeNull()
    expect(aimOf(view({ charge: 1, finish }))).toBeNull()
  })

  it('throws its chips clear of the black, the seams, the feet and the socket, the same every run', () => {
    const chips = chipsOf(s, SEED)
    expect(chips.length).toBeGreaterThan(SCORCH.chips * 0.7)
    expect(chipsOf(s, SEED)).toEqual(chips)
    expect(chipsOf(s, SEED, 40)).toEqual(chips.slice(0, chipsOf(s, SEED, 40).length))
    for (const c of chips) {
      expect(edgeAt(s, c.x, c.y, SEED).px).toBeGreaterThanOrEqual(6)
      expect(c.x).toBeGreaterThan(0)
      expect(c.x).toBeLessThan(PAGE.w)
      expect(c.size).toBeGreaterThan(2)
      expect(c.size).toBeLessThan(14)
    }
  })
})
