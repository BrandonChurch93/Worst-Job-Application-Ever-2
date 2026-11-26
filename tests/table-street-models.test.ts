import { describe, expect, it } from 'vitest'
import { BALL, holdOf, table } from '../src/table/layout'
import { localBalls, zone } from '../src/table/real/zone'
import { buckets } from '../src/table/real/models/street/geo'
import { DOOR, MOUTH, firehouse } from '../src/table/real/models/street/firehouse'
import { garageLamps, inTube, tube } from '../src/table/real/models/street/garage'
import { doorOf } from '../src/table/real/models/street'
import type { RealContext } from '../src/real/types'

const ctx = { byId: new Map() } as unknown as RealContext

describe('the second build of the street models', () => {
  it('leaves the bay of the firehouse free for a ball, from the hold to the back of the bay', () => {
    const z = zone('street')
    const m = table.models.find((x) => x.id === 'street.firehouse')!
    const bay = m.bay!
    const b = buckets()
    const f = firehouse(b, z, ctx)
    const hold = holdOf('street.firehouse')
    const front = m.box[1] + m.box[3]
    const balls: [number, number, number][] = []
    for (const v of [hold.c[1], front, front - bay[2] + 0.5]) {
      const c = localBalls(z, (bay[0] + bay[1]) / 2, v)
      balls.push([c[0], c[1], BALL / 2])
    }
    const clear = (x: number, y: number, zz: number): boolean => balls.every((c) => Math.hypot(x - c[0], y - c[1], zz - c[2]) > BALL / 2 - 0.5)
    let n = 0
    for (const geo of [b.paint.done(), b.metal.done(), f.bay.done()]) {
      const p = geo.getAttribute('position')
      for (let i = 0; i < p.count; i++) {
        if (p.getZ(i) < 1) continue
        expect(clear(p.getX(i), p.getY(i), p.getZ(i)), `${p.getX(i)}, ${p.getY(i)}, ${p.getZ(i)}`).toBe(true)
        n++
      }
    }
    expect(n).toBeGreaterThan(10000)
    // The door hangs over the ball at rest and is out of the mouth while a ball is held.
    const door = f.door.done().getAttribute('position')
    for (const raise of [doorOf([0, 9, 9]).raise, doorOf([1, 1, 9]).raise]) {
      for (let i = 0; i < door.count; i++) expect(clear(door.getX(i) + f.doorAt[0], door.getY(i) + f.doorAt[1], door.getZ(i) + f.doorAt[2] + raise * f.travel)).toBe(true)
    }
    expect(doorOf([1, 1, 9]).raise * DOOR.travel).toBeGreaterThan(MOUTH.h)
    expect(MOUTH.h).toBeGreaterThan(BALL + 4)
    expect(f.beacon[2]).toBeLessThan(m.h * BALL)
  })

  it('hangs the lamps of the garage inside its layout height and out of the way of the ball', () => {
    const z = zone('street')
    const m = table.models.find((x) => x.id === 'street.garage')!
    const pts = tube(z)
    const lamps = garageLamps(z)
    expect(lamps.length).toBeGreaterThanOrEqual(5)
    for (const l of lamps) {
      expect(l.z).toBeGreaterThan((m.base ?? 0) * BALL)
      expect(l.z + 16).toBeLessThan(((m.base ?? 0) + m.h) * BALL)
      expect(inTube(pts, l.at[0], l.at[1], l.z, l.z + 16)).toBe(false)
    }
  })
})
