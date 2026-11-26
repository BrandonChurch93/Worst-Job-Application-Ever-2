import * as THREE from 'three'
import { BALL, FLIP, table } from '../../layout'
import { localBalls, type Zone } from '../zone'
import * as C from './colours'
import type { RGB } from './colours'
import { blockersOf } from './pictures'

// The head lamps: one bar of warm spots under the cross rail at the head of each tier, right of the middle, aimed down the tier. They are the one light of a tier that comes from one side, so everything that stands throws one long soft shadow toward the foot and the left.
export interface Key {
  // Toward the lamps, in the zone's frame: x right, y up the page, z up.
  toward: [number, number, number]
  colour: RGB
  power: number
}

const unit = (x: number, y: number, z: number): [number, number, number] => {
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l]
}

export const KEYS: Record<string, Key> = {
  corporate: { toward: unit(0.56, 0.72, 0.5), colour: C.CORPORATE_KEY, power: 1.7 },
  office: { toward: unit(0.56, 0.72, 0.52), colour: C.OFFICE_KEY, power: 1.6 },
  street: { toward: unit(0.56, 0.72, 0.5), colour: C.STREET_KEY, power: 1.5 }
}

export const keyOf = (z: Zone | string): Key | null => KEYS[typeof z === 'string' ? z : z.id] ?? null

export const SHADE = { texel: 4, spread: 0.07, rise: 0.05, blur: 1 }
export const BALLS = 6
export const BATS = 2
export const BAT = { top: 44, pivot: FLIP.radius * BALL, tip: FLIP.tip * BALL }

export interface Shade {
  width: number
  height: number
  // How high everything that stands is, texel by texel, row 0 at the foot of the zone.
  heights: Float32Array
  // For each of three places along the bar: below this height a point over the texel lies in shadow.
  under: Float32Array[]
  texture: THREE.DataTexture
}

function heightsOf(z: Zone, w: number, h: number): Float32Array {
  const T = SHADE.texel
  const H = new Float32Array(w * h)
  const put = (i: number, j: number, v: number): void => {
    if (i < 0 || j < 0 || i >= w || j >= h) return
    if (v > H[j * w + i]!) H[j * w + i] = v
  }
  const ix = (x: number): number => (x + 960) / T
  const iy = (y: number): number => (y + z.height / 2) / T
  const box = (a: number, b: number, c: number, d: number, tall: number): void => {
    for (let j = Math.floor(iy(b)); j <= Math.floor(iy(d) - 1e-6); j++) for (let i = Math.floor(ix(a)); i <= Math.floor(ix(c) - 1e-6); i++) put(i, j, tall)
  }
  const disc = (x: number, y: number, r: number, tall: number): void => {
    for (let j = Math.floor(iy(y - r)); j <= Math.floor(iy(y + r)); j++) {
      for (let i = Math.floor(ix(x - r)); i <= Math.floor(ix(x + r)); i++) {
        if (Math.hypot((i + 0.5) * T - 960 - x, (j + 0.5) * T - z.height / 2 - y) <= r) put(i, j, tall)
      }
    }
  }
  const wall = (ax: number, ay: number, bx: number, by: number, tall: number, half: number): void => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (T * 0.5)))
    for (let s = 0; s <= n; s++) disc(ax + ((bx - ax) * s) / n, ay + ((by - ay) * s) / n, half, tall)
  }
  for (const o of blockersOf(z)) {
    if (o.id.startsWith('rail.') || o.id.startsWith('sling.')) continue
    if (o.kind === 0) box(o.a, o.b, o.c, o.d, o.h)
    else if (o.kind === 1) wall(o.a, o.b, o.c, o.d, o.h, 3)
    else disc(o.a, o.b, o.c, o.h)
  }
  for (const s of table.slings) {
    if (s.tier !== z.tier) continue
    const p = [s.a, s.b, s.c].map((q) => localBalls(z, q[0], q[1]))
    const x0 = Math.min(p[0]![0], p[1]![0], p[2]![0])
    const x1 = Math.max(p[0]![0], p[1]![0], p[2]![0])
    const y0 = Math.min(p[0]![1], p[1]![1], p[2]![1])
    const y1 = Math.max(p[0]![1], p[1]![1], p[2]![1])
    for (let j = Math.floor(iy(y0)); j <= Math.floor(iy(y1)); j++) {
      for (let i = Math.floor(ix(x0)); i <= Math.floor(ix(x1)); i++) {
        const x = (i + 0.5) * T - 960
        const y = (j + 0.5) * T - z.height / 2
        let pos = 0
        let neg = 0
        for (let n = 0; n < 3; n++) {
          const a = p[n]!
          const b = p[(n + 1) % 3]!
          if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) > 0) pos++
          else neg++
        }
        if (pos === 0 || neg === 0) put(i, j, 44)
      }
    }
  }
  for (const t of table.targets) {
    if (t.tier !== z.tier || t.kind === 'spinner') continue
    const a = localBalls(z, t.box[0], t.box[1])
    box(a[0], a[1] - t.box[3] * BALL, a[0] + t.box[2] * BALL, a[1], t.kind === 'drop' ? 40 : 34)
  }
  for (const d of table.displays) {
    if (d.tier !== z.tier) continue
    const a = localBalls(z, d.box[0], d.box[1])
    box(a[0], a[1] - d.box[3] * BALL, a[0] + d.box[2] * BALL, a[1], 30)
  }
  return H
}

