// What the finishing blast leaves on the ground: a scorched trench that starts narrow in front of the arrow and widens along the beam, a burn wider than the trench where the boss lay and the button now lies, and beyond it a band that narrows on downrange to the edge of the page. After references/approved-002/finish-button-left.png. It scorches; it breaks no slab through. Pure, no three.js.
import type { BossView } from '../boss/view'
import { FALLEN } from '../boss/plan'
import { fbm, noise } from './breaks'
import { clamp01, rnd } from './change'
import { KEEP as LAST } from './clear'
import { ARENA, PAGE, PANES, PILLARS, SEAMS, paneBox } from './layout'

// ahead: px in front of the arrow's centre at which the trench starts. thin: the half width of the trench there. half: its half width where it runs into the burn. burn: the radius of the burn. long: how many times longer the burn is along the line than across it.
// far: the half width of the band downrange where it leaves the page. net: the size of a plate of the cracked crust, px. words: the box, from the middle of the burn, that the fight keeps clear for the words over the button; no chip lands in it.
// seconds: how long the blast burns when the view does not say (the fight's SHOUT.gone - SHOUT.fire). chips: the bits of ceramic thrown out, at the high level.
// furrow: the bed the blast ploughs along its line and the lip of crust it throws up on either side. lip: how far from the middle of the line the top of a lip lies, px, and what the half width there adds to it. crown: the half width of a lip, px, and what the half width there adds to it.
// crumb: the size of one crumb of a lip, px. gone: the share of the crumbs that are missing. ash: how much paler than the black the face of a crumb is. wander: how far a lip strays from its line, px. shelf: how deep the ground has sunk at the foot of a lip, of 1. deep: how deep the bed is.
// slope: px outside a lip over which the ground comes back up. pale: how much of its soot the bed has lost. web: the size of a plate of the bed between its glowing cracks, px. hair: the half width of such a crack, px. glow: px from the middle line at which the cracks have lost most of their glow, and what the half width there adds to it.
// core: px from the middle of the burn between which the furrow dies away. relief: how strongly the ground's shader bends its light by all this.
export const SCORCH = { ahead: 70, thin: 13, half: 62, burn: 140, long: 1.7, far: 14, net: 17, seconds: 2.13, chips: 120, smoke: 40, words: { x0: -120, x1: 120, y0: -310, y1: -250 }, furrow: { lip: [8, 0.5], crown: [3, 0.1], crumb: 4.5, gone: 0.3, ash: 0.34, wander: 11, shelf: 0.55, deep: 1, slope: 22, pale: 0.16, web: 14, hair: 0.7, glow: [3, 0.13], core: [84, 124], relief: 0.6 } }

// The line of the finishing blast as the view gives it: the arrow's centre and the place the boss fell.
export interface BlastLine { x0: number; y0: number; x1: number; y1: number }

// The same line made ready: where the trench starts and where it leaves the page, the direction, the lengths.
// (sx, sy) the start of the trench; (ex, ey) where the beam's line leaves the page; (bx, by) the middle of the burn; `at` px from the start to the middle of the burn; `long` px from the start to (ex, ey); `end` px from the start to where the last soot lies, which is `long`.
export interface Scorch { sx: number; sy: number; ex: number; ey: number; bx: number; by: number; ux: number; uy: number; long: number; at: number; end: number; tag: number }

const step = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function scorchFrom(l: BlastLine): Scorch {
  const d = Math.hypot(l.x1 - l.x0, l.y1 - l.y0) || 1
  const ux = (l.x1 - l.x0) / d, uy = (l.y1 - l.y0) / d
  const sx = l.x0 + ux * SCORCH.ahead, sy = l.y0 + uy * SCORCH.ahead
  // The beam's own line runs on to the edge of the page, and a little past it.
  let far = Infinity
  if (ux > 1e-6) far = Math.min(far, (PAGE.w - sx) / ux)
  if (ux < -1e-6) far = Math.min(far, -sx / ux)
  if (uy > 1e-6) far = Math.min(far, (PAGE.h - sy) / uy)
  if (uy < -1e-6) far = Math.min(far, -sy / uy)
  const at = Math.max(0, d - SCORCH.ahead)
  const long = Math.max(at + SCORCH.burn, far + 40)
  const tag = (Math.round(l.x0) * 7 + Math.round(l.y0) * 13 + Math.round(l.x1) * 17 + Math.round(l.y1) * 19) & 0xffff
  return { sx, sy, ex: sx + ux * long, ey: sy + uy * long, bx: l.x1, by: l.y1, ux, uy, long, at, end: long, tag }
}

