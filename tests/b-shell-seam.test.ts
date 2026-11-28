import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { homeDistance } from '../src/stage/camera'
import { BROUGHT, filmFlow, filmOptions, ScriptDriver, Stage, STAYS_ON, wholeFilmFlow } from '../src/stage/stage'

const PER = Math.round(stepHz / 60)
const WHOLE = Math.round(config.film.units.reduce((n, u) => n + u.seconds, 0) * 60)
interface At { i: number; index: number; page: string; turning: boolean; x: number; y: number; z: number }
interface Seam { from: string; to: string; last: At; first: At; jump: number; rise: number; step: number; steps: number[] }

const run = (): At[] => {
  const s = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver() })
  const rows: At[] = []
  let index = 0
  for (let i = 0; i < WHOLE; i++) {
    const f = s.frameAt(((i + 1) * PER) / stepHz)
    const a = f.cursor.rides === true && s.page.unit !== 'marketing' ? f.turn : 0
    const v = 540 - (f.cursor.y - f.scroll)
    const page = s.page.unit
    if (rows.length > 0 && rows[rows.length - 1]!.page !== page) index++
    rows.push({ i, index, page, turning: s.turning, x: f.cursor.x, y: 540 - (v * Math.cos(a) - f.cursor.z * Math.sin(a)), z: v * Math.sin(a) + f.cursor.z * Math.cos(a) })
  }
  return rows
}

const seams = (rows: At[]): Seam[] => {
  const out: Seam[] = []
  for (let k = 1; k < rows.length; k++) {
    const last = rows[k - 1]!
    const first = rows[k]!
    if (last.index === first.index) continue
    const half = rows.filter((r) => r.index === last.index && r.turning && r.i > last.i - 60)
    const before = rows[half[0]!.i - 1]!
    const steps = [before, ...half].slice(1).map((r, j) => Math.hypot(r.x - [before, ...half][j]!.x, r.y - [before, ...half][j]!.y))
    const edge = homeDistance() / (homeDistance() - (540 - last.y))
    const jump = STAYS_ON.includes(last.page) ? Math.hypot(first.x - (960 + (last.x - 960) * edge), 540 - first.y - Math.max(BROUGHT.clear, last.z * edge)) : Math.hypot(first.x - last.x, first.y - last.y)
    out.push({ from: last.page, to: first.page, last, first, jump, rise: Math.abs(first.z - last.z), step: Math.max(...steps), steps })
  }
  return out
}

describe("the film's arrow across every page turn", () => {
  const all = seams(run())
  it('finds a turn after every page of the film but the last', () => {
    expect(all.length).toBe(wholeFilmFlow().length - 1)
  })

  // A page whose arrow stays on it is held to the place where it lay on the screen when its slab stood edge on, within 1 px; a lifted arrow to the largest step of 1/60 s it took in its own leaving half.
  for (const s of all) {
    it(`from ${s.from} to ${s.to} moves no further across the seam than in the largest step of its leaving half`, () => {
      expect(s.jump).toBeLessThanOrEqual(STAYS_ON.includes(s.from) ? 1 : s.step)
    })
  }

  const LEAVE = 0.5
  const make = (id: string): Stage => new Stage({ mode: 'film', flow: filmFlow(id), pages, driver: new ScriptDriver(), film: filmOptions(id) })
  const cut = config.film.units.slice(0, -1).filter((u) => Math.floor(u.seconds) > u.seconds - LEAVE && Math.floor(u.seconds) < u.seconds - 0.2)

  it('has a unit whose leaving half holds a saved state of the stage', () => {
    expect(cut.length).toBeGreaterThan(0)
  })

  for (const u of cut) {
    it(`a piece of ${u.id} that starts from the state saved inside its leaving half draws the arrow where the whole unit does`, () => {
      const whole = make(u.id)
      const times = [0.2, 0.1, 1 / 60].map((back) => u.seconds - back)
      const want = times.map((t) => whole.frameAt(t).cursor)
      const piece = make(u.id)
      piece.restore(whole.checkpoint(Math.floor(u.seconds) * stepHz))
      expect(piece.checkpointSteps()).toEqual([0, Math.floor(u.seconds) * stepHz])
      expect(times.map((t) => piece.frameAt(t).cursor)).toEqual(want)
    })
  }
})
