import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { ScriptDriver, Stage, STAYS_ON, wholeFilmFlow } from '../src/stage/stage'

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
    const next = rows[out[29]!.i + 1]!
    expect(next.page).toBe('step1')
    expect(next.rides).toBe(false)
    expect([next.x, next.y]).toEqual([960, 540])
  })

  it('on step 1 is lifted to the hand over place as before and does not ride', () => {
    const out = leaving('step1').filter((r) => r.i > rows.find((q) => q.page === 'step1' && !q.turning)!.i)
    expect(out.length).toBe(30)
    for (const r of out) expect(r.rides).toBe(false)
    expect(out[29]!.z).toBeGreaterThan(250)
    expect(Math.hypot(out[29]!.x - 960, out[29]!.y - 540)).toBeLessThanOrEqual(15)
  })
})
