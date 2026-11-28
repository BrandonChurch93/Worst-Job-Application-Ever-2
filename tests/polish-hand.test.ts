import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { HAND, TAIL } from '../src/cursor/body'
import { pages } from '../src/pages'
import { BotDriver, type BotName } from '../src/stage/bots'
import { LANDING } from '../src/pages/marketing/script'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, wholeFilmFlow } from '../src/stage/stage'
import type { Pointer } from '../src/stage/types'
import { joltAt, SHIVER } from '../src/stage/turn'
import { fork, forked, Kept, onScreen, onScreenJolted, PER, resting, rowOf, stroking, turnsOf, visit, type Row, type Turn } from './polish-hand-run'

// What a page turn may do to the arrow under a resting hand, px of 1920 by 1080: how far from the pointer's place it may lie on the page when the page is flat,
// how far from the pointer on the screen (its height over the page is seen in perspective), how far it may go in the 30 frames after, and how far its height may change.
const FLAT = { page: 2, screen: 4, after: 2, z: 1 }
// FLAT.screen holds on the seat and at play only. While the slab is tilted (the turn and its knocks) the arrow lies on the slab's face at the pointer's place, so on the screen it is away from the pointer
// by what the tilt does to that place. Stepped, resting hand: 65.9 px on the first arriving frame of turn 1 and 482.8 px on that of turn 3 (the pointer in the lower right corner), 17.3 px on the second knock of turn 3.
// Under the stroking hand of MOVING on turn 1 it is at most 65.8 px on the screen where it is 36.2 px on the slab. No bound is set on these here.
// FLAT.screen is measured without the view's jolt on the seat. With it, stepped as the renderer does it, the arrow is carried with the page it lies on, px from where it comes to rest on the screen:
// `seat` on the `frames` frames from the contact (the jolt and the tray's hop), `knock` on the frames of the first knock after them, `still` from `from` frames after the contact.
// For a pointer 604 px left of the middle and 69 px over it, as on turn 1: the jolt carries what lies on the page by JOLT.push of its distance from the middle and JOLT.rise up.
const CARRY = { seat: 9, frames: 4, knock: 2.5, from: 9, still: 1 }
// Under a hand that strokes 560 px in 70 frames through the turn: the furthest the arrow may lie from the pointer's place on the slab, at the step the page is given to play, and the frames after which it is within FLAT.page.
const MOVING = { far: 40, atPlay: 20, joined: 12 }
// What an arriving page may do to the length and the angle of an arrow that rode in on the slab under a resting hand, from `before` frames before play to `after` frames after it:
// the most its length (1 is unpressed) and its drawn angle, degrees, may change from one frame to the next, and how far from 1 the length may be on step 3, where the page's landing press is the film's alone.
// Stepped on the six turns: the length goes 1.02 to 1.20 on turn 1 (the confident stand sways, at most 0.02 a frame), is 1.00 on turns 2, 3 and 4, 0.92 on turn 5 (nervous) and 0.81 on turn 6 (exhausted); the angle does not change.
const ARRIVED = { before: 10, after: 30, length: 0.03, angle: 1, unpressed: 0.02 }
// After a bolt's hit under a hand: px past the hand's place, the frame from the hit by which the place is back within 2 px, the frame by which the drawn angle is within 1 degree of its stand,
// the most the angle may turn back on its way, in degrees, and the most the arrow's step may change from one frame to the next when the hand moves off during the way back, px.
// What the bolt's hit does to the place, unchanged and the film's too: thrown this far, px, and held this many frames of 60.
const THROWN = { far: 60, hold: 4 }
const TAILS = { pass: 1, back: 10, rest: 16, again: 0.5, jolt: 8 }

