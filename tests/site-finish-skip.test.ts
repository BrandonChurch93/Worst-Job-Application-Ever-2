import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

const MAX = config.live.botMaxSeconds
const TAKEN = config.live.controlTakenMaxSeconds
const SKIP = config.live.skipLinkAfterSeconds
const LAST = liveFlow().length - 1
// How long after the skip link was pressed the next page must have come: the longest ending of a step, measured here, is under this.
const ENDING_MAX_SECONDS = 20

// A hand that stands still until the skip link is on the page and then plays as the keen bot does, so the link is there through every gag.
class Late implements Driver {
  readonly name = 'bot' as const
  private bot = new BotDriver('keen', config.seed)
  private at = { x: 960, y: 540 }
  constructor(private skipAt: (v: DriverView) => boolean) {}
  input(v: DriverView): Pointer {
    const steps = v.page.unit !== 'marketing'
    const p: Pointer = steps && !v.turning && v.pageTime < SKIP + 0.5 ? { ...this.at, down: false } : this.bot.input(v)
    this.at = { x: p.x, y: p.y }
    if (v.skipOffered && this.skipAt(v)) p.skip = true
    return p
  }
}

interface Span { gag: string; page: number; first: number; last: number; takenFrom: number; takenTo: number }

function run(from: number, skipAt: (v: DriverView) => boolean, watch = false): { stage: Stage; spans: Span[]; skipped: number; next: number; arrived: number[] } {
  const stage = new Stage({ mode: 'live', flow: liveFlow().slice(from), pages, driver: new Late(skipAt) })
  const spans: Span[] = []
  let open: Span | null = null
  let run = -1
  let skipped = -1
  let next = -1
  const arrived = [0]
  const limit = MAX * stepHz
  while (!stage.finished && stage.step < limit) {
    stage.advance(watch ? 1 : 6)
    while (arrived.length <= stage.entryIndex) arrived.push(stage.time)
    if (skipped < 0 && stage.events.some((e) => e.name === 'skip')) skipped = stage.time
    if (skipped >= 0 && next < 0 && stage.entryIndex > 0 && !stage.turning) next = stage.time
    if (!watch || stage.turning) continue
    const gag = stage.page.gag()
    const page = from + stage.entryIndex
    if (!gag || page === 0 || page >= LAST) continue
    if (!open || open.gag !== gag || open.page !== page) {
      open = spans.find((s) => s.gag === gag && s.page === page) ?? null
      if (!open) spans.push((open = { gag, page, first: stage.pageTime, last: stage.pageTime, takenFrom: -1, takenTo: -1 }))
      run = -1
    }
    open.last = stage.pageTime
    if (stage.cursor.taken && stage.page.control === 'pointer') {
      if (run < 0) run = stage.pageTime
      if (stage.pageTime - run >= open.takenTo - open.takenFrom) {
        open.takenFrom = run
        open.takenTo = stage.pageTime
      }
    } else run = -1
  }
  return { stage, spans, skipped, next, arrived }
}

const plain = run(0, () => false, true)
// The same watch, started on the page itself as the runs below are: a bot that starts there is not at the same step as one that came from the careers page.
const started = new Map<number, ReturnType<typeof run>>()
const fromPage = (page: number): ReturnType<typeof run> => {
  if (!started.has(page)) started.set(page, run(page, () => false, true))
  return started.get(page)!
}
// The middle of a gag's own ending: the middle of the longest time it holds the cursor, or of its last third where it holds nothing.
const middle = (s: Span): number => (s.takenTo > s.takenFrom ? (s.takenFrom + s.takenTo) / 2 : s.last - (s.last - s.first) / 6)

describe('site finish: d. the skip link', () => {
  it('pressed in the very step it appears, on every step: five endings play and the careers page after the rejection is reached', () => {
    const r = run(0, () => true)
    expect(r.stage.finished).toBe(true)
    expect(r.stage.time).toBeLessThanOrEqual(MAX)
    const skips = r.stage.events.filter((e) => e.name === 'skip')
    expect(skips.map((e) => e.page)).toEqual(['step1', 'step2', 'step3', 'step4', 'step5'])
    expect(r.stage.longestIgnored.pointer).toBeLessThanOrEqual(TAKEN)
    expect(r.stage.longestIgnored.flippers).toBe(0)
  })

  it('finds every gag of the five steps in a run that waits for the link before it plays', () => {
    expect(plain.stage.finished).toBe(true)
    expect(plain.stage.time).toBeLessThanOrEqual(MAX)
    const steps = plain.stage.gagsReached.filter((g) => !g.startsWith('marketing') && !g.startsWith('careers'))
    expect(new Set(plain.spans.map((s) => s.gag)).size).toBe(plain.spans.length)
    expect(plain.spans.length).toBeGreaterThanOrEqual(25)
    expect(plain.spans.length).toBeLessThanOrEqual(steps.length)
  })

  for (const span of plain.spans) {
    // A gag that is over before the link is on the page cannot be left by it: there the press comes in the step the link appears.
    const title = middle(span) >= SKIP ? `pressed in the middle of the ending of ${span.gag}, ${middle(span).toFixed(1)} s into the page` : `${span.gag} is over ${middle(span).toFixed(1)} s into the page, before the link is there: pressed in the step it appears`
    it(title, () => {
      const own = fromPage(span.page).spans.find((x) => x.gag === span.gag && x.page === span.page)
      const at = own ? middle(own) : middle(span)
      const page = liveFlow()[span.page]!.page
      const r = run(span.page, (v) => v.page.id === page && v.pageTime >= at && v.page.unit !== 'marketing')
      const who = `skip in ${span.gag}`
      expect(r.skipped, who).toBeGreaterThan(0)
      expect(r.next - r.skipped, `${who}: the next page comes`).toBeLessThanOrEqual(ENDING_MAX_SECONDS)
      expect(r.stage.finished, who).toBe(true)
      expect(span.page + r.stage.entryIndex, who).toBe(LAST)
      expect(r.stage.time + plain.arrived[span.page]!, who).toBeLessThanOrEqual(MAX)
      expect(r.stage.longestIgnored.pointer, who).toBeLessThanOrEqual(TAKEN)
      expect(r.stage.longestIgnored.flippers, who).toBe(0)
    })
  }
})
