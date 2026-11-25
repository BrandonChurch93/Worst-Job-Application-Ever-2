import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const frame = stepHz / config.film.fps
const drawn = (s: Stage): DrawList => {
  const list: DrawList = []
  s.page.draw(list)
  return list
}

describe('the strike of a bolt on the cursor', () => {
  it('draws one flash where the hit was, from the frame of the hit, for half a second, with no mark', () => {
    const s = film()
    const seen: { frame: number; x: number; y: number; left: number }[] = []
    let hitFrame = -1
    let hits = 0
    for (let i = 0; i < Math.round(9.5 * stepHz); i++) {
      s.advance(1)
      const st = s.page.save() as { thud: number; shock: number }
      if (hitFrame < 0 && st.thud < 1 / stepHz + 1e-9 && st.shock > 0) hitFrame = Math.floor(i / frame)
      if (i % frame !== frame - 1) continue
      const marks = drawn(s).filter((q) => /^scorch-9\d{4}$/.test(q.id))
      hits = Math.max(hits, marks.length)
      for (const m of marks) seen.push({ frame: Math.floor(i / frame), x: m.x, y: m.y, left: m.v![0]! })
    }
    expect(hitFrame).toBeGreaterThan(0)
    expect(hits).toBe(1)
    expect(seen[0]!.frame).toBe(hitFrame)
    expect(seen.length).toBeGreaterThanOrEqual(28)
    expect(seen.length).toBeLessThanOrEqual(31)
    for (const m of seen) {
      expect(m.x).toBe(seen[0]!.x)
      expect(m.y).toBe(seen[0]!.y)
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]!.left).toBeLessThan(seen[i - 1]!.left)
  })
})
