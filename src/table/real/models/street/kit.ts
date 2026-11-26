import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { BALL, table, type Model } from '../../../layout'
import { localBalls, localOf, type Zone } from '../../zone'
import { Geo, KIND, mix, rgb, shade, type Buckets, type RGB, type V3 } from './geo'

export const TONE = {
  brick: rgb(0x66281f),
  brickDark: rgb(0x6f261f),
  stone: rgb(0x878a8c),
  stoneDark: rgb(0x696b6d),
  stonePale: rgb(0x9fa1a2),
  concrete: rgb(0x868c92),
  concreteDark: rgb(0x696d70),
  roof: rgb(0x66696b),
  deck: rgb(0x848e98),
  deckDark: rgb(0x59626b),
  cap: rgb(0xc3c9cf),
  lime: rgb(0xd2cbb8),
  blue: rgb(0x3b5b90),
  blueDark: rgb(0x2c4775),
  blueTrim: rgb(0x9db0cf),
  cream: rgb(0xefe8d6),
  board: rgb(0xdfe0dc),
  door: rgb(0xe4dfd2),
  dark: rgb(0x191718),
  inside: rgb(0x231a18),
  iron: rgb(0x2b2d31),
  wood: rgb(0x7b5433),
  woodDark: rgb(0x5a3b22),
  green: rgb(0x3f6b45),
  yellow: rgb(0xf0c019),
  black: rgb(0x151517),
  chrome: rgb(0xd9dce0),
  steel: rgb(0xaab0b6),
  brass: rgb(0xb08a45),
  bronze: rgb(0x8a6235),
  alu: rgb(0xc5c9cd),
  red: rgb(0xb3261e),
  white: rgb(0xe9e6de)
}

export interface Site { x0: number; x1: number; yf: number; yb: number; w: number; d: number; h: number; base: number; cx: number; cy: number; m: Model }

export const modelOf = (id: string): Model => {
  const m = table.models.find((x) => x.id === id)
  if (!m) throw new Error(`No model called "${id}" in the layout`)
  return m
}

// Where a model stands in its zone's frame: x0 to x1, its front (toward the flippers) at yf and its back at yb.
export const site = (z: Zone, id: string): Site => {
  const m = modelOf(id)
  const a = localBalls(z, m.box[0], m.box[1])
  const b = localBalls(z, m.box[0] + m.box[2], m.box[1] + m.box[3])
  return { x0: a[0], x1: b[0], yb: a[1], yf: b[1], w: b[0] - a[0], d: a[1] - b[1], h: m.h * BALL, base: (m.base ?? 0) * BALL, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, m }
}

// Runs `fn` in a frame of its own and then stands everything it made at x, y, z, turned about the z axis.
export function framed(b: Buckets, x: number, y: number, z: number, turn: number, fn: () => void): void {
  const marks = [b.paint.mark(), b.metal.mark(), b.glow.mark(), b.glass.mark()]
  const n = b.screws.length
  fn()
  b.paint.place(marks[0]!, x, y, z, turn)
  b.metal.place(marks[1]!, x, y, z, turn)
  b.glow.place(marks[2]!, x, y, z, turn)
  b.glass.place(marks[3]!, x, y, z, turn)
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  for (let i = n; i < b.screws.length; i++) {
    const q = b.screws[i]!
    b.screws[i] = [x + q[0] * c - q[1] * s, y + q[0] * s + q[1] * c, z + q[2], q[3]]
  }
}

export interface Hole { x: number; z: number; w: number; h: number }

