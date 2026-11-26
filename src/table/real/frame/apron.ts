import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { APRON_Y, BALL, COLS } from '../../layout'
import { local, localBalls, localOf, shapesIn, type Zone } from '../zone'
import { Geo, roundedLoop, type V2 } from './geo'
import { Screws, TONE, aluOf, clearOf, hex, mesh, paintOf, screwOf, shade } from './mats'

const SLAB = { height: 16, bevel: 6.5, corner: 18, cuts: 4, grain: 0.02 }
// The frame round the apron: the two rails run on from the street tier and a slim rail closes them in front. `low` is how high they stand where the apron lies at the page's own height.
export const EDGE = { gap: 1.6, near: 44, low: 7, chamfer: 3, deck: 3, slot: [86, 40] as V2, bezel: 7, skin: 1.2, skirt: 1, panel: 10, land: 60, shell: 20 }
const WALL: [number, number, number] = [0.085, 0.125, 0.235]
// The outside of the near end faces the room, not the well: it stands as bright as the land on top of the rails.
const FRONT = shade(hex(0xf4ecd9), 5)
const SLOPE = shade(hex(0xe6dfce), 0.4)
// The slabs are cast a warm cream white.
const CREAM = hex(0xf4ecd9)
const CARD = { cover: 12, thick: 2.6, lift: 1.4 }
const THROAT = { long: 150, deep: 80, cheek: 12 }

