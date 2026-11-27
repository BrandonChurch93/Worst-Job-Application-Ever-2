import { HANDOFF, type Acting, type Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'

// The opening of the film on the careers page, every number of it. `total` is the time from the first frame to the press of Apply at the
// bottom, when the button goes down. `line` is how long the narrator's line 1 runs: 22 words at 1.6 words a second. `after` is what the page
// has left after the press, the stage's turn into step 1 inside it. `key` is the moment of the key still, at the top with the arrow by the main button. `ramp` is how long the scroll takes to slow down or to pick up again.
// A setting holds at the top until `scrollFrom` and on its way down slows at the page's five places: for `hold` seconds the page goes at
// the share `slow` of its speed between stops (1 is no slowing). The fifth place is the bottom: the page stands there for its `hold`, which ends with the press.
export const OPENING = {
  use: 'B' as 'A' | 'B',
  total: 18,
  key: 2.4,
  line: 13.75,
  after: 1.25,
  ramp: 0.45,
  places: ['salary', 'badge', 'lol', 'ghosting', 'button'] as const,
  A: { scrollFrom: 13.75, stops: [{ hold: 0, slow: 1 }, { hold: 0, slow: 1 }, { hold: 0, slow: 1 }, { hold: 0, slow: 1 }, { hold: 1.55, slow: 0 }] },
  B: { scrollFrom: 3, stops: [{ hold: 1.3, slow: 0.12 }, { hold: 1, slow: 0.12 }, { hold: 1, slow: 0.12 }, { hold: 1, slow: 0.12 }, { hold: 1.55, slow: 0 }] }
}
export type Setting = 'A' | 'B'

const asked = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('opening')
export const SETTING: Setting = asked === 'a' || asked === 'A' ? 'A' : asked === 'b' || asked === 'B' ? 'B' : OPENING.use

// The press as the page plays it: the arrow hops onto the button's rim at `hop`, clicks at `click`, and its own run-up and jump end on the cap `lead` later, which is the press.
export const PRESS = { lead: 0.78, hop: 0.37, ready: 0.73, down: 0.15 }
export const PRESS_AT = OPENING.total - PRESS.lead
export const PRESS_FOR = PRESS.down
export const TURN_AT = OPENING.total + OPENING.after - 0.5

export interface Marks {
  start: { x: number; y: number }
  stand: { x: number; y: number }
  // Where the arrow is at each of the five places, and how far down the page is scrolled there, in px of the page.
  stops: { x: number; y: number; scroll: number }[]
  // The way from one place to the next, the first from `stand`: points of the page, each at the share `f` of the way that the scroll has gone.
  routes: { f: number; x: number; y: number }[][]
  perch: { x: number; y: number }
  press: { x: number; y: number }
}

type Ease = 'smooth' | 'line'
interface Key { t: number; x: number; y: number; e?: Ease }

interface Leg { from: number; to: number; t0: number; t1: number; va: number; vb: number }
export interface Plan {
  setting: Setting
  // The speed between stops, in px of the page a second.
  speed: number
  legs: Leg[]
  holds: { t0: number; t1: number; from: number; to: number }[]
  end: number
}

const G = (u: number): number => u * u * u - (u * u * u * u) / 2

// The scroll of one setting over the places: one speed between stops, eased down to each stop's share of it and up again.
export function planOf(setting: Setting, scrolls: number[]): Plan {
  const o = OPENING[setting]
  const r = OPENING.ramp
  const n = scrolls.length
  const slow = (k: number): number => (k < 0 || k === n - 1 ? 0 : o.stops[k]!.slow)
  const hold = (k: number): number => (k === n - 1 ? 0 : o.stops[k]!.hold)
  let held = 0
  let crept = 0
  let ramps = 0
  for (let k = 0; k < n; k++) {
    held += hold(k)
    crept += slow(k) * hold(k)
    ramps += ((2 - slow(k - 1) - slow(k)) * r) / 2
  }
  const speed = scrolls[n - 1]! / (OPENING.total - o.stops[n - 1]!.hold - o.scrollFrom - held - ramps + crept)
  const legs: Leg[] = []
  const holds: Plan['holds'] = []
  let t = o.scrollFrom
  let at = 0
  for (let k = 0; k < n; k++) {
    const creep = slow(k) * speed * hold(k)
    const to = scrolls[k]! - creep / 2
    const took = (to - at) / speed + ((2 - slow(k - 1) - slow(k)) * r) / 2
    legs.push({ from: at, to, t0: t, t1: t + took, va: slow(k - 1) * speed, vb: slow(k) * speed })
    t += took
    holds.push({ t0: t, t1: t + hold(k), from: to, to: to + creep })
    t += hold(k)
    at = to + creep
  }
  return { setting, speed, legs, holds, end: scrolls[n - 1]! }
}

function legAt(p: Plan, l: Leg, time: number): number {
  const ra = l.va < p.speed ? OPENING.ramp : 0
  const rb = l.vb < p.speed ? OPENING.ramp : 0
  const all = l.t1 - l.t0
  const t = time - l.t0
  const left = l.t1 - time
  if (all < ra + rb) {
    const u = t / all
    const d = l.to - l.from
    return l.from + (u * u * u - 2 * u * u + u) * l.va * all + (3 * u * u - 2 * u * u * u) * d + (u * u * u - u * u) * l.vb * all
  }
  if (t <= ra) return l.from + l.va * t + (p.speed - l.va) * ra * G(t / ra)
  if (left <= rb) return l.to - l.vb * left - (p.speed - l.vb) * rb * G(left / rb)
  return l.from + l.va * ra + (p.speed - l.va) * ra * 0.5 + p.speed * (t - ra)
}

// How far down the website the film has scrolled, in px, at each moment.
export function scrollAt(p: Plan, time: number): number {
  if (time <= p.legs[0]!.t0) return 0
  for (let k = 0; k < p.legs.length; k++) {
    const l = p.legs[k]!
    if (time < l.t1) return legAt(p, l, time)
    const h = p.holds[k]!
    if (time < h.t1) return h.from + ((h.to - h.from) * (time - h.t0)) / (h.t1 - h.t0)
  }
  return p.end
}

function routeAt(route: { f: number; x: number; y: number }[], f: number): { x: number; y: number } {
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!
    const b = route[i]!
    if (f > b.f) continue
    const u = (f - a.f) / (b.f - a.f)
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
  }
  const last = route[route.length - 1]!
  return { x: last.x, y: last.y }
}

