import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { sealedFit } from '../src/cursor/fit'
import { pages } from '../src/pages'
import { CLOCK } from '../src/pages/step3/clock'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'

const BALL = config.table.ballPx
// The view 6.65 s into the scene. It was 2011.0711 until the long fight: the scene now goes on one step (1/240 s) after the film's second 6.9, and the view is that step behind.
const WAS_SCROLL = 2007.6052
const EACH = stepHz / 60
// The film's second of the seal, and the seconds the long fight puts between the scene's clock and the film's from the seal to the plunger (src/pages/step3/clock.ts).
const SEAL = CLOCK.gone
const LATE = CLOCK.gone - CLOCK.stop

interface Row { time: number; x: number; y: number; z: number; squash: number; turn: number; inBall: boolean; taken: boolean; hold: number; ball: number[] | null; shell: number[] | null; scroll: number; card: number | null; cap: number | null; ring: number }

const take = (() => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const rows: Row[] = []
  const plates: number[] = []
  let n = 0
  while (!s.finished && s.time < 43) {
    s.advance(1)
    n++
    if (s.time > 39.4 && s.time < 42.2) {
      const now: DrawList = []
      s.page.draw(now)
      for (const id of ['result', 'go-cap']) {
        const plate = now.find((x) => x.id === id)
        if (plate) plates.push(plate.z1 - plate.z0)
      }
    }
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
  return { rows, plates, events: s.events.map((e) => ({ name: e.name, time: e.step / stepHz })) }
})()

if (process.env.PORT_TRACE) writeFileSync(process.env.PORT_TRACE, JSON.stringify(take))

