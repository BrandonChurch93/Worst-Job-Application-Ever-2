import { describe, expect, test } from 'vitest'
import { PRESS, pressAt, strike, unstruck } from '../src/table/real/ball'
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
    expect(pressAt(dx, dy, R, floor, ctxOf([bumper()])).amount).toBeCloseTo(PRESS.most, 5)
    const [ex, ey] = from(0.1)
    expect(pressAt(ex, ey, R, floor, ctxOf([bumper()])).amount).toBe(PRESS.most)
  })

  test('a strike presses it for a moment and lets go', () => {
    const [x, y] = from(0.55)
    const at = (since: number): number => pressAt(x, y, R, floor, ctxOf([bumper(since)])).amount
    expect(at(0)).toBeCloseTo(PRESS.hit, 5)
    expect(at(0.04)).toBeLessThan(at(0))
    expect(at(0.04)).toBeGreaterThan(at(0.1))
    expect(at(0.1)).toBeGreaterThan(0)
    expect(at(1)).toBe(0)
  })

  test('a bumper on another floor does not press it', () => {
    const [x, y] = from(0.45)
    expect(pressAt(x, y, R, floor + 400, ctxOf([bumper(0)])).amount).toBe(0)
  })

  test('a steel ball it stands in presses it away from that ball', () => {
    const p = pressAt(500, 500, R, floor, ctxOf([steel(500, 500 + 0.9 * B)]))
    expect(p.amount).toBe(PRESS.most)
    expect(p.x).toBeCloseTo(0, 5)
    expect(p.y).toBeCloseTo(1, 5)
    expect(pressAt(500, 500, R, floor, ctxOf([steel(500, 500 + 1.2 * B)])).amount).toBe(0)
  })
})

describe('the clear ball knows a hit by the turn of its own speed', () => {
  const run = (path: (i: number) => [number, number], frames: number, dt = 1 / 30): { x: number; y: number; amount: number }[] => {
    const k = unstruck()
    const out = []
    for (let i = 0; i < frames; i++) out.push({ ...strike(k, ...path(i), i * dt) })
    return out
  }

  test('a straight roll and a wide bend of a rail press nothing', () => {
    expect(run((i) => [100 + i * 30, 500], 12).every((p) => p.amount === 0)).toBe(true)
    const bend = run((i) => [500 + 190 * Math.cos(i * 0.2), 500 + 190 * Math.sin(i * 0.2)], 20)
    expect(bend.every((p) => p.amount === 0)).toBe(true)
  })

  test('a bounce off a wall on its right squashes it toward that wall for a few frames', () => {
    const out = run((i) => [i <= 5 ? 100 + i * 30 : 250 - (i - 5) * 24, 500], 14)
    expect(out[5]!.amount).toBe(0)
    expect(out[6]!.amount).toBeCloseTo(PRESS.most, 5)
    expect(out[6]!.x).toBeCloseTo(1, 5)
    expect(out[6]!.y).toBeCloseTo(0, 5)
    expect(out[7]!.amount).toBeLessThan(out[6]!.amount)
    expect(out[8]!.amount).toBeGreaterThan(0.03)
    expect(out[13]!.amount).toBe(0)
  })

  test('a bat that throws it from rest squashes it toward the bat', () => {
    const out = run((i) => [500, i <= 4 ? 800 : 800 - (i - 4) * 40], 8)
    expect(out[5]!.amount).toBeGreaterThan(0.2)
    expect(out[5]!.y).toBeCloseTo(1, 5)
  })

  test('a jump of the page, a gap in time and the same frame twice are no hit', () => {
    expect(run((i) => [i < 5 ? 100 + i * 10 : 4000 + i * 10, 500], 10).every((p) => p.amount === 0)).toBe(true)
    const k = unstruck()
    strike(k, 100, 500, 0)
    strike(k, 130, 500, 1 / 30)
    expect(strike(k, 130, 500, 1 / 30).amount).toBe(0)
    expect(strike(k, 60, 500, 2).amount).toBe(0)
    expect(strike(k, 90, 500, 2 + 1 / 30).amount).toBe(0)
  })
})
