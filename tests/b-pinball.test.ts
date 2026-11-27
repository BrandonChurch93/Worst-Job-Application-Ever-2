import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { T } from '../src/pages/step3'
import { CLOCK, filmOf } from '../src/pages/step3/clock'
import { FRENZY, RIOT, STRIKE, noted, strikeJolt, strikeOf, strikeShapes } from '../src/pages/step3/strikes'
import { LOOSE, VAC, fight, held, kindAt, leanOf, looseOf } from '../src/pages/step3/vacuum'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type Pointer } from '../src/stage/stage'

const PORT = { x: 1627, y: 520 }
const DT = 1 / stepHz
const film = (() => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const gap: [number, number][] = []
  while (!s.finished && s.time < 43) {
    s.advance(1)
    if (s.time < CLOCK.gone) gap.push([s.time, Math.hypot(s.cursor.x - PORT.x, s.cursor.y - PORT.y)])
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
  it('drags the arrow in, lets it slip four times and claw back after each of the first three, and hooks it on the rim for the last half second', () => {
    expect(held(0)).toBe(0)
    expect(held(VAC.end)).toBeLessThan(0.9)
    expect(held(VAC.end)).toBeGreaterThan(0.7)
    expect(VAC.kinds.length).toBe(VAC.keys.length - 1)
    expect(VAC.kinds.filter((k) => k === 2).length).toBe(4)
    VAC.kinds.forEach((kind, i) => {
      const gain = VAC.keys[i + 1]![1]! - VAC.keys[i]![1]!
      if (kind === 2) expect(gain).toBeGreaterThan(0.1)
      if (kind === 3) expect(gain).toBeLessThan(-0.05)
      if (kind === 2 && i < VAC.kinds.length - 2) expect(VAC.kinds[i + 1]).toBe(3)
    })
    expect(VAC.kinds[VAC.kinds.length - 1]).toBe(5)
    expect(VAC.end - VAC.keys[VAC.keys.length - 2]![0]!).toBeCloseTo(0.5, 6)
    expect(VAC.end / (1 - VAC.stall)).toBeLessThanOrEqual(7)
    expect([0.3, 0.8, 1.4, 2, 3, 5.5].map(kindAt)).toEqual([0, 1, 2, 3, 2, 5])
  })

  it('takes a hand that does nothing in its own length, and a hand that pulls away later, but takes it', () => {
    const still = lost(() => ({ x: 900, y: 520, down: false }))
    expect(still.seconds).toBeCloseTo(VAC.end, 2)
    const away = lost((t) => ({ x: 900 - VAC.hard * 2 * t, y: 520, down: false }))
    expect(away.seconds).toBeGreaterThan(still.seconds + 1)
    expect(away.seconds).toBeLessThanOrEqual(7)
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
    const slip = fight(state, { x, y: 520 }, PORT, DT, VAC.keys[2]![0]! + 0.01)
    expect(slip.began).toBe(true)
    expect(slip.part).toBe(2)
    expect(slip.kind).toBe(2)
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

  it('tears words off the page one after the other and flies each of them to the port', () => {
    const box = { x: 200, y: 200, w: 600 }
    expect(looseOf(0, LOOSE.at[0]! - 0.01, box, PORT)).toBeNull()
    expect(looseOf(0, LOOSE.at[0]! + LOOSE.flight, box, PORT)).toBeNull()
    for (let i = 0; i < LOOSE.at.length; i++) {
      const a = looseOf(i, LOOSE.at[i]!, box, PORT)!
      const b = looseOf(i, LOOSE.at[i]! + LOOSE.flight - 0.01, box, PORT)!
      expect(a.x).toBeGreaterThanOrEqual(box.x)
      expect(a.x).toBeLessThanOrEqual(box.x + box.w)
      expect(Math.hypot(b.x - PORT.x, b.y - PORT.y)).toBeLessThan(30)
      if (i > 0) expect(LOOSE.at[i]!).toBeGreaterThan(LOOSE.at[i - 1]!)
    }
    expect(LOOSE.at[LOOSE.at.length - 1]! + LOOSE.flight).toBeLessThanOrEqual(CLOCK.gone - T.arrive + 0.3)
  })
})

describe('the fight in the film', () => {
  it('tells the port drawing, four slips, the loss and the seal, in that order, and the seal when the clock says the arrow is gone', () => {
    const [on] = times('vacuum-on')
    const slips = times('vacuum-slip')
    const [lose] = times('vacuum-lose')
    const [seal] = times('ball-seal')
    expect(times('vacuum-on').length).toBe(1)
    expect(on).toBeCloseTo(T.arrive, 2)
    expect(slips.length).toBe(4)
    expect(slips[0]!).toBeGreaterThan(on! + 1)
    expect(lose!).toBeGreaterThan(slips[3]! + 0.45)
    expect(seal!).toBeCloseTo(CLOCK.gone, 2)
    expect(seal! - on!).toBeGreaterThan(6)
    expect(seal! - lose!).toBeGreaterThan(0.25)
    const beat = config.film.beats.find((b) => b.id === 'pinball.seal')!
    expect(seal!).toBeLessThan(beat.to)
  })

  it('drags the arrow in, holds it, and after each slip but the last lets it claw back', () => {
    const [on] = times('vacuum-on')
    const slips = times('vacuum-slip')
    const [lose] = times('vacuum-lose')
    expect(gapAt(slips[0]! - 0.05)).toBeLessThan(gapAt(on!) - 100)
    expect(Math.abs(gapAt(slips[0]! - 0.05) - gapAt(slips[0]! - 0.3))).toBeLessThan(25)
    for (let i = 0; i < 4; i++) expect(gapAt(slips[i]! + 0.25)).toBeLessThan(gapAt(slips[i]!) - 60)
    for (let i = 1; i < 4; i++) expect(gapAt(slips[i]! - 0.05)).toBeGreaterThan(gapAt(slips[i - 1]! + 0.35) + 40)
    expect(gapAt(lose!)).toBeGreaterThan(80)
    expect(gapAt(lose!)).toBeLessThan(190)
  })

  it('stops the scene\'s clock for the fight and gives the seconds back in three skipped waits', () => {
    expect(CLOCK.skips.reduce((sum, k) => sum + k[1]!, 0)).toBeCloseTo(CLOCK.gone - CLOCK.stop, 6)
    expect(filmOf(CLOCK.stop)).toBeCloseTo(CLOCK.stop, 6)
    expect(filmOf(CLOCK.stop + 1)).toBeCloseTo(CLOCK.gone + 1, 6)
    expect(filmOf(40)).toBeCloseTo(40, 6)
    expect(times('page-turn')[0]).toBeCloseTo(config.film.units.find((u) => u.id === 'pinball')!.seconds - 0.5, 2)
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
    const away = run((t) => ({ x: Math.max(40, 1100 - VAC.hard * Math.max(0, t - still.on)), y: 620, down: false }))
    expect(away.on).toBeGreaterThan(0)
    expect(away.seal - away.on).toBeGreaterThan(still.seal - still.on + 0.4)
    expect(away.seal - away.on).toBeLessThan(VAC.end / (1 - VAC.stall) + 1.5)
    expect(still.seal - still.on).toBeLessThan(7)
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

  it('opens and shuts twice: in the office when its numbers say, and on the street until the bank has fallen', () => {
    const on = times('frenzy-on')
    const off = times('frenzy-off')
    expect(on.length).toBe(2)
    expect(off.length).toBe(2)
    expect(on[0]!).toBeCloseTo(filmOf(FRENZY.from), 2)
    expect(off[0]!).toBeCloseTo(filmOf(FRENZY.to), 2)
    expect(on[1]!).toBeGreaterThanOrEqual(filmOf(RIOT.from))
    expect(off[1]!).toBeCloseTo(filmOf(RIOT.to), 2)
    expect(off[1]! - on[1]!).toBeGreaterThan(1.5)
  })

  it('hammers the ball at least eight times a second in the office and four on the street, every strike of them as hard as a strike gets', () => {
    const from = filmOf(FRENZY.from)
    const to = filmOf(FRENZY.to)
    const inside = strikes.filter((k) => k.time >= from && k.time < to)
    expect(inside.length).toBeGreaterThanOrEqual(8 * (to - from))
    expect(inside.filter((k) => k.hard === 3).length).toBeGreaterThanOrEqual(inside.length - 2)
    let widest = 0
    for (let i = 1; i < inside.length; i++) widest = Math.max(widest, inside[i]!.time - inside[i - 1]!.time)
    expect(widest).toBeLessThan(0.3)
    const [on, off] = [times('frenzy-on')[1]!, times('frenzy-off')[1]!]
    const street = strikes.filter((k) => k.time >= on && k.time < off)
    expect(street.filter((k) => k.hard === 3).length).toBeGreaterThanOrEqual(4 * (off - on))
    expect(strikes.filter((k) => (k.time < from || k.time >= to) && (k.time < on || k.time >= off)).every((k) => k.hard < 3)).toBe(true)
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
