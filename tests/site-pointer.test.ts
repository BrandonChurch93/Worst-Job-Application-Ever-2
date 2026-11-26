import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { CursorBody, HAND } from '../src/cursor/body'
import { pages } from '../src/pages'
import { careersLayout } from '../src/pages/marketing/layout'
import { boxOf } from '../src/shell/layout'
import { BotDriver, type BotName } from '../src/stage/bots'
import { CLICK_EASE_SECONDS, liveFlow, MouseDriver, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

const ACTING = ['plain', 'confident', 'nervous', 'shocked', 'angry', 'scared', 'proud', 'exhausted'] as const
const FAR = 600
const HALF = stepHz / 2
// What a hand accepts, from the brief of this part: 90% of a 600 px move inside 120 ms, at most 6% past the mark.
const ACCEPTS = { to90Seconds: 0.12, overshoot: 0.06, restSeconds: 0.35 }
const FASTEST = HAND.top / stepHz

function move(hand: boolean, acting: (typeof ACTING)[number]): { to90: number; over: number; rest: number; fastest: number } {
  const c = new CursorBody()
  c.hand = hand
  c.reset(400, 500)
  c.act(acting)
  for (let i = 0; i < stepHz; i++) c.step({ x: 400, y: 500 }, () => undefined, false)
  let to90 = -1
  let peak = 0
  let rest = 0
  let fastest = 0
  let last = c.x
  for (let i = 1; i <= stepHz * 3; i++) {
    c.step({ x: 400 + FAR, y: 500 }, () => undefined, false)
    const d = (c.x - 400) / FAR
    fastest = Math.max(fastest, Math.abs(c.x - last))
    last = c.x
    if (to90 < 0 && d >= 0.9) to90 = i / stepHz
    peak = Math.max(peak, d)
    if (Math.abs(d - 1) * FAR > 1) rest = i / stepHz
  }
  return { to90, over: peak - 1, rest, fastest }
}

describe('site pointer: the weight of the hero under a visitor\'s hand', () => {
  it('covers 90% of a 600 px move inside 120 ms, goes at most 6% past and rests inside 350 ms, whatever it is acting', () => {
    for (const acting of ACTING) {
      const m = move(true, acting)
      expect(m.to90, acting).toBeLessThanOrEqual(ACCEPTS.to90Seconds)
      expect(m.over, acting).toBeLessThanOrEqual(ACCEPTS.overshoot)
      expect(m.over, acting).toBeGreaterThan(0.01)
      expect(m.rest, acting).toBeLessThanOrEqual(ACCEPTS.restSeconds)
      expect(m.fastest, acting).toBeLessThanOrEqual(FASTEST + 1e-6)
    }
    const plain = move(true, 'plain')
    expect(Math.round(plain.to90 * 1000)).toBe(100)
    expect(plain.over).toBeCloseTo(0.026, 2)
  })

  it('leaves the film its own gaits: without the hand every acting state moves as it did', () => {
    const was: Record<string, [number, number]> = { plain: [138, 371], confident: [133, 483], nervous: [242, 388], shocked: [113, 417], angry: [113, 408], scared: [100, 363], proud: [158, 413], exhausted: [633, 1050] }
    for (const acting of ACTING) {
      const m = move(false, acting)
      expect([Math.round(m.to90 * 1000), Math.round(m.rest * 1000)], acting).toEqual(was[acting])
    }
  })

  it('is the hand on the live stage and not on the film stage', () => {
    const live = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new MouseDriver() })
    const film = new Stage({ mode: 'film', flow: liveFlow(), pages, driver: new MouseDriver() })
    expect(live.cursor.hand).toBe(true)
    expect(film.cursor.hand).toBe(false)
  })
})

// A bot whose mouse is taken out of its hand for half a second and parked somewhere else.
class Parked implements Driver {
  readonly name = 'bot' as const
  until = -1
  at = { x: 0, y: 0 }
  constructor(private bot: Driver) {}
  input(v: DriverView): Pointer {
    const p = this.bot.input(v)
    return v.step < this.until ? { x: this.at.x, y: this.at.y - v.scroll, down: false } : p
  }
}

