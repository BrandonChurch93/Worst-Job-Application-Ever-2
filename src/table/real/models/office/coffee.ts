import * as THREE from 'three'
import { config } from '../../../../config'
import { Random } from '../../../../core/random'
import type { RealContext } from '../../../../real/types'
import { localOf, type Zone } from '../../zone'
import { boxOf } from './inbox'
import { hex, Kit, matsOf, meshOf, rrect, shade, SURF, type RGB, type Surf, type V2, type V3 } from './kit'

const C = {
  base: hex(0x232325),
  black: hex(0x1d1d1f),
  bronze: hex(0x56473b),
  steel: hex(0x7d848b),
  steelLight: hex(0x959ba1),
  chrome: hex(0xb4b8bc),
  slot: hex(0x121214),
  paper: hex(0xece8dd),
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
  face: hex(0xe7e1cf),
  rings: [[0.2, 1, 0.34], [1, 0.9, 0.24], [1, 0.14, 0.12], [0.92, 0.95, 1]] as RGB[]
}

const BRONZE: Surf = [0.4, 0.6, 0.3]
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
  k.lathe(x, y, z, [[6.4, 0], [7.3, 6], [8.3, 15], [8.9, 20], [9.6, 20.5], [9.6, 21.3], [8.5, 21.3], [8, full ? 18 : 2], [0, full ? 18 : 2]], [p, C.sleeve, p, p, p, p, shade(p, 0.9), full ? C.coffee : shade(p, 0.8)], [SURF.paper, SURF.paper, SURF.paper, SURF.paper, SURF.paper, SURF.paper, SURF.paper, full ? SURF.gloss : SURF.paper], 14)
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
  k.cyl(x, y, 88, 12.5, 12, C.chrome, SURF.chrome, 18, 1)
  k.cyl(x, y, 80, 11, 8, C.steel, SURF.brushed, 18, 0.8)
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

