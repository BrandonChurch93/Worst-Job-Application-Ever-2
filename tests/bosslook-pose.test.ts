import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { BossView } from '../src/boss/view'
import { EVENTS } from '../src/boss/look1/events'
import { DEFAULTS, FORM, K, LEFT, PRESS, TURRET, bigMuzzleOf, buttonAt, muzzleOf, poseOf, wordAt } from '../src/boss/look1/pose'
import { FALLEN } from '../src/boss/plan'

const gun = (): { aim: number; tell: number; firedAt: number | null } => ({ aim: Math.PI, tell: 0, firedAt: null })
const view = (more: Partial<BossView> = {}, boss: Partial<BossView['boss']> & { lockedAt?: number | null } = {}): BossView => {
  const base = {
    time: 10, phase: 'fight',
    boss: { x: 960, y: 548, vx: 0, vy: 0, heading: Math.PI, walked: 0, form: 1, turret: 0, locked: false, health: 1, stage: 0, shield: { glancedAt: null, half: 0.5 }, guns: [gun(), gun()], big: null, weak: null, healedAt: null, hitAt: null, beaten: 0 },
    bullets: [], darts: [], hits: [], corners: [], arrow: { x: 400, y: 800, flat: 0, flatAt: null }, breaks: []
  }
  return { ...base, ...more, boss: { ...base.boss, ...boss } } as unknown as BossView
}
const out = { turret: 1, locked: true }

