import { config } from '../../config'
import { hash01, stream } from '../../core/random'
import { HAND, type Acting } from '../../cursor/body'
import { boxOf, drawLayout } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { SCREEN_H, TYPE } from '../../shell/parts'
import { homeDistance, smooth } from '../../stage/camera'
import type { CameraPose, DrawList, Emit, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, StepIo } from '../../stage/types'
import { CAP_TOP, DECK, DECK_TOP, hatchCentre, homePlaces, keyAt, onDeck, seatIndex, seats, shuffled, SINK, TIP, tipOf, TRAVEL, typed } from './keyboard'
import { SNAP_FROM, slotShapes } from './real/shredderShape'
import { buildLayout, FIELDS, PAPER, PAPER_LINES, PAPER_REST, PAPER_TITLE, SLAB, SLOT, uploadGlyph, ZONE, type FieldName } from './layout'
import { BITE, filmCamera, FRINGE, HOOD, makePlan, PILE, pointerAt, raised, RESUME, SHRED, START, TIMES, TUG, tugCurve, tugReach, type Plan } from './script'
import { Turrets, TURRET, type TurretsState } from './turrets'

const live = config.live
const heights = config.scale.heights
const WELL = -(CAP_TOP + 12)
const MAX_CHARS = 26
const BODY = { x: 14, y: 26 }
const STRIPS = 20
const STRIP = { paper: 42, ink: 26, wide: 2.5, every: 4, askew: 0.44 }
const GRAB = 26
const LIE = heights.card + 9
const IDLE_SHUFFLE = 5
const DROP = CAP_TOP + 8
const SWING = 0.12
const SHAKE = { seconds: 0.25, px: 5.5, reach: 460, hop: 15 }
const RATTLE = { seconds: 0.22, px: 2.4 }
const JAW = { tug: 14, shred: 30, lag: 0.3 }
const NEAR = 130
const SINGE = 0.2
const EATEN = -30
const HEAP = { y: 20, spread: 34 }
const TIDY = 0.3
// The live takeover: the seconds the hands travel to the bitten paper before they close on it, then the seconds over which the taut arms haul the arrow in to arm's length, and the most the held paper leans from upright, in radians, wherever the arrow stands. On the step the hands close the paper swings to the arrow and a little past (`swing`: how fast it dies and how fast it turns, a second), and the arrow is drawn long (`long`) for `jolt` seconds and thrown toward the paper at `kick` px a second.
const TAKE = { reach: 0.075, haul: 0.15, lean: 0.6, swing: { dies: 20, turns: 30 }, long: 1.2, jolt: 0.05, kick: 240 }
// The way in on the taut arms, live: the arrow comes in from where it stood when the hands closed to where the arms' pull and the hand's meet, over `TAKE.haul` seconds, at `first` times the even pace on the first step down to `last` times on the last. Each step the page gives it the pace it is short of and `near` a second of the distance it is behind; a slack under `least` px is left to the spring.
const WAY = { first: 1.6, last: 0.4, near: 120, least: 8 }
// The stop at arm's length, live: what is left of the pace is taken out on one step and the arrow thrown `back` px a second the other way; for `still` seconds the page takes `grip` of the arrow's pace out of it each step, less and less, so it stands before the hand has it on the arms again; its length is pressed from `from` to `low` over `dip` seconds and the body's spring takes it up again.
const STOP = { back: 220, still: 0.1, grip: 0.7, from: 1.24, low: 1.07, dip: 0.034 }
// The live arrow's answer to a strain of the paper. On its first step the hands on the paper are jerked `jerk` px toward the slot, so the arms tighten; from the next step the body is asked to lean back from the slot, the asking rising to `lean` radians over `rise` seconds and let go over `back`, the hands coming back as it rises. No answer begins sooner than `rest` seconds after the hands close on the paper, which leaves the arrow 12 steps after its arrival before the first one. Its size is `least` of the whole at the tug's start and grows to the whole with the tug's age over `long` seconds or the paper eaten up to `whole`, whichever is further on; `side` is how far to one side of the shoulder, in px, the hands must be for the whole lean.
const HEAVE = { jerk: 6, lean: 0.44, rise: 0.05, back: 0.3, rest: 0.615, least: 0.5, long: 9, whole: 0.6, side: 20 }
// What the cassette and the panel answer the take with, in page pixels, on `jolt`: up toward the arrow on the step the hands close, down on the step the arrow stops.
const ANSWER = { grab: -9, stop: 7 }
// How far past its rest the grabbed paper swings at its first peak, as a share of the rest: the lean is held this much short so the peak stays inside `TAKE.lean`.
const SWING_AT = Math.PI - Math.atan(TAKE.swing.dies / TAKE.swing.turns)
const SWING_PEAK = 1 - Math.exp((-SWING_AT * TAKE.swing.dies) / TAKE.swing.turns) * Math.cos(SWING_AT)
// The live loss: the last pull back in seconds and page pixels, the seconds of the skid to the slot, how much of the paper it wins back a second meanwhile, the arrow's stretch and its seconds on the frame its grip goes, then the seconds the hands ride the last of the paper into the mouth and how far that draws the arrow down after it.
const LOSS = { pull: 0.22, back: 20, gain: 0.12, skid: 0.36, long: 1.28, kick: 0.07, feed: 0.16, sink: 26 }
// The slot's answer to a contact: its seconds, and how far the cassette and the panel round it are thrown, in page pixels, at the bite, at the lost grip and where the arrow meets the slot.
const JOLT = { seconds: 0.24, bite: 12, lost: 16, meet: 24, panel: 0.75 }
// The live give-back: how short the whole arrow is pressed as it drops its pose, for how long, and the seconds over which the page lets it back to its length; the seconds from there to the release (`settle`), of which the last `hold` it stands still at its plain tilt; and the seconds over which the arrow is then eased to the mouse.
const GIVE = { settle: 0.42, hold: 0.2, low: 0.78, press: 0.06, rise: 0.2, back: 0.44 }
// The give back on the live site. The mended arrow lies with its tip `under` px beneath the hood's lip and is drawn out to `long` over `strain` seconds before the page lets go.
// Then the cassette kicks by `kick`, the arrow is thrown back to where the pile lay inside `fall` seconds, short by `low` for `press` seconds and at its length again by `rise`, swinging `swing` radians at `hz` over `ring` seconds, and `beat` seconds after the kick, having stood, it is the visitor's again, eased over `GIVE.back`.
const CAUGHT = { under: 7, long: 1.24, strain: 0.5, kick: 22, low: 0.7, press: 0.034, rise: 0.084, fall: 0.067, swing: 0.3, hz: 12, ring: 0.084, beat: 0.4 }
// The slot closes after the tug: the hood folds and the cassette starts down at `seconds` for the whole travel, as far as `down` of it, where the cassette is still half up in its well; from there the two panels snap shut over it in `snap` seconds, three frames, each frame further than the last, the cassette going down under them, and on the step they meet the slot is gone and the tray is thrown `kick` px and comes back.
const SHUT = { seconds: 0.36, down: SNAP_FROM, snap: 0.05, kick: 4 }
// The live loss, after the paper is in: the seconds the empty hands are shed while the arrow is thrown back from the mouth, and how far, in page pixels.
const SHED = { seconds: 0.29, back: 16, out: 0.1 }
const PANEL = ['resume-zone', 'resume-prompt', 'resume-browse', 'resume-browse-label', 'resume-received']
const WIPE: FieldName[] = ['email', 'lastName', 'firstName']
const SLAB_FALL = { seconds: 0.1, high: 1200, thrown: 0.3, amp: 1.05, sight: 0.6 }
const SLAB_LAND = TIMES.slabHang + TIMES.slabFall
const SLAB_HOP = { high: 34, reach: 280, seconds: 0.16, speed: 6000, wide: 90 }
const SLAB_GAP = 8
const SLAB_CLEAR = 14
const SLAB_OUT = { every: 0.13, pop: 0.07, up: 100, pull: 30, wait: 0.09, fly: 0.15, far: 1900, spring: 0.16 }
const PRESS = 0.24
const HOLD = 0.1
const DOWN = { seconds: 0.02, first: 0.5 }
const TAP = { seconds: 0.2, hold: 0.05, depth: 1, shake: 0.22 }
const STRIKE = { seconds: 1.5, id: 90000, z: 96, over: 1.46 }
// The key under an arrow a bolt hits: it stays down `held` seconds, is back at its full height a third of the way from there to `back`, goes `pop` px over its seat and is still at `back`.
// How the caps round a bolt's hit are thrown on the live site: px at the strike, falling to nothing at reach, held out for hold seconds so the frame of the hit shows all of it, then dying over tau, one swing a period, over by seconds.
const JAR = { px: 7.5, reach: 300, fall: 1.3, hold: 0.03, tau: 0.025, period: 0.08, seconds: 0.2 }
const THUD = { seconds: 0.17, hold: 0.085, shake: 0.7, hop: 9, reach: 260, toss: 0.1, speed: 6000, held: 0.05, back: 0.2, pop: 2 }
const PULSE = { hold: 0.05, fade: 0.3 }
const FLIGHT = { over: 1.25, under: 0.75, ripple: 0.17, span: 800, jitter: 0.02, seconds: 0.2, rise: 0.58, crouch: 0.035, low: 24, high: 64, perPx: 0.1, seat: 0.09, jolt: 4, land: 2.2, rattle: 1.6, clear: 5 }
const SEATED = FLIGHT.crouch + FLIGHT.ripple + FLIGHT.jitter + FLIGHT.seconds
const LEGEND_CLEAR = 0

type Phase = 'rest' | 'keyboard' | 'firstName' | 'lastName' | 'email' | 'slabs' | 'resume' | 'tug' | 'shredded' | 'received'
const GAG: Record<Phase, string> = {
  rest: 'step1.keyboard', keyboard: 'step1.keyboard', firstName: 'step1.firstName', lastName: 'step1.lastName', email: 'step1.email', slabs: 'step1.email',
  resume: 'step1.resume', tug: 'step1.tug', shredded: 'step1.shredded', received: 'step1.shredded'
}
const FIELD_OF: Partial<Record<Phase, FieldName>> = { keyboard: 'firstName', firstName: 'firstName', lastName: 'lastName', email: 'email', slabs: 'email' }

