import { describe, expect, it } from 'vitest'
import { segmentsFor, setRun, styleName, styles, type RunSpec } from '../src/shell/real/type'

const spec = (line: string, over: Partial<RunSpec> = {}): RunSpec => ({
  font: 'inter-500',
  px: 22,
  lines: [line],
  align: 'left',
  x: 0,
  y: 0,
  lead: 28,
  style: styles()['page:ink'],
  ...over
})

const same = (a: ArrayLike<number>, b: ArrayLike<number>): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

describe('type: one run', () => {
  it('is the same geometry for the same words', () => {
    const a = setRun(spec('First name'))
    const b = setRun(spec('First name'))
    expect(a.triangles).toBeGreaterThan(0)
    expect(same(a.position, b.position)).toBe(true)
    expect(same(a.normal, b.normal)).toBe(true)
    expect(same(a.colour, b.colour)).toBe(true)
    expect(same(a.index, b.index)).toBe(true)
  })

  it('changes only its own run when a word changes', () => {
    const label = setRun(spec('Last name'))
    const before = setRun(spec('Perpl', { px: 26, font: 'inter-400', style: styles()['glass:ink'] }))
    const after = setRun(spec('Perple', { px: 26, font: 'inter-400', style: styles()['glass:ink'] }))
    const labelAgain = setRun(spec('Last name'))
    expect(same(before.position, after.position)).toBe(false)
    expect(after.triangles).toBeGreaterThan(before.triangles)
    expect(same(label.position, labelAgain.position)).toBe(true)
    expect(same(label.index, labelAgain.index)).toBe(true)
  })

  it('keeps the letters already set where they were when one is added', () => {
    const a = setRun(spec('Perpl', { style: styles()['glass:ink'] }))
    const b = setRun(spec('Perple', { style: styles()['glass:ink'] }))
    const xs = (d: { position: Float32Array }): number[] => {
      const out: number[] = []
      for (let i = 0; i < d.position.length; i += 3) out.push(d.position[i])
      return out
    }
    const left = (d: { position: Float32Array }): number => Math.min(...xs(d))
    expect(left(a)).toBeCloseTo(left(b), 5)
  })

  it('holds no number that is not a number, and no pure black or pure white', () => {
    for (const [name, style] of Object.entries(styles())) {
      const d = setRun(spec('Submit 12345', { style }))
      for (const v of d.position) expect(Number.isFinite(v), name).toBe(true)
      for (const v of d.normal) expect(Number.isFinite(v), name).toBe(true)
      for (let i = 0; i < d.colour.length; i += 4) {
        const sum = d.colour[i] + d.colour[i + 1] + d.colour[i + 2]
        expect(sum, name).toBeGreaterThan(0)
        expect(sum, name).toBeLessThan(3)
      }
    }
  })

  it('gives every shoulder vertex the way back to its outline, and no fill vertex any', () => {
    const d = setRun(spec('Hg'))
    expect(d.ring.length).toBe((d.position.length / 3) * 2)
    let moved = 0
    for (let i = 0; i < d.ring.length; i += 2) {
      const far = Math.hypot(d.ring[i]!, d.ring[i + 1]!)
      expect(far).toBeLessThan(4)
      if (far > 0) {
        moved++
        expect(d.position[(i / 2) * 3 + 2]).toBe(0)
      }
    }
    expect(moved).toBeGreaterThan(0)
  })

  it('sets an empty run as no triangles', () => {
    const d = setRun(spec(''))
    expect(d.triangles).toBe(0)
  })

  it('centres and right-aligns on the anchor', () => {
    const box = (d: { position: Float32Array }): [number, number] => {
      let lo = Infinity
      let hi = -Infinity
      for (let i = 0; i < d.position.length; i += 3) {
        lo = Math.min(lo, d.position[i])
        hi = Math.max(hi, d.position[i])
      }
      return [lo, hi]
    }
    const c = box(setRun(spec('Enter', { align: 'centre' })))
    const r = box(setRun(spec('Enter', { align: 'right' })))
    expect(Math.abs(c[0] + c[1])).toBeLessThan(4)
    expect(r[1]).toBeLessThan(4)
  })
})

describe('type: the setting of a run', () => {
  it('is named by what the run lies on and its ink', () => {
    expect(styleName('page', 'ink')).toBe('page:ink')
    expect(styleName('metal', 'ink')).toBe('metal:ink')
    expect(styleName('gloss', 'inkLight')).toBe('gloss:light')
    expect(styleName('metal', 'inkLight')).toBe('gloss:light')
    expect(styleName('glass', 'ink')).toBe('glass:ink')
    expect(styleName('smoked', 'ink')).toBe('gloss:light')
    expect(styleName('page', 'ink', 'inter-400')).toBe('page:soft')
    expect(styleName('page', 'ink', 'inter-500')).toBe('page:ink')
    expect(styleName('glass', 'ink', 'inter-400')).toBe('glass:ink')
    expect(styles()['page:soft']).toBeDefined()
    for (const g of ['page', 'cap', 'glass', 'paper', 'metal', 'smoked', 'gloss'] as const) {
      expect(styles()[styleName(g, 'ink')]).toBeDefined()
      expect(styles()[styleName(g, 'inkLight')]).toBeDefined()
    }
  })

  it('spends more curve steps on larger type', () => {
    expect(segmentsFor(18)).toBeLessThan(segmentsFor(60))
    expect(segmentsFor(60)).toBeLessThanOrEqual(segmentsFor(200))
  })
})
