import { afterAll, describe, expect, it } from 'vitest'
import type * as THREE from 'three'
import { barDrop } from '../src/arena/change'
import { ARENA } from '../src/arena/layout'
import { config, stepHz } from '../src/config'
import { BAR_GONE } from '../src/boss/tune'
import { barNow } from '../src/boss/viewof'
import { pages } from '../src/pages'
import { real } from '../src/pages/step4/real'
import type { RealContext } from '../src/real/types'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage, type FlowEntry } from '../src/stage/stage'
import type { Shape } from '../src/stage/types'

const film = (): Stage => {
  const stage = new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
  stage.frameAt(config.film.units.find((u) => u.id === 'boss')!.seconds - 1 / config.film.fps)
  return stage
}
const sw = BAR_GONE as { on: boolean }
const was = BAR_GONE.on
const set = (on: boolean): void => { sw.on = on }
afterAll(() => set(was))
const word = (list: Shape[]): boolean => list.some((s) => s.id === 'health-label')
const anchor = (list: Shape[]): Shape => list.find((s) => s.id === 'arena')!

describe('the health bar after the kill, behind its switch', () => {
  it('is off as it is shipped, and off the word and the bar stay to the end of the page', () => {
    expect(was).toBe(false)
    set(false)
    const stage = film()
    const gone = stage.events.find((e) => e.name === 'boss-gone')!.step / stepHz
    const turns = stage.events.find((e) => e.name === 'page-turn')!.step / stepHz
    for (const t of [gone - 0.1, gone + 0.1, gone + 0.5, gone + 3, turns - 0.01, turns + 0.3]) {
      expect(word(stage.frameAt(t).list), `at ${t.toFixed(3)} s`).toBe(true)
      expect(barNow(), `at ${t.toFixed(3)} s`).toBe(0)
    }
  })

  it('on, in the film: the word goes at boss-gone, the bar is on its way at once and gone within 0.5 s, and stays gone through the turn', () => {
    set(true)
    expect(BAR_GONE.seconds).toBeLessThanOrEqual(0.5)
    const stage = film()
    const gone = stage.events.find((e) => e.name === 'boss-gone')!.step / stepHz
    const turns = stage.events.find((e) => e.name === 'page-turn')!.step / stepHz
    expect(word(stage.frameAt(gone - 2 / stepHz).list)).toBe(true)
    expect(barNow()).toBe(0)
    let last = 0
    for (let t = gone + 2 / stepHz; t < gone + BAR_GONE.seconds; t += 1 / 60) {
      expect(word(stage.frameAt(t).list), `at ${t.toFixed(3)} s`).toBe(false)
      expect(barNow(), `at ${t.toFixed(3)} s`).toBeGreaterThan(last)
      last = barNow()
    }
    for (const t of [gone + BAR_GONE.seconds + 2 / stepHz, gone + 0.5, gone + 3, turns - 0.01, turns + 0.3]) {
      expect(word(stage.frameAt(t).list), `at ${t.toFixed(3)} s`).toBe(false)
      expect(barNow(), `at ${t.toFixed(3)} s`).toBe(1)
    }
  })

  it('on, in the film: the arena\'s bar is put where its own drop had it, run backwards, and taken out at the end; off it is not moved', () => {
    const part = real.parts['boss-arena']!
    const ctx = {} as RealContext
    for (const on of [true, false]) {
      set(on)
      const stage = film()
      const gone = stage.events.find((e) => e.name === 'boss-gone')!.step / stepHz
      const first = anchor(stage.frameAt(gone - 0.5).list)
      const o = part.make(first, ctx)
      part.pose!(o, first, ctx)
      const bar = o.getObjectByName('arena-bar') as THREE.Object3D
      expect(bar.visible).toBe(true)
      expect(bar.position.z).toBeCloseTo(0, 6)
      const half = anchor(stage.frameAt(gone + BAR_GONE.seconds / 2).list)
      part.pose!(o, half, ctx)
      const k = barNow()
      if (on) {
        expect(k).toBeGreaterThan(0.4)
        expect(k).toBeLessThan(0.6)
        expect(bar.visible).toBe(true)
        expect(bar.position.z).toBeCloseTo(barDrop(ARENA.barLands - k * (ARENA.barLands - ARENA.barAt)).lift, 6)
        expect(bar.position.z).toBeGreaterThan(100)
      } else {
        expect(k).toBe(0)
        expect(bar.position.z).toBeCloseTo(0, 6)
      }
      const end = anchor(stage.frameAt(gone + 0.5).list)
      part.pose!(o, end, ctx)
      expect(bar.visible).toBe(!on)
      part.drop?.(o)
    }
  })

  it('the words on the floor are drawn after the floor on their own count, with the word of the bar in the list or out of it', () => {
    for (const on of [false, true]) {
      set(on)
      const stage = film()
      const gone = stage.events.find((e) => e.name === 'boss-gone')!.step / stepHz
      const turns = stage.events.find((e) => e.name === 'page-turn')!.step / stepHz
      let seen = 0
      for (let t = gone + 0.5; t < turns; t += 0.25) {
        const list = stage.frameAt(t).list
        const said = list.findIndex((s) => s.id === 'defeated')
        if (said < 0) continue
        seen++
        expect(word(list), `at ${t.toFixed(3)} s`).toBe(!on)
        for (const id of ['arena', 'boss-look', 'finish-figure']) expect(said, `${id} at ${t.toFixed(3)} s`).toBeGreaterThan(list.findIndex((s) => s.id === id))
        expect(list.filter((s) => s.id === 'defeated')).toHaveLength(1)
      }
      expect(seen).toBeGreaterThan(8)
    }
  })

  it.each(['keen', 'clumsy'] as const)('on, on the live site with a %s visitor: the same, within 0.5 s of boss-gone', (kind) => {
    set(true)
    const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
    const stage = new Stage({ mode: 'live', flow, pages, driver: new BotDriver(kind, 7), seed: 7 })
    let gone = -1
    let full = -1
    while (stage.page.id === 'step4' && stage.time < 240) {
      stage.advance(1)
      if (stage.page.id !== 'step4') break
      if (gone < 0 && stage.events.some((e) => e.name === 'boss-gone')) gone = stage.time
      const list = stage.frameAt(stage.time).list
      if (gone < 0) {
        expect(barNow()).toBe(0)
        continue
      }
      if (stage.time > gone + 1 / stepHz) expect(word(list), `at ${stage.time.toFixed(3)} s`).toBe(false)
      if (full < 0 && barNow() >= 1) full = stage.time
      if (full >= 0) expect(barNow()).toBe(1)
    }
    expect(gone).toBeGreaterThan(0)
    expect(full - gone).toBeLessThanOrEqual(0.5)
    expect(full - gone).toBeCloseTo(BAR_GONE.seconds, 1)
  })
})
