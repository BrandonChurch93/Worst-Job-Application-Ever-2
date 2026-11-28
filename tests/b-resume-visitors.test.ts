import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { Random, stream } from '../src/core/random'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { Stage } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'

const STAGE_GAGS = ['step1.resume', 'step1.tug', 'step1.shredded']
const BEATS = ['browse-press', 'folder-open', 'file-pick', 'paper-slide', 'slot-in', 'wind-gust', 'shredder', 'tug-lost', 'strips-zip', 'resume-received']
const VISITORS = 200

type Kind = 'clumsy' | 'idle' | 'wanderer'
// A clumsy visitor of the Resume stage. Until the stage is up the keen bot plays for it, so every visitor arrives. From then on it walks slowly toward where it should press, aims up to `miss` px beside it and aims again every `again` seconds,
// presses `late` seconds after it should and sometimes where nothing is. One in ten does nothing at all, one in ten wanders and presses anywhere.
class Visitor implements Driver {
  readonly name = 'bot' as const
  private keen: BotDriver
  private r: Random
  private x = 960
  private y = 540
  private off = { x: 0, y: 0 }
  private until = 0
  private wait = 0
  private hold = 0
  private goal = { x: 960, y: 540 }
  readonly kind: Kind
  readonly speed: number
  readonly miss: number

  constructor(seed: number) {
    this.keen = new BotDriver('keen', seed)
    this.r = stream('resume-visitor', seed)
    const k = this.r.next()
    this.kind = k < 0.1 ? 'idle' : k < 0.2 ? 'wanderer' : 'clumsy'
    this.speed = this.r.range(320, 900)
    this.miss = this.r.range(20, 90)
  }

  input(v: DriverView): Pointer {
    const gag = v.page.id === 'step1' ? v.page.gag() : null
    if (gag === null || !STAGE_GAGS.includes(gag)) {
      const p = this.keen.input(v)
      this.x = p.x
      this.y = p.y
      return p
    }
    const out: Pointer = { x: this.x, y: this.y, down: false }
    if (v.turning || this.kind === 'idle') return out
    const hint = v.page.hint()
    if (v.step >= this.until) {
      this.until = v.step + Math.round(this.r.range(0.4, 1.4) * stepHz)
      const a = this.r.range(0, Math.PI * 2)
      const d = this.miss * Math.sqrt(this.r.next())
      this.off = { x: Math.cos(a) * d, y: Math.sin(a) * d }
      if (this.kind === 'wanderer' || !hint) this.goal = { x: this.r.range(60, 1860), y: this.r.range(120, 1000) }
      if (this.r.next() < (this.kind === 'wanderer' ? 0.6 : 0.15)) this.hold = Math.round(this.r.range(0.08, 0.35) * stepHz)
    }
    const aim = this.kind === 'wanderer' || !hint ? this.goal : { x: hint.x + this.off.x, y: hint.y + this.off.y }
    const max = this.speed / stepHz
    const dx = aim.x - this.x
    const dy = aim.y - this.y
    const d = Math.hypot(dx, dy)
    if (d <= max) {
      this.x = aim.x
      this.y = aim.y
    } else {
      this.x += (dx / d) * max
      this.y += (dy / d) * max
    }
    out.x = this.x
    out.y = this.y
    if (this.kind === 'clumsy' && hint && hint.down && d < 6 && this.hold <= 0) {
      this.wait += 1
      if (this.wait > 0.25 * stepHz) {
        this.wait = 0
        this.hold = Math.round(this.r.range(0.08, 0.3) * stepHz)
      }
    }
    if (this.hold > 0) {
      out.down = true
      this.hold--
    }
    return out
  }
}

interface Run { seed: number; kind: Kind; through: boolean; skipped: boolean; at: Record<string, number>; begun: number; held: number }

function visit(seed: number): Run {
  const driver = new Visitor(seed)
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step1' }, { page: 'step2' }], pages, driver, seed })
  const limit = Math.round(240 * stepHz)
  let begun = -1
  while (!stage.finished && stage.step < limit && stage.page.id === 'step1') {
    stage.advance(12)
    if (begun < 0 && stage.page.id === 'step1' && STAGE_GAGS.includes(stage.page.gag() ?? '')) begun = stage.step
  }
  const at: Record<string, number> = {}
  for (const e of stage.events) if (BEATS.includes(e.name) && at[e.name] === undefined) at[e.name] = e.step / stepHz
  return { seed, kind: driver.kind, through: at['resume-received'] !== undefined, skipped: stage.events.some((e) => e.name === 'skip'), at, begun: begun / stepHz, held: stage.longestIgnored.pointer }
}

const median = (v: number[]): number => {
  const s = [...v].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)]! : NaN
}

describe('the resume stage on the live site, for visitors who are bad at it', () => {
  it(`lets ${VISITORS} clumsy seeded visitors through, none of them by a skip`, () => {
    const runs: Run[] = []
    for (let seed = 1; seed <= VISITORS; seed++) runs.push(visit(seed))
    const through = runs.filter((r) => r.through && !r.skipped)
    const by = (k: Kind): string => `${runs.filter((r) => r.kind === k && r.through && !r.skipped).length} of ${runs.filter((r) => r.kind === k).length} ${k}`
    console.log(`visitors: ${through.length} of ${runs.length} through without a skip (${by('clumsy')}, ${by('idle')}, ${by('wanderer')})`)
    const span = (from: string, to: string, pick: (r: Run) => boolean = () => true): string => {
      const v = through.filter(pick).map((r) => r.at[to]! - (from === 'begun' ? r.begun : r.at[from]!))
      return `${from} to ${to}: least ${Math.min(...v).toFixed(2)}, middle ${median(v).toFixed(2)}, most ${Math.max(...v).toFixed(2)} s`
    }
    const clumsy = (r: Run): boolean => r.kind === 'clumsy'
    console.log(`clumsy visitors, seconds: ${span('begun', 'browse-press', clumsy)}; ${span('folder-open', 'file-pick', clumsy)}`)
    console.log(`all visitors, seconds: ${span('browse-press', 'folder-open')}; ${span('file-pick', 'paper-slide')}; ${span('paper-slide', 'slot-in')}; ${span('slot-in', 'wind-gust')}; ${span('wind-gust', 'shredder')}; ${span('shredder', 'tug-lost')}; ${span('tug-lost', 'resume-received')}; ${span('begun', 'resume-received')}`)
    console.log(`the longest the arrow is held from a visitor: ${Math.max(...runs.map((r) => r.held)).toFixed(2)} s (limit ${config.live.controlTakenMaxSeconds})`)
    const lost = runs.filter((r) => !r.through || r.skipped)
    if (lost.length) console.log(`not through: ${lost.map((r) => `${r.seed} ${r.kind}`).join(', ')}`)
    expect(through.length).toBe(runs.length)
    expect(Math.max(...runs.map((r) => r.held))).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  }, 600000)
})
