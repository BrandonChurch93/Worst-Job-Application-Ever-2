import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { makePage } from '../src/pages/step3'
import { BALL, FLIP, FLIP_REACH, table } from '../src/table/layout'

describe('the colliders the page shows for a flipper', () => {
  const page = makePage()
  page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
  const all = page.colliders!()

  it('gives each flipper as the capsule the physics uses: two flanks that narrow, a ball at the pivot, a ball at the tip', () => {
    for (const f of table.flippers) {
      const flanks = all.find((c) => c.id === f.id)!
      const pivot = all.find((c) => c.id === `${f.id}.pivot`)!
      const tip = all.find((c) => c.id === `${f.id}.tip`)!
      expect(flanks.kind).toBe('flipper')
      expect(flanks.closed).toBe(true)
      expect(flanks.r).toBeUndefined()
      expect(flanks.points).toHaveLength(8)
      const p = flanks.points
      const wide = (i: number, j: number): number => Math.hypot(p[i]! - p[j]!, p[i + 1]! - p[j + 1]!) / BALL
      expect(wide(0, 6)).toBeCloseTo(2 * FLIP.radius, 5)
      expect(wide(2, 4)).toBeCloseTo(2 * FLIP.tip, 5)
      expect(pivot.r! / BALL).toBeCloseTo(FLIP.radius, 5)
      expect(tip.r! / BALL).toBeCloseTo(FLIP.tip, 5)
      expect(Math.hypot(tip.points[0]! - pivot.points[0]!, tip.points[1]! - pivot.points[1]!) / BALL).toBeCloseTo(FLIP_REACH, 5)
      expect(pivot.points[0]! / BALL).toBeCloseTo(f.pivot[0], 5)
      expect(pivot.points[1]! / BALL).toBeCloseTo(f.pivot[1], 5)
    }
  })

  it('names no flipper as one bar of one width', () => {
    for (const c of all.filter((x) => x.kind === 'flipper' && x.r !== undefined)) expect(c.points).toHaveLength(2)
  })
})
