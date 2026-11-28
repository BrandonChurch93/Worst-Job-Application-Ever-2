import { afterEach, describe, expect, it } from 'vitest'
import { powerPlan } from '../src/boss/finish/acting'
import { GUARD, LINE7, RAISE, RISE_LIGHT, SOLID } from '../src/boss/tune'
import { setFinish, setView } from '../src/boss/viewof'
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
})
