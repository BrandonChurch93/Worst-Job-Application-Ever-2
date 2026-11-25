import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pileAt, gatheredAt, restPose, STRIPS } from '../src/cursor/body'
import { restLook, type BodyModel } from '../src/cursor/contract'
import { damageLook, LIFE } from '../src/cursor/act/damage'
import { makeTape, TAPE } from '../src/cursor/act/tape'

const flat: BodyModel = { root: new THREE.Group(), apply: () => {}, anchor: (x, y, out) => out.set(x, y, 3), dispose: () => {} }
const shown = (u: number): { on: boolean; high: number } => {
  const tape = makeTape()
  tape.apply(u, flat, 1)
  const mesh = tape.root.children[0] as THREE.Mesh
  const p = mesh.geometry.getAttribute('position')
  let high = 0
  for (let i = 0; i < p.count; i++) high = Math.max(high, p.getZ(i))
  tape.dispose()
  return { on: mesh.visible, high }
}

describe('the mended body', () => {
  it('is taped only while its strips stand out of line, and the tape lies over the body', () => {
    expect(shown(0).on).toBe(false)
    expect(shown(TAPE.on[0] - 0.01).on).toBe(false)
    const held = shown(0.7)
    expect(held.on).toBe(true)
    expect(held.high).toBeGreaterThan(6)
    expect(held.high).toBeLessThan(6 + 1 + TAPE.thick + 0.01)
    expect(shown(1).on).toBe(false)
  })

  it('the tape is the same for the same share', () => {
    expect(shown(0.5)).toEqual(shown(0.5))
  })

  it('the settled pile lies flat, stacked and fanned, the same for the same seed', () => {
    const pile = pileAt(config.seed + 1, 2)
    expect(pile).toEqual(pileAt(config.seed + 1, 2))
    expect(pile).not.toEqual(pileAt(config.seed + 2, 2))
    expect(pile.length).toBe(STRIPS)
    for (const p of pile) {
      expect(Math.abs(p.tilt)).toBeLessThan(0.1)
      expect(p.z).toBeGreaterThan(0)
      expect(p.z).toBeLessThan(4)
      expect(Math.abs(p.rot)).toBeLessThan(0.5)
    }
    expect(pile[STRIPS - 1]!.rot).toBeGreaterThan(pile[0]!.rot)
  })

  it('strips gathered stand close to their places before they snap true', () => {
    for (const p of gatheredAt(config.seed + 1, 0.64)) {
      expect(Math.hypot(p.x, p.y)).toBeLessThan(2.5)
      expect(Math.abs(p.rot)).toBeLessThan(0.03)
      expect(Math.abs(p.tilt)).toBeLessThan(0.001)
    }
  })

  it('a burn hole is charred while hot and clean before it closes', () => {
    const hole = (at: number) => {
      const look = restLook(0)
      damageLook!(restPose(600, 500, { damage: ['burn'], healing: at, wounds: [{ kind: 'burn', at, x: 4.3, y: 9.4 }] }), look)
      return look.body.holes[0] as { r: number; glow: number; burnt?: number } | undefined
    }
    expect(hole(0.2)!.burnt).toBe(1)
    expect(hole(0.2)!.glow).toBeGreaterThan(0.3)
    const clean = hole(0.63)!
    expect(clean.burnt).toBe(0)
    expect(clean.glow).toBe(0)
    expect(clean.r).toBeCloseTo(LIFE.burn.clean, 5)
    expect(hole(0.2)!.r).toBeCloseTo(LIFE.burn.radius, 5)
    expect(hole(0.999)).toBeUndefined()
  })
})
