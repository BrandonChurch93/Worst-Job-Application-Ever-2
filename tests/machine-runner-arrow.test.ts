import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { sealedFit } from '../src/cursor/fit'
import { lookOf } from '../src/cursor/look'
import { boreRoom } from '../src/cursor/model/deform'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const BALL = config.table.ballPx
const TIGHT = 0.93
const NEAR = 1.5

const take = (() => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const rows: { time: number; reach: number; room: number; hold: number; off: number; centred: boolean; damage: string[]; acting: string; reaction: string | null }[] = []
  while (!s.finished && s.time < 42) {
    s.advance(1)
    const c = s.cursor.pose()
    const ball = (s.page.save() as { m: { balls: { x: number; y: number; z: number }[] } }).m.balls[0]
    if (c.inBall && ball) {
      const fit = sealedFit(c, s.time)
      rows.push({ time: s.time, reach: fit.r, room: boreRoom(lookOf(c, s.time).body.tremble), hold: fit.hold, off: Math.hypot(c.x - ball.x * BALL, c.y - ball.y * BALL, c.z + 1 - ball.z * BALL), centred: c.centred === true, damage: c.damage, acting: c.acting, reaction: c.reaction })
    }
  }
  return { rows, events: s.events.map((e) => ({ name: e.name, time: e.step / stepHz })) }
})()

describe('the arrow in the ball over the whole take', () => {
  it('sits on the middle of the ball and reaches no further than its room at every step', () => {
    expect(take.rows.length).toBeGreaterThan(30 * stepHz)
    for (const r of take.rows) {
      expect(r.centred, `at ${r.time.toFixed(2)} s`).toBe(true)
      expect(r.off, `at ${r.time.toFixed(2)} s`).toBeLessThan(NEAR)
      expect(r.reach, `at ${r.time.toFixed(2)} s, ${r.acting}, ${r.reaction}`).toBeLessThanOrEqual(r.room + 1e-9)
    }
  })

  it('is held smaller by the glass by less than a fourteenth, the doors aside', () => {
    const tight = new Map<string, number>()
    for (const r of take.rows) {
      if (r.hold >= TIGHT || r.damage.length > 0) continue
      const name = `${r.acting} ${r.reaction}`
      tight.set(name, Math.min(tight.get(name) ?? 1, r.hold))
    }
    expect([...tight].map(([name, hold]) => `${name} ${hold.toFixed(3)}`)).toEqual([])
  })

  it('is flattened in the ball by the doors of the headquarters alone', () => {
    const slam = take.events.filter((e) => e.name === 'doors-slam').map((e) => e.time)
    expect(slam.length).toBe(1)
    const flat = take.rows.filter((r) => r.damage.includes('flattened'))
    expect(flat.length).toBeGreaterThan(0)
    for (const r of flat) expect(r.time, `flattened at ${r.time.toFixed(2)} s`).toBeGreaterThanOrEqual(slam[0]! - 1 / stepHz)
    const last = flat[flat.length - 1]!.time
    const next = take.events.filter((e) => e.time > slam[0]! + 0.05 && ['bumper', 'sling', 'scoop-kick', 'ball-hit', 'ball-save', 'flipper-save', 'drain', 'tier-fall'].includes(e.name))[0]
    expect(next).toBeDefined()
    expect(last).toBeLessThan(next!.time)
    expect(take.rows.every((r) => r.damage.every((d) => d === 'flattened'))).toBe(true)
  })
})
