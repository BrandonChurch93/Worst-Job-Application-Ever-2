import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import type { LayoutNode } from '../src/copy'
import { careersLayout, COLOUR, GLOW, T } from '../src/pages/marketing/layout'
import { inkOf } from '../src/pages/marketing/real/careers-page'
import { flat, share, tint, WHITE } from '../src/pages/marketing/real/flat'
import { look } from '../src/post/look'

const lin = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const rgb = (hex: number): [number, number, number] => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]
const luminance = (c: [number, number, number]): number => 0.2126 * lin(c[0] / 255) + 0.7152 * lin(c[1] / 255) + 0.0722 * lin(c[2] / 255)
const contrast = (a: [number, number, number], b: [number, number, number]): number => {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
// What a flat colour comes out as on the screen: every channel stops at the white of the sheet.
const SHEET = 251.6
const shown = (hex: number): [number, number, number] => rgb(hex).map((v) => Math.min(SHEET, v)) as [number, number, number]
const over = (hex: number, under: number): [number, number, number] => shown(hex).map((v, i) => (v * shown(under)[i]!) / SHEET) as [number, number, number]
const least = config.layout.minTextContrast

describe('the finish of the careers page', () => {
  it('has one flat white for every sheet, short of pure white, and gives every colour under it its own light', () => {
    expect(WHITE[0]).toBe(WHITE[1])
    expect(WHITE[1]).toBe(WHITE[2])
    expect(Number.isFinite(WHITE[0])).toBe(true)
    expect(WHITE[0] * look.exposure).toBeLessThanOrEqual(1.3 + 1e-9)
    let last = -1
    for (let v = 0; v <= 255; v += 5) {
      const c = tint((v << 16) | (v << 8) | v)[0]
      expect(c).toBeGreaterThanOrEqual(last)
      last = c
    }
    const c = new THREE.Color().setHex(COLOUR.ink, THREE.SRGBColorSpace)
    expect(tint(COLOUR.ink)[0] * look.exposure).toBeCloseTo(c.r, 6)
    expect(share(0xffffff)).toEqual([1, 1, 1])
    for (const v of share(COLOUR.glow)) expect(v).toBeLessThanOrEqual(1)
    expect(share(COLOUR.glow)[2]).toBeLessThan(share(COLOUR.glow)[0])
    expect(flat().vertexColors).toBe(true)
    expect(flat()).toBe(flat())
  })

  it('keeps the fills of the picture and deepens the orange for type only, so that every pair reaches the measure', () => {
    expect(rgb(COLOUR.orange)).toEqual([233, 120, 50])
    expect(rgb(COLOUR.peach)).toEqual([255, 237, 217])
    expect(contrast(shown(COLOUR.orange), shown(COLOUR.white))).toBeLessThan(3.1)
    const own: [string, number, [number, number, number]][] = [
      ['white label on the button', COLOUR.white, shown(COLOUR.deep)],
      ['white label on the pressed button', COLOUR.white, shown(COLOUR.down)]
    ]
    for (const [name, type, ground] of own) expect(contrast(shown(type), ground), name).toBeGreaterThanOrEqual(least)
    const pairs: [string, number, [number, number, number]][] = [
      ['orange type on white', COLOUR.onWhite, shown(COLOUR.white)],
      ['orange type on the peach pill', COLOUR.onPeach, shown(COLOUR.peach)],
      ['grey type on white', COLOUR.greyType, shown(COLOUR.white)],
      ['grey type on the peach column', COLOUR.greyType, shown(COLOUR.peach)],
      ['grey type on the grey band', COLOUR.greyType, shown(COLOUR.band)],
      ['grey type on the middle of the glow', COLOUR.greyType, over(COLOUR.glow, COLOUR.white)],
      ['soft ink on the middle of the glow', COLOUR.soft, over(COLOUR.glow, COLOUR.white)],
      ['soft ink on the ticker', COLOUR.soft, shown(COLOUR.band)],
      ['ink on the peach column', COLOUR.ink, shown(COLOUR.peach)]
    ]
    for (const [name, type, ground] of pairs) expect(contrast(shown(type), ground), name).toBeGreaterThanOrEqual(least + 0.1)
    const hue = (hex: number): number => new THREE.Color(hex).getHSL({ h: 0, s: 0, l: 0 }).h
    for (const deep of [COLOUR.onWhite, COLOUR.onPeach, COLOUR.deep]) expect(Math.abs(hue(deep) - hue(COLOUR.orange))).toBeLessThan(0.012)
  })

  it('sets every run of type in an ink that reaches the measure on what the layout puts under it, at the least size or larger', () => {
    const { layout } = careersLayout()
    let runs = 0
    const visit = (n: LayoutNode, ground: [number, number, number], path: string): void => {
      let under = ground
      if (n.kind === 'pill' || n.kind === 'tickerBand') under = shown(n.tone === 'pocket' ? COLOUR.band : COLOUR.peach)
      if (n.kind === 'applyCap' || n.kind === 'stepDisc') under = shown(COLOUR.deep)
      if (n.kind === 'tick') under = shown(COLOUR.tick)
      if (n.kind === 'perkCard' || n.kind === 'quoteCard' || n.kind === 'faqRow' || n.kind === 'tableCard') under = shown(COLOUR.white)
      if (n.kind === 'text' && n.type) {
        runs++
        expect(n.type.px, n.id).toBeGreaterThanOrEqual(config.layout.minTextPx)
        const type = shown(inkOf({ tone: (n.tone ?? 'ink') as never, type: n.type }))
        const inGlow = path.includes('sheet-top') && under[0] === SHEET && under[1] === SHEET
        const grounds = [under]
        if (inGlow) grounds.push(over(COLOUR.glow, COLOUR.white))
        if (path.includes('compare-table') && n.id.endsWith('-us')) grounds.push(shown(COLOUR.peach))
        if (path.includes('compare-table') && n.id.startsWith('compare-head')) grounds.push(shown(COLOUR.band))
        for (const g of grounds) expect(contrast(type, g), `${n.id} on ${g.map(Math.round)}`).toBeGreaterThanOrEqual(least)
      }
      for (const c of n.children ?? []) visit(c, under, `${path}/${n.id}`)
    }
    visit(layout, shown(COLOUR.white), '')
    expect(runs).toBeGreaterThan(120)
  })

  it('has one type scale in the site\'s own face, with the display weight for the headline and the section headings only', () => {
    const fonts = new Set(Object.values(T).map((t) => t.font))
    for (const f of fonts) expect(f).toMatch(/^inter(-display)?-(400|500|600|800)$/)
    expect(T.display.font).toBe('inter-display-800')
    expect(T.section.font).toBe('inter-display-800')
    const sizes = [...new Set(Object.values(T).map((t) => t.px))].sort((a, b) => a - b)
    expect(sizes[0]).toBeGreaterThanOrEqual(config.layout.minTextPx)
    expect(sizes.length).toBeLessThanOrEqual(8)
    expect(GLOW.y + GLOW.ry).toBeLessThan(1009)
    expect(GLOW.y - GLOW.ry).toBeGreaterThan(97)
  })
})
