import { config } from '../../config'
import { stream } from '../../core/random'
import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import { frame, homePose, mixPose, smooth } from '../../stage/camera'
import type { CameraPose, Pointer } from '../../stage/types'
import { homePlaces, seatIndex, seats, shuffled } from './keyboard'
import { FIELD_X, FIELD_Y, PAPER, PAPER_REST, SLOT } from './layout'

const sizes = config.scale.sizes

export const START = { x: 1180, y: 800 }
export const TIMES = {
  riseSeconds: 0.8, sinkSeconds: 0.6, turretDelay: 0.22, shuffleSeconds: 0.32, pressWait: 0.16,
  slabCount: 3, slabFirst: 0.4, slabEvery: 0.55, slabHang: 0.2, slabFall: 0.2, slabSettle: 0.12, slabLie: 0.25, slabLift: 0.18,
  paperSlide: 0.42, bite: 0.4, tugFilm: 5.06, lost: 0.3
}
export const TUG = { stiff: 2600, damp: 36, strainPx: 24, shoulder: { x: 14, y: 30 }, hands: 64, rateLag: 0.07, inside: 34, least: 24, reach: { rest: 58, min: 42, max: 92, bite: 80, haul: 220 } }
export const SPOT = { x: -12, y: -14 }
export const BITE = { x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h + 8 }
export const HOOD = { y: SLOT.cy + 44, z: 8 }
export const PILE = { x: SLOT.cx - 20, y: SLOT.cy + 118 }
export const SHRED = { in: 0.3, gone: 0.34, strips: 0.12, pile: 0.78, pileSeconds: 1.0, empty: 1.3, emptySeconds: 0.5, zip: 1.78, zipSeconds: 1.0, end: 2.8 }

// The film's first name: every time is a second of the unit. The turrets are up at 3.02 and fire at 3.62, 4.07, 4.52, 4.97, 5.42, 5.87, and so on.
// The shot of 5.42 is aimed while the cursor stands proud and hits it at 5.89, so 6.0, the frame of the approved image, has the burn, the recoil and the next bolt in the air.
// It scrambles clear from 6.02, and the shot of 5.87 lands where it stood.
export const FIRST = {
  tap: 1.5,
  keys: [[2.18, 2.56], [2.64, 2.97], [3.06, 3.25], [3.7, 4.05], [4.28, 4.4]] as [number, number][],
  notice: 3.34, dodge: 3.7, duck: 4.08, cocky: [4.44, 4.64] as [number, number], proud: 4.74,
  stand: { x: 972, y: 826 }, thrown: { x: 196, y: -84 }, shock: [6.02, 6.7] as [number, number],
  after: [[6.7, 6.92], [7.0, 7.32], [7.42, 7.62], [7.72, 8.0], [8.1, 8.3], [8.38, 8.56]] as [number, number][],
  enter: [8.68, 8.9] as [number, number]
}
export const LAST = { at: [10.3, 10.95, 11.55, 12.1, 12.62, 13.12, 13.62, 14.12], hunts: 3, enter: [14.34, 14.6] as [number, number] }
export const MAIL = { first: 15.16, run: 15.5, every: 0.092, enter: 17.42 }
export const DIVES = [{ x: 1088, y: 816 }, { x: 744, y: 944 }, { x: 940, y: 668 }]
export const DIVE = { see: 0.05, start: 0.22, seconds: 0.16 }
export const TRUDGE = { x: 150, y: -110, seconds: 1.0 }
export const RESUME = { look: 19.9, walk: [20.3, 20.72] as [number, number], grab: 20.92, hoist: [20.98, 21.06] as [number, number], carry: [21.1, 21.54] as [number, number], drop: 21.62 }

