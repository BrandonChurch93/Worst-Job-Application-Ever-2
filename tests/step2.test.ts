import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { drawBuilt, makePage } from '../src/pages/step2'
import { DIAL, pruned, ROWS, statesOf } from '../src/pages/step2/layout'
import { pages } from '../src/pages'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords } from '../src/shell/words'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage, StillDriver, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'

const beats = config.film.beats.filter((b) => b.unit === 'step2')
const tolerance = config.film.beatToleranceSeconds
// The film of the page at the length it plays since change note 003, update 5 (24.9 s), whatever the config says the unit is.
const LONG = 24.9
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2').map((f) => (f.closes !== undefined ? { ...f, closes: LONG } : f)), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
const live = (driver: Driver, seed = config.seed): Stage => new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver, seed })
const state = (s: Stage) => JSON.stringify({ page: s.page.save(), cursor: s.cursor.save(), id: s.page.id })
// The events change note 002 adds to step 2. Their sounds are made by the Builder in one batch, so none has a cue of its own yet.
const NEW_EVENTS = ['date-key', 'reel-stop', 'date-hit', 'date-miss', 'volume-sign', 'crank-full', 'field-done', 'field-next', ...['phone', 'birth', 'volume'].flatMap((x) => [`stage-in-${x}`, `stage-out-${x}`])]
const names = (s: Stage) => s.events.filter((e) => e.page === 'step2').map((e) => e.name)

