import * as THREE from 'three'
import { config } from '../../../../config'
import { Random } from '../../../../core/random'
import type { RealContext } from '../../../../real/types'
import { localOf, type Zone } from '../../zone'
import { boxOf } from './inbox'
import { hex, Kit, matsOf, meshOf, rrect, shade, SURF, type RGB, type Surf, type V2, type V3 } from './kit'

const C = {
  base: hex(0x2a1c13),
  black: hex(0x242325),
  bronze: hex(0x4b3122),
  bronzeDark: hex(0x2f1f15),
  steel: hex(0x9aa1a9),
  steelLight: hex(0xc3c9cf),
  top: hex(0x5a3c29),
  chrome: hex(0xccd3da),
  slot: hex(0x121214),
  paper: hex(0xf2efe6),
  sleeve: hex(0x8a6a4a),
  coffee: hex(0x2a1a10),
  wood: hex(0xcdb58a),
  sugarWhite: hex(0xf0ede4),
  sugarBrown: hex(0x9a7a52),
  sugarBlue: hex(0x8fb2c6),
  tank: [0.82, 0.9, 0.94] as RGB,
  water: [0.42, 0.66, 0.84] as RGB,
  mark: hex(0xe6e3da),
  max: hex(0xb3202a),
  face: hex(0xd8ccb0),
  lamps: [[0.2, 1, 0.34], [1, 0.78, 0.2], [1, 0.16, 0.12]] as RGB[],
  display: [1, 0.86, 0.62] as RGB,
  cups: [hex(0x2f5d50), hex(0x7a2a2e), hex(0x2c4266)]
}

const BRONZE: Surf = [0.3, 0.25, 0.9]
const PLATE: Surf = [0.4, 0.55, 0.2]
const LIFT = { body: 0.24, plate: 0.26, sign: 0.42, paper: 0.55 }
const HEAD = { x: 77, back: 62, deck: -10, lip: -34, low: 100, slope: 138, top: 154 }
const SLOPE = Math.atan2(HEAD.top - HEAD.slope, HEAD.deck - HEAD.lip)

// A bar of one section, drawn along x with flat faces: the section is given as (y, z) points round its outside.
function prism(k: Kit, x0: number, x1: number, pts: V2[], cols: RGB[], surfs: Surf[], ends: RGB, endSurf: Surf): void {
  let cy = 0
  let cz = 0
  for (const q of pts) {
    cy += q[0] / pts.length
    cz += q[1] / pts.length
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % pts.length]!
    let ny = b[1] - a[1]
    let nz = -(b[0] - a[0])
    const l = Math.hypot(ny, nz) || 1
    ny /= l
    nz /= l
    if (ny * ((a[0] + b[0]) / 2 - cy) + nz * ((a[1] + b[1]) / 2 - cz) < 0) {
      ny = -ny
      nz = -nz
    }
    if (nz < -0.99) continue
    const n: V3 = [0, ny, nz]
    k.flat([[x0, a[0], a[1]], [x1, a[0], a[1]], [x1, b[0], b[1]], [x0, b[0], b[1]]], n, cols[i % cols.length]!, surfs[i % surfs.length]!)
  }
  k.flat(pts.map((q) => [x0, q[0], q[1]] as V3), [x0 < x1 ? -1 : 1, 0, 0], ends, endSurf)
  k.flat(pts.map((q) => [x1, q[0], q[1]] as V3), [x0 < x1 ? 1 : -1, 0, 0], ends, endSurf)
}

function paperCup(k: Kit, x: number, y: number, z: number, full: boolean): void {
  const p = C.paper
  k.lathe(x, y, z, [[5.6, 0], [6.2, 1], [8.6, 8], [9.3, 16], [9.6, 17], [9.2, 17.4], [8.4, 16.6], [7.6, full ? 14 : 2], [0, full ? 14 : 2]], [p, p, p, p, p, shade(p, 0.9), shade(p, 0.9), full ? C.coffee : shade(p, 0.8)], SURF.gloss, 14)
  k.lathe(x, y, z - 1.5, [[12.5, 0], [13.2, 0.9], [9, 1.5], [0, 1.5]], [p, p, shade(p, 0.92)], SURF.gloss, 16)
  k.tube([[x + 8.6, y - 1, z + 13.5], [x + 13.4, y - 3, z + 13], [x + 14.2, y - 3.6, z + 8.4], [x + 8.2, y - 1, z + 5.4]], 1.25, p, SURF.gloss, 6)
}

