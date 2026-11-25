import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { holdOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type Buckets, type V3 } from './geo'
import { KIND, TONE, band, beaconBase, board, framed, parapet, reveal, shade, site, wallFace, windowAt, type Hole, type Site, type WindowLook } from './kit'

export type Side = 'front' | 'right' | 'back' | 'left'

// Calls `fn` once for each wall of a box, in that wall's own frame: x along the wall from its left end as seen from outside, z up, the outside toward -y.
export function walls(b: Buckets, x0: number, x1: number, yf: number, yb: number, base: number, fn: (side: Side, width: number) => void): void {
  framed(b, x0, yf, base, 0, () => fn('front', x1 - x0))
  framed(b, x1, yf, base, Math.PI / 2, () => fn('right', yb - yf))
  framed(b, x1, yb, base, Math.PI, () => fn('back', x1 - x0))
  framed(b, x0, yb, base, -Math.PI / 2, () => fn('left', yb - yf))
}

// Stone blocks up a corner of a wall face, long and short in turn.
export function quoins(b: Buckets, width: number, z0: number, z1: number, col: typeof TONE.stone): void {
  const step = 8
  let k = 0
  for (let zz = z0; zz + step <= z1 + 0.01; zz += step) {
    const long = k % 2 === 0 ? 8 : 5
    b.paint.box(-1, long, -1.1, 0, zz + 0.5, zz + step - 0.5, col, { skip: 'b', under: true, bevel: 0.4 })
    b.paint.box(width - long, width + 1, -1.1, 0, zz + 0.5, zz + step - 0.5, col, { skip: 'b', under: true, bevel: 0.4 })
    k++
  }
}

export interface Firehouse {
  door: Geo
  frame: Geo
  // Where the door stands when shut: the foot of its middle, and how far it travels when fully raised.
  doorAt: V3
  travel: number
  beacon: V3
}

// The paint of the engine bay behind the door: a deep oxide red.
const BAY: [number, number, number] = [0.15, 0.03, 0.026]

export const DOOR = { w: 104, h: 55, depth: 4 }

