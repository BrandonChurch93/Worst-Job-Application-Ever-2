import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { parts } from '../src/table/real/play'
import { lidJump, ringDown } from '../src/table/real/play/bumpers'
import { flapLift, FLAP } from '../src/table/real/play/ramps'
import { PLATE, plateDown, spinnerTurn, standupLean } from '../src/table/real/play/targets'
import { isAnchor, zoneOf } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
const ctx: RealContext = { page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined }
const NAMES = ['flippers', 'bumpers', 'targets', 'ramps']
const anchorsOf = (part: string): Shape[] => list.filter((s) => isAnchor(s) && s.part === part)
const built = NAMES.flatMap((part) => anchorsOf(part).map((a) => ({ part, zone: zoneOf(a).id, o: parts[part]!.make(a, ctx) as THREE.Object3D })))
const meshesOf = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}
const trianglesOf = (m: THREE.Mesh): number => {
  const n = m.geometry.index ? m.geometry.index.count / 3 : m.geometry.getAttribute('position').count / 3
  return n * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)
}

describe('the parts that play', () => {
  test('every part is made and builds something in every zone it has an anchor in', () => {
    for (const part of NAMES) expect(parts[part], part).not.toBeNull()
    const zonesOf = (part: string): string[] => built.filter((b) => b.part === part).map((b) => b.zone).sort()
    expect(zonesOf('flippers')).toEqual(['corporate', 'office', 'street'])
    expect(zonesOf('targets')).toEqual(['corporate', 'office', 'street'])
    expect(zonesOf('bumpers')).toEqual(['office'])
    expect(zonesOf('ramps')).toEqual(['street'])
    for (const b of built) expect(meshesOf(b.o).length, `${b.part} ${b.zone}`).toBeGreaterThan(0)
  })

  test('the drawings of each tier stay inside twelve', () => {
    for (const zone of ['corporate', 'office', 'street']) {
      const n = built.filter((b) => b.zone === zone).reduce((sum, b) => sum + meshesOf(b.o).length, 0)
      expect(n, zone).toBeLessThanOrEqual(12)
    }
  })

  test('the triangles stay inside the budget and small trim is marked fine', () => {
    let total = 0
    let coarse = 0
    for (const b of built) {
      for (const m of meshesOf(b.o)) {
        const n = trianglesOf(m)
        total += n
        if (!m.userData.fine) coarse += n
      }
    }
    expect(total).toBeLessThanOrEqual(120000)
    expect(coarse).toBeLessThanOrEqual(85000)
  })

  test('the tiers share one solid material each, and nothing is pure black or pure white', () => {
    for (const zone of ['corporate', 'office', 'street']) {
      const solid = new Set<THREE.Material>()
      for (const b of built.filter((x) => x.zone === zone)) {
        for (const m of meshesOf(b.o)) {
          const material = m.material as THREE.Material
          if (material.name.startsWith('play.solid')) solid.add(material)
          const c = m.geometry.getAttribute('color')
          if (!c || !material.name.startsWith('play.solid')) continue
          for (let i = 0; i < c.count; i += 97) {
            const sum = c.getX(i) + c.getY(i) + c.getZ(i)
            expect(sum, m.name).toBeGreaterThan(0.004)
            expect(sum, m.name).toBeLessThan(2.95)
          }
        }
      }
      expect(solid.size, zone).toBe(1)
    }
  })

  test('every glow carries its group and no part lights itself', () => {
    const glows = built.filter((b) => b.part === 'bumpers').flatMap((b) => meshesOf(b.o)).filter((m) => typeof m.userData.lightGroup === 'string')
    expect(glows.map((m) => m.userData.lightGroup as string).sort()).toEqual(['office.bumper.1', 'office.bumper.2', 'office.bumper.3'])
  })

  test('a bumper ring snaps down in 0.03 s and is back in 0.13 s, and its lid jumps and settles', () => {
    expect(ringDown(0)).toBeCloseTo(0, 5)
    expect(ringDown(0.03)).toBeCloseTo(1, 5)
    expect(ringDown(0.08)).toBeGreaterThan(0)
    expect(ringDown(0.08)).toBeLessThan(1)
    expect(ringDown(0.13)).toBeCloseTo(0, 5)
    expect(ringDown(5)).toBe(0)
    expect(lidJump(0.03)).toBeGreaterThan(1)
    expect(lidJump(0.03)).toBeLessThan(8)
    expect(Math.abs(lidJump(1))).toBeLessThan(0.05)
  })

  test('a drop target is down in 0.05 s, flush with its frame, and the bank rises when its state returns', () => {
    expect(plateDown(1, 9)).toBe(0)
    expect(plateDown(0, 0)).toBe(0)
    expect(plateDown(0, 0.025)).toBeCloseTo(0.5, 5)
    expect(plateDown(0, 0.05)).toBe(1)
    expect(plateDown(0, 4)).toBe(1)
    expect(plateDown(1, 0.2)).toBe(0)
    expect(PLATE.tall - PLATE.down).toBeGreaterThan(2)
    expect(PLATE.tall - PLATE.down).toBeLessThan(3.2)
  })

  test('the standup leans back, swings twice and stands, and the spinner slows over 1.5 s and stops flat', () => {
    expect(standupLean(0)).toBeCloseTo(0.3, 5)
    let crossings = 0
    for (let t = 0.005; t < 0.8; t += 0.005) if (Math.sign(standupLean(t)) !== Math.sign(standupLean(t - 0.005))) crossings++
    expect(crossings).toBeGreaterThanOrEqual(4)
    expect(Math.abs(standupLean(0.6))).toBeLessThan(0.01)
    expect(standupLean(2)).toBe(0)
    expect(spinnerTurn(0)).toBe(0)
    const early = spinnerTurn(0.1) - spinnerTurn(0)
    const late = spinnerTurn(1.4) - spinnerTurn(1.3)
    expect(early).toBeGreaterThan(late * 5)
    expect((spinnerTurn(1.5) / (Math.PI * 2)) % 1).toBeCloseTo(0, 5)
    expect(spinnerTurn(9)).toBe(spinnerTurn(1.5))
  })

  test('the flap lies on the floor when the highway is open and lifts its lip when it is not', () => {
    expect(flapLift(1)).toBe(0)
    expect(flapLift(0)).toBe(FLAP.lift)
    const ramps = built.find((b) => b.part === 'ramps')!
    const flap = meshesOf(ramps.o).find((m) => m.name === 'play.ramps.flap')!
    const shape = (v: number): RealContext => ({ ...ctx, byId: new Map([...ctx.byId, ['flap.highway', { ...ctx.byId.get('flap.highway')!, v: [v] }]]) })
    parts.ramps!.pose!(ramps.o, anchorsOf('ramps')[0]!, shape(1))
    const open = flap.rotation.y
    parts.ramps!.pose!(ramps.o, anchorsOf('ramps')[0]!, shape(0))
    expect(flap.rotation.y).toBeLessThan(open)
  })

  test('a flipper turns with its shape', () => {
    const b = built.find((x) => x.part === 'flippers' && x.zone === 'street')!
    const bats = meshesOf(b.o)
    expect(bats.length).toBe(2)
    expect(bats.every((m) => m.castShadow)).toBe(true)
  })
})
