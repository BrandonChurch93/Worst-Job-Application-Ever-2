import { table } from '../../../layout'
import type { Zone } from '../../zone'
import type { Buckets, RGB, V3 } from './geo'
import { walls } from './firehouse'
import { KIND, TONE, rgb, shade, site, wallFace, windowAt, type Hole } from './kit'

export interface HouseLook {
  wall: RGB
  kind: number
  roof: RGB
  roofKind?: number
  // The way the ridge runs, or a roof with four slopes.
  ridge: 'x' | 'y' | 'hip'
  door: RGB
  trim: RGB
  eave: number
  chimney: -1 | 1
  doorAt?: number
  glow?: number[]
}

// A roof slope with its underside.
const slope = (b: Buckets, pts: V3[], col: RGB, kind: number): void => {
  b.paint.face(pts, col, kind)
  b.paint.face([...pts].reverse(), shade(col, 0.45))
}

// A house body with its roof, from the floor at `base` to its ridge at `top`: walls, a door, lit windows, a chimney.
export function house(b: Buckets, x0: number, x1: number, yf: number, yb: number, base: number, top: number, L: HouseLook, front: { door: Hole | null; windows: Hole[]; side: Hole[]; depth?: number }): void {
  const g = b.paint
  const W = x1 - x0
  const D = yb - yf
  const ze = base + L.eave
  const o = 2.4
  const mx = (x0 + x1) / 2
  const my = (yf + yb) / 2
  const glow = L.glow ?? [1, 0.7, 0.9, 0.55]
  let n = 0
  const look = { frame: L.trim, wall: L.wall, sill: L.trim, bars: [2, 2] as [number, number], depth: front.depth ?? 2 }
  walls(b, x0, x1, yf, yb, base, (side, width) => {
    const holes = side === 'front' ? front.windows : side === 'back' ? [] : front.side
    wallFace(g, 0, width, 0, L.eave, holes, L.wall, L.kind)
    for (const h of holes) windowAt(b, h, { ...look, glow: glow[n++ % glow.length]! })
    // Corner boards.
    g.box(-0.5, 1.1, -0.5, 0, 0, L.eave, L.trim, { skip: 'b' })
    if (side === 'front' && front.door) {
      const d = front.door
      g.box(d.x - 1.2, d.x + d.w + 1.2, -0.6, 0, d.z, d.z + d.h + 1.2, L.trim, { skip: 'b' })
      g.box(d.x, d.x + d.w, -1.1, 0, d.z, d.z + d.h, L.door, { skip: 'b', kind: KIND.gloss, bevel: 0.3 })
      b.glow.face([[d.x + d.w * 0.25, -1.15, d.z + d.h * 0.68], [d.x + d.w * 0.75, -1.15, d.z + d.h * 0.68], [d.x + d.w * 0.75, -1.15, d.z + d.h * 0.9], [d.x + d.w * 0.25, -1.15, d.z + d.h * 0.9]], [0.8, 0.7, 0.55], 0, [0, -1, 0])
      b.metal.box(d.x + d.w * 0.78, d.x + d.w * 0.78 + 0.9, -1.9, -1.1, d.z + d.h * 0.45, d.z + d.h * 0.45 + 0.9, TONE.brass, { under: true })
    }
  })
  // The fascia under the eaves.
  g.box(x0 - o, x1 + o, yf - o, yb + o, ze - 1.4, ze, L.trim, { under: true })
  const kind = L.roofKind ?? KIND.shingle
  const a: V3 = [x0 - o, yf - o, ze]
  const c: V3 = [x1 + o, yf - o, ze]
  const d: V3 = [x1 + o, yb + o, ze]
  const e: V3 = [x0 - o, yb + o, ze]
  if (L.ridge === 'x') {
    const r0: V3 = [x0 - o, my, top]
    const r1: V3 = [x1 + o, my, top]
    slope(b, [a, c, r1, r0], L.roof, kind)
    slope(b, [d, e, r0, r1], L.roof, kind)
    g.face([[x0, yb, ze], [x0, yf, ze], [x0, my, top - 1.5]], L.wall, L.kind)
    g.face([[x1, yf, ze], [x1, yb, ze], [x1, my, top - 1.5]], L.wall, L.kind)
    g.box(x0 - o, x1 + o, my - 0.9, my + 0.9, top - 0.5, top + 0.6, shade(L.roof, 0.8), { skip: 'u' })
  } else if (L.ridge === 'y') {
    const r0: V3 = [mx, yf - o, top]
    const r1: V3 = [mx, yb + o, top]
    slope(b, [e, a, r0, r1], L.roof, kind)
    slope(b, [c, d, r1, r0], L.roof, kind)
    g.face([[x0, yf, ze], [x1, yf, ze], [mx, yf, top - 1.5]], L.wall, L.kind)
    const gh = (top - ze) * 0.42
    g.box(mx - 3, mx + 3, yf - 0.5, yf, ze + 1.2, ze + 1.2 + gh, L.trim, { skip: 'b', under: true })
    b.glow.face([[mx - 2.2, yf - 0.55, ze + 2], [mx + 2.2, yf - 0.55, ze + 2], [mx + 2.2, yf - 0.55, ze + 0.4 + gh], [mx - 2.2, yf - 0.55, ze + 0.4 + gh]], [0.9, 0.76, 0.56], 0, [0, -1, 0])
    g.face([[x1, yb, ze], [x0, yb, ze], [mx, yb, top - 1.5]], L.wall, L.kind)
    g.box(mx - 0.9, mx + 0.9, yf - o, yb + o, top - 0.5, top + 0.6, shade(L.roof, 0.8), { skip: 'u' })
  } else {
    const half = Math.max(0, (W - D) / 2)
    const r0: V3 = [mx - half, my, top]
    const r1: V3 = [mx + half, my, top]
    b.paint.face(half > 0 ? [a, c, r1, r0] : [a, c, r1], L.roof, kind)
    b.paint.face(half > 0 ? [d, e, r0, r1] : [d, e, r0], L.roof, kind)
    b.paint.face([e, a, r0], L.roof, kind)
    b.paint.face([c, d, r1], L.roof, kind)
  }
  // The chimney, of brick with a stone cap and a dark flue.
  const cx = mx + L.chimney * W * 0.27
  const cy = my + D * 0.16
  g.box(cx - 2.8, cx + 2.8, cy - 2.8, cy + 2.8, ze, top + 2.4, TONE.brick, { kind: KIND.brick })
  g.box(cx - 3.5, cx + 3.5, cy - 3.5, cy + 3.5, top + 2.4, top + 3.6, TONE.stone, { under: true, bevel: 0.4 })
  g.box(cx - 1.5, cx + 1.5, cy - 1.5, cy + 1.5, top + 3.6, top + 4.4, TONE.dark)
}

