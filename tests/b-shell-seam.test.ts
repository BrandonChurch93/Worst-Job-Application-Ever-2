import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { homeDistance } from '../src/stage/camera'
import { BotDriver } from '../src/stage/bots'
import { BROUGHT, CLEAR, filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, STAYS_ON, wholeFilmFlow } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'

const PER = Math.round(stepHz / 60)
const WHOLE = Math.round(config.film.units.reduce((n, u) => n + u.seconds, 0) * 60)
interface At { i: number; index: number; page: string; turning: boolean; x: number; y: number; z: number; turn: number; rides: boolean; size: number; sx: number; sy: number }
interface Seam { from: string; to: string; last: At; first: At; jump: number; rise: number; step: number; steps: number[]; lifted: boolean; turning: At[] }

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
    const near = homeDistance() / (homeDistance() - f.cursor.z)
    rows.push({ i, index, page, turning: s.turning, x: f.cursor.x, y: 540 - (v * Math.cos(a) - f.cursor.z * Math.sin(a)), z: v * Math.sin(a) + f.cursor.z * Math.cos(a), turn: f.turn, rides: f.cursor.rides === true, size: f.cursor.scale * near, sx: 960 + (f.cursor.x - 960) * near, sy: 540 - v * near })
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
    const steps = [before, ...half].slice(1).map((r, j) => Math.hypot(r.sx - [before, ...half][j]!.sx, r.sy - [before, ...half][j]!.sy))
    const lifted = !STAYS_ON.includes(last.page)
    const edge = homeDistance() / (homeDistance() - (540 - last.y))
    const jump = STAYS_ON.includes(last.page) ? Math.hypot(first.x - (960 + (last.x - 960) * edge), 540 - first.y - Math.max(BROUGHT.clear, last.z * edge)) : Math.hypot(first.sx - last.sx, first.sy - last.sy)
    const arriving = rows.filter((r) => r.index === first.index && r.turning && r.i < first.i + 60 && r.turn !== 0)
    out.push({ from: last.page, to: first.page, last, first, jump, rise: Math.abs(first.z - last.z), step: Math.max(...steps), steps, lifted, turning: [before, ...half, ...arriving] })
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

  // A lifted arrow stands in the room while the slab turns under it. On every frame of a turn it stands higher than the slab's body under its figure, by the numbers of src/stage/stage.ts,
  // and across the seam it is drawn on the place of the frame before, and on every frame within 2 parts in 100 of the size of the frame before: standing nearer the eye never moves it or makes it larger.
  for (const s of all.filter((t) => t.lifted)) {
    it(`from ${s.from} to ${s.to} the lifted arrow stands clear of the slab on every frame of the turn, and is drawn as large as on the frame before`, () => {
      const frames = s.turning.slice(1)
      expect(frames.length).toBeGreaterThan(30)
      for (const r of frames) {
        expect(r.rides).toBe(false)
        const tilt = Math.abs(r.turn)
        const reach = r.turn < 0 ? CLEAR.under : CLEAR.over
        if (tilt >= CLEAR.from) expect(r.z, `frame ${r.i + 1}`).toBeGreaterThanOrEqual(Math.min(CLEAR.near, reach * Math.tan(tilt)) - 1e-6)
      }
      for (let j = 1; j < s.turning.length; j++) {
        const a = s.turning[j - 1]!
        const b = s.turning[j]!
        if (a.index !== b.index) expect(Math.hypot(b.sx - a.sx, b.sy - a.sy), `frame ${b.i + 1}`).toBeLessThanOrEqual(Math.max(s.step, 1))
        expect(Math.abs(b.size / a.size - 1), `frame ${b.i + 1}`).toBeLessThanOrEqual(0.02)
      }
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

class Seen implements Driver {
  readonly name = 'bot' as const
  at: Pointer | null = null
  constructor(private inner: BotDriver) {}
  input(view: DriverView): Pointer { return (this.at = this.inner.input(view)) }
}

describe('on the running site a hand back that a page turn finds under way', () => {
  for (const bot of ['keen', 'clumsy'] as const) {
    it(`runs on to the pointer through the leaving half and the arrow comes in where it is: the ${bot} visit, step 1 to step 2`, () => {
      const d = new Seen(new BotDriver(bot, config.seed))
      const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d, seed: config.seed })
      const rows: { page: string; turning: boolean; x: number; y: number; far: number }[] = []
      for (let i = 0; i < 60 * 400 && rows.filter((r) => r.page === 'step2').length < 6; i++) {
        const f = s.frameAt(((i + 1) * PER) / stepHz)
        const y = f.cursor.y - f.scroll
        rows.push({ page: s.page.unit, turning: s.turning, x: f.cursor.x, y, far: Math.hypot(f.cursor.x - d.at!.x, y - d.at!.y) })
      }
      const seam = rows.findIndex((r) => r.page === 'step2')
      let first = seam
      while (rows[first - 1]!.turning) first--
      const step = (k: number): number => Math.hypot(rows[k]!.x - rows[k - 1]!.x, rows[k]!.y - rows[k - 1]!.y)
      expect(seam).toBeGreaterThan(first)
      let largest = 0
      for (let k = first; k < seam; k++) largest = Math.max(largest, step(k))
      expect(step(seam), 'the jump across the seam').toBeLessThanOrEqual(Math.max(largest, 1))
      expect(rows[seam - 1]!.far, 'the arrow from the pointer on the last leaving frame').toBeLessThan(1)
      const before = step(first - 1)
      if (before > 1) for (let k = first; k < first + 5; k++) expect(step(k), `frame ${k + 1}`).toBeGreaterThanOrEqual(before * 0.5)
    })
  }
})
