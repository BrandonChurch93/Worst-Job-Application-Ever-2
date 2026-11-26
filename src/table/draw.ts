import type { Shape, Tone } from '../stage/types'
import { APRON_H, APRON_Y, BALL, COLS, FLIP, FLIP_REACH, LAST_Y, MARQUEE_H, MARQUEE_Y, MID, OUTLET, PLUNGER, PORT, SCREEN, TH, TIERS, TIER_Y, floorZ, table, type P3, type V } from './layout'
import type { Machine } from './physics'

const px = (v: number): number => v * BALL
const DEG = 0.017453292519943295
const FLOOR: Tone[] = ['dark', 'pocket', 'dark']
export const DOORS = { x: 9.05, y: 4.5, w: 1.9, h: 1.5, seam: 0.06, plate: 1.6, plateH: 0.55 }

const bar = (id: string, part: string, a: V, b: V, thick: number, z0: number, z1: number, tone: Tone, kind: 'box' | 'capsule' = 'box'): Shape => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  return { id, part, kind, x: px((a[0] + b[0]) / 2 - len / 2), y: px((a[1] + b[1]) / 2 - thick / 2), w: px(len), h: px(thick), z0, z1, tone, rot: Math.atan2(b[1] - a[1], b[0] - a[0]) }
}
const disc = (id: string, part: string, c: V, r: number, z0: number, z1: number, tone: Tone): Shape => ({ id, part, kind: 'disc', x: px(c[0] - r), y: px(c[1] - r), w: px(2 * r), h: px(2 * r), z0, z1, tone })
const box = (id: string, part: string, b: number[], z0: number, z1: number, tone: Tone): Shape => ({ id, part, kind: 'box', x: px(b[0]!), y: px(b[1]!), w: px(b[2]!), h: px(b[3]!), z0, z1, tone })

function tube(out: Shape[], id: string, part: string, points: P3[], thick: number, tone: Tone, lift: number): void {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const z = px((a[2] + b[2]) / 2) + lift
    out.push(bar(`${id}.${i}`, part, [a[0], a[1]], [b[0], b[1]], thick, z, z + 6, tone, 'capsule'))
  }
}

export const BOARD = { turn: 0.9599310885968813, cos: 0.573576436351046, sin: 0.8191520442889918, base: 240 }
export const boardAt = (y: number, h: number, off: number): { y: number; z: number } => {
  const d = px(MARQUEE_Y + MARQUEE_H - 0.25) - (y + h / 2)
  return { y: px(MARQUEE_Y + MARQUEE_H - 0.25) - d * BOARD.cos + off * BOARD.sin - h / 2, z: BOARD.base + d * BOARD.sin + off * BOARD.cos }
}

function beside(points: P3[], off: number): P3[] {
  return points.map((q, i) => {
    const a = points[Math.max(0, i - 1)]!
    const b = points[Math.min(points.length - 1, i + 1)]!
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [q[0] - ((b[1] - a[1]) / d) * off, q[1] + ((b[0] - a[0]) / d) * off, q[2]] as P3
  })
}

let fixed: Shape[] | null = null

// The zones of the page of step 3, from the top. An anchor spans its zone, so its object sits at the zone's middle, at the height of the zone's floor.
export const ZONES: { id: string; y: number; h: number; z: number }[] = [
  { id: 'first', y: 0, h: SCREEN, z: 0 },
  { id: 'marquee', y: MARQUEE_Y, h: MARQUEE_H, z: 0 },
  ...TIERS.map((id, k) => ({ id: id as string, y: TIER_Y[k]!, h: TH, z: floorZ(k) })),
  { id: 'apron', y: APRON_Y, h: APRON_H, z: 0 },
  { id: 'last', y: LAST_Y, h: SCREEN, z: 0 }
]
export const zoneAt = (y: number): string => (ZONES.find((z) => y < px(z.y + z.h)) ?? ZONES[ZONES.length - 1]!).id
export const anchorId = (part: string, zone: string): string => `whole.${part}.${zone}`
const anchor = (part: string, z: { id: string; y: number; h: number; z: number }): Shape => ({ id: anchorId(part, z.id), part, kind: 'anchor', x: 0, y: px(z.y), w: 1920, h: px(z.h), z0: px(z.z), z1: px(z.z), tone: 'dark' })
// The anchors of the lights are not fixed: they come with the moving shapes and carry, in `v`, how bright the zone's general lighting is and how bright the website's own light is, each 0 to 1.
export const LIT_ZONES = ['marquee', 'corporate', 'office', 'street']

