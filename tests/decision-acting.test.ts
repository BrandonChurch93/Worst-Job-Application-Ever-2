import { expect, test } from 'vitest'
import { CUES, GIVE, HOPE, PACE, pointerAt, type Marks } from '../src/pages/step5/script'
import { AT, FILM } from '../src/pages/step5/timeline'

const marks: Marks = { start: { x: 400, y: 500 }, spot: { x: 700, y: 620 }, press: { x: 900, y: 800 } }
const moved = (a: number, b: number): number => {
  const p = pointerAt(marks, a)
  const q = pointerAt(marks, b)
  return Math.hypot(q.x - p.x, q.y - p.y)
}

test('the pacing of the wait goes out, holds, comes back further and holds again inside the wait', () => {
  expect(PACE.right[0]).toBeGreaterThanOrEqual(PACE.stand)
  expect(PACE.left[1]).toBeLessThan(AT.decide)
  expect(PACE.left[0] - PACE.right[1]).toBeGreaterThanOrEqual(0.35)
  expect(moved(PACE.right[1], PACE.left[0])).toBe(0)
  expect(pointerAt(marks, PACE.right[1]).x - marks.start.x).toBeCloseTo(PACE.far, 5)
  expect(pointerAt(marks, PACE.left[1]).x - marks.start.x).toBeCloseTo(PACE.back, 5)
  expect(moved(0, PACE.stand)).toBe(0)
})

test('the hope of the letter stands still while the sheet falls and the look up comes before the hit', () => {
  expect(moved(PACE.left[1], HOPE.walk[0])).toBe(0)
  expect(HOPE.walk[0] - PACE.left[1]).toBeGreaterThanOrEqual(0.4)
  expect(HOPE.look).toBeGreaterThan(HOPE.walk[1])
  expect(HOPE.look + 0.4).toBeLessThan(AT.decide + AT.slam[1])
  expect(moved(HOPE.walk[1], AT.decide + AT.slam[1])).toBe(0)
})

test('the beaten walk to the button is slow, ends in a hold of at least 0.4 s and then one press', () => {
  expect(GIVE.walk[0] - GIVE.look).toBeGreaterThanOrEqual(0.4)
  expect(GIVE.walk[1] - GIVE.walk[0]).toBeGreaterThanOrEqual(0.6)
  expect(FILM.press - GIVE.walk[1]).toBeGreaterThanOrEqual(0.4)
  expect(moved(GIVE.walk[1], FILM.press)).toBe(0)
  expect(pointerAt(marks, FILM.press - 0.01).down).toBe(false)
  expect(pointerAt(marks, FILM.press + 0.01).down).toBe(true)
  expect(pointerAt(marks, FILM.press + 0.3).down).toBe(false)
})

test('every cue of the acting sits inside the twelve seconds and in order', () => {
  for (let i = 0; i < CUES.length; i++) {
    expect(CUES[i]!.at).toBeGreaterThan(0)
    expect(CUES[i]!.at).toBeLessThan(10)
    if (i > 0) expect(CUES[i]!.at).toBeGreaterThan(CUES[i - 1]!.at + 0.3)
  }
})
