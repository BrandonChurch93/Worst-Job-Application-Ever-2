import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { makePage } from '../src/pages/step2'
import { pruned, ROWS, statesOf } from '../src/pages/step2/layout'
import { pages } from '../src/pages'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords } from '../src/shell/words'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage, StillDriver, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'

const beats = config.film.beats.filter((b) => b.unit === 'step2')
const tolerance = config.film.beatToleranceSeconds
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
const live = (driver: Driver, seed = config.seed): Stage => new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver, seed })
const state = (s: Stage) => JSON.stringify({ page: s.page.save(), cursor: s.cursor.save(), id: s.page.id })
const names = (s: Stage) => s.events.filter((e) => e.page === 'step2').map((e) => e.name)

describe('step 2, the layout', () => {
  const page = makePage()
  const size = { width: page.width, height: page.height }

  it('has no problems as a whole tree', () => {
    expect(layoutProblems(page.layout, size)).toEqual([])
  })

  it('has no problems in any state the page can be in', () => {
    const seen = new Set<string>()
    const settled = [null, ['07', '23', '1991'], ['12', '31', '2008']]
    for (const open of [-1, 0, 1, 2]) {
      for (const panel of [false, true]) {
        for (let mask = 0; mask < 8; mask++) {
          for (const typing of [false, true]) {
            for (const reels of settled) {
              const states = statesOf({ open, panel, done: [0, 1, 2].map((i) => (mask & (1 << i)) !== 0), typing: [typing, false, typing], settled: reels })
              const key = states.join(',')
              if (seen.has(key)) continue
              seen.add(key)
              expect(layoutProblems(pruned(page.layout, states), size), key).toEqual([])
            }
          }
        }
      }
    }
    expect(seen.size).toBeGreaterThan(40)
  })

  it('names every word it shows by a key that exists, and uses all the copy of the step', () => {
    const keys = typeRegister(page.layout).map((r) => r.key)
    for (const key of keys) {
      expect(/^(copy:|data:|runtime:|applicant\.)/.test(key), key).toBe(true)
      expect(hasWords(key), key).toBe(true)
    }
    const want = ['heading', 'subline', 'note', 'continue']
    for (const row of ROWS) for (const leaf of ['label', 'helper', 'panel']) want.push(`rows.${row}.${leaf}`)
    want.push('rows.phone.gaveUp', 'rows.birth.recorded', 'rows.volume.done')
    for (const leaf of want) expect(keys, leaf).toContain(`copy:step2.${leaf}`)
  })

  it('draws only shapes whose words are keys, in the film and on the sheet', () => {
    const s = film()
    const check = (list: Shape[]) => {
      for (const shape of list) {
        if (shape.kind !== 'text') continue
        expect(hasWords(shape.words!), shape.id).toBe(true)
        if (!shape.words!.startsWith('runtime:')) expect(shape.text, shape.id).toBeUndefined()
      }
    }
    for (let t = 0; t <= 20.4; t += 0.2) {
      s.seek(t)
      const list: Shape[] = []
      s.page.draw(list)
      check(list)
      const ids = list.map((x) => x.id)
      expect(new Set(ids).size, `ids at ${t.toFixed(1)}`).toBe(ids.length)
    }
    const sheet = s.page.sheet!('machines')!
    check(sheet.list)
    expect(sheet.cursors.length).toBe(1)
    expect(s.page.sheet!('nothing')).toBeNull()
  })
})

describe('step 2, the film', () => {
  const s = film()
  s.advance(21 * stepHz)

  it('reports the event of each beat inside its beat', () => {
    for (const b of beats) {
      const event = (b as { event?: string | null }).event
      if (!event) continue
      const at = s.events.filter((e) => e.name === event).map((e) => e.step / stepHz)
      expect(at.length, event).toBeGreaterThan(0)
      expect(at[0]!, event).toBeGreaterThanOrEqual(b.from - tolerance)
      expect(at[0]!, event).toBeLessThanOrEqual(b.to + tolerance)
    }
  })

  it('reports every contact that has a cue, in the order of the story', () => {
    const seen = names(s).filter((n) => n !== 'step')
    const order = ['row-open', 'dial-wind', 'dial-return', 'dial-fling', 'row-open', 'lever-pull', 'reels-spin', 'coins', 'row-open', 'crank-turn', 'crank-runaway', 'flatten', 'peel-up', 'button-press', 'page-turn']
    let i = 0
    for (const n of seen) if (n === order[i]) i++
    expect(i, seen.join(' ')).toBe(order.length)
    const cues = new Set(config.audio.sfx.map((c) => c.id))
    for (const n of seen) if (n !== 'dial-fling') expect(cues.has(n), n).toBe(true)
    expect(seen.filter((n) => n === 'dial-wind').length).toBe(config.live.step2.dialDigitsBeforeItGivesUp)
    expect(seen.filter((n) => n === 'crank-turn').length).toBe(config.live.step2.crankTurnsBeforeItRunsAway)
    expect(seen.filter((n) => n === 'dial-fling').length).toBe(1)
    expect(seen.filter((n) => n === 'flatten').length).toBe(1)
  })

  it('opens one row in each beat and closes it before the next', () => {
    const t = film()
    for (const [at, gag] of [[1, 'step2.open'], [4, 'step2.dial'], [10, 'step2.slot'], [16, 'step2.crank'], [20.4, 'step2.continue']] as const) {
      t.seek(at)
      expect(t.page.gag(), String(at)).toBe(gag)
    }
    for (const at of [1, 8.1, 14, 20]) {
      t.seek(at)
      expect(t.page.states(), String(at)).toContain('rest')
    }
  })

  it('heals every hurt inside the limit and hands the cursor on whole', () => {
    const t = film()
    let hurtFor = 0
    let longest = 0
    let heldFor = 0
    let held = 0
    for (let i = 0; i < 20.5 * stepHz; i++) {
      t.advance(1)
      hurtFor = t.cursor.damaged ? hurtFor + 1 : 0
      heldFor = t.cursor.taken ? heldFor + 1 : 0
      longest = Math.max(longest, hurtFor)
      held = Math.max(held, heldFor)
      if (t.cursor.arms) throw new Error('arms')
    }
    expect(longest / stepHz).toBeLessThanOrEqual(config.cursor.damageHealSeconds)
    expect(longest).toBeGreaterThan(0)
    expect(t.cursor.damaged).toBe(false)
    expect(held / stepHz).toBeLessThan(config.live.controlTakenMaxSeconds)
    expect(t.cursor.pose().scale).toBe(1)
  })

  it('is a pure function of time', () => {
    const p = makePage()
    for (const t of [0, 0.5, 3.3, 5.5, 9.2, 15.6, 20.3, 21]) expect(p.script(t)).toEqual(p.script(t))
  })
})

