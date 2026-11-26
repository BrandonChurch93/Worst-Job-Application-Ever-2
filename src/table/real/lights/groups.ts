import { BALL, COLS, MARQUEE_H, MARQUEE_Y, TIER_Y, TIERS, table, type Insert, type Model } from '../../layout'
import { insertColour } from '../art/inserts'
import { localBalls, zone as zoneNamed, zones, type Zone } from '../zone'
import * as C from './colours'
import type { RGB } from './colours'

// One lamp of a group, in its zone's frame, in page pixels. `power` 1 makes a white matte surface 100 px away send back the group's colour, and the light is gone at `reach`.
export interface Source {
  x: number
  y: number
  z: number
  power: number
  reach: number
  // The thing it stands in or on, which does not stand in its own light's way.
  on?: string
}

// 0: a field, lit from all round. 1: one lamp, at `at`. 2: many lamps that share the zone's picture of directions, `at[2]` high.
export type Mode = 0 | 1 | 2

export interface Group {
  // `<zone>.<group>`, as a mesh names it in `userData.lightGroup`.
  id: string
  name: string
  zone: string
  // Its channel in the zone's light pictures, 0 to 9.
  index: number
  mode: Mode
  colour: RGB
  sources: Source[]
  at: [number, number, number]
  // A lamp that is one thing may be a true light near the ball.
  single: boolean
}

export const LIT = ['marquee', 'corporate', 'office', 'street']
export const CHANNELS = 10
// How high a lamp of the general lighting is taken to stand over its lens, and how wide its body is, in pixels.
export const LAMP = { z: 44, body: 20, reach: 3.9 * BALL, power: 0.62, wideZ: 150, wideReach: 8 * BALL, widePower: 0.17 }

const linear = (c: { r: number; g: number; b: number }): RGB => [c.r, c.g, c.b]
const centre = (m: Model): [number, number] => [m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2]
const model = (id: string): Model => {
  const m = table.models.find((x) => x.id === id)
  if (!m) throw new Error(`No model called "${id}" in the layout`)
  return m
}

