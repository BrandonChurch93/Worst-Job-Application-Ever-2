import { describe, expect, it, vi } from 'vitest'
import { samples, squareToDisk } from '../src/core/sampler'
import { samplesPerFrame, tierIds } from '../src/core/tiers'
import { config } from '../src/config'

const counts = [...new Set([...Object.values(config.tiers).map((t) => t.samplesPerFrame), 64])]

describe('the sampler', () => {
  it('gives the same samples every time, also from a fresh copy of the module', async () => {
    const before = JSON.stringify(counts.map((n) => samples(n)))
    vi.resetModules()
    const fresh = await import('../src/core/sampler')
    expect(JSON.stringify(counts.map((n) => fresh.samples(n)))).toBe(before)
  })

  it('reads the number of samples of each tier from the config', () => {
    for (const id of tierIds) expect(samples(samplesPerFrame(id)).length).toBe(config.tiers[id].samplesPerFrame)
    expect(() => samplesPerFrame('no-such-tier')).toThrow()
  })

  it('puts a lone sample at the centre of everything', () => {
    const [s] = samples(1)
    expect(s!.pixel).toEqual([0, 0])
    expect(s!.light).toEqual([0, 0])
    expect(s!.lens).toEqual([0, 0])
    expect(s!.shutter).toBe(0.5)
    expect(s!.dome).toEqual([0, 0, 1])
  })

  for (const n of counts.filter((c) => c >= 8)) {
    describe(`with ${n} samples`, () => {
      const list = samples(n)
      const quadrants = (points: number[][]) => {
        const q = [0, 0, 0, 0]
        for (const [x, y] of points) q[(x! >= 0 ? 1 : 0) + (y! >= 0 ? 2 : 0)]!++
        return q
      }

      it('covers the pixel', () => {
        for (const s of list) {
          expect(Math.abs(s.pixel[0])).toBeLessThanOrEqual(0.5)
          expect(Math.abs(s.pixel[1])).toBeLessThanOrEqual(0.5)
        }
        for (const q of quadrants(list.map((s) => s.pixel))) expect(q).toBeGreaterThanOrEqual(Math.floor(n / 8))
        expect(Math.abs(list.reduce((t, s) => t + s.pixel[0], 0) / n)).toBeLessThan(0.08)
        expect(Math.abs(list.reduce((t, s) => t + s.pixel[1], 0) / n)).toBeLessThan(0.08)
      })

      it('covers the light and the lens, inside their disks', () => {
        for (const pick of ['light', 'lens'] as const) {
          for (const s of list) expect(Math.hypot(...s[pick])).toBeLessThanOrEqual(1 + 1e-12)
          for (const q of quadrants(list.map((s) => s[pick]))) expect(q).toBeGreaterThanOrEqual(Math.floor(n / 8))
          expect(Math.max(...list.map((s) => Math.hypot(...s[pick])))).toBeGreaterThan(0.7)
        }
      })

      it('covers the shutter in order of time', () => {
        for (let i = 0; i < n; i++) expect(list[i]!.shutter).toBeCloseTo((i + 0.5) / n, 12)
        for (let i = 1; i < n; i++) expect(list[i]!.shutter).toBeGreaterThan(list[i - 1]!.shutter)
      })

      it('covers the dome with directions of length one that stay above the page', () => {
        for (const s of list) {
          expect(Math.hypot(...s.dome)).toBeCloseTo(1, 9)
          expect(s.dome[2]).toBeGreaterThanOrEqual(0.12 - 1e-12)
        }
        for (const q of quadrants(list.map((s) => s.dome))) expect(q).toBeGreaterThanOrEqual(Math.floor(n / 8))
      })

      it('does not tie the light, the lens or the dome to the pixel', () => {
        const same = (a: number[], b: number[]) => Math.abs(a[0]! - b[0]!) < 1e-9 && Math.abs(a[1]! - b[1]!) < 1e-9
        expect(list.filter((s) => same(s.light, s.lens)).length).toBeLessThan(n / 2)
      })
    })
  }

  it('maps the square onto the disk without leaving it', () => {
    for (let i = 0; i <= 20; i++) {
      for (let j = 0; j <= 20; j++) {
        const [x, y] = squareToDisk(i / 20, j / 20)
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(1 + 1e-12)
      }
    }
    expect(squareToDisk(0.5, 0.5)).toEqual([0, 0])
    expect(squareToDisk(1, 0.5)[0]).toBeCloseTo(1, 12)
  })
})
