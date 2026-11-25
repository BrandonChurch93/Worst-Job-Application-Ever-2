import { config } from '../../../config'
import type { Shape } from '../../../stage/types'
import { SLOT } from '../layout'

const heights = config.scale.heights

// The cassette that comes up through the slot. It is built in its own units, drawn for an opening 300 wide, and set into the page at the slot's width (K page pixels to a unit), standing so that its top is machineMinTop + 2 above the page.
// It is narrower than the slot by GAP on every side, so the dark of the opening shows round it; its chute swings out and reaches south once it is up.
export const GAP = { side: 1.4, deep: 1.2 }
export const K = (SLOT.w - GAP.side * 2) / 296
export const TOP = heights.machineMinTop + 2
export const RAISE = TOP * (1 - K)
export const TRAVEL = TOP + 4
export const WELL = 44
export const CASSETTE = {
  top: TOP,
  half: (SLOT.w / 2 - GAP.side) / K,
  deep: (SLOT.h / 2 - GAP.deep) / K,
  cheek: 14,
  wall: 1.6,
  roller: { r: 6.6, root: 5.2, hub: 3.3, north: -5.9, south: 5.9, z: TOP - 7.4, pitch: 8, disc: 4.2, teeth: 7 },
  chute: { z: TOP - 1, len: 28, more: 15, thick: 1.3, slope: 0.2, turn: 0.6 },
  floor: 13,
  sink: (RAISE + WELL - 4) / K
}
// The same in page pixels, for what meets the cassette on the page: the sheet, the strips.
export const UNIT = { half: CASSETTE.half * K, deep: CASSETTE.deep * K, r: CASSETTE.roller.r * K }

export const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

// How far the slot has opened, from the mechanism's shape: the number the page hands over, or the width it has grown to.
export function openOf(jaw: Shape | undefined): number {
  if (!jaw) return 0
  if (jaw.v && jaw.v.length > 0) return Math.min(1, Math.max(0, jaw.v[0]!))
  return Math.min(1, Math.max(0, jaw.w / SLOT.w))
}

// The panels part first, then the cassette comes up through the opening and stops hard.
export const panelsOf = (open: number): number => smooth(open / 0.55)
export function riseOf(open: number): number {
  const u = Math.min(1, Math.max(0, (open - 0.45) / 0.55))
  const over = 1 + 0.06 * Math.sin(Math.PI * Math.min(1, u / 0.85)) * (u < 0.85 ? 1 : 0)
  return u >= 1 ? 1 : (1 - Math.pow(1 - Math.min(1, u / 0.85), 3)) * over
}

// The chute hangs down the south wall while the cassette travels, swings out when it is up, then reaches.
export const chuteOf = (open: number): number => smooth((open - 0.86) / 0.14)
export const chuteAngle = (c: number): number => Math.PI / 2 + (CASSETTE.chute.slope - Math.PI / 2) * smooth(c / 0.7)
export const chuteReach = (c: number): number => CASSETTE.chute.more * smooth((c - 0.5) / 0.5)

// The hood is a piece of a rolled sheet: an arc whose chord runs from the hinge. Its second piece slides out round the same circle.
// In the hood's own frame: y toward the hinge's north, z out of the hood's face.
export const HOOD = (() => {
  const c = CASSETTE.chute
  const r = c.len / c.turn
  return { r, cy: -r * Math.sin(c.turn / 2), cz: -r * Math.cos(c.turn / 2), from: -c.turn / 2, to: c.turn / 2, more: c.more / r }
})()

// The hood's underside over a point south of the cassette's south wall when it is out, in pixels above the page.
function hoodUnits(south: number): number {
  const a = CASSETTE.chute.slope
  const y = HOOD.cy * Math.cos(a) - HOOD.cz * Math.sin(a)
  const z = CASSETTE.chute.z + HOOD.cy * Math.sin(a) + HOOD.cz * Math.cos(a)
  const end = -y + HOOD.r * Math.sin(HOOD.to + HOOD.more + a)
  if (south > end) return Infinity
  const r = HOOD.r - CASSETTE.chute.thick * 2 - 1.2
  const d = -south - y
  return z + Math.sqrt(Math.max(0, r * r - d * d))
}

export const hoodUnder = (south: number): number => RAISE + K * hoodUnits(south / K)

// The crest of the north roller: where a sheet that is fed leaves the air and wraps the steel.
export const crest = (rise: number): { x: number; y: number; z: number } => ({
  x: SLOT.cx,
  y: SLOT.cy + CASSETTE.roller.north * K,
  z: (RAISE + (CASSETTE.roller.z + CASSETTE.roller.r + 0.7) * K) * rise
})
