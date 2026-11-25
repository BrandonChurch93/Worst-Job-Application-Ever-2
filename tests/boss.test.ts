import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { makePage } from '../src/pages/step4'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords } from '../src/shell/words'
import { filmFlow, filmOptions, runBot, ScriptDriver, Stage, type Driver, type DriverView, type FlowEntry, type Pointer } from '../src/stage/stage'

const beats = config.film.beats.filter((b) => b.unit === 'boss') as { id: string; from: number; to: number; event?: string }[]
const unit = config.film.units.find((u) => u.id === 'boss')!
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
const live = (driver: Driver): Stage => new Stage({ mode: 'live', flow, pages, driver, seed: config.seed })
const still: Driver = { name: 'bot', input: (): Pointer => ({ x: 700, y: 820, down: false }) }
const wrong: Driver = { name: 'bot', input: (v: DriverView): Pointer => ({ x: 96 + 40 * Math.sin(v.time * 3), y: 420 + 30 * Math.cos(v.time * 2), down: Math.floor(v.time * 5) % 2 === 0 }) }
const keen = (skipAt = Infinity): Driver => ({
  name: 'bot',
  input(v: DriverView): Pointer {
    const h = v.page.hint()
    const at = h ? h.dodge ?? h : { x: 700, y: 820 }
    return { x: at.x, y: at.y, down: h ? h.down && !h.dodge : false, skip: v.pageTime >= skipAt }
  }
})

interface Run { seconds: number; gagSeconds: Record<string, number>; events: { name: string; time: number; hitsCursor: boolean }[]; ignored: number; damagedAtEnd: boolean; problems: Set<string>; keys: Set<string> }

function play(stage: Stage, maxSeconds = 140): Run {
  const gagSeconds: Record<string, number> = {}
  const problems = new Set<string>()
  const keys = new Set<string>()
  let damagedAtEnd = false
  while (stage.page.id === 'step4' && stage.time < maxSeconds) {
    stage.advance(12)
    if (stage.page.id !== 'step4') break
    const gag = stage.page.gag()!
    gagSeconds[gag] = (gagSeconds[gag] ?? 0) + 12 / stepHz
    if (stage.page.done()) damagedAtEnd = stage.cursor.damaged
    const list: Parameters<typeof stage.page.draw>[0] = []
    stage.page.draw(list)
    for (const shape of list) {
      if (shape.kind === 'text' || shape.words !== undefined) keys.add(shape.words ?? '')
      if (shape.kind === 'text' && shape.z1 < 0) problems.add(`${shape.id} is below the page`)
    }
  }
  return { seconds: stage.time, gagSeconds, events: stage.events.filter((e) => e.page === 'step4').map((e) => ({ name: e.name, time: e.step / stepHz, hitsCursor: e.hitsCursor })), ignored: stage.longestIgnored.pointer, damagedAtEnd, problems, keys }
}

