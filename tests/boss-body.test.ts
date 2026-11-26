import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { COLLAPSE_SECONDS, FALLEN, HOME, SOCKET, UNFOLD } from '../src/boss/plan'
import { collapseRig, crackRuns, drawRig, drawSmoke, drawSocket, fightRig, muzzleAt, restRig, unfoldRig, CANNON_OFF, HOLE_H, HOLE_W, MUZZLE } from '../src/boss/body'
import { bossBody } from '../src/boss/real/body'
import { bossTransform, crackGeometry, puffPixels, sootPixels, wispPoint, PUFF_PX, SOOT_H, SOOT_W } from '../src/boss/real/transform'
import { cutPlate, lathe, screw } from '../src/boss/real/body-kit'
import type { Shape } from '../src/stage/types'

const list = (rig: ReturnType<typeof restRig>): Shape[] => {
  const out: Shape[] = []
  drawRig(out, rig)
  return out
}

const sound = (g: THREE.BufferGeometry): void => {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  expect(p.count).toBeGreaterThan(0)
  for (let i = 0; i < p.count; i++) {
    expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i))).toBe(true)
    if (n) expect(Math.hypot(n.getX(i), n.getY(i), n.getZ(i))).toBeCloseTo(1, 2)
  }
}

describe('the body of the boss', () => {
  it('draws the same pieces from the same numbers', () => {
    const a = list(fightRig(HOME.x, HOME.y, null, [0.4, 0], 0.3))
    const b = list(fightRig(HOME.x, HOME.y, null, [0.4, 0], 0.3))
    expect(a).toEqual(b)
    const roles = new Set(a.map((s) => s.role))
    for (const r of ['bossLeg', 'bossSide', 'bossFrame', 'bossShield', 'bossCannon', 'bossCap']) expect(roles.has(r)).toBe(true)
    expect(a.filter((s) => s.role === 'bossLeg').length).toBe(4)
    expect(a.filter((s) => s.role === 'bossCannon').length).toBe(2)
    expect(a.filter((s) => s.role === 'bossSide').length).toBe(2)
  })

  it('keeps every number finite through the unfolding and the collapse', () => {
    const rigs = []
    for (let u = 0; u <= UNFOLD.end + 0.01; u += 0.05) rigs.push(unfoldRig(u))
    const stand = fightRig(HOME.x, HOME.y, null)
    for (let c = 0; c <= COLLAPSE_SECONDS + 0.01; c += 0.05) rigs.push(collapseRig(stand, c))
    for (const rig of rigs) {
      for (const s of list(rig)) {
        for (const n of [s.x, s.y, s.w, s.h, s.z0, s.z1, s.rot ?? 0, ...(s.v ?? [])]) expect(Number.isFinite(n)).toBe(true)
      }
    }
  })

  it('brings no piece into being away from the page: each starts at the socket or at the progress bar', () => {
    const first = (pick: (r: ReturnType<typeof restRig>) => { k: number; x: number; y: number }): { x: number; y: number } => {
      for (let u = 0; u <= UNFOLD.end; u += 0.01) {
        const s = pick(unfoldRig(u))
        if (s.k > 0.01) return s
      }
      throw new Error('never shown')
    }
    const at = unfoldRig(UNFOLD.plates[0]).cap
    const plate = first((r) => r.plate)
    expect(Math.hypot(plate.x - at.x, plate.y - at.y)).toBeLessThan(40)
    for (const i of [0, 1]) {
      const side = first((r) => r.sides[i]!)
      expect(Math.hypot(side.x - SOCKET.x, side.y - SOCKET.y)).toBeLessThan(60)
      const cannon = first((r) => r.cannons[i]!)
      expect(cannon.y).toBeLessThan(140)
    }
    const shield = first((r) => r.shield)
    const body = unfoldRig(UNFOLD.shield[0] + 0.02).cap
    expect(Math.abs(shield.x - body.x)).toBeLessThan(200)
  })

  it('ends the collapse flat on the page at the fallen place', () => {
    const end = collapseRig(fightRig(HOME.x, HOME.y, null), COLLAPSE_SECONDS)
    expect(end.cap.x).toBeCloseTo(FALLEN.x, 3)
    expect(Math.abs(end.cap.y - FALLEN.y)).toBeLessThan(0.5)
    expect(end.cap.rot).toBeCloseTo(FALLEN.rot, 3)
    expect(end.hurt).toBe(1)
    for (const s of [end.plate, end.shield, ...end.sides, ...end.cannons]) expect(s.flat).toBeCloseTo(1, 5)
  })

  it('keeps the mouth of each barrel where the slabs leave', () => {
    const rig = fightRig(HOME.x, HOME.y, null)
    rig.cannons.forEach((c, i) => {
      expect(c.x).toBeCloseTo(HOME.x + CANNON_OFF[i]![0], 5)
      expect(c.y).toBeCloseTo(HOME.y + CANNON_OFF[i]![1], 5)
      expect(c.rot).toBe(0)
      const level = muzzleAt(HOME.x, HOME.y, i)
      expect(level.x).toBeCloseTo(c.x - MUZZLE.reach, 5)
      expect(level.y).toBeCloseTo(c.y, 5)
    })
    const aim = { x: HOME.x - 400, y: HOME.y + 300 }
    const turned = fightRig(HOME.x, HOME.y, null, [0, 0], 0, { aim })
    turned.cannons.forEach((c, i) => {
      const m = muzzleAt(HOME.x, HOME.y, i, aim)
      expect(c.rot).toBe(m.rot)
      expect(Math.abs(m.rot)).toBeLessThanOrEqual(MUZZLE.turn)
      expect(Math.hypot(m.x - c.x, m.y - c.y)).toBeCloseTo(MUZZLE.reach, 5)
      expect(m.y).toBeGreaterThan(c.y)
    })
  })

  it('leaves the words to the type and makes every other piece', () => {
    const shapes = list(fightRig(HOME.x, HOME.y, null))
    for (const s of shapes) {
      const key = bossBody.key(s, {} as never)
      if (s.kind === 'text') expect(key).toBeNull()
      else expect(typeof key).toBe('string')
    }
  })

  it('cuts plates, turned pieces and screws with whole numbers and unit normals', () => {
    sound(cutPlate([[-40, -20], [40, -20], [30, 20], [-30, 20]], 8, 1.2))
    sound(lathe([[0, 0], [10, 0], [10, 6], [0, 6]]))
    sound(screw(3, 2, 4))
  })
})

