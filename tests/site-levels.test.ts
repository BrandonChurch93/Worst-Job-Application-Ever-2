import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { LightRig } from '../src/core/renderer'
import { quality, qualityIds } from '../src/core/quality'
import { levelPlan, REST_FRAMES, restSample } from '../src/core/levelPlan'
import { STILL, StillShadows } from '../src/core/levelShadows'
import { samples } from '../src/core/sampler'

describe('what a level asks of its shadows, its glass and its small things', () => {
  it('reads the three words of every level of the config', () => {
    expect(levelPlan('high')).toMatchObject({ shadows: 'accumulated', glass: 'refracting', particles: 1 })
    expect(levelPlan('medium')).toMatchObject({ shadows: 'filtered', glass: 'refracting', particles: 0.6 })
    expect(levelPlan('low')).toMatchObject({ shadows: 'baked', glass: 'frosted', particles: 0.3 })
    for (const id of qualityIds) expect(levelPlan(id).particles).toBe(quality(id).particleFraction)
  })

  it('gathers the whole area of the light at rest only where the level says accumulated', () => {
    const list = samples(64)
    for (const s of list) expect(restSample('accumulated', s)).toBe(s)
    for (const mode of ['filtered', 'baked'] as const) {
      const n = REST_FRAMES[mode]
      expect(n).toBeLessThan(64)
      for (const s of list) {
        const own = restSample(mode, s)
        if (s.index >= n) expect(own).toBeNull()
        else expect(own).toMatchObject({ index: s.index, count: n })
      }
    }
  })

  it('never moves the shadow map of a level that keeps its still shadows', () => {
    const list = samples(64)
    for (let i = 0; i < REST_FRAMES.baked; i++) expect(restSample('baked', list[i]!)!.texel).toEqual(list[0]!.texel)
  })

  it('holds the light in the middle through the frames of a page at rest and turns only the taps', () => {
    const rig = new LightRig()
    rig.setLevel('low')
    const list = samples(64)
    rig.place(list[0]!, undefined, true)
    const at = rig.key.position.clone()
    const camera = rig.key.shadow.camera.projectionMatrix.clone()
    const phases = new Set<number>()
    for (let i = 1; i < REST_FRAMES.baked; i++) {
      rig.place(restSample('baked', list[i]!)!, undefined, false, true)
      expect(rig.key.position.equals(at)).toBe(true)
      expect(rig.key.shadow.camera.projectionMatrix.equals(camera)).toBe(true)
      phases.add(rig.key.shadow.radius % 1)
    }
    expect(phases.size).toBe(REST_FRAMES.baked - 1)
  })
})

const fakeRenderer = (key: THREE.DirectionalLight, drawn: { passes: number[] }) =>
  ({
    getRenderTarget: () => null,
    setRenderTarget: () => {},
    render: () => {
      const px = key.shadow.mapSize.x
      if (!key.shadow.map) {
        const map = new THREE.WebGLRenderTarget(px, px)
        map.depthTexture = new THREE.DepthTexture(px, px)
        key.shadow.map = map
      }
      drawn.passes.push(key.shadow.camera.layers.mask)
    }
  }) as unknown as THREE.WebGLRenderer

function stage() {
  const scene = new THREE.Scene()
  const key = new THREE.DirectionalLight()
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.position.set(0, 0, 100)
  const box = (name: string): THREE.Mesh => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    m.name = name
    m.castShadow = true
    scene.add(m)
    return m
  }
  const drawn = { passes: [] as number[] }
  return { scene, key, box, drawn, renderer: fakeRenderer(key, drawn), still: new StillShadows() }
}

describe('the shadows a low level draws once and keeps', () => {
  it('keeps what stands and draws only what moves into the map of each frame', () => {
    const s = stage()
    const wall = s.box('wall')
    const dart = s.box('dart')
    for (let f = 0; f < STILL.holdFrames + 4; f++) {
      dart.position.x = f
      s.still.prepare(s.renderer, s.scene, s.key)
    }
    expect(s.still.stats.bakes).toBe(1)
    expect(s.still.stats.kept).toBe(1)
    expect(s.still.stats.movers).toBe(1)
    expect(wall.layers.isEnabled(1)).toBe(false)
    expect(dart.layers.isEnabled(1)).toBe(true)
    expect(wall.layers.isEnabled(0) && dart.layers.isEnabled(0)).toBe(true)
    expect(s.key.shadow.camera.layers.mask).toBe(2)
    expect(s.key.shadow.autoUpdate).toBe(false)
    expect(s.key.shadow.needsUpdate).toBe(true)
  })

  it('takes a thing in once it has come to rest, and lets it go the frame it moves again', () => {
    const s = stage()
    s.box('wall')
    const dart = s.box('dart')
    const run = (n: number, move: boolean) => {
      for (let f = 0; f < n; f++) {
        if (move) dart.position.x += 1
        s.still.prepare(s.renderer, s.scene, s.key)
      }
    }
    run(STILL.holdFrames + 2, true)
    expect(s.still.stats.kept).toBe(1)
    run(STILL.holdFrames + 2, false)
    expect(s.still.stats.kept).toBe(2)
    expect(s.still.stats.movers).toBe(0)
    const before = s.still.stats.bakes
    run(1, true)
    expect(s.still.stats.bakes).toBe(before + 1)
    expect(s.still.stats.kept).toBe(1)
    expect(s.still.stats.movers).toBe(1)
    expect(s.still.stats.liveFrames).toBe(STILL.holdFrames)
  })

  it('makes a thing that keeps breaking the kept map wait longer each time', () => {
    const s = stage()
    s.box('wall')
    const blink = s.box('blink')
    let bakes = 0
    for (let f = 0; f < 400; f++) {
      blink.visible = f % 40 < 20
      s.still.prepare(s.renderer, s.scene, s.key)
      if (f === 200) bakes = s.still.stats.bakes
    }
    expect(s.still.stats.bakes - bakes).toBeLessThanOrEqual(2)
  })

  it('draws the whole map while the light moves and keeps it again when the light stands', () => {
    const s = stage()
    s.box('wall')
    for (let f = 0; f < STILL.holdFrames + 2; f++) s.still.prepare(s.renderer, s.scene, s.key)
    expect(s.key.shadow.camera.layers.mask).toBe(2)
    for (let f = 0; f < 5; f++) {
      s.key.position.x += 1
      s.still.prepare(s.renderer, s.scene, s.key)
      expect(s.key.shadow.camera.layers.mask).toBe(1)
      expect(s.key.shadow.autoUpdate).toBe(true)
    }
    for (let f = 0; f < STILL.cameraFrames + 1; f++) s.still.prepare(s.renderer, s.scene, s.key)
    expect(s.key.shadow.camera.layers.mask).toBe(2)
  })

  it('bakes through a camera that sees only the things that stand', () => {
    const s = stage()
    s.box('wall')
    for (let f = 0; f < STILL.holdFrames + 2; f++) s.still.prepare(s.renderer, s.scene, s.key)
    expect(s.drawn.passes).toEqual([4])
  })

  it('gives the light back as it was for a picture that is not a live frame', () => {
    const s = stage()
    s.box('wall')
    for (let f = 0; f < STILL.holdFrames + 2; f++) s.still.prepare(s.renderer, s.scene, s.key)
    s.still.release(s.key)
    expect(s.key.shadow.camera.layers.mask).toBe(1)
    expect(s.key.shadow.autoUpdate).toBe(true)
    expect(s.scene.getObjectByName('kept-shadows')).toBeUndefined()
  })
})
