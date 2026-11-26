import type { RealContext } from '../../../../real/types'
import type { Zone } from '../../zone'
import type { Buckets } from './geo'
import { walls } from './firehouse'
import { KIND, TONE, band, board, mix, parapet, shade, site, wallFace, windowAt, type Hole } from './kit'

export function bank(b: Buckets, z: Zone, ctx: RealContext): void {
  const S = site(z, 'street.bank')
  const g = b.paint
  const stone = mix(TONE.stonePale, TONE.lime, 0.3)
  const top = S.h
  const steps = 3
  const tread = 3.6
  const riser = 3
  const podium = 3 + steps * riser
  const entab = top - 31
  const roofFoot = entab + 12

  // The stepped base: each step runs round the front and the side that faces the table.
  g.box(S.x0, S.x1, S.yf, S.yb, 0, 3, TONE.stoneDark, { bevel: 0.8 })
  for (let k = 0; k < steps; k++) g.box(S.x0 + 2, S.x1 - 2 - k * tread, S.yf + 2 + k * tread, S.yb - 2, 3 + k * riser, 3 + (k + 1) * riser, stone, { bevel: 0.4, kind: KIND.block })
  b.screws.push([S.x0 + 1.4, S.yf + 1.4, 3, 1], [S.x1 - 1.4, S.yf + 1.4, 3, 1])

  const x0 = S.x0 + 5
  const x1 = S.x1 - 2 - steps * tread - 1
  const yf = S.yf + 2 + steps * tread + 20
  const yb = S.yb - 4
  const pf = S.yf + 2 + steps * tread + 1.5
  const W = x1 - x0
  const doorH = 46
  const doors: Hole = { x: W / 2 - 11, z: 0, w: 22, h: doorH }

  walls(b, x0, x1, yf, yb, podium, (side, width) => {
    const tall: Hole[] = [{ x: 7, z: 6, w: 11, h: doorH - 6 }, { x: width - 18, z: 6, w: 11, h: doorH - 6 }]
    const holes: Hole[] = side === 'front' ? [doors, ...tall] : side === 'right' ? [{ x: 10, z: 12, w: 11, h: 40 }, { x: width / 2 - 5.5, z: 12, w: 11, h: 40 }, { x: width - 21, z: 12, w: 11, h: 40 }] : []
    wallFace(g, 0, width, 0, entab - podium, holes, side === 'front' ? shade(stone, 0.8) : stone, KIND.block)
    if (side === 'right') {
      for (const h of holes) windowAt(b, h, { frame: TONE.bronze, wall: stone, sill: TONE.stone, bars: [1, 4], glow: 1, warm: 0.2, depth: 3 })
      for (const px of [3, width / 2 - 14, width / 2 + 10, width - 7]) g.box(px, px + 4, -1.4, 0, 0, entab - podium, shade(stone, 1.04), { skip: 'b' })
    }
    if (side !== 'front') return
    for (const h of tall) windowAt(b, h, { frame: TONE.bronze, wall: stone, bars: [1, 4], glow: 1.25, warm: 0.1, depth: 3 })
    // The tall bronze doors in a stone frame, a lit transom over them, and the night deposit slot beside them.
    const d = 4
    const a = doors.x
    const c = doors.x + doors.w
    g.quad([a, 0, 0], [a, d, 0], [a, d, doorH], [a, 0, doorH], shade(stone, 0.7))
    g.quad([c, d, 0], [c, 0, 0], [c, 0, doorH], [c, d, doorH], shade(stone, 0.7))
    g.quad([a, d, doorH], [c, d, doorH], [c, 0, doorH], [a, 0, doorH], shade(stone, 0.6))
    const mid = (a + c) / 2
    for (const [p, q] of [[a, mid - 0.3], [mid + 0.3, c]] as const) {
      b.metal.box(p, q, d - 1.4, d, 0, doorH - 8, TONE.bronze, { skip: 'b' })
      for (let k = 0; k < 3; k++) b.metal.box(p + 1.6, q - 1.6, d - 2, d - 1.4, 2.5 + k * 12, 12 + k * 12, shade(TONE.bronze, 1.25), { skip: 'b', bevel: 0.4 })
    }
    for (const hx of [mid - 1.9, mid + 0.9]) b.metal.box(hx, hx + 1, d - 3.2, d - 2, 15, 24, TONE.brass, { under: true })
    b.glow.face([[a, d - 0.4, doorH - 7], [c, d - 0.4, doorH - 7], [c, d - 0.4, doorH], [a, d - 0.4, doorH]], [1, 0.9, 0.7], 0, [0, -1, 0])
    b.metal.box(a, c, d - 1.2, d, doorH - 8, doorH - 7, TONE.bronze, { skip: 'b', under: true })
    band(g, a - 3, c + 3, doorH, doorH + 3.5, 1.4, shade(stone, 1.05))
    const nx = c + 7
    b.metal.box(nx, nx + 11, -0.8, 0, 14, 23, TONE.bronze, { skip: 'b', under: true, bevel: 0.3 })
    g.box(nx + 1.6, nx + 9.4, -0.9, -0.8, 19, 20.6, TONE.dark, { skip: 'b', under: true })
    b.metal.box(nx + 2, nx + 9, -1.5, -0.8, 15.5, 17.4, shade(TONE.bronze, 1.3), { skip: 'b', under: true, bevel: 0.3 })
    // A warm lamp in the ceiling of the porch, over the doors.
    b.glow.box(mid - 4, mid + 4, -12, -7, entab - podium - 1.2, entab - podium, [1.5, 1.3, 0.95], { under: true, skip: 't' })
  })

  // Four fluted columns: a base, a shaft that narrows, a plain capital.
  const span = S.x1 - 2 - steps * tread - (S.x0 + 2)
  const cx0 = S.x0 + 2
  for (const u of [0.11, 0.37, 0.63, 0.89]) {
    const cx = cx0 + span * u
    const cy = pf + 9
    g.box(cx - 8.4, cx + 8.4, cy - 8.4, cy + 8.4, podium, podium + 2.2, stone, { bevel: 0.6 })
    g.lathe([[8, 0], [8, 1.5], [7.1, 2.1], [7.6, 2.9], [6.8, 3.6]], cx, cy, 24, stone, { base: podium + 2.2 })
    g.lathe([[6.6, 0], [6.5, (entab - podium - 11.8) * 0.4], [5.7, entab - podium - 11.8]], cx, cy, 48, stone, { base: podium + 5.8, wave: [16, 0.17] })
    g.lathe([[5.8, 0], [6.2, 0.8], [5.9, 1.4], [7.6, 3.2], [7.6, 4]], cx, cy, 24, stone, { base: entab - 6.6 })
    g.box(cx - 8.3, cx + 8.3, cy - 8.3, cy + 8.3, entab - 2.8, entab, stone, { under: true, bevel: 0.4 })
  }

  // The entablature and the roof with a plain pediment at the front and the back.
  const ex0 = S.x0 + 2
  const ex1 = S.x1 - 2 - steps * tread + 1
  const ey0 = pf - 1.5
  const ey1 = S.yb - 2
  g.box(ex0, ex1, ey0, ey1, entab, entab + 7, stone, { under: true })
  g.box(ex0 - 1.6, ex1 + 1.6, ey0 - 1.6, ey1 + 1.6, entab + 7, roofFoot, shade(stone, 1.04), { under: true, bevel: 0.8 })
  for (let k = 0; k < 9; k++) {
    const dx = ex0 + 3 + (k * (ex1 - ex0 - 9)) / 8
    g.box(dx, dx + 3, ey0 - 1, ey0, entab + 3.5, entab + 6.5, shade(stone, 0.96), { skip: 'b', under: true })
  }
  // The attic over the cornice and a flat roof inside its parapet.
  const deck = top - 8
  g.box(ex0 + 1, ex1 - 1, ey0 + 1, ey1 - 1, roofFoot, top - 3, stone, { kind: KIND.block, skip: 't' })
  g.quad([ex0 + 7, ey0 + 7, deck], [ex1 - 7, ey0 + 7, deck], [ex1 - 7, ey1 - 7, deck], [ex0 + 7, ey1 - 7, deck], TONE.roof, KIND.tar)
  parapet(g, ex0 + 1, ex1 - 1, ey0 + 1, ey1 - 1, deck, top, 7, stone, shade(stone, 1.08), KIND.stucco)
  g.box(ex1 - 30, ex1 - 16, ey1 - 26, ey1 - 14, deck, deck + 4.5, TONE.stoneDark, { bevel: 0.8 })
  b.metal.lathe([[2.6, 0], [2.6, 6], [4, 7.2], [4, 8.4], [0, 9.6]], ex0 + 20, ey1 - 20, 12, TONE.alu, { base: deck })
  board(b, z, ctx, 'street.bank', deck)
}
