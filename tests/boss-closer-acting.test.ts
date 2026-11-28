import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { UNIT_SECONDS } from '../src/pages/step4/script'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })

const marks: Record<string, number> = {}

interface Seen { time: number; acting: string; reaction: string | null; x: number; y: number; health: number }

function trace(): Seen[] {
  const stage = film()
  const out: Seen[] = []
  const every = Math.round(stepHz / 20)
  for (let i = 0; i < Math.ceil(UNIT_SECONDS) * 20; i++) {
    stage.advance(every)
    const p = stage.cursor.pose() as unknown as { acting: string; reaction: string | null; x: number; y: number }
    const list: Parameters<typeof stage.page.draw>[0] = []
    stage.page.draw(list)
    const fill = list.find((s) => s.id === 'health-fill')
    out.push({ time: (i + 1) / 20, acting: p.acting, reaction: p.reaction ?? null, x: p.x, y: p.y, health: fill ? fill.w : 0 })
  }
  for (const e of stage.events) if (marks[e.name] === undefined) marks[e.name] = e.step / stepHz
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
    const crack = marks['button-crack']!
    const formed = marks['boss-formed']!
    expect(held('shocked', crack, formed)).toBeGreaterThanOrEqual(0.6)
    expect(held('scared', crack, formed)).toBeGreaterThanOrEqual(1.5)
    const hid = span(formed - 1.4, formed - 0.4)
    expect(Math.max(...hid.map((s) => s.x)) - Math.min(...hid.map((s) => s.x))).toBeLessThan(6)
  })

  it('squares up before the anger and answers the session expired with a held pose that is not a hurt one', () => {
    const angry = seen.find((s) => s.acting === 'angry')!
    expect(Math.abs(angry.time - marks['power-up']!)).toBeLessThan(0.1)
    const before = span(angry.time - 0.5, angry.time - 0.1)
    expect(before.every((s) => s.acting === 'confident')).toBe(true)
    const expired = marks['session-expired']!
    const down = marks['power-down']!
    expect(held('shocked', expired, down)).toBeGreaterThanOrEqual(1.2)
    expect(held('exhausted', expired, down)).toBe(0)
  })

  it('shows the bar going back up at the last stand', () => {
    const expired = marks['session-expired']!
    const bar = span(expired - 0.5, expired + 0.9)
    const low = Math.min(...bar.map((s) => s.health))
    const after = bar.slice(bar.findIndex((s) => s.health === low))
    const full = Math.max(...seen.map((s) => s.health))
    expect((Math.max(...after.map((s) => s.health)) - low) / full).toBeGreaterThan(0.08)
  })

  it('is angry through the finish, sags when the boss is gone and stays so to the press and the turn', () => {
    const gone = marks['boss-gone']!
    expect(span(marks['power-down']! + 0.5, gone - 0.1).every((s) => s.acting === 'angry')).toBe(true)
    expect(span(gone + 0.1, marks['button-press']!).every((s) => s.acting === 'exhausted')).toBe(true)
    expect(marks['page-turn']! - marks['button-press']!).toBeLessThan(1)
  })
})
