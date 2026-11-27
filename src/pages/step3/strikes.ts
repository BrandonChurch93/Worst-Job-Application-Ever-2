import type { Shape } from '../../stage/types'
import { BALL, floorZ, tierAt, APRON_Y, TIER_Y } from '../../table/layout'
import type { TableEvent } from '../../table/physics'

// A strike on the table: what was hit, how hard (1 soft, 2 hard, 3 in the frenzy) and what bursts out of it (0 sparks alone, 1 coins, 2 paper).
export interface Strike { id: string; hard: number; loot: number }

// `ring`: how many strikes the page keeps and draws at once. `seconds`: how long one is drawn. `each`: the numbers one strike takes in the ring (serial, second, x and y in balls, hard, loot). `gap`: the least seconds between two strikes on the same thing.
export const STRIKE = { ring: 14, seconds: 1.7, each: 6, gap: 0.05 }
// The camera's jolt for a strike by how hard it is, in the units of the page's shake, and how long a jolt lasts.
export const JOLT = { by: [0, 0, 0.5, 2.2], most: 2.6, decay: 0.07, hz: 27, last: 0.4 }
// The frenzy: from and to, in seconds of the scene; the speed of every throw in balls a second; the round of places the ball is sent to, one after each strike, in balls from the middle and down the tier (the low cup, a slingshot, an upper cup, the other slingshot and so on); `slow`: the share of that speed under which the ball has come off a dead wall and is thrown again; `gap`: the least seconds between two such throws; `cone`: the least share of a throw that must leave a face.
export const FRENZY = { from: 17.5, to: 19.8, speed: 36, round: [[0, 5.1], [-3.0, 6.25], [1.1, 3.2], [3.0, 6.25], [-1.1, 3.2], [3.0, 6.25], [0, 5.1], [-3.0, 6.25], [-1.1, 3.2], [3.0, 6.25], [1.1, 3.2], [-3.0, 6.25]], low: [0, 5.1], slow: 0.8, gap: 0.06, cone: 0.1 }

// The second frenzy, on the street: a loop of three, a slingshot, the other slingshot, the top wall, and from `turn` on the same loop mirrored. `sling` and `top` are the places, in balls from the middle and down the tier; `band` is how far under the top wall the ball counts as up there; `up` is the speed upward from which it counts as on its way up. From `last` on the right slingshot throws the ball at the bank's targets (`bank`), and the frenzy ends when one of them falls, or at `to`.
export const RIOT = { from: 24.95, to: 27.6, turn: 26.2, last: 27.1, speed: 36, sling: [3.3, 6.5], top: [2.5, 0.3], bank: [-5.3, 4.35], band: 2.2, up: 5, low: [0, 5.1], slow: 0.8, gap: 0.06, cone: 0.1 }

export function riotAim(x: number, y: number, vy: number, t: number): number[] {
  const m = t < RIOT.turn ? 1 : -1
  const far = [m * RIOT.sling[0]!, RIOT.sling[1]!]
  const near = [-m * RIOT.sling[0]!, RIOT.sling[1]!]
  const top = [-m * RIOT.top[0]!, RIOT.top[1]!]
  if (t >= RIOT.last) return x > 1.5 && y > RIOT.band * 2 ? RIOT.bank : [RIOT.sling[0]!, RIOT.sling[1]!]
  if (y < RIOT.band) return near
  if (vy < -RIOT.up) return top
  return x * m < 0 ? far : top
}

const HARD: Record<string, [number, number]> = {
  bumper: [2, 1], sling: [1, 0], 'drop-target': [2, 1], standup: [1, 2], 'ball-hit': [2, 0], 'scoop-kick': [2, 0], 'doors-slam': [2, 0], spinner: [1, 1], 'mom-save': [2, 0], 'ball-save': [1, 0], plunger: [2, 0], rebound: [3, 0]
}
const PAPER = ['office.cubicles', 'corporate.boardroom', 'corporate.note', 'office.inbox']

export function strikeOf(e: TableEvent, frenzy: boolean): Strike | null {
  const h = HARD[e.name]
  if (!h) return null
  const paper = PAPER.some((p) => e.id.startsWith(p))
  const steel = e.ball > 0
  const loot = steel || e.name === 'rebound' ? 0 : paper ? 2 : frenzy ? 1 : e.name === 'scoop-kick' && e.id === 'street.firehouse' ? 1 : h[1]
  return { id: e.id, hard: steel ? 1 : frenzy && (e.name === 'bumper' || e.name === 'sling') ? 3 : h[0], loot }
}

export function noted(ring: number[] | undefined, t: number, e: TableEvent, k: Strike): number[] {
  const was = ring ?? []
  const serial = was.length > 0 ? was[was.length - STRIKE.each]! + 1 : 1
  const kept = was.slice(Math.max(0, was.length - (STRIKE.ring - 1) * STRIKE.each))
  return [...kept, serial, t, e.x, e.y, k.hard, k.loot]
}

export function strikeShapes(ring: number[] | undefined, t: number): Shape[] {
  const out: Shape[] = []
  if (!ring) return out
  for (let i = 0; i + STRIKE.each <= ring.length; i += STRIKE.each) {
    const age = t - ring[i + 1]!
    if (age < 0 || age > STRIKE.seconds) continue
    const y = Math.max(TIER_Y[0]!, Math.min(APRON_Y - 0.01, ring[i + 3]!))
    const z = floorZ(tierAt(y)) * BALL
    out.push({ id: `fx.${ring[i]!}`, part: 'table-lights', kind: 'box', x: ring[i + 2]! * BALL, y: y * BALL, w: 0, h: 0, z0: z, z1: z, tone: 'light', v: [age, ring[i + 4]!, ring[i + 5]!, ring[i]!] })
  }
  return out
}

export function strikeJolt(ring: number[] | undefined, t: number): { x: number; y: number } {
  let x = 0
  let y = 0
  if (!ring) return { x, y }
  for (let i = 0; i + STRIKE.each <= ring.length; i += STRIKE.each) {
    const age = t - ring[i + 1]!
    if (age < 0 || age > JOLT.last) continue
    const e = JOLT.by[ring[i + 4]!]! * Math.exp(-age / JOLT.decay)
    const turn = 6.283185307179586 * JOLT.hz * age + ring[i]! * 2.4
    x += e * Math.sin(turn)
    y += e * Math.cos(turn * 0.83)
  }
  const size = Math.hypot(x, y)
  const k = size > JOLT.most ? JOLT.most / size : 1
  return { x: x * k, y: y * k }
}
