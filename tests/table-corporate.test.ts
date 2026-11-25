import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { parts } from '../src/table/real/models/corporate'
import { matsOf } from '../src/table/real/models/corporate/mats'
import { WEDGE } from '../src/table/real/models/corporate/wedges'
import { WIRE } from '../src/table/real/models/corporate/ladder'
import { isAnchor, localBalls, zone, zoneOf } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import { BALL, railOf, table } from '../src/table/layout'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
const ctxOf = (shapes: Shape[]): RealContext => ({ page: 'step3', list: shapes, byId: new Map(shapes.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined })
const ctx = ctxOf(list)
const withV = (ids: string[], v: number[]): RealContext => ctxOf([...list.filter((s) => !ids.includes(s.id)), ...ids.map((id) => ({ id, part: 'x', kind: 'box', x: 0, y: 0, w: 1, h: 1, v }) as unknown as Shape)])
const NAMES = ['model-hq', 'model-revolving-door', 'model-beach', 'model-boardroom', 'model-ladder', 'model-notes', 'model-wedges']
const anchorOf = (part: string): Shape => {
  const a = list.find((s) => isAnchor(s) && s.part === part)
  if (!a) throw new Error(`No anchor of "${part}"`)
  return a
}
const meshesOf = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}
const trianglesOf = (m: THREE.Mesh): number => (m.geometry.getAttribute('position').count / 3) * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)
const built = new Map(NAMES.map((n) => [n, parts[n]!.make(anchorOf(n), ctx) as THREE.Object3D]))
const z = zone('corporate')
const boxOf = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o)

