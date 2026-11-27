import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { outlineOf } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { CARD, COLOUR } from '../layout'
import { mesh, q } from './careers-solids'
import { SHADOW } from './careers-page'
import { arcPoints, flat, Paint, shade, share, tint } from './flat'

export { cardGlass, GLASS, groundEdge, SLAB, slabGeometry } from './card-glass'

const WHITE = tint(COLOUR.white)
const LINE = tint(COLOUR.edge)
const PEACH = tint(COLOUR.peach)
const ORANGE = tint(COLOUR.orange)

export const CARD_LOOK = { half: 0.5, shadow: 0.38, stroke: 2.6, icon: 44, edge: 0.006 }

type Stroke = { line: [number, number][]; closed?: boolean }
const ring = (cx: number, cy: number, r: number, from = 0, to = 360, steps = 28): [number, number][] => arcPoints(cx, cy, r, from, to, steps)
const oval = (cx: number, cy: number, rx: number, ry: number, from = 0, to = 360): [number, number][] => arcPoints(0, 0, 1, from, to, 24).map(([x, y]) => [cx + x * rx, cy + y * ry])
const heart = (cx: number, cy: number, k: number): [number, number][] => {
  const out: [number, number][] = []
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * Math.PI * 2
    out.push([cx + k * 16 * Math.pow(Math.sin(t), 3), cy - k * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))])
  }
  return out
}

// The eight signs, each drawn in a square of 44 with y going down.
export const ICONS: Stroke[][] = [
  [{ line: [[6, 10], [38, 10], [38, 40], [6, 40]], closed: true }, { line: [[6, 18], [38, 18]] }, { line: [[14, 5], [14, 13]] }, { line: [[30, 5], [30, 13]] }, { line: [[15, 29], [20, 34], [30, 24]] }],
  [{ line: oval(26, 11, 12, 5), closed: true }, { line: [[14, 11], [14, 27]] }, { line: [[38, 11], [38, 33]] }, { line: oval(26, 19, 12, 5, 0, 180) }, { line: oval(26, 27, 12, 5, 0, 180) }, { line: oval(26, 33, 12, 5, 20, 180) }, { line: oval(15, 30, 10, 4.5), closed: true }, { line: [[5, 30], [5, 37]] }, { line: [[25, 30], [25, 37]] }, { line: oval(15, 37, 10, 4.5, 0, 180) }],
  [{ line: ring(22, 22, 16, -60, 230) }, { line: [[22, 12], [22, 22], [29, 26]] }, { line: ring(22, 22, 16, 250, 262, 3) }, { line: ring(22, 22, 16, 276, 288, 3) }],
  [{ line: heart(20, 21, 1.02).slice(8, 40) }, { line: [[33, 26], [33, 40]] }, { line: [[26, 33], [40, 33]] }],
  [{ line: ring(22, 22, 16), closed: true }, { line: [[22, 31], [22, 13]] }, { line: [[15, 20], [22, 13], [29, 20]] }],
  [{ line: [[6, 31], [38, 23]] }, { line: [[22, 28], [16, 38], [28, 38]], closed: true }, { line: [[7, 18], [19, 18], [19, 27], [7, 27]], closed: true }, { line: [[10, 18], [10, 15], [16, 15], [16, 18]] }, { line: ring(32, 14, 6.5), closed: true }, { line: ring(36, 14, 7, 150, 210, 6) }],
  [{ line: ring(19, 25, 14), closed: true }, { line: oval(19, 25, 6, 14), closed: true }, { line: [[5, 25], [33, 25]] }, { line: ring(27, 17, 8, -80, 0, 8) }, { line: ring(27, 17, 14, -80, 0, 10) }],
  [{ line: heart(22, 10, 0.42), closed: true }, { line: ring(11, 27, 4), closed: true }, { line: ring(22, 25, 4), closed: true }, { line: ring(33, 27, 4), closed: true }, { line: oval(11, 40, 6.5, 7, 190, 350) }, { line: oval(22, 39, 7, 8, 190, 350) }, { line: oval(33, 40, 6.5, 7, 190, 350) }]
]

export const cardIndex = (id: string): number => Number(/^perk-(\d+)/.exec(id)?.[1] ?? 0)

function side(s: Shape, icon: number | null): THREE.Mesh {
  const p = new Paint()
  const o = outlineOf({ kind: 'box', w: s.w, h: s.h, r: s.r ?? CARD.r }, 0, 12)
  p.face(o, 0, 0, CARD_LOOK.half, LINE)
  p.face(outlineOf({ kind: 'box', w: s.w, h: s.h, r: s.r ?? CARD.r }, 1.5, 12), 0, 0, CARD_LOOK.half + 0.12, WHITE)
  if (icon !== null) {
    const t = CARD.tile
    const cx = -s.w / 2 + t.x + t.size / 2
    const cy = s.h / 2 - t.y - t.size / 2
    p.face(outlineOf({ kind: 'box', w: t.size, h: t.size, r: t.r }, 0, 10), cx, cy, CARD_LOOK.half + 0.24, PEACH)
    const k = CARD_LOOK.icon / 44
    for (const stroke of ICONS[icon % ICONS.length]!) p.line(stroke.line.map(([x, y]) => [cx + (x - 22) * k, cy - (y - 22) * k]), CARD_LOOK.stroke, CARD_LOOK.half + 0.36, ORANGE, stroke.closed === true)
  }
  return mesh(p.geometry(), flat(), icon !== null, true)
}

// A card of the website, thin as paper: its face with the sign, and its plain back. It turns over as a card on a flat website does: `v[0]` is how much of its height shows, and below zero it is its back that shows.
export const perkCards: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.role !== 'perkCard') return ''
    return `perkCard:${cardIndex(s.id)}:${q(s.w)}x${q(s.h)}`
  },
  make(s) {
    const root = new THREE.Group()
    const front = side(s, cardIndex(s.id))
    front.name = 'front'
    const back = side(s, null)
    back.name = 'back'
    const under = new Paint().soft(outlineOf({ kind: 'box', w: s.w, h: s.h, r: s.r ?? CARD.r }, SHADOW.inset, 12), 0, -SHADOW.drop, CARD_LOOK.shadow, SHADOW.spread, share(SHADOW.card))
    root.add(front, back, mesh(under.geometry(), shade(), false, false))
    return root
  },
  pose(o, s) {
    const c = s.v?.[0] ?? 1
    o.scale.y = Math.max(CARD_LOOK.edge, Math.abs(c))
    o.getObjectByName('front')!.visible = c > 0
    o.getObjectByName('back')!.visible = c <= 0
  },
  drop(o) {
    o.traverse((c) => (c as THREE.Mesh).geometry?.dispose())
  }
}