const leaves = (v: unknown, path: string, out: string[]): string[] => {
  if (typeof v === 'string') out.push(path)
  else if (Array.isArray(v)) v.forEach((x, i) => leaves(x, `${path}.${i}`, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) leaves(x, `${path}.${k}`, out)
  return out
}

describe('step 4, the boss', () => {
  it('is a whole page with a gag for every beat of its unit', () => {
    const page = makePage()
    expect(page.id).toBe('step4')
    expect(page.unit).toBe('boss')
    expect(page.gags.map((g) => g.id)).toEqual(beats.map((b) => b.id))
    expect(page.gags.map((g) => g.event)).toEqual(beats.map((b) => b.event ?? null))
  })

  it('has a layout with no problems in any state', () => {
    const page = makePage()
    expect(layoutProblems(page.layout, { width: page.width, height: page.height })).toEqual([])
  })

  it('shows only words that resolve to a key, and uses all the copy of step 4', () => {
    const page = makePage()
    const register = typeRegister(page.layout)
    for (const entry of register) expect(hasWords(entry.key), entry.key).toBe(true)
    const used = new Set(register.map((e) => e.key))
    const want = leaves((copy as unknown as Record<string, unknown>).step4, 'copy:step4', [])
    expect(want.length).toBeGreaterThan(20)
    for (const key of want) expect(used.has(key), key).toBe(true)
    const runs = [play(film()), play(live(still)), play(live(keen()))]
    for (const run of runs) {
      expect([...run.problems]).toEqual([])
      expect(run.keys.size).toBeGreaterThan(8)
      for (const key of run.keys) {
        expect(key.startsWith('copy:') || key.startsWith('data:') || key.startsWith('applicant.') || key.startsWith('runtime:') || hasWords(key), key).toBe(true)
        expect(hasWords(key), key).toBe(true)
        expect(used.has(key), key).toBe(true)
      }
    }
  })

  it('puts the event of every beat inside its beat in the film', () => {
    const stage = film()
    stage.advance(unit.seconds * stepHz)
    for (const b of beats) {
      const from = Math.max(b.from - 0.25, 0.5)
      const to = Math.min(b.to + 0.25, unit.seconds - 0.5)
      const first = stage.events.find((e) => e.name === b.event)
      expect(first, b.id).toBeDefined()
      const at = first!.step / stepHz
      expect(at, `${b.id} ${b.event} at ${at}`).toBeGreaterThanOrEqual(from)
      expect(at, `${b.id} ${b.event} at ${at}`).toBeLessThanOrEqual(to)
    }
    expect(stage.events.filter((e) => e.name === 'boss-slow')).toEqual([])
  })

  it('names the gag of each beat while that beat runs in the film', () => {
    const stage = film()
    for (const b of beats) {
      stage.seek((b.from + b.to) / 2)
      expect(stage.page.gag(), b.id).toBe(b.id)
    }
  })

  it('leaves the cursor whole from the collapse on and when the film turns the page', () => {
    const stage = film()
    stage.advance(Math.round((unit.seconds - 0.5) * stepHz))
    expect(stage.cursor.damaged).toBe(false)
    expect(stage.page.done()).toBe(true)
    const down = stage.events.find((e) => e.name === 'power-down')!
    expect(stage.events.filter((e) => e.hitsCursor && e.step >= down.step)).toEqual([])
    const hits = stage.events.filter((e) => e.hitsCursor)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((e) => e.step < down.step - 3 * stepHz)).toBe(true)
  })

  it.each([['a still pointer', still], ['a wrong pointer', wrong]])('ends every gag by itself with %s', (_name, driver) => {
    const run = play(live(driver as Driver))
    expect(run.seconds).toBeLessThan(140)
    for (const b of beats) {
      expect(run.gagSeconds[b.id], b.id).toBeGreaterThan(0)
      expect(run.gagSeconds[b.id], b.id).toBeLessThanOrEqual(config.live.skipLinkAfterSeconds + 3)
    }
    const fight = run.gagSeconds['boss.slabs']! + run.gagSeconds['boss.popups']! + run.gagSeconds['boss.lastStand']!
    expect(fight).toBeLessThanOrEqual(config.live.boss.maxSeconds)
    expect(run.ignored).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    expect(run.damagedAtEnd).toBe(false)
    const down = run.events.find((e) => e.name === 'power-down')!
    expect(run.events.filter((e) => e.hitsCursor && e.time >= down.time)).toEqual([])
    for (const b of beats) expect(run.events.some((e) => e.name === b.event), b.event).toBe(true)
    expect(run.events.filter((e) => e.name === 'boss-slow').length).toBe(driver === still ? 1 : 0)
  })

  it('lets a keen visitor win the fight well inside the limit and reach every gag', () => {
    const run = play(live(keen()))
    for (const b of beats) expect(run.gagSeconds[b.id], b.id).toBeGreaterThan(0)
    const fight = run.gagSeconds['boss.slabs']! + run.gagSeconds['boss.popups']! + run.gagSeconds['boss.lastStand']!
    expect(fight).toBeLessThan(config.live.boss.maxSeconds - 5)
    expect(run.damagedAtEnd).toBe(false)
    expect(run.events.filter((e) => e.name === 'boss-slow').length).toBeLessThanOrEqual(1)
  })

  it.each([0.5, 3, 6.2, 7.5, 12, 19, 25, 28.2, 30])('ends soon after a skip at %s s', (at) => {
    const stage = live(keen(Infinity))
    stage.advance(Math.round(at * stepHz))
    if (stage.page.id !== 'step4') return
    stage.page.skip()
    const from = stage.time
    while (stage.page.id === 'step4' && stage.time < from + 12) stage.advance(12)
    expect(stage.page.id).toBe('step5')
    expect(stage.time - from).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    expect(stage.cursor.damaged).toBe(false)
  })

  it.each([2, 4.5, 6.5, 8, 12.5, 14.2, 18, 20.5, 22.4, 25, 27.8, 30.6])('continues exactly from a save at %s s', (at) => {
    const a = film()
    const b = film()
    const n = Math.round(at * stepHz)
    a.advance(n)
    b.advance(n)
    const saved = JSON.stringify(b.page.save())
    const other = makePage()
    other.reset({ mode: 'film', variant: '', applicant: null, seed: config.seed })
    other.load(JSON.parse(saved))
    expect(JSON.stringify(other.save())).toBe(saved)
    const one: Parameters<typeof other.draw>[0] = []
    const two: Parameters<typeof other.draw>[0] = []
    other.draw(one)
    b.page.draw(two)
    expect(JSON.stringify(one)).toBe(JSON.stringify(two))
    b.page.load(JSON.parse(saved))
    a.advance(480)
    b.advance(480)
    expect(JSON.stringify(b.page.save())).toBe(JSON.stringify(a.page.save()))
    expect(JSON.stringify(b.cursor.save())).toBe(JSON.stringify(a.cursor.save()))
    expect(b.events).toEqual(a.events)
    const c = film()
    c.seek(unit.seconds - 1)
    c.seek((n + 480) / stepHz)
    expect(JSON.stringify(c.page.save())).toBe(JSON.stringify(a.page.save()))
  })

  it('gives a hint the whole way, with a dodge when a slab is coming', () => {
    const stage = live(keen())
    let dodges = 0
    let presses = 0
    while (stage.page.id === 'step4' && stage.time < 120) {
      stage.advance(6)
      if (stage.page.id !== 'step4') break
      const h = stage.page.hint()
      expect(h).not.toBeNull()
      expect(h!.x).toBeGreaterThan(0)
      expect(h!.x).toBeLessThan(stage.page.width)
      expect(h!.y).toBeGreaterThan(0)
      expect(h!.y).toBeLessThan(stage.page.height)
      if (h!.dodge) dodges++
      if (h!.down) presses++
    }
    expect(dodges).toBeGreaterThan(0)
    expect(presses).toBeGreaterThan(0)
  })

  it('draws the four stages of the boss on its sheet', () => {
    const page = makePage()
    const sheet = page.sheet!('boss-stages')
    expect(sheet).not.toBeNull()
    for (let i = 0; i < 4; i++) expect(sheet!.list.some((s) => s.id.startsWith(`stage-${i}`)), `stage ${i}`).toBe(true)
    expect(sheet!.list.every((s) => s.kind !== 'text' || hasWords(s.words ?? ''))).toBe(true)
    expect(page.sheet!('other')).toBeNull()
  })

  it('goes through the live site with every bot', () => {
    for (const bot of config.live.bots) {
      const run = runBot(pages, bot as Parameters<typeof runBot>[1], config.seed)
      expect(run.finished, bot).toBe(true)
      expect(run.ignoredPointer, bot).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      if (bot === 'keen') for (const b of beats) expect(run.gags, b.id).toContain(b.id)
    }
  })
})