const v = visit(400)
const turns = turnsOf(v.rows)
const off = (r: Row): number => Math.hypot(r.x - r.px, r.y - (r.py + r.scroll))
const onScreenOff = (r: Row): number => Math.hypot(r.sx - r.px, r.sy - r.py)
const way = (rows: Row[], a: number, b: number, screen = false): number => {
  let px = 0
  for (let k = a + 1; k <= b; k++) px += screen ? Math.hypot(rows[k]!.sx - rows[k - 1]!.sx, rows[k]!.sy - rows[k - 1]!.sy) : Math.hypot(rows[k]!.x - rows[k - 1]!.x, rows[k]!.y - rows[k - 1]!.y)
  return px
}
const reactionOf = (r: Row): string => r.state.split('+').slice(1).filter((w) => !['air', 'rides', 'taken', 'ball'].includes(w)).join('+')
const LEAD = 10
const marks = (t: Turn) => ({ start: LEAD, half: LEAD + t.half - t.start, seat: LEAD + t.half - t.start + Math.round(0.6 * (t.flat - t.half)), play: LEAD + t.flat - t.start })

describe('the arrow under a hand through a page turn', () => {
  it('the visitor ends the site and turns six pages', () => {
    expect(v.finished).toBe(true)
    expect(turns.map((t) => `${t.from}>${t.to}`)).toEqual(['marketing>step1', 'step1>step2', 'step2>step3', 'step3>step4', 'step4>step5', 'step5>marketing'])
  })

  turns.forEach((t, n) => {
    const name = `turn ${n + 1}, ${t.from} to ${t.to}`
    it(`${name}: under a resting hand the arrow makes no move of its own, and stands on the pointer when the page is flat`, () => {
      const r = forked(v, t.start, t.flat - t.start + 61, resting, LEAD)
      const m = marks(t)
      const before = r.rows[m.start - 1]!
      const held = before.state.includes('taken') || before.state.includes('ball')
      const leaving = way(r.rows, m.start - 1, m.half - 1)
      expect(leaving).toBeLessThanOrEqual(held ? 0.5 : off(before) + 1)
      if (!held) for (let k = m.start; k < m.half; k++) expect(off(r.rows[k]!)).toBeLessThanOrEqual(off(before) + 1)
      for (let k = m.half; k <= m.play + 30; k++) expect(off(r.rows[k]!)).toBeLessThanOrEqual(FLAT.page)
      expect(Math.abs(r.rows[m.seat]!.turn)).toBeLessThan(0.01)
      expect(onScreenOff(r.rows[m.seat]!)).toBeLessThanOrEqual(FLAT.screen)
      expect(onScreenOff(r.rows[m.play]!)).toBeLessThanOrEqual(FLAT.screen)
      expect(way(r.rows, m.play, m.play + 30, true)).toBeLessThanOrEqual(FLAT.after)
      expect(way(r.rows, m.half, m.play + 30)).toBeLessThanOrEqual(FLAT.after)
      for (let k = m.seat; k <= m.play + 30; k++) expect(Math.abs(r.rows[k]!.z - r.rows[m.seat]!.z)).toBeLessThanOrEqual(FLAT.z)
    })

    it(`${name}: nothing fires on the new page that the page does not fire by itself`, () => {
      const r = forked(v, t.start, t.flat - t.start + 61, resting, LEAD)
      const m = marks(t)
      const told = r.events.filter((e) => e.frame >= t.start && e.frame <= t.flat + 30).map((e) => e.name)
      expect(told.filter((e) => e !== 'page-turn' && e !== 'hold-music')).toEqual([])
      const at = reactionOf(r.rows[m.half]!)
      for (let k = m.half; k <= m.play + 30; k++) expect(['', at]).toContain(reactionOf(r.rows[k]!))
    })

    it(`${name}: the arriving page gives the arrow that rode in under a hand no press, hop or turn of its own at play`, () => {
      const r = forked(v, t.start, t.flat - t.start + 61, resting, LEAD)
      const m = marks(t)
      for (let k = m.play - ARRIVED.before + 1; k <= m.play + ARRIVED.after; k++) {
        expect(Math.abs(r.rows[k]!.squash - r.rows[k - 1]!.squash)).toBeLessThanOrEqual(ARRIVED.length)
        expect(Math.abs(r.rows[k]!.angle - r.rows[k - 1]!.angle)).toBeLessThanOrEqual(ARRIVED.angle)
        expect(Math.abs(r.rows[k]!.z - r.rows[k - 1]!.z)).toBeLessThanOrEqual(FLAT.z)
      }
      if (t.to === 'step3') for (let k = m.play - ARRIVED.before; k <= m.play + ARRIVED.after; k++) expect(Math.abs(r.rows[k]!.squash - 1)).toBeLessThanOrEqual(ARRIVED.unpressed)
    })

    it(`${name}: under a moving hand the arrow goes with the pointer on the slab's face`, () => {
      const rows = fork(v, t.start, t.flat - t.start + 31, stroking(70), LEAD)
      const m = marks(t)
      const before = rows[m.start - 1]!
      const held = before.state.includes('taken') || before.state.includes('ball')
      for (let k = held ? m.half : m.start; k <= m.play + 30; k++) expect(off(rows[k]!)).toBeLessThanOrEqual(MOVING.far)
      expect(off(rows[m.play]!)).toBeLessThanOrEqual(MOVING.atPlay)
      for (let k = m.play + MOVING.joined; k <= m.play + 30; k++) expect(off(rows[k]!)).toBeLessThanOrEqual(FLAT.page)
      for (let k = m.start + 1; k <= m.play + 30; k++) if (k !== m.half) expect(Math.hypot(rows[k]!.x - rows[k - 1]!.x, rows[k]!.y - rows[k - 1]!.y)).toBeLessThanOrEqual(MOVING.atPlay)
    })

    it(`${name}: a press during the turn reaches no page, and the arrow still stands on the pointer`, () => {
      const pressed = (step: number, last: Pointer): Pointer => ({ x: last.x, y: last.y, down: (step >= 8 * PER && step < 14 * PER) || (step >= 40 * PER && step < 46 * PER) })
      const a = forked(v, t.start, t.flat - t.start + 31, resting, LEAD)
      const b = forked(v, t.start, t.flat - t.start + 31, pressed, LEAD)
      const m = marks(t)
      expect(b.events.map((e) => `${e.name} ${e.frame}`)).toEqual(a.events.map((e) => `${e.name} ${e.frame}`))
      for (let k = m.start; k <= m.play + 30; k++) {
        expect(b.rows[k]!.x).toBe(a.rows[k]!.x)
        expect(b.rows[k]!.y).toBe(a.rows[k]!.y)
        expect(b.rows[k]!.state).toBe(a.rows[k]!.state)
      }
    })

    it(`${name}: a press on the first step of play lands where the pointer is, with no wait`, () => {
      const first = (t.flat - t.start) * PER - 1
      const r = forked(v, t.start, t.flat - t.start + 2, (step: number, last: Pointer): Pointer => ({ x: last.x, y: last.y, down: step >= first }), LEAD)
      const s = r.stage as unknown as { lag: { x: number; y: number; left: number }; late: { wait: number } }
      expect(s.late.wait).toBe(0)
      expect(Math.hypot(s.lag.x, s.lag.y) * Math.max(0, s.lag.left)).toBeLessThanOrEqual(FLAT.page)
    })
  })

  it('turn 1: while the tray under the arrow hops on the seat the arrow is drawn hopping with it, and the tray never rises through it', () => {
    const t = turns[0]!
    const seat = t.half + Math.round(0.6 * (t.flat - t.half))
    const drawn: { i: number; lift: number; clear: number; shift: number }[] = []
    forked(v, t.start, t.flat - t.start + 31, resting, LEAD, (s, i) => {
      const f = s.frameAt(s.time)
      const body = s.cursor.pose()
      const lift = f.cursor.z - body.z
      let top = 0
      for (const u of f.list) if (u.kind !== 'text' && u.kind !== 'well' && u.kind !== 'anchor' && u.pocket !== true && u.z1 > SHIVER.loose && body.x >= u.x && body.x <= u.x + u.w && body.y >= u.y && body.y <= u.y + u.h) top = Math.max(top, u.z1)
      const a = onScreen(body.x, body.y, body.z, f.scroll, 0)
      const b = onScreen(body.x, body.y, f.cursor.z, f.scroll, 0)
      drawn.push({ i, lift, clear: f.cursor.z - (top + lift), shift: Math.hypot(a.x - b.x, a.y - b.y) })
    })
    const at = (i: number) => drawn.find((d) => d.i === i)!
    expect(at(seat - 1).lift).toBe(0)
    expect(Math.max(at(seat + 1).lift, at(seat + 2).lift)).toBeGreaterThan(8)
    for (const d of drawn) {
      expect(d.lift).toBeGreaterThanOrEqual(0)
      expect(d.lift).toBeLessThanOrEqual(SHIVER.hop)
      expect(d.shift).toBeLessThanOrEqual(FLAT.screen)
      if (d.i >= seat) expect(d.clear).toBeGreaterThan(0)
    }
    for (let i = seat + 12; i <= t.flat + 30; i++) expect(at(i).lift).toBeLessThan(0.5)
  })

  it("turn 1: with the view's jolt the arrow is carried with the page on the seat by no more than CARRY, and lies still after", () => {
    const t = turns[0]!
    const seat = t.half + Math.round(0.6 * (t.flat - t.half))
    const seen: { i: number; x: number; y: number }[] = []
    forked(v, t.start, t.flat - t.start + 31, resting, LEAD, (s, i) => {
      const f = s.frameAt(s.time)
      seen.push({ i, ...onScreenJolted(f.cursor.x, f.cursor.y, f.cursor.z, f.scroll, f.cursor.rides ? f.turn : 0, f.settle === undefined ? 0 : joltAt(f.settle)) })
    })
    const rest = seen[seen.length - 1]!
    const carry = (i: number): number => { const a = seen.find((d) => d.i === i)!; return Math.hypot(a.x - rest.x, a.y - rest.y) }
    expect(carry(seat)).toBeGreaterThan(FLAT.screen)
    for (let i = seat; i < seat + CARRY.frames; i++) expect(carry(i)).toBeLessThanOrEqual(CARRY.seat)
    for (let i = seat + CARRY.frames; i < seat + CARRY.from; i++) expect(carry(i)).toBeLessThanOrEqual(CARRY.knock)
    for (let i = seat + CARRY.from; i <= t.flat + 30; i++) expect(carry(i)).toBeLessThanOrEqual(CARRY.still)
  })

  it('a page that ends by itself: the turn that comes long after the last press leaves the arrow under the resting hand', () => {
    const lastPress = (t: Turn): number => { let at = -1; for (let k = 0; k < t.start * PER; k++) if (v.log[k]!.down) at = k; return Math.floor(at / PER) }
    const t = turns.reduce((a, b) => (b.start - lastPress(b) > a.start - lastPress(a) ? b : a))
    const from = lastPress(t) + 2
    expect(t.start - from).toBeGreaterThan(20)
    const rows = fork(v, from, t.flat - from + 31, resting, 1)
    const own = turnsOf(rows)[0]!
    expect(own).toBeDefined()
    const before = rows[own.start - 1]!
    const held = before.state.includes('taken') || before.state.includes('ball')
    expect(way(rows, own.start - 1, own.half - 1)).toBeLessThanOrEqual(held ? 0.5 : off(before) + 1)
    for (let k = own.half; k <= own.flat + 30 && k < rows.length; k++) expect(off(rows[k]!)).toBeLessThanOrEqual(FLAT.page)
  })

  it('the skip link: the page it ends hands the arrow over under the hand as any other', () => {
    const t = turns[0]!
    const wait = Math.round(config.live.skipLinkAfterSeconds * stepHz) + 40
    const r = forked(v, t.flat + 2, config.live.skipLinkAfterSeconds * 60 + 400, (step: number, last: Pointer): Pointer => ({ x: last.x, y: last.y, down: false, ...(step === wait ? { skip: true } : {}) }))
    expect(r.events.filter((e) => e.name === 'skip').length).toBe(1)
    const own = turnsOf(r.rows)[0]!
    expect(own).toBeDefined()
    expect(own.to).toBe('step2')
    for (let k = own.half; k <= own.flat + 30; k++) expect(off(r.rows[k]!)).toBeLessThanOrEqual(FLAT.page)
    expect(way(r.rows, own.flat, own.flat + 30, true)).toBeLessThanOrEqual(FLAT.after)
  })

  it('the rejected careers page: on the step of the landing the arrow stands on the pointer, goes nowhere after, and no card startles it', () => {
    const t = turns[5]!
    const lands = Math.round(LANDING.lands * 60)
    const r = forked(v, t.start, t.flat - t.start + lands + 61, resting, LEAD)
    const m = marks(t)
    for (let k = m.play; k <= m.play + lands + 30; k++) expect(off(r.rows[k]!)).toBeLessThanOrEqual(FLAT.page)
    expect(way(r.rows, m.play + lands - 1, m.play + lands + 30, true)).toBeLessThanOrEqual(FLAT.after)
    for (let k = m.half; k <= m.play + lands + 60; k++) expect(r.rows[k]!.state).not.toContain('startle')
  })
})