function cupStack(k: Kit, x: number, y: number, z: number, n: number): void {
  const p = C.paper
  const prof: V2[] = [[6.4, 0], [8.6, 18]]
  const cols: RGB[] = [p]
  for (let i = 0; i < n; i++) {
    const h = 18 + i * 3.4
    prof.push([8.9, h + 2.2], [9.7, h + 2.6], [9.7, h + 3.4], [8.7, h + 3.5])
    cols.push(shade(p, i % 2 ? 0.97 : 1), p, p, shade(p, 0.72))
  }
  const top = 18 + (n - 1) * 3.4 + 3.5
  prof.push([8.2, top - 0.4], [7.2, top - 12], [0, top - 12])
  cols.push(shade(p, 0.86), shade(p, 0.9), shade(p, 0.8))
  k.lathe(x, y, z, prof, cols, SURF.paper, 14)
}

function sticks(k: Kit, r: Random, x: number, y: number, z: number, n: number, cols: RGB[], w: number, d: number, len: number): void {
  for (let i = 0; i < n; i++) {
    const a = r.range(0, Math.PI * 2)
    const out = r.range(0.6, 4.6)
    k.at(x + Math.cos(a) * out, y + Math.sin(a) * out, z, a, 0, r.range(0.08, 0.3))
    k.box(0, 0, 0, w, d, len + r.range(-2, 2), r.pick(cols), SURF.paper, 0.2, r.range(0, 3))
    k.back()
  }
}

function group(k: Kit, x: number, side: number): void {
  const y = -45
  k.box(x, -41, 100, 36, 16, 12, C.black, SURF.plastic, 1.2)
  k.lathe(x, y, 79, [[0, 0], [9.4, 0], [10.6, 1.2], [10.6, 7], [12.6, 8], [12.6, 11.4], [13.6, 12], [13.6, 14.4], [12.4, 15], [12.4, 21], [0, 21]], [C.steel, C.steel, C.steel, C.steel, C.chrome, C.chrome, C.black, C.black, C.chrome, C.chrome], [SURF.brushed, SURF.brushed, SURF.brushed, SURF.brushed, SURF.chrome, SURF.chrome, SURF.rubber, SURF.rubber, SURF.chrome, SURF.chrome], 20)
  for (const s of [-1, 1]) k.tube([[x + s * 2, y, 80], [x + s * 4.2, y - 1, 76], [x + s * 4.2, y - 1, 72]], 1.5, C.chrome, SURF.chrome, 6)
  k.tube([[x, y - 9, 84], [x + side * 9, y - 13.5, 84], [x + side * 15, y - 16, 83]], 3, C.black, SURF.plastic, 8)
  k.tube([[x, y - 2, 84], [x, y - 9, 84]], 2.2, C.chrome, SURF.chrome, 8)
}

export function coffeeScrews(z: Zone): [number, number, number][] {
  const b = boxOf(z, 'office.coffee')
  const out: [number, number, number][] = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    out.push([b.x + sx * (b.w / 2 - 8), b.y + sy * (b.d / 2 - 8), 4])
    out.push([b.x + sx * 68, b.y + 26 + sy * 30, HEAD.top + 1.2])
  }
  return out
}

interface Board { x: number; y: number; z: number; w: number; h: number; turn: number }

function boardOf(z: Zone, ctx: RealContext): Board | null {
  const s = ctx.byId.get('sign.office.coffee')
  if (!s) return null
  const [x, y, zz] = localOf(z, s)
  return { x, y, z: zz, w: s.w, h: s.h, turn: s.turnX ?? 0 }
}

