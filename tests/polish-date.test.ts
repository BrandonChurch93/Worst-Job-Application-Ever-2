import { describe, expect, it } from 'vitest'
import { pages } from '../src/pages'
import { CRANK_HOME, HOUSED } from '../src/pages/step2'
import { config, stepHz } from '../src/config'
import { ROWS, TRAY, TRAY_H } from '../src/pages/step2/layout'
import { BotDriver, type BotName } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'
import { bare, BODY, DRAWN, heights, openings, still, visit, visitor, type Row } from './polish-date-run'

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

const TURN = Math.PI * 2

// How often each bot shuts the crank's row on the page (MEASURED: two of them skip the page before they open it).
const SHUTS: Record<string, number> = { keen: 1, clumsy: 1, random: 0, skipper: 0 }

interface CrankSaved { open: number; phase: string; crank: { b: number; total: number; phase: string } }

// A visitor who opens the crank's row first, turns the crank by so much, lets go and waits for it to run away.
function stopper(turn: number): Driver {
  const inner = visitor([2, 1, 0])
  return {
    name: 'bot',
    input(v: DriverView): Pointer {
      const st = v.page.save() as CrankSaved
      if (st.open === 2 && st.crank.phase === 'rest' && st.crank.total >= turn) return { x: 300, y: 900, down: false }
      return inner.input(v)
    }
  }
}

// How far outside the tray's floor the worst corner of the named parts (the crank's arm and grip unless told) lies on the step the lift begins to lower, for every shutting of that row in one visit: 0 or less is inside.
function overhang(stage: Stage, seconds: number, row = 2, ids = ['crank-arm', 'crank-grip']): number[] {
  const out: number[] = []
  let was = ''
  for (let i = 0; i < seconds * stepHz && stage.page.id === 'step2'; i++) {
    stage.advance(1)
    if (stage.page.id !== 'step2') break
    const st = stage.page.save() as CrankSaved
    const now = st.open === row ? st.phase : ''
    if (now === 'closing' && was !== 'closing') {
      const list: Shape[] = []
      stage.page.draw(list)
      const tray = list.find((x) => x.id === `${ROWS[row]}-tray`)!
      let worst = -Infinity
      for (const id of ids) {
        const part = list.find((x) => x.id === id)!
        const rot = part.rot ?? 0
        for (const u of [-1, 1])
          for (const v of [-1, 1]) {
            const x = part.x + part.w / 2 + (u * part.w * Math.cos(rot)) / 2 - (v * part.h * Math.sin(rot)) / 2
            const y = part.y + part.h / 2 + (u * part.w * Math.sin(rot)) / 2 + (v * part.h * Math.cos(rot)) / 2
            worst = Math.max(worst, tray.x + TRAY.rim - x, x - (tray.x + tray.w - TRAY.rim), tray.y + TRAY.rim - y, y - (tray.y + TRAY_H - TRAY.rim))
          }
      }
      out.push(worst)
    }
    was = now
  }
  return out
}

describe('polish date: the crank lies inside its tray before it goes down into it', () => {
  it('keeps the arc of the crank round its resting angle, the last angle of the film in it', () => {
    expect(CRANK_HOME.from).toBeLessThan(-0.9025)
    expect(CRANK_HOME.to).toBeGreaterThan(-0.75)
    expect(CRANK_HOME.to).toBeLessThanOrEqual(-0.5)
  })
  for (const bot of config.live.bots) {
    it(`bot ${bot}: on the step the lift begins to lower, every corner of the arm and the grip is inside the tray's floor`, () => {
      const hang = overhang(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: new BotDriver(bot as BotName, config.seed), seed: config.seed }), 200)
      expect(hang.length).toBe(SHUTS[bot])
      for (const h of hang) expect(h).toBeLessThanOrEqual(0)
    })
  }
  for (let k = 0; k < 8; k++) {
    it(`a visitor who stops turning ${k} eighths of a turn past one turn: the same`, () => {
      const hang = overhang(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: stopper(TURN + (k * TURN) / 8), seed: config.seed }), 200)
      expect(hang.length).toBe(1)
      expect(hang[0]).toBeLessThanOrEqual(0)
    })
  }
  for (const [name, make] of [['rows 1, 2, 3', () => visitor([0, 1, 2])], ['rows 3, 2, 1', () => visitor([2, 1, 0])], ['bot keen', () => new BotDriver('keen', config.seed)], ['bot clumsy', () => new BotDriver('clumsy', config.seed)]] as const) {
    it(`${name}: the slot's cabinet, lever, mount and payout are inside their tray's floor on the step the lift begins to lower`, () => {
      const hang = overhang(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: make(), seed: config.seed }), 200, 1, BODY[1]!)
      expect(hang.length).toBe(1)
      expect(hang[0]).toBeLessThanOrEqual(0)
    })
  }
  it('the film: the same, its run untouched', () => {
    const hang = overhang(new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }), 200)
    expect(hang.length).toBe(1)
    expect(hang[0]).toBeLessThanOrEqual(0)
  })
})
