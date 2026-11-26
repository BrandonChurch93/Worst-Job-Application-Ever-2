import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { applyButton } from '../src/pages/marketing/real/apply-button'
import { careersPage } from '../src/pages/marketing/real/careers-page'
import { perkCards } from '../src/pages/marketing/real/perk-cards'
import { ticker } from '../src/pages/marketing/real/ticker'
import type { Emitter, PartMaker, RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const steps = (seconds: number): number => Math.round(seconds * stepHz)

function listOf(s: Stage): Shape[] {
  const list: DrawList = []
  s.page.draw(list)
  return list as Shape[]
}

function context(list: Shape[], time: number, asked: Emitter[] = []): RealContext {
  return { page: 'marketing', list, byId: new Map(list.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: (e) => asked.push(e) }
}

const MAKERS: Record<string, PartMaker> = { 'perk-cards': perkCards!, ticker: ticker!, 'apply-button': applyButton!, 'careers-page': careersPage! }

function at(seconds: number): { list: Shape[]; time: number } {
  const s = film()
  s.advance(steps(seconds))
  return { list: listOf(s), time: seconds }
}

function sound(o: THREE.Object3D, id: string): number {
  let triangles = 0
  o.traverse((n) => {
    const m = n as THREE.Mesh
    if (!m.isMesh) return
    const p = m.geometry.getAttribute('position')
    const nor = m.geometry.getAttribute('normal')
    expect(nor, id).toBeDefined()
    for (let i = 0; i < p.count; i++) {
      expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), id).toBe(true)
      const l = Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i))
      expect(Math.abs(l - 1), `${id} normal ${i}`).toBeLessThan(0.02)
    }
    const index = m.geometry.getIndex()
    triangles += (index ? index.count : p.count) / 3
  })
  return triangles
}

describe('the real careers page', () => {
  it('has a maker for every shape of its four parts, and every object is sound', () => {
    const { list, time } = at(11)
    const ctx = context(list, time)
    const made = new Map<string, THREE.Object3D>()
    let shapes = 0
    for (const s of list) {
      const maker = MAKERS[s.part ?? '']
      if (!maker || s.kind === 'text' || s.kind === 'well') continue
      const key = maker.key(s, ctx)
      expect(key, s.id).not.toBeNull()
      if (key === '') continue
      shapes++
      if (!made.has(key!)) made.set(key!, maker.make(s, ctx))
      const o = made.get(key!)!
      maker.pose?.(o, s, ctx)
      expect(sound(o, s.id), s.id).toBeGreaterThan(0)
    }
    expect(shapes).toBeGreaterThan(20)
    expect(made.size).toBeLessThan(shapes)
  })

  it('builds the turning card once: its key and its vertices are the same all through the turn', () => {
    const s = film()
    const keys = new Set<string>()
    let o: THREE.Object3D | null = null
    let first: Float32Array | null = null
    let turned = 0
    for (let i = 0; i < steps(3.2); i++) {
      s.advance(1)
      const list = listOf(s)
      const slab = list.find((x) => x.id === 'perk-0-slab')
      if (!slab) continue
      const ctx = context(list, i / stepHz)
      keys.add(perkCards!.key(slab, ctx)!)
      if (!o) {
        o = perkCards!.make(slab, ctx)
        first = Float32Array.from((o.getObjectByName('glass') as THREE.Mesh).geometry.getAttribute('position').array as Float32Array)
      }
      o.rotation.set(slab.turnX ?? 0, 0, 0)
      perkCards!.pose!(o, slab, ctx)
      const seal = o.getObjectByName('seal')!
      const up = new THREE.Vector3(0, 0, 1).applyQuaternion(seal.getWorldQuaternion(new THREE.Quaternion()))
      expect(up.z).toBeGreaterThan(0.999)
      if (Math.abs(slab.turnX ?? 0) > 0.5) turned++
    }
    expect(turned).toBeGreaterThan(5)
    expect(keys.size).toBe(1)
    const now = (o!.getObjectByName('glass') as THREE.Mesh).geometry.getAttribute('position').array as Float32Array
    expect(Array.from(now)).toEqual(Array.from(first!))
  })

  it('gives the slab two ground faces and one thickness: as much glass below its middle as above', () => {
    const { list, time } = at(2.4)
    const slab = list.find((x) => x.id === 'perk-0-slab')!
    const o = perkCards!.make(slab, context(list, time))
    const g = (o.getObjectByName('glass') as THREE.Mesh).geometry
    g.computeBoundingBox()
    const box = g.boundingBox!
    expect(box.max.z).toBeCloseTo(-box.min.z, 3)
    expect(box.max.z - box.min.z).toBeCloseTo(slab.v![0]!, 3)
    expect(box.max.x - box.min.x).toBeGreaterThan(slab.w - 8)
  })

  it('makes a button cap once and lowers it by the press, and the tape gives off its own light and asks for no lamp', () => {
    const s = film()
    const tops: number[] = []
    const keys = new Set<string>()
    for (let i = 0; i < steps(13.6); i++) {
      s.advance(1)
      if (i < steps(11.6)) continue
      const list = listOf(s)
      const shape = list.find((x) => x.id === 'hero-cta-cap')!
      const ctx = context(list, i / stepHz)
      keys.add(applyButton!.key(shape, ctx)!)
      tops.push(shape.z1)
    }
    expect(keys.size).toBe(1)
    expect(Math.max(...tops) - Math.min(...tops)).toBeGreaterThan(5)
    const { list, time } = at(9)
    const asked: Emitter[] = []
    const ctx = context(list, time, asked)
    const tape = list.find((x) => x.id === 'ticker-tape')!
    const o = ticker!.make(tape, ctx)
    ticker!.pose?.(o, tape, ctx)
    let glow = 0
    o.traverse((n) => {
      const m = (n as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined
      if (m && m.emissiveIntensity > 0 && m.emissive.r > 0) glow++
    })
    expect(glow).toBe(1)
    expect(asked.length).toBe(0)
  })
})
