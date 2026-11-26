import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { parts } from '../src/table/real/frame'
import { RISER, TUBE, drainWay } from '../src/table/real/frame/loader'
import { drain } from '../src/table/real/hardware/apron'
import { isAnchor, zoneOf } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import { BALL, MID, OUTLET } from '../src/table/layout'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
const ctx: RealContext = { page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined }
const last = list.filter((s) => isAnchor(s) && s.part === 'loader').find((a) => zoneOf(a).id === 'last')!
const meshes = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}

describe('the way out on the last screen', () => {
  test('the tube runs from the cap under the drain to the middle of the outlet port, on the page and never under it', () => {
    const a = drainWay(0)
    const b = drainWay(1)
    expect(a.x).toBeCloseTo(MID * BALL, 3)
    expect(b.x).toBeCloseTo(OUTLET.x * BALL, 3)
    expect(b.y).toBeCloseTo(OUTLET.y * BALL, 3)
    for (let i = 0; i <= 40; i++) {
      const p = drainWay(i / 40)
      expect(p.z, `at ${i}`).toBeGreaterThan(0)
      if (i <= 32) expect(p.z, `at ${i}`).toBeGreaterThanOrEqual(TUBE.outer / 2 - 1)
      expect(Number.isFinite(p.x + p.y + p.z)).toBe(true)
    }
  })

  test('the tube of the last screen is one glass mesh made with the feed tube, and its cap is wider than the tube', () => {
    const o = parts.loader!.make(last, ctx) as THREE.Object3D
    const glass = meshes(o).filter((m) => m.name === 'loader.drain.last')
    expect(glass.length).toBe(1)
    expect(glass[0]!.geometry.getAttribute('position').count).toBeGreaterThan(200)
    expect(RISER.body).toBeGreaterThan(TUBE.outer)
    expect(RISER.flange).toBeGreaterThan(RISER.body)
  })

  test('the hardware draws the drain tube only under the page: no plate, no slot, nothing above the page on the last screen', () => {
    const d = drain(zoneOf(last))
    for (const g of [d.G, d.C]) {
      const at = g.done().getAttribute('position')
      expect(at.count).toBeGreaterThan(0)
      for (let i = 0; i < at.count; i++) expect(at.getZ(i)).toBeLessThan(0)
    }
  })
})