// A mailbox on a post.
export function mailbox(b: Buckets, x: number, y: number, z: number, col: RGB): void {
  b.paint.box(x - 0.7, x + 0.7, y - 0.7, y + 0.7, z, z + 8, TONE.woodDark)
  b.paint.box(x - 1.7, x + 1.7, y - 2.8, y + 2.8, z + 8, z + 11.4, col, { under: true, bevel: 1.1, kind: KIND.gloss })
  b.metal.box(x + 1.7, x + 2.1, y - 0.4, y + 0.4, z + 9.6, z + 12.4, TONE.red)
}

const LOOKS: HouseLook[] = [
  { wall: rgb(0xcbc2ac), kind: KIND.stucco, roof: rgb(0x4d3226), ridge: 'y', door: rgb(0x2c3f38), trim: rgb(0xd9d5c9), eave: 22, chimney: 1 },
  { wall: rgb(0x6b3a2d), kind: KIND.brick, roof: rgb(0x363d46), ridge: 'y', door: rgb(0xc9c2b0), trim: TONE.stonePale, eave: 25, chimney: -1 },
  { wall: rgb(0xb9ad8e), kind: KIND.stucco, roof: rgb(0x522b24), ridge: 'x', door: rgb(0x4a2a22), trim: rgb(0xd6d0c2), eave: 24, chimney: 1 },
  { wall: rgb(0x8f9596), kind: KIND.stucco, roof: rgb(0x4a2c25), ridge: 'y', door: rgb(0xd6d0c2), trim: rgb(0xd9d5c9), eave: 24, chimney: 1 },
  { wall: rgb(0xc9c3b6), kind: KIND.stucco, roof: rgb(0x34383e), ridge: 'x', door: rgb(0x2f3d52), trim: rgb(0x6c7479), eave: 22, chimney: -1 },
  { wall: rgb(0xb5a88c), kind: KIND.stucco, roof: rgb(0x46392e), ridge: 'x', door: rgb(0x4d2c20), trim: rgb(0xd5cebd), eave: 25, chimney: -1 }
]

