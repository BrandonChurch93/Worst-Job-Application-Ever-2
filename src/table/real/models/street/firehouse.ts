import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { BALL } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type Buckets, type RGB, type V3 } from './geo'
import { KIND, TONE, band, beaconBase, board, framed, mix, parapet, reveal, rgb, roofDeck, roofLight, shade, site, wallFace, windowAt, type Hole, type Site, type WindowLook } from './kit'

export type Side = 'front' | 'right' | 'back' | 'left'

// Calls `fn` once for each wall of a box, in that wall's own frame: x along the wall from its left end as seen from outside, z up, the outside toward -y.
export function walls(b: Buckets, x0: number, x1: number, yf: number, yb: number, base: number, fn: (side: Side, width: number) => void): void {
  framed(b, x0, yf, base, 0, () => fn('front', x1 - x0))
  framed(b, x1, yf, base, Math.PI / 2, () => fn('right', yb - yf))
  framed(b, x1, yb, base, Math.PI, () => fn('back', x1 - x0))
  framed(b, x0, yb, base, -Math.PI / 2, () => fn('left', yb - yf))
}

// Stone blocks up a corner of a wall face, long and short in turn. The right corner starts at `rightFrom` where something else stands under it.
export function quoins(b: Buckets, width: number, z0: number, z1: number, col: typeof TONE.stone, rightFrom = z0): void {
  const step = 8
  let k = 0
  for (let zz = z0; zz + step <= z1 + 0.01; zz += step) {
    const long = k % 2 === 0 ? 9 : 5.5
    b.paint.box(-1.2, long, -1.5, 0, zz + 0.45, zz + step - 0.45, col, { skip: 'b', under: true, bevel: 0.7, kind: KIND.stucco })
    if (zz >= rightFrom - 0.01) b.paint.box(width - long, width + 1.2, -1.5, 0, zz + 0.45, zz + step - 0.45, col, { skip: 'b', under: true, bevel: 0.7, kind: KIND.stucco })
    k++
  }
}

export interface Firehouse {
  door: Geo
  // The red light inside the engine bay: the lamp under its head and what that lamp lights.
  bay: Geo
  // Where the door stands when shut: the foot of its middle, and how far it travels when fully raised.
  doorAt: V3
  travel: number
  beacon: V3
}

// The mouth the ball is held in: as wide as the bay of the layout, a ball and a little high, with round upper corners in a stone frame.
export const MOUTH = { h: 103, round: 16, jamb: 10, head: 10, reveal: 7 }
// The door hangs in the head of the mouth: at rest its foot shows under the stone, on a held ball it is gone.
export const DOOR = { h: 24, depth: 8.5, travel: 114 }

// The floor of the engine bay: a deep oxide red.
const BAY: RGB = [0.085, 0.017, 0.015]
const STONE = rgb(0x959da5)

