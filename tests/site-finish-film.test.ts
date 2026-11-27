import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

const MAX = config.live.botMaxSeconds
const TAKEN = config.live.controlTakenMaxSeconds
const LAST = liveFlow().length - 1
// Where the two controls are, in page units: the film link in the row at the top left, the back control at the left end of the film bar.
const FILM_LINK = { x: 420, y: 28 }
const BACK = { x: 60, y: 1052 }
const TRAVEL_STEPS = 36

// While the film is on the stage stands still. What the stage sees of a visitor who leaves and comes back:
// the mouse runs to the film link with nothing held, and the next step finds it on the back control.
class Leaver implements Driver {
  readonly name = 'bot' as const
  private bot = new BotDriver('keen', config.seed)
  private at = { x: 960, y: 540 }
  private first = true
  private before = -1
  private gone = 0
  left = false
  constructor(private when: number) {}
  input(v: DriverView): Pointer {
    if (v.pageStep < this.before) this.first = false
    this.before = v.pageStep
    if (!this.first || v.pageTime < this.when || this.gone > TRAVEL_STEPS) {
      const p = this.bot.input(v)
      this.at = { x: p.x, y: p.y }
      return p
    }
    this.gone++
    this.left = true
    if (this.gone > TRAVEL_STEPS) {
      this.bot.moveTo(BACK.x, BACK.y)
      return { ...BACK, down: false }
    }
    const u = 1 / (TRAVEL_STEPS + 1 - this.gone)
    this.at = { x: this.at.x + (FILM_LINK.x - this.at.x) * u, y: this.at.y + (FILM_LINK.y - this.at.y) * u }
    return { ...this.at, down: false }
  }
}

interface Moment { page: number; at: number; what: string }

// One keen page at a time, watched step by step, for the worst moments to leave it.
function moments(page: number): { list: Moment[]; seconds: number } {
  const stage = new Stage({ mode: 'live', flow: liveFlow().slice(page), pages, driver: new BotDriver('keen', config.seed) })
  const list: Moment[] = []
  const taken = new Map<string, { from: number; to: number }>()
  let run = -1
  let seen = 0
  const count: Record<string, number> = {}
  const EVENTS: Record<string, [number, number, string]> = {
    popup: [0.3, 9, 'a popup open'], 'inbox-take': [0.4, 2, 'the ball in a seat'], 'firehouse-take': [0.4, 2, 'the ball in a seat'], 'scoop-kick': [0.02, 1, 'the ball kicked out'],
    'slab-drop': [0.03, 3, 'a slab landing'], 'dart-hit': [0.01, 2, 'the boss mid hit'], 'bolt-hit': [0.01, 1, 'a bolt landing'], 'session-expired': [0.5, 1, 'the session expired'],
    'power-down': [0.3, 1, 'the boss going down'], stamp: [0.05, 1, 'the stamp landing'], 'dial-fling': [0.05, 1, 'the dial flinging'], 'crank-runaway': [0.3, 1, 'the crank running away'], 'tug-lost': [0.05, 1, 'the tug lost'],
    'doors-slam': [0.05, 1, 'the doors slamming'], drain: [0.1, 1, 'the ball draining']
  }
  while (stage.entryIndex === 0 && !stage.finished && stage.time < MAX) {
    stage.advance(1)
    if (stage.turning || stage.entryIndex > 0) continue
    const gag = stage.page.gag() ?? 'no gag'
    if (stage.cursor.taken || stage.cursor.inBall) {
      if (run < 0) run = stage.pageTime
      const best = taken.get(gag)
      if (!best || stage.pageTime - run > best.to - best.from) taken.set(gag, { from: run, to: stage.pageTime })
    } else run = -1
    for (; seen < stage.events.length; seen++) {
      const e = stage.events[seen]!
      const rule = EVENTS[e.name]
      if (!rule) continue
      count[e.name] = (count[e.name] ?? 0) + 1
      if (count[e.name]! <= rule[1]) list.push({ page, at: stage.pageTime + rule[0], what: `${rule[2]} (${e.name} ${count[e.name]})` })
    }
  }
  for (const [gag, t] of taken) if (t.to - t.from > 0.2) list.push({ page, at: (t.from + t.to) / 2, what: `the cursor taken in ${gag}` })
  return { list: list.filter((m) => m.at < stage.pageTime || stage.entryIndex > 0), seconds: stage.time }
}

const each = [0, 1, 2, 3, 4, 5].map(moments)
const before = (page: number): number => each.slice(0, page).reduce((n, m) => n + m.seconds, 0)

describe('site finish: e. one who leaves for the film at the worst moment and comes back by the film bar', () => {
  it('finds the worst moments: the cursor taken on every page, a popup open, the ball in a seat, the boss mid hit', () => {
    const all = each.flatMap((m) => m.list)
    // Step 4 never takes the cursor from a keen hand: its worst moments are the popups and the hits.
    for (const k of [0, 1, 2, 3, 5]) expect(each[k]!.list.some((m) => m.what.startsWith('the cursor taken')), liveFlow()[k]!.page).toBe(true)
    expect(each[4]!.list.length).toBeGreaterThanOrEqual(5)
    expect(all.filter((m) => m.what.startsWith('a popup open')).length).toBeGreaterThanOrEqual(3)
    expect(all.filter((m) => m.what.startsWith('the ball in a seat')).length).toBeGreaterThanOrEqual(2)
    expect(all.filter((m) => m.what.startsWith('the boss mid hit')).length).toBe(2)
    expect(all.length).toBeGreaterThanOrEqual(30)
  })

  for (const m of each.flatMap((e) => e.list)) {
    const page = liveFlow()[m.page]!.page
    it(`${page}, ${m.at.toFixed(2)} s in: ${m.what}`, () => {
      const d = new Leaver(m.at)
      const stage = new Stage({ mode: 'live', flow: liveFlow().slice(m.page), pages, driver: d })
      while (!stage.finished && stage.time < MAX) stage.advance(12)
      expect(d.left).toBe(true)
      expect(stage.finished).toBe(true)
      expect(m.page + stage.entryIndex).toBe(LAST)
      expect(stage.time + before(m.page)).toBeLessThanOrEqual(MAX)
      expect(stage.longestIgnored.pointer).toBeLessThanOrEqual(TAKEN)
      expect(stage.longestIgnored.flippers).toBeLessThanOrEqual(TAKEN)
    })
  }
})
