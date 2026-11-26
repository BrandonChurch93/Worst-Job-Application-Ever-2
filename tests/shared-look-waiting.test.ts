import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { makeMaterials } from '../src/shell/materials'
import { isWaiting, WAITING_TOP } from '../src/shell/real/controls'
import { styleName, styles } from '../src/shell/real/type'
import type { Shape } from '../src/stage/types'

const light = (c: { r: number; g: number; b: number } | number[]): number => (Array.isArray(c) ? 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]! : 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b)
const cap = (o: Partial<Shape>): Shape => ({ id: 'continue-cap', part: 'shell', kind: 'capsule', role: 'button', x: 0, y: 0, w: 200, h: 72, z0: -4, z1: 14, tone: 'metal', ...o }) as Shape

describe('the waiting Continue', () => {
  const m = makeMaterials(config.seed)

  it('is the shell button of tone metal and nothing else', () => {
    expect(isWaiting(cap({}))).toBe(true)
    expect(isWaiting(cap({ tone: 'accent' }))).toBe(false)
    expect(isWaiting(cap({ part: 'boss-weapons' }))).toBe(false)
    expect(isWaiting(cap({ role: 'chip' }))).toBe(false)
    expect(isWaiting(undefined)).toBe(false)
  })

  it('carries a dark label on a pale cap at the least contrast type may have, with a margin', () => {
    const ink = styles()[styleName('frost', 'ink')]!
    const face = light(m.frosted.color)
    const word = light(ink.fill)
    expect(face).toBeGreaterThan(0.5)
    expect(word).toBeLessThan(face)
    const contrast = (face + 0.05) / (word + 0.05)
    expect(contrast).toBeGreaterThanOrEqual(config.layout.minTextContrast + 0.1)
    expect(contrast).toBeLessThan(5)
  })

  it('takes the dark ink whatever tone the label asks for', () => {
    expect(styleName('frost', 'inkLight')).toBe('frost:ink')
    expect(styleName('frost', 'ink')).toBe('frost:ink')
  })

  it('stands under the page in a socket that goes deeper', () => {
    const top = config.scale.heights.buttonSocket + WAITING_TOP
    expect(top).toBeLessThan(0)
    expect(top).toBeGreaterThan(config.scale.heights.buttonSocket)
  })

  it('is no gloss: rougher than the orange and with less clear coat', () => {
    expect(m.frosted.roughness).toBeGreaterThan(m.orange.roughness)
    expect(m.frosted.clearcoat).toBeLessThan(m.orange.clearcoat)
  })
})
