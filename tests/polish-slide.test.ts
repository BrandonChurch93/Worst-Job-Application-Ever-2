import { beforeAll, describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { Stage } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'
import { TIER_Y } from '../src/table/layout'
import { Machine, prepare } from '../src/table/physics'

// The numbers the director holds in SHOT.slide: the scene's budget of waiting before the bats' power may be cut, the limit of all waiting, and the seconds after a stroke that met the ball in which no cut starts on the floor.
const BUDGET = 5
const LIMIT = 8
const MET = 0.75
const beats = config.film.beats.filter((b) => b.unit === 'pinball')
const dt = 1 / stepHz

const timed = (keys: (n: number) => { flipLeft?: boolean; flipRight?: boolean }): Driver => ({ name: 'bot', input: (v: DriverView) => ({ x: 300, y: 900, down: false, ...keys(v.step) }) as Pointer })
const wander = (seed: number): Driver => {
  const bot = new BotDriver('random', seed)
  return { name: 'bot', input: (v: DriverView) => ({ ...bot.input(v), skip: false }) }
}
// The motion pack's visitor: looks every 4 steps, sees the page's hint 11 looks late, and holds what it saw.
const pack = (seed: number): Driver => {
  const hand = 1500 / stepHz
  const queue: ({ x: number; y: number; left: boolean; right: boolean } | null)[] = []
  let goal: { x: number; y: number } | null = null
  let x = 960
  let y = 540
  let left = false
  let right = false
  return {
    name: 'mouse',
    input: (v: DriverView) => {
      if ((v.step + seed - 1) % 4 === 0) {
        const h = v.turning ? null : v.page.hint()
        queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
        const seen = queue.length > 11 ? queue.shift() : null
        if (seen) {
          goal = seen
          left = seen.left
          right = seen.right
        }
      }
      if (goal) {
        const far = Math.hypot(goal.x - x, goal.y - y)
        if (far <= hand) {
          x = goal.x
          y = goal.y
        } else {
          x += ((goal.x - x) / far) * hand
          y += ((goal.y - y) / far) * hand
        }
      }
      return { x, y, down: false, flipLeft: left, flipRight: right }
    }
  }
}
const VISITORS: [string, number, () => Driver][] = [
  ['never', 1, () => timed(() => ({}))],
  ['held', 1, () => timed(() => ({ flipLeft: true, flipRight: true }))],
  ['flap', 1, () => timed((n) => ({ flipLeft: Math.floor(n / 30) % 2 === 0, flipRight: Math.floor(n / 30) % 2 === 0 }))],
  ['flap', 2, () => timed((n) => ({ flipLeft: Math.floor((n + 37) / 30) % 2 === 0, flipRight: Math.floor((n + 37) / 30) % 2 === 0 }))],
  ['stroke', 1, () => timed((n) => ({ flipLeft: n % 480 < 36, flipRight: n % 480 < 36 }))],
  ['keen', 1, () => new BotDriver('keen', 1)],
  ['clumsy', 1, () => new BotDriver('clumsy', 1)],
  ['wander', 1, () => wander(1)],
  ['wander', 2, () => wander(2)],
  ['pack', 1, () => pack(1)],
  ['pack', 2, () => pack(2)]
]

interface Cut { slid: number; met: number; mouth: boolean; steps: number; tier: number }
interface Facts {
  name: string; tows: string[]; scene: number; page: number; left: boolean; gags: boolean; dead: number; slid: number; cuts: Cut[]; press: number; fresh: Record<string, number>; aged: Record<string, number>; wrong: string[]; held: number
}
const STAMPS = ['scoreAt', 'struck', 'snap']

const visit = (name: string, seed: number, driver: Driver, ages: boolean): Facts => {
  const step = Machine.prototype.step
  const tow = Machine.prototype.tow
  let mc: Machine | null = null
  let inStep = false
  let keys = false
  const f: Facts = { name: `${name} ${seed}`, tows: [], scene: -1, page: -1, left: false, gags: false, dead: 0, slid: 0, cuts: [], press: 0, fresh: {}, aged: {}, wrong: [], held: 0 }
  Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
    mc = this
    keys = l || r
    inStep = true
    const out = step.call(this, l, r)
    inStep = false
    return out
  }
  Machine.prototype.tow = function (this: Machine, i: number, x: number, y: number, speed: number, then: string): void {
    if (!inStep) f.tows.push(then)
    tow.call(this, i, x, y, speed, then)
  }
  try {
    const s = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed })
    let last = -1
    let on = false
    let dead = 0
    let wasCut = false
    let wasSlid = 0
    let was: Record<string, number> | null = null
    while (s.entryIndex === 0 && s.time < 110) {
      s.advance(1)
      const m = mc as Machine | null
      if (!m || m.steps === last) continue
      last = m.steps
      const b = m.balls[0]!
      for (const e of m.events) {
        if (e.name === 'rail-out' && e.id === 'launch') on = true
        if (e.name === 'at-outlet' && f.scene < 0) f.scene = s.time
      }
      if (on && f.scene < 0) {
        dead = b.mode === 'plane' && !m.cut ? 0 : dead + 1
        f.dead = Math.max(f.dead, dead / stepHz)
      }
      if (m.cut && !wasCut) f.cuts.push({ slid: m.slid, met: m.since('met'), mouth: b.mode === 'tow', steps: 0, tier: b.tier })
      if (m.cut) {
        f.cuts[f.cuts.length - 1]!.steps++
        if (keys && m.flip[0] === 0 && m.flip[1] === 0) f.press++
      }
      wasCut = m.cut
      const waited = m.slid > wasSlid + 1e-9
      wasSlid = m.slid
      if (waited) f.held++
      if (ages && waited) {
        const now = (s.page.save() as { s: Record<string, number> }).s
        if (was) {
          if (Math.abs(now['t']! - was['t']!) > 1e-9) f.wrong.push(`the clock moved at ${s.time.toFixed(2)} s`)
          for (const key of STAMPS) {
            const age = now['t']! - now[key]!
            if (Math.abs(age - (was['t']! - was[key]!) - dt) < 1e-9) f.aged[key] = Math.max(f.aged[key] ?? 0, age < 8 ? age : 0)
            else if (age > -1e-9 && age <= dt + 1e-9) f.fresh[key] = (f.fresh[key] ?? 0) + 1
            else f.wrong.push(`${key} neither aged nor was set at ${s.time.toFixed(2)} s`)
          }
        }
        was = now
      } else was = null
    }
    f.slid = wasSlid
    f.left = s.entryIndex === 1
    f.page = s.time
    f.gags = beats.every((x) => s.gagsReached.includes(x.id))
  } finally {
    Machine.prototype.step = step
    Machine.prototype.tow = tow
  }
  return f
}

