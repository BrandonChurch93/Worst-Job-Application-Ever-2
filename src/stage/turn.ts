const QUARTER = Math.PI / 2
const DEG = Math.PI / 180

// `land` is the share of the speed of the hand over that the slab still has when it meets its seat: it falls into the seat, it does not coast into it.
// `held` is how long the slab lies pressed flat in the seat before it springs back, as a share of the arriving half of the turn: two frames of the film, so a picture taken every other frame holds the slab flat once.
// `knocks` are how far the slab springs back off the seat, and for how long, as shares of the arriving half of the turn.
// `back` is how fast the slab leans back on its first step, as an angle per wind-up: it is at the lean's deepest by the first frame and held there for the second.
// `start` is the share of the quarter turn the swing would cover at the speed it starts with. The lean's way back is at that speed when the slab passes flat, so the wind-up runs into the swing and nothing stalls between the two.
export const TURN = {
  windUp: 0.12,
  lean: 1.6 * DEG,
  back: 8 * DEG,
  start: 0.264,
  power: 2.2,
  seat: 0.6,
  land: 1.2,
  held: 2 / 30,
  knocks: [
    { size: 8 * DEG, lasts: 4 / 30 },
    { size: 2 * DEG, lasts: 3 / 30 }
  ]
} as const

const clamp01 = (u: number) => Math.min(1, Math.max(0, u))

export function leaveTurn(u: number): number {
  const t = clamp01(u)
  if (t <= 0) return 0
  if (t < TURN.windUp) {
    const s = t / TURN.windUp
    const out = (QUARTER * TURN.start * TURN.windUp) / (1 - TURN.windUp)
    return s * (s - 1) * ((out - TURN.back) * s + TURN.back)
  }
  const s = (t - TURN.windUp) / (1 - TURN.windUp)
  const bend = (TURN.power - TURN.start) / (1 - TURN.start)
  return QUARTER * (TURN.start * s + (1 - TURN.start) * Math.pow(s, bend))
}

// How far the lights go round a slab whose face is turning from the key, for the slab's angle. In full the key, which stands 22 degrees over the page, would leave the face at 31 degrees,
// when the tilt can hardly be read yet. So they go round by next to nothing while the slab starts, never by more than the slab has turned, and by `most` at the end:
// the face keeps its light while it tips, loses it evenly as it swings, and is out of the key at 56 degrees.
export const LIGHT = { most: 36 * DEG, over: 40 * DEG } as const

export const leaveLight = (angle: number): number => (angle <= 0 ? angle : LIGHT.most * (1 - Math.exp(-((angle / LIGHT.over) ** 2))))

export function leaveSpeed(): number {
  return (QUARTER * TURN.power) / (1 - TURN.windUp)
}

export function arriveTurn(u: number): number {
  const t = clamp01(u)
  if (t < TURN.seat) {
    // The speed over the way in is `enter - bend * w * (1 - w) - drop * w` quarter turns: it eases as the slab comes over and picks up again as it falls into the seat.
    const w = t / TURN.seat
    const enter = (leaveSpeed() * TURN.seat) / QUARTER
    const drop = enter * (1 - TURN.land)
    const bend = 6 * (enter - 1) - 3 * drop
    return -QUARTER * (1 - enter * w + bend * (w * w / 2 - (w * w * w) / 3) + (drop * w * w) / 2)
  }
  if (t < TURN.seat + TURN.held) return 0
  let from = TURN.seat + TURN.held
  for (const k of TURN.knocks) {
    if (t < from + k.lasts) {
      const s = (t - from) / k.lasts
      return -k.size * 4 * s * (1 - s)
    }
    from += k.lasts
  }
  return 0
}

export function seatedAt(): number {
  return TURN.seat
}

// The hop of what stands loose on the page, from the step of the seat: `hop` and `slide` in page units, bounces of `beat` seconds, each under a fifth of the one before, and the foot of the page `spread` seconds after its head. The third is too small to see: what can be seen is over when the last knock is.
export const SHIVER = { hop: 26, slide: 8, beat: 1 / 15, fade: 0.04, beats: 3, loose: 0.5, spread: 1 / 60 } as const

const shiverLasts = SHIVER.beat * SHIVER.beats

export const shiverSeconds = shiverLasts + SHIVER.spread

const swing = (seconds: number): number => (seconds > 0 && seconds < shiverLasts ? Math.exp(-seconds / SHIVER.fade) * Math.sin((Math.PI * seconds) / SHIVER.beat) : 0)

export const shiverAt = (seconds: number): number => SHIVER.hop * Math.abs(swing(seconds))

export const rattleAt = (seconds: number): number => SHIVER.slide * swing(seconds)

// The jolt of the view on the step of the seat: the camera is knocked `push` of its distance toward the slab and `rise` page units down, so the picture swells from its lower edge, and it is back in `lasts` seconds without going past where it stood.
export const JOLT = { push: 0.01, rise: 4.9, lasts: 5 / 60 } as const

export const joltAt = (seconds: number): number => (seconds >= 0 && seconds < JOLT.lasts ? (1 - seconds / JOLT.lasts) ** 2 : 0)

export const shiverDelay = (down: number): number => SHIVER.spread * Math.min(1, Math.max(0, down))

// What a thing shivers with: the lowest loose thing under its middle that it stands on, or else itself.
// Type that is set on a card then hops with the card and never sinks into it, and a box on a card never leaves it.
export function shiverBase<T extends { kind: string; x: number; y: number; w: number; h: number; z0: number; z1: number; pocket?: boolean }>(list: readonly T[], s: T): T {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const foot = s.kind === 'text' ? s.z1 : s.z0
  let base = s
  for (const u of list) {
    if (u === s || u.kind === 'text' || u.kind === 'well' || u.kind === 'anchor' || u.pocket === true) continue
    if (u.z1 <= SHIVER.loose || u.z1 > foot + 0.75) continue
    if (cx < u.x || cx > u.x + u.w || cy < u.y || cy > u.y + u.h) continue
    if (base === s || u.z0 < base.z0) base = u
  }
  return base
}

// The wait before a page turn of the live site: a turn that is free to start is held while the next page is not ready, for at most `steps` steps, and the cursor taps its tip every `every` steps. A page whose code has not arrived cannot be stepped at all, so `code` holds the turn for as long as it says false. Nobody sets the wait for a film, a still, a stepped run or a bot in the harness, so nothing waits there.
export interface TurnWait {
  ready(page: string): boolean
  code?(page: string): boolean
  steps: number
  every: number
}

// Seconds from one tap of the tip to the next: the tap itself lasts 0.42 s.
export const WAIT_TAP_SECONDS = 0.6

let wait: TurnWait | null = null
const waited = new WeakMap<object, number>()

export function setTurnWait(w: TurnWait | null): void {
  wait = w
}

// Asked on every step a turn could start. True holds the turn for this step. `stage` names whose wait it is.
export function holdsTurn(stage: object, next: string | undefined, tap: () => void): boolean {
  if (!wait || next === undefined) return false
  const n = waited.get(stage) ?? 0
  const can = wait.code ? wait.code(next) : true
  if (can && (n >= wait.steps || wait.ready(next))) {
    waited.delete(stage)
    return false
  }
  if (n % wait.every === 0) tap()
  waited.set(stage, n + 1)
  return true
}
