import { expect, test } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DECK } from '../src/pages/step1/keyboard'
import { MAIL } from '../src/pages/step1/script'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

test('the nervous wait of the email is held on the bare page above the board', () => {
  const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
  const want = [MAIL.run - 0.06]
  const seen: { y: number; x: number; speed: number; lean: number }[] = []
  for (let i = 1; i <= MAIL.run * stepHz && seen.length < want.length; i++) {
    s.advance(1)
    if (i / stepHz >= want[seen.length]! - 1e-9) {
      const p = s.cursor.pose()
      seen.push({ x: p.x, y: p.y, speed: s.cursor.speed, lean: p.lean + p.spin })
    }
  }
  expect(seen.length).toBe(1)
  for (const p of seen) {
    expect(p.y).toBeLessThan(DECK.y - 20)
    expect(p.x).toBeGreaterThan(DECK.x + MAIL.wait.x - 30)
    expect(p.speed).toBeLessThan(300)
  }
  expect(seen[0]!.lean).toBeLessThan(-0.3)
})
