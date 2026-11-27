import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { CursorBody } from '../src/cursor/body'
import { pages } from '../src/pages'
import { SLOT } from '../src/pages/step1/layout'
import { housingY } from '../src/pages/step1/real/shredderShape'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'

// A keen hand that stops where it is the moment the rollers have the paper, and stays there: every move of the arrow after that is the page's.
class Still implements Driver {
  readonly name = 'bot' as const
  private bot = new BotDriver('keen', config.seed)
  private at: Pointer | null = null
  input(v: DriverView): Pointer {
    const gag = v.page.gag() ?? ''
    if (gag === 'step1.tug' || gag === 'step1.shredded') {
      if (this.at) return this.at
    } else this.at = null
    const p = this.bot.input(v)
    this.at = { ...p, down: false }
    return p
  }
}

interface Row { step: number; gag: string; x: number; y: number; taken: boolean; arms: boolean; lost: boolean; thrown: number; panel: number; lean: number; received: boolean }

function run(): Row[] {
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new Still() })
  const rows: Row[] = []
  let seen = 0
  let after = -1
  while (s.time < 200 && after !== 0) {
    s.advance(1)
    if (s.page.id !== 'step1') continue
    const gag = s.page.gag() ?? ''
    if (gag !== 'step1.resume' && gag !== 'step1.tug' && gag !== 'step1.shredded') continue
    const p = s.cursor.pose()
    const list: DrawList = []
    s.page.draw(list)
    const jaw = list.find((x) => x.id === 'shredder-jaw-1')
    const zone = list.find((x) => x.id === 'resume-zone')
    const paper = gag === 'step1.tug' ? list.find((x) => x.id === 'resume-paper') : undefined
    const lean = paper?.rot ?? 0
    const received = s.page.states?.().includes('received') ?? false
    rows.push({ step: s.step, gag, x: p.x, y: p.y, taken: s.cursor.taken, arms: p.arms, lost: s.events.slice(seen).some((e) => e.name === 'tug-lost'), thrown: jaw ? jaw.y - housingY : 0, panel: zone ? zone.y : 0, lean: Math.abs(Math.atan2(Math.sin(lean), Math.cos(lean))), received })
    seen = s.events.length
    if (gag === 'step1.shredded' && received && !s.cursor.taken && after < 0) after = stepHz
    if (after > 0) after--
  }
  return rows
}

const far = (a: Row, b: Row): number => Math.hypot(a.x - b.x, a.y - b.y)
const fastest = (rows: Row[]): number => rows.slice(1).reduce((m, r, i) => Math.max(m, far(r, rows[i]!)), 0)

function free(distance: number): number {
  const c = new CursorBody()
  c.hand = true
  c.reset(400, 500)
  for (let i = 0; i < stepHz; i++) c.step({ x: 400, y: 500 }, () => undefined, false)
  let most = 0
  let last = c.x
  for (let i = 0; i < stepHz; i++) {
    c.step({ x: 400 + distance, y: 500 }, () => undefined, false)
    most = Math.max(most, Math.abs(c.x - last))
    last = c.x
  }
  return most
}