function anchors(shapes: Shape[]): Shape[] {
  const want = new Set<string>()
  for (const s of shapes) if (s.kind !== 'well') want.add(`${s.part} ${zoneAt(s.y + s.h / 2)}`)
  TIERS.forEach((tier, k) => {
    for (const part of ['tier-art', 'table-frame', 'table-hardware', 'flippers', 'lift', 'displays']) want.add(`${part} ${tier}`)
    for (const t of table.targets) if (t.tier === k) want.add(`${t.id.startsWith('corporate.note') ? 'model-notes' : 'targets'} ${tier}`)
  })
  for (const part of ['marquee', 'displays']) want.add(`${part} marquee`)
  for (const zone of ZONES) if (zone.id !== 'apron') want.add(`loader ${zone.id}`)
  for (const part of ['table-frame', 'table-hardware']) want.add(`${part} apron`)
  const out: Shape[] = []
  for (const z of ZONES) {
    for (const pair of [...want].sort()) {
      const [part, zone] = pair.split(' ') as [string, string]
      if (zone !== z.id || part === 'table-lights') continue
      out.push(anchor(part, z))
    }
  }
  return out
}

export function fixedShapes(): Shape[] {
  if (fixed) return fixed
  const out: Shape[] = []
  for (let k = 0; k < 3; k++) {
    const f = px(floorZ(k))
    const y = TIER_Y[k]!
    out.push({ id: `tier.${TIERS[k]}`, part: 'table-layout', kind: 'well', x: 0, y: px(y), w: 1920, h: px(TH), z0: f, z1: 0, tone: FLOOR[k]! })
    out.push(box(`rail.left.${k}`, 'table-frame', [0, y, COLS.liftA, TH], f, 0, 'metal'))
    out.push(box(`rail.right.${k}`, 'table-frame', [COLS.launchB, y, 20 - COLS.launchB, TH], f, 0, 'metal'))
    out.push(box(`wall.lift.${k}`, 'table-frame', [COLS.liftB, y, COLS.left - COLS.liftB, TH], f, f + 60, 'metal'))
    out.push(box(`wall.launch.${k}`, 'table-frame', [COLS.right, y, COLS.launchA - COLS.right, TH], f, f + 60, 'metal'))
    out.push(box(`lift.tube.${k}`, 'lift', [COLS.lift - 0.62, y, 1.24, TH], f, f + 8, 'glass'))
    out.push(box(`shoulder.left.${k}`, 'table-frame', [COLS.left, y + TH - 0.12, 8.8 - COLS.left, 0.12], f, f + 48, 'metal'))
    out.push(box(`shoulder.right.${k}`, 'table-frame', [11.2, y + TH - 0.12, COLS.right - 11.2, 0.12], f, f + 48, 'metal'))
    out.push(box(`gate.${k}`, 'table-hardware', [8.8, y + TH - 0.3, 2.4, 0.3], f, f + 3, 'pocket'))
    out.push(box(`outhole.left.${k}`, 'table-hardware', [COLS.left + 0.1, y + 10.35, 1.2, 0.8], f, f + 3, 'pocket'))
    out.push(box(`outhole.right.${k}`, 'table-hardware', [COLS.right - 1.3, y + 10.35, 1.2, 0.8], f, f + 3, 'pocket'))
  }
  for (const s of table.segs) {
    const f = px(floorZ(s.tier))
    out.push(bar(`seg.${s.id}`, s.kind === 'guide' ? 'table-hardware' : 'table-frame', s.a, s.b, 0.12, f, f + (s.kind === 'guide' ? 40 : 56), 'metal'))
  }
  for (const p of table.posts) {
    const f = px(floorZ(p.tier))
    out.push(disc(`post.${p.id}`, p.lamp ? 'table-lights' : 'table-hardware', p.c, p.r, f, f + (p.lamp ? 70 : 52), p.lamp ? 'light' : 'metal'))
  }
  for (const m of table.models) {
    const f = px(floorZ(m.tier) + (m.base ?? 0))
    out.push({ id: `model.${m.id}`, part: m.part, kind: m.round ? 'disc' : 'box', x: px(m.box[0]), y: px(m.box[1]), w: px(m.box[2]), h: px(m.box[3]), z0: f, z1: f + px(m.h), tone: m.tone as Tone })
  }
  for (const b of table.bumpers) {
    const f = px(floorZ(b.tier))
    out.push(disc(`bumper.${b.id}`, 'bumpers', b.c, b.r, f, f + 80, 'light'))
    out.push(disc(`bumper.${b.id}.skirt`, 'bumpers', b.c, b.r + 0.12, f, f + 14, 'metal'))
  }
  for (const s of table.slings) {
    const f = px(floorZ(s.tier))
    const part = s.tier === 0 ? 'model-wedges' : s.tier === 1 ? 'model-staplers' : 'model-road-signs'
    out.push(bar(`sling.${s.id}.1`, part, s.a, s.b, 0.1, f, f + 44, 'raised'))
    out.push(bar(`sling.${s.id}.2`, part, s.b, s.c, 0.1, f, f + 44, 'raised'))
    out.push(bar(`sling.${s.id}.3`, part, s.a, s.c, 0.14, f, f + 44, 'danger'))
  }
  for (const d of table.displays) {
    const f = px(floorZ(d.tier))
    out.push(box(`display.${d.id}`, 'displays', d.box, f, f + 30, 'dark'))
  }
  for (const a of table.flats) {
    const f = px(floorZ(a.tier))
    out.push(box(`flat.${a.id}`, a.part, a.box, f, f + 3, a.tone as Tone))
  }
  for (const h of table.holds) {
    if (h.tier < 0 || h.tier > 2 || h.kind === 'gate' || h.kind === 'plunger') continue
    const f = px(floorZ(h.tier))
    if (h.id === 'corporate.revolving') {
      out.push(disc(`hold.${h.id}`, 'model-revolving-door', h.c, 0.45, f + 60, f + 66, 'glass'), disc(`hold.${h.id}.post`, 'model-revolving-door', h.c, 0.12, f, f + 110, 'metal'))
    } else if (h.id !== 'corporate.doors') out.push(disc(`hold.${h.id}`, 'table-hardware', h.c, h.r + 0.08, f, f + 3, 'pocket'))
  }
  for (const r of table.rails) {
    if (r.hidden) continue
    const wire = r.id === 'ladder' || r.id === 'highway' || r.id === 'spiral'
    const part = r.id === 'ladder' ? 'model-ladder' : wire ? 'ramps' : r.id.startsWith('lift') ? 'lift' : r.id === 'feed' ? 'loader' : 'table-hardware'
    if (r.id === 'launch' || r.id.startsWith('lift')) continue
    if (r.id === 'ladder' || r.id === 'highway') {
      tube(out, `rail.${r.id}.a`, part, beside(r.points, 0.36), 0.12, 'metal', 4)
      tube(out, `rail.${r.id}.b`, part, beside(r.points, -0.36), 0.12, 'metal', 4)
      r.points.forEach((q, i) => {
        if (i > 0 && i < r.points.length - 1) out.push(bar(`rail.${r.id}.tie.${i}`, part, [beside(r.points, 0.36)[i]![0], beside(r.points, 0.36)[i]![1]], [beside(r.points, -0.36)[i]![0], beside(r.points, -0.36)[i]![1]], 0.08, px(q[2]) - 6, px(q[2]), 'metal'))
      })
    } else tube(out, `rail.${r.id}`, part, r.points, wire ? 0.16 : 1.24, wire ? 'metal' : 'glass', wire ? -8 : -4)
  }
  out.push(box('lift.door.office', 'lift', [COLS.left - 0.2, TIER_Y[1]! + 4.5, 0.2, 0.3], px(floorZ(1)), px(floorZ(1)) + 70, 'accent'))
  out.push(box('lift.door.office.2', 'lift', [COLS.left - 0.2, TIER_Y[1]! + 5.6, 0.2, 0.3], px(floorZ(1)), px(floorZ(1)) + 70, 'accent'))
  out.push(box('lift.door.street', 'lift', [COLS.left - 0.2, TIER_Y[2]! + 1.7, 0.2, 0.3], px(floorZ(2)), px(floorZ(2)) + 70, 'accent'))
  out.push(disc('lift.elbow.corporate', 'lift', [COLS.lift, TIER_Y[0]! + 1.05], 0.7, px(floorZ(0)), px(floorZ(0)) + 100, 'accent'))
  out.push(disc('lift.elbow.office', 'lift', [COLS.lift, TIER_Y[1]! + 1.05], 0.7, px(floorZ(1)), px(floorZ(1)) + 100, 'accent'))
  out.push(box('drain.plate', 'table-frame', [8.8, APRON_Y + 0.25, 2.4, 0.5], 0, 6, 'dark'))
  out.push(disc('flap.highway', 'ramps', [6.9, TIER_Y[2]! + 4.9], 0.3, px(floorZ(2)), px(floorZ(2)) + 5, 'metal'))
  const hf = px(floorZ(0))
  out.push(box('hq.doorway', 'model-hq', [DOORS.x, TIER_Y[0]! + DOORS.y, DOORS.w, 0.04], hf, hf + px(DOORS.h), 'dark'))
  out.push(box('hq.plate', 'model-hq', [DOORS.x - 0.2, TIER_Y[0]! + DOORS.y, DOORS.w + 0.4, 0.1], hf + px(DOORS.plate), hf + px(DOORS.plate + DOORS.plateH), 'paper'))
  const back = boardAt(px(MARQUEE_Y + 0.25), px(MARQUEE_H - 0.5), -20)
  out.push({ id: 'marquee.back', part: 'marquee', kind: 'box', x: px(COLS.left), y: back.y, w: px(COLS.right - COLS.left), h: px(MARQUEE_H - 0.5), z0: back.z - 20, z1: back.z + 20, tone: 'dark', turnX: BOARD.turn })
  out.push(box('marquee.stand', 'marquee', [COLS.left + 0.5, MARQUEE_Y + 2.1, COLS.right - COLS.left - 1, 1.5], 0, BOARD.base, 'dark'))
  for (const [id, c] of [['loader', PORT], ['outlet', OUTLET]] as const) {
    out.push(disc(`${id}.ring`, 'loader', [c.x, c.y], c.ring / 2, 0, 26, 'metal'))
    out.push(disc(`${id}.cup`, 'loader', [c.x, c.y], c.cup / 2, 26, 28, 'pocket'))
  }
  fixed = [...anchors(out), ...out.filter((s) => !MOVER.test(s.id))]
  movers = out.filter((s) => MOVER.test(s.id))
  return fixed
}

