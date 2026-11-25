import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { makeMaterials } from '../src/shell/materials'

interface Tinted { color: { r: number; g: number; b: number }; clearcoat: number; clearcoatRoughness: number }
const m = makeMaterials(config.seed) as unknown as Record<string, Tinted>
const light = (c: { r: number; g: number; b: number }): number => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
const contrast = (a: Tinted, b: Tinted): number => {
  const [hi, lo] = [light(a.color), light(b.color)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('surface, fix round 3', () => {
  it('keeps the light label readable on every cap that carries one', () => {
    for (const name of ['orange', 'waiting', 'chip']) expect(contrast(m.inkOnOrange!, m[name]!), name).toBeGreaterThanOrEqual(4.6)
  })

  it('makes the waiting button the same moulding as the open one, in grey', () => {
    expect(m.waiting!.clearcoat).toBe(m.orange!.clearcoat)
    expect(m.waiting!.clearcoatRoughness).toBe(m.orange!.clearcoatRoughness)
    const c = m.waiting!.color
    expect(Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)).toBeLessThan(0.04)
  })

  it('keeps the page a neutral ivory: warm by a hair and not white', () => {
    const c = m.ceramic!.color
    expect(c.r).toBeGreaterThan(c.b)
    expect(c.r - c.b).toBeLessThan(0.04)
    expect(c.r).toBeLessThan(1)
  })
})