interface State {
  mode: Mode
  seed: number
  time: number
  phase: Phase
  phaseTime: number
  board: number
  boardUp: boolean
  values: Record<FieldName, string>
  places: number[]
  from: number[]
  shuffle: number
  blocks: boolean
  rng: number[]
  shuffles: number
  shuffledAt: number
  queue: { key: number; wait: number; click: number }[]
  held: string
  click: number
  keyDown: Record<string, number>
  drum: number
  shock: number
  slabs: { t: number; x: number; y: number; base: number; landed: boolean; since: number }[]
  slabDue: { t: number; x: number; y: number; base: number }[]
  slabClear: number
  accepted: boolean
  slow: number
  slowFired: boolean
  realFired: boolean
  paper: { on: boolean; slide: number; x: number; y: number; held: boolean; dx: number; dy: number; feed: number; fx: number; fy: number; vx: number; vy: number }
  slot: number
  shut: number
  tug: { t: number; amount: number; most: number; cool: number; gx: number; gy: number; reach: number; rate: number; pull: number; vx: number; vy: number; hx: number; hy: number; slack: number; far: number; from: number; into: number; ax: number; ay: number; heave: number; size: number }
  lost: number
  last: number
  lostFrom: { x: number; y: number; ux: number; uy: number }
  jolt: number
  joltAmp: number
  give: number
  singe: number
  armed: boolean
  seat: number
  shake: number
  shakeAt: { x: number; y: number }
  struckAt: { x: number; y: number }
  shakeAmp: number
  thud: number
  thudKey: number
  thudLean: { x: number; y: number }
  sinceShuffle: number
  burst: { x: number; y: number }
  caret: number
  glow: number
  spin: number
  turn: number
  kept: Record<FieldName, string> | null
  shred: number
  received: boolean
  pressed: number
  skipped: boolean
  cleaned: boolean
  done: boolean
  cue: number
  cx: number
  cy: number
  acted: Acting | null
}

const lerp = (a: number, b: number, u: number): number => a + (b - a) * u
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const spring = (e: number, hold: number, total: number): number => {
  if (e < 0 || e >= total) return 0
  if (e < hold) return 1
  const t = (e - hold) / (total - hold)
  return Math.cos(t * Math.PI * 1.5) * (1 - t) ** 1.5
}
// A key let go: held at the bottom for `HOLD`, it springs up through its rest height to `over` of its travel past it inside `up` seconds, two frames, and is back at rest `settle` seconds after that, never crossing its rest height again.
const RELEASE = { up: 0.034, over: 0.45, settle: 0.084 }
const release = (e: number): number => {
  if (e < 0 || e >= PRESS) return 0
  const t = e - HOLD
  if (t <= 0) return 1
  if (t < RELEASE.up) return 1 - (1 + RELEASE.over) * (t / RELEASE.up)
  return t < RELEASE.up + RELEASE.settle ? -RELEASE.over * (1 - (t - RELEASE.up) / RELEASE.settle) ** 2 : 0
}
const stroke = (e: number): number => (e >= 0 && e < DOWN.seconds ? DOWN.first + (1 - DOWN.first) * (e / DOWN.seconds) : release(e))
// The ground a pressed cap gives the arrow that stands on it: it comes up on the slower spring, so a cap let go does not toss the arrow.
const footing = (e: number): number => (e >= 0 && e < DOWN.seconds ? DOWN.first + (1 - DOWN.first) * (e / DOWN.seconds) : spring(e, HOLD, PRESS))
const jarOf = (t: number): number => (t < 0 || t > JAR.seconds ? 0 : t < JAR.hold ? 1 : Math.exp(-(t - JAR.hold) / JAR.tau) * Math.cos(((t - JAR.hold) / JAR.period) * Math.PI * 2))
const ring = (t: number, px: number): number => (t < 0 || t > 0.3 ? 0 : px * Math.exp(-t * 16) * Math.cos(t * 58))
const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number, pad = 0): boolean => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad

