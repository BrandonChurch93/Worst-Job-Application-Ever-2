import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { T } from '../src/pages/step3'
import { FRENZY, STRIKE, noted, strikeJolt, strikeOf, strikeShapes } from '../src/pages/step3/strikes'
import { VAC, fight, held, leanOf, partAt } from '../src/pages/step3/vacuum'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type Pointer } from '../src/stage/stage'

const PORT = { x: 1627, y: 520 }
const DT = 1 / stepHz
const film = (() => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const gap: [number, number][] = []
  while (!s.finished && s.time < 43) {
    s.advance(1)
    if (s.time < T.seal) gap.push([s.time, Math.hypot(s.cursor.x - PORT.x, s.cursor.y - PORT.y)])
  }
  return { gap, events: s.events.map((e) => ({ name: e.name, time: e.step / stepHz })) }
})()
const times = (name: string): number[] => film.events.filter((e) => e.name === name).map((e) => e.time)
const gapAt = (t: number): number => film.gap[Math.round(t * stepHz) - 1]![1]

const lost = (hand: (t: number) => Pointer): { seconds: number; nearest: number[] } => {
  let state = [0, 0, hand(0).x, hand(0).y, -1]
  const nearest: number[] = []
  for (let n = 1; n < 20 * stepHz; n++) {
    const h = hand(n * DT)
    const f = fight(state, h, PORT, DT, -1)
    state = f.state
    nearest.push(Math.hypot(f.x - h.x, f.y - h.y))
    if (f.lost) return { seconds: n * DT, nearest }
  }
  return { seconds: Infinity, nearest }
}

