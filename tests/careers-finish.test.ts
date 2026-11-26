import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { careersLayout } from '../src/pages/marketing/layout'
import { darker, fallAt, fallOf, slabKey } from '../src/pages/marketing/real/perk-cards'
import { ROUND, VISITS } from '../src/pages/marketing/script'
import { boxOf } from '../src/shell/layout'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const KEY = config.film.beats.find((b) => b.id === 'marketing.apply')!.from

describe('careers finish: the walk from the third card to the button', () => {
  const s = new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
  const poses: { t: number; x: number; y: number }[] = []
  for (let i = 0; i < Math.round(KEY * stepHz); i++) {
    s.advance(1)
    const p = s.cursor.pose()
    poses.push({ t: (i + 1) / stepHz, x: p.x, y: p.y })
  }
  const { layout } = careersLayout()
  const cards = [0, 1, 2].map((i) => boxOf(layout, `perk-${i}`))
  const medal = boxOf(layout, 'award-0')

  it('goes round the card: the tip is never inside a card after it leaves the third', () => {
    const walk = poses.filter((p) => p.t > VISITS[2]!.leave)
    expect(walk.length).toBeGreaterThan(stepHz)
    for (const p of walk) {
      for (const c of cards) expect(p.x > c.x && p.x < c.x + c.w && p.y > c.y && p.y < c.y + c.h, `at ${p.t.toFixed(2)}`).toBe(false)
      expect(Math.hypot(p.x - medal.cx, p.y - medal.cy), `medal at ${p.t.toFixed(2)}`).toBeGreaterThan(medal.w / 2)
    }
  })

  it('takes the right margin and the lane above the cards, in that order', () => {
    const third = cards[2]!
    const walk = poses.filter((p) => p.t > VISITS[2]!.leave)
    const level = walk.filter((p) => p.y > third.y && p.y < third.y + third.h)
    expect(level.length).toBeGreaterThan(stepHz * 0.1)
    for (const p of level) expect(p.x - (third.x + third.w), `at ${p.t.toFixed(2)}`).toBeGreaterThan(12)
    const above = walk.filter((p) => p.x > third.x && p.x < third.x + third.w)
    for (const p of above.filter((q) => q.t > ROUND.up)) expect(third.y - p.y, `at ${p.t.toFixed(2)}`).toBeGreaterThan(12)
    expect(ROUND.aside).toBeGreaterThan(VISITS[2]!.leave)
    expect(ROUND.up).toBeGreaterThan(ROUND.aside)
    expect(ROUND.lane).toBeGreaterThan(ROUND.up)
  })
})

describe('careers finish: the glass darkens toward the right of the page', () => {
  const { layout } = careersLayout()
  const box = (i: number): { x: number; y: number; w: number; h: number } => boxOf(layout, `perk-${i}`)
  const shape = (i: number) => ({ id: `perk-${i}`, part: 'perk-cards', kind: 'box', x: box(i).x, y: box(i).y, w: box(i).w, h: box(i).h, z0: 0, z1: 12, tone: 'glass', r: 28, role: 'card' }) as never

  it('falls evenly with the page x, a little at the first card and most at the third', () => {
    const at = [0, 1, 2].map((i) => fallOf(shape(i)))
    expect(at[0]!).toBeGreaterThan(0.96)
    expect(at[0]!).toBeLessThan(1)
    expect(at[1]!).toBeLessThan(at[0]!)
    expect(at[2]!).toBeLessThan(at[1]!)
    expect(at[2]!).toBeGreaterThan(0.8)
    expect(fallAt(0) - fallAt(100)).toBeCloseTo(fallAt(1000) - fallAt(1100), 9)
  })

  it('gives each card of a row its own slab, darker at its right end than at its left', () => {
    expect(new Set([0, 1, 2].map((i) => slabKey(shape(i)))).size).toBe(3)
    const g = new THREE.PlaneGeometry(400, 100, 4, 1)
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 3).fill(0.5), 3))
    darker(g, shape(2))
    const p = g.getAttribute('position')
    const c = g.getAttribute('color')
    for (let i = 0; i < p.count; i++) expect(c.getX(i)).toBeCloseTo(0.5 * fallAt(box(2).x + box(2).w / 2 + p.getX(i)), 6)
    const bare = darker(new THREE.PlaneGeometry(10, 10), shape(0))
    expect(bare.getAttribute('color').getX(0)).toBeCloseTo(fallAt(box(0).x + box(0).w / 2 - 5), 6)
  })
})
