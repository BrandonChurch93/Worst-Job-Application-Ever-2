import { config } from '../../../config'
import type { Shape } from '../../../stage/types'
import { SLOT } from '../layout'

const heights = config.scale.heights

// The cassette that stands over the slot, in page pixels round the slot's centre. y runs down the page.
export const CASSETTE = {
  top: heights.machineMinTop + 2,
  roller: { r: 10, north: -9, south: 9, z: heights.machineMinTop + 2 - 10, pitch: 6, disc: 2.6, hub: 6.2, teeth: 7 },
  lip: { y0: -25, y1: -15, top: 7 },
  hood: { y0: 21, y1: 44 },
  block: { w: 14, y0: -25, y1: 44 },
  half: SLOT.w / 2,
  sink: 46
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

// The crest of the north roller: where a sheet that is fed leaves the air and wraps the steel.
export const crest = (rise: number): { x: number; y: number; z: number } => ({
  x: SLOT.cx,
  y: SLOT.cy + CASSETTE.roller.north,
  z: (CASSETTE.roller.z + CASSETTE.roller.r + 0.7) * rise
})
