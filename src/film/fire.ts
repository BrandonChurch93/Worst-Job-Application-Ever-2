import { config, stepHz } from '../config'
import { blendPose, CursorBody, type CursorPose } from '../cursor/body'
import type { DrawList, Shape } from '../stage/types'
import type { Box } from './piece'

const heights = config.scale.heights
const grid = config.scale.grid
const sizes = config.scale.sizes

export const LOOP_SECONDS = config.deliver.cardLoop.seconds
export const LOOP_STEPS = Math.round(LOOP_SECONDS * stepHz)
const SETTLE_PERIODS = 3
const dt = 1 / stepHz

const KEY_H = sizes.keycapMin
const GAP = grid.keyGap
const KEY_W = 96
const PITCH = KEY_W + GAP
const ROWS = 5
const DECK_PAD = 20
const FIELD = { x: 320, w: 1280 }
export const DECK: Box = { x: grid.contentLeft, y: 1080 - 64 - (ROWS * KEY_H + (ROWS - 1) * GAP + DECK_PAD * 2), w: grid.contentRight - grid.contentLeft, h: ROWS * KEY_H + (ROWS - 1) * GAP + DECK_PAD * 2 }
const TURRET_D = 84
const HATCH_D = 116
const BARREL = { length: 72, width: 22 }
export const BOLT = { length: 64, width: 12, head: 20, speed: 1100 }
const MARK = { size: 46, seconds: 2 }
export const TRACK_DELAY = 0.25
const PRESS_SECONDS = 0.14
export const CURSOR_BOX = { left: 14, top: 14, w: 76, h: 100 }

export interface Key { id: string; x: number; y: number; w: number; h: number; cx: number; cy: number; tone: 'raised' | 'accent' }

function keyRows(): Key[] {
  const out: Key[] = []
  const rowY = (r: number) => DECK.y + DECK_PAD + r * (KEY_H + GAP)
  const put = (r: number, id: string, x: number, w: number, tone: 'raised' | 'accent' = 'raised') => {
    out.push({ id, x, y: rowY(r), w, h: KEY_H, cx: x + w / 2, cy: rowY(r) + KEY_H / 2, tone })
    return x + w + GAP
  }
  const run = (r: number, x: number, ids: string) => {
    for (const ch of ids) x = put(r, ch, x, KEY_W)
    return x
  }
  const end = FIELD.x + FIELD.w
  let x = run(0, FIELD.x, '1234567890')
  put(0, 'backspace', x, end - x)
  const tab = FIELD.w - 10 * PITCH
  x = put(1, 'tab', FIELD.x, tab)
  run(1, x, 'qwertyuiop')
  const caps = 160
  x = put(2, 'caps', FIELD.x, caps)
  x = run(2, x, 'asdfghjkl')
  put(2, 'enter', x, end - x, 'accent')
  const shift = (FIELD.w - 7 * PITCH - GAP) / 2
  x = put(3, 'shift-left', FIELD.x, shift)
  x = run(3, x, 'zxcvbnm')
  put(3, 'shift-right', x, end - x)
  x = put(4, 'at', FIELD.x, KEY_W)
  x = put(4, 'space', x, FIELD.w - 2 * PITCH)
  put(4, 'dot', x, KEY_W)
  return out
}

export const KEYS = keyRows()
const keyOf = (id: string): Key => {
  const k = KEYS.find((x) => x.id === id)
  if (!k) throw new Error(`The stand-in keyboard has no key "${id}"`)
  return k
}

export const TURRETS = [
  { id: 'left', x: DECK.x + 96, y: DECK.y + DECK.h / 2 },
  { id: 'right', x: DECK.x + DECK.w - 96, y: DECK.y + DECK.h / 2 }
] as const

interface Hop { leave: number; key: string; press: boolean }
const HOP_SECONDS = 0.3

const HOPS: Hop[] = [
  { leave: -0.15, key: 'e', press: true },
  { leave: 0.8, key: 'k', press: true },
  { leave: 1.75, key: 's', press: true },
  { leave: 2.65, key: 't', press: true },
  { leave: 3.7, key: 'v', press: false },
  { leave: 4.95, key: 'u', press: true },
  { leave: 5.95, key: 'f', press: true },
  { leave: 6.9, key: 'j', press: true }
]

export interface BoltPlan { id: string; turret: 0 | 1; key: string; land: number; hits: boolean }

