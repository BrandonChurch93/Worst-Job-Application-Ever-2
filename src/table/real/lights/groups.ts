import { BALL, COLS, MARQUEE_H, MARQUEE_Y, TIERS, table, type Insert, type Model } from '../../layout'
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
export const LAMP = { z: 26, body: 20, reach: 3.4 * BALL, power: 0.62, wideZ: 120, wideReach: 8 * BALL, widePower: 0.22 }

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
  const both = (list: typeof lamps): Source[] => [...list.map((l) => lampAt(l, false)), ...list.map((l) => lampAt(l, true))]
  const inserts = table.inserts.filter((n) => n.tier === k)
  const insert = (n: Insert, i: number): void => add(`insert.${i + 1}`, 1, linear(insertColour(n)), [at(n.c[0], n.c[1], 14, 0.9, 3.3)], true)
  const d = table.displays[k]!
  const display = (): void => add('display', 0, C.DISPLAY_AMBER, [0.2, 0.5, 0.8].map((f) => at(d.box[0] + d.box[2] * f, d.box[1] + d.box[3] * 0.4, 40, 0.5, 3.6)))
  if (z.id === 'corporate') {
    add('general', 2, C.CORPORATE_COLD_WHITE, both(rail))
    add('lanes', 2, C.CORPORATE_GOLD, both(lane))
    inserts.forEach(insert)
    for (const p of table.posts) if (p.tier === k && p.lamp) add(p.id.slice(p.id.indexOf('.') + 1), 1, C.CORPORATE_GLOBE, [at(p.c[0], p.c[1], 46, 1.5, 5.2, `post.${p.id}`)], true)
    const hq = model('corporate.hq')
    const beach = model('corporate.beach')
    const front = hq.box[1] + hq.box[3] + 0.12
    add('windows', 0, C.CORPORATE_WINDOW, [
      at(hq.box[0] + 0.5, front, 150, 0.5, 5, hq.id), at(hq.box[0] + hq.box[2] - 0.5, front, 150, 0.5, 5, hq.id), at(centre(hq)[0], front + 0.1, 46, 1.3, 4.2, hq.id),
      at(hq.box[0] - 0.15, centre(hq)[1], 170, 0.4, 4.5, hq.id), at(hq.box[0] + hq.box[2] + 0.15, centre(hq)[1], 170, 0.4, 4.5, hq.id),
      at(centre(beach)[0], centre(beach)[1], 150, 0.9, 4.4, beach.id), at(beach.box[0] - 0.1, centre(beach)[1], 60, 0.5, 3, beach.id), at(centre(beach)[0], beach.box[1] + beach.box[3] + 0.1, 60, 0.5, 3, beach.id)
    ])
    display()
    add('flash', 0, C.CORPORATE_FLASH, [])
  } else if (z.id === 'office') {
    add('general', 2, C.OFFICE_FLUORESCENT, both(lamps))
    inserts.forEach(insert)
    table.bumpers.filter((b) => b.tier === k).forEach((b, i) => add(`bumper.${i + 1}`, 1, C.OFFICE_BUMPER, [at(b.c[0], b.c[1], 58, 1.1, 4.2, `bumper.${b.id}`)], true))
    const coffee = model('office.coffee')
    add('windows', 0, C.OFFICE_COFFEE, [at(centre(coffee)[0], coffee.box[1] + coffee.box[3] + 0.12, 90, 0.9, 3.6, coffee.id), at(coffee.box[0] - 0.12, centre(coffee)[1], 90, 0.7, 3.2, coffee.id)])
    display()
    add('flash', 0, C.OFFICE_FLASH, [])
  } else {
    add('general', 2, C.STREET_DUSK, both(rail))
    add('lanes', 2, C.STREET_SODIUM, both(lane))
    inserts.forEach(insert)
    const fire = model('street.firehouse')
    const police = model('street.police')
    const beacon = (m: Model): Source => at(centre(m)[0], m.box[1] + m.box[3] * 0.3, m.h * BALL + 24, 2.4, 7.5, m.id)
    add('red', 1, C.STREET_RED, [beacon(fire)], true)
    add('blue', 1, C.STREET_BLUE, [beacon(police)], true)
    const windows: Source[] = []
    for (const m of [fire, police]) {
      const y = m.box[1] + m.box[3] + 0.12
      windows.push(at(m.box[0] + 0.6, y, 70, 0.55, 3.4, m.id), at(m.box[0] + m.box[2] - 0.6, y, 70, 0.55, 3.4, m.id))
    }
    const bank = model('street.bank')
    windows.push(at(bank.box[0] + bank.box[2] + 0.35, centre(bank)[1], 50, 0.7, 3, bank.id), at(centre(bank)[0], bank.box[1] + bank.box[3] + 0.12, 50, 0.45, 2.6, bank.id))
    for (const m of table.models) if (m.tier === k && (m.part === 'model-houses' || m.part === 'model-moms')) windows.push(at(centre(m)[0], m.box[1] + m.box[3] + 0.1, 22, 0.22, 1.8, m.id))
    const garage = model('street.garage')
    windows.push(at(centre(garage)[0], centre(garage)[1], 40, 0.6, 3.2, garage.id))
    add('windows', 0, C.STREET_WINDOW, windows)
    display()
    add('flash', 0, C.STREET_FLASH, [])
  }
  return out
}

const made = new Map<string, Group[]>()

// The light groups of a zone, in the order of their channels. A zone without lamps has none.
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
