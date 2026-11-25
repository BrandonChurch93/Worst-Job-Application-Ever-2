import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { BALL, table, type Model } from '../../../layout'
import { localBalls, localOf, type Zone } from '../../zone'
import { Geo, KIND, mix, rgb, shade, type Buckets, type RGB, type V3 } from './geo'

export const TONE = {
  brick: rgb(0x7d3329),
  brickDark: rgb(0x6f261f),
  stone: rgb(0x878a8c),
  stoneDark: rgb(0x696b6d),
  stonePale: rgb(0x9fa1a2),
  concrete: rgb(0x868c92),
  concreteDark: rgb(0x696d70),
  roof: rgb(0x66696b),
  lime: rgb(0xd2cbb8),
  blue: rgb(0x3b5b90),
  blueDark: rgb(0x2c4775),
  blueTrim: rgb(0x9db0cf),
  cream: rgb(0xefe8d6),
  board: rgb(0xcdc6b4),
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
  const d = o.depth ?? 3.5
  const g = b.paint
  reveal(g, h, d, shade(o.wall, 0.62))
  const lum = o.glow ?? 1
  const warm = o.warm ?? 0.5
  const pane: RGB = o.dark ? [0.02, 0.025, 0.03] : [lum, lum * (0.84 + 0.16 * warm), lum * (0.62 + 0.3 * warm)]
  const lo: RGB = o.dark ? pane : shade(pane, 0.55)
  const { x, z, w } = h
  const t = z + h.h
  // The pane is brighter at the top, where the lamp inside hangs.
  b.glow.face([[x, d, z], [x + w, d, z], [x + w, d, (z + t) / 2], [x, d, (z + t) / 2]], lo, 0, [0, -1, 0])
  b.glow.face([[x, d, (z + t) / 2], [x + w, d, (z + t) / 2], [x + w, d, t], [x, d, t]], pane, 0, [0, -1, 0])
  const f = 1.3
  const fy0 = d - 1.4
  g.box(x, x + f, fy0, d, z, t, o.frame, { skip: 'bl' })
  g.box(x + w - f, x + w, fy0, d, z, t, o.frame, { skip: 'br' })
  g.box(x + f, x + w - f, fy0, d, z, z + f, o.frame, { skip: 'blr' })
  g.box(x + f, x + w - f, fy0, d, t - f, t, o.frame, { skip: 'blrt', under: true })
  const bars = o.bars ?? [2, 2]
  for (let i = 1; i < bars[0]; i++) {
    const bx = x + (w * i) / bars[0]
    g.box(bx - 0.5, bx + 0.5, d - 0.9, d, z + f, t - f, o.frame, { skip: 'btu' })
  }
  for (let i = 1; i < bars[1]; i++) {
    const bz = z + (h.h * i) / bars[1]
    g.box(x + f, x + w - f, d - 0.9, d, bz - 0.5, bz + 0.5, o.frame, { skip: 'blr', under: true })
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
  const inner = shade(wall, 0.8)
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

// A beacon: a chromed base on a roof, in the metal bucket. Its lens and its reflector are meshes of their own.
export function beaconBase(b: Buckets, x: number, y: number, z: number): void {
  b.metal.lathe([[0, 0], [24.5, 0], [24.5, 2.5], [22.2, 4.5], [22.2, 7], [20.2, 8], [0, 8]], x, y, 28, TONE.chrome, { base: z })
  b.metal.lathe([[2.2, 8], [2.2, 14], [0, 14]], x, y, 10, TONE.steel, { base: z })
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    b.screws.push([x + Math.cos(a) * 23.3, y + Math.sin(a) * 23.3, z + 2.5, 1.2])
  }
}

// The lens of a beacon, round the origin: a fluted dome.
export function beaconLens(): THREE.BufferGeometry {
  const g = new Geo()
  const c: RGB = [1, 1, 1]
  g.lathe([[19.2, 0], [19.2, 18], [18.4, 25], [15.8, 31], [11.2, 35.4], [5.2, 37.4], [0, 37.8]], 0, 0, 72, c, { base: 7, wave: [28, 0.06] })
  g.lathe([[20, 0], [20, 1.8], [19.2, 1.8]], 0, 0, 36, c, { base: 7 })
  return g.done()
}

// The reflector inside a beacon, round the origin: a curved mirror seen only from its bright side, and the bulb.
export function beaconReflector(): THREE.BufferGeometry {
  const g = new Geo()
  const c: RGB = [0.6, 0.6, 0.6]
  const segs = 10
  for (let i = 0; i < segs; i++) {
    const a0 = -1.05 + (2.1 * i) / segs
    const a1 = -1.05 + (2.1 * (i + 1)) / segs
    const at = (a: number, zz: number): [V3, V3] => [[-11.5 * Math.cos(a) + 3.5, 11.5 * Math.sin(a), zz], [Math.cos(a), -Math.sin(a), 0]]
    g.smooth([at(a0, 9), at(a1, 9), at(a1, 30), at(a0, 30)], c)
  }
  g.lathe([[0, 12], [2.6, 13], [3.4, 16], [2.6, 19], [0, 20]], 0, 0, 10, [2.4, 2.4, 2.4])
  return g.done()
}

// A sign board under the words of a model: a cream face in a brass frame on two brackets, at the place, size and turn of the model's sign shape.
export function board(b: Buckets, z: Zone, ctx: RealContext, id: string, roof: number): void {
  const s = ctx.byId.get(`sign.${id}`)
  if (!s) return
  const c = localOf(z, s)
  const turn = s.turnX ?? 0
  const w = s.w / 2 + 9
  const h = s.h / 2 + 5
  const m = new THREE.Matrix4().makeRotationX(turn).setPosition(c[0], c[1], c[2])
  const pm = b.paint.mark()
  const mm = b.metal.mark()
  b.paint.box(-w, w, -h, h, -4.5, -1, TONE.board, { kind: KIND.gloss, under: true })
  const f = 1.7
  b.metal.box(-w - f, w + f, -h - f, -h, -5, 0.4, TONE.brass, { under: true, bevel: 0.7 })
  b.metal.box(-w - f, w + f, h, h + f, -5, 0.4, TONE.brass, { under: true, bevel: 0.7 })
  b.metal.box(-w - f, -w, -h, h, -5, 0.4, TONE.brass, { under: true, bevel: 0.7, skip: 'fb' })
  b.metal.box(w, w + f, -h, h, -5, 0.4, TONE.brass, { under: true, bevel: 0.7, skip: 'fb' })
  b.paint.move(pm, m)
  b.metal.move(mm, m)
  const v = new THREE.Vector3()
  for (const sx of [-1, 1]) {
    v.set(sx * w * 0.62, h * 0.2, -5).applyMatrix4(m)
    const foot: V3 = [v.x, v.y + 9, roof]
    b.metal.rod(foot, [v.x, v.y, v.z], 1.5, 8, TONE.steel)
    b.metal.box(foot[0] - 3.5, foot[0] + 3.5, foot[1] - 3.5, foot[1] + 3.5, roof, roof + 1.2, TONE.steel)
    b.screws.push([foot[0], foot[1] + 2.2, roof + 1.2, 1.1])
    v.set(sx * (w + f * 0.5), -h - f * 0.5, 0.4).applyMatrix4(m)
    b.screws.push([v.x, v.y, v.z, 1.0])
    v.set(sx * (w + f * 0.5), h + f * 0.5, 0.4).applyMatrix4(m)
    b.screws.push([v.x, v.y, v.z, 1.0])
  }
}

export { KIND, mix, rgb, shade }
