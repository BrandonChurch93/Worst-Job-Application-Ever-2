import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { CUES, path, TAKE } from '../src/pages/marketing/script'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const marks = { start: { x: 0, y: 0 }, lane: { x: 1, y: 1 }, cards: [{ x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }], off: { x: 5, y: 5 }, medal: { x: 6, y: 6 }, stand: { x: 7, y: 7 }, press: { x: 8, y: 8 } }
const LASTS = { dustOff: 0.9, anticipate: 0.35, jump: 0.5 } as Record<string, number>
const HOLD = 0.4
const KEY = config.film.beats.find((b) => b.id === 'marketing.apply')!.from

describe('careers acting', () => {
  it('keeps the page events of the film on their steps', () => {
    const s = film()
    s.advance(Math.round(14 * stepHz))
    const at = (name: string): number[] => s.events.filter((e) => e.name === name).map((e) => e.step)
    expect(at('card-flip')).toEqual([505, 1034, 1522])
    expect(at('button-press')).toEqual([3065])
  })

  it('holds each pose long enough to be seen, and stands still before the key picture', () => {
    const keys = path(marks)
    const held = (x: number): number => {
      const k = keys.filter((p) => p.x === x)
      return k[k.length - 1]!.t - k[0]!.t
    }
    expect(TAKE.till - TAKE.there).toBeGreaterThanOrEqual(HOLD)
    expect(held(2 + TAKE.back.x)).toBeGreaterThanOrEqual(HOLD)
    expect(4 - TAKE.home).toBeGreaterThanOrEqual(HOLD)
    for (const x of [3, 4, 7]) expect(held(x), `mark ${x}`).toBeGreaterThanOrEqual(HOLD)
    const stand = keys.filter((p) => p.x === 7)
    expect(stand[0]!.t).toBeLessThanOrEqual(KEY - 0.5)
    expect(stand[stand.length - 1]!.t).toBeGreaterThan(KEY)
    for (const c of CUES) expect(c.at <= KEY - 0.5 || c.at > KEY, `cue at ${c.at}`).toBe(true)
  })

  it('never starts a move before the one before it has ended', () => {
    const reacts = CUES.filter((c) => c.react)
    reacts.forEach((c, i) => {
      const next = reacts[i + 1]
      if (next) expect(c.at + LASTS[c.react!]!, c.react).toBeLessThanOrEqual(next.at + 1e-9)
    })
    const keys = path(marks)
    const moving = (t: number): boolean => keys.some((k, i) => i > 0 && t > keys[i - 1]!.t && t < k.t && (k.x !== keys[i - 1]!.x || k.y !== keys[i - 1]!.y))
    const dust = CUES.find((c) => c.react === 'dustOff')!
    for (let t = dust.at + 0.01; t < dust.at + LASTS.dustOff!; t += 0.05) expect(moving(t), `dust off at ${t.toFixed(2)}`).toBe(false)
  })
})
