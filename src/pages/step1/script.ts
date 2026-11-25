import { config } from '../../config'
import { stream } from '../../core/random'
import type { Acting, Reaction } from '../../cursor/body'
import { frame, homePose, mixPose, smooth } from '../../stage/camera'
import type { CameraPose, Pointer } from '../../stage/types'
import { homePlaces, seatIndex, seats, shuffled } from './keyboard'
import { FIELD_PITCH, FIELD_X, PAPER, PAPER_REST, SLOT } from './layout'
import { HEADER } from '../../shell/parts'

const FIELD_Y = HEADER.contentY

export const START = { x: 1180, y: 800 }
export const TIMES = { riseSeconds: 0.8, sinkSeconds: 0.6, turretDelay: 0.3, shuffleSeconds: 0.32, pressWait: 0.16, slabCount: 3, slabFirst: 0.4, slabEvery: 0.55, slabFall: 0.2, slabSettle: 0.12, slabLie: 0.22, slabLift: 0.13, paperSlide: 0.5, bite: 0.4, tugFilm: 5.2 }
export const TUG = { stiff: 2600, damp: 36, strainPx: 50, shoulder: { x: 14, y: 30 }, hands: 52, rateLag: 0.07, reach: { rest: 78, min: 50, max: 150, bite: 190, haul: 260 } }
export const SPOT = { x: -12, y: -14 }
export const BITE = { x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h + 8 }
export const PILE = { x: SLOT.cx - 20, y: SLOT.cy + 64 }

export const FIRST = {
  before: [[2.3, 2.45, 2.6], [2.76, 2.9, 3.32], [3.45, 3.5, 3.8], [4.0, 4.05, 4.4], [4.55, 4.6, 4.9], [5.02, 5.08, 5.2], [5.3, 5.36, 6.34]] as [number, number, number][],
  after: [[7.44, 7.5, 7.72], [7.9, 7.95, 8.36], [8.5, 8.55, 8.75], [8.85, 8.9, 9.3]] as [number, number, number][],
  dodge: 3.3, duck: 4.4, cocky: 5.5, shock: [6.46, 7.24] as [number, number], thrown: { x: 260, y: -128 }
}
export const SLAB_LEAD = 0.05
export const DIVE = { start: 0, seconds: 0.14 }

const TUG_CURVE: [number, number, number, number][] = [
  [0, 0.05, 0.3, 14], [0.35, 0.22, 0.08, 8], [0.95, 0.16, -0.5, 44], [1.3, 0.36, -0.12, 10], [1.95, 0.3, 0.55, 46], [2.3, 0.5, 0.18, 10],
  [2.95, 0.44, -0.6, 48], [3.25, 0.63, -0.2, 10], [3.85, 0.58, 0.6, 50], [4.15, 0.77, 0.22, 12], [4.65, 0.73, -0.45, 46], [5.2, 0.95, 0, 6]
]

function tugAt(t: number, column: 1 | 2 | 3): number {
  if (t <= 0) return TUG_CURVE[0]![column]
  for (let i = 1; i < TUG_CURVE.length; i++) {
    const a = TUG_CURVE[i - 1]!
    const b = TUG_CURVE[i]!
    if (t <= b[0]) return a[column] + (b[column] - a[column]) * smooth((t - a[0]) / (b[0] - a[0]))
  }
  return TUG_CURVE[TUG_CURVE.length - 1]![column]
}

export const tugCurve = (t: number): number => tugAt(t, 1)

export const tugReach = (rate: number): number => Math.min(TUG.reach.max, Math.max(TUG.reach.min, TUG.reach.rest + rate * (rate > 0 ? TUG.reach.bite : TUG.reach.haul)))

export interface Cue { at: number; act?: Acting; react?: Reaction }

interface Way { t: number; x: number; y: number }

export interface Plan { ways: Way[]; clicks: [number, number][]; cues: Cue[]; drop: number; bite: number }

const keySpot = (seat: number): { x: number; y: number } => ({ x: seats[seat]!.cx + SPOT.x, y: seats[seat]!.cy + SPOT.y })

