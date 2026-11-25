import type { RealContext } from '../../../../real/types'
import type { Zone } from '../../zone'
import type { Buckets, V3 } from './geo'
import { quoins, walls } from './firehouse'
import { KIND, TONE, band, beaconBase, board, parapet, reveal, shade, site, wallFace, windowAt, type Hole, type WindowLook } from './kit'

export function police(b: Buckets, z: Zone, ctx: RealContext): { beacon: V3 } {
  const S = site(z, 'street.police')
  const g = b.paint
  const i = 3
  const x0 = S.x0 + i
  const x1 = S.x1 - i
  const yf = S.yf + i
  const yb = S.yb - i
  const top = S.h
  const deck = top - 10
  const plinth = 15
  const storey = 66

  g.box(S.x0, S.x1, S.yf, S.yb, 0, 3, TONE.stoneDark, { bevel: 1 })
  for (const sx of [S.x0 + 1.6, S.x1 - 1.6]) b.screws.push([sx, S.yf + 1.6, 3, 1.1])

  const W0 = x1 - x0
  const entry: Hole = { x: W0 / 2 - 23, z: 3, w: 46, h: 61 }
  const up: WindowLook = { frame: TONE.white, wall: TONE.blue, sill: TONE.stonePale, lintel: TONE.stonePale, bars: [2, 3] }
  const low: WindowLook = { frame: TONE.iron, wall: TONE.blue, sill: TONE.stonePale, lintel: TONE.stonePale, bars: [2, 2], iron: true, warm: 0.3 }
  let n = 0
  const lum = (): number => [0.9, 0.6, 1, 0.75, 0.5, 1, 0.82][n++ % 7]!

  walls(b, x0, x1, yf, yb, 0, (side, W) => {
    const upper: Hole[] = []
    const lower: Hole[] = []
    if (side === 'front') {
      for (const k of [0, 1, 3, 4]) upper.push({ x: 20 + k * 44.5, z: 84, w: 16, h: 30 })
      upper.push({ x: W / 2 - 9, z: 86, w: 18, h: 28 })
      for (const x of [18, 54, W - 34, W - 70]) lower.push({ x, z: 30, w: 16, h: 24 })
    } else if (side !== 'back') {
      for (let k = 0; k < 3; k++) {
        upper.push({ x: 18 + k * 43, z: 84, w: 16, h: 30 })
        lower.push({ x: 18 + k * 43, z: 30, w: 16, h: 24 })
      }
    }
    wallFace(g, 0, W, 3, plinth, side === 'front' ? [entry] : [], TONE.stone, KIND.block)
    wallFace(g, 0, W, plinth, top - 3, side === 'front' ? [entry, ...lower, ...upper] : [...lower, ...upper], TONE.blue, KIND.painted)
    band(g, -1.2, W + 1.2, plinth - 2, plinth + 1.2, 1.6, TONE.stonePale)
    band(g, -1.2, W + 1.2, storey, storey + 3.5, 1.6, TONE.stonePale)
    band(g, -2.4, W + 2.4, deck - 7, deck - 2, 2.8, TONE.stonePale)
    quoins(b, W, plinth + 1.5, deck - 8, TONE.blueTrim)
    upper.forEach((h) => windowAt(b, h, { ...up, glow: lum() }))
    lower.forEach((h) => windowAt(b, h, { ...low, glow: lum() }))
    if (side !== 'front') return
    // The entrance: a recess with pale stone steps up to double doors, a stone frame with a small pediment, and a round lamp over the doors.
    const deep = 17
    reveal(g, entry, deep, shade(TONE.stonePale, 0.8))
    const a = entry.x
    const c = entry.x + entry.w
    const zt = entry.z + entry.h
    for (let k = 0; k < 4; k++) g.box(a, c, k * 3.2, deep, 3, 3 + (k + 1) * 3, TONE.stonePale, { skip: 'lrb', bevel: 0.3 })
    const dz = 15
    const dt = zt - 9
    const mid = (a + c) / 2
    g.quad([a, deep, dz], [c, deep, dz], [c, deep, zt], [a, deep, zt], shade(TONE.stonePale, 0.7))
    for (const [p, q] of [[a + 5, mid - 0.4], [mid + 0.4, c - 5]] as const) {
      g.box(p, q, deep - 1.3, deep, dz, dt, TONE.blueDark, { skip: 'b', kind: KIND.gloss, bevel: 0.3 })
      b.glow.face([[p + 2.5, deep - 1.35, dz + 22], [q - 2.5, deep - 1.35, dz + 22], [q - 2.5, deep - 1.35, dt - 3], [p + 2.5, deep - 1.35, dt - 3]], [0.75, 0.68, 0.55], 0, [0, -1, 0])
      g.box(p + 2.5, q - 2.5, deep - 1.8, deep - 1.3, dz + 3, dz + 18, shade(TONE.blueDark, 1.25), { skip: 'b', kind: KIND.gloss, bevel: 0.3 })
    }
    for (const hx of [mid - 2.6, mid + 1.4]) b.metal.box(hx, hx + 1.2, deep - 3, deep - 1.3, dz + 14, dz + 24, TONE.brass, { under: true })
    b.glow.face([[a + 5, deep - 0.4, dt + 1], [c - 5, deep - 0.4, dt + 1], [c - 5, deep - 0.4, zt - 1.5], [a + 5, deep - 0.4, zt - 1.5]], [0.9, 0.8, 0.6], 0, [0, -1, 0])
    g.box(a - 6, a, -2.6, 0, 3, zt, TONE.stonePale, { skip: 'b', bevel: 0.7, kind: KIND.block })
    g.box(c, c + 6, -2.6, 0, 3, zt, TONE.stonePale, { skip: 'b', bevel: 0.7, kind: KIND.block })
    g.box(a - 8, c + 8, -3.4, 0, zt, zt + 5, TONE.stonePale, { skip: 'b', under: true, bevel: 0.7 })
    const p0: V3 = [a - 8, -3.4, zt + 5]
    const p1: V3 = [c + 8, -3.4, zt + 5]
    const p2: V3 = [mid, -3.4, zt + 17]
    g.face([p0, p1, p2], TONE.stonePale)
    g.face([p0, p2, [mid, 0, zt + 17], [a - 8, 0, zt + 5]], shade(TONE.stonePale, 1.08))
    g.face([p2, p1, [c + 8, 0, zt + 5], [mid, 0, zt + 17]], shade(TONE.stonePale, 1.08))
    // The lamp: a globe on a short iron arm.
    b.metal.rod([mid, 0, zt - 3.5], [mid, -6.5, zt - 3.5], 0.8, 8, TONE.iron)
    b.metal.lathe([[0, 0], [2.4, 0.4], [2.4, 1.4], [0, 1.8]], mid, -6.5, 12, TONE.iron, { base: zt - 4.2 })
    b.glow.lathe([[0, -9.6], [2.6, -8.8], [4.3, -6.6], [4.8, -4.2], [4.2, -2], [2.4, -0.4], [0, 0]], mid, -6.5, 16, [0.75, 1.05, 1.9], { base: zt - 4.2 })
  })

  g.quad([x0 + 5, yf + 5, deck], [x1 - 5, yf + 5, deck], [x1 - 5, yb - 5, deck], [x0 + 5, yb - 5, deck], TONE.roof, KIND.tar)
  parapet(g, x0, x1, yf, yb, deck, top, 6, TONE.blue, TONE.stonePale, KIND.brick)

  // On the roof: a stair house with a door, a radio mast, a cooling unit and two vents.
  const sx0 = x0 + 12
  const sy1 = yb - 10
  g.box(sx0, sx0 + 38, sy1 - 30, sy1, deck, deck + 24, TONE.blue, { kind: KIND.painted, top: TONE.roof, topKind: KIND.tar })
  g.box(sx0 - 1.5, sx0 + 39.5, sy1 - 31.5, sy1 + 1.5, deck + 24, deck + 26.5, TONE.stonePale, { under: true, bevel: 0.8 })
  g.box(sx0 + 39, sx0 + 39.8, sy1 - 22, sy1 - 10, deck, deck + 18, TONE.iron, { skip: 'l', kind: KIND.gloss })
  const mx = sx0 + 19
  const my = sy1 - 15
  b.metal.rod([mx, my, deck + 26.5], [mx, my, deck + 62], 0.9, 8, TONE.steel)
  for (const [zz, w] of [[deck + 44, 9], [deck + 51, 7], [deck + 58, 5]] as const) b.metal.rod([mx - w, my, zz], [mx + w, my, zz], 0.5, 6, TONE.steel)
  b.metal.lathe([[2.6, 0], [2.6, 1.6], [1.2, 2.6], [0, 2.6]], mx, my, 12, TONE.steel, { base: deck + 26.5 })
  const ax = x1 - 52
  const ay = yb - 34
  g.box(ax, ax + 28, ay, ay + 19, deck, deck + 10, TONE.concrete, { bevel: 1 })
  for (let k = 0; k < 5; k++) g.box(ax + 3.5 + k * 4.4, ax + 5.8 + k * 4.4, ay + 2.5, ay + 16.5, deck + 10, deck + 10.7, TONE.concreteDark)
  for (const [vx, vy] of [[x1 - 22, yf + 42], [x0 + 24, yf + 38]] as const) b.metal.lathe([[3.4, 0], [3.4, 8], [5.2, 9.5], [5.2, 11], [0, 12.5]], vx, vy, 14, TONE.alu, { base: deck })
  for (const [px, py] of [[x0 + 9, yf + 9], [x1 - 9, yf + 9], [x1 - 9, yb - 9]] as const) b.screws.push([px, py, deck, 1.6])

  const beacon: V3 = [S.cx, S.yb - S.d * 0.3, deck]
  beaconBase(b, beacon[0], beacon[1], deck)
  board(b, z, ctx, 'street.police', deck)
  return { beacon }
}
