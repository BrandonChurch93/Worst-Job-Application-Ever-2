import { beforeAll, describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { real } from '../src/real'
import { OWNED } from '../src/table/real'
import { isAnchor, local, localBalls, localOf, whole, zone, zoneOf, zones } from '../src/table/real/zone'
import { LIT_ZONES, ZONES, anchorId, fixedShapes, movingShapes, zoneAt } from '../src/table/draw'
import { Machine, prepare } from '../src/table/physics'
import { lit } from '../src/table/real/light'
import { ask, askedFiles } from '../src/table/real/assets'
import { BALL, TIERS, TIER_Y, floorZ, table } from '../src/table/layout'
import { standInsOf } from '../src/shell/view'
import type { Frame } from '../src/stage/stage'
import type { Shape } from '../src/stage/types'
import type { RealContext } from '../src/real/types'
import parts from '../parts/PARTS.json'

const anchors = fixedShapes().filter(isAnchor)
const ctxOf = (list: Shape[]): RealContext => ({ page: 'step3', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 5976, light: () => undefined })

describe('the anchors of the table', () => {
  test('the zones cover the page of step 3 from top to bottom with no gap', () => {
    let y = 0
    for (const z of ZONES) {
      expect(z.y).toBeCloseTo(y, 9)
      y = z.y + z.h
    }
    expect(y * BALL).toBeCloseTo(5976, 6)
    TIERS.forEach((id, k) => {
      expect(zone(id).top).toBeCloseTo(TIER_Y[k]! * BALL, 9)
      expect(zone(id).floor).toBeCloseTo(floorZ(k) * BALL, 9)
      expect(zone(id).tier).toBe(k)
    })
    expect(zone('apron').tier).toBe(-1)
  })

  test('every part with a shape in a zone has one anchor there, spanning the zone at its floor', () => {
    const ids = new Set(anchors.map((s) => s.id))
    expect(ids.size).toBe(anchors.length)
    for (const s of fixedShapes()) {
      if (s.kind === 'well' || s.kind === 'anchor') continue
      const at = zoneAt(s.y + s.h / 2)
      expect(s.part === 'table-lights' ? LIT_ZONES.includes(at) : ids.has(anchorId(s.part, at)), `${s.id} of ${s.part}`).toBe(true)
    }
    for (const a of anchors) {
      const z = zoneOf(a)
      expect([a.x, a.y, a.w, a.h, a.z0, a.z1]).toEqual([0, z.top, 1920, z.height, z.floor, z.floor])
    }
    for (const tier of TIERS) for (const part of ['tier-art', 'table-frame', 'table-hardware', 'flippers', 'targets', 'lift', 'displays']) expect(ids.has(anchorId(part, tier)), `${part} in ${tier}`).toBe(true)
    expect(ids.has(anchorId('model-notes', 'corporate'))).toBe(true)
    for (const part of ['marquee', 'displays']) expect(ids.has(anchorId(part, 'marquee'))).toBe(true)
    expect(anchors.some((a) => a.part === 'table-lights')).toBe(false)
  })

  test('the anchors come before everything else in the list', () => {
    const list = fixedShapes()
    const first = list.findIndex((s) => s.kind !== 'anchor')
    expect(list.slice(first).some((s) => s.kind === 'anchor')).toBe(false)
  })

  test('a place on the page lands in the frame of its zone', () => {
    const z = zone('office')
    expect(local(z, 960, z.top + z.height / 2, z.floor)).toEqual([0, 0, 0])
    expect(local(z, 0, z.top, 0)).toEqual([-960, z.height / 2, -z.floor])
    expect(localBalls(z, 10, TIER_Y[1]!)).toEqual([0, z.height / 2, 0])
    const s = fixedShapes().find((x) => x.part === 'bumpers')!
    const p = localOf(z, s)
    expect(p[0]).toBeCloseTo(s.x + s.w / 2 - 960, 9)
    expect(p[2]).toBeCloseTo(s.z0 - z.floor, 9)
  })
})

describe('the makers of the table', () => {
  beforeAll(async () => {
    await prepare()
  })

  test('every part of the pinball unit that is drawn has a folder, and no folder claims a part twice', () => {
    const owned = Object.values(OWNED).flat()
    expect(new Set(owned).size).toBe(owned.length)
    const drawn = new Set(fixedShapes().filter((s) => s.kind !== 'well').map((s) => s.part))
    drawn.add('clear-ball')
    for (const name of drawn) expect(owned, name).toContain(name)
    const register = new Set((parts as { parts: { name: string; unit: string }[] }).parts.filter((p) => p.unit === 'pinball').map((p) => p.name))
    for (const name of owned) expect(register.has(name), name).toBe(true)
    for (const name of owned) expect(name in real.parts, name).toBe(true)
  })

  test('an anchor nobody answers keeps its part on the list of stand-ins, and is never drawn as a solid', () => {
    const anchor = fixedShapes().find((s) => s.id === anchorId('tier-art', 'office'))!
    const frame = { list: [anchor], cursor: {} as Frame['cursor'], cursors: [], turn: 0, scroll: 0, page: 'step3', view: null } as Frame
    const names = standInsOf(frame, { width: 1920, height: 5976 })
    expect(names.includes('tier-art')).toBe(real.parts['tier-art'] === null || real.parts['tier-art']!.key(anchor, ctxOf([anchor])) === null)
  })

  test('a part built whole answers its anchors with a key and its single shapes with nothing to draw', () => {
    const list = fixedShapes()
    const ctx = ctxOf(list)
    let built = 0
    const maker = whole('bumpers', {
      version: 'v1',
      build: (z) => {
        built++
        const g = new THREE.Group()
        g.name = z.id
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()))
        return g
      }
    })
    const anchor = list.find((s) => s.id === anchorId('bumpers', 'office'))!
    const single = list.find((s) => s.part === 'bumpers' && s.kind !== 'anchor')!
    expect(maker.key(anchor, ctx)).toBe(`v1|${anchor.id}`)
    expect(maker.key(single, ctx)).toBe('')
    expect(maker.make(anchor, ctx).name).toBe('office')
    expect(built).toBe(1)
    const empty = whole('bumpers', { version: 'v1', build: () => new THREE.Group() })
    expect(() => empty.make(anchor, ctx)).toThrow(/built nothing/)
  })

  test('the lights have a moving anchor in the marquee and in each tier, which carries the two levels', async () => {
    const m = new Machine()
    const moving = movingShapes(m, table.inserts.map(() => false), true, [true, false, true], 0, false, 0.18)
    const mine = moving.filter((s) => s.kind === 'anchor')
    expect(mine.map((s) => s.id)).toEqual(LIT_ZONES.map((z) => anchorId('table-lights', z)))
    expect(mine.map((s) => s.v)).toEqual([[1, 0.18], [1, 0.18], [0, 0.18], [1, 0.18]])
    const flipper = moving.find((s) => s.id.startsWith('flipper.'))!
    expect(Math.abs(flipper.v![0]!)).toBeLessThan(1)
    expect(Math.abs(flipper.v![0]!)).toBeGreaterThan(0.3)
    for (const id of ['plunger.rod', 'hq.door.left']) expect(moving.find((s) => s.id === id)!.v).toEqual([0])
    for (const s of moving) if (/^(target|lamp|insert)\./.test(s.id)) expect(s.v!.length).toBe(1)
  })

  test('a material passes through the hook of the lights and comes back the same material', () => {
    const material = new THREE.MeshStandardMaterial()
    expect(lit(material, zone('street'))).toBe(material)
  })

  test('a picture is named from table/ on, asked for one way only, and not ready before it is loaded', () => {
    expect(() => ask('art/floor.webp', { colour: true })).toThrow(/table\//)
    const a = ask('table/test/floor.webp', { colour: true })
    expect(a.ready()).toBe(false)
    expect(() => a.texture()).toThrow(/not loaded/)
    expect(() => ask('table/test/floor.webp', { colour: false })).toThrow(/two ways/)
    expect(askedFiles()).toContain('table/test/floor.webp')
  })

  test('the zones of the helper are the zones of the draw list', () => {
    expect(zones.map((z) => z.id)).toEqual(ZONES.map((z) => z.id))
  })
})
