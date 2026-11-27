import type { RealContext } from '../../../real/types'
import { table } from '../../layout'
import { anchorId } from '../../draw'
import type { Zone } from '../zone'
import { BUMPER } from './colours'
import { groupsOf } from './groups'
import { keyOf } from './key'
import { risen } from './over'

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
// A window the score has lit stands at this share, so a ball that rolls over it still raises it.
export const INSERT_LIT = 0.72

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
    if (keyOf(d.zone)) d.into.add(`${d.zone}.key`)
  })
}

// How a lamp answers a ball. A window in the floor rises as a ball rolls onto it and stands full when the ball is over its middle; a globe rests below full and flares when a ball strikes its post; the firehouse holds its red below full with a ball in the bay and throws it full on the frame of the catch and of the kick; the scoop of the letter tray flashes the Office on the same two frames.
export const ANSWER = { reach: 0.55, globeRest: 0.62, globeReach: 1.1, heldRed: 0.6, catchSeconds: 0.3, kickSeconds: 1.2, scoopSeconds: 0.25, scoopFlash: 0.8 }

// How near the nearest ball is to a round thing, 1 when they touch (or, with `deep`, when the ball lies that many balls inside), 0 when the gap between them is `reach` balls or more.
export function near(ctx: RealContext, id: string, reach: number, deep = 0): number {
  const s = ctx.byId.get(id)
  if (!s) return 0
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  let best = 0
  for (const [name, b] of ctx.byId) {
    if (!name.startsWith('ball.')) continue
    if (Math.abs(b.z0 - s.z0) > 0.6 * b.w) continue
    const gap = (Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy) - s.w / 2 - b.w / 2) / b.w
    const t = deep > 0 ? Math.max(0, Math.min(1, -gap / deep)) * 0.5 + Math.max(0, Math.min(1, 1 - gap / reach)) * 0.5 : Math.max(0, Math.min(1, 1 - gap / reach))
    best = Math.max(best, t * t * (3 - 2 * t))
  }
  return best
}

// How far a window answers the nearest ball: where the ball is, times how far the window's own count has come up since the middle of the ball came over its glass. The stage writes that count as the second value of the window; a draw list that carries none answers by place alone.
export function answer(ctx: RealContext, id: string): number {
  const v = ctx.byId.get(id)?.v
  const k = v !== undefined && v.length > 1 ? v[1]! : 1
  return k <= 0 ? 0 : risen(k) * near(ctx, id, ANSWER.reach, 0.8)
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
  const scoop = z.id === 'office' ? Math.min(first(ctx, 'model.office.inbox', 1, 9), first(ctx, 'model.office.inbox', 2, 9)) : 9
  const flash = Math.max(first(ctx, id, 2, 0), general * ANSWER.scoopFlash * Math.max(0, 1 - scoop / ANSWER.scoopSeconds))
  const inserts = table.inserts.filter((n) => n.tier === z.tier)
  const bumpers = table.bumpers.filter((b) => b.tier === z.tier)
  const out: number[] = []
  const byName: Record<string, number> = {}
  for (const g of groups) {
    let level = general
    if (g.name === 'flash') level = flash
    else if (g.name === 'red') {
      const full = first(ctx, id, 3, 0)
      const held = first(ctx, 'model.street.firehouse', 0, 0) > 0
      const caught = Math.max(0, 1 - first(ctx, 'model.street.firehouse', 1, 9) / ANSWER.catchSeconds)
      const kicked = Math.max(0, 1 - first(ctx, 'model.street.firehouse', 2, 9) / ANSWER.kickSeconds)
      const idle = general * 0.35
      if (held) level = full * (ANSWER.heldRed + (1 - ANSWER.heldRed) * caught * caught)
      else if (kicked > 0) level = Math.max(Math.min(full, idle), idle + (full - idle) * kicked * kicked)
      else level = full
    }
    else if (g.name === 'blue') level = first(ctx, id, 4, 0)
    else if (g.name.startsWith('insert.')) {
      const n = inserts[Number(g.name.slice(7)) - 1]
      level = n ? Math.max(first(ctx, `insert.${n.id}`, 0, 0) * INSERT_LIT, INSERT_REST * general, general * answer(ctx, `insert.${n.id}`)) : 0
    } else if (g.name.startsWith('globe.')) {
      level = general * (ANSWER.globeRest + (1 - ANSWER.globeRest) * near(ctx, `post.corporate.${g.name}`, ANSWER.globeReach))
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
