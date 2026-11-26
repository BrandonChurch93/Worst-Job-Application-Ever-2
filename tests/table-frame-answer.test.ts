import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { parts } from '../src/table/real/frame'
import { ANSWER, dipOf, flashOf } from '../src/table/real/frame/loader'
import { breathOf } from '../src/table/real/frame/mats'
import { isAnchor, zoneOf } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
const ctxOf = (extra: Shape[], time = 0): RealContext => {
  const all = [...list.filter((s) => !extra.some((e) => e.id === s.id)), ...extra]
  return { page: 'step3', list: all, byId: new Map(all.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => {} }
}
const anchorOf = (zone: string): Shape => list.find((s) => isAnchor(s) && s.part === 'loader' && zoneOf(s).id === zone)!
const struck = (id: string, t: number): Shape => ({ ...list.find((s) => s.id === id)!, v: [t] })
const metalOf = (o: THREE.Object3D): THREE.Mesh => {
  let out: THREE.Mesh | null = null
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && c.name.startsWith('loader.metal.')) out = c as THREE.Mesh
  })
  return out!
}

describe('the port answers a contact', () => {
  test('the ring is down for two frames, springs back and is at rest inside a third of a second', () => {
    expect(dipOf(0)).toBe(1)
    expect(dipOf(1 / 60)).toBe(1)
    expect(dipOf(3 / 60)).toBeLessThan(0.6)
    let low = 0
    for (let f = 2; f < 20; f++) low = Math.min(low, dipOf(f / 60))
    expect(low).toBeLessThan(-0.1)
    expect(dipOf(ANSWER.over)).toBe(0)
    expect(dipOf(9)).toBe(0)
    expect(Math.abs(dipOf(ANSWER.over - 1 / 60))).toBeLessThan(0.02)
  })

  test('the flash is full on the contact frame and gone when the ring is at rest', () => {
    expect(flashOf(0)).toBe(1)
    expect(flashOf(2 / 60)).toBeGreaterThan(0.5)
    expect(flashOf(6 / 60)).toBeLessThan(0.2)
    expect(flashOf(ANSWER.over)).toBe(0)
    expect(flashOf(9)).toBe(0)
  })

  for (const [zone, id] of [['first', 'loader.ring'], ['last', 'outlet.ring']] as const) {
    test(`${id}: the ring moves on the contact, nothing else of the metal does, and it comes back to where it stood`, () => {
      const a = anchorOf(zone)
      const z = zoneOf(a)
      const maker = parts['loader']!
      const o = maker.make(a, ctxOf([])) as THREE.Object3D
      const pos = metalOf(o).geometry.getAttribute('position') as THREE.BufferAttribute
      const rest = (pos.array as Float32Array).slice()
      maker.pose!(o, a, ctxOf([]))
      expect(Array.from(pos.array)).toEqual(Array.from(rest))
      const calm = breathOf(z).value
      maker.pose!(o, a, ctxOf([struck(id, 0)]))
      let moved = 0
      let far = 0
      for (let i = 0; i < rest.length; i++) {
        const d = Math.abs(pos.array[i]! - rest[i]!)
        if (d > 1e-6) moved++
        far = Math.max(far, d)
      }
      expect(moved).toBeGreaterThan(300)
      expect(far).toBeGreaterThan(4)
      expect(far).toBeLessThanOrEqual(ANSWER.shrink * 170)
      expect(breathOf(z).value).toBeCloseTo(calm + ANSWER.flash, 5)
      maker.pose!(o, a, ctxOf([struck(id, 9)]))
      expect(Array.from(pos.array)).toEqual(Array.from(rest))
      expect(breathOf(z).value).toBeCloseTo(calm, 5)
    })
  }

  test('a collar on the tube does not move with the ring', () => {
    const a = anchorOf('first')
    const maker = parts['loader']!
    const o = maker.make(a, ctxOf([])) as THREE.Object3D
    const pos = metalOf(o).geometry.getAttribute('position') as THREE.BufferAttribute
    const rest = (pos.array as Float32Array).slice()
    maker.pose!(o, a, ctxOf([struck('loader.ring', 0)]))
    let still = 0
    for (let i = 0; i < rest.length; i += 3) if (pos.array[i] === rest[i] && pos.array[i + 1] === rest[i + 1] && pos.array[i + 2] === rest[i + 2]) still++
    expect(still).toBeGreaterThan(100)
  })
})
