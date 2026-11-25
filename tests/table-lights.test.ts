import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { studio } from '../src/post/studio'
import { table } from '../src/table/layout'
import { zone, zones } from '../src/table/real/zone'
import { CHANNELS, LIT } from '../src/table/real/lights/groups'
import { hook } from '../src/table/real/lights/hook'
import { groupsOf, levels, parts, solo } from '../src/table/real/lights/index'
import { fall, LEAN, picturesOf, TEXEL } from '../src/table/real/lights/pictures'
import { BUMPER } from '../src/table/real/lights/colours'
import { buildLamps } from '../src/table/real/lights/lamps'

const shape = (id: string, v: number[]): Shape => ({ id, part: 'table-lights', kind: 'anchor', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 0, tone: 'dark', v }) as Shape
const context = (shapes: Shape[]): RealContext => ({ page: 'step3', list: shapes, byId: new Map(shapes.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => {} })

describe('the light groups of a zone', () => {
  it('are named for their zone and fit the channels of the pictures', () => {
    for (const id of LIT) {
      const groups = groupsOf(id)
      expect(groups.length).toBeGreaterThan(0)
      expect(groups.length).toBeLessThanOrEqual(CHANNELS)
      groups.forEach((g, i) => {
        expect(g.id).toBe(`${id}.${g.name}`)
        expect(g.index).toBe(i)
      })
      expect(new Set(groups.map((g) => g.id)).size).toBe(groups.length)
    }
  })
  it('are none in a zone without lamps', () => {
    for (const z of zones) if (!LIT.includes(z.id)) expect(groupsOf(z)).toEqual([])
  })
  it('hold a group for the general lighting, each insert, the display and the flash of each tier', () => {
    for (const id of ['corporate', 'office', 'street']) {
      const names = groupsOf(id).map((g) => g.name)
      for (const n of ['general', 'insert.1', 'insert.2', 'insert.3', 'windows', 'display', 'flash']) expect(names).toContain(n)
    }
    expect(groupsOf('corporate').map((g) => g.name)).toEqual(expect.arrayContaining(['globe.left', 'globe.right']))
    expect(groupsOf('office').map((g) => g.name)).toEqual(expect.arrayContaining(['bumper.1', 'bumper.2', 'bumper.3']))
    expect(groupsOf('street').map((g) => g.name)).toEqual(expect.arrayContaining(['red', 'blue']))
    expect(groupsOf('marquee').map((g) => g.name)).toEqual(['panel', 'display'])
  })
  it('take no colour that is black or over one', () => {
    for (const id of LIT) for (const g of groupsOf(id)) for (const c of g.colour) expect(c).toBeGreaterThanOrEqual(0)
    for (const id of LIT) for (const g of groupsOf(id)) expect(Math.max(...g.colour)).toBeGreaterThan(0.2)
  })
})

describe('the levels of a zone', () => {
  const z = zone('street')
  const insert = table.inserts.filter((n) => n.tier === z.tier)[1]!
  it('come from the anchor of the zone and the shapes of the inserts', () => {
    const L = levels(context([shape('whole.table-lights.street', [0.8, 0.18, 0.25, 1, 0]), shape(`insert.${insert.id}`, [1])]), z)
    expect(L.general).toBe(0.8)
    expect(L.website).toBe(0.18)
    expect(L.flash).toBe(0.25)
    expect(L.byName.general).toBe(0.8)
    expect(L.byName.red).toBe(1)
    expect(L.byName.blue).toBe(0)
    expect(L.byName['insert.2']).toBe(1)
    expect(L.byName['insert.1']).toBe(0)
    expect(L.groups.length).toBe(groupsOf(z).length)
  })
  it('are nothing when the anchor is missing', () => {
    const L = levels(context([]), z)
    expect(L.general).toBe(0)
    expect(Math.max(...L.groups)).toBe(0)
  })
  it('raise a bumper lamp when it is struck and let it fall back in a quarter of a second', () => {
    const o = zone('office')
    const b = table.bumpers.filter((x) => x.tier === o.tier)[0]!
    const at = (since: number): number => levels(context([shape('whole.table-lights.office', [1, 0.18, 0, 0, 0]), shape(`bumper.${b.id}`, [since])]), o).byName['bumper.1']!
    expect(at(0)).toBe(1)
    expect(at(BUMPER.seconds)).toBeCloseTo(BUMPER.rest, 6)
    expect(at(5)).toBeCloseTo(BUMPER.rest, 6)
    expect(at(0.1)).toBeGreaterThan(at(0.2))
  })
  it('show one group alone when asked', () => {
    solo('street.red')
    const L = levels(context([shape('whole.table-lights.street', [0.8, 0.18, 0, 0, 1])]), z)
    solo(null)
    expect(L.byName.red).toBe(1)
    expect(L.groups.reduce((a, b) => a + b, 0)).toBe(1)
  })
})

describe('the hook', () => {
  it('lays itself on a material once, however often it is called', () => {
    const m = studio(new THREE.MeshStandardMaterial())
    hook!(m, zone('office'))
    const compile = m.onBeforeCompile
    const key = m.customProgramCacheKey()
    hook!(m, zone('office'))
    expect(m.onBeforeCompile).toBe(compile)
    expect(m.customProgramCacheKey()).toBe(key)
    expect(key.split('|wjl').length).toBe(2)
    expect(key.startsWith('wja-studio')).toBe(true)
  })
  it('keeps the key and the patch of a material that is given them after it', () => {
    const m = new THREE.MeshStandardMaterial()
    hook!(m, zone('office'))
    studio(m)
    const before = m.customProgramCacheKey
    m.customProgramCacheKey = () => `${before.call(m)}-own`
    expect(m.customProgramCacheKey()).toMatch(/^wja-studio.*-own\|wjl110$/)
    const shader = { uniforms: {}, vertexShader: '', fragmentShader: 'void main() {\n#include <lights_fragment_begin>\n#include <lights_fragment_end>\n}' } as unknown as THREE.WebGLProgramParametersWithUniforms
    m.onBeforeCompile(shader, null as unknown as THREE.WebGLRenderer)
    expect(shader.fragmentShader).toContain('wjlCol')
    expect(shader.fragmentShader.split('uniform sampler2D wjlA').length).toBe(2)
    expect(Object.keys(shader.uniforms)).toContain('wjlA')
  })
  it('leaves alone what gives light, what asks to be unlit and what stands in a zone without lamps', () => {
    const glow = new THREE.MeshStandardMaterial({ emissive: new THREE.Color(1, 0.5, 0.2), emissiveIntensity: 1 })
    hook!(glow, zone('corporate'))
    expect(glow.customProgramCacheKey()).toMatch(/\|wjl010$/)
    const asked = new THREE.MeshStandardMaterial({ emissive: new THREE.Color(1, 0.5, 0.2) })
    asked.userData.lit = true
    hook!(asked, zone('corporate'))
    expect(asked.customProgramCacheKey()).toMatch(/\|wjl110$/)
    const unlit = new THREE.MeshStandardMaterial()
    unlit.userData.unlit = true
    hook!(unlit, zone('corporate'))
    expect(unlit.customProgramCacheKey()).toMatch(/\|wjl010$/)
    const clear = new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.1 })
    hook!(clear, zone('office'))
    expect(clear.customProgramCacheKey()).toMatch(/\|wjl111$/)
    const far = new THREE.MeshStandardMaterial()
    const compile = far.onBeforeCompile
    hook!(far, zone('apron'))
    expect(far.onBeforeCompile).toBe(compile)
    expect(far.envMap).toBeNull()
  })
})

