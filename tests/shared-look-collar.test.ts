import { describe, expect, it } from 'vitest'
import { collar, outlineOf } from '../src/shell/solids'

const areaOf = (g: ReturnType<typeof collar>): number => {
  const p = g.getAttribute('position')
  const idx = g.getIndex()!
  let sum = 0
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i)
    const b = idx.getX(i + 1)
    const c = idx.getX(i + 2)
    sum += Math.abs((p.getX(b) - p.getX(a)) * (p.getY(c) - p.getY(a)) - (p.getX(c) - p.getX(a)) * (p.getY(b) - p.getY(a))) / 2
  }
  return sum
}

const holeArea = (o: ReturnType<typeof outlineOf>): number => {
  let sum = 0
  for (let i = 0; i < o.count; i++) {
    const j = (i + 1) % o.count
    sum += o.x[i]! * o.y[j]! - o.x[j]! * o.y[i]!
  }
  return Math.abs(sum) / 2
}

describe('the flat of the slab round a pocket', () => {
  for (const [name, plan] of [
    ['a long capsule', { kind: 'capsule', w: 1440, h: 36.4, r: 18.2 }],
    ['a tall capsule', { kind: 'capsule', w: 30, h: 400, r: 15 }],
    ['a rounded field', { kind: 'rect', w: 420, h: 64, r: 12 }],
    ['a disc', { kind: 'disc', w: 80, h: 80, r: 40 }]
  ] as const) {
    it(`fills its whole tile round ${name}, with no gap along an edge`, () => {
      const hole = outlineOf(plan, 0, 12)
      const hw = plan.w / 2 + 1
      const hh = plan.h / 2 + 1
      const g = collar(hw, hh, hole)
      expect(areaOf(g)).toBeCloseTo(hw * 2 * hh * 2 - holeArea(hole), 1)
    })
  }
})