describe('fix tug: the takeover, the loss and the give-back of step 1 on the live site, step by step', () => {
  const rows = run()
  const first = rows.findIndex((r) => r.gag === 'step1.tug')
  const taken = rows.findIndex((r, i) => i >= first && r.taken)
  const lost = rows.findIndex((r) => r.lost)
  const shredded = rows.findIndex((r) => r.gag === 'step1.shredded')
  const back = rows.findIndex((r, i) => i > shredded && !r.taken)

  it('takes the arrow with an ease: no step of the takeover is larger than the fastest step of a free move across the same distance', () => {
    const second = rows.slice(first - 1, first + stepHz)
    const moved = far(second[0]!, second[second.length - 1]!)
    const most = fastest(second)
    console.log(`takeover: the arrow is drawn ${moved.toFixed(1)} px, its largest step is ${most.toFixed(2)} px, the fastest step of a free move across ${moved.toFixed(1)} px is ${free(moved).toFixed(2)} px`)
    expect(moved).toBeGreaterThan(60)
    expect(most).toBeLessThanOrEqual(free(moved))
    const early = rows.slice(first - 1, first + Math.round(stepHz * 0.1))
    expect(far(early[0]!, early[early.length - 1]!)).toBeLessThan(moved * 0.1)
    expect(rows[first + 2]!.arms).toBe(true)
    expect(rows[first]!.thrown).toBeGreaterThan(0)
    expect(rows[first - 1]!.thrown).toBe(0)
    const lean = rows.slice(first, lost).reduce((m, r) => Math.max(m, r.lean), 0)
    console.log(`takeover and tug: the held paper leans ${lean.toFixed(3)} rad from upright at most`)
    expect(lean).toBeLessThanOrEqual(0.6 + 1e-9)
  })

  it('loses in steps the eye follows: a last pull, the grip going with the slot and the panel thrown on that step, a skid with the arms still on the paper, the slot thrown again where the arrow meets it', () => {
    expect(taken).toBeGreaterThan(first)
    expect(lost).toBeGreaterThan(taken)
    expect(shredded).toBeGreaterThan(lost)
    const pull = (lost - taken) / stepHz
    const skid = (shredded - lost) / stepHz
    const most = fastest(rows.slice(taken - 1, shredded + 1))
    const dragged = far(rows[lost]!, rows[shredded]!)
    console.log(`loss: the last pull lasts ${pull.toFixed(3)} s, the skid ${skid.toFixed(3)} s over ${dragged.toFixed(1)} px, the largest step is ${most.toFixed(2)} px; a free move across ${dragged.toFixed(1)} px has ${free(dragged).toFixed(2)} px`)
    expect(pull).toBeGreaterThanOrEqual(0.2)
    expect(skid).toBeGreaterThanOrEqual(0.3)
    expect(most).toBeLessThanOrEqual(free(dragged))
    const away = (r: Row): number => Math.hypot(r.x - SLOT.cx, r.y - SLOT.cy)
    expect(away(rows[lost]!)).toBeGreaterThan(away(rows[taken]!) + 4)
    for (let i = taken; i < shredded; i++) expect(rows[i]!.arms, `step ${rows[i]!.step}`).toBe(true)
    expect(rows[lost - 1]!.thrown).toBe(0)
    expect(rows[lost]!.thrown).toBeGreaterThan(0)
    expect(rows[lost]!.panel).toBeGreaterThan(rows[lost - 1]!.panel)
    expect(rows[shredded]!.thrown).toBeGreaterThan(rows[shredded - 1]!.thrown)
    const rest = rows[shredded + Math.round(stepHz * 0.3)]!
    expect(rest.thrown).toBe(0)
    expect(rest.panel).toBe(rows[lost - 1]!.panel)
  })

  it('gives the arrow back after it has settled, and never holds it longer than the page may', () => {
    expect(back).toBeGreaterThan(shredded)
    const whole = rows.findIndex((r, i) => i > shredded && r.received)
    const held = (back - taken) / stepHz
    const settled = rows.slice(back - Math.round(stepHz * 0.05), back)
    console.log(`give-back: the arrow is held ${held.toFixed(2)} s in all, the page may hold it ${config.live.controlTakenMaxSeconds} s; it stands ${fastest(settled).toFixed(3)} px a step at most in the 0.05 s before the mouse has it; the largest step after is ${fastest(rows.slice(back - 1)).toFixed(2)} px`)
    expect(whole).toBeGreaterThan(shredded)
    expect(held).toBeLessThan(config.live.controlTakenMaxSeconds)
    expect(fastest(settled)).toBeLessThan(0.5)
    expect(fastest(rows.slice(back - 1))).toBeLessThanOrEqual(free(far(rows[back - 1]!, rows[rows.length - 1]!)) + 0.01)
  })
})
