import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { FIRE, beamLead, GETUP, KNEEL as SPOT, LAST, LIEDOWN, POWER, SCALE, emberOf, finishEvents, finishState, kneelSpot, powerPlan, type FinishInput } from '../src/boss/finish/acting'
import { POSES, STAND, WALK, feetFor, stepsBy, toPage, type StandPose } from '../src/cursor/stand/rig'
import { SHOUT } from '../src/boss/tune'

const FPS = 60
const ARROW = { x: 690, y: 548 }
const BUTTON = { x: 960, y: 650, w: 177, top: 9.5 }
const M = { arms: SHOUT.arms, charge: SHOUT.beats[0], fire: SHOUT.fire, end: SHOUT.gone, walk: SHOUT.gone + 0.4 }
const spot = kneelSpot(BUTTON)
const start = { x: feetFor(ARROW).x - FIRE.shove * SCALE, y: feetFor(ARROW).y }
const far = Math.hypot(spot.x - start.x, spot.y - start.y)
const LONG = 2.8
const KNEEL = M.walk + LONG
const FIST = KNEEL + LAST.gaps[0]
const PRESS = FIST + LAST.gaps[1]
const smooth = (v: number): number => { const t = Math.min(1, Math.max(0, v)); return t * t * (3 - 2 * t) }

// The whole finish at one view time, as a fight would say it.
function finish(time: number): FinishInput {
  const u = (time - M.walk) / LONG
  const share = u <= 0 ? 0 : u >= 1 ? 1 : smooth(smooth(u) * 0.5 + u * 0.5)
  const pace = u <= 0 || u >= 1 ? 0 : Math.min(1, (Math.min(u, 1 - u) * LONG) / 0.35)
  return {
    time, arrow: ARROW, marks: { ...M, kneel: KNEEL, fist: FIST, press: PRESS }, target: { x: 960, y: 650 }, button: BUTTON,
    charge: Math.min(1, Math.max(0, (time - M.charge) / (M.fire - M.charge - 0.3))), shot: 1,
    walk: { x: start.x + (spot.x - start.x) * share, y: start.y + (spot.y - start.y) * share, walked: far * share, pace }
  }
}
const power = (time: number): FinishInput => ({ time, arrow: ARROW, power: { at: 1, end: 4.4 } })

// Every number of a pose that the eye follows, in px or in px of swing at the figure's size.
function numbers(p: StandPose): number[] {
  return [p.x, p.y, p.rise * 70, p.legs * 30, p.arms * 30, p.hip[0], p.hip[1], p.lean * 60, p.stretch * 70, ...p.hands[0], ...p.hands[1], ...p.feet[0], ...p.feet[1]]
}
const step = (a: StandPose, b: StandPose): number => Math.max(...numbers(a).map((v, i) => Math.abs(v - numbers(b)[i]!)))