export function makePage(): PageLogic {
  const layout = buildLayout()
  const glyph = uploadGlyph()
  const beats = config.film.beats.filter((b) => b.unit === 'step1')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const pockets = Object.fromEntries(FIELDS.map((f) => [f, boxOf(layout, `${f}-pocket`)])) as Record<FieldName, ReturnType<typeof boxOf>>
  const values = Object.fromEntries(FIELDS.map((f) => [f, boxOf(layout, `${f}-value`)])) as Record<FieldName, ReturnType<typeof boxOf>>
  const slabHome = boxOf(layout, 'email-slab')
  const slabLabel = boxOf(layout, 'email-slab-label')
  const emailValue = boxOf(layout, 'email-value')
  const go = boxOf(layout, 'continue-cap')
  const hatchY = [boxOf(layout, 'hatch-0').y, boxOf(layout, 'hatch-1').y]
  const hatches: [{ x: number; y: number }, { x: number; y: number }] = [hatchCentre(0), hatchCentre(1)]
  const lift = (board: number, up = s.boardUp): number => {
    const u = clamp((board - 0.25) / 0.75, 0, 1)
    if (!up) return -DROP * (1 - u) ** 2
    if (u < 0.8) return -DROP * (1 - (1 + SWING) * smooth(u / 0.8))
    return DROP * SWING * (1 - ((u - 0.8) / 0.2) ** 2)
  }
  const surface = (x: number, y: number): number => (onDeck(x, y) ? (keyAt(homePlaces(), x, y) >= 0 ? CAP_TOP : DECK_TOP) : 0)
  const turrets = new Turrets(hatches, DECK_TOP, live.step1.hitsBeforeTurretsOverheat, surface)
  const film = config.applicant
  let plan: Plan = makePlan(config.seed, film.filmFirstName, film.filmLastName, film.filmEmail)
  let names: Record<FieldName, string[]> = { firstName: ['p', 'e', 'r'], lastName: ['c', 'o', 'm'], email: ['a', 'at', 'b'] }

  const fresh = (mode: Mode, seed: number): State => ({
    mode, seed, time: 0, phase: 'rest', phaseTime: 0, board: 0, boardUp: false, values: { firstName: '', lastName: '', email: '' }, places: homePlaces(), from: homePlaces(), shuffle: 1, blocks: false,
    rng: stream('step1:shuffle', seed).state(), shuffles: 0, shuffledAt: 0, queue: [], held: '', click: 0, keyDown: {}, drum: 0, shock: 0, slabs: [], slabDue: [], slabClear: -1, accepted: false, slow: 0, slowFired: false, realFired: false,
    paper: { on: false, slide: 0, x: PAPER_REST.x, y: SCREEN_H + 20, held: false, dx: 0, dy: 0, feed: -1, fx: 0, fy: 0, vx: 0, vy: 0 }, slot: 0, shut: 0, tug: { t: 0, amount: 0, most: 0, cool: 0, gx: SLOT.cx, gy: SLOT.cy - PAPER.h, reach: TUG.reach.rest, rate: 0, pull: 0, vx: 0, vy: 0, hx: SLOT.cx, hy: SLOT.cy - PAPER.h, slack: -1, far: -1, from: 0, into: -1, ax: 0, ay: 0, heave: -1, size: 0 },
    lost: -1, last: -1, lostFrom: { x: 0, y: 0, ux: 0, uy: -1 }, jolt: 9, joltAmp: 0, give: -1, singe: 0, armed: false, seat: 9, shake: 9, shakeAt: { x: 0, y: 0 }, struckAt: { x: 0, y: 0 }, shakeAmp: 1, thud: 9, thudKey: -1, thudLean: { x: 0, y: 1 }, sinceShuffle: 9, burst: { x: DECK.x + DECK.w / 2, y: DECK.y + DECK.h / 2 }, caret: 9, glow: 9, spin: 0, turn: 0, kept: null,
    shred: 0, received: false, pressed: -1, skipped: false, cleaned: false, done: false, cue: 0, cx: START.x, cy: START.y, acted: null
  })
  let s = fresh('live', config.seed)

  const enter = (phase: Phase): void => {
    s.phase = phase
    s.phaseTime = 0
    s.slow = 0
    s.shuffledAt = 0
    s.queue = []
  }
  const act = (io: StepIo, a: Acting): void => {
    if (s.acted === a) return
    s.acted = a
    io.cursor.act(a)
  }
  const seatOf = (key: number, u: number, bow = 0): { x: number; y: number; moved: boolean } => {
    const a = seats[s.from[key]!]!
    const b = seats[s.places[key]!]!
    const own = seats[key]!
    const at = { x: lerp(a.cx, b.cx, u) - own.w / 2, y: lerp(a.y, b.y, u), moved: s.from[key] !== s.places[key] }
    if (bow <= 0 || !at.moved) return at
    const dx = b.cx - a.cx
    const dy = b.cy - a.cy
    const d = Math.hypot(dx, dy) || 1
    const reach = ((Math.abs(dy / d) * own.w + Math.abs(dx / d) * own.h) / 2 + FLIGHT.clear) * bow
    at.x -= (dy / d) * reach
    at.y += (dx / d) * reach
    return at
  }
  const launchOf = (key: number): number => {
    const a = seats[s.from[key]!]!
    const far = Math.hypot(a.cx - s.burst.x, a.cy - s.burst.y)
    return FLIGHT.crouch + Math.min(1, far / FLIGHT.span) * FLIGHT.ripple + FLIGHT.jitter * hash01(key, s.shuffles, 23)
  }
  const flightOf = (key: number): { u: number; air: number; bow: number; high: number; crouch: number; seat: number; t: number } => {
    const t = s.sinceShuffle
    if (t >= 1) return { u: 1, air: 0, bow: 0, high: 0, crouch: 0, seat: 0, t }
    const start = launchOf(key)
    const a = clamp((t - start) / FLIGHT.seconds, 0, 1)
    const from = seats[s.from[key]!]!
    const to = seats[s.places[key]!]!
    const far = Math.hypot(to.cx - from.cx, to.cy - from.cy)
    const high = Math.min(FLIGHT.high, FLIGHT.low + far * FLIGHT.perPx) * (s.places[key]! > s.from[key]! ? FLIGHT.over : FLIGHT.under)
    const crouch = t < start ? clamp((t - (start - FLIGHT.crouch)) / FLIGHT.crouch, 0, 1) : 0
    const air = a < FLIGHT.rise ? 1 - (1 - a / FLIGHT.rise) ** 2 : 1 - ((a - FLIGHT.rise) / (1 - FLIGHT.rise)) ** 2
    return { u: a + 0.12 * Math.sin(2 * Math.PI * a), air, bow: Math.sin(Math.PI * a), high, crouch, seat: spring(t - start - FLIGHT.seconds, 0.017, FLIGHT.seat), t: t - start }
  }
  const openKeyboard = (io: StepIo): void => {
    s.boardUp = true
    io.emit('keyboard-rise', DECK.x + DECK.w / 2, DECK.y + DECK.h / 2, false)
    enter('keyboard')
  }
  const reshuffle = (io: StepIo): void => {
    const rng = stream('step1:shuffle', s.seed)
    rng.restore(s.rng)
    s.from = s.places.slice()
    s.places = shuffled(s.places, rng)
    s.rng = rng.state()
    s.shuffle = 0
    s.sinceShuffle = 0
    s.blocks = true
    s.shuffles++
    s.shuffledAt = s.phaseTime
    io.emit('keys-shuffle', DECK.x + DECK.w / 2, DECK.y + DECK.h / 2, false)
  }
  const goHome = (): void => {
    s.from = s.places.slice()
    s.places = homePlaces()
    s.shuffle = 0
    s.sinceShuffle = 0
    s.burst = { x: DECK.x + DECK.w / 2, y: DECK.y + DECK.h / 2 }
    s.blocks = false
  }
  const advance = (io: StepIo): void => {
    if (s.phase === 'firstName') {
      turrets.retract()
      enter('lastName')
      act(io, 'plain')
    } else if (s.phase === 'lastName') {
      goHome()
      enter('email')
      act(io, 'angry')
    } else if (s.phase === 'email') {
      enter('slabs')
      act(io, 'proud')
    }
  }
  const strike = (io: StepIo, key: number, click: number): void => {
    const name = seats[key]!.name
    const at = seatOf(key, 1)
    io.emit('key-press', at.x + seats[key]!.w / 2, at.y + seats[key]!.h / 2, false)
    s.keyDown[name] = PRESS
    s.held = s.mode === 'live' && io.pointer.down && click === s.click ? name : ''
    const field = FIELD_OF[s.phase]
    if (!field || s.phase === 'keyboard' || s.phase === 'slabs') return
    const value = s.values[field]
    if (name === 'backspace') {
      s.values[field] = value.slice(0, -1)
      return
    }
    if (name === 'enter' || name === 'tab') {
      if (value.length >= live.step1.minChars) advance(io)
      return
    }
    const ch = typed(name)
    if (ch === null || value.length >= MAX_CHARS) return
    s.glow = 0
    s.values[field] = value + (field !== 'email' && value.length === 0 ? ch.toUpperCase() : ch)
    if (s.phase === 'lastName' && seats[key]!.letter) {
      s.burst = { x: at.x + seats[key]!.w / 2, y: at.y + seats[key]!.h / 2 }
      reshuffle(io)
      if (s.shuffles === 4) act(io, 'nervous')
    }
  }
  const paperTarget = (): { x: number; y: number } => ({ x: BITE.x, y: BITE.y })

  const stepKeys = (io: StepIo): void => {
    const typing = s.phase === 'firstName' || s.phase === 'lastName' || s.phase === 'email'
    if (io.pressed) s.click++
    if (s.held !== '' && !(io.pointer.down && !s.blocks && (typing || s.phase === 'slabs'))) s.held = ''
    for (const k of Object.keys(s.keyDown)) {
      s.keyDown[k] = Math.max(s.keyDown[k]! - io.dt, k === s.held ? PRESS - HOLD : 0)
      if (s.keyDown[k]! <= 0) delete s.keyDown[k]
    }
    if (s.drum > 0) s.drum = Math.max(0, s.drum - io.dt)
    if (s.shuffle < 1) {
      s.shuffle = Math.min(1, s.shuffle + io.dt / TIMES.shuffleSeconds)
    }
    if (s.blocks && s.shuffle >= 1 && s.sinceShuffle >= SEATED) s.blocks = false
    if (io.pressed && s.board >= 1 && !s.blocks && (typing || s.phase === 'slabs')) {
      const key = keyAt(s.places, io.pointer.x, io.pointer.y)
      if (key >= 0 && s.queue.length < 4) s.queue.push({ key, wait: TIMES.pressWait, click: s.click })
    }
    for (const q of s.queue) q.wait -= io.dt
    const head = s.queue[0]
    if (head) {
      const at = seatOf(head.key, 1)
      const own = seats[head.key]!
      if (head.wait <= 0 || inside({ x: at.x, y: at.y, w: own.w, h: own.h }, io.cursor.x, io.cursor.y)) {
        s.queue.shift()
        strike(io, head.key, head.click)
      }
    }
    if (typing && s.mode === 'live') {
      const field = FIELD_OF[s.phase]!
      if (s.values[field].length < live.step1.minChars) s.slow += io.dt
      if (!s.slowFired && s.slow >= live.slowTypingSeconds) {
        s.slowFired = true
        s.drum = 0.8
        io.emit('slow-typing', pockets[field].cx, pockets[field].cy, false)
      }
      if (s.phase === 'lastName' && !s.blocks && s.phaseTime - s.shuffledAt >= IDLE_SHUFFLE) {
        s.burst = { x: DECK.x + DECK.w / 2, y: DECK.y + DECK.h / 2 }
        reshuffle(io)
      }
      if (s.phaseTime >= live.skipLinkAfterSeconds) advance(io)
    }
  }

  const stepTurrets = (io: StepIo): void => {
    if (s.phase === 'firstName' && !s.armed && s.phaseTime >= TIMES.turretDelay) {
      s.armed = true
      turrets.raise(io.emit)
    }
    const body = { x: io.cursor.x + BODY.x, y: io.cursor.y + BODY.y }
    const exposed = s.phase === 'firstName' && io.cursor.onPage && !io.cursor.taken && s.shock <= 0
    const emit: Emit = (name, x, y, hit) => {
      io.emit(name, x, y, hit)
      if (name === 'bolt-hit' && !hit && s.shock <= 0 && s.acted !== 'proud' && Math.hypot(x - body.x, y - body.y) < NEAR) io.cursor.react('flinch')
      if (name === 'bolt-hit' && !hit && s.shake >= SHAKE.seconds && onDeck(x, y)) {
        s.shake = 0
        s.shakeAmp = TAP.shake
        s.shakeAt = { x, y }
      }
    }
    if (s.mode === 'live' && s.held !== '') turrets.wait(io.dt)
    const hits = turrets.step(io.dt, body, exposed, emit)
    for (const h of hits) {
      io.emit('bolt-hit-cursor', h.x, h.y, true)
      io.emit('sizzle', h.x, h.y, true)
      io.cursor.hurt('burn')
      io.cursor.knock(h.dx * 900, h.dy * 900, 380)
      io.cursor.react('recoil')
      act(io, 'shocked')
      s.shock = 0.9
      s.singe = SINGE
      s.queue = []
      s.held = ''
      s.thud = 0
      s.thudKey = keyAt(s.places, body.x, body.y)
      s.thudLean = { x: -h.dx, y: -h.dy }
      s.shake = 0
      s.shakeAmp = THUD.shake
      s.shakeAt = { x: body.x, y: body.y }
      s.struckAt = { x: body.x, y: body.y }
      s.glow = 0
      s.caret = 0
    }
    if (s.singe > 0) {
      s.singe -= io.dt
      if (s.singe <= 0) {
        s.values.firstName = s.values.firstName.slice(0, -1)
        s.glow = 0
      }
    }
    if (s.shock > 0) {
      s.shock -= io.dt
      if (s.shock <= 0 && s.phase === 'firstName') act(io, 'nervous')
    }
  }

  const slabAim = (io: StepIo): { x: number; y: number; base: number } => {
    const x = clamp(io.cursor.x + BODY.x - SLAB.w / 2, DECK.x + SLAB_GAP, DECK.x + DECK.w - SLAB.w - SLAB_GAP)
    const y = clamp(io.cursor.y + BODY.y - SLAB.h / 2, DECK.y + SLAB_GAP, DECK.y + DECK.h - SLAB.h - SLAB_GAP)
    const x0 = DECK.x + SLAB_GAP
    const x1 = DECK.x + DECK.w - SLAB.w - SLAB_GAP
    const y0 = DECK.y + SLAB_GAP
    const y1 = DECK.y + DECK.h - SLAB.h - SLAB_GAP
    const free = (px: number, py: number): boolean => s.slabs.every((b) => px >= b.x + SLAB.w + SLAB_CLEAR || px + SLAB.w + SLAB_CLEAR <= b.x || py >= b.y + SLAB.h + SLAB_CLEAR || py + SLAB.h + SLAB_CLEAR <= b.y)
    if (free(x, y)) return { x, y, base: CAP_TOP }
    let best = { x, y, far: Infinity }
    const xs = [x, x0, x1, ...s.slabs.flatMap((b) => [b.x - SLAB.w - SLAB_CLEAR, b.x + SLAB.w + SLAB_CLEAR])]
    const ys = [y, y0, y1, ...s.slabs.flatMap((b) => [b.y - SLAB.h - SLAB_CLEAR, b.y + SLAB.h + SLAB_CLEAR])]
    for (const px of xs) for (const py of ys) {
      if (px < x0 || px > x1 || py < y0 || py > y1 || !free(px, py)) continue
      const far = Math.hypot(px - x, py - y)
      if (far < best.far) best = { x: px, y: py, far }
    }
    return { x: best.x, y: best.y, base: CAP_TOP }
  }

  const slabGone = (TIMES.slabCount - 1) * SLAB_OUT.every + SLAB_OUT.wait + SLAB_OUT.fly
  const stepSlabs = (io: StepIo): void => {
    for (const d of s.slabDue) d.t += io.dt
    while (s.slabDue.length && s.slabDue[0]!.t >= SLAB_LAND - SLAB_FALL.seconds) s.slabs.push({ ...s.slabDue.shift()!, landed: false, since: 0 })
    s.slabs.forEach((b, n) => {
      b.t += io.dt
      if (b.landed) b.since += io.dt
      if (b.landed || b.t < SLAB_LAND) return
      b.landed = true
      const under = inside({ x: b.x, y: b.y, w: SLAB.w, h: SLAB.h }, io.cursor.x + BODY.x, io.cursor.y + BODY.y)
      io.emit('slab-drop', b.x + SLAB.w / 2, b.y + SLAB.h / 2, under)
      s.shake = 0
      s.shakeAmp = SLAB_FALL.amp
      s.shakeAt = { x: b.x + SLAB.w / 2, y: b.y + SLAB.h / 2 }
      s.caret = 0
      s.glow = 0
      if (under) {
        io.cursor.hurt('flattened')
        io.cursor.react('flinch')
      } else {
        if (!io.cursor.inAir) io.cursor.knock(0, 0, 170)
        io.cursor.react(s.mode === 'live' && n === 0 ? 'jump' : 'flinch')
      }
      act(io, n === 2 ? 'angry' : 'scared')
    })
    if (s.slabClear >= 0) {
      s.slabClear += io.dt
      if (s.slabClear < TIMES.slabLift) return
      s.accepted = true
      s.boardUp = false
      turrets.retract()
      enter('resume')
      act(io, 'proud')
      return
    }
    const sent = s.slabs.length + s.slabDue.length
    if (sent < TIMES.slabCount) {
      if (s.phaseTime >= TIMES.slabFirst + sent * TIMES.slabEvery) s.slabDue.push({ t: 0, ...slabAim(io) })
      return
    }
    if (s.slabs.length === TIMES.slabCount && s.slabs[s.slabs.length - 1]!.t >= SLAB_LAND + TIMES.slabLie) s.slabClear = 0
  }

  const stepResume = (io: StepIo): void => {
    const p = s.paper
    if (!p.on) {
      if (s.board <= 0 && s.phaseTime >= TIMES.sinkSeconds) {
        p.on = true
        io.emit('paper-slide', PAPER_REST.x + PAPER.w / 2, PAPER_REST.y + PAPER.h / 2, false)
        io.cursor.react('anticipate')
      }
      return
    }
    if (p.slide < 1) {
      p.slide = Math.min(1, p.slide + io.dt / TIMES.paperSlide)
      const was = p.y
      p.y = lerp(SCREEN_H + 20, PAPER_REST.y, 1 - (1 - p.slide) ** 3)
      p.vy = (p.y - was) / io.dt
      return
    }
    if (p.feed >= 0) {
      p.feed += io.dt
      const share = p.feed / TIMES.bite
      const u = smooth(share / BITE.settle)
      const snap = clamp((share - BITE.snap) / (1 - BITE.snap), 0, 1)
      const to = paperTarget()
      const wx = p.x
      const wy = p.y
      p.x = lerp(p.fx, to.x, u)
      p.y = lerp(p.fy, to.y - BITE.jerk, u) + BITE.jerk * snap * snap
      p.vx = (p.x - wx) / io.dt
      p.vy = (p.y - wy) / io.dt
      if (p.feed >= TIMES.bite) {
        enter('tug')
        s.tug = { t: 0, amount: tugCurve(0), most: 0, cool: 0.5, gx: SLOT.cx, gy: SLOT.cy - PAPER.h, reach: TUG.reach.rest, rate: 0, pull: 0, vx: 0, vy: 0, hx: SLOT.cx, hy: SLOT.cy - PAPER.h, slack: -1, far: -1, from: 0, into: -1, ax: 0, ay: 0, heave: -1, size: 0 }
        s.lost = -1
        s.last = -1
        jolt(JOLT.bite)
        if (s.mode === 'film') grip(io)
        io.emit('shredder', SLOT.cx, SLOT.cy, false)
        io.emit('arms-out', io.cursor.x, io.cursor.y, false)
        act(io, 'angry')
      }
      return
    }
    const feed = (): void => {
      p.held = false
      p.feed = 0
      p.fx = p.x
      p.fy = p.y
    }
    if (!p.held) {
      p.vx = 0
      p.vy = 0
      if (io.pressed && inside({ x: p.x, y: p.y, w: PAPER.w, h: PAPER.h }, io.pointer.x, io.pointer.y, GRAB)) {
        p.held = true
        p.dx = io.pointer.x - p.x
        p.dy = io.pointer.y - p.y
      } else if (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds) feed()
      return
    }
    const k = Math.min(1, io.dt * 28)
    const hx = p.x
    const hy = p.y
    const high = s.mode === 'film' ? raised(s.time) : 0
    p.x += (io.cursor.x - p.dx - p.x) * k
    p.y += (io.cursor.y - p.dy - RESUME.raise * high - p.y) * k
    p.x = clamp(p.x, 0, 1920 - PAPER.w)
    p.y = clamp(p.y, 0, SCREEN_H - 40)
    p.vx = (p.x - hx) / io.dt
    p.vy = (p.y - hy) / io.dt
    const over = inside(ZONE, p.x + PAPER.w / 2, p.y + PAPER.h / 2, -10)
    if ((!io.pointer.down && over) || (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds * 2)) feed()
  }

  const jolt = (amp: number): void => {
    s.jolt = 0
    s.joltAmp = amp
  }
  const joltNow = (): number => (s.jolt < JOLT.seconds ? s.joltAmp * (1 - s.jolt / JOLT.seconds) ** 2 : 0)
  const holding = (): boolean => s.phase === 'tug' && (s.lost < 0 || (s.mode !== 'film' && s.lost < LOSS.skid + LOSS.feed))

  const grip = (io: StepIo): void => {
    const t = s.tug
    const sx = io.cursor.x + TUG.shoulder.x
    const sy = io.cursor.y + TUG.shoulder.y
    const dx = SLOT.cx - sx
    const dy = SLOT.cy - sy
    const d = Math.hypot(dx, dy) || 1
    const reach = Math.max(0, Math.min(t.reach, d - TUG.least))
    t.gx = sx + (dx / d) * reach
    t.gy = sy + (dy / d) * reach
  }

  const stepTug = (io: StepIo): void => {
    const t = s.tug
    const film = s.mode === 'film'
    t.t += io.dt
    const ox = t.gx
    const oy = t.gy
    grip(io)
    const since = t.t - TAKE.reach
    const closed = film || since >= 0
    const tx = t.gx - SLOT.cx
    const ty = t.gy - SLOT.cy
    const td = Math.hypot(tx, ty) || 1
    if (!film) {
      const swung = closed ? 1 - Math.exp(-since * TAKE.swing.dies) * Math.cos(since * TAKE.swing.turns) : 0
      const lean = clamp(Math.atan2(tx, -ty), -TAKE.lean / SWING_PEAK, TAKE.lean / SWING_PEAK) * swung
      const far = lerp(PAPER.h, td, clamp(swung, 0, 1))
      t.gx = SLOT.cx + Math.sin(lean) * far
      t.gy = SLOT.cy - Math.cos(lean) * far
    }
    t.vx = (t.gx - ox) / io.dt
    t.vy = (t.gy - oy) / io.dt
    const dx = t.gx - SLOT.cx
    const dy = t.gy - SLOT.cy
    const d = Math.hypot(dx, dy) || 1
    const hands = (hold: number): void => {
      const px = -dy / d
      const py = dx / d
      const held = Math.min(d, hold)
      t.hx = SLOT.cx + (dx / d) * held
      t.hy = SLOT.cy + (dy / d) * held
      const at: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }] = [{ x: t.hx - px * TUG.hands, y: t.hy - py * TUG.hands, z: LIE + 6 }, { x: t.hx + px * TUG.hands, y: t.hy + py * TUG.hands, z: LIE + 6 }]
      io.cursor.setArms(true, at)
    }
    if (s.lost >= 0) {
      s.lost += io.dt
      t.rate = 1 / TIMES.lost
      t.reach += (TUG.reach.min - t.reach) * Math.min(1, io.dt * 8)
      if (film) {
        t.pull = 0
        t.amount = Math.min(1, t.amount + (io.dt / TIMES.lost) * 0.5)
        if (s.lost >= TIMES.lostFilm) {
          jolt(JOLT.meet)
          s.shred = 0
          enter('shredded')
        }
        return
      }
      const u = clamp(s.lost / LOSS.skid, 0, 1)
      const e = u * (1.5 - 0.5 * u)
      const f = s.lostFrom
      const w = smooth((s.lost - LOSS.skid) / LOSS.feed)
      const off = s.lost - LOSS.skid - LOSS.feed
      const thrown = off <= 0 ? 0 : SHED.back * (off < SHED.out ? 1 - (1 - off / SHED.out) ** 2 : 1 - smooth((off - SHED.out) / (SHED.seconds - SHED.out)))
      io.cursor.drive(lerp(f.x + f.ux * LOSS.back, SLOT.cx - BODY.x, e), lerp(f.y + f.uy * LOSS.back, SLOT.cy - 70, e) + LOSS.sink * w - thrown, heights.card + 6)
      t.pull = off < 0 ? 1 : 0
      t.amount = Math.min(1, t.amount + (io.dt / LOSS.skid) * 0.5)
      if (off < 0) hands(Math.max(TUG.least, PAPER.h * (1 - t.amount) - TUG.inside) * (1 - w))
      else if (io.cursor.arms) {
        io.cursor.setArms(false)
        io.cursor.press(GIVE.low, GIVE.press)
        jolt(JOLT.lost)
      }
      if (off >= SHED.seconds) {
        jolt(JOLT.meet)
        s.shred = 0
        enter('shredded')
      }
      return
    }
    const hold = Math.max(TUG.least, PAPER.h * (1 - t.amount) - TUG.inside)
    const strain = closed ? Math.max(0, d - hold) : 0
    const load = film ? strain : closed ? Math.max(0, td - hold) : 0
    const far = Math.hypot(io.cursor.x + TUG.shoulder.x - SLOT.cx, io.cursor.y + TUG.shoulder.y - SLOT.cy)
    const coming = t.far < 0 ? 0 : (t.far - far) / io.dt
    t.far = far
    if (!film && closed && t.slack < 0) {
      t.slack = load
      t.from = far
      io.cursor.press(TAKE.long, TAKE.jolt)
      io.cursor.knock((-tx / td) * TAKE.kick, (-ty / td) * TAKE.kick, 0)
      jolt(Math.max(0, joltNow() + ANSWER.grab))
    }
    const loose = film || !closed ? 0 : t.slack * (1 - clamp(since / TAKE.haul, 0, 1)) ** 2
    const led = !film && closed && t.slack > WAY.least && s.last < 0
    if (led && since < TAKE.haul) {
      const u = since / TAKE.haul
      const rest = hold + t.reach
      const asked = Math.hypot(io.pointer.x + TUG.shoulder.x - SLOT.cx, io.pointer.y + TUG.shoulder.y - SLOT.cy)
      const whole = Math.max(0, t.from - Math.min(asked, (TUG.stiff * rest + HAND.stiff * asked) / (TUG.stiff + HAND.stiff)))
      const behind = far - (t.from - whole * (WAY.first * u - ((WAY.first - WAY.last) * u * u) / 2))
      const a = Math.max(0, (whole / TAKE.haul) * lerp(WAY.first, WAY.last, u) + WAY.near * behind - coming)
      io.cursor.knock((-tx / td) * a, (-ty / td) * a, 0)
    } else if (led && t.into < 0) {
      const a = Math.max(0, coming) + STOP.back
      t.into = 0
      io.cursor.knock((tx / td) * a, (ty / td) * a, 0)
      jolt(joltNow() + ANSWER.stop)
    } else if (load > loose && s.last < 0) {
      const a = TUG.stiff * Math.min(load - loose, 320) * io.dt
      io.cursor.knock((-tx / td) * a, (-ty / td) * a, 0)
    }
    if (t.into >= 0 && t.into < STOP.still && s.last < 0) {
      if (t.into > 0) {
        const g = STOP.grip * (1 - t.into / STOP.still) ** 2
        io.cursor.knock(((t.ax - io.cursor.x) / io.dt) * g, ((t.ay - io.cursor.y) / io.dt) * g, 0)
      }
      t.into += io.dt
      if (t.into <= STOP.dip) io.cursor.press(lerp(STOP.from, STOP.low, smooth(t.into / STOP.dip)), io.dt)
    }
    t.ax = io.cursor.x
    t.ay = io.cursor.y
    const pull = Math.min(1, strain / TUG.strainPx)
    t.pull = pull
    const was = t.amount
    if (film) t.amount = tugCurve(t.t)
    else if (s.last >= 0) {
      s.last += io.dt
      const u = clamp(s.last / LOSS.pull, 0, 1)
      const e = 1 - (1 - u) ** 2
      const f = s.lostFrom
      io.cursor.drive(f.x + f.ux * LOSS.back * e, f.y + f.uy * LOSS.back * e, heights.card + 6)
      t.pull = Math.max(pull, e)
      t.amount = clamp(t.amount - LOSS.gain * io.dt, 0.03, 1)
    } else t.amount = clamp(t.amount + (0.11 - 0.2 * pull + Math.max(0, t.t - 5) * 0.2) * io.dt, 0.03, 1)
    t.most = Math.max(t.most, t.amount)
    t.rate += ((t.amount - was) / io.dt - t.rate) * Math.min(1, io.dt / TUG.rateLag)
    t.reach = tugReach(t.rate)
    t.cool -= io.dt
    if (pull > 0.7 && t.cool <= 0) {
      t.cool = 0.9
      io.emit('paper-strain', t.gx, t.gy, false)
      if (!film && s.last < 0) {
        t.heave = Math.min(0, since - HEAVE.rest)
        t.size = lerp(HEAVE.least, 1, clamp(Math.max(t.t / HEAVE.long, t.amount / HEAVE.whole), 0, 1)) * clamp((t.hx - io.cursor.x - TUG.shoulder.x) / HEAVE.side, -1, 1)
      }
    }
    let jerk = 0
    if (t.heave > -1) {
      const on = t.heave >= 0 && s.last < 0 && t.heave <= HEAVE.rise + HEAVE.back
      const up = smooth(t.heave / HEAVE.rise)
      io.cursor.heave(on ? -HEAVE.lean * t.size * up * (1 - smooth((t.heave - HEAVE.rise) / HEAVE.back)) : 0)
      if (on) jerk = HEAVE.jerk * Math.abs(t.size) * (1 - up)
      t.heave = on ? t.heave + io.dt : t.heave < 0 && s.last < 0 ? Math.min(0, t.heave + io.dt) : -1
    }
    hands(hold - jerk)
    if (!film && s.last < 0) act(io, t.amount > 0.7 ? 'scared' : t.amount > 0.62 ? 'nervous' : 'angry')
    if (film) {
      if (t.t >= TIMES.tugFilm) {
        io.cursor.setArms(false)
        io.cursor.take('shredder')
        io.cursor.drive(SLOT.cx - BODY.x, SLOT.cy - 70, heights.card + 6)
        act(io, 'scared')
        jolt(JOLT.lost)
        s.lost = 0
      }
      return
    }
    if (s.last < 0 && (t.amount >= 0.9 || t.t >= 9)) {
      const bx = io.cursor.x + BODY.x - SLOT.cx
      const by = io.cursor.y + BODY.y - SLOT.cy
      const bd = Math.hypot(bx, by) || 1
      s.last = 0
      s.lostFrom = { x: io.cursor.x, y: io.cursor.y, ux: bx / bd, uy: by / bd }
      io.cursor.take('shredder')
      io.cursor.drive(io.cursor.x, io.cursor.y, heights.card + 6)
      act(io, 'scared')
    } else if (s.last >= LOSS.pull) {
      io.emit('tug-lost', SLOT.cx, SLOT.cy, true)
      io.cursor.press(LOSS.long, LOSS.kick)
      jolt(JOLT.lost)
      s.lost = 0
    }
  }

  const stepShredded = (io: StepIo): void => {
    const before = s.shred
    s.shred += io.dt
    const crossed = (at: number): boolean => before < at && s.shred >= at
    s.tug.amount = Math.min(1, s.tug.amount + io.dt / 0.25)
    if (s.shred < SHRED.gone) {
      const u = s.shred / SHRED.gone
      io.cursor.drive(SLOT.cx - BODY.x, lerp(SLOT.cy - 70 + (s.mode === 'film' ? 0 : LOSS.sink), SLOT.cy - 30, smooth(u / 0.7)), lerp(heights.card + 6, -60, smooth((u - 0.2) / 0.6)))
    }
    if (crossed(SHRED.gone)) io.cursor.setOnPage(false)
    if (crossed(SHRED.pile)) {
      io.cursor.place(PILE.x, s.mode === 'film' ? PILE.y : HOOD.y - CAUGHT.under)
      io.cursor.setOnPage(true)
      io.cursor.hurt('shredded', SHRED.pileSeconds)
    }
    if (crossed(SHRED.empty)) {
      s.kept = { ...s.values }
      s.accepted = false
    }
    if (s.kept) {
      const u = (s.shred - SHRED.empty) / SHRED.emptySeconds
      WIPE.forEach((f, i) => {
        const left = 1 - clamp(u * WIPE.length - i, 0, 1)
        const n = Math.ceil(s.kept![f].length * left)
        if (n < s.values[f].length) s.glow = 0
        s.values[f] = s.kept![f].slice(0, n)
      })
      if (u >= 1 + SHRED.hold / SHRED.emptySeconds) {
        s.kept = null
        s.received = true
        s.values = { firstName: '', lastName: '', email: '' }
      }
    }
    if (crossed(SHRED.zip)) {
      io.cursor.hurt('reassembled', SHRED.zipSeconds)
      io.emit('strips-zip', PILE.x + BODY.x, PILE.y + BODY.y, false)
      act(io, 'exhausted')
    }
    if (s.mode !== 'film' && crossed(SHRED.end - CAUGHT.strain)) act(io, 'plain')
    if (s.mode !== 'film' && s.shred >= SHRED.end - CAUGHT.strain && s.shred < SHRED.end) io.cursor.press(lerp(1, CAUGHT.long, smooth((s.shred - SHRED.end + CAUGHT.strain) / (CAUGHT.strain * 0.6))), io.dt)
    if (crossed(SHRED.end)) {
      if (s.mode === 'film') io.cursor.release()
      else {
        s.give = 0
        act(io, 'plain')
        jolt(CAUGHT.kick)
        io.cursor.press(CAUGHT.low, CAUGHT.press)
        io.cursor.wobble(CAUGHT.swing, CAUGHT.hz, CAUGHT.ring)
      }
      enter('received')
    }
  }

  const stepReceived = (io: StepIo): void => {
    if (s.give >= 0) {
      const fell = s.give >= CAUGHT.fall
      s.give += io.dt
      if (!fell) io.cursor.place(PILE.x, lerp(PILE.y, HOOD.y - CAUGHT.under, Math.pow(1 - Math.min(1, s.give / CAUGHT.fall), 3)))
      if (s.give > CAUGHT.press && s.give < CAUGHT.rise) io.cursor.press(lerp(CAUGHT.low, 1, smooth((s.give - CAUGHT.press) / (CAUGHT.rise - CAUGHT.press))), io.dt)
      if (s.give >= CAUGHT.beat) {
        s.give = -1
        io.cursor.release(GIVE.back)
      }
    }
    if (s.pressed < 0) {
      const auto = s.mode === 'live' && s.phaseTime + SHRED.end >= live.skipLinkAfterSeconds
      if (s.board <= 0 && ((io.pressed && inside(go, io.pointer.x, io.pointer.y)) || auto)) {
        s.pressed = 0
        io.emit('button-press', go.cx, go.cy, false)
      }
      return
    }
    s.pressed += io.dt
    if (s.pressed >= 0.3 && !io.cursor.damaged) s.done = true
  }

  const ground = (io: StepIo): number => {
    if (s.paper.on && s.phase === 'resume' && inside({ x: s.paper.x - 10, y: s.paper.y - 10, w: PAPER.w + 20, h: PAPER.h + 20 }, io.cursor.x + BODY.x, io.cursor.y + BODY.y)) return (s.paper.held ? LIE + 14 : s.paper.feed >= 0 ? LIE : 0.6) + heights.paper + 1
    if (inside(ZONE, io.cursor.x + BODY.x, io.cursor.y + BODY.y)) return heights.card
    if (s.board <= 0 || !onDeck(io.cursor.x, io.cursor.y)) return 0
    const key = keyAt(s.places, io.cursor.x, io.cursor.y)
    const down = key >= 0 ? s.keyDown[seats[key]!.name] : undefined
    const top = key >= 0 ? CAP_TOP - (down ? TRAVEL * Math.max(0, footing(PRESS - down)) : 0) : DECK_TOP
    return Math.max(0, top + lift(s.board))
  }

  const strips = (out: DrawList): void => {
    const tug = s.phase === 'tug'
    if (!tug && s.phase !== 'shredded' && s.phase !== 'received') return
    const t = tug ? 0 : s.phase === 'received' ? SHRED.end + s.phaseTime : s.shred
    const back = s.phase === 'received' ? smooth(s.phaseTime / TIDY) : 0
    if (back >= 1) return
    for (let i = 0; i < STRIPS; i++) {
      const ink = i % STRIP.every === STRIP.every - 1
      if (ink && (tug || t >= SHRED.pile)) continue
      const hang = ink ? 0 : clamp((Math.max(s.tug.most, s.tug.amount) - FRINGE.from - ((i * 7) % STRIPS) * (8 / (STRIPS - 1)) * 0.6 * FRINGE.step) * FRINGE.rate, 0, FRINGE.most)
      const u = Math.max(hang, tug ? 0 : clamp((t - SHRED.strips - i * 0.04) / 0.3, 0, 1))
      if (u <= 0) continue
      const len = ink ? STRIP.ink : STRIP.paper * (0.8 + 0.4 * hash01(i, 11, s.seed))
      const out0 = clamp(u / 0.45, 0, 1)
      const fall = smooth((u - 0.45) / 0.55)
      const lane = (i - (STRIPS - 1) / 2) / ((STRIPS - 1) / 2)
      const x0 = SLOT.cx + lane * PAPER.w * 0.47
      const y0 = HOOD.y - len / 2 + out0 * (len + 3)
      const tx = ink ? PILE.x + BODY.x + lane * 12 : SLOT.cx + lane * HEAP.spread + (hash01(i, 3, s.seed) - 0.5) * 8
      const ty = ink ? PILE.y + BODY.y + (hash01(i, 5, s.seed) - 0.5) * 6 : HOOD.y + HEAP.y + (hash01(i, 5, s.seed) - 0.5) * 12
      const x = lerp(lerp(x0, tx, fall), x0, back)
      const y = lerp(lerp(y0, ty, fall), HOOD.y - len / 2 - 2, back)
      const z = (HOOD.z * (1 - fall) + Math.sin(Math.PI * fall) * 6) * (1 - back) + HOOD.z * back
      out.push({ id: `strip-${i}`, part: 'shredder', kind: 'box', x: x - STRIP.wide / 2, y: y - len / 2, w: STRIP.wide, h: len, z0: z + 0.4 + i * 0.06 * fall, z1: z + 1.4 + i * 0.06 * fall, rot: (hash01(i, 7, s.seed) - 0.5) * (STRIP.askew * out0 + 1.1 * fall) * (1 - back), tone: ink ? 'dark' : 'paper', v: [u, ink ? 1 : 0] })
    }
  }

  const tugPaper = (out: DrawList): void => {
    const t = s.tug
    const dx = SLOT.cx - t.gx
    const dy = SLOT.cy - t.gy
    const whole = Math.hypot(dx, dy) || 1
    const shown = s.phase === 'shredded' ? whole * Math.max(0, 1 - smooth(s.shred / SHRED.in)) : whole
    if (shown < 4) return
    const ux = dx / whole
    const uy = dy / whole
    const rot = Math.atan2(dy, dx) - Math.PI / 2
    const startV = whole - shown
    const at = (v: number, across: number): { x: number; y: number } => ({ x: t.gx + ux * v - uy * across, y: t.gy + uy * v + ux * across })
    const c = at(startV + shown / 2, 0)
    const armed = holding()
    const reach = armed ? TUG.hands : 0
    const hx = armed ? t.hx : t.gx
    const hy = armed ? t.hy : t.gy
    const v = [LIE, 1, t.amount, armed ? t.pull : 0, hx - uy * reach, hy + ux * reach, hx + uy * reach, hy - ux * reach, t.vx, t.vy, armed ? 1 : 0]
    out.push({ id: 'resume-paper', part: 'paper', kind: 'box', x: c.x - PAPER.w / 2, y: c.y - shown / 2, w: PAPER.w, h: shown, z0: LIE, z1: LIE + heights.paper, rot, tone: 'paper', moved: true, v })
    const rest = Math.max(10, PAPER.h * (1 - t.amount))
    const scale = whole / rest
    const gone = rest <= 22 || s.phase !== 'tug'
    const p = at(gone ? whole : (PAPER.top + 5) * scale, 0)
    const tz = gone ? EATEN : LIE + 0.1 + heights.paper
    out.push({ id: 'resume-paper-title', part: 'paper', kind: 'text', x: p.x - 27, y: p.y - 5, w: 54, h: 10, z0: tz, z1: tz, rot, tone: 'ink', words: 'copy:step1.resume.paperTitle', type: PAPER_TITLE, moved: true })
    PAPER_LINES.forEach((f, i) => {
      const w = (PAPER.w - PAPER.inset * 2) * (i === 3 || i === 6 ? 0.6 : 1)
      const eaten = f * PAPER.h > rest - 4 || s.phase !== 'tug'
      const q = at(eaten ? whole : f * PAPER.h * scale, -(PAPER.w - PAPER.inset * 2 - w) / 2)
      const z = eaten ? EATEN : LIE + heights.paper
      out.push({ id: `resume-paper-line-${i}`, part: 'paper', kind: 'box', x: q.x - w / 2, y: q.y - PAPER.bar / 2, w, h: PAPER.bar, z0: z, z1: z + 0.4, rot, tone: 'pocket', moved: true, v: [eaten ? 1 : 0] })
    })
  }

  const stateList = (): string[] => {
    const out = ['rest']
    out.push(s.received ? 'received' : 'prompt')
    if (s.accepted) out.push('accepted')
    if (s.board > 0) out.push('keyboard', 'note')
    else out.push('closed')
    if (s.slabs.length) out.push('slab')
    if (s.paper.on && s.phase === 'resume') out.push('paper')
    return out
  }

  return {
    id: 'step1', unit: 'step1', width: 1920, height: SCREEN_H, layout, gags, start: START, control: 'pointer',
    reset(ctx: PageContext) {
      turrets.reset()
      s = fresh(ctx.mode, ctx.seed)
      const a = ctx.applicant ?? { firstName: film.filmFirstName, lastName: film.filmLastName, email: film.filmEmail }
      plan = makePlan(ctx.seed, a.firstName, a.lastName, a.email)
      names = { firstName: ['p', 'e', 'r'], lastName: ['c', 'o', 'm'], email: ['a', 'at', 'b'] }
    },
    step(io: StepIo) {
      s.time = io.time
      s.phaseTime += io.dt
      s.cx = io.cursor.x
      s.cy = io.cursor.y
      if (s.skipped && !s.cleaned) {
        s.cleaned = true
        if (s.slot > 0) io.emit('shredder-stop', SLOT.cx, SLOT.cy, false)
        io.cursor.setArms(false)
        io.cursor.setOnPage(true)
        io.cursor.release()
        s.pressed = 0
      }
      if (s.time < io.dt * 2) act(io, 'confident')
      if (s.mode === 'film') {
        while (s.cue < plan.cues.length && plan.cues[s.cue]!.at <= s.time) {
          const c = plan.cues[s.cue++]!
          if (c.act) act(io, c.act)
          if (c.react) io.cursor.react(c.react)
          if (c.hop && !io.cursor.taken) io.cursor.knock(0, 0, c.hop)
        }
      }
      if (io.pointer.key !== undefined && s.mode === 'live' && !s.skipped) {
        if (!s.realFired) {
          s.realFired = true
          io.emit('real-keyboard', DECK.x + DECK.w / 2, DECK.y + DECK.h / 2, false)
          io.cursor.react('doubleTake')
        }
        s.drum = 0.8
        if (s.phase === 'rest') openKeyboard(io)
      }
      const boardWas = s.board
      s.board = clamp(s.board + ((s.boardUp ? 1 : -1) * io.dt) / (s.boardUp ? TIMES.riseSeconds : TIMES.sinkSeconds), 0, 1)
      if (s.boardUp && boardWas < 1 && s.board >= 1) s.seat = 0
      s.seat = Math.min(9, s.seat + io.dt)
      s.shake = Math.min(9, s.shake + io.dt)
      s.thud = Math.min(9, s.thud + io.dt)
      s.sinceShuffle = Math.min(9, s.sinceShuffle + io.dt)
      s.caret = Math.min(9, s.caret + io.dt)
      s.glow = Math.min(9, s.glow + io.dt)
      s.jolt = Math.min(9, s.jolt + io.dt)
      const eating = s.phase === 'tug' || (s.phase === 'shredded' && s.shred < SHRED.pile)
      s.spin += ((eating ? (s.phase === 'tug' && s.lost < 0 ? JAW.tug : JAW.shred) : 0) - s.spin) * Math.min(1, io.dt / JAW.lag)
      s.turn += s.spin * io.dt
      const slotOpen = (s.phase === 'resume' && s.paper.feed >= 0) || s.phase === 'tug' || s.phase === 'shredded' || (s.phase === 'received' && s.phaseTime < TIDY && !s.skipped)
      if (slotOpen || s.slot > SHUT.down) {
        s.slot = clamp(s.slot + (slotOpen ? io.dt / 0.25 : -io.dt / SHUT.seconds), slotOpen ? 0 : SHUT.down, 1)
        s.shut = 0
      } else if (s.slot > 0 && s.slot < SHUT.down) {
        s.slot = Math.max(0, s.slot - io.dt / SHUT.seconds)
      } else if (s.slot > 0) {
        s.shut += io.dt
        if (s.shut > SHUT.snap - 1e-6) {
          s.slot = 0
          s.shut = 0
          jolt(Math.max(joltNow(), SHUT.kick))
        }
      }

      if (s.phase === 'rest') {
        const onField = FIELDS.some((f) => inside(pockets[f], io.pointer.x, io.pointer.y))
        if ((io.pressed && onField) || (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds)) openKeyboard(io)
      } else if (s.phase === 'keyboard') {
        if (s.board >= 1) {
          enter('firstName')
          if (s.mode === 'live') act(io, 'plain')
        }
      }
      stepKeys(io)
      stepTurrets(io)
      if (s.slabClear >= 0 && s.phase !== 'slabs') {
        s.slabClear += io.dt
        if (s.slabClear >= slabGone) {
          s.slabs = []
          s.slabDue = []
          s.slabClear = -1
        }
      }
      if (s.phase === 'slabs') stepSlabs(io)
      else if (s.phase === 'resume') stepResume(io)
      else if (s.phase === 'tug') stepTug(io)
      else if (s.phase === 'shredded') stepShredded(io)
      else if (s.phase === 'received') stepReceived(io)
      io.cursor.setGround(ground(io))
    },
    save: () => JSON.parse(JSON.stringify({ ...s, turrets: turrets.s })) as unknown,
    load(state) {
      const { turrets: t, ...rest } = JSON.parse(JSON.stringify(state)) as State & { turrets: TurretsState }
      s = rest
      turrets.load(t)
    },
    draw(out: DrawList) {
      const over: Record<string, Partial<Shape> | null> = {}
      const off = lift(s.board)
      let strikeTop = CAP_TOP + off
      if (s.board > 0) {
        const h = DECK.h * smooth(s.board / 0.3)
        const mouth = DECK.y + DECK.h - h
        if (h >= 2) out.push({ id: 'keyboard-well', part: 'keyboard', kind: 'well', x: DECK.x, y: mouth, w: DECK.w, h, z0: WELL, z1: 0, tone: 'dark' })
        const shakes = s.shakeAmp === THUD.shake ? THUD.seconds : SHAKE.seconds
        const hit = s.shake < shakes ? 1 - s.shake / shakes : 0
        const landing = s.sinceShuffle - FLIGHT.crouch - FLIGHT.seconds
        const shake = hit * hit * SHAKE.px * s.shakeAmp * Math.cos(s.shake * 58) + ring(s.sinceShuffle - FLIGHT.crouch, -FLIGHT.jolt) + ring(landing, FLIGHT.land) + ring(landing - FLIGHT.ripple * 0.35, -FLIGHT.land) + ring(landing - FLIGHT.ripple * 0.7, FLIGHT.land) + ring(landing - FLIGHT.ripple, -FLIGHT.land)
        const shaken = Math.abs(shake) > 0.01
        over['keyboard-deck'] = { y: DECK.y + shake, z0: WELL, z1: DECK_TOP + off, ...(shaken ? { moved: true } : {}), v: [s.board, Math.max(0, off), shake] }
        for (const side of [0, 1]) over[`hatch-${side}`] = { y: hatchY[side]! + shake, z0: DECK_TOP + off, z1: DECK_TOP + 0.6 + off, ...(shaken ? { moved: true } : {}) }
        const scorches = turrets.s.scorches
        const spots: { x: number; y: number; w: number; h: number; top: number; air: boolean }[] = []
        const onSite = s.mode === 'live'
        const jarred = onSite && s.shakeAmp === THUD.shake && s.thud < JAR.seconds
        seats.forEach((seat, key) => {
          const fl = flightOf(key)
          const at = seatOf(key, fl.u, fl.bow)
          at.y += shake
          const down = s.keyDown[seat.name]
          const far = Math.hypot(at.x + seat.w / 2 - s.shakeAt.x, at.y + seat.h / 2 - s.shakeAt.y)
          let thrown = false
          if (jarred && far < JAR.reach && !at.moved) {
            const push = JAR.px * (1 - far / JAR.reach) ** JAR.fall * jarOf(s.thud)
            const ux = far > 1 ? (at.x + seat.w / 2 - s.shakeAt.x) / far : -s.thudLean.x
            const uy = far > 1 ? (at.y + seat.h / 2 - s.shakeAt.y) / far : -s.thudLean.y
            at.x += ux * push
            at.y += uy * push
            thrown = Math.abs(push) > 0.01
          }
          let pin = 0
          s.slabs.forEach((b, n) => {
            if (!b.landed || !(at.x < b.x + SLAB.w && at.x + seat.w > b.x && at.y < b.y + SLAB.h && at.y + seat.h > b.y)) return
            const e = s.slabClear < 0 ? -1 : s.slabClear - n * SLAB_OUT.every
            pin = Math.max(pin, e < 0 ? 1 : spring(e, 0, SLAB_OUT.spring))
          })
          const pinned = pin !== 0
          const edge = Math.hypot(Math.max(0, Math.abs(at.x + seat.w / 2 - s.shakeAt.x) - SLAB.w / 2), Math.max(0, Math.abs(at.y + seat.h / 2 - s.shakeAt.y) - SLAB.h / 2))
          const toss = clamp((s.shake - edge / SLAB_HOP.speed) / SLAB_HOP.seconds, 0, 1)
          const kick = pinned || down ? 0 : s.shakeAmp === SLAB_FALL.amp ? (edge < SLAB_HOP.reach ? SLAB_HOP.high * Math.min(1, SLAB_HOP.wide / seat.w) * (1 - edge / SLAB_HOP.reach) ** 1.5 * 4 * toss * (1 - toss) : 0) : s.shakeAmp === THUD.shake ? (far < THUD.reach && key !== s.thudKey ? THUD.hop * Math.min(1, SLAB_HOP.wide / seat.w) * (1 - far / THUD.reach) * Math.sin(Math.PI * clamp((s.shake - far / THUD.speed) / THUD.toss, 0, 1)) : 0) : far < SHAKE.reach ? SHAKE.hop * s.shakeAmp * (1 - far / SHAKE.reach) * Math.sin(Math.PI * clamp((s.shake - far / 2600) / 0.2, 0, 1)) : 0
          const rattle = !down && s.seat < RATTLE.seconds ? RATTLE.px * hash01(key, 2, 17) * Math.sin(Math.PI * clamp((s.seat - 0.08 * hash01(key, 4, 17)) / (RATTLE.seconds - 0.08), 0, 1)) : 0
          const jar = fl.t > FLIGHT.seconds ? fl.t - FLIGHT.seconds : fl.t
          const stir = !at.moved && !down && jar > 0 && jar < 0.1 ? FLIGHT.rattle * (0.4 + 0.6 * hash01(key, s.shuffles, 29)) * Math.sin((Math.PI * jar) / 0.1) : 0
          const sprung = !onSite && !down && !pinned && key === s.thudKey ? spring(s.thud, THUD.held, THUD.back) : 0
          const hop = (at.moved ? fl.air * fl.high : 0) + kick + rattle + stir + THUD.pop * 4 * Math.max(0, -sprung)
          const wave = s.drum > 0 ? Math.max(0, Math.sin((0.8 - s.drum) * 14 - (seat.cx - DECK.x) / 160)) * TRAVEL : 0
          let heat = 0
          let tap = 0
          for (const c of scorches) {
            if (c.x < at.x - 8 || c.x > at.x + seat.w + 8 || c.y < at.y - 8 || c.y > at.y + seat.h + 8) continue
            heat = Math.max(heat, c.left / TURRET.scorchSeconds)
            const age = TURRET.scorchSeconds - c.left
            if (age < TAP.seconds) tap = TAP.depth * spring(age, TAP.hold, TAP.seconds)
          }
          const struck = down ? stroke(PRESS - down) : pinned ? 0 : sprung
          const held = pinned ? pin : struck !== 0 ? struck : tap
          const sunk = clamp(held + (at.moved ? fl.crouch * 0.5 + fl.seat * 0.6 : 0), -0.25, 1)
          const press = sunk * TRAVEL + wave
          const top = CAP_TOP + off + hop - press
          if (key === s.thudKey) strikeTop = Math.max(strikeTop, top)
          const away = at.moved || s.places[key] !== key || shaken || thrown
          const seen = top > 0 || at.y >= mouth + LEGEND_CLEAR
          const depth = clamp(press / TRAVEL, 0, 1)
          const lean = pinned || at.moved ? 0 : down ? TIP.press * clamp(struck, -1, 1) : key === s.thudKey && !onSite ? TIP.rad * tipOf(s.thud) : 0
          const sink = onSite && down && !pinned ? clamp(struck, -1, 1) : 0
          const tipX = lean * (down ? 0 : s.thudLean.x) * Math.min(1, SLAB_HOP.wide / seat.w)
          const tipY = lean * (down ? 1 : s.thudLean.y)
          over[`key-${seat.name}`] = { x: at.x, y: at.y, z0: DECK_TOP + off + hop, z1: top, mechanism: top >= heights.machineMinTop, moved: away, ...(down ? { tone: 'pocket' as const } : {}), v: [depth, hop, at.moved ? fl.air : 0, heat, tipY, tipX, ...(onSite ? [sink] : [])] }
          const legend = boxOf(layout, `key-${seat.name}`)
          const label = seat.name === 'space' ? null : boxOf(layout, `key-${seat.name}-legend`)
          if (label) over[`key-${seat.name}-legend`] = !seen ? null : { x: label.x + (at.x - legend.x) - TIP.lever * tipX + SINK.x * sink, y: label.y + (at.y - legend.y) - TIP.lever * tipY + SINK.y * sink, z0: top, z1: top, moved: away }
          spots.push({ x: at.x, y: at.y, w: seat.w, h: seat.h, top, air: at.moved && fl.air > 0 })
        })
        if (spots.some((p) => p.air)) {
          seats.forEach((seat, key) => {
            const mine = spots[key]!
            const word = over[`key-${seat.name}-legend`]
            if (!word) return
            const box = boxOf(layout, `key-${seat.name}-legend`)
            const covered = spots.some((p, other) => other !== key && (p.air || mine.air) && (p.top > mine.top + 0.01 || (p.top > mine.top - 0.01 && other > key)) && p.x + 3 < word.x! + box.w && p.x + p.w - 3 > word.x! && p.y + 3 < word.y! + box.h && p.y + p.h - 3 > word.y!)
            if (covered) over[`key-${seat.name}-legend`] = null
          })
        }
      }
      const slabAt = (b: { t: number; x: number; y: number; base: number }, n: number): { x: number; y: number; z: number } => {
        const u = clamp((b.t - SLAB_LAND + SLAB_FALL.seconds) / SLAB_FALL.seconds, 0, 1)
        const fall = SLAB_FALL.high * (1 - u) * (1 + (1 - SLAB_FALL.thrown) * u)
        const e = s.slabClear < 0 ? 0 : Math.max(0, s.slabClear - n * SLAB_OUT.every)
        const pop = SLAB_OUT.up * (1 - (1 - Math.min(1, e / SLAB_OUT.pop)) ** 2)
        const fly = (e <= SLAB_OUT.wait ? 0 : SLAB_OUT.far * ((e - SLAB_OUT.wait) / SLAB_OUT.fly) ** 2) - SLAB_OUT.pull * smooth(clamp(e / SLAB_OUT.pop, 0, 1))
        const z = b.base - TRAVEL + fall + pop
        const lean = (SLAB_FALL.sight * fall) / homeDistance()
        return { x: b.x + (b.x + SLAB.w / 2 < 960 ? -fly : fly) - (b.x + SLAB.w / 2 - 960) * lean, y: b.y - (b.y + SLAB.h / 2 - SCREEN_H / 2) * lean, z }
      }
      const slabV = (b: { landed: boolean; since: number }): number[] => [b.since, b.landed ? Math.max(0, 1 - b.since / SHAKE.seconds) : 0]
      const first = s.slabs[0]
      if (first) {
        const p = slabAt(first, 0)
        over['email-slab'] = { x: p.x, y: p.y, z0: p.z, z1: p.z + heights.slab, moved: true, v: slabV(first) }
        over['email-slab-label'] = { x: slabLabel.x + (p.x - slabHome.x), y: slabLabel.y + (p.y - slabHome.y), z0: p.z + heights.slab, z1: p.z + heights.slab, moved: true }
      }
      if (s.paper.on && s.phase === 'resume') {
        const dx = s.paper.x - PAPER_REST.x
        const dy = s.paper.y - PAPER_REST.y
        const up = s.paper.held ? LIE + 14 + (s.mode === 'film' ? RESUME.high * raised(s.time) : 0) : s.paper.feed >= 0 ? LIE : 0.6
        const moved = dx !== 0 || dy !== 0
        const hx = s.paper.held ? s.cx : s.paper.x + PAPER.w / 2
        const hy = s.paper.held ? s.cy : s.paper.y
        over['resume-paper'] = { x: s.paper.x, y: s.paper.y, z0: up, z1: up + heights.paper, moved, v: [up, s.paper.feed >= 0 ? clamp(s.paper.feed / TIMES.bite, 0, 1) : 0, 0, 0, hx, hy, hx, hy, s.paper.vx, s.paper.vy, 0] }
        const title = boxOf(layout, 'resume-paper-title')
        over['resume-paper-title'] = { x: title.x + dx, y: title.y + dy, z0: up + heights.paper + 0.1, z1: up + heights.paper + 0.1, moved }
        PAPER_LINES.forEach((_, i) => {
          const line = boxOf(layout, `resume-paper-line-${i}`)
          over[`resume-paper-line-${i}`] = { x: line.x + dx, y: line.y + dy, z0: up + heights.paper, z1: up + heights.paper + 0.4, moved }
        })
      }
      for (const f of FIELDS) over[`${f}-value`] = { z0: 0.1, z1: 0.1 }
      const thrown = joltNow() * JOLT.panel
      if (thrown > 0) for (const id of PANEL) over[id] = { y: boxOf(layout, id).y + thrown, moved: true }
      if (s.received) {
        const top = heights.button - (s.pressed >= 0 ? TRAVEL : 0)
        over['continue-cap'] = { tone: 'accent', z1: top }
        over['continue-label'] = { tone: 'inkLight', z0: top, z1: top }
      }
      drawLayout(out, layout, { states: stateList(), over, runtime: { 'step1.firstName': s.values.firstName, 'step1.lastName': s.values.lastName, 'step1.email': s.values.email } })
      if (s.slabs.length > 1) {
        const body = out.find((x) => x.id === 'email-slab')
        const face = out.find((x) => x.id === 'email-slab-label')
        const first = s.slabs[0]!
        const home = slabAt(first, 0)
        s.slabs.forEach((b, n) => {
          if (n === 0 || !body || !face) return
          const p = slabAt(b, n)
          out.push({ ...body, id: `email-slab-${n}`, x: p.x, y: p.y, z0: p.z, z1: p.z + heights.slab, v: slabV(b) })
          out.push({ ...face, id: `email-slab-${n}-label`, x: face.x + (p.x - home.x), y: face.y + (p.y - home.y), z0: p.z + heights.slab, z1: p.z + heights.slab })
        })
      }
      const wiping = s.kept ? WIPE.find((f) => s.values[f].length > 0) : undefined
      const field = FIELD_OF[s.phase] ?? wiping
      if (field) {
        const p = pockets[field]
        const glow = s.glow < PULSE.hold ? 1 : Math.max(0, 1 - (s.glow - PULSE.hold) / PULSE.fade)
        out.push({ id: 'field-focus', part: 'shell', kind: 'box', x: p.x + 14, y: p.y + p.h - 5, w: p.w - 28, h: 3, z0: 0.1, z1: 0.5, tone: 'accent', v: [glow] })
        const jump = s.caret < 0.2 ? 6 * Math.sin((Math.PI * s.caret) / 0.2) : 0
        if ((Math.floor(s.time * 2.5) % 2 === 0 || glow > 0 || jump > 0) && s.phase !== 'slabs') {
          const w = s.values[field] ? block(TYPE.value.font, s.values[field], TYPE.value.px).width : 0
          out.push({ id: 'field-caret', part: 'shell', kind: 'box', x: values[field].x + w + 4, y: p.y + 16 - jump, w: 3, h: p.h - 32, z0: 0.1, z1: 0.5, tone: 'ink', v: [jump] })
        }
      }
      if (!s.received) for (const [i, g] of glyph.entries()) out.push({ id: `resume-glyph-${i}`, part: 'shell', kind: 'box', x: g.x, y: g.y + joltNow() * JOLT.panel, w: g.w, h: g.h, z0: heights.card, z1: heights.card + 0.4, r: 1.5, rot: g.rot, tone: 'ink' })
      if (s.board > 0) turrets.draw(out, off)
      if (s.board > 0 && s.thud < STRIKE.seconds && turrets.s.hits > 0) out.push({ id: `scorch-${STRIKE.id + turrets.s.hits}`, part: 'turrets', kind: 'disc', x: s.struckAt.x, y: s.struckAt.y, w: 0, h: 0, z0: STRIKE.z + off, z1: STRIKE.z + off, tone: 'dark', v: [1 - s.thud / TURRET.scorchSeconds, 1, STRIKE.z + off - strikeTop + STRIKE.over, ...(s.mode === 'live' ? [1] : [])] })
      if (s.slot > 0) {
        const open = smooth(s.slot)
        const rate = s.phase === 'tug' ? s.tug.rate : s.phase === 'shredded' && s.shred < SHRED.pile ? 1 / TIMES.lost : 0
        const thrown = joltNow()
        const slot = slotShapes([s.shut > 0 ? -s.shut / SHUT.snap : open, s.turn, rate])
        if (thrown > 0) for (const x of slot) if (x.mechanism) x.y += thrown
        out.push(...slot)
      }
      if (s.phase === 'tug' || s.phase === 'shredded') tugPaper(out)
      strips(out)
    },
    scroll: () => 0,
    view: () => null,
    camera(name: string, time: number): CameraPose | null {
      return name === 'film' ? filmCamera(time) : null
    },
    script(time: number): Pointer {
      return pointerAt(plan, time)
    },
    hint(): Hint | null {
      const blink = Math.floor(s.time * 4) % 2 === 0
      const spot = (key: number): { x: number; y: number } => {
        const seat = seats[s.places[key]!]!
        return { x: seat.cx, y: seat.cy }
      }
      if (s.phase === 'rest') return { x: pockets.firstName.cx, y: pockets.firstName.cy, down: blink }
      if (s.phase === 'keyboard') return { ...spot(seatIndex[names.firstName[0]!]!), down: false }
      if (s.phase === 'firstName' || s.phase === 'lastName' || s.phase === 'email') {
        const field = FIELD_OF[s.phase]!
        const n = s.values[field].length
        const want = n < live.step1.minChars ? names[field][n % names[field].length]! : 'enter'
        const p = spot(seatIndex[want]!)
        const hint: Hint = { ...p, down: blink && !s.blocks && s.queue.length === 0 }
        if (s.phase === 'firstName') {
          const threats = turrets.threats()
          const near = (x: number, y: number, r: number): boolean => threats.some((t) => Math.hypot(t.x - x, t.y - y) < r)
          if (near(p.x, p.y, 90) || near(s.cx + BODY.x, s.cy + BODY.y, 90)) {
            const safe = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x: clamp(p.x + Math.cos(i * 0.785) * 200, DECK.x + 260, DECK.x + DECK.w - 260), y: clamp(p.y + Math.sin(i * 0.785) * 150, DECK.y + 30, DECK.y + DECK.h - 30) })).find((q) => !near(q.x, q.y, 140))
            if (safe && near(p.x, p.y, 90)) hint.dodge = safe
          }
        }
        return hint
      }
      if (s.phase === 'slabs') return { x: DECK.x + DECK.w / 2, y: DECK.y + DECK.h / 2, down: false }
      if (s.phase === 'resume') {
        const p = s.paper
        if (!p.on || p.slide < 1) return { x: PAPER_REST.x + PAPER.w / 2, y: PAPER_REST.y + PAPER.h * 0.3, down: false }
        if (p.feed >= 0) return { x: s.cx, y: s.cy, down: false }
        if (!p.held) return { x: p.x + PAPER.w / 2, y: p.y + PAPER.h * 0.3, down: blink }
        return { x: ZONE.x + ZONE.w / 2 - PAPER.w / 2 + p.dx, y: ZONE.y + ZONE.h / 2 - PAPER.h / 2 + p.dy, down: false }
      }
      if (s.phase === 'tug') return { x: SLOT.cx - 90, y: SLOT.cy - 260, down: false }
      if (s.phase === 'shredded') return { x: PILE.x, y: PILE.y, down: false }
      return { x: go.cx, y: go.cy, down: blink && s.board <= 0 && s.pressed < 0 }
    },
    skip() {
      if (s.skipped) return
      s.skipped = true
      s.cleaned = false
      s.boardUp = false
      turrets.reset()
      s.queue = []
      s.slabs = []
      s.slabDue = []
      s.slabClear = -1
      s.paper.on = false
      s.paper.held = false
      s.lost = -1
      s.last = -1
      s.give = -1
      s.kept = null
      s.accepted = false
      s.received = true
      s.values = { firstName: '', lastName: '', email: '' }
      s.phase = 'received'
      s.phaseTime = 0
    },
    done: () => s.done,
    gag: () => GAG[s.phase],
    ignoring: () => false,
    typing: () => s.board > 0 && !s.skipped,
    states: stateList
  }
}
