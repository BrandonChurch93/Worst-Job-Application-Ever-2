// What the finishing blast leaves on the ground: a scorched trench from in front of the arrow to the edge of the page, widening into a round black burn where the boss lay. It scorches; it breaks no slab through. Pure, no three.js.
import type { BossView } from '../boss/view'
import { FALLEN } from '../boss/plan'
import { fbm, noise } from './breaks'
import { clamp01, rnd } from './change'
import { ARENA, PAGE, PANES, PILLARS, SEAMS, paneBox } from './layout'

// ahead: px in front of the arrow's centre at which the trench starts. half: the half width of the black of the trench. burn: the radius of the burn across the line. long: how many times longer the burn is along the line.
// seconds: how long the blast burns when the view does not say (the fight's SHOUT.gone - SHOUT.fire). chips: the bits of ceramic thrown out, at the high level.
export const SCORCH = { ahead: 70, half: 36, burn: 108, long: 2.1, seconds: 2.13, chips: 120, smoke: 40 }

// The line of the finishing blast as the view gives it: the arrow's centre and the place the boss fell.
export interface BlastLine { x0: number; y0: number; x1: number; y1: number }

// The same line made ready: where the trench starts and where it leaves the page, the direction, the lengths.
export interface Scorch { sx: number; sy: number; ex: number; ey: number; bx: number; by: number; ux: number; uy: number; long: number; at: number; tag: number }

