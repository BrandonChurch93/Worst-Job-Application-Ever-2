import { config } from '../../../config'
import type { Shape } from '../../../stage/types'
import { SLOT } from '../layout'

const heights = config.scale.heights

// The cassette that comes up through the slot, in page pixels round the slot's centre. y runs down the page, z up.
// It is no wider than the slot, so it can pass through it; its chute swings out and reaches south once it is up.
export const CASSETTE = {
  top: heights.machineMinTop + 2,
  half: SLOT.w / 2 - 2,
  deep: SLOT.h / 2 - 1.4,
  cheek: 14,
  wall: 1.6,
  roller: { r: 6.6, root: 5.2, hub: 3.3, north: -5.9, south: 5.9, z: heights.machineMinTop + 2 - 7.4, pitch: 8, disc: 4.2, teeth: 7 },
  chute: { z: heights.machineMinTop + 1, len: 28, more: 15, thick: 1.3, slope: 0.2, turn: 0.6 },
  floor: 13,
  sink: heights.machineMinTop + 16
}

export const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

// How far the slot has opened, from the mechanism's shape: the number the page hands over, or the width it has grown to.
export function openOf(jaw: Shape | undefined): number {
  if (!jaw) return 0
  if (jaw.v && jaw.v.length > 0) return Math.min(1, Math.max(0, jaw.v[0]!))
  return Math.min(1, Math.max(0, (jaw.w - 28) / SLOT.w))
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
export function hoodUnder(south: number): number {
  const a = CASSETTE.chute.slope
  const y = HOOD.cy * Math.cos(a) - HOOD.cz * Math.sin(a)
  const z = CASSETTE.chute.z + HOOD.cy * Math.sin(a) + HOOD.cz * Math.cos(a)
  const end = -y + HOOD.r * Math.sin(HOOD.to + HOOD.more + a)
  if (south > end) return Infinity
  const r = HOOD.r - CASSETTE.chute.thick * 2 - 1.2
  const d = -south - y
  return z + Math.sqrt(Math.max(0, r * r - d * d))
}

// The crest of the north roller: where a sheet that is fed leaves the air and wraps the steel.
export const crest = (rise: number): { x: number; y: number; z: number } => ({
  x: SLOT.cx,
  y: SLOT.cy + CASSETTE.roller.north,
  z: (CASSETTE.roller.z + CASSETTE.roller.r + 0.7) * rise
})
