import type { RealContext } from '../../../real/types'
import { table } from '../../layout'
import { anchorId } from '../../draw'
import type { Zone } from '../zone'
import { BUMPER } from './colours'
import { groupsOf } from './groups'

export interface Levels {
  // The level of every group of the zone, 0 to 1, in the order of `groupsOf(zone)`.
  groups: number[]
  byName: Record<string, number>
  general: number
  website: number
  flash: number
}

// A window of a waking tier is never dead: its lamp stands at this share of the general lighting until the score lights it.
export const INSERT_REST = 0.3

let alone: string | null = null

// Shows one group alone: its level is 1 and every other group of every zone is 0. Null shows the frame as it is.
export const solo = (group: string | null): void => {
  alone = group
}
export const soloed = (): string | null => alone

// The proof sheet asks for one group alone from outside the page: an event `wjl-solo` whose detail is the group's name, or null.
if (typeof window !== 'undefined') {
  window.addEventListener('wjl-solo', (e) => solo((e as CustomEvent<string | null>).detail ?? null))
  window.addEventListener('wjl-groups', (e) => {
    const d = (e as CustomEvent<{ zone: string; into: Set<string> }>).detail
    for (const g of groupsOf(d.zone)) d.into.add(g.id)
  })
}

const first = (ctx: RealContext, id: string, i: number, otherwise: number): number => {
  const v = ctx.byId.get(id)?.v
  return v !== undefined && v.length > i ? v[i]! : otherwise
}

// The one place the levels of the light groups are read from the draw list.
export function levels(ctx: RealContext, z: Zone): Levels {
  const groups = groupsOf(z)
  const id = anchorId('table-lights', z.id)
  const general = first(ctx, id, 0, 0)
  const website = first(ctx, id, 1, 1)
  const flash = first(ctx, id, 2, 0)
  const inserts = table.inserts.filter((n) => n.tier === z.tier)
  const bumpers = table.bumpers.filter((b) => b.tier === z.tier)
  const out: number[] = []
  const byName: Record<string, number> = {}
  for (const g of groups) {
    let level = general
    if (g.name === 'flash') level = flash
    else if (g.name === 'red') level = first(ctx, id, 3, 0)
    else if (g.name === 'blue') level = first(ctx, id, 4, 0)
    else if (g.name.startsWith('insert.')) {
      const n = inserts[Number(g.name.slice(7)) - 1]
      level = n ? Math.max(first(ctx, `insert.${n.id}`, 0, 0), INSERT_REST * general) : 0
    } else if (g.name.startsWith('bumper.')) {
      const b = bumpers[Number(g.name.slice(7)) - 1]
      const since = b ? first(ctx, `bumper.${b.id}`, 0, 9) : 9
      const hit = Math.max(0, 1 - since / BUMPER.seconds)
      level = general * (BUMPER.rest + (1 - BUMPER.rest) * hit * hit)
    }
    if (alone !== null) level = alone === g.id ? 1 : 0
    level = Math.max(0, Math.min(1, level))
    out.push(level)
    byName[g.name] = level
  }
  return { groups: out, byName, general: alone !== null ? 0 : general, website, flash: alone !== null ? 0 : flash }
}
