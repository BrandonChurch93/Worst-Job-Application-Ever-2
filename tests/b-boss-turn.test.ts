import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { CLOSE, LAST } from '../src/boss/tune'
import { pages } from '../src/pages'
import { homePose } from '../src/stage/camera'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage, type FlowEntry } from '../src/stage/stage'

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

describe('the boss page leaves the live site as it leaves the film', () => {
  const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
  const home = homePose(0)
  const near = (home.eye[2] * CLOSE.w) / 1920

  it.each(['keen', 'clumsy'] as const)('a %s visitor: close at the blow, whole when its slab starts to turn, and no longer a wait than it was', (kind) => {
    for (const seed of [config.seed, 7, 1234]) {
      const stage = new Stage({ mode: 'live', flow, pages, driver: new BotDriver(kind, seed), seed })
      let pressed = -1
      let before = 0
      let turns = -1
      const eyes: number[] = []
      while (stage.page.id === 'step4' && stage.time < 240) {
        const was = stage.page.view()?.eye[2] ?? home.eye[2]
        stage.advance(1)
        if (stage.page.id !== 'step4') break
        if (pressed < 0 && stage.events.some((e) => e.name === 'button-press')) {
          pressed = stage.time
          before = was
        }
        if (pressed >= 0 && turns < 0) eyes.push(stage.page.view()?.eye[2] ?? home.eye[2])
        if (pressed >= 0 && turns < 0 && stage.turning) turns = stage.time
        if (turns >= 0) expect(stage.page.view(), `seed ${seed} at ${stage.time.toFixed(3)} s`).toBeNull()
      }
      expect(pressed, `seed ${seed}`).toBeGreaterThan(0)
      expect(before, `seed ${seed}`).toBeCloseTo(near, 6)
      expect(turns - pressed, `seed ${seed}`).toBeGreaterThanOrEqual(LAST.held - 1 / stepHz)
      expect(turns - pressed, `seed ${seed}`).toBeLessThanOrEqual(LAST.held + 2 / stepHz)
      expect(turns - pressed, `seed ${seed}`).toBeLessThanOrEqual(0.5)
      for (let i = 1; i < eyes.length; i++) expect(eyes[i]!, `seed ${seed} step ${i}`).toBeGreaterThanOrEqual(eyes[i - 1]!)
      for (let i = 1; i < eyes.length; i++) expect(eyes[i]! - eyes[i - 1]!, `seed ${seed} step ${i}`).toBeLessThan((home.eye[2] - near) * 0.03)
      expect(eyes[eyes.length - 1]!, `seed ${seed}`).toBe(home.eye[2])
    }
  })
})