// A wall face in its own frame: x along the wall, z up, the outside toward -y, with holes left open.
export function wallFace(g: Geo, x0: number, x1: number, z0: number, z1: number, holes: Hole[], col: RGB, kind = 0): void {
  const xs = [x0, x1]
  const zs = [z0, z1]
  for (const h of holes) {
    for (const x of [h.x, h.x + h.w]) if (x > x0 && x < x1) xs.push(x)
    for (const zz of [h.z, h.z + h.h]) if (zz > z0 && zz < z1) zs.push(zz)
  }
  const uniq = (a: number[]): number[] => [...new Set(a)].sort((p, q) => p - q)
  const ux = uniq(xs)
  const uz = uniq(zs)
  const open = (x: number, zz: number): boolean => holes.some((h) => x > h.x && x < h.x + h.w && zz > h.z && zz < h.z + h.h)
  for (let j = 0; j < uz.length - 1; j++) {
    let start = -1
    for (let i = 0; i <= ux.length - 1; i++) {
      const solid = i < ux.length - 1 && !open((ux[i]! + ux[i + 1]!) / 2, (uz[j]! + uz[j + 1]!) / 2)
      if (solid && start < 0) start = i
      if (!solid && start >= 0) {
        g.quad([ux[start]!, 0, uz[j]!], [ux[i]!, 0, uz[j]!], [ux[i]!, 0, uz[j + 1]!], [ux[start]!, 0, uz[j + 1]!], col, kind)
        start = -1
      }
    }
  }
}

// The four faces inside a hole, from the wall face back by `depth`.
export function reveal(g: Geo, h: Hole, depth: number, col: RGB, kind = 0): void {
  const { x, z, w } = h
  const t = z + h.h
  g.quad([x, 0, z], [x, depth, z], [x, depth, t], [x, 0, t], col, kind)
  g.quad([x + w, depth, z], [x + w, 0, z], [x + w, 0, t], [x + w, depth, t], col, kind)
  g.quad([x, 0, z], [x + w, 0, z], [x + w, depth, z], [x, depth, z], shade(col, 1.1), kind)
  g.quad([x, depth, t], [x + w, depth, t], [x + w, 0, t], [x, 0, t], shade(col, 0.7), kind)
}

export interface WindowLook { depth?: number; frame: RGB; wall: RGB; sill?: RGB; lintel?: RGB; bars?: [number, number]; glow?: number; warm?: number; iron?: boolean; dark?: boolean; surround?: RGB; blind?: number }

