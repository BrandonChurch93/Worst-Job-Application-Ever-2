import { BALL, COLS, FLIP, MARQUEE_H, MARQUEE_Y, TIER_Y, TIERS, table, type Insert, type Model } from '../../layout'
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
  // A lamp throws as much as its window is large: the row over the top lane least, the launch lane's most.
  const place = (l: { id: string }): number => (l.id.includes('.top.') ? 0.8 : l.id.includes('.launch.') ? 1.2 : 1)
  const both = (list: typeof lamps, gain = 1): Source[] => [...list.map((l) => ({ ...lampAt(l, false), power: LAMP.power * place(l) })), ...list.map((l) => lampAt(l, true))].map((s) => ({ ...s, power: s.power * gain }))
  const inserts = table.inserts.filter((n) => n.tier === k)
  // Under each sling plastic stands a lamp that lights the floor round it and the flipper before it.
  const slings: Source[] = table.slings.filter((s) => s.tier === k).map((s) => at((s.a[0] + s.b[0] + s.c[0]) / 3, (s.a[1] + s.b[1] + s.c[1]) / 3, 30, 0.95, 2.4, `sling.${s.id}`))
  // A lamp high over the middle of each bat, in the warm white of the tier's windows, so a flipper is lit evenly from pivot to tip and keeps its own colour.
  const bats: Source[] = table.flippers.filter((f) => f.tier === k).map((f) => at(f.pivot[0] + (f.side === 'left' ? 1 : -1) * FLIP.length * 0.46, f.pivot[1] + FLIP.length * 0.2, 150, 2.1, 3.6))
  // The shoulders under the bats lie behind the guide walls, in the shadow of every lamp of the lanes: one lamp high over each, so the print runs on lit to the foot of the tier.
  const shoulders: Source[] = [5.3, 14.7].map((u) => at(u, TIER_Y[k]! + FLIP.pivotV + 1.35, 130, 1.15, 3))
  const insert = (n: Insert, i: number): void => add(`insert.${i + 1}`, 1, linear(insertColour(n)), [at(n.c[0], n.c[1], 28, 1.1, 3.0)], true)
  // The elbow at the head of the lift stands two balls from the nearest lamp of its column: one more lamp there, under the cross rail.
  const elbow: Source[] = k < 2 ? [at(COLS.lift, TIER_Y[k]! + 1.05, 70, 1.6, 2.6)] : []
  const d = table.displays[k]!
  const display = (): void => add('display', 0, C.DISPLAY_AMBER, [0.2, 0.5, 0.8].map((f) => at(d.box[0] + d.box[2] * f, d.box[1] + d.box[3] * 0.4, 34, 0.22, 2.4)))
  if (z.id === 'corporate') {
    add('general', 2, C.CORPORATE_WHITE, [...both(rail, 1.45), ...elbow])
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
      ...bats, ...shoulders
    ])
    display()
    add('flash', 0, C.CORPORATE_FLASH, [])
  } else if (z.id === 'office') {
    // The Office is a lit room: its lamps throw wide, so the floor between them is never dark.
    add('general', 2, C.OFFICE_FLUORESCENT, [...both(rail, 0.6).map((s) => (s.z > 100 ? { ...s, power: s.power * 1.5 } : s)), ...elbow])
    inserts.forEach(insert)
    table.bumpers.filter((b) => b.tier === k).forEach((b, i) => add(`bumper.${i + 1}`, 1, C.OFFICE_BUMPER, [at(b.c[0], b.c[1], 58, 1.1, 4.2, `bumper.${b.id}`)], true))
    const coffee = model('office.coffee')
    add('windows', 0, C.OFFICE_COFFEE, [...lane.map((l) => at(l.c[0], l.c[1], LAMP.z, LAMP.power * 0.8, LAMP.reach / BALL)), ...slings, ...bats, ...shoulders.map((s) => ({ ...s, power: s.power * 0.7 })), at(centre(coffee)[0], coffee.box[1] + coffee.box[3] + 0.12, 90, 0.9, 3.6, coffee.id), at(coffee.box[0] - 0.12, centre(coffee)[1], 90, 0.7, 3.2, coffee.id)])
    display()
    add('flash', 0, C.OFFICE_FLASH, [])
  } else {
    add('general', 2, C.STREET_DUSK, both(rail, 1.2))
    add('lanes', 2, C.STREET_SODIUM, [...both(lane, 1.4), ...slings])
    inserts.forEach(insert)
    const fire = model('street.firehouse')
    const police = model('street.police')
    const beacon = (m: Model): Source => at(centre(m)[0], m.box[1] + m.box[3] * 0.3, m.h * BALL + 24, 0.8, 2.6, m.id)
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
    windows.push(...bats, ...shoulders)
    add('windows', 0, C.STREET_WINDOW, windows)
    display()
    add('flash', 0, C.STREET_FLASH, [])
  }
  return out
}