describe('the finish: the standing arrow', () => {
  it('says the same thing twice for the same marks and time', () => {
    for (const t of [0.3, 2, 4.2, 5.5, 6.9, 9, KNEEL + 0.2, FIST + 0.6, PRESS + 0.01, PRESS + 2]) {
      expect(JSON.stringify(finishState(finish(t)))).toBe(JSON.stringify(finishState(finish(t))))
    }
  })

  it('lies exactly where the pointer lies before it gets up, and is not drawn', () => {
    const s = finishState({ time: -1, arrow: ARROW, marks: M })
    expect(s.up).toBe(false)
    expect(s.pose.rise).toBe(0)
    expect(s.pose.legs).toBe(0)
    expect(s.pose.arms).toBe(0)
    expect(s.feet.x + STAND.tip[0]).toBeCloseTo(ARROW.x, 6)
    expect(s.feet.y - STAND.tip[1]).toBeCloseTo(ARROW.y, 6)
  })

  it('starts each move from where the last one left it: nothing pops between two frames', () => {
    let worst = { t: 0, by: 0 }
    let before = finishState(finish(-2 / FPS))
    for (let f = -1; f <= (PRESS + 2.5) * FPS; f++) {
      const now = finishState(finish(f / FPS))
      const by = step(before.pose, now.pose)
      if (by > worst.by) worst = { t: f / FPS, by }
      before = now
    }
    // The fastest thing in the film is the fist coming down: about 95 px in 0.15 s.
    expect(worst.by).toBeLessThan(28)
    let slow = 0
    before = finishState(finish(-2 / FPS))
    for (let f = -1; f <= (M.fire - 0.02) * FPS; f++) {
      const now = finishState(finish(f / FPS))
      slow = Math.max(slow, step(before.pose, now.pose))
      before = now
    }
    expect(slow).toBeLessThan(14)
  })

  it('gets up with its legs out before it rises, and has risen by the end of getting up', () => {
    const early = finishState(finish(0.2)).pose
    expect(early.legs).toBeGreaterThan(0.8)
    expect(early.rise).toBeLessThan(0.1)
    const up = finishState(finish(GETUP + 0.01)).pose
    expect(up.rise).toBeCloseTo(1, 2)
    expect(up.arms).toBeCloseTo(1, 2)
  })

  it('powers up and lies down again into the pointer', () => {
    const held = finishState(power(4.3))
    expect(held.up).toBe(true)
    expect(held.fx.aura).toBeGreaterThan(0.9)
    // The fists are at the shoulders, as on the pose sheet: well over the hands at ease, under the top of the arrow.
    expect(held.pose.hands[0][1]).toBeCloseTo(POSES.power.hands[0][1], 6)
    expect(POSES.power.hands[0][1]).toBeGreaterThan(POSES.ready.hands[0][1] + 15)
    expect(POSES.power.hands[0][1]).toBeLessThan(62)
    expect(held.pose.grip).toEqual([1, 1])
    const last = finishState(power(4.4 + POWER.burst + LIEDOWN - 1 / FPS)).pose
    expect(last.rise).toBeLessThan(0.02)
    expect(last.legs).toBeLessThan(0.05)
    expect(finishState(power(4.4 + POWER.burst + LIEDOWN)).up).toBe(false)
    let before = finishState(power(1 - 1 / FPS))
    let worst = 0
    for (let f = 0; f <= 4.6 * FPS; f++) {
      const now = finishState(power(1 + f / FPS))
      worst = Math.max(worst, step(before.pose, now.pose))
      before = now
    }
    expect(worst).toBeLessThan(14)
  })

  it('cups the ball at the hip and grows it with the charge', () => {
    const a = finishState(finish(M.charge + 0.52 * (M.fire - M.charge)))
    const b = finishState(finish(M.fire - 0.33))
    expect(a.fx.ball).not.toBeNull()
    expect(b.fx.ball!.size).toBeGreaterThan(a.fx.ball!.size)
    expect(b.pose.hands[0][0]).toBeLessThan(0)
    expect(b.pose.hands[1][0]).toBeLessThan(0)
    expect(a.fx.beam).toBeNull()
  })

  it('with a thrust mark, holds the ball in front at both hands for a quarter second at least before the beam leaves', () => {
    const film = (time: number): FinishInput => { const i = finish(time); return { ...i, marks: { ...i.marks!, thrust: M.fire - FIRE.ahead } } }
    const leaves = M.fire + beamLead(M.fire - FIRE.ahead, M.fire)
    expect(leaves).toBe(M.fire)
    const front = (time: number): boolean => {
      const s = finishState(film(time))
      return s.fx.ball !== null && s.pose.hands[0][0] > 40 && s.pose.hands[1][0] > 40 && s.fx.beam === null
    }
    let first = Infinity
    for (let n = 0; n < 60; n++) { const t = leaves - (n + 1) / FPS; if (front(t)) first = t; else break }
    const hold = FIRE.ahead - FIRE.coil - FIRE.reach
    expect(hold).toBeCloseTo(0.3, 9)
    expect(leaves - first).toBeGreaterThanOrEqual(hold)
    // The hip pose stays until the thrust, and the marks' times are not moved by it.
    expect(finishState(film(M.fire - FIRE.ahead - 0.01)).pose.hands[0][0]).toBeLessThan(0)
    expect(finishState(film(leaves - 0.01)).fx.beam).toBeNull()
    expect(finishState(film(leaves + 0.05)).fx.beam).not.toBeNull()
    // The ball is not gone before the beam is there.
    for (let n = 0; n < 4; n++) { const s = finishState(film(leaves + n / FPS)); expect(s.fx.ball !== null || s.fx.beam !== null).toBe(true) }
    // Nothing pops on the way.
    for (let n = 0; n < 60; n++) expect(step(finishState(film(M.fire - 0.6 + n / FPS)).pose, finishState(film(M.fire - 0.6 + (n + 1) / FPS)).pose)).toBeLessThan(30)
  })

  it('thrusts at once when the visitor lets go of a charged shot: seen in the first frame, the beam 0.2 s after the release', () => {
    const live = (time: number): FinishInput => { const i = finish(time); return { ...i, marks: { ...i.marks!, thrust: M.fire } } }
    const before = finishState(live(M.fire - 1 / FPS)).pose
    const first = finishState(live(M.fire + 1 / FPS)).pose
    // The hip pose before, and the hands well on their way forward one frame after the release: no drawing back first.
    expect(before.hands[0][0]).toBeLessThan(0)
    expect(first.hands[0][0] - before.hands[0][0]).toBeGreaterThan(10)
    expect(first.hands[1][0] - before.hands[1][0]).toBeGreaterThan(10)
    for (let n = 1; n < 12; n++) expect(finishState(live(M.fire + (n + 1) / FPS)).pose.hands[0][0]).toBeGreaterThanOrEqual(finishState(live(M.fire + n / FPS)).pose.hands[0][0] - 3)
    // In front with the ball before the beam, and the beam leaves at the lead.
    const there = finishState(live(M.fire + FIRE.lead - 2 / FPS))
    expect(there.pose.hands[0][0]).toBeGreaterThan(40)
    expect(there.fx.ball).not.toBeNull()
    expect(there.fx.beam).toBeNull()
    expect(finishState(live(M.fire + FIRE.lead + 0.05)).fx.beam).not.toBeNull()
    // A plain click, with no thrust mark, is what it was: it draws back first.
    const plain = finishState(finish(M.fire + FIRE.coil)).pose
    expect(plain.hands[0][0]).toBeLessThan(finishState(finish(M.fire - 0.01)).pose.hands[0][0])
  })

  it('has its ember rim from the end of the beam on, unless the fight says otherwise', () => {
    expect(emberOf(finish(M.end - 0.01))).toBe(0)
    expect(emberOf(finish(M.end + 0.25))).toBeGreaterThan(0)
    expect(emberOf(finish(M.end + 0.25))).toBeLessThan(1)
    expect(emberOf(finish(PRESS))).toBe(1)
    expect(emberOf({ ...finish(M.fire), ember: 0.7 })).toBeCloseTo(0.7)
    expect(emberOf({ ...finish(PRESS), ember: 0 })).toBe(0)
    expect(emberOf(power(2))).toBe(0)
  })

  it('draws back before the thrust, lets the beam go after its lead, and is shoved back', () => {
    const coil = finishState(finish(M.fire + FIRE.coil)).pose
    const charged = finishState(finish(M.fire - 0.01)).pose
    expect(coil.hands[0][0]).toBeLessThan(charged.hands[0][0])
    expect(finishState(finish(M.fire + FIRE.lead - 0.01)).fx.beam).toBeNull()
    const lit = finishState(finish(M.fire + FIRE.lead + 0.2))
    expect(lit.fx.beam).not.toBeNull()
    expect(lit.pose.hands[0][0]).toBeGreaterThan(50)
    expect(lit.pose.grip).toEqual([0, 0])
    const late = finishState(finish(M.end - 0.01))
    expect(feetFor(ARROW).x - late.feet.x).toBeGreaterThan(FIRE.shove * 0.9)
    expect(late.fx.skid.length).toBe(2)
    expect(late.fx.skid[0]!.x0 - late.fx.skid[0]!.x1).toBeGreaterThan(FIRE.shove * 0.9)
    const aim = lit.fx.beam!.aim
    expect(Math.abs(aim)).toBeLessThan(0.3)
  })

  it('ends the beam over a few frames, drops its arms and smokes at each hand', () => {
    expect(finishState(finish(M.end + 0.1)).fx.beam).not.toBeNull()
    expect(finishState(finish(M.end + FIRE.close + 0.01)).fx.beam).toBeNull()
    const after = finishState(finish(M.end + 1.2))
    expect(after.fx.smoke.length).toBe(2)
    expect(after.pose.hands[0][1]).toBeLessThan(26)
    expect(after.pose.hands[1][1]).toBeLessThan(26)
  })

  it('walks with a foot always on the ground and scuffs its shoes', () => {
    let steps = 0
    for (let f = 0; f <= LONG * FPS; f++) {
      const s = finishState(finish(M.walk + f / FPS))
      const lifted = s.pose.feet.filter((foot) => foot[1] > 0.05).length
      expect(lifted).toBeLessThan(2)
      for (const foot of s.pose.feet) expect(foot[1]).toBeLessThanOrEqual(WALK.lift + 1e-6)
      steps = Math.max(steps, s.fx.scuffs.length)
    }
    expect(steps).toBeGreaterThan(1)
    expect(stepsBy(far / SCALE)).toBeGreaterThan(1)
    expect(stepsBy(320)).toBe(6)
  })

  it('falls to its knees, breathes once, raises the fist and holds it', () => {
    const down = finishState(finish(KNEEL + LAST.down + 0.02)).pose
    expect(down.hip[1]).toBeLessThan(18)
    const mid = finishState(finish(KNEEL + LAST.down + LAST.breath / 2)).pose
    expect(mid.hip[1]).toBeGreaterThan(down.hip[1] + 2)
    const dip = finishState(finish(FIST + LAST.dip)).pose
    const high = finishState(finish(FIST + LAST.up + 0.05)).pose
    expect(dip.hip[1]).toBeLessThan(down.hip[1])
    expect(high.hands[1][1]).toBeGreaterThan(90)
    expect(high.grip[1]).toBe(1)
    const held = finishState(finish(PRESS - LAST.back - 0.02)).pose
    expect(Math.abs(held.hands[1][1] - high.hands[1][1])).toBeLessThan(4)
  })

  it('lands the fist on the button on the frame of the press, and stays there', () => {
    expect(finishState(finish(PRESS - 1 / FPS)).press).toBe(0)
    for (const t of [PRESS, PRESS + 0.5, PRESS + 3]) {
      const s = finishState(finish(t))
      const fist = toPage(s.pose, ...s.pose.hands[1])
      expect(Math.abs(fist.x - (BUTTON.x - BUTTON.w / 2 + SPOT.on))).toBeLessThan(1)
      expect(Math.abs(fist.y - BUTTON.y)).toBeLessThan(1.5)
      expect(fist.z).toBeGreaterThan(BUTTON.top)
      expect(fist.z).toBeLessThan(BUTTON.top + 8)
      expect(s.up).toBe(true)
      expect(s.pose.rise).toBeGreaterThan(0.5)
    }
    expect(finishState(finish(PRESS + 0.06)).press).toBe(1)
  })

  it('names each moment a sound belongs to once', () => {
    const seen: Record<string, number> = {}
    for (let f = -1; f <= (PRESS + 1) * FPS; f++) {
      for (const e of finishEvents(finish((f - 1) / FPS), finish(f / FPS))) seen[e.name] = (seen[e.name] ?? 0) + 1
    }
    expect(seen['finish-standup']).toBe(1)
    expect(seen['finish-charge']).toBe(1)
    expect(seen['finish-fire']).toBe(1)
    expect(seen['finish-beam-end']).toBe(1)
    expect(seen['finish-knees']).toBe(1)
    expect(seen['finish-fist']).toBe(1)
    expect(seen['finish-press']).toBe(1)
    expect(seen['finish-step']).toBe(stepsBy(far / SCALE))
    const pw: Record<string, number> = {}
    for (let f = 0; f <= 7 * FPS; f++) for (const e of finishEvents(power((f - 1) / FPS), power(f / FPS))) pw[e.name] = (pw[e.name] ?? 0) + 1
    expect(pw).toEqual({ 'finish-standup': 1, 'power-up-rise': 1, 'power-up-burst': 1, 'finish-liedown': 1 })
  })

  it('keeps the poses the pose sheet shows', () => {
    expect(POSES.power.feet[1][0] - POSES.power.feet[0][0]).toBeGreaterThan(50)
    expect(POSES.fire.feet[0][0]).toBeLessThan(-35)
    expect(Math.abs(POSES.fire.hands[0][0] - POSES.fire.hands[1][0])).toBeLessThan(4)
    expect(POSES.charge1.hip[1]).toBeLessThan(POSES.ready.hip[1] - 6)
  })
})