function build(z: Zone): Group[] {
  const out: Group[] = []
  const add = (name: string, mode: Mode, colour: RGB, sources: Source[], single = false): void => {
    if (out.length >= CHANNELS) throw new Error(`The zone "${z.id}" has more than ${CHANNELS} light groups`)
    const s0 = sources[0]
    out.push({ id: `${z.id}.${name}`, name, zone: z.id, index: out.length, mode, colour, sources, at: mode === 1 && s0 ? [s0.x, s0.y, s0.z] : [0, 0, mode === 2 ? LAMP.z : 0], single })
  }
  const at = (u: number, v: number, zPx: number, power: number, reachBalls: number, on?: string): Source => {
    const p = localBalls(z, u, v)
    return { x: p[0], y: p[1], z: zPx, power, reach: reachBalls * BALL, on }
  }
  if (z.id === 'marquee') {
    const y = MARQUEE_Y + MARQUEE_H * 0.5
    const panel: Source[] = []
    for (let i = 0; i < 6; i++) panel.push(at(COLS.left + 1.2 + (i * (COLS.right - COLS.left - 2.4)) / 5, y - 0.4, 300, 1.5, 9))
    add('panel', 0, C.MARQUEE_PANEL, panel)
    add('display', 0, C.DISPLAY_AMBER, [at(8.6, y + 1.1, 70, 0.7, 5), at(10, y + 1.1, 70, 0.7, 5), at(11.4, y + 1.1, 70, 0.7, 5)])
    return out
  }
  const k = z.tier
  const lamps = table.lamps.filter((l) => l.tier === k)
  const lampAt = (l: { c: [number, number] }, wide: boolean): Source => at(l.c[0], l.c[1], wide ? LAMP.wideZ : LAMP.z, wide ? LAMP.widePower : LAMP.power, (wide ? LAMP.wideReach : LAMP.reach) / BALL)
  const rail = lamps.filter((l) => l.arrow)
  const lane = lamps.filter((l) => !l.arrow)
  const both = (list: typeof lamps, gain = 1): Source[] => [...list.map((l) => lampAt(l, false)), ...list.map((l) => lampAt(l, true))].map((s) => ({ ...s, power: s.power * gain }))
  const inserts = table.inserts.filter((n) => n.tier === k)
  // Under each sling plastic stands a lamp that lights the floor round it and the flipper before it.
  const slings: Source[] = table.slings.filter((s) => s.tier === k).map((s) => at((s.a[0] + s.b[0] + s.c[0]) / 3, (s.a[1] + s.b[1] + s.c[1]) / 3, 30, 0.95, 2.4, `sling.${s.id}`))
  // A lamp over each bat, in the warm white of the tier's windows, so the flippers are the brightest things at the foot of a tier and keep their own colour.
  const bats: Source[] = table.flippers.filter((f) => f.tier === k).map((f) => at(f.pivot[0] + (f.side === 'left' ? 0.85 : -0.85), f.pivot[1] + 0.25, 64, 0.9, 3))
  const insert = (n: Insert, i: number): void => add(`insert.${i + 1}`, 1, linear(insertColour(n)), [at(n.c[0], n.c[1], 28, 1.1, 3.0)], true)
  const d = table.displays[k]!
  const display = (): void => add('display', 0, C.DISPLAY_AMBER, [0.2, 0.5, 0.8].map((f) => at(d.box[0] + d.box[2] * f, d.box[1] + d.box[3] * 0.4, 34, 0.22, 2.4)))
  if (z.id === 'corporate') {
    add('general', 2, C.CORPORATE_WHITE, both(rail, 1.45))
    add('lanes', 2, C.CORPORATE_GOLD, [...both(lane, 1.4), ...slings])
    inserts.forEach(insert)
    for (const p of table.posts) if (p.tier === k && p.lamp) add(p.id.slice(p.id.indexOf('.') + 1), 1, C.CORPORATE_GLOBE, [at(p.c[0], p.c[1], 46, 1.5, 5.2, `post.${p.id}`)], true)
    const hq = model('corporate.hq')
    const beach = model('corporate.beach')
    const front = hq.box[1] + hq.box[3] + 0.12
    add('windows', 0, C.CORPORATE_WINDOW, [
      at(hq.box[0] + 0.5, front, 150, 0.5, 5, hq.id), at(hq.box[0] + hq.box[2] - 0.5, front, 150, 0.5, 5, hq.id), at(centre(hq)[0], front + 0.1, 46, 0.85, 4.2, hq.id),
      at(hq.box[0] - 0.15, centre(hq)[1], 170, 0.4, 4.5, hq.id), at(hq.box[0] + hq.box[2] + 0.15, centre(hq)[1], 170, 0.4, 4.5, hq.id),
      at(centre(beach)[0], centre(beach)[1], 150, 0.9, 4.4, beach.id), at(beach.box[0] - 0.1, centre(beach)[1], 60, 0.5, 3, beach.id), at(centre(beach)[0], beach.box[1] + beach.box[3] + 0.1, 60, 0.5, 3, beach.id),
      ...bats
    ])
    display()
    add('flash', 0, C.CORPORATE_FLASH, [])
  } else if (z.id === 'office') {
    add('general', 2, C.OFFICE_FLUORESCENT, both(rail, 0.8))
    inserts.forEach(insert)
    table.bumpers.filter((b) => b.tier === k).forEach((b, i) => add(`bumper.${i + 1}`, 1, C.OFFICE_BUMPER, [at(b.c[0], b.c[1], 58, 1.1, 4.2, `bumper.${b.id}`)], true))
    const coffee = model('office.coffee')
    add('windows', 0, C.OFFICE_COFFEE, [...lane.map((l) => at(l.c[0], l.c[1], LAMP.z, LAMP.power * 0.8, LAMP.reach / BALL)), ...slings, ...bats, at(centre(coffee)[0], coffee.box[1] + coffee.box[3] + 0.12, 90, 0.9, 3.6, coffee.id), at(coffee.box[0] - 0.12, centre(coffee)[1], 90, 0.7, 3.2, coffee.id)])
    display()
    add('flash', 0, C.OFFICE_FLASH, [])
  } else {
    add('general', 2, C.STREET_DUSK, both(rail, 1.45))
    add('lanes', 2, C.STREET_SODIUM, [...both(lane, 1.4), ...slings])
    inserts.forEach(insert)
    const fire = model('street.firehouse')
    const police = model('street.police')
    const beacon = (m: Model): Source => at(centre(m)[0], m.box[1] + m.box[3] * 0.3, m.h * BALL + 24, 0.8, 5.2, m.id)
    // The lit bay of the firehouse throws its red on the floor before its mouth, with the beacon.
    add('red', 1, C.STREET_RED, [beacon(fire), at(centre(fire)[0] + 0.55, fire.box[1] + fire.box[3] + 0.45, 24, 1.7, 2.6, fire.id)], true)
    add('blue', 1, C.STREET_BLUE, [beacon(police)], true)
    const windows: Source[] = []
    for (const m of [fire, police]) {
      const y = m.box[1] + m.box[3] + 0.12
      windows.push(at(m.box[0] + 0.6, y, 70, 0.55, 3.4, m.id), at(m.box[0] + m.box[2] - 0.6, y, 70, 0.55, 3.4, m.id))
    }
    const bank = model('street.bank')
    windows.push(at(bank.box[0] + bank.box[2] + 0.35, centre(bank)[1], 70, 0.3, 3, bank.id), at(centre(bank)[0], bank.box[1] + bank.box[3] + 0.12, 70, 0.2, 2.6, bank.id))
    for (const m of table.models) if (m.tier === k && (m.part === 'model-houses' || m.part === 'model-moms')) windows.push(at(centre(m)[0], m.box[1] + m.box[3] + 0.1, 22, 0.22, 1.8, m.id))
    // The four street lamps of the shoulders stand where the owner of the street's models built them.
    for (const [u, v] of [[5.86, 9.06], [7.31, 10.59], [13.77, 9.0], [15.18, 10.15]] as [number, number][]) windows.push(at(u, TIER_Y[k]! + v, 60, 0.5, 2.5))
    const garage = model('street.garage')
    windows.push(at(centre(garage)[0], centre(garage)[1], 110, 0.9, 3.2, garage.id))
    windows.push(...bats)
    add('windows', 0, C.STREET_WINDOW, windows)
    display()
    add('flash', 0, C.STREET_FLASH, [])
  }
  return out
}