export function apron(z: Zone, ctx: RealContext): THREE.Object3D {
  const C = new Geo()
  const A = new Geo()
  const P = new Geo()
  const G = new Geo()
  const screws = new Screws()
  const o = new THREE.Group()
  o.name = `table-frame.${z.id}`
  // The page's fields of the apron are laid on its plate, whether the page gives their height from its own surface or from the apron's floor.
  const laid = (v: number): number => (z.floor < 0 && v >= -z.floor - 0.01 ? v + z.floor : v)
  const boxOf = (id: string): { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number } | null => {
    const s = ctx.byId.get(id)
    if (!s) return null
    const a = local(z, s.x, s.y + s.h, s.z0)
    const b = local(z, s.x + s.w, s.y, s.z1)
    return { x0: a[0], x1: b[0], y0: a[1], y1: b[1], z0: laid(a[2]), z1: laid(b[2]) }
  }
  const card = boxOf('apron-card')
  // The apron lies in the well: the page stands `H` over it. The rails keep their land at the page's height.
  const H = Math.max(EDGE.low, -z.floor)
  const X = (u: number): number => localBalls(z, u, APRON_Y)[0]
  const yT = z.height / 2
  const yB = -z.height / 2
  const c = EDGE.chamfer
  const xb = X(COLS.border)
  const xe = X(COLS.railB)
  const xa = X(COLS.liftA)
  const xc = X(COLS.launchB)
  // In the well the near rail stands no taller than the slabs, and the two side rails come down to it from the street's height over the apron's length.
  const sunk = z.floor < 0
  const Hn = sunk ? SLAB.height : H
  const tone = (outline: V2[], top: number) => (edge: number): [number, number, number] => {
    const p = outline[edge]!
    const q = outline[(edge + 1) % outline.length]!
    return p[1] >= top - c - 0.01 && q[1] >= top - c - 0.01 ? TONE.aluBright : top > 30 ? WALL : TONE.alu
  }
  const y0 = yB + EDGE.near
  const heightAt = (y: number): number => Hn + ((H - Hn) * (y - y0)) / (yT - y0)
  const up: [number, number, number] = [0, -(H - Hn), yT - y0]
  const run: [number, number, number] = [0, yT - y0, H - Hn]
  const wedge = (g: Geo, x0: number, x1: number, d: number, top: [number, number, number] | null, at0: [number, number, number] | null, at1: [number, number, number] | null): void => {
    const a = Hn - d
    const b = H - d
    if (top) g.face([[x0, y0, a], [x1, y0, a], [x1, yT, b], [x0, yT, b]], up, [1, 0, 0], top)
    if (at0) g.face([[x0, y0, 0], [x0, y0, a], [x0, yT, b], [x0, yT, 0]], [-1, 0, 0], [0, 1, 0], at0)
    if (at1) g.face([[x1, y0, 0], [x1, y0, a], [x1, yT, b], [x1, yT, 0]], [1, 0, 0], [0, 1, 0], at1)
  }
  // Each side rail comes down to the near rail as one land of brushed aluminium, from the page's edge to the lane.
  const side = (x0: number, x1: number, inner: 0 | 1): void => {
    if (sunk) {
      const [a, b] = inner === 1 ? [X(0), x1] : [x0, X(20)]
      // The enamelled land of the rail runs on down the wedge to the near rail: only its upright sides are the navy of the walls.
      const m = inner === 1 ? xb + EDGE.land : xe - EDGE.shell
      wedge(A, a, m, 0, SLOPE, inner === 0 ? WALL : TONE.aluDark, null)
      wedge(A, m, b, 0, SLOPE, null, inner === 1 ? WALL : TONE.aluDark)
      A.face([[a, yT, 0], [b, yT, 0], [b, yT, H], [a, yT, H]], [0, 1, 0], [1, 0, 0], TONE.aluDark)
      const xm = inner === 1 ? a + EDGE.near / 2 : b - EDGE.near / 2
      for (const t of [0.3, 0.8]) screws.add(xm, y0 + (yT - y0) * t, heightAt(y0 + (yT - y0) * t), 0.7, x0 + t, new THREE.Vector3(...up))
      return
    }
    const o: V2[] = [[x0, 0], [x0, H - c], [x0 + c, H], [x1 - c, H], [x1, H - c], [x1, 0]]
    A.prism(o, [0, y0], [0, yT], tone(o, H))
    for (const t of [0.3, 0.8]) screws.add((x0 + x1) / 2, y0 + (yT - y0) * t, H, 0.9, x0 + t)
  }
  if (sunk) {
    // The outside of the near end is one face of aluminium.
    A.box(X(0), X(20), yB, yB + EDGE.skin, -EDGE.skirt * BALL, Hn, FRONT, { along: [1, 0, 0], top: TONE.aluBright })
    for (const [x0, x1] of [[X(0), xb], [xe, X(20)]] as [number, number][]) A.box(x0, x1, yB + EDGE.skin, y0, 0, Hn, TONE.alu, { along: [0, 1, 0], top: TONE.aluBright })
  }
  side(xb, xa, 1)
  side(xc, xe, 0)
  const front = sunk ? yB + EDGE.skin : yB
  const near: V2[] = [[0, 0], [0, Hn - c], [c, Hn], [y0 - front - c, Hn], [y0 - front, Hn - c], [y0 - front, 0]]
  A.prism(near, [xe, front], [xb, front], tone(near, Hn))
  for (let i = 0; i < 9; i++) screws.add(xb + 60 + ((xe - xb - 120) * i) / 8, yB + EDGE.near / 2, Hn, 0.9, i * 1.7)
  let throat: [number, number, number, number] | null = null
  for (const id of ['apron-left', 'apron-right']) {
    const s = boxOf(id)
    if (!s) continue
    // The slab the card lies on, whichever of the two it is, ends at the card's underside.
    const under = !!card && (card.x0 + card.x1) / 2 > s.x0 && (card.x0 + card.x1) / 2 < s.x1
    const top = under ? card.z0 : Math.max(SLAB.height, s.z1)
    // The slab's edge is turned over in a soft round, not cut to a line.
    const r = SLAB.bevel
    const ring = (d: number): V2[] => roundedLoop(s.x0 + d, s.x1 - d, s.y0 + d, s.y1 - d, SLAB.corner - d, 5)
    const at = (i: number): [number, number] => [r * (1 - Math.cos((i / SLAB.cuts) * (Math.PI / 2))), top - r + r * Math.sin((i / SLAB.cuts) * (Math.PI / 2))]
    const foot = ring(0)
    for (let j = 0; j < foot.length; j++) {
      const p = foot[j]!
      const q = foot[(j + 1) % foot.length]!
      C.face([[p[0], p[1], 0], [q[0], q[1], 0], [q[0], q[1], top - r], [p[0], p[1], top - r]], [q[1] - p[1], p[0] - q[0], 0], [q[0] - p[0], q[1] - p[1], 0], CREAM)
    }
    for (let i = 0; i < SLAB.cuts; i++) {
      const [d0, z0] = at(i)
      const [d1, z1] = at(i + 1)
      const lo = ring(d0)
      const hi = ring(d1)
      const a = ((i + 0.5) / SLAB.cuts) * (Math.PI / 2)
      for (let j = 0; j < lo.length; j++) {
        const k = (j + 1) % lo.length
        const p = lo[j]!
        const q = lo[k]!
        const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
        C.face([[p[0], p[1], z0], [q[0], q[1], z0], [hi[k]![0], hi[k]![1], z1], [hi[j]![0], hi[j]![1], z1]], [((q[1] - p[1]) / l) * Math.cos(a), ((p[0] - q[0]) / l) * Math.cos(a), Math.sin(a)], [q[0] - p[0], q[1] - p[1], 0], CREAM)
      }
    }
    C.slab(ring(r), top - 0.01, top, CREAM, { sides: false })
    C.map(0, (x, y) => [x + 960, z.top + z.height / 2 - y])
    P.slab(roundedLoop(s.x0 - 1.4, s.x1 + 1.4, s.y0 - 1.4, s.y1 + 1.4, SLAB.corner + 1.4, 5), 0, 0.5, TONE.gap, { sides: false })
  }
  if (card) {
    // The card lies under a clear cover held by four screws.
    C.box(card.x0, card.x1, card.y0, card.y1, card.z0, card.z1, CREAM, { bevel: 0.3 })
    C.map(0, (x, y) => [x + 960, z.top + z.height / 2 - y])
    const m = CARD.cover
    const z0 = card.z1 + CARD.lift
    G.slab(roundedLoop(card.x0 - m, card.x1 + m, card.y0 - m, card.y1 + m, 6, 4), z0, z0 + CARD.thick, [1, 1, 1], { bevel: 0.8 })
    for (const sx of [card.x0 - m / 2, card.x1 + m / 2]) for (const sy of [card.y0 - m / 2, card.y1 + m / 2]) {
      screws.add(sx, sy, z0 + CARD.thick, 0.72, sx * 0.37 + sy)
      A.lathe([[4.4, card.z0], [4.4, z0], [0, z0]], sx, sy, 10, TONE.alu)
    }
  }
  const plate = shapesIn(ctx, 'table-frame', z).find((s) => s.id === 'drain.plate')
  if (plate) {
    // The plate the drain's label is set on, edged in brass, and the round throat of the drain under it.
    const p = localOf(z, plate)
    const w = plate.w / 2
    const h = plate.h / 2
    const t = plate.z1 - plate.z0
    A.slab(roundedLoop(p[0] - w - 3, p[0] + w + 3, p[1] - h - 3, p[1] + h + 3, 7, 4), 0, t - 1.2, TONE.brass, { bevel: 1 })
    P.slab(roundedLoop(p[0] - w, p[0] + w, p[1] - h, p[1] + h, 5, 4), 0, t, TONE.paper, { bevel: 1.2 })
    // The drain's mouth under the plate is a deep throat: two sloped cheeks of aluminium run down into the dark, from the plate to the near rail.
    const b = EDGE.bezel
    const sw = Math.max(EDGE.slot[0] / 2, w - 13 - b / 2)
    const top = 6
    const ya = p[1] - h - 4
    const yb = Math.max(yB + EDGE.near + 3, ya - THROAT.long)
    const deep = -THROAT.deep
    const xi = sw - THROAT.cheek
    throat = [p[0] - sw - b, p[0] + sw + b, yb, ya]
    for (const side of [-1, 1]) {
      const x0 = p[0] + side * (sw + b)
      const x1 = p[0] + side * sw
      const x2 = p[0] + side * xi
      A.box(Math.min(x0, x1), Math.max(x0, x1), yb, ya, 0, top, TONE.alu, { bevel: 1.2, along: [0, 1, 0], top: TONE.aluBright })
      A.face([[x1, yb, top - 1], [x1, ya, top - 1], [x2, ya, deep], [x2, yb, deep]], [-side * (top - 1 - deep), 0, THROAT.cheek], [0, 1, 0], TONE.alu)
      for (const t of [0.14, 0.86]) screws.add((x0 + x1) / 2, yb + (ya - yb) * t, top, 0.6, side + t * 3)
    }
    P.face([[p[0] - xi, yb, deep], [p[0] + xi, yb, deep], [p[0] + xi, ya, deep], [p[0] - xi, ya, deep]], [0, 0, 1], [1, 0, 0], TONE.pocket)
    P.face([[p[0] - sw, ya, deep], [p[0] + sw, ya, deep], [p[0] + sw, ya, top - 1], [p[0] - sw, ya, top - 1]], [0, -1, 0], [1, 0, 0], TONE.pocket)
    P.face([[p[0] - sw, yb, deep], [p[0] + sw, yb, deep], [p[0] + sw, yb, top - 1], [p[0] - sw, yb, top - 1]], [0, 1, 0], [1, 0, 0], TONE.pocket)
  }
  // The cast plate the two fields lie on, from rail to rail, open where the drain's throat goes down through it.
  {
    const tone = shade(CREAM, 0.82)
    const y0d = yB + EDGE.near
    if (throat) {
      C.box(xa, throat[0], y0d, yT, 0, EDGE.deck, tone, { bevel: 0.8 })
      C.box(throat[1], xc, y0d, yT, 0, EDGE.deck, tone, { bevel: 0.8 })
      C.box(throat[0], throat[1], throat[3], yT, 0, EDGE.deck, tone, { bevel: 0.8 })
      if (throat[2] - y0d > 0.5) C.box(throat[0], throat[1], y0d, throat[2], 0, EDGE.deck, tone, { bevel: 0.8 })
    } else C.box(xa, xc, y0d, yT, 0, EDGE.deck, tone, { bevel: 0.8 })
  }
  if (C.vertices > 0) {
    const plates = mesh(C, paintOf(z, 'slab', SLAB.grain), `table-frame.ceramic.${z.id}`, { cast: z.floor >= 0 })
    // In the well the page's light does not reach the plates: the street's lamps do, through the lift of the pose.
    if (z.floor < 0) plates.receiveShadow = false
    o.add(plates)
  }
  if (A.vertices > 0) o.add(mesh(A, aluOf(z), `table-frame.metal.${z.id}`))
  if (P.vertices > 0) o.add(mesh(P, paintOf(z), `table-frame.paint.${z.id}`))
  if (G.vertices > 0) {
    const cover = mesh(G, clearOf(z, 'cover', 0.07), `table-frame.cover.${z.id}`)
    cover.renderOrder = 4
    o.add(cover)
  }
  const sc = screws.mesh(screwOf(z), `table-frame.screws.${z.id}`)
  if (sc) o.add(sc)
  return o
}
