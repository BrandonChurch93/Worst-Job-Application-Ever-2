import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { HANDOFF } from '../src/cursor/body'
import { pages } from '../src/pages'
import { LANDING } from '../src/pages/marketing/script'
import { filmFlow, filmOptions, ScriptDriver, Stage, TURN_HALF } from '../src/stage/stage'

const UNIT = config.film.units.find((u) => u.id === 'decision')!.seconds
const hover = config.scale.heights.cursorHover

describe('the landing back on the careers page', () => {
  const s = new Stage({ mode: 'film', flow: filmFlow('decision'), pages, driver: new ScriptDriver(), film: filmOptions('decision') })
  const poses: { t: number; x: number; y: number; z: number; squash: number; lean: number; spin: number; acting: string; reaction: string | null }[] = []
  let entered = 0
  for (let i = 0; i < Math.round(UNIT * stepHz); i++) {
    s.advance(1)
    if (s.page.id !== 'marketing') continue
    if (!entered) entered = i
    const p = s.cursor.pose()
    poses.push({ t: (i - entered) / stepHz, x: p.x, y: p.y, z: p.z, squash: p.squash, lean: p.lean, spin: p.spin, acting: p.acting, reaction: p.reaction })
  }
  const longest = (ok: (p: (typeof poses)[number]) => boolean): [number, number] => {
    let best: [number, number] = [0, 0]
    let from = -1
    poses.forEach((p, i) => {
      if (ok(p) && from < 0) from = i
      if (from >= 0 && (!ok(p) || i === poses.length - 1)) {
        if (p.t - poses[from]!.t > best[1] - best[0]) best = [poses[from]!.t, p.t]
        from = -1
      }
    })
    return best
  }
  const flat = longest((p) => p.z <= hover + 1 && p.squash < 0.72)
  const stood = longest((p) => p.z <= hover + 1 && p.reaction === null && Math.abs(p.x - HANDOFF.x) < 2 && p.t > flat[1])
  const leant = longest((p) => p.lean < -0.45 && p.x < HANDOFF.x - 20)

  it('comes down with the page and touches as it lies flat, not after', () => {
    expect(LANDING.lands).toBe(TURN_HALF)
    const touch = poses.find((p) => p.z <= hover + 1)!
    expect(touch.t).toBeLessThanOrEqual(LANDING.down + 0.03)
    expect(Math.max(...poses.filter((p) => p.t > touch.t).map((p) => p.z))).toBeLessThanOrEqual(hover + 2)
    expect(poses[0]!.z).toBeGreaterThan(200)
  })

  it('holds three poses long enough to be read: flat on landing, stood again, leant at the button', () => {
    expect(flat[1] - flat[0]).toBeGreaterThanOrEqual(0.4)
    expect(stood[1] - stood[0]).toBeGreaterThanOrEqual(0.4)
    expect(leant[1] - leant[0]).toBeGreaterThanOrEqual(0.4)
    expect(flat[1]).toBeLessThanOrEqual(stood[0])
    expect(stood[1]).toBeLessThanOrEqual(leant[0])
    const there = longest((p) => p.x < HANDOFF.x - 20)
    expect(there[1]).toBe(poses[poses.length - 1]!.t)
  })

  it('ends the film on the lean: over the last 0.3 s of the unit the arrow does not change its place or its pose, and the walk to the opening place is past the end', () => {
    const end = poses[poses.length - 1]!
    expect(LANDING.walk).toBeGreaterThan(end.t)
    const tail = poses.filter((p) => p.t >= end.t - 0.3)
    expect(tail.length).toBeGreaterThanOrEqual(Math.round(0.3 * stepHz))
    // Held: the same word, no reaction, the same height; the place within a hundredth of a pixel; the settling of the lean and the squash under 0.005 rad and 0.001.
    for (const p of tail) {
      expect([p.acting, p.reaction, p.y, p.z, p.spin]).toEqual([end.acting, end.reaction, end.y, end.z, end.spin])
      expect(Math.abs(p.x - end.x)).toBeLessThan(0.01)
      expect(Math.abs(p.lean - end.lean)).toBeLessThan(0.005)
      expect(Math.abs(p.squash - end.squash)).toBeLessThan(0.001)
    }
    expect(end.x).toBeCloseTo(HANDOFF.x - LANDING.step, 3)
    expect(end.reaction).toBeNull()
  })
})
