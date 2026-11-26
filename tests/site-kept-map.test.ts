import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { STILL, StillShadows, keptMap } from '../src/core/levelShadows'

// A renderer that does what three does in its shadow pass: a light without a map gets one, and the shadow camera's
// projection is set anew from its six numbers as the map is made. `always` makes it do so on its first pass whatever it finds.
const renderer = (key: THREE.DirectionalLight, seen: { projection: number[][]; maps: (THREE.WebGLRenderTarget | null)[] }, always = false) => {
  let first = true
  return {
    getRenderTarget: () => null,
    setRenderTarget: () => {},
    render: () => {
      const px = key.shadow.mapSize.x
      seen.maps.push(key.shadow.map as THREE.WebGLRenderTarget | null)
      if (!key.shadow.map || (always && first)) {
        if (!key.shadow.map) {
          const map = new THREE.WebGLRenderTarget(px, px)
          map.depthTexture = new THREE.DepthTexture(px, px)
          key.shadow.map = map
        }
        key.shadow.camera.updateProjectionMatrix()
      }
      first = false
      seen.projection.push(key.shadow.camera.projectionMatrix.toArray())
    }
  } as unknown as THREE.WebGLRenderer
}

// The renderer's own way with a low level's light: the six numbers, then a shear on top of the projection they give.
const aim = (key: THREE.DirectionalLight): number[] => {
  const cam = key.shadow.camera
  cam.left = -700
  cam.right = 900
  cam.top = 800
  cam.bottom = -800
  cam.near = 1400
  cam.far = 5400
  cam.updateProjectionMatrix()
  const shear = new THREE.Matrix4()
  shear.elements[4] = 0.37
  cam.projectionMatrix.multiply(shear)
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()
  return cam.projectionMatrix.toArray()
}

function stage(always = false) {
  const scene = new THREE.Scene()
  const key = new THREE.DirectionalLight()
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.position.set(-2252, 2076, 1247)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
  wall.castShadow = true
  scene.add(wall)
  const seen = { projection: [] as number[][], maps: [] as (THREE.WebGLRenderTarget | null)[] }
  return { scene, key, seen, renderer: renderer(key, seen, always), still: new StillShadows() }
}

describe('the map the kept shadows are drawn into', () => {
  it('is made with depths a plain read can take', () => {
    const map = keptMap(512)
    expect(map.width).toBe(512)
    expect(map.height).toBe(512)
    expect(map.depthTexture!.compareFunction).toBe(null)
    expect(map.depthTexture!.minFilter).toBe(THREE.NearestFilter)
    expect(map.depthTexture!.magFilter).toBe(THREE.NearestFilter)
    expect(map.depthTexture!.format).toBe(THREE.DepthFormat)
  })

  it('draws the first bake through the projection the renderer gave the light, shear and all', () => {
    const s = stage()
    let sheared: number[] = []
    for (let f = 0; f < STILL.holdFrames + 4; f++) {
      sheared = aim(s.key)
      s.still.prepare(s.renderer, s.scene, s.key)
    }
    expect(s.still.stats.bakes).toBe(1)
    expect(s.seen.projection.length).toBe(1)
    expect(s.seen.maps[0]).not.toBe(null)
    expect(s.seen.projection[0]).toEqual(sheared)
    expect(s.key.shadow.camera.projectionMatrix.toArray()).toEqual(sheared)
    expect(sheared[4]).not.toBe(0)
  })

  it('leaves the light its own map, and no map of its own making, after a bake', () => {
    const s = stage()
    const mine = new THREE.WebGLRenderTarget(1024, 1024)
    s.key.shadow.map = mine
    for (let f = 0; f < STILL.holdFrames + 4; f++) {
      aim(s.key)
      s.still.prepare(s.renderer, s.scene, s.key)
    }
    expect(s.still.stats.bakes).toBe(1)
    expect(s.key.shadow.map).toBe(mine)
    expect(s.seen.maps[0]).not.toBe(mine)
  })

  it('puts the projection back and draws the bake once more when a pass changes it', () => {
    const s = stage(true)
    let sheared: number[] = []
    for (let f = 0; f < STILL.holdFrames + 4; f++) {
      sheared = aim(s.key)
      s.still.prepare(s.renderer, s.scene, s.key)
    }
    expect(s.still.stats.bakes).toBe(1)
    expect(s.seen.projection.length).toBe(2)
    expect(s.seen.projection[0]).not.toEqual(sheared)
    expect(s.seen.projection[1]).toEqual(sheared)
    expect(s.key.shadow.camera.projectionMatrix.toArray()).toEqual(sheared)
    expect(s.seen.maps[1]).toBe(s.seen.maps[0])
  })
})
