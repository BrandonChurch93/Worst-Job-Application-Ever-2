import { beforeAll, describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type Pointer } from '../src/stage/stage'
import { FLIP, FLIP_REACH, GRAVITY, R, TH, TIER_Y, table } from '../src/table/layout'
import { Machine, prepare } from '../src/table/physics'

const beats = config.film.beats.filter((b) => b.unit === 'pinball')
// The machine page's film every three seconds, as the port's decided change left it in merge 43: the port's own branch gives these 14 values and so does the merged tree.
// Before that change main gave a78db9db, 67595780, 53b15e3d, 92be0fa4, 28fb4385, d8bd0843, bde2c563, 053aaa9a, 5600a8f9, 1900be91, 84a92fe6, c836ba9e, baedfda5, 61fc457c, and this file's own branch gave the same.
// The sixth, seventh and eighth (18, 21 and 24 s) were f235b7d4, f676307c, f011e14b until agent/polish-lamps: at those moments a ball is in reach of a window and the state holds that window's count. With the count left out the state of every frame is as it was (tests/polish-lamps.test.ts).
const MAIN = ['5843b578', '8af59575', '7d7bc7da', '15c63b03', 'afa8fe82', 'f75112a9', '66a8fde5', '8758c1fe', '28d37272', '3072f8fe', '9c015495', '9cc7f685', '31e7a824', '63443663']
const DEG = Math.PI / 180
const bat = table.flippers.find((f) => f.tier === 1 && f.side === 'right')!
const onBat = (along: number): [number, number] => {
  const a = FLIP.rest * DEG
  const d = [-Math.cos(a), Math.sin(a)]
  const n = [-Math.sin(a), -Math.cos(a)]
  const rad = FLIP.radius + ((FLIP.tip - FLIP.radius) * along) / FLIP_REACH
  return [bat.pivot[0] + d[0]! * along + n[0]! * (rad + R + 0.002), bat.pivot[1] + d[1]! * along + n[1]! * (rad + R + 0.002)]
}
const machine = (live: boolean, along = 1.9): Machine => {
  const m = new Machine()
  m.live = live
  const p = onBat(along)
  m.toPlane(0, p[0], p[1], 0, 0)
  m.shot = [10, TIER_Y[1]! + 5.1, 17]
  return m
}

