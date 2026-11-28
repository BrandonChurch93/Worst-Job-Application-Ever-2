import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BROUGHT, filmFlow, filmOptions, ScriptDriver, Stage, STAYS_ON, wholeFilmFlow } from '../src/stage/stage'

const PER = Math.round(stepHz / 60)
interface At { i: number; page: string; turning: boolean; x: number; y: number; z: number; rides: boolean }

const run = (frames: number): At[] => {
  const s = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver() })
  const rows: At[] = []
  for (let i = 0; i < frames; i++) {
    const f = s.frameAt(((i + 1) * PER) / stepHz)
    rows.push({ i, page: s.page.unit, turning: s.turning, x: f.cursor.x, y: f.cursor.y - f.scroll, z: f.cursor.z, rides: f.cursor.rides === true })
  }
  return rows
}

describe("the film's arrow at a page turn", () => {
  const rows = run(50 * 60)
  const leaving = (unit: string): At[] => rows.filter((r) => r.page === unit && r.turning && r.i > 120)

  it('names the careers page as the one whose arrow stays where it pressed', () => {
    expect(STAYS_ON).toEqual(['marketing'])
  })

  it('on the careers page stays on its place and at its height through the whole leaving half, and rides the slab', () => {
    const out = leaving('marketing')
    expect(out.length).toBe(30)
    const before = rows[out[0]!.i - 1]!
    for (const r of out) {
      expect(Math.hypot(r.x - before.x, r.y - before.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(r.z - before.z)).toBeLessThanOrEqual(1)
      expect(r.rides).toBe(true)
    }
  })

  it('is brought from where it lay when the slab stood edge on to the hand over place over the first frames of the next page, never going back', () => {
    const out = leaving('marketing')
    const k = out[29]!.i + 1
    const far = (r: At): number => Math.hypot(r.x - 960, r.y - 540)
    expect(rows[k]!.page).toBe('step1')
    expect(Math.abs(rows[k]!.x - out[29]!.x)).toBeLessThanOrEqual(20)
    expect(Math.abs(rows[k]!.z - out[29]!.z)).toBeLessThanOrEqual(1)
    for (let j = 0; j < BROUGHT.frames; j++) {
      expect(rows[k + j]!.rides).toBe(false)
      expect(far(rows[k + j + 1]!)).toBeLessThan(far(rows[k + j]!))
      expect(rows[k + j + 1]!.z).toBeGreaterThan(rows[k + j]!.z)
    }
    for (let j = BROUGHT.frames; j < BROUGHT.frames + 6; j++) expect([rows[k + j]!.x, rows[k + j]!.y, rows[k + j]!.z]).toEqual([960, 540, 260])
  })

  it('does the same in the film, where each unit has a stage of its own', () => {
    const out = leaving('marketing')
    const k = out[29]!.i + 1
    const unit = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
    for (let j = 0; j < BROUGHT.frames + 2; j++) {
      const f = unit.frameAt((j * PER) / stepHz)
      expect(Math.abs(f.cursor.x - rows[k + j]!.x)).toBeLessThanOrEqual(1e-6)
      expect(Math.abs(f.cursor.y - f.scroll - rows[k + j]!.y)).toBeLessThanOrEqual(1e-6)
      expect(Math.abs(f.cursor.z - rows[k + j]!.z)).toBeLessThanOrEqual(1e-6)
    }
    const two = new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
    expect([two.frameAt(0).cursor.x, two.frameAt(0).cursor.z]).toEqual([960, 260])
  })

  it('on step 1 is lifted to the hand over place as before and does not ride', () => {
    const out = leaving('step1').filter((r) => r.i > rows.find((q) => q.page === 'step1' && !q.turning)!.i)
    expect(out.length).toBe(30)
    for (const r of out) expect(r.rides).toBe(false)
    expect(out[29]!.z).toBeGreaterThan(250)
    expect(Math.hypot(out[29]!.x - 960, out[29]!.y - 540)).toBeLessThanOrEqual(15)
  })
})