export const lineKeyOf = (l: BlastLine): string => `${l.x0.toFixed(1)},${l.y0.toFixed(1)},${l.x1.toFixed(1)},${l.y1.toFixed(1)}`

type Kept = BossView & { scorch?: BlastLine | null }

// The scorch a view shows: its line and how far it is burnt in, 0 to 1. Null while there is none.
// `last` is the line of the blast as it was last seen, for a view that no longer carries it.
export function scorchOf(view: BossView, last: BlastLine | null = null): { line: BlastLine; share: number } | null {
  const kept = (view as Kept).scorch ?? null
  const f = view.finish ?? null
  const gone = view.boss.gone
  if (f) return { line: kept ?? { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 }, share: clamp01(gone !== undefined && gone > 0 ? gone : (view.time - f.firedAt) / SCORCH.seconds) }
  if (kept) return { line: kept, share: clamp01(gone ?? 1) }
  if (gone !== undefined && gone > 0) return { line: last ?? { x0: view.arrow.x, y0: view.arrow.y, x1: FALLEN.x, y1: FALLEN.y }, share: clamp01(gone) }
  return null
}

// The line the blast will take while the arrow charges it: known before it is fired, so that the ground can be painted out of sight.
export function aimOf(view: BossView): BlastLine | null {
  if (view.finish) return null
  if ((view.arrow.charge ?? 0) <= 0 && (view.arrow.arms ?? 0) <= 0) return null
  return { x0: view.arrow.x, y0: view.arrow.y, x1: FALLEN.x, y1: FALLEN.y }
}

// How far outside the black a place lies, in px: below 0 inside the trench, the burn or the band downrange, above 0 outside them. `inner` is how deep the black is there.
// `pxB` is the same for the burn alone and `pxL` for the trench and the band downrange alone; `off` the distance from the wandering middle of the trench or band, `wide` its half width there, `t` how far along the trench (0 at its start, 1 at the burn), `ba` and `bc` the place along and across the line from the middle of the burn.
export interface Edge { px: number; inner: number; along: number; across: number; r: number; pxB: number; pxL: number; off: number; wide: number; t: number; ba: number; bc: number }

export function edgeAt(s: Scorch, x: number, y: number, seed: number): Edge {
  const rx = x - s.sx, ry = y - s.sy
  const along = rx * s.ux + ry * s.uy, across = -rx * s.uy + ry * s.ux
  const t = clamp01(along / Math.max(1, s.at))
  const ba = along - s.at
  // How far downrange of the burn, 0 at its middle and 1 where the line leaves the page.
  const d = clamp01(ba / Math.max(1, s.long - s.at))
  // The middle wanders: no straight line anywhere.
  const off = across - 30 * Math.sqrt(t) * (noise(along / 150 + s.tag * 1.3, 3.1, seed + 41) - 0.5) - 14 * t * (noise(along / 52 + 8.2, 6.7, seed + 40) - 0.5)
  // Narrow at the hands, wider with every step along the beam up to the burn, and narrowing again from the burn to the edge of the page.
  const wide = ba <= 0 ? SCORCH.thin + (SCORCH.half - SCORCH.thin) * t ** 0.7 : SCORCH.far + (SCORCH.half - SCORCH.far) * (1 - d) ** 1.3
  const big = fbm(x / 62, y / 62, seed + 42), mid = fbm(x / 17, y / 17, seed + 43)
  // Its edge is broken at the size of a hand and of a finger, more so where it is wide.
  const rag = 0.3 + 0.7 * (wide / SCORCH.half)
  const pxL = Math.hypot(Math.min(0, along), off) - wide + rag * (46 * (big - 0.5) + 40 * (mid - 0.5))
  // The burn: wider than the trench, longer along the beam than across it, its rim eaten in and out.
  const bc = across
  const r = Math.hypot(ba / SCORCH.long, bc)
  const edgeB = SCORCH.burn * (0.86 + 0.5 * (fbm(x / 78 + 9.1, y / 78, seed + 44) - 0.5)) + 34 * (mid - 0.5)
  const pxB = r - edgeB
  // The two run into each other without a corner.
  const k = 52
  const h = clamp01(0.5 + (0.5 * (pxB - pxL)) / k)
  const px = pxB + (pxL - pxB) * h - k * h * (1 - h)
  return { px, inner: pxB < pxL ? edgeB : Math.max(6, wide), along, across, r, pxB, pxL, off, wide, t, ba, bc }
}

