import { describe, expect, it } from 'vitest'
import { chooseEmitters, lampIntensity, EMITTER_UNIT_PX } from '../src/post/emitters'
import { look } from '../src/post/look'
import type { Emitter } from '../src/real/types'

const bolt = (x: number, y: number, power = 1, shadow = true): Emitter => ({ x, y, z: 40, colour: [1, 0.42, 0.1], power, reach: 260, shadow })

describe('the choice of emitters', () => {
  it('keeps every emitter while there is room, the ones that throw a shadow first', () => {
    const out = chooseEmitters([bolt(0, 0, 0.5, false), bolt(300, 0, 1, true), bolt(600, 0, 0.2, false)], 6, 2)
    expect(out.length).toBe(3)
    expect(out[0]!.shadow).toBe(true)
    expect(out[0]!.x).toBe(300)
    expect(out.slice(1).every((l) => !l.shadow)).toBe(true)
    expect(out[1]!.power).toBeGreaterThan(out[2]!.power)
  })

  it('never gives more lamps than the pool or more shadows than allowed, whatever the count', () => {
    for (const n of [0, 1, 5, 6, 7, 20, 60]) {
      const list = Array.from({ length: n }, (_, i) => bolt((i % 10) * 90, Math.floor(i / 10) * 70, 0.3 + (i % 4) * 0.3, i % 2 === 0))
      const out = chooseEmitters(list, look.emitters.pool, look.emitters.shadows)
      expect(out.length).toBe(Math.min(n, look.emitters.pool))
      expect(out.filter((l) => l.shadow).length).toBeLessThanOrEqual(look.emitters.shadows)
      const total = list.reduce((t, e) => t + e.power, 0)
      expect(out.reduce((t, l) => t + l.power, 0)).toBeCloseTo(total, 9)
    }
  })

  it('joins the nearest first and puts the joined lamp between them, nearer the stronger', () => {
    const out = chooseEmitters([bolt(0, 0, 1), bolt(10, 0, 3), bolt(500, 0, 1)], 2, 2)
    expect(out.length).toBe(2)
    const joined = out.find((l) => l.power === 4)!
    expect(joined.x).toBeCloseTo(7.5, 9)
    expect(out.find((l) => l.power === 1)!.x).toBe(500)
  })

  it('mixes the colours of joined lamps by their power', () => {
    const a: Emitter = { x: 0, y: 0, z: 0, colour: [1, 0, 0], power: 1, reach: 100 }
    const b: Emitter = { x: 1, y: 0, z: 0, colour: [0, 0, 1], power: 3, reach: 200 }
    const [l] = chooseEmitters([a, b], 1, 0)
    expect(l!.colour).toEqual([0.25, 0, 0.75])
    expect(l!.reach).toBe(200)
    expect(l!.shadow).toBe(false)
  })

  it('drops emitters that give no light, and gives nothing with an empty pool', () => {
    expect(chooseEmitters([bolt(0, 0, 0), { ...bolt(5, 5), reach: 0 }], 6, 2)).toEqual([])
    expect(chooseEmitters([bolt(0, 0), bolt(9, 9)], 0, 0)).toEqual([])
  })

  it('gives the same answer every time and leaves its input alone', () => {
    const list = Array.from({ length: 14 }, (_, i) => bolt(i * 37, (i * 53) % 200, 0.2 + (i % 5) * 0.2, i % 3 === 0))
    const copy = JSON.stringify(list)
    const first = JSON.stringify(chooseEmitters(list, 6, 2))
    expect(JSON.stringify(chooseEmitters(list, 6, 2))).toBe(first)
    expect(JSON.stringify(list)).toBe(copy)
  })

  it('lights a white surface at the unit distance with the power of the lamp', () => {
    const body = 20
    const fall = 1 / (EMITTER_UNIT_PX * EMITTER_UNIT_PX + body * body)
    expect((lampIntensity(0.7, body) * fall) / Math.PI).toBeCloseTo(0.7, 12)
  })
})
