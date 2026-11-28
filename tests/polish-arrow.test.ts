import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { CursorBody, HANDOFF, LED } from '../src/cursor/body'
import { pages } from '../src/pages'
import { FLIP_SECONDS, SETTLE } from '../src/pages/marketing/index'
import { careersLayout } from '../src/pages/marketing/layout'
import { boxOf } from '../src/shell/layout'
import { liveFlow, MouseDriver, Stage, TURN_HALF } from '../src/stage/stage'
import type { DrawList, Driver, DriverView, Pointer } from '../src/stage/types'
import { strokeRun, visitorRun, type Row } from './polish-arrow-run'

const DEG = 180 / Math.PI
const hover = config.scale.heights.cursorHover
// What a frame of 60 may turn the arrow by, and how far it may stand off the standard angle, in degrees: the limits of `LED` with the rounding of a frame.
const MOST = { frame: 12.1, off: 35.1 }

// A hit, and the frames after it in which the page has thrown the arrow, are the page's own and are not held to the limits.
function held(rows: Row[]): { frame: number; off: number } {
  let frame = 0
  let off = 0
  let free = 0
  rows.forEach((r, i) => {
    if (r.hit || /recoil|taken|ball/.test(r.state)) free = 90
    else if (free > 0) free--
    if (free > 0 || i === 0) return
    frame = Math.max(frame, Math.abs(r.turn - rows[i - 1]!.turn))
    off = Math.max(off, Math.abs(r.turn))
  })
  return { frame, off }
}

describe('polish, the arrow under a visitor\'s pointer', () => {
  it('never turns more than 12 degrees in a frame of 60 nor stands more than 35 degrees off under the pack\'s visitor, from the careers page into step 1', () => {
    const got = held(visitorRun(16))
    expect(got.frame).toBeLessThanOrEqual(MOST.frame)
    expect(got.off).toBeLessThanOrEqual(MOST.off)
  })

  it('holds the same under a hand\'s fast strokes with dead stops, on the careers page and right after the turn into step 1', () => {
    const careers = held(strokeRun('marketing', [{ to: [300, 640], seconds: 0.25, rest: 0.3 }, { to: [1100, 660], seconds: 0.3, rest: 0.3 }, { to: [500, 620], seconds: 0.2, rest: 0.3 }, { to: [1300, 300], seconds: 0.3, rest: 0.4 }, { to: [900, 700], seconds: 0.15, rest: 0.4 }]))
    const step1 = held(strokeRun('step1', [{ to: [400, 500], seconds: 0.2, rest: 0.3 }, { to: [1200, 520], seconds: 0.3, rest: 0.3 }, { to: [600, 300], seconds: 0.25, rest: 0.4 }]))
    for (const got of [careers, step1]) {
      expect(got.frame).toBeLessThanOrEqual(MOST.frame)
      expect(got.off).toBeLessThanOrEqual(MOST.off)
    }
  })

  // The same fall at the same speed, with and without the hand, and with the hand after a knock by the page.
  function fall(hand: boolean, knocked: boolean): { spin: number; seconds: number } {
    const c = new CursorBody()
    c.hand = hand
    c.reset(400, 500)
    for (let i = 0; i < stepHz / 2; i++) c.step({ x: 400, y: 500 }, () => undefined, false)
    c.setGround(120)
    for (let i = 0; i < stepHz / 4; i++) c.step({ x: 400 + i * 6, y: 500 }, () => undefined, false)
    c.setGround(0)
    if (knocked) c.knock(0, 0, 200)
    let spin = 0
    let seconds = 0
    for (let i = 0; i < stepHz; i++) {
      c.step({ x: 760 + i * 6, y: 500 }, () => undefined, false)
      spin = Math.max(spin, Math.abs(c.pose().spin))
      if (c.z > hover + 30) seconds = (i + 1) / stepHz
    }
    return { spin, seconds }
  }

  it('dives tip first only where the page threw it: not when it walks off a raised thing, and it is down from there in a few frames', () => {
    const film = fall(false, false)
    const live = fall(true, false)
    const thrown = fall(true, true)
    expect(film.spin).toBeGreaterThan(0.8)
    expect(thrown.spin).toBeGreaterThan(0.8)
    expect(live.spin).toBeLessThan(0.05)
    expect(live.seconds).toBeLessThan(film.seconds)
    expect(live.seconds).toBeLessThanOrEqual(0.14)
  })

  it('rides its page through a page turn, leaving and arriving, at the height it stands at, where the film\'s arrow hangs in the room at the hand-off height', () => {
    const live = new CursorBody()
    live.hand = true
    live.reset(HANDOFF.x, HANDOFF.y, true)
    const film = new CursorBody()
    film.reset(HANDOFF.x, HANDOFF.y, true)
    const n = Math.round(TURN_HALF * stepHz)
    for (let i = 1; i <= n; i++) {
      live.step({ x: 0, y: 0 }, () => undefined, false)
      film.step({ x: 0, y: 0 }, () => undefined, false)
      expect(Math.abs(live.z - hover)).toBeLessThanOrEqual(1)
      expect(live.pose().rides).toBe(true)
      expect(film.z).toBeCloseTo(HANDOFF.z, 6)
      expect('rides' in film.pose()).toBe(false)
    }
    const left = new CursorBody()
    left.hand = true
    left.reset(400, 500)
    left.lift()
    for (let i = 0; i < n; i++) {
      left.step({ x: 0, y: 0 }, () => undefined, false)
      expect(Math.abs(left.z - hover)).toBeLessThanOrEqual(1)
      expect(left.pose().rides).toBe(true)
    }
    live.land()
    expect('rides' in live.pose()).toBe(false)
    let most = 0
    for (let i = 0; i < stepHz / 2; i++) {
      live.step({ x: HANDOFF.x - 600, y: HANDOFF.y }, () => undefined, false)
      most = Math.max(most, Math.abs(live.pose().lean + live.pose().spin))
    }
    expect(most).toBeLessThanOrEqual(LED.most)
  })
})

