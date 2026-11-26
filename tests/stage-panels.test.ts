import { describe, expect, it } from 'vitest'
import { panelPlan } from '../src/stage/panels'

describe('a sheet in panels', () => {
  it('lays three panels across the picture as the approved clear ball sheet does', () => {
    const p = panelPlan(1920, 3, 21)
    expect(p.count).toBe(3)
    expect(p.gutter).toBe(21)
    expect(p.width).toBe(626)
    expect(p.left).toEqual([0, 647, 1294])
    expect(p.left[2]! + p.width).toBe(1920)
  })

  it('keeps every panel the same width and the whole inside the picture at any format', () => {
    for (const width of [960, 1280, 1920, 3840]) {
      for (const count of [2, 3, 4, 5]) {
        const p = panelPlan(width, count, (21 * width) / 1920)
        const end = p.left[count - 1]! + p.width
        expect(p.left[0]).toBeGreaterThanOrEqual(0)
        expect(end).toBeLessThanOrEqual(width)
        expect(width - end - p.left[0]!).toBeLessThanOrEqual(1)
        for (let i = 1; i < count; i++) expect(p.left[i]! - p.left[i - 1]!).toBe(p.width + p.gutter)
      }
    }
  })

  it('is one picture with no gutter when there is one panel', () => {
    expect(panelPlan(1920, 1, 21)).toEqual({ count: 1, gutter: 0, width: 1920, left: [0] })
  })
})
