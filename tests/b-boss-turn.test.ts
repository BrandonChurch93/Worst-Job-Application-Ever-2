import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { CLOSE, LAST } from '../src/boss/tune'
import { pages } from '../src/pages'
import { homePose } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (unit: string): Stage => new Stage({ mode: 'film', flow: filmFlow(unit), pages, driver: new ScriptDriver(), film: filmOptions(unit) })
const seconds = (unit: string): number => config.film.units.find((u) => u.id === unit)!.seconds
const frames = (unit: string): number => Math.round(seconds(unit) * config.film.fps)
const deg = (a: number): number => Math.round(((a * 180) / Math.PI) * 100) / 100

describe('the boss page leaves the film as every other page does', () => {
  const boss = film('boss')
  const n = frames('boss')
  const last = Array.from({ length: 8 }, (_, i) => boss.frameAt((n - 8 + i) / config.film.fps))
  const pressed = boss.events.find((e) => e.name === 'button-press')!.step / stepHz
  const turns = boss.events.find((e) => e.name === 'page-turn')!.step / stepHz

  it('turns its slab by the same angles on its last eight frames as step 1', () => {
    const step1 = film('step1')
    const m = frames('step1')
    const other = Array.from({ length: 8 }, (_, i) => step1.frameAt((m - 8 + i) / config.film.fps))
    expect(last.map((f) => deg(f.turn))).toEqual(other.map((f) => deg(f.turn)))
    expect(deg(last[7]!.turn)).toBeGreaterThan(80)
  })

  it('is seen whole, from where every page is seen, from the step its slab starts to turn', () => {
    const stage = film('boss')
    const home = homePose(0)
    for (let t = turns; t < seconds('boss') - 1 / stepHz; t += 1 / config.film.fps) {
      const v = stage.frameAt(t).view ?? home
      expect(v.eye, `at ${t.toFixed(3)} s`).toEqual(home.eye)
      expect(v.target, `at ${t.toFixed(3)} s`).toEqual(home.target)
    }
  })

  it('is still close when the fist lands and for the rest of the hold that the way back does not take', () => {
    const stage = film('boss')
    const home = homePose(0)
    const still = pressed + LAST.hold - CLOSE.back
    for (const t of [pressed - 0.5, pressed, still - 1 / stepHz]) {
      const v = stage.frameAt(t).view!
      expect(v.eye[2], `at ${t.toFixed(3)} s`).toBeCloseTo((home.eye[2] * CLOSE.w) / 1920, 6)
    }
    const mid = stage.frameAt(still + CLOSE.back / 2).view!
    expect(mid.eye[2]).toBeGreaterThan((home.eye[2] * CLOSE.w) / 1920)
    expect(mid.eye[2]).toBeLessThan(home.eye[2])
    expect(stage.frameAt(pressed + LAST.hold + 4 / stepHz).view).toBeNull()
  })

  it('takes no more of the film than it did: the press and the turn stand where they stood', () => {
    expect(turns).toBeCloseTo(seconds('boss') - 0.5, 6)
    expect(pressed + LAST.hold).toBeLessThanOrEqual(turns)
  })
})