// A window in a hole of a wall face: its reveal, a lit pane at the back, a frame with glazing bars, a sill and a lintel.
export function windowAt(b: Buckets, h: Hole, o: WindowLook): void {
  const d = o.depth ?? 5.5
  const g = b.paint
  reveal(g, h, d, shade(o.wall, 0.5))
  const lum = o.glow ?? 1
  const warm = o.warm ?? 0.5
  const pane: RGB = o.dark ? [0.02, 0.025, 0.03] : [lum * 0.64, lum * (0.41 + 0.07 * warm), lum * (0.15 + 0.11 * warm)]
  const lo: RGB = o.dark ? pane : shade(pane, 0.55)
  const { x, z, w } = h
  const t = z + h.h
  // The pane is brighter at the top, where the lamp inside hangs.
  if (o.dark) b.glow.face([[x, d, z], [x + w, d, z], [x + w, d, t], [x, d, t]], pane, 0, [0, -1, 0])
  else {
    // The lamp inside is seen through the pane: hot behind its upper middle, amber toward the frame.
    const core: RGB = [lum * 1.3, lum * 1.04, lum * 0.6]
    const nx = 6
    const nz = 8
    const at = (i: number, j: number): RGB => {
      const r = Math.hypot((i / nx - 0.5) * 1.5, (j / nz - 0.6) * 1.3)
      return mix(lo, core, Math.exp(-r * r * 7))
    }
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        b.glow.blend([[x + (w * i) / nx, d, z + (h.h * j) / nz], [x + (w * (i + 1)) / nx, d, z + (h.h * j) / nz], [x + (w * (i + 1)) / nx, d, z + (h.h * (j + 1)) / nz], [x + (w * i) / nx, d, z + (h.h * (j + 1)) / nz]], [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)], [0, -1, 0])
      }
    }
  }
  // The frame and its glazing bars stand in front of the pane, so the light is seen behind them.
  const f = 1.4
  const gap = Math.min(1.7, d * 0.3)
  const fy1 = d - gap
  const fy0 = fy1 - Math.min(1.6, d * 0.4)
  g.box(x, x + f, fy0, fy1, z, t, o.frame, { skip: 'l' })
  g.box(x + w - f, x + w, fy0, fy1, z, t, o.frame, { skip: 'r' })
  g.box(x + f, x + w - f, fy0, fy1, z, z + f, o.frame, { skip: 'lr' })
  g.box(x + f, x + w - f, fy0, fy1, t - f, t, o.frame, { skip: 'lrt', under: true })
  const bars = o.bars ?? [2, 2]
  const bw = w > 9 ? 0.75 : 0.55
  for (let i = 1; i < bars[0]; i++) {
    const bx = x + (w * i) / bars[0]
    g.box(bx - bw, bx + bw, fy0 + 0.3, fy1, z + f, t - f, o.frame, { skip: 'tu' })
  }
  for (let i = 1; i < bars[1]; i++) {
    const bz = z + (h.h * i) / bars[1]
    g.box(x + f, x + w - f, fy0 + 0.3, fy1, bz - bw, bz + bw, o.frame, { skip: 'lr', under: true })
  }
  if (o.iron) {
    const n = Math.max(3, Math.round(w / 3.4))
    for (let i = 1; i < n; i++) {
      const bx = x + (w * i) / n
      b.paint.box(bx - 0.45, bx + 0.45, 0.6, 1.5, z, t, TONE.iron, { skip: 'btu', kind: KIND.gloss })
    }
    b.paint.box(x, x + w, 0.4, 1.7, z + h.h * 0.3, z + h.h * 0.3 + 1, TONE.iron, { skip: 'blr', under: true, kind: KIND.gloss })
    b.paint.box(x, x + w, 0.4, 1.7, z + h.h * 0.7, z + h.h * 0.7 + 1, TONE.iron, { skip: 'blr', under: true, kind: KIND.gloss })
  }
  if (o.blind) {
    const bz = t - f - (h.h - 2 * f) * o.blind
    g.box(x + f, x + w - f, d - 0.5, d - 0.3, bz, t - f, [0.62, 0.55, 0.42], { skip: 'blrt', under: true })
  }
  if (o.surround) {
    g.box(x - 2.4, x, -1.2, 0, z, t, o.surround, { skip: 'b', bevel: 0.4 })
    g.box(x + w, x + w + 2.4, -1.2, 0, z, t, o.surround, { skip: 'b', bevel: 0.4 })
  }
  if (o.sill) g.box(x - 2, x + w + 2, -2.6, 0, z - 2.6, z, o.sill, { skip: 'b', under: true, bevel: 0.6 })
  if (o.lintel) g.box(x - 2, x + w + 2, -1.4, 0, t, t + 4, o.lintel, { skip: 'b', under: true })
}

// A band that runs along a wall face and stands out from it.
export const band = (g: Geo, x0: number, x1: number, z0: number, z1: number, out: number, col: RGB, kind = 0): void => {
  g.box(x0, x1, -out, 0, z0, z1, col, { skip: 'b', under: true, kind, bevel: Math.min(0.8, out * 0.4) })
}

