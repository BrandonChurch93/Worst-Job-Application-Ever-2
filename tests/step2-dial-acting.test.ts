import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { ACTING } from '../src/cursor/body'
import { pages } from '../src/pages'
import { actingAt, filmAt, pointerAt, reactions } from '../src/pages/step2/script'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const KEYS = [0.95, 3.63, 17.62]
const LONG = 24.9
const MARKS = { fling: 6.01, strike: 12.78 }
const HELD: Record<string, [number, number]> = { tap: [0.02, 0.14], startle: [0.1, 0.08], rear: [0.17, 0.09], dustOff: [0, 0.7], stamp: [0, 0.17], cower: [0, 0.5], doubleTake: [0, 0.6], jump: [0, 0.2], anticipate: [0, 0.1], duck: [0, 0.36], dart: [0.34, 0.3], fume: [0, 0.2], snap: [0, 0.4] }

describe('the acting of step 2', () => {
  it('uses no reaction twice', () => {
    const names = reactions.map(([, name]) => name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).not.toContain('recoil')
    expect(names).not.toContain('flinch')
  })

  it('cues nothing in the half second before a key picture', () => {
    for (const key of KEYS) {
      for (const [at, name] of reactions) expect(filmAt(at) < key - 0.5 || filmAt(at) > key, `${name} at ${filmAt(at)} before the key at ${key}`).toBe(true)
      const before = actingAt(key - 0.5, MARKS)
      for (let t = key - 0.5; t <= key; t += 1 / stepHz) expect(actingAt(t, MARKS), `state at ${t.toFixed(2)}`).toBe(before)
    }
  })

  it('has the keys of the page where the test thinks they are', () => {
    const keys = (config as unknown as { keys?: { id: string; unit: string; beat: string; at: number }[] }).keys
    if (!keys) return
    const mine = keys.filter((k) => k.unit === 'step2')
    expect(mine.length).toBe(KEYS.length)
  })

  it('keeps the pointer still while a pose is held', () => {
    for (const [at, name] of reactions) {
      const [from, long] = HELD[name]!
      const a = pointerAt(filmAt(at + from))
      const b = pointerAt(filmAt(at + from + long))
      expect(Math.hypot(a.x - b.x, a.y - b.y), `${name} at ${at}`).toBeLessThan(1)
    }
  })

  it('names only states the cursor has, and shows at least five of them in the page', () => {
    const seen = new Set<string>()
    for (let t = 0; t <= LONG; t += 0.05) seen.add(actingAt(t, MARKS))
    for (const name of seen) expect(ACTING).toContain(name)
    expect(seen.size).toBeGreaterThanOrEqual(5)
  })

  it('keeps each event of the page at its time in the longer film', () => {
    const s = new Stage({ mode: 'film', flow: filmFlow('step2').map((f) => (f.closes !== undefined ? { ...f, closes: LONG } : f)), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
    s.advance(Math.round(LONG * stepHz))
    const at = (name: string): number[] => s.events.filter((e) => e.page === 'step2' && e.name === name).map((e) => Math.round((e.step / stepHz) * 100) / 100)
    expect(at('row-open')).toEqual([1.88, 9.39, 14.92])
    expect(at('dial-fling')).toEqual([6.01])
    expect(at('lever-pull')).toEqual([10.64])
    expect(at('coins')).toEqual([12.78])
    expect(at('crank-runaway')).toEqual([17.58])
    expect(at('flatten')).toEqual([20.08])
    expect(at('peel-up')).toEqual([23.85])
    expect(at('button-press')).toEqual([24.29])
  })
})
