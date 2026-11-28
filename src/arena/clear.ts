// The ground the arena keeps clear for the arrow's last stand: the stand, the line from it to the button, and the kneel spot. Ruled by the Builder: no loose piece of the arena lies within `KEEP.clear` px of them.
// Here is where every loose piece comes to rest: the toppled column of a pillar, its rubble, the shards of a pane. Pure, no three.js; wreck.ts draws from these.
import type { ViewBreak } from '../boss/view'
import { FALLEN } from '../boss/plan'
import { lineOf } from './breaks'
import { rnd } from './change'
import { ARENA, PAGE, PANES, PILLARS } from './layout'

// stand: where the arrow stands for the charge and the blast (the fight's LAST.stand). kneel: where it kneels after. button: where the button is left. clear: px kept free round them and round the line from the stand to the button.
export const KEEP = { stand: { x: 440, y: 650 }, kneel: { x: 816, y: 650 }, button: { x: FALLEN.x, y: FALLEN.y }, clear: 140 }
export const RUBBLE_EACH = 11
export const SHARDS_EACH = 22
// How long the toppled part of a pillar is, and how far from its foot it lies when nothing is in the way.
export const LYING = { long: ARENA.pillar.high * 0.78, off: 34 }

// The nearest place of the kept ground to (x, y), and how far it is.
export function nearKeep(x: number, y: number): { d: number; qx: number; qy: number } {
  const a = KEEP.stand, b = KEEP.button
  const vx = b.x - a.x, vy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)))
  let qx = a.x + vx * t, qy = a.y + vy * t
  let d = Math.hypot(x - qx, y - qy)
  const dk = Math.hypot(x - KEEP.kneel.x, y - KEEP.kneel.y)
  if (dk < d) { d = dk; qx = KEEP.kneel.x; qy = KEEP.kneel.y }
  return { d, qx, qy }
}

// A piece of radius r that would rest at (x, y), moved straight out of the kept ground if it lies in it. `flip` says which way one that lies right on the line goes.
export function pushClear(x: number, y: number, r: number, flip: boolean): { x: number; y: number } {
  const n = nearKeep(x, y)
  const need = KEEP.clear + r
  if (n.d >= need) return { x, y }
  if (n.d < 1e-3) return { x, y: y + (flip ? -need : need) }
  return { x: n.qx + ((x - n.qx) / n.d) * need, y: n.qy + ((y - n.qy) / n.d) * need }
}

// The side of the blast's line a solid at (x, y) is thrown to: a unit vector across the line, in page px.
function awayOf(x: number, y: number, k: ViewBreak, seed: number): { ax: number; ay: number; ux: number; uy: number } {
  const l = lineOf(k, seed)
  const side = -(x - k.x0) * l.uy + (y - k.y0) * l.ux >= 0 ? 1 : -1
  return { ax: -l.uy * side, ay: l.ux * side, ux: l.ux, uy: l.uy }
}

// How the toppled part of pillar i lies after blast k: from `off` px from the foot, `LYING.long` px on in the direction (dx, dy), page px.
// It falls away from the blast's line; if it would then lie in the kept ground or off the page, it falls the nearest other way, and if its foot is too near, the piece is thrown clear to the far side.
export function columnLie(seed: number, i: number, k: ViewBreak): { dx: number; dy: number; off: number } {
  const p = PILLARS[i]!
  const w = awayOf(p.x, p.y, k, seed)
  const lean = 0.55 * (rnd(seed, 905, i) - 0.3)
  const first = Math.atan2(w.ay + lean * w.uy, w.ax + lean * w.ux)
  const half = ARENA.pillar.side / 2
  const free = (dx: number, dy: number, off: number): boolean => {
    for (let s = off; s <= off + LYING.long + 0.01; s += LYING.long / 16) {
      const x = p.x + dx * s, y = p.y + dy * s
      if (x < half || x > PAGE.w - half || y < half || y > PAGE.h - half) return false
      if (nearKeep(x, y).d < KEEP.clear + half) return false
    }
    return true
  }
  for (const off of [LYING.off, 80, 130, 180, 230]) {
    for (let n = 0; n <= 16; n++) {
      for (const sign of n === 0 || n === 16 ? [1] : [1, -1]) {
        const a = first + (sign * n * Math.PI) / 16
        if (free(Math.cos(a), Math.sin(a), off)) return { dx: Math.cos(a), dy: Math.sin(a), off }
      }
    }
  }
  return { dx: Math.cos(first), dy: Math.sin(first), off: LYING.off }
}

// Where lump j of pillar i's rubble comes to rest after blast k, and its size.
export function rubbleRest(seed: number, i: number, j: number, k: ViewBreak): { x: number; y: number; size: number } {
  const p = PILLARS[i]!
  const w = awayOf(p.x, p.y, k, seed)
  const a = Math.atan2(w.ay, w.ax) - (rnd(seed, 910 + i, j) - 0.5) * 2.6
  const far = 34 + 120 * rnd(seed, 920 + i, j) ** 1.5
  const size = 14 + 38 * rnd(seed, 930 + i, j) ** 1.7
  const at = pushClear(p.x + Math.cos(a) * far, p.y + Math.sin(a) * far, size / 2, rnd(seed, 936 + i, j) < 0.5)
  return { x: at.x, y: at.y, size }
}

// Where shard j of pane i comes to rest after blast k: `along` is the place on the pane it broke from, `near` how near that is to where the blast went through.
export function shardRest(seed: number, i: number, j: number, k: ViewBreak, at: number): { x: number; y: number; along: number; size: number } {
  const p = PANES[i]!
  const l = lineOf(k, seed)
  const push = l.ux >= 0 ? 1 : -1
  const along = p.y0 + (p.y1 - p.y0) * rnd(seed, 960 + i, j)
  const near = 1 - Math.min(1, Math.abs(along - at) / 260)
  // Most fall the way the blast went, some the other way.
  const dir = rnd(seed, 961 + i, j) < 0.7 ? push : -push
  const far = (24 + 170 * rnd(seed, 962 + i, j) ** 1.3) * (0.5 + 0.7 * near) * dir
  const size = 26 + 66 * rnd(seed, 963 + i, j) ** 1.8
  const rest = pushClear(p.x + far, along + (rnd(seed, 968 + i, j) - 0.5) * 60, size / 2, rnd(seed, 977 + i, j) < 0.5)
  return { x: rest.x, y: rest.y, along, size }
}
