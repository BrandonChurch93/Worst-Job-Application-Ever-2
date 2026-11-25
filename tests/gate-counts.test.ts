import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { countByPart, drawn, rowOf } from '../src/capture/showcase'
import { countsAgree, countsTable } from '../tools/lib/gate-counts.mjs'

const geometry = (indices: number, vertices = 100) => ({ index: indices ? { count: indices } : null, attributes: { position: { count: vertices } }, drawRange: { start: 0, count: Infinity } })

describe('the row of a drawn object', () => {
  it('is the part of the shape it was made for', () => {
    expect(rowOf({ part: 'keyboard', shape: 'key-a' })).toEqual({ part: 'keyboard', name: 'keyboard', made: 'real' })
    expect(rowOf({ standIn: 'turrets', shape: 'turret-1' })).toEqual({ part: 'turrets', name: 'turrets', made: 'stand-in' })
  })
  it('gives the ground, the type and the cursor rows of their own, and keeps the part name', () => {
    expect(rowOf({ part: 'shell' })).toEqual({ part: 'ground', name: 'shell', made: 'real' })
    expect(rowOf({ part: 'keyboard', shape: 'key-a', type: 'A' })).toEqual({ part: 'type', name: 'keyboard', made: 'real' })
    expect(rowOf({ standIn: 'cursor-arms' })).toEqual({ part: 'cursor', name: 'cursor-arms', made: 'stand-in' })
    expect(rowOf({ part: 'cursor-body', type: 'x' }).part).toBe('cursor')
  })
  it('names what carries no part', () => {
    expect(rowOf({})).toEqual({ part: 'untagged', name: 'untagged', made: 'untagged' })
  })
})

describe('what one object costs in one pass', () => {
  it('is one call and a third of its indices in triangles', () => {
    expect(drawn({}, geometry(300), null, {}, false)).toEqual({ calls: 1, triangles: 100 })
    expect(drawn({}, geometry(0, 90), null, {}, false)).toEqual({ calls: 1, triangles: 30 })
  })
  it('counts one group of a geometry with several materials, inside the range that is drawn', () => {
    expect(drawn({}, geometry(300), { start: 30, count: 60 }, {}, false)).toEqual({ calls: 1, triangles: 20 })
    expect(drawn({}, { ...geometry(300), drawRange: { start: 0, count: 60 } }, { start: 30, count: 60 }, {}, false)).toEqual({ calls: 1, triangles: 10 })
  })
  it('counts an instanced mesh as one call with every instance in its triangles', () => {
    expect(drawn({ isInstancedMesh: true, count: 40 }, geometry(36), null, {}, false)).toEqual({ calls: 1, triangles: 480 })
    expect(drawn({}, { ...geometry(36), isInstancedBufferGeometry: true, instanceCount: 5 }, null, {}, false)).toEqual({ calls: 1, triangles: 60 })
  })
  it('counts a see-through material with two sides twice in the colour pass, once in a shadow pass', () => {
    const glass = { transparent: true, side: THREE.DoubleSide, forceSinglePass: false }
    expect(drawn({}, geometry(300), null, glass, false)).toEqual({ calls: 2, triangles: 200 })
    expect(drawn({}, geometry(300), null, glass, true)).toEqual({ calls: 1, triangles: 100 })
    expect(drawn({}, geometry(300), null, { ...glass, forceSinglePass: true }, false)).toEqual({ calls: 1, triangles: 100 })
  })
  it('counts lines and points as calls without triangles, and nothing for a range that is empty the wrong way', () => {
    expect(drawn({ isLine: true }, geometry(0, 10), null, {}, false)).toEqual({ calls: 1, triangles: 0 })
    expect(drawn({}, geometry(300), { start: 400, count: 30 }, {}, false)).toBeNull()
  })
})