// A parapet round a flat roof: the wall above the deck with its inner faces and a cap.
export function parapet(g: Geo, x0: number, x1: number, y0: number, y1: number, deck: number, top: number, thick: number, wall: RGB, cap: RGB, kind: number): void {
  const over = 1.6
  const capH = 3
  const inner = shade(wall, 0.56)
  g.quad([x0 + thick, y0 + thick, deck], [x0 + thick, y1 - thick, deck], [x0 + thick, y1 - thick, top - capH], [x0 + thick, y0 + thick, top - capH], inner, kind)
  g.quad([x1 - thick, y1 - thick, deck], [x1 - thick, y0 + thick, deck], [x1 - thick, y0 + thick, top - capH], [x1 - thick, y1 - thick, top - capH], inner, kind)
  g.quad([x1 - thick, y0 + thick, deck], [x0 + thick, y0 + thick, deck], [x0 + thick, y0 + thick, top - capH], [x1 - thick, y0 + thick, top - capH], inner, kind)
  g.quad([x0 + thick, y1 - thick, deck], [x1 - thick, y1 - thick, deck], [x1 - thick, y1 - thick, top - capH], [x0 + thick, y1 - thick, top - capH], inner, kind)
  const o = x0 - over
  const p = x1 + over
  const q = y0 - over
  const r = y1 + over
  const t = thick + over
  g.box(o, p, q, y0 + thick + over * 0.6, top - capH, top, cap, { bevel: 0.9, under: true })
  g.box(o, p, y1 - thick - over * 0.6, r, top - capH, top, cap, { bevel: 0.9, under: true })
  g.box(o, x0 + t - over * 0.4, y0 + thick + over * 0.6, y1 - thick - over * 0.6, top - capH, top, cap, { bevel: 0.9, under: true, skip: 'fb' })
  g.box(x1 - t + over * 0.4, p, y0 + thick + over * 0.6, y1 - thick - over * 0.6, top - capH, top, cap, { bevel: 0.9, under: true, skip: 'fb' })
}

// The deck of a flat roof inside its parapet: felt laid in strips with a dark lap between them, and a gutter round it.
export function roofDeck(g: Geo, x0: number, x1: number, y0: number, y1: number, deck: number, felt: RGB = TONE.deck): void {
  g.quad([x0, y0, deck], [x1, y0, deck], [x1, y1, deck], [x0, y1, deck], felt, KIND.tar)
  const lap = 27
  const n = Math.max(1, Math.round((x1 - x0) / lap))
  for (let k = 1; k < n; k++) {
    const x = x0 + ((x1 - x0) * k) / n
    g.quad([x - 0.45, y0 + 3.5, deck + 0.06], [x + 0.45, y0 + 3.5, deck + 0.06], [x + 0.45, y1 - 3.5, deck + 0.06], [x - 0.45, y1 - 3.5, deck + 0.06], shade(felt, 0.6))
  }
  for (const [ax, bx, ay, by] of [[x0 + 1, x1 - 1, y0 + 1, y0 + 3.5], [x0 + 1, x1 - 1, y1 - 3.5, y1 - 1], [x0 + 1, x0 + 3.5, y0 + 3.5, y1 - 3.5], [x1 - 3.5, x1 - 1, y0 + 3.5, y1 - 3.5]] as const) g.quad([ax, ay, deck + 0.08], [bx, ay, deck + 0.08], [bx, by, deck + 0.08], [ax, by, deck + 0.08], shade(felt, 0.74))
}

