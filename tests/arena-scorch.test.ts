import { describe, expect, it } from 'vitest'
import type { BossView } from '../src/boss/view'
import { PAGE } from '../src/arena/layout'
import { SCORCH, aimOf, beamOf, beamShadow, chipsOf, edgeAt, paintScorch, scorchFrom, scorchOf, scorchReach, shownAt } from '../src/arena/scorch'

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

  // How wide the black is across the line at `along` px from the start of the trench, and where its two edges lie.
  const blackAt = (along: number): { wide: number; lo: number; hi: number } => {
    let lo = 0, hi = 0, wide = 0
    for (let across = -300; across <= 300; across += 2) {
      const x = s.sx + s.ux * along - s.uy * across, y = s.sy + s.uy * along + s.ux * across
      if (edgeAt(s, x, y, SEED).px >= 0) continue
      if (wide === 0) lo = across
      hi = across
      wide += 2
    }
    return { wide, lo, hi }
  }
  // The mean soot on a ring of `r` px round the middle of the burn.
  const ring = (d: Uint8Array, r: number): number => {
    let sum = 0
    for (let k = 0; k < 48; k++) sum += texel(d, s.bx + r * Math.cos((k * Math.PI) / 24), s.by + r * Math.sin((k * Math.PI) / 24))[0]!
    return sum / 48
  }

  it('is a trench that starts narrow and widens into a round burn where the boss lay, and nothing behind the arrow', () => {
    const d = paint()
    // Black down the middle of the trench and at the boss.
    expect(texel(d, 700, 645)[0]).toBeGreaterThan(150)
    expect(texel(d, 960, 650)[0]).toBeGreaterThan(150)
    // Narrow at the hands, wider with every third of the way, and the burn wider than the trench.
    const mean = (from: number, to: number): number => {
      let sum = 0, n = 0
      for (let a = from; a <= to; a += 10) { sum += blackAt(a).wide; n++ }
      return sum / n
    }
    const first = mean(10, 100), second = mean(120, 210), third = mean(230, 320), burn = blackAt(s.at).wide
    expect(first).toBeGreaterThan(8)
    expect(first).toBeLessThan(60)
    expect(second).toBeGreaterThan(first + 12)
    expect(third).toBeGreaterThan(second + 6)
    expect(burn).toBeGreaterThan(third + 60)
    // The burn is round: about as long along the line as it is wide across it.
    let ahead = 0
    while (edgeAt(s, s.bx + s.ux * ahead, s.by + s.uy * ahead, SEED).px < 0) ahead += 2
    expect(ahead / (burn / 2)).toBeGreaterThan(0.7)
    expect(ahead / (burn / 2)).toBeLessThan(1.45)
    // No black beyond the burn, and clean ground where the soot of the blast has thinned out.
    expect(texel(d, 960 + ahead + 90, 652)[0]).toBeLessThan(128)
    expect(texel(d, 1600, 662)).toEqual([0, 0, 0, 0])
    // Behind the arrow and far to the side: clean ground.
    expect(texel(d, 380, 640)).toEqual([0, 0, 0, 0])
    expect(texel(d, 960, 200)).toEqual([0, 0, 0, 0])
    expect(texel(d, 300, 1000)).toEqual([0, 0, 0, 0])
  })

  it('has no straight edge, is darkest in the middle and fades through soot to the clean ground', () => {
    const d = paint()
    // Each edge of the trench, with its steady widening taken out, still strays by more than 4 px, and turns back on itself.
    for (const side of ['lo', 'hi'] as const) {
      const at: number[] = [], edge: number[] = []
      for (let a = 20; a <= 320; a += 6) { at.push(a); edge.push(blackAt(a)[side]) }
      const n = at.length, ma = at.reduce((p, c) => p + c, 0) / n, me = edge.reduce((p, c) => p + c, 0) / n
      const slope = at.reduce((p, c, i) => p + (c - ma) * (edge[i]! - me), 0) / at.reduce((p, c) => p + (c - ma) ** 2, 0)
      const off = edge.map((e, i) => e - me - slope * (at[i]! - ma))
      expect(Math.sqrt(off.reduce((p, c) => p + c * c, 0) / n)).toBeGreaterThan(4)
      let turns = 0
      for (let i = 2; i < n; i++) if ((edge[i]! - edge[i - 1]!) * (edge[i - 1]! - edge[i - 2]!) < 0) turns++
      expect(turns).toBeGreaterThan(5)
    }
    // Round the burn: black in the middle, less at the rim, soot outside it, next to nothing far out.
    const r0 = ring(d, 20), r1 = ring(d, SCORCH.burn * 0.9), r2 = ring(d, SCORCH.burn + 70), r3 = ring(d, SCORCH.burn + 190)
    expect(r0).toBeGreaterThan(200)
    expect(r1).toBeLessThan(r0)
    expect(r2).toBeLessThan(r1 - 30)
    expect(r2).toBeGreaterThan(8)
    expect(r2).toBeLessThan(128)
    expect(r3).toBeLessThan(r2 / 2)
    // Embers lie in it, and few: it scorches, it does not glow like a broken slab. Most of the burn's lie at its rim.
    let embers = 0, sooty = 0, rim = 0, heart = 0
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const at = (j * W + i) * 4
        if (d[at]! > 150) sooty++
        if (d[at + 2]! <= 100) continue
        embers++
        const far = Math.hypot((i + 0.5) * (PAGE.w / W) - s.bx, PAGE.h - (j + 0.5) * (PAGE.h / H) - s.by)
        if (far < SCORCH.burn * 0.55) heart++
        else if (far < SCORCH.burn * 1.25) rim++
      }
    }
    expect(embers).toBeGreaterThan(10)
    expect(embers).toBeLessThan(sooty * 0.12)
    expect(rim).toBeGreaterThan(heart * 2)
  })

  it('burns in from the arrow outward and from the middle to the rim', () => {
    const d = paint()
    const near = texel(d, 560, 642)[3]!, mid = texel(d, 800, 647)[3]!, far = texel(d, 1200, 655)[3]!
    expect(near).toBeGreaterThan(0)
    expect(near).toBeLessThan(mid + 30)
    expect(near).toBeLessThan(far)
    // The rim of the burn comes after its middle.
    expect(texel(d, 960, 650)[3]!).toBeLessThan(texel(d, 960, 650 - SCORCH.burn)[3]!)
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
      expect(c.size).toBeLessThan(17)
      expect(c.x).toBeGreaterThan(0)
      expect(c.x).toBeLessThan(PAGE.w)
      expect(c.size).toBeGreaterThan(2)
    }
  })

  it('gives the beam for as long as the blast stands, and the shadows fall away from it', () => {
    const finish = { ...LINE, power: 1, firedAt: 49 }
    expect(beamOf(view({ gone: 1 }))).toBeNull()
    expect(beamOf(view({ finish, time: 49, gone: 0 }))).toBeNull()
    const b = beamOf(view({ finish, time: 49.5, gone: 0.3 }))!
    expect(b.strength).toBe(1)
    expect(Math.hypot(b.x0 - LINE.x0, b.y0 - LINE.y0)).toBeCloseTo(SCORCH.ahead)
    expect(b.x1).toBeGreaterThan(PAGE.w)
    // It goes down over the last fifth of the blast.
    expect(beamOf(view({ finish, time: 51, gone: 0.9 }))!.strength).toBeLessThan(1)
    expect(beamOf(view({ finish, time: 51.1, gone: 1 }))).toBeNull()
    // A pillar above the beam throws its shadow up the page, one below it down the page, both far.
    const above = beamShadow(b, [{ x: 700, y: 400 }, { x: 760, y: 400 }], 210, false)!
    expect(above.y[2]!).toBeLessThan(400 - 600)
    expect(above.y[3]!).toBeLessThan(400 - 600)
    const below = beamShadow(b, [{ x: 700, y: 900 }, { x: 760, y: 900 }], 210, false)!
    expect(below.y[2]!).toBeGreaterThan(900 + 600)
    expect(above.dark).toBeGreaterThan(beamShadow(b, [{ x: 700, y: 400 }, { x: 760, y: 400 }], 240, true)!.dark)
    // A stump throws a short one; a thing the beam runs through throws none.
    expect(beamShadow(b, [{ x: 700, y: 400 }, { x: 760, y: 400 }], 60, false)!.y[2]!).toBeGreaterThan(above.y[2]!)
    expect(beamShadow(b, [{ x: 800, y: 500 }, { x: 800, y: 800 }], 240, true)).toBeNull()
    expect(beamShadow(b, [{ x: 800, y: 640 }, { x: 856, y: 640 }], 210, false)).toBeNull()
  })
})
