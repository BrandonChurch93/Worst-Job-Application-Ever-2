import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { EVENT_TRAIL, applyView, coverOf, eventFade, greyToHeight, heightToGrey, idColour, isView, layoutBoxes, lightGroups, standInColour, views, type ViewContext } from '../src/diagnostics/views'
import type { LayoutNode } from '../src/copy'
import type { Shape } from '../src/stage/types'

const tree: LayoutNode = { id: 'page', kind: 'page', box: [0, 0, 1920, 1080], children: [{ id: 'a', kind: 'field', box: [10, 20, 300, 40] }, { id: 'b', kind: 'card', box: [10, 80, 300, 200], children: [{ id: 'c', kind: 'button', box: [20, 90, 100, 40] }] }] }
const run: Shape = { id: 'a.label', part: 'shell', kind: 'text', x: 10, y: 20, w: 100, h: 20, z0: 0, z1: 0, tone: 'ink', words: 'copy:a', type: { font: 'sans', px: 16 } }

function world(): { ctx: ViewContext; meshes: THREE.Mesh[]; materials: THREE.Material[]; key: THREE.DirectionalLight; dome: THREE.DirectionalLight; glow: THREE.MeshStandardMaterial } {
  const scene = new THREE.Scene()
  scene.environmentIntensity = 0.7
  const glow = new THREE.MeshStandardMaterial({ emissive: new THREE.Color(1, 1, 0), emissiveIntensity: 2 })
  const materials: THREE.Material[] = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial(), glow, new THREE.MeshStandardMaterial()]
  const data: Record<string, unknown>[] = [{ standIn: 'table-layout' }, { standIn: 'bumpers', shape: 'bumper.1' }, { standIn: 'table-lights', shape: 'lamp.1' }, { standIn: 'shell', type: 'copy:a' }]
  const meshes = materials.map((m, i) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m)
    Object.assign(mesh.userData, data[i])
    scene.add(mesh)
    return mesh
  })
  const key = new THREE.DirectionalLight(0xffffff, 3)
  key.name = 'key'
  const dome = new THREE.DirectionalLight(0xffffff, 1.5)
  dome.name = 'dome'
  scene.add(key, dome)
  const ctx: ViewContext = {
    scene, camera: new THREE.PerspectiveCamera(30, 16 / 9, 1, 5000), width: 1920, height: 1080, pose: { eye: [0, 0, 2000], target: [0, 0, 0], fov: 30 }, layout: tree, list: [run],
    events: [{ name: 'bolt', x: 100, y: 100, hitsCursor: true, age: 0 }, { name: 'click', x: 300, y: 100, hitsCursor: false, age: 12 }], lights: [key, dome], table: () => null,
    colliders: () => [{ id: 'w', kind: 'wall', tier: 'office', points: [0, 0, 100, 0], z: -96 }, { id: 'p', kind: 'post', tier: 'office', points: [50, 50], z: -96, r: 12 }, { id: 's', kind: 'sling', tier: 'office', points: [0, 0, 10, 0, 10, 10], z: -96, closed: true }],
  }
  return { ctx, meshes, materials, key, dome, glow }
}

describe('the names of the views', () => {
  it('are the twelve of the kit', () => {
    expect([...views].sort()).toEqual(['beauty', 'colliders', 'coverage', 'events', 'height', 'ids', 'layout', 'lights', 'shadow', 'standins', 'texels', 'type'])
  })
  it('take a light group after `lights` and nothing else', () => {
    expect(isView('lights')).toBe(true)
    expect(isView('lights.dome')).toBe(true)
    expect(isView('lights.')).toBe(false)
    expect(isView('ids.dome')).toBe(false)
    expect(isView('nothing')).toBe(false)
  })
})

describe('what a view leaves behind', () => {
  it('is nothing at all for beauty', () => {
    const w = world()
    const children = w.ctx.scene.children.length
    expect(applyView('beauty', w.ctx)).toBeUndefined()
    expect(w.meshes.map((m) => m.material)).toEqual(w.materials)
    expect(w.ctx.scene.children.length).toBe(children)
  })
  for (const view of [...views.filter((v) => v !== 'beauty'), 'lights.dome']) {
    it(`is the scene as it was, after ${view}`, () => {
      const w = world()
      const children = [...w.ctx.scene.children]
      const restore = applyView(view, w.ctx)
      expect(typeof restore).toBe('function')
      ;(restore as () => void)()
      w.meshes.forEach((m, i) => expect(m.material).toBe(w.materials[i]))
      expect(w.ctx.scene.children).toEqual(children)
      expect(w.ctx.scene.background).toBeNull()
      expect(w.ctx.scene.environmentIntensity).toBe(0.7)
      expect(w.key.intensity).toBe(3)
      expect(w.dome.intensity).toBe(1.5)
      expect(w.glow.emissiveIntensity).toBe(2)
    })
  }
  it('throws for a view that does not exist and for a light group that does not exist', () => {
    const w = world()
    expect(() => applyView('nothing', w.ctx)).toThrow(/No diagnostic view/)
    expect(() => applyView('lights.neon', w.ctx)).toThrow(/No light group called "neon"/)
  })
})