describe('look 1 of the boss: the pose is a pure function of the view', () => {
  it('gives the same pose for the same view, however often it is asked', () => {
    const v = view({ time: 12.34 }, { ...out, x: 800, y: 500, heading: 2.2, walked: 333, stage: 2, hitAt: 12.2, big: { tell: 0.6, aim: 2.2, firedAt: null, x0: 700, y0: 600, x1: 0, y1: 900, width: 46 } })
    const a = JSON.stringify(poseOf(v))
    for (let i = 0; i < 5; i++) expect(JSON.stringify(poseOf(v))).toBe(a)
    expect(JSON.stringify(poseOf(JSON.parse(JSON.stringify(v))))).toBe(a)
  })

  it('reads no clock and no dice anywhere in its folder, and has no forbidden marks', () => {
    const dir = path.join(__dirname, '..', 'src', 'boss', 'look1')
    for (const f of fs.readdirSync(dir)) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      expect(text, f).not.toMatch(/Math\.random|Date\.now|performance\.now|new Date\(/)
      expect(text, f).not.toMatch(/\u2014|!['"`]/)
    }
  })
})

describe('look 1 of the boss: the walk', () => {
  it('keeps every planted foot where it stands while the body moves, along any line', () => {
    for (const [dx, dy] of [[-1, 0], [0.6, 0.8], [-0.7, 0.71], [0.2, -0.98]] as const) {
      let last = poseOf(view({}, out)).legs
      let steps = 0
      for (let s = 1; s <= 1200; s++) {
        const d = s * 0.25
        const legs = poseOf(view({}, { ...out, x: 960 + dx * d, y: 548 + dy * d, walked: d })).legs
        legs.forEach((leg, i) => {
          const before = last[i]!
          if (leg.lift === 0 && before.lift === 0) {
            expect(Math.hypot(leg.planted[0] - before.planted[0], leg.planted[1] - before.planted[1])).toBeLessThan(1e-6)
          } else if (leg.lift > 0 && before.lift === 0) steps++
        })
        last = legs
      }
      expect(steps).toBeGreaterThan(8)
    }
  })

  it('steps in pairs on a straight line: two feet always stand, and all four stand at rest', () => {
    expect(poseOf(view({}, out)).legs.every((l) => l.lift === 0)).toBe(true)
    for (const [dx, dy] of [[-1, 0], [0, 1], [1, 0]] as const) {
      for (let s = 0; s <= 2400; s++) {
        const d = s * 0.25
        const legs = poseOf(view({}, { ...out, x: 960 + dx * d, y: 548 + dy * d, walked: d })).legs
        expect(legs.filter((l) => l.lift === 0).length).toBeGreaterThanOrEqual(2)
        expect(legs[0]!.lift > 0 && legs[1]!.lift > 0).toBe(false)
      }
    }
  })

  it('never asks a leg to reach further than it is long, walking and turning', () => {
    let worst = 0
    let air = 0
    let all = 0
    for (let s = 0; s <= 4800; s++) {
      const d = s * 0.25
      const p = poseOf(view({}, { ...out, x: 960 - 0.8 * d, y: 548 + 0.6 * d, walked: d, heading: Math.PI + s * 0.0014 }))
      for (const leg of p.legs) worst = Math.max(worst, Math.hypot(leg.foot[0] - leg.hip[0], leg.foot[1] - leg.hip[1], leg.foot[2] + 34 - leg.hip[2]))
      all++
      if (p.legs.every((l) => l.lift > 0)) air++
    }
    expect(worst).toBeLessThan(410)
    expect(air / all).toBeLessThan(0.1)
  })
})

describe('look 1 of the boss: the word, the turret, the places of the muzzles', () => {
  it('leaves the word in the middle of the button, level, through the whole forming', () => {
    for (let f = 0; f <= 1.0001; f += 0.02) {
      const u = Math.min(1, Math.max(0, (f - 0.06) / 0.28))
      const e = u * u * (3 - 2 * u)
      const x = 960
      const y = 960 + (548 - 960) * e
      const w = wordAt(view({ time: f * 2.9, phase: 'form' }, { form: f, x, y }))
      expect(w.show).toBe(true)
      expect(w.rot).toBe(0)
      expect(Math.abs(w.x - x)).toBeLessThan(0.01)
      expect(Math.abs(w.y - y)).toBeLessThan(0.01)
    }
  })

  it('turns the word with the button and hides it only under the cannon', () => {
    expect(wordAt(view({}, { heading: Math.PI + 0.5 })).rot).toBeCloseTo(0.5, 9)
    expect(wordAt(view({}, { turret: 0.4 })).show).toBe(true)
    expect(wordAt(view({}, out)).show).toBe(false)
    expect(wordAt(view({ phase: 'beaten' }, { ...out, beaten: 1 })).show).toBe(true)
    const w = wordAt(view({ phase: 'beaten' }, { ...out, beaten: 1 }))
    expect(Math.hypot(w.x - LEFT.x, w.y - LEFT.y)).toBeLessThan(0.01)
  })

  it('brings the cannon out only after the hatch has begun to open, and locks it at 0.94', () => {
    expect(poseOf(view({ phase: 'form' }, { form: 0.9 })).cannon.show).toBe(false)
    expect(poseOf(view({ phase: 'turret' }, { turret: 0 })).cannon.show).toBe(false)
    expect(poseOf(view({ phase: 'turret' }, { turret: TURRET.rise[0] - 0.01 })).cannon.show).toBe(false)
    expect(poseOf(view({ phase: 'turret' }, { turret: 0.3 })).cannon.show).toBe(true)
    expect(poseOf(view({ phase: 'turret' }, { turret: 0.9 })).lockAge).toBeLessThan(0)
    expect(poseOf(view({ phase: 'turret' }, { turret: 0.96 })).lockAge).toBeCloseTo(0.032, 6)
    const still = poseOf(view({ time: 4.65 + 0.05 }, { ...out, lockedAt: 4.65 }))
    expect(still.lockAge).toBeCloseTo(0.146, 6)
    expect(poseOf(view({ time: 4.7 }, out)).lockAge).toBeGreaterThan(1)
    expect(poseOf(view({ time: 4.7 }, out)).cannon.elev).toBe(0)
  })

  it('puts the muzzles where the fight was told they are', () => {
    const v = view({}, out)
    const a = muzzleOf(v, 0)
    const b = muzzleOf(v, 1)
    expect(a.x).toBeCloseTo(b.x, 6)
    expect(Math.abs(a.y - 548)).toBeCloseTo(79, 0)
    expect(a.y - 548).toBeCloseTo(548 - b.y, 6)
    expect(Math.hypot(a.x - (960 - 7 * K), 0)).toBeCloseTo(75, 0)
    const big = bigMuzzleOf(v)
    expect(960 - big.x).toBeCloseTo(274, 0)
    expect(big.y).toBeCloseTo(548, 6)
    const turned = bigMuzzleOf(view({}, { ...out, heading: 0.5 }))
    expect(Math.hypot(turned.x - 960, turned.y - 548)).toBeCloseTo(274, 0)
    expect(Math.atan2(turned.y - 548, turned.x - 960)).toBeCloseTo(0.5, 6)
  })

  it('shows the stages of damage in order and names every event of the brief', () => {
    expect(poseOf(view({}, out)).damage).toBe(0)
    expect(poseOf(view({}, { ...out, stage: 1 })).damage).toBe(1)
    expect(poseOf(view({}, { ...out, stage: 2 })).damage).toBe(2)
    expect(poseOf(view({ phase: 'beaten' }, { ...out, stage: 2, beaten: 0.5 })).damage).toBe(3)
    for (const name of ['break-out', 'turret-rise', 'turret-lock', 'bullet-fire', 'shield-glance', 'boss-heal', 'big-tell', 'big-fire', 'turret-off']) expect(EVENTS, name).toHaveProperty(name)
    expect(EVENTS['break-out'].at).toBe(FORM.launch)
    expect(DEFAULTS.pit).toBe(false)
  })
})

describe('look 1: the finishing blast', () => {
  it('leaves the parts where they are until gone moves, then lets them go one by one and brings the button down', () => {
    const lying = { turret: 1, locked: true, stage: 2 as const, health: 0, beaten: 1 }
    const before = poseOf(view({ phase: 'beaten' }, lying))
    expect(before.gone).toBe(0)
    expect(before.away.hull).toBe(0)
    const mid = poseOf(view({ phase: 'beaten' }, { ...lying, gone: 0.5 }))
    expect(mid.away.shield).toBeGreaterThan(0.5)
    expect(mid.away.legs[3]).toBeGreaterThan(0)
    expect(mid.away.legs[3]).toBeLessThan(mid.away.legs[0])
    expect(mid.away.plates[0]).toBeGreaterThan(mid.away.plates[6]!)
    const end = poseOf(view({ phase: 'beaten' }, { ...lying, gone: 1 }))
    expect(end.away.hull).toBe(1)
    expect(end.away.plates.every((k) => k === 1)).toBe(true)
    expect(end.left).toBe(1)
    expect(end.body.z + end.button.z).toBeCloseTo(0, 5)
    expect(Math.hypot(end.blow[0], end.blow[1])).toBeCloseTo(1, 5)
  })

  it('throws the beaten boss to where the fight lets the button lie, level, and keeps the button there', () => {
    expect({ x: LEFT.x, y: LEFT.y }).toEqual({ x: FALLEN.x, y: FALLEN.y })
    const lying = { turret: 1, locked: true, stage: 2 as const, health: 0, beaten: 1, x: 700, y: 500, heading: 2.2 }
    const p = poseOf(view({ phase: 'beaten' }, lying))
    expect(p.x + 960).toBeCloseTo(LEFT.x, 5)
    expect(540 - p.y).toBeCloseTo(LEFT.y, 5)
    const at = buttonAt(view({ phase: 'beaten' }, { ...lying, gone: 1 }))
    expect(at.x).toBeCloseTo(LEFT.x, 5)
    expect(at.y).toBeCloseTo(LEFT.y, 5)
    expect(Math.sin(at.rot)).toBeCloseTo(0, 5)
    expect(Math.cos(at.rot)).toBeCloseTo(1, 5)
  })

  it('sinks the button under the fist in 0.07 s and has it back by 0.45 s', () => {
    const lying = { turret: 1, locked: true, stage: 2 as const, health: 0, beaten: 1, gone: 1 }
    const at = (age: number): ReturnType<typeof buttonAt> => buttonAt(view({ phase: 'beaten', time: 60 + age }, { ...lying, pressedAt: 60 }))
    expect(buttonAt(view({ phase: 'beaten', time: 59.9 }, { ...lying, pressedAt: null })).press).toBe(0)
    expect(at(0).press).toBe(0)
    expect(at(PRESS.down).press).toBeCloseTo(1, 5)
    expect(at(PRESS.down).top).toBeLessThan(at(0).top)
    expect(at(PRESS.down).w).toBeLessThan(at(0).w)
    expect(at(PRESS.back).press).toBeCloseTo(0, 5)
    expect(at(2).press).toBeCloseTo(0, 5)
    expect(at(2).top).toBeCloseTo(at(0).top, 5)
    for (const name of ['boss-fall', 'finish-fire', 'boss-gone', 'button-down']) expect(EVENTS, name).toHaveProperty(name)
  })
})
