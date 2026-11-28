import { createHash } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList, Driver, Pointer } from '../src/stage/types'
import { WIRE, movingShapes } from '../src/table/draw'
import { BALL, TH, TIERS, TIER_Y } from '../src/table/layout'
import { Machine, SAVE, prepare } from '../src/table/physics'
import { filmOf } from '../src/pages/step3/clock'
import { bridge } from '../src/pages/step3/video/bridge'

bridge.off = true

// The save at a shut gate as it must read at real size, and the ball's first frames out of the port. Stepped, no browser.
const EACH = stepHz / 60
// The film's pinball take as it was before this work (commit 305e5bf3): the machine's events as a count and a hash of their names, balls and steps; the ball's place on the feed rail and the page's scroll at page time 5.2 s (film frame 4332);
// the stage step on which the ball left the feed rail; and the stage step of the release.
// The stage step of the scene's second 5.85 in the film: the scene's clock stands for the long fight (clock.ts) and goes on one step after the film's second 6.9.
const AT = Math.round(filmOf(5.85) * stepHz) + 1
const WAS = { events: 99, hash: '134cb0eeff6f3dd587ac995f04449b167036a9984b06e315d196d65d7b7bffc8', at: 16.463416279267882, scroll: 1345.7169539350648, arrive: 3089, release: 1813 }

interface Row { mode: string; v: number; taken: number; names: string[]; turn: number; gap: number; flip: number[]; own: number[]; state: number[] }

const stateOf = (m: Machine, k: number): number[] => movingShapes(m, [false, false, false], false).find((s) => s.id === `gate.${k}`)!.v!
const gapOf = (m: Machine, k: number): number => {
  const b = m.balls[0]!
  const turn = WIRE.shut + (stateOf(m, k)[1] ?? 0)
  const y = WIRE.tall * Math.sin(turn) + (TH - WIRE.pin - (b.y - TIER_Y[k]!)) * BALL
  const z = WIRE.axle + WIRE.tall * Math.cos(turn) - 0.5 * BALL
  return Math.hypot(y, z) - 0.5 * BALL - WIRE.thick
}
// How far down the table the top wire stands from its rest place, px.
const down = (turn: number): number => WIRE.tall * (Math.sin(WIRE.shut + turn) - Math.sin(WIRE.shut))
const lost = (live: boolean, k: number, w: { x: number; vx: number; vy: number }): { rows: Row[]; take: number; kick: number; m: Machine } => {
  const m = new Machine()
  m.live = live
  m.gate = [false, false, false]
  m.toPlane(0, w.x, TIER_Y[k]! + 10.2, w.vx, w.vy)
  const row = (names: string[]): Row => {
    const state = stateOf(m, k)
    return { mode: m.balls[0]!.mode, v: m.balls[0]!.y - TIER_Y[k]!, taken: m.taken, names, turn: state[1] ?? 0, gap: gapOf(m, k), flip: [...m.flip], own: [...m.own], state }
  }
  const rows: Row[] = [row([])]
  let take = -1
  let kick = -1
  for (let n = 1; n < 700 && (kick < 0 || n <= kick + 160); n++) {
    const names = m.step(false, false).filter((e) => e.ball === 0).map((e) => e.name)
    rows.push(row(names))
    if (take < 0 && names.includes('gate-take')) take = n
    if (kick < 0 && names.includes('ball-save')) kick = n
  }
  return { rows, take, kick, m }
}
const ways = [{ x: 10.1, vx: 0, vy: 4 }, { x: 9.8, vx: 1.3, vy: 6 }, { x: 10.2, vx: -3, vy: 5 }, { x: 9.85, vx: 6, vy: 24 }, { x: 10, vx: 0, vy: 0.5 }]