const at = (t: number): Row => take.rows[Math.round(t * 60) - 1]!
const between = (a: number, b: number): Row[] => take.rows.filter((r) => r.time >= a - 1e-6 && r.time <= b + 1e-6)
const WAS: [string, number][] = [['vacuum-on', 168], ['vacuum-slip', 456], ['vacuum-slip', 863], ['vacuum-slip', 1198], ['vacuum-slip', 1390], ['vacuum-lose', 1557], ['ball-seal', 1656], ['tube-run', 1812], ['lights-down', 2004], ['power-on', 2617], ['strike:plunger:2', 3157], ['plunger', 3157], ['strike:corporate.sling.left:1', 3601], ['sling', 3601], ['carpet-roll', 3644], ['strike:corporate.revolving:1', 3757], ['loot', 3757], ['spinner', 3757], ['strike:corporate.hq:2', 3793], ['doors-slam', 3793], ['tier-fall', 4119], ['strike:office.bumper.2:2', 4234], ['loot', 4234], ['bumper', 4234], ['strike:office.cubicles.drop.2:2', 4323], ['loot', 4323], ['drop-target', 4323], ['strike:office.cubicles.drop.3:2', 4324], ['loot', 4324], ['drop-target', 4324], ['strike:office.cubicles.drop.4:2', 4327], ['loot', 4327], ['drop-target', 4327], ['strike:office.cubicles.drop.5:2', 4331], ['loot', 4331], ['drop-target', 4331], ['strike:office.sling.left:1', 4375], ['sling', 4375], ['strike:office.bumper.3:2', 4416], ['loot', 4416], ['bumper', 4416], ['strike:office.bumper.3:2', 4499], ['loot', 4499], ['bumper', 4499], ['strike:office.sling.left:1', 4522], ['sling', 4522], ['strike:office.bumper.3:2', 4562], ['loot', 4562], ['bumper', 4562], ['flipper', 4790], ['strike:office.bumper.3:2', 4822], ['loot', 4822], ['bumper', 4822], ['frenzy-on', 4849], ['strike:office.rail:3', 4849], ['strike:office.bumper.2:3', 4864], ['loot', 4864], ['bumper', 4864], ['strike:office.sling.right:3', 4881], ['loot', 4881], ['sling', 4881], ['strike:office.bumper.2:3', 4898], ['loot', 4898], ['bumper', 4898], ['strike:office.rail:3', 4917], ['strike:office.bumper.2:3', 4934], ['loot', 4934], ['bumper', 4934], ['strike:office.sling.right:3', 4952], ['loot', 4952], ['sling', 4952], ['strike:office.bumper.2:3', 4971], ['loot', 4971], ['bumper', 4971], ['strike:office.sling.right:3', 4989], ['loot', 4989], ['sling', 4989], ['strike:office.bumper.2:3', 5007], ['loot', 5007], ['bumper', 5007], ['strike:office.sling.right:3', 5025], ['loot', 5025], ['sling', 5025], ['flipper', 5033], ['strike:office.bumper.2:3', 5044], ['loot', 5044], ['bumper', 5044], ['strike:office.sling.right:3', 5062], ['loot', 5062], ['sling', 5062], ['strike:office.bumper.2:3', 5080], ['loot', 5080], ['bumper', 5080], ['flipper', 5098], ['strike:office.rail:3', 5099], ['strike:office.bumper.2:3', 5116], ['loot', 5116], ['bumper', 5116], ['strike:office.sling.right:3', 5134], ['loot', 5134], ['sling', 5134], ['strike:office.bumper.2:3', 5153], ['loot', 5153], ['bumper', 5153], ['strike:office.sling.right:3', 5171], ['loot', 5171], ['sling', 5171], ['strike:office.bumper.2:3', 5189], ['loot', 5189], ['bumper', 5189], ['strike:office.sling.right:3', 5207], ['loot', 5207], ['sling', 5207], ['strike:office.bumper.2:3', 5226], ['loot', 5226], ['flasher', 5226], ['strike:office.sling.right:3', 5244], ['loot', 5244], ['sling', 5244], ['strike:office.bumper.2:3', 5263], ['loot', 5263], ['flasher', 5263], ['strike:office.sling.right:3', 5281], ['loot', 5281], ['sling', 5281], ['strike:office.bumper.2:3', 5299], ['loot', 5299], ['flasher', 5299], ['strike:office.sling.right:3', 5317], ['loot', 5317], ['sling', 5317], ['strike:office.bumper.2:3', 5336], ['loot', 5336], ['flasher', 5336], ['strike:office.sling.right:3', 5354], ['loot', 5354], ['sling', 5354], ['strike:office.bumper.2:3', 5372], ['loot', 5372], ['flasher', 5372], ['strike:office.rail:3', 5391], ['frenzy-off', 5401], ['strike:office.bumper.2:2', 5409], ['loot', 5409], ['flasher', 5409], ['strike:office.sling.right:1', 5432], ['sling', 5432], ['ball-drop', 5636], ['inbox-take', 5649], ['strike:steel.1:2', 5650], ['flasher', 5650], ['ball-drop', 5660], ['ball-drop', 5684], ['strike:steel.1:2', 5710], ['flasher', 5710], ['flipper', 5748], ['flasher', 5787], ['strike:steel.2:2', 5795], ['flasher', 5795], ['flasher', 5810], ['strike:office.gate:1', 5837], ['flasher', 5837], ['strike:office.gate:1', 5993], ['flasher', 5993], ['flipper', 6028], ['strike:office.bumper.3:2', 6041], ['loot', 6041], ['flasher', 6041], ['flasher', 6068], ['tier-fall', 6349], ['frenzy-on', 6417], ['strike:street.rail:3', 6417], ['strike:street.sling.left:3', 6456], ['loot', 6456], ['sling', 6456], ['strike:street.sling.right:3', 6494], ['loot', 6494], ['sling', 6494], ['flipper', 6509], ['strike:street.rail:3', 6550], ['strike:street.sling.left:3', 6584], ['loot', 6584], ['sling', 6584], ['strike:street.sling.right:3', 6623], ['loot', 6623], ['sling', 6623], ['strike:street.rail:3', 6678], ['strike:street.sling.right:3', 6727], ['loot', 6727], ['sling', 6727], ['strike:street.sling.left:3', 6763], ['loot', 6763], ['sling', 6763], ['strike:street.rail:3', 6818], ['strike:street.sling.right:3', 6852], ['loot', 6852], ['sling', 6852], ['strike:street.bank.drop.2:2', 6909], ['loot', 6909], ['drop-target', 6909], ['strike:street.bank.drop.3:2', 6909], ['loot', 6909], ['drop-target', 6909], ['strike:street.bank.drop.4:2', 6909], ['loot', 6909], ['drop-target', 6909], ['strike:street.bank.drop.5:2', 6909], ['loot', 6909], ['drop-target', 6909], ['strike:street.bank.drop.1:2', 6910], ['loot', 6910], ['drop-target', 6910], ['firehouse-take', 6913], ['frenzy-off', 6961], ['strike:street.firehouse:2', 7047], ['loot', 7047], ['scoop-kick', 7047], ['flipper', 7297], ['ramp-roll', 7348], ['strike:street.highway:1', 7349], ['loot', 7349], ['strike:street.highway:1', 7393], ['loot', 7393], ['strike:street.highway:1', 7489], ['loot', 7489], ['strike:street.highway:1', 7585], ['loot', 7585], ['strike:street.highway:1', 7681], ['loot', 7681], ['strike:street.highway:1', 7777], ['loot', 7777], ['strike:street.highway:1', 7873], ['loot', 7873], ['spiral', 7920], ['strike:street.garage:1', 7969], ['loot', 7969], ['strike:street.garage:1', 8065], ['loot', 8065], ['strike:street.garage:1', 8160], ['loot', 8160], ['strike:street.garage:1', 8256], ['loot', 8256], ['flipper', 8548], ['flipper-save', 8548], ['strike:street.sling.right:1', 8764], ['sling', 8764], ['drain', 9026], ['ball-open', 9311], ['flatten', 9311], ['peel-up', 9432], ['button-press', 9840], ['page-turn', 9960]]

