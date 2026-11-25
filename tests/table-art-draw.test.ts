import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { BALL, TIERS } from '../src/table/layout'
import { zone } from '../src/table/real/zone'
import { Floor } from '../src/table/real/art/floor'
import { INSERT_GLOW, insertCell, insertsOf } from '../src/table/real/art/inserts'
import { setGlow, windowGeometry } from '../src/table/real/art/windows'

const shape = { segments: 56, inset: 0.975 }

describe('the windows of a tier as one drawing', () => {
  test('one geometry holds the three windows, each in its own cell of the atlases', () => {
    for (const id of TIERS) {
      const z = zone(id)
      const { geometry, spans, ids } = windowGeometry(z, shape)
      const list = insertsOf(z.tier)
      expect(ids).toEqual(list.map((n) => n.id))
      expect(spans.length).toBe(3)
      const uv = geometry.getAttribute('uv')
      const at = geometry.getAttribute('position')
      let outside = 0
      let far = 0
      spans.forEach(([first, count], k) => {
        const [col, row] = insertCell(list[k]!)
        const cx = at.getX(first)
        const cy = at.getY(first)
        for (let i = first; i < first + count; i++) {
          const u = uv.getX(i) * 3 - col
          const v = (1 - uv.getY(i)) * 3 - row
          if (u < 0 || u > 1 || v < 0 || v > 1) outside++
          if (Math.hypot(at.getX(i) - cx, at.getY(i) - cy) > list[k]!.r * BALL + 1e-3) far++
        }
      })
      expect(outside).toBe(0)
      expect(far).toBe(0)
      expect(spans.reduce((n, s) => n + s[1], 0)).toBe(at.count)
      geometry.dispose()
    }
  })

  test('a window is lit alone, and nothing is sent when its level has not changed', () => {
    const { geometry, spans } = windowGeometry(zone(TIERS[1]!), shape)
    const a = geometry.getAttribute('wjaGlow') as THREE.BufferAttribute
    const before = a.version
    expect(setGlow(geometry, spans[1]!, INSERT_GLOW.off)).toBe(false)
    expect(a.version).toBe(before)
    expect(setGlow(geometry, spans[1]!, INSERT_GLOW.on)).toBe(true)
    expect(a.version).toBeGreaterThan(before)
    let wrong = 0
    spans.forEach(([first, count], k) => {
      for (let i = first; i < first + count; i++) if (Math.abs(a.getX(i) - (k === 1 ? INSERT_GLOW.on : INSERT_GLOW.off)) > 1e-6) wrong++
    })
    expect(wrong).toBe(0)
    geometry.dispose()
  })
})

describe('a floor is shown by its own rectangle', () => {
  const floorOf = (y: number) => {
    const f = new Floor(1920, 1080, 1)
    f.position.y = y
    f.add(new THREE.Mesh(new THREE.PlaneGeometry(1920, 1080)))
    f.updateMatrixWorld(true)
    return f
  }
  const camera = new THREE.PerspectiveCamera(20, 16 / 9, 10, 20000)
  camera.position.set(0, 0, 1080 / 2 / Math.tan((10 * Math.PI) / 180) - 40)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld(true)
  camera.updateProjectionMatrix()

  test('the floor under the camera is drawn and the one beside it is not, though its sphere reaches in', () => {
    const own = floorOf(0)
    const next = floorOf(-1100)
    own.update(camera)
    next.update(camera)
    expect(own.children[0]!.visible).toBe(true)
    expect(next.children[0]!.visible).toBe(false)
    const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
    expect(frustum.intersectsObject(next.children[0] as THREE.Mesh)).toBe(true)
  })

  test('a floor that comes back into view is drawn again', () => {
    const next = floorOf(-1100)
    next.update(camera)
    expect(next.children[0]!.visible).toBe(false)
    next.position.y = -900
    next.updateMatrixWorld(true)
    next.update(camera)
    expect(next.children[0]!.visible).toBe(true)
  })
})
