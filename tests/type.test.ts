import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { RealContext } from '../src/real/types'
import { segmentsFor, setRun, Sheet, styleName, styles, type, type RunSpec } from '../src/shell/real/type'
import type { Shape } from '../src/stage/types'

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

describe('type: the runs of a page as one sheet', () => {
  const shape = (id: string, key: string, x: number, text?: string): Shape =>
    ({ id, kind: 'text', part: 'type', tone: 'ink', x, y: 100, w: 300, h: 30, z0: 0, z1: 0, words: key, text, type: { font: 'inter-500', px: 22 } }) as unknown as Shape
  const context = (list: Shape[]): RealContext => ({ page: 'step1', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })
  const set = (page: THREE.Group, s: Shape, ctx: RealContext): THREE.Object3D => {
    const o = type.make(s, ctx)
    page.add(o)
    o.position.set(s.x + s.w / 2 - 960, 540 - (s.y + s.h / 2), s.z0)
    type.pose!(o, s, ctx)
    return o
  }
  const sheetOf = (page: THREE.Group): Sheet => page.children.find((c) => c instanceof Sheet) as Sheet
  const part = (sheet: Sheet, from: number, to: number): number[] => Array.from((sheet.geometry.getAttribute('position').array as Float32Array).subarray(from, to))

  it('draws every run of one setting as one mesh, and only the runs on show', () => {
    const a = shape('a', 'runtime:test.a', 100, 'First name')
    const b = shape('b', 'runtime:test.b', 600, 'Email')
    const ctx = context([a, b])
    const page = new THREE.Group()
    const oa = set(page, a, ctx)
    const ob = set(page, b, ctx)
    page.updateMatrixWorld(true)
    const sheets = page.children.filter((c) => c instanceof Sheet)
    expect(sheets.length).toBe(1)
    const sheet = sheetOf(page)
    const both = sheet.geometry.getIndex()!.count
    expect(sheet.visible).toBe(true)
    oa.visible = false
    page.updateMatrixWorld(true)
    const one = sheet.geometry.getIndex()!.count
    expect(one).toBeGreaterThan(0)
    expect(one).toBeLessThan(both)
    ob.visible = false
    page.updateMatrixWorld(true)
    expect(sheet.visible).toBe(false)
    oa.visible = true
    ob.visible = true
    page.updateMatrixWorld(true)
    expect(sheet.geometry.getIndex()!.count).toBe(both)
    type.drop!(oa)
    type.drop!(ob)
    expect(page.children.some((c) => c instanceof Sheet)).toBe(false)
  })

  it('a changed word or a moved run changes only its own part of the sheet', () => {
    const a = shape('a', 'runtime:test.a', 100, 'First name')
    const b = shape('b', 'runtime:test.b', 600, 'Email')
    const ctx = context([a, b])
    const page = new THREE.Group()
    const oa = set(page, a, ctx)
    const ob = set(page, b, ctx)
    page.updateMatrixWorld(true)
    const sheet = sheetOf(page)
    const total = sheet.geometry.getAttribute('position').array.length
    const alone = setRun(spec('First name', { x: -150, y: 15 - 16 })).position.length
    const first = part(sheet, 0, alone)
    const second = part(sheet, alone, total)
    ob.position.x += 40
    page.updateMatrixWorld(true)
    expect(part(sheet, 0, alone)).toEqual(first)
    const moved = part(sheet, alone, total)
    expect(moved.length).toBe(second.length)
    for (let i = 0; i < moved.length; i += 3) expect(moved[i]! - second[i]!).toBeCloseTo(40, 3)
    type.pose!(ob, { ...b, text: 'Emails' } as Shape, ctx)
    page.updateMatrixWorld(true)
    expect(part(sheet, 0, alone)).toEqual(first)
    expect(sheet.geometry.getAttribute('position').array.length).toBeGreaterThan(total)
    type.drop!(oa)
    type.drop!(ob)
  })
})
