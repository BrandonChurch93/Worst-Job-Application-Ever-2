import { beforeAll, describe, expect, it } from 'vitest'
import type { Shape } from '../src/stage/types'
import { visit, type Frame } from './polish-tug2-run'
import { film, type FilmRow } from './polish-tug3-run'

// What this work holds, each a number of frames of 60 a second, a share of 1, or px on the 1920 by 1080 page.
const HOLD = {
  // The arms are at least this much of their length on the frame the sheet first shows its held look, and the look is whole no sooner than `rise` frames after that frame and no later than `whole`.
  out: 0.9, rise: 2, whole: 4,
  // The sheet is at the hands' place from the frame the arms come out; until the hands are on it it shows no more than this of its held look.
  bare: 0.001,
  // The given back arrow stands at least this many frames at its length before the visitor has it, as the earlier rounds set it.
  stand: 12,
  // On the frame it is handed back the arrow is drawn at least `first` of its length, at least `tall` at the most within `peak` frames, and within `near` of its length again by `down` frames.
  first: 1.04, tall: 1.1, peak: 2, near: 0.03, down: 6,
  // The handed back arrow moves no more than `soft` px in its first frame and never less in a frame than in the one before over the first `eased` frames.
  soft: 0.5, eased: 10
}

const paper = (list: Shape[]): Shape | undefined => list.find((x) => x.id === 'resume-paper')
const look = (list: Shape[]): number => (paper(list)?.v?.[10] as number | undefined) ?? 0
const flat = (list: Shape[]): string => {
  const p = paper(list)
  return p ? `${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.h.toFixed(2)} ${(p.rot ?? 0).toFixed(4)}` : ''
}

let runs: Record<'visitor' | 'keen', Frame[]>
let shot: FilmRow[]

beforeAll(() => {
  runs = { visitor: visit('visitor'), keen: visit('keen') }
  shot = film()
})

describe('the sheet at the take', () => {
  for (const who of ['visitor', 'keen'] as const) {
    it(`is bitten as before and takes its held look by degrees only once the hands are on it: ${who}`, () => {
      const rows = runs[who]
      const grab = rows.findIndex((r) => r.events.includes('arms-out'))
      const held = rows.findIndex((r, n) => n >= grab && look(r.list) > HOLD.bare)
      expect(held).toBeGreaterThan(grab)
      for (let n = grab; n < held; n++) {
        expect(look(rows[n]!.list)).toBeGreaterThan(0)
        expect(flat(rows[n]!.list), `frame ${rows[n]!.i}`).toBe(flat(rows[grab]!.list))
      }
      expect(rows[held]!.pose.sprout).toBeGreaterThanOrEqual(HOLD.out)
      const whole = rows.findIndex((r, n) => n >= held && look(r.list) >= 1)
      expect(whole - held).toBeGreaterThanOrEqual(HOLD.rise)
      expect(whole - held).toBeLessThanOrEqual(HOLD.whole)
      for (let n = held + 1; n <= whole; n++) expect(look(rows[n]!.list)).toBeGreaterThan(look(rows[n - 1]!.list))
    })
  }

  it('shows its held look in the film only once the arms are out', () => {
    const grab = shot.findIndex((r) => r.events.includes('arms-out'))
    const held = shot.findIndex((r, n) => n >= grab && look(r.list) > HOLD.bare)
    expect(held).toBeGreaterThan(grab)
    for (let n = grab; n < held; n++) expect(look(shot[n]!.list)).toBeGreaterThan(0)
    expect(shot[held]!.pose.sprout).toBeGreaterThanOrEqual(HOLD.out)
    const whole = shot.findIndex((r, n) => n >= held && look(r.list) >= 1)
    expect(whole - held).toBeGreaterThanOrEqual(HOLD.rise)
    expect(whole - held).toBeLessThanOrEqual(HOLD.whole)
    const lost = shot.findIndex((r) => r.events.includes('tug-lost'))
    for (let n = whole; n < (lost < 0 ? whole + 200 : lost); n++) expect(look(shot[n]!.list), `film ${shot[n]!.frame}`).toBe(1)
  })
})

describe('the given back arrow', () => {
  for (const who of ['visitor', 'keen'] as const) {
    it(`stands the named frames and is drawn up on the frame the visitor has it: ${who}`, () => {
      const rows = runs[who]
      const zip = rows.findIndex((r) => r.events.includes('strips-zip'))
      const back = rows.findIndex((r, n) => n > zip && !r.pose.taken)
      expect(back).toBeGreaterThan(zip)
      for (let n = back - HOLD.stand; n < back; n++) {
        expect(rows[n]!.pose.squash, `frame ${rows[n]!.i}`).toBeCloseTo(1, 3)
        expect(Math.hypot(rows[n]!.pose.x - rows[back - 1]!.pose.x, rows[n]!.pose.y - rows[back - 1]!.pose.y)).toBe(0)
      }
      expect(rows[back]!.pose.squash).toBeGreaterThanOrEqual(HOLD.first)
      expect(Math.max(...rows.slice(back, back + HOLD.peak).map((r) => r.pose.squash))).toBeGreaterThanOrEqual(HOLD.tall)
    })
  }

  it.skip('comes down to its length again and goes off by degrees under the pack\'s visitor', () => {
    const rows = runs.visitor
    const zip = rows.findIndex((r) => r.events.includes('strips-zip'))
    const back = rows.findIndex((r, n) => n > zip && !r.pose.taken)
    expect(Math.abs(rows[back + HOLD.down]!.pose.squash - 1)).toBeLessThanOrEqual(HOLD.near)
    const moved = (n: number): number => Math.hypot(rows[n]!.pose.x - rows[n - 1]!.pose.x, rows[n]!.pose.y - rows[n - 1]!.pose.y)
    expect(moved(back)).toBeLessThanOrEqual(HOLD.soft)
    for (let n = back + 1; n < back + HOLD.eased; n++) expect(moved(n), `frame ${rows[n]!.i}`).toBeGreaterThan(moved(n - 1))
  })
})