describe('the models of the corporate tier', () => {
  test('all seven are made, each in the corporate zone only', () => {
    for (const n of NAMES) {
      expect(parts[n], n).not.toBeNull()
      expect(list.filter((s) => isAnchor(s) && s.part === n).map((a) => zoneOf(a).id), n).toEqual(['corporate'])
      expect(meshesOf(built.get(n)!).length, n).toBeGreaterThan(0)
    }
  })

  test('the seven together are drawn in fourteen calls at most, and share three materials', () => {
    let calls = 0
    const mats = new Set<THREE.Material>()
    for (const n of NAMES) {
      for (const m of meshesOf(built.get(n)!)) {
        mats.add(m.material as THREE.Material)
        if (!m.userData.fine) calls++
      }
    }
    expect(calls).toBeLessThanOrEqual(14)
    const mine = matsOf(z)
    expect([...mats].every((m) => m === mine.solid || m === mine.glow || m === mine.clear)).toBe(true)
  })

  test('the triangles stay inside the share of one tier', () => {
    let total = 0
    let coarse = 0
    for (const n of NAMES) {
      for (const m of meshesOf(built.get(n)!)) {
        total += trianglesOf(m)
        if (!m.userData.fine) coarse += trianglesOf(m)
      }
    }
    expect(coarse).toBeLessThanOrEqual(36000)
    expect(total).toBeLessThanOrEqual(46000)
  })

  test('no vertex is out of place: every number is finite, every normal has length one and nothing lies under the floor', () => {
    for (const n of NAMES) {
      for (const m of meshesOf(built.get(n)!)) {
        const p = m.geometry.getAttribute('position')
        const nn = m.geometry.getAttribute('normal')
        for (let i = 0; i < p.count; i++) {
          expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), m.name).toBe(true)
          expect(Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)), m.name).toBeCloseTo(1, 3)
        }
      }
    }
  })

  test('what gives light says which group lights it, and nothing else does', () => {
    const mine = matsOf(z)
    for (const n of NAMES) {
      for (const m of meshesOf(built.get(n)!)) {
        if (m.material === mine.glow) expect(m.userData.lightGroup, m.name).toBe('corporate.windows')
        else expect(m.userData.lightGroup, m.name).toBeUndefined()
      }
    }
    expect(mine.glow.userData.lit).toBe(true)
  })

  test('each model stands where the layout puts it and no taller than it says', () => {
    for (const [part, id] of [['model-hq', 'corporate.hq'], ['model-beach', 'corporate.beach'], ['model-boardroom', 'corporate.boardroom']] as const) {
      const m = table.models.find((x) => x.id === id)!
      const a = localBalls(z, m.box[0], m.box[1] + m.box[3])
      const b = localBalls(z, m.box[0] + m.box[2], m.box[1])
      const box = new THREE.Box3()
      for (const mesh of meshesOf(built.get(part)!)) if (!mesh.name.startsWith('hq.doors')) box.union(new THREE.Box3().setFromObject(mesh))
      if (part !== 'model-hq') {
        expect(box.min.x, id).toBeGreaterThanOrEqual(a[0] - 0.01)
        expect(box.max.x, id).toBeLessThanOrEqual(b[0] + 0.01)
        expect(box.max.y, id).toBeLessThanOrEqual(b[1] + 6)
      }
      expect((box.min.x + box.max.x) / 2, id).toBeCloseTo((a[0] + b[0]) / 2, 0)
      expect(box.max.z, id).toBeLessThanOrEqual(m.h * BALL + 60)
      expect(box.max.z, id).toBeGreaterThanOrEqual(m.h * BALL * 0.9)
    }
  })

  test('the doors stand open, shut on the slam and open again when let go', () => {
    const hq = built.get('model-hq')!
    const doors = meshesOf(hq).find((m) => m.name.startsWith('hq.doors')) as THREE.InstancedMesh
    const angle = (): number => {
      const m = new THREE.Matrix4()
      doors.getMatrixAt(0, m)
      return Math.atan2(m.elements[1]!, m.elements[0]!)
    }
    const pose = (v: number[]): number => {
      hq.position.set(0, 0, 0)
      parts['model-hq']!.pose!(hq, anchorOf('model-hq'), withV(['hq.door.left', 'hq.door.right'], v))
      return angle()
    }
    expect(Math.abs(pose([0, 9, 9]))).toBeGreaterThan(1.2)
    expect(Math.abs(pose([1, 0.5, 9]))).toBeLessThan(0.01)
    expect(Math.abs(pose([1, 0.04, 9]))).toBeGreaterThan(0.2)
    expect(Math.abs(pose([0, 9, 0.4]))).toBeGreaterThan(0.3)
    expect(Math.abs(pose([0, 9, 2]))).toBeGreaterThan(1.2)
    hq.position.set(0, 0, 0)
  })

  test('the revolving door makes a quarter turn for a ball in and another for a ball out, and ends square', () => {
    const o = built.get('model-revolving-door')!
    const rotor = o.children[0]!
    const pose = (v: number[]): number => {
      parts['model-revolving-door']!.pose!(o, anchorOf('model-revolving-door'), withV(['hold.corporate.revolving'], v))
      return rotor.rotation.z
    }
    const rest = pose([0, 9, 9])
    expect(pose([1, 0, 9]) - rest).toBeCloseTo(Math.PI / 2, 5)
    expect(pose([1, 2, 9])).toBeCloseTo(rest, 5)
    const early = pose([1, 0.1, 9]) - pose([1, 0, 9])
    const late = pose([1, 0.8, 9]) - pose([1, 0.7, 9])
    expect(Math.abs(early)).toBeGreaterThan(Math.abs(late) * 3)
    expect(pose([0, 9, 0]) - rest).toBeCloseTo(Math.PI / 2, 5)
  })

  test('a note leans back when struck and comes to rest upright', () => {
    const o = built.get('model-notes')!
    const leaves = meshesOf(o).find((m) => m.name.startsWith('notes.leaves')) as THREE.InstancedMesh
    expect(leaves.count).toBe(3)
    const lean = (t: number): number => {
      parts['model-notes']!.pose!(o, anchorOf('model-notes'), withV(['target.corporate.note.1'], [1, t]))
      const m = new THREE.Matrix4()
      leaves.getMatrixAt(0, m)
      return Math.atan2(m.elements[9]!, m.elements[10]!)
    }
    const rest = lean(9)
    expect(Math.abs(lean(0.04) - rest)).toBeGreaterThan(0.2)
    expect(lean(3)).toBeCloseTo(rest, 5)
    let swings = 0
    let was = Math.sign(lean(0.06) - rest)
    for (let t = 0.07; t < 1.2; t += 0.01) {
      const now = Math.sign(lean(t) - rest)
      if (now !== 0 && now !== was) {
        swings++
        was = now
      }
    }
    expect(swings).toBeGreaterThanOrEqual(2)
  })

  test('each wedge lies on its three posts, 46 px over the floor, and does not reach past its rubber', () => {
    const o = built.get('model-wedges')!
    const box = boxOf(o)
    expect(box.min.z).toBeGreaterThanOrEqual(WEDGE.under - 3.01)
    expect(WEDGE.under).toBe(46)
    expect(WEDGE.out).toBeLessThanOrEqual(6)
    const slings = table.slings.filter((s) => s.tier === 0)
    expect(slings.length).toBe(2)
    const xs = slings.flatMap((s) => [s.a, s.b, s.c].map((p) => localBalls(z, p[0], p[1])[0]))
    expect(box.min.x).toBeGreaterThanOrEqual(Math.min(...xs) - 8)
    expect(box.max.x).toBeLessThanOrEqual(Math.max(...xs) + 8)
  })

  test('the ladder follows its rail: its wires stand where the ramps do and nothing of it reaches under the floor', () => {
    const o = built.get('model-ladder')!
    const box = boxOf(o)
    const pts = railOf('ladder').points.map((p) => localBalls(z, p[0], p[1], p[2]))
    expect(box.min.z).toBeGreaterThanOrEqual(-0.01)
    expect(box.max.z).toBeLessThanOrEqual(Math.max(...pts.map((p) => p[2])) + WIRE.centre + WIRE.hoop + 4)
    expect(box.max.x).toBeLessThanOrEqual(Math.max(...pts.map((p) => p[0])) + WIRE.hoop + 4)
    expect(WIRE.under / BALL).toBeCloseTo(0.36, 5)
    expect(WIRE.side / BALL).toBeCloseTo(0.56, 5)
  })
})