// What a flat roof carries besides its deck: cross laps and patches in the felt, a lead upstand at the foot of the parapet, joints in the cap, two drains, a pipe on blocks along the back and a conduit down one side. `x0` to `y1` is the outside of the parapet, `thick` its thickness.
export function roofWorks(b: Buckets, x0: number, x1: number, y0: number, y1: number, deck: number, top: number, thick: number, felt: RGB = TONE.deck, turn = 0): void {
  const g = b.paint
  const ix0 = x0 + thick
  const ix1 = x1 - thick
  const iy0 = y0 + thick
  const iy1 = y1 - thick
  const flat = (ax: number, bx: number, ay: number, by: number, z: number, col: RGB, kind = 0): void => {
    g.quad([ax, ay, z], [bx, ay, z], [bx, by, z], [ax, by, z], col, kind)
  }
  const lap = 27
  const n = Math.max(1, Math.round((ix1 - ix0) / lap))
  for (let k = 0; k < n; k++) {
    const a = ix0 + ((ix1 - ix0) * k) / n
    const c = ix0 + ((ix1 - ix0) * (k + 1)) / n
    for (let y = iy0 + 8 + ((k * 37 + turn * 11) % 46); y < iy1 - 6; y += 58) flat(a + 0.5, c - 0.5, y - 0.4, y + 0.4, deck + 0.07, shade(felt, 0.58))
  }
  const spots: [number, number, number, number, number][] = [[0.16, 0.7, 15, 11, 1.2], [0.62, 0.3, 12, 16, 0.74], [0.84, 0.74, 17, 10, 0.8], [0.34, 0.24, 10, 9, 1.16]]
  spots.forEach(([u, v, w, d, tone], i) => {
    const px = ix0 + (ix1 - ix0) * (turn % 2 === 0 ? u : 1 - u)
    const py = iy0 + (iy1 - iy0) * v
    flat(px - w / 2, px + w / 2, py - d / 2, py + d / 2, deck + 0.1 + i * 0.01, shade(felt, tone), KIND.tar)
  })
  // The upstand: the felt turned up the wall under a lead strip.
  const lead = shade(felt, 1.3)
  const up = 3.2
  g.quad([ix0 + 0.12, iy0, deck], [ix0 + 0.12, iy1, deck], [ix0 + 0.12, iy1, deck + up], [ix0 + 0.12, iy0, deck + up], lead)
  g.quad([ix1 - 0.12, iy1, deck], [ix1 - 0.12, iy0, deck], [ix1 - 0.12, iy0, deck + up], [ix1 - 0.12, iy1, deck + up], lead)
  g.quad([ix1, iy0 + 0.12, deck], [ix0, iy0 + 0.12, deck], [ix0, iy0 + 0.12, deck + up], [ix1, iy0 + 0.12, deck + up], lead)
  g.quad([ix0, iy1 - 0.12, deck], [ix1, iy1 - 0.12, deck], [ix1, iy1 - 0.12, deck + up], [ix0, iy1 - 0.12, deck + up], lead)
  // Joints in the cap.
  const dark: RGB = [0.1, 0.1, 0.1]
  for (let x = x0 + 22; x < x1 - 10; x += 38) {
    flat(x - 0.3, x + 0.3, y0 - 0.6, iy0 + 0.4, top + 0.05, dark)
    flat(x + 11 - 0.3, x + 11 + 0.3, iy1 - 0.4, y1 + 0.6, top + 0.05, dark)
  }
  for (let y = iy0 + 20; y < iy1 - 10; y += 38) {
    flat(x0 - 0.6, ix0 + 0.4, y - 0.3, y + 0.3, top + 0.05, dark)
    flat(ix1 - 0.4, x1 + 0.6, y + 9 - 0.3, y + 9 + 0.3, top + 0.05, dark)
  }
  // Two drains.
  for (const [dx, dy] of [[ix0 + 9, iy1 - 9], [ix1 - 9, iy0 + 9]] as const) {
    flat(dx - 3, dx + 3, dy - 3, dy + 3, deck + 0.12, [0.03, 0.03, 0.035])
    b.metal.box(dx - 3.6, dx + 3.6, dy - 3.6, dy - 3, deck, deck + 0.8, TONE.steel)
    b.metal.box(dx - 3.6, dx + 3.6, dy + 3, dy + 3.6, deck, deck + 0.8, TONE.steel)
    b.metal.box(dx - 3.6, dx - 3, dy - 3, dy + 3, deck, deck + 0.8, TONE.steel, { skip: 'fb' })
    b.metal.box(dx + 3, dx + 3.6, dy - 3, dy + 3, deck, deck + 0.8, TONE.steel, { skip: 'fb' })
    for (const off of [-1.2, 1.2]) b.metal.box(dx - 3, dx + 3, dy + off - 0.3, dy + off + 0.3, deck + 0.3, deck + 0.8, TONE.steel, { skip: 'lr' })
  }
  // A pipe on blocks along the back, turned up the parapet at one end.
  const py = iy1 - 5.5
  const pz = deck + 3.4
  const pa = turn % 2 === 0 ? ix0 + 16 : ix1 - 16
  const pb = turn % 2 === 0 ? ix1 - 10 : ix0 + 10
  b.metal.rod([pa, py, pz], [pb, py, pz], 1.3, 8, TONE.steel)
  b.metal.rod([pb, py, pz], [pb, py, top - 3.4], 1.3, 8, TONE.steel)
  b.metal.rod([pa, py, pz], [pa, py - 12, pz], 1.3, 8, TONE.steel)
  b.metal.rod([pa, py - 12, pz], [pa, py - 12, deck], 1.3, 8, TONE.steel)
  for (let x = Math.min(pa, pb) + 12; x < Math.max(pa, pb) - 6; x += 34) g.box(x - 2.4, x + 2.4, py - 2.6, py + 2.6, deck, deck + 2.1, TONE.stoneDark, { bevel: 0.5 })
  // A conduit down one side with a box at its end.
  const cx = turn % 2 === 0 ? ix1 - 4.6 : ix0 + 4.6
  b.metal.rod([cx, iy0 + 16, deck + 1], [cx, iy1 - 16, deck + 1], 0.7, 6, TONE.iron)
  g.box(cx - 2.6, cx + 2.6, iy0 + 11, iy0 + 17, deck, deck + 3.4, TONE.stoneDark, { bevel: 0.5, kind: KIND.gloss })
}