describe('polish, a perk card under a visitor', () => {
  const ENTER = 4
  const LEAVE_AT = 6
  function turns(): { over: number[]; back: number[] } {
    const { layout } = careersLayout()
    const card = boxOf(layout, 'perk-0')
    const to = card.y - 240
    const mouse: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        const wheel = v.scroll < to - 1 && v.step % 4 === 0 ? { wheel: Math.min(160, to - v.scroll) } : {}
        const on = v.time >= ENTER && v.time < LEAVE_AT
        return { x: on ? card.x + 180 : card.x - 120, y: card.y + 160 - v.scroll, down: false, ...wheel }
      }
    }
    const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: mouse })
    const over: number[] = []
    const back: number[] = []
    let last = 0
    for (let i = 0; i < 8 * 60; i++) {
      s.advance(stepHz / 60)
      const list: DrawList = []
      s.page.draw(list)
      const c = list.find((x) => x.id === 'perk-0')?.v?.[0]
      const deg = c === undefined ? 0 : Math.acos(Math.max(-1, Math.min(1, c))) * DEG
      if (s.time < LEAVE_AT) { if (deg > 0 && (over.length === 0 || last < 180)) over.push(deg) } else if (last > 0 && (back.length === 0 || back[back.length - 1]! > 0)) back.push(deg)
      last = deg
    }
    return { over, back }
  }

  it('comes over in at most 12 degrees a frame and arrives flat over the last frames, never in one; flips back the same way when the pointer leaves', () => {
    const { over, back } = turns()
    const most = (a: number[]): number => a.reduce((m, x, i) => (i ? Math.max(m, Math.abs(x - a[i - 1]!)) : m), 0)
    expect(over.length).toBeGreaterThanOrEqual(Math.round(FLIP_SECONDS * 60) - 2)
    expect(most(over)).toBeLessThanOrEqual(12)
    const peak = Math.max(...over)
    expect(peak).toBeCloseTo(180 * (1 + SETTLE.past), 0)
    const from30 = over.findIndex((x) => x >= 150)
    const flat = over.findIndex((x) => x >= 180 - 1e-6)
    expect(flat - from30).toBeGreaterThanOrEqual(3)
    expect(flat - from30).toBeLessThanOrEqual(8)
    for (let i = over.length - 5; i < over.length; i++) expect(over[i]! - over[i - 1]!).toBeLessThan(over[i - 1]! - over[i - 2]!)
    expect(Math.abs(over[over.length - 1]! - 180)).toBeLessThan(0.5)
    expect(back[0]!).toBeGreaterThan(179.5)
    expect(back[back.length - 1]!).toBe(0)
    expect(back.filter((x) => x < 180 - 1e-6).length).toBeGreaterThanOrEqual(Math.round(FLIP_SECONDS * 60) - 2)
    expect(most(back)).toBeLessThanOrEqual(12)
    for (let i = 1; i < back.length; i++) expect(back[i]!).toBeLessThanOrEqual(back[i - 1]!)
  })
})
