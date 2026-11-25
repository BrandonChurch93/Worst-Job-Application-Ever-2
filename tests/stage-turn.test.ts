import { describe, expect, it } from 'vitest'
import { arriveTurn, leaveSpeed, leaveTurn, seatedAt, TURN } from '../src/stage/turn'

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
    expect(landing).toBeGreaterThan(0.2 * leaveSpeed())
    expect(landing).toBeLessThan(0.8 * leaveSpeed())
    expect(Math.abs(arriveTurn(seatedAt()))).toBeLessThan(1e-9)
    let from = seatedAt()
    const depths: number[] = []
    for (const k of TURN.knocks) {
      let least = 0
      for (let i = 0; i <= 100; i++) least = Math.min(least, arriveTurn(from + (i / 100) * k.lasts))
      depths.push(-least)
      from += k.lasts
    }
    expect(depths[0]).toBeCloseTo(1.5 * DEG, 6)
    expect(depths[1]).toBeLessThan(depths[0]!)
    expect(from).toBeLessThanOrEqual(1)
    for (let i = 0; i <= 1000; i++) expect(arriveTurn(i / 1000)).toBeLessThanOrEqual(0)
  })
})