describe('the legs rule: the arrow has legs in the power-up and in the finish only', () => {
  const pw = { at: 1, end: 4.4 }
  const marks = { arms: 20 + SHOUT.arms, charge: 20 + SHOUT.beats[0], fire: 20 + SHOUT.fire, end: 20 + SHOUT.gone }

  it('has no legs, does not stand and is not drawn at any moment outside the two', () => {
    let lying = 0
    let standing = 0
    for (let f = -2 * FPS; f <= 30 * FPS; f++) {
      const time = f / FPS
      const s = finishState({ time, arrow: ARROW, power: pw, marks })
      const inPower = time >= pw.at && time < pw.end + POWER.burst + LIEDOWN
      const inFinish = time >= marks.arms
      if (inPower || inFinish) {
        standing++
        expect(s.up).toBe(true)
      } else {
        lying++
        expect(s.up).toBe(false)
        expect(s.pose.legs).toBe(0)
        expect(s.pose.arms).toBe(0)
        expect(s.pose.rise).toBe(0)
        expect(s.fx.aura).toBe(0)
      }
      // Legs out always means the figure is the one drawn, never the ordinary arrow.
      if (s.pose.legs > 0) expect(s.up).toBe(true)
    }
    expect(lying).toBeGreaterThan(900)
    expect(standing).toBeGreaterThan(700)
  })

  it('never stands when the fight gives neither a power-up nor the arms mark', () => {
    for (let f = -60; f <= 40 * FPS; f += 7) {
      const s = finishState({ time: f / FPS, arrow: ARROW, marks: { charge: 1, fire: 2, end: 3, walk: 4, kneel: 5, fist: 6, press: 7 }, button: BUTTON })
      expect(s.up).toBe(false)
      expect(s.pose.legs).toBe(0)
    }
  })

  it('draws the legs back in before the power-up hands the arrow back', () => {
    const last = finishState({ time: pw.end + POWER.burst + LIEDOWN - 1 / FPS, arrow: ARROW, power: pw })
    expect(last.up).toBe(true)
    expect(last.pose.legs).toBeLessThan(0.02)
    expect(last.pose.rise).toBeLessThan(0.02)
  })

  it('is reached from nowhere but the finish: no other file of the site takes the standing figure in', () => {
    const src = path.resolve(__dirname, '..', 'src')
    const own = [path.join(src, 'cursor', 'stand'), path.join(src, 'boss', 'finish')]
    const takers: string[] = []
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, e.name)
        if (e.isDirectory()) walk(file)
        else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && !own.some((o) => file.startsWith(o + path.sep))) {
          const text = fs.readFileSync(file, 'utf8')
          for (const m of text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
            const to = path.resolve(path.dirname(file), m[1]!)
            if (m[1]!.startsWith('.') && (to === own[0] || to.startsWith(own[0] + path.sep))) takers.push(path.relative(src, file))
          }
        }
      }
    }
    walk(src)
    expect(takers).toEqual([])
  })
})