describe('what each view does to the scene', () => {
  const colourOf = (m: THREE.Mesh) => (m.material as THREE.MeshBasicMaterial).color.toArray().map((v) => Number(v.toFixed(4)))
  it('ids paints each part in its own colour', () => {
    const w = world()
    applyView('ids', w.ctx)
    expect(colourOf(w.meshes[0]!)).toEqual(idColour('table-layout').map((v) => Number(v.toFixed(4))))
    expect(new Set(w.meshes.map((m) => colourOf(m).join())).size).toBe(4)
  })
  it('standins paints each stand-in in its own colour', () => {
    const w = world()
    applyView('standins', w.ctx)
    expect(colourOf(w.meshes[1]!)).toEqual(standInColour('bumpers').map((v) => Number(v.toFixed(4))))
  })
  it('coverage paints the floor black and what marks it white', () => {
    const w = world()
    applyView('coverage', w.ctx)
    expect(w.meshes.map((m) => colourOf(m)[0])).toEqual([0, 1, 1, 1])
  })
  it('type paints the type black, the rest white, and adds a box for each run', () => {
    const w = world()
    const before = w.ctx.scene.children.length
    applyView('type', w.ctx)
    expect(w.meshes.map((m) => colourOf(m)[0])).toEqual([1, 1, 1, 0])
    expect(w.ctx.scene.children.length).toBe(before + 1)
  })
  it('layout adds one box for each node of the tree and leaves the materials', () => {
    const w = world()
    const before = w.ctx.scene.children.length
    applyView('layout', w.ctx)
    expect(w.ctx.scene.children.length).toBe(before + 4)
    w.meshes.forEach((m, i) => expect(m.material).toBe(w.materials[i]))
  })
  it('events adds a ring for each event and a cross for those of this frame', () => {
    const w = world()
    const before = w.ctx.scene.children.length
    applyView('events', w.ctx)
    expect(w.ctx.scene.children.length).toBe(before + 4)
  })
  it('colliders adds the shapes it is given', () => {
    const w = world()
    const before = w.ctx.scene.children.length
    applyView('colliders', w.ctx)
    expect(w.ctx.scene.children.length).toBe(before + 1 + 1 + 3)
  })
  it('lights leaves one group lit and puts the glow of the others out', () => {
    const w = world()
    applyView('lights', w.ctx)
    expect([w.key.intensity, w.dome.intensity, w.ctx.scene.environmentIntensity, w.glow.emissiveIntensity]).toEqual([3, 0, 0, 0])
    const again = world()
    applyView('lights.dome', again.ctx)
    expect([again.key.intensity, again.dome.intensity]).toEqual([0, 1.5])
  })
  it('lights keeps the glow of a mesh that belongs to the group', () => {
    const w = world()
    w.meshes[2]!.userData.lightGroup = 'key'
    applyView('lights.key', w.ctx)
    expect(w.glow.emissiveIntensity).toBe(2)
  })
  it('texels gives every mesh the untextured shade when nothing has a texture', () => {
    const w = world()
    applyView('texels', w.ctx)
    expect(new Set(w.meshes.map((m) => m.material)).size).toBe(1)
    expect((w.meshes[0]!.material as THREE.ShaderMaterial).fragmentShader).toContain('vec4(0.0, 0.0, coc(), 1.0)')
  })
  it('texels gives a textured mesh a shade that knows the size of its texture', () => {
    const w = world()
    const map = new THREE.DataTexture(new Uint8Array(4 * 8 * 4), 8, 4)
    ;(w.materials[1] as THREE.MeshStandardMaterial).map = map
    applyView('texels', w.ctx)
    const shade = w.meshes[1]!.material as THREE.ShaderMaterial
    expect(shade.uniforms.size!.value.toArray()).toEqual([8, 4])
    expect(shade).not.toBe(w.meshes[0]!.material)
  })
})

describe('the numbers behind the views', () => {
  it('an id colour is fully bright in one channel, and two names differ', () => {
    for (const name of ['shell', 'keyboard-deck', 'bumpers', 'cursor-body', 'unnamed']) expect(Math.max(...idColour(name))).toBe(1)
    expect(idColour('shell')).not.toEqual(idColour('bumpers'))
  })
  it('height and grey turn into each other', () => {
    expect(heightToGrey(0)).toBe(0.5)
    for (const z of [-576, -96, -6, 14, 42, 96, 300]) expect(greyToHeight(heightToGrey(z))).toBeCloseTo(z, 6)
    expect(heightToGrey(42)).toBeGreaterThan(heightToGrey(24))
    expect(heightToGrey(-8)).toBeLessThan(0.5)
  })
  it('light groups come from the name or from what the light says', () => {
    const a = { name: 'key', userData: {} }
    const b = { name: '', userData: {} }
    const c = { name: 'x', userData: { lightGroup: 'marquee' } }
    const d = { name: 'y', userData: { lightGroup: 'marquee' } }
    expect(lightGroups([a, b, c, d])).toEqual(['key', 'light-2', 'marquee'])
  })
  it('a mesh may say what it is to the coverage view', () => {
    expect(coverOf({ standIn: 'table-layout' })).toBe('floor')
    expect(coverOf({ standIn: 'table-layout', shape: 'flat.1' })).toBe('mark')
    expect(coverOf({ standIn: 'table-layout', type: 'copy:x' })).toBe('mark')
    expect(coverOf({ standIn: 'bumpers', coverage: 'none' })).toBe('none')
    expect(coverOf({ standIn: 'playfield', coverage: 'floor' })).toBe('floor')
  })
  it('the boxes of the layout tree are all its nodes', () => {
    expect(layoutBoxes(tree).map((n) => n.id)).toEqual(['page', 'a', 'b', 'c'])
    expect(layoutBoxes(null)).toEqual([])
  })
  it('an older event is fainter and never gone', () => {
    expect(eventFade(0)).toBe(1)
    expect(eventFade(10)).toBeLessThan(eventFade(5))
    expect(eventFade(EVENT_TRAIL * 2)).toBeGreaterThan(0)
  })
})
