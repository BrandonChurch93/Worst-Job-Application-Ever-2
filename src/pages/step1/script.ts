import { config } from '../../config'
import { stream } from '../../core/random'
import type { Acting, Reaction } from '../../cursor/body'
import { frame, homePose, mixPose, smooth } from '../../stage/camera'
import type { CameraPose, Pointer } from '../../stage/types'
import { homePlaces, seatIndex, seats, shuffled } from './keyboard'
import { FIELD_PITCH, FIELD_X, PAPER, PAPER_REST, SLOT } from './layout'
import { HEADER } from '../../shell/parts'

const FIELD_Y = HEADER.contentY

export const START = { x: 960, y: 560 }
export const TIMES = { riseSeconds: 0.8, sinkSeconds: 0.6, turretDelay: 0.3, shuffleSeconds: 0.32, pressWait: 0.16, slabFirst: 0.4, slabEvery: 0.55, slabFall: 0.22, slabLie: 0.2, slabLift: 0.13, paperSlide: 0.5, bite: 0.4, tugFilm: 6.6 }
export const TUG = { stiff: 2600, damp: 36, strainPx: 50, grip: { x: 18, y: 78 }, reach: 320 }
export const SPOT = { x: -12, y: -14 }
export const BITE = { x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h + 8 }
export const PILE = { x: SLOT.cx - 20, y: SLOT.cy + 64 }

const TUG_CURVE: [number, number][] = [[0, 0.06], [0.9, 0.2], [1.6, 0.13], [2.6, 0.33], [3.2, 0.26], [4.2, 0.48], [4.7, 0.42], [5.6, 0.68], [5.9, 0.66], [6.6, 0.93]]

export function tugCurve(t: number): number {
  if (t <= 0) return TUG_CURVE[0]![1]
  for (let i = 1; i < TUG_CURVE.length; i++) {
    const a = TUG_CURVE[i - 1]!
    const b = TUG_CURVE[i]!
    if (t <= b[0]) return a[1] + (b[1] - a[1]) * smooth((t - a[0]) / (b[0] - a[0]))
  }
  return TUG_CURVE[TUG_CURVE.length - 1]![1]
}

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
  const cockyAfter = Math.min(7, firstKeys.length)
  let t = 2.45
  for (let i = 0; i < cockyAfter; i++) {
    tap(t, seatIndex[firstKeys[i]!]!)
    t += 0.5
  }
  const cocky = keySpot(seatIndex[firstKeys[cockyAfter - 1]!]!)
  hold(t - 0.3, 6.62, cocky.x, cocky.y)
  cues.push({ at: 5.62, act: 'proud' }, { at: 5.7, react: 'dustOff' })
  go(6.95, cocky.x - 150, cocky.y - 70)
  go(7.2, cocky.x - 150, cocky.y - 70)
  cues.push({ at: 7.3, act: 'nervous' })
  t = 7.5
  for (let i = cockyAfter - 1; i < firstKeys.length; i++) {
    tap(t, seatIndex[firstKeys[i]!]!)
    t += 0.45
  }
  const enter = seatIndex.enter!
  tap(9.8, enter, 0.25, 0.1)

  const rng = stream('step1:shuffle', seed)
  let places = homePlaces()
  t = 10.3
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
  const e = submit + 0.1
  const fy = FIELD_Y + 2 * FIELD_PITCH + 36 + config.scale.sizes.field / 2
  hold(e + 0.28, e + 0.42, 1560, fy)
  hold(e + 0.58, e + 0.75, 1500, 780)
  hold(e + 0.85, e + 0.97, 1300, fy)
  hold(e + 1.13, e + 1.3, 1260, 780)
  hold(e + 1.45, e + 2.3, 1420, 800)

  const grab = { x: PAPER_REST.x + PAPER.w / 2 - 15, y: PAPER_REST.y + 27 }
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
  const before = tugCurve(tau - 0.12)
  const gaining = amount < before
  const lean = 0.3 + 0.16 * Math.sin(tau * 1.3) + (gaining ? 0.08 : 0)
  const strain = 16 + 9 * Math.sin(tau * 6.1) + (gaining ? 22 : 0) + (amount > 0.6 ? 10 : 0)
  const rest = PAPER.h * (1 - amount)
  const far = rest + strain * (1 + TUG.stiff / 480)
  return { x: SLOT.cx - Math.sin(lean) * far - TUG.grip.x, y: SLOT.cy - Math.cos(lean) * far - TUG.grip.y }
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

const TUG_FRAME = { x: 160, y: 238, w: 880, h: 495 }

export function filmCamera(time: number): CameraPose {
  const home = homePose(0)
  const close = frame(TUG_FRAME)
  const u = smooth((time - 21.6) / 1.0) * (1 - smooth((time - 29.2) / 0.9))
  return u <= 0 ? home : mixPose(home, close, u)
}