const GRASS = rgb(0x2b3a27)

// The six small houses, three in a row on each side, each row on a kerbed strip of its own.
export function houses(b: Buckets, z: Zone): void {
  const g = b.paint
  for (const row of ['left', 'right']) {
    const ids = table.models.filter((m) => m.part === 'model-houses' && m.id.includes(`.${row}.`)).map((m) => m.id)
    const sites = ids.map((id) => site(z, id))
    if (sites.length === 0) continue
    const lo = Math.min(...sites.map((s) => s.x0))
    const hi = Math.max(...sites.map((s) => s.x1))
    const yf = sites[0]!.yf
    const yb = sites[0]!.yb
    g.box(lo - 3, hi + 3, yf - 3, yb + 3, 0, 2.2, TONE.stoneDark, { bevel: 0.8, top: TONE.concrete, topKind: KIND.stucco })
    g.box(lo + 1, hi - 1, yf + 6, yb + 1.5, 2.2, 2.7, GRASS, { bevel: 0.3, kind: KIND.stucco })
    b.screws.push([lo - 0.5, yf - 0.6, 2.2, 1], [hi + 0.5, yf - 0.6, 2.2, 1])
    sites.forEach((S, i) => {
      const L = LOOKS[(row === 'left' ? 0 : 3) + (i % 3)]!
      const x0 = S.x0 + 3.5
      const x1 = S.x1 - 3.5
      const y0 = S.yf + 7
      const y1 = S.yb - 2
      const W = x1 - x0
      const dx = L.doorAt ?? (i % 2 === 0 ? W * 0.5 : W * 0.72)
      const door: Hole = { x: dx - 3.6, z: 0, w: 7.2, h: 14 }
      const wins: Hole[] = i % 2 === 0 ? [{ x: W * 0.1, z: 7, w: 7.5, h: 9 }, { x: W * 0.9 - 7.5, z: 7, w: 7.5, h: 9 }] : [{ x: W * 0.1, z: 7, w: 7.5, h: 9 }, { x: W * 0.1 + 10.5, z: 7, w: 7.5, h: 9 }]
      const side: Hole[] = [{ x: (y1 - y0) / 2 - 3.5, z: 8, w: 7, h: 8 }]
      house(b, x0, x1, y0, y1, 2.2, S.h - 4.5 - [0, 3.5, 1.5][i % 3]!, L, { door, windows: wins, side })
      // The step, the path and the mailbox.
      g.box(x0 + dx - 5, x0 + dx + 5, y0 - 3, y0, 2.2, 3.8, TONE.stonePale, { skip: 'b', bevel: 0.4 })
      g.box(x0 + dx - 3, x0 + dx + 3, S.yf - 2.6, y0 - 3, 2.2, 2.6, TONE.stoneDark, { skip: 'b', kind: KIND.block })
      mailbox(b, x0 + dx + (i % 2 === 0 ? 9 : -9), S.yf + 0.5, 2.2, [TONE.iron, rgb(0x5a2a24), TONE.blueDark][i % 3]!)
      // A hedge along one side.
      const hx = i % 2 === 0 ? S.x0 + 0.4 : S.x1 - 2.6
      g.box(hx, hx + 2.2, y0 + 2, y1 - 2, 2.2, 6.5, rgb(0x263a22), { bevel: 0.9, kind: KIND.stucco })
      const bx = x0 + dx + (i % 2 === 0 ? -11 : 10)
      g.lathe([[3.2, 0], [3.6, 2], [2.6, 4.4], [0, 5.2]], bx, y0 - 3.4, 9, rgb(0x2b4226), { base: 2.2, kind: KIND.stucco })
    })
  }
}
