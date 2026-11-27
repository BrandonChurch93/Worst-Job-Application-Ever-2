import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { careersOpening, FLIP_SECONDS, makePage } from '../src/pages/marketing'
import { careersLayout } from '../src/pages/marketing/layout'
import { CUES, OPENING, planOf, PRESS_AT, scrollAt, TURN_AT, type Setting } from '../src/pages/marketing/script'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const steps = (seconds: number): number => Math.round(seconds * stepHz)
const unit = config.film.units.find((u) => u.id === 'marketing')!
const { height } = careersLayout()

function boxOf(id: string): number[] {
  let found: number[] | null = null
  const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
    if (n.id === id) found = n.box
    for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
  }
  walk(careersLayout().layout)
  return found!
}

interface Pose { t: number; x: number; y: number; z: number; scroll: number; taken: boolean; air: boolean }

function run(setting: Setting): { stage: Stage; poses: Pose[] } {
  const stage = new Stage({ mode: 'film', flow: filmFlow('marketing'), pages: { ...pages, marketing: () => makePage(setting) }, driver: new ScriptDriver(), film: filmOptions('marketing') })
  const poses: Pose[] = []
  for (let i = 0; i < steps(unit.seconds); i++) {
    stage.advance(1)
    if (stage.page.id !== 'marketing') break
    const p = stage.cursor.pose()
    poses.push({ t: (i + 1) / stepHz, x: p.x, y: p.y, z: p.z, scroll: stage.page.scroll(), taken: stage.cursor.taken, air: stage.cursor.inAir })
  }
  return { stage, poses }
}

