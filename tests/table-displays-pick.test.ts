import { describe, expect, test } from 'vitest'
import copy from '../content/copy.json'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { pick } from '../src/table/real/displays/pick'
import { PACE, modeSeconds } from '../src/table/real/displays/screen'

const modes = (copy as unknown as { step3: { table: { modes: { insert: string; display: string }[] } } }).step3.table.modes

const shape = (id: string, words: string, more: Partial<Shape> = {}): Shape => ({ id, part: 'displays', kind: 'text', x: 0, y: 0, w: 10, h: 10, z0: 0, z1: 1, words, ...more }) as unknown as Shape
const ctx = (list: Shape[], time = 0): RealContext => ({ page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })
const score = (id: string, digits: string, v?: number[]): Shape => shape(id, 'runtime:score', { text: digits, v })
const mode = (tier: string, n: number, v?: number[]): Shape => shape(`display.${tier}.${n}`, `copy:step3.table.modes.${n}.display`, { v })

describe('what the four displays show', () => {
  test('nothing, with no shape of the part on the page', () => {
    expect(pick(ctx([])).kind).toBe('blank')
  })
  test('the score, as the page gives it, the marquee first', () => {
    const got = pick(ctx([score('display.street.score', '000100'), score('marquee-score', '042500')]))
    expect(got).toEqual({ kind: 'score', digits: '042500', since: 9, before: null })
  })
  test('the score before a change and the time since it, where the page gives them', () => {
    const got = pick(ctx([score('marquee-score', '042600', [0.02, 42500])]))
    expect(got).toEqual({ kind: 'score', digits: '042600', since: 0.02, before: '042500' })
  })
  test('the newest mode still running, with the name and the line of the copy', () => {
    const got = pick(ctx([score('marquee-score', '042500'), mode('corporate', 5, [6]), mode('office', 0, [1.2])]))
    expect(got).toEqual({ kind: 'mode', name: modes[0]!.insert, line: modes[0]!.display, t: 1.2 })
  })
  test('the score again once the line has run out', () => {
    const over = modeSeconds(modes[0]!.display) + 0.1
    expect(pick(ctx([score('marquee-score', '042500'), mode('office', 0, [over])])).kind).toBe('score')
    expect(pick(ctx([score('marquee-score', '042500'), mode('office', 0, [over - 0.3])])).kind).toBe('mode')
  })
  test('with no time on the mode, a round of the name, the line and the score on the frame\'s time', () => {
    const list = [score('marquee-score', '042500'), mode('office', 0)]
    const line = modeSeconds(modes[0]!.display)
    expect(pick(ctx(list, 0)).kind).toBe('mode')
    const mid = pick(ctx(list, PACE.hold + 1))
    expect(mid.kind === 'mode' ? mid.t : -1).toBeCloseTo(PACE.hold + 1, 6)
    expect(pick(ctx(list, line + 1)).kind).toBe('score')
  })
  test('the hint before all else, on its own seconds', () => {
    const hint = shape('display.hint', '', { kind: 'box', v: [0.7] })
    expect(pick(ctx([score('marquee-score', '042500'), mode('office', 0, [1]), hint]))).toEqual({ kind: 'hint', t: 0.7 })
  })
  test('a shape of another part is never read', () => {
    const other = { ...score('marquee-score', '999999'), part: 'table-frame' } as Shape
    expect(pick(ctx([other])).kind).toBe('blank')
  })
})

describe('a line that was cut', () => {
  const FRAME = 1 / 60
  const A = 0
  const B = 6
  const C = 8
  const whole = (n: number): number => modeSeconds(modes[n]!.display)
  const lit: [string, number, number][] = [['office', A, 0], ['corporate', B, 2], ['street', C, 2 + whole(B) + 1]]
  const at = (time: number, ballY?: number): Shape[] => {
    const list = [score('marquee-score', '042500'), score('display.corporate.score', '042500'), score('display.office.score', '042500'), score('display.street.score', '042500')]
    for (const [tier, n, from] of lit) if (time >= from) list.push(mode(tier, n, [time - from]))
    if (ballY !== undefined) list.push({ ...shape('ball.clear', ''), part: 'clear-ball', kind: 'ball', y: ballY } as unknown as Shape)
    return list
  }
  const runs: { what: string; t0: number; t1: number; from: number }[] = []
  const end = lit[2]![2] + whole(C) + whole(A) + 3
  for (let f = 0; f * FRAME < end; f++) {
    const got = pick(ctx(at(f * FRAME)))
    const what = got.kind === 'mode' ? got.line : got.kind
    const t = got.kind === 'mode' ? got.t : 0
    const last = runs[runs.length - 1]
    if (last && last.what === what && t >= last.t1) last.t1 = t
    else runs.push({ what, t0: t, t1: t, from: f * FRAME })
  }
  const line = (n: number): string => modes[n]!.display

  test('gives way to a mode on the frame it lights, and comes back when no newer mode is on', () => {
    expect(runs.map((r) => r.what)).toEqual([line(A), line(B), line(A), line(C), line(A), 'score'])
    for (const i of [0, 1, 3]) expect(runs[i]!.t0).toBeLessThan(FRAME + 1e-9)
    expect(runs[1]!.from).toBeCloseTo(2, 6)
    expect(runs[3]!.from).toBeCloseTo(lit[2]![2], 1)
  })
  test('is shown whole once, from the start of the line, however often it was cut', () => {
    const ended = (i: number, n: number): boolean => runs[i]!.t1 > whole(n) - 2 * FRAME
    expect(ended(0, A)).toBe(false)
    expect(ended(1, B)).toBe(true)
    expect(ended(2, A)).toBe(false)
    expect(runs[2]!.t1).toBeCloseTo(PACE.hold + 1, 1)
    expect(ended(3, C)).toBe(true)
    expect(ended(4, A)).toBe(true)
    for (const i of [2, 4]) {
      expect(runs[i]!.t0).toBeGreaterThanOrEqual(PACE.hold)
      expect(runs[i]!.t0).toBeLessThan(PACE.hold + FRAME + 1e-9)
    }
    expect(runs.filter((r, i) => r.what === line(A) && ended(i, A)).length).toBe(1)
  })
  test('lets the score back only when no line waits', () => {
    expect(runs.filter((r) => r.what === 'score').length).toBe(1)
    expect(runs[5]!.from).toBeCloseTo(lit[2]![2] + whole(C) + whole(A) - PACE.hold, 1)
  })
  test('is the same on all four displays at every step, wherever the ball is', () => {
    for (let f = 0; f * FRAME < end; f += 7) {
      const one = pick(ctx(at(f * FRAME)))
      for (const y of [200, 2400, 5200, 9000]) expect(pick(ctx(at(f * FRAME, y)))).toEqual(one)
    }
  })
})
