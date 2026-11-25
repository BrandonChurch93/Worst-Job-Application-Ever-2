import { config } from '../../config'
import { stream } from '../../core/random'
import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import { frame, homePose, mixPose, smooth } from '../../stage/camera'
import type { CameraPose, Pointer } from '../../stage/types'
import { DECK, homePlaces, seatIndex, seats, shuffled } from './keyboard'
import { FIELD_X, FIELD_Y, PAPER, PAPER_REST, SLOT, ZONE } from './layout'

const sizes = config.scale.sizes

export const START = { x: 1180, y: 800 }
export const TIMES = {
  riseSeconds: 0.8, sinkSeconds: 0.6, turretDelay: 0.72, shuffleSeconds: 0.32, pressWait: 0.16,
  slabCount: 3, slabFirst: 0.4, slabEvery: 0.55, slabHang: 0.2, slabFall: 0.2, slabSettle: 0.12, slabLie: 0.25, slabLift: 0.18,
  paperSlide: 0.42, bite: 0.4, tugFilm: 5.06, lost: 0.3
}
export const TUG = { stiff: 2600, damp: 36, strainPx: 9.6, lead: 0.4, shoulder: { x: 14, y: 30 }, hands: 31, rateLag: 0.07, inside: 4, least: 10, reach: { rest: 37, min: 31, max: 47, bite: 26, haul: 70 } }
export const SPOT = { x: -12, y: -14 }
export const BITE = { x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h + 3 }
export const HOOD = { y: SLOT.cy + 17, z: 26 }
export const FRINGE = { from: 0.12, step: 0.03, rate: 1.2, most: 0.34 }
export const PILE = { x: SLOT.cx - 20, y: SLOT.cy + 60 }
export const SHRED = { in: 0.3, gone: 0.46, strips: 0.12, pile: 0.64, pileSeconds: 1.14, empty: 0.92, emptySeconds: 0.84, zip: 1.78, zipSeconds: 1.0, end: 2.8 }

// The film's first name: every time is a second of the unit. The turrets are up at 3.52 and fire at 4.12, 4.57, 5.02, 5.47, 5.92, and so on.
// 6.0 is the frame of the approved image: the shot of 5.02 has just landed on L, the shot of 5.47 is a hand's width from the cursor, the shot of 5.92 has left the barrel, and the cursor has snapped out of the way to the row above, a key short of 5 (short), and holds there, still.
// It ducks flat and slides a key along, so the shot of 6.37 lands where it was. It stretches out of the duck, takes the pause for a win, and the shot of 6.82 hits it at 7.14: it is thrown across the board on to the bare deck by the right hatch and holds its shock there.
export const FIRST = {
  tap: 1.5,
  keys: [[2.18, 2.56], [2.64, 2.97], [3.06, 3.25], [3.86, 4.1], [4.16, 4.3]] as [number, number][],
  notice: 3.42, dodge: 3.86, cocky: [4.38, 4.6] as [number, number], proud: 4.7,
  stand: 'w', aside: -34, see: 5.46, flee: [5.62, 5.82] as [number, number], fled: '5', short: -64, past: 16, snap: 5.78, duck: 6.14, slide: [6.16, 6.28] as [number, number], smug: 6.62,
  panel: { x: -150, y: 20 }, shock: [7.18, 7.92] as [number, number], flight: 0.2,
  after: [[7.92, 8.0], [8.07, 8.3], [8.36, 8.54], [8.6, 8.86], [8.92, 9.1], [9.16, 9.32]] as [number, number][],
  enter: [9.4, 9.6] as [number, number]
}
// The last name: at each of the first hunts it pulls up off the keys on to the bare page above the deck (above), rears back there, and dives for the key where it is now.
export const LAST = { at: [10.3, 10.95, 11.55, 12.1, 12.62, 13.12, 13.62, 14.12], hunts: 3, above: -50, up: [0.08, 0.16] as [number, number], dive: [0.09, 0.09, 0.14], enter: [14.34, 14.6] as [number, number] }
// The email: one careful key, then it backs off it (wait, from the key) and waits there, nervous, for what the key will do. There is no bare place it can reach and leave again in the third of a second before the run without moving the time of a key.
export const MAIL = { first: 15.16, run: 15.5, every: 0.092, enter: 17.42, wait: { x: -44, y: -40 }, back: [15.2, 15.26] as [number, number] }
// The slabs: struck is how long after the click on Enter the key is struck, which is when the page starts to count.
// Where it goes from the slabs: clear on to the bare page above the deck, then into the corner of the Email field, where it stays.
export const DIVES = [{ x: 1100, y: 676 }, { x: 1716, y: FIELD_Y[2]! + 46 }]
export const DIVE = { struck: 0.06, see: 0.07, start: 0.2, seconds: 0.16, jolt: 0.06, duck: 0.03 }
export const TRUDGE = { x: 96, y: 84, seconds: 0.9 }
export const END = { start: 0.05, sag: 0.34 }
export const RESUME = { walk: [19.9, 20.3] as [number, number], proud: 20.4, beside: { x: 20, y: 6 }, grab: 21.06, hoist: [21.1, 21.16] as [number, number], carry: [21.18, 21.54] as [number, number], drop: 21.62 }