const step = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function scorchFrom(l: BlastLine): Scorch {
  const d = Math.hypot(l.x1 - l.x0, l.y1 - l.y0) || 1
  const ux = (l.x1 - l.x0) / d, uy = (l.y1 - l.y0) / d
  const sx = l.x0 + ux * SCORCH.ahead, sy = l.y0 + uy * SCORCH.ahead
  // On to the edge of the page, and a little past it so that the trench runs off the picture.
  let far = Infinity
  if (ux > 1e-6) far = Math.min(far, (PAGE.w - sx) / ux)
  if (ux < -1e-6) far = Math.min(far, -sx / ux)
  if (uy > 1e-6) far = Math.min(far, (PAGE.h - sy) / uy)
  if (uy < -1e-6) far = Math.min(far, -sy / uy)
  const at = Math.max(0, d - SCORCH.ahead)
  const long = Math.max(at + SCORCH.burn, far + 40)
  const tag = (Math.round(l.x0) * 7 + Math.round(l.y0) * 13 + Math.round(l.x1) * 17 + Math.round(l.y1) * 19) & 0xffff
  return { sx, sy, ex: sx + ux * long, ey: sy + uy * long, bx: l.x1, by: l.y1, ux, uy, long, at, tag }
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

// How far outside the black a place lies, in px: below 0 inside the trench or the burn, above 0 outside them. `inner` is how deep the black is there.
export function edgeAt(s: Scorch, x: number, y: number, seed: number): { px: number; inner: number; along: number; across: number; r: number } {
  const rx = x - s.sx, ry = y - s.sy
  const along = rx * s.ux + ry * s.uy, across = -rx * s.uy + ry * s.ux
  const mid = fbm(x / 26, y / 26, seed + 43)
  const taper = step(-34, 60, along) * step(s.long + 10, s.long - 20, along)
  const edgeT = SCORCH.half * taper * (0.74 + 0.52 * noise(along / 95 + s.tag * 1.3, 3.1, seed + 41)) + 12 * (mid - 0.5) * taper
  const pxT = taper <= 0 ? 999 : Math.abs(across) - edgeT
  // The burn is drawn out along the beam, and its rim is ragged.
  const bx = x - s.bx, by = y - s.by
  const ba = bx * s.ux + by * s.uy, bc = -bx * s.uy + by * s.ux
  const r = Math.hypot(ba / SCORCH.long, bc)
  const edgeB = SCORCH.burn * (0.84 + 0.32 * fbm(x / 70 + 9.1, y / 70, seed + 42)) + 14 * (mid - 0.5)
  const pxB = r - edgeB
  // The two run into each other without a corner.
  const k = 60
  const h = clamp01(0.5 + (0.5 * (pxB - pxT)) / k)
  const px = pxB + (pxT - pxB) * h - k * h * (1 - h)
  return { px, inner: pxB < pxT ? edgeB : Math.max(1, edgeT), along, across, r }
}

// The part of the picture the scorch can reach: columns i0 to i1, rows j0 to j1.
export function scorchReach(s: Scorch, W: number, H: number): { i0: number; i1: number; j0: number; j1: number } {
  const fx = PAGE.w / W, fy = PAGE.h / H
  const pad = SCORCH.half * 1.3 + 130, round = SCORCH.burn * SCORCH.long * 1.2 + 170
  const x0 = Math.min(s.sx - pad, s.ex - pad, s.bx - round), x1 = Math.max(s.sx + pad, s.ex + pad, s.bx + round)
  const y0 = Math.min(s.sy - pad, s.ey - pad, s.by - round), y1 = Math.max(s.sy + pad, s.ey + pad, s.by + round)
  return {
    i0: Math.max(0, Math.floor(x0 / fx)), i1: Math.min(W - 1, Math.ceil(x1 / fx)),
    j0: Math.max(0, Math.floor((PAGE.h - y1) / fy)), j1: Math.min(H - 1, Math.ceil((PAGE.h - y0) / fy))
  }
}


// Rows `from` up to `to` of the scorch, written into `data` (W by H texels over the page, RGBA, row 0 at the bottom of the page):
// red the soot, green how deep the surface is burnt away, blue the embers, alpha when the place burns: 1/255 at once, 255 as the blast ends. 0 where the ground is clean.
// The work can be done a few rows at a time before the blast, and gives the same picture as done at once.
export function paintScorch(data: Uint8Array, W: number, H: number, s: Scorch, seed: number, from: number, to: number): void {
  const fx = PAGE.w / W, fy = PAGE.h / H
  const { i0, i1 } = scorchReach(s, W, H)
  const wide = SCORCH.half * 1.3 + 130, round = SCORCH.burn * SCORCH.long * 1.2 + 170
  for (let j = from; j < to; j++) {
    const y = PAGE.h - (j + 0.5) * fy
    data.fill(0, (j * W + i0) * 4, (j * W + i1 + 1) * 4)
    for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * fx
      const rx = x - s.sx, ry = y - s.sy
      const along0 = rx * s.ux + ry * s.uy, across0 = -rx * s.uy + ry * s.ux
      const far = Math.hypot(x - s.bx, y - s.by)
      if ((along0 < -40 || along0 > s.long + 12 || Math.abs(across0) > wide) && far > round) continue
      const e = edgeAt(s, x, y, seed)
      if (e.px > 150) continue
      const fine = fbm(x / 5, y / 5, seed + 44)
      const mid = fbm(x / 24, y / 24, seed + 45)
      // The rim is drawn out into streaks that run with the beam, ragged at the size of a hand, and soft: the black thins out into a brown grey haze.
      const streak = noise(e.along / 110 + 3.3, e.across / 7.5, seed + 46)
      const px = e.px + 20 * (fbm(x / 30, y / 30, seed + 52) - 0.5) + 34 * (streak - 0.5)
      let soot = Math.min(1, 1.1 * step(34, -34, px) ** 1.15 * (0.9 + 0.1 * fine))
      soot = Math.max(soot, 0.5 * step(104, -8, px) * (0.2 + 0.8 * mid) * (0.6 + 0.4 * streak))
      // Specks thrown wide of it.
      if (px < 120 && mid > 0.4) {
        const speck = fbm(x / 4.2, y / 4.2, seed + 47)
        if (speck > 0.69) soot = Math.max(soot, 0.9 * step(120, 14, px) * step(0.69, 0.77, speck))
      }
      // Hairline cracks along the trench, inside the black only.
      const fissure = step(0.91, 0.975, 1 - Math.abs(2 * noise(e.along / 52 + 7.7, e.across / 6, seed + 48) - 1)) * step(6, -18, e.px)
      soot = Math.max(soot, 0.92 * fissure)
      const core = step(0, -30, px)
      const depth = 0.16 * core * mid + 0.6 * fissure
      // Embers: short streaks down the middle of the trench, and a loose ring of them inside the rim of the burn.
      let ember = 0
      if (px < -6) {
        // Two loose rows of them down the line, right through the burn, and a few strays in the black beside the rows.
        const band = Math.max(Math.exp(-(((Math.abs(e.across) - SCORCH.half * 0.34) / (SCORCH.half * 0.3)) ** 2)), 0.3 * step(-10, -40, px))
        const patch = step(0.38, 0.6, noise(e.along / 85 + s.tag * 3.7, e.across / 85 + 5.5, seed + 50))
        const blob = fbm(e.along / 14 + 50, e.across / 5, seed + 51)
        // Small and orange: coals in soot, not the light of a broken slab.
        // Thickest and hottest in the trench between the arrow and the burn, where the beam stood longest.
        const trench = step(s.at - SCORCH.burn * 0.5, s.at - SCORCH.burn * 1.5, e.along)
        ember = (0.62 + 0.26 * trench) * step(0.6 - 0.1 * trench, 0.7 - 0.1 * trench, blob) * (0.35 + 0.65 * step(0.36, 0.56, fine)) * Math.max(patch, 0.8 * trench) * band
        // And veins of them: the cracks of the charred crust glow, drawn out a little along the beam.
        const vein = 1 - Math.abs(2 * fbm(e.along / 34 + 9.1, e.across / 17 + 2.3, seed + 53) - 1)
        const lit = step(0.3, 0.55, noise(e.along / 120 + 1.7, e.across / 70 + 8.8, seed + 54))
        const broken = step(0.42, 0.58, fbm(x / 9, y / 9, seed + 55))
        ember = Math.max(ember, 0.74 * step(0.95, 0.995, vein) * lit * broken * step(-4, -30, px) * (0.5 + 0.5 * fine))
      }
      if (soot < 0.012 && ember < 0.012) continue
      // When it burns: the front runs out along the line in the first part of the blast, and the black spreads from the middle to the rim for the rest of it.
      const when = 0.2 * clamp01(e.along / s.long) + 0.6 * clamp01((px + e.inner) / (e.inner + 100)) + 0.12 * fine
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
        when = 0.2 * clamp01(s.at / s.long) + 0.1
      } else {
        const along = s.long * rnd(seed, 443 + s.tag, k) * 0.96
        const side = rnd(seed, 444 + s.tag, k) < 0.5 ? -1 : 1
        const across = side * (SCORCH.half * 1.25 + 170 * out2 * out2)
        const drift = 60 * (rnd(seed, 445 + s.tag, k) - 0.3)
        x = s.sx + s.ux * (along + drift) - s.uy * across
        y = s.sy + s.uy * (along + drift) + s.ux * across
        fx = s.sx + s.ux * along
        fy = s.sy + s.uy * along
        when = 0.2 * clamp01(along / s.long) + 0.04
      }
      if (!free(x, y)) continue
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