function draw(z: Zone, ctx: RealContext): { k: Kit; g: Kit; c: Kit } {
  const b = boxOf(z, 'office.coffee')
  const r = new Random(config.seed, 'office.coffee')
  const k = new Kit()
  const g = new Kit()
  const c = new Kit()
  k.at(b.x, b.y, 0)
  g.at(b.x, b.y, 0)
  c.at(b.x, b.y, 0)

  k.lift = LIFT.body
  k.poly(rrect(b.w - 2, b.d - 2, 8, 4), 0, 4, C.base, SURF.plastic, 1)

  k.box(0, 28, 4, 150, 66, 97, C.bronzeDark, BRONZE, 2)
  for (const s of [-1, 1]) {
    k.box(s * 76, 28, 4, 3, 68, 96, C.bronze, BRONZE, 1)
    k.fine = true
    for (let i = 0; i < 6; i++) k.box(s * 77.6, 12 + i * 7, 60, 0.5, 3.4, 26, C.slot, SURF.matte, 0)
    k.fine = false
  }
  k.box(0, -5.6, 30, 130, 1.2, 62, shade(C.steel, 0.32), PLATE, 0.4)
  // The service bay: two cheeks that lean in, a valance under the head and a lit groove behind each group.
  for (const s of [-1, 1]) {
    k.box(s * 70, -18, 14, 9, 26, 86, C.bronze, BRONZE, 3, s * 0.22)
    k.box(s * 36, -6.6, 34, 30, 0.8, 50, shade(C.steel, 0.5), PLATE, 0.3)
  }
  k.box(0, -20, 92, 132, 26, 8, C.bronzeDark, BRONZE, 2.4)

  prism(k, -HEAD.x, HEAD.x, [[HEAD.back, HEAD.low], [HEAD.back, HEAD.top], [HEAD.deck, HEAD.top], [HEAD.lip, HEAD.slope], [HEAD.lip, HEAD.low]], [C.bronze, C.bronze, C.bronze, C.bronzeDark, C.bronze], [BRONZE, BRONZE, BRONZE, BRONZE, BRONZE], C.bronze, BRONZE)
  k.flat([[-HEAD.x, HEAD.lip, HEAD.low], [HEAD.x, HEAD.lip, HEAD.low], [HEAD.x, -4, HEAD.low], [-HEAD.x, -4, HEAD.low]], [0, 0, -1], C.black, SURF.plastic)
  k.tube([[-HEAD.x, HEAD.deck, HEAD.top], [HEAD.x, HEAD.deck, HEAD.top]], 1, C.chrome, SURF.chrome, 5)
  k.tube([[-HEAD.x, HEAD.lip, HEAD.slope], [HEAD.x, HEAD.lip, HEAD.slope]], 1, C.chrome, SURF.chrome, 5)
  k.box(0, HEAD.lip - 0.5, 108, 150, 1, 6, C.chrome, SURF.chrome, 0.4)

  k.lift = LIFT.plate
  k.poly(rrect(144, 66, 6, 3), HEAD.top, 1.4, C.top, SURF.brushed, 0.6)
  k.poly(rrect(30, 16, 3, 2).map((q) => [q[0] - 40, q[1] + 14] as V2), HEAD.top + 1.4, 0.8, shade(C.top, 0.82), SURF.brushed, 0.4)
  k.lift = LIFT.body
  k.fine = true
  const rail = rrect(126, 48, 5, 3).map((q) => [q[0], q[1] + 27, HEAD.top + 8] as V3)
  k.tube(rail, 1.3, C.chrome, SURF.chrome, 6, true)
  for (const [px, py] of [[-58, 8], [0, 3], [58, 8], [-58, 46], [0, 51], [58, 46]] as V2[]) k.cyl(px, py, HEAD.top + 1.2, 1.3, 6.8, C.chrome, SURF.chrome, 6, 0.2)
  for (let i = 0; i < 5; i++) k.box(40, 8 + i * 4.6, HEAD.top + 1.4, 34, 1.6, 0.3, C.slot, SURF.matte, 0)
  k.lift = LIFT.paper
  for (const [cx, cy, tone] of [[-50, 46, 0], [-31, 47, 1], [-41, 30, 2]] as V3[]) {
    const cup = C.cups[tone]!
    k.lathe(cx, cy, HEAD.top + 1.4, [[6.6, 0], [6.8, 0.8], [5.8, 3], [4.8, 8.4], [4, 9], [0, 9]], [cup, cup, shade(cup, 0.94), cup, shade(cup, 0.8)], SURF.gloss, 14)
  }
  k.lift = LIFT.body

  k.fine = false

  const sy = (HEAD.deck + HEAD.lip) / 2
  const sz = (HEAD.top + HEAD.slope) / 2
  k.at(0, sy, sz, 0, SLOPE)
  g.at(0, sy, sz, 0, SLOPE)
  for (const [px, pw, lamps, lit] of [[-46, 44, 3, true], [2, 30, 2, false], [47, 36, 3, false]] as [number, number, number, boolean][]) {
    k.box(px, 0, 0, pw, 17, 1, shade(C.steel, 0.42), PLATE, 0.5)
    k.box(px, 0, 1, pw - 3, 14, 0.3, C.black, SURF.plastic, 0)
    for (let i = 0; i < lamps; i++) {
      const lx = px - pw / 2 + 7 + i * 7
      k.lathe(lx, 2.6, 1.3, [[2.6, 0], [2.6, 0.6], [1.9, 0.9]], [C.chrome, C.chrome], SURF.chrome, 10)
      g.lathe(lx, 2.6, 1.3, [[1.9, 0.5], [1.5, 1.3], [0, 1.6]], C.lamps[i % C.lamps.length]!, SURF.gloss, 10, true)
      k.box(lx, -3.4, 1.3, 4.4, 3, 0.7, shade(C.steelLight, 0.9), PLATE, 0.3)
    }
    if (lit) g.flat([[px + 6, -5, 1.36], [px + 19, -5, 1.36], [px + 19, 5, 1.36], [px + 6, 5, 1.36]], [0, 0, 1], C.display, SURF.gloss)
  }
  k.back()
  g.back()

  group(k, -36, -1)
  group(k, 36, 1)
  k.fine = true
  k.at(0, HEAD.lip - 0.4, 117, 0, Math.PI / 2)
  k.lathe(0, 0, 0, [[11, 0], [11, 2.2], [9.6, 3], [9.2, 1.6], [0, 1.6]], [C.chrome, C.chrome, C.chrome, C.face], [SURF.chrome, SURF.chrome, SURF.chrome, SURF.satin], 20)
  for (let i = 0; i < 9; i++) {
    const a2 = Math.PI * (1.25 - (i / 8) * 1.5)
    k.box(Math.cos(a2) * 7.4, Math.sin(a2) * 7.4, 1.6, i % 4 === 0 ? 2.6 : 1.6, 0.7, 0.25, i > 6 ? C.max : C.slot, SURF.plastic, 0, a2)
  }
  k.box(2.2, 2.6, 1.7, 8.4, 0.9, 0.4, C.max, SURF.plastic, 0, 0.87)
  k.cyl(0, 0, 1.6, 1.5, 1, C.black, SURF.plastic, 8, 0.3)
  k.back()
  for (const gx of [-36, 36]) {
    k.at(gx, HEAD.lip - 0.4, 124, 0, Math.PI / 2)
    k.lathe(0, 0, 0, [[4.4, 0], [4.4, 1], [3.4, 2.2], [0, 2.2]], [C.chrome, C.chrome, C.chrome], SURF.chrome, 12)
    k.back()
  }
  k.tube([[HEAD.x - 5, HEAD.lip + 4, HEAD.low], [HEAD.x - 4, HEAD.lip - 8, 92], [HEAD.x - 3, -50, 58], [HEAD.x - 3, -52, 44]], 1.9, C.chrome, SURF.chrome, 7)
  k.tube([[HEAD.x - 3.6, -46, 72], [HEAD.x - 3.2, -49.5, 62]], 3, C.black, SURF.rubber, 7)

  k.fine = false
  k.box(0, -33, 4, 152, 58, 10, C.bronze, BRONZE, 1.6)
  k.lift = LIFT.paper
  k.box(0, -33, 13.6, 140, 47, 0.5, C.slot, SURF.matte, 0)
  k.fine = true
  for (let i = 0; i < 23; i++) k.box(-66 + i * 6, -33, 13.8, 2.6, 47, 1.5, shade(C.steel, 0.5), SURF.steel, 0.4)
  for (const y of [-56.5, -9.5]) k.box(0, y, 13.8, 140, 2, 1.7, shade(C.steel, 0.6), SURF.steel, 0.4)
  k.fine = false
  paperCup(k, -36, -45, 15.3, true)
  paperCup(k, 36, -45, 15.3, false)
  k.lift = LIFT.body

  k.at(-98, 0, 4)
  k.poly(rrect(34, 114, 5, 3), 0, 2.4, shade(C.steel, 0.8), SURF.brushed, 0.8)
  k.tube(rrect(31, 111, 4, 3).map((q) => [q[0], q[1], 3.4] as V3), 1, C.chrome, SURF.chrome, 5, true)
  k.fine = true
  cupStack(k, 0, 36, 2.4, 9)
  cupStack(k, 0.5, 11, 2.4, 5)
  k.lathe(0, -15, 2.4, [[8.4, 0], [9.4, 15], [8.6, 15], [8, 3], [0, 3]], [C.steel, C.steel, shade(C.steel, 0.6), C.slot], SURF.brushed, 16)
  sticks(k, r, 0, -15, 5.4, 11, [C.sugarWhite, C.sugarWhite, C.sugarBrown, C.sugarBlue], 3.6, 1.2, 24)
  k.lathe(0, -41, 2.4, [[6.6, 0], [7.4, 12], [6.6, 12], [6, 3], [0, 3]], [C.black, C.black, shade(C.black, 0.8), C.slot], SURF.plastic, 14)
  sticks(k, r, 0, -41, 5.4, 9, [C.wood, shade(C.wood, 0.92)], 2.4, 0.7, 30)
  k.fine = false
  k.back()

  k.at(98, 27, 4)
  k.box(0, 0, 0, 31, 66, 8, C.black, SURF.plastic, 1.4)
  c.at(98, 27, 12)
  c.box(0, 0, 0, 27, 60, 112, C.tank, SURF.glass, 1.6)
  c.box(0, 0, 2, 22.6, 55.6, 72, C.water, SURF.glass, 0.2)
  c.back()
  for (const [w, d, x, y] of [[29, 1.8, 0, -30.1], [29, 1.8, 0, 30.1], [1.8, 62, -13.6, 0], [1.8, 62, 13.6, 0]] as number[][]) k.box(x!, y!, 118, w!, d!, 3.4, shade(C.steel, 0.8), SURF.brushed, 0.6)
  k.box(0, 21, 119.4, 27, 18, 2.2, C.black, SURF.plastic, 0.8)
  k.box(0, 11, 121.6, 12, 2.6, 1.4, C.chrome, SURF.chrome, 0.5)
  k.fine = true
  k.box(-6, -30.6, 16, 2, 0.5, 96, C.mark, SURF.plastic, 0)
  for (let i = 0; i < 6; i++) k.box(-2.5, -30.6, 22 + i * 15, 6, 0.5, 1, C.mark, SURF.plastic, 0)
  k.box(0, -30.7, 96, 20, 0.6, 1.4, C.max, SURF.plastic, 0)
  k.box(14.2, -6, 96, 0.6, 20, 1.4, C.max, SURF.plastic, 0)
  k.fine = false
  k.tube([[-13, 20, 4], [-17, 20, 6], [-20, 20, 10]], 2, C.steel, SURF.steel, 6)
  k.back()

  const s = boardOf(z, ctx)
  if (s) {
    const sx = s.x - b.x
    const sy2 = s.y - b.y
    const cos = Math.cos(s.turn)
    const sin = Math.sin(s.turn)
    const W = s.w + 12
    const H = s.h + 7
    k.at(sx, sy2, s.z, 0, s.turn)
    k.box(0, 0, -4.4, W, H, 3.2, shade(C.steel, 0.5), SURF.brushed, 1, 0, true)
    k.lift = LIFT.sign
    k.box(0, 0, -1.4, W - 3, H - 3, 0.7, C.face, SURF.satin, 0.3)
    k.lift = LIFT.body
    for (const q of [-1, 1]) k.cyl(q * (W / 2 - 4.6), 0, -1.3, 1.6, 0.9, C.chrome, SURF.chrome, 8, 0.3)
    k.back()
    for (const q of [-1, 1]) {
      const x = sx + q * (W / 2 - 12)
      const at = (yl: number, zl: number): V3 => [x, sy2 + yl * cos - zl * sin, s.z + yl * sin + zl * cos]
      const p0 = at(H / 2 - 5, -4.4)
      const p1 = at(H / 2 - 5, -9)
      k.tube([at(-H / 2 + 5, -5), p0, p1, [x, HEAD.lip - 1.5, HEAD.slope - 4], [x, HEAD.lip - 1.5, HEAD.slope - 22]], 1.7, C.steel, SURF.steel, 6)
      k.box(x, HEAD.lip - 1.4, HEAD.slope - 24, 6, 2.4, 9, C.steel, SURF.steel, 0.5)
    }
  }

  k.back()
  g.back()
  c.back()
  return { k, g, c }
}

// The small trim of the coffee machine, for the one mesh of fine things of the tier.
export const coffeeFine = (z: Zone, ctx: RealContext): Kit => draw(z, ctx).k

// What glows and what is clear on the coffee machine, for the one glowing mesh and the one clear mesh of the tier.
export const coffeeLit = (z: Zone, ctx: RealContext): { g: Kit; c: Kit } => draw(z, ctx)

export function buildCoffee(z: Zone, ctx: RealContext): THREE.Object3D {
  const mats = matsOf(z)
  const root = new THREE.Group()
  root.name = 'office.coffee'
  const { k } = draw(z, ctx)
  root.add(meshOf(k.done(), mats.solid, 'office.coffee.body', { cast: true }))
  return root
}
