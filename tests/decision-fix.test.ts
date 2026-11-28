import { expect, test } from 'vitest'
import { config } from '../src/config'
import { GIVE, HIT, STUCK } from '../src/pages/step5/script'
import { AT, FILM } from '../src/pages/step5/timeline'

const frame = 1 / 30
const key = config.keys.find((k) => k.id === 'decision')!
const beat = config.film.beats.find((b) => b.id === key.beat)!

test('the hit is one contact frame after a fall of three or four frames, and the rebound is seen in three', () => {
  const fall = (AT.slam[1] - AT.slam[0]) / frame
  expect(fall).toBeGreaterThanOrEqual(3 - 1e-6)
  expect(fall).toBeLessThanOrEqual(4 + 1e-6)
  expect(HIT.reboundSeconds).toBeGreaterThanOrEqual(3 * frame - 1e-6)
  expect(HIT.reboundAt + HIT.reboundSeconds).toBeLessThan(AT.lift[0] - AT.slam[1])
  expect(HIT.sheetSeconds).toBeGreaterThanOrEqual(3 * frame)
})

test('the block shakes at the top of the carry and the flat arrow leaves it in the shake', () => {
  expect(AT.shake[0]).toBeGreaterThanOrEqual(AT.carry[1] - 1e-6)
  expect(AT.shake[1]).toBeLessThanOrEqual(AT.lower[0] + 1e-6)
  expect(AT.fling[0]).toBeGreaterThan(AT.shake[0])
  expect(AT.fling[0]).toBeLessThan(AT.shake[1])
})

test('the flat arrow comes down over at least 14 frames, after the block is down, and lies still before the key', () => {
  const whole = AT.fling[1] - AT.fling[0]
  expect((whole * (STUCK.fall - STUCK.off)) / frame).toBeGreaterThanOrEqual(14)
  expect(AT.fling[0] + whole * STUCK.fall).toBeGreaterThan(AT.lower[1])
  expect(STUCK.swings).toBeGreaterThanOrEqual(2)
  expect(STUCK.swings).toBeLessThanOrEqual(3)
  const keyAt = beat.from + key.at * (beat.to - beat.from)
  expect(FILM.landed).toBeLessThan(keyAt)
  expect(FILM.landed + FILM.heal / 2).toBeGreaterThan(keyAt)
  expect(FILM.landed + FILM.heal).toBeLessThan(GIVE.walk[0])
})