describe('step 2, the layout', () => {
  const page = makePage()
  const size = { width: page.width, height: page.height }

  it('has no problems as a whole tree', () => {
    expect(layoutProblems(page.layout, size)).toEqual([])
  })

  it('has no problems in any state the page can be in', () => {
    const seen = new Set<string>()
    const settled = [null, ['07', '23', '1991'], ['12', '31', '2015']]
    const lines = ['', 'typing', 'done', 'missed']
    const none = ['', '', '']
    const check = (view: Parameters<typeof statesOf>[0]): void => {
      const states = statesOf(view)
      const key = states.join(',')
      if (seen.has(key)) return
      seen.add(key)
      expect(layoutProblems(pruned(page.layout, states), size), key).toEqual([])
    }
    for (const i of [0, 1, 2]) {
      for (const value of ['ask', 'typing']) {
        check({ here: [i], open: -1, hole: -1, panel: false, plate: none, value, note: true, settled: null })
        check({ here: [i], open: i, hole: -1, panel: false, plate: none, value, note: false, settled: null })
      }
      for (const line of lines) {
        if (line === 'missed' && i !== 1) continue
        check({ here: [], open: -1, hole: -1, panel: false, plate: none.map((_, k) => (k === i ? line : '')), value: 'typing', note: true, settled: null })
        for (const hole of [false, true]) for (const panel of [false, true]) for (const reels of settled) check({ here: [], open: i, hole: hole && i < 2 ? i : -1, panel, plate: none.map((_, k) => (k === i ? line : '')), value: 'typing', note: false, settled: reels })
      }
    }
    expect(seen.size).toBeGreaterThan(40)
  })

  it('has the digits in the order of a real dial: 1 nearest the stop, 0 the longest way round', () => {
    const deg = (rad: number) => Math.round((rad * 180) / Math.PI)
    expect(deg(DIAL.stop)).toBe(30)
    expect(deg(DIAL.holeAngle(1))).toBe(-30)
    for (let k = 1; k <= 10; k++) {
      expect(deg(DIAL.holeAngle(k)), String(k)).toBe(-30 * k)
      expect(deg(DIAL.travel(k)), String(k)).toBe(deg(DIAL.stop) - deg(DIAL.holeAngle(k)))
    }
    expect(DIAL.digit(10)).toBe('0')
    expect(deg(DIAL.holeAngle(10)) + 360).toBe(60)
  })

  it('names every word it shows by a key that exists, and uses all the copy of the step', () => {
    const keys = typeRegister(page.layout).map((r) => r.key)
    for (const key of keys) {
      expect(/^(copy:|data:|runtime:|applicant\.)/.test(key), key).toBe(true)
      expect(hasWords(key), key).toBe(true)
    }
    const want = ['heading', 'subline', 'note', 'continue']
    for (const row of ROWS) for (const leaf of ['label', 'helper']) want.push(`rows.${row}.${leaf}`)
    want.push('rows.phone.panel', 'rows.phone.gaveUp', 'rows.birth.recorded', 'rows.volume.done')
    for (const leaf of want) expect(keys, leaf).toContain(`copy:step2.${leaf}`)
    for (const leaf of ['birth.placeholder', 'birth.stop', 'birth.missed', 'birth.stopPanel', 'volume.sign']) expect(keys, leaf).toContain(`copy:step2.rows.${leaf}`)
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
    for (let t = 0; t <= LONG - 0.6; t += 0.2) {
      s.seek(t)
      const list: Shape[] = []
      drawBuilt(s.page, list)
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
  s.advance(LONG * stepHz)

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
    const order = ['row-open', 'stage-in-phone', 'dial-wind', 'dial-return', 'dial-fling', 'stage-out-phone', 'field-done', 'field-next', 'date-key', 'row-open', 'stage-in-birth', 'lever-pull', 'reels-spin', 'reel-stop', 'reel-stop', 'reel-stop', 'date-hit', 'coins', 'stage-out-birth', 'field-done', 'field-next', 'row-open', 'stage-in-volume', 'volume-sign', 'crank-turn', 'crank-runaway', 'flatten', 'crank-full', 'stage-out-volume', 'field-done', 'peel-up', 'button-press', 'page-turn']
    let i = 0
    for (const n of seen) if (n === order[i]) i++
    expect(i, seen.join(' ')).toBe(order.length)
    const cues = new Set(config.audio.sfx.map((c) => c.id))
    for (const n of seen) if (n !== 'dial-fling' && !NEW_EVENTS.includes(n)) expect(cues.has(n), n).toBe(true)
    expect(seen.filter((n) => n === 'date-key').length).toBe(8)
    expect(seen.filter((n) => n === 'reel-stop').length).toBe(3)
    expect(seen.filter((n) => n === 'dial-wind').length).toBe(config.live.step2.dialDigitsBeforeItGivesUp)
    expect(seen.filter((n) => n === 'crank-turn').length).toBe(config.live.step2.crankTurnsBeforeItRunsAway)
    expect(seen.filter((n) => n === 'dial-fling').length).toBe(1)
    expect(seen.filter((n) => n === 'flatten').length).toBe(1)
  })

  it('opens one row in each beat and closes it before the next', () => {
    const t = film()
    for (const [at, gag] of [[1, 'step2.open'], [4, 'step2.dial'], [10, 'step2.slot'], [16, 'step2.crank'], [23.5, 'step2.continue']] as const) {
      t.seek(at)
      expect(t.page.gag(), String(at)).toBe(gag)
    }
    for (const at of [1, 8.1, 14.6, 23]) {
      t.seek(at)
      expect(t.page.states().filter((x) => x.endsWith('-open')), String(at)).toEqual([])
    }
  })

  it('never lays the last line of a machine over the field that comes after it: the one slides off as the other slides on', () => {
    const t = film()
    let both = 0
    for (let at = 0; at <= LONG - 0.5; at += 1 / 60) {
      t.seek(at)
      const list: Shape[] = []
      drawBuilt(t.page, list)
      const lines = list.filter((x) => /-plate-/.test(x.id))
      const fields = list.filter((x) => /^(phone|birth|volume)-(pocket|label|helper)$/.test(x.id))
      if (lines.length && fields.length) both++
      for (const a of lines) for (const b of fields) expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.id} and ${b.id} at ${at.toFixed(2)}`).toBe(true)
    }
    expect(both).toBeGreaterThan(20)
  })

  it('stands on the approved keys: two digits dialled and three segments lit, at the times the config gives the two keys', () => {
    const keyAt = (id: string): number => {
      const k = config.keys.find((x) => x.id === id)!
      const b = beats.find((x) => x.id === k.beat)!
      return b.from + (b.to - b.from) * k.at
    }
    const t = film()
    const shapes = (): Shape[] => {
      const list: Shape[] = []
      drawBuilt(t.page, list)
      return list
    }
    t.seek(keyAt('step2-dial'))
    const typed = shapes().filter((x) => x.kind === 'text' && x.words === 'runtime:step2.phone')
    expect(typed.length).toBe(1)
    expect(typed[0]!.text).toBe('(555) 01')
    expect(hasWords('data:step2.phone.prefix')).toBe(true)
    expect(t.page.volume!()).toBe(1)
    t.seek(keyAt('step2-crank'))
    const lit = shapes().filter((x) => /^meter-\d+$/.test(x.id) && x.tone === 'accent').map((x) => x.id)
    expect(lit).toEqual(['meter-1', 'meter-2', 'meter-3'])
    expect(t.page.volume!()).toBeCloseTo(0.3, 1)
  })

  it('sets the volume of the site with the crank: full before the row, low when it opens, full at the end', () => {
    const t = film()
    let last = 0
    let low = 1
    for (let at = 0; at <= LONG - 0.5; at += 0.05) {
      t.seek(at)
      const v = t.page.volume!()
      expect(v, at.toFixed(2)).toBeGreaterThanOrEqual(0.1)
      expect(v, at.toFixed(2)).toBeLessThanOrEqual(1)
      if (at < 14.9) expect(v, at.toFixed(2)).toBe(1)
      if (at > 15) expect(v, at.toFixed(2)).toBeGreaterThanOrEqual(last - 1e-9)
      if (at > 15) last = v
      low = Math.min(low, v)
    }
    expect(low).toBeCloseTo(0.1, 5)
    expect(last).toBe(1)
  })

  it('changes the cursor on the step of each strike, at the cursor, and calls nothing else a strike', () => {
    const done = film()
    done.seek(LONG - 0.5)
    const strikes = done.events.filter((e) => e.page === 'step2' && e.hitsCursor)
    expect(strikes.map((e) => e.name)).toEqual(['dial-fling', 'coins', 'flatten'])
    expect(done.events.filter((e) => e.page === 'step2' && e.name === 'coins').length).toBe(1)
    const carriage = (s: Stage) => `${s.cursor.pose().acting}|${s.cursor.damaged}`
    for (const e of strikes) {
      const t = film()
      t.advance(e.step - 1)
      const before = carriage(t)
      t.advance(2)
      expect(carriage(t), e.name).not.toBe(before)
      expect(Math.hypot(e.x - t.cursor.x, e.y - t.cursor.y), e.name).toBeLessThan(70)
    }
  })

  it('marks the handle of the crank and the knob of the lever as moved only while they are away from their place', () => {
    const t = film()
    const boxes = new Map<string, number[]>()
    const walkTree = (n: { id: string; box: number[]; children?: unknown[] }): void => {
      boxes.set(n.id, n.box)
      for (const c of (n.children ?? []) as { id: string; box: number[]; children?: unknown[] }[]) walkTree(c)
    }
    walkTree(makePage().layout as never)
    const part = (id: string): Shape => {
      const list: Shape[] = []
      drawBuilt(t.page, list)
      return list.find((x) => x.id === id)!
    }
    t.seek(15.8)
    for (const id of ['crank-arm', 'crank-grip']) {
      const shape = part(id)
      expect(shape.moved, id).toBeUndefined()
      const box = boxes.get(id)!
      expect(Math.abs(shape.x - box[0]!), id).toBeLessThan(0.01)
      expect(Math.abs(shape.y - box[1]!), id).toBeLessThan(0.01)
    }
    t.seek(16.6)
    for (const id of ['crank-arm', 'crank-grip']) expect(part(id).moved, id).toBe(true)
    t.seek(10.3)
    expect(part('slot-knob').moved).toBeUndefined()
    t.seek(10.76)
    expect(part('slot-knob').moved).toBe(true)
  })

  it('heals every hurt inside the limit and hands the cursor on whole', () => {
    const t = film()
    let hurtFor = 0
    let longest = 0
    let heldFor = 0
    let held = 0
    for (let i = 0; i < LONG * stepHz; i++) {
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
    for (const n of ['row-open', 'lever-pull', 'reels-spin', 'reel-stop', 'date-miss', 'crank-runaway', 'button-press']) expect(seen, n).toContain(n)
    expect(seen).not.toContain('coins')
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

  it('gives the full volume back when the step is skipped with the crank half turned', () => {
    const l = live(new BotDriver('keen', config.seed))
    let low = false
    for (let i = 0; i < 60 * stepHz && l.page.id === 'step2'; i++) {
      l.advance(1)
      if (l.page.id === 'step2' && l.page.volume!() < 1) {
        low = true
        break
      }
    }
    expect(low).toBe(true)
    l.page.skip()
    l.advance(1)
    expect(l.page.volume?.() ?? 1).toBe(1)
  })

  it('heals a flat cursor in sight before the page turns, when Continue comes early', () => {
    const l = live(new BotDriver('clumsy', config.seed))
    while (!names(l).includes('flatten') && l.time < 60) l.advance(1)
    expect(names(l)).toContain('flatten')
    l.advance(stepHz)
    expect(l.cursor.damaged).toBe(true)
    l.page.skip()
    let healedAt = -1
    const from = l.time
    while (l.page.id === 'step2' && l.time < from + 5) {
      l.advance(1)
      if (healedAt < 0 && !l.cursor.damaged) healedAt = l.time - from
    }
    expect(l.page.id).toBe('step3')
    expect(healedAt).toBeGreaterThan(0.1)
    expect(healedAt).toBeLessThan(1.5)
    expect(l.cursor.damaged).toBe(false)
    expect(names(l)).toContain('peel-up')
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
        drawBuilt(a.page, la)
        drawBuilt(b.page, lb)
        expect(lb, `${mode} ${at}`).toEqual(la)
      }
    }
  })
})
