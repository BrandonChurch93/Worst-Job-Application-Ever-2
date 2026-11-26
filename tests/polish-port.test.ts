import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { sealedFit } from '../src/cursor/fit'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'

const BALL = config.table.ballPx
const WAS_SCROLL = 2011.0711
const EACH = stepHz / 60

interface Row { time: number; x: number; y: number; z: number; squash: number; turn: number; inBall: boolean; taken: boolean; hold: number; ball: number[] | null; shell: number[] | null; scroll: number; card: number | null; cap: number | null; ring: number }

const take = (() => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const rows: Row[] = []
  let n = 0
  while (!s.finished && s.time < 43) {
    s.advance(1)
    n++
    if (n % EACH !== 0) continue
    const c = s.cursor.pose()
    const list: DrawList = []
    s.page.draw(list)
    const b = list.find((x) => x.id === 'ball.clear')
    const card = list.find((x) => x.id === 'result')
    const cap = list.find((x) => x.id === 'go-cap')
    const ring = list.find((x) => x.id === 'loader.ring')
    rows.push({ time: s.time, x: c.x, y: c.y, z: c.z, squash: c.squash, turn: c.lean + c.spin, inBall: c.inBall, taken: c.taken, hold: c.inBall ? sealedFit(c, s.time).hold : 1, ball: b ? [b.x + b.w / 2, b.y + b.h / 2, b.z0] : null, shell: b?.v ? [...b.v] : null, scroll: s.page.scroll(), card: card ? card.z1 : null, cap: cap ? cap.z1 : null, ring: ring?.v?.[0] ?? 9 })
  }
  return { rows, events: s.events.map((e) => ({ name: e.name, time: e.step / stepHz })) }
})()

if (process.env.PORT_TRACE) writeFileSync(process.env.PORT_TRACE, JSON.stringify(take))

const at = (t: number): Row => take.rows[Math.round(t * 60) - 1]!
const between = (a: number, b: number): Row[] => take.rows.filter((r) => r.time >= a - 1e-6 && r.time <= b + 1e-6)
const WAS: [string, number][] = [['step', 235], ['step', 269], ['step', 300], ['step', 329], ['step', 449], ['ball-seal', 552], ['tube-run', 791], ['lights-down', 983], ['power-on', 1728], ['plunger', 2508], ['sling', 2952], ['carpet-roll', 2995], ['spinner', 3108], ['doors-slam', 3144], ['tier-fall', 3470], ['flasher', 3585], ['drop-target', 3674], ['drop-target', 3675], ['drop-target', 3678], ['drop-target', 3682], ['sling', 3726], ['bumper', 3767], ['bumper', 3850], ['sling', 3873], ['bumper', 3913], ['flipper', 4142], ['bumper', 4174], ['sling', 4202], ['bumper', 4242], ['sling', 4267], ['bumper', 4308], ['flipper', 4385], ['bumper', 4417], ['flipper', 4450], ['inbox-take', 4507], ['ball-drop', 4987], ['flasher', 4987], ['ball-drop', 5011], ['ball-drop', 5035], ['flipper', 5100], ['flasher', 5102], ['flasher', 5134], ['sling', 5159], ['flasher', 5198], ['sling', 5223], ['flasher', 5263], ['flipper', 5380], ['flasher', 5413], ['sling', 5440], ['flasher', 5480], ['sling', 5504], ['flasher', 5543], ['tier-fall', 5952], ['flipper', 6173], ['firehouse-take', 6302], ['scoop-kick', 7046], ['flipper', 7297], ['ramp-roll', 7349], ['spiral', 7919], ['flipper', 8548], ['flipper-save', 8548], ['sling', 8763], ['drain', 9031], ['ball-open', 9316], ['flatten', 9316], ['peel-up', 9437], ['button-press', 9840], ['page-turn', 9960]]