export function makePlan(seed: number, first: string, last: string, email: string): Plan {
  const ways: Way[] = []
  const clicks: [number, number][] = []
  const cues: Cue[] = []
  const go = (t: number, x: number, y: number) => ways.push({ t, x, y })
  const hold = (from: number, to: number, x: number, y: number) => {
    go(from, x, y)
    go(to, x, y)
  }
  const click = (t: number, seconds = 0.07) => clicks.push([t, t + seconds])
  const nameOf = (ch: string): string => (ch === '@' ? 'at' : ch === '.' ? 'dot' : ch === ' ' ? 'space' : ch.toLowerCase())
  const tap = (t: number, seat: number, lead = 0.1, stay = 0.08) => {
    const p = keySpot(seat)
    hold(t - lead, t + stay, p.x, p.y)
    click(t)
  }

  hold(0, 0.6, START.x, START.y)
  const fieldSpot = { x: FIELD_X + 150, y: FIELD_Y + 36 + config.scale.sizes.field / 2 }
  hold(1.0, 1.25, fieldSpot.x, fieldSpot.y)
  click(1.08)
  cues.push({ at: 0.55, act: 'confident' }, { at: 1.3, react: 'anticipate' }, { at: 2.35, react: 'doubleTake' })

  const firstKeys = [...first].map(nameOf)
  const enter = seatIndex.enter!
  const cockyAfter = Math.min(FIRST.before.length, firstKeys.length)
  const stand = (seat: number, from: number, at: number, to: number) => {
    const p = keySpot(seat)
    hold(from, to, p.x, p.y)
    click(at)
  }
  for (let i = 0; i < cockyAfter; i++) {
    const [from, at, to] = FIRST.before[i]!
    stand(seatIndex[firstKeys[i]!]!, from, at, to)
  }
  const cocky = keySpot(seatIndex[firstKeys[cockyAfter - 1]!]!)
  hold(FIRST.shock[0], FIRST.shock[1], cocky.x + FIRST.thrown.x, cocky.y + FIRST.thrown.y)
  cues.push({ at: FIRST.dodge, react: 'jump' }, { at: FIRST.duck, react: 'flinch' }, { at: FIRST.cocky, act: 'proud' }, { at: FIRST.cocky + 0.08, react: 'dustOff' })
  for (let i = cockyAfter - 1; i < firstKeys.length; i++) {
    const [from, at, to] = FIRST.after[Math.min(i - cockyAfter + 1, FIRST.after.length - 1)]!
    const late = Math.max(0, i - cockyAfter + 1 - (FIRST.after.length - 1)) * 0.5
    stand(seatIndex[firstKeys[i]!]!, from + late, at + late, to + late)
  }
  tap(9.8, enter, 0.25, 0.1)

  const rng = stream('step1:shuffle', seed)
  let places = homePlaces()
  let t = 10.3
  for (const ch of [...last].map(nameOf)) {
    tap(t, places[seatIndex[ch]!]!, 0.12, 0.06)
    places = shuffled(places, rng)
    t += 0.58
  }
  tap(14.78, enter, 0.12, 0.06)

  t = 15.15
  for (const ch of [...email].map(nameOf)) {
    tap(t, seatIndex[ch]!, 0.03, 0.03)
    t += 0.11
  }
  const submit = t + 0.02
  tap(submit, enter, 0.04, 0.04)
  const e = submit + SLAB_LEAD
  const spots = [keySpot(enter), keySpot(seatIndex.w!), keySpot(seatIndex.space!), keySpot(seatIndex.u!)]
  for (let n = 0; n < TIMES.slabCount; n++) {
    const from = spots[n]!
    const to = spots[n + 1]!
    const at = e + TIMES.slabFirst + n * TIMES.slabEvery
    go(at + DIVE.start, from.x, from.y)
    hold(at + DIVE.start + DIVE.seconds, at + TIMES.slabEvery - 0.1, to.x, to.y)
  }
  const grab = { x: PAPER_REST.x + PAPER.w - 62, y: PAPER_REST.y + 24 }
  const drop = 21.85
  hold(20.88, 21.02, grab.x, grab.y)
  clicks.push([20.95, drop])
  cues.push({ at: 20.95, react: 'anticipate' })
  hold(21.66, drop + 0.3, BITE.x + (grab.x - PAPER_REST.x), BITE.y + (grab.y - PAPER_REST.y))

  const bite = drop + TIMES.bite
  const end = bite + TIMES.tugFilm
  for (let at = bite + 0.15; at < end; at += 0.05) {
    const tau = at - bite
    const p = tugPoint(tau)
    go(at, p.x, p.y)
  }
  hold(end + 0.1, 30.95, PILE.x, PILE.y)
  hold(31.25, 33, PILE.x + 46, PILE.y + 30)
  ways.sort((a, b) => a.t - b.t)
  cues.sort((a, b) => a.at - b.at)
  return { ways, clicks, cues, drop, bite }
}

function tugPoint(tau: number): { x: number; y: number } {
  const amount = tugCurve(tau)
  const reach = tugReach((tugCurve(tau + 0.03) - tugCurve(tau - 0.03)) / 0.06)
  const lean = tugAt(tau, 2)
  const strain = tugAt(tau, 3) + 4 * Math.sin(tau * 23)
  const far = PAPER.h * (1 - amount) + strain * (1 + TUG.stiff / 480) + reach
  return { x: SLOT.cx - Math.sin(lean) * far - TUG.shoulder.x, y: SLOT.cy - Math.cos(lean) * far - TUG.shoulder.y }
}

export function pointerAt(plan: Plan, time: number): Pointer {
  const w = plan.ways
  let lo = 0
  let hi = w.length - 1
  if (time <= w[0]!.t) return { x: w[0]!.x, y: w[0]!.y, down: false }
  let x = w[hi]!.x
  let y = w[hi]!.y
  if (time < w[hi]!.t) {
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (w[mid]!.t <= time) lo = mid
      else hi = mid
    }
    const a = w[lo]!
    const b = w[hi]!
    const u = smooth((time - a.t) / Math.max(1e-6, b.t - a.t))
    x = a.x + (b.x - a.x) * u
    y = a.y + (b.y - a.y) * u
  }
  let down = false
  for (const c of plan.clicks) if (time >= c[0] && time < c[1]) down = true
  return { x, y, down }
}

const TUG_FRAME = { x: 130, y: 226, w: 960, h: 540 }

export function filmCamera(time: number): CameraPose {
  const home = homePose(0)
  const close = frame(TUG_FRAME)
  const u = smooth((time - 21.6) / 1.0) * (1 - smooth((time - 27.9) / 0.8))
  return u <= 0 ? home : mixPose(home, close, u)
}
