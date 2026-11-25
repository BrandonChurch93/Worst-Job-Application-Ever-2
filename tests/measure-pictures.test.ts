import { describe, expect, it } from 'vitest'
import { coverageKinds, isBareId, linear, texelCount } from '../tools/lib/measure-pictures.mjs'
import { bareFloor, edgeCount } from '../tools/lib/measure-core.mjs'
import { COC_RANGE, TEXEL_RANGE, idColour } from '../src/diagnostics/views'

const srgb = (v: number): number => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
const pixels = (list: number[][]): Uint8Array => Uint8Array.from(list.flatMap((p) => p.map(srgb)))
const ranges = { texel: TEXEL_RANGE, coc: COC_RANGE }
const limits = { minTexelsPerPixel: 1, focusCocPx: 1.5 }

describe('reading a view back', () => {
  it('a byte of a view is the sRGB code of a linear value', () => {
    expect(linear(0)).toBe(0)
    expect(linear(255)).toBe(1)
    for (const v of [0.05, 0.25, 0.5, 0.9]) expect(linear(srgb(v))).toBeCloseTo(v, 2)
  })
  it('every part colour of the ids view counts as something, and its ground as nothing', () => {
    for (const name of ['shell', 'keyboard-deck', 'cursor-body', 'table-layout', 'unnamed']) {
      const [r, g, b] = idColour(name).map(srgb) as [number, number, number]
      expect(isBareId(r, g, b)).toBe(false)
    }
    expect(isBareId(0, 0, 0)).toBe(true)
    expect(isBareId(srgb(0.4), srgb(0.2), 0)).toBe(true)
  })
  it('M1 counts the bare pixels on the edge of an ids picture', () => {
    const part = idColour('shell')
    const data = pixels([part, part, part, part, part, part, [0, 0, 0], part, part])
    expect(edgeCount(data, 3, 3, 3, isBareId)).toEqual({ pixels: 8, bare: 1 })
  })
})

describe('M2 from the texels view', () => {
  it('counts textured pixels, leaves out what is out of focus, and finds the soft ones', () => {
    const data = pixels([
      [0, 0, 0],
      [2 / TEXEL_RANGE, 1, 0],
      [0.5 / TEXEL_RANGE, 1, 0],
      [0.5 / TEXEL_RANGE, 1, 4 / COC_RANGE],
      [1.5 / TEXEL_RANGE, 1, 1 / COC_RANGE],
      [0.2 / TEXEL_RANGE, 0, 0],
    ])
    expect(texelCount(data, 6, 1, 3, ranges, limits)).toEqual({ pixels: 6, textured: 4, counted: 3, soft: 1 })
  })
  it('finds no textured pixel in a picture of untextured parts', () => {
    const data = pixels([[0, 0, 0], [0, 0, 0.3], [0, 0, 0]])
    expect(texelCount(data, 3, 1, 3, ranges, limits).textured).toBe(0)
  })
})

describe('M8 from the coverage view', () => {
  it('reads black as bare floor, white as a mark and the grey between as nothing', () => {
    const data = pixels([[0, 0, 0], [1, 1, 1], [0.2, 0.2, 0.2], [0.02, 0.02, 0.02], [0.9, 0.9, 0.9]])
    expect([...coverageKinds(data, 5, 1, 3)]).toEqual([1, 2, 0, 1, 2])
  })
  it('counts the floor that lies too far from any mark', () => {
    const row = [[1, 1, 1], ...Array.from({ length: 9 }, () => [0, 0, 0])]
    const kinds = coverageKinds(pixels(row), 10, 1, 3)
    expect(bareFloor(kinds, 10, 1, 4)).toEqual({ floor: 10, bare: 5, open: 9 })
  })
})