describe('the four bots, whose pointer the stage reads as a hand', () => {
  for (const bot of ['keen', 'clumsy', 'random', 'skipper'] as BotName[]) {
    it(`${bot} ends the site, and on every arriving page its arrow lies no further from its pointer than the pointer goes in one frame`, () => {
      const kept = new Kept(new BotDriver(bot, config.seed))
      const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: kept, seed: config.seed })
      const rows: Row[] = []
      for (let i = 0; i < config.live.botMaxSeconds * 60 && !s.finished; i++) {
        s.advance(PER)
        rows.push(rowOf(s, i, kept.log[s.step - 1]!, false))
      }
      expect(s.finished).toBe(true)
      const all = turnsOf(rows)
      expect(all.length).toBe(6)
      for (const t of all) {
        let stride = 0
        for (let k = t.start; k <= t.flat; k++) stride = Math.max(stride, Math.hypot(rows[k]!.px - rows[k - 1]!.px, rows[k]!.py - rows[k - 1]!.py))
        for (let k = t.half; k <= t.flat; k++) expect(off(rows[k]!)).toBeLessThanOrEqual(stride + FLAT.page)
      }
    })
  }
})

describe('the arrow under a hand after a bolt', () => {
  const hit = v.rows.find((r) => r.hit && r.page === 'step1')!
  const tail = (rows: Row[]) => {
    const k = rows.findIndex((r) => r.hit)
    const home = rows[k - 1]!
    const line = { x: rows[k]!.x - home.x, y: rows[k]!.y - home.y }
    const far = Math.hypot(line.x, line.y)
    const along = (r: Row): number => ((r.x - home.x) * line.x + (r.y - home.y) * line.y) / far
    const aside = (r: Row): number => Math.abs((r.x - home.x) * line.y - (r.y - home.y) * line.x) / far
    return { k, far, along, aside }
  }

  it('one throw along the line, a hold, one way back that passes the hand by no more than TAILS.pass, once', () => {
    const rows = fork(v, hit.i - 2, 43, resting, 1)
    const { k, far, along, aside } = tail(rows)
    expect(far).toBeGreaterThan(THROWN.far - 1)
    expect(far).toBeLessThan(THROWN.far + 1)
    const hold = THROWN.hold
    for (let j = k; j < k + hold; j++) expect(Math.abs(along(rows[j]!) - far)).toBeLessThan(0.5)
    let crossings = 0
    for (let j = k + 1; j < rows.length; j++) {
      expect(aside(rows[j]!)).toBeLessThan(0.5)
      expect(along(rows[j]!)).toBeGreaterThanOrEqual(-TAILS.pass)
      if (j >= k + hold) expect(along(rows[j]!)).toBeLessThanOrEqual(along(rows[j - 1]!) + (along(rows[j - 1]!) < 0 ? TAILS.pass : 0.01))
      if (along(rows[j]!) < -0.05 && along(rows[j - 1]!) >= -0.05) crossings++
      if (j >= k + TAILS.back) expect(Math.abs(along(rows[j]!))).toBeLessThanOrEqual(2)
    }
    expect(crossings).toBeLessThanOrEqual(1)
  })

  it('the drawn angle goes out once and comes back once, and is at rest by TAILS.rest', () => {
    const rows = fork(v, hit.i - 2, 43, resting, 1)
    const { k } = tail(rows)
    const stand = rows[k + 30]!.angle
    let peak = k
    for (let j = k; j < k + 12; j++) if (Math.abs(rows[j]!.angle - stand) > Math.abs(rows[peak]!.angle - stand)) peak = j
    expect(peak - k).toBeLessThanOrEqual(THROWN.hold + 1)
    const sign = Math.sign(rows[peak]!.angle - stand)
    for (let j = peak + 1; j < rows.length; j++) expect((rows[j]!.angle - rows[j - 1]!.angle) * sign).toBeLessThanOrEqual(TAILS.again)
    for (let j = k + TAILS.rest; j < rows.length; j++) expect(Math.abs(rows[j]!.angle - stand)).toBeLessThanOrEqual(1)
    expect(TAIL.over * 60).toBeLessThanOrEqual(TAILS.rest)
  })

  it('a hand that moves off during the way back takes the arrow with it without a jump', () => {
    const from = THROWN.hold + 2
    const rows = fork(v, hit.i - 2, 43, (step: number, last: Pointer): Pointer => {
      const u = Math.max(0, step / PER - 2 - from)
      return { x: last.x + (last.x < 960 ? 25 : -25) * u, y: last.y + (last.y < 540 ? 6 : -6) * u, down: false }
    }, 1)
    const { k } = tail(rows)
    const step = (j: number): number => Math.hypot(rows[j]!.x - rows[j - 1]!.x, rows[j]!.y - rows[j - 1]!.y)
    for (let j = k + THROWN.hold + 1; j < rows.length; j++) expect(Math.abs(step(j) - step(j - 1))).toBeLessThanOrEqual(TAILS.jolt)
    const lag = (Math.hypot(25, 6) * 60 * HAND.damp) / HAND.stiff
    for (let j = k; j < rows.length; j++) expect(off(rows[j]!)).toBeLessThanOrEqual(lag + 2)
    for (let j = k + 20; j < rows.length; j++) expect(off(rows[j]!)).toBeGreaterThanOrEqual(lag - 8)
  })
})

