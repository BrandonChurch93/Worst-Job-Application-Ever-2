import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { quality, qualityIds } from '../src/core/quality'
import { keepsSmall, smallCount, smallOffset, SmallThings } from '../src/core/levelSmall'

const shares = qualityIds.map((id) => quality(id).particleFraction)

const emitter = (n: number, mark: 'each' | 'count'): THREE.InstancedMesh => {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), n)
  m.userData.small = mark
  m.name = 'sparks'
  return m
}
const pose = (m: THREE.InstancedMesh, n: number, t: number, setCount: boolean): void => {
  const at = new THREE.Matrix4()
  for (let i = 0; i < n; i++) m.setMatrixAt(i, at.makeTranslation(i, t, 0))
  if (setCount) m.count = n
  m.instanceMatrix.needsUpdate = true
}
const drawn = (m: THREE.InstancedMesh): number[] => Array.from({ length: m.count }, (_, i) => m.instanceMatrix.array[i * 16 + 12]!)

describe('the share of the small things a level draws', () => {
  it('is 1, 0.6 and 0.3 in the config', () => {
    expect(shares).toEqual([1, 0.6, 0.3])
  })

  it('keeps every one at a share of 1', () => {
    for (let i = 0; i < 200; i++) expect(keepsSmall(i, 1, 0.37)).toBe(true)
  })

  it('keeps close to the share of any emitter, small or large', () => {
    for (const share of [0.6, 0.3]) {
      for (const n of [8, 16, 20, 64, 300]) {
        for (const name of ['a', 'turret-1/sparks', 'slot-payout/']) {
          const off = smallOffset(name, 20261126)
          let kept = 0
          for (let i = 0; i < n; i++) if (keepsSmall(i, share, off)) kept++
          expect(Math.abs(kept - n * share)).toBeLessThanOrEqual(1.5)
        }
      }
    }
  })

  it('keeps at a lower share only things the higher share keeps', () => {
    const off = smallOffset('x', 7)
    for (let i = 0; i < 500; i++) if (keepsSmall(i, 0.3, off)) expect(keepsSmall(i, 0.6, off)).toBe(true)
  })

  it('gives a name the same offset every time and two names two offsets', () => {
    expect(smallOffset('step1.turret-2/sparks', 5)).toBe(smallOffset('step1.turret-2/sparks', 5))
    expect(smallOffset('step1.turret-2/sparks', 5)).not.toBe(smallOffset('step1.turret-3/sparks', 5))
    expect(smallOffset('a', 5)).not.toBe(smallOffset('a', 6))
  })

  it('never draws none of a geometry that holds some', () => {
    expect(smallCount(2, 0.3)).toBe(1)
    expect(smallCount(20, 0.3)).toBe(6)
    expect(smallCount(20, 1)).toBe(20)
  })
})

describe('the emitters of a scene at a level', () => {
  it('draws the same ones of an emitter from frame to frame', () => {
    const scene = new THREE.Scene()
    const m = emitter(20, 'each')
    scene.add(m)
    const small = new SmallThings()
    let first: number[] | null = null
    for (let t = 0; t < 30; t++) {
      pose(m, 20, t, false)
      small.apply(scene, 0.3, 1)
      const now = drawn(m)
      expect(Math.abs(now.length - 6)).toBeLessThanOrEqual(1)
      if (first) expect(now).toEqual(first)
      first = now
      expect(m.instanceMatrix.array[13]).toBe(t)
    }
  })

  it('leaves an emitter alone that its maker has not placed again', () => {
    const scene = new THREE.Scene()
    const m = emitter(20, 'each')
    scene.add(m)
    const small = new SmallThings()
    pose(m, 20, 0, false)
    small.apply(scene, 0.6, 1)
    const once = drawn(m)
    const version = m.instanceMatrix.version
    for (let i = 0; i < 5; i++) small.apply(scene, 0.6, 1)
    expect(drawn(m)).toEqual(once)
    expect(m.instanceMatrix.version).toBe(version)
  })

  it('follows the count of an emitter whose maker sets it', () => {
    const scene = new THREE.Scene()
    const m = emitter(16, 'count')
    scene.add(m)
    const small = new SmallThings()
    for (const n of [16, 10, 3, 0, 12]) {
      pose(m, n, n, true)
      small.apply(scene, 0.6, 1)
      const want = Array.from({ length: n }, (_, i) => i).filter((i) => keepsSmall(i, 0.6, smallOffset('/sparks', 1)))
      expect(drawn(m)).toEqual(want)
    }
  })

  it('moves what belongs to an instance with it', () => {
    const scene = new THREE.Scene()
    const m = emitter(10, 'each')
    const seeds = new THREE.InstancedBufferAttribute(Float32Array.from({ length: 10 }, (_, i) => i + 100), 1)
    m.geometry.setAttribute('aSeed', seeds)
    scene.add(m)
    pose(m, 10, 0, false)
    new SmallThings().apply(scene, 0.3, 1)
    for (let i = 0; i < m.count; i++) expect(seeds.array[i]).toBe(m.instanceMatrix.array[i * 16 + 12]! + 100)
  })

  it('gives every one back when the level goes up again, placed again or not', () => {
    const scene = new THREE.Scene()
    const a = emitter(20, 'each')
    const b = emitter(20, 'each')
    scene.add(a, b)
    const small = new SmallThings()
    pose(a, 20, 0, false)
    pose(b, 20, 0, false)
    small.apply(scene, 0.3, 1)
    pose(b, 20, 1, false)
    small.apply(scene, 1, 1)
    for (const m of [a, b]) expect(drawn(m)).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })

  it('goes from one share to another without losing a thing', () => {
    const scene = new THREE.Scene()
    const m = emitter(20, 'each')
    scene.add(m)
    const small = new SmallThings()
    pose(m, 20, 0, false)
    small.apply(scene, 0.3, 1)
    small.apply(scene, 0.6, 1)
    expect(drawn(m)).toEqual(Array.from({ length: 20 }, (_, i) => i).filter((i) => keepsSmall(i, 0.6, smallOffset('/sparks', 1))))
  })

  it('draws the front share of a geometry that holds its small things one after the other', () => {
    const scene = new THREE.Scene()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(20 * 4 * 3), 3))
    g.setIndex(Array.from({ length: 20 * 6 }, (_, i) => i % (20 * 4)))
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial())
    m.userData.small = 20
    scene.add(m)
    const small = new SmallThings()
    small.apply(scene, 0.3, 1)
    expect(g.drawRange).toMatchObject({ start: 0, count: 36 })
    small.apply(scene, 0.6, 1)
    expect(g.drawRange.count).toBe(72)
    small.apply(scene, 1, 1)
    expect(g.drawRange.count).toBe(Infinity)
  })

  it('touches nothing in a computed picture', () => {
    const scene = new THREE.Scene()
    const m = emitter(20, 'each')
    scene.add(m)
    pose(m, 20, 0, false)
    const version = m.instanceMatrix.version
    new SmallThings().apply(scene, 1, 1)
    expect(m.count).toBe(20)
    expect(m.instanceMatrix.version).toBe(version)
  })
})
