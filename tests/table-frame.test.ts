import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { parts } from '../src/table/real/frame'
import { TUBE } from '../src/table/real/frame/loader'
import { FACE, skyline } from '../src/table/real/frame/skyline'
import { Geo, grooved } from '../src/table/real/frame/geo'
import { isAnchor, localBalls, zoneOf } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import { BALL, COLS, PORT, railOf } from '../src/table/layout'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
const ctx: RealContext = { page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined }
const anchorsOf = (part: string): Shape[] => list.filter((s) => isAnchor(s) && s.part === part)
const built = (part: string): { zone: string; o: THREE.Object3D }[] => anchorsOf(part).map((a) => ({ zone: zoneOf(a).id, o: parts[part]!.make(a, ctx) as THREE.Object3D }))
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
const BUDGET: Record<string, number> = { corporate: 8, office: 8, street: 8, apron: 6, marquee: 6 }

describe('the body of the machine', () => {
  const frame = built('table-frame')
  const marquee = built('marquee')
  const loader = built('loader')
  const all = [...frame, ...marquee, ...loader]

  test('every part is made and builds something in every zone it has an anchor in', () => {
    for (const part of ['table-frame', 'marquee', 'loader']) expect(parts[part], part).not.toBeNull()
    expect(frame.map((b) => b.zone).sort()).toEqual(['apron', 'corporate', 'office', 'street'])
    expect(marquee.map((b) => b.zone)).toEqual(['marquee'])
    expect(loader.length).toBe(6)
    for (const b of all) expect(meshesOf(b.o).length, b.zone).toBeGreaterThan(0)
  })

  test('the drawings of each zone stay inside the budget', () => {
    for (const b of frame) expect(meshesOf(b.o).length, `table-frame ${b.zone}`).toBeLessThanOrEqual(BUDGET[b.zone]!)
    for (const b of marquee) expect(meshesOf(b.o).length).toBeLessThanOrEqual(BUDGET.marquee!)
    for (const b of loader) expect(meshesOf(b.o).length, `loader ${b.zone}`).toBeLessThanOrEqual(3)
  })

  test('the triangles stay inside the budget, and the screws are fine meshes of one drawing each', () => {
    let total = 0
    let coarse = 0
    for (const b of all) {
      const screws = meshesOf(b.o).filter((m) => m.name.includes('.screws.'))
      expect(screws.length, b.zone).toBeLessThanOrEqual(1)
      for (const m of meshesOf(b.o)) {
        const n = trianglesOf(m)
        total += n
        if (!m.userData.fine) coarse += n
        if ((m as THREE.InstancedMesh).isInstancedMesh) expect(m.userData.fine, m.name).toBe(true)
      }
    }
    expect(total).toBeLessThanOrEqual(90000)
    expect(coarse).toBeLessThanOrEqual(50000)
  })

  test('no vertex is out of place: every number is finite and every normal has length one', () => {
    for (const b of all) {
      for (const m of meshesOf(b.o)) {
        const p = m.geometry.getAttribute('position')
        const n = m.geometry.getAttribute('normal')
        for (let i = 0; i < p.count; i++) {
          expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), m.name).toBe(true)
          expect(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)), m.name).toBeCloseTo(1, 3)
        }
      }
    }
  })

  test('a tier is let into the page: its rails end flush with the page and nothing of the frame stands above the tallest wall but the rails', () => {
    for (const b of frame) {
      if (b.zone === 'apron') continue
      const a = anchorsOf('table-frame').find((s) => zoneOf(s).id === b.zone)!
      const depth = -zoneOf(a).floor
      const box = new THREE.Box3().setFromObject(b.o)
      expect(box.min.z).toBeGreaterThanOrEqual(-0.01)
      expect(box.max.z).toBeLessThanOrEqual(depth + 2)
      expect(box.max.z).toBeGreaterThanOrEqual(depth - 0.01)
      expect(box.min.x).toBeCloseTo(-960, 3)
      expect(box.max.x).toBeCloseTo(960, 3)
    }
  })

  test('the feed tube is one tube cut at the zone edges: it clears the ball and its ends meet', () => {
    expect(TUBE.outer - TUBE.wall).toBeGreaterThan(BALL / 2)
    const tubes = loader.map((b) => ({ zone: b.zone, m: meshesOf(b.o).find((m) => m.name.startsWith('loader.tube.')) }))
    expect(tubes.filter((t) => t.m).map((t) => t.zone)).toEqual(['first', 'marquee', 'corporate', 'office', 'street'])
    for (const t of tubes) {
      if (!t.m || !['corporate', 'office'].includes(t.zone)) continue
      const box = new THREE.Box3().setFromObject(t.m)
      expect(box.min.y).toBeCloseTo(-540, 3)
      expect(box.max.y).toBeCloseTo(540, 3)
      expect((box.min.x + box.max.x) / 2).toBeCloseTo(COLS.feed * BALL - 960, 3)
    }
    expect(railOf('feed').points.length).toBeGreaterThan(2)
  })

  test('the light-givers of the marquee name their group and nothing glows without one', () => {
    for (const b of marquee) {
      for (const m of meshesOf(b.o)) {
        const mat = m.material as THREE.MeshStandardMaterial
        const glows = mat.emissive !== undefined && mat.emissive.getHex() !== 0
        if (glows) expect(m.userData.lightGroup, m.name).toBe('marquee.panel')
      }
    }
  })

  test('the face of the marquee is drawn by rule, the same every time, with no pure black and no pure white', () => {
    const a = skyline()
    const b = skyline()
    const p = a.art.image.data as Uint8Array
    const q = b.art.image.data as Uint8Array
    expect(a.art.image.width).toBe(FACE.w)
    expect(a.art.image.height).toBe(FACE.h)
    let same = true
    let lo = 255
    let hi = 0
    for (let i = 0; i < p.length; i++) {
      if (p[i] !== q[i]) same = false
      if (i % 4 !== 3) {
        lo = Math.min(lo, p[i]!)
        hi = Math.max(hi, p[i]!)
      }
    }
    expect(same).toBe(true)
    expect(lo).toBeGreaterThan(0)
    expect(hi).toBeLessThan(255)
  })

  test('a pulled outline closes: its faces turn outward', () => {
    const g = new Geo().prism([[0, 0], [0, 10], [10, 10], [10, 0]], [0, 0], [0, 20], [1, 1, 1]).done()
    const p = g.getAttribute('position')
    const n = g.getAttribute('normal')
    for (let i = 0; i < p.count; i++) expect((p.getX(i) - 5) * n.getX(i) + (p.getY(i) - 10) * n.getY(i) + (p.getZ(i) - 5) * n.getZ(i)).toBeGreaterThan(0)
  })

  test('a slotted ring leaves its slot clear: nothing of it lies between the two walls on the side the slot opens to', () => {
    const toward = -Math.PI / 2
    const half = TUBE.outer + 2
    const g = new Geo().slotted([[165, 0], [165, 21], [160, 26], [116, 26], [110, 17], [110, 3], [94, 3]], 0, 0, 72, [1, 1, 1], toward, half).done()
    const p = g.getAttribute('position')
    let walls = 0
    for (let i = 0; i < p.count; i++) {
      const along = p.getX(i) * Math.cos(toward) + p.getY(i) * Math.sin(toward)
      const across = -p.getX(i) * Math.sin(toward) + p.getY(i) * Math.cos(toward)
      if (along > 0) expect(Math.abs(across)).toBeGreaterThan(half - 0.001)
      if (along > 0 && Math.abs(Math.abs(across) - half) < 0.001) walls++
    }
    expect(walls).toBeGreaterThan(0)
  })

  test('the bottom of a groove is told from the wall it is cut in', () => {
    const outline: [number, number][] = [[0, 0], [10, 0], [10, 4], [8, 5], [8, 8], [10, 9], [10, 20], [0, 20]]
    const tone = grooved(outline, [8], [1, 1, 1], [0.1, 0.1, 0.1])
    expect(outline.map((_, i) => tone(i)[0])).toEqual([1, 1, 1, 0.1, 1, 1, 1, 1])
  })

  test('the tube starts at the wall of the port cup, not at its middle, so the ball is seen lying in the cup', () => {
    const first = loader.find((b) => b.zone === 'first')!
    const tube = meshesOf(first.o).find((m) => m.name.startsWith('loader.tube.'))!
    const a = anchorsOf('loader').find((s) => zoneOf(s).id === 'first')!
    const middle = localBalls(zoneOf(a), PORT.x, PORT.y)
    const p = tube.geometry.getAttribute('position')
    let nearest = Infinity
    for (let i = 0; i < p.count; i++) nearest = Math.min(nearest, Math.hypot(p.getX(i) - middle[0], p.getY(i) - middle[1]))
    expect(nearest).toBeGreaterThan(BALL / 2 + 20)
    expect(nearest).toBeLessThan((PORT.cup / 2) * BALL)
  })
})