// A keen hand that stands where it is while the turrets of step 1 and the boss of step 4 fire, so that it is hit.
const STANDS: Record<string, number> = { 'step1.firstName': 14, 'boss.slabs': 12, 'boss.popups': 12 }
class Duck implements Driver {
  readonly name = 'bot' as const
  private bot = new BotDriver('keen', config.seed)
  private at = { x: 960, y: 540 }
  private since: Record<string, number> = {}
  input(v: DriverView): Pointer {
    const gag = v.page.gag() ?? ''
    const stands = STANDS[gag]
    if (stands && !v.turning && v.pageTime < (this.since[gag] ??= v.pageTime) + stands) return { ...this.at, down: false }
    const p = this.bot.input(v)
    this.at = { x: p.x, y: p.y }
    return p
  }
}

// In the tug of war the hero has the paper in its hands and the shredder pulls it by the paper: it is not taken, and it is not free.
const HELD_BY_THE_PAPER = 'step1.tug'

interface Place { page: string; why: string; gag: string | null; at: number; fastest: number; away: number; kept: boolean }

function parkedRun(name: BotName | 'duck', everySeconds = 0): { places: Place[]; finished: boolean; seconds: number; ignored: number; fastestFree: number } {
  const d = new Parked(name === 'duck' ? new Duck() : new BotDriver(name, config.seed))
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
  const places: Place[] = []
  let taken = false
  let turning = false
  let air = false
  let hurt = false
  let seen = 0
  let fastestFree = 0
  let before = s.cursor.pose()
  let wasFree = false
  let open: (Place & { last: { x: number; y: number } }) | null = null
  let end = -1
  while (s.time < config.live.botMaxSeconds) {
    if (s.finished && end < 0) end = s.step + stepHz
    if (end >= 0 && s.step >= end) break
    s.advance(1)
    const p = s.cursor.pose()
    const free = !s.cursor.taken && !s.cursor.inAir && !s.cursor.inBall && !s.turning
    // The blow of a hit throws the hero in the step it lands: that step is the hit, not the hand back.
    const blow = s.events.slice(seen).some((e) => e.hitsCursor)
    if (free && wasFree && !blow) fastestFree = Math.max(fastestFree, Math.hypot(p.x - before.x, p.y - before.y))
    wasFree = free
    before = p
    if (open) {
      open.fastest = Math.max(open.fastest, Math.hypot(p.x - open.last.x, p.y - open.last.y))
      open.last = p
      if (!free) open.kept = false
      if (s.step >= d.until) {
        open.away = Math.hypot(p.x - d.at.x, p.y - d.at.y)
        places.push(open)
        open = null
      }
    }
    let why = ''
    if (taken && !s.cursor.taken) why = 'release'
    if (turning && !s.turning) why = 'land'
    if (!why && air && !s.cursor.inAir && !s.turning) why = 'down after a knock'
    if (!why && hurt && !s.cursor.damaged) why = 'whole again'
    for (; seen < s.events.length; seen++) if (s.events[seen]!.hitsCursor && !why) why = `hit ${s.events[seen]!.name}`
    if (!why && everySeconds > 0 && s.step % Math.round(everySeconds * stepHz) === 0) why = 'any moment'
    taken = s.cursor.taken
    turning = s.turning
    air = s.cursor.inAir && !s.turning
    hurt = s.cursor.damaged
    if (why && !open && free) {
      d.at = { x: p.x + (p.x > 960 ? -FAR : FAR), y: p.y }
      d.until = s.step + HALF
      open = { page: s.page.id, why, gag: s.page.gag(), at: s.step / stepHz, fastest: 0, away: 0, kept: true, last: p }
    }
  }
  return { places, finished: s.finished, seconds: s.time, ignored: s.longestIgnored.pointer, fastestFree }
}

