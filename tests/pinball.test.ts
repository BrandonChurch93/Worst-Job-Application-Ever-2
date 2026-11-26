import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copyKeysOf } from '../src/copy'
import { pages } from '../src/pages'
import { makePage, T } from '../src/pages/step3'
import { websiteLevel } from '../src/real'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords } from '../src/shell/words'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type Pointer } from '../src/stage/stage'

const beats = config.film.beats.filter((b) => b.unit === 'pinball')
const tolerance = config.film.beatToleranceSeconds
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
const fixed = (p: Pointer): Driver => ({ name: 'bot', input: () => ({ ...p }) })
const live = (p: Pointer): Stage => new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: fixed(p), seed: config.seed })

describe('the pinball page', () => {
  it('has a layout with no problems, in every state it passes through', () => {
    const page = makePage()
    expect(layoutProblems(page.layout, { width: page.width, height: page.height })).toEqual([])
    const s = film()
    const seen = new Set<string>()
    while (!s.finished && s.time < 43) {
      s.advance(60)
      for (const state of s.page.states()) seen.add(state)
    }
    expect([...seen]).toEqual(expect.arrayContaining(['rest', 'play', 'result']))
    for (const mode of config.table.inserts) expect(seen.has(`mode${mode.mode}`)).toBe(true)
  })

  it('takes every word from a key that exists', () => {
    const page = makePage()
    const keys = copyKeysOf(page.layout)
    expect(keys.length).toBeGreaterThan(30)
    for (const key of keys) expect(hasWords(key), key).toBe(true)
    const used = new Set(keys)
    const mine = ['copy:step3.heading', 'copy:step3.subline', 'copy:transitions.step3', 'copy:step3.table.title', 'copy:step3.table.apronCard', 'copy:step3.result.title', 'copy:step3.result.body', 'copy:step2.continue']
    for (const b of ['hq', 'firehouse', 'police', 'bank', 'coffee', 'outlane', 'drain', 'beach']) mine.push(`copy:step3.table.buildings.${b}`)
    for (let i = 0; i < 9; i++) mine.push(`copy:step3.table.modes.${i}.insert`, `copy:step3.table.modes.${i}.display`)
    for (const key of mine) expect(used.has(key), key).toBe(true)
    for (const entry of typeRegister(page.layout)) expect(entry.made === 'runtime' || entry.text.length > 0).toBe(true)
    const list: { kind: string; words?: string; text?: string }[] = []
    page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
    page.draw(list as never)
    for (const shape of list) if (shape.kind === 'text') expect(hasWords(shape.words!), shape.words).toBe(true)
  })

  it('reports every beat event of the film inside its beat', () => {
    const s = film()
    while (!s.finished && s.time < 43) s.advance(240)
    for (const b of beats) {
      if (!b.event) continue
      const at = s.events.filter((e) => e.name === b.event).map((e) => e.step / stepHz)
      expect(at.length, `${b.id}: ${b.event}`).toBeGreaterThan(0)
      for (const t of at) {
        expect(t, `${b.id}: ${b.event} at ${t}`).toBeGreaterThanOrEqual(b.from - tolerance)
        expect(t, `${b.id}: ${b.event} at ${t}`).toBeLessThanOrEqual(b.to + tolerance)
      }
    }
    expect(s.gagsReached).toEqual(expect.arrayContaining(beats.map((b) => b.id)))
  })

  it('has a film script that is a pure function of time', () => {
    const page = makePage()
    for (const t of [0, 1.3, 2.4, 12, 35.2, 40.9, 41.05]) expect(page.script(t)).toEqual(page.script(t))
  })

  it('ends every gag by itself with a still pointer and with a wrong pointer', () => {
    for (const p of [{ x: 300, y: 900, down: false }, { x: 1800, y: 40, down: true, flipLeft: true }] as Pointer[]) {
      const s = live(p)
      let last = 0
      let lastGag = ''
      let longest = 0
      while (s.entryIndex === 0 && s.time < 80) {
        s.advance(24)
        const gag = s.page.gag() ?? ''
        if (gag !== lastGag) {
          lastGag = gag
          last = s.time
        }
        longest = Math.max(longest, s.time - last)
      }
      expect(s.entryIndex).toBe(1)
      expect(s.gagsReached).toEqual(expect.arrayContaining(beats.map((b) => b.id)))
      expect(longest).toBeLessThan(config.live.skipLinkAfterSeconds)
      expect(s.time).toBeLessThanOrEqual(config.live.pinball.sceneSeconds + config.live.idleSeconds + 2)
      expect(s.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      expect(s.longestIgnored.flippers).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      expect(s.events.some((e) => e.name === 'drain')).toBe(true)
    }
  })

  it('plays its ending when skipped, at any moment', () => {
    for (const at of [0.5, 6, 13.3, 20.5, 31.5]) {
      const s = live({ x: 300, y: 900, down: false })
      s.advance(Math.round(at * stepHz))
      s.page.skip()
      const from = s.time
      while (s.entryIndex === 0 && s.time < from + 12) s.advance(24)
      expect(s.entryIndex, `skip at ${at}`).toBe(1)
    }
  })

  it('continues exactly after load(save())', () => {
    for (const at of [1.5, 9.7, 16.2, 21.9, 31.4, 35.6, 39.3]) {
      const a = film()
      a.advance(Math.round(at * stepHz))
      const saved = JSON.parse(JSON.stringify(a.page.save()))
      const b = makePage()
      b.reset({ mode: 'film', variant: '', applicant: null, seed: config.seed })
      b.load(saved)
      expect(JSON.stringify(b.save())).toBe(JSON.stringify(a.page.save()))
      const c = film()
      c.seek(at + 2)
      a.advance(2 * stepHz)
      expect(a.hash()).toBe(c.hash())
      const before = a.hash()
      a.seek(at + 1)
      a.seek(at + 2)
      expect(a.hash()).toBe(before)
    }
  })

  it('fills the table state', () => {
    const page = makePage()
    page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
    const t = page.tableState!()
    expect(t.tiers.map((x) => x.id)).toEqual(config.table.tiers)
    for (const tier of t.tiers) {
      expect(tier.standingParts).toBeGreaterThanOrEqual(config.table.minStandingPartsPerTier)
      expect(tier.inserts).toBe(config.table.insertsPerTier)
      expect(tier.display.charPx).toBeGreaterThanOrEqual(config.layout.minTextPx)
    }
    for (const o of t.openings) expect(o.clearBalls, o.id).toBeGreaterThanOrEqual(config.table.minClearanceBalls)
    for (const h of t.holds) expect(h.releases, h.id).toBe(true)
    expect(t.sealed).toEqual(['corporate.beach'])
    expect(page.sheet!('table-map')!.width).toBe(1080)
  })

  it('takes the website\'s own light down to dusk before the machine wakes and up again as the ball leaves', () => {
    const s = film()
    const dusk = config.table.pageDuskLevel
    const at = (): number => {
      const list: unknown[] = []
      s.page.draw(list as never)
      return websiteLevel(list as never, true)
    }
    const seen: { t: number; v: number }[] = []
    while (!s.finished && s.time < 43 && s.page.id === 'step3') {
      s.advance(3)
      if (s.page.id === 'step3') seen.push({ t: s.time, v: at() })
    }
    const until = (t: number) => seen.filter((x) => x.t <= t)
    expect(Math.min(...until(T.lightsDown - 0.05).map((x) => x.v))).toBe(1)
    const dark = seen.filter((x) => x.t >= T.powerOn + 0.3 && x.t <= T.streetOpen)
    expect(dark.length).toBeGreaterThan(300)
    for (const x of dark) expect(x.v).toBeCloseTo(dusk, 6)
    for (let i = 1; i < seen.length; i++) expect(Math.abs(seen[i]!.v - seen[i - 1]!.v)).toBeLessThan(0.07)
    expect(seen[seen.length - 1]!.v).toBe(1)
    const list: unknown[] = []
    s.page.draw(list as never)
    expect(websiteLevel(list as never, false)).toBe(1)
  })

  it('carries the state of everything that is struck, and the levels of the light show, in the draw list', () => {
    const s = film()
    const low: Record<string, number> = {}
    const high: Record<string, number> = {}
    const note = (key: string, v: number): void => {
      low[key] = Math.min(low[key] ?? 99, v)
      high[key] = Math.max(high[key] ?? -99, v)
    }
    let last: number[][] = []
    while (!s.finished && s.time < 43 && s.page.id === 'step3') {
      s.advance(2)
      if (s.page.id !== 'step3') break
      const list: { id: string; v?: number[] }[] = []
      s.page.draw(list as never)
      const v = (id: string): number[] => list.find((x) => x.id === id)!.v!
      for (const id of ['bumper.office.bumper.1', 'bumper.office.bumper.2', 'bumper.office.bumper.3']) note('bumper', v(id)[0]!)
      for (const side of ['left', 'right']) for (const tier of ['corporate', 'office', 'street']) note('sling', v(`sling.${tier}.sling.${side}.3`)[0]!)
      note('revolving', v('hold.corporate.revolving')[1]!)
      note('firehouse', v('model.street.firehouse')[0]!)
      note('inbox', v('model.office.inbox')[0]!)
      note('doors', v('hq.door.left')[1]!)
      note('gate2', v('gate.2')[0]!)
      const lights = ['corporate', 'office', 'street'].map((z) => v(`whole.table-lights.${z}`))
      lights.forEach((l, k) => {
        note(`general${k}`, l[0]!)
        note(`flash${k}`, l[2]!)
        for (const x of l) expect(x >= 0 && x <= 1).toBe(true)
      })
      note('red', lights[2]![3]!)
      note('blue', lights[2]![4]!)
      if (Math.abs(s.time - (T.powerOn + 0.5)) < 0.02) expect(lights[0]![0]!).toBeGreaterThan(lights[2]![0]!)
      last = lights
    }
    expect(low.bumper).toBeLessThan(0.1)
    expect(high.bumper).toBe(9)
    expect(low.revolving).toBeLessThan(0.1)
    expect(low.doors).toBeLessThan(0.1)
    expect(high.firehouse).toBe(1)
    expect(high.inbox).toBe(1)
    expect([low.gate2, high.gate2]).toEqual([0, 1])
    for (const k of [0, 1, 2]) expect([low[`general${k}`], high[`general${k}`]]).toEqual([0, 1])
    expect(high.flash1).toBeGreaterThan(0.99)
    expect(high.red).toBe(1)
    expect(low.red).toBe(0)
    expect(last.map((l) => l[0]!.toFixed(2))).toEqual(['0.25', '0.25', '0.25'])
  })
})
