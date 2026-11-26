import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { LightRig } from '../src/core/renderer'
import { samples } from '../src/core/sampler'

function mapOf(rig: LightRig): THREE.Matrix4 {
  const cam = rig.key.shadow.camera
  cam.position.copy(rig.key.position)
  cam.lookAt(rig.key.target.position)
  cam.updateMatrixWorld(true)
  return new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)
}

const along = (m: THREE.Matrix4, x: number, y: number): THREE.Vector4 => new THREE.Vector4(x, y, 0, 0).applyMatrix4(m)

describe('the key light\'s shadow map of a live frame that holds its light still', () => {
  it('lays the page\'s two axes along the rows and the columns of the map', () => {
    const rig = new LightRig()
    rig.setLevel('low')
    rig.place(samples(1)[0]!, undefined, false, true)
    const m = mapOf(rig)
    const right = along(m, 1, 0)
    const up = along(m, 0, 1)
    expect(Math.abs(right.y)).toBeLessThan(1e-9)
    expect(Math.abs(up.x)).toBeLessThan(1e-9)
    expect(Math.abs(right.x)).toBeGreaterThan(1e-6)
    expect(Math.abs(up.y)).toBeGreaterThan(1e-6)
  })

  it('still looks along the light: a step toward the light moves nothing on the map', () => {
    const rig = new LightRig()
    rig.setLevel('low')
    rig.place(samples(1)[0]!, undefined, false, true)
    const m = mapOf(rig)
    const toLight = rig.key.position.clone().sub(rig.key.target.position).normalize()
    const moved = new THREE.Vector4(toLight.x, toLight.y, toLight.z, 0).applyMatrix4(m)
    expect(Math.abs(moved.x)).toBeLessThan(1e-9)
    expect(Math.abs(moved.y)).toBeLessThan(1e-9)
  })

  it('keeps the whole page on show inside the map', () => {
    const rig = new LightRig()
    rig.setLevel('low')
    rig.place(samples(1)[0]!, undefined, false, true)
    const m = mapOf(rig)
    for (const [x, y] of [[-960, -540], [960, -540], [-960, 540], [960, 540]] as const) {
      const p = new THREE.Vector4(x, y, 0, 1).applyMatrix4(m)
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1)
    }
  })

  it('leaves the map of a computed picture as it was: upright and not leaning', () => {
    const rig = new LightRig()
    rig.setLevel(null)
    rig.place(samples(1)[0]!)
    const cam = rig.key.shadow.camera
    expect(cam.up.toArray()).toEqual([0, 1, 0])
    expect(rig.key.up.toArray()).toEqual([0, 1, 0])
    expect(cam.projectionMatrix.elements[4]).toBe(0)
    rig.setLevel('low')
    rig.place(samples(1)[0]!, undefined, false, true)
    rig.setLevel(null)
    rig.place(samples(1)[0]!)
    expect(cam.up.toArray()).toEqual([0, 1, 0])
    expect(cam.projectionMatrix.elements[4]).toBe(0)
  })
})