describe('step 2, live', () => {
  const run = (driver: Driver, seconds: number): Stage => {
    const s = live(driver)
    for (let i = 0; i < seconds * stepHz && s.page.id === 'step2'; i += 24) s.advance(24)
    return s
  }

  it('ends every gag by itself with a pointer that never moves', () => {
    const s = run(new StillDriver({ x: 300, y: 900 }), 200)
    expect(s.page.id).toBe('step3')
    expect(s.gagsReached.filter((g) => g.startsWith('step2.'))).toEqual(beats.map((b) => b.id))
    const seen = names(s)
    for (const n of ['row-open', 'lever-pull', 'reels-spin', 'coins', 'crank-runaway', 'button-press']) expect(seen, n).toContain(n)
    expect(seen.filter((n) => n === 'row-open').length).toBe(3)
    expect(s.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('ends every gag by itself with a pointer that does the wrong thing', () => {
    const wrong: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        const hint = v.page.hint()
        const t = v.pageTime
        const open = v.page.gag() !== null && v.page.gag() !== 'step2.open' && v.page.gag() !== 'step2.continue'
        if (!open && hint) return { x: hint.x, y: hint.y, down: Math.floor(t * 4) % 2 === 0 }
        return { x: 1400 + 300 * Math.sin(t * 3), y: 500 + 260 * Math.cos(t * 2.3), down: Math.floor(t * 3) % 2 === 0 }
      }
    }
    const s = run(wrong, 200)
    expect(s.page.id).toBe('step3')
    expect(names(s).filter((n) => n === 'row-open').length).toBe(3)
    expect(s.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('lets a capable visitor work each machine, and a clumsy one too', () => {
    for (const bot of ['keen', 'clumsy'] as const) {
      const s = run(new BotDriver(bot, config.seed), 120)
      expect(s.page.id, bot).toBe('step3')
      const seen = names(s)
      expect(seen.filter((n) => n === 'dial-wind').length, bot).toBeGreaterThanOrEqual(config.live.step2.dialDigitsBeforeItGivesUp)
      expect(seen.filter((n) => n === 'dial-return').length, bot).toBeGreaterThanOrEqual(config.live.step2.dialDigitsBeforeItGivesUp - 1)
      expect(seen.filter((n) => n === 'crank-turn').length, bot).toBe(config.live.step2.crankTurnsBeforeItRunsAway)
      for (const n of ['dial-fling', 'lever-pull', 'coins', 'crank-runaway', 'button-press']) expect(seen, `${bot} ${n}`).toContain(n)
      expect(s.time, bot).toBeLessThan(60)
      expect(s.cursor.damaged, bot).toBe(false)
      expect(s.longestIgnored.pointer, bot).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    }
  })

  it('plays its ending when the step is skipped, from any moment', () => {
    for (const at of [0.5, 3, 6.2, 12, 17]) {
      const l = live(new BotDriver('keen', config.seed))
      l.advance(Math.round(at * stepHz))
      if (l.page.id !== 'step2') continue
      l.page.skip()
      for (let n = 0; n < 3 * stepHz && (l.page.id as string) !== 'step3'; n++) l.advance(1)
      expect(l.page.id, String(at)).toBe('step3')
      expect(l.cursor.taken, String(at)).toBe(false)
      expect(l.cursor.damaged, String(at)).toBe(false)
    }
  })

  it('continues exactly after load(save())', () => {
    for (const mode of ['film', 'live'] as const) {
      const make = () => (mode === 'film' ? film() : live(new BotDriver('clumsy', config.seed)))
      for (const at of [0.7, 3.6, 5.9, 6.4, 10.3, 12.1, 16.0, 17.1, 19.9]) {
        const a = make()
        a.advance(Math.round(at * stepHz))
        const saved = JSON.parse(JSON.stringify({ page: a.page.save(), cursor: a.cursor.save() }))
        const b = make()
        b.advance(Math.round(at * stepHz))
        b.page.reset({ mode, variant: '', applicant: null, seed: config.seed })
        b.page.load(saved.page)
        b.cursor.load(saved.cursor)
        a.advance(2 * stepHz)
        b.advance(2 * stepHz)
        expect(state(b), `${mode} ${at}`).toBe(state(a))
        const la: Shape[] = []
        const lb: Shape[] = []
        a.page.draw(la)
        b.page.draw(lb)
        expect(lb, `${mode} ${at}`).toEqual(la)
      }
    }
  })
})
