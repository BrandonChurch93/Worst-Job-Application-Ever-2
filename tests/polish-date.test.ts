import { describe, expect, it } from 'vitest'
import { HOUSED } from '../src/pages/step2'
import { config } from '../src/config'
import { TRAY_H } from '../src/pages/step2/layout'
import { bare, DRAWN, heights, openings, still, visit, visitor, type Row } from './polish-date-run'

// A tray counts as open once it is taller than this share of its full height: under it the tray is the 4 px slit it starts as.
const SLIVER = 0.02
// The opening as it was before the machines were housed (MEASURED on b3e4f902): steps of the stage from the row's first step to its tray at full height, to the machine at full height and to the row taking the visitor's hand.
const OPENING = { full: 53, whole: 97, ready: 99 }
// The whole visit of the page by each visitor, in steps (MEASURED on b3e4f902).
const VISIT = { down: 3302, up: 3301, itself: 35869, film: 48000 }
// The most a part of a machine may change its height in one step while its tray opens or shuts, as a share of its full height. The steepest step MEASURED is 0.0302, so the first risen step is a small step on from the housed one and no step is a pop.
const STEP_MOST = 0.04

const full = heights()
const visits: [string, Row[], number][] = [
  ['rows 1, 2, 3', visit(visitor([0, 1, 2]), full), VISIT.down],
  ['rows 3, 2, 1', visit(visitor([2, 1, 0]), full), VISIT.up],
  ['rows that open themselves', visit(still(), full), VISIT.itself],
  ['the film', visit('film', full), VISIT.film]
]

describe('polish date: a row of step 2 is never shown open and empty', () => {
  for (const [name, rows] of visits) {
    it(`${name}: on every step a tray is open, every standing part of its machine is drawn`, () => {
      expect(openings(rows, SLIVER).map((o) => o.row).sort()).toEqual([0, 1, 2])
      expect(bare(rows, SLIVER)).toEqual({})
      const open = rows.filter((r) => r.open >= 0 && r.tall > SLIVER * TRAY_H)
      expect(open.length).toBeGreaterThan(300)
      for (const r of open) expect(r.least, `step ${r.step}, row ${r.open + 1}, ${r.phase}`).toBeGreaterThan(DRAWN)
    })

    it(`${name}: the reels show their legends on every step the tray of the date is seen and the reels do not spin`, () => {
      const slot = rows.filter((r) => r.open === 1 && (r.phase === 'opening' || r.phase === 'closing'))
      expect(slot.length).toBeGreaterThan(150)
      for (const r of slot) expect(r.legends, `step ${r.step}, ${r.phase}`).toBe(3)
    })

    it(`${name}: a machine lies under the floor of the fields, which pass over it, until its rise starts and again once it has sunk`, () => {
      const under = rows.filter((r) => r.open >= 0 && r.lift === 0)
      expect(under.length).toBeGreaterThan(150)
      for (const r of under) expect(r.top, `step ${r.step}, row ${r.open + 1}, ${r.phase}, tray ${r.tall} px`).toBeLessThan(config.scale.heights.field)
    })

    it(`${name}: no machine pops as its tray opens or shuts, its height changes by a small share from one step to the next`, () => {
      let most = 0
      for (let n = 1; n < rows.length; n++) {
        const a = rows[n - 1]!
        const b = rows[n]!
        if (a.open < 0 || b.open !== a.open || (b.phase !== 'opening' && b.phase !== 'closing')) continue
        most = Math.max(most, Math.abs(b.least - a.least), Math.abs(b.most - a.most))
      }
      expect(most).toBeGreaterThan(0.01)
      expect(most).toBeLessThan(STEP_MOST)
    })
  }

  it('houses the slot and the crank at a share of their height that their makers draw', () => {
    expect(HOUSED).toBeGreaterThan(DRAWN)
    for (const [name, rows] of visits) {
      for (const o of openings(rows, SLIVER)) {
        const first = rows.find((r) => r.step === o.from)!
        expect(first.least, `${name}, row ${o.row + 1}`).toBeCloseTo(o.row === 0 ? 0.04 : HOUSED, 6)
      }
    }
  })
})

describe('polish date: the opening and the visit are as long as they were', () => {
  for (const [name, rows, steps] of visits) {
    it(`${name}: each row opens, stands whole and takes the hand on the same steps as before`, () => {
      const seen = openings(rows, SLIVER)
      expect(seen.length).toBe(3)
      for (const o of seen) {
        expect(o.full - o.from, `row ${o.row + 1} full`).toBe(OPENING.full)
        expect(o.whole - o.from, `row ${o.row + 1} whole`).toBe(OPENING.whole)
        expect(o.ready - o.from, `row ${o.row + 1} ready`).toBe(OPENING.ready)
      }
      expect(rows.length).toBe(steps)
    })
  }
})
