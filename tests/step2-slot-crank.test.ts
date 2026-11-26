import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { RealContext, Emitter } from '../src/real/types'
import { crank, CRANK_LOOK, gripGeometry } from '../src/pages/step2/real/crank'
import { CRANK, SHEET, sheetScale, TRAY_Z } from '../src/pages/step2/layout'
import type { Shape } from '../src/stage/types'

const shape = (id: string, kind: Shape['kind'], w: number, h: number, z0: number, z1: number, tone: Shape['tone'], over: Partial<Shape> = {}): Shape => ({ id, part: 'crank', kind, x: 100, y: 100, w, h, z0, z1, tone, ...over })

const shapes = (lit: number): Shape[] => [
  shape('crank-base', 'disc', CRANK.base, CRANK.base, TRAY_Z, 18, 'metal'),
  shape('crank-hub', 'disc', CRANK.hub, CRANK.hub, 18, 40, 'raised'),
  shape('crank-arm', 'capsule', CRANK.arm + 16, 16, 26, 36, 'metal', { rot: 0.6 }),
  shape('crank-grip', 'capsule', CRANK.gripW, CRANK.gripH, 36, 60, 'accent', { rot: 0.6 }),
  ...Array.from({ length: 10 }, (_, k) => shape(`meter-${k + 1}`, 'capsule', CRANK.segW, CRANK.segH, TRAY_Z, k < lit ? 18 : 12, k < lit ? 'accent' : 'glass', { x: 300 + k * 41 }))
]

function context(list: Shape[]): { ctx: RealContext; lights: Emitter[] } {
  const lights: Emitter[] = []
  const ctx: RealContext = { page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: (e) => lights.push(e) }
  return { ctx, lights }
}

function meshes(o: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}

function sound(g: THREE.BufferGeometry, name: string): void {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  expect(n, name).toBeDefined()
  expect(p.count, name).toBeGreaterThan(0)
  for (let i = 0; i < p.count; i++) {
    expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), name).toBe(true)
    const l = Math.hypot(n.getX(i), n.getY(i), n.getZ(i))
    if (Math.abs(l - 1) > 1e-3) throw new Error(`${name}: normal ${i} has length ${l}`)
  }
}

describe('the crank', () => {
  it('makes every shape of the part, with points that are numbers and normals of length one', () => {
    const list = shapes(4)
    const { ctx } = context(list)
    for (const s of list) {
      expect(crank!.key(s, ctx), s.id).not.toBeNull()
      const o = crank!.make(s, ctx)
      const all = meshes(o)
      expect(all.length, s.id).toBeGreaterThan(0)
      for (const m of all) {
        sound(m.geometry, s.id)
        expect(m.userData.standIn, s.id).toBeUndefined()
        expect(m.castShadow || m.receiveShadow, s.id).toBe(true)
      }
    }
  })

  it('answers the shapes of the sheet as it answers the page', () => {
    const { ctx } = context([])
    for (const s of shapes(0)) {
      const k = sheetScale(`sheet-${s.id}`)
      expect(crank!.key({ ...s, id: `sheet-${s.id}`, w: s.w * k, h: s.h * k, z1: s.z0 + (s.z1 - s.z0) * k }, ctx)).toBe(crank!.key(s, ctx))
    }
  })

  it('keeps nothing of a frame in its key', () => {
    const { ctx } = context([])
    const arm = shapes(0)[2]!
    expect(crank!.key({ ...arm, rot: 2.5, z1: 30, moved: true }, ctx)).toBe(crank!.key(arm, ctx))
    const seg = shapes(0)[4]!
    expect(crank!.key({ ...seg, tone: 'accent', z1: 18 }, ctx)).toBe(crank!.key(seg, ctx))
  })

  it('builds the same solids twice', () => {
    const a = gripGeometry(60, 14, 12)
    const b = gripGeometry(60, 14, 12)
    expect(Array.from(b.getAttribute('position').array)).toEqual(Array.from(a.getAttribute('position').array))
    sound(a, 'grip')
  })

  it('stays inside the heights the page gives', () => {
    const list = shapes(0)
    const { ctx } = context(list)
    const full: Record<string, number> = { 'crank-base': 26, 'crank-hub': 22, 'crank-arm': 10, 'crank-grip': 24 }
    for (const s of list.slice(0, 4)) {
      const o = crank!.make(s, ctx)
      crank!.pose!(o, s, ctx)
      o.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(o)
      expect(box.max.z, s.id).toBeLessThanOrEqual(full[s.id]! + 0.01)
    }
  })

  it('hides a machine that is down in its tray', () => {
    const { ctx } = context([])
    const base = { ...shapes(0)[0]!, z1: TRAY_Z }
    const o = crank!.make(base, ctx)
    crank!.pose!(o, base, ctx)
    expect(o.visible).toBe(false)
  })

  it('gives off light for lit segments only, and never more than its share of lamps', () => {
    for (const lit of [0, 1, 3, 4, 7, 10]) {
      const list = shapes(lit)
      const { ctx, lights } = context(list)
      for (const s of list) {
        const o = crank!.make(s, ctx)
        crank!.pose!(o, s, ctx)
      }
      expect(lights.length, `lit ${lit}`).toBe(lit === 0 ? 0 : Math.min(CRANK_LOOK.lamp.most, Math.ceil(lit / 3)))
      const power = lights.reduce((sum, e) => sum + e.power, 0)
      expect(power).toBeCloseTo(CRANK_LOOK.lamp.power * lit, 6)
      for (const e of lights) expect(e.shadow).toBeUndefined()
    }
  })

  it('stands a segment on the floor of its tray, and on the page when there is no tray', () => {
    const seg = shapes(0)[4]!
    const tray: Shape = { id: 'volume-tray', part: 'rows', kind: 'box', x: 0, y: 0, w: 900, h: 300, z0: TRAY_Z, z1: 0, tone: 'metal' }
    const k = SHEET.meter.times
    const onSheet: Shape = { ...seg, id: 'sheet-meter-5', w: seg.w * k, h: seg.h * k, z0: 0, z1: (seg.z1 - seg.z0) * k }
    for (const [list, low, times] of [[[seg, tray], TRAY_Z, 1], [[onSheet], 0, k]] as [Shape[], number, number][]) {
      const { ctx } = context(list)
      const s = list[0]!
      const o = crank!.make(s, ctx)
      crank!.pose!(o, s, ctx)
      o.position.z = s.z0
      o.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(o)
      expect(box.min.z).toBeCloseTo(low, 4)
      expect(box.max.z).toBeCloseTo(low + CRANK_LOOK.pill * times, 4)
    }
  })
})
