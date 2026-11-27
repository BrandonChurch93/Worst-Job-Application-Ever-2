// What a blast of the big cannon leaves on the ground, as numbers: the picture of wounds the ceramic reads. Pure, no three.js.
import type { ViewBox, ViewBreak } from '../boss/view'
import { rnd } from './change'
import { ARENA, PAGE, PANES, PILLARS, SEAMS, paneBox } from './layout'

// Smooth noise from 0 to 1, the same on every machine.
export function noise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y)
  const fx = x - xi, fy = y - yi
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = rnd(seed, xi, yi), b = rnd(seed, xi + 1, yi), c = rnd(seed, xi, yi + 1), d = rnd(seed, xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// Two layers of it, each turned off the axes, so that nothing drawn from it shows the grid it was made on.
export function fbm(x: number, y: number, seed: number): number {
  return 0.62 * noise(x * 0.8 + y * 0.6, y * 0.8 - x * 0.6, seed) + 0.38 * noise((x * 0.6 - y * 0.8) * 2.03 + 17.3, (y * 0.6 + x * 0.8) * 2.03, seed + 101)
}

const step = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// What must keep its ground: the feet of the standing things, the guns, the health bar and the socket.
const KEEP: { box: ViewBox; grow: number }[] = [
  ...PILLARS.map((p) => ({ box: { x0: p.x - ARENA.pillar.foot / 2, y0: p.y - ARENA.pillar.foot / 2, x1: p.x + ARENA.pillar.foot / 2, y1: p.y + ARENA.pillar.foot / 2 }, grow: 8 })),
  ...PANES.map((p) => ({ box: paneBox(p), grow: 12 })),
  ...ARENA.corners.map((c) => ({ box: { x0: c.x - 62, y0: c.y - 62, x1: c.x + 62, y1: c.y + 62 }, grow: 10 })),
  { box: { x0: ARENA.bar.x0, y0: ARENA.bar.y0, x1: ARENA.bar.x1, y1: ARENA.bar.y1 }, grow: 12 },
  { box: { x0: ARENA.slot.x - ARENA.slot.w / 2, y0: ARENA.slot.y - ARENA.slot.h / 2, x1: ARENA.slot.x + ARENA.slot.w / 2, y1: ARENA.slot.y + ARENA.slot.h / 2 }, grow: 26 }
]

// 0 on a thing that keeps its ground, 1 some 30 px away from all of them.
export function clearOf(x: number, y: number): number {
  let best = 1
  for (const k of KEEP) {
    const dx = Math.max(k.box.x0 - x, 0, x - k.box.x1), dy = Math.max(k.box.y0 - y, 0, y - k.box.y1)
    best = Math.min(best, (Math.hypot(dx, dy) - k.grow) / 30)
  }
  return Math.max(0, best)
}

export interface Line { k: ViewBreak; tag: number; ux: number; uy: number; long: number; hole: number; blobs: { x: number; y: number; r: number; s: number }[] }

// A number for a line from where it runs, so that the same line is always broken the same way.
export const tagOf = (k: { x0: number; y0: number; x1: number; y1: number }): number => (Math.round(k.x0) * 7 + Math.round(k.y0) * 13 + Math.round(k.x1) * 17 + Math.round(k.y1) * 19) & 0xffff

// A blast line made ready: its direction, how long the hole at its far end is, and where it crosses the seams.
export function lineOf(k: ViewBreak, seed: number): Line {
  const tag = tagOf(k)
  const long = Math.hypot(k.x1 - k.x0, k.y1 - k.y0) || 1
  const ux = (k.x1 - k.x0) / long, uy = (k.y1 - k.y0) / long
  const hole = Math.min(long * 0.45, 290 + 130 * rnd(seed, tag, 5))
  const blobs: Line['blobs'] = []
  SEAMS.forEach((seam, si) => {
    seam.points.forEach((p, pi) => {
      if (pi % 2) return
      const rx = p.x - k.x0, ry = p.y - k.y0
      const s = rx * ux + ry * uy, c = -rx * uy + ry * ux
      if (s < 30 || s > long || Math.abs(c) > 40) return
      blobs.push({ x: p.x, y: p.y, s, r: (11 + 13 * rnd(seed, tag * 31 + si, pi)) * (1 - Math.abs(c) / 60) })
    })
  })
  return { k, tag, ux, uy, long, hole, blobs }
}

// Whether the slab is broken through at a place: the ragged hole at the far end of the line, and the crumbled edges where the line crosses a seam.
export function holeAt(l: Line, x: number, y: number, seed: number): boolean {
  const rx = x - l.k.x0, ry = y - l.k.y0
  const s = rx * l.ux + ry * l.uy, c = -rx * l.uy + ry * l.ux
  if (s < 0 || s > l.long + 4 || Math.abs(c) > 80) return false
  const t = (s - (l.long - l.hole)) / l.hole
  let near = t > 0
  if (!near) for (const b of l.blobs) if (Math.abs(s - b.s) < b.r * 1.4 + 2) { near = true; break }
  if (!near) return false
  const clear = clearOf(x, y)
  if (clear <= 0.02) return false
  if (t > 0) {
    const ragged = 0.7 + 0.6 * noise(s / 34 + l.tag * 7.3, 1.7, seed) + 0.5 * (fbm(x / 13, y / 13, seed + 3) - 0.5)
    const half = (14 + 46 * Math.sqrt(t)) * ragged * clear
    const wobble = 12 * (noise(s / 70, l.tag + 20.5, seed) - 0.5)
    if (Math.abs(c - wobble) < half) return true
  }
  for (const b of l.blobs) {
    const d = Math.hypot(x - b.x, y - b.y)
    if (d < b.r * 1.4 && d < b.r * clear * (0.7 + 0.7 * fbm(x / 11, y / 11 + l.tag, seed + 5))) return true
  }
  return false
}

// Paints every wound of the blasts given into `data` (W by H texels over the page, RGBA, row 0 at the bottom of the page):
// red the soot, green how deep the trench is cut, blue the embers, alpha the slab broken through (1 the light below, about 0.2 the broken wall under its upper edge).
export function paintWounds(data: Uint8Array, W: number, H: number, active: readonly ViewBreak[], seed: number): void {
  data.fill(0)
  for (const k of active) paintBreak(data, W, H, k, seed)
}

// The part of the picture a blast can reach: columns i0 to i1, rows j0 to j1.
export function reachOf(k: ViewBreak, W: number, H: number): { i0: number; i1: number; j0: number; j1: number } {
  const sx = PAGE.w / W, sy = PAGE.h / H
  const reach = k.width / 2 + 60
  return {
    i0: Math.max(0, Math.floor((Math.min(k.x0, k.x1) - reach) / sx)), i1: Math.min(W - 1, Math.ceil((Math.max(k.x0, k.x1) + reach) / sx)),
    j0: Math.max(0, Math.floor((PAGE.h - Math.max(k.y0, k.y1) - reach) / sy)), j1: Math.min(H - 1, Math.ceil((PAGE.h - Math.min(k.y0, k.y1) + reach) / sy))
  }
}

let scratch: Uint8Array | null = null

// One blast, painted over what is there.
export function paintBreak(data: Uint8Array, W: number, H: number, k: ViewBreak, seed: number): void {
  if (!scratch || scratch.length !== data.length) scratch = new Uint8Array(data.length)
  const r = reachOf(k, W, H)
  paintLayer(scratch, W, H, k, seed, r.j0, r.j1 + 1)
  layOver(data, scratch, W, H, k)
}

// Lays a blast painted alone over the wounds that are there: where either broke the slab through it stays broken, the light below winning over the broken wall; elsewhere the deeper wound of the two. The order of the blasts does not change the picture.
export function layOver(data: Uint8Array, layer: Uint8Array, W: number, H: number, k: ViewBreak): void {
  const r = reachOf(k, W, H)
  for (let j = r.j0; j <= r.j1; j++) {
    for (let i = r.i0; i <= r.i1; i++) {
      const at = (j * W + i) * 4
      const a = layer[at + 3]!
      if (a > 0) {
        data[at] = 0
        data[at + 1] = 0
        data[at + 2] = 0
        if (a > data[at + 3]!) data[at + 3] = a
      } else if (data[at + 3] === 0) {
        if (layer[at]! > data[at]!) data[at] = layer[at]!
        if (layer[at + 1]! > data[at + 1]!) data[at + 1] = layer[at + 1]!
        if (layer[at + 2]! > data[at + 2]!) data[at + 2] = layer[at + 2]!
      }
    }
  }
}

// Rows `from` up to `to` of one blast alone, written into `layer`: the work can be done a few rows at a time before the blast, and gives the same picture as done at once.
export function paintLayer(layer: Uint8Array, W: number, H: number, k: ViewBreak, seed: number, from: number, to: number): void {
  const sx = PAGE.w / W, sy = PAGE.h / H
  const wall = 15
  const l = lineOf(k, seed)
  const half = k.width / 2
  const reach = half + 60
  const { i0, i1 } = reachOf(k, W, H)
  const data = layer
  const j0 = from, j1 = to - 1
  for (let j = j0; j <= j1; j++) {
    const y = PAGE.h - (j + 0.5) * sy
    layer.fill(0, (j * W + i0) * 4, (j * W + i1 + 1) * 4)
    for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * sx
      const rx = x - k.x0, ry = y - k.y0
      const s = rx * l.ux + ry * l.uy
      if (s < -24 || s > l.long + 8) continue
      const c = -rx * l.uy + ry * l.ux
      const ac = Math.abs(c)
      if (ac > reach) continue
      const at = (j * W + i) * 4
      if (holeAt(l, x, y, seed)) {
        // How far inside the hole: the light is strongest away from its rim, and under its upper edge the broken wall of the slab shows.
        let inside = 0
        for (const [ox, oy] of [[14, 0], [-14, 0], [0, 14], [0, -14], [10, 10], [-10, 10], [10, -10], [-10, -10]] as [number, number][]) if (holeAt(l, x + ox, y + oy, seed)) inside++
        const lit = holeAt(l, x, y - wall, seed) && holeAt(l, x - wall * 0.5, y - wall, seed)
        data[at + 3] = lit ? Math.round(255 * (0.62 + 0.38 * (inside / 8))) : 52
        continue
      }
      const id = l.tag
      const streak = noise(s / 90, c / 26 + id * 13.1, seed + 11)
      const fine = fbm(x / 5, y / 5, seed + 12)
      const mid = fbm(x / 24, y / 24, seed + 13)
      const taper = step(-16, 46, s)
      const edge = half * (0.62 + 0.5 * (streak - 0.5)) + 14 * (mid - 0.5)
      const hair = noise(s / 70 + 31.7, c / 3.2, seed + 17)
      let soot = step(edge + 46, edge - 12, ac) ** 1.4 * (0.86 + 0.14 * hair) * (0.82 + 0.18 * fine)
      soot = Math.max(soot, 0.4 * step(edge + 96, edge + 4, ac) * (0.35 + 0.65 * mid))
      // Specks of soot thrown wide of the trench, and dark fissures that run with it.
      if (ac < edge + 74 && mid > 0.42) {
        const speck = fbm(x / 4.2, y / 4.2, seed + 18)
        if (speck > 0.7) soot = Math.max(soot, step(edge + 74, edge + 16, ac) * step(0.7, 0.78, speck))
      }
      const fissure = step(0.9, 0.97, 1 - Math.abs(2 * noise(s / 46 + 7.7, c / 5.5, seed + 19) - 1)) * step(edge + 10, edge - 14, ac)
      soot = Math.max(soot, fissure)
      soot *= taper
      const core = step(half * 0.52 + 12 * (streak - 0.5), half * 0.18, ac) * taper
      soot = Math.max(soot, core * (0.8 + 0.2 * fine))
      const depth = core * (0.45 + 0.55 * mid) + 0.22 * soot * fine + 0.35 * fissure * taper
      let ember = 0
      if (ac < half * 0.56) {
        // Two rows of them, in clumps drawn out along the line, as coals lie in a furrow.
        const patch = 0.45 + 0.55 * step(0.3, 0.5, noise(s / 80 + id * 3.7, (c > 0 ? 3.3 : 9.1), seed + 15))
        const blob = fbm(s / 21 + 50, c / 8.5 + id, seed + 16)
        const row = Math.exp(-(((ac - half * 0.27) / (half * 0.13)) ** 2))
        ember = step(0.46, 0.6, blob) * (0.4 + 0.6 * step(0.36, 0.56, fine)) * patch * (0.12 + 0.88 * row) * taper
      }
      data[at] = Math.round(255 * Math.min(1, soot))
      data[at + 1] = Math.round(255 * Math.min(1, depth))
      data[at + 2] = Math.round(255 * Math.min(1, ember))
    }
  }
}
