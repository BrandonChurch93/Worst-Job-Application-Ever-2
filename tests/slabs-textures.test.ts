import { describe, expect, it } from 'vitest'
import { creaseMap, fibreMap, STOCK } from '../src/pages/step1/real/paperStock'

const bytes = (t: { image: { data: ArrayLike<number> | null } }): Uint8Array => t.image.data as Uint8Array

describe('the textures of the paper', () => {
  it('are made from the seed alone: the same seed gives the same picture', () => {
    const a = fibreMap(64, 11)
    const b = fibreMap(64, 11)
    const c = fibreMap(64, 12)
    expect(Array.from(bytes(a))).toEqual(Array.from(bytes(b)))
    expect(Array.from(bytes(a))).not.toEqual(Array.from(bytes(c)))
    const k1 = creaseMap(48, 64, 11, 220, 300, 5)
    const k2 = creaseMap(48, 64, 11, 220, 300, 5)
    expect(Array.from(bytes(k1))).toEqual(Array.from(bytes(k2)))
  })

  it('hold no pure white and no pure black in the fibre', () => {
    const d = bytes(fibreMap(128, STOCK.seed))
    let lo = 255
    let hi = 0
    for (let i = 0; i < d.length; i += 4) {
      lo = Math.min(lo, d[i]!)
      hi = Math.max(hi, d[i]!)
    }
    expect(lo).toBeGreaterThan(190)
    expect(hi).toBeLessThan(255)
  })

  it('stay under eight megabytes with their smaller copies', () => {
    const mb = ((STOCK.fibrePx * STOCK.fibrePx + STOCK.creaseW * STOCK.creaseH) * 4 * (4 / 3)) / (1024 * 1024)
    expect(mb).toBeLessThan(8)
  })
})
