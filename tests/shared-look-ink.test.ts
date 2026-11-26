import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { makeMaterials } from '../src/shell/materials'
import { styleName, styles } from '../src/shell/real/type'

const light = (c: { r: number; g: number; b: number } | number[]): number => (Array.isArray(c) ? 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]! : 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b)

describe('the inks of the page', () => {
  const m = makeMaterials(config.seed)
  const page = light(m.ceramic.color)
  const on = (name: string): number => (page + 0.05) / (light(styles()[name]!.fill) + 0.05)

  it('has three voices on the page, each quieter than the one before and none under the least contrast', () => {
    expect(styleName('page', 'ink', 'inter-700')).toBe('page:ink')
    expect(styleName('page', 'ink', 'inter-400')).toBe('page:soft')
    expect(styleName('page', 'ink', 'inter-400', 'soft')).toBe('page:quiet')
    expect(on('page:ink')).toBeGreaterThan(on('page:soft'))
    expect(on('page:soft')).toBeGreaterThan(on('page:quiet'))
    expect(on('page:quiet')).toBeGreaterThanOrEqual(config.layout.minTextContrast)
  })

  it('keeps the quiet ink for a run that asks for it and the soft ink on glass as it was', () => {
    expect(styleName('glass', 'ink', 'inter-400', 'soft')).toBe('glass:soft')
    expect(styleName('page', 'inkLight', 'inter-400', 'soft')).toBe('page:light')
  })

  it('has no ink of pure black', () => {
    for (const [name, style] of Object.entries(styles())) expect(Math.max(...style.fill), name).toBeGreaterThan(0)
  })
})
