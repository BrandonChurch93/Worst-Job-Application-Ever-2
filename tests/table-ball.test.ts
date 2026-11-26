import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { DROPS, ORDER, PART, PARTING, RIN, WALL, dropPlaces, hold, parts, rollAt, setGrade, shellGeometry, stateOf, type Grade } from '../src/table/real/ball'
import { LAMPS, fall, lightAt } from '../src/table/real/ball/lamps'
import { anchorId, fixedShapes } from '../src/table/draw'
import { table } from '../src/table/layout'
import { config } from '../src/config'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
for (const z of ['marquee', 'corporate', 'office', 'street']) list.push({ id: anchorId('table-lights', z), part: 'table-lights', kind: 'anchor', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 0, tone: 'dark', v: [1, 0, 0, 0, 0] } as Shape)
for (const n of table.inserts) list.push({ id: `insert.${n.id}`, part: 'inserts', kind: 'disc', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 0, tone: 'dark', v: [1] } as Shape)
const ctx: RealContext = { page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 2, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined }
const ball = (x: number, y: number, z0: number, v?: number[]): Shape => ({ id: 'ball.clear', part: PART, kind: 'ball', x: x - 48, y: y - 48, w: 96, h: 96, z0, z1: z0 + 96, tone: 'glass', ...(v ? { v } : {}) })
const meshesOf = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}
const trianglesOf = (m: THREE.Mesh): number => ((m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute('position').count) / 3) * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)
const maker = parts[PART]!
const office = ball(1085, 3115, -192)

