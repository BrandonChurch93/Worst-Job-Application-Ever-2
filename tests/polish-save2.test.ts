import { createHash } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { Driver, Pointer } from '../src/stage/types'
import { WIRE, movingShapes } from '../src/table/draw'
import { BALL, TH, TIER_Y } from '../src/table/layout'
import { Machine, SAVE, prepare } from '../src/table/physics'
import { bridge } from '../src/pages/step3/video/bridge'

bridge.off = true

// The save at a shut gate as round 25's motion critic asked for it: a landing with weight, an arrow that does not turn in a ball that lies still, a load that is seen, a wire that rings out once, a view that goes to its place and stands. Stepped, no browser.
const EACH = stepHz / 60
// The save as it was before this work (commit 308e96a1): a hash of the steps of the take and of the kick, the ball's state on the kick's step and on the 40 steps after it, for the five ways on both tiers (pipeline/phase5/polish-save2-kick.mjs prints it);
// and the film's pinball take, the machine's events as a count and a hash of their names, balls and steps.
const WAS = { kick: 'f70e33781433fead1e97b4a290ffae1ef603ea9efb78b76effd17dd8757a92e7', steps: [[8, 74], [6, 70], [7, 72], [2, 61], [21, 90]], events: 99, hash: '134cb0eeff6f3dd587ac995f04449b167036a9984b06e315d196d65d7b7bffc8' }

interface Row { y: number; taken: number; names: string[]; turn: number; gap: number; flip: number[]; own: number[]; state: number[] }

const stateOf = (m: Machine, k: number): number[] => movingShapes(m, [false, false, false], false).find((s) => s.id === `gate.${k}`)!.v!
const gapOf = (m: Machine, k: number): number => {
  const b = m.balls[0]!
  const turn = WIRE.shut + (stateOf(m, k)[1] ?? 0)
  const y = WIRE.tall * Math.sin(turn) + (TH - WIRE.pin - (b.y - TIER_Y[k]!)) * BALL
  const z = WIRE.axle + WIRE.tall * Math.cos(turn) - 0.5 * BALL
  return Math.hypot(y, z) - 0.5 * BALL - WIRE.thick
}
// How far down the table the top wire stands from its rest place, px.
const down = (turn: number): number => WIRE.tall * (Math.sin(WIRE.shut + turn) - Math.sin(WIRE.shut))
const ways = [{ x: 10.1, vx: 0, vy: 4 }, { x: 9.8, vx: 1.3, vy: 6 }, { x: 10.2, vx: -3, vy: 5 }, { x: 9.85, vx: 6, vy: 24 }, { x: 10, vx: 0, vy: 0.5 }]
const lost = (live: boolean, k: number, w: { x: number; vx: number; vy: number }): { rows: Row[]; take: number; kick: number; trail: number[][] } => {
  const m = new Machine()
  m.live = live
  m.gate = [false, false, false]
  m.toPlane(0, w.x, TIER_Y[k]! + 10.2, w.vx, w.vy)
  const row = (names: string[]): Row => {
    const state = stateOf(m, k)
    return { y: (m.balls[0]!.y - TIER_Y[k]!) * BALL, taken: m.taken, names, turn: state[1] ?? 0, gap: gapOf(m, k), flip: [...m.flip], own: [...m.own], state }
  }
  const rows: Row[] = [row([])]
  const trail: number[][] = []
  let take = -1
  let kick = -1
  for (let n = 1; n < 700 && (kick < 0 || n <= kick + 80); n++) {
    const names = m.step(false, false).filter((e) => e.ball === 0).map((e) => e.name)
    rows.push(row(names))
    if (take < 0 && names.includes('gate-take')) take = n
    if (kick < 0 && names.includes('ball-save')) kick = n
    const b = m.balls[0]!
    if (kick >= 0 && n <= kick + 40) trail.push([b.x, b.y, b.vx, b.vy])
  }
  m.free()
  return { rows, take, kick, trail }
}
// The turning points of a run of numbers: each place where it stops rising or stops falling.
const turns = (v: number[]): number[] => {
  const out: number[] = []
  for (let n = 1; n < v.length - 1; n++) if ((v[n]! - v[n - 1]!) * (v[n + 1]! - v[n]!) < 0) out.push(v[n]!)
  return out
}