describe('the fight with the port', () => {
  it('holds the arrow further in at each part, with two slips, and never the whole way before the end', () => {
    expect(held(0)).toBe(0)
    expect(held(VAC.end)).toBeLessThan(0.9)
    expect(held(VAC.end)).toBeGreaterThan(0.7)
    for (const at of VAC.slips) {
      expect(held(at + 0.2) - held(at)).toBeGreaterThan(0.15)
      expect(held(at) - held(at - 0.2)).toBeLessThan(0.05)
    }
    for (let t = DT; t <= VAC.end; t += DT) expect(held(t)).toBeGreaterThanOrEqual(held(t - DT) - 1e-9)
    expect([0.3, 0.8, 1.1, 1.5, 1.9, 2.2].map(partAt)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('takes a hand that does nothing in its own length, and a hand that pulls away later, but takes it', () => {
    const still = lost(() => ({ x: 900, y: 520, down: false }))
    expect(still.seconds).toBeCloseTo(VAC.end, 2)
    const away = lost((t) => ({ x: 900 - VAC.hard * 2 * t, y: 520, down: false }))
    expect(away.seconds).toBeGreaterThan(still.seconds + 1)
    expect(away.seconds).toBeLessThanOrEqual(VAC.end / (1 - VAC.stall) + 0.01)
    const at = Math.round(0.9 * stepHz)
    expect(away.nearest[at]!).toBeLessThan(still.nearest[at]!)
  })

  it('wins a pulling hand ground back and loses it again when the arrow slips', () => {
    let state = [0, 0, 900, 520, -1]
    let x = 900
    let won = 0
    for (let n = 0; n < 0.9 * stepHz; n++) {
      x -= VAC.hard * DT
      state = fight(state, { x, y: 520 }, PORT, DT, 0.7).state
      won = Math.max(won, state[1]!)
    }
    expect(won).toBeGreaterThan(0.2)
    expect(won).toBeLessThanOrEqual(VAC.gripMost)
    const slip = fight(state, { x, y: 520 }, PORT, DT, VAC.slips[0]! + 0.01)
    expect(slip.began).toBe(true)
    expect(slip.part).toBe(2)
    expect(slip.state[1]).toBe(0)
  })

  it('leans the words of the page toward the port, further with the pull', () => {
    const box = { x: 200, y: 200, w: 400, h: 40 }
    const a = leanOf(box, PORT, 0.5, 0, 0)
    const b = leanOf(box, PORT, 1, 0, 0)
    expect(a.x).toBeGreaterThan(box.x)
    expect(b.x - box.x).toBeCloseTo(2 * (a.x - box.x), 6)
    expect(b.y).toBeGreaterThan(box.y)
    expect(Math.abs(b.rot)).toBeGreaterThan(Math.abs(a.rot))
  })
})

describe('the fight in the film', () => {
  it('tells the port drawing, two slips, the loss and the seal, in that order, and the seal at 3.3 s', () => {
    const [on] = times('vacuum-on')
    const slips = times('vacuum-slip')
    const [lose] = times('vacuum-lose')
    const [seal] = times('ball-seal')
    expect(on).toBeCloseTo(T.arrive, 2)
    expect(slips.length).toBe(2)
    expect(slips[0]!).toBeGreaterThan(on! + 0.5)
    expect(lose!).toBeGreaterThan(slips[1]! + 0.3)
    expect(seal!).toBeCloseTo(3.3, 2)
    expect(seal! - lose!).toBeGreaterThan(0.25)
    const beat = config.film.beats.find((b) => b.id === 'pinball.seal')!
    expect(seal!).toBeLessThan(beat.to)
  })

  it('drags the arrow in, holds it, lets it slip, lets it claw back and takes it', () => {
    const [on] = times('vacuum-on')
    const slips = times('vacuum-slip')
    const [lose] = times('vacuum-lose')
    expect(gapAt(slips[0]! - 0.05)).toBeLessThan(gapAt(on!) - 150)
    expect(Math.abs(gapAt(slips[0]! - 0.05) - gapAt(slips[0]! - 0.3))).toBeLessThan(25)
    expect(gapAt(slips[0]! + 0.25)).toBeLessThan(gapAt(slips[0]!) - 100)
    expect(gapAt(slips[1]! - 0.05)).toBeGreaterThan(gapAt(slips[0]! + 0.25) + 60)
    expect(gapAt(slips[1]! + 0.25)).toBeLessThan(gapAt(slips[1]!) - 150)
    expect(gapAt(lose!)).toBeGreaterThan(70)
    expect(gapAt(lose!)).toBeLessThan(160)
  })
})

describe('the fight on the live site', () => {
  const run = (hand: (t: number) => Pointer): { on: number; seal: number; drift: number } => {
    const driver: Driver = { name: 'bot', input: () => hand(clock.t) }
    const clock = { t: 0 }
    const s = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed: config.seed })
    let drift = 0
    while (s.time < 14 && !s.events.some((e) => e.name === 'ball-seal')) {
      s.advance(1)
      clock.t = s.time
      if (s.events.some((e) => e.name === 'vacuum-on')) drift = Math.max(drift, Math.hypot(s.cursor.x - hand(s.time).x, s.cursor.y - hand(s.time).y))
    }
    const at = (name: string): number => (s.events.find((e) => e.name === name)?.step ?? -stepHz) / stepHz
    return { on: at('vacuum-on'), seal: at('ball-seal'), drift }
  }

  it('draws the arrow off a hand that is held still, and takes it', () => {
    const r = run(() => ({ x: 1100, y: 620, down: false }))
    expect(r.on).toBeGreaterThan(0)
    expect(r.drift).toBeGreaterThan(200)
    expect(r.seal).toBeGreaterThan(r.on + VAC.end)
    expect(r.seal).toBeLessThan(r.on + VAC.end + 1.5)
  })

  it('lets a hand that pulls away last longer, and takes it all the same', () => {
    const still = run(() => ({ x: 1100, y: 620, down: false }))
    const away = run((t) => ({ x: Math.max(40, 1100 - 420 * Math.max(0, t - still.on)), y: 620, down: false }))
    expect(away.on).toBeGreaterThan(0)
    expect(away.seal - away.on).toBeGreaterThan(still.seal - still.on + 0.4)
    expect(away.seal - away.on).toBeLessThan(VAC.end / (1 - VAC.stall) + 1.5)
  })
})

describe('the strikes', () => {
  const e = (name: string, id: string, ball = 0) => ({ name, id, ball, x: 10, y: 20 })

  it('says how hard each kind of hit is and what it throws out', () => {
    expect(strikeOf(e('bumper', 'office.bumper.1'), false)).toEqual({ id: 'office.bumper.1', hard: 2, loot: 1 })
    expect(strikeOf(e('bumper', 'office.bumper.1'), true)).toEqual({ id: 'office.bumper.1', hard: 3, loot: 1 })
    expect(strikeOf(e('sling', 'office.sling.left'), false)).toEqual({ id: 'office.sling.left', hard: 1, loot: 0 })
    expect(strikeOf(e('sling', 'office.sling.left'), true)).toEqual({ id: 'office.sling.left', hard: 3, loot: 1 })
    expect(strikeOf(e('drop-target', 'office.cubicles.drop.2'), false)!.loot).toBe(2)
    expect(strikeOf(e('scoop-kick', 'street.firehouse'), false)!.loot).toBe(1)
    expect(strikeOf(e('rebound', 'office.rail'), true)).toEqual({ id: 'office.rail', hard: 3, loot: 0 })
    expect(strikeOf(e('bumper', 'office.bumper.1', 2), true)).toEqual({ id: 'office.bumper.1', hard: 1, loot: 0 })
    expect(strikeOf(e('tier-fall', 'office'), false)).toBeNull()
  })

  it('keeps the last strikes in a ring, draws each while it lasts and jolts the picture by the hard ones', () => {
    let ring: number[] | undefined
    for (let i = 0; i < STRIKE.ring + 5; i++) ring = noted(ring, i * 0.1, e('bumper', 'office.bumper.1'), { id: 'office.bumper.1', hard: 3, loot: 1 })
    expect(ring!.length).toBe(STRIKE.ring * STRIKE.each)
    expect(ring![ring!.length - STRIKE.each]).toBe(STRIKE.ring + 5)
    const now = (STRIKE.ring + 4) * 0.1
    const shapes = strikeShapes(ring, now + 0.01)
    expect(shapes.length).toBeGreaterThan(0)
    expect(shapes.every((s) => s.part === 'table-lights' && s.v!.length === 4)).toBe(true)
    expect(strikeShapes(ring, now + STRIKE.seconds + 0.1)).toEqual([])
    const j = strikeJolt(ring, now + 0.02)
    expect(Math.hypot(j.x, j.y)).toBeGreaterThan(0)
    const later = strikeJolt(ring, now + 1)
    expect(Math.hypot(later.x, later.y)).toBe(0)
    expect(strikeJolt(undefined, 1)).toEqual({ x: 0, y: 0 })
  })
})

describe('the frenzy in the film', () => {
  const strikes = film.events.filter((e) => e.name.startsWith('strike:')).map((e) => ({ time: e.time, id: e.name.split(':')[1]!, hard: Number(e.name.split(':')[2]) }))

  it('opens and shuts when its numbers say, inside the two beats of the office', () => {
    expect(times('frenzy-on')).toEqual([FRENZY.from])
    expect(times('frenzy-off')).toEqual([FRENZY.to])
  })

  it('hammers the ball at least eight times a second, every strike of them as hard as a strike gets', () => {
    const inside = strikes.filter((k) => k.time >= FRENZY.from && k.time < FRENZY.to)
    expect(inside.length).toBeGreaterThanOrEqual(8 * (FRENZY.to - FRENZY.from))
    expect(inside.filter((k) => k.hard === 3).length).toBeGreaterThanOrEqual(inside.length - 2)
    let widest = 0
    for (let i = 1; i < inside.length; i++) widest = Math.max(widest, inside[i]!.time - inside[i - 1]!.time)
    expect(widest).toBeLessThan(0.3)
    expect(strikes.filter((k) => k.time < FRENZY.from || k.time >= FRENZY.to).every((k) => k.hard < 3)).toBe(true)
  })

  it('names in every strike a thing of the table and a hardness from 1 to 3, and tells of loot only with a strike', () => {
    for (const k of strikes) {
      expect(k.id.length).toBeGreaterThan(0)
      expect([1, 2, 3]).toContain(k.hard)
    }
    const at = new Set(film.events.filter((e) => e.name.startsWith('strike:')).map((e) => Math.round(e.time * stepHz)))
    for (const t of times('loot')) expect(at.has(Math.round(t * stepHz))).toBe(true)
    expect(times('loot').length).toBeGreaterThan(20)
  })
})
