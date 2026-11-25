import { config, stepHz } from '../config'
import { blendPose, CursorBody, type Acting, type CursorPose, type Reaction } from '../cursor/body'
import { drawFire, fireSurface, makeTurrets } from '../pages/step1/fire'
import { seatIndex, seats, TRAVEL, type Seat } from '../pages/step1/keyboard'
import { SPOT } from '../pages/step1/script'
import { TURRET, type Turrets, type TurretsState } from '../pages/step1/turrets'
import type { DrawList } from '../stage/types'
import type { Box } from './piece'

export const LOOP_SECONDS = config.deliver.cardLoop.seconds
export const LOOP_STEPS = Math.round(LOOP_SECONDS * stepHz)
const SETTLE_PERIODS = 4
const dt = 1 / stepHz

export const CURSOR_BOX = { left: 14, top: 14, w: 76, h: 100 }
export const BODY = { x: 14, y: 26 }
const HOP_SECONDS = 0.3
const PRESS_SECONDS = 0.14
const SHOCK_SECONDS = 0.9
const KNOCK = { along: 900, up: 380 }
const BOLT_LENGTH = 58
const BOLT_HEAD = 18
const SCORCH = 30

const NAME = config.applicant.filmFirstName
const KEPT = 6
const TYPED_KEY = NAME[KEPT]!.toLowerCase()

interface Hop { leave: number; key: string; press: boolean; jump: boolean }

const HOPS: Hop[] = [
  { leave: -0.15, key: 'h', press: false, jump: true },
  { leave: 0.85, key: 'r', press: false, jump: true },
  { leave: 1.75, key: TYPED_KEY, press: true, jump: true },
  { leave: 3.75, key: 'g', press: false, jump: false },
  { leave: 4.35, key: 'u', press: false, jump: true },
  { leave: 5.35, key: 'e', press: false, jump: true },
  { leave: 6.2, key: 'k', press: false, jump: true },
  { leave: 7.0, key: 'c', press: false, jump: true }
]

export interface Shot { turret: 0 | 1; fire: number; at: string; hits: boolean }

const SHOTS: Shot[] = [
  { turret: 0, fire: 0.05, at: 'c', hits: false },
  { turret: 1, fire: 1.05, at: 'h', hits: false },
  { turret: 1, fire: 1.95, at: 'r', hits: false },
  { turret: 0, fire: 3.41, at: TYPED_KEY, hits: true },
  { turret: 0, fire: 4.55, at: 'g', hits: false },
  { turret: 1, fire: 5.55, at: 'u', hits: false },
  { turret: 0, fire: 6.4, at: 'e', hits: false },
  { turret: 1, fire: 7.2, at: 'k', hits: false }
]

const CUES: { at: number; act?: Acting; react?: Reaction }[] = [
  ...HOPS.filter((h) => h.jump).map((h) => ({ at: h.leave, react: 'jump' as Reaction })),
  { at: 2.2, act: 'proud' },
  { at: 2.3, react: 'dustOff' }
]

const wrap = (t: number): number => ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
const stepOf = (t: number): number => Math.round(wrap(t) * stepHz) % LOOP_STEPS
const since = (t: number, from: number): number => wrap(t - from)

const seatOf = (key: string): Seat => {
  const i = seatIndex[key]
  if (i === undefined) throw new Error(`The keyboard of step 1 has no key "${key}"`)
  return seats[i]!
}
const seatAt = (x: number, y: number): Seat | null => seats.find((k) => x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) ?? null

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
  const k = seatOf(best.key)
  return { x: k.cx + SPOT.x, y: k.cy + SPOT.y }
}

export interface Moment { cursor: CursorPose; turrets: TurretsState; typed: string; pressed: string | null }
export interface Landing { step: number; hit: boolean; x: number; y: number; from: 0 | 1 }
export interface Track { moments: Moment[]; seam: number; turretSeam: number; landings: Landing[]; fires: number[] }