// A mounting plate: brushed steel with a turned edge, screwed down at its corners and along its long sides. What stands on it is a part of the machine.
export function plate(b: Buckets, x0: number, x1: number, y0: number, y1: number, h: number): void {
  b.metal.box(x0, x1, y0, y1, 0, h, TONE.steel, { bevel: 0.9 })
  const n = Math.max(1, Math.round((x1 - x0) / 60))
  for (let i = 0; i <= n; i++) {
    const x = x0 + 3 + ((x1 - x0 - 6) * i) / n
    b.screws.push([x, y0 + 2.6, h, 1.3], [x, y1 - 2.6, h, 1.3])
  }
}

// A roof hatch: a low kerb with a plain felt lid and a handle. Nothing on a roof is lit.
export function roofHatch(b: Buckets, x0: number, x1: number, y0: number, y1: number, deck: number, kerb: RGB): void {
  const top = deck + 4.5
  b.paint.box(x0, x1, y0, y1, deck, top, kerb, { bevel: 0.6, kind: KIND.stucco })
  b.paint.box(x0 + 2, x1 - 2, y0 + 2, y1 - 2, top, top + 1.2, TONE.roof, { bevel: 0.5, kind: KIND.tar })
  b.metal.box((x0 + x1) / 2 - 5, (x0 + x1) / 2 + 5, y0 + 4, y0 + 5.4, top + 1.2, top + 2.2, TONE.steel, { under: true })
}

export function beaconBase(b: Buckets, x: number, y: number, z: number): void {
  // A polished chrome ring: a foot flange, a rolled bead, a waist and a lip that takes the lens.
  const ring: [number, number][] = [[0, 0], [32, 0], [32.6, 0.8], [32.6, 2.2], [31.6, 3.1]]
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI
    ring.push([29.4 + 2.2 * Math.cos(a), 5.3 + 2.2 * Math.sin(a)])
  }
  ring.push([28.2, 7.8], [27.6, 9.4], [26.2, 10], [0, 10])
  // Polished chrome shows the room in bands: the dark of the roof under its bead, a dark line at the horizon, the lamps over it.
  const bands = [0.5, 0.6, 0.35, 1.1, 0.9, 0.3, 0.3, 0.45, 0.6, 0.14, 0.2, 1.2, 1.25, 0.8, 0.22, 1.2, 0.6]
  b.metal.lathe(ring, x, y, 72, (k) => shade(TONE.chrome, bands[k] ?? 0.7), { base: z, soft: true })
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    b.screws.push([x + Math.cos(a) * 30.6, y + Math.sin(a) * 30.6, z + 3.1, 1.2])
  }
}