describe('the machine page\'s own moments in the film', () => {
  it('moves no event of the take', () => {
    expect(take.events.map((e) => [e.name, Math.round(e.time * stepHz)])).toEqual(WAS)
  })

  it('draws the arrow to the port with growing speed and sinks it over more than three frames', () => {
    const pull = between(2, 2.2)
    const speed = pull.slice(1).map((r, i) => Math.hypot(r.x - pull[i]!.x, r.y - pull[i]!.y))
    for (let i = 1; i < speed.length - 2; i++) expect(speed[i]!).toBeGreaterThan(speed[i - 1]!)
    expect(at(2.2).squash).toBeGreaterThan(at(2).squash)
    const sink = between(2.3 - 5 / 60, 2.3)
    expect(sink.length).toBe(6)
    for (let i = 1; i < sink.length; i++) {
      expect(sink[i]!.squash).toBeLessThan(sink[i - 1]!.squash)
      expect(sink[i]!.z).toBeLessThan(sink[i - 1]!.z)
      expect(sink[i]!.z).toBeGreaterThan(0)
      expect(sink[i - 1]!.squash - sink[i]!.squash).toBeLessThan(0.2)
      expect(Math.abs(sink[i]!.turn - sink[i - 1]!.turn)).toBeLessThan(0.4)
    }
    const last = at(2.3)
    const sealed = at(2.3 + 1 / 60)
    expect(sealed.inBall).toBe(true)
    expect(Math.abs(last.squash - sealed.squash)).toBeLessThan(0.02)
    expect(Math.abs(last.turn - sealed.turn)).toBeLessThan(0.05)
  })

  it('shuts the halves slowly and then fast, and the latch presses the ball and lights the cup again', () => {
    const shut = between(2.3 + 1 / 60, 2.3 + 16 / 60).map((r) => r.shell![0]!)
    for (let i = 1; i < shut.length; i++) expect(shut[i]!).toBeGreaterThanOrEqual(shut[i - 1]!)
    const step = shut.slice(1).map((v, i) => v - shut[i]!)
    expect(Math.max(...step.slice(-3))).toBeGreaterThan(3 * Math.max(...step.slice(6, 11)))
    const latch = take.rows.find((r) => r.shell && r.shell[0] === 1)!
    expect(latch.shell![3]).toBeGreaterThan(0)
    expect(latch.ring).toBeLessThan(0.02)
    expect(take.rows[take.rows.indexOf(latch) - 1]!.ring).toBeGreaterThan(0.2)
    expect(at(latch.time + 0.6).shell![3]).toBe(0)
    const close = between(2.3 + 1 / 60, latch.time + 0.2)
    for (let i = 1; i < close.length; i++) expect(Math.abs(close[i]!.turn - close[i - 1]!.turn)).toBeLessThan(0.25)
  })

  it('lets the ball run down the screen and brings the view after it', () => {
    const y = (t: number): number => at(t).ball![1]! - at(t).scroll
    expect(y(3.3)).toBeLessThan(530)
    expect(y(3.5)).toBeGreaterThan(640)
    expect(y(3.8)).toBeGreaterThan(740)
    expect(y(3.8)).toBeLessThan(900)
    expect(y(4.3)).toBeLessThan(y(3.8) - 80)
    const view = between(3.3, 4.6).map((r) => r.scroll)
    for (let i = 1; i < view.length; i++) expect(view[i]! - view[i - 1]!).toBeLessThan(26)
    expect(Math.abs(at(6).scroll - WAS_SCROLL)).toBeLessThan(0.01)
  })

  it('rolls the arrow with the way travelled in both tubes', () => {
    const feed = between(3.35, 4.2)
    for (let i = 1; i < feed.length; i++) expect(feed[i]!.turn).toBeGreaterThan(feed[i - 1]!.turn)
    expect(at(4.2).turn - at(3.35).turn).toBeGreaterThan(Math.PI)
    const drain = between(37.75, 38.5)
    const turned = drain.slice(1).reduce((n, r, i) => n + Math.abs(r.turn - drain[i]!.turn), 0)
    expect(turned).toBeGreaterThan(Math.PI)
  })

  it('raises the card from the page and settles it', () => {
    const rise = take.rows.filter((r) => r.card !== null)
    expect(rise[0]!.card!).toBeLessThan(0.5)
    const top = Math.max(...rise.map((r) => r.card!))
    const end = rise[rise.length - 1]!.card!
    expect(top).toBeGreaterThan(end + 1)
    expect(top).toBeLessThan(end + 2)
    for (let i = 1; i < 20; i++) expect(Math.abs(rise[i]!.card! - rise[i - 1]!.card!)).toBeLessThan(1.2)
    expect(BALL).toBeGreaterThan(0)
  })
})