// The crust of the black is cracked into plates: how near a place is to the nearest crack between two plates, px, and a number from 0 to 1 that is the plate's own.
export function crust(x: number, y: number, seed: number): { crack: number; plate: number } {
  const size = SCORCH.net
  const cx = Math.floor(x / size), cy = Math.floor(y / size)
  let d1 = 1e9, d2 = 1e9, own = 0
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j
      const tag = (gx * 73856093) ^ (gy * 19349663)
      const d = Math.hypot(x - (gx + 0.15 + 0.7 * rnd(seed, 470, tag)) * size, y - (gy + 0.15 + 0.7 * rnd(seed, 471, tag)) * size)
      if (d < d1) { d2 = d1; d1 = d; own = rnd(seed, 472, tag) } else if (d < d2) d2 = d
    }
  }
  return { crack: (d2 - d1) / 2, plate: own }
}

// The part of the picture the scorch can reach: columns i0 to i1, rows j0 to j1.
export function scorchReach(s: Scorch, W: number, H: number): { i0: number; i1: number; j0: number; j1: number } {
  const fx = PAGE.w / W, fy = PAGE.h / H
  const pad = SCORCH.half + REACH, round = SCORCH.burn * SCORCH.long + REACH
  const tx = s.sx + s.ux * s.end, ty = s.sy + s.uy * s.end
  const x0 = Math.min(s.sx - pad, tx - pad, s.bx - round), x1 = Math.max(s.sx + pad, tx + pad, s.bx + round)
  const y0 = Math.min(s.sy - pad, ty - pad, s.by - round), y1 = Math.max(s.sy + pad, ty + pad, s.by + round)
  return {
    i0: Math.max(0, Math.floor(x0 / fx)), i1: Math.min(W - 1, Math.ceil(x1 / fx)),
    j0: Math.max(0, Math.floor((PAGE.h - y1) / fy)), j1: Math.min(H - 1, Math.ceil((PAGE.h - y0) / fy))
  }
}

// How far outside the black the last soot and the last speck lie, px.
const REACH = 120