describe('the socket, the scorch and the smoke', () => {
  it('opens a well with a lip and cracks that start at the rim of the hole', () => {
    const out: Shape[] = []
    drawSocket(out, SOCKET.x, SOCKET.y, 1, 'socket-open')
    expect(out.some((s) => s.role === 'bossRim')).toBe(true)
    const off = (x: number, y: number): number => Math.max(Math.abs(x) - HOLE_W / 2, Math.abs(y) - HOLE_H / 2)
    const runs = crackRuns()
    expect(runs.filter((r) => off(r.x0, r.y0) < 10).length).toBeGreaterThan(5)
    for (const r of runs) {
      expect(off(r.x0, r.y0)).toBeGreaterThan(-12)
      expect(off(r.x1, r.y1)).toBeLessThan(160)
    }
    sound(crackGeometry())
  })

  it('makes the soot and the smoke streaks from numbers alone, the same each time', () => {
    const a = sootPixels()
    expect(a.length).toBe(SOOT_W * SOOT_H * 4)
    expect(Array.from(a.subarray(0, 4096))).toEqual(Array.from(sootPixels().subarray(0, 4096)))
    let low = 255
    let ends = 0
    let middle = 0
    for (let x = 0; x < SOOT_W; x++) {
      const i = ((SOOT_H / 2) * SOOT_W + x) * 4
      low = Math.min(low, a[i]!, a[i + 1]!, a[i + 2]!)
      if (x < 24 || x >= SOOT_W - 24) ends += a[i + 3]!
      if (Math.abs(x - SOOT_W / 2) < 24) middle += a[i + 3]!
    }
    expect(low).toBeGreaterThan(0)
    expect(ends / 48).toBeGreaterThan(200)
    expect(middle / 48).toBeLessThan(60)
    const p = puffPixels()
    expect(p.length).toBe(PUFF_PX * PUFF_PX * 4)
    expect(Array.from(p)).toEqual(Array.from(puffPixels()))
    for (let x = 0; x < PUFF_PX; x++) expect(Math.abs(p[x * 4]! - p[((PUFF_PX - 1) * PUFF_PX + x) * 4]!)).toBeLessThan(90)
    const mb = ((SOOT_W * SOOT_H + PUFF_PX * PUFF_PX) * 4 * (4 / 3)) / (1024 * 1024)
    expect(mb).toBeLessThan(0.5)
  })

  it('draws two wisps that rise from the ends of the fallen cap and move with the time alone', () => {
    const a: Shape[] = []
    const b: Shape[] = []
    drawSmoke(a, FALLEN.x, FALLEN.y, 3.2)
    drawSmoke(b, FALLEN.x, FALLEN.y, 3.2)
    expect(a).toEqual(b)
    expect(a.length).toBe(2)
    for (const s of a) expect(bossTransform.key(s, {} as never)).toBe('smoke')
    const foot = wispPoint(0, 1, 0)
    const top = wispPoint(1, 1, 0)
    expect(foot[0]).toBe(0)
    expect(foot[1]).toBe(0)
    expect(top[1]).toBeGreaterThan(120)
    expect(top[3]).toBeGreaterThan(foot[3])
    expect(wispPoint(0.6, 1, 0)).toEqual(wispPoint(0.6, 1, 0))
    expect(wispPoint(0.6, 2, 0)[0]).not.toBe(wispPoint(0.6, 1, 0)[0])
  })
})