export function firehouse(b: Buckets, z: Zone, ctx: RealContext): Firehouse {
  const S: Site = site(z, 'street.firehouse')
  const g = b.paint
  const x0 = S.x0 + 3
  const x1 = S.x1 - 0.6
  const yf = S.yf + 3
  const yb = S.yb - 3
  const top = S.h
  const deck = top - 12
  const span = S.m.bay ?? [S.m.box[0] + S.m.box[2] * 0.46, S.m.box[0] + S.m.box[2] * 0.98, 0.55]
  const bl = localBalls(z, span[0], S.m.box[1])[0] - x0
  const br = localBalls(z, span[1], S.m.box[1])[0] - x0
  const deep = span[2] * BALL - (yf - S.yf)
  const mouth: Hole = { x: bl, z: 0, w: br - bl, h: MOUTH.h }
  const head = MOUTH.h + MOUTH.head
  const course = 13
  const cornice = deck - 10
  const string = head + 5
  const upZ = string + 8
  const upH = Math.min(34, cornice - upZ - 7)
  const storeys = upH >= 22

  g.box(S.x0, x0 + 1, S.yf + 1.5, S.yb, 0, 3, TONE.stoneDark, { bevel: 1, kind: KIND.stucco })
  g.box(x0 + 1, S.x1, yb - 1, S.yb, 0, 3, TONE.stoneDark, { bevel: 1, kind: KIND.stucco, skip: 'l' })
  b.screws.push([S.x0 + 1.6, S.yf + 4, 3, 1.1])

  const trim = shade(TONE.stoneDark, 0.72)
  const up: WindowLook = { frame: trim, wall: TONE.brick, sill: STONE, lintel: STONE, surround: STONE, bars: [2, 3] }
  const down: WindowLook = { frame: trim, wall: TONE.brick, sill: STONE, lintel: STONE, surround: STONE, bars: [2, 2], warm: 0.35 }
  let n = 0
  const lum = (): number => [1, 0.72, 0.9, 0.5, 1, 0.8, 0.62, 0.95][n++ % 8]!

  walls(b, x0, x1, yf, yb, 0, (side, W) => {
    const upper: Hole[] = []
    const lower: Hole[] = []
    if (side === 'front') {
      if (storeys) for (let k = 0; k < 5; k++) upper.push({ x: 20 + k * ((W - 56) / 4), z: upZ, w: 16, h: upH })
      const room = bl - MOUTH.jamb
      if (room > 60) lower.push({ x: room * 0.3 - 8, z: 30, w: 16, h: 34 }, { x: room * 0.7 - 8, z: 30, w: 16, h: 34 })
    } else if (side === 'right') {
      for (let k = 0; k < 3; k++) {
        if (storeys) upper.push({ x: 18 + k * ((W - 52) / 2), z: upZ, w: 16, h: upH })
        if (18 + k * ((W - 52) / 2) > deep + 8) lower.push({ x: 18 + k * ((W - 52) / 2), z: 30, w: 16, h: 34 })
      }
    }
    wallFace(g, 0, W, 0, deck - 4, side === 'front' ? [mouth, ...lower, ...upper] : [...lower, ...upper], TONE.brick, KIND.brick)
    band(g, -1.6, side === 'front' ? bl - MOUTH.jamb + 0.5 : W + 1.6, 0, course, 1.8, TONE.stoneDark, KIND.block)
    if (cornice - string > 12) band(g, -1, W + 1, string, string + 3, 1.3, STONE, KIND.stucco)
    band(g, -3.6, W + 3.6, cornice, deck - 4, 3.6, STONE, KIND.stucco)
    band(g, -2.2, W + 2.2, cornice - 2.4, cornice, 2.2, shade(STONE, 0.86), KIND.stucco)
    band(g, -1.6, W + 1.6, deck - 4, top - 3, 1.6, STONE, KIND.stucco)
    quoins(b, W, course + 0.5, cornice - 3, STONE, side === 'front' ? head + 2 : course)
    upper.forEach((h, k) => {
      windowAt(b, h, { ...up, glow: lum(), blind: [0.3, 0, 0.45, 0.2, 0.55][(n + k) % 5]! })
    })
    lower.forEach((h) => windowAt(b, h, { ...down, glow: lum() }))
    if (side !== 'front') return

    // The stone frame of the mouth: two jambs and a head with round inner corners, proud of the brick and as deep as the wall. Its right jamb is the corner of the building.
    const fl = bl
    const fr = br
    const ft = MOUTH.h
    const xr = W + 1.5
    const arch: [number, number][] = []
    const bend = (cx: number, cz: number, r: number, a0: number, a1: number): void => {
      for (let k = 0; k <= 7; k++) {
        const a = a0 + ((a1 - a0) * k) / 7
        arch.push([cx + r * Math.cos(a), cz + r * Math.sin(a)])
      }
    }
    const ri = MOUTH.round
    arch.push([fl - MOUTH.jamb, 0], [fl, 0])
    bend(fl + ri, ft - ri, ri, Math.PI, Math.PI / 2)
    bend(fr - ri, ft - ri, ri, Math.PI / 2, 0)
    arch.push([fr, 0], [xr, 0])
    bend(xr - 2.5, head - 2.5, 2.5, 0, Math.PI / 2)
    bend(fl - MOUTH.jamb + 6, head - 6, 6, Math.PI / 2, Math.PI)
    const fm = g.mark()
    g.slab(arch, -MOUTH.reveal, 3.4, STONE, { kind: KIND.stucco })
    // A bead round the opening and the joints of its stones.
    const bead: [number, number][] = []
    const inner: [number, number][] = []
    const ring = (o: number, out: [number, number][]): void => {
      out.push([fl - o, 0])
      for (let k = 0; k <= 7; k++) {
        const a = Math.PI - (Math.PI / 2) * (k / 7)
        out.push([fl + ri + (ri + o) * Math.cos(a), ft - ri + (ri + o) * Math.sin(a)])
      }
      for (let k = 0; k <= 7; k++) {
        const a = Math.PI / 2 - (Math.PI / 2) * (k / 7)
        out.push([fr - ri + (ri + o) * Math.cos(a), ft - ri + (ri + o) * Math.sin(a)])
      }
      out.push([fr + o, 0])
    }
    ring(0, inner)
    ring(2.6, bead)
    for (let k = 0; k < inner.length - 1; k++) {
      const p = inner[k]!
      const q = inner[k + 1]!
      const P = bead[k]!
      const Q = bead[k + 1]!
      if (P[0] > xr || Q[0] > xr) continue
      g.face([[p[0], p[1], 4.6], [q[0], q[1], 4.6], [Q[0], Q[1], 4.6], [P[0], P[1], 4.6]], shade(STONE, 1.08), KIND.stucco, [0, 0, 1])
      g.face([[P[0], P[1], 4.6], [Q[0], Q[1], 4.6], [Q[0], Q[1], 3.4], [P[0], P[1], 3.4]], shade(STONE, 0.8), KIND.stucco)
      g.face([[q[0], q[1], 4.6], [p[0], p[1], 4.6], [p[0], p[1], 3.4], [q[0], q[1], 3.4]], shade(STONE, 0.9), KIND.stucco)
    }
    g.move(fm, new THREE.Matrix4().makeRotationX(Math.PI / 2))
    const jz = 3.44
    for (let zz = 17; zz < ft - ri; zz += 17) {
      g.quad([fl - MOUTH.jamb, -jz, zz], [fl - 2.6, -jz, zz], [fl - 2.6, -jz, zz + 0.9], [fl - MOUTH.jamb, -jz, zz + 0.9], shade(STONE, 0.42))
      g.quad([fr + 2.6, -jz, zz], [xr, -jz, zz], [xr, -jz, zz + 0.9], [fr + 2.6, -jz, zz + 0.9], shade(STONE, 0.42))
    }
    const mid = (fl + fr) / 2
    for (const dx of [-44, -22, 22, 44]) g.quad([mid + dx - 0.45, -jz, ft + 2.6], [mid + dx + 0.45, -jz, ft + 2.6], [mid + dx + 0.45, -jz, head], [mid + dx - 0.45, -jz, head], shade(STONE, 0.42))
    g.box(mid - 7, mid + 7, -5.6, 0, ft - 1.5, head + 3.5, shade(STONE, 1.05), { skip: 'b', under: true, bevel: 1.2, kind: KIND.stucco })
    for (const fx of [fl - MOUTH.jamb - 1, fr - 0.5]) g.box(fx, fx + 4.5, -7, -3.4, 0, 12, TONE.yellow, { skip: 'b', bevel: 0.9, kind: KIND.gloss })

    // The bay behind the mouth: a dark floor let in level with the street, and the slot the door runs up in.
    g.quad([fl, -3.4, 0.22], [fr, -3.4, 0.22], [fr, deep, 0.22], [fl, deep, 0.22], shade(BAY, 0.5), KIND.gloss)
  })

  // What the red lamp of the bay lights: its walls, its back and its ceiling, brightest under the head where the lamp hangs.
  const bay = new Geo()
  {
    const a = bl
    const c = br
    const d0 = MOUTH.reveal
    const d1 = deep
    const zc = MOUTH.h
    const steps = 9
    const red = (k: number): RGB => [k, k * 0.7, k * 0.6]
    for (let k = 0; k < steps; k++) {
      const z0 = (zc * k) / steps
      const z1 = (zc * (k + 1)) / steps
      const lv = 0.0012 + 0.04 * Math.pow((k + 0.5) / steps, 3.2)
      for (let j = 0; j < 4; j++) {
        const e0 = d0 + ((d1 - d0) * j) / 4
        const e1 = d0 + ((d1 - d0) * (j + 1)) / 4
        const fall = lv * (1 - 0.24 * j)
        bay.quad([a, e0, z0], [a, e1, z0], [a, e1, z1], [a, e0, z1], red(fall))
        bay.quad([c, e1, z0], [c, e0, z0], [c, e0, z1], [c, e1, z1], red(fall))
      }
      bay.quad([a, d1, z0], [c, d1, z0], [c, d1, z1], [a, d1, z1], red(lv * 0.22))
    }
    bay.quad([a, d1, zc], [c, d1, zc], [c, d0 + 4, zc], [a, d0 + 4, zc], red(0.02))
    // Racks on the back wall, dark against it.
    for (let k = 0; k < 3; k++) bay.box(a + 16 + k * 34, a + 40 + k * 34, d1 - 2.4, d1 - 0.2, 70, 75, red(0.0006), { skip: 'b', under: true })
    bay.box(a + 22, c - 22, d0 + 8, d0 + 12, zc - 3.2, zc - 0.4, [0.5, 0.36, 0.3], { under: true, skip: 't' })
    bay.place(0, x0, yf, 0, 0)
  }

  roofDeck(g, x0 + 7, x1 - 7, yf + 7, yb - 7, deck)
  parapet(g, x0, x1, yf, yb, deck, top, 8, STONE, TONE.cap, KIND.stucco)

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

  roofLight(b, x0 + 36, x0 + 80, yf + 34, yf + 60, deck, TONE.stoneDark)
  roofLight(b, x1 - 80, x1 - 36, yf + 34, yf + 60, deck, TONE.stoneDark)
  const beacon: V3 = [S.cx, S.yb - S.d * 0.3, deck]
  beaconBase(b, beacon[0], beacon[1], deck)
  board(b, z, ctx, 'street.firehouse', deck)

  // The door: two white panels with a rubber seal at the foot. Only its foot shows, in the head of the mouth.
  const door = new Geo()
  const hw = (br - bl) / 2 - 0.6
  const ph = DOOR.h / 2
  for (let k = 0; k < 2; k++) {
    door.box(-hw, hw, 0, 2.2, k * ph + 0.3, (k + 1) * ph - 0.3, TONE.door, { kind: KIND.gloss, under: true })
    for (let j = 0; j < 5; j++) {
      const a = -hw + 3 + j * ((hw * 2 - 6) / 5)
      const c = a + (hw * 2 - 6) / 5 - 2.5
      door.box(a, c, -0.55, 0, k * ph + 2.2, (k + 1) * ph - 2.2, shade(TONE.door, 1.06), { skip: 'b', under: true, kind: KIND.gloss, bevel: 0.5 })
    }
  }
  door.box(-hw, hw, -0.4, 2.5, -1.6, 0.3, TONE.black, { under: true })
  door.box(-9, 9, -1.6, 0, 3.4, 5.2, TONE.iron, { skip: 'b', under: true, kind: KIND.gloss })

  return { door, bay, doorAt: [x0 + (bl + br) / 2, yf + DOOR.depth, 0], travel: DOOR.travel, beacon }
}