// The shapes that stand where the layout puts them and still have a state: they are drawn with the moving shapes, each with its state in `v`.
const MOVER = /^(bumper\.[a-z]+\.bumper\.\d+|sling\..+|hold\.corporate\.revolving|gate\.\d|flap\.highway|lift\.door\..+|model\.street\.firehouse|model\.office\.inbox|model\.street\.mom)$/
const HELD: Record<string, string> = { 'model.street.firehouse': 'street.firehouse', 'model.office.inbox': 'office.inbox', 'model.street.mom': 'street.mom', 'hold.corporate.revolving': 'corporate.revolving' }
let movers: Shape[] = []
const FLASH = 0.25
const BEACON = { idle: 0.35, seconds: 1.5 }
const STROBE_HZ = 2.5

function stateOf(id: string, m: Machine): number[] {
  const hold = HELD[id]
  if (hold) {
    const inside = m.balls.some((b) => b.mode === 'hold' && b.hold === hold) ? 1 : 0
    const sinceIn = Math.min(m.since(`scoop-in:${hold}`), m.since(`kicker-in:${hold}`), m.since(`mom-hatch:${hold}`))
    const sinceOut = Math.min(m.since(`scoop-kick:${hold}`), m.since(`eject:${hold}`), m.since(`spinner:${hold}`), m.since(`mom-save:${hold}`))
    return hold === 'street.mom' ? [inside, sinceIn, sinceOut, m.on['street.mom'] && !m.mom ? 1 : 0] : [inside, sinceIn, sinceOut]
  }
  if (id.startsWith('bumper.')) return [m.since(id.slice(7))]
  if (id.startsWith('sling.')) return [m.since(id.slice(6, id.lastIndexOf('.')))]
  if (id.startsWith('gate.')) return [m.gate[Number(id.slice(5))] ? 1 : 0]
  if (id === 'flap.highway') return [m.on['street.flap'] !== false ? 1 : 0]
  return [m.since(`${id.split('.')[2]}.lift.door`)]
}