describe('the save at the gate, with weight', () => {
  beforeAll(async () => {
    await prepare()
  })

  it('lets the wire give under the landing ball: the ball rides it down for a frame or more, comes up again by more than 3 px and by less each time, and the wire lies on its shell all the while', () => {
    for (const k of [0, 1]) for (const w of ways) {
      const { rows, take } = lost(true, k, w)
      const touch = rows.findIndex((r, n) => n >= take && r.taken === 1)
      const land = rows.slice(touch - 1, touch + SAVE.land)
      const rest = SAVE.rest * BALL
      const y = land.map((r) => r.y)
      const deep = Math.max(...y)
      const at = y.indexOf(deep)
      expect(deep - rest, 'the give of the wire under the ball, px').toBeGreaterThanOrEqual(8)
      expect(deep - rest, 'no deeper than the load').toBeLessThanOrEqual(SAVE.back * BALL)
      expect(at - 1, 'steps the ball rides the wire down').toBeGreaterThanOrEqual(EACH)
      expect(y[2]! - y[1]!, 'the ball does not stop on the step it touches').toBeGreaterThan(0.2)
      const ends = turns(y.slice(at - 1))
      expect(ends.length).toBeGreaterThanOrEqual(2)
      expect(ends[0]! - ends[1]!, 'the first swing up, px').toBeGreaterThan(3)
      expect(ends[0]! - ends[1]!).toBeLessThan(deep - rest)
      for (let n = 2; n < ends.length; n++) expect(Math.abs(ends[n]! - ends[n - 1]!), `swing ${n}`).toBeLessThan(Math.abs(ends[n - 1]! - ends[n - 2]!))
      for (const r of land.slice(1)) expect(Math.abs(r.gap), 'gap of shell and wire, px').toBeLessThan(0.01)
    }
  })

  it('draws the wire down with the ball before the throw by 4 px or more over 3 to 6 frames, stands dead still for 2 frames or more, drives and throws on the next step, from the same place on the same step as before', () => {
    expect(SAVE.back).toBe(0.27)
    expect(SAVE.drive).toBe(6)
    expect(SAVE.land + SAVE.wind + SAVE.drive).toBe(56)
    expect((SAVE.wind - SAVE.still) / EACH).toBeGreaterThanOrEqual(3)
    expect((SAVE.wind - SAVE.still) / EACH).toBeLessThanOrEqual(6)
    expect(SAVE.still / EACH).toBeGreaterThanOrEqual(2)
    const all: [number, number, number[][]][] = []
    for (const k of [0, 1]) for (const [i, w] of ways.entries()) {
      const { rows, take, kick, trail } = lost(true, k, w)
      all.push([take, kick, trail])
      expect([take, kick]).toEqual(WAS.steps[i])
      const touch = rows.findIndex((r, n) => n >= take && r.taken === 1)
      expect(kick - touch).toBe(SAVE.land + SAVE.wind + SAVE.drive)
      const wind = rows.slice(touch + SAVE.land - 1, touch + SAVE.land + SAVE.wind - SAVE.still)
      const deep = (SAVE.rest + SAVE.back) * BALL
      expect(deep - wind[0]!.y, 'the travel of the load, px').toBeGreaterThanOrEqual(4)
      expect(down(wind.at(-1)!.turn) - down(wind[0]!.turn), 'the travel of the top wire in the load, px').toBeGreaterThanOrEqual(4)
      for (let n = 2; n < wind.length; n++) expect(wind[n]!.y, 'the load goes one way').toBeGreaterThanOrEqual(wind[n - 1]!.y - 1e-9)
      const still = rows.slice(touch + SAVE.land + SAVE.wind - SAVE.still - 1, touch + SAVE.land + SAVE.wind)
      expect(still.length).toBe(SAVE.still + 1)
      for (const r of still) {
        expect(r.y).toBe(still[0]!.y)
        expect(r.turn).toBe(still[0]!.turn)
      }
      expect(still[0]!.y).toBeCloseTo(deep, 9)
      const drive = rows.slice(touch + SAVE.land + SAVE.wind - 1, kick)
      for (let n = 1; n < drive.length; n++) expect(drive[n]!.y).toBeLessThan(drive[n - 1]!.y)
      expect(rows[kick - 1]!.y).toBeCloseTo(SAVE.rest * BALL, 9)
      for (const r of rows.slice(touch, kick)) expect(Math.abs(r.gap), 'gap of shell and wire, px').toBeLessThan(0.01)
    }
    expect(createHash('sha256').update(JSON.stringify(all)).digest('hex')).toBe(WAS.kick)
  })

  it('rings the wire out once after the kick: it stands thrown for 4 frames, then its swings about the rest place shrink one after the other, only the first of them passes the wire standing upright, and it is at rest 14 frames after the kick', () => {
    expect(WIRE.hold).toBe(1 / 15)
    for (const k of [0, 1]) for (const w of ways) {
      const { rows, kick } = lost(true, k, w)
      const after = rows.slice(kick, kick + 80).map((r) => r.turn)
      const hold = Math.round(WIRE.hold * stepHz)
      for (let n = 8; n < hold; n++) expect(after[n]).toBe(-WIRE.snap)
      const ring = after.slice(hold)
      const tops: number[] = []
      let top = ring[0]!
      for (let n = 1; n < ring.length; n++) {
        if (ring[n]! * ring[n - 1]! < 0) {
          tops.push(top)
          top = ring[n]!
        } else if (Math.abs(ring[n]!) > Math.abs(top)) top = ring[n]!
      }
      if (top !== 0) tops.push(top)
      expect(tops[0]!).toBeLessThan(-0.75)
      expect(tops.length).toBeGreaterThanOrEqual(3)
      for (let n = 1; n < tops.length; n++) {
        expect(tops[n]! * tops[n - 1]!, 'the swings go to one side and the other in turn').toBeLessThan(0)
        expect(Math.abs(tops[n]!), `swing ${n} against the one before`).toBeLessThan(0.5 * Math.abs(tops[n - 1]!))
      }
      const seen = tops.filter((t) => Math.abs(down(t)) > 1.5)
      expect(seen.length, 'swings of more than 1.5 px, the throw among them').toBeGreaterThanOrEqual(3)
      expect(seen.length).toBeLessThanOrEqual(6)
      for (const t of tops.slice(2)) expect(WIRE.shut + t, 'a later swing stays on the near side of upright').toBeLessThan(-0.15)
      const end = Math.round((14 / 60) * stepHz)
      for (let n = end; n < after.length; n++) expect(after[n]).toBe(0)
      for (let n = end - 3 * EACH; n < end; n++) expect(Math.abs(down(after[n]!))).toBeLessThan(1)
    }
  })

  it('swings no bat at a save, live or film, and gives the gate in film mode the one number it had', () => {
    for (const live of [true, false]) for (const k of [0, 1]) for (const w of ways) {
      const { rows, take, kick } = lost(live, k, w)
      expect(kick).toBeGreaterThan(0)
      expect(take > 0).toBe(live)
      for (const r of rows) {
        expect(r.flip).toEqual([0, 0])
        expect(r.own).toEqual([0, 0])
        if (!live) expect(r.state).toEqual([0])
      }
    }
  })
})

