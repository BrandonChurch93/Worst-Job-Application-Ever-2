import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import { BALL, table } from '../src/table/layout'
import { groupsOf } from '../src/table/real/lights'
import { localBalls, zone } from '../src/table/real/zone'
import type { RealContext } from '../src/real/types'
import { buildCoffee } from '../src/table/real/models/office/coffee'
import { buildCubicles, loose, things } from '../src/table/real/models/office/cubicles'
import { boxOf, buildInbox, hopAt, poseInbox } from '../src/table/real/models/office/inbox'
import { buildStaplers, openAt, PLATE, poseStaplers } from '../src/table/real/models/office/staplers'
import { parts } from '../src/table/real/models/office'

const z = zone('office')
const ctxOf = (shapes: { id: string; v?: number[] }[] = [], time = 0): RealContext => ({ byId: new Map(shapes.map((s) => [s.id, s])), time, list: [] }) as unknown as RealContext

const meshes = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}
const boundsOf = (m: THREE.Mesh): THREE.Box3 => {
  m.updateWorldMatrix(true, false)
  m.geometry.computeBoundingBox()
  return m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld)
}
const triangles = (m: THREE.Mesh): number => {
  const g = m.geometry
  const n = (g.index ? g.index.count : g.getAttribute('position').count) / 3
  return n * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)
}

const built = {
  coffee: buildCoffee(z, ctxOf()),
  cubicles: buildCubicles(z, ctxOf()),
  inbox: buildInbox(z),
  staplers: buildStaplers(z)
}

