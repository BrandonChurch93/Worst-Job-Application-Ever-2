import crypto from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import { BALL, table } from '../src/table/layout'
import { prepare } from '../src/table/physics'
import { PLATE, WINDOW } from '../src/table/real/art/index'
import { INSERT_GLOW } from '../src/table/real/art/inserts'
import { windowGeometry } from '../src/table/real/art/windows'
import { lightAt, onGlass } from '../src/table/real/ball/lamps'
import { ANSWER, answer, near } from '../src/table/real/lights/levels'
import { OVER, risen, stepOver } from '../src/table/real/lights/over'
import { zone } from '../src/table/real/zone'

// The clear ball of the film on film frames 6213 to 6229, over the white window and on to the amber one, as the tree stood before this work (308e96a1): frame, place x and y in balls, speed x and y, and the two values of its roll.
const PATH: number[][] = [
  [6213, 12.558737, 44.423546, -6.87577, 12.816944, 0, 0],
  [6214, 12.430157, 44.630363, -9.021655, 11.650829, 0, 0],
  [6215, 12.21435, 44.662811, -13.316851, 1.218213, 0, 0],
  [6216, 11.992395, 44.68745, -13.316851, 1.708212, 0, 0],
  [6217, 11.770441, 44.720261, -13.316851, 2.198213, 0, 0],
  [6218, 11.548487, 44.761238, -13.316851, 2.688215, 0, 0],
  [6219, 11.326532, 44.810383, -13.316851, 3.178216, 0, 0],
  [6220, 11.104578, 44.867691, -13.316851, 3.668218, 0, 0],
  [6221, 10.882624, 44.933163, -13.316851, 4.158218, 0, 0],
  [6222, 10.660669, 45.006805, -13.316851, 4.648216, 0, 0],
  [6223, 10.438715, 45.088615, -13.316851, 5.138214, 0, 0],
  [6224, 10.216761, 45.178593, -13.316851, 5.628212, 0, 0],
  [6225, 9.994806, 45.276737, -13.316851, 6.11821, 0, 0],
  [6226, 9.772852, 45.383041, -13.316851, 6.608208, 0, 0],
  [6227, 9.550898, 45.497517, -13.316851, 7.098206, 0, 0],
  [6228, 9.328943, 45.620159, -13.316851, 7.588203, 0, 0],
  [6229, 9.106989, 45.750969, -13.316851, 8.078202, 0, 0]
]
// The plane the ball's own shadow is drawn on, in px over the floor (src/table/real/ball/index.ts, the decal's place).
const SHADOW_PLANE = 3.4
// Every film frame's saved state of the pinball page with the windows' count left out, as one number: what `node pipeline/phase5/polish-lamps-state.mjs` gives on 308e96a1 and on this tree.
const STATE = '4e4de23c7807426f'
const FIRST = 4020
const FRAMES = 2520
const STEP = 1 / 240
// The film frames on which some window has a ball in reach: the only frames of the film whose pictures differ from 308e96a1.
const CHANGED = 575
const context = (list: Shape[]): RealContext => ({ page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => {} })
const r6 = (n: number): number => Math.round(n * 1e6) / 1e6

interface Seen { film: number; id: string; gap: number; v: number[]; today: number; now: number; state: boolean }