describe('the pictures of light', () => {
  it('are one texel for every six pixels of the zone and hold no value that is not a number', () => {
    const z = zone('corporate')
    const p = picturesOf(z)
    expect(p.width).toBe(Math.round(1920 / TEXEL))
    expect(p.height).toBe(Math.round(z.height / TEXEL))
    expect(p.textures.length).toBe(3)
    for (const plane of p.planes) for (let i = 0; i < plane.length; i += 97) expect(Number.isFinite(plane[i])).toBe(true)
    for (const t of p.textures) {
      const d = t.image.data as Uint16Array
      expect(d.length).toBe(p.width * p.height * 4)
      expect(t.type).toBe(THREE.HalfFloatType)
    }
    expect(picturesOf(z)).toBe(p)
  })
  it('follow the law of the true lights: full at the lamp, nothing at its reach', () => {
    expect(fall(0, 300)).toBeCloseTo((100 * 100 + 20 * 20) / (20 * 20), 6)
    expect(fall(100 * 100, 1e6)).toBeCloseTo(1, 3)
    expect(fall(300 * 300, 300)).toBe(0)
    expect(fall(90 * 90, 300)).toBeGreaterThan(fall(120 * 120, 300))
  })
  it('keep the lean of the general lighting in the channel the flash leaves free, and lean it between two lamps too', () => {
    for (const id of ['corporate', 'office', 'street']) {
      const z = zone(id)
      const p = picturesOf(z)
      const groups = groupsOf(id)
      expect(groups[LEAN]?.name ?? 'flash').toBe('flash')
      const lean = p.planes[LEAN]!
      for (let i = 0; i < lean.length; i += 53) {
        expect(lean[i]).toBeGreaterThanOrEqual(0)
        expect(lean[i]).toBeLessThanOrEqual(1.0001)
      }
      const rail = groups[0]!.sources.filter((s) => s.z < 100).sort((a, b) => a.y - b.y || a.x - b.x)
      const pair = rail.find((a, n) => rail[n + 1] !== undefined && Math.abs(rail[n + 1]!.y - a.y) < 1 && rail[n + 1]!.x - a.x > 60)
      expect(pair).toBeDefined()
      const next = rail[rail.indexOf(pair!) + 1]!
      const i = Math.floor(((pair!.x + next.x) / 2 + 960) / TEXEL)
      const j = Math.floor((pair!.y + z.height / 2) / TEXEL)
      const at = j * p.width + i
      expect(lean[at]).toBeGreaterThan(0.5)
      expect(Math.hypot(p.planes[CHANNELS]![at]!, p.planes[CHANNELS + 1]![at]!)).toBeLessThan(lean[at]!)
    }
  })
})

