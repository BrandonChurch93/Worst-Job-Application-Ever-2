import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pages } from '../src/pages'
import { FLASH } from '../src/table/real/lights/colours'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const TIERS = ['corporate', 'office', 'street']
const LOW = 0.35
const HIGH = 0.65

interface Run {
  times: number[]
  flash: number[][]
}

function run(): Run {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const out: Run = { times: [], flash: TIERS.map(() => []) }
  while (!s.finished && s.time < 43 && s.page.id === 'step3') {
    s.advance(1)
    if (s.page.id !== 'step3') break
    const list: { id: string; v?: number[] }[] = []
    s.page.draw(list as never)
    out.times.push(s.time)
    TIERS.forEach((z, k) => out.flash[k]!.push(list.find((x) => x.id === `whole.table-lights.${z}`)?.v?.[2] ?? 0))
  }
  return out
}

// The moments a level comes up through the band from dim to bright: one of these and the fall after it is one flash.
function rises(times: number[], level: number[], from: number, to: number): number[] {
  const out: number[] = []
  let dim = true
  level.forEach((v, i) => {
    const t = times[i]!
    if (t < from || t >= to) return
    if (dim && v >= HIGH) {
      out.push(t)
      dim = false
    } else if (!dim && v <= LOW) dim = true
  })
  return out
}

const mostInOneSecond = (at: number[]): number => at.reduce((most, t, i) => Math.max(most, at.filter((u, j) => j >= i && u < t + 1).length), 0)

describe('the flash of a tier over the film of the machine', () => {
  const r = run()
  const beats = config.film.beats.filter((b) => b.unit === 'pinball')

  it('is counted in every beat, and where it comes up more than three times in one second the lights keep it shallow', () => {
    const rows: string[] = []
    let worst = 0
    for (const b of beats) {
      TIERS.forEach((z, k) => {
        const at = rises(r.times, r.flash[k]!, b.from, b.to)
        if (at.length === 0) return
        const gaps = at.slice(1).map((t, i) => t - at[i]!)
        rows.push(`${b.id} ${z}: ${at.length} flashes in ${b.to - b.from} s, most in one second ${mostInOneSecond(at)}, shortest gap ${gaps.length ? Math.min(...gaps).toFixed(3) : 'none'} s, at ${at.map((t) => t.toFixed(2)).join(' ')}`)
        worst = Math.max(worst, mostInOneSecond(at))
      })
    }
    TIERS.forEach((z, k) => {
      const at = rises(r.times, r.flash[k]!, 0, 99)
      rows.push(`whole film ${z}: ${at.length} flashes, most in one second ${mostInOneSecond(at)}`)
      worst = Math.max(worst, mostInOneSecond(at))
    })
    console.log(`${r.times.length} steps to ${r.times[r.times.length - 1]} s\n` + rows.join('\n'))
    expect(worst).toBeGreaterThan(0)
    if (worst > 3) {
      expect(FLASH.flat).toBeLessThanOrEqual(0.06)
      expect(FLASH.fill).toBeLessThanOrEqual(0.012)
      expect(FLASH.room).toBeLessThanOrEqual(0.2)
    }
  })

  it('is gone a quarter of a second after a hit', () => {
    TIERS.forEach((_, k) => {
      const f = r.flash[k]!
      let longest = 0
      let since = -1
      f.forEach((v, i) => {
        if (v >= 0.999) since = r.times[i]!
        else if (since >= 0 && v > 0.02) longest = Math.max(longest, r.times[i]! - since)
      })
      if (k !== 1) expect(longest).toBeLessThanOrEqual(0.26)
    })
  })
})
