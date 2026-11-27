import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList, Driver, Pointer } from '../src/stage/types'
import { ANSWER, dipOf } from '../src/table/real/frame/loader'
import { BALL, PORT } from '../src/table/layout'

const EACH = stepHz / 60

interface Row { n: number; time: number; arrow: boolean; inBall: boolean; turn: number; ball: number[]; shell: number[]; ring: number[]; scroll: number }
interface Take { rows: Row[]; seal: number; lock: number; release: number; arrive: number }

class Still implements Driver {
  readonly name = 'script' as const
  input(): Pointer {
    return { x: 300, y: 900, down: false }
  }
}

function run(s: Stage, until: number): Take {
  const rows: Row[] = []
  let n = 0
  let seal = -1
  let lock = -1
  let release = -1
  let arrive = -1
  while (!s.finished && s.time < until && (arrive < 0 || n < arrive + stepHz)) {
    s.advance(1)
    n++
    const c = s.cursor.pose()
    const list: DrawList = []
    s.page.draw(list)
    const b = list.find((x) => x.id === 'ball.clear')
    const ring = list.find((x) => x.id === 'loader.ring')
    const row: Row = { n, time: s.time, arrow: c.inBall || c.z > 0, inBall: c.inBall, turn: c.lean + c.spin, ball: b ? [b.x + b.w / 2, b.y + b.h / 2] : [], shell: b?.v ? [...b.v] : [], ring: ring?.v ? [...ring.v] : [], scroll: s.page.scroll() }
    const last = rows[rows.length - 1]
    if (seal < 0 && row.inBall) seal = n
    if (seal >= 0 && lock < 0 && row.shell[0] === 1) lock = n
    if (lock >= 0 && release < 0 && last && row.ball[1]! > last.ball[1]!) release = n - 1
    if (release >= 0 && arrive < 0 && n > release + stepHz && last && row.ball[0] === last.ball[0] && row.ball[1] === last.ball[1]) arrive = n - 1
    rows.push(row)
  }
  return { rows, seal, lock, release, arrive }
}