describe('site pointer: the hand back', () => {
  const runs = { keen: parkedRun('keen'), clumsy: parkedRun('clumsy'), random: parkedRun('random', 1.7), skipper: parkedRun('skipper', 2.3), duck: parkedRun('duck') }
  const all = Object.values(runs).flatMap((r) => r.places)
  const where = (page: string, why: string, gag?: string): Place[] => all.filter((p) => p.page === page && p.why.startsWith(why) && (!gag || p.gag === gag))

  it('finds every place where a page lets go: the hits and the tug of step 1, the three machines of step 2, every page turn, the ball, the stamp', () => {
    expect(where('step1', 'hit slab-drop').length).toBeGreaterThan(0)
    expect(where('step1', 'release', 'step1.shredded').length).toBeGreaterThan(0)
    expect(where('step2', 'release', 'step2.dial').length).toBeGreaterThan(0)
    expect(where('step2', 'hit coins').length).toBeGreaterThan(0)
    expect(where('step2', 'release', 'step2.crank').length + where('step2', 'release', 'step2.continue').length).toBeGreaterThan(0)
    expect(where('step3', 'release').length).toBeGreaterThan(0)
    for (const page of ['step1', 'step2', 'step3', 'step4', 'step5', 'marketing']) expect(where(page, 'land').length, page).toBeGreaterThan(0)
    expect(where('step4', 'any moment').length).toBeGreaterThan(8)
    expect(where('step1', 'hit bolt-hit').length, 'a turret hit').toBeGreaterThan(0)
    expect(where('step4', 'hit slab-drop').length, 'a boss hit').toBeGreaterThan(3)
    expect(where('step5', 'release').length + where('step5', 'whole again').length, 'the stamp').toBeGreaterThan(0)
    expect(all.length).toBeGreaterThan(120)
  })

  it('never jumps: with the mouse parked 600 px away, no step of the half second after is longer than the fastest step of a free move', () => {
    for (const p of all) expect(p.fastest, `${p.page} ${p.why} at ${p.at.toFixed(2)} s`).toBeLessThanOrEqual(FASTEST + 1e-6)
    for (const [name, r] of Object.entries(runs)) expect(r.fastestFree, name).toBeLessThanOrEqual(FASTEST + 1e-6)
  })

  it('ends on the mouse: half a second after a page lets go the hero is within 2 px of it, unless the page took it again', () => {
    const kept = all.filter((p) => p.kept && p.gag !== HELD_BY_THE_PAPER)
    expect(kept.length).toBeGreaterThan(100)
    for (const p of kept) expect(p.away, `${p.page} ${p.why} ${p.gag} at ${p.at.toFixed(2)} s`).toBeLessThanOrEqual(2)
  })

  it('still finishes every run, and the pointer is never ignored for longer than live.controlTakenMaxSeconds', () => {
    for (const [name, r] of Object.entries(runs)) {
      expect(r.finished, name).toBe(true)
      expect(r.seconds, name).toBeLessThanOrEqual(config.live.botMaxSeconds)
      expect(r.ignored, name).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    }
  })
})

