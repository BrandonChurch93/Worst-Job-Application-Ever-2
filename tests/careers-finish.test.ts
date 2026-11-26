import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { careersLayout } from '../src/pages/marketing/layout'
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
