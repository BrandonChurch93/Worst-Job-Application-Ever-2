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
const WAS: [string, number][] = [['vacuum-on', 168], ['vacuum-slip', 397], ['vacuum-slip', 579], ['vacuum-lose', 693], ['ball-seal', 792], ['tube-run', 947], ['lights-down', 1139], ['power-on', 1752], ['strike:plunger:2', 2508], ['plunger', 2508], ['strike:corporate.sling.left:1', 2952], ['sling', 2952], ['carpet-roll', 2995], ['strike:corporate.revolving:1', 3108], ['loot', 3108], ['spinner', 3108], ['strike:corporate.hq:2', 3144], ['doors-slam', 3144], ['tier-fall', 3470], ['strike:office.bumper.2:2', 3585], ['loot', 3585], ['flasher', 3585], ['strike:office.cubicles.drop.2:2', 3674], ['loot', 3674], ['drop-target', 3674], ['strike:office.cubicles.drop.3:2', 3675], ['loot', 3675], ['drop-target', 3675], ['strike:office.cubicles.drop.4:2', 3678], ['loot', 3678], ['drop-target', 3678], ['strike:office.cubicles.drop.5:2', 3682], ['loot', 3682], ['drop-target', 3682], ['strike:office.sling.left:1', 3726], ['sling', 3726], ['strike:office.bumper.3:2', 3767], ['loot', 3767], ['bumper', 3767], ['strike:office.bumper.3:2', 3850], ['loot', 3850], ['bumper', 3850], ['strike:office.sling.left:1', 3873], ['sling', 3873], ['strike:office.bumper.3:2', 3913], ['loot', 3913], ['bumper', 3913], ['flipper', 4142], ['strike:office.bumper.3:2', 4174], ['loot', 4174], ['bumper', 4174], ['frenzy-on', 4200], ['strike:office.rail:3', 4200], ['strike:office.bumper.2:3', 4214], ['loot', 4214], ['bumper', 4214], ['strike:office.sling.right:3', 4231], ['loot', 4231], ['sling', 4231], ['strike:office.bumper.2:3', 4249], ['loot', 4249], ['bumper', 4249], ['strike:office.rail:3', 4268], ['strike:office.bumper.2:3', 4285], ['loot', 4285], ['bumper', 4285], ['strike:office.sling.right:3', 4303], ['loot', 4303], ['sling', 4303], ['strike:office.bumper.2:3', 4321], ['loot', 4321], ['bumper', 4321], ['strike:office.sling.right:3', 4339], ['loot', 4339], ['sling', 4339], ['strike:office.bumper.2:3', 4358], ['loot', 4358], ['bumper', 4358], ['strike:office.sling.right:3', 4376], ['loot', 4376], ['sling', 4376], ['flipper', 4385], ['strike:office.bumper.2:3', 4394], ['loot', 4394], ['bumper', 4394], ['strike:office.rail:3', 4413], ['strike:office.bumper.2:3', 4430], ['loot', 4430], ['bumper', 4430], ['strike:office.sling.right:3', 4448], ['loot', 4448], ['sling', 4448], ['flipper', 4450], ['strike:office.bumper.2:3', 4467], ['loot', 4467], ['bumper', 4467], ['strike:office.sling.right:3', 4485], ['loot', 4485], ['sling', 4485], ['strike:office.bumper.2:3', 4504], ['loot', 4504], ['bumper', 4504], ['strike:office.sling.right:3', 4523], ['loot', 4523], ['sling', 4523], ['strike:office.bumper.2:3', 4542], ['loot', 4542], ['bumper', 4542], ['strike:office.sling.right:3', 4560], ['loot', 4560], ['sling', 4560], ['strike:office.bumper.2:3', 4579], ['loot', 4579], ['flasher', 4579], ['strike:office.sling.right:3', 4597], ['loot', 4597], ['sling', 4597], ['strike:office.bumper.2:3', 4615], ['loot', 4615], ['flasher', 4615], ['strike:office.sling.right:3', 4633], ['loot', 4633], ['sling', 4633], ['strike:office.bumper.2:3', 4652], ['loot', 4652], ['flasher', 4652], ['strike:office.sling.right:3', 4670], ['loot', 4670], ['sling', 4670], ['strike:office.bumper.2:3', 4689], ['loot', 4689], ['flasher', 4689], ['strike:office.sling.right:3', 4707], ['loot', 4707], ['sling', 4707], ['strike:office.bumper.2:3', 4725], ['loot', 4725], ['flasher', 4725], ['strike:office.sling.right:3', 4743], ['loot', 4743], ['sling', 4743], ['frenzy-off', 4752], ['strike:office.bumper.2:2', 4763], ['loot', 4763], ['flasher', 4763], ['strike:office.sling.right:1', 4786], ['sling', 4786], ['strike:office.bumper.3:2', 4824], ['loot', 4824], ['flasher', 4824], ['inbox-take', 4954], ['ball-drop', 4987], ['strike:steel.1:2', 4987], ['flasher', 4987], ['ball-drop', 5011], ['ball-drop', 5035], ['flipper', 5100], ['strike:steel.1:2', 5102], ['flasher', 5102], ['strike:office.bumper.3:2', 5134], ['loot', 5134], ['flasher', 5134], ['strike:office.sling.left:1', 5159], ['sling', 5159], ['strike:office.bumper.3:2', 5198], ['loot', 5198], ['flasher', 5198], ['strike:office.sling.left:1', 5223], ['sling', 5223], ['strike:office.bumper.3:2', 5263], ['loot', 5263], ['flasher', 5263], ['flipper', 5380], ['strike:office.bumper.3:2', 5413], ['loot', 5413], ['flasher', 5413], ['strike:office.sling.right:1', 5440], ['sling', 5440], ['strike:office.bumper.3:2', 5480], ['loot', 5480], ['flasher', 5480], ['strike:office.sling.right:1', 5504], ['sling', 5504], ['strike:office.bumper.3:2', 5543], ['loot', 5543], ['flasher', 5543], ['tier-fall', 5958], ['flipper', 6173], ['strike:street.bank.drop.4:2', 6246], ['loot', 6246], ['drop-target', 6246], ['strike:street.bank.drop.5:2', 6246], ['loot', 6246], ['drop-target', 6246], ['strike:street.bank.drop.3:2', 6247], ['loot', 6247], ['drop-target', 6247], ['firehouse-take', 6628], ['strike:street.firehouse:2', 7046], ['loot', 7046], ['scoop-kick', 7046], ['flipper', 7297], ['ramp-roll', 7349], ['spiral', 7919], ['flipper', 8548], ['flipper-save', 8548], ['strike:street.sling.right:1', 8763], ['sling', 8763], ['drain', 9031], ['ball-open', 9316], ['flatten', 9316], ['peel-up', 9437], ['button-press', 9840], ['page-turn', 9960]]

