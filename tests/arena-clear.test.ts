import { describe, expect, it } from 'vitest'
import type { ViewBreak } from '../src/boss/view'
import { FALLEN } from '../src/boss/plan'
import { ARENA, PAGE, PANES, PILLARS } from '../src/arena/layout'
import { KEEP, LYING, RUBBLE_EACH, SHARDS_EACH, columnLie, nearKeep, rubbleRest, shardRest } from '../src/arena/clear'
import { SCORCH, chipsOf, scorchFrom } from '../src/arena/scorch'

// The Builder's ruling of 01:54Z: no piece of the arena lies on, in front of or within 140 px of the arrow's stand (440, 650), of the line from it to the button (960, 650) or of the kneel spot, from finish-arms to the page turn.
// Every blast of the cannon is over by then, so what is asked is where each loose piece comes to rest. The lists below are the whole lists: the low, medium and high levels all draw them in full (the levels thin sparks, smoke, dust and the chips of the last blast, never the wreck).
const LEVELS = ['low', 'medium', 'high'] as const
const SEEDS = [20261124, 7, 991]

// Blasts of the cannon through a place from every side, and a few that only pass near it.
const blasts = (x: number, y: number): ViewBreak[] => {
  const out: ViewBreak[] = []
  let id = 1
  for (let a = 0; a < 24; a++) {
    for (const miss of [0, 22, -22]) {
      const ux = Math.cos((a * Math.PI) / 12), uy = Math.sin((a * Math.PI) / 12)
      const cx = x - uy * miss, cy = y + ux * miss
      out.push({ id: id++, at: 10, x0: cx - ux * 420, y0: cy - uy * 420, x1: cx + ux * 380, y1: cy + uy * 380 } as ViewBreak)
    }
  }
  return out
}

describe('arena kept ground', () => {
  it('knows the stand, the kneel spot and the button, and measures from all three', () => {
    expect(KEEP.stand).toEqual({ x: 440, y: 650 })
    expect(KEEP.button).toEqual({ x: FALLEN.x, y: FALLEN.y })
    expect(KEEP.clear).toBe(140)
    expect(nearKeep(440, 650).d).toBe(0)
    expect(nearKeep(700, 650).d).toBe(0)
    expect(nearKeep(816, 656).d).toBeCloseTo(6)
    expect(nearKeep(700, 500).d).toBeCloseTo(150)
    expect(nearKeep(300, 650).d).toBeCloseTo(140)
    expect(nearKeep(1100, 650).d).toBeCloseTo(140)
  })

  for (const level of LEVELS) {
    it(`lays no toppled column, no rubble and no shard of glass within 140 px of it, whatever blast broke them (${level})`, () => {
      let columns = 0, lumps = 0, shards = 0, moved = 0
      for (const seed of SEEDS) {
        PILLARS.forEach((p, i) => {
          for (const k of blasts(p.x, p.y)) {
            const lie = columnLie(seed, i, k)
            expect(Math.hypot(lie.dx, lie.dy)).toBeCloseTo(1)
            if (lie.off !== LYING.off) moved++
            for (let s = lie.off; s <= lie.off + LYING.long + 0.01; s += LYING.long / 32) {
              const x = p.x + lie.dx * s, y = p.y + lie.dy * s
              expect(nearKeep(x, y).d).toBeGreaterThanOrEqual(KEEP.clear + ARENA.pillar.side / 2 - 1e-6)
              expect(x > 0 && x < PAGE.w && y > 0 && y < PAGE.h).toBe(true)
            }
            columns++
            for (let j = 0; j < RUBBLE_EACH; j++) {
              const r = rubbleRest(seed, i, j, k)
              expect(nearKeep(r.x, r.y).d).toBeGreaterThanOrEqual(KEEP.clear + r.size / 2 - 1e-6)
              lumps++
            }
          }
        })
        PANES.forEach((p, i) => {
          for (const k of blasts(p.x, (p.y0 + p.y1) / 2)) {
            for (const at of [p.y0, (p.y0 + p.y1) / 2, 650, p.y1]) {
              for (let j = 0; j < SHARDS_EACH; j++) {
                const r = shardRest(seed, i, j, k, at)
                expect(nearKeep(r.x, r.y).d).toBeGreaterThanOrEqual(KEEP.clear + r.size / 2 - 1e-6)
                shards++
              }
            }
          }
        })
      }
      expect(columns).toBe(SEEDS.length * PILLARS.length * 72)
      expect(lumps).toBe(columns * RUBBLE_EACH)
      expect(shards).toBe(SEEDS.length * PANES.length * 72 * 4 * SHARDS_EACH)
      // The pillar nearest the line has its piece thrown clear of it.
      expect(moved).toBeGreaterThan(0)
    })
  }

  it('says which standing things of the approved layout lie nearer than 140 px, and that nothing else of it does', () => {
    // These stand where the approved picture has them and are not moved: the pillar at (563, 722), whether whole or a stump, and the pane at x 372, whether whole or its teeth.
    const near = PILLARS.filter((p) => nearKeep(p.x, p.y).d < KEEP.clear + ARENA.pillar.foot / 2).map((p) => `${p.x},${p.y}`)
    expect(near).toEqual(['563,722'])
    expect(nearKeep(563, 722).d).toBeCloseTo(72)
    const panes = PANES.filter((p) => nearKeep(p.x, Math.max(p.y0, Math.min(p.y1, 650))).d < KEEP.clear).map((p) => p.x)
    expect(panes).toEqual([372])
    expect(nearKeep(372, 650).d).toBeCloseTo(68)
  })

  it('throws the chips of the last blast beside the trench and never onto the stand or the kneel spot', () => {
    // The chips are the blast's own and lie along its trench, as in the approved picture; they are small and flat. None lies within 50 px of where the arrow stands or kneels.
    for (const seed of SEEDS) {
      const s = scorchFrom({ x0: KEEP.stand.x, y0: KEEP.stand.y, x1: KEEP.button.x, y1: KEEP.button.y })
      for (const c of chipsOf(s, seed, SCORCH.chips)) {
        expect(Math.hypot(c.x - KEEP.stand.x, c.y - KEEP.stand.y)).toBeGreaterThan(50)
        expect(Math.hypot(c.x - KEEP.kneel.x, c.y - KEEP.kneel.y)).toBeGreaterThan(50)
      }
    }
  })
})