describe('the save at the gate, read at real size', () => {
  beforeAll(async () => {
    await prepare()
  })

  it('loads the wire by more than a quarter of the ball\'s width down the table, no deeper than the shell stays out of the wire, and holds it there, dead still, for three and a half frames of 60 or more', () => {
    for (const k of [0, 1]) for (const w of ways) {
      const { rows, take, kick, m } = lost(true, k, w)
      expect(take).toBeGreaterThan(0)
      const on = rows.slice(take, kick).filter((r) => r.taken > 0)
      const deep = Math.max(...on.map((r) => r.turn))
      expect(down(deep), 'the travel of the top wire, px').toBeGreaterThanOrEqual(BALL * 0.28)
      expect(SAVE.back, 'the depth past which the shell is seen inside the wire, ball widths').toBeLessThanOrEqual(0.27)
      const held = on.filter((r) => r.turn === deep)
      expect(held.length / EACH, 'frames at the deepest').toBeGreaterThanOrEqual(3.5)
      expect(held.length).toBeGreaterThanOrEqual(SAVE.still)
      for (const r of held) expect(r.v).toBeCloseTo(SAVE.rest + SAVE.back, 9)
      expect(on.indexOf(held[0]!) + held.length, 'the hold ends where the drive begins').toBe(SAVE.land + SAVE.wind)
      m.free()
    }
  })

  it('leaves no gap between the shell and the wire from the landing to the kick, and throws on the frame the ball turns', () => {
    for (const k of [0, 1]) for (const w of ways) {
      const { rows, take, kick, m } = lost(true, k, w)
      const on = rows.slice(take, kick + 1).filter((r, i) => r.taken > 0 || i === kick - take)
      expect(on.length).toBe(SAVE.land + SAVE.wind + SAVE.drive + 1)
      for (const r of on) expect(Math.abs(r.gap)).toBeLessThan(0.01)
      const drive = rows.slice(kick - SAVE.drive - 1, kick)
      for (let n = 1; n < drive.length; n++) {
        expect(drive[n]!.v, 'the ball goes up').toBeLessThan(drive[n - 1]!.v)
        expect(drive[n]!.turn, 'and the wire with it').toBeLessThan(drive[n - 1]!.turn)
      }
      expect(rows[kick - SAVE.drive - 2]!.v).toBe(rows[kick - SAVE.drive - 1]!.v)
      expect(rows[kick]!.v, 'on the kick\'s step the ball sits on the wire').toBe(rows[kick - 1]!.v)
      m.free()
    }
  })

  it('swings the wire past its rest place twice or more after the kick, in swings of more than 2 px that grow smaller, and brings it to rest', () => {
    for (const k of [0, 1]) {
      const { rows, kick, m } = lost(true, k, ways[0]!)
      const after = rows.slice(kick + 1).map((r) => r.turn)
      const tops: number[] = []
      let crossings = 0
      let top = 0
      for (let n = 1; n < after.length; n++) {
        if (Math.abs(down(after[n]!)) > Math.abs(top)) top = down(after[n]!)
        if (after[n - 1]! !== 0 && after[n]! !== 0 && Math.sign(after[n]!) !== Math.sign(after[n - 1]!)) {
          crossings++
          tops.push(top)
          top = 0
        }
      }
      tops.push(top)
      expect(crossings).toBeGreaterThanOrEqual(2)
      const seen = tops.slice(1).filter((t) => Math.abs(t) > 2)
      expect(seen.length).toBeGreaterThanOrEqual(2)
      expect(seen.length).toBeLessThanOrEqual(3)
      for (let n = 1; n < tops.length; n++) expect(Math.abs(tops[n]!)).toBeLessThan(Math.abs(tops[n - 1]!))
      expect(tops[0]!).toBeLessThan(-2)
      expect(after.at(-1)).toBe(0)
      m.free()
    }
  })

  it('swings no bat at a save, live or film, and gives the gate in film mode the one number it had', () => {
    for (const live of [true, false]) for (const k of [0, 1]) for (const w of ways) {
      const { rows, take, kick, m } = lost(live, k, w)
      expect(kick).toBeGreaterThan(0)
      expect(take > 0).toBe(live)
      for (const r of rows) {
        expect(r.flip).toEqual([0, 0])
        expect(r.own).toEqual([0, 0])
        if (!live) expect(r.state).toEqual([0])
      }
      m.free()
    }
    expect(TIERS.length).toBe(3)
  })
})