describe('the machine page\'s own moments in the film', () => {
  it('gives the result card and its button only heights the shell makes a plate for, at every step from the rise to the end of the take', () => {
    expect(take.plates.length).toBeGreaterThan(2 * 2.4 * stepHz)
    for (const h of take.plates) expect(Math.round(h * 4) / 4).toBe(h)
  })

  it('moves no event of the take', () => {
    expect(take.events.map((e) => [e.name, Math.round(e.time * stepHz)])).toEqual(WAS)
  })

  it('draws the arrow to the port with growing speed and sinks it over more than three frames', () => {
    const pull = between(2.95, 3.13)
    const speed = pull.slice(1).map((r, i) => Math.hypot(r.x - pull[i]!.x, r.y - pull[i]!.y))
    for (let i = 1; i < speed.length - 2; i++) expect(speed[i]!).toBeGreaterThan(speed[i - 1]!)
    expect(at(3.13).squash).toBeGreaterThan(at(2.95).squash)
    const sink = between(3.3 - 5 / 60, 3.3)
    expect(sink.length).toBe(6)
    for (let i = 1; i < sink.length; i++) {
      expect(sink[i]!.squash).toBeLessThan(sink[i - 1]!.squash)
      expect(sink[i]!.z).toBeLessThan(sink[i - 1]!.z)
      expect(sink[i]!.z).toBeGreaterThan(0)
      expect(sink[i - 1]!.squash - sink[i]!.squash).toBeLessThan(0.2)
      expect(Math.abs(sink[i]!.turn - sink[i - 1]!.turn)).toBeLessThan(0.4)
    }
    const last = at(3.3)
    const sealed = at(3.3 + 1 / 60)
    expect(sealed.inBall).toBe(true)
    expect(Math.abs(last.squash - sealed.squash)).toBeLessThan(0.02)
    expect(Math.abs(last.turn - sealed.turn)).toBeLessThan(0.05)
  })

  it('shuts the halves slowly and then fast, and the latch presses the ball and lights the cup again', () => {
    const shut = between(3.3 + 1 / 60, 3.3 + 16 / 60).map((r) => r.shell![0]!)
    for (let i = 1; i < shut.length; i++) expect(shut[i]!).toBeGreaterThanOrEqual(shut[i - 1]!)
    const step = shut.slice(1).map((v, i) => v - shut[i]!)
    expect(Math.max(...step.slice(-3))).toBeGreaterThan(3 * Math.max(...step.slice(6, 11)))
    const latch = take.rows.find((r) => r.shell && r.shell[0] === 1)!
    expect(latch.shell![3]).toBeGreaterThan(0)
    expect(latch.ring).toBeLessThan(0.02)
    expect(take.rows[take.rows.indexOf(latch) - 1]!.ring).toBeGreaterThan(0.2)
    expect(at(latch.time + 0.6).shell![3]).toBe(0)
    const close = between(3.3 + 1 / 60, latch.time + 0.2)
    for (let i = 1; i < close.length; i++) expect(Math.abs(close[i]!.turn - close[i - 1]!.turn)).toBeLessThan(0.25)
  })

  it('lets the ball run down the screen, past 640 px of it 22 frames after the release, and brings the view after it', () => {
    const y = (t: number): number => at(t).ball![1]! - at(t).scroll
    expect(y(3.95)).toBeLessThan(530)
    expect(y(4.35 - 2 / 60)).toBeLessThan(640)
    expect(y(4.35 - 1 / 60)).toBeGreaterThan(640)
    expect(y(4.65)).toBeGreaterThan(740)
    expect(y(4.65)).toBeLessThan(900)
    expect(y(4.95)).toBeLessThan(y(4.65) - 80)
    const view = between(3.95, 5.25).map((r) => r.scroll)
    for (let i = 1; i < view.length; i++) expect(view[i]! - view[i - 1]!).toBeLessThan(26)
    expect(Math.abs(at(6.65).scroll - WAS_SCROLL)).toBeLessThan(0.01)
  })

  it('rolls the arrow with the way travelled in both tubes', () => {
    const feed = between(4.1, 4.85)
    for (let i = 1; i < feed.length; i++) expect(feed[i]!.turn).toBeGreaterThan(feed[i - 1]!.turn)
    expect(at(4.85).turn - at(4.1).turn).toBeGreaterThan(Math.PI)
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