describe('a beat\'s deadline while the visitor\'s ball is in play', () => {
  const facts: Facts[] = []
  beforeAll(async () => {
    await prepare()
    for (const [name, seed, driver] of VISITORS) facts.push(visit(name, seed, driver(), name === 'flap' || name === 'wander'))
  }, 240000)

  it('tows no ball at a deadline in live play: the director carries the ball to no scoop, no ramp and no gate, whatever the visitor does', () => {
    for (const f of facts) expect([f.name, f.tows]).toEqual([f.name, []])
  })

  it('still ends the scene for everyone: within the scene\'s seconds plus 10, every beat reached, the page left, and no stretch longer than 8 s in which a press does nothing', () => {
    for (const f of facts) {
      expect([f.name, f.left, f.gags]).toEqual([f.name, true, true])
      expect(f.scene).toBeGreaterThan(0)
      expect(f.scene).toBeLessThanOrEqual(config.live.pinball.sceneSeconds + 10)
      expect(f.page).toBeLessThanOrEqual(config.live.pinball.sceneSeconds + config.live.idleSeconds + 2)
      expect(f.dead).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      expect(f.slid).toBeLessThanOrEqual(LIMIT + 1e-6)
    }
  })

  it('waits for a visitor who plays: some deadline is held for more than a second, and a visitor who never presses is held for less than one', () => {
    expect(facts.find((f) => f.name === 'never 1')!.slid).toBeLessThan(1)
    for (const name of ['flap 2', 'wander 2', 'pack 1', 'keen 1']) expect(facts.find((f) => f.name === name)!.slid).toBeGreaterThan(1)
  })

  it('keeps ageing what the page ages from the scene\'s clock while that clock is held: a hit during a wait is set and then grows old', () => {
    const seen = facts.filter((f) => f.name.startsWith('flap') || f.name.startsWith('wander'))
    for (const f of seen) expect([f.name, f.wrong]).toEqual([f.name, []])
    expect(seen.reduce((n, f) => n + f.held, 0)).toBeGreaterThan(4 * stepHz)
    expect(seen.reduce((n, f) => n + (f.fresh['scoreAt'] ?? 0), 0)).toBeGreaterThan(0)
    expect(Math.max(...seen.map((f) => f.aged['scoreAt'] ?? 0))).toBeGreaterThan(0.25)
  })

  it('cuts the bats\' power only when the scene\'s waiting is spent, never on the floor within 0.75 s of a stroke that met the ball, and for less than 2 s', () => {
    const cuts = facts.flatMap((f) => f.cuts)
    expect(cuts.length).toBeGreaterThan(0)
    for (const f of facts) {
      for (const c of f.cuts) {
        expect(c.slid).toBeGreaterThanOrEqual(BUDGET - 1e-6)
        if (!c.mouth) expect(c.met).toBeGreaterThanOrEqual(MET)
        expect(c.steps / stepHz).toBeLessThan(2)
      }
      if (f.slid < BUDGET - 1e-6) expect([f.name, f.cuts.length]).toEqual([f.name, 0])
    }
    for (const name of ['never 1', 'stroke 1', 'clumsy 1', 'wander 1', 'pack 1', 'pack 2']) expect([name, facts.find((f) => f.name === name)!.cuts.length]).toEqual([name, 0])
    expect(facts.find((f) => f.name === 'held 1')!.press).toBeGreaterThan(0)
  })

  it('lets the bats fall and flickers the tier\'s lamps for as long as the power is cut, and obeys the next press at once', () => {
    const m = new Machine()
    m.live = true
    for (let i = 0; i < 12; i++) m.step(true, true)
    expect(m.flip).toEqual([1, 1])
    m.cut = true
    const flashes: number[] = []
    let was = m.last['flash.0'] ?? -1
    for (let i = 0; i < 240; i++) {
      const before = [...m.flip]
      m.step(true, true)
      if (i < 12) expect(m.flip[0]!).toBeLessThan(before[0]!)
      if (i >= 40) expect(m.flip).toEqual([0, 0])
      if ((m.last['flash.0'] ?? -1) !== was) {
        was = m.last['flash.0']!
        flashes.push(i)
      }
    }
    expect(flashes.length).toBeGreaterThanOrEqual(2)
    expect(flashes.length).toBeLessThanOrEqual(4)
    m.cut = false
    for (let i = 0; i < 8; i++) m.step(true, true)
    expect(m.flip).toEqual([1, 1])
    m.free()
  })

  it('has a bat of the machine swing on the step a save throws the ball out of the gate\'s mouth, in live play only: the bat on the side the ball leaves from, up in 8 steps, down again after 12', () => {
    for (const live of [true, false]) {
      const m = new Machine()
      m.live = live
      m.gate = [false, false, false]
      m.toPlane(0, 10, TIER_Y[1]! + 10.4, 0, 2)
      let at = -1
      const seen: number[][] = []
      for (let i = 0; i < 400 && seen.length < 40; i++) {
        const events = m.step(false, false)
        if (at < 0 && events.some((e) => e.name === 'ball-save')) at = i
        if (at >= 0) seen.push([...m.flip])
      }
      expect(at).toBeGreaterThan(0)
      const b = m.balls[0]!
      expect(b.mode).toBe('plane')
      if (!live) {
        expect(seen.every((f) => f[0] === 0 && f[1] === 0)).toBe(true)
        expect(m.own).toEqual([0, 0])
      } else {
        const side = seen[1]![0]! > 0 ? 0 : 1
        expect(seen[1]![side]!).toBeGreaterThan(0)
        expect(seen[1]![1 - side]!).toBe(0)
        expect(seen[8]![side]!).toBe(1)
        expect(seen[12]![side]!).toBe(1)
        expect(seen[39]![side]!).toBe(0)
        expect(seen.every((f) => f[1 - side] === 0)).toBe(true)
        expect(b.vx > 0 ? 0 : 1).toBe(side)
      }
      m.free()
    }
  })

  it('keeps the wait and the cut out of the film: with the switch off the cut does nothing and neither is saved', () => {
    const m = new Machine()
    m.cut = true
    m.slid = 3
    for (let i = 0; i < 17; i++) m.step(true, true)
    expect(m.flip).toEqual([1, 1])
    const saved = m.save()
    expect('cut' in saved).toBe(false)
    expect('slid' in saved).toBe(false)
    expect('own' in saved).toBe(false)
    expect('met' in saved.last).toBe(false)
    m.free()
  })
})
