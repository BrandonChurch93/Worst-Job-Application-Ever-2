import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { samples } from '../src/core/sampler'
import { makeMaterials } from '../src/shell/materials'
import { loadFont } from '../src/shell/type'
import { makeSpike } from '../src/spike/spike'
import { ScriptDriver, Stage, type Driver, type PageRuntime, type Pointer } from '../src/stage/stage'

const make = (): { page: PageRuntime; stage: Stage } => {
  const page = makeSpike('step1', makeMaterials(config.seed))
  return { page, stage: new Stage(page, new ScriptDriver(page)) }
}

beforeAll(async () => {
  globalThis.fetch = (async (url: string) => {
    const file = path.join('public', String(url))
    return { ok: fs.existsSync(file), status: 200, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) }
  }) as unknown as typeof fetch
  await Promise.all(['inter-400', 'inter-500', 'inter-600', 'inter-display-600'].map((f) => loadFont(f)))
})

describe('the stage', () => {
  const N = 2400

  it('reaches the same state at step N one step at a time or in groups', () => {
    const a = make()
    for (let i = 0; i < N; i++) a.stage.advance(1)
    const b = make()
    const groups = [7, 13, 240, 1, 4, 96, 500]
    let done = 0
    for (let i = 0; done < N; i++) {
      const g = Math.min(groups[i % groups.length]!, N - done)
      b.stage.advance(g)
      done += g
    }
    const c = make()
    c.stage.advance(N)
    expect(a.stage.step).toBe(N)
    expect(b.page.save()).toEqual(a.page.save())
    expect(c.page.save()).toEqual(a.page.save())
    expect(b.stage.events).toEqual(a.stage.events)
    expect(a.page.save().every((v) => Number.isFinite(v))).toBe(true)
  })

  it('moves: the state at step N is not the state at the start', () => {
    const a = make()
    const start = a.page.save()
    a.stage.advance(N)
    expect(a.page.save()).not.toEqual(start)
  })

  it('reports the same events at the same steps however the steps were grouped', () => {
    const a = make()
    a.stage.advance(N)
    expect(a.stage.events.length).toBeGreaterThan(0)
    expect(a.stage.events[0]!.name).toBe('button-press')
    const b = make()
    for (let i = 0; i < N / 4; i++) b.stage.advance(4)
    expect(b.stage.events.map((e) => [e.name, e.step])).toEqual(a.stage.events.map((e) => [e.name, e.step]))
  })

  it('seeks to a moment by replay, forward and back, and lands on the same state', () => {
    const a = make()
    a.stage.advance(N)
    const b = make()
    b.stage.seek((N - 1) / stepHz)
    expect(b.stage.step).toBe(N)
    expect(b.page.save()).toEqual(a.page.save())
    b.stage.seek(3 * (N - 1) / stepHz)
    b.stage.seek((N - 1) / stepHz)
    expect(b.stage.step).toBe(N)
    expect(b.page.save()).toEqual(a.page.save())
  })

  it('gives a film frame the same state whether or not the frames before it were rendered', () => {
    const fps = config.film.fps
    const open = config.film.shutterDegrees / 360 / fps
    const shutter = samples(config.tiers.review.samplesPerFrame).map((s) => s.shutter)
    const last = 90
    const a = make()
    for (let f = 0; f <= last; f++) for (const s of shutter) a.stage.seek(f / fps + s * open)
    const b = make()
    for (const s of shutter) b.stage.seek(last / fps + s * open)
    expect(b.stage.step).toBe(a.stage.step)
    expect(b.page.save()).toEqual(a.page.save())
  })

  it('rests at the start: a seek to zero is the page before any step', () => {
    const a = make()
    const start = a.page.save()
    a.stage.advance(500)
    a.stage.seek(0)
    expect(a.stage.step).toBe(0)
    expect(a.page.save()).toEqual(start)
    expect(a.stage.events).toEqual([])
  })

  it('carries on from a saved state exactly', () => {
    const a = make()
    a.stage.advance(700)
    const saved = a.page.save()
    a.stage.advance(300)
    const end = a.page.save()
    const b = make()
    b.page.load(saved)
    b.stage.step = 700
    b.stage.advance(300)
    expect(b.page.save()).toEqual(end)
  })

  it('takes its input from the driver alone, step by step', () => {
    const page = makeSpike('step1', makeMaterials(config.seed))
    const seen: number[] = []
    const driver: Driver = {
      name: 'bot',
      input(step: number, time: number): Pointer {
        seen.push(step)
        expect(time).toBeCloseTo(step / stepHz, 12)
        return { x: 400, y: 300, down: false }
      }
    }
    const stage = new Stage(page, driver)
    stage.advance(5)
    stage.advance(3)
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })
})
