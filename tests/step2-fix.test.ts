import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { volumeMask } from '../src/pages/step2'
import { scaleOf, STAGE, DIAL, HOLE } from '../src/pages/step2/layout'
import { filmAt } from '../src/pages/step2/script'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList, type Shape } from '../src/stage/stage'

const LONG = 24.85
const BAND_TOP = 948
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2').map((f) => (f.closes !== undefined ? { ...f, closes: LONG } : f)), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
const to = (s: Stage, seconds: number): Shape[] => {
  s.advance(Math.round(seconds * stepHz) - s.step)
  const list: DrawList = []
  s.page.draw(list)
  return list as Shape[]
}
const coinsOf = (list: Shape[]): Shape[] => list.filter((x) => /^coin-\d+$/.test(x.id))

describe('step 2 after its fixer', () => {
  it('lays the coins down on the bare page above the lowest band, where all but the last few lie still', () => {
    const s = film()
    const at = to(s, 13.86)
    const later = to(s, 13.9)
    const lying = coinsOf(at)
    expect(lying.length).toBeGreaterThanOrEqual(8)
    expect(at.some((x) => /-tray$/.test(x.id))).toBe(false)
    let still = 0
    for (const coin of lying) {
      expect(coin.y + coin.h, coin.id).toBeLessThanOrEqual(BAND_TOP)
      const then = later.find((x) => x.id === coin.id)!
      if (Math.hypot(then.x - coin.x, then.y - coin.y) < 0.01) still++
    }
    expect(still).toBeGreaterThanOrEqual(8)
  })

  it('sweeps every coin into the hatch as the machine goes: each is last seen above the floor of the open hatch and inside it, and none once it has shut', () => {
    const s = film()
    const last = new Map<string, { x: number; y: number; hole: Shape | undefined }>()
    let seen = 0
    for (let t = 13.9; t <= 14.6; t += 1 / 120) {
      const list = to(s, t)
      const hole = list.find((x) => x.id === 'birth-hole')
      const coins = coinsOf(list).filter((x) => x.z1 > -HOLE.pit)
      seen += coins.length
      if (!hole && t > 14.2) expect(coins.length, `at ${t.toFixed(3)}`).toBe(0)
      for (const coin of coins) last.set(coin.id, { x: coin.x + coin.w / 2, y: coin.y + coin.h / 2, hole })
    }
    expect(seen).toBeGreaterThan(100)
    expect(last.size).toBeGreaterThanOrEqual(8)
    for (const [id, at] of last) {
      expect(at.hole, id).toBeDefined()
      expect(at.x, id).toBeGreaterThan(at.hole!.x)
      expect(at.x, id).toBeLessThan(at.hole!.x + at.hole!.w)
      expect(at.y, id).toBeGreaterThan(at.hole!.y)
      expect(at.y, id).toBeLessThan(at.hole!.y + at.hole!.h)
    }
  })

  it('keeps the arrow at the grip while the crank winds back to run away', () => {
    const s = film()
    for (let t = 14.6; t <= 15.28; t += 0.02) {
      const list = to(s, filmAt(t))
      const grip = list.find((x) => x.id === 'crank-grip')!
      const c = s.cursor.pose()
      expect(Math.hypot(c.x - (grip.x + grip.w / 2), c.y - (grip.y + grip.h / 2)), `at ${t.toFixed(2)}`).toBeLessThan(52 * STAGE.times[2]!)
    }
  })

  it('stands the tip on the lower right shoulder of the cap at the dial key', () => {
    const s = film()
    for (const t of [3.2, 3.3, 3.45]) {
      to(s, filmAt(t))
      const c = s.cursor.pose()
      expect(Math.hypot(c.x - scaleOf(0).x(DIAL.cx + 15), c.y - scaleOf(0).y(DIAL.cy + 14)), `at ${t}`).toBeLessThan(6 * STAGE.times[0]!)
    }
  })

  it('shows the level as a whole percent', () => {
    expect(volumeMask(0.314).startsWith('31')).toBe(true)
    expect(volumeMask(0.314).length).toBe(3)
    expect(volumeMask(1).startsWith('100')).toBe(true)
    const list = to(film(), filmAt(15.2))
    expect(list.some((x) => x.kind === 'text' && x.words === 'runtime:step2.volume')).toBe(true)
  })
})
