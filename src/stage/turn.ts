const QUARTER = Math.PI / 2
const DEG = Math.PI / 180

export const TURN = {
  windUp: 0.12,
  lean: 1.6 * DEG,
  power: 2.2,
  seat: 0.6,
  knocks: [
    { size: 1.5 * DEG, lasts: 0.22 },
    { size: 0.4 * DEG, lasts: 0.12 }
  ]
} as const

const clamp01 = (u: number) => Math.min(1, Math.max(0, u))

export function leaveTurn(u: number): number {
  const t = clamp01(u)
  if (t <= 0) return 0
  if (t < TURN.windUp) {
    const s = t / TURN.windUp
    return -TURN.lean * Math.sin(Math.PI * s) * (1 - s)
  }
  const s = (t - TURN.windUp) / (1 - TURN.windUp)
  return QUARTER * Math.pow(s, TURN.power)
}

export function leaveSpeed(): number {
  return (QUARTER * TURN.power) / (1 - TURN.windUp)
}

export function arriveTurn(u: number): number {
  const t = clamp01(u)
  if (t < TURN.seat) {
    const w = t / TURN.seat
    const a = 1 - (leaveSpeed() * TURN.seat) / QUARTER
    return -QUARTER * (1 - w) * (1 + a * w)
  }
  let from = TURN.seat
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

export const SHIVER = { hop: 9, slide: 3, beat: 0.085, fade: 0.09, beats: 4, loose: 0.5, spread: 0.1 } as const

const shiverLasts = SHIVER.beat * SHIVER.beats

export const shiverSeconds = shiverLasts + SHIVER.spread

const swing = (seconds: number): number => (seconds > 0 && seconds < shiverLasts ? Math.exp(-seconds / SHIVER.fade) * Math.sin((Math.PI * seconds) / SHIVER.beat) : 0)

export const shiverAt = (seconds: number): number => SHIVER.hop * Math.abs(swing(seconds))

export const rattleAt = (seconds: number): number => SHIVER.slide * swing(seconds)

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
