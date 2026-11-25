import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { samples } from '../src/core/sampler'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, TURN_HALF, wholeFilmFlow, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

const film = (unit = 'step1'): Stage => new Stage({ mode: 'film', flow: filmFlow(unit), pages, driver: new ScriptDriver(), film: filmOptions(unit) })
const state = (s: Stage) => JSON.stringify({ page: s.page.save(), cursor: s.cursor.save(), id: s.page.id })

describe('the stage', () => {
  const N = 2400

  it('reaches the same state at step N one step at a time or in groups', () => {
    const a = film()
    for (let i = 0; i < N; i++) a.advance(1)
    const b = film()
    const groups = [7, 13, 240, 1, 4, 96, 500]
    let done = 0
    for (let i = 0; done < N; i++) {
      const g = Math.min(groups[i % groups.length]!, N - done)
      b.advance(g)
      done += g
    }
    const c = film()
    c.advance(N)
    expect(a.step).toBe(N)
    expect(state(b)).toBe(state(a))
    expect(state(c)).toBe(state(a))
    expect(b.events).toEqual(a.events)
    expect(b.hash()).toBe(a.hash())
  })

  it('moves: the state at step N is not the state at the start', () => {
    const a = film()
    const start = state(a)
    a.advance(N)
    expect(state(a)).not.toBe(start)
  })

  it('reports the same events at the same steps however the steps were grouped', () => {
    const a = film()
    a.advance(N)
    expect(a.events.length).toBeGreaterThan(0)
    const b = film()
    for (let i = 0; i < N / 4; i++) b.advance(4)
    expect(b.events.map((e) => [e.name, e.step])).toEqual(a.events.map((e) => [e.name, e.step]))
  })

  it('seeks to a moment by replay, forward and back, and lands on the same state', () => {
    const a = film()
    a.advance(N)
    const b = film()
    b.seek(N / stepHz)
    expect(b.step).toBe(N)
    expect(state(b)).toBe(state(a))
    b.seek((3 * N) / stepHz)
    b.seek(N / stepHz)
    expect(b.step).toBe(N)
    expect(state(b)).toBe(state(a))
    expect(b.events).toEqual(a.events)
  })

  it('gives a film frame the same picture whether or not the frames before it were asked for', () => {
    const fps = config.film.fps
    const open = config.film.shutterDegrees / 360 / fps
    const shutter = samples(config.tiers.review.samplesPerFrame).map((s) => s.shutter)
    const last = 90
    const a = film()
    let seen = ''
    for (let f = 0; f <= last; f++) for (const s of shutter) seen = JSON.stringify(a.frameAt(f / fps + s * open))
    const b = film()
    let alone = ''
    for (const s of shutter) alone = JSON.stringify(b.frameAt(last / fps + s * open))
    expect(alone).toBe(seen)
  })

  it('rests at the start: a seek to zero is the page before any step', () => {
    const a = film()
    const start = state(a)
    a.advance(500)
    a.seek(0)
    expect(a.step).toBe(0)
    expect(state(a)).toBe(start)
    expect(a.events).toEqual([])
  })

  it('takes its input from the driver alone, step by step', () => {
    const seen: number[] = []
    const driver: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        seen.push(v.step)
        expect(v.time).toBeCloseTo(v.step / stepHz, 12)
        return { x: 400, y: 300, down: false }
      }
    }
    const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver })
    stage.advance(5)
    stage.advance(3)
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('turns the page at the same moment in a unit of the film and in the whole film', () => {
    for (const u of config.film.units.slice(0, -1)) {
      const s = film(u.id)
      s.advance(u.seconds * stepHz)
      const turn = s.events.find((e) => e.name === 'page-turn')
      expect(turn, u.id).toBeDefined()
      expect(turn!.step / stepHz).toBeCloseTo(u.seconds - TURN_HALF, 6)
    }
    const whole = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
    const total = config.film.units.reduce((sum, u) => sum + u.seconds, 0)
    whole.advance(total * stepHz)
    const turns = whole.events.filter((e) => e.name === 'page-turn').map((e) => e.step / stepHz)
    let at = 0
    const want: number[] = []
    for (const u of config.film.units.slice(0, -1)) {
      at += u.seconds
      want.push(at - TURN_HALF)
    }
    expect(turns.slice(0, want.length).map((t) => Number(t.toFixed(3)))).toEqual(want.map((t) => Number(t.toFixed(3))))
    expect(whole.pagesVisited.sort()).toEqual(Object.keys(pages).sort())
  })
})