// Rows `from` up to `to` of the scorch, written into `data` (W by H texels over the page, RGBA, row 0 at the bottom of the page):
// red the soot, green how deep the surface is burnt away, blue the embers, alpha when the place burns: 1/255 at once, 255 as the blast ends. 0 where the ground is clean.
// The work can be done a few rows at a time before the blast, and gives the same picture as done at once.
export function paintScorch(data: Uint8Array, W: number, H: number, s: Scorch, seed: number, from: number, to: number): void {
  const fx = PAGE.w / W, fy = PAGE.h / H
  const { i0, i1 } = scorchReach(s, W, H)
  for (let j = from; j < to; j++) {
    const y = PAGE.h - (j + 0.5) * fy
    data.fill(0, (j * W + i0) * 4, (j * W + i1 + 1) * 4)
    for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * fx
      const e = edgeAt(s, x, y, seed)
      if (e.px > REACH) continue
      const fine = fbm(x / 5, y / 5, seed + 45)
      const mid = fbm(x / 24, y / 24, seed + 46)
      const blot = fbm(x / 10, y / 10, seed + 47)
      // Soft and broken: the black gives way to brown soot over the width of a hand, and blots are eaten out of its rim.
      // Where the trench is narrow its edge is tighter, so that it reads from the hands on.
      const soft = e.pxB < e.px + 40 ? 1 : 0.35 + 0.65 * Math.min(1, e.wide / 45)
      const px = e.px + 22 * soft * (blot - 0.5)
      let soot = step(30 * soft, -26 * soft, px)
      // Darkest in the middle.
      soot *= 0.92 + 0.08 * step(0, -Math.max(6, e.inner * 0.45), e.px)
      soot *= 1 - 0.6 * soft * step(-30, 6, e.px) * step(0.54, 0.4, blot)
      // Soot round it and beyond it, fading to the clean ground: a hand's width at the hands, wide round the burn.
      const out = 46 + 64 * (e.pxB < e.px + 40 ? 1 : e.wide / SCORCH.half)
      const haze = 0.62 * step(out, -14, e.px) ** 1.4 * (0.3 + 0.7 * mid) * (0.7 + 0.3 * blot)
      soot = Math.max(soot, haze)
      // Specks thrown wide of it.
      if (e.px < out * 0.8 && e.px > -10 && mid > 0.5) {
        const speck = fbm(x / 4.2, y / 4.2, seed + 48)
        if (speck > 0.71) soot = Math.max(soot, 0.8 * step(out * 0.8, 10, e.px) * step(0.71, 0.79, speck))
      }
      // The crust is cracked into a fine net of plates, inside the black only: the cracks black and cut in, each plate a little paler than the next.
      let depth = 0.028 * step(0, -30, e.px) * mid
      let split = 0
      if (e.px < -4) {
        const c = crust(x + 16 * (fbm(x / 28, y / 28, seed + 49) - 0.5), y + 16 * (fbm(x / 28 + 5.3, y / 28, seed + 49) - 0.5), seed)
        const within = step(-4, -18, e.px)
        // Hairlines, and not every one of them: a crack shows where the crust is brittle.
        const line = step(1.0, 0.35, c.crack) * within * step(0.3, 0.5, fbm(x / 34 + 2.2, y / 34 + 8.1, seed + 54) + 0.25 * c.plate)
        soot = Math.max(soot * (1 - within * 0.05 * c.plate), line)
        depth = Math.max(depth, 0.044 * line)
        split = step(0.7, 0.2, c.crack) * within
      }
      // The furrow: the blast ploughs a bed along its line and throws the crust up into a lip on either side. The lips wander and die away under the middle of the burn.
      const F = SCORCH.furrow
      const open = step(F.core[0]!, F.core[1]!, Math.hypot(e.ba, e.bc))
      const q = Math.hypot(Math.min(0, e.along), e.off) + F.wander * (mid - 0.5 + 0.6 * (blot - 0.5))
      const top = F.lip[0]! + F.lip[1]! * e.wide
      const crown = F.crown[0]! + F.crown[1]! * e.wide
      // A lip is a heap of separate crumbs: each a mound with its own height and a groove round its foot, and some are missing.
      const kc = SCORCH.net / F.crumb
      const heap = crust((x + 5 * (blot - 0.5)) * kc, (y + 5 * (fine - 0.5)) * kc, seed + 7)
      const mound = heap.plate < F.gone ? 0 : step(0, F.crumb * 0.3, heap.crack / kc) * (0.5 + 0.5 * heap.plate)
      const ridge = open * (0.45 + 0.55 * step(0.36, 0.54, fbm(x / 9 + 3.3, y / 9, seed + 55))) * Math.exp(-(((q - top) / crown) ** 2))
      const lip = Math.min(1, 1.5 * ridge) * mound
      const bed = open * step(top - crown * 0.6, top - crown * 2, q)
      const sunk = open * F.shelf * step(top + crown + F.slope, top + crown, q) * (1 - lip)
      depth = Math.min(1, depth + sunk + (F.deep * (0.85 + 0.15 * mid) - sunk) * bed)
      soot = Math.max(soot * (1 - F.pale * bed * (0.6 + 0.4 * blot)), 0.96 * Math.min(1, 1.5 * ridge) * (1 - mound)) * (1 - F.ash * lip)
      // Embers: at the rim of the burn, down the middle of the trench, and a few strays in the black. Small and orange: coals in soot, not the light of a broken slab.
      let ember = 0
      if (e.px < 4) {
        const rim = Math.exp(-(((e.pxB + 20) / 16) ** 2))
        // The cracks of the crust glow near the two edges of the trench, from the hands to the burn, and on along the band downrange: short straight pieces, no line of their own.
        const edges = e.pxB > 6 ? Math.exp(-(((e.pxL + 8) / 5) ** 2)) * split * step(0.02, 0.1, e.t) : 0
        const patch = step(0.36, 0.6, noise(x / 64 + s.tag * 3.7, y / 64 + 5.5, seed + 50))
        const where = Math.max(rim * (0.3 + 0.7 * patch), 0.12 * step(-10, -40, e.px) * patch)
        const blob = fbm(x / 6 + 50, y / 6, seed + 51)
        ember = 0.62 * step(0.57, 0.68, blob) * (0.3 + 0.7 * step(0.4, 0.6, fine)) * where
        ember = Math.max(ember, 0.6 * edges * step(0.46, 0.6, blob) * (0.55 + 0.45 * step(0.35, 0.6, fine)))
        // The bed is cracked into a net of its own, and its cracks glow: brightest along the middle line, fading toward the lips, and not every one of them.
        const kw = SCORCH.net / F.web
        const net = crust((x + 14 * (mid - 0.5)) * kw + 31.7, (y + 14 * (blot - 0.5)) * kw, seed + 9)
        const hair = step(F.hair, F.hair * 0.3, net.crack / kw)
        const near = Math.exp(-((q / (F.glow[0]! + F.glow[1]! * e.wide)) ** 2))
        const lit = step(0.49, 0.63, fbm(x / 13 + 7.7, y / 13, seed + 56) + 0.22 * near)
        ember = Math.max(ember, bed * hair * (0.06 + 0.94 * near) * lit * step(0.02, 0.1, e.t + Math.max(0, e.ba)))
        // And the cracks of the crust glow in places near the rim.
        ember = Math.max(ember, 0.66 * split * step(0.42, 0.58, blot) * Math.max(rim, 0.12 * patch) * step(2, -14, e.px))
      }
      if (soot < 0.012 && ember < 0.012) continue
      // When it burns: the front runs out along the line in the first part of the blast, and the black spreads from the middle to the rim for the rest of it.
      const when = 0.2 * clamp01(e.along / s.end) + 0.6 * clamp01((e.px + e.inner) / (e.inner + 100)) + 0.12 * fine
      const at = (j * W + i) * 4
      data[at] = Math.round(255 * Math.min(1, soot))
      data[at + 1] = Math.round(255 * Math.min(1, depth))
      data[at + 2] = Math.round(255 * Math.min(1, ember))
      data[at + 3] = Math.max(1, Math.min(255, Math.round(255 * when)))
    }
  }
}