export function firehouse(b: Buckets, z: Zone, ctx: RealContext): Firehouse {
  const S: Site = site(z, 'street.firehouse')
  const g = b.paint
  const i = 3
  const x0 = S.x0 + i
  const x1 = S.x1 - i
  const yf = S.yf + i
  const yb = S.yb - i
  const top = S.h
  const deck = top - 10
  const storey = 60
  const hold = holdOf('street.firehouse')
  const dx = localBalls(z, hold.c[0], hold.c[1])[0] - x0
  const doorHole: Hole = { x: dx - DOOR.w / 2, z: 3, w: DOOR.w, h: DOOR.h }

  g.box(S.x0, S.x1, S.yf, S.yb, 0, 3, TONE.stoneDark, { bevel: 1 })
  for (const sx of [S.x0 + 1.6, S.x1 - 1.6]) b.screws.push([sx, S.yf + 1.6, 3, 1.1])

  const trim = shade(TONE.stoneDark, 0.72)
  const up: WindowLook = { frame: trim, wall: TONE.brick, sill: TONE.stone, lintel: TONE.stone, surround: TONE.stone, bars: [2, 3] }
  const down: WindowLook = { frame: trim, wall: TONE.brick, sill: TONE.stone, lintel: TONE.stone, surround: TONE.stone, bars: [2, 2], warm: 0.35 }
  let n = 0
  const lum = (): number => [1, 0.72, 0.9, 0.5, 1, 0.8, 0.62, 0.95][n++ % 8]!

  walls(b, x0, x1, yf, yb, 0, (side, W) => {
    const upper: Hole[] = []
    const lower: Hole[] = []
    if (side === 'front') {
      for (let k = 0; k < 5; k++) upper.push({ x: 21 + k * 44, z: 80, w: 16, h: 30 })
      lower.push(doorHole, { x: 28, z: 22, w: 14, h: 22 }, { x: 72, z: 22, w: 14, h: 22 })
    } else if (side === 'right') {
      for (let k = 0; k < 3; k++) {
        upper.push({ x: 18 + k * 43, z: 80, w: 16, h: 30 })
        lower.push({ x: 19 + k * 43, z: 22, w: 14, h: 22 })
      }
    }
    wallFace(g, 0, W, 3, storey, lower, TONE.brick, KIND.brick)
    wallFace(g, 0, W, storey, deck - 4, upper, TONE.brick, KIND.brick)
    band(g, -1.4, W + 1.4, 3, 8, 1.4, TONE.stoneDark, KIND.stucco)
    band(g, -1, W + 1, storey - 1.6, storey + 1.4, 1.3, TONE.stone, KIND.stucco)
    band(g, -3.4, W + 3.4, deck - 10, deck - 4, 3.4, TONE.stone, KIND.stucco)
    band(g, -1.6, W + 1.6, deck - 4, top - 3, 1.6, TONE.stone, KIND.stucco)
    quoins(b, W, 8.5, deck - 11, TONE.stone)
    upper.forEach((h, k) => {
      const pole = side === 'front' && k === 1
      windowAt(b, h, pole ? { ...up, depth: 15, bars: [1, 1], glow: 1 } : { ...up, glow: lum(), blind: [0.3, 0, 0.45, 0.2, 0.55][(n + k) % 5]! })
      if (pole) b.metal.rod([h.x + h.w * 0.42, 8, h.z - 2], [h.x + h.w * 0.42, 8, h.z + h.h + 2], 1.3, 10, TONE.brass, 0, false)
    })
    lower.forEach((h) => {
      if (h !== doorHole) windowAt(b, h, { ...down, glow: lum() })
    })
    if (side === 'front') {
      reveal(g, doorHole, DOOR.depth + 3, shade(TONE.stone, 0.7))
      const a = doorHole.x
      const c = doorHole.x + doorHole.w
      const d0 = DOOR.depth + 3
      const d1 = 52
      const zc = doorHole.z + doorHole.h
      g.quad([a, d0, 3], [a, d1, 3], [a, d1, zc], [a, d0, zc], BAY)
      g.quad([c, d1, 3], [c, d0, 3], [c, d0, zc], [c, d1, zc], BAY)
      g.quad([a, d1, 3], [c, d1, 3], [c, d1, zc], [a, d1, zc], shade(BAY, 0.7))
      g.quad([a, d1, zc], [c, d1, zc], [c, d0, zc], [a, d0, zc], shade(BAY, 0.5))
      // Hose racks on the back wall of the bay: three red bars.
      for (let k = 0; k < 3; k++) g.box(a + 14 + k * 28, a + 34 + k * 28, d1 - 2, d1, 26, 30, TONE.red, { skip: 'b', under: true, kind: KIND.gloss })
    }
  })

  g.quad([x0 + 7, yf + 7, deck], [x1 - 7, yf + 7, deck], [x1 - 7, yb - 7, deck], [x0 + 7, yb - 7, deck], TONE.roof, KIND.tar)
  parapet(g, x0, x1, yf, yb, deck, top, 8, TONE.stone, TONE.stonePale, KIND.stucco)

  // The stair head at the back left corner: a low rendered box with a louvre and a capped flat roof, as the small units on the approved roof are.
  const tx0 = x0 + 10
  const tx1 = tx0 + 34
  const ty1 = yb - 10
  const ty0 = ty1 - 28
  const ttop = top + 9
  walls(b, tx0, tx1, ty0, ty1, deck, (side, W) => {
    const louvre: Hole = { x: W / 2 - 8, z: ttop - deck - 15, w: 16, h: 10.5 }
    const open = side === 'front' || side === 'right'
    wallFace(g, 0, W, 0, ttop - deck, open ? [louvre] : [], TONE.stone, KIND.stucco)
    if (!open) return
    reveal(g, louvre, 2.5, shade(TONE.stone, 0.6))
    g.quad([louvre.x, 2.5, louvre.z], [louvre.x + louvre.w, 2.5, louvre.z], [louvre.x + louvre.w, 2.5, louvre.z + louvre.h], [louvre.x, 2.5, louvre.z + louvre.h], TONE.dark)
    for (let k = 0; k < 3; k++) g.quad([louvre.x, 0.4, louvre.z + 0.8 + k * 3.3], [louvre.x + louvre.w, 0.4, louvre.z + 0.8 + k * 3.3], [louvre.x + louvre.w, 2.2, louvre.z + 3.2 + k * 3.3], [louvre.x, 2.2, louvre.z + 3.2 + k * 3.3], TONE.stoneDark)
  })
  g.box(tx0 - 2, tx1 + 2, ty0 - 2, ty1 + 2, ttop, ttop + 2.6, TONE.stonePale, { bevel: 0.8, under: true })
  g.box(tx0 + 3, tx1 - 3, ty0 + 3, ty1 - 3, ttop + 2.6, ttop + 3.2, TONE.roof, { kind: KIND.tar, skip: 'b' })

  // What stands on the roof: a hatch, a cooling unit, two vents.
  const hx = x1 - 50
  const hy = yb - 44
  g.box(hx, hx + 22, hy, hy + 20, deck, deck + 5, TONE.stoneDark, { bevel: 0.8 })
  g.box(hx + 1.5, hx + 20.5, hy + 1.5, hy + 18.5, deck + 5, deck + 6.6, TONE.iron, { bevel: 0.6, kind: KIND.gloss })
  b.metal.box(hx + 16, hx + 18.5, hy + 8, hy + 12, deck + 6.6, deck + 7.6, TONE.steel)
  const ax = tx1 + 12
  const ay = yb - 36
  g.box(ax, ax + 26, ay, ay + 18, deck, deck + 10, TONE.concrete, { bevel: 1 })
  for (let k = 0; k < 5; k++) g.box(ax + 3 + k * 4.2, ax + 5.2 + k * 4.2, ay + 2.5, ay + 15.5, deck + 10, deck + 10.7, TONE.concreteDark)
  for (const [vx, vy] of [[x1 - 22, yf + 44], [x0 + 22, yf + 40]] as const) {
    b.metal.lathe([[3.4, 0], [3.4, 8], [5.2, 9.5], [5.2, 11], [0, 12.5]], vx, vy, 14, TONE.alu, { base: deck })
  }
  for (const [sx, sy] of [[x0 + 9, yf + 9], [x1 - 9, yf + 9], [x1 - 9, yb - 9]] as const) b.screws.push([sx, sy, deck, 1.6])

  const beacon: V3 = [S.cx, S.yb - S.d * 0.3, deck]
  beaconBase(b, beacon[0], beacon[1], deck)
  board(b, z, ctx, 'street.firehouse', deck)

  // The door: four white panels, a row of small windows in the third, a rubber seal at its foot.
  const door = new Geo()
  const hw = DOOR.w / 2
  const ph = DOOR.h / 4
  for (let k = 0; k < 4; k++) {
    door.box(-hw, hw, 0, 2.2, k * ph + 0.35, (k + 1) * ph - 0.35, TONE.door, { kind: KIND.gloss, under: true })
    for (let j = 0; j < 4; j++) {
      const a = -hw + 3 + j * ((DOOR.w - 6) / 4)
      const c = a + (DOOR.w - 6) / 4 - 2.5
      if (k === 2) {
        door.box(a + 3, c - 3, -0.5, 0, k * ph + 3, (k + 1) * ph - 3, TONE.white, { skip: 'b', under: true, kind: KIND.gloss })
        door.quad([a + 4.2, -0.55, k * ph + 4.2], [c - 4.2, -0.55, k * ph + 4.2], [c - 4.2, -0.55, (k + 1) * ph - 4.2], [a + 4.2, -0.55, (k + 1) * ph - 4.2], [0.03, 0.045, 0.07], KIND.gloss)
      } else door.box(a, c, -0.55, 0, k * ph + 2.4, (k + 1) * ph - 2.4, shade(TONE.door, 1.06), { skip: 'b', under: true, kind: KIND.gloss, bevel: 0.5 })
    }
  }
  door.box(-hw, hw, -0.3, 2.4, -0.2, 1.2, TONE.black, { under: true })
  door.box(-9, 9, -1.6, 0, 5.2, 7, TONE.iron, { skip: 'b', under: true, kind: KIND.gloss })

  // The frame round the door: two jambs, a lintel and a keystone, a mesh of its own so that it can shake.
  const frame = new Geo()
  const fl = doorHole.x
  const fr = doorHole.x + doorHole.w
  const ft = doorHole.z + doorHole.h
  const arch: [number, number][] = []
  const bend = (cx: number, cz: number, r: number, a0: number, a1: number): void => {
    for (let k = 0; k <= 6; k++) {
      const a = a0 + ((a1 - a0) * k) / 6
      arch.push([cx + r * Math.cos(a), cz + r * Math.sin(a)])
    }
  }
  const ri = 10
  const ro = 7
  const jw = 8
  const fo = ft + 9
  arch.push([fl - jw, 3], [fl, 3])
  bend(fl + ri, ft - ri, ri, Math.PI, Math.PI / 2)
  bend(fr - ri, ft - ri, ri, Math.PI / 2, 0)
  arch.push([fr, 3], [fr + jw, 3])
  bend(fr + jw - ro, fo - ro, ro, 0, Math.PI / 2)
  bend(fl - jw + ro, fo - ro, ro, Math.PI / 2, Math.PI)
  const fm = frame.mark()
  frame.slab(arch, 0, 3.6, TONE.stone, { kind: KIND.stucco })
  frame.move(fm, new THREE.Matrix4().makeRotationX(Math.PI / 2))
  frame.box((fl + fr) / 2 - 6, (fl + fr) / 2 + 6, -5, 0, ft - 1, ft + 10.5, TONE.stone, { skip: 'b', under: true, bevel: 1, kind: KIND.stucco })
  for (const fx of [fl - 7, fr + 3]) frame.box(fx, fx + 4, -6, 0, 3, 13, TONE.yellow, { skip: 'b', bevel: 0.8, kind: KIND.gloss })
  frame.place(0, x0, yf, 0, 0)

  return { door, frame, doorAt: [x0 + dx, yf + DOOR.depth, 3], travel: DOOR.h, beacon }
}
