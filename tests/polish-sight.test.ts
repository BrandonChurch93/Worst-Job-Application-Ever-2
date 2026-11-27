import { createHash } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { homeDistance } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import { BALL, TIER_Y } from '../src/table/layout'
import { Machine, prepare } from '../src/table/physics'

// The live view against the ball in play, on two whole visits stepped without a browser: the site's own keen and clumsy hands, seed 1, a frame being four steps of the machine. The ball's shell on the screen is the sphere's two tangent lines from the view's eye (pipeline/phase5/polish-sight-measure.mjs).
// The three hashes are those of the starting commit cb8755c4 (pipeline/phase5/polish-sight-play.mjs, there and here): the view feeds no physics, and in the film nothing of it runs.
const PLAY: Record<string, string> = {
  keen: 'bd651929b4b0a085d595395098fef6d0daad6638a9da5b4923511e591e8a3643',
  clumsy: 'f7a46a3d54d5c6df567db6e55c736a130d2570a8662a5f535a1cae55bd3cadf0'
}
const FILM = '5c1cf655d206c97780c617a1a99553387684dbb9b3c03b09de636902e55542bf'
const REST = 3715.2
const HIGH = 3624
const BATS = 7
const EDGE = 8
// The follow under the lift is still closing on the tier for a while after the ball came to it: the px it may yet be short of its place.
const SETTLE = 2
const D = homeDistance()
const R = BALL / 2
const span = (c: number, d: number): [number, number] => {
  const a = Math.atan2(c, d)
  const w = Math.asin(Math.min(1, R / Math.hypot(c, d)))
  return [D * Math.tan(a - w), D * Math.tan(a + w)]
}
interface Row { scroll: number; lift: number | null; floor: boolean; tier: number; down: number; out: number }

