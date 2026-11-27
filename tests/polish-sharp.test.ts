import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { real } from '../src/table/real'
import { PART } from '../src/table/real/ball'
import { FOOT, TUBE, line } from '../src/table/real/frame/loader'
import { MIRROR } from '../src/table/real/frame/steel'
import { isAnchor } from '../src/table/real/zone'
import { fixedShapes } from '../src/table/draw'
import { BALL, PORT, SCREEN, railOf } from '../src/table/layout'
import { applyView, type ViewContext } from '../src/diagnostics/views'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'

const list = fixedShapes()
const ctx: RealContext = { page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined }
const meshesOf = (o: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}

describe('the mark that says a mesh only shades what lies under it', () => {
  test('one mesh of the built table carries it: the ball\'s shadow', () => {
    const ball: Shape = { id: 'ball.clear', part: PART, kind: 'ball', x: 1037, y: 3067, w: 96, h: 96, z0: -192, z1: -96, tone: 'glass' }
    const marked: string[] = []
    let built = 0
    for (const s of [...list.filter((x) => isAnchor(x)), ball]) {
      const maker = real.parts[s.part]
      if (!maker || maker.key(s, ctx) === null) continue
      for (const m of meshesOf(maker.make(s, ctx))) {
        built++
        if (m.userData.texels !== undefined) marked.push(`${m.name}:${String(m.userData.texels)}`)
      }
    }
    expect(built).toBeGreaterThan(100)
    expect(marked).toEqual(['ball.shadow:through'])
  })

  test('the texels view hides a marked mesh, shades every other as it did, and leaves the scene as it was', () => {
    const world = (mark: boolean): { ctx: ViewContext; meshes: THREE.Mesh[] } => {
      const scene = new THREE.Scene()
      const map = new THREE.DataTexture(new Uint8Array(4 * 8 * 4), 8, 4)
      const mats = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial({ map }), new THREE.MeshStandardMaterial({ transparent: true })]
      const meshes = mats.map((m) => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m))
      if (mark) meshes[2]!.userData.texels = 'through'
      scene.add(...meshes)
      return { ctx: { scene, camera: new THREE.PerspectiveCamera(30, 16 / 9, 1, 5000), width: 1920, height: 1080, pose: { eye: [0, 0, 2000], target: [0, 0, 0], fov: 30 }, layout: null, list: [], events: [], lights: [], table: () => null, colliders: () => [] } as unknown as ViewContext, meshes }
    }
    const plain = world(false)
    const with1 = world(true)
    const before = with1.meshes.map((m) => m.material)
    applyView('texels', plain.ctx)
    const restore = applyView('texels', with1.ctx)
    expect(with1.meshes.map((m) => m.visible)).toEqual([true, true, false])
    expect(plain.meshes.map((m) => m.visible)).toEqual([true, true, true])
    for (const i of [0, 1]) {
      const a = plain.meshes[i]!.material as THREE.ShaderMaterial
      const b = with1.meshes[i]!.material as THREE.ShaderMaterial
      expect(b.fragmentShader, String(i)).toBe(a.fragmentShader)
      expect(b.vertexShader, String(i)).toBe(a.vertexShader)
    }
    expect(((with1.meshes[1]!.material as THREE.ShaderMaterial).uniforms.size!.value as THREE.Vector2).toArray()).toEqual([8, 4])
    restore?.()
    expect(with1.meshes.map((m) => m.visible)).toEqual([true, true, true])
    expect(with1.meshes.map((m) => m.material)).toEqual(before)
  })
})