describe('the models of the office', () => {
  test('all four parts have a maker', () => {
    for (const id of ['model-coffee-machine', 'model-cubicles', 'model-inbox', 'model-staplers']) expect(parts[id]).toBeTruthy()
  })

  test('the tier is drawn in no more than twelve draws, and its triangles are counted', () => {
    const all = Object.values(built).flatMap(meshes)
    expect(all.length).toBeLessThanOrEqual(12)
    const fine = all.filter((m) => m.userData.fine).reduce((n, m) => n + triangles(m), 0)
    const rest = all.filter((m) => !m.userData.fine).reduce((n, m) => n + triangles(m), 0)
    expect(fine).toBeGreaterThan(0)
    expect(rest).toBeLessThan(24000)
  })

  test('every material is one of the three of the zone, and what glows names a light group of the zone', () => {
    const all = Object.values(built).flatMap(meshes)
    const names = new Set(all.map((m) => (m.material as THREE.Material).name))
    expect(names.size).toBeLessThanOrEqual(3)
    const groups = new Set(groupsOf(z).map((g) => g.id))
    const glowing = all.filter((m) => (m.material as THREE.Material).name.startsWith('office.glow'))
    expect(glowing.length).toBe(1)
    for (const m of glowing) expect(groups.has(m.userData.lightGroup)).toBe(true)
  })

  test('no surface is pure black or pure white', () => {
    for (const m of Object.values(built).flatMap(meshes)) {
      const c = m.geometry.getAttribute('color')
      let low = 1
      let high = 0
      for (let i = 0; i < c.count; i++) {
        const top = Math.max(c.getX(i), c.getY(i), c.getZ(i))
        low = Math.min(low, top)
        high = Math.max(high, Math.min(c.getX(i), c.getY(i), c.getZ(i)))
      }
      expect(low).toBeGreaterThan(0.003)
      expect(high).toBeLessThan(0.97)
    }
  })

  test('the coffee machine and the inbox keep to their boxes in the layout', () => {
    for (const [id, o, over] of [['office.coffee', built.coffee, 0], ['office.inbox', built.inbox, 0]] as [string, THREE.Object3D, number][]) {
      const b = boxOf(z, id)
      for (const m of meshes(o)) {
        const box = boundsOf(m)
        expect(box.min.x).toBeGreaterThanOrEqual(b.x - b.w / 2 - 0.01)
        expect(box.max.x).toBeLessThanOrEqual(b.x + b.w / 2 + 0.01)
        expect(box.min.y).toBeGreaterThanOrEqual(b.y - b.d / 2 - 0.01)
        expect(box.max.y).toBeLessThanOrEqual(b.y + b.d / 2 + 0.01 + over)
        expect(box.min.z).toBeGreaterThanOrEqual(-0.01)
      }
    }
    const coffee = boxOf(z, 'office.coffee')
    const body = meshes(built.coffee).find((m) => m.name === 'office.coffee.body')!
    expect(boundsOf(body).max.z).toBeLessThanOrEqual(coffee.h + 12)
  })

  test('the mouth of the scoop is clear of the inbox, tipped or not', () => {
    const hold = table.holds.find((h) => h.id === 'office.inbox')!
    const [hx, hy] = localBalls(z, hold.c[0], hold.c[1])
    const clear = (hold.r + config.table.minClearanceBalls / 2) * BALL
    for (const v of [[0, 9, 9], [1, 5, 9]]) {
      poseInbox(built.inbox, z, ctxOf([{ id: 'model.office.inbox', v }]))
      for (const m of meshes(built.inbox)) {
        const p = m.geometry.getAttribute('position')
        m.updateWorldMatrix(true, false)
        const q = new THREE.Vector3()
        let near = Infinity
        for (let i = 0; i < p.count; i++) {
          q.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)
          if (q.z < 1.25 * BALL) near = Math.min(near, Math.hypot(q.x - hx, q.y - hy))
        }
        expect(near).toBeGreaterThan(clear * 0.5)
        expect(near).toBeGreaterThan(hold.r * BALL)
      }
    }
    poseInbox(built.inbox, z, ctxOf([{ id: 'model.office.inbox', v: [0, 9, 9] }]))
  })

  test('the envelopes jump when a ball goes in, lower when it is sent on, and lie still after', () => {
    const heaps = meshes(built.inbox).filter((m) => m.name.startsWith('office.inbox.heap'))
    expect(heaps.length).toBe(2)
    poseInbox(built.inbox, z, ctxOf([{ id: 'model.office.inbox', v: [0, 9, 9] }]))
    const rest = heaps.map((m) => m.position.z)
    poseInbox(built.inbox, z, ctxOf([{ id: 'model.office.inbox', v: [1, 0.12, 9] }]))
    const up = heaps.map((m, i) => m.position.z - rest[i]!)
    for (const h of up) expect(h).toBeGreaterThan(2)
    poseInbox(built.inbox, z, ctxOf([{ id: 'model.office.inbox', v: [0, 9, 0.12] }]))
    heaps.forEach((m, i) => {
      expect(m.position.z - rest[i]!).toBeGreaterThan(1)
      expect(m.position.z - rest[i]!).toBeLessThan(up[i]!)
    })
    poseInbox(built.inbox, z, ctxOf([{ id: 'model.office.inbox', v: [0, 9, 9] }]))
    heaps.forEach((m, i) => expect(m.position.z).toBeCloseTo(rest[i]!, 6))
    expect(hopAt(9)).toBe(0)
    expect(hopAt(0)).toBe(0)
    for (let t = 0; t < 1.4; t += 0.01) expect(hopAt(t)).toBeLessThanOrEqual(1)
  })

  test('a stapler slams shut in three hundredths of a second and springs back in a quarter with one small overshoot', () => {
    expect(openAt(9)).toBe(1)
    expect(openAt(0)).toBe(1)
    expect(openAt(0.015)).toBeCloseTo(0.5, 5)
    expect(openAt(0.03)).toBeCloseTo(0, 5)
    let peak = 0
    let crossings = 0
    let last = openAt(0.03)
    for (let t = 0.031; t < 1; t += 0.001) {
      const v = openAt(t)
      peak = Math.max(peak, v)
      if ((last - 1) * (v - 1) < 0) crossings++
      last = v
    }
    expect(peak).toBeGreaterThan(1.01)
    expect(peak).toBeLessThan(1.08)
    expect(crossings).toBeLessThanOrEqual(2)
    expect(Math.abs(openAt(0.28) - 1)).toBeLessThan(0.02)
  })

  test('each stapler follows the least of its three slingshot clocks, and its plate sits on the shoulders of its posts', () => {
    const arms = meshes(built.staplers).filter((m) => m.name.startsWith('office.stapler.arm'))
    expect(arms.length).toBe(2)
    const left = arms.find((m) => m.name.endsWith('left'))!
    const right = arms.find((m) => m.name.endsWith('right'))!
    poseStaplers(built.staplers, z, ctxOf([{ id: 'sling.office.sling.left.1', v: [5] }, { id: 'sling.office.sling.left.2', v: [0.03] }, { id: 'sling.office.sling.left.3', v: [7] }]))
    expect(Math.abs(left.rotation.y)).toBeLessThan(1e-6)
    expect(Math.abs(right.rotation.y)).toBeGreaterThan(0.1)
    const base = meshes(built.staplers).find((m) => m.name === 'office.staplers.base')!
    expect(boundsOf(base).min.z).toBeCloseTo(PLATE.z, 3)
    poseStaplers(built.staplers, z, ctxOf())
  })

  test('the small standing things stand behind the walls and guides, on floor no ball can reach, and touch none of them', () => {
    const far = (p: [number, number], a: [number, number], b: [number, number]): number => {
      const vx = b[0] - a[0]
      const vy = b[1] - a[1]
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy)))
      return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t)
    }
    const seg = (id: string): { a: [number, number]; b: [number, number] } => table.segs.find((q) => q.id === id)!
    const side = (p: [number, number], id: string): number => {
      const q = seg(id)
      return (q.b[0] - q.a[0]) * (p[1] - q.a[1]) - (q.b[1] - q.a[1]) * (p[0] - q.a[0])
    }
    const list = things()
    expect(list.map((t) => t.id)).toEqual(['cooler', 'bottle', 'cabinet', 'bin', 'plant'])
    for (const t of list) {
      for (const q of table.segs) if (q.tier === 1) expect(far(t.at, q.a, q.b)).toBeGreaterThan(t.r + 0.08)
      for (const q of table.posts) if (q.tier === 1) expect(Math.hypot(q.c[0] - t.at[0], q.c[1] - t.at[1])).toBeGreaterThan(q.r + t.r + 0.08)
      for (const b of table.bumpers) expect(Math.hypot(b.c[0] - t.at[0], b.c[1] - t.at[1])).toBeGreaterThan(b.r + t.r + config.table.minClearanceBalls)
      for (const n of table.inserts) expect(Math.hypot(n.c[0] - t.at[0], n.c[1] - t.at[1])).toBeGreaterThan(n.r + t.r)
    }
    const cub = table.models.find((m) => m.id === 'office.cubicles')!
    for (const t of list.slice(0, 2)) {
      expect(side(t.at, 'office.cubicles.roof')).toBeGreaterThan(0)
      expect(t.at[1] + t.r).toBeLessThanOrEqual(cub.box[1])
      expect(t.at[0] - t.r).toBeGreaterThan(cub.box[0])
    }
    for (const t of list.slice(2)) {
      expect(t.at[0] - t.r).toBeGreaterThan(seg('office.outlane.side.left').a[0])
      expect(side(t.at, 'office.inlane.floor.left')).toBeGreaterThan(0)
      expect(side(t.at, 'office.shoulder.edge.left')).toBeGreaterThan(0)
      expect(t.at[1] + t.r).toBeLessThan(seg('office.outlane.floor.left').a[1])
    }
    const lying = loose()
    expect(lying.length).toBeGreaterThan(5)
    const display = table.displays.find((d) => d.tier === 1)!
    for (const t of lying) {
      for (const q of table.segs) if (q.tier === 1) expect(far(t.at, q.a, q.b)).toBeGreaterThan(t.r + 0.08)
      for (const q of table.posts) if (q.tier === 1) expect(Math.hypot(q.c[0] - t.at[0], q.c[1] - t.at[1])).toBeGreaterThan(q.r + t.r + 0.08)
      for (const n of table.inserts) expect(Math.hypot(n.c[0] - t.at[0], n.c[1] - t.at[1])).toBeGreaterThan(n.r + t.r)
      expect(t.at[0] + t.r).toBeLessThan(seg('office.outlane.side.right').a[0])
      expect(t.at[0] - t.r).toBeGreaterThan(seg('office.shoulder.step.right').a[0])
      expect(side(t.at, 'office.inlane.floor.right')).toBeLessThan(0)
      expect(t.at[1] + t.r).toBeLessThan(display.box[1])
    }
  })
})