describe('the arrow and the view at a save, in a live visit', () => {
  let mc: Machine | null = null
  const step = Machine.prototype.step
  interface Step { scroll: number; taken: number; head: number; take: boolean; save: boolean; tier: number; flip: number[] }
  const visit = (driver: Driver, until: number): Step[] => {
    mc = null
    const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed: 1 })
    const out: Step[] = []
    while (stage.entryIndex === 0 && stage.pageTime < until) {
      stage.advance(1)
      const m = mc as Machine | null
      if (!m) continue
      const p = stage.cursor.pose()
      out.push({ scroll: stage.page.scroll(), taken: m.taken, head: p.lean + p.spin, take: m.events.some((e) => e.name === 'gate-take' && e.ball === 0), save: m.events.some((e) => e.name === 'ball-save' && e.ball === 0), tier: m.balls[0]!.tier, flip: [...m.flip, ...m.own] })
    }
    return out
  }
  const runs: Step[][] = []
  beforeAll(async () => {
    await prepare()
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      return step.call(this, l, r)
    }
    runs.push(visit({ name: 'bot', input: () => ({ x: 300, y: 900, down: false }) as Pointer }, 22.5))
    runs.push(visit(new BotDriver('keen', 1), 24))
  })
  afterAll(() => {
    Machine.prototype.step = step
  })

  it('keeps the heading of the arrow inside the ball from the take to the kick, and lets it go on the kick\'s step', () => {
    for (const run of runs) {
      const take = run.findIndex((r) => r.take)
      const kick = run.findIndex((r, n) => n > take && r.save)
      expect(take).toBeGreaterThan(0)
      expect(kick - take).toBeGreaterThanOrEqual(56)
      for (let n = take; n < kick; n++) expect(run[n]!.head, `step ${n - take} after the take`).toBeCloseTo(run[take]!.head, 9)
      expect(Math.abs(run[kick]!.head - run[take]!.head), 'the throw strikes the arrow to its own heading').toBeGreaterThan(0.2)
      for (let n = kick; n < kick + 0.15 * stepHz; n++) expect(run[n]!.head).toBeCloseTo(run[kick]!.head, 9)
    }
  })

  it('takes the view to its place under the gate by one eased travel, with no step back, and holds it dead still from 7 frames after the take through the load, the throw and the ring', () => {
    for (const run of runs) {
      const take = run.findIndex((r) => r.take)
      const kick = run.findIndex((r, n) => n > take && r.save)
      const k = run[take]!.tier
      expect(k).toBeLessThan(2)
      const from = take - stepHz / 2
      const to = kick + 0.5 * stepHz
      if (run.slice(from, to).some((r) => r.tier !== k)) continue
      let most = 0
      for (let n = from + 2; n <= to; n++) {
        const a = run[n]!.scroll - run[n - 1]!.scroll
        const b = run[n - 1]!.scroll - run[n - 2]!.scroll
        expect(a, `no step of the view goes back, step ${n - take} from the take, taken ${run[n]!.taken}`).toBeGreaterThanOrEqual(0)
        expect(Math.abs(a - b), 'the view\'s step against the step before it').toBeLessThanOrEqual(0.16)
        most = Math.max(most, a)
      }
      expect(most * EACH, 'the view\'s fastest frame, px').toBeLessThanOrEqual(12.01)
      const stand = run[take + 7 * EACH]!.scroll
      expect(stand - TIER_Y[k]! * BALL, 'the room under the gate, px').toBeCloseTo(90, 6)
      for (let n = take + 7 * EACH; n <= to; n++) expect(run[n]!.scroll).toBe(stand)
      for (let n = take; n <= kick; n++) expect(run[n]!.scroll - TIER_Y[k]! * BALL, 'the room under the wire while the ball lies on it, px').toBeGreaterThanOrEqual(45)
    }
  })

  it('goes down to its place under the gate in one eased move, in a rally at the bats too: the whole 90 px inside 0.3 s with no stand inside it, and no step back from there to the take', () => {
    for (const run of runs) {
      const take = run.findIndex((r) => r.take)
      const k = run[take]!.tier
      const place = TIER_Y[k]! * BALL + 90 - 1e-6
      let there = take + 7 * EACH
      while (there > 1 && run[there - 1]!.scroll >= place && run[there - 1]!.tier === k) there--
      const from = there - 0.3 * stepHz
      const steps = run.slice(from, there + 1).map((r, n) => r.scroll - run[from + n - 1]!.scroll)
      const moving = steps.map((d, n) => (d >= 0.02 ? n : -1)).filter((n) => n >= 0)
      expect(run[there]!.scroll - run[from]!.scroll, 'the way down inside 0.3 s, px').toBeGreaterThanOrEqual(89)
      expect(moving.length, 'steps of the way down').toBe(moving[moving.length - 1]! - moving[0]! + 1)
      expect(moving.length / EACH, 'frames of the way down').toBeLessThanOrEqual(14)
      expect(Math.max(...steps) * EACH, 'the fastest frame of the way down, px').toBeLessThanOrEqual(12.01)
      for (let n = from; n <= take; n++) expect(run[n]!.scroll - run[n - 1]!.scroll, `step ${n - take} from the take`).toBeGreaterThanOrEqual(0)
    }
  })

  it('swings no bat of the machine at a save with nobody at the flippers', () => {
    const run = runs[0]!
    const take = run.findIndex((r) => r.take)
    const kick = run.findIndex((r, n) => n > take && r.save)
    for (let n = take; n <= kick + 20; n++) expect(run[n]!.flip).toEqual([0, 0, 0, 0])
  })
})

describe('the film\'s take of the machine', () => {
  it('holds every gate at its one number and moves no event of the film\'s machine', () => {
    let mc: Machine | null = null
    const step = Machine.prototype.step
    const events: [string, number, number][] = []
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      const out = step.call(this, l, r)
      for (const e of out) events.push([e.name, e.ball, this.steps])
      return out
    }
    try {
      const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver() as Driver, film: filmOptions('pinball') })
      let n = 0
      while (!s.finished && s.time < 43) {
        s.advance(1)
        const m = mc as Machine | null
        if (!m || n++ % EACH !== 0) continue
        expect(m.taken).toBe(-1)
        for (const k of [0, 1, 2]) expect(stateOf(m, k)).toEqual([m.gate[k] ? 1 : 0])
      }
      expect(events.some((e) => e[0] === 'gate-take')).toBe(false)
      expect(events.length).toBe(WAS.events)
      expect(createHash('sha256').update(JSON.stringify(events)).digest('hex')).toBe(WAS.hash)
    } finally {
      Machine.prototype.step = step
    }
  })
})