describe('the live view of the pinball machine and the ball in play', () => {
  let mc: Machine | null = null
  let hash = createHash('sha256')
  const step = Machine.prototype.step
  const seen: Record<string, { rows: Row[]; play: string }> = {}
  beforeAll(async () => {
    await prepare()
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      const e = step.call(this, l, r)
      hash.update(JSON.stringify([this.balls.map((b) => [b.mode, b.rail, b.hold, b.x, b.y, b.z, b.vx, b.vy, b.tier]), e.map((x) => [x.name, x.ball, x.id, x.x, x.y])]))
      return e
    }
    for (const name of ['keen', 'clumsy'] as const) {
      mc = null
      hash = createHash('sha256')
      const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: new BotDriver(name, 1), seed: 1 })
      const rows: Row[] = []
      while (stage.entryIndex === 0 && stage.time < 110) {
        stage.advance(4)
        if (stage.entryIndex !== 0) break
        const s = (stage.page.save() as { s: { floor: number; sight?: number[] } }).s
        const scroll = stage.page.scroll()
        const b = mc ? (mc as Machine).balls[0]! : null
        const row: Row = { scroll, lift: s.sight ? s.sight[0]! : null, floor: false, tier: -1, down: 0, out: 0 }
        if (b && b.mode === 'plane' && !b.steel) {
          const d = s.floor + D - (b.z * BALL + R)
          const xs = span(b.x * BALL - 960, d)
          const ys = span(b.y * BALL - 540 - scroll, d)
          row.floor = true
          row.tier = b.tier
          row.down = b.y - TIER_Y[b.tier]!
          row.out = Math.max(EDGE - (960 + xs[0]), 960 + xs[1] - (1920 - EDGE), EDGE - (540 + ys[0]), 540 + ys[1] - (1080 - EDGE))
        }
        rows.push(row)
      }
      seen[name] = { rows, play: hash.digest('hex') }
    }
  }, 120000)
  afterAll(() => {
    Machine.prototype.step = step
  })

  it('keeps the clear ball on a tier\'s floor whole on the screen with 8 px beyond its shell on every frame', () => {
    for (const name of ['keen', 'clumsy']) {
      const on = seen[name]!.rows.filter((r) => r.floor)
      expect(on.length).toBeGreaterThan(1000)
      expect(on.filter((r) => r.tier === 2 && r.down < 1.2).length).toBeGreaterThan(5)
      expect(Math.max(...on.map((r) => r.out))).toBeLessThanOrEqual(0)
    }
  })

  it('stands between its two places on the street, and on its own place whenever the ball is at the bats\' line or below', () => {
    for (const name of ['keen', 'clumsy']) {
      const rows = seen[name]!.rows
      let came = false
      let low = 0
      let high = 0
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!
        if (!r.floor || r.tier !== 2) {
          came = false
          continue
        }
        expect(r.lift).not.toBeNull()
        expect(r.lift!).toBeGreaterThanOrEqual(0)
        expect(r.lift!).toBeLessThanOrEqual(REST - HIGH + 1e-9)
        expect(r.scroll).toBeLessThanOrEqual(REST + 1e-6)
        if (r.scroll >= HIGH - 1e-6) came = true
        if (came) expect(r.scroll).toBeGreaterThan(HIGH - SETTLE)
        if (r.lift! > 91) high++
        if (r.down >= BATS) {
          low++
          expect(r.lift).toBe(0)
          if (came && rows.slice(i - 60, i).every((x) => x.floor && x.tier === 2)) expect(REST - r.scroll).toBeLessThan(SETTLE)
        }
      }
      expect(low).toBeGreaterThan(100)
      expect(high).toBeGreaterThan(10)
    }
  })

  it('goes from one place to the other in one move that eases in and never steps back by more than 3 px', () => {
    for (const name of ['keen', 'clumsy']) {
      const rows = seen[name]!.rows
      let moves = 0
      for (let i = 1; i < rows.length; i++) {
        const a = rows[i - 1]!.lift
        const b = rows[i]!.lift
        if (a === null || b === null || a === b || !(a === 0 || a > 91.19)) continue
        const way = Math.sign(b - a)
        let j = i
        const steps: number[] = []
        while (j < rows.length && rows[j]!.lift !== null && rows[j]!.lift !== rows[j - 1]!.lift) {
          steps.push((rows[j]!.lift! - rows[j - 1]!.lift!) * way)
          expect((rows[j - 1]!.scroll - rows[j]!.scroll) * way).toBeGreaterThan(-3)
          j++
        }
        moves++
        expect(Math.min(...steps)).toBeGreaterThan(0)
        const top = Math.max(...steps)
        expect(top).toBeLessThanOrEqual(12 + 1e-6)
        if (rows[j - 1]!.lift === 0 || rows[j - 1]!.lift! > 91.19) {
          const full = steps.findIndex((v) => v >= top - 1e-6) + 1
          expect(full).toBeGreaterThanOrEqual(4)
          expect(full).toBeLessThanOrEqual(6)
          expect(steps[0]!).toBeLessThan(3.1)
        }
        i = j
      }
      expect(moves).toBeGreaterThan(1)
      expect(moves).toBeLessThan(12)
    }
  })

  it('leaves the ball\'s path and the machine\'s events as they are on the starting commit, step for step', () => {
    for (const name of ['keen', 'clumsy']) expect(seen[name]!.play).toBe(PLAY[name])
  })

  it('leaves the film\'s view as it is on the starting commit on every step of the machine\'s take', () => {
    const stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    const film = createHash('sha256')
    hash = createHash('sha256')
    const seconds = filmFlow('pinball')[0]!.closes!
    let lifted = 0
    while (stage.time < seconds) {
      stage.advance(1)
      const s = (stage.page.save() as { s: { scroll: number; floor: number; sight?: number[] } }).s
      if (s.sight !== undefined) lifted++
      film.update(JSON.stringify([s.scroll, s.floor, stage.page.scroll()]))
    }
    expect(lifted).toBe(0)
    expect(film.digest('hex')).toBe(FILM)
  }, 120000)
})