describe('the opening of the film on the careers page', () => {
  it('has every number in one place, and both settings take exactly the 18 seconds to the press of Apply', () => {
    expect(OPENING.total).toBe(18)
    expect(unit.seconds).toBe(OPENING.total + OPENING.after)
    expect(OPENING.line).toBeCloseTo(22 / 1.6, 6)
    expect(OPENING.A.scrollFrom).toBe(OPENING.line)
    expect(OPENING.B.scrollFrom).toBeLessThanOrEqual(3)
    for (const k of ['A', 'B'] as const) {
      const o = OPENING[k]
      expect(o.stops.length).toBe(OPENING.places.length)
      const { plan } = careersOpening(k)
      const last = plan.legs[plan.legs.length - 1]!
      expect(last.t1).toBeCloseTo(OPENING.total - o.stops[o.stops.length - 1]!.hold, 9)
      expect(plan.legs[0]!.t0).toBe(o.scrollFrom)
      expect(scrollAt(plan, o.scrollFrom)).toBe(0)
      expect(scrollAt(plan, last.t1)).toBe(height - 1080)
      expect(scrollAt(plan, unit.seconds)).toBe(height - 1080)
      let before = 0
      for (let i = 1; i <= steps(unit.seconds); i++) {
        const now = scrollAt(plan, i / stepHz)
        expect(now, `${k} at ${i / stepHz}`).toBeGreaterThanOrEqual(before - 1e-9)
        expect((now - before) * stepHz, `${k} at ${i / stepHz}`).toBeLessThanOrEqual(plan.speed * 1.5 + 1e-6)
        before = now
      }
    }
  })

  it('in setting B slows almost to a stop at each of the five places, and goes at one speed between them', () => {
    const { plan, marks } = careersOpening('B')
    expect(plan.speed).toBeGreaterThan(450)
    expect(plan.speed).toBeLessThan(700)
    plan.holds.slice(0, 4).forEach((h, k) => {
      const o = OPENING.B.stops[k]!
      expect(h.t1 - h.t0).toBeCloseTo(o.hold, 9)
      expect((h.to - h.from) / (h.t1 - h.t0)).toBeCloseTo(plan.speed * o.slow, 6)
      expect((h.from + h.to) / 2).toBeCloseTo(marks.stops[k]!.scroll, 6)
      const seen = marks.stops[k]!.y - (h.from + h.to) / 2
      expect(seen, `place ${k}`).toBeGreaterThan(200)
      expect(seen, `place ${k}`).toBeLessThan(900)
    })
    for (const l of plan.legs) {
      const mid = (l.t0 + l.t1) / 2
      expect((scrollAt(plan, mid + 0.01) - scrollAt(plan, mid - 0.01)) / 0.02, `leg from ${l.t0}`).toBeCloseTo(plan.speed, 3)
      expect(l.t1 - l.t0).toBeGreaterThanOrEqual(2 * OPENING.ramp)
    }
    expect(planOf('B', marks.stops.map((p) => p.scroll)).speed).toBe(plan.speed)
  })

  for (const k of ['A', 'B'] as const) {
    const { stage, poses } = run(k)
    const at = (t: number): Pose => poses[Math.min(poses.length - 1, steps(t) - 1)]!
    const when = (name: string): number[] => stage.events.filter((e) => e.name === name).map((e) => e.step / stepHz)

    it(`setting ${k}: the arrow stays on the screen, turns one card over at the salary's fine print and lets it turn back`, () => {
      for (const p of poses) {
        if (p.taken || p.air) continue
        expect(p.x, `${p.t}`).toBeGreaterThan(20)
        expect(p.x, `${p.t}`).toBeLessThan(1900)
        expect(p.y - p.scroll, `${p.t}`).toBeGreaterThan(k === 'B' ? 40 : -60)
        expect(p.y - p.scroll, `${p.t}`).toBeLessThan(1080)
      }
      expect(when('card-flip').length).toBe(1)
      expect(when('card-flip-back').length).toBe(1)
      const { plan } = careersOpening(k)
      const hold = plan.holds[0]!
      expect(when('card-flip')[0]!).toBeGreaterThan(hold.t0 - 0.6)
      expect(when('card-flip')[0]!).toBeLessThan(hold.t0 + 0.3)
      expect(when('card-flip-back')[0]!).toBeGreaterThan(hold.t1)
      if (k === 'B') {
        expect(when('card-flip-back')[0]! - when('card-flip')[0]! - FLIP_SECONDS).toBeGreaterThanOrEqual(1)
        const beat = config.film.beats.find((b) => b.id === 'marketing.perks')!
        expect(when('card-flip')[0]!).toBeGreaterThan(beat.from)
        expect(when('card-flip')[0]!).toBeLessThan(beat.to)
      }
    })

    it(`setting ${k}: the arrow stands by the main button for the hold, and presses the last button at 18 s before the page turns`, () => {
      const hero = boxOf('hero-cta-cap')
      const from = OPENING[k].scrollFrom
      for (const t of [2, 2.5, from - 0.05]) {
        expect(at(t).scroll).toBe(0)
        expect(at(t).x).toBeGreaterThan(hero[0]! + hero[2]!)
        expect(at(t).x).toBeLessThan(hero[0]! + hero[2]! + 140)
        expect(Math.abs(at(t).y - (hero[1]! + hero[3]! / 2))).toBeLessThan(30)
      }
      const cap = boxOf('final-cta-cap')
      expect(CUES.map((c) => c.react).filter(Boolean)).toEqual(['anticipate', 'jump', 'anticipate', 'startle'])
      expect(when('button-press').length).toBe(1)
      const press = when('button-press')[0]!
      expect(Math.abs(press - OPENING.total)).toBeLessThanOrEqual(0.03)
      expect(when('page-turn')).toEqual([TURN_AT])
      const p = at(press + 0.05)
      expect(p.scroll).toBe(height - 1080)
      expect(p.x).toBeGreaterThan(cap[0]!)
      expect(p.x).toBeLessThan(cap[0]! + cap[2]!)
      expect(p.y).toBeGreaterThan(cap[1]!)
      expect(p.y).toBeLessThan(cap[1]! + cap[3]!)
      const air = poses.filter((q) => q.t > PRESS_AT && q.t < press)
      expect(Math.max(...air.map((q) => q.z))).toBeGreaterThan(60)
    })
  }
})