const film = run(new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') }), 12)
const live = run(new Stage({ mode: 'live', flow: [{ page: 'step3' }], pages, driver: new Still(), seed: config.seed }), 20)
const takes: [string, Take][] = [['film', film], ['live', live]]

const frames = (t: Take, from: number, count: number): Row[] => Array.from({ length: count }, (_, k) => t.rows[from - 1 + k * EACH]!)
const steps = (rows: Row[]): number[] => rows.slice(1).map((r, i) => Math.hypot(r.ball[0]! - rows[i]!.ball[0]!, r.ball[1]! - rows[i]!.ball[1]!))
const hash = (t: Take, from: number): string => createHash('sha256').update(JSON.stringify(t.rows.filter((r) => r.n >= from).map((r) => [r.ball, r.scroll]))).digest('hex')
const meet = (t: Take): number => t.release + Math.round(1.3 * stepHz) + 1

if (process.env.PORT2_TRACE) writeFileSync(process.env.PORT2_TRACE, JSON.stringify({ film, live, was: takes.map(([name, t]) => [name, t.seal, t.lock, t.release, t.arrive, hash(t, meet(t)), hash(t, t.arrive)]) }))

// The numbers of before this work (commit 308e96a1), taken with this file's own take: the step of the seal, of the lock, of the release and of the ball's arrival at the tube's end, and the sha256 of the ball's place and the page's scroll at every step from 1.3 s after the release on.
const WAS: Record<string, { seal: number; lock: number; release: number; arrive: number; after: string }> = {
  film: { seal: 0, lock: 0, release: 0, arrive: 0, after: '' },
  live: { seal: 0, lock: 0, release: 0, arrive: 0, after: '' }
}

describe.each(takes)('the port takes the arrow and lets the ball fall, %s', (name, t) => {
  it('keeps the steps of the seal, the lock, the release and the arrival, and from 1.3 s after the release on the ball and the view are the ball and the view of before at every step', () => {
    expect([t.seal, t.lock, t.release, t.arrive]).toEqual([WAS[name]!.seal, WAS[name]!.lock, WAS[name]!.release, WAS[name]!.arrive])
    expect(meet(t)).toBeLessThan(t.arrive)
    expect(hash(t, meet(t))).toBe(WAS[name]!.after)
  })

  it('draws the arrow or the whole ball on every step from the first to the release, and the arrow in every step of the close', () => {
    for (const r of t.rows) {
      if (r.n > t.release) break
      expect(r.arrow || (r.shell[0] === 1 && r.ball.length === 2), `step ${r.n}`).toBe(true)
      if (r.n >= t.seal) expect(r.inBall, `step ${r.n}`).toBe(true)
    }
  })

  it('shuts the halves as two jaws out of the cup in one action of 16 frames that ends in a snap, with no step back', () => {
    const close = t.rows.filter((r) => r.n >= t.seal && r.n < t.lock)
    expect(Math.round(close.length / EACH)).toBe(16)
    for (let i = 0; i < close.length; i++) {
      expect(close[i]!.shell[6], `step ${close[i]!.n}`).toBe(1)
      if (i > 0) expect(close[i]!.shell[0]!).toBeGreaterThanOrEqual(close[i - 1]!.shell[0]!)
    }
    const shut = frames(t, t.lock - 5 * EACH, 6).map((r) => r.shell[0]!)
    for (let k = 2; k < 5; k++) expect(shut[k]! - shut[k - 1]!, `frame ${k}`).toBeGreaterThan(shut[k - 1]! - shut[k - 2]!)
    expect(shut[5]).toBe(1)
    expect(t.rows[t.lock - 1]!.shell.length).toBe(6)
  })

  it('answers the lock on its own frame: the ring is struck and gives 2 to 4 px at its lip and springs back past its rest, and the ball is pressed', () => {
    const at = t.rows[t.lock - 1]!
    expect(at.ring[0]!).toBeLessThan(1 / 60)
    expect(at.shell[3]!).toBeGreaterThan(0.5)
    const lip = ANSWER.shrink * (PORT.cup / 2) * BALL
    expect(lip * dipOf(at.ring[0]!)).toBeGreaterThanOrEqual(2)
    expect(lip * dipOf(at.ring[0]!)).toBeLessThanOrEqual(4)
    expect(dipOf(ANSWER.hold + ANSWER.ring / 2)).toBeLessThan(0)
    expect(dipOf(ANSWER.over)).toBe(0)
  })

  it('stands the whole ball still for 6 frames or more between the lock and the release', () => {
    expect((t.release - t.lock) / EACH).toBeGreaterThanOrEqual(6)
    const stand = t.rows.filter((r) => r.n >= t.lock && r.n <= t.release)
    for (const r of stand) {
      expect(r.shell[0]).toBe(1)
      expect(r.ball).toEqual(stand[0]!.ball)
    }
  })

  it('lets the ball fall: no step per frame of 60 is shorter than the one before until its top pace, which comes 40 frames or more after the release, and the two bends each take speed in one frame', () => {
    const fall = steps(frames(t, t.release, 66))
    const top = fall.indexOf(Math.max(...fall))
    expect(top + 1).toBeGreaterThanOrEqual(40)
    expect(fall[0]).toBe(0)
    expect(fall[1]!).toBeGreaterThan(0)
    expect(fall[1]!).toBeLessThan(1)
    for (let k = 1; k <= top; k++) expect(fall[k]!, `frame ${k + 1}`).toBeGreaterThanOrEqual(fall[k - 1]!)
    expect(fall[top + 1]! / fall[top]!).toBeLessThan(0.75)
    expect(fall[top + 1]! / fall[top]!).toBeGreaterThan(0.6)
    const pace = fall[fall.length - 1]!
    const second = fall.findIndex((v, k) => k > top + 1 && v < fall[k - 1]! - 1)
    expect(second).toBeGreaterThan(top + 10)
    for (let k = top + 2; k < second; k++) expect(fall[k]!, `frame ${k + 1}`).toBeGreaterThanOrEqual(fall[k - 1]!)
    for (let k = second + 1; k < fall.length; k++) expect(Math.abs(fall[k]! - pace)).toBeLessThan(0.01)
    expect(fall[second - 1]!).toBeGreaterThan(pace * 1.3)
  })

  it('turns the arrow no further than the ball rolls', () => {
    const rows = frames(t, t.release, 62)
    const way = steps(rows).reduce((a, b) => a + b, 0)
    const turned = rows[rows.length - 1]!.turn - rows[0]!.turn
    expect(turned).toBeGreaterThan(0)
    expect(turned).toBeLessThanOrEqual(way / (BALL / 2))
    const turn = rows.slice(1).map((r, i) => r.turn - rows[i]!.turn)
    for (let k = 12; k < 44; k++) expect(turn[k]!, `frame ${k + 1}`).toBeGreaterThan(turn[k - 1]!)
  })
})
