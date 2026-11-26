import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { careersLayout, FIRST_CARDS, perkStates, TICKER } from '../src/pages/marketing/layout'
import { edgeLight, GLASS, troughGeometry } from '../src/pages/marketing/real/perk-cards'
import { glassHeights, PICTURE } from '../src/pages/marketing/real/glass-picture'
import { brushedHeights, BRUSHED } from '../src/pages/marketing/real/medal-picture'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'
import type { LayoutNode } from '../src/copy'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const drawn = (s: Stage): DrawList => {
  const list: DrawList = []
  s.page.draw(list)
  return list
}
const apply = config.film.beats.find((b) => b.id === 'marketing.apply')!

describe('the careers page after critic round 7', () => {
  it('shows whole items in the middle of the ticker at rest and at the key, with the same clear glass on both sides of them', () => {
    const s = film()
    for (const at of [0, apply.from]) {
      s.advance(Math.round(at * stepHz) - s.step)
      const list = drawn(s)
      const strip = list.find((d) => d.id === 'ticker-glass')!
      const clearFrom = strip.x + strip.v![0]! + strip.v![1]!
      const clearTo = strip.x + strip.w - strip.v![0]! - strip.v![1]!
      const runs = list.filter((d) => d.kind === 'text' && d.id.startsWith('ticker-') && d.w > 2)
      const inside = runs.filter((r) => r.x >= clearFrom - 0.01 && r.x + r.w <= clearTo + 0.01)
      expect(inside.length, `whole items at ${at} s`).toBeGreaterThanOrEqual(3)
      expect(inside.length, `every run in sight at ${at} s is whole`).toBe(runs.length)
      const first = Math.min(...inside.map((r) => r.x))
      const last = Math.max(...inside.map((r) => r.x + r.w))
      expect(Math.abs(first - strip.x - (strip.x + strip.w - last)), `centred at ${at} s`).toBeLessThan(1)
      const solidFrom = strip.x + strip.v![0]!
      const solidTo = strip.x + strip.w - strip.v![0]!
      for (const r of list.filter((d) => d.kind === 'text' && d.id.startsWith('ticker-') && d.w === 2)) {
        expect(r.x < solidFrom || r.x > solidTo, `${r.id} at ${at} s is under the solid frost`).toBe(true)
      }
    }
  })

  it('keeps the ends of the strip under solid frost at every quarter second of the film, so no word is cut by the end of the strip in sight', () => {
    const s = film()
    for (let i = 0; i < 56; i++) {
      s.advance(Math.round(0.25 * stepHz))
      const strip = drawn(s).find((d) => d.id === 'ticker-glass')!
      expect(strip.v![0]!).toBeGreaterThanOrEqual(TICKER.clip + TICKER.solid)
      expect(strip.v![1]!).toBeLessThan(TICKER.gap)
    }
  })

  it('lays the title, the promise and the rule on a shut card where the open card has them', () => {
    const find = (n: LayoutNode, id: string): LayoutNode | null => (n.id === id ? n : (n.children ?? []).map((c: LayoutNode) => find(c, id)).find(Boolean) ?? null)
    const root = careersLayout().layout
    for (let i = 0; i < FIRST_CARDS; i++) {
      const st = perkStates(i)
      const y = (id: string): number => (find(root, id)!.box as number[])[1]!
      expect(y(`perk-${i}-title`)).toBe(y(`perk-${i}-title-open`))
      expect(y(`perk-${i}-promise`)).toBe(y(`perk-${i}-promise-open`))
      expect(y(`perk-${i}-rule-shut`)).toBe(y(`perk-${i}-rule`))
      expect(find(root, `perk-${i}-rule-shut`)!.states).toEqual([st.shut])
      expect(find(root, `perk-${i}-fine`)!.states).toEqual([st.open])
    }
  })

  it('gives the glass a bright hairline and a shade toward the light, a pale rim away from it, and nothing on the flat face', () => {
    expect(edgeLight(0.4, 1)).toBeGreaterThan(1)
    expect(edgeLight(4, 1)).toBeLessThan(0.6)
    expect(edgeLight(4, 0.3)).toBeGreaterThan(edgeLight(4, 1))
    expect(edgeLight(0.5, -1)).toBeGreaterThan(1.5)
    expect(edgeLight(60, 1)).toBe(1)
    expect(edgeLight(60, -1)).toBe(1)
    expect(GLASS.bend).toBeGreaterThan(0)
  })

  it('computes its two pictures from the seed alone: the same seed gives the same picture, and both stay inside 0 to 1', () => {
    const a = glassHeights(config.seed)
    const b = glassHeights(config.seed)
    expect(a.length).toBe(PICTURE.size * PICTURE.size)
    let same = true
    let low = 1
    let high = 0
    for (let i = 0; i < a.length; i += 97) {
      if (a[i] !== b[i]) same = false
      low = Math.min(low, a[i]!)
      high = Math.max(high, a[i]!)
    }
    expect(same).toBe(true)
    expect(low).toBeGreaterThan(0.75)
    expect(high).toBeLessThan(1.02)
    const m = brushedHeights(config.seed)
    const n = brushedHeights(config.seed + 1)
    expect(m.length).toBe(BRUSHED.size * BRUSHED.size)
    let differs = 0
    for (let i = 0; i < m.length; i += 211) if (m[i] !== n[i]) differs++
    expect(differs).toBeGreaterThan(100)
  })

  it('beds a turning card in a trough of the page that is never darker than half the page', () => {
    const g = troughGeometry({ id: 'x', part: 'perk-cards', kind: 'box', x: 0, y: 0, w: 540, h: 248, z0: 0, z1: 12, tone: 'glass' })
    const c = g.getAttribute('color')
    const p = g.getAttribute('position')
    let least = 1
    let deepest = 0
    for (let i = 0; i < c.count; i++) {
      least = Math.min(least, c.getX(i))
      deepest = Math.min(deepest, p.getZ(i))
    }
    expect(least).toBeGreaterThan(0.4)
    expect(deepest).toBeLessThan(-124)
    g.dispose()
  })
})
