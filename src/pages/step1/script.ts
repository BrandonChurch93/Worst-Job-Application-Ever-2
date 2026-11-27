import { config } from '../../config'
import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import { smooth } from '../../stage/camera'
import type { Pointer } from '../../stage/types'
import { DECK, seatIndex, seats } from './keyboard'
import { FIELD_X, FIELD_Y } from './layout'
import { planResume, RESUME_TIMES, type MoveOptions } from './resume/script'

export { BITE, CAMERA, END, filmCamera, FRINGE, HOOD, PILE, raised, RESUME, SHRED, TEMPER, TRUDGE, TUG, tugCurve, tugReach } from './resume/script'

const sizes = config.scale.sizes

export const START = { x: 1180, y: 800 }
export const TIMES = {
  riseSeconds: 0.8, sinkSeconds: 0.6, turretDelay: 0.72, pressWait: 0.16,
  slabCount: 3, slabFirst: 0.4, slabEvery: 0.55, slabHang: 0.6, slabFall: 0.3, slabSettle: 0.12, slabLie: 0.25, slabLift: 0.18,
  ...RESUME_TIMES
}
export const SPOT = { x: -12, y: -14 }
// A stage change: the stage that is done stays for `out` seconds, the page is bare until `in`, and from then the next stage stands on it.
export const SWAP = { out: 0.3, in: 0.5 }

// The film's first name: every time is a second of the unit. The turrets are up at 3.52. The left one loads at 3.62 on the key the arrow stands on and fires at 4.32; the arrow has leapt clear and the blast lands on the empty key at 5.52.
// The arrow takes that for a win and stands proud. The right turret loads at 5.12, fires at 5.82, and the blast reaches the arrow at 6.82: it sees it late, is hit, is thrown and holds its shock, then types the rest of the name.
export const FIRST = {
  tap: 1.5,
  keys: [[2.18, 2.56], [2.64, 2.97], [3.06, 3.25], [3.86, 4.1], [4.16, 4.3]] as [number, number][],
  notice: 3.42, dodge: 3.86, cocky: [4.42, 4.58] as [number, number], proud: 4.7,
  stand: { x: 1072, y: 870 }, see: 6.5, hit: 6.82, up: 7.6,
  after: [[7.716, 8.0], [8.07, 8.3], [8.36, 8.54], [8.6, 8.86], [8.92, 9.1], [9.16, 9.32]] as [number, number][],
  enter: [9.4, 9.6] as [number, number]
}
// The Name stage ends and the Email stage comes up: a look at the bare page as the field goes, a walk up to the new field, a tap on it, and back down to the keys. `from` is the second it leaves the Enter key.
export const NEXT = { look: 0.42, walk: [0.9, 1.3] as [number, number], tap: 1.62, back: [2.3, 2.7] as [number, number], on: { x: 152, y: 4 } }
// The email: one careful key, then it backs off it (wait, from the key) and waits there, nervous, for what the key will do. There is no bare place it can reach and leave again in the third of a second before the run without moving the time of a key.
export const MAIL = { first: 14.66, run: 15, every: 0.092, enter: 16.92, wait: { x: 700, y: -46 }, back: [14.68, 14.74] as [number, number], go: 0.022, sure: 0.1 }
// The slabs: struck is how long after the click on Enter the key is struck, which is when the page starts to count.
// Where it goes from the slabs: clear on to the bare page above the deck, then into the corner of the Email field, where it stays.
export const DIVES = [{ x: 1100, y: 676 }, { x: 1716, y: 610 }]
export const DIVE = { struck: 0.06, doubt: 0.04, see: [0.14, 0.17], start: [0.56, 0.62], seconds: 0.16, jolt: 0.06, duck: 0.03 }
export const STRUT = { hop: 300, seconds: 0.17, past: { x: 12, y: -8 }, wind: 1.32, back: { x: -22, y: 18 }, rear: 1.64 }

export interface Cue { at: number; act?: Acting; react?: Reaction; hop?: number }

type Ease = NonNullable<MoveOptions['ease']>
const EASE: Record<Ease, (u: number) => number> = {
  smooth,
  line: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - (1 - u) ** 3,
  snap: (u) => 1 - (1 - u) ** 5,
  stomp: (u) => u * u * (2 - u)
}

interface Move { t0: number; t1: number; x0: number; y0: number; x1: number; y1: number; arc: number; side: number; ease: Ease }

export interface Plan { moves: Move[]; clicks: [number, number][]; cues: Cue[]; drop: number; bite: number; lost: number }

const keySpot = (seat: number): { x: number; y: number } => ({ x: seats[seat]!.cx + SPOT.x, y: seats[seat]!.cy + SPOT.y })

