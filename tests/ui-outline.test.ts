import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { copy } from '../src/copy'
import { measure, registerFont } from '../src/shell/metrics'
import { outline, spaceOf } from '../src/ui/outline'

const NAME = 'inter-500'

beforeAll(() => {
  registerFont(NAME, JSON.parse(readFileSync(new URL(`../public/fonts/${NAME}.json`, import.meta.url), 'utf8')))
})

describe('the words of the controls, drawn from the outlines the stage uses', () => {
  it('draws every word of the controls and is as wide as the stage would set it', () => {
    for (const text of [copy.live.skip, copy.live.watchFilm]) {
      const o = outline(NAME, text)
      expect(o.d.startsWith('M')).toBe(true)
      expect(o.d.endsWith('Z')).toBe(true)
      expect(o.d).not.toMatch(/NaN|undefined/)
      expect(o.width).toBeCloseTo(measure(NAME, text, o.unitsPerEm).width, 6)
      expect(o.top).toBeGreaterThan(0)
      expect(o.bottom).toBeLessThan(0)
    }
  })

  it('closes every contour it opens', () => {
    const o = outline(NAME, copy.live.watchFilm)
    expect((o.d.match(/M/g) ?? []).length).toBe((o.d.match(/Z/g) ?? []).length)
  })

  it('keeps a clock the same width whatever its digits', () => {
    const widths = ['0:00 / 2:33', '1:11 / 2:33', '2:08 / 2:33'].map((t) => outline(NAME, t, true).width)
    expect(new Set(widths).size).toBe(1)
  })

  it('gives a space a width between a tenth and a half of the size', () => {
    expect(spaceOf(NAME)).toBeGreaterThan(0.1)
    expect(spaceOf(NAME)).toBeLessThan(0.5)
  })
})
