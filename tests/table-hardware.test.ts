import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { parts } from '../src/table/real/hardware'
import { POST, SLING, GATE } from '../src/table/real/hardware/tier'
import { LIFT } from '../src/table/real/hardware/lift'
import { PLUNGE } from '../src/table/real/hardware/apron'
import { TUBE } from '../src/table/real/frame/loader'
import { isAnchor, zoneOf } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import { BALL } from '../src/table/layout'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const fixed = fixedShapes()
const context = (extra: Shape[] = []): RealContext => {
  const list = [...fixed, ...extra]
  return { page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined }
}
const ctx = context()
const anchorsOf = (part: string): Shape[] => fixed.filter((s) => isAnchor(s) && s.part === part)
const built = (part: string): { zone: string; anchor: Shape; o: THREE.Object3D }[] => anchorsOf(part).map((a) => ({ zone: zoneOf(a).id, anchor: a, o: parts[part]!.make(a, ctx) as THREE.Object3D }))
const meshesOf = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}
const named = (o: THREE.Object3D, name: string): THREE.Mesh => meshesOf(o).find((m) => m.name === name)!
const trianglesOf = (m: THREE.Mesh): number => (m.geometry.getAttribute('position').count / 3) * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)
const moving = (id: string, v: number[], at: Partial<Shape> = {}): Shape => ({ id, part: 'table-hardware', kind: 'box', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 1, tone: 'metal', v, ...at })

