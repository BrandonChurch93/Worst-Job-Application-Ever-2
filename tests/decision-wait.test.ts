import { expect, test } from 'vitest'
import { dotCover, gridUv, MATRIX } from '../src/pages/step5/real/waitMatrix'

test('one cell of the wait display is a round lamp: full at its middle, out at its corners, the same on both axes', () => {
  expect(dotCover(0.5, 0.5)).toBe(1)
  expect(dotCover(0, 0)).toBe(0)
  expect(dotCover(0.5, 0)).toBe(0)
  expect(dotCover(0.5, 0.5 - (MATRIX.core + MATRIX.edge) / 2)).toBeCloseTo(0.5, 5)
  expect(dotCover(0.2, 0.7)).toBeCloseTo(dotCover(0.7, 0.2), 9)
})

test('the grid of lamps is laid by place alone, one cell a pitch', () => {
  const uv = gridUv([0, 0, 0, MATRIX.pitch * 3, -MATRIX.pitch * 2, 0], 0, 0)
  expect(Array.from(uv)).toEqual([0, 0, 3, -2])
})