export function buildCoffee(z: Zone, ctx: RealContext): THREE.Object3D {
  const b = boxOf(z, 'office.coffee')
  const mats = matsOf(z)
  const root = new THREE.Group()
  root.name = 'office.coffee'
  const r = new Random(config.seed, 'office.coffee')
  const k = new Kit()
  const g = new Kit()
  const c = new Kit()
  k.at(b.x, b.y, 0)
  g.at(b.x, b.y, 0)
  c.at(b.x, b.y, 0)

  k.poly(rrect(b.w - 2, b.d - 2, 8, 4), 0, 4, C.base, SURF.plastic, 1)

  k.box(0, 28, 4, 150, 66, 97, C.steel, SURF.brushed, 2)
  for (const s of [-1, 1]) {
    k.box(s * 76, 28, 4, 3, 68, 96, C.bronze, BRONZE, 1)
    for (let i = 0; i < 6; i++) k.box(s * 77.6, 12 + i * 7, 60, 0.5, 3.4, 26, C.slot, SURF.matte, 0)
  }
  k.box(0, -5.6, 30, 130, 1.2, 62, C.steelLight, SURF.brushed, 0.4)

  prism(k, -HEAD.x, HEAD.x, [[HEAD.back, HEAD.low], [HEAD.back, HEAD.top], [HEAD.deck, HEAD.top], [HEAD.lip, HEAD.slope], [HEAD.lip, HEAD.low]], [C.bronze, C.bronze, C.black, C.bronze, C.bronze], [BRONZE, BRONZE, SURF.gloss, BRONZE, BRONZE], C.bronze, BRONZE)
  k.flat([[-HEAD.x, HEAD.lip, HEAD.low], [HEAD.x, HEAD.lip, HEAD.low], [HEAD.x, -4, HEAD.low], [-HEAD.x, -4, HEAD.low]], [0, 0, -1], C.black, SURF.plastic)
  k.tube([[-HEAD.x, HEAD.deck, HEAD.top], [HEAD.x, HEAD.deck, HEAD.top]], 1, C.chrome, SURF.chrome, 5)
  k.tube([[-HEAD.x, HEAD.lip, HEAD.slope], [HEAD.x, HEAD.lip, HEAD.slope]], 1, C.chrome, SURF.chrome, 5)
  k.box(0, HEAD.lip - 0.5, 108, 150, 1, 6, C.chrome, SURF.chrome, 0.4)

  k.box(0, 27, HEAD.top, 142, 64, 1.2, C.steelLight, SURF.brushed, 0.5)
  const rail = rrect(126, 48, 5, 3).map((q) => [q[0], q[1] + 27, HEAD.top + 8] as V3)
  k.tube(rail, 1.3, C.chrome, SURF.chrome, 6, true)
  for (const [px, py] of [[-58, 8], [0, 3], [58, 8], [-58, 46], [0, 51], [58, 46]] as V2[]) k.cyl(px, py, HEAD.top + 1.2, 1.3, 6.8, C.chrome, SURF.chrome, 6, 0.2)
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) k.box(sx * 34, 10 + i * 5.6, HEAD.top + 1.2, 30, 2, 0.3, C.slot, SURF.matte, 0)
  k.lathe(0, 30, HEAD.top + 1.2, [[10, 0], [10, 2.4], [8.6, 3.4], [8.6, 4.6], [3, 5.2], [3, 7], [0, 7]], [C.chrome, C.chrome, C.black, C.black, C.black, C.black], [SURF.chrome, SURF.chrome, SURF.plastic, SURF.plastic, SURF.plastic, SURF.plastic], 20)
  for (const [cx, cy, n] of [[-42, 50, 2], [42, 50, 1]] as [number, number, number][]) {
    for (let i = 0; i < n; i++) {
      k.lathe(cx + i * 16, cy - i * 1.5, HEAD.top + 1.2, [[7.4, 0.4], [7.6, 1], [4, 1.5]], [C.paper, C.paper], SURF.gloss, 16)
      k.lathe(cx + i * 16, cy - i * 1.5, HEAD.top + 2.2, [[3.4, 0], [5.4, 4], [5.9, 7], [5.2, 7], [4.6, 2.6], [0, 2.6]], [C.paper, C.paper, shade(C.paper, 0.96), shade(C.paper, 0.78), shade(C.paper, 0.7)], SURF.gloss, 16)
    }
  }

  const sy = (HEAD.deck + HEAD.lip) / 2
  const sz = (HEAD.top + HEAD.slope) / 2
  k.at(0, sy, sz, 0, SLOPE)
  g.at(0, sy, sz, 0, SLOPE)
  C.rings.forEach((ring, i) => {
    const x = -39 + i * 26
    k.lathe(x, 0, 0, [[9.6, 0], [9.6, 0.8], [7.9, 1.2], [7.9, 0.4]], [C.chrome, C.chrome, C.chrome], SURF.chrome, 18)
    k.lathe(x, 0, 0, [[5.5, 0], [5.5, 1.8], [4.6, 2.5], [2, 2.2], [0, 2.2]], [C.black, C.black, shade(C.black, 1.5), shade(C.black, 1.5)], SURF.plastic, 16)
    g.lathe(x, 0, 0, [[7.9, 0.2], [7.6, 1.5], [5.9, 1.5], [5.6, 0.2]], ring, SURF.gloss, 18, true)
  })
  for (const s of [-1, 1]) {
    k.lathe(s * 64, 0, 0, [[7, 0], [7, 1], [5.6, 1.4], [5.6, 6], [4.8, 7], [0, 7]], [C.chrome, C.chrome, C.black, C.black, C.black], [SURF.chrome, SURF.chrome, SURF.rubber, SURF.rubber, SURF.plastic], 12)
    k.box(s * 64, 2.2, 6.6, 1.1, 5, 0.7, C.mark, SURF.plastic, 0)
  }
  k.back()
  g.back()

  group(k, -36, -1)
  group(k, 36, 1)
  k.tube([[HEAD.x - 5, HEAD.lip + 4, HEAD.low], [HEAD.x - 4, HEAD.lip - 8, 92], [HEAD.x - 3, -50, 58], [HEAD.x - 3, -52, 44]], 1.9, C.chrome, SURF.chrome, 7)
  k.tube([[HEAD.x - 3.6, -46, 72], [HEAD.x - 3.2, -49.5, 62]], 3, C.black, SURF.rubber, 7)

  k.box(0, -33, 4, 152, 58, 10, C.bronze, BRONZE, 1.6)
  k.box(0, -33, 13.6, 140, 47, 0.5, C.slot, SURF.matte, 0)
  for (let i = 0; i < 23; i++) k.box(-66 + i * 6, -33, 13.8, 2.6, 47, 1.5, C.steelLight, SURF.steel, 0.4)
  for (const y of [-56.5, -9.5]) k.box(0, y, 13.8, 140, 2, 1.7, C.steelLight, SURF.steel, 0.4)
  paperCup(k, -36, -45, 15.3, true)
  paperCup(k, 36, -45, 15.3, false)

  k.at(-98, 0, 4)
  k.poly(rrect(34, 114, 5, 3), 0, 2.4, shade(C.steel, 0.8), SURF.brushed, 0.8)
  k.tube(rrect(31, 111, 4, 3).map((q) => [q[0], q[1], 3.4] as V3), 1, C.chrome, SURF.chrome, 5, true)
  cupStack(k, 0, 36, 2.4, 9)
  cupStack(k, 0.5, 11, 2.4, 5)
  k.lathe(0, -15, 2.4, [[8.4, 0], [9.4, 15], [8.6, 15], [8, 3], [0, 3]], [C.steel, C.steel, shade(C.steel, 0.6), C.slot], SURF.brushed, 16)
  sticks(k, r, 0, -15, 5.4, 11, [C.sugarWhite, C.sugarWhite, C.sugarBrown, C.sugarBlue], 3.6, 1.2, 24)
  k.lathe(0, -41, 2.4, [[6.6, 0], [7.4, 12], [6.6, 12], [6, 3], [0, 3]], [C.black, C.black, shade(C.black, 0.8), C.slot], SURF.plastic, 14)
  sticks(k, r, 0, -41, 5.4, 9, [C.wood, shade(C.wood, 0.92)], 2.4, 0.7, 30)
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
  k.box(-6, -30.6, 16, 2, 0.5, 96, C.mark, SURF.plastic, 0)
  for (let i = 0; i < 6; i++) k.box(-2.5, -30.6, 22 + i * 15, 6, 0.5, 1, C.mark, SURF.plastic, 0)
  k.box(0, -30.7, 96, 20, 0.6, 1.4, C.max, SURF.plastic, 0)
  k.box(14.2, -6, 96, 0.6, 20, 1.4, C.max, SURF.plastic, 0)
  k.tube([[-13, 20, 4], [-17, 20, 6], [-20, 20, 10]], 2, C.steel, SURF.steel, 6)
  k.back()

  const s = boardOf(z, ctx)
  if (s) {
    const sx = s.x - b.x
    const sy2 = s.y - b.y
    const cos = Math.cos(s.turn)
    const sin = Math.sin(s.turn)
    const W = s.w + 22
    const H = s.h + 12
    k.at(sx, sy2, s.z, 0, s.turn)
    k.box(0, 0, -4.4, W, H, 3.2, C.bronze, BRONZE, 1, 0, true)
    k.box(0, 0, -1.4, W - 5, H - 5, 0.7, C.face, SURF.satin, 0.3)
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
  root.add(meshOf(k.done(), mats.solid, 'office.coffee.body', { cast: true }))
  const glow = meshOf(g.done(), mats.glow, 'office.coffee.buttons')
  glow.userData.lightGroup = 'office.windows'
  root.add(glow)
  const clear = meshOf(c.done(), mats.clear, 'office.coffee.tank')
  clear.renderOrder = 2
  root.add(clear)
  return root
}
