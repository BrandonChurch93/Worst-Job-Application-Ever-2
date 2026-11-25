import type { RealContext } from '../../../../real/types'
import { BALL, holdOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type Buckets, type V3 } from './geo'
import { house, mailbox } from './houses'
import { KIND, TONE, board, rgb, shade, site, type Hole } from './kit'

export interface Moms {
  // One cellar door, lying shut: its hinge along its own y axis at x 0, the door toward +x.
  door: Geo
  // The light that comes up from the cellar: a sleeve inside the mouth and its floor.
  light: Geo
  // The hinges of the two doors, the slope the doors lie at, and the hatch's middle.
  hinge: [V3, V3]
  tilt: number
  at: V3
}

export const HATCH = { half: 55, long: 114, thick: 2.2, open: 1.5, low: 3.5, high: 8 }

export function moms(b: Buckets, z: Zone, ctx: RealContext): Moms {
  const S = site(z, 'street.mom')
  const g = b.paint
  const wall = rgb(0xece3cd)
  const trim = TONE.white
  const roof = rgb(0x6e2723)

  g.box(S.x0, S.x1, S.yf, S.yb, 0, 2.6, TONE.stone, { bevel: 0.8, top: rgb(0x4f6b3c), topKind: KIND.stucco })
  b.screws.push([S.x0 + 1.5, S.yf + 1.5, 2.6, 1.1], [S.x1 - 1.5, S.yf + 1.5, 2.6, 1.1], [S.x1 - 1.5, S.yb - 1.5, 2.6, 1.1])

  const x0 = S.x0 + 5
  const x1 = S.x1 - 5
  const yb = S.yb - 3
  const yf = S.yf + 25
  const W = x1 - x0
  const base = 8
  const top = S.h - 5
  g.box(x0 - 1, x1 + 1, yf - 1, yb + 1, 2.6, base, TONE.stoneDark, { kind: KIND.block })
  const door: Hole = { x: W / 2 - 5.5, z: 0, w: 11, h: 22 }
  const wins: Hole[] = [{ x: 8, z: 8, w: 13, h: 15 }, { x: W - 21, z: 8, w: 13, h: 15 }]
  const side: Hole[] = [{ x: (yb - yf) / 2 - 5, z: 9, w: 10, h: 13 }]
  house(b, x0, x1, yf, yb, base, top, { wall, kind: KIND.board, roof, ridge: 'x', door: rgb(0x3b5a4a), trim, eave: 36, chimney: 1, glow: [1, 0.85, 0.6, 0.9] }, { door, windows: wins, side, depth: 2.6 })

  // A window in the gable at each end, under the ridge.
  for (const sx of [-1, 1]) {
    const x = sx < 0 ? x0 - 0.3 : x1 + 0.3
    const my = (yf + yb) / 2
    const pts: V3[] = [[x, my - 4 * sx, base + 40], [x, my + 4 * sx, base + 40], [x, my + 4 * sx, base + 49], [x, my - 4 * sx, base + 49]]
    b.glow.face(sx < 0 ? [...pts].reverse() : pts, [0.9, 0.78, 0.6], 0, [sx, 0, 0])
  }

  // The porch: a deck of boards, four turned posts, a rail and a lean-to roof.
  const py0 = S.yf + 4
  const deck = base
  g.box(x0, x1, py0, yf, 2.6, deck, rgb(0x8a8474), { skip: 'b', kind: KIND.board })
  for (let k = 0; k < 2; k++) g.box(x0 + W / 2 - 9, x0 + W / 2 + 9, py0 - 3 * (k + 1), py0 - 3 * k, 2.6, deck - 1.8 * (k + 1), TONE.stonePale, { skip: 'b', bevel: 0.3 })
  const posts = [x0 + 1.5, x0 + W / 2 - 11, x0 + W / 2 + 11, x1 - 1.5]
  for (const px of posts) {
    g.box(px - 1.2, px + 1.2, py0 + 0.6, py0 + 3, deck, deck + 27, trim)
    g.box(px - 1.8, px + 1.8, py0, py0 + 3.6, deck + 25, deck + 27, trim, { under: true })
  }
  for (const [a, c] of [[posts[0]!, posts[1]!], [posts[2]!, posts[3]!]] as const) {
    g.box(a, c, py0 + 1.2, py0 + 2.4, deck + 8.5, deck + 9.8, trim, { under: true, skip: 'lr' })
    for (let px = a + 3; px < c - 1; px += 3) g.box(px - 0.4, px + 0.4, py0 + 1.5, py0 + 2.1, deck, deck + 8.5, trim, { skip: 't' })
  }
  const pr: V3[] = [[x0 - 2.5, py0 - 2.5, deck + 26.5], [x1 + 2.5, py0 - 2.5, deck + 26.5], [x1 + 2.5, yf + 0.2, deck + 33.5], [x0 - 2.5, yf + 0.2, deck + 33.5]]
  g.face(pr, shade(roof, 0.92), KIND.shingle)
  g.face([...pr].reverse(), shade(trim, 0.6))
  g.box(x0 - 2.5, x1 + 2.5, py0 - 2.5, py0 - 1.4, deck + 25, deck + 26.5, trim, { under: true })

  // The porch light, lit: a small lantern beside the door.
  const lx = x0 + W / 2 + 9.5
  b.metal.box(lx - 0.9, lx + 0.9, yf - 2.6, yf, deck + 21.5, deck + 22.4, TONE.iron, { under: true })
  b.glow.box(lx - 1.5, lx + 1.5, yf - 3.8, yf - 1, deck + 17.5, deck + 21.5, [1.7, 1.5, 1.1], { under: true })
  b.metal.box(lx - 1.9, lx + 1.9, yf - 4.2, yf - 0.6, deck + 21.5, deck + 22.1, TONE.iron, { under: true })

  // The flower box under the left window, and the mat before the door, with nothing on it.
  const fx = x0 + 7
  g.box(fx, fx + 15, yf - 3.4, yf, deck + 4.2, deck + 7.2, TONE.woodDark, { skip: 'b', under: true })
  const petals = [rgb(0xc8324a), rgb(0xe7d24a), rgb(0xd97ab0), rgb(0xf0ece0)]
  for (let k = 0; k < 7; k++) {
    g.box(fx + 0.8 + k * 2, fx + 2.6 + k * 2, yf - 3, yf - 0.6, deck + 7.2, deck + 8.6 + (k % 3) * 0.7, rgb(0x3d6b35), { bevel: 0.6, kind: KIND.stucco })
    g.box(fx + 1.2 + k * 2, fx + 2.2 + k * 2, yf - 2.5 + (k % 2), yf - 1.5 + (k % 2), deck + 8.6 + (k % 3) * 0.7, deck + 9.5 + (k % 3) * 0.7, petals[k % 4]!, { bevel: 0.3 })
  }
  g.box(x0 + W / 2 - 6.5, x0 + W / 2 + 6.5, yf - 10, yf - 2.5, deck, deck + 0.7, rgb(0x6b5b43), { skip: 'b', kind: KIND.stucco, bevel: 0.2 })
  mailbox(b, S.x1 - 4, S.yf + 2.2, 2.6, TONE.iron)
  board(b, z, ctx, 'street.mom', deck + 27)

  // The cellar hatch: a timber frame round the mouth in the floor, low where the ball comes in and higher at the far end.
  const hold = holdOf('street.mom')
  const at = localBalls(z, hold.c[0], hold.c[1])
  const half = HATCH.half
  const hy = HATCH.long / 2
  const t = 5
  const wood = TONE.wood
  const fm = g.mark()
  const rail = (sx: number): void => {
    const xa = sx < 0 ? -half - t : half
    const xb = xa + t
    const lo = HATCH.low
    const hi = HATCH.high
    g.quad([xa, -hy - t, hi], [xb, -hy - t, hi], [xb, hy + t, lo], [xa, hy + t, lo], wood, KIND.board)
    g.quad([xa, hy + t, 0], [xa, -hy - t, 0], [xa, -hy - t, hi], [xa, hy + t, lo], shade(wood, 0.85), KIND.board)
    g.quad([xb, -hy - t, 0], [xb, hy + t, 0], [xb, hy + t, lo], [xb, -hy - t, hi], shade(wood, 0.85), KIND.board)
  }
  rail(-1)
  rail(1)
  g.box(-half - t, half + t, -hy - t, -hy, 0, HATCH.high, wood, { kind: KIND.board, skip: 'lr', bevel: 0.5 })
  g.box(-half - t, half + t, hy, hy + t, 0, HATCH.low, wood, { kind: KIND.board, skip: 'lr', bevel: 0.8 })
  g.place(fm, at[0], at[1], 0, 0)
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) b.screws.push([at[0] + sx * (half + t / 2), at[1] + sy * (hy - 6), sy < 0 ? HATCH.high - 0.5 : HATCH.low + 0.4, 1.3])

  // One door: five boards side by side, two battens underneath, two strap hinges and a ring pull.
  const d = new Geo()
  const w = half - 0.6
  const n = 5
  for (let k = 0; k < n; k++) {
    const a = 0.5 + (k * (w - 0.5)) / n
    const c = 0.5 + ((k + 1) * (w - 0.5)) / n
    d.box(a + 0.25, c - 0.25, -hy + 0.5, hy - 0.5, 0, HATCH.thick, shade(wood, 0.9 + 0.06 * ((k * 3) % 4)), { under: true, bevel: 0.45, kind: KIND.plain })
  }
  for (const sy of [-1, 1]) {
    d.box(2.5, w - 2.5, sy * 34 - 4, sy * 34 + 4, -1.8, 0, TONE.woodDark, { under: true, skip: 't' })
    d.box(-0.6, 40, sy * 34 - 2.4, sy * 34 + 2.4, HATCH.thick, HATCH.thick + 0.8, TONE.iron, { bevel: 0.3, kind: KIND.gloss })
    d.lathe([[0, 0], [1.5, 0], [1.5, 1.2], [0, 1.2]], 40, sy * 34, 10, TONE.iron, { base: HATCH.thick, kind: KIND.gloss })
    d.rod([0, sy * 34 - 4.5, HATCH.thick * 0.5], [0, sy * 34 + 4.5, HATCH.thick * 0.5], 1.5, 10, TONE.iron, KIND.gloss)
    for (const bx of [6, 20, 33]) d.lathe([[0.9, 0], [0.9, 0.5], [0, 0.8]], bx, sy * 34, 8, TONE.steel, { base: HATCH.thick + 0.8, kind: KIND.gloss })
  }
  d.box(w - 13, w - 5, -4, 4, HATCH.thick, HATCH.thick + 0.6, TONE.iron, { bevel: 0.2, kind: KIND.gloss })
  for (let k = 0; k < 12; k++) {
    const a0 = (k / 12) * Math.PI * 2
    const a1 = ((k + 1) / 12) * Math.PI * 2
    d.rod([w - 9 + Math.cos(a0) * 3.6, Math.sin(a0) * 3.6 - 1, HATCH.thick + 1.2], [w - 9 + Math.cos(a1) * 3.6, Math.sin(a1) * 3.6 - 1, HATCH.thick + 1.2], 0.6, 6, TONE.steel, KIND.gloss, false)
  }

  const light = new Geo()
  const r = hold.r * BALL * 1.08
  light.lathe([[r, -22], [r, 1.5]], 0, 0, 40, (k) => (k === 0 ? [0.55, 0.5, 0.42] : [0.3, 0.28, 0.24]))
  const disc: V3[] = []
  for (let k = 0; k < 40; k++) disc.push([Math.cos((k / 40) * Math.PI * 2) * r, Math.sin((k / 40) * Math.PI * 2) * r, -22])
  light.face(disc, [1, 0.92, 0.78], 0, [0, 0, 1])
  // The sleeve is seen from inside.
  const inner = new Geo()
  inner.lathe([[r, 1.5], [r, -22]], 0, 0, 40, [0.5, 0.46, 0.38])
  light.add(inner)
  light.place(0, at[0], at[1], 0, 0)

  const tilt = Math.atan2(HATCH.high - HATCH.low, HATCH.long + t)
  const zm = (HATCH.high + HATCH.low) / 2 + 0.3
  return { door: d, light, hinge: [[at[0] - half, at[1], zm], [at[0] + half, at[1], zm]], tilt, at }
}