let track: Track | null = null

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export function fireTrack(): Track {
  if (track) return track
  const cues = new Map<number, typeof CUES>()
  for (const c of CUES) {
    const s = stepOf(c.at)
    cues.set(s, [...(cues.get(s) ?? []), c])
  }
  const presses = new Map<number, Hop>()
  for (const h of HOPS) if (h.press) presses.set(stepOf(h.leave + HOP_SECONDS), h)
  const fireSteps: [number[], number[]] = [[], []]
  for (const b of SHOTS) fireSteps[b.turret].push(stepOf(b.fire))
  const until = (turret: 0 | 1, s: number): number => Math.min(...fireSteps[turret].map((f) => ((((f - s - 1) % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS) + 1))

  const turrets = makeTurrets()
  turrets.s.wanted = true
  turrets.s.up = 1
  const body = new CursorBody()
  const first = pointerAt(0)
  body.reset(first.x, first.y)
  body.setGround(fireSurface(first.x, first.y))
  body.act('nervous')
  let typed = NAME.slice(0, KEPT)
  let pressed: string | null = null
  let pressLeft = 0
  let shock = 0
  let landings: Landing[] = []
  let fires: number[] = []
  let moments: Moment[] = []
  let before: Moment[] = []
  for (let p = 0; p < SETTLE_PERIODS; p++) {
    before = moments
    moments = []
    landings = []
    fires = []
    for (let s = 0; s < LOOP_STEPS; s++) {
      const t = copy(turrets.s)
      for (const b of t.bolts) b.id %= SHOTS.length
      for (const c of t.scorches) c.id %= SHOTS.length
      moments.push({ cursor: body.pose(), turrets: { ...t, nextId: 0, hits: 0, heat: 0 }, typed, pressed })
      for (const c of cues.get(s) ?? []) {
        if (c.act) body.act(c.act)
        if (c.react) body.react(c.react)
      }
      const press = presses.get(s)
      if (press) {
        typed += NAME[typed.length] ?? ''
        pressed = press.key
        pressLeft = PRESS_SECONDS
      }
      if (pressLeft > 0) {
        pressLeft -= dt
        if (pressLeft <= 0) pressed = null
      }
      const at = body.pose()
      const under = seatAt(at.x, at.y)
      body.setGround(fireSurface(at.x, at.y) - (under && under.name === pressed ? TRAVEL : 0))
      body.step(pointerAt(s * dt), () => undefined, false)
      const now = body.pose()
      turrets.s.clock = 0
      turrets.s.next = [until(0, s) * dt, until(1, s) * dt]
      const flying = new Map(turrets.s.bolts.map((b) => [b.id, b]))
      const count = turrets.s.bolts.length
      const hits = turrets.step(dt, { x: now.x + BODY.x, y: now.y + BODY.y }, true, () => undefined)
      turrets.s.hits = 0
      turrets.s.overheated = false
      for (const b of turrets.s.bolts) flying.delete(b.id)
      if (turrets.s.bolts.length > count - flying.size) fires.push(s)
      for (const b of flying.values()) landings.push({ step: s, hit: hits.length > 0, x: b.tx, y: b.ty, from: b.from as 0 | 1 })
      for (const h of hits) {
        body.hurt('burn')
        body.knock(h.dx * KNOCK.along, h.dy * KNOCK.along, KNOCK.up)
        body.react('recoil')
        body.act('shocked')
        shock = SHOCK_SECONDS
        typed = typed.slice(0, -1)
      }
      if (shock > 0) {
        shock -= dt
        if (shock <= 0) body.act('nervous')
      }
    }
  }
  let seam = 0
  let turretSeam = 0
  for (let s = 0; s < LOOP_STEPS; s++) {
    const a = before[s]!
    const b = moments[s]!
    seam = Math.max(seam, Math.abs(a.cursor.x - b.cursor.x), Math.abs(a.cursor.y - b.cursor.y), Math.abs(a.cursor.z - b.cursor.z), Math.abs(a.cursor.squash - b.cursor.squash), Math.abs(a.cursor.lean - b.cursor.lean), Math.abs(a.cursor.healing - b.cursor.healing))
    if (a.typed !== b.typed || a.pressed !== b.pressed || a.turrets.bolts.length !== b.turrets.bolts.length || a.turrets.scorches.length !== b.turrets.scorches.length) turretSeam = Infinity
    else {
      a.turrets.bolts.forEach((x, i) => {
        const y = b.turrets.bolts[i]!
        turretSeam = Math.max(turretSeam, Math.abs(x.tx - y.tx), Math.abs(x.ty - y.ty), Math.abs(x.age - y.age), Math.abs(x.id - y.id))
      })
      a.turrets.scorches.forEach((x, i) => {
        const y = b.turrets.scorches[i]!
        turretSeam = Math.max(turretSeam, Math.abs(x.x - y.x), Math.abs(x.y - y.y), Math.abs(x.left - y.left))
      })
      for (const i of [0, 1]) turretSeam = Math.max(turretSeam, Math.abs(a.turrets.angle[i]! - b.turrets.angle[i]!))
    }
  }
  track = { moments, seam, turretSeam, landings, fires }
  return track
}

const split = (time: number): { n: number; alpha: number } => {
  const s = wrap(time) * stepHz
  const whole = Math.floor(s + 1e-7)
  const alpha = Math.min(1, Math.max(0, s - whole))
  return { n: whole % LOOP_STEPS, alpha: alpha < 1e-6 ? 0 : alpha }
}

export function cursorAt(time: number): CursorPose {
  const { moments } = fireTrack()
  const { n, alpha } = split(time)
  const a = moments[n]!.cursor
  return alpha === 0 ? a : blendPose(a, moments[(n + 1) % LOOP_STEPS]!.cursor, alpha)
}

export function turretsAt(time: number): TurretsState {
  const { moments } = fireTrack()
  const { n, alpha } = split(time)
  const t = copy(moments[n]!.turrets)
  if (alpha === 0) return t
  const more = alpha * dt
  for (const b of t.bolts) b.age = Math.min(b.flight, b.age + more)
  for (const c of t.scorches) c.left = Math.max(dt, c.left - more)
  t.clock += more
  return t
}

let drawn: Turrets | null = null

const boxAround = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h })

