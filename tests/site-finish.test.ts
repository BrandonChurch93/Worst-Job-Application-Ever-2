import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, MouseDriver, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

const MAX = config.live.botMaxSeconds
const TAKEN = config.live.controlTakenMaxSeconds
const SKIP = config.live.skipLinkAfterSeconds
const LAST = liveFlow().length - 1

// A keen hand that a test can change at every step: the same pointer path a mouse uses, as the bots have.
class Visitor implements Driver {
  readonly name = 'bot' as const
  readonly bot = new BotDriver('keen', config.seed)
  page = 0
  clicks = 0
  at: Pointer = { x: 960, y: 540, down: false }
  private before = -1
  constructor(private change: (me: Visitor, v: DriverView) => Pointer, from = 0) {
    this.page = from
  }
  keen(v: DriverView): Pointer {
    return this.bot.input(v)
  }
  still(): Pointer {
    return { x: this.at.x, y: this.at.y, down: false }
  }
  input(v: DriverView): Pointer {
    if (v.pageStep < this.before) {
      this.page++
      this.clicks = 0
    }
    this.before = v.pageStep
    const p = this.change(this, v)
    if (p.down && !this.at.down && !v.turning) this.clicks++
    this.at = p
    return p
  }
}

interface Run { from: number; stage: Stage; finished: boolean; seconds: number; pointer: number; flippers: number; arrived: number[] }

function play(driver: Driver, from = 0, seconds = MAX): Run {
  const stage = new Stage({ mode: 'live', flow: liveFlow().slice(from), pages, driver })
  const arrived: number[] = [0]
  const limit = Math.round(seconds * stepHz)
  while (!stage.finished && stage.step < limit) {
    stage.advance(12)
    while (arrived.length <= stage.entryIndex) arrived.push(stage.time)
  }
  return { from, stage, finished: stage.finished, seconds: stage.time, pointer: stage.longestIgnored.pointer, flippers: stage.longestIgnored.flippers, arrived }
}

// The three rules of check G17, on one run.
function holds(r: Run, who: string, spent = 0): void {
  expect(r.finished, `${who}: the careers page after the rejection is reached`).toBe(true)
  expect(r.stage.page.id, who).toBe('marketing')
  expect(r.from + r.stage.entryIndex, who).toBe(LAST)
  expect(r.seconds + spent, `${who}: inside live.botMaxSeconds`).toBeLessThanOrEqual(MAX)
  expect(r.pointer, `${who}: the pointer ignored`).toBeLessThanOrEqual(TAKEN)
  expect(r.flippers, `${who}: the flippers ignored`).toBeLessThanOrEqual(TAKEN)
}

const keen = play(new Visitor((me, v) => me.keen(v)))
const before = (pageIndex: number): number => keen.arrived[pageIndex]!

