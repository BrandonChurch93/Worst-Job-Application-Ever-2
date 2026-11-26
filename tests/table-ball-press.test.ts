import { describe, expect, test } from 'vitest'
import { PRESS, hitOf, pressAt } from '../src/table/real/ball'
import { table } from '../src/table/layout'
import { config } from '../src/config'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const B = config.table.ballPx
const R = B / 2
const cup = table.bumpers[0]!
const floor = -192
const ctxOf = (list: Shape[]): RealContext => ({ page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 2, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined })
const bumper = (since?: number): Shape => ({ id: `bumper.${cup.id}`, part: 'bumpers', kind: 'disc', x: 0, y: 0, w: 1, h: 1, z0: floor, z1: floor + 80, tone: 'light', ...(since === undefined ? {} : { v: [since] }) })
const steel = (x: number, y: number): Shape => ({ id: 'ball.steel.1', part: 'steel', kind: 'ball', x: x - R, y: y - R, w: B, h: B, z0: floor, z1: floor + B, tone: 'metal' })
const from = (ballsAway: number): [number, number] => [cup.c[0] * B - (cup.r + ballsAway) * B, cup.c[1] * B]

describe('the clear ball pressed where it strikes', () => {
  test('far from everything it is round', () => {
    const [x, y] = from(3)
    expect(pressAt(x, y, R, floor, ctxOf([bumper()])).amount).toBe(0)
    expect(pressAt(x, y, R, floor, ctxOf([])).amount).toBe(0)
  })

  test('standing in a bumper it is pressed toward it by three times the overlap, and never past the most', () => {
    const [x, y] = from(0.48)
    const p = pressAt(x, y, R, floor, ctxOf([bumper()]))
    expect(p.amount).toBeCloseTo(0.12, 5)
    expect(p.x).toBeCloseTo(1, 5)
    expect(p.y).toBeCloseTo(0, 5)
    const [dx, dy] = from(0.45)
    expect(pressAt(dx, dy, R, floor, ctxOf([bumper()])).amount).toBeCloseTo(PRESS.stood, 5)
    const [ex, ey] = from(0.1)
    expect(pressAt(ex, ey, R, floor, ctxOf([bumper()])).amount).toBe(PRESS.stood)
  })

  test('a bumper that has just fired does not press it by itself: the page tells of the hit', () => {
    const [x, y] = from(0.55)
    expect(pressAt(x, y, R, floor, ctxOf([bumper(0)])).amount).toBe(0)
    expect(pressAt(x, y, R, floor, ctxOf([bumper(0.04)])).amount).toBe(0)
  })

  test('a bumper on another floor does not press it', () => {
    const [x, y] = from(0.45)
    expect(pressAt(x, y, R, floor + 400, ctxOf([bumper(0)])).amount).toBe(0)
  })

  test('a steel ball it stands in presses it away from that ball', () => {
    const p = pressAt(500, 500, R, floor, ctxOf([steel(500, 500 + 0.9 * B)]))
    expect(p.amount).toBe(PRESS.stood)
    expect(p.x).toBeCloseTo(0, 5)
    expect(p.y).toBeCloseTo(1, 5)
    expect(pressAt(500, 500, R, floor, ctxOf([steel(500, 500 + 1.2 * B)])).amount).toBe(0)
  })
})

describe('the clear ball squashed by the hit the page tells of', () => {
  const ball = (v?: number[]): Shape => ({ id: 'ball.clear', part: 'clear-ball', kind: 'ball', x: 0, y: 0, w: B, h: B, z0: floor, z1: floor + B, tone: 'glass', ...(v ? { v } : {}) })

  test('with nothing given, or the first three numbers alone, it is round', () => {
    expect(hitOf(ball()).amount).toBe(0)
    expect(hitOf(ball([1, 9, 0])).amount).toBe(0)
  })

  test('a full hit squashes it by the most at once, toward the thing struck, and dies in a few frames', () => {
    const at = (since: number): number => hitOf(ball([1, 9, 0, 1, 0, since])).amount
    expect(at(0)).toBeCloseTo(PRESS.hit, 5)
    expect(at(1 / 30)).toBeGreaterThan(0.12)
    expect(at(2 / 30)).toBeGreaterThan(0.06)
    expect(at(2 / 30)).toBeLessThan(at(1 / 30))
    expect(at(0.3)).toBe(0)
    const down = hitOf(ball([1, 9, 0, 1, Math.PI / 2, 0]))
    expect(down.x).toBeCloseTo(0, 5)
    expect(down.y).toBeCloseTo(1, 5)
    const right = hitOf(ball([1, 9, 0, 1, 0, 0]))
    expect(right.x).toBeCloseTo(1, 5)
    expect(right.y).toBeCloseTo(0, 5)
  })

  test('a weak hit squashes it less, and the strength is held inside 0 to 1', () => {
    expect(hitOf(ball([1, 9, 0, 0.5, 0, 0])).amount).toBeCloseTo(PRESS.hit / 2, 5)
    expect(hitOf(ball([1, 9, 0, 7, 0, 0])).amount).toBe(PRESS.most)
    expect(hitOf(ball([1, 9, 0, -1, 0, 0])).amount).toBe(0)
  })
})