const TUG_CURVE: [number, number, number, number][] = [
  [0, 0.05, -0.2, 4], [0.3, 0.15, -0.14, 0], [0.8, 0.11, -0.4, 24], [1.05, 0.26, -0.12, 4], [1.55, 0.22, 0.36, 24], [1.8, 0.37, 0.1, 4], [2.3, 0.33, -0.4, 25],
  [2.6, 0.48, -0.1, 4], [2.95, 0.455, 0.42, 25], [3.2, 0.44, 0.44, 26], [3.5, 0.6, 0.12, 5], [4.0, 0.56, -0.36, 25], [4.3, 0.72, -0.1, 5], [4.6, 0.68, 0.22, 22], [5.06, 0.95, 0, 3]
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

  // step1.keyboard: set down, a strut straight to the field, a pull back, a decided tap, held, and when the page opens under it a sharp lean back, held
  const field = { x: FIELD_X + 152, y: FIELD_Y[0]! + 36 + sizes.field / 2 + 4 }
  cue(0.52, { act: 'confident' })
  to(1.0, 1.34, field.x, field.y, { arc: 30, ease: 'line' })
  cue(1.36, { react: 'tap' })
  to(1.37, 1.44, field.x + 10, field.y + 12, { ease: 'out' })
  to(1.45, 1.49, field.x, field.y, { ease: 'in' })
  click(FIRST.tap, 0.09)
  cue(1.66, { react: 'rear' })
  to(1.66, 1.76, field.x - 30, field.y - 26, { ease: 'out' })
  cue(2.1, { react: 'anticipate' })

  // step1.firstName: stomps, the turrets, a dodge, a leap clear, a cocky pause, a snap out of a shot's way (the frame of the approved image), a duck, a second pause, the hit, the shock, the rest of the name
  const keys = [...first].map(nameOf)
  const k = (i: number): number => seatIndex[keys[Math.min(i, keys.length - 1)]!]!
  const before = Math.min(FIRST.keys.length, keys.length)
  for (let i = 0; i < before; i++) {
    const [t0, t] = FIRST.keys[i]!
    stomp(t0, t, k(i), i === 3 ? { arc: 84 } : i === 4 ? { arc: 18 } : {})
    if (i === 2) {
      cue(FIRST.notice, { react: 'doubleTake' })
      cue(FIRST.notice + 0.1, { act: 'nervous' })
      cue(FIRST.dodge - 0.14, { react: 'anticipate' })
    }
  }
  const stand = { x: keySpot(seatIndex[FIRST.stand]!).x + FIRST.aside, y: keySpot(seatIndex[FIRST.stand]!).y }
  const fled = keySpot(seatIndex[FIRST.fled]!)
  const panel = { x: DECK.x + DECK.w + FIRST.panel.x, y: DECK.y + FIRST.panel.y }
  leap(FIRST.cocky[0], FIRST.cocky[1], stand.x, stand.y, { arc: 20 })
  cue(FIRST.proud, { act: 'proud' })
  cue(FIRST.proud + 0.06, { react: 'dustOff' })
  cue(FIRST.see, { react: 'anticipate' })
  cue(FIRST.see + 0.02, { act: 'plain' })
  leap(FIRST.flee[0], FIRST.flee[1], fled.x + FIRST.short, fled.y, { arc: 46, ease: 'smooth' })
  cue(FIRST.snap, { react: 'snap' })
  cue(FIRST.duck, { react: 'duck' })
  to(FIRST.slide[0], FIRST.slide[1], fled.x + FIRST.past, fled.y, { ease: 'out' })
  cue(FIRST.smug, { act: 'proud' })
  to(FIRST.shock[0], FIRST.shock[0] + FIRST.flight, panel.x, panel.y, { arc: 26, ease: 'out' })
  cue(FIRST.shock[1] - 0.1, { react: 'anticipate' })
  for (let i = before - 1; i < keys.length; i++) {
    const n = i - (before - 1)
    const slot = FIRST.after[Math.min(n, FIRST.after.length - 1)]!
    const late = Math.max(0, n - (FIRST.after.length - 1)) * 0.3
    stomp(slot[0] + late, slot[1] + late, k(i), n === 0 ? { arc: 30, ease: 'snap' } : {})
  }
  cue(FIRST.enter[0] - 0.08, { react: 'anticipate' })
  stomp(FIRST.enter[0], FIRST.enter[1], enter)
  cue(FIRST.enter[1] + 0.14, { act: 'confident' })
  cue(FIRST.enter[1] + 0.34, { react: 'dustOff' })

  // step1.lastName: the keys move, it pulls up off them on to the bare page, rears back, and dives for the letter where it is now. Then it stops looking and stomps
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
      const now = keySpot(places[key]!)
      leap(prev + LAST.up[0], prev + LAST.up[1], (old.x + now.x) / 2, DECK.y + LAST.above, { arc: 10, ease: 'out' })
      cue(prev + LAST.up[0] + 0.02, { react: i === 2 ? 'doubleTake' : 'rear' })
      const dive = LAST.dive[i - 1]!
      if (i === 3) cue(t - dive - 0.12, { react: 'anticipate' })
      stomp(t - dive, t, places[key]!, { arc: 14, ease: 'snap' })
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

  // step1.email: one careful key, a flinch, a step back and a nervous wait, nothing happens, then the whole address in one run and a proud Enter
  const mail = [...email].map(nameOf)
  const a = keySpot(seatIndex[mail[0]!]!)
  cue(LAST.enter[1] + 0.06, { act: 'nervous' })
  to(LAST.enter[1] + 0.1, MAIL.first - 0.18, a.x + 44, a.y - 30, { arc: 30 })
  to(MAIL.first - 0.12, MAIL.first - 0.02, a.x, a.y, { ease: 'out' })
  click(MAIL.first)
  cue(MAIL.first + 0.06, { react: 'flinch' })
  to(MAIL.back[0], MAIL.back[1], a.x + MAIL.wait.x, a.y + MAIL.wait.y, { ease: 'out' })
  cue(MAIL.run - 0.02, { act: 'confident' })
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
  // The slabs: a start at the first, a stretched leap clear of it on to the bare page, a jump as it lands, a cower as the second hangs over it, a second leap into the corner of the Email field, a jump as that one lands, a cower there as the third hangs, and a flat duck as it lands a hand away. It stays scared
  const slab = (n: number): number => submit + DIVE.struck + TIMES.slabFirst + n * TIMES.slabEvery
  const landed = TIMES.slabHang + TIMES.slabFall
  cue(slab(0) + DIVE.see, { react: 'startle' })
  cue(slab(0) + DIVE.start, { react: 'jump' })
  leap(slab(0) + DIVE.start, slab(0) + DIVE.start + DIVE.seconds, DIVES[0]!.x, DIVES[0]!.y, { arc: 44, ease: 'out', hop: false })
  cue(slab(0) + landed + DIVE.jolt, { react: 'startle' })
  cue(slab(1) + DIVE.see, { react: 'cower' })
  cue(slab(1) + DIVE.start, { react: 'jump' })
  leap(slab(1) + DIVE.start, slab(1) + DIVE.start + DIVE.seconds, DIVES[1]!.x, DIVES[1]!.y, { arc: 40, ease: 'out', hop: false })
  cue(slab(1) + landed + DIVE.jolt, { react: 'startle' })
  cue(slab(2) + DIVE.see, { react: 'cower' })
  cue(slab(2) + landed + DIVE.duck, { react: 'duck' })
  cue(slab(2) + landed + DIVE.duck, { act: 'scared' })

  // step1.resume: it walks to its paper, stands beside it proud and dusts itself off, and only then lifts it and carries it over
  const grab = { x: PAPER_REST.x + PAPER.w - 12, y: PAPER_REST.y + 8 }
  to(RESUME.walk[0], RESUME.walk[1], PAPER_REST.x + PAPER.w + RESUME.beside.x, PAPER_REST.y + RESUME.beside.y, { arc: -34 })
  cue(RESUME.proud, { act: 'proud' })
  cue(RESUME.proud + 0.02, { react: 'dustOff' })
  to(RESUME.grab - 0.14, RESUME.grab - 0.03, grab.x, grab.y, { ease: 'out' })
  cue(RESUME.grab - 0.1, { react: 'anticipate' })
  clicks.push([RESUME.grab, RESUME.drop])
  to(RESUME.hoist[0], RESUME.hoist[1], grab.x - 6, grab.y - 20, { ease: 'out' })
  to(RESUME.carry[0], RESUME.carry[1], BITE.x + (grab.x - PAPER_REST.x), BITE.y - 14 + (grab.y - PAPER_REST.y), { arc: 52 })

  // step1.tug: the paper's curve places the pointer, so the body leans, loses ground and wins a little of it back
  const bite = RESUME.drop + TIMES.bite
  const lost = bite + TIMES.tugFilm
  for (let at = bite + 0.15; at < lost; at += 0.05) {
    const p = tugPoint(at - bite)
    to(Math.max(free, at - 0.05), at, p.x, p.y, { ease: 'line' })
  }

  // step1.shredded: where it comes back together. It starts at what the form says, sags, and drags itself a little way off the slot, where it stays bent and low
  const whole = lost + TIMES.lost + SHRED.end
  to(lost + 0.1, lost + 0.2, PILE.x, PILE.y, { ease: 'out' })
  cue(whole + END.start, { react: 'startle' })
  cue(whole + END.sag, { act: 'exhausted' })
  to(whole + END.sag + 0.06, whole + END.sag + 0.06 + TRUDGE.seconds, PILE.x + TRUDGE.x, PILE.y + TRUDGE.y, { arc: -8, ease: 'out' })
  cues.sort((p, q) => p.at - q.at)
  return { moves, clicks, cues, drop: RESUME.drop, bite, lost }
}