describe('the clear ball', () => {
  test('the maker answers every ball of its part and nothing else', () => {
    expect(maker).not.toBeNull()
    expect(maker.key(office, ctx)).not.toBeNull()
    expect(maker.key({ ...office, kind: 'box' }, ctx)).toBeNull()
  })

  test('it is drawn in five drawings at most, in a fixed order under the cursor, inside the triangles', () => {
    const o = maker.make(office, ctx)
    const meshes = meshesOf(o)
    expect(meshes.length).toBe(5)
    expect(meshes.map((m) => m.name).sort()).toEqual(['ball.back', 'ball.core', 'ball.front', 'ball.shadow', 'ball.sweat'])
    for (const grade of ['bend', 'true'] as Grade[]) {
      setGrade(grade)
      hold('sweat', 1)
      maker.pose!(o, office, ctx)
      const seen = meshes.filter((m) => m.visible)
      expect(seen.length, grade).toBe(grade === 'true' ? 5 : 4)
      expect(seen.reduce((n, m) => n + trianglesOf(m), 0), grade).toBeLessThanOrEqual(40000)
    }
    setGrade('bend')
    hold('sweat', null)
    for (const m of meshes) {
      expect(m.userData.order, m.name).toBe(m.renderOrder)
      expect(m.renderOrder).toBeGreaterThanOrEqual(ORDER.decal)
      expect(m.renderOrder).toBeLessThan(1000000)
      expect(m.castShadow).toBe(false)
      expect((m.material as THREE.Material).userData.unlit, m.name).toBe(true)
    }
    expect(meshes.find((m) => m.name === 'ball.sweat')!.userData.fine).toBe(true)
    maker.drop!(o)
  })

  test('the shell is two halves that meet at the seam, with a wall and a plug, and every number in it is finite', () => {
    const g = shellGeometry()
    const p = g.getAttribute('position')
    const half = g.getAttribute('aHalf')
    const kind = g.getAttribute('aKind')
    const kinds = new Set<number>()
    for (let i = 0; i < p.count; i++) {
      expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i))).toBe(true)
      kinds.add(kind.getX(i))
      if (kind.getX(i) === 0) {
        expect(Math.hypot(p.getX(i), p.getY(i), p.getZ(i))).toBeCloseTo(1, 5)
        expect(p.getY(i) * half.getX(i)).toBeGreaterThanOrEqual(0)
      }
      if (kind.getX(i) === 1) {
        expect(p.getY(i)).toBe(0)
        expect(Math.hypot(p.getX(i), p.getZ(i))).toBeGreaterThanOrEqual(WALL - 1e-6)
        expect(WALL).toBeLessThan(RIN)
      }
      if (kind.getX(i) === 2) expect(Math.abs(p.getY(i))).toBeLessThan(0.1)
    }
    expect([...kinds].sort()).toEqual([0, 1, 2])
    const idx = g.index!
    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    const c = new THREE.Vector3()
    const n = g.getAttribute('normal')
    for (let i = 0; i < idx.count; i += 3) {
      a.fromBufferAttribute(p, idx.getX(i))
      b.fromBufferAttribute(p, idx.getX(i + 1))
      c.fromBufferAttribute(p, idx.getX(i + 2))
      const face = b.sub(a).cross(c.sub(a))
      expect(face.dot(new THREE.Vector3().fromBufferAttribute(n, idx.getX(i)))).toBeGreaterThan(0)
    }
  })

  test('the numbers on the shape open the ball and make it sweat, and the ball is closed and dry without them', () => {
    expect(stateOf(office)).toEqual({ closed: 1, since: 9, sweat: 0 })
    expect(stateOf(ball(0, 0, 0, [0.25, 0, 2]))).toEqual({ closed: 0.25, since: 0, sweat: 1 })
    const o = maker.make(office, ctx)
    const front = meshesOf(o).find((m) => m.name === 'ball.front')!
    const u = (front.material as THREE.ShaderMaterial).uniforms
    maker.pose!(o, ball(1085, 3115, -192, [0.25, 0, 0.5]), ctx)
    maker.pose!(o, ball(1085, 3115, -192, [0.1, 0, 0.5]), ctx)
    expect(u.uOpen!.value).toBe(1)
    expect(u.uGone!.value).toBeGreaterThan(0)
    expect(front.parent!.position.z).toBeLessThan(48)
    maker.pose!(o, ball(1085, 3115, -192, [0.65, 0, 0.5]), ctx)
    expect(u.uOpen!.value).toBeGreaterThan(0.3)
    expect(u.uOpen!.value).toBeLessThan(0.6)
    expect(u.uGone!.value).toBe(0)
    expect(front.parent!.position.z).toBe(48)
    maker.pose!(o, ball(1085, 3115, -192, [0, 0, 0.5]), ctx)
    expect(u.uGone!.value).toBe(1)
    expect(front.parent!.position.z).toBeCloseTo(48 - PARTING.deep * 48)
    expect(u.uSweat!.value).toBeCloseTo(0.5)
    expect(u.uPlugTurn!.value).toBeGreaterThan(1)
    maker.pose!(o, office, ctx)
    expect(u.uOpen!.value).toBe(0)
    expect(u.uGone!.value).toBe(0)
    expect(front.parent!.position.z).toBe(48)
    expect(u.uPlugTurn!.value).toBe(0)
    expect(meshesOf(o).find((m) => m.name === 'ball.sweat')!.visible).toBe(false)
  })

  test('pose is a law of the shape and the time: the same frame twice gives the same ball', () => {
    const o = maker.make(office, ctx)
    const read = (): string => {
      const own = meshesOf(o).find((m) => m.name === 'ball.front')!
      const u = (own.material as THREE.ShaderMaterial).uniforms
      return JSON.stringify([own.parent!.quaternion.toArray(), u.uLampPos!.value, u.uLampCol!.value, u.uFloor!.value, u.uSoft!.value, u.uBallUv!.value])
    }
    maker.pose!(o, office, ctx)
    const first = read()
    maker.pose!(o, ball(300, 1800, -96), ctx)
    expect(read()).not.toBe(first)
    maker.pose!(o, office, ctx)
    expect(read()).toBe(first)
  })

  test('on the carpet the bent floor is the carpet, and the footprint of the nearest model is not floor', () => {
    const carpet = table.flats.find((f) => f.id === 'corporate.carpet')!
    const B = config.table.ballPx
    const cx = (carpet.box[0] + carpet.box[2] / 2) * B
    const cy = (carpet.box[1] + 0.5) * B
    const on = ball(cx, cy, -96)
    const o = maker.make(on, ctx)
    maker.pose!(o, on, ctx)
    const u = (meshesOf(o).find((m) => m.name === 'ball.front')!.material as THREE.ShaderMaterial).uniforms
    const flat = u.uFlat!.value as THREE.Vector4
    expect(flat.x).toBeCloseTo(0, 4)
    expect(flat.y).toBeCloseTo(-(carpet.box[3] / 2 - 0.5) * B, 4)
    expect(flat.z).toBeCloseTo((carpet.box[2] / 2) * B, 4)
    expect((u.uFlatCol!.value as THREE.Color).r).toBeGreaterThan((u.uFlatCol!.value as THREE.Color).b * 3)
    const boxes = u.uBoxAt!.value as THREE.Vector4[]
    const walls = u.uBoxCol!.value as THREE.Vector4[]
    expect(boxes[0]!.z * boxes[0]!.w).toBeGreaterThan(0)
    expect(walls[0]!.w).toBeCloseTo(table.models.find((m) => m.id === 'corporate.hq')!.h * B, 4)
    expect(walls[0]!.x + walls[0]!.y + walls[0]!.z).toBeGreaterThan(0)
    const shadow = meshesOf(o).find((m) => m.name === 'ball.shadow')!
    expect(shadow.position.z - (u.uDrop!.value as number)).toBeCloseTo(5.6, 4)
    maker.pose!(o, office, ctx)
    expect(shadow.position.z - (u.uDrop!.value as number)).toBeCloseTo(3.4, 4)
    expect((u.uFlat!.value as THREE.Vector4).z).toBe(0)
  })

  test('it rolls: one width to the right turns it two radians, and the turn has length one', () => {
    const a = rollAt(0, 0, 48)
    const b = rollAt(96, 0, 48)
    expect(b.length()).toBeCloseTo(1, 6)
    expect(a.angleTo(b)).toBeCloseTo(2, 4)
  })

  test('the lamps the ball carries are the lights owner\'s, brightest first, and a lit insert beside it colours it', () => {
    const L = lightAt(office, ctx)
    expect(L.tier).toBe(true)
    expect(L.zone.id).toBe('office')
    expect(L.lamps.length).toBeGreaterThan(0)
    expect(L.lamps.length).toBeLessThanOrEqual(LAMPS)
    for (let i = 1; i < L.lamps.length; i++) expect(L.lamps[i]!.amount).toBeLessThanOrEqual(L.lamps[i - 1]!.amount)
    expect(L.lamps[0]!.colour[2]).toBeGreaterThan(L.lamps[0]!.colour[0])
    for (const l of L.lamps) {
      expect(l.shine).toBeGreaterThan(0)
      expect(l.shine).toBeLessThanOrEqual(l.window ? 0.9 * 6 : 26)
    }
    const dark = lightAt(office, { ...ctx, list: fixedShapes(), byId: new Map() })
    expect(dark.lamps.length).toBe(0)
    expect(lightAt(ball(960, 600, 0), ctx).tier).toBe(false)
    expect(fall(100, 1000)).toBeGreaterThan(fall(200, 1000))
    expect(fall(1000, 1000)).toBe(0)
  })

  test('the sweat is placed from the seed alone, on the inner wall', () => {
    const a = dropPlaces(config.seed)
    const b = dropPlaces(config.seed)
    expect(a.length).toBe(DROPS)
    expect(a.map((d) => d.at.toArray())).toEqual(b.map((d) => d.at.toArray()))
    for (const d of a) expect(d.at.length()).toBeCloseTo(1, 6)
    expect(dropPlaces(config.seed + 1)[0]!.at.toArray()).not.toEqual(a[0]!.at.toArray())
  })
})
