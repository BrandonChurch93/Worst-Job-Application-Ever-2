import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver, type BotName } from '../src/stage/bots'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage } from '../src/stage/stage'

function firstStrips(s: Stage, most: number): { high: number[]; early: boolean; gag: string; at: number } | null {
  let early = false
  while (s.time < most) {
    s.advance(1)
    const p = s.cursor.pose()
    if (!p.strips) continue
    if (!p.damage.includes('shredded') || !p.onPage) early = true
    const high: number[] = []
    const gag = s.page.gag() ?? ''
    const at = s.time
    for (let i = 0; i < stepHz / 4; i++) {
      const q = s.cursor.pose()
      high.push(q.strips ? Math.max(...q.strips.map((x) => x.z)) : -1)
      s.advance(1)
    }
    return { high, early, gag, at }
  }
  return null
}

describe('polish tug: the strips of the shredded arrow come out of the mouth', () => {
  const cases: [string, () => Stage][] = [
    ['the film of step 1', () => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })],
    ...config.live.bots.slice(0, 2).map((b): [string, () => Stage] => [`the live site, bot ${b}`, () => new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver(b as BotName, config.seed) })])
  ]
  for (const [name, make] of cases) {
    it(`${name}: they show only once the arrow is shredded, and lie low under the hood on their first frame`, () => {
      const got = firstStrips(make(), 200)
      expect(got).not.toBeNull()
      const g = got!
      console.log(`${name}: strips first at ${g.at.toFixed(3)} s in ${g.gag}; highest strip ${g.high[0]!.toFixed(2)} on the first step, ${g.high[4]!.toFixed(2)} a frame on, ${g.high[Math.round(stepHz * 0.12)]!.toFixed(2)} at 0.12 s`)
      expect(g.early).toBe(false)
      expect(g.gag).toBe('step1.shredded')
      expect(g.high[0]!).toBeLessThan(1)
      expect(g.high[Math.round(stepHz * 0.12)]!).toBeGreaterThan(g.high[0]!)
    })
  }
})