const made = new Map<string, Group[]>()

// The light groups of a zone, in the order of their channels. A zone without lamps has none.
// A lit opening at the foot of a model, and what it throws on the wet floor before it: where it stands, half its width and its height in pixels, its colour, and the group whose level it follows.
export interface Spill { x: number; y: number; half: number; high: number; colour: RGB; follows: string; power: number }

export function spillsOf(z: Zone): Spill[] {
  if (z.id !== 'corporate' && z.id !== 'street') return []
  const m = model(z.id === 'street' ? 'street.firehouse' : 'corporate.hq')
  const u = z.id === 'street' ? centre(m)[0] + 0.55 : centre(m)[0]
  const p = localBalls(z, u, m.box[1] + m.box[3] + 0.05)
  return z.id === 'street'
    ? [{ x: p[0], y: p[1], half: 0.5 * BALL, high: 0.6 * BALL, colour: C.STREET_RED, follows: 'red', power: 1 }]
    : [{ x: p[0], y: p[1], half: 0.75 * BALL, high: 1.0 * BALL, colour: C.CORPORATE_WINDOW, follows: 'windows', power: 0.6 }]
}

export function groupsOf(z: Zone | string): Group[] {
  const id = typeof z === 'string' ? z : z.id
  if (!LIT.includes(id)) return []
  let g = made.get(id)
  if (!g) {
    g = build(zoneNamed(id))
    made.set(id, g)
  }
  return g
}

export const allGroups = (): Group[] => zones.flatMap((z) => groupsOf(z))
export const tierName = (k: number): string => TIERS[k]!
