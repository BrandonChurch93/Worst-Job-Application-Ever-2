import { beforeAll, describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { Stage } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'
import { WIRE, movingShapes, wireOn } from '../src/table/draw'
import { BALL, MID, TH, TIERS, TIER_Y } from '../src/table/layout'
import { Machine, SAVE, prepare } from '../src/table/physics'
import { GATE } from '../src/table/real/hardware/tier'

// The save of a ball lost between the bats, on the live site: the shut gate takes the ball on its wire, holds it, draws back and kicks it. Stepped, no browser.
const dt = 1 / stepHz
const SHEET = 8

interface Row { mode: string; tier: number; x: number; v: number; vx: number; vy: number; taken: number; names: string[]; turn: number; gap: number; flip: number[]; own: number[]; state: number[] }

const stateOf = (m: Machine, k: number): number[] => movingShapes(m, [false, false, false], false).find((s) => s.id === `gate.${k}`)!.v!
// The gap in px between the ball's shell and the top wire of the gate as the picture is given it; under 0 the wire is inside the ball.
const gapOf = (m: Machine, k: number): number => {
  const b = m.balls[0]!
  const turn = WIRE.shut + (stateOf(m, k)[1] ?? 0)
  const y = WIRE.tall * Math.sin(turn) + (TH - WIRE.pin - (b.y - TIER_Y[k]!)) * BALL
  const z = WIRE.axle + WIRE.tall * Math.cos(turn) - 0.5 * BALL
  return Math.hypot(y, z) - 0.5 * BALL - WIRE.thick
}
const rowOf = (m: Machine, k: number, names: string[]): Row => {
  const b = m.balls[0]!
  const state = stateOf(m, k)
  return { mode: b.mode, tier: b.tier, x: b.x, v: b.y - TIER_Y[k]!, vx: b.vx, vy: b.vy, taken: m.taken, names, turn: state[1] ?? 0, gap: gapOf(m, k), flip: [...m.flip], own: [...m.own], state }
}
// A ball let go between the bats of tier `k` with nobody at the flippers: every step until `tail` steps after the save.
const lost = (live: boolean, o: { k?: number; x?: number; vx?: number; vy?: number; tail?: number; each?: (m: Machine, n: number) => void } = {}): { rows: Row[]; take: number; kick: number; m: Machine } => {
  const k = o.k ?? 1
  const m = new Machine()
  m.live = live
  m.gate = [false, false, false]
  m.toPlane(0, o.x ?? 10.1, TIER_Y[k]! + 10.2, o.vx ?? 0, o.vy ?? 4)
  const rows: Row[] = [rowOf(m, k, [])]
  let take = -1
  let kick = -1
  for (let n = 1; n < 600 && (kick < 0 || n <= kick + (o.tail ?? 160)); n++) {
    o.each?.(m, n)
    const names = m.step(false, false).filter((e) => e.ball === 0).map((e) => e.name)
    rows.push(rowOf(m, k, names))
    if (take < 0 && names.includes('gate-take')) take = n
    if (kick < 0 && names.includes('ball-save')) kick = n
  }
  return { rows, take, kick, m }
}
const speed = (r: Row): number => Math.hypot(r.vx, r.vy)
const ways: { x: number; vx: number; vy: number }[] = [{ x: 10.1, vx: 0, vy: 4 }, { x: 9.8, vx: 1.3, vy: 6 }, { x: 10.2, vx: -3, vy: 5 }, { x: 9.85, vx: 6, vy: 24 }, { x: 10, vx: 0, vy: 0.5 }]

describe('the save at the gate on the live site', () => {
  beforeAll(async () => {
    await prepare()
  })

  it('holds the wire by the hardware\'s own numbers', () => {
    expect(WIRE.axle).toBe(GATE.pin)
    expect(WIRE.tall).toBe(GATE.tall)
    expect(WIRE.shut).toBe(GATE.shut)
  })

  it('takes the ball on the shut wire and holds it there: from its landing to the kick the wire lies on the ball\'s shell, the ball comes to rest, and the hold is some sheet frames long, not one', () => {
    for (const w of ways) {
      const { rows, take, kick, m } = lost(true, w)
      expect(take, 'taken').toBeGreaterThan(0)
      expect(kick, 'kicked').toBeGreaterThan(take)
      const held = rows.slice(take, kick)
      expect(held.every((r) => r.mode === 'tow')).toBe(true)
      const on = held.filter((r) => r.taken > 0)
      expect(on.length).toBe(SAVE.land + SAVE.wind + SAVE.drive)
      for (const r of on) expect(Math.abs(r.gap), `the gap of shell and wire at ${r.v}`).toBeLessThan(0.01)
      expect(on.length / SHEET).toBeGreaterThanOrEqual(6)
      expect(on.length / SHEET).toBeLessThanOrEqual(8)
      expect(kick - take).toBeLessThanOrEqual(on.length + 2 * SHEET)
      const still = on.slice(SAVE.land + SAVE.wind - SAVE.still + 1, SAVE.land + SAVE.wind)
      for (const r of still) {
        expect(speed(r), 'the ball lies still on the wire').toBeLessThan(0.6)
        expect(Math.abs(r.v - SAVE.rest - SAVE.back)).toBeLessThan(0.02)
        expect(Math.abs(r.x - MID)).toBeLessThan(0.03)
      }
      expect(Math.max(...on.slice(0, SAVE.land).map((r) => r.turn)), 'the wire gives under the ball').toBeGreaterThan(wireOn(SAVE.rest))
      expect(wireOn(SAVE.rest)).toBeGreaterThan(0.1)
      m.free()
    }
  })

  it('never moves the ball further in a step than its own speed allows, from the step before the take to the step after the kick', () => {
    for (const k of [0, 1, 2]) for (const w of ways) {
      const { rows, take, kick, m } = lost(true, { ...w, k })
      expect(kick).toBeGreaterThan(take)
      for (let n = take; n <= kick + 1; n++) {
        const was = rows[n - 1]!
        const now = rows[n]!
        expect(Math.hypot(now.x - was.x, now.v - was.v), `step ${n - take} of the save`).toBeLessThanOrEqual(Math.max(speed(was), speed(now)) * dt + 1e-9)
      }
      m.free()
    }
  })

  it('draws back with the ball on the wire for the wind-up, more than a sheet frame of it, and stands still before the kick', () => {
    const { rows, take, kick, m } = lost(true)
    const landed = rows.findIndex((r, n) => n >= take && r.taken > 0)
    const wind = rows.slice(landed + SAVE.land, landed + SAVE.land + SAVE.wind)
    expect(wind.length / SHEET).toBeGreaterThanOrEqual(3)
    for (let n = 1; n < wind.length; n++) expect(wind[n]!.v).toBeGreaterThanOrEqual(wind[n - 1]!.v - 1e-9)
    const drawn = wind.at(-1)!
    expect(drawn.v - SAVE.rest).toBeGreaterThan(0.85 * SAVE.back)
    expect(drawn.v - SAVE.rest).toBeLessThanOrEqual(SAVE.back)
    expect(speed(drawn)).toBeLessThan(1)
    expect(drawn.turn - wireOn(SAVE.rest), 'the wire turns back with the ball').toBeGreaterThan(0.4)
    expect(kick - (landed + SAVE.land + SAVE.wind)).toBe(SAVE.drive)
    m.free()
  })

  it('kicks on one step: the ball is on the wire where it lay, the tier\'s lamp fires, the ball leaves up the table at the kicker\'s speed and is a ball away within two sheet frames, and the wire is thrown up and rings to a stop', () => {
    for (const w of ways) {
      const { rows, kick, m } = lost(true, w)
      const at = rows[kick]!
      expect(at.mode).toBe('plane')
      expect(Math.abs(at.v - SAVE.rest)).toBeLessThan(1e-6)
      expect(Math.abs(at.x - MID)).toBeLessThan(0.02)
      expect(Math.abs(at.gap)).toBeLessThan(0.01)
      expect(at.vy).toBe(-SAVE.kick)
      expect(Math.abs(at.vx)).toBe(1.2)
      expect(rows[kick - 1]!.vy, 'the wire drives the ball up to the kick').toBeLessThan(-0.75 * SAVE.kick)
      expect(rows[kick - 1]!.v, 'on the kick\'s step the ball does not move: it sits on the wire').toBe(at.v)
      expect(m.last['flash.1']).toBe(m.last[`ball-save:${TIERS[1]}.gate`])
      expect(m.steps - m.last['flash.1']!).toBe(rows.length - kick)
      expect(at.v - rows[kick + 2 * SHEET]!.v).toBeGreaterThan(1)
      const after = rows.slice(kick + 1)
      for (const r of after) expect(r.gap, 'the wire is never inside the ball').toBeGreaterThan(-0.01)
      expect(Math.min(...after.slice(0, SHEET).map((r) => r.turn))).toBe(-WIRE.snap)
      expect(after.slice(SHEET, 3 * SHEET).some((r) => r.turn > 0.05), 'the wire swings back past its rest').toBe(true)
      expect(after[Math.ceil(WIRE.seconds * stepHz)]!.turn).toBe(0)
      expect(after.at(-1)!.state).toEqual([0, 0, 0])
      m.free()
    }
  })

  it('swings no bat of the machine at a save: with nobody at the flippers both bats lie at rest from the take until the ball is gone', () => {
    for (const w of ways) {
      const { rows, take, m } = lost(true, w)
      for (const r of rows.slice(take)) {
        expect(r.flip).toEqual([0, 0])
        expect(r.own).toEqual([0, 0])
      }
      m.free()
    }
  })

  it('throws the ball by the director\'s aimed lob when there is one, from where the ball lies', () => {
    const plain = lost(true)
    const aimed = lost(true, { each: (m) => { m.mark = [8, TIER_Y[1]! + 6, 20.5, 1] } })
    const at = aimed.rows[aimed.kick]!
    expect(aimed.kick).toBe(plain.kick)
    expect(Math.abs(at.v - SAVE.rest)).toBeLessThan(1e-6)
    expect(at.vy).toBeLessThan(0)
    expect(at.vx).toBeLessThan(-1.2)
    expect(Math.hypot(at.vx, at.vy)).toBeCloseTo(20.5, 6)
    plain.m.free()
    aimed.m.free()
  })

  it('lets the ball through when the gate opens under it: no kick on that tier, the ball goes down the hole by its tow', () => {
    const { rows, take, kick, m } = lost(true, { each: (m, n) => { if (n === 40) m.gate[1] = true } })
    expect(take).toBeGreaterThan(0)
    expect(take).toBeLessThan(40)
    const left = rows.findIndex((r) => r.tier === 2)
    expect(left).toBeGreaterThan(40)
    expect(kick).toBeGreaterThan(left)
    expect(rows[40]!.mode).toBe('tow')
    expect(rows.slice(40, left).every((r) => r.taken === -1 && r.state[0] === 1 && r.state[1] === 0)).toBe(true)
    for (let n = 41; n < left && rows[n]!.mode === 'tow'; n++) expect(Math.hypot(rows[n]!.x - rows[n - 1]!.x, rows[n]!.v - rows[n - 1]!.v)).toBeLessThanOrEqual(Math.max(12, speed(rows[n - 1]!)) * dt + 1e-9)
    m.free()
  })

  it('leaves the gate at rest as it was drawn: shut or open, with no ball near, the wire has no turn of its own', () => {
    const m = new Machine()
    m.live = true
    m.gate = [false, true, false]
    m.toPlane(0, 6, TIER_Y[1]! + 4, 0, 0)
    for (let n = 0; n < 30; n++) m.step(false, false)
    expect(stateOf(m, 0)).toEqual([0, 0, 0])
    expect(stateOf(m, 1)).toEqual([1, 0, 0])
    expect(stateOf(m, 2)).toEqual([0, 0, 0])
    m.free()
  })

  it('has the wire carry the ball\'s load in live play only: none before the landing, whole within a sheet frame of it and through the hold to the kick, gone again when the wire has rung out', () => {
    for (const w of ways) {
      const { rows, take, kick, m } = lost(true, w)
      const land = rows.findIndex((r) => r.taken > 0)
      expect(land).toBeGreaterThan(take)
      for (let n = 0; n < land; n++) expect(rows[n]!.state[2]).toBe(0)
      for (let n = land; n < land + WIRE.gleam; n++) expect(rows[n]!.state[2]!).toBeGreaterThan(rows[n - 1]!.state[2]!)
      for (let n = land + WIRE.gleam - 1; n < kick; n++) expect(rows[n]!.state[2]).toBe(1)
      for (let n = kick + 1; n < kick + WIRE.seconds * stepHz; n++) expect(rows[n]!.state[2]!).toBeLessThan(rows[n - 1]!.state[2]!)
      for (let n = kick + Math.ceil(WIRE.seconds * stepHz) + 1; n < rows.length; n++) expect(rows[n]!.state[2]).toBe(0)
      m.free()
    }
  })

  it('leaves film mode as it was: with the switch off the gate takes nothing, the ball is towed to the hole and put back at the mouth as before, and nothing of the take is drawn or saved', () => {
    for (const w of ways) {
      const { rows, take, kick, m } = lost(false, w)
      expect(take).toBe(-1)
      expect(kick).toBeGreaterThan(0)
      expect(rows.every((r) => r.taken === -1 && r.state.length === 1 && r.state[0] === 0)).toBe(true)
      const at = rows[kick]!
      expect([at.x, Math.abs(at.vx), at.vy]).toEqual([MID, 1.2, -24])
      expect(at.v).toBeCloseTo(10.55, 9)
      expect(rows[kick - 1]!.mode).toBe('tow')
      expect(rows[kick - 1]!.v).toBeGreaterThan(10.9)
      expect('taken' in m.save()).toBe(false)
      m.free()
    }
  })

  it('holds through a whole visit with nobody at the flippers: every save is a take, a hold and a kick, the landing is heard by the cue a blow on the ball has, and the scene still ends', () => {
    let mc: Machine | null = null
    const step = Machine.prototype.step
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      return step.call(this, l, r)
    }
    try {
      const driver: Driver = { name: 'bot', input: (_v: DriverView) => ({ x: 300, y: 900, down: false }) as Pointer }
      const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed: 1 })
      let last = -1
      let was: { x: number; y: number; s: number } | null = null
      let from = -1
      const holds: number[] = []
      let other = 0
      let heard = 0
      while (stage.entryIndex === 0 && stage.time < 110) {
        const before = stage.events.length
        stage.advance(1)
        const m = mc as Machine | null
        if (!m || m.steps === last) continue
        last = m.steps
        if (m.events.some((e) => e.name === 'gate-take')) {
          expect(stage.events.slice(before).some((e) => e.name === 'flasher' && e.hitsCursor)).toBe(true)
          heard++
        }
        const b = m.balls[0]!
        const now = { x: b.x, y: b.y, s: Math.hypot(b.vx, b.vy) }
        const kicked = m.events.some((e) => e.name === 'ball-save' && e.ball === 0)
        if (m.events.some((e) => e.name === 'gate-take')) from = m.steps
        if (was && (from >= 0 || kicked)) expect(Math.hypot(now.x - was.x, now.y - was.y)).toBeLessThanOrEqual(Math.max(was.s, now.s) * dt + 1e-9)
        if (from >= 0 && m.taken > 0) expect(Math.abs(gapOf(m, b.tier))).toBeLessThan(0.01)
        if (from >= 0) expect(m.own).toEqual([0, 0])
        if (kicked) {
          if (from < 0) other++
          else holds.push(m.steps - from)
          from = -1
        }
        was = now
      }
      expect(other).toBe(0)
      expect(heard).toBeGreaterThanOrEqual(holds.length)
      expect(holds.length).toBeGreaterThanOrEqual(3)
      expect(Math.min(...holds)).toBeGreaterThanOrEqual(SAVE.land + SAVE.wind + SAVE.drive)
      expect(Math.max(...holds)).toBeLessThanOrEqual(SAVE.land + SAVE.wind + SAVE.drive + 3 * SHEET)
      expect(stage.time).toBeLessThan(64)
    } finally {
      Machine.prototype.step = step
    }
  })
})