const BOLTS: BoltPlan[] = [
  { id: 'bolt-0', turret: 0, key: 'e', land: 1.05, hits: false },
  { id: 'bolt-1', turret: 1, key: 'k', land: 2.0, hits: false },
  { id: 'bolt-2', turret: 0, key: 's', land: 2.9, hits: false },
  { id: 'bolt-3', turret: 1, key: 't', land: 3.7, hits: true },
  { id: 'bolt-4', turret: 0, key: 'v', land: 5.2, hits: false },
  { id: 'bolt-5', turret: 1, key: 'u', land: 6.2, hits: false },
  { id: 'bolt-6', turret: 0, key: 'f', land: 7.15, hits: false },
  { id: 'bolt-7', turret: 1, key: 'j', land: 8.05, hits: false }
]

const HIT = BOLTS.find((b) => b.hits)!
const CUES: { at: number; run: (c: CursorBody) => void }[] = [
  ...HOPS.map((h) => ({ at: h.leave, run: (c: CursorBody) => c.react(h.leave === HIT.land ? 'recoil' : 'jump') })),
  { at: HIT.land - 0.25, run: (c) => c.act('scared') },
  { at: HIT.land - 0.2, run: (c) => c.react('flinch') },
  { at: HIT.land, run: (c) => { c.hurt('burn'); c.knock(-260, 340, 260) } },
  { at: HIT.land + 1.0, run: (c) => { c.act('nervous'); c.react('dustOff') } }
]

const wrap = (t: number): number => ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
const stepOf = (t: number): number => Math.round(wrap(t) * stepHz) % LOOP_STEPS
const since = (t: number, from: number): number => wrap(t - from)

export function pointerAt(time: number): { x: number; y: number } {
  const t = wrap(time)
  let best = HOPS[HOPS.length - 1]!
  let age = Infinity
  for (const h of HOPS) {
    const a = since(t, h.leave)
    if (a < age) {
      age = a
      best = h
    }
  }
  const k = keyOf(best.key)
  return { x: k.cx, y: k.cy }
}

export interface Track { poses: CursorPose[]; seam: number }

let track: Track | null = null

export function cursorTrack(): Track {
  if (track) return track
  const cues = new Map<number, ((c: CursorBody) => void)[]>()
  for (const c of CUES) {
    const s = stepOf(c.at)
    cues.set(s, [...(cues.get(s) ?? []), c.run])
  }
  const body = new CursorBody()
  const first = pointerAt(0)
  body.reset(first.x, first.y)
  body.setGround(heights.keycap)
  body.act('nervous')
  const emit = (): void => undefined
  const poses: CursorPose[] = []
  let before: CursorPose[] = []
  for (let p = 0; p < SETTLE_PERIODS; p++) {
    before = poses.slice()
    poses.length = 0
    for (let s = 0; s < LOOP_STEPS; s++) {
      poses.push(body.pose())
      for (const run of cues.get(s) ?? []) run(body)
      body.step(pointerAt(s * dt), emit, false)
    }
  }
  let seam = 0
  for (let s = 0; s < LOOP_STEPS; s++) {
    const a = before[s]!
    const b = poses[s]!
    seam = Math.max(seam, Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z), Math.abs(a.squash - b.squash), Math.abs(a.lean - b.lean), Math.abs(a.healing - b.healing))
  }
  track = { poses, seam }
  return track
}

export function cursorAt(time: number): CursorPose {
  const { poses } = cursorTrack()
  const s = wrap(time) * stepHz
  const n = Math.floor(s + 1e-7) % LOOP_STEPS
  const a = poses[n]!
  const alpha = Math.min(1, Math.max(0, s - Math.floor(s + 1e-7)))
  if (alpha < 1e-6) return a
  return blendPose(a, poses[(n + 1) % LOOP_STEPS]!, alpha)
}

export interface Flight { plan: BoltPlan; fire: number; seconds: number; from: { x: number; y: number }; to: { x: number; y: number }; angle: number }

let flights: Flight[] | null = null

export function boltFlights(): Flight[] {
  if (flights) return flights
  flights = BOLTS.map((plan) => {
    const t = TURRETS[plan.turret]
    const k = keyOf(plan.key)
    const to = plan.hits ? { x: cursorAt(plan.land).x + 18, y: cursorAt(plan.land).y + 30 } : { x: k.cx, y: k.cy }
    const angle = Math.atan2(to.y - t.y, to.x - t.x)
    const from = { x: t.x + Math.cos(angle) * (BARREL.length + 10), y: t.y + Math.sin(angle) * (BARREL.length + 10) }
    const seconds = Math.hypot(to.x - from.x, to.y - from.y) / BOLT.speed
    return { plan, fire: plan.land - seconds, seconds, from, to, angle }
  })
  return flights
}

const boxAround = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h })

export interface Threat { id: string; kind: 'bolt' | 'mark'; box: Box }
export interface FireScene { list: DrawList; threats: Threat[]; pressed: string | null; aims: [number, number] }

