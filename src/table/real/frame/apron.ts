import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { APRON_Y, COLS } from '../../layout'
import { local, localBalls, localOf, shapesIn, type Zone } from '../zone'
import { Geo, roundedLoop, type V2 } from './geo'
import { Screws, TONE, aluOf, clearOf, mesh, paintOf, screwOf, shade } from './mats'

const SLAB = { height: 16, bevel: 3.2, corner: 10, inlay: 9, line: 1.5, grain: 0.03 }
// The frame round the apron: the two rails run on from the street tier and a slim rail closes them in front. `low` is how high they stand where the apron lies at the page's own height.
const EDGE = { near: 44, low: 7, chamfer: 3, deck: 3, slot: [86, 40] as V2, bezel: 7 }
const WALL: [number, number, number] = [0.2, 0.208, 0.22]
const CARD = { cover: 12, thick: 2.6, lift: 1.4 }

export function apron(z: Zone, ctx: RealContext): THREE.Object3D {
  const C = new Geo()
  const A = new Geo()
  const P = new Geo()
  const G = new Geo()
  const screws = new Screws()
  const o = new THREE.Group()
  o.name = `table-frame.${z.id}`
  const boxOf = (id: string): { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number } | null => {
    const s = ctx.byId.get(id)
    if (!s) return null
    const a = local(z, s.x, s.y + s.h, s.z0)
    const b = local(z, s.x + s.w, s.y, s.z1)
    return { x0: a[0], x1: b[0], y0: a[1], y1: b[1], z0: a[2], z1: b[2] }
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
  const tone = (outline: V2[]) => (edge: number): [number, number, number] => {
    const p = outline[edge]!
    const q = outline[(edge + 1) % outline.length]!
    return p[1] >= H - c - 0.01 && q[1] >= H - c - 0.01 ? TONE.aluBright : H > 30 ? WALL : TONE.alu
  }
  const side = (x0: number, x1: number): void => {
    const o: V2[] = [[x0, 0], [x0, H - c], [x0 + c, H], [x1 - c, H], [x1, H - c], [x1, 0]]
    A.prism(o, [0, yB + EDGE.near], [0, yT], tone(o))
    for (const t of [0.3, 0.8]) screws.add((x0 + x1) / 2, yB + EDGE.near + (yT - yB - EDGE.near) * t, H, 0.9, x0 + t)
  }
  side(xb, xa)
  side(xc, xe)
  const near: V2[] = [[0, 0], [0, H - c], [c, H], [EDGE.near - c, H], [EDGE.near, H - c], [EDGE.near, 0]]
  A.prism(near, [xe, yB], [xb, yB], tone(near))
  for (let i = 0; i < 9; i++) screws.add(xb + 60 + ((xe - xb - 120) * i) / 8, yB + EDGE.near / 2, H, 0.9, i * 1.7)
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
    P.slab(roundedLoop(p[0] - w, p[0] + w, p[1] - h, p[1] + h, 5, 4), 0, t, TONE.enamel, { bevel: 1.2 })
    // Two grey blocks carry the plate either side of the drain's mouth, each with a screw.
    for (const side of [-1, 1]) {
      const bx = p[0] + side * (w - 13)
      A.box(bx - 13, bx + 13, p[1] - h - 30, p[1] - h - 3, 0, t - 1.6, TONE.aluDark, { bevel: 1.4, along: [0, 1, 0] })
      screws.add(bx, p[1] - h - 16, t - 1.6, 0.8, side * 0.9)
    }
    // The drain's mouth under the plate: a square slot in a bezel of aluminium.
    const cy = p[1] - h - 34 - EDGE.slot[1] / 2
    const sw = EDGE.slot[0] / 2
    const sh = EDGE.slot[1] / 2
    const b = EDGE.bezel
    A.box(p[0] - sw - b, p[0] + sw + b, cy + sh, cy + sh + b, 0, 5, TONE.alu, { bevel: 1.2, along: [1, 0, 0] })
    A.box(p[0] - sw - b, p[0] + sw + b, cy - sh - b, cy - sh, 0, 5, TONE.alu, { bevel: 1.2, along: [1, 0, 0] })
    A.box(p[0] - sw - b, p[0] - sw, cy - sh, cy + sh, 0, 5, TONE.alu, { bevel: 1.2, along: [0, 1, 0] })
    A.box(p[0] + sw, p[0] + sw + b, cy - sh, cy + sh, 0, 5, TONE.alu, { bevel: 1.2, along: [0, 1, 0] })
    P.box(p[0] - sw, p[0] + sw, cy - sh, cy + sh, 0, EDGE.deck + 0.4, TONE.pocket)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) screws.add(p[0] + sx * (sw + b / 2), cy + sy * (sh + b / 2), 5, 0.5, sx + sy * 2)
  }
  if (C.vertices > 0) {
    o.add(mesh(C, paintOf(z, 'slab', SLAB.grain), `table-frame.ceramic.${z.id}`, { cast: true }))
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
