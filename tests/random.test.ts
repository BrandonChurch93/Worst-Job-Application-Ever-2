import { describe, expect, it } from 'vitest'
import { hash01, hashName, Random, stream } from '../src/core/random'
import { config } from '../src/config'

const PINNED = [2129111699, 942974425, 2331696719, 3281069482]
const take = (r: Random, n: number) => Array.from({ length: n }, () => r.next())

describe('the seeded generator', () => {
  it('gives the same values for the same seed and the same stream', () => {
    expect(take(new Random(config.seed, 'cursor'), 1000)).toEqual(take(new Random(config.seed, 'cursor'), 1000))
  })

  it('gives each named stream its own values', () => {
    const a = take(new Random(config.seed, 'cursor'), 64)
    const b = take(new Random(config.seed, 'paper'), 64)
    expect(a).not.toEqual(b)
    expect(a.filter((v, i) => v === b[i]).length).toBe(0)
  })

  it('gives another seed other values', () => {
    expect(take(new Random(config.seed, 'cursor'), 64)).not.toEqual(take(new Random(config.seed + 1, 'cursor'), 64))
  })

  it('builds its streams from the seed in the config', () => {
    expect(take(stream('coins'), 32)).toEqual(take(new Random(config.seed, 'coins'), 32))
  })

  it('holds these exact values, so a change of the generator cannot pass unseen', () => {
    const r = new Random(20261124, 'pinned')
    expect([r.bits(), r.bits(), r.bits(), r.bits()]).toEqual(PINNED)
  })

  it('stays inside zero and one, and spreads evenly', () => {
    const v = take(new Random(config.seed, 'spread'), 20000)
    expect(Math.min(...v)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...v)).toBeLessThan(1)
    expect(v.reduce((s, x) => s + x, 0) / v.length).toBeCloseTo(0.5, 2)
    const tenths = new Array(10).fill(0)
    for (const x of v) tenths[Math.floor(x * 10)]++
    for (const n of tenths) expect(Math.abs(n - 2000)).toBeLessThan(200)
  })

  it('carries on from a saved state exactly', () => {
    const r = new Random(config.seed, 'saved')
    take(r, 17)
    const state = r.state()
    const rest = take(r, 100)
    const again = new Random(1, 'other')
    again.restore(state)
    expect(take(again, 100)).toEqual(rest)
  })

  it('keeps whole numbers, picks and shuffles inside their bounds', () => {
    const r = new Random(config.seed, 'bounds')
    for (let i = 0; i < 500; i++) {
      const n = r.int(7)
      expect(Number.isInteger(n) && n >= 0 && n < 7).toBe(true)
      const x = r.range(-3, 5)
      expect(x >= -3 && x < 5).toBe(true)
    }
    const list = Array.from({ length: 40 }, (_, i) => i)
    const mixed = r.shuffle([...list])
    expect([...mixed].sort((a, b) => a - b)).toEqual(list)
    expect(mixed).not.toEqual(list)
    expect(list).toContain(r.pick(list))
  })
})

describe('the hashes', () => {
  it('hash a name to the same number every time', () => {
    expect(hashName('cursor')).toBe(hashName('cursor'))
    expect(hashName('cursor')).not.toBe(hashName('cursos'))
    expect(hashName('')).toBe(0x811c9dc5)
  })

  it('hash whole numbers into zero to one, the same every time', () => {
    for (let i = 0; i < 200; i++) {
      const v = hash01(i, i * 7, 3)
      expect(v).toBe(hash01(i, i * 7, 3))
      expect(v >= 0 && v < 1).toBe(true)
    }
    expect(hash01(1, 2, 3)).not.toBe(hash01(2, 1, 3))
  })
})

