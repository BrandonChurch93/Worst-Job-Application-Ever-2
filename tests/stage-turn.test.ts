import { describe, expect, it } from 'vitest'
import { arriveTurn, leaveSpeed, leaveTurn, rattleAt, seatedAt, SHIVER, shiverAt, shiverBase, shiverDelay, shiverSeconds, TURN } from '../src/stage/turn'
import { blendFrames, TURN_HALF, type Frame } from '../src/stage/stage'
import { restPose } from '../src/cursor/body'
import { TURN_SEATS } from '../tools/lib/pack-look.mjs'

const QUARTER = Math.PI / 2
const DEG = Math.PI / 180

describe('the page turn', () => {
  it('leaves from flat to edge on and arrives from edge on to flat, exactly', () => {
    expect(leaveTurn(0)).toBe(0)
    expect(leaveTurn(1)).toBeCloseTo(QUARTER, 12)
    expect(arriveTurn(0)).toBeCloseTo(-QUARTER, 12)
    expect(arriveTurn(1)).toBe(0)
    expect(arriveTurn(0.97)).toBe(0)
  })

  it('leans back a little before it swings, and never more than the lean', () => {
    let least = 0
    for (let i = 0; i <= 100; i++) least = Math.min(least, leaveTurn((i / 100) * TURN.windUp))
    expect(least).toBeLessThan(-0.5 * DEG)
    expect(least).toBeGreaterThanOrEqual(-TURN.lean)
  })

  it('swings away faster and faster once the lean is over', () => {
    let last = leaveTurn(TURN.windUp)
    let lastGain = 0
    for (let i = 1; i <= 200; i++) {
      const now = leaveTurn(TURN.windUp + (i / 200) * (1 - TURN.windUp))
      const gain = now - last
      expect(gain).toBeGreaterThan(0)
      expect(gain).toBeGreaterThanOrEqual(lastGain - 1e-9)
      last = now
      lastGain = gain
    }
  })

  it('hands the swing over at one speed, so the two pages are one flip', () => {
    const h = 1e-4
    const out = (leaveTurn(1) - leaveTurn(1 - h)) / h
    const back = (arriveTurn(h) - arriveTurn(0)) / h
    expect(out).toBeCloseTo(leaveSpeed(), 2)
    expect(Math.abs(back - out) / out).toBeLessThan(0.02)
  })

  it('comes home still moving, knocks back twice, each knock smaller, and is never past flat', () => {
    const h = 1e-4
    const landing = (arriveTurn(seatedAt()) - arriveTurn(seatedAt() - h)) / h
    expect(landing).toBeGreaterThan(0.7 * leaveSpeed())
    expect(landing).toBeLessThan(0.9 * leaveSpeed())
    expect(Math.abs(arriveTurn(seatedAt()))).toBeLessThan(1e-9)
    let from = seatedAt()
    const depths: number[] = []
    for (const k of TURN.knocks) {
      let least = 0
      for (let i = 0; i <= 100; i++) least = Math.min(least, arriveTurn(from + (i / 100) * k.lasts))
      depths.push(-least)
      from += k.lasts
    }
    expect(depths[0]).toBeCloseTo(6 * DEG, 6)
    expect(depths[1]).toBeLessThan(depths[0]!)
    expect(from).toBeLessThanOrEqual(1)
    for (let i = 0; i <= 1000; i++) expect(arriveTurn(i / 1000)).toBeLessThanOrEqual(0)
  })

  it('lets the things on the new page shiver once after the knock: off their seats, each hop smaller, then still', () => {
    expect(shiverAt(-0.1)).toBe(0)
    expect(shiverAt(0)).toBe(0)
    expect(shiverAt(shiverSeconds)).toBe(0)
    expect(shiverAt(shiverSeconds + 1)).toBe(0)
    const peaks: number[] = []
    for (let b = 0; b < SHIVER.beats; b++) {
      let most = 0
      for (let i = 0; i <= 100; i++) {
        const v = shiverAt((b + i / 100) * SHIVER.beat)
        expect(v).toBeGreaterThanOrEqual(0)
        most = Math.max(most, v)
      }
      peaks.push(most)
    }
    expect(peaks[0]).toBeGreaterThan(4)
    expect(peaks[0]).toBeLessThanOrEqual(SHIVER.hop)
    for (let b = 1; b < peaks.length; b++) expect(peaks[b]).toBeLessThan(peaks[b - 1]! * 0.6)
    expect(peaks[peaks.length - 1]).toBeLessThan(0.5)
  })

  it('rattles them in the plane of the page too, to and fro and smaller each time, and reaches the foot of the page a tenth of a second late', () => {
    expect(rattleAt(0)).toBe(0)
    expect(rattleAt(shiverSeconds)).toBe(0)
    const swings: number[] = []
    for (let b = 0; b < SHIVER.beats; b++) swings.push(rattleAt((b + 0.5) * SHIVER.beat))
    expect(swings[0]).toBeGreaterThan(1.5)
    expect(swings[0]).toBeLessThanOrEqual(SHIVER.slide)
    for (let b = 1; b < swings.length; b++) {
      expect(Math.sign(swings[b]!)).toBe(-Math.sign(swings[b - 1]!))
      expect(Math.abs(swings[b]!)).toBeLessThan(Math.abs(swings[b - 1]!) * 0.6)
    }
    expect(shiverDelay(-1)).toBe(0)
    expect(shiverDelay(0.5)).toBeCloseTo(SHIVER.spread / 2, 12)
    expect(shiverDelay(3)).toBe(SHIVER.spread)
    expect(shiverAt(shiverSeconds - SHIVER.spread)).toBe(0)
  })

  it('lets what stands on a card shiver with the card, so type set on glass never sinks into it', () => {
    const card = { kind: 'box', x: 100, y: 300, w: 600, h: 240, z0: 0, z1: 6 }
    const title = { kind: 'text', x: 130, y: 320, w: 300, h: 30, z0: 6, z1: 6 }
    const body = { kind: 'text', x: 130, y: 380, w: 500, h: 26, z0: 6, z1: 6 }
    const box = { kind: 'box', x: 130, y: 460, w: 44, h: 44, z0: 6, z1: 10 }
    const label = { kind: 'text', x: 190, y: 470, w: 200, h: 26, z0: 6, z1: 6 }
    const tick = { kind: 'text', x: 140, y: 470, w: 24, h: 24, z0: 10, z1: 10 }
    const onPage = { kind: 'text', x: 100, y: 600, w: 300, h: 20, z0: 0, z1: 0.07 }
    const button = { kind: 'capsule', x: 800, y: 900, w: 300, h: 80, z0: 0, z1: 14 }
    const well = { kind: 'well', x: 0, y: 0, w: 1920, h: 1080, z0: 0, z1: 40 }
    const sunk = { kind: 'box', x: 100, y: 300, w: 600, h: 240, z0: -4, z1: 6, pocket: true }
    const list = [well, sunk, card, title, body, box, label, tick, onPage, button]
    for (const s of [title, body, box, label, tick, card]) expect(shiverBase(list, s)).toBe(card)
    expect(shiverBase(list, onPage)).toBe(onPage)
    expect(shiverBase(list, button)).toBe(button)
    const delay = (s: { y: number; h: number }): number => shiverDelay((s.y + s.h / 2) / 1080)
    expect(delay(title)).not.toBeCloseTo(delay(label), 3)
    expect(delay(shiverBase(list, title))).toBe(delay(shiverBase(list, label)))
  })

  it('blends the time since the knock between two steps and keeps it off a frame that has none', () => {
    const frame = (settle?: number): Frame => {
      const f: Frame = { list: [], cursor: restPose(0, 0), turn: 0, scroll: 0, page: 'step1', view: null, time: 0 }
      if (settle !== undefined) f.settle = settle
      return f
    }
    expect(blendFrames(frame(0.1), frame(0.2), 0.25).settle).toBeCloseTo(0.125, 12)
    expect(blendFrames(frame(), frame(0.2), 0.5).settle).toBe(0.2)
    expect('settle' in blendFrames(frame(0.3), frame(), 0.5)).toBe(false)
  })

  it('tells the critics\' pack the moment of the knock that the turn itself plays', () => {
    expect(TURN_SEATS).toBeCloseTo(TURN_HALF * (1 + TURN.seat), 12)
  })
})
