import { describe, expect, it } from 'vitest'
import { table } from '../src/table/layout'
import { localBalls, zone } from '../src/table/real/zone'
import { keyOf, KEYS, SHADE, shadeOf } from '../src/table/real/lights/key'

const TIERS = ['corporate', 'office', 'street']

describe('the head lamps of a tier', () => {
  it('stand at the head of each tier, right of the middle, above the floor', () => {
    for (const id of TIERS) {
      const k = keyOf(id)!
      expect(Math.hypot(...k.toward)).toBeCloseTo(1, 6)
      expect(k.toward[0]).toBeGreaterThan(0.3)
      expect(k.toward[1]).toBeGreaterThan(0.3)
      expect(k.toward[2]).toBeGreaterThan(0.3)
      expect(k.toward[2]).toBeLessThan(0.75)
      expect(k.colour[0]).toBeGreaterThan(k.colour[2])
    }
    expect(keyOf('marquee')).toBeNull()
    expect(Object.keys(KEYS).sort()).toEqual([...TIERS].sort())
  })
  it('make the same shadows each time and leave most of the floor in the light', () => {
    for (const id of TIERS) {
      const z = zone(id)
      const a = shadeOf(z)
      expect(shadeOf(z)).toBe(a)
      expect(a.width).toBe(Math.round(1920 / SHADE.texel))
      expect(a.texture.name).toBe(`table-lights.${id}.key`)
      let lit = 0
      let bad = 0
      for (let i = 0; i < a.heights.length; i++) {
        if (!Number.isFinite(a.under[0]![i]!)) bad++
        if (a.under[0]![i]! <= 0.5) lit++
      }
      expect(bad).toBe(0)
      expect(lit / a.heights.length).toBeGreaterThan(0.4)
      expect(lit / a.heights.length).toBeLessThan(0.97)
    }
  })
  it('throw the shadow of a bumper toward the foot and the left', () => {
    const z = zone('office')
    const a = shadeOf(z)
    const b = table.bumpers.find((q) => q.tier === z.tier)!
    const p = localBalls(z, b.c[0], b.c[1])
    const at = (x: number, y: number): number => {
      const i = Math.floor((x + 960) / SHADE.texel)
      const j = Math.floor((y + z.height / 2) / SHADE.texel)
      return a.under[0]![j * a.width + i]!
    }
    const out = b.r * 96 + 30
    const k = keyOf(z)!
    const flat = Math.hypot(k.toward[0], k.toward[1])
    expect(at(p[0] - (k.toward[0] / flat) * out, p[1] - (k.toward[1] / flat) * out)).toBeGreaterThan(4)
  })
})
