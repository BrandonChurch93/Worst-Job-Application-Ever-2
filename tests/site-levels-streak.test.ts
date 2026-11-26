import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { isCoins, STREAK, streakOf, Streaks } from '../src/core/levelStreak'

const coins = (n: number): { scene: THREE.Scene; mesh: THREE.InstancedMesh; pose: (at: [number, number, number][]) => void } => {
  const scene = new THREE.Scene()
  const root = new THREE.Group()
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(5, 8, 6), new THREE.MeshBasicMaterial(), n)
  root.userData.coins = mesh
  root.add(mesh)
  scene.add(root)
  const m = new THREE.Matrix4()
  const pose = (at: [number, number, number][]): void => {
    at.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p[0], p[1], p[2])))
    mesh.count = at.length
    mesh.instanceMatrix.needsUpdate = true
  }
  return { scene, mesh, pose }
}
const column = (mesh: THREE.InstancedMesh, i: number, c: number): number[] => Array.from(mesh.instanceMatrix.array.slice(i * 16 + c * 4, i * 16 + c * 4 + 3))

describe('the stretch of small fast things in a live frame', () => {
  it('leaves a thing that stands as it is and never makes one longer than the cap', () => {
    expect(streakOf(0, 10, 0.5)).toBe(1)
    expect(streakOf(0.1, 10, 0.5)).toBe(1)
    expect(streakOf(10, 10, 0.5)).toBeCloseTo(1.5, 9)
    expect(streakOf(1000, 10, 0.5)).toBe(STREAK.most)
  })

  it('draws a coin longer along the way it went and no wider across it', () => {
    const c = coins(4)
    const s = new Streaks()
    c.pose([[0, 0, 0], [50, 0, 0]])
    s.apply(c.scene, 0.5, isCoins)
    expect(column(c.mesh, 0, 0)).toEqual([1, 0, 0])
    c.pose([[0, -10, 0], [50, 0, 0]])
    s.apply(c.scene, 0.5, isCoins)
    expect(column(c.mesh, 0, 1)[1]).toBeCloseTo(1.5, 6)
    expect(column(c.mesh, 0, 0)).toEqual([1, 0, 0])
    expect(column(c.mesh, 0, 3)).toEqual([0, -10, 0])
    expect(column(c.mesh, 1, 1)).toEqual([0, 1, 0])
  })

  it('does not stretch a coin in the frame it appears', () => {
    const c = coins(4)
    const s = new Streaks()
    c.pose([[0, 0, 0]])
    s.apply(c.scene, 0.5, isCoins)
    c.pose([[0, 0, 0], [300, 300, 0]])
    s.apply(c.scene, 0.5, isCoins)
    expect(column(c.mesh, 1, 0)).toEqual([1, 0, 0])
    expect(column(c.mesh, 1, 1)).toEqual([0, 1, 0])
  })

  it('touches nothing that is not marked', () => {
    const c = coins(2)
    const s = new Streaks()
    c.pose([[0, 0, 0]])
    s.apply(c.scene, 0.5, () => false)
    c.pose([[0, 40, 0]])
    s.apply(c.scene, 0.5, () => false)
    expect(column(c.mesh, 0, 1)).toEqual([0, 1, 0])
  })

  it('gives the coins back as the page placed them before a computed picture', () => {
    const c = coins(2)
    const s = new Streaks()
    c.pose([[0, 0, 0]])
    s.apply(c.scene, 0.5, isCoins)
    c.pose([[0, 40, 0]])
    s.apply(c.scene, 0.5, isCoins)
    expect(column(c.mesh, 0, 1)[1]).toBeGreaterThan(1)
    s.release()
    expect(column(c.mesh, 0, 1)).toEqual([0, 1, 0])
    expect(column(c.mesh, 0, 3)).toEqual([0, 40, 0])
  })
})
