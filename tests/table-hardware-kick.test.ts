import { describe, expect, test } from 'vitest'
import { KICK, kickOf } from '../src/table/real/hardware/tier'

describe('the ejector of a seat', () => {
  test('rests while nothing has happened', () => {
    expect(kickOf(9, 9)).toBe(0)
  })

  test('gives way on the frame a ball lands and comes to rest again', () => {
    expect(kickOf(0, 9)).toBeCloseTo(-KICK.give, 5)
    expect(Math.abs(kickOf(0.59, 9))).toBeLessThan(0.02)
    expect(kickOf(0.7, 9)).toBe(0)
  })

  test('is already on its way on the frame the ball is sent out, reaches full stroke and goes home', () => {
    expect(kickOf(9, 0)).toBeGreaterThan(0.4)
    expect(kickOf(9, KICK.strike)).toBeCloseTo(1, 5)
    expect(kickOf(9, 0.2)).toBeLessThan(0.3)
    expect(kickOf(9, 0.2)).toBeGreaterThan(0)
    expect(kickOf(9, 1)).toBe(0)
  })
})
