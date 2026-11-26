import { describe, expect, it } from 'vitest'
import { BALL, table } from '../src/table/layout'
import { zone } from '../src/table/real/zone'
import { POOL } from '../src/table/real/lights/colours'
import { HIGHS, SPILLS, highOf, spillsOf } from '../src/table/real/lights/groups'
import { SHADOW } from '../src/table/real/lights/hook'

const TIERS = ['corporate', 'office', 'street']

describe('the pools, the mirrored fronts and the beacons of a tier', () => {
  it('keep every pool a share of its lamp, so the head lamps shape a tier', () => {
    for (const id of TIERS) {
      expect(POOL[id]).toBeGreaterThan(0.3)
      expect(POOL[id]).toBeLessThan(1)
    }
    expect(POOL.marquee).toBe(1)
    expect(SHADOW.far).toBeLessThan(SHADOW.near)
    expect(SHADOW.far).toBeGreaterThan(0)
  })
  it('light the riser faces a little and never as much as a floor', () => {
    expect(SHADOW.riser).toBeGreaterThan(0)
    expect(SHADOW.riser).toBeLessThan(0.2)
    expect(SHADOW.riserReach).toBeLessThan(2 * BALL)
  })
  it('mirror the fronts and the side walls of the lit models inside their tier', () => {
    for (const id of TIERS) {
      const z = zone(id)
      const list = spillsOf(z)
      expect(list.length).toBeGreaterThan(0)
      expect(list.length).toBeLessThanOrEqual(SPILLS)
      for (const s of list) {
        expect(Math.abs(s.x)).toBeLessThan(960)
        expect(Math.abs(s.y)).toBeLessThan(z.height / 2)
        expect(s.half).toBeGreaterThan(0)
        expect(s.high).toBeGreaterThan(0)
      }
    }
    expect(spillsOf(zone('street')).filter((s) => s.side).length).toBe(3)
  })
  it('stand one lamp over each beacon, above its roof, in the group of its colour', () => {
    const z = zone('street')
    const list = highOf(z)
    expect(list.length).toBeLessThanOrEqual(HIGHS)
    for (const [name, id] of [['red', 'street.firehouse'], ['blue', 'street.police']] as [string, string][]) {
      const m = table.models.find((x) => x.id === id)!
      const lamp = list.filter((h) => h.follows === name)
      expect(lamp.length).toBe(1)
      expect(lamp[0]!.z).toBeGreaterThan(((m.base ?? 0) + m.h) * BALL)
      expect(lamp[0]!.reach).toBeLessThan(2 * BALL)
    }
  })
})
