import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })

interface Seen { time: number; acting: string; reaction: string | null; x: number; y: number; health: number }

function trace(): Seen[] {
  const stage = film()
  const out: Seen[] = []
  const every = Math.round(stepHz / 20)
  for (let i = 0; i < 32 * 20; i++) {
    stage.advance(every)
    const p = stage.cursor.pose() as unknown as { acting: string; reaction: string | null; x: number; y: number }
    const list: Parameters<typeof stage.page.draw>[0] = []
    stage.page.draw(list)
    const fill = list.find((s) => s.id === 'health-fill')
    out.push({ time: (i + 1) / 20, acting: p.acting, reaction: p.reaction ?? null, x: p.x, y: p.y, health: fill ? fill.w : 0 })
  }
  return out
}

const seen = trace()
const span = (from: number, to: number): Seen[] => seen.filter((s) => s.time >= from - 1e-6 && s.time <= to + 1e-6)
const held = (name: string, from: number, to: number): number => {
  let best = 0
  let run = 0
  for (const s of span(from, to)) {
    run = s.acting === name ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best / 20
}

describe('the acting of step 4 in the film', () => {
  it('hangs back nervous at the box for a second or more, then stands proud when the answer comes', () => {
    if (process.env.TRACE) for (const s of seen) console.log(s.time.toFixed(2), s.acting, s.reaction ?? '-', Math.round(s.x), Math.round(s.y), Math.round(s.health))
    expect(held('nervous', 0, 3.8)).toBeGreaterThanOrEqual(1)
    expect(held('proud', 3.8, 5.4)).toBeGreaterThanOrEqual(0.8)
  })

  it('stands shocked at the crack and then scared and still for a second or more while the machine builds', () => {
    expect(held('shocked', 5.4, 9)).toBeGreaterThanOrEqual(0.6)
    expect(held('scared', 5.4, 9)).toBeGreaterThanOrEqual(1.5)
    const hid = span(7.6, 8.6)
    expect(Math.max(...hid.map((s) => s.x)) - Math.min(...hid.map((s) => s.x))).toBeLessThan(6)
  })

  it('squares up before the anger and answers the session expired with a held pose that is not a hurt one', () => {
    const angry = seen.find((s) => s.acting === 'angry')!
    const before = span(angry.time - 0.7, angry.time - 0.1)
    expect(before.every((s) => s.acting === 'proud')).toBe(true)
    expect(held('shocked', 22, 27)).toBeGreaterThanOrEqual(1.2)
    expect(held('exhausted', 22, 27)).toBe(0)
  })

  it('shows the bar going back up at the last stand', () => {
    const bar = span(22, 25)
    const low = Math.min(...bar.map((s) => s.health))
    const after = bar.slice(bar.findIndex((s) => s.health === low))
    expect(Math.max(...after.map((s) => s.health)) - low).toBeGreaterThan(100)
  })

  it('sags at the key of the fallen button and holds the relief for a second and a half after the press', () => {
    expect(span(27.6, 28.6).every((s) => s.acting !== 'exhausted')).toBe(true)
    expect(span(28.95, 29.05).every((s) => s.acting === 'exhausted')).toBe(true)
    expect(held('exhausted', 28.6, 30.4)).toBeGreaterThanOrEqual(1.1)
    expect(held('proud', 29.9, 32)).toBeGreaterThanOrEqual(1.5)
  })
})
