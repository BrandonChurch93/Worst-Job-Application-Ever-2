import { describe, expect, it } from 'vitest'
import { config, stepHz, unitStart } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'
import { zoneAt } from '../src/table/draw'
import { railOf } from '../src/table/layout'
import { piped } from '../src/table/real/ball'
import { line, TUBE } from '../src/table/real/frame/loader'
import { groupsOf } from '../src/table/real/lights'
import { zone } from '../src/table/real/zone'

const BALL = config.table.ballPx
const EACH = stepHz / 60

interface Row { frame: number; time: number; x: number; y: number; z0: number; r: number; lit: boolean; piped: boolean }

const rows = ((): Row[] => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const out: Row[] = []
  let n = 0
  while (!s.finished && s.time < 43) {
    s.advance(1)
    n++
    if (n % EACH !== 0) continue
    const list: DrawList = []
    s.page.draw(list)
    const b = list.find((x) => x.id === 'ball.clear')
    if (!b) continue
    const x = b.x + b.w / 2
    const y = b.y + b.h / 2
    const r = b.w / 2
    const z = zone(zoneAt(y))
    const lit = groupsOf(z).length > 0 && Math.max(0, b.z0 - z.floor) < r * 6
    out.push({ frame: Math.round((unitStart('pinball') + s.time) * 60), time: s.time, x, y, z0: b.z0, r, lit, piped: piped(x, y, b.z0 + r) })
  }
  return out
})()

if (process.env.SHADOW_TRACE) console.log(JSON.stringify(rows.filter((r) => r.lit && r.piped).map((r) => [r.frame, +r.time.toFixed(3), Math.round(r.x), Math.round(r.y)])))

describe('the ball\'s drawn shadow and the feed tube', () => {
  it('finds a ball on the feed rail inside the tube, from the port to the outlet', () => {
    const pts = railOf('feed').points
    for (let i = 1; i < pts.length - 1; i++) expect(piped(pts[i]![0] * BALL, pts[i]![1] * BALL, pts[i]![2] * BALL + BALL / 2)).toBe(true)
    const way = line()
    for (const p of way) expect(piped(p[0], p[1], p[2])).toBe(true)
  })

  it('finds a ball beside the tube, over it, or past its end outside', () => {
    const way = line()
    const a = way[2]!
    expect(piped(a[0] + TUBE.outer, a[1], a[2])).toBe(false)
    expect(piped(a[0], a[1], a[2] + TUBE.outer)).toBe(false)
    const pts = railOf('feed').points
    const end = pts[pts.length - 1]!
    const before = pts[pts.length - 2]!
    const out = [0, 1, 2].map((c) => (end[c]! + (end[c]! - before[c]!)) * BALL + (c === 2 ? BALL / 2 : 0))
    expect(piped(out[0]!, out[1]!, out[2]!)).toBe(false)
  })

  it('had the shadow on in the film while the ball was in the tube, and has it off there now', () => {
    const was = rows.filter((r) => r.lit && r.piped)
    expect(was.length).toBeGreaterThan(0)
    for (const r of was) expect(r.y).toBeGreaterThan(1080)
    const start = Math.round(unitStart('pinball') * 60)
    expect([was[0]!.frame - start, was[was.length - 1]!.frame - start]).toEqual([500, 771])
    const after = rows.filter((r) => r.lit && !r.piped)
    expect(after.length).toBeGreaterThan(0)
    expect(after[0]!.frame - start).toBe(772)
    expect(rows.filter((r) => r.piped && r.frame > start + 771).length).toBe(0)
    const end = railOf('feed').points[railOf('feed').points.length - 1]!
    expect(Math.hypot(after[0]!.x - end[0] * BALL, after[0]!.y - end[1] * BALL)).toBeLessThan(BALL / 4)
  })
})
