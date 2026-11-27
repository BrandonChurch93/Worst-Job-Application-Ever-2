import type { RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { zoneAt } from '../../draw'
import { BALL, INSERTS } from '../../layout'
import { colours, groupsOf, levels } from '../lights'
import { OVER } from '../lights/over'
import { local, zone as zoneNamed, type Zone } from '../zone'

export const LAMPS = 8
export type RGB = [number, number, number]

// One lamp as the ball sees it: where it stands from the foot of the ball (x right, y up the page, z up), and how bright it shows.
// `rank` is the lamp's light on the ball before a window under the ball is held back: the order of the lamps goes by it.
export interface Seen { x: number; y: number; z: number; colour: RGB; amount: number; shine: number; window: boolean; rank?: number }

// How far the ball stands on a window's glass, by how far its middle is from the middle of the window in px: 1 from the middle of the ball over the rim of the glass inward, 0 from where the two rims part outward.
const GLASS = INSERTS.r * BALL
export const onGlass = (d: number): number => {
  const t = Math.max(0, Math.min(1, (GLASS + BALL / 2 - d) / (BALL / 2)))
  return t * t * (3 - 2 * t)
}

export interface Light {
  zone: Zone
  // True in a zone that is lit by the machine's own lamps.
  tier: boolean
  lamps: Seen[]
  // What falls on the floor under the ball, all lamps together.
  floor: RGB
  // The soft light from above: the website's own light on the page, the tier's general lighting in the machine.
  soft: RGB
  haze: RGB
  general: number
  website: number
  flash: number
  // The floor of the zone from the foot of the ball, zero or below.
  drop: number
}

// The law of fall off of the machine's lamps: 1 at 100 px for power 1, gone at the reach.
export const fall = (d: number, reach: number): number => {
  const q = Math.min(1, d / reach)
  const cut = 1 - q * q * q * q
  return (10000 / (d * d + 400)) * cut * cut
}

const FILL = colours.FILL

export const BOXES = 4

// The light of the zone's lamps on a place away from the ball, for the walls the ball shows bent in its own wall.
export function washAt(z: Zone, ctx: RealContext, x: number, y: number, height: number): RGB {
  const groups = groupsOf(z)
  const out: RGB = [0, 0, 0]
  if (groups.length === 0) return out
  const L = levels(ctx, z)
  for (const g of groups) {
    const level = L.groups[g.index]!
    if (level <= 0.01 || g.name.startsWith('insert.')) continue
    for (const src of g.sources) {
      const e = src.power * level * fall(Math.max(40, Math.hypot(src.x - x, src.y - y, src.z - height)), src.reach)
      for (let c = 0; c < 3; c++) out[c]! += g.colour[c]! * e
    }
  }
  const fill = FILL[z.id] ?? [0.6, 0.6, 0.62]
  const website = levels(ctx, zoneNamed('marquee')).website
  for (let c = 0; c < 3; c++) out[c] = Math.min(1.5, out[c]! * 0.8 + fill[c]! * (0.45 * L.general + 0.3 * L.flash) + 0.5 * website)
  return out
}

// Every lamp of the zone the ball is in, as the ball sees it, brightest first. Read only from the lights owner's groups and levels.
export function lightAt(s: Shape, ctx: RealContext): Light {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const z = zoneNamed(zoneAt(cy))
  const groups = groupsOf(z)
  const tier = groups.length > 0
  const L = tier ? levels(ctx, z) : null
  const website = levels(ctx, zoneNamed('marquee')).website
  const at = local(z, cx, cy, s.z0)
  const all: Seen[] = []
  const floor: RGB = [0, 0, 0]
  if (L) {
    for (const g of groups) {
      const level = L.groups[g.index]!
      if (level <= 0.01) continue
      if (g.sources.length === 0) {
        for (let c = 0; c < 3; c++) floor[c]! += g.colour[c]! * level * 0.45
        continue
      }
      for (const src of g.sources) {
        const x = src.x - at[0]
        const y = src.y - at[1]
        const zz = src.z - at[2]
        const d = Math.hypot(x, y, zz - s.w / 2)
        const e = src.power * level * fall(d, src.reach)
        if (e <= 0.002) continue
        const down = Math.hypot(x, y, src.z)
        const f = src.power * level * fall(down, src.reach) * (src.z / (down || 1))
        const window = g.name.startsWith('insert.')
        for (let c = 0; c < 3; c++) floor[c]! += g.colour[c]! * f * (window ? 0.3 : 1)
        const on = window ? onGlass(Math.hypot(x, y)) : 0
        all.push({ x, y, z: zz, colour: g.colour, amount: e * (1 - OVER.wall * on), shine: window ? 0.9 * level * (1 - OVER.show * on) : Math.min(26, 14 * level * Math.max(0.6, src.power / 0.3)), window, rank: e })
      }
    }
  }
  all.sort((p, q) => (q.rank ?? q.amount) - (p.rank ?? p.amount) || p.x - q.x || p.y - q.y)
  const fill = FILL[z.id] ?? [0.6, 0.6, 0.62]
  const general = L ? L.general : 0
  const flash = L ? L.flash : 0
  for (let c = 0; c < 3; c++) floor[c] = Math.min(1.6, floor[c]! * 0.3 + fill[c]! * (0.6 * general + 0.3 * flash) + 0.75 * website)
  const up = 0.5 * general + 0.6 * flash
  const page = 0.55 * website
  const soft: RGB = [page + fill[0]! * up, page + fill[1]! * up, page + fill[2]! * up]
  const dark = 0.012 + 0.05 * website
  const haze: RGB = [dark + fill[0]! * 0.02 * general, dark + fill[1]! * 0.02 * general, dark + fill[2]! * 0.02 * general]
  return { zone: z, tier, lamps: all.slice(0, LAMPS), floor, soft, haze, general, website, flash, drop: tier ? z.floor - s.z0 : 0 }
}