describe('without a hand the turn and the hit are what they were', () => {
  const rowsOf = (s: Stage, frames: number): Row[] => {
    const rows: Row[] = []
    let seen = 0
    for (let i = 0; i < frames; i++) {
      const p = s.page.script(s.pageTime)
      s.advance(PER)
      const hit = s.events.slice(seen).some((e) => e.hitsCursor && e.name === 'bolt-hit-cursor')
      seen = s.events.length
      rows.push(rowOf(s, i, { x: p.x, y: p.y - s.page.scroll() }, hit))
    }
    return rows
  }
  const line = (r: Row): string => `${r.i} ${r.page} ${r.phase} ${r.x.toFixed(2)} ${(r.y - r.scroll).toFixed(2)} ${r.z.toFixed(2)} ${r.angle.toFixed(2)}`

  it("the film's first turn: the arrow stays on the button it pressed, goes over with its slab, and stands at the hand over place on the next page", () => {
    const rows = rowsOf(new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver() }), 40 * 60)
    const t = turnsOf(rows)[0]!
    expect([t.start, t.start + 1, t.start + 10, t.start + 29, t.half, t.half + 18, t.flat, t.flat + 10, t.flat + 30].map((k) => line(rows[k]!))).toEqual(FILM_TURN)
  })

  it("the film's hit on step 1 keeps its angles", () => {
    const rows = rowsOf(new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') }), 10 * 60)
    const k = rows.findIndex((r) => r.hit)
    expect(rows.slice(k, k + 16).map((r) => `${r.i} ${r.angle.toFixed(1)}`)).toEqual(FILM_HIT)
  })
})

const FILM_TURN = ['809 marketing leave 508.00 440.00 13.96 11.69', '810 marketing leave 508.00 440.00 13.96 11.50', '819 marketing leave 508.00 440.00 13.96 -16.06', '838 marketing leave 508.00 440.00 13.96 39.80', '839 step1 arrive 960.00 540.00 260.00 0.00', '857 step1 arrive 960.00 540.00 260.00 -11.10', '869 step1  960.00 540.00 260.00 -11.10', '879 step1  960.00 540.00 225.83 -11.10', '899 step1  960.00 540.00 4.00 -11.10']
const FILM_HIT = ['348 -12.0', '349 -5.7', '350 1.9', '351 8.7', '352 14.0', '353 17.7', '354 19.4', '355 17.9', '356 18.0', '357 19.6', '358 21.8', '359 24.2', '360 26.4', '361 28.3', '362 29.8', '363 31.0']
