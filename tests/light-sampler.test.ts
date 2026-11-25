import { describe, expect, it } from 'vitest'
import { areaSplit, domeReach, domeSpread, filterTaps, samples } from '../src/core/sampler'
import { glowLevels } from '../src/post/post'
import { shadowFilter } from '../src/post/studio'
import { look } from '../src/post/look'
import { config } from '../src/config'

const counts = [...new Set([...Object.values(config.tiers).map((t) => t.samplesPerFrame), 64])]

describe('the sample pattern of the light', () => {
  it('lets one sample blur by the whole light and many samples move across it', () => {
    expect(areaSplit(1)).toEqual({ move: 0, blur: 1 })
    let last = 1
    for (const n of [2, 8, 24, 64]) {
      const s = areaSplit(n)
      expect(s.move + s.blur).toBeCloseTo(1, 12)
      expect(s.blur).toBeLessThanOrEqual(last)
      expect(s.blur * Math.sqrt(n)).toBeGreaterThanOrEqual(1)
      last = s.blur
    }
    expect(areaSplit(2).blur).toBeGreaterThan(0.8)
  })

  it('gives every sample of a picture its own share of the filter taps', () => {
    for (const n of counts) {
      const turns = samples(n).map((s) => Math.floor(s.phase * n))
      expect(new Set(turns).size).toBe(n)
      for (const s of samples(n)) {
        expect(s.phase).toBeGreaterThan(0)
        expect(s.phase).toBeLessThan(1)
      }
    }
  })

  it('moves the shadow map by less than a texel, evenly, and not at all for a lone sample', () => {
    expect(samples(1)[0]!.texel).toEqual([0, 0])
    for (const n of counts.filter((c) => c >= 8)) {
      const list = samples(n)
      for (const s of list) {
        expect(Math.abs(s.texel[0])).toBeLessThanOrEqual(0.5)
        expect(Math.abs(s.texel[1])).toBeLessThanOrEqual(0.5)
      }
      expect(Math.abs(list.reduce((t, s) => t + s.texel[0], 0) / n)).toBeLessThan(0.13)
      expect(Math.abs(list.reduce((t, s) => t + s.texel[1], 0) / n)).toBeLessThan(0.13)
    }
  })

  it('keeps the fill near the top in a picture of few samples and opens it with more', () => {
    expect(domeReach(1)).toBe(0)
    let last = 0
    for (const n of [2, 8, 24, 64]) {
      expect(domeReach(n)).toBeGreaterThanOrEqual(last)
      expect(domeReach(n)).toBeLessThan(1)
      last = domeReach(n)
      for (const s of samples(n)) expect(Math.hypot(s.dome[0], s.dome[1])).toBeLessThanOrEqual(domeReach(n) + 1e-12)
      expect(domeSpread(n)).toBeGreaterThan(0.1)
      expect(domeSpread(n)).toBeLessThanOrEqual(0.3)
    }
    expect(domeReach(64)).toBe(domeReach(24))
  })

  it('spends about the same number of filter taps on a picture of any tier, inside the limits of the shader', () => {
    const f = shadowFilter
    for (const n of [1, ...counts]) {
      const taps = filterTaps(n, f.tapsPerPicture, f.minTaps, f.blurTaps)
      expect(taps).toBeGreaterThanOrEqual(f.minTaps)
      expect(taps).toBeLessThanOrEqual(f.blurTaps)
      expect(taps + 32 * n).toBeLessThan(32 * (n + 1))
    }
    expect(filterTaps(1, f.tapsPerPicture, f.minTaps, f.blurTaps)).toBe(f.blurTaps)
  })
})

describe('the glow', () => {
  it('is as wide a share of the picture at every size', () => {
    const rings = look.glow.rings.length
    const hd = glowLevels(1080, rings)
    expect(hd).toEqual({ levels: rings, first: 0 })
    expect(glowLevels(2160, rings)).toEqual({ levels: rings + 1, first: 1 })
    expect(glowLevels(540, rings)).toEqual({ levels: rings - 1, first: -1 })
    for (const h of [540, 1080, 1920, 2160]) {
      const g = glowLevels(h, rings)
      const widest = 2 ** g.levels / h
      expect(widest).toBeGreaterThan((2 ** rings / 1080) * 0.7)
      expect(widest).toBeLessThan((2 ** rings / 1080) * 1.45)
    }
  })

  it('starts above the brightest a surface can send back', () => {
    expect(look.glow.surfaceMax).toBeLessThanOrEqual(look.glow.threshold - look.glow.knee)
    expect(look.glow.surfaceKnee).toBeLessThan(look.glow.surfaceMax)
  })
})