describe('the ball off a visitor\'s flipper', () => {
  beforeAll(async () => {
    await prepare()
  })

  it('leaves the film as it was: the take replayed gives the same state every three seconds', () => {
    const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    const seen: string[] = []
    for (let k = 0; k < 168 && !s.finished; k++) {
      s.advance(60)
      if (k % 12 === 11) seen.push(s.hash())
    }
    expect(seen).toEqual(MAIN)
  })

  it('keeps the set shot at the end of an armed stroke when the switch is off', () => {
    const m = machine(false)
    const names: string[] = []
    for (let i = 0; i < 30; i++) for (const e of m.step(false, true)) names.push(e.name)
    expect(names).toContain('shot')
    expect(m.flip[1]).toBe(1)
    m.free()
  })

  it('reaches the full stroke in 17 steps with the switch off and in 8 with it on, and holds it while the key is held', () => {
    for (const [live, steps] of [[false, 17], [true, 8]] as [boolean, number][]) {
      const m = new Machine()
      m.live = live
      let full = -1
      for (let i = 1; i <= 40; i++) {
        m.step(false, true)
        if (full < 0 && m.flip[1] === 1) full = i
        if (full > 0) expect(m.flip[1]).toBe(1)
      }
      expect(full).toBe(steps)
      m.free()
    }
  })

  it('falls back in 12 steps and bounces once, low, before it lies still, in live play', () => {
    const m = new Machine()
    m.live = true
    for (let i = 0; i < 20; i++) m.step(false, true)
    const seen: number[] = []
    for (let i = 0; i < 40; i++) {
      m.step(false, false)
      seen.push(m.flip[1])
    }
    expect(seen[11]).toBe(0)
    expect(seen.slice(0, 11).every((v) => v > 0)).toBe(true)
    const bounce = seen.slice(12, 22)
    expect(Math.max(...bounce)).toBeGreaterThan(0.05)
    expect(Math.max(...bounce)).toBeLessThanOrEqual(0.1)
    expect(seen.slice(22).every((v) => v === 0)).toBe(true)
    m.free()
  })

  it('lets no set shot replace a visitor\'s stroke, and the ball keeps what the bat gave it but for the slope', () => {
    const m = machine(true)
    const names: string[] = []
    for (let i = 0; i < 9; i++) for (const e of m.step(false, true)) names.push(e.name)
    expect(names).toContain('flipper')
    expect(names).not.toContain('shot')
    let b = m.balls[0]!
    const speed = Math.hypot(b.vx, b.vy)
    expect(speed).toBeGreaterThanOrEqual(30)
    expect(b.vy).toBeLessThan(-25)
    expect(speed * speed).toBeGreaterThan(2 * GRAVITY * (b.y - TIER_Y[1]!))
    expect(speed * speed).toBeGreaterThan(2 * GRAVITY * (b.y - TIER_Y[1]! - TH / 2) * 2)
    for (let i = 0; i < 6; i++) {
      const was = [b.vx, b.vy]
      const events = m.step(false, true)
      b = m.balls[0]!
      if (events.length > 0) break
      expect(b.vx - was[0]!).toBeCloseTo(0, 6)
      expect(b.vy - was[1]!).toBeCloseTo(GRAVITY / stepHz, 4)
    }
    m.free()
  })

  it('throws harder from the middle of the bat than from beside the pivot', () => {
    const out = [0.4, 1.9].map((along) => {
      const m = machine(true, along)
      m.step(false, true)
      const b = m.balls[0]!
      m.free()
      return Math.hypot(b.vx, b.vy)
    })
    expect(out[0]!).toBeGreaterThan(5)
    expect(out[1]!).toBeGreaterThan(out[0]! + 5)
  })

  it('still delivers every beat by its deadline with the flippers never pressed and with both pressed all the time', () => {
    const drivers: Driver[] = [
      { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) as Pointer },
      { name: 'bot', input: (v: { step: number }) => ({ x: 300, y: 900, down: false, flipLeft: Math.floor(v.step / 60) % 2 === 0, flipRight: Math.floor(v.step / 45) % 2 === 0 }) as Pointer }
    ]
    for (const driver of drivers) {
      const s = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed: config.seed })
      while (s.entryIndex === 0 && s.time < 80) s.advance(24)
      expect(s.entryIndex).toBe(1)
      expect(s.gagsReached).toEqual(expect.arrayContaining(beats.map((b) => b.id)))
      expect(s.time).toBeLessThanOrEqual(config.live.pinball.sceneSeconds + config.live.idleSeconds + 2)
      expect(s.events.some((e) => e.name === 'shot')).toBe(false)
      expect(s.events.some((e) => e.name === 'drain')).toBe(true)
    }
  })

  it('has the ball save lob the ball to the scoops and to the ramp in live play: with the flippers never pressed no tow carries it to one of them', () => {
    const tow = Machine.prototype.tow
    const seen: string[] = []
    Machine.prototype.tow = function (this: Machine, i: number, x: number, y: number, speed: number, then: string): void {
      if (then === 'hold:office.inbox' || then === 'hold:street.firehouse' || then === 'rail:highway') seen.push(then)
      tow.call(this, i, x, y, speed, then)
    }
    try {
      const s = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) as Pointer }, seed: config.seed })
      while (s.entryIndex === 0 && s.time < 80) s.advance(24)
      expect(s.entryIndex).toBe(1)
      expect(seen).toEqual([])
      expect(s.gagsReached).toEqual(expect.arrayContaining(beats.map((b) => b.id)))
    } finally {
      Machine.prototype.tow = tow
    }
  })
})