export function movingShapes(m: Machine, lit: boolean[], hide: boolean, glow: (boolean | number)[] = [true, true, true], pull = 0, shut = false, website = 1): Shape[] {
  const out: Shape[] = []
  const level = glow.map(Number)
  fixedShapes()
  const struck = (k: number): number => Math.min(9, ...table.bumpers.filter((b) => b.tier === k).map((b) => m.since(b.id)), ...table.slings.filter((s) => s.tier === k).map((s) => m.since(s.id)), ...table.targets.filter((t) => t.tier === k).map((t) => m.since(t.id)))
  const strobe = m.balls.some((b) => b.steel && b.mode !== 'none') ? 0.5 - 0.5 * Math.cos(m.seconds * STROBE_HZ * 2 * Math.PI) : 0
  const fire = m.balls.some((b) => b.mode === 'hold' && b.hold === 'street.firehouse') || m.since('scoop-kick:street.firehouse') < BEACON.seconds
  const check = m.since('street.spinner') < BEACON.seconds
  for (const z of ZONES) {
    if (!LIT_ZONES.includes(z.id)) continue
    const k = (TIERS as string[]).indexOf(z.id)
    const flash = k < 0 ? 0 : Math.max(Math.max(0, 1 - struck(k) / FLASH), k === 1 ? strobe : 0)
    const general = k < 0 ? Math.max(...level) : level[k]!
    out.push({ ...anchor('table-lights', z), v: [general, website, flash, k === 2 ? general * (fire ? 1 : BEACON.idle) : 0, k === 2 ? general * (check ? 1 : BEACON.idle) : 0] })
  }
  for (const s of movers) out.push({ ...s, v: stateOf(s.id, m) })
  const hf = px(floorZ(0))
  const leaf = (DOORS.w - DOORS.seam) / 2
  const dy = TIER_Y[0]! + DOORS.y + 0.04
  for (const side of [0, 1]) {
    const b = shut ? [DOORS.x + side * (leaf + DOORS.seam), dy, leaf, 0.05] : [DOORS.x + side * (DOORS.w - 0.05), dy, 0.05, leaf]
    out.push({ ...box(`hq.door.${side === 0 ? 'left' : 'right'}`, 'model-hq', b, hf, hf + px(DOORS.h - 0.05), 'light'), v: [shut ? 1 : 0, m.since('doors-slam:corporate.hq'), m.since('doors-open:corporate.doors')] })
  }
  for (const f of table.flippers) {
    const z = px(floorZ(f.tier))
    const a = m.flipperAngle(f.side) * DEG
    const dir = f.side === 'left' ? 1 : -1
    const tip: V = [f.pivot[0] + dir * FLIP_REACH * Math.cos(a), f.pivot[1] + FLIP_REACH * Math.sin(a)]
    out.push({ ...bar(`flipper.${f.id}`, 'flippers', f.pivot, tip, FLIP.radius + FLIP.tip, z, z + 44, 'accent', 'capsule'), v: [a] })
  }
  for (const t of table.targets) {
    const z = px(floorZ(t.tier))
    const up = t.kind !== 'drop' || !m.down[t.index]
    out.push({ ...box(`target.${t.id}`, t.id.startsWith('corporate.note') ? 'model-notes' : 'targets', t.box, z, z + (up ? 44 : 3), t.kind === 'spinner' ? 'metal' : 'paper'), v: [up ? 1 : 0, m.since(t.id)] })
  }
  out.push({ ...box('plunger.rod', 'table-hardware', [PLUNGER[0] - 0.08, PLUNGER[1] + 0.55 + pull * 0.45, 0.16, 1.2 + pull * 0.25], px(floorZ(2)) + 30, px(floorZ(2)) + 46, 'metal'), v: [pull] })
  out.push({ ...disc('plunger.knob', 'table-hardware', [PLUNGER[0], APRON_Y + 0.75 + pull * 0.7], 0.32, 0, 60, 'accent'), v: [pull] })
  for (const l of table.lamps) {
    const f = px(floorZ(l.tier))
    const on = level[l.tier]! > 0.5
    out.push({ ...disc(`lamp.${l.id}`, 'table-lights', l.c, on ? 0.14 : 0.1, f, f + 4, on ? 'light' : 'glass'), v: [level[l.tier]!] })
  }
  for (const n of table.inserts) {
    const z = px(floorZ(n.tier))
    out.push({ ...disc(`insert.${n.id}`, 'table-lights', n.c, n.r, z, z + 3, lit[n.index] ? 'light' : 'glass'), v: [lit[n.index] ? 1 : 0] })
  }
  m.balls.forEach((b, i) => {
    if (b.mode === 'none' || (i === 0 && hide)) return
    out.push({ id: i === 0 ? 'ball.clear' : `ball.steel.${i}`, part: i === 0 ? 'clear-ball' : 'table-hardware', kind: 'ball', x: px(b.x - 0.5), y: px(b.y - 0.5), w: BALL, h: BALL, z0: px(b.z), z1: px(b.z) + BALL, tone: i === 0 ? 'glass' : 'metal' })
  })
  return out
}

export const MACHINE_BOX = { x: 0, y: px(MARQUEE_Y), w: 1920, h: px(APRON_Y + 2 - MARQUEE_Y) }
export const midX = px(MID)