const made = new Map<string, Group[]>()

// The light groups of a zone, in the order of their channels. A zone without lamps has none.
// A lit front at the foot of a model, and its image in the wet floor before it: where it stands, half its width and its height in pixels, its colour, and the group whose level it follows. A front with a row of windows is mirrored as a row of bars, `pitch` pixels apart.
export interface Spill { x: number; y: number; half: number; high: number; colour: RGB; follows: string; power: number; pitch: number; phase: number }

export const SPILLS = 4

export function spillsOf(z: Zone): Spill[] {
  const front = (id: string, off: number, half: number, high: number, colour: RGB, follows: string, power: number, pitch = 0, phase = 0): Spill => {
    const m = model(id)
    const p = localBalls(z, centre(m)[0] + off, m.box[1] + m.box[3] + 0.05)
    return { x: p[0], y: p[1], half: half * BALL, high: high * BALL, colour, follows, power, pitch: pitch * BALL, phase }
  }
  if (z.id === 'street') {
    return [
      front('street.firehouse', 0.55, 0.42, 1.5, C.STREET_RED, 'red', 1.6),
      front('street.firehouse', -0.62, 0.6, 1.1, C.STREET_WINDOW, 'windows', 0.55, 0.42),
      front('street.police', 0, 1.05, 1.1, C.STREET_WINDOW, 'windows', 0.55, 0.42),
      front('street.bank', 0, 0.42, 0.9, C.STREET_WINDOW, 'windows', 0.5, 0.21)
    ]
  }
  if (z.id === 'corporate') return [front('corporate.hq', 0, 0.55, 1.6, C.CORPORATE_WINDOW, 'windows', 0.9), front('corporate.hq', 0, 1.6, 1.3, C.CORPORATE_WINDOW, 'windows', 0.35, 0.28, 0.5)]
  if (z.id === 'office') return [front('office.coffee', 0, 1.0, 0.9, C.OFFICE_COFFEE, 'windows', 0.5, 0.5)]
  return []
}

// A lamp that stands high on a model, over the reach of the floor's pictures: it lights the walls and roofs near it straight from its own place.
export interface High { x: number; y: number; z: number; reach: number; colour: RGB; follows: string; power: number }

export const HIGHS = 7
export const HIGH_BODY = 60

export function highOf(z: Zone): High[] {
  const over = (id: string, colour: RGB, power: number, reachBalls: number, lift = 1.3): High => {
    const m = model(id)
    const p = localBalls(z, centre(m)[0], centre(m)[1])
    return { x: p[0], y: p[1], z: (m.h + lift) * BALL, reach: reachBalls * BALL, colour, follows: 'general', power }
  }
  // A hidden lamp over each low model that stands far from every lamp of its tier, so its top is lit from above as the approved tiers have it.
  if (z.id === 'office') return [over('office.inbox', C.OFFICE_BUMPER, 0.75, 2.6), over('office.cubicles', C.OFFICE_BUMPER, 0.9, 3.2, 1.6)]
  if (z.id === 'corporate') return [over('corporate.boardroom', C.CORPORATE_WHITE, 0.7, 2.6)]
  if (z.id !== 'street') return []
  // The fittings of the garage, by the rule of the owner of the street's models: arms half a ball outside its wall on the diagonals, three 22 px under the rim and the rest at four tenths of its height.
  const g = model('street.garage')
  const out = (g.box[2] / 2 + 0.5) * Math.SQRT1_2
  const x0 = g.box[0] + g.box[2] / 2 - out
  const x1 = g.box[0] + g.box[2] / 2 + out
  const y0 = g.box[1] + g.box[3] / 2 - out
  const y1 = g.box[1] + g.box[3] / 2 + out
  const base = g.base ?? 0
  const lamp = (u: number, v: number, zPx: number, power: number, reachBalls: number): High => {
    const p = localBalls(z, u, v)
    return { x: p[0], y: p[1], z: zPx, reach: reachBalls * BALL, colour: C.STREET_WINDOW, follows: 'windows', power }
  }
  const upper: [number, number][] = [[x1, y0], [x0, y1], [x1, y1]]
  // With the spiral of two turns the ball's tube passes the lower fitting at the left of the garage's foot, and the owner of the model left that one out.
  const lower: [number, number][] = g.h < 3.6 ? [[x1, y0], [x0, y0], [x1, y1]] : [[x1, y0], [x0, y0], [x0, y1], [x1, y1]]
  return [...upper.map(([u, v]) => lamp(u, v, (base + g.h) * BALL - 22, 0.45, 2.8)), ...lower.map(([u, v]) => lamp(u, v, (base + 0.4 * g.h) * BALL, 0.55, 3.2))]
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