describe('the count by part', () => {
  it('counts only the first drawing of the scene, each pass in its column, and puts every hook back', async () => {
    const scene = new THREE.Scene()
    const light = new THREE.DirectionalLight()
    light.name = 'key'
    light.castShadow = true
    const a = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    a.userData = { part: 'keyboard', shape: 'key-a' }
    const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    b.userData = { standIn: 'keyboard', shape: 'key-b' }
    let own = 0
    b.onBeforeRender = () => {
      own++
    }
    const mine = b.onBeforeRender
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial())
    scene.add(light, a, b)
    const other = new THREE.Scene()
    const target = {}
    const renderer = {
      getRenderTarget: () => target,
      render(s: THREE.Scene) {
        if (s === other) return void quad.onBeforeRender(this as never, s, null as never, quad.geometry, quad.material as THREE.Material, null as never)
        for (const m of [a, b]) {
          m.onBeforeShadow(this as never, m as never, null as never, light.shadow.camera, m.geometry, m.material as THREE.Material, null as never)
          m.onBeforeRender(this as never, s, null as never, m.geometry, m.material as THREE.Material, null as never)
        }
      }
    }
    const before = THREE.Object3D.prototype.onBeforeRender
    const got = await countByPart(renderer as unknown as THREE.WebGLRenderer, scene, async () => {
      renderer.render(scene)
      renderer.render(other)
      renderer.render(scene)
    })
    expect(got.rows).toHaveLength(1)
    expect(got.rows[0]).toMatchObject({ part: 'keyboard', made: 'real and stand-in', meshes: 2, colour: 2, through: 0, shadow: { key: 2 }, calls: 4, triangles: 48 })
    expect(got.shadows).toEqual(['key'])
    expect(got.total).toEqual({ calls: 4, triangles: 48 })
    expect(own).toBe(2)
    expect(b.onBeforeRender).toBe(mine)
    expect(THREE.Object3D.prototype.onBeforeRender).toBe(before)
    expect(Object.prototype.hasOwnProperty.call(renderer, 'render')).toBe(false)
  })
})

describe('the table of the count', () => {
  const counts = {
    rows: [
      { part: 'turrets', names: ['turrets'], made: 'real', meshes: 47, colour: 47, through: 0, shadow: { dome: 18, key: 18 }, calls: 83, triangles: 22214 },
      { part: 'type', names: ['shell', 'type', 'keyboard', 'paper'], made: 'real', meshes: 63, colour: 63, through: 0, shadow: {}, calls: 63, triangles: 91036 }
    ],
    shadows: ['dome', 'key'],
    total: { calls: 146, triangles: 113250 },
    renderer: { drawCalls: 147, triangles: 113252 },
    other: { calls: 1, triangles: 2 }
  }
  it('has a row for each part, the sum, what is in no row and what the renderer counted', () => {
    const text = countsTable(counts, { limit: 100 } as never)
    const lines = text.split('\n')
    expect(lines[0]).toMatch(/^part +made +meshes +colour +shadow dome +shadow key +calls +triangles$/)
    expect(lines[2]).toMatch(/^turrets +real +47 +47 +18 +18 +83 +22214$/)
    expect(lines[3]).toMatch(/^type \(shell, type, keyboard and 1 more\) +real +63 +63 +0 +0 +63 +91036$/)
    expect(text).toMatch(/sum of the rows +110 +110 +18 +18 +146 +113250/)
    expect(text).toMatch(/not a mesh of the scene +1 +2/)
    expect(text).toMatch(/info\(\)\.counts +147 +113252/)
    expect(lines.at(-1)).toBe('147 draw calls against a limit of 100: 47 over')
  })
  it('shows the pass for materials that let light through only when something is drawn in it', () => {
    expect(countsTable(counts)).not.toMatch(/through/)
    expect(countsTable({ ...counts, rows: [{ ...counts.rows[0]!, through: 3 }] }).split('\n')[0]).toMatch(/colour +through +shadow dome/)
  })
  it('agrees when what is in no row is the engine\'s own few calls, and not when a row is missing or counted twice', () => {
    expect(countsAgree(counts)).toBe(true)
    expect(countsAgree({ ...counts, other: { calls: 40, triangles: 9000 } })).toBe(false)
    expect(countsAgree({ ...counts, other: { calls: -13, triangles: -26 } })).toBe(false)
  })
})
