import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { APRON_Y, BALL, COLS } from '../../layout'
import { local, localBalls, localOf, shapesIn, type Zone } from '../zone'
import { Geo, roundedLoop, type V2 } from './geo'
import { Screws, TONE, aluOf, clearOf, mesh, paintOf, screwOf, shade } from './mats'

const SLAB = { height: 16, bevel: 3.2, corner: 10, inlay: 9, line: 1.5, grain: 0.03 }
// The frame round the apron: the two rails run on from the street tier and a slim rail closes them in front. `low` is how high they stand where the apron lies at the page's own height.
export const EDGE = { gap: 1.6, near: 44, low: 7, chamfer: 3, deck: 3, slot: [86, 40] as V2, bezel: 7, skin: 1.2, skirt: 1, panel: 10 }
const WALL: [number, number, number] = [0.2, 0.208, 0.22]
// The sunk panel of each side rail's south end, seen end on from the player's end: a quiet dark face.
const SLOPE: [number, number, number] = [0.06, 0.063, 0.068]
const CARD = { cover: 12, thick: 2.6, lift: 1.4 }

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
    if (top) g.face([[x0, y0, a], [x1, y0, a], [x1, yT, b], [x0, yT, b]], up, run, top)
    if (at0) g.face([[x0, y0, 0], [x0, y0, a], [x0, yT, b], [x0, yT, 0]], [-1, 0, 0], [0, 1, 0], at0)
    if (at1) g.face([[x1, y0, 0], [x1, y0, a], [x1, yT, b], [x1, yT, 0]], [1, 0, 0], [0, 1, 0], at1)
  }
  // Each side rail comes down as a slim rail at the machine's edge, one with the near rail, and a dark sunk panel inside it.
  const side = (x0: number, x1: number, inner: 0 | 1): void => {
    if (sunk) {
      const d = EDGE.panel
      const xs = inner === 1 ? X(0) + EDGE.near : X(20) - EDGE.near
      const [r0, r1, p0, p1] = inner === 1 ? [x0, xs, xs, x1] : [xs, x1, x0, xs]
      wedge(A, r0, r1, 0, TONE.aluBright, null, null)
      wedge(A, p0, p1, d, SLOPE, inner === 0 ? WALL : null, inner === 1 ? WALL : null)
      A.face([[xs, y0, Hn - d], [xs, y0, Hn], [xs, yT, H], [xs, yT, H - d]], [inner === 1 ? 1 : -1, 0, 0], run, WALL)
      A.face([[p0, yT, H - d], [p1, yT, H - d], [p1, yT, H], [p0, yT, H]], [0, -1, 0], [1, 0, 0], WALL)
      for (const t of [0.3, 0.8]) screws.add((r0 + r1) / 2, y0 + (yT - y0) * t, heightAt(y0 + (yT - y0) * t), 0.7, x0 + t, new THREE.Vector3(...up))
      return
    }
    const o: V2[] = [[x0, 0], [x0, H - c], [x0 + c, H], [x1 - c, H], [x1, H - c], [x1, 0]]
    A.prism(o, [0, y0], [0, yT], tone(o, H))
    for (const t of [0.3, 0.8]) screws.add((x0 + x1) / 2, y0 + (yT - y0) * t, H, 0.9, x0 + t)
  }
  if (sunk) {
    // Outside the rails the machine's edge comes down with them. The outside of the near end is one face of aluminium.
    const skin = yB + EDGE.skin
    for (const [x0, x1, out] of [[X(0), xb - EDGE.gap, 0], [xe + EDGE.gap, X(20), 1]] as [number, number, 0 | 1][]) {
      wedge(A, x0, x1, 0, TONE.aluBright, out === 0 ? TONE.alu : null, out === 1 ? TONE.alu : null)
      C.box(x0, x1, skin, y0, 0, Hn, TONE.ceramic, { along: [0, 1, 0] })
    }
    A.box(X(0), X(20), yB, skin, -EDGE.skirt * BALL, Hn, TONE.alu, { along: [1, 0, 0], top: TONE.aluBright })
  }
  side(xb, xa, 1)
  side(xc, xe, 0)
  const front = sunk ? yB + EDGE.skin : yB
  const near: V2[] = [[0, 0], [0, Hn - c], [c, Hn], [y0 - front - c, Hn], [y0 - front, Hn - c], [y0 - front, 0]]
  A.prism(near, [xe, front], [xb, front], tone(near, Hn))
  for (let i = 0; i < 9; i++) screws.add(xb + 60 + ((xe - xb - 120) * i) / 8, yB + EDGE.near / 2, Hn, 0.9, i * 1.7)
  // The cast plate the two fields lie on, from rail to rail.
  C.box(xa, xc, yB + EDGE.near, yT, 0, EDGE.deck, shade(TONE.ceramic, 0.82), { bevel: 0.8 })
  for (const id of ['apron-left', 'apron-right']) {
    const s = boxOf(id)
    if (!s) continue
    const top = id === 'apron-right' && card ? card.z0 : Math.max(SLAB.height, s.z1)
    C.slab(roundedLoop(s.x0, s.x1, s.y0, s.y1, SLAB.corner, 5), 0, top, TONE.ceramic, { bevel: SLAB.bevel })
    C.map(0, (x, y) => [x + 960, z.top + z.height / 2 - y])
    P.slab(roundedLoop(s.x0 - 1.4, s.x1 + 1.4, s.y0 - 1.4, s.y1 + 1.4, SLAB.corner + 1.4, 5), 0, 0.5, TONE.gap, { sides: false })
  }
  if (card) {
    // The card lies under a clear cover held by four screws.
    P.box(card.x0, card.x1, card.y0, card.y1, card.z0, card.z1, TONE.paper, { bevel: 0.3 })
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
    // The drain's mouth under the plate is a square slot in a bezel of aluminium, as wide as the two grey blocks that carry the plate stand apart: the screws of the blocks and of the bezel share their columns.
    const b = EDGE.bezel
    const sw = Math.max(EDGE.slot[0] / 2, w - 13 - b / 2)
    const sh = EDGE.slot[1] / 2
    for (const side of [-1, 1]) {
      const bx = p[0] + side * (sw + b / 2)
      A.box(bx - 13, bx + 13, p[1] - h - 30, p[1] - h - 3, 0, t - 1.6, TONE.aluDark, { bevel: 1.4, along: [0, 1, 0] })
      screws.add(bx, p[1] - h - 16, t - 1.6, 0.8, side * 0.9)
    }
    const cy = p[1] - h - 34 - sh
    A.box(p[0] - sw - b, p[0] + sw + b, cy + sh, cy + sh + b, 0, 5, TONE.alu, { bevel: 1.2, along: [1, 0, 0] })
    A.box(p[0] - sw - b, p[0] + sw + b, cy - sh - b, cy - sh, 0, 5, TONE.alu, { bevel: 1.2, along: [1, 0, 0] })
    A.box(p[0] - sw - b, p[0] - sw, cy - sh, cy + sh, 0, 5, TONE.alu, { bevel: 1.2, along: [0, 1, 0] })
    A.box(p[0] + sw, p[0] + sw + b, cy - sh, cy + sh, 0, 5, TONE.alu, { bevel: 1.2, along: [0, 1, 0] })
    P.box(p[0] - sw, p[0] + sw, cy - sh, cy + sh, 0, EDGE.deck + 0.4, TONE.pocket)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) screws.add(p[0] + sx * (sw + b / 2), cy + sy * (sh + b / 2), 5, 0.5, sx + sy * 2)
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
