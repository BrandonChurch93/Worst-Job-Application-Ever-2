import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { arriveTurn, leaveSpeed, seatedAt, TURN } from '../src/stage/turn'
import { slabTurn } from '../src/core/renderer'

const QUARTER = Math.PI / 2
const DEG = Math.PI / 180

describe('the seat of the page turn', () => {
  const speed = (u: number): number => (arriveTurn(u + 1e-5) - arriveTurn(u - 1e-5)) / 2e-5

  it('never stops or turns back on the way in, and is fastest over its last third as it falls into the seat', () => {
    let last = arriveTurn(0)
    for (let i = 1; i <= 600; i++) {
      const now = arriveTurn((i / 600) * seatedAt() * 0.999999)
      expect(now).toBeGreaterThan(last)
      last = now
    }
    const end = speed(seatedAt() - 1e-4)
    for (let i = 20; i <= 39; i++) expect(speed((i / 40) * seatedAt())).toBeLessThanOrEqual(end + 1e-6)
    for (let i = 27; i < 39; i++) expect(speed(((i + 1) / 40) * seatedAt())).toBeGreaterThan(speed((i / 40) * seatedAt()))
  })

  it('meets the seat with the share of the hand over speed that is named, and is dead flat on the step of the knock', () => {
    expect(speed(seatedAt() - 1e-4) / leaveSpeed()).toBeCloseTo(TURN.land, 2)
    expect(Math.abs(arriveTurn(seatedAt()))).toBeLessThan(1e-12)
  })

  it('covers at least four degrees in each of its last three film frames, and springs back far enough to be seen in a small picture', () => {
    const frame = seatedAt() / 18
    for (let k = 1; k <= 3; k++) expect((arriveTurn(seatedAt() - (k - 1) * frame - 1e-9) - arriveTurn(seatedAt() - k * frame)) / DEG).toBeGreaterThan(4)
    expect(TURN.knocks[0].size).toBeGreaterThanOrEqual(2.5 * DEG)
    expect(TURN.knocks[1].size).toBeLessThan(TURN.knocks[0].size * 0.5)
    expect(arriveTurn(0)).toBeCloseTo(-QUARTER, 12)
  })
})

describe('what a turning page says to whoever draws it', () => {
  it('is nothing for a page that lies flat, and the angle and the axis for one that turns', () => {
    const scene = new THREE.Scene()
    expect(slabTurn(scene)).toBeNull()
    scene.userData.turn = { angle: 0, y: -300 }
    expect(slabTurn(scene)).toBeNull()
    scene.userData.turn = { angle: -0.4, y: -300 }
    expect(slabTurn(scene)).toEqual({ angle: -0.4, y: -300 })
  })
})