export interface Threat { id: string; kind: 'bolt' | 'mark'; box: Box }
export interface FireScene { list: DrawList; threats: Threat[]; pressed: string | null; typed: string; aims: [number, number]; turrets: TurretsState }

export function threatsOf(t: TurretsState): Threat[] {
  const out: Threat[] = []
  for (const b of t.bolts) {
    const u = Math.min(1, b.age / b.flight)
    const hx = b.x0 + (b.tx - b.x0) * u
    const hy = b.y0 + (b.ty - b.y0) * u
    const a = Math.atan2(b.ty - b.y0, b.tx - b.x0)
    const tx = hx - Math.cos(a) * BOLT_LENGTH
    const ty = hy - Math.sin(a) * BOLT_LENGTH
    const pad = BOLT_HEAD / 2
    out.push({ id: `bolt-${b.id}`, kind: 'bolt', box: { x: Math.min(hx, tx) - pad, y: Math.min(hy, ty) - pad, w: Math.abs(hx - tx) + pad * 2, h: Math.abs(hy - ty) + pad * 2 } })
  }
  for (const c of t.scorches) {
    const d = SCORCH * Math.min(1, c.left / (TURRET.scorchSeconds * 0.6))
    if (d > 1) out.push({ id: `scorch-${c.id}`, kind: 'mark', box: boxAround(c.x, c.y, d, d) })
  }
  return out
}

let last: { time: number; scene: FireScene } | null = null

export function fireScene(phase: number): FireScene {
  const time = wrap(phase * LOOP_SECONDS)
  if (last && last.time === time) return last.scene
  const m = fireTrack().moments[split(time).n]!
  const turrets = turretsAt(time)
  drawn ??= makeTurrets()
  drawn.load(turrets)
  const list: DrawList = []
  drawFire(list, { typed: m.typed, pressed: m.pressed ? [m.pressed] : [], turrets: drawn, time })
  const scene: FireScene = { list, threats: threatsOf(turrets), pressed: m.pressed, typed: m.typed, aims: [turrets.angle[0], turrets.angle[1]], turrets }
  last = { time, scene }
  return scene
}

export const fireScript = { hops: HOPS, shots: SHOTS, hopSeconds: HOP_SECONDS, name: NAME, kept: KEPT, typedKey: TYPED_KEY, hitRadius: TURRET.hitRadius, scorchSeconds: TURRET.scorchSeconds, windup: TURRET.windup }
