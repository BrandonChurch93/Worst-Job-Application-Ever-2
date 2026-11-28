import { afterEach, describe, expect, it } from 'vitest'
import { powerPlan } from '../src/boss/finish/acting'
import { GUARD, LINE7, RAISE, RISE_LIGHT, SOLID } from '../src/boss/tune'
import { HOME, UNFOLD } from '../src/boss/plan'
import { ringAt, ringReaches } from '../src/boss/rise'
import { LEAD, setFinish, setView, viewOf } from '../src/boss/viewof'
import type { BossView } from '../src/boss/view'
import { riseLight } from '../src/pages/step4/real/rise'

// What the gold of the power-up lights (the Builder's ruling of 10:35Z, points 2 and 3), as numbers; the pictures are in the notes.
const RAISED = LINE7.rise - LINE7.getup - RAISE.early
const FISTS = LINE7.power - LINE7.getup
const FULL = LINE7.part2 - LINE7.getup
const power = { at: 0, until: RAISED, fists: FISTS, full: FULL }
const BURST = powerPlan(power).end
const AT = { x: 680, y: 500 }
const at = (time: number) => {
  setFinish({ time, arrow: AT, power })
  return riseLight()
}

describe('the light of the power-up', () => {
  afterEach(() => {
    setFinish(null)
    setView(null)
  })

  it('lights nothing until the fists are up and the gold starts to build', () => {
    for (const t of [0.05, FISTS * 0.5, FISTS - 0.02]) {
      const r = at(t)
      expect(r === null || (r.level === 0 && r.lamps.length === 0 && r.ring === null), `at ${t}`).toBe(true)
    }
  })

  it('grows with the flame and is all there, but for the flicker, from the end of the line to the burst', () => {
    let last = -1
    for (let t = FISTS + 0.05; t < FULL - 0.3; t += 0.1) {
      const r = at(t)!
      expect(r.level, `at ${t}`).toBeGreaterThan(last - 0.16)
      last = r.level
    }
    for (let t = FULL; t < BURST; t += 0.05) {
      const r = at(t)!
      expect(r.level, `at ${t}`).toBeGreaterThanOrEqual(0.7)
      expect(r.level, `at ${t}`).toBeLessThanOrEqual(1)
    }
  })

  it('lights the figure from its own flames: under each fist and low before the feet, in step with the flame, with no shadow', () => {
    const r = at(FULL + 0.1)!
    expect(r.own.length).toBe(3)
    for (const [n, l] of r.own.entries()) {
      expect(l.shadow).toBeUndefined()
      expect(l.power).toBeCloseTo((n < 2 ? RISE_LIGHT.fist.power : RISE_LIGHT.foot.power) * r.level, 9)
      expect(l.z).toBeGreaterThanOrEqual(r.ground + 6)
    }
    expect(r.own[0]!.x).toBeLessThan(r.x)
    expect(r.own[1]!.x).toBeGreaterThan(r.x)
    expect(r.own[2]!.x).toBe(r.x)
    expect(r.own[2]!.z).toBeLessThan(Math.min(r.own[0]!.z, r.own[1]!.z))
    const early = at(FISTS + 0.05)
    expect(early === null || early.own.every((l) => l.power < r.own[0]!.power * 0.5)).toBe(true)
    expect(RISE_LIGHT.near.hole).toBeGreaterThan(RISE_LIGHT.ring.from)
    expect(RISE_LIGHT.near.high).toBeGreaterThan(0)
  })

  it('lifts the near pane and, with the boss there, the shield, by lights that throw no shadow', () => {
    const alone = at(FULL + 0.1)!
    expect(alone.lamps.length).toBe(1)
    expect(alone.lamps[0]!.x).toBe(SOLID.panes[0][2] + RISE_LIGHT.lamp.off)
    setView({ boss: { x: 960, y: 548 } } as BossView)
    const r = at(FULL + 0.1)!
    expect(r.lamps.length).toBe(2)
    for (const l of r.lamps) {
      expect(l.shadow).toBeUndefined()
      expect(l.power).toBeCloseTo(RISE_LIGHT.lamp.power * r.level, 9)
    }
    const far = Math.hypot(960 - r.x, 548 - r.y)
    expect(Math.hypot(960 - r.lamps[1]!.x, 548 - r.lamps[1]!.y)).toBeCloseTo(GUARD.radius + RISE_LIGHT.lamp.off, 6)
    expect(far).toBeGreaterThan(GUARD.radius + RISE_LIGHT.lamp.off)
  })

  it('sends one ring out over the floor at the burst, to its reach in its time, and the glass flashes as it passes', () => {
    expect(at(BURST - 0.01)!.ring).toBeNull()
    setView({ boss: { x: 960, y: 548 } } as BossView)
    let radius = 0
    let flash = 0
    let when = -1
    for (let t = BURST; t < BURST + RISE_LIGHT.ring.seconds; t += 1 / 120) {
      const r = at(t)!
      expect(r.ring, `at ${t}`).not.toBeNull()
      expect(r.ring!.radius).toBeGreaterThanOrEqual(radius)
      radius = r.ring!.radius
      const f = r.lamps.find((l) => l.reach === RISE_LIGHT.flash.reach)?.power ?? 0
      if (f > flash) {
        flash = f
        when = radius
      }
    }
    expect(at(BURST)!.ring!.radius).toBeCloseTo(RISE_LIGHT.ring.from, 6)
    expect(radius).toBeGreaterThan(RISE_LIGHT.ring.reach * 0.98)
    expect(flash).toBeGreaterThan(RISE_LIGHT.flash.power * 0.8)
    const r = at(BURST)!
    expect(Math.abs(when - (Math.hypot(960 - r.x, 548 - r.y) - GUARD.radius))).toBeLessThan(40)
    const after = at(BURST + RISE_LIGHT.ring.seconds + 0.01)
    expect(after === null || after.ring === null).toBe(true)
  })

  it('tells the look that the glass is struck when the ring is at the shield, and not before', () => {
    const far = Math.hypot(HOME.x - AT.x, HOME.y - AT.y) - GUARD.radius
    const pass = ringReaches(far)!
    expect(ringAt(pass)).toBeCloseTo(far, 6)
    expect(pass).toBeGreaterThan(0)
    expect(pass).toBeLessThan(RISE_LIGHT.ring.seconds)
    const ask = (time: number) => viewOf({ clock: time + LEAD, unfold: UNFOLD.end, fight: null, base: -1, fell: -1, pressed: false, arrow: AT, burst: { at: 20, x: AT.x, y: AT.y } })!
    expect(ask(20 + pass - 0.01).boss.shield.glancedAt).toBeNull()
    expect(ask(20 + pass + 0.01).boss.shield.glancedAt).toBeCloseTo(20 + pass, 6)
    expect(viewOf({ clock: 25 + LEAD, unfold: UNFOLD.end, fight: null, base: -1, fell: -1, pressed: false, arrow: AT })!.boss.shield.glancedAt).toBeNull()
  })
})