// How much of a place's scorch shows at a share of the blast: the same law the ground's shader uses.
export function shownAt(when: number, share: number): number {
  return share <= 0 ? 0 : step(when - 0.06, when + 0.06, share * 1.12)
}

const KEEP = [
  ...PILLARS.map((p) => ({ x0: p.x - ARENA.pillar.foot / 2, y0: p.y - ARENA.pillar.foot / 2, x1: p.x + ARENA.pillar.foot / 2, y1: p.y + ARENA.pillar.foot / 2 })),
  ...PANES.map((p) => paneBox(p)),
  { x0: ARENA.slot.x - ARENA.slot.w / 2, y0: ARENA.slot.y - ARENA.slot.h / 2, x1: ARENA.slot.x + ARENA.slot.w / 2, y1: ARENA.slot.y + ARENA.slot.h / 2 }
]

function free(x: number, y: number): boolean {
  if (x < 6 || y < 6 || x > PAGE.w - 6 || y > PAGE.h - 6) return false
  for (const k of KEEP) if (x > k.x0 - 14 && x < k.x1 + 14 && y > k.y0 - 14 && y < k.y1 + 14) return false
  for (const seam of SEAMS) {
    const p = seam.points
    for (let i = 0; i < p.length - 1; i++) {
      const ax = p[i]!.x, ay = p[i]!.y, ex = p[i + 1]!.x - ax, ey = p[i + 1]!.y - ay
      const u = clamp01(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1))
      if (Math.hypot(x - ax - ex * u, y - ay - ey * u) < ARENA.seamHalf + ARENA.chamfer + 9) return false
    }
  }
  return true
}

export interface Chip { x: number; y: number; fx: number; fy: number; size: number; turn: number; when: number }