describe('a gate that opens under a ball on its wire', () => {
  // The step of the tier's fall for a gate opened on a given step, as it was before this work (commit 305e5bf3), for the first and the fourth of the ways; -1: the ball was thrown before the gate opened.
  const FELL: [number, number][][] = [
    [[5, 23], [12, 25], [20, 30], [30, 40], [40, 50], [50, 60], [58, 66], [62, 69], [66, 73], [70, 76]],
    [[5, 10], [12, 21], [20, 30], [30, 40], [40, 49], [50, 57], [58, 65], [62, -1], [66, -1], [70, -1]]
  ]
  beforeAll(async () => {
    await prepare()
  })

  it('lets the ball down the hole on the step it fell on before, wherever in the load the gate opens', () => {
    for (const [i, w] of [ways[0]!, ways[3]!].entries()) for (const [open, was] of FELL[i]!) {
      const m = new Machine()
      m.live = true
      m.gate = [false, false, false]
      m.toPlane(0, w.x, TIER_Y[1]! + 10.2, w.vx, w.vy)
      let fall = -1
      let far = 0
      for (let n = 1; n < 300 && fall < 0; n++) {
        if (n === open) m.gate[1] = true
        const y = m.balls[0]!.y
        if (m.step(false, false).some((e) => e.name === 'tier-fall')) fall = n
        else if (n >= open && m.balls[0]!.mode === 'tow') far = Math.max(far, Math.abs(m.balls[0]!.y - y))
      }
      expect(fall, `opened on step ${open}`).toBe(was)
      expect(far * BALL, 'no step of the way down is a jump').toBeLessThan(12)
      m.free()
    }
  })
})

describe('the live view under a gate', () => {
  it('stands lower while a ball lies on the wire of the lobby or the office, goes there and back from rest with no step more than 0.16 px apart from the step before it, does not move at a ball the bat\'s tip turns away, and leaves the street\'s view alone', async () => {
    await prepare()
    let mc: Machine | null = null
    const step = Machine.prototype.step
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      return step.call(this, l, r)
    }
    try {
      const driver: Driver = { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) as Pointer }
      const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed: 1 })
      let was = 0
      let loaded = 0
      const seen: [number, number, boolean, boolean][] = []
      let since = -1
      let tier = 0
      while (stage.entryIndex === 0 && stage.time < 110) {
        stage.advance(1)
        const m = mc as Machine | null
        if (!m) continue
        const b = m.balls[0]!
        const scroll = stage.page.scroll()
        const home = TIER_Y[b.tier]! * BALL
        if ((m.taken >= 0 && !m.gate[b.tier]) || (since >= 0 && since < 100 && b.tier === tier)) expect(Math.abs(scroll - was), 'the view\'s step').toBeLessThanOrEqual(2.6)
        if (m.taken >= 0 && !m.gate[b.tier] && b.tier < 2) expect(scroll - home, 'the room under the wire from the take on, px').toBeGreaterThan(25)
        seen.push([scroll, b.tier, m.events.some((e) => e.name === 'gate-take' && e.ball === 0), m.events.some((e) => e.name === 'ball-save' && e.ball === 0)])
        if (m.taken >= SAVE.land + SAVE.wind - SAVE.still && !m.gate[b.tier]) {
          loaded++
          if (b.tier < 2) {
            expect(scroll - home, 'the room under the wire while it stands loaded, px').toBeGreaterThan(55)
            expect(scroll - home).toBeLessThanOrEqual(90)
          } else expect(scroll - home).toBeCloseTo(0.95 * BALL, 6)
        }
        if (m.events.some((e) => e.name === 'ball-save' && e.ball === 0)) {
          since = 0
          tier = b.tier
        } else if (since >= 0) since++
        if (since === 2 * stepHz) {
          if (b.tier === tier && tier < 2 && b.mode === 'plane' && b.y - TIER_Y[tier]! < 9) expect(Math.abs(scroll - home)).toBeLessThan(1)
          since = -1
        }
        was = scroll
      }
      expect(loaded).toBeGreaterThan(2 * SAVE.still)
      let soft = 0
      for (let i = 2 * stepHz; i < seen.length - 2 * stepHz; i++) {
        const [, k, take, save] = seen[i]!
        if (k > 1 || (!take && !save)) continue
        const from = take ? i - stepHz : i
        const to = take ? i : i + 2 * stepHz
        if (seen.slice(from - 4, to + 1).some((r) => r[1] !== k)) continue
        soft++
        for (let j = from; j <= to; j++) {
          const a = seen[j]![0] - seen[j - 1]![0]
          const b = seen[j - 1]![0] - seen[j - 2]![0]
          expect(Math.abs(a - b), `the view's step against the step before it, ${take ? 'on the way down' : 'on the way back'}`).toBeLessThanOrEqual(0.16)
        }
      }
      expect(soft).toBeGreaterThanOrEqual(2)
      let began = 0
      for (let i = stepHz; i < seen.length - stepHz; i++) {
        const [scroll, k] = seen[i]!
        if (k > 1 || Math.abs(seen[i - 1]![0] - TIER_Y[k]! * BALL) > 0.5 || scroll - seen[i - 1]![0] < 0.02) continue
        if (seen.slice(i - stepHz / 2, i + stepHz).some((r) => r[1] !== k) || seen[i - 1]![0] - seen[i - 2]![0] >= 0.02 || seen[i - 1]![0] < seen[i - 2]![0]) continue
        began++
        expect(seen.slice(i, i + stepHz).some((r) => r[2]), `a take within a second of the view's first step down from rest, step ${i}`).toBe(true)
      }
      expect(began).toBeGreaterThanOrEqual(2)
    } finally {
      Machine.prototype.step = step
    }
  })
})

