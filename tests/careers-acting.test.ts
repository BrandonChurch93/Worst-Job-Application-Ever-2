import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { FLIP_SECONDS } from '../src/pages/marketing'
import { careersLayout } from '../src/pages/marketing/layout'
import { CUES, PRESS_AT, SCROLL, scrollAt, TURN_AT, VISITS } from '../src/pages/marketing/script'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const steps = (seconds: number): number => Math.round(seconds * stepHz)

function boxOf(id: string): number[] {
  let found: number[] | null = null
  const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
    if (n.id === id) found = n.box
    for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
  }
  walk(careersLayout().layout)
  return found!
}

describe('the acting of the arrow on the careers page', () => {
  const s = film()
  const poses: { t: number; x: number; y: number; z: number; scroll: number; reaction: string | null; taken: boolean }[] = []
  for (let i = 0; i < steps(14); i++) {
    s.advance(1)
    if (s.page.id !== 'marketing') break
    const p = s.cursor.pose()
    poses.push({ t: (i + 1) / stepHz, x: p.x, y: p.y, z: p.z, scroll: s.page.scroll(), reaction: p.reaction, taken: s.cursor.taken })
  }
  const at = (t: number): (typeof poses)[number] => poses[Math.min(poses.length - 1, steps(t) - 1)]!

  it('scrolls only between the beats it is told to, never while a card is being read, and is at the top for the key and for Apply', () => {
    expect(SCROLL[0]).toEqual([0, 0])
    expect(SCROLL[SCROLL.length - 1]![1]).toBe(0)
    expect(SCROLL[SCROLL.length - 1]![0]).toBeLessThan(11)
    for (let i = 1; i < SCROLL.length; i++) expect(SCROLL[i]![0]).toBeGreaterThan(SCROLL[i - 1]![0])
    const down = scrollAt(VISITS[0]!.on)
    for (const v of VISITS) for (const t of [v.on, v.at, v.off]) expect(scrollAt(t)).toBe(down)
    for (const t of [0, 1, 2]) expect(scrollAt(t)).toBe(0)
    for (const t of [10.8, 11, PRESS_AT, TURN_AT, 14]) expect(scrollAt(t)).toBe(0)
    let fastest = 0
    for (let i = 1; i <= 14 * 60; i++) fastest = Math.max(fastest, Math.abs(scrollAt(i / 60) - scrollAt((i - 1) / 60)) * 60)
    expect(fastest).toBeLessThan(2400)
    expect(fastest).toBeGreaterThan(600)
  })

  it('stands on each of the first three cards long enough for its back to be read', () => {
    VISITS.forEach((v, i) => {
      const card = boxOf(`perk-${i}`)
      for (const t of [v.at + 0.1, (v.at + v.off) / 2, v.off - 0.02]) {
        const p = at(t)
        expect(p.x, `card ${i} at ${t}`).toBeGreaterThan(card[0]!)
        expect(p.x, `card ${i} at ${t}`).toBeLessThan(card[0]! + card[2]!)
        expect(p.y, `card ${i} at ${t}`).toBeGreaterThan(card[1]!)
        expect(p.y, `card ${i} at ${t}`).toBeLessThan(card[1]! + card[3]!)
      }
      expect(v.off - v.at - FLIP_SECONDS).toBeGreaterThanOrEqual(0.5)
      expect(v.on).toBeGreaterThanOrEqual(2)
      expect(v.off).toBeLessThan(8)
    })
  })

  it('stays on the screen the whole time, and walks rather than flies', () => {
    for (const p of poses) {
      expect(p.x, `${p.t}`).toBeGreaterThan(20)
      expect(p.x, `${p.t}`).toBeLessThan(1900)
      expect(p.y - p.scroll, `${p.t}`).toBeGreaterThan(-40)
      expect(p.y - p.scroll, `${p.t}`).toBeLessThan(1080)
    }
    let fastest = 0
    for (let i = 1; i < poses.length; i++) {
      const a = poses[i - 1]!
      const b = poses[i]!
      if (a.taken || b.taken) continue
      fastest = Math.max(fastest, Math.hypot(b.x - a.x, b.y - b.scroll - (a.y - a.scroll)) * stepHz)
    }
    expect(fastest).toBeLessThan(3200)
  })

  it('winds up, jumps on the button of the hero and stamps it before the page turns', () => {
    const cap = boxOf('hero-cta-cap')
    expect(CUES.map((c) => c.react).filter(Boolean)).toEqual(['anticipate', 'jump', 'anticipate', 'startle'])
    const press = s.events.find((e) => e.name === 'button-press')!
    expect(press.step / stepHz).toBeGreaterThan(PRESS_AT)
    expect(press.step / stepHz).toBeLessThan(TURN_AT)
    const p = at(press.step / stepHz + 0.05)
    expect(p.x).toBeGreaterThan(cap[0]!)
    expect(p.x).toBeLessThan(cap[0]! + cap[2]!)
    expect(p.y).toBeGreaterThan(cap[1]!)
    expect(p.y).toBeLessThan(cap[1]! + cap[3]!)
    const air = poses.filter((q) => q.t > PRESS_AT && q.t < press.step / stepHz)
    expect(Math.max(...air.map((q) => q.z))).toBeGreaterThan(60)
    expect(at(11).taken).toBe(false)
  })
})
