import { describe, expect, it } from 'vitest'
import { OUTLINE } from '../src/cursor/contract'
import { heightAt, ring } from '../src/cursor/model/shape'

describe('the arrow where the stem meets the wings', () => {
  it('has no dip in its face round either inward corner', () => {
    for (const corner of [OUTLINE[2]!, OUTLINE[5]!]) {
      for (const t of [1.1, 1.41]) {
        const near = ring(t).filter((p) => Math.hypot(p[0] - corner[0], p[1] - corner[1]) < 1.9)
        expect(near.length).toBeGreaterThan(8)
        const tall = near.map((p) => heightAt(p[0], p[1]))
        expect(Math.max(...tall) - Math.min(...tall)).toBeLessThan(0.03)
      }
    }
  })
})