function blur(p: Float32Array, w: number, h: number, passes: number): void {
  const t = new Float32Array(p.length)
  for (let pass = 0; pass < passes; pass++) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) t[j * w + i] = (p[j * w + Math.max(0, i - 1)]! + 2 * p[j * w + i]! + p[j * w + Math.min(w - 1, i + 1)]!) / 4
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p[j * w + i] = (t[Math.max(0, j - 1) * w + i]! + 2 * t[j * w + i]! + t[Math.min(h - 1, j + 1) * w + i]!) / 4
  }
}

// Sweeps the heights away from the lamps, one row or column at a time: what a texel's neighbours toward the lamps shade, less the fall of the light over one step. The mixing between two neighbours spreads the edge of a shadow the further it runs, as a wide lamp does.
function sweep(H: Float32Array, w: number, h: number, toward: [number, number, number]): Float32Array {
  const S = new Float32Array(H)
  const [dx, dy, dz] = toward
  const flat = Math.hypot(dx, dy)
  const alongY = Math.abs(dy) >= Math.abs(dx)
  const lead = alongY ? dy : dx
  const side = (alongY ? dx : dy) / Math.abs(lead)
  const drop = (dz / flat) * SHADE.texel * Math.hypot(1, side)
  const n = alongY ? h : w
  const m = alongY ? w : h
  const at = (a: number, b: number): number => (alongY ? a * w + b : b * w + a)
  const step = lead > 0 ? 1 : -1
  for (let a = lead > 0 ? n - 2 : 1; a >= 0 && a < n; a -= step) {
    for (let b = 0; b < m; b++) {
      const f = b + side
      const b0 = Math.floor(f)
      const t = f - b0
      const v0 = b0 >= 0 && b0 < m ? S[at(a + step, b0)]! : 0
      const v1 = b0 + 1 >= 0 && b0 + 1 < m ? S[at(a + step, b0 + 1)]! : 0
      const from = v0 + (v1 - v0) * t - drop
      const i = at(a, b)
      if (from > S[i]!) S[i] = from
    }
  }
  return S
}

const made = new Map<string, Shade>()

export function shadeOf(z: Zone): Shade {
  const have = made.get(z.id)
  if (have) return have
  const w = Math.round(1920 / SHADE.texel)
  const h = Math.max(1, Math.round(z.height / SHADE.texel))
  const key = keyOf(z)
  const heights = key ? heightsOf(z, w, h) : new Float32Array(w * h)
  const under: Float32Array[] = []
  if (key) {
    const [x, y, zz] = key.toward
    for (const [turn, rise] of [[0, 0], [SHADE.spread, SHADE.rise], [-SHADE.spread, -SHADE.rise]] as [number, number][]) {
      const c = Math.cos(turn)
      const s = Math.sin(turn)
      const S = sweep(heights, w, h, unit(x * c - y * s, x * s + y * c, zz + rise))
      blur(S, w, h, SHADE.blur)
      under.push(S)
    }
  } else for (let i = 0; i < 3; i++) under.push(new Float32Array(w * h))
  const data = new Uint16Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    for (let c = 0; c < 3; c++) data[i * 4 + c] = THREE.DataUtils.toHalfFloat(under[c]![i]!)
    data[i * 4 + 3] = THREE.DataUtils.toHalfFloat(heights[i]!)
  }
  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType)
  texture.name = `table-lights.${z.id}.key`
  texture.colorSpace = THREE.NoColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.needsUpdate = true
  const out = { width: w, height: h, heights, under, texture }
  made.set(z.id, out)
  return out
}
