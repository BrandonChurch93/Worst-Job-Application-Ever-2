import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { makeLayout, markOf, STAMP } from '../src/pages/step5/layout'
import { liftAt } from '../src/pages/step5/real/letter'
import { fibreHeights, STOCK } from '../src/pages/step5/real/letterStock'
import { INK, inkCover } from '../src/pages/step5/real/stampInk'
import { HIT } from '../src/pages/step5/script'
import { AT } from '../src/pages/step5/timeline'
import { boxOf } from '../src/shell/layout'

describe('the textures of the decision page', () => {
  it('are made from the seed alone: the same seed gives the same picture', () => {
    expect(Array.from(fibreHeights(64, 11))).toEqual(Array.from(fibreHeights(64, 11)))
    expect(Array.from(fibreHeights(64, 11))).not.toEqual(Array.from(fibreHeights(64, 12)))
    expect(Array.from(inkCover(128, 32, 11))).toEqual(Array.from(inkCover(128, 32, 11)))
    expect(Array.from(inkCover(128, 32, 11))).not.toEqual(Array.from(inkCover(128, 32, 12)))
  })

  it('leave the ink uneven: full in places, thin in others, never a flat fill', () => {
    const a = inkCover(256, 64, INK.seed)
    let full = 0
    let thin = 0
    for (const v of a) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
      if (v > 0.85) full++
      if (v < 0.5) thin++
    }
    expect(full / a.length).toBeGreaterThan(0.25)
    expect(thin / a.length).toBeGreaterThan(0.04)
    expect(thin / a.length).toBeLessThan(0.45)
  })

  it('stay under eight megabytes with their smaller copies, at one texel a page pixel or more', () => {
    const mb = ((2 * STOCK.px * STOCK.px + INK.w * INK.h) * 4 * (4 / 3)) / (1024 * 1024)
    expect(mb).toBeLessThan(8)
    expect(STOCK.px / STOCK.tile).toBeGreaterThanOrEqual(1)
    const m = markOf()
    expect(INK.w / (m.w + INK.pad * 2)).toBeGreaterThanOrEqual(1)
    expect(INK.h / (m.h + INK.pad * 2)).toBeGreaterThanOrEqual(1)
  })
})

describe('the letter', () => {
  it('lies flat under every run of its print and under the mark, and lifts only at its corners', () => {
    const tree = makeLayout()
    const sheet = boxOf(tree, 'letter')
    for (const id of ['letter-title', 'letter-body', 'letter-closing', 'letter-mark']) {
      const b = boxOf(tree, id)
      for (const [x, y] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]] as [number, number][]) {
        expect(liftAt((x - sheet.x) / sheet.w, (y - sheet.y) / sheet.h, sheet.w, sheet.h), id).toBeLessThan(0.02)
      }
    }
    expect(liftAt(1, 1, sheet.w, sheet.h)).toBeGreaterThan(2)
    expect(liftAt(0.5, 0.5, sheet.w, sheet.h)).toBe(0)
  })
})

describe('the hit of the stamp', () => {
  it('draws back inside the swoop, and its dust and its rock are over before the block lifts', () => {
    expect(HIT.windSeconds).toBeLessThan(AT.swoop[1] - AT.swoop[0])
    expect(HIT.dustSeconds).toBeLessThanOrEqual(AT.lift[1] - AT.slam[1])
    expect(HIT.rock * Math.exp(-(AT.lift[0] - AT.slam[1]) / HIT.rockSeconds)).toBeLessThan(0.002)
    expect(STAMP.high + HIT.windRise + STAMP.gripTop).toBeLessThan(320)
  })
})
