import { expect, test } from 'vitest'
import { ARRIVE, CUES, GIVE, HOPE, pointerAt, type Marks } from '../src/pages/step5/script'
import { AT, FILM } from '../src/pages/step5/timeline'

const marks: Marks = { hand: { x: 960, y: 540 }, wait: { x: 1400, y: 780 }, spot: { x: 700, y: 620 }, drop: { x: 1300, y: 700 }, press: { x: 900, y: 800 } }
const moved = (a: number, b: number): number => {
  const p = pointerAt(marks, a)
  const q = pointerAt(marks, b)
  return Math.hypot(q.x - p.x, q.y - p.y)
}

test('the cursor starts at the hand-off place, backs off the counter and holds its place for the rest of the wait', () => {
  expect(moved(0, ARRIVE.look)).toBe(0)
  expect(pointerAt(marks, 0)).toMatchObject(marks.hand)
  expect(pointerAt(marks, ARRIVE.there)).toMatchObject(marks.wait)
  expect(AT.decide - ARRIVE.there).toBeGreaterThanOrEqual(0.4)
  expect(moved(ARRIVE.there, AT.decide)).toBe(0)
})

test('the letter is taken standing: a held tilt, a held puff, the dusting, and only then the walk to the corner the block strikes', () => {
  expect(moved(ARRIVE.there, HOPE.walk[0])).toBe(0)
  expect(HOPE.tilt).toBeGreaterThanOrEqual(AT.decide + AT.drop[1])
  expect(HOPE.proud - HOPE.tilt).toBeGreaterThanOrEqual(0.4)
  expect(HOPE.proud).toBeCloseTo(AT.decide + AT.proud, 5)
  expect(HOPE.dust - HOPE.proud).toBeGreaterThanOrEqual(0.4)
  expect(HOPE.walk[0]).toBeGreaterThanOrEqual(HOPE.dust + 0.4)
  expect(HOPE.walk[1]).toBeLessThanOrEqual(AT.decide + AT.pull)
  expect(AT.slam[1] - AT.loom).toBeGreaterThanOrEqual(0.4)
  expect(moved(HOPE.walk[1], FILM.flat)).toBe(0)
  expect(pointerAt(marks, FILM.landed)).toMatchObject(marks.drop)
  expect(moved(FILM.landed, GIVE.walk[0])).toBe(0)
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
