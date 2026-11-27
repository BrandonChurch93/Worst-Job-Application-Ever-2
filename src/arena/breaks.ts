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

export interface Line { k: ViewBreak; ux: number; uy: number; long: number; hole: number; blobs: { x: number; y: number; r: number }[] }

// A blast line made ready: its direction, how long the hole at its far end is, and where it crosses the seams.
export function lineOf(k: ViewBreak, seed: number): Line {
  const long = Math.hypot(k.x1 - k.x0, k.y1 - k.y0) || 1
  const ux = (k.x1 - k.x0) / long, uy = (k.y1 - k.y0) / long
  const hole = Math.min(long * 0.45, 190 + 120 * rnd(seed, k.id, 5))
  const blobs: Line['blobs'] = []
  SEAMS.forEach((seam, si) => {
    seam.points.forEach((p, pi) => {
      if (pi % 2) return
      const rx = p.x - k.x0, ry = p.y - k.y0
      const s = rx * ux + ry * uy, c = -rx * uy + ry * ux
      if (s < 30 || s > long || Math.abs(c) > 40) return
      blobs.push({ x: p.x, y: p.y, r: (11 + 13 * rnd(seed, k.id * 31 + si, pi)) * (1 - Math.abs(c) / 60) })
    })
  })
  return { k, ux, uy, long, hole, blobs }
}

// Whether the slab is broken through at a place: the ragged hole at the far end of the line, and the crumbled edges where the line crosses a seam.
export function holeAt(l: Line, x: number, y: number, seed: number): boolean {
  const rx = x - l.k.x0, ry = y - l.k.y0
  const s = rx * l.ux + ry * l.uy, c = -rx * l.uy + ry * l.ux
  if (s < 0 || s > l.long + 4 || Math.abs(c) > 80) return false
  const clear = clearOf(x, y)
  if (clear <= 0.02) return false
  const t = (s - (l.long - l.hole)) / l.hole
  if (t > 0) {
    const ragged = 0.7 + 0.6 * noise(s / 34 + l.k.id * 7.3, 1.7, seed) + 0.3 * (noise(x / 9, y / 9, seed + 3) - 0.5)
    const half = (10 + 40 * Math.sqrt(t)) * ragged * clear
    const wobble = 12 * (noise(s / 70, l.k.id + 20.5, seed) - 0.5)
    if (Math.abs(c - wobble) < half) return true
  }
  for (const b of l.blobs) {
    const d = Math.hypot(x - b.x, y - b.y)
    if (d < b.r * clear * (0.7 + 0.6 * noise(x / 11, y / 11 + l.k.id, seed + 5))) return true
  }
  return false
}

// Paints every wound of the blasts given into `data` (W by H texels over the page, RGBA, row 0 at the bottom of the page):
// red the soot, green how deep the trench is cut, blue the embers, alpha the slab broken through (1 the light below, about 0.2 the broken wall under its upper edge).
export function paintWounds(data: Uint8Array, W: number, H: number, active: readonly ViewBreak[], seed: number): void {
  data.fill(0)
  const sx = PAGE.w / W, sy = PAGE.h / H
  const wall = 15
  for (const k of active) {
    const l = lineOf(k, seed)
    const half = k.width / 2
    const reach = half + 60
    const i0 = Math.max(0, Math.floor((Math.min(k.x0, k.x1) - reach) / sx)), i1 = Math.min(W - 1, Math.ceil((Math.max(k.x0, k.x1) + reach) / sx))
    const j0 = Math.max(0, Math.floor((PAGE.h - Math.max(k.y0, k.y1) - reach) / sy)), j1 = Math.min(H - 1, Math.ceil((PAGE.h - Math.min(k.y0, k.y1) + reach) / sy))
    for (let j = j0; j <= j1; j++) {
      const y = PAGE.h - (j + 0.5) * sy
      for (let i = i0; i <= i1; i++) {
        const x = (i + 0.5) * sx
        const rx = x - k.x0, ry = y - k.y0
        const s = rx * l.ux + ry * l.uy
        if (s < -24 || s > l.long + 8) continue
        const c = -rx * l.uy + ry * l.ux
        const ac = Math.abs(c)
        if (ac > reach) continue
        const streak = noise(s / 90, c / 26 + k.id * 13.1, seed + 11)
        const fine = noise(x / 7, y / 7, seed + 12)
        const mid = noise(x / 24, y / 24, seed + 13)
        const taper = step(-16, 46, s)
        const edge = half * (0.62 + 0.5 * (streak - 0.5)) + 14 * (mid - 0.5)
        const hair = noise(s / 70 + 31.7, c / 4.5, seed + 17)
        let soot = step(edge + 46, edge - 12, ac) ** 1.4 * (0.62 + 0.38 * hair) * (0.82 + 0.18 * fine)
        soot = Math.max(soot, 0.3 * step(edge + 80, edge + 6, ac) * (0.3 + 0.7 * mid))
        soot *= taper
        const core = step(half * 0.52 + 12 * (streak - 0.5), half * 0.18, ac) * taper
        soot = Math.max(soot, core * (0.86 + 0.14 * fine))
        const depth = core * (0.45 + 0.55 * mid) + 0.22 * soot * fine
        const ridge = 1 - Math.abs(2 * noise(x / 15, y / 15 + 9.2, seed + 14) - 1)
        const patch = step(0.4, 0.6, noise(s / 95 + k.id * 3.7, 3.3, seed + 15))
        const blob = noise(x / 15 + 50, y / 15, seed + 16)
        const ember = Math.max(step(0.86, 0.98, ridge) * 0.55, step(0.6, 0.8, blob)) * patch * step(half * 0.56, half * 0.26, ac) * taper
        const at = (j * W + i) * 4
        const open = holeAt(l, x, y, seed)
        if (open) {
          const lit = holeAt(l, x, y - wall, seed)
          data[at] = 0
          data[at + 1] = 0
          data[at + 2] = 0
          data[at + 3] = lit ? 255 : 52
          continue
        }
        if (data[at + 3]! > 100) continue
        data[at] = Math.max(data[at]!, Math.round(255 * Math.min(1, soot)))
        data[at + 1] = Math.max(data[at + 1]!, Math.round(255 * Math.min(1, depth)))
        data[at + 2] = Math.max(data[at + 2]!, Math.round(255 * Math.min(1, ember)))
      }
    }
  }
}