describe('the machine page\'s own moments in the film', () => {
  it('gives the result card and its button only heights the shell makes a plate for, at every step from the rise to the end of the take', () => {
    expect(take.plates.length).toBeGreaterThan(2 * 2.4 * stepHz)
    for (const h of take.plates) expect(Math.round(h * 4) / 4).toBe(h)
  })

  it('moves no event of the take', () => {
    expect(take.events.map((e) => [e.name, Math.round(e.time * stepHz)])).toEqual(WAS)
  })

  it('draws the arrow to the port with growing speed and sinks it over more than three frames', () => {
    const pull = between(SEAL - 0.35, SEAL - 0.17)
    const speed = pull.slice(1).map((r, i) => Math.hypot(r.x - pull[i]!.x, r.y - pull[i]!.y))
    for (let i = 1; i < speed.length - 2; i++) expect(speed[i]!).toBeGreaterThan(speed[i - 1]!)
    expect(at(SEAL - 0.17).squash).toBeGreaterThan(at(SEAL - 0.35).squash)
    const sink = between(SEAL - 5 / 60, SEAL)
    expect(sink.length).toBe(6)
    for (let i = 1; i < sink.length; i++) {
      expect(sink[i]!.squash).toBeLessThan(sink[i - 1]!.squash)
      expect(sink[i]!.z).toBeLessThan(sink[i - 1]!.z)
      expect(sink[i]!.z).toBeGreaterThan(0)
      expect(sink[i - 1]!.squash - sink[i]!.squash).toBeLessThan(0.2)
      expect(Math.abs(sink[i]!.turn - sink[i - 1]!.turn)).toBeLessThan(0.4)
    }
    const last = at(SEAL)
    const sealed = at(SEAL + 1 / 60)
    expect(sealed.inBall).toBe(true)
    expect(Math.abs(last.squash - sealed.squash)).toBeLessThan(0.02)
    expect(Math.abs(last.turn - sealed.turn)).toBeLessThan(0.05)
  })

  it('shuts the halves slowly and then fast, and the latch presses the ball and lights the cup again', () => {
    const shut = between(SEAL + 1 / 60, SEAL + 16 / 60).map((r) => r.shell![0]!)
    for (let i = 1; i < shut.length; i++) expect(shut[i]!).toBeGreaterThanOrEqual(shut[i - 1]!)
    const step = shut.slice(1).map((v, i) => v - shut[i]!)
    expect(Math.max(...step.slice(-3))).toBeGreaterThan(3 * Math.max(...step.slice(6, 11)))
    const latch = take.rows.find((r) => r.shell && r.shell[0] === 1)!
    expect(latch.shell![3]).toBeGreaterThan(0)
    expect(latch.ring).toBeLessThan(0.02)
    expect(take.rows[take.rows.indexOf(latch) - 1]!.ring).toBeGreaterThan(0.2)
    expect(at(latch.time + 0.6).shell![3]).toBe(0)
    const close = between(SEAL + 1 / 60, latch.time + 0.2)
    for (let i = 1; i < close.length; i++) expect(Math.abs(close[i]!.turn - close[i - 1]!.turn)).toBeLessThan(0.25)
  })

  it('lets the ball run down the screen, past 640 px of it 23 frames after the release, and brings the view after it', () => {
    const y = (t: number): number => at(t).ball![1]! - at(t).scroll
    expect(y(LATE + 3.95)).toBeLessThan(530)
    expect(y(LATE + 4.35 - 1 / 60)).toBeLessThan(640)
    expect(y(LATE + 4.35)).toBeGreaterThan(640)
    expect(y(LATE + 4.65)).toBeGreaterThan(740)
    expect(y(LATE + 4.65)).toBeLessThan(900)
    expect(y(LATE + 4.95)).toBeLessThan(y(LATE + 4.65) - 80)
    const view = between(LATE + 3.95, LATE + 5.25).map((r) => r.scroll)
    for (let i = 1; i < view.length; i++) expect(view[i]! - view[i - 1]!).toBeLessThan(26)
    expect(Math.abs(at(LATE + 6.65).scroll - WAS_SCROLL)).toBeLessThan(0.01)
  })

  it('rolls the arrow with the way travelled in both tubes', () => {
    const feed = between(LATE + 4.1, LATE + 4.85)
    for (let i = 1; i < feed.length; i++) expect(feed[i]!.turn).toBeGreaterThan(feed[i - 1]!.turn)
    expect(at(LATE + 4.85).turn - at(LATE + 4.1).turn).toBeGreaterThan(Math.PI)
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