describe('the power-up fitted to a window', () => {
  // The fight's window: 3.15 s from the first frame of the power-up to the turret's lock.
  const pw = { at: 34.68, until: 37.83 }
  const inPose = (t: number): boolean => {
    const h = finishState({ time: t, arrow: ARROW, power: pw }).pose.hands
    return [0, 1].every((n) => [0, 1, 2].every((a) => Math.abs(h[n]![a]! - POSES.power.hands[n]![a]!) < 0.5))
  }

  it('holds both fists in the sheet\'s pose for a second at least and lies again by the end of the window', () => {
    let held = 0
    for (let f = 0; f <= 4 * FPS; f++) if (inPose(pw.at + f / FPS)) held++
    expect(held / FPS).toBeGreaterThanOrEqual(1)
    expect(finishState({ time: pw.until - 1 / FPS, arrow: ARROW, power: pw }).up).toBe(true)
    const after = finishState({ time: pw.until, arrow: ARROW, power: pw })
    expect(after.up).toBe(false)
    expect(after.pose.legs).toBe(0)
    const plan = powerPlan(pw)
    expect(plan.over).toBeCloseTo(3.15, 6)
    expect(plan.end - POWER.up[1] * plan.quick).toBeGreaterThanOrEqual(1)
    expect(plan.quick).toBeGreaterThan(0.6)
  })

  it('plays as written when the window is long enough, and when only `end` is given', () => {
    expect(powerPlan({ at: 0, until: 6 }).quick).toBe(1)
    const plain = powerPlan({ at: 1, end: 4.4 })
    expect(plain.quick).toBe(1)
    expect(plain.end).toBeCloseTo(3.4, 9)
    expect(plain.over).toBeCloseTo(3.4 + POWER.burst + LIEDOWN, 9)
    expect(powerPlan({ at: 1 }).end).toBeCloseTo(POWER.hold, 9)
  })

  it('does not pop, and names its four sounds once, inside the window', () => {
    let worst = 0
    let before = finishState({ time: pw.at, arrow: ARROW, power: pw })
    const seen: Record<string, number> = {}
    for (let f = 1; f <= 3.15 * FPS - 1; f++) {
      const a = { time: pw.at + (f - 1) / FPS, arrow: ARROW, power: pw }
      const b = { time: pw.at + f / FPS, arrow: ARROW, power: pw }
      const now = finishState(b)
      worst = Math.max(worst, step(before.pose, now.pose))
      before = now
      for (const e of finishEvents(a, b)) seen[e.name] = (seen[e.name] ?? 0) + 1
    }
    expect(worst).toBeLessThan(28)
    expect(seen).toEqual({ 'power-up-rise': 1, 'power-up-burst': 1, 'finish-liedown': 1 })
    expect(finishEvents({ time: pw.at - 1 / FPS, arrow: ARROW, power: pw }, { time: pw.at, arrow: ARROW, power: pw }).map((e) => e.name)).toEqual(['finish-standup'])
  })
})