// The lens of a beacon, round the origin: a dome of clear ribbed plastic, smooth in its outline.
export function beaconLens(): THREE.BufferGeometry {
  const g = new Geo()
  const c: RGB = [1, 1, 1]
  const dome: [number, number][] = [[25.4, 0], [25.4, 2.2], [25, 3], [25, 9]]
  for (let i = 1; i <= 22; i++) {
    const a = (i / 22) * (Math.PI / 2)
    dome.push([25 * Math.pow(Math.cos(a), 0.62), 9 + 26 * Math.sin(a)])
  }
  g.lathe(dome, 0, 0, 160, c, { base: 8, wave: [32, 0.026], lean: 2.8, soft: true })
  return g.done()
}

// The lamp inside a beacon, round the origin: a small hot bulb in its holder. `at` moves it to its beacon.
export function beaconBulb(g: Geo, at: V3 = [0, 0, 0]): Geo {
  const m = g.mark()
  const bulb: [number, number][] = [[0, 12], [2.6, 12.4], [3.4, 14]]
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI
    bulb.push([6.2 * Math.cos(a), 21 + 6.2 * Math.sin(a)])
  }
  g.lathe(bulb, 0, 0, 20, [2.6, 2.6, 2.6], { soft: true })
  g.lathe([[0, 9.6], [7.4, 9.6], [7.4, 11.6], [0, 12]], 0, 0, 20, [0.05, 0.05, 0.05])
  g.place(m, at[0], at[1], at[2], 0)
  return g
}

// A sign board under the words of a model: a plate of cream enamel in a thin gilt bezel on two brackets, at the place, size and turn of the model's sign shape.
export const ENAMEL = rgb(0xefe8d6)
export const GILT = rgb(0xd0a445)
export function board(b: Buckets, z: Zone, ctx: RealContext, id: string, roof: number): void {
  const s = ctx.byId.get(`sign.${id}`)
  if (!s) return
  const c = localOf(z, s)
  const turn = s.turnX ?? 0
  const w = s.w / 2 + 10
  const h = s.h / 2 + 5.5
  const m = new THREE.Matrix4().makeRotationX(turn).setPosition(c[0], c[1], c[2])
  const pm = b.paint.mark()
  const mm = b.metal.mark()
  // The enamel face lies just under the words, flat, with a darker back and a fine rule inside its edge.
  b.paint.box(-w, w, -h, h, -4.5, -1, shade(ENAMEL, 0.5), { kind: KIND.enamel, under: true, top: ENAMEL, topKind: KIND.enamel })
  const f = 1.25
  const up = 0.5
  b.metal.box(-w - f, w + f, -h - f, -h, -5, up, GILT, { under: true, bevel: 0.5 })
  b.metal.box(-w - f, w + f, h, h + f, -5, up, GILT, { under: true, bevel: 0.5 })
  b.metal.box(-w - f, -w, -h, h, -5, up, GILT, { under: true, bevel: 0.5, skip: 'fb' })
  b.metal.box(w, w + f, -h, h, -5, up, GILT, { under: true, bevel: 0.5, skip: 'fb' })
  b.paint.move(pm, m)
  b.metal.move(mm, m)
  const v = new THREE.Vector3()
  for (const sx of [-1, 1]) {
    v.set(sx * w * 0.62, h * 0.2, -5).applyMatrix4(m)
    const foot: V3 = [v.x, v.y + 9, roof]
    b.metal.rod(foot, [v.x, v.y, v.z], 1.5, 8, TONE.steel)
    b.metal.box(foot[0] - 3.5, foot[0] + 3.5, foot[1] - 3.5, foot[1] + 3.5, roof, roof + 1.2, TONE.steel)
    b.screws.push([foot[0], foot[1] + 2.2, roof + 1.2, 1.1])
    v.set(sx * (w - 3.4), -h + 3.4, -1).applyMatrix4(m)
    b.screws.push([v.x, v.y, v.z, 0.9])
    v.set(sx * (w - 3.4), h - 3.4, -1).applyMatrix4(m)
    b.screws.push([v.x, v.y, v.z, 0.9])
  }
}

export { KIND, mix, rgb, shade }
