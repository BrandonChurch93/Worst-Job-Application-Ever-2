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
  const poses: { t: number; x: number; z: number; squash: number; lean: number; reaction: string | null }[] = []
  let entered = 0
  for (let i = 0; i < Math.round(UNIT * stepHz); i++) {
    s.advance(1)
    if (s.page.id !== 'marketing') continue
    if (!entered) entered = i
    const p = s.cursor.pose()
    poses.push({ t: (i - entered) / stepHz, x: p.x, z: p.z, squash: p.squash, lean: p.lean, reaction: p.reaction })
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
    console.log('flat', flat, 'stood', stood, 'leant', leant, 'ends', poses[poses.length - 1]!.t)
    expect(flat[1] - flat[0]).toBeGreaterThan(0.3)
    expect(stood[1] - stood[0]).toBeGreaterThan(0.3)
    expect(leant[1] - leant[0]).toBeGreaterThan(0.3)
    expect(flat[1]).toBeLessThanOrEqual(stood[0])
    expect(stood[1]).toBeLessThanOrEqual(leant[0])
    expect(leant[1]).toBe(poses[poses.length - 1]!.t)
  })
})
