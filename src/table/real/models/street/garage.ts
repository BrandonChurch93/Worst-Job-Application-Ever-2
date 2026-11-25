import { config } from '../../../../config'
import { BALL, railOf } from '../../../layout'
import { local, type Zone } from '../../zone'
import type { Buckets, RGB, V2, V3 } from './geo'
import { KIND, TONE, shade, site } from './kit'

// The round garage: a tower of three open decks on pillars round a ramp wall, inside the turns of the spiral rail.
// The ball on the rail fills a ring round it, so the tower keeps inside the rail's radius less half the layout's clearance.
export function garage(b: Buckets, z: Zone): void {
  const S = site(z, 'street.garage')
  const g = b.paint
  const cx = S.cx
  const cy = S.cy
  const rail = railOf('spiral')
  const p = rail.points[0]!
  const first = local(z, p[0] * BALL, p[1] * BALL)
  const R = Math.hypot(first[0] - cx, first[1] - cy) - (config.table.minClearanceBalls * BALL) / 2
  const top = S.base + S.h
  const decks = 5
  const pitch = (top - 6) / decks
  const slab = 5
  const core = R * 0.36
  const con: RGB = TONE.concrete

  const ring = (r: number, n = 48): V2[] => {
    const out: V2[] = []
    for (let k = 0; k < n; k++) out.push([cx + Math.cos((k / n) * Math.PI * 2) * r, cy + Math.sin((k / n) * Math.PI * 2) * r])
    return out
  }

  // The footing, screwed down.
  g.lathe([[R + 3, 0], [R + 3, 2.2], [R + 1.8, 3.4], [0, 3.4]], cx, cy, 48, shade(con, 0.7))
  for (let k = 0; k < 3; k++) b.screws.push([cx + Math.cos(0.6 + k * 2.1) * (R + 1.2), cy + Math.sin(0.6 + k * 2.1) * (R + 1.2), 2.8, 1.2])

  // The ramp wall up the middle, board marked, with a slot at each deck.
  g.lathe([[core, 3.4], [core, top + 9], [core - 2.5, top + 9], [core - 2.5, top + 3]], cx, cy, 36, con, { kind: KIND.concrete })
  g.slab(ring(core - 2.5, 24), top, top + 3, TONE.dark, { sides: false })

  for (let d = 1; d <= decks; d++) {
    const zt = 6 + d * pitch
    const zb = zt - slab
    // The deck: its soffit, its edge, its top with painted bays, and a kerb round the edge.
    g.lathe([[core, zb], [R - 1.5, zb], [R, zb + 1.5], [R, zt]], cx, cy, 56, con, { kind: KIND.concrete })
    const n = 56
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2
      const a1 = ((k + 1) / n) * Math.PI * 2
      const at = (r: number, a: number): V3 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, zt]
      g.face([at(core, a0), at(R, a0), at(R, a1), at(core, a1)], shade(con, d === decks ? 0.5 : 0.42), KIND.tar, [0, 0, 1])
    }
    g.lathe([[R, zt], [R, zt + 10], [R - 2.4, zt + 10], [R - 2.4, zt]], cx, cy, 56, shade(con, 1.08), { kind: KIND.concrete })
    // The lit wall of the ramp behind the deck, seen between the decks.
    if (d < decks) b.glow.lathe([[core + 0.3, zt + 1], [core + 0.3, zt + pitch - slab - 1]], cx, cy, 24, [0.42, 0.36, 0.27])
    // Bay lines, radial, and a ring line where the lane runs.
    const bays = 12
    for (let k = 0; k < bays; k++) {
      const a = ((k + 0.5) / bays) * Math.PI * 2
      const c = Math.cos(a)
      const s = Math.sin(a)
      const r0 = core + (R - core) * 0.42
      const r1 = R - 3.2
      const w = 0.5
      g.face([[cx + c * r0 + s * w, cy + s * r0 - c * w, zt + 0.12], [cx + c * r1 + s * w, cy + s * r1 - c * w, zt + 0.12], [cx + c * r1 - s * w, cy + s * r1 + c * w, zt + 0.12], [cx + c * r0 - s * w, cy + s * r0 + c * w, zt + 0.12]], shade(TONE.cream, 0.45), 0, [0, 0, 1])
    }
    // Pillars under the deck, square, with a head, set in from the edge.
    const pillars = 8
    const z0 = d === 1 ? 3.4 : 6 + (d - 1) * pitch
    for (let k = 0; k < pillars; k++) {
      const a = ((k + 0.5) / pillars) * Math.PI * 2
      const m = g.mark()
      g.box(-2.2, 2.2, -2, 2, z0, zb - 1.6, con, { kind: KIND.concrete })
      g.box(-3.2, 3.2, -2.8, 2.8, zb - 1.6, zb, shade(con, 1.04), { under: true })
      g.place(m, cx + Math.cos(a) * (core + (R - core) * 0.5), cy + Math.sin(a) * (core + (R - core) * 0.5), 0, a)
    }
    // Strip lamps under the deck: short tubes between the pillars, lit.
    for (let k = 0; k < pillars; k++) {
      const a = (k / pillars) * Math.PI * 2
      const m = b.glow.mark()
      b.glow.box(-0.9, 0.9, -7, 7, zb - 1.3, zb - 0.1, [1.5, 1.4, 1.1], { under: true, skip: 't' })
      b.glow.place(m, cx + Math.cos(a) * (core + (R - core) * 0.62), cy + Math.sin(a) * (core + (R - core) * 0.62), 0, a)
    }
    // A wheel stop at the head of every second bay.
    for (let k = 0; k < bays; k += 2) {
      const a = (k / bays) * Math.PI * 2
      const m = g.mark()
      g.box(-0.8, 0.8, -3.2, 3.2, zt, zt + 1.3, TONE.yellow, { bevel: 0.4, kind: KIND.gloss })
      g.place(m, cx + Math.cos(a) * (R - 5.5), cy + Math.sin(a) * (R - 5.5), 0, a)
    }
  }

  // Eight concrete fins stand round the tower from the footing to over the top deck, each with a sloped head.
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const m = g.mark()
    const ft = top + 11
    g.box(-7.4, 0, -1.7, 1.7, 3.4, ft - 4, shade(con, 1.06), { kind: KIND.concrete, skip: 't' })
    g.face([[-7.4, -1.7, ft - 4], [0, -1.7, ft - 4], [0, -1.7, ft], [-4.6, -1.7, ft]], shade(con, 1.06), KIND.concrete)
    g.face([[0, 1.7, ft - 4], [-7.4, 1.7, ft - 4], [-4.6, 1.7, ft], [0, 1.7, ft]], shade(con, 1.06), KIND.concrete)
    g.face([[-4.6, -1.7, ft], [0, -1.7, ft], [0, 1.7, ft], [-4.6, 1.7, ft]], shade(con, 1.12))
    g.face([[-7.4, -1.7, ft - 4], [-4.6, -1.7, ft], [-4.6, 1.7, ft], [-7.4, 1.7, ft - 4]], shade(con, 1.1))
    g.face([[0, -1.7, ft - 4], [0, 1.7, ft - 4], [0, 1.7, ft], [0, -1.7, ft]], shade(con, 1.06), KIND.concrete)
    g.place(m, cx + Math.cos(a) * (R - 0.2), cy + Math.sin(a) * (R - 0.2), 0, a)
  }

  // On the roof: the head of the stair, with a lit doorway.
  const zt = top
  const hm = g.mark()
  g.box(-7, 7, -5, 5, zt, zt + 13, con, { kind: KIND.concrete, bevel: 0.6 })
  g.box(-8, 8, -6, 6, zt + 13, zt + 14.6, shade(con, 0.9), { under: true, bevel: 0.5 })
  g.place(hm, cx + (core + 8) * 0.7, cy + (core + 8) * 0.7, 0, Math.PI / 4)
  const gm = b.glow.mark()
  b.glow.face([[-3, -5.1, zt + 0.4], [3, -5.1, zt + 0.4], [3, -5.1, zt + 10], [-3, -5.1, zt + 10]], [1, 0.9, 0.7], 0, [0, -1, 0])
  b.glow.place(gm, cx + (core + 8) * 0.7, cy + (core + 8) * 0.7, 0, Math.PI / 4)
}