describe('site finish: the visitors the four bots are not', () => {
  it('the measure itself: a keen hand through this driver finishes as the keen bot does', () => {
    holds(keen, 'keen')
    expect(keen.arrived.length).toBe(LAST + 1)
    expect(config.film.beats.map((b) => b.id).filter((id) => !keen.stage.gagsReached.includes(id))).toEqual(['step1.lastName'])
    expect(keen.stage.gagsReached.length).toBe(36)
  })

  describe('a. one who does nothing at all after a first click', () => {
    const IDLE = 45
    it('on every page in turn, 45 s of nothing each time, and then goes on: finishes inside the limit', () => {
      let until = -1
      let was = -1
      let stood = 0
      const r = play(new Visitor((me, v) => {
        if (me.page !== was) {
          was = me.page
          until = -1
        }
        if (me.page >= LAST || v.turning) return me.keen(v)
        if (until < 0) {
          const p = me.keen(v)
          if (p.down) until = v.time + IDLE
          return p
        }
        if (v.time >= until) return me.keen(v)
        stood++
        return me.still()
      }))
      holds(r, 'idle 45 s after a first click on every page')
      expect(stood).toBeGreaterThan(3 * IDLE * stepHz)
    })

    for (let k = 0; k < LAST; k++) {
      const id = liveFlow()[k]!.page
      it(`on ${id}, and then nothing for ever, on that page and on every page after it: every step ends by itself, with no skip link pressed`, () => {
        let done = false
        const r = play(new Visitor((me, v) => {
          if (done) return me.still()
          const p = me.keen(v)
          if (p.down && !v.turning) done = true
          return p
        }, k), k)
        expect(done).toBe(true)
        holds(r, `one click on ${id} and nothing after`, before(k))
        expect(r.stage.events.filter((e) => e.name === 'skip').length).toBe(0)
      })
    }
  })

  describe('b. one who never clicks at all', () => {
    it('stays on the careers page: nothing is taken from the hand, no step comes, and the Apply button still answers the first press', () => {
      let click = false
      const r = play(new Visitor((me, v) => (click ? me.keen(v) : { ...me.keen(v), down: false })), 0, 150)
      expect(r.finished).toBe(false)
      expect(r.stage.entryIndex).toBe(0)
      expect(r.stage.skipOffered).toBe(false)
      expect(r.stage.page.done()).toBe(false)
      expect(r.stage.cursor.taken).toBe(false)
      expect(r.pointer).toBe(0)
      expect(r.stage.events.filter((e) => e.name === 'card-flip').length).toBeGreaterThan(0)
      click = true
      const steps = r.stage.step
      while (r.stage.entryIndex === 0 && r.stage.step < steps + 20 * stepHz) r.stage.advance(12)
      expect(r.stage.entryIndex).toBe(1)
    })

    for (let k = 1; k < LAST; k++) {
      const id = liveFlow()[k]!.page
      it(`who came in at ${id} and does nothing at all, not a move and not a key: every step from there ends by itself`, () => {
        const r = play(new Visitor((me) => me.still(), k), k)
        holds(r, `nothing at all from ${id}`, before(k))
        expect(r.stage.events.filter((e) => e.name === 'skip').length).toBe(0)
      })
    }

    it('who came in at a step and has only the keyboard, on the skip link: every step ends and the careers page after the rejection is reached', () => {
      const r = play(new Visitor((me, v) => ({ ...me.still(), ...(v.skipOffered ? { skip: true } : {}) }), 1), 1)
      holds(r, 'keyboard on the skip link only', before(1))
      expect(r.stage.events.filter((e) => e.name === 'skip').length).toBe(5)
    })
  })

  describe('c. one who holds the left button down for a whole step', () => {
    for (let k = 0; k < LAST; k++) {
      const id = liveFlow()[k]!.page
      it(`on ${id}, from the first step to 60 s or the page turn, then lets go`, () => {
        let held = 0
        const r = play(new Visitor((me, v) => {
          const p = me.keen(v)
          if (me.page !== k || v.pageTime >= 60) return v.skipOffered && me.page === k && v.page.unit !== 'pinball' && v.pageTime >= 61 ? { ...p, skip: true } : p
          held++
          return { ...p, down: true, flipLeft: true }
        }, k), k)
        expect(held).toBeGreaterThan(stepHz * 5)
        holds(r, `left button held on ${id}`, before(k))
      })
    }
  })

  describe('f. one who goes back and forward with the browser in the middle of a step', () => {
    // The stage stands still while the film is on. What it sees: the mouse runs out through the top edge, and comes back in there.
    const EDGE = { x: 40, y: 0 }
    for (let k = 0; k < LAST; k++) {
      const id = liveFlow()[k]!.page
      it(`in the middle of ${id}`, () => {
        const middle = (keen.arrived[k + 1]! - keen.arrived[k]!) / 2
        let gone = 0
        const r = play(new Visitor((me, v) => {
          if (me.page !== k || v.pageTime < middle || gone > 60) return me.keen(v)
          gone++
          const u = Math.min(1, gone / 48)
          const p = { x: me.at.x + (EDGE.x - me.at.x) * u, y: me.at.y + (EDGE.y - me.at.y) * u, down: false }
          if (gone > 60) me.bot.moveTo(EDGE.x, EDGE.y)
          return p
        }, k), k)
        holds(r, `back and forward in the middle of ${id}`, before(k))
      })
    }
  })

  describe('g. one who types on a real keyboard through step 1', () => {
    const typed = 'brandon church brandon@example.com'
    it('for 60 s, never pressing a key of the page: the page says so once, takes nothing from the hand, and the skip link is the way on', () => {
      const mouse = new MouseDriver()
      const stage = new Stage({ mode: 'live', flow: liveFlow().slice(1), pages, driver: mouse })
      let n = 0
      while (stage.time < 60) {
        if (!stage.turning && stage.step % 30 === 0) mouse.pulse({ key: n % 12 === 11 ? 'Tab' : n % 12 === 10 ? 'Enter' : typed[n % typed.length]! })
        n++
        stage.advance(1)
      }
      expect(stage.entryIndex).toBe(0)
      expect(stage.events.filter((e) => e.name === 'real-keyboard').length).toBe(1)
      expect(stage.events.filter((e) => e.name === 'keyboard-rise').length).toBe(1)
      expect(stage.events.filter((e) => e.name === 'key-press').length).toBe(0)
      expect(stage.longestIgnored.pointer).toBeLessThanOrEqual(TAKEN)
      expect(stage.skipOffered).toBe(true)
      mouse.pulse({ skip: true })
      const steps = stage.step
      while (stage.entryIndex === 0 && stage.step < steps + 30 * stepHz) stage.advance(12)
      expect(stage.entryIndex).toBe(1)
    })

    it('for 30 s, and then takes the mouse to the page\'s keys: finishes', () => {
      let n = 0
      const r = play(new Visitor((me, v) => {
        if (me.page !== 1 || v.pageTime >= 30 || v.turning) return me.keen(v)
        n++
        return n % 30 === 0 ? { ...me.still(), key: typed[(n / 30) % typed.length]! } : me.still()
      }, 1), 1)
      holds(r, 'real keyboard for 30 s, then the page\'s keys', before(1))
      expect(r.stage.events.filter((e) => e.name === 'real-keyboard').length).toBe(1)
    })
  })
})