// The bits of ceramic the blast throws out of the trench: where each comes to lie, where it flew from, and when in the blast it goes. Never on a seam, a foot or the socket.
export function chipsOf(s: Scorch, seed: number, count = SCORCH.chips): Chip[] {
  const out: Chip[] = []
  for (let n = 0; n < count; n++) {
    for (let tryNo = 0; tryNo < 5; tryNo++) {
      const k = n * 8 + tryNo
      const round = rnd(seed, 440 + s.tag, k) < 0.42
      let x: number, y: number, fx: number, fy: number, when: number
      const out2 = rnd(seed, 441 + s.tag, k)
      if (round) {
        const a = rnd(seed, 442 + s.tag, k) * Math.PI * 2
        const r = SCORCH.burn * (1.15 + 1.5 * out2 * out2)
        x = s.bx + Math.cos(a) * r * (1 + (SCORCH.long - 1) * Math.abs(Math.cos(a)))
        y = s.by + Math.sin(a) * r
        fx = s.bx + Math.cos(a) * SCORCH.burn * 0.5
        fy = s.by + Math.sin(a) * SCORCH.burn * 0.5
        when = 0.2 * clamp01(s.at / s.end) + 0.1
      } else {
        const along = (s.at + SCORCH.burn * 0.4) * rnd(seed, 443 + s.tag, k)
        const side = rnd(seed, 444 + s.tag, k) < 0.5 ? -1 : 1
        const across = side * (SCORCH.thin + (SCORCH.half - SCORCH.thin) * clamp01(along / Math.max(1, s.at)) + 26 + 170 * out2 * out2)
        const drift = 60 * (rnd(seed, 445 + s.tag, k) - 0.3)
        x = s.sx + s.ux * (along + drift) - s.uy * across
        y = s.sy + s.uy * (along + drift) + s.ux * across
        fx = s.sx + s.ux * along
        fy = s.sy + s.uy * along
        when = 0.2 * clamp01(along / s.end) + 0.04
      }
      if (!free(x, y)) continue
      if (x - s.bx > SCORCH.words.x0 - 12 && x - s.bx < SCORCH.words.x1 + 12 && y - s.by > SCORCH.words.y0 - 12 && y - s.by < SCORCH.words.y1 + 12) continue
      // Nor onto the place the arrow stands or kneels.
      if (Math.hypot(x - LAST.stand.x, y - LAST.stand.y) < 64 || Math.hypot(x - LAST.kneel.x, y - LAST.kneel.y) < 64) continue
      if (edgeAt(s, x, y, seed).px < 6) continue
      const big = rnd(seed, 446 + s.tag, k)
      out.push({ x, y, fx, fy, size: 3.5 + 9 * big * big * big + 3 * big, turn: rnd(seed, 447 + s.tag, k) * Math.PI, when })
      break
    }
  }
  return out
}

// A cold beam over the arena, for as long as it burns: its line in page px and how strong its light is, 0 to 1.
// The ground answers it with cold light that falls off from the line, and every pillar and pane that stands throws a long sharp shadow away from it.
export interface BeamLight { x0: number; y0: number; x1: number; y1: number; strength: number }

// The beam the view shows when nobody drives it: the finishing blast from in front of the arrow to where it leaves the page, up in a twentieth of a second and down over the last fifth of the blast.
export function beamOf(view: BossView): BeamLight | null {
  const f = view.finish
  if (!f) return null
  const s = scorchFrom(f)
  const share = scorchOf(view)?.share ?? 0
  const up = clamp01((view.time - f.firedAt) / 0.05)
  const strength = up * (1 - step(0.8, 1, share)) * (0.6 + 0.4 * clamp01(f.power))
  return strength > 0 ? { x0: s.sx, y0: s.sy, x1: s.ex, y1: s.ey, strength } : null
}

export interface BeamShadow { x: number[]; y: number[]; dark: number; glass: boolean }

// The shadow a standing thing throws away from the beam, as a four-cornered patch on the ground: the two corners at the thing first, then the two far ones. Null for a thing the beam runs through.
export function beamShadow(b: BeamLight, ends: [{ x: number; y: number }, { x: number; y: number }], high: number, glass: boolean): BeamShadow | null {
  const ex = b.x1 - b.x0, ey = b.y1 - b.y0, l2 = ex * ex + ey * ey || 1
  const away = (p: { x: number; y: number }): { dx: number; dy: number; d: number; side: number } => {
    const u = clamp01(((p.x - b.x0) * ex + (p.y - b.y0) * ey) / l2)
    const dx = p.x - b.x0 - ex * u, dy = p.y - b.y0 - ey * u
    const d = Math.hypot(dx, dy)
    return { dx: dx / (d || 1), dy: dy / (d || 1), d, side: Math.sign(-(p.x - b.x0) * ey + (p.y - b.y0) * ex) }
  }
  const a0 = away(ends[0]), a1 = away(ends[1])
  if (a0.d < 34 || a1.d < 34 || a0.side !== a1.side) return null
  // The beam lies low: what stands higher than it throws its shadow far.
  const long = Math.min(1300, high * 5.2)
  return {
    x: [ends[0].x, ends[1].x, ends[1].x + a1.dx * long, ends[0].x + a0.dx * long],
    y: [ends[0].y, ends[1].y, ends[1].y + a1.dy * long, ends[0].y + a0.dy * long],
    dark: (glass ? 0.32 : 0.64) * clamp01(b.strength), glass
  }
}