export function makePlan(first: string, email: string): Plan {
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

  // step1.keyboard: set down, one long strut hop straight to the field and past it, a squash where it lands, drawn back and up, a tap struck long into the field, a proud settle, and when the page opens under it it packs down small and laid back, held
  const field = { x: FIELD_X + NEXT.on.x, y: FIELD_Y + 36 + sizes.field / 2 + NEXT.on.y }
  cue(0.52, { act: 'confident' })
  cue(1.0, { hop: STRUT.hop })
  to(1.0, 1.0 + STRUT.seconds, field.x + STRUT.past.x, field.y + STRUT.past.y, { arc: 34, ease: 'out' })
  cue(STRUT.wind, { react: 'tap' })
  to(STRUT.wind + 0.01, STRUT.wind + 0.09, field.x + STRUT.back.x, field.y + STRUT.back.y, { ease: 'out' })
  to(1.45, 1.49, field.x, field.y, { ease: 'in' })
  click(FIRST.tap, 0.09)
  cue(STRUT.rear, { react: 'rear' })
  to(STRUT.rear, STRUT.rear + 0.08, field.x - 34, field.y - 30, { ease: 'out' })
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
  const stand = FIRST.stand
  leap(FIRST.cocky[0], FIRST.cocky[1], stand.x, stand.y, { arc: 20 })
  cue(FIRST.proud, { act: 'proud' })
  cue(FIRST.proud + 0.06, { react: 'dustOff' })
  cue(FIRST.see, { react: 'doubleTake' })
  cue(FIRST.up, { react: 'anticipate' })
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

  // The stage changes: the Name field goes and the Email field comes up. It looks at the bare page, walks up to the new field, taps it as it would any field, and comes back down to the keys
  const from = FIRST.enter[1]
  cue(from + NEXT.look, { react: 'doubleTake' })
  to(from + NEXT.walk[0], from + NEXT.walk[1], field.x, field.y, { arc: 40 })
  click(from + NEXT.tap, 0.09)
  cue(from + NEXT.tap + 0.02, { react: 'tap' })

  // step1.email: one careful key, a flinch, a step back and a nervous wait, nothing happens, then the whole address in one run and a proud Enter
  const mail = [...email].map(nameOf)
  const a = keySpot(seatIndex[mail[0]!]!)
  const bare = { x: DECK.x + MAIL.wait.x, y: DECK.y + MAIL.wait.y }
  cue(from + NEXT.back[0] - 0.06, { act: 'nervous' })
  to(from + NEXT.back[0], from + NEXT.back[1], a.x + 44, a.y - 30, { arc: 30 })
  to(MAIL.first - 0.12, MAIL.first - 0.02, a.x, a.y, { ease: 'out' })
  click(MAIL.first)
  cue(MAIL.back[0], { react: 'dart' })
  to(MAIL.back[0], MAIL.back[1], bare.x, bare.y, { ease: 'out' })
  cue(MAIL.run + MAIL.sure, { act: 'confident' })
  let t = MAIL.run
  for (let i = 1; i < mail.length; i++) {
    const p = keySpot(seatIndex[mail[i]!]!)
    to(t - (i === 1 ? MAIL.go : 0.07), t - 0.012, p.x, p.y, { arc: p.x === x && p.y === y ? 0 : 8 })
    click(t, 0.05)
    t += MAIL.every
  }
  const submit = Math.max(MAIL.enter, t + 0.1)
  cue(submit - 0.16, { react: 'anticipate' })
  stomp(submit - 0.12, submit, enter, { arc: 70 })
  cue(submit + DIVE.struck + DIVE.doubt, { act: 'nervous' })
  // The slabs: a start at the first, a stretched leap clear of it on to the bare page, a jump as it lands, a cower as the second hangs over it, a second leap into the corner of the Email field, a jump as that one lands, a cower there as the third hangs, and a flat duck as it lands a hand away. It stays scared
  const slab = (n: number): number => submit + DIVE.struck + TIMES.slabFirst + n * TIMES.slabEvery
  const landed = TIMES.slabHang + TIMES.slabFall
  cue(slab(0) + DIVE.see[0]!, { react: 'startle' })
  cue(slab(0) + DIVE.see[0]!, { act: 'scared' })
  cue(slab(0) + DIVE.start[0]!, { react: 'jump' })
  leap(slab(0) + DIVE.start[0]!, slab(0) + DIVE.start[0]! + DIVE.seconds, DIVES[0]!.x, DIVES[0]!.y, { arc: 44, ease: 'out', hop: false })
  cue(slab(0) + landed + DIVE.jolt, { react: 'cower' })
  cue(slab(1) + DIVE.see[1]!, { react: 'cower' })
  cue(slab(1) + DIVE.start[1]!, { react: 'jump' })
  leap(slab(1) + DIVE.start[1]!, slab(1) + DIVE.start[1]! + DIVE.seconds, DIVES[1]!.x, DIVES[1]!.y, { arc: 40, ease: 'out', hop: false })
  cue(slab(1) + landed + DIVE.jolt, { react: 'cower' })
  cue(slab(2) + DIVE.see[1]!, { react: 'cower' })
  cue(slab(2) + landed + DIVE.duck, { react: 'duck' })
  cue(slab(2) + landed + DIVE.duck, { act: 'scared' })

  const resume = planResume({ to, cue, hold: (t0, t1) => clicks.push([t0, t1]), free: () => free })
  cues.sort((p, q) => p.at - q.at)
  return { moves, clicks, cues, ...resume }
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
