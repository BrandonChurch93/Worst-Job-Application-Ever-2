import type { RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { zoneAt } from '../../draw'
import { colours, groupsOf, levels } from '../lights'
import { local, zone as zoneNamed, type Zone } from '../zone'

export const LAMPS = 8
export type RGB = [number, number, number]

// One lamp as the ball sees it: where it stands from the foot of the ball (x right, y up the page, z up), and how bright it shows.
export interface Seen { x: number; y: number; z: number; colour: RGB; amount: number; shine: number; window: boolean }

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
        for (let c = 0; c < 3; c++) floor[c]! += g.colour[c]! * f
        const window = g.name.startsWith('insert.')
        all.push({ x, y, z: zz, colour: g.colour, amount: e, shine: window ? 0.9 * level : Math.min(26, 14 * level * Math.max(0.6, src.power / 0.3)), window })
      }
    }
  }
  all.sort((p, q) => q.amount - p.amount || p.x - q.x || p.y - q.y)
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
