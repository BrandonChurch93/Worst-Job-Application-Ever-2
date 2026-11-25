import { describe, expect, it } from 'vitest'
import { table } from '../src/table/layout'
import { zone } from '../src/table/real/zone'
import { buckets } from '../src/table/real/models/street/geo'
import { garage } from '../src/table/real/models/street/garage'
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

  it('holds the firehouse door half raised at rest, shut on a held ball and up as the ball is fired out', () => {
    expect(doorOf([0, 9, 9]).raise).toBeCloseTo(0.5)
    expect(doorOf([1, 1, 9]).raise).toBeLessThan(0.01)
    expect(doorOf([0, 9, 0.2]).raise).toBeGreaterThan(0.9)
    expect(doorOf([0, 9, 0.2]).shake).toBeGreaterThan(0.1)
    expect(doorOf([0, 9, 3]).raise).toBeCloseTo(0.5)
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

  it('keeps the garage inside the turns of the spiral', () => {
    const z = zone('street')
    const b = buckets()
    garage(b, z)
    const g = b.paint.done()
    g.computeBoundingBox()
    const box = g.boundingBox!
    const reach = (box.max.x - box.min.x) / 2
    const rail = table.rails.find((r) => r.id === 'spiral')!
    const m = table.models.find((x) => x.id === 'street.garage')!
    const radius = Math.hypot(rail.points[0]![0] - (m.box[0] + m.box[2] / 2), rail.points[0]![1] - (m.box[1] + m.box[3] / 2)) * 96
    expect(reach).toBeLessThan(radius - 48)
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
