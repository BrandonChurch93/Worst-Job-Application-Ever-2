import { describe, expect, it } from 'vitest'
import { PAPER, SLOT } from '../src/pages/step1/layout'
import { GRID, solveSheet, stretchOf, type SheetIn } from '../src/pages/step1/real/paperSolve'
import { CASSETTE, crest, openOf, panelsOf, riseOf } from '../src/pages/step1/real/shredderShape'

const c = crest(1)
const base: SheetIn = {
  w: PAPER.w, l: PAPER.h, x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h, bw: PAPER.w, bh: PAPER.h, rot: 0, z: 21,
  lift: 0, bite: 0, amount: 0, pull: 0, lx: SLOT.cx - 52, ly: SLOT.cy - 240, rx: SLOT.cx + 52, ry: SLOT.cy - 240, hz: 27, vx: 0, vy: 0, hands: 0,
  cx: c.x, cy: c.y, cz: c.z, r: CASSETTE.roller.r, rise: 1, seed: 7
}

const cases: [string, Partial<SheetIn>][] = [
  ['lying flat, no machine', { z: 0.6, rise: 0, cz: 0 }],
  ['carried and swung', { z: 35, lift: 1, vx: 900, vy: -400, rise: 0, cz: 0 }],
  ['lying over the risen cassette', {}],
  ['half bitten', { bite: 0.5, amount: 0.05 }],
  ['bitten and held taut', { bite: 1, hands: 1, amount: 0.1, pull: 0.6 }],
  ['hauled hard to one side', { bite: 1, hands: 1, amount: 0.25, pull: 1, lx: SLOT.cx - 170, ly: SLOT.cy - 150, rx: SLOT.cx - 100, ry: SLOT.cy - 228 }],
  ['hands pushed in, slack standing up', { bite: 1, hands: 1, amount: 0.1, pull: 0.1, ly: SLOT.cy - 120, ry: SLOT.cy - 130 }],
  ['hands further than the sheet is long', { bite: 1, hands: 1, amount: 0.5, pull: 1, ly: SLOT.cy - 380, ry: SLOT.cy - 380 }],
  ['nearly eaten', { bite: 1, hands: 1, amount: 0.86, pull: 0.8, ly: SLOT.cy - 60, ry: SLOT.cy - 60 }],
  ['let go while it is drawn in', { bite: 1, hands: 0, amount: 0.6 }],
  ['hands letting go', { bite: 1, hands: 0.4, amount: 0.4, pull: 0.3 }]
]

describe('the sheet of paper', () => {
  it('solves to the same sheet for the same numbers', () => {
    for (const [, over] of cases) {
      const a = solveSheet({ ...base, ...over })
      solveSheet({ ...base, bite: 1, hands: 1, amount: 0.7, pull: 1 })
      const b = solveSheet({ ...base, ...over })
      expect(Array.from(b.pos)).toEqual(Array.from(a.pos))
      expect(Array.from(b.nor)).toEqual(Array.from(a.nor))
    }
  })

  it('solves into a sheet it is handed without keeping anything of the last solve', () => {
    const kept = solveSheet({ ...base, bite: 1, hands: 1, amount: 0.3, pull: 1 })
    const fresh = solveSheet({ ...base, ...cases[5]![1] })
    const reused = solveSheet({ ...base, ...cases[5]![1] }, kept)
    expect(Array.from(reused.pos)).toEqual(Array.from(fresh.pos))
  })

  it('stays inside its length: no edge of the grid is more than 2% longer than the paper', () => {
    for (const [name, over] of cases) {
      const s = solveSheet({ ...base, ...over })
      expect(stretchOf(s, PAPER.w, PAPER.h), name).toBeLessThanOrEqual(0.02)
    }
  })

  it('has no point that is not a number, and normals of length one', () => {
    for (const [name, over] of cases) {
      const s = solveSheet({ ...base, ...over })
      expect(s.pos.length, name).toBe(GRID.nx * GRID.ny * 3)
      for (let i = 0; i < s.pos.length; i += 3) {
        expect(Number.isFinite(s.pos[i]! + s.pos[i + 1]! + s.pos[i + 2]!), name).toBe(true)
        expect(Math.hypot(s.nor[i]!, s.nor[i + 1]!, s.nor[i + 2]!), name).toBeCloseTo(1, 4)
      }
    }
  })

  it('stays over the page: a held sheet does not dive under the surface or fly off', () => {
    for (const [name, over] of cases) {
      const s = solveSheet({ ...base, ...over })
      let lo = Infinity
      let hi = -Infinity
      for (let i = 2; i < s.pos.length; i += 3) {
        lo = Math.min(lo, s.pos[i]!)
        hi = Math.max(hi, s.pos[i]!)
      }
      expect(lo, name).toBeGreaterThan(-2)
      expect(hi, name).toBeLessThan(140)
    }
  })
})

describe('the shredder', () => {
  it('opens its panels before the cassette comes up, and stops at its full height', () => {
    expect(panelsOf(0)).toBe(0)
    expect(riseOf(0.3)).toBe(0)
    expect(panelsOf(0.55)).toBe(1)
    expect(riseOf(1)).toBe(1)
    expect(crest(1).z).toBeGreaterThanOrEqual(30)
    expect(openOf(undefined)).toBe(0)
  })
})
