import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { volumeMask } from '../src/pages/step2'
import { DIAL, TRAY_R, TRAY_Z } from '../src/pages/step2/layout'
import { trayFoot } from '../src/pages/step2/real/rows'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList, type Shape } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
const to = (s: Stage, seconds: number): Shape[] => {
  s.advance(Math.round(seconds * stepHz) - s.step)
  const list: DrawList = []
  s.page.draw(list)
  return list as Shape[]
}
const coinsOf = (list: Shape[]): Shape[] => list.filter((x) => /^coin-\d+$/.test(x.id))

describe('step 2 after its fixer', () => {
  it('lays the coins down inside the tray, where all but the last few lie still', () => {
    const s = film()
    const at = to(s, 13.1)
    const later = to(s, 13.25)
    const lying = coinsOf(at)
    expect(lying.length).toBeGreaterThanOrEqual(8)
    const tray = at.find((x) => x.id === 'birth-tray')!
    let still = 0
    for (const coin of lying) {
      expect(coin.y + coin.h, coin.id).toBeLessThanOrEqual(tray.y + tray.h - trayFoot(Math.abs(TRAY_Z)))
      expect(coin.y + coin.h, coin.id).toBeGreaterThan(tray.y + tray.h - 80)
      const then = later.find((x) => x.id === coin.id)!
      if (Math.hypot(then.x - coin.x, then.y - coin.y) < 0.01) still++
    }
    expect(still).toBeGreaterThanOrEqual(8)
  })

  it('draws no coin past the edge of the tray as it shuts', () => {
    const s = film()
    let seen = 0
    for (let t = 12.0; t <= 13.8; t += 0.025) {
      const list = to(s, t)
      const tray = list.find((x) => x.id === 'birth-tray')
      const coins = coinsOf(list)
      seen += coins.length
      if (!tray) {
        expect(coins.length, `at ${t.toFixed(3)}`).toBe(0)
        continue
      }
      for (const coin of coins) expect(coin.y + coin.h, `${coin.id} at ${t.toFixed(3)}`).toBeLessThanOrEqual(tray.y + tray.h)
    }
    expect(seen).toBeGreaterThan(100)
  })

  it('keeps the arrow at the grip while the crank winds back to run away', () => {
    const s = film()
    for (let t = 14.6; t <= 15.28; t += 0.02) {
      const list = to(s, t)
      const grip = list.find((x) => x.id === 'crank-grip')!
      const c = s.cursor.pose()
      expect(Math.hypot(c.x - (grip.x + grip.w / 2), c.y - (grip.y + grip.h / 2)), `at ${t.toFixed(2)}`).toBeLessThan(52)
    }
  })

  it('stands the tip on the lower right shoulder of the cap at the dial key', () => {
    const s = film()
    to(s, 3.2)
    const c = s.cursor.pose()
    expect(Math.hypot(c.x - (DIAL.cx + 25), c.y - (DIAL.cy + 21))).toBeLessThan(10)
  })

  it('shows the level as a whole percent', () => {
    expect(volumeMask(0.314).startsWith('31')).toBe(true)
    expect(volumeMask(0.314).length).toBe(3)
    expect(volumeMask(1).startsWith('100')).toBe(true)
    const list = to(film(), 15.2)
    expect(list.some((x) => x.kind === 'text' && x.words === 'runtime:step2.volume')).toBe(true)
  })

  it('keeps the floor of a tray round at its corners', () => {
    expect(trayFoot(Math.abs(TRAY_Z))).toBeLessThan(TRAY_R - 4)
  })
})