const TUG_CURVE: [number, number, number, number][] = [
  [0, 0.05, -0.26, 4], [0.3, 0.15, -0.2, 4], [0.8, 0.11, -0.32, 22], [1.05, 0.26, -0.12, 5], [1.55, 0.22, 0.28, 23], [1.8, 0.37, 0.1, 5], [2.3, 0.33, -0.3, 24],
  [2.6, 0.48, -0.1, 5], [3.2, 0.44, 0.32, 24], [3.5, 0.6, 0.12, 6], [4.0, 0.56, -0.3, 24], [4.3, 0.72, -0.1, 6], [4.6, 0.68, 0.2, 22], [5.06, 0.95, 0, 3]
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

export interface Cue { at: number; act?: Acting; react?: Reaction; hop?: number }

type Ease = 'smooth' | 'line' | 'in' | 'out' | 'snap' | 'stomp'
const EASE: Record<Ease, (u: number) => number> = {
  smooth,
  line: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - (1 - u) ** 3,
  snap: (u) => 1 - (1 - u) ** 5,
  stomp: (u) => u * u * (2 - u)
}

interface Move { t0: number; t1: number; x0: number; y0: number; x1: number; y1: number; arc: number; side: number; ease: Ease }
interface MoveOptions { arc?: number; side?: number; ease?: Ease; hop?: boolean }

export interface Plan { moves: Move[]; clicks: [number, number][]; cues: Cue[]; drop: number; bite: number; lost: number }

const keySpot = (seat: number): { x: number; y: number } => ({ x: seats[seat]!.cx + SPOT.x, y: seats[seat]!.cy + SPOT.y })

export function makePlan(seed: number, first: string, last: string, email: string): Plan {
  const moves: Move[] = []
  const clicks: [number, number][] = []
  const cues: Cue[] = []
  let x = HANDOFF.x
  let y = HANDOFF.y
  let free = 0
  const to = (t0: number, t1: number, tx: number, ty: number, o: MoveOptions = {}) => {
    if (t0 < free - 1e-6 || t1 <= t0) throw new Error(`step 1 script: the move at ${t0} to ${t1} starts before ${free}`)
    moves.push({ t0, t1, x0: x, y0: y, x1: tx, y1: ty, arc: o.arc ?? 0, side: o.side ?? 0, ease: o.ease ?? 'smooth' })
    x = tx
    y = ty
    free = t1
  }
  const cue = (at: number, c: Omit<Cue, 'at'>) => cues.push({ at, ...c })
  const click = (t: number, seconds = 0.07) => clicks.push([t, t + seconds])
  // A leap: off the ground at t0, down at t1, over an arc that bulges up the screen.
  const leap = (t0: number, t1: number, tx: number, ty: number, o: MoveOptions = {}) => {
    const far = Math.hypot(tx - x, ty - y)
    if (o.hop !== false) cue(t0, { hop: 1200 * (t1 - t0 + 0.05) })
    to(t0, t1, tx, ty, { arc: o.arc ?? Math.min(84, 12 + far * 0.13), side: o.side ?? 0, ease: o.ease ?? 'stomp' })
  }
  const stomp = (t0: number, t: number, seat: number, o: MoveOptions = {}) => {
    const p = keySpot(seat)
    leap(t0, t - 0.02, p.x, p.y, o)
    click(t)
  }
  const nameOf = (ch: string): string => (ch === '@' ? 'at' : ch === '.' ? 'dot' : ch === ' ' ? 'space' : ch.toLowerCase())
  const enter = seatIndex.enter!

  // step1.keyboard: set down, a strut to the field, a tap, and the page opens under it
  const field = { x: FIELD_X + 152, y: FIELD_Y[0]! + 36 + sizes.field / 2 + 4 }
  cue(0.52, { act: 'confident' })
  to(1.02, 1.36, field.x, field.y, { arc: 44 })
  cue(1.38, { react: 'anticipate' })
  click(FIRST.tap, 0.09)
  to(1.62, 1.8, field.x - 26, field.y - 20, { ease: 'out' })
  cue(1.66, { react: 'doubleTake' })
  to(2.02, 2.14, field.x - 36, field.y - 34)
  cue(2.04, { react: 'anticipate' })

  // step1.firstName: stomps, the turrets, a dodge, a duck, a cocky pause, the hit, the shock, the rest of the name
  const keys = [...first].map(nameOf)
  const k = (i: number): number => seatIndex[keys[Math.min(i, keys.length - 1)]!]!
  const before = Math.min(FIRST.keys.length, keys.length)
  for (let i = 0; i < before; i++) {
    const [t0, t] = FIRST.keys[i]!
    stomp(t0, t, k(i), i === 3 ? { arc: 84 } : i === 4 ? { arc: 18 } : {})
    if (i === 2) {
      cue(FIRST.notice, { react: 'doubleTake' })
      cue(FIRST.notice + 0.1, { act: 'nervous' })
      cue(FIRST.dodge - 0.1, { react: 'anticipate' })
    }
    if (i === 3) {
      const p = keySpot(k(3))
      cue(FIRST.duck, { react: 'flinch' })
      to(FIRST.duck, FIRST.duck + 0.1, p.x - 10, p.y + 12, { ease: 'out' })
    }
  }
  leap(FIRST.cocky[0], FIRST.cocky[1], FIRST.stand.x, FIRST.stand.y, { arc: 40 })
  cue(FIRST.proud, { act: 'proud' })
  cue(FIRST.proud + 0.06, { react: 'dustOff' })
  to(FIRST.shock[0], FIRST.shock[0] + 0.16, FIRST.stand.x + FIRST.thrown.x, FIRST.stand.y + FIRST.thrown.y, { arc: 20, ease: 'out' })
  cue(FIRST.shock[1] - 0.08, { react: 'flinch' })
  for (let i = before - 1; i < keys.length; i++) {
    const n = i - (before - 1)
    const slot = FIRST.after[Math.min(n, FIRST.after.length - 1)]!
    const late = Math.max(0, n - (FIRST.after.length - 1)) * 0.3
    stomp(slot[0] + late, slot[1] + late, k(i), n === 0 ? { arc: 30 } : {})
  }
  cue(FIRST.enter[0] - 0.08, { react: 'anticipate' })
  stomp(FIRST.enter[0], FIRST.enter[1], enter)
  cue(FIRST.enter[1] + 0.14, { act: 'confident' })
  cue(FIRST.enter[1] + 0.34, { react: 'dustOff' })

  // step1.lastName: it goes where the letter was, finds it gone, and lands on it where it is now. Then it stops looking and stomps
  const rng = stream('step1:shuffle', seed)
  let places = homePlaces()
  let was = places
  const lastKeys = [...last].map(nameOf)
  lastKeys.forEach((ch, i) => {
    const t = LAST.at[i] ?? LAST.at[LAST.at.length - 1]! + (i - LAST.at.length + 1) * 0.5
    const key = seatIndex[ch]!
    const prev = i === 0 ? 0 : (LAST.at[i - 1] ?? t - 0.5)
    if (i === 0) stomp(t - 0.34, t, places[key]!)
    else if (i <= LAST.hunts) {
      const old = keySpot(was[key]!)
      leap(prev + 0.16, prev + 0.34, old.x, old.y, { arc: 22, ease: 'smooth' })
      cue(prev + 0.36, { react: i === 1 ? 'doubleTake' : 'flinch' })
      stomp(t - 0.2, t, places[key]!)
    } else {
      cue(prev + 0.12, { react: 'flinch' })
      stomp(t - 0.26, t, places[key]!, { arc: 46 + i * 5 })
    }
    if (i === LAST.hunts) cue(t + 0.2, { act: 'angry' })
    was = places
    places = shuffled(places, rng)
  })
  cue(LAST.enter[0] - 0.1, { react: 'anticipate' })
  stomp(LAST.enter[0], LAST.enter[1], enter, { arc: 84 })

  // step1.email: one careful key, nothing happens, then the whole address in one run and a proud Enter
  const mail = [...email].map(nameOf)
  const a = keySpot(seatIndex[mail[0]!]!)
  cue(LAST.enter[1] + 0.08, { act: 'nervous' })
  to(LAST.enter[1] + 0.1, MAIL.first - 0.18, a.x + 44, a.y - 30, { arc: 30 })
  to(MAIL.first - 0.12, MAIL.first - 0.02, a.x, a.y, { ease: 'out' })
  click(MAIL.first)
  cue(MAIL.first + 0.06, { react: 'flinch' })
  cue(MAIL.run - 0.1, { act: 'confident' })
  let t = MAIL.run
  for (let i = 1; i < mail.length; i++) {
    const p = keySpot(seatIndex[mail[i]!]!)
    to(t - 0.07, t - 0.012, p.x, p.y, { arc: p.x === x && p.y === y ? 0 : 8 })
    click(t, 0.05)
    t += MAIL.every
  }
  const submit = Math.max(MAIL.enter, t + 0.1)
  cue(submit - 0.16, { react: 'anticipate' })
  stomp(submit - 0.12, submit, enter, { arc: 70 })
  cue(submit + 0.05, { act: 'proud' })
  cue(submit + 0.1, { react: 'dustOff' })
  for (let n = 0; n < TIMES.slabCount; n++) {
    const at = submit + TIMES.slabFirst + n * TIMES.slabEvery
    const d = DIVES[n % DIVES.length]!
    cue(at + DIVE.see, { react: 'doubleTake' })
    cue(at + DIVE.start, { react: 'jump' })
    to(at + DIVE.start, at + DIVE.start + DIVE.seconds, d.x, d.y, { arc: 36, ease: 'out' })
  }

  // step1.resume: it watches the keyboard go, fetches its paper and carries it over
  const grab = { x: PAPER_REST.x + PAPER.w - 62, y: PAPER_REST.y + 24 }
  cue(RESUME.look, { react: 'dustOff' })
  to(RESUME.walk[0], RESUME.walk[1], grab.x, grab.y, { arc: -34 })
  cue(RESUME.grab - 0.06, { react: 'anticipate' })
  clicks.push([RESUME.grab, RESUME.drop])
  to(RESUME.hoist[0], RESUME.hoist[1], grab.x - 8, grab.y - 26, { ease: 'out' })
  to(RESUME.carry[0], RESUME.carry[1], BITE.x + (grab.x - PAPER_REST.x), BITE.y + (grab.y - PAPER_REST.y), { arc: 52 })

  // step1.tug: the paper's curve places the pointer, so the body leans, loses ground and wins a little of it back
  const bite = RESUME.drop + TIMES.bite
  const lost = bite + TIMES.tugFilm
  for (let at = bite + 0.15; at < lost; at += 0.05) {
    const p = tugPoint(at - bite)
    to(Math.max(free, at - 0.05), at, p.x, p.y, { ease: 'line' })
  }

  // step1.shredded: where it comes back together, and a tired drag toward the form it has to fill in again
  const whole = lost + TIMES.lost + SHRED.end
  to(lost + 0.1, lost + 0.2, PILE.x, PILE.y, { ease: 'out' })
  cue(whole + 0.06, { react: 'doubleTake' })
  cue(whole + 0.4, { act: 'exhausted' })
  to(whole + 0.4, whole + 0.4 + TRUDGE.seconds, PILE.x + TRUDGE.x, PILE.y + TRUDGE.y, { arc: -10 })
  cues.sort((p, q) => p.at - q.at)
  return { moves, clicks, cues, drop: RESUME.drop, bite, lost }
}

function tugPoint(tau: number): { x: number; y: number } {
  const amount = tugCurve(tau)
  const reach = tugReach((tugCurve(tau + 0.03) - tugCurve(tau - 0.03)) / 0.06)
  const lean = tugAt(tau, 2)
  const strain = tugAt(tau, 3) + 4 * Math.sin(tau * 23)
  const far = Math.max(TUG.least, PAPER.h * (1 - amount) - TUG.inside) + strain * (1 + TUG.stiff / 480) + reach
  return { x: SLOT.cx - Math.sin(lean) * far - TUG.shoulder.x, y: SLOT.cy - Math.cos(lean) * far - TUG.shoulder.y }
}

export function pointerAt(plan: Plan, time: number): Pointer {
  const m = plan.moves
  let down = false
  for (const c of plan.clicks) if (time >= c[0] && time < c[1]) down = true
  if (!m.length || time <= m[0]!.t0) return { x: m.length ? m[0]!.x0 : HANDOFF.x, y: m.length ? m[0]!.y0 : HANDOFF.y, down }
  let lo = 0
  let hi = m.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (m[mid]!.t0 <= time) lo = mid
    else hi = mid - 1
  }
  const s = m[lo]!
  if (time >= s.t1) return { x: s.x1, y: s.y1, down }
  const u = EASE[s.ease]((time - s.t0) / (s.t1 - s.t0))
  const bulge = 4 * u * (1 - u)
  return { x: s.x0 + (s.x1 - s.x0) * u + s.side * bulge, y: s.y0 + (s.y1 - s.y0) * u - s.arc * bulge, down }
}

const TUG_WIDE = { x: 26, y: 150, w: 1200, h: 675 }
const TUG_CLOSE = { x: 126, y: 356, w: 1000, h: 562.5 }
export const CAMERA = { in: [21.1, 22.1] as [number, number], push: 4.6, out: [27.6, 28.9] as [number, number] }

export function filmCamera(time: number): CameraPose {
  const home = homePose(0)
  if (time <= CAMERA.in[0] || time >= CAMERA.out[1]) return home
  const close = mixPose(frame(TUG_WIDE), frame(TUG_CLOSE), smooth((time - CAMERA.in[1]) / CAMERA.push))
  const u = smooth((time - CAMERA.in[0]) / (CAMERA.in[1] - CAMERA.in[0])) * (1 - smooth((time - CAMERA.out[0]) / (CAMERA.out[1] - CAMERA.out[0])))
  return mixPose(home, close, u)
}