describe('the part', () => {
  it('is real', () => {
    expect(parts['table-lights']).not.toBeNull()
  })
})

describe('the lamps as things', () => {
  const plates = (id: string): Shape[] => {
    const z = zone(id)
    return table.inserts.filter((n) => n.tier === z.tier).map((n) => ({ ...shape(`insert-plate.${n.id}`, []), kind: 'box', x: n.c[0] * 96 - 80, y: n.c[1] * 96 + 60, w: 160, h: 34, z0: z.floor, z1: z.floor + 3 }) as Shape)
  }
  const count = (o: THREE.Object3D): { meshes: THREE.Mesh[]; triangles: number; fine: number } => {
    const meshes: THREE.Mesh[] = []
    let triangles = 0
    let fine = 0
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (!m.isMesh) return
      meshes.push(m)
      const n = (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute('position').count) / 3
      const t = n * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)
      triangles += t
      if (m.userData.fine === true) fine += t
    })
    return { meshes, triangles, fine }
  }
  it('are at most six meshes a zone, none casting a shadow, inside the triangles of the part', () => {
    let all = 0
    let coarse = 0
    for (const id of LIT) {
      const c = count(buildLamps(zone(id), context(plates(id))).group)
      expect(c.meshes.length).toBeLessThanOrEqual(6)
      for (const m of c.meshes) expect(m.castShadow).toBe(false)
      all += c.triangles
      coarse += c.triangles - c.fine
    }
    expect(all).toBeLessThan(60000)
    expect(coarse).toBeLessThan(30000)
  })
  it('name the light group of every mesh that gives light, and mark the screws as fine detail', () => {
    for (const id of ['corporate', 'office', 'street']) {
      const c = count(buildLamps(zone(id), context(plates(id))).group)
      const names = groupsOf(id).map((g) => g.id)
      for (const m of c.meshes) {
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat.emissive && mat.emissive.r + mat.emissive.g + mat.emissive.b > 0) expect(names).toContain(m.userData.lightGroup)
        if (m.name === 'screws') expect(m.userData.fine).toBe(true)
      }
      expect(c.meshes.map((m) => m.name)).toEqual(expect.arrayContaining(['lenses', 'sockets', 'plates', 'screws']))
    }
    expect(count(buildLamps(zone('corporate'), context(plates('corporate'))).group).meshes.map((m) => m.name)).toEqual(expect.arrayContaining(['globes', 'globe-glass']))
  })
  it('are built the same twice', () => {
    const a = count(buildLamps(zone('street'), context(plates('street'))).group)
    const b = count(buildLamps(zone('street'), context(plates('street'))).group)
    expect(a.triangles).toBe(b.triangles)
    const pa = a.meshes[0]!.geometry.getAttribute('position').array
    const pb = b.meshes[0]!.geometry.getAttribute('position').array
    expect(Array.from(pa.slice(0, 300))).toEqual(Array.from(pb.slice(0, 300)))
  })
})