describe('the hardware of the table', () => {
  const hardware = built('table-hardware')
  const lift = built('lift')
  const of = (set: typeof hardware, zone: string): (typeof hardware)[number] => set.find((b) => b.zone === zone)!

  test('both parts are made and build something on every anchor', () => {
    expect(hardware.map((b) => b.zone).sort()).toEqual(['apron', 'corporate', 'last', 'office', 'street'])
    expect(lift.map((b) => b.zone).sort()).toEqual(['corporate', 'office', 'street'])
    for (const b of [...hardware, ...lift]) expect(meshesOf(b.o).length, b.zone).toBeGreaterThan(0)
  })

  test('the drawings stay inside the budget: ten for a tier with its lift, four for the apron and the last screen, one for the steel balls', () => {
    for (const zone of ['corporate', 'office', 'street']) {
      const mine = meshesOf(of(hardware, zone).o).filter((m) => m.name !== 'hardware.balls').length + meshesOf(of(lift, zone).o).length
      expect(mine, zone).toBeLessThanOrEqual(10)
      expect(meshesOf(of(hardware, zone).o).filter((m) => m.name === 'hardware.balls').length).toBe(1)
    }
    expect(meshesOf(of(hardware, 'apron').o).length + meshesOf(of(hardware, 'last').o).length).toBeLessThanOrEqual(4)
  })

  test('a zone shares one material for all its metal, rubber and plastic, and one for its clear tube', () => {
    for (const zone of ['corporate', 'office', 'street']) {
      const mats = new Set([...meshesOf(of(hardware, zone).o), ...meshesOf(of(lift, zone).o)].map((m) => (m.material as THREE.Material).uuid))
      expect(mats.size, zone).toBe(2)
    }
  })

  test('screws and small detail are meshes of their own, marked fine, and the rest is light', () => {
    let coarse = 0
    for (const b of [...hardware, ...lift]) {
      for (const m of meshesOf(b.o)) {
        if (m.name.endsWith('.screws') || m.name.endsWith('.fine')) expect(m.userData.fine, `${b.zone} ${m.name}`).toBe(true)
        else if (m.name !== 'hardware.balls') coarse += trianglesOf(m)
      }
    }
    expect(coarse).toBeLessThan(30000)
  })

  test('nothing is pure black or pure white', () => {
    for (const b of [...hardware, ...lift]) {
      for (const m of meshesOf(b.o)) {
        const c = m.geometry.getAttribute('color')
        if (!c) continue
        for (let i = 0; i < c.count; i++) {
          const sum = c.getX(i) + c.getY(i) + c.getZ(i)
          expect(sum).toBeGreaterThan(0.004)
          if ((m.material as THREE.Material).name.startsWith('hardware.')) expect(Math.min(c.getX(i), c.getY(i), c.getZ(i))).toBeLessThan(0.98)
        }
      }
    }
  })

  test('a slingshot band bows a fifth of a ball when struck and is still a tenth of a second later', () => {
    const b = of(hardware, 'corporate')
    const band = named(b.o, 'hardware.bands')
    expect(band.geometry.morphAttributes.position!.length).toBe(2)
    const delta = band.geometry.morphAttributes.position![0]!
    let far = 0
    for (let i = 0; i < delta.count; i++) far = Math.max(far, Math.hypot(delta.getX(i), delta.getY(i)))
    expect(far).toBeCloseTo(SLING.bow, 0)
    expect(SLING.bow).toBeCloseTo(BALL / 5, 5)
    const id = (band.userData.slings as string[])[0]!
    const pose = (t: number): number => {
      parts['table-hardware']!.pose!(b.o, b.anchor, context([moving(`sling.${id}.3`, [t])]))
      return band.morphTargetInfluences![0]!
    }
    expect(pose(0)).toBeCloseTo(1, 5)
    expect(pose(SLING.period / 2)).toBeLessThan(0)
    expect(pose(SLING.period / 2)).toBeGreaterThan(-0.3)
    expect(Math.abs(pose(0.1))).toBeLessThan(0.05)
    expect(pose(9)).toBe(0)
  })

  test('the gate lies down when it is open and stands when it is shut', () => {
    const b = of(hardware, 'office')
    const gate = named(b.o, 'hardware.gate')
    parts['table-hardware']!.pose!(b.o, b.anchor, context([moving('gate.1', [1])]))
    expect(gate.rotation.x).toBe(GATE.open)
    parts['table-hardware']!.pose!(b.o, b.anchor, context([moving('gate.1', [0])]))
    expect(gate.rotation.x).toBe(GATE.shut)
  })

  test('the plunger is pulled by a morph that shortens its spring, and the knob travels as the layout says', () => {
    const b = of(hardware, 'apron')
    const p = named(b.o, 'hardware.plunger')
    const delta = p.geometry.morphAttributes.position![0]!
    let far = 0
    let still = 0
    for (let i = 0; i < delta.count; i++) {
      far = Math.max(far, -delta.getY(i))
      if (delta.getY(i) === 0) still++
    }
    expect(far).toBeCloseTo(PLUNGE.travel, 3)
    expect(PLUNGE.travel).toBeCloseTo(0.7 * BALL, 5)
    expect(still).toBeGreaterThan(100)
    parts['table-hardware']!.pose!(b.o, b.anchor, context([moving('plunger.knob', [0.6])]))
    expect(p.morphTargetInfluences![0]).toBeCloseTo(0.6, 5)
  })

  test('steel balls are one instanced mesh that holds only the balls in play in its zone', () => {
    const b = of(hardware, 'office')
    const balls = named(b.o, 'hardware.balls') as THREE.InstancedMesh
    expect(balls.count).toBe(0)
    const a = b.anchor
    const ball = (i: number, y: number): Shape => ({ id: `ball.steel.${i}`, part: 'table-hardware', kind: 'ball', x: 900, y, w: BALL, h: BALL, z0: a.z0, z1: a.z0 + BALL, tone: 'metal' })
    parts['table-hardware']!.pose!(b.o, a, context([ball(1, a.y + 200), ball(2, a.y + 400), ball(3, a.y - 400)]))
    expect(balls.count).toBe(2)
    const m = new THREE.Matrix4()
    balls.getMatrixAt(0, m)
    expect(new THREE.Vector3().setFromMatrixPosition(m).z).toBeCloseTo(BALL / 2, 5)
    parts['table-hardware']!.pose!(b.o, a, ctx)
    expect(balls.count).toBe(0)
  })

  test('the lift is the one clear tube of the machine, and its door swings in and falls shut', () => {
    for (const b of lift) {
      const tube = named(b.o, 'lift.tube')
      tube.geometry.computeBoundingBox()
      const box = tube.geometry.boundingBox!
      expect((box.max.x - box.min.x) / 2, b.zone).toBeCloseTo(TUBE.outer, 0)
      expect(tube.renderOrder).toBe(3)
    }
    const b = of(lift, 'office')
    const flap = named(b.o, 'lift.flap')
    const pose = (t: number): number => {
      parts['lift']!.pose!(b.o, b.anchor, context([moving('lift.door.office', [t], { part: 'lift' })]))
      return flap.rotation.y
    }
    expect(pose(9)).toBe(LIFT.lean)
    expect(pose(0)).toBeCloseTo(LIFT.lean + LIFT.swing, 5)
    expect(pose(1.5)).toBeLessThan(LIFT.lean + 0.01)
    expect(of(lift, 'corporate').o.children.some((c) => c.name === 'lift.flap')).toBe(false)
  })

  test('the shoulder of a slingshot post is where the modellers of the tiers were told', () => {
    expect(POST.shoulder).toBe(46)
    expect(POST.shoulderRadius).toBe(7)
    expect(POST.waist + 2 * POST.bandThick).toBeCloseTo(11.5, 5)
  })
})