// Where the arrow is on the page at each moment: it strolls to the main button, goes down the page with the scroll from place to place, and presses the last button.
export function pageAt(m: Marks, p: Plan, time: number): { x: number; y: number } {
  const first = p.legs[0]!
  if (time <= first.t0) return along([{ t: 0, ...m.start }, { t: 0.2, ...m.start }, { t: 1.3, x: m.stand.x - 16, y: m.stand.y, e: 'line' }, { t: 1.45, ...m.stand }], time)
  for (let k = 0; k < p.legs.length; k++) {
    const l = p.legs[k]!
    if (time < l.t1) return routeAt(m.routes[k]!, (legAt(p, l, time) - l.from) / (l.to - l.from))
    if (time < p.holds[k]!.t1) return m.stops[k]!
  }
  const last = m.stops[m.stops.length - 1]!
  return along([{ t: PRESS_AT - PRESS.hop, ...last }, { t: PRESS_AT - PRESS.hop + 0.04, ...m.perch }, { t: PRESS_AT - 0.02, ...m.perch }, { t: PRESS_AT, ...m.press }], time)
}

// The arrow comes back with the page. It is let down from the height of the hand-off from `from` to `down`, a little before the page
// lies flat at `lands`, the stage's half turn; `flat` is when it goes flat (`duck`), a moment before it touches. It gets up, stands, then
// takes half a step of `step` px aside, off the line above Apply for a Job, and stays leant from `lean` on.
export const LANDING = { lands: 0.5, from: 0.04, down: 0.25, flat: 0.22, lean: 1.24, step: 46, walk: 2.4 }

export function rejectedPath(m: Marks): Key[] {
  const leant = { x: HANDOFF.x - LANDING.step, y: HANDOFF.y }
  return [{ t: 0, x: HANDOFF.x, y: HANDOFF.y }, { t: LANDING.lean - 0.14, x: HANDOFF.x, y: HANDOFF.y }, { t: LANDING.lean + 0.02, ...leant, e: 'line' }, { t: LANDING.walk, ...leant }, { t: LANDING.walk + 0.85, ...m.stand }]
}

const ease = (u: number): number => u * u * (3 - 2 * u)

export function along(keys: Key[], time: number): { x: number; y: number } {
  const first = keys[0]!
  if (time <= first.t) return { x: first.x, y: first.y }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!
    const b = keys[i]!
    if (time > b.t) continue
    const t = (time - a.t) / (b.t - a.t)
    const u = b.e === 'line' ? t : ease(t)
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
  }
  const last = keys[keys.length - 1]!
  return { x: last.x, y: last.y }
}

// Where the arrow is on the screen; the stage adds how far the page has scrolled.
export function pointerAt(m: Marks, p: Plan, time: number, rejected: boolean): Pointer {
  if (rejected) return { ...along(rejectedPath(m), time), down: false }
  const at = pageAt(m, p, time)
  return { x: at.x, y: at.y - scrollAt(p, time), down: time >= PRESS_AT && time < PRESS_AT + PRESS_FOR }
}

export interface Cue { at: number; act?: Acting; react?: Reaction }

export const CUES: Cue[] = [
  { at: 0, act: 'confident' },
  { at: PRESS_AT - PRESS.ready, react: 'anticipate' },
  { at: PRESS_AT - PRESS.hop, react: 'jump' },
  { at: TURN_AT - 0.2, react: 'anticipate' },
  { at: TURN_AT + 0.16, act: 'shocked', react: 'startle' }
]

export const REJECTED_CUES: Cue[] = [{ at: 0, act: 'exhausted' }, { at: LANDING.flat, react: 'duck' }, { at: LANDING.lean, react: 'recoil' }]
