import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { FLOOR, SOCKET, WAKE_AFTER_TICK } from '../src/boss/plan'
import { GUARD, MERCY, POPUPS_ON } from '../src/boss/tune'
import { makePage } from '../src/pages/step4'
import { ACT, HOLD } from '../src/pages/step4/script'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords } from '../src/shell/words'
import { BotDriver } from '../src/stage/bots'
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

  it('ends the film with the finishing blast: the arrow is hit before the power-down and never after it, fires once, is whole at the press and the page is done', () => {
    const stage = film()
    stage.advance(Math.round((unit.seconds - 0.5) * stepHz))
    const at = (name: string): number => stage.events.find((e) => e.name === name)!.step
    const power = at('power-down')
    expect(at('boss-fall')).toBe(power)
    expect(at('finish-arms')).toBeGreaterThan(power)
    expect(at('finish-charge')).toBeGreaterThan(at('finish-arms'))
    expect((at('finish-fire') - at('finish-charge')) / stepHz).toBeGreaterThan(1)
    expect(at('boss-gone')).toBeGreaterThan(at('finish-fire'))
    expect(at('button-down')).toBeGreaterThan(at('boss-gone'))
    expect(at('button-press')).toBeGreaterThan(at('button-down'))
    expect(Math.abs(at('button-press') - Math.round(ACT.press * stepHz))).toBeLessThanOrEqual(2)
    expect(stage.events.filter((e) => e.name === 'finish-fire').length).toBe(1)
    expect(stage.cursor.damaged).toBe(false)
    expect(stage.page.done()).toBe(true)
    expect(stage.events.filter((e) => e.hitsCursor && e.step >= power)).toEqual([])
    const hits = stage.events.filter((e) => e.hitsCursor)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((e) => e.step < power - 3 * stepHz)).toBe(true)
  })

  it('ends every gag by itself with a still pointer, the fight within its limit after the idle seconds', () => {
    const run = play(live(still))
    expect(run.seconds).toBeLessThan(140)
    for (const b of beats) {
      expect(run.gagSeconds[b.id], b.id).toBeGreaterThan(0)
      expect(run.gagSeconds[b.id], b.id).toBeLessThanOrEqual(config.live.skipLinkAfterSeconds + 3 + (b.id === 'boss.unfold' ? HOLD : 0))
    }
    const fight = run.gagSeconds['boss.slabs']! + run.gagSeconds['boss.popups']! + run.gagSeconds['boss.lastStand']!
    expect(fight).toBeLessThanOrEqual(config.live.idleSeconds + config.live.boss.maxSeconds)
    expect(run.ignored).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    expect(run.damagedAtEnd).toBe(false)
    const down = run.events.find((e) => e.name === 'power-down')!
    expect(run.events.filter((e) => e.hitsCursor && e.time >= down.time)).toEqual([])
    for (const b of beats) expect(run.events.some((e) => e.name === b.event), b.event).toBe(true)
    expect(run.events.filter((e) => e.name === 'boss-slow').length).toBeLessThanOrEqual(1)
  })

  it('does not let a pointer that stands in one place and clicks win in the first minute of the fight, shows it the open side again and again, lets it win by the mercy rule after that, and still ends on a skip', () => {
    const whole = play(live(wrong), 240)
    const lock = whole.events.find((e) => e.name === 'turret-lock')!.time
    const won = whole.events.find((e) => e.name === 'power-down')
    expect(won).toBeDefined()
    expect(won!.time - lock).toBeGreaterThan(MERCY.from - 2)
    expect(won!.time - lock).toBeLessThan(150)
    const run = { ...whole, events: whole.events.filter((e) => e.time < lock + MERCY.from - 2) }
    const glances = run.events.filter((e) => e.name === 'shield-glance').length
    const rounds = run.events.filter((e) => e.name === 'shot-round').length
    expect(glances).toBeGreaterThan(100)
    expect(rounds).toBeLessThan(glances / 20)
    const tells = run.events.filter((e) => e.name === 'weak-tell').map((e) => e.time)
    expect(tells.length).toBeGreaterThan(10)
    for (let i = 1; i < tells.length; i++) expect(tells[i]! - tells[i - 1]!).toBeGreaterThanOrEqual(GUARD.tellEvery - 0.01)
    expect(run.ignored).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    let skip = false
    const stage = live({ name: 'bot', input: (v: DriverView): Pointer => ({ ...wrong.input(v), skip }) })
    while (stage.page.id === 'step4' && stage.time < 40 + HOLD) stage.advance(12)
    expect(stage.page.id).toBe('step4')
    expect(stage.page.gag()).toMatch(/^boss\.(slabs|popups|lastStand)$/)
    skip = true
    const from = stage.time
    while (stage.page.id === 'step4' && stage.time < from + 10) stage.advance(1)
    expect(stage.page.id).not.toBe('step4')
    expect(stage.time - from).toBeLessThan(4)
  })

  it('lets a keen visitor win the fight inside the limit and reach every gag', () => {
    const run = play(live(new BotDriver('keen', config.seed)))
    for (const b of beats) expect(run.gagSeconds[b.id], b.id).toBeGreaterThan(0)
    const fight = run.gagSeconds['boss.slabs']! + run.gagSeconds['boss.popups']! + run.gagSeconds['boss.lastStand']!
    expect(fight).toBeLessThan(config.live.boss.maxSeconds)
    expect(fight).toBeGreaterThan(25)
    expect(run.damagedAtEnd).toBe(false)
    expect(run.events.filter((e) => e.name === 'boss-slow').length).toBeLessThanOrEqual(1)
  })

  it('keeps every phase of the fight on the page for the fastest visitor', () => {
    const run = play(live(keen()))
    expect(run.gagSeconds['boss.slabs']).toBeGreaterThanOrEqual(FLOOR[0] - 0.1)
    expect(run.gagSeconds['boss.popups']).toBeGreaterThanOrEqual(FLOOR[1] - 0.1)
    expect(run.gagSeconds['boss.lastStand']).toBeGreaterThanOrEqual(FLOOR[2] - 0.1)
  })

  it.each([['comes to Submit', true], ['stays away', false]])('breaks the button out when a visitor who has ticked the box %s', (_name, near) => {
    let ticked = false
    const driver: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        const h = v.page.hint()
        if (!ticked && h) return { x: h.x, y: h.y, down: h.down }
        return near ? { x: SOCKET.x, y: SOCKET.y, down: false } : { x: 300, y: 700, down: false }
      }
    }
    const stage = live(driver)
    let tick = -1
    let crack = -1
    while (crack < 0 && stage.time < 30) {
      stage.advance(1)
      if (tick < 0 && stage.events.some((e) => e.name === 'checkbox')) {
        tick = stage.time
        ticked = true
      }
      if (stage.events.some((e) => e.name === 'button-crack')) crack = stage.time
    }
    expect(tick).toBeGreaterThan(0)
    const wait = crack - tick
    if (near) {
      expect(wait).toBeGreaterThanOrEqual(WAKE_AFTER_TICK.near)
      expect(wait).toBeLessThan(WAKE_AFTER_TICK.near + 2)
    } else {
      expect(wait).toBeGreaterThanOrEqual(WAKE_AFTER_TICK.live)
      expect(wait).toBeLessThan(WAKE_AFTER_TICK.live + 1.5)
    }
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

  it('leaves a hole where the button was: below the page, darker than any button, with thin uneven cracks', () => {
    const stage = film()
    stage.seek(12)
    const list: Parameters<typeof stage.page.draw>[0] = []
    stage.page.draw(list)
    const open = list.filter((s) => s.id.startsWith('socket-open'))
    const wells = open.filter((s) => s.kind === 'well')
    expect(wells.length).toBeGreaterThan(0)
    expect(open.filter((s) => s.kind !== 'well' && !s.id.includes('-crack-'))).toEqual([])
    expect(list.some((s) => s.id === 'submit' || s.id === 'submit-cap')).toBe(false)
    for (const w of wells) expect(w.z0).toBeLessThan(0)
    const pit = wells.filter((s) => s.id.includes('-pit-'))
    expect(pit.length).toBeGreaterThan(0)
    for (const w of pit) {
      expect(w.tone).toBe('ink')
      expect(w.z0).toBeLessThan(config.scale.heights.buttonSocket * 4)
    }
    const cracks = open.filter((s) => s.id.includes('-crack-'))
    expect(cracks.length).toBeGreaterThan(8)
    for (const c of cracks) {
      expect(c.h).toBeLessThan(3)
      expect(c.w).toBeLessThan(30)
      expect(c.z1).toBeLessThan(1)
    }
    const first = cracks.filter((s) => s.id.endsWith('-0')).map((s) => Math.round(s.w))
    expect(new Set(first).size).toBeGreaterThan(4)
  })

  it('escalates in the film: glances, the way round, a corner cannon, the hit, the second phase, the big blast, the banner alone, and a fall that speeds up', () => {
    const stage = film()
    stage.advance(Math.round((28 + HOLD) * stepHz))
    const at = (name: string): number[] => stage.events.filter((e) => e.name === name).map((e) => e.step / stepHz)
    const ups = at('popup')
    const fires = at('slab-fire')
    const expired = at('session-expired')[0]!
    const down = at('power-down')[0]!
    expect(at('turret-rise')[0]!).toBeLessThan(at('turret-lock')[0]!)
    expect(at('turret-lock')[0]!).toBeLessThan(at('shield-glance')[0]!)
    expect(at('shield-glance')[0]!).toBeLessThan(at('shot-round')[0]!)
    expect(at('shot-round')[0]!).toBeLessThan(at('cannon-tell')[0]!)
    expect(at('cannon-fire')[0]! - at('cannon-tell')[0]!).toBeGreaterThan(0.8)
    const hits = stage.events.filter((e) => e.hitsCursor).map((e) => e.step / stepHz)
    expect(hits.length).toBe(1)
    expect(hits[0]!).toBeGreaterThan(at('cannon-fire')[0]!)
    expect(at('flatten')).toEqual(hits)
    expect(at('peel-up')[0]! - hits[0]!).toBeGreaterThan(0.5)
    expect(at('boss-heal')[0]!).toBeGreaterThan(hits[0]!)
    expect(at('boss-heal')[0]!).toBeLessThan(at('peel-up')[0]!)
    expect(ups.length).toBe(POPUPS_ON ? 3 : 1)
    expect(ups[0]!).toBeGreaterThan(hits[0]!)
    expect(at('big-fire')[0]! - at('big-tell')[0]!).toBeGreaterThan(1.5)
    expect(at('arena-break')[0]!).toBe(at('big-fire')[0]!)
    expect(at('big-fire')[0]!).toBeLessThan(expired)
    expect(fires.filter((t) => t > expired)).toEqual([])
    expect(ups.filter((t) => t > expired)).toEqual([])
    const struck = at('shot-round').filter((t) => t > expired + 0.8)
    expect(struck.length).toBeGreaterThanOrEqual(17)
    const stands: number[][] = []
    for (const t of at('dart-fire').filter((x) => x > expired)) {
      const last = stands[stands.length - 1]
      if (last && t - last[last.length - 1]! < 0.15) last.push(t)
      else stands.push([t])
    }
    const rate = stands.map((x) => (x.length - 1) / (x[x.length - 1]! - x[0]!))
    expect(rate.length).toBe(3)
    expect(rate[1]!).toBeGreaterThan(rate[0]!)
    expect(rate[2]!).toBeGreaterThan(rate[1]!)
    expect(at('turret-off')[0]!).toBe(down)
    const quiet = film()
    for (let t = expired + 1.6; t < down - 0.05; t += 0.1) {
      quiet.seek(t)
      const f = (quiet.page.save() as { fight: { popups: unknown[] } }).fight
      expect(f.popups.length, `no pop-up at ${t.toFixed(1)}`).toBe(0)
    }
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