export function aimAt(turret: 0 | 1, time: number): number {
  const c = cursorAt(time - TRACK_DELAY)
  const t = TURRETS[turret]
  return Math.atan2(c.y + 30 - t.y, c.x + 18 - t.x)
}

export function fireScene(phase: number): FireScene {
  const time = wrap(phase * LOOP_SECONDS)
  const list: DrawList = []
  const threats: Threat[] = []
  const part = 'keyboard'
  list.push({ id: 'fire-deck', part, kind: 'box', x: DECK.x, y: DECK.y, w: DECK.w, h: DECK.h, z0: 0, z1: heights.keyboardDeck, tone: 'metal', r: 24, mechanism: true })
  let pressed: string | null = null
  for (const h of HOPS) {
    if (!h.press) continue
    const a = since(time, h.leave + HOP_SECONDS)
    if (a < PRESS_SECONDS) pressed = h.key
  }
  for (const k of KEYS) {
    const down = k.id === pressed ? heights.keyTravel : 0
    list.push({ id: `fire-key-${k.id}`, part, kind: 'box', x: k.x, y: k.y, w: k.w, h: k.h, z0: heights.keyboardDeck, z1: heights.keycap - down, tone: k.tone, r: 10 })
  }
  const aims: [number, number] = [aimAt(0, time), aimAt(1, time)]
  TURRETS.forEach((t, i) => {
    const a = aims[i]!
    const turrets = 'turrets'
    list.push({ id: `fire-hatch-${t.id}`, part: turrets, kind: 'disc', ...boxAround(t.x, t.y, HATCH_D, HATCH_D), z0: heights.keyboardDeck, z1: heights.keyboardDeck + 1, tone: 'dark' })
    list.push({ id: `fire-turret-${t.id}`, part: turrets, kind: 'disc', ...boxAround(t.x, t.y, TURRET_D, TURRET_D), z0: heights.keyboardDeck, z1: heights.turret, tone: 'raised', mechanism: true })
    const reach = BARREL.length / 2 + 14
    list.push({ id: `fire-barrel-${t.id}`, part: turrets, kind: 'capsule', ...boxAround(t.x + Math.cos(a) * reach, t.y + Math.sin(a) * reach, BARREL.length, BARREL.width), z0: heights.turret - 34, z1: heights.turret - 10, tone: 'dark', rot: a })
  })
  for (const f of boltFlights()) {
    const age = since(time, f.fire)
    if (age < f.seconds) {
      const u = age / f.seconds
      const hx = f.from.x + (f.to.x - f.from.x) * u
      const hy = f.from.y + (f.to.y - f.from.y) * u
      const cx = hx - Math.cos(f.angle) * (BOLT.length / 2)
      const cy = hy - Math.sin(f.angle) * (BOLT.length / 2)
      const z = heights.keycap + 14
      const streak: Shape = { id: `fire-${f.plan.id}`, part: 'turrets', kind: 'capsule', ...boxAround(cx, cy, BOLT.length, BOLT.width), z0: z, z1: z + BOLT.width, tone: 'accent', rot: f.angle }
      const head: Shape = { id: `fire-${f.plan.id}-head`, part: 'turrets', kind: 'ball', ...boxAround(hx, hy, BOLT.head, BOLT.head), z0: z - 4, z1: z - 4 + BOLT.head, tone: 'light' }
      list.push(streak, head)
      const tx = hx - Math.cos(f.angle) * BOLT.length
      const ty = hy - Math.sin(f.angle) * BOLT.length
      const pad = BOLT.head / 2
      threats.push({ id: f.plan.id, kind: 'bolt', box: { x: Math.min(hx, tx) - pad, y: Math.min(hy, ty) - pad, w: Math.abs(hx - tx) + pad * 2, h: Math.abs(hy - ty) + pad * 2 } })
    }
    if (f.plan.hits) continue
    const left = age - f.seconds
    if (left >= 0 && left < MARK.seconds) {
      const size = MARK.size * (1 - left / MARK.seconds)
      const k = keyOf(f.plan.key)
      const top = (k.id === pressed ? heights.keycap - heights.keyTravel : heights.keycap) + 0.2
      if (size > 1) {
        list.push({ id: `fire-${f.plan.id}-mark`, part: 'turrets', kind: 'disc', ...boxAround(f.to.x, f.to.y, size, size), z0: top, z1: top + 0.6, tone: 'dark' })
        threats.push({ id: `${f.plan.id}-mark`, kind: 'mark', box: boxAround(f.to.x, f.to.y, size, size) })
      }
    }
  }
  return { list, threats, pressed, aims }
}

export const fireScript = { hops: HOPS, bolts: BOLTS, hit: HIT, hopSeconds: HOP_SECONDS, markSeconds: MARK.seconds }