describe('the pictures the table is built from', () => {
  const SIZES: Record<string, Record<string, [number, number]>> = {
    'assets-full': { 'art/corporate.webp': [8192, 4608], 'art/office.webp': [8192, 4608], 'art/street.webp': [8192, 4608], 'art/corporate-coat.png': [4096, 2304], 'art/office-coat.png': [4096, 2304], 'art/street-coat.png': [4096, 2304], 'art/corporate-mask.png': [2048, 1152], 'art/office-mask.png': [2048, 1152], 'art/street-mask.png': [2048, 1152], 'art/inserts-glow.webp': [2304, 2304], 'art/inserts-lens.webp': [2304, 2304], 'art/inserts-relief.png': [2304, 2304], 'frame/marquee-skyline.webp': [1670, 433] },
    'public/assets': { 'art/corporate.webp': [4096, 2304], 'art/office.webp': [4096, 2304], 'art/street.webp': [4096, 2304], 'art/corporate-coat.png': [2048, 1152], 'art/office-coat.png': [2048, 1152], 'art/street-coat.png': [2048, 1152], 'art/corporate-mask.png': [2048, 1152], 'art/office-mask.png': [2048, 1152], 'art/street-mask.png': [2048, 1152], 'art/inserts-glow.webp': [1152, 1152], 'art/inserts-lens.webp': [1152, 1152], 'art/inserts-relief.png': [1152, 1152], 'frame/marquee-skyline.webp': [1296, 336] },
  }
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
  for (const [set, sizes] of Object.entries(SIZES)) {
    test(`are the size they were in ${set}, and no picture more`, async () => {
      const root = path.join(set, 'table')
      const files = walk(root).map((f) => path.relative(root, f).split(path.sep).join('/')).sort()
      expect(files).toEqual(Object.keys(sizes).sort())
      for (const f of files) {
        const m = await sharp(path.join(root, f)).metadata()
        expect([m.width, m.height], f).toEqual(sizes[f])
      }
    })
  }
})

describe('the foot of the clear tube on the first screen', () => {
  const feed = line()
  const edge = SCREEN * BALL
  const rail = railOf('feed').points

  test('its middle line is straight from the port to the screen\'s lower edge', () => {
    expect(FOOT.edge).toBe(1080)
    const above = feed.filter((p) => p[1] <= edge)
    expect(above.length).toBeGreaterThan(2)
    for (const p of above) expect(p[0]).toBeCloseTo(PORT.x * BALL, 9)
    const flat = above.filter((p) => p[1] >= rail[1]![1] * BALL + TUBE.bend)
    for (const p of flat) expect(p[2]).toBeCloseTo(BALL / 2, 9)
    expect(Math.max(...above.map((p) => p[1]))).toBeGreaterThan(edge - 240)
  })

  test('the bend starts under the edge and ends on the rail', () => {
    const turned = feed.filter((p) => Math.abs(p[0] - PORT.x * BALL) > 1e-6)
    expect(Math.min(...turned.map((p) => p[1]))).toBeGreaterThan(edge + FOOT.under)
    const corner = rail[2]!
    const next = rail[3]!
    expect(corner[1] * BALL).toBeGreaterThan(edge)
    const d = Math.hypot(next[0] - corner[0], next[1] - corner[1])
    const off = (p: number[]): number => Math.abs((p[0]! - corner[0] * BALL) * (next[1] - corner[1]) - (p[1]! - corner[1] * BALL) * (next[0] - corner[0])) / d
    const reach = corner[1] * BALL - edge
    const back = feed.filter((p) => p[1] > corner[1] * BALL && p[1] < corner[1] * BALL + reach && off(p) < 1e-6)
    expect(back.length).toBeGreaterThan(0)
  })

  test('past the bend the line is the one it was, so nothing further down the tube moves', () => {
    const wide = line(false, true)
    const from = rail[3]![1] * BALL
    const a = feed.filter((p) => p[1] > from)
    const b = wide.filter((p) => p[1] > from)
    expect(a.length).toBeGreaterThan(3)
    expect(a).toEqual(b)
  })

  test('the rail the ball rides is where it was', () => {
    expect(rail.slice(0, 4).map((p) => [Math.round(p[0] * BALL * 10) / 10, Math.round(p[1] * BALL * 10) / 10])).toEqual([[1627, 520], [1627, 731.2], [1627, 1094.4], [1838.4, 1286.4]])
  })

  test('the tube is as wide there as everywhere: it holds the ball with its wall', () => {
    expect(TUBE.outer * 2).toBe(106)
    expect((TUBE.outer - TUBE.wall) * 2).toBeGreaterThan(BALL)
    expect(TUBE.outer * 2 - BALL).toBeLessThanOrEqual(10)
  })
})

describe('the lines a polished wire shows when it is wide on the screen', () => {
  test('stand in the order the room has them: floor, gap, lamp, gap, crown', () => {
    expect(MIRROR.near[0]).toBeLessThan(MIRROR.near[1])
    expect(MIRROR.near[1]).toBeLessThan(1)
    expect(MIRROR.gap).toBeLessThan(MIRROR.lamp[0])
    expect(MIRROR.lamp[0]).toBeLessThan(MIRROR.lamp[1])
    expect(MIRROR.lamp[1]).toBeLessThan(MIRROR.crown)
    expect(MIRROR.crown).toBeLessThan(1)
    expect(MIRROR.dark).toBeLessThan(0.1)
  })
})