describe('the ball\'s first frames out of the port, in the film', () => {
  let mc: Machine | null = null
  const step = Machine.prototype.step
  const events: [string, number, number][] = []
  const feed: { n: number; s: number; y: number; scroll: number; ring: number[] }[] = []
  let arrive = -1
  let release = -1
  beforeAll(() => {
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      const out = step.call(this, l, r)
      for (const e of out) events.push([e.name, e.ball, this.steps])
      return out
    }
    const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver() as Driver, film: filmOptions('pinball') })
    let n = 0
    while (!s.finished && s.time < 43) {
      s.advance(1)
      n++
      const b = mc ? (mc as Machine).balls[0]! : null
      if (!b) continue
      const on = b.mode === 'rail' && b.rail === 'feed'
      if (on && release < 0) release = n
      if (!on && release >= 0 && arrive < 0) arrive = n
      if (on && n <= release + 2 * stepHz) {
        const list: DrawList = []
        s.page.draw(list)
        feed.push({ n, s: b.s, y: b.y * BALL, scroll: s.page.scroll(), ring: [...(list.find((x) => x.id === 'loader.ring')?.v ?? [])] })
      }
    }
  })
  afterAll(() => {
    Machine.prototype.step = step
  })
  const hash = (): string => createHash('sha256').update(JSON.stringify(events)).digest('hex')
  const frame = (k: number): { n: number; s: number; y: number; scroll: number; ring: number[] } => feed.find((f) => f.n === release + k * EACH)!

  it('moves no event of the film\'s machine', () => {
    if (process.env.GATE_WAS) console.log('WAS', JSON.stringify({ events: events.length, hash: hash(), at: feed.find((f) => f.n === AT)!.s, scroll: feed.find((f) => f.n === AT)!.scroll, arrive, release }))
    expect(events.length).toBe(WAS.events)
    expect(hash()).toBe(WAS.hash)
  })

  it('opens the port\'s ring on the frame before the ball moves', () => {
    expect(release).toBe(WAS.release)
    expect(frame(0).y).toBe(frame(1).y)
    expect(frame(0).ring.length).toBe(1)
    expect(frame(1).ring.length).toBe(2)
    expect(frame(2).y).toBeGreaterThan(frame(1).y)
  })

  it('lets the ball fall from rest: a first step of under 4 px, and each of the 39 steps after it longer than the one before', () => {
    const steps: number[] = []
    for (let k = 2; k <= 41; k++) steps.push(frame(k).y - frame(k - 1).y)
    expect(steps[0]!).toBeGreaterThan(0.2)
    expect(steps[0]!).toBeLessThan(4)
    for (let k = 1; k < steps.length; k++) expect(steps[k]! - steps[k - 1]!, `step ${k + 1}`).toBeGreaterThan(0.05)
  })

  it('is the ball of before from 77 frames after the release on: at second 5.85 of the scene its place on the rail and the page\'s scroll are the numbers of before, and it leaves the tube on the same step', () => {
    const at = feed.find((f) => f.n === AT)!
    expect(at.s).toBe(WAS.at)
    expect(at.scroll).toBe(WAS.scroll)
    expect(arrive).toBe(WAS.arrive)
  })
})
