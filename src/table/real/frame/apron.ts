import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { local, localOf, shapesIn, type Zone } from '../zone'
import { Geo, roundedLoop, type V2 } from './geo'
import { Screws, TONE, aluOf, clearOf, mesh, paintOf, screwOf } from './mats'

const SLAB = { height: 16, bevel: 3.2, corner: 10, inlay: 9, line: 1.5, grain: 0.03 }
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
    const cy = p[1] - h - 52
    const ring: V2[] = [[50, 0], [50, 3.2], [47.5, 5], [41, 5], [38, 2.2], [38, 0.8]]
    A.lathe(ring, p[0], cy, 40, TONE.alu)
    P.lathe([[38, 0.8], [24, 0.7], [0, 0.6]], p[0], cy, 40, (i) => (i === 0 ? TONE.pocket : [0.004, 0.004, 0.005]))
    for (let i = 0; i < 4; i++) screws.add(p[0] + 44.3 * Math.cos(Math.PI / 4 + (i * Math.PI) / 2), cy + 44.3 * Math.sin(Math.PI / 4 + (i * Math.PI) / 2), 5, 0.56, i)
  }
  if (C.vertices > 0) {
    o.add(mesh(C, paintOf(z, 'slab', SLAB.grain), `table-frame.ceramic.${z.id}`, { cast: true }))
  }
  if (A.vertices > 0) o.add(mesh(A, aluOf(z), `table-frame.metal.${z.id}`, { cast: true }))
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