describe('site pointer: a click lands where the hero is', () => {
  const settle = (stage: Stage, mouse: MouseDriver, x: number, y: number, seconds = 1): void => {
    mouse.pointer = { x, y: y - stage.page.scroll(), down: false }
    stage.advance(Math.round(seconds * stepHz))
  }
  const click = (stage: Stage, mouse: MouseDriver, x: number, y: number): void => {
    mouse.pointer = { x, y: y - stage.page.scroll(), down: true }
    stage.advance(1)
    mouse.pointer = { ...mouse.pointer, down: false }
    stage.advance(1)
  }

  it('the Apply button of the careers page: pressed with the hero on it and the mouse 200 px away, not pressed the other way round', () => {
    const { layout } = careersLayout()
    const b = boxOf(layout, 'hero-cta-cap')
    const on = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    const a = new MouseDriver()
    const there = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: a })
    settle(there, a, on.x, on.y)
    expect(Math.hypot(there.cursor.x - on.x, there.cursor.y - on.y)).toBeLessThan(1)
    click(there, a, on.x, on.y - 200)
    there.advance(stepHz * 3)
    expect(there.events.some((e) => e.name === 'button-press')).toBe(true)

    const m = new MouseDriver()
    const away = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: m })
    settle(away, m, on.x, on.y - 200)
    click(away, m, on.x, on.y)
    away.advance(stepHz * 3)
    expect(away.events.some((e) => e.name === 'button-press')).toBe(false)
  })

  it('a perk card: it turns when the hero comes onto it, not when the mouse does', () => {
    const { layout } = careersLayout()
    const card = boxOf(layout, 'perk-1')
    const on = { x: card.x + card.w / 2, y: card.y + card.h / 2 }
    const flips = (s: Stage): number => s.events.filter((e) => e.name === 'card-flip').length
    const m = new MouseDriver()
    const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: m })
    settle(s, m, on.x, card.y - 200)
    expect(flips(s)).toBe(0)
    click(s, m, on.x, on.y)
    expect(Math.abs(s.cursor.y - (card.y - 200))).toBeLessThan(40)
    expect(flips(s)).toBe(0)
    s.advance(stepHz)
    expect(flips(s)).toBe(1)
  })

  it('step 1: a field opens the keyboard and a key types, each with the hero on it and the mouse 200 px away', () => {
    const m = new MouseDriver()
    const s = new Stage({ mode: 'live', flow: liveFlow().slice(1), pages, driver: m })
    const bot = new BotDriver('keen', config.seed)
    const typed = (): string => JSON.stringify(s.page.save())
    let pressed = 0
    let missed = 0
    for (let i = 0; i < 40 * stepHz && pressed < 6; i++) {
      const hint = s.page.hint()
      const p = bot.input({ step: s.step, time: s.time, pageStep: 0, pageTime: s.pageTime, page: s.page, scroll: s.page.scroll(), cursor: s.cursor, turning: s.turning, skipOffered: false })
      if (!hint || !hint.down || !p.down || s.cursor.taken || Math.hypot(s.cursor.x - hint.x, s.cursor.y - hint.y) > 6) {
        m.pointer = { x: p.x, y: p.y, down: false }
        s.advance(1)
        continue
      }
      const before = typed()
      const keys = s.events.filter((e) => e.name === 'key-press' || e.name === 'keyboard-rise').length
      m.pointer = { x: p.x + 200, y: p.y, down: true }
      s.advance(1)
      m.pointer = { x: p.x + 200, y: p.y, down: false }
      s.advance(1)
      if (s.events.filter((e) => e.name === 'key-press' || e.name === 'keyboard-rise').length > keys || typed() !== before) pressed++
      else missed++
      m.pointer = { x: p.x, y: p.y, down: false }
      s.advance(Math.round(0.4 * stepHz))
    }
    expect(pressed).toBe(6)
    expect(missed).toBeLessThanOrEqual(2)
  })

  it('a drag that starts with the click has no jump: the place the page is told eases from the hero to the mouse', () => {
    const seen: { x: number; y: number }[] = []
    const probe = { ...pages }
    const make = pages.marketing!
    probe.marketing = () => {
      const page = make()
      const step = page.step.bind(page)
      page.step = (io) => {
        seen.push({ x: io.pointer.x, y: io.pointer.y })
        step(io)
      }
      return page
    }
    const m = new MouseDriver()
    const s = new Stage({ mode: 'live', flow: liveFlow(), pages: probe, driver: m })
    settle(s, m, 300, 900)
    seen.length = 0
    m.pointer = { x: 500, y: 900 - s.page.scroll(), down: true }
    s.advance(Math.round(CLICK_EASE_SECONDS * stepHz) + 2)
    expect(Math.abs(seen[0]!.x - 300)).toBeLessThan(1)
    expect(seen.at(-1)!.x).toBeCloseTo(500, 6)
    for (let i = 1; i < seen.length; i++) expect(Math.abs(seen[i]!.x - seen[i - 1]!.x)).toBeLessThanOrEqual(200 / (CLICK_EASE_SECONDS * stepHz) + 1e-6)
  })

  it('the film is told the script\'s own pointer, untouched', () => {
    const film = new Stage({ mode: 'film', flow: liveFlow(), pages, driver: new MouseDriver() })
    film.advance(10)
    expect((film as unknown as { lag: { left: number } }).lag.left).toBe(0)
  })
})
