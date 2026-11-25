import { describe, expect, it } from 'vitest'
import { BALL, COLS, SPIRAL, railOf, table } from '../src/table/layout'
import { localBalls, zone } from '../src/table/real/zone'
import { buckets } from '../src/table/real/models/street/geo'
import { garage, inTube, tube } from '../src/table/real/models/street/garage'
import { houses } from '../src/table/real/models/street/houses'
import { roadSign, streetThings } from '../src/table/real/models/street/things'
import { doorOf, hatchOf, parts } from '../src/table/real/models/street'
import { firehouse } from '../src/table/real/models/street/firehouse'
import { police } from '../src/table/real/models/street/police'
import { bank } from '../src/table/real/models/street/bank'
import { moms } from '../src/table/real/models/street/moms'
import type { RealContext } from '../src/real/types'

describe('the models of the street', () => {
  it('makes every one of its seven parts', () => {
    for (const id of ['model-firehouse', 'model-police', 'model-bank', 'model-garage', 'model-houses', 'model-moms', 'model-road-signs']) expect(parts[id], id).toBeTruthy()
  })

  it('hangs the firehouse door low at rest, runs it up on a held ball and keeps it up as the ball is fired out', () => {
    expect(doorOf([0, 9, 9]).raise).toBeCloseTo(0.35)
    expect(doorOf([1, 1, 9]).raise).toBeGreaterThan(0.9)
    expect(doorOf([1, 0.25, 9]).shake).toBeGreaterThan(0.1)
    expect(doorOf([0, 9, 0.2]).raise).toBeGreaterThan(0.9)
    expect(doorOf([0, 9, 0.2]).shake).toBeGreaterThan(0.1)
    expect(doorOf([0, 9, 3]).raise).toBeCloseTo(0.35)
    expect(doorOf([0, 9, 3]).shake).toBe(0)
  })

  it('opens the cellar doors while the hatch will take a ball and shuts them for good after', () => {
    expect(hatchOf([0, 9, 9, 1])).toEqual({ open: 1, light: 1 })
    expect(hatchOf([1, 1, 9, 0]).open).toBeLessThan(0.01)
    expect(hatchOf([0, 9, 0.3, 0]).open).toBeGreaterThan(0.9)
    expect(hatchOf([0, 9, 4, 0]).open).toBeLessThan(0.001)
    expect(hatchOf([0, 9, 4, 0]).light).toBe(0)
    expect(hatchOf([0, 9, 9, 0])).toEqual({ open: 0, light: 0 })
  })

  it('keeps the frame of the garage outside the trough and out of the tube of the ball', () => {
    const z = zone('street')
    const b = buckets()
    garage(b, z)
    const m = table.models.find((x) => x.id === 'street.garage')!
    const centre = localBalls(z, m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2)
    const trough = (SPIRAL.r + 0.5 + 0.125) * BALL
    const pts = tube(z)
    let n = 0
    for (const geo of [b.paint.done(), b.metal.done(), b.glow.done()]) {
      const p = geo.getAttribute('position')
      for (let i = 0; i < p.count; i++) {
        const r = Math.hypot(p.getX(i) - centre[0], p.getY(i) - centre[1])
        expect(r).toBeGreaterThan(trough + 4)
        // Under its base the garage has only the two stanchions that stand on the right wall.
        if (p.getZ(i) < (m.base ?? 0) * BALL - 3) expect(p.getX(i)).toBeGreaterThan(localBalls(z, COLS.right, 0)[0])
        expect(p.getZ(i)).toBeLessThan(((m.base ?? 0) + m.h) * BALL + 2)
        expect(inTube(pts, p.getX(i), p.getY(i), p.getZ(i), p.getZ(i))).toBe(false)
        n++
      }
    }
    expect(n).toBeGreaterThan(3000)
    // The path itself lies in the tube.
    const last = railOf('highway').points.at(-2)!
    const at = localBalls(z, last[0], last[1], last[2])
    expect(inTube(pts, at[0], at[1], at[2], at[2])).toBe(true)
  })

  it('builds six houses that differ and two signs on the sling posts', () => {
    const z = zone('street')
    const b = buckets()
    houses(b, z)
    streetThings(b, z)
    expect(b.paint.triangles).toBeGreaterThan(1500)
    expect(b.glow.triangles).toBeGreaterThan(100)
    const slings = table.slings.filter((s) => s.tier === 2)
    expect(slings.length).toBe(2)
    for (const s of slings) expect(roadSign(z, s).geo.triangles).toBeGreaterThan(200)
  })

  it('stays inside its share of the triangles', () => {
    const z = zone('street')
    const ctx = { byId: new Map() } as unknown as RealContext
    const b = buckets()
    const f = firehouse(b, z, ctx)
    police(b, z, ctx)
    bank(b, z, ctx)
    garage(b, z)
    houses(b, z)
    const m = moms(b, z, ctx)
    streetThings(b, z)
    const signs = table.slings.filter((s) => s.tier === 2).reduce((n, s) => n + roadSign(z, s).geo.triangles, 0)
    const total = b.paint.triangles + b.metal.triangles + b.glow.triangles + f.door.triangles + f.frame.triangles + m.door.triangles * 2 + m.light.triangles + signs + b.screws.length * 42
    expect(total).toBeLessThan(60000)
  })
})