function tugPoint(tau: number): { x: number; y: number } {
  const amount = tugCurve(tau)
  const reach = tugReach((tugCurve(tau + 0.03) - tugCurve(tau - 0.03)) / 0.06)
  const lean = tugAt(tau, 2)
  const strain = (tugAt(tau, 3) + 4 * Math.sin(tau * 23)) * TUG.lead
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

// The film camera in the tug: a window of the page for a moment. It eases from home to a wide frame for the shredder's arrival and the first grab, then pushes in once, with an ease, to a close frame on the cursor, its arms, the sheet and the mouth, and is there well before the key picture of 25.125. From the key picture it creeps closer and a little down as the sheet gets short, holds on the intake and the outlet while the cursor goes through and the strips drop, and only then pulls out. Its right edge stays left of the field column, so no word of that column is cut.
const TUG_EDGE = FIELD_X - 16
const TUG_FRAMES = { wide: 972, key: 620, close: 520, mid: SLOT.cx + 4, high: 250, top: SLOT.cy - 238, low: SLOT.cy - 180, end: SLOT.cy - 162 }
const tugFrame = (w: number, top: number): { x: number; y: number; w: number; h: number } => ({ x: Math.min(TUG_EDGE - w, TUG_FRAMES.mid - w / 2), y: top, w, h: (w * 9) / 16 })
export const CAMERA = { in: [21.1, 22.1] as [number, number], closer: [23.1, 24.4] as [number, number], key: 25.125, creep: [25.125, 27.0] as [number, number], down: [27.1, 27.8] as [number, number], out: [28.3, 29.1] as [number, number] }

export function filmCamera(time: number): CameraPose {
  const home = homePose(0)
  if (time <= CAMERA.in[0] || time >= CAMERA.out[1]) return home
  const closer = smooth((time - CAMERA.closer[0]) / (CAMERA.closer[1] - CAMERA.closer[0]))
  const creep = smooth((time - CAMERA.creep[0]) / (CAMERA.creep[1] - CAMERA.creep[0]))
  const w = TUG_FRAMES.wide + (TUG_FRAMES.key - TUG_FRAMES.wide) * closer + (TUG_FRAMES.close - TUG_FRAMES.key) * creep
  const down = smooth((time - CAMERA.down[0]) / (CAMERA.down[1] - CAMERA.down[0]))
  const top = TUG_FRAMES.high + (TUG_FRAMES.top - TUG_FRAMES.high) * closer + (TUG_FRAMES.low - TUG_FRAMES.top) * creep + (TUG_FRAMES.end - TUG_FRAMES.low) * down
  const u = smooth((time - CAMERA.in[0]) / (CAMERA.in[1] - CAMERA.in[0])) * (1 - smooth((time - CAMERA.out[0]) / (CAMERA.out[1] - CAMERA.out[0])))
  return mixPose(home, frame(tugFrame(w, top)), u)
}
