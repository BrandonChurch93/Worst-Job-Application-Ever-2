import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { TURN_HALF } from '../src/stage/stage'
import { arriveTurn, JOLT, joltAt, rattleAt, seatedAt, SHIVER, shiverAt, shiverSeconds, TURN } from '../src/stage/turn'

const DEG = Math.PI / 180
const frames = TURN_HALF * 60
const frame = 1 / frames
const seat = seatedAt()
const at = (n: number): number => arriveTurn(seat + n * frame) / DEG
// How far the upper edge of a page 1080 high stands off the top of a picture 1920 wide when the slab is `deg` off flat, seen straight on by a camera of 20 degrees.
const gapPx = (deg: number): number => {
  const d = 540 / Math.tan(10 * DEG)
  const a = Math.abs(deg) * DEG
  return 540 - (540 * Math.cos(a) * d) / (d + 540 * Math.sin(a))
}

describe('the seat of the page turn, as a picture a quarter of real size shows it', () => {
  it('seats on a whole frame of the film and of the stage, at the moment it always did', () => {
    expect(seat).toBe(0.6)
    expect(Number.isInteger(seat * frames)).toBe(true)
    expect(Number.isInteger(seat * TURN_HALF * stepHz)).toBe(true)
  })

  it('still closes by more than seven degrees in each of its last two frames, faster in the last', () => {
    const last = -at(-1)
    const before = at(-1) - at(-2)
    expect(last).toBeGreaterThan(7)
    expect(before).toBeGreaterThan(7)
    expect(last).toBeGreaterThan(before)
  })

  it('lies dead flat for two frames, so every second frame holds the contact once', () => {
    expect(at(0)).toBe(0)
    expect(at(1)).toBe(0)
    expect(at(1.999)).toBe(0)
    expect(Number.isInteger(Math.round(TURN.held * frames * 1e9) / 1e9)).toBe(true)
  })

  it('springs back at least 12 px at the free edge in three frames running, then knocks once more under 5 px, then lies still', () => {
    const first = [3, 4, 5].map((n) => gapPx(at(n)))
    for (const g of first) expect(g).toBeGreaterThanOrEqual(12)
    expect(gapPx(at(4))).toBeGreaterThan(17)
    expect(Math.abs(at(6))).toBeLessThan(1e-9)
    const second = [7, 8].map((n) => gapPx(at(n)))
    for (const g of second) {
      expect(g).toBeGreaterThan(2)
      expect(g).toBeLessThan(5)
    }
    for (let n = 9; n <= 12; n += 0.25) expect(at(n)).toBe(0)
    expect(TURN.knocks.length).toBe(2)
  })

  it('is over, slab, hop and jolt, within 0.25 s of the contact and before the turn ends', () => {
    const slab = (TURN.held + TURN.knocks.reduce((sum, k) => sum + k.lasts, 0)) * TURN_HALF
    expect(slab).toBeLessThanOrEqual(0.25)
    expect(shiverSeconds).toBeLessThanOrEqual(0.25)
    expect(shiverAt(slab)).toBeLessThan(0.5)
    expect(JOLT.lasts).toBeLessThan(shiverSeconds)
    expect(seat + slab / TURN_HALF).toBeLessThanOrEqual(1)
  })

  it('hops what stands loose by at least 10 page units in the first two frames after the contact, under a third as far the second time', () => {
    expect(shiverAt(0)).toBe(0)
    expect(shiverAt(1 / 60)).toBeGreaterThan(10)
    expect(shiverAt(2 / 60)).toBeGreaterThan(10)
    expect(shiverAt(SHIVER.beat)).toBeLessThan(1e-9)
    const again = Math.max(shiverAt(5 / 60), shiverAt(6 / 60))
    expect(again).toBeGreaterThan(2)
    expect(again).toBeLessThan(shiverAt(2 / 60) * 0.3)
    expect(Math.abs(rattleAt(1 / 60))).toBeGreaterThan(3)
    expect(shiverAt(SHIVER.beat * SHIVER.beats)).toBe(0)
  })

  it('jolts the view on the frame of the contact and has it back in five frames without going past', () => {
    expect(joltAt(-1 / 240)).toBe(0)
    expect(joltAt(0)).toBe(1)
    let last = 1
    for (let n = 1; n <= 4; n++) {
      const j = joltAt(n / 60)
      expect(j).toBeGreaterThan(0)
      expect(j).toBeLessThan(last)
      last = j
    }
    expect(joltAt(5 / 60)).toBe(0)
    expect(540 * JOLT.push * 2).toBeGreaterThan(8)
    expect(JOLT.rise).toBeLessThan(540 * JOLT.push)
  })
})