describe('a ball over a window in the floor', () => {
  let stage: Stage
  const seen: Seen[] = []
  const quiet: number[] = []
  beforeAll(async () => {
    await prepare()
    stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    for (let f = 0; f < FRAMES; f++) {
      const frame = stage.frameAt(f / 60)
      const ctx = context(frame.list)
      const state = (stage.save() as { page: { s: { over?: Record<string, number> } } }).page.s.over
      const balls = frame.list.filter((s) => s.id.startsWith('ball.'))
      let any = false
      for (const n of table.inserts) {
        const w = ctx.byId.get(`insert.${n.id}`)
        if (!w) continue
        let gap = 9
        for (const b of balls) if (Math.abs(b.z0 - w.z0) <= 0.6 * b.w) gap = Math.min(gap, (Math.hypot(b.x + b.w / 2 - (w.x + w.w / 2), b.y + b.h / 2 - (w.y + w.h / 2)) - w.w / 2 - b.w / 2) / b.w)
        if (gap < ANSWER.reach) any = true
        seen.push({ film: FIRST + f, id: n.id, gap, v: w.v ?? [], today: near(ctx, `insert.${n.id}`, ANSWER.reach, 0.8), now: answer(ctx, `insert.${n.id}`), state: state !== undefined && `insert.${n.id}` in state })
      }
      if (!any && state === undefined) quiet.push(FIRST + f)
    }
  }, 240000)

  it('stands no higher than it stood: the glass 0.85 to 1.30 px over the floor the ball rolls on, under the plane of the ball\'s shadow', () => {
    const { geometry } = windowGeometry(zone('street'), WINDOW)
    const at = geometry.getAttribute('position')
    let low = 9
    let high = -9
    for (let i = 0; i < at.count; i++) {
      low = Math.min(low, at.getZ(i))
      high = Math.max(high, at.getZ(i))
    }
    expect(PLATE.z).toBe(0.5)
    expect(PLATE.z + WINDOW.lift + low).toBeCloseTo(0.85, 6)
    expect(PLATE.z + WINDOW.lift + high).toBeCloseTo(1.3, 6)
    expect(PLATE.z + WINDOW.lift + high).toBeLessThan(BALL / 60)
    expect(PLATE.z + WINDOW.lift + high).toBeLessThan(SHADOW_PLANE)
  })

  it('steps the machine and the page as before on every frame of the film: the saved state without the count is the same', () => {
    const h = crypto.createHash('sha256')
    const fresh = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    for (let f = 0; f < FRAMES; f++) {
      fresh.seek(f / 60)
      const saved = fresh.save() as { page: { s: Record<string, unknown> } }
      const { over: _count, ...rest } = saved.page.s
      h.update(JSON.stringify({ ...saved, page: { ...saved.page, s: rest } }))
    }
    expect(h.digest('hex').slice(0, 16)).toBe(STATE)
  }, 240000)

  it('draws a frame from a kept state as it draws it stepped from the start, in the middle of a rise', () => {
    const fresh = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    const straight = [6216, 6217, 6218].map((f) => JSON.stringify(fresh.frameAt((f - FIRST) / 60).list))
    const hashes = [6216, 6217, 6218].map((f) => {
      fresh.seek((f - FIRST) / 60)
      return fresh.hash()
    })
    const back = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    back.seek((6217 - FIRST) / 60)
    const kept = back.save()
    back.seek((6400 - FIRST) / 60)
    const other = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    other.restore(kept)
    other.seek((6218 - FIRST) / 60)
    expect(JSON.stringify(other.frameAt((6218 - FIRST) / 60).list)).toBe(straight[2])
    expect(other.hash()).toBe(hashes[2])
    for (const [i, f] of [6218, 6216, 6217].entries()) {
      expect(JSON.stringify(back.frameAt((f - FIRST) / 60).list)).toBe(straight[[2, 0, 1][i]!])
      back.seek((f - FIRST) / 60)
      expect(back.hash()).toBe(hashes[[2, 0, 1][i]!])
    }
    expect((kept as { page: { s: { over?: Record<string, number> } } }).page.s.over).toEqual({ 'insert.street.insert.3': 0.625 })
  }, 240000)

  it('leaves the ball its place, its speed and its roll across the white window and the amber one', () => {
    for (const row of PATH) {
      stage.seek((row[0]! - FIRST) / 60)
      const { s, m } = (stage.save() as { page: { s: { roll: number[] }; m: { balls: { x: number; y: number; vx: number; vy: number }[] } } }).page
      const b = m.balls[0]!
      expect([row[0], r6(b.x), r6(b.y), r6(b.vx), r6(b.vy), r6(s.roll[0]!), r6(s.roll[1]!)]).toEqual(row)
    }
  })

  it('brings the brighter light up over four frames from the frame the middle of the ball is over the glass', () => {
    const white = seen.filter((x) => x.id === 'street.insert.3' && x.film >= 6213 && x.film <= 6222)
    expect(white.map((x) => x.v[1])).toEqual([0, 0, 0.125, 0.375, 0.625, 0.875, 1, 1, 1, 1])
    expect(white.find((x) => x.gap <= -0.5)!.film).toBe(6215)
    const up = white.map((x) => x.now)
    for (let i = 3; i <= 6; i++) expect(up[i]!).toBeGreaterThan(up[i - 1]!)
    expect(up[2]!).toBeLessThan(0.06)
    expect(up[6]!).toBeGreaterThan(0.95)
    expect(risen(0)).toBe(0)
    expect(risen(1)).toBe(1)
    expect(Math.round(OVER.rise * 60)).toBeGreaterThanOrEqual(3)
    expect(Math.round(OVER.rise * 60)).toBeLessThanOrEqual(5)
  })

  it('never takes more than two fifths of the way up in one frame, on any frame of the film and for a ball that crosses in one frame', () => {
    let most = 0
    for (const n of table.inserts) {
      const rows = seen.filter((x) => x.id === n.id)
      for (let i = 1; i < rows.length; i++) most = Math.max(most, rows[i]!.now - rows[i - 1]!.now)
    }
    expect(most).toBeGreaterThan(0.1)
    expect(most).toBeLessThan(0.4)
    let k: number | undefined
    for (let i = 0; i < 4; i++) k = stepOver(k, -0.6, ANSWER.reach, STEP)
    expect(k).toBeCloseTo(0.25, 9)
    expect(risen(k!)).toBeLessThan(0.16)
    for (let i = 0; i < 4; i++) k = stepOver(k, 0.3, ANSWER.reach, STEP)
    expect(k).toBeCloseTo(0.25, 9)
    expect(stepOver(k, ANSWER.reach, ANSWER.reach, STEP)).toBeUndefined()
  })

  it('is never brighter than the place of the ball alone made it, and still rises under a ball', () => {
    for (const x of seen) expect(x.now).toBeLessThanOrEqual(x.today + 1e-12)
    expect(Math.max(...seen.map((x) => x.now))).toBeGreaterThan(0.95)
    expect(INSERT_GLOW.hit).toBe(1)
    expect(ANSWER.reach).toBe(0.55)
  })

  it('draws and saves what it did with no ball in reach of a window', () => {
    for (const x of seen) {
      if (x.gap >= ANSWER.reach) {
        expect(x.v.length).toBe(1)
        expect(x.state).toBe(false)
        expect(x.now).toBe(0)
        expect(x.today).toBe(0)
      } else {
        expect(x.v.length).toBe(2)
        expect(x.state).toBe(true)
      }
    }
    const changed = new Set(seen.filter((x) => x.gap < ANSWER.reach).map((x) => x.film))
    expect(changed.size).toBe(CHANGED)
    expect(quiet.length).toBe(FRAMES - changed.size)
    const shapes = (dx: number, v: number[]): Shape[] => {
      const n = table.inserts.find((q) => q.id === 'street.insert.3')!
      const R = n.r * BALL
      const f = -4 * BALL
      const win = { id: `insert.${n.id}`, part: 'table-lights', kind: 'disc', x: n.c[0] * BALL - R, y: n.c[1] * BALL - R, w: 2 * R, h: 2 * R, z0: f, z1: f + 3, tone: 'light', v } as Shape
      const ball = { id: 'ball.clear', part: 'clear-ball', kind: 'ball', x: n.c[0] * BALL + dx - BALL / 2, y: n.c[1] * BALL - BALL / 2, w: BALL, h: BALL, z0: f, z1: f + BALL, tone: 'glass' } as Shape
      const lights = { id: 'whole.table-lights.street', part: 'table-lights', kind: 'anchor', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 0, tone: 'dark', v: [1, 0.18, 0, 0, 0] } as Shape
      return [lights, win, ball]
    }
    const far = shapes(4 * BALL, [1])
    const light = lightAt(far[2]!, context(far))
    for (const l of light.lamps) expect(l.amount).toBe(l.rank)
    expect(onGlass(table.inserts[0]!.r * BALL + BALL / 2)).toBe(0)
    expect(onGlass(table.inserts[0]!.r * BALL)).toBe(1)
    const on = shapes(0, [1, 1])
    const under = lightAt(on[2]!, context(on)).lamps.filter((l) => l.window)
    expect(under.length).toBeGreaterThan(0)
    const nearest = under.reduce((p, q) => (Math.hypot(q.x, q.y) < Math.hypot(p.x, p.y) ? q : p))
    expect(Math.hypot(nearest.x, nearest.y)).toBeLessThan(1)
    expect(nearest.amount).toBeCloseTo(nearest.rank! * (1 - OVER.wall), 9)
    expect(nearest.shine).toBeCloseTo(0.9 * (1 - OVER.show), 9)
  })
})
