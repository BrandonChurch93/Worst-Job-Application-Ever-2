import { config, stepHz } from '../../config'
import { hash01 } from '../../core/random'
import type { Acting } from '../../cursor/body'
import { boxOf, drawLayout } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { SCREEN_H, TYPE } from '../../shell/parts'
import { homeDistance, smooth } from '../../stage/camera'
import type { CameraPose, DrawList, Emit, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, StepIo } from '../../stage/types'
import { CAP_TOP, DECK, DECK_TOP, hatchCentre, homePlaces, keyAt, onDeck, seatIndex, seats, SINK, TIP, tipOf, TRAVEL, typed } from './keyboard'
import { buildLayout, FIELDS, SLAB, STAGES, stageState, type FieldName } from './layout'
import { makeResume } from './resume'
import { filmCamera, makePlan, pointerAt, SHRED, START, SWAP, TIMES, type Plan } from './script'
import { BLAST, Turrets, TURRET, type TurretsState } from './turrets'

const live = config.live
const heights = config.scale.heights
const WELL = -(CAP_TOP + 12)
const MAX_CHARS = 26
const BODY = { x: 14, y: 26 }
const DROP = CAP_TOP + 8
const SWING = 0.12
const SHAKE = { seconds: 0.25, px: 5.5, reach: 460, hop: 15 }
const RATTLE = { seconds: 0.22, px: 2.4 }
const NEAR = 130
const SINGE = 0.2
const WIPE: FieldName[] = ['email', 'name']
const HOME = homePlaces()
const SLAB_FALL = { seconds: 0.3, high: 1200, thrown: 0.3, amp: 1.05, sight: 0.6, fps: 60 }
const SLAB_SUNK = 3
const GO_EDGE = 6
const SLAB_SHADOW = { from: 0.3, to: 1.12, dark: 0.8 }
const BITS = { speed: [240, 640], up: [820, 1500], pull: 4200, turn: 7, thick: 10, shard: 0.34, bias: 0.55 }
const CRACKS = { count: 6, parts: 3, long: [46, 96], bend: 0.55, wide: [5, 2], grow: 0.09 }
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
const LEGEND_CLEAR = 0

type Phase = 'rest' | 'keyboard' | 'name' | 'email' | 'slabs' | 'resume'
const GAG: Record<Exclude<Phase, 'resume'>, string> = { rest: 'step1.keyboard', keyboard: 'step1.keyboard', name: 'step1.firstName', email: 'step1.email', slabs: 'step1.email' }
const FIELD_OF: Partial<Record<Phase, FieldName>> = { rest: 'name', keyboard: 'name', name: 'name', email: 'email', slabs: 'email' }

interface State {
  mode: Mode
  seed: number
  time: number
  phase: Phase
  phaseTime: number
  stage: number
  stageTime: number
  fields: { done: number; total: number }
  board: number
  boardUp: boolean
  values: Record<FieldName, string>
  queue: { key: number; wait: number; click: number }[]
  held: string
  click: number
  keyDown: Record<string, number>
  drum: number
  shock: number
  slabs: { t: number; x: number; y: number; base: number; landed: boolean; since: number }[]
  slabDue: { t: number; x: number; y: number; base: number }[]
  slabClear: number
  broken: { key: number; t: number; ux: number; uy: number; x: number; y: number }[]
  craters: { x: number; y: number; t: number }[]
  accepted: boolean
  slow: number
  slowFired: boolean
  realFired: boolean
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
  caret: number
  glow: number
  pressed: number
  skipped: boolean
  cleaned: boolean
  done: boolean
  cue: number
  cx: number
  cy: number
  acted: Acting | null
}

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
const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number, pad = 0): boolean => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad

export function makePage(): PageLogic {
  const layout = buildLayout()
  const beats = config.film.beats.filter((b) => b.unit === 'step1')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const pockets = Object.fromEntries(FIELDS.map((f) => [f, boxOf(layout, `${f}-pocket`)])) as Record<FieldName, ReturnType<typeof boxOf>>
  const values = Object.fromEntries(FIELDS.map((f) => [f, boxOf(layout, `${f}-value`)])) as Record<FieldName, ReturnType<typeof boxOf>>
  const slabHome = boxOf(layout, 'email-slab')
  const slabLabel = boxOf(layout, 'email-slab-label')
  const go = boxOf(layout, 'continue-cap')
  const hatchY = [boxOf(layout, 'hatch-0').y, boxOf(layout, 'hatch-1').y]
  const hatches: [{ x: number; y: number }, { x: number; y: number }] = [hatchCentre(0), hatchCentre(1)]
  const lift = (board: number, up = s.boardUp): number => {
    const u = clamp((board - 0.25) / 0.75, 0, 1)
    if (!up) return -DROP * (1 - u) ** 2
    if (u < 0.8) return -DROP * (1 - (1 + SWING) * smooth(u / 0.8))
    return DROP * SWING * (1 - ((u - 0.8) / 0.2) ** 2)
  }
  const surface = (x: number, y: number): number => (onDeck(x, y) ? (keyAt(HOME, x, y) >= 0 ? CAP_TOP : DECK_TOP) : 0)
  const turrets = new Turrets(hatches, DECK_TOP, live.step1.hitsBeforeTurretsOverheat, surface, BLAST)
  const film = config.applicant
  let plan: Plan = makePlan(film.filmFirstName, film.filmEmail)
  const names: Record<FieldName, string[]> = { name: ['p', 'e', 'r'], email: ['a', 'at', 'b'] }

  const fresh = (mode: Mode, seed: number): State => ({
    mode, seed, time: 0, phase: 'rest', phaseTime: 0, stage: 0, stageTime: SWAP.in, fields: { done: 0, total: STAGES.length }, board: 0, boardUp: false, values: { name: '', email: '' },
    queue: [], held: '', click: 0, keyDown: {}, drum: 0, shock: 0, slabs: [], slabDue: [], slabClear: -1, broken: [], craters: [], accepted: false, slow: 0, slowFired: false, realFired: false,
    singe: 0, armed: false, seat: 9, shake: 9, shakeAt: { x: 0, y: 0 }, struckAt: { x: 0, y: 0 }, shakeAmp: 1, thud: 9, thudKey: -1, thudLean: { x: 0, y: 1 }, caret: 9, glow: 9,
    pressed: -1, skipped: false, cleaned: false, done: false, cue: 0, cx: START.x, cy: START.y, acted: null
  })
  let s = fresh('live', config.seed)

  const enter = (phase: Phase): void => {
    s.phase = phase
    s.phaseTime = 0
    s.slow = 0
    s.queue = []
  }
  const act = (io: StepIo, a: Acting): void => {
    if (s.acted === a) return
    s.acted = a
    io.cursor.act(a)
  }
  const stageTo = (stage: number): void => {
    s.stage = stage
    s.stageTime = 0
    s.fields.done = stage
  }
  const shows = (stage: number): boolean => (s.stage === stage && s.stageTime >= SWAP.in) || (s.stage === stage + 1 && s.stageTime < SWAP.out)
  const resume = makeResume({
    act: (io, a) => act(io, a),
    clear: () => s.board <= 0,
    wipe(share) {
      s.accepted = false
      WIPE.forEach((f, i) => {
        const left = 1 - clamp(share * WIPE.length - i, 0, 1)
        s.values[f] = s.values[f].slice(0, Math.ceil(s.values[f].length * left))
      })
    }
  })
  const openKeyboard = (io: StepIo): void => {
    s.boardUp = true
    io.emit('keyboard-rise', DECK.x + DECK.w / 2, DECK.y + DECK.h / 2, false)
    enter('keyboard')
  }
  const advance = (io: StepIo): void => {
    if (s.phase === 'name') {
      turrets.retract()
      stageTo(1)
      io.emit('field-done', pockets.name.cx, pockets.name.cy, false)
      enter('email')
      act(io, 'plain')
    } else if (s.phase === 'email') {
      enter('slabs')
      act(io, 'proud')
    }
  }
  const strike = (io: StepIo, key: number, click: number): void => {
    const name = seats[key]!.name
    io.emit('key-press', seats[key]!.cx, seats[key]!.cy, false)
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
    s.values[field] = value + (field === 'name' && (value.length === 0 || value.endsWith(' ')) ? ch.toUpperCase() : ch)
  }
  const stepKeys = (io: StepIo): void => {
    const typing = s.phase === 'name' || s.phase === 'email'
    if (io.pressed) s.click++
    if (s.held !== '' && !(io.pointer.down && (typing || s.phase === 'slabs'))) s.held = ''
    for (const k of Object.keys(s.keyDown)) {
      s.keyDown[k] = Math.max(s.keyDown[k]! - io.dt, k === s.held ? PRESS - HOLD : 0)
      if (s.keyDown[k]! <= 0) delete s.keyDown[k]
    }
    if (s.drum > 0) s.drum = Math.max(0, s.drum - io.dt)
    if (io.pressed && s.board >= 1 && (typing || s.phase === 'slabs')) {
      const key = keyAt(HOME, io.pointer.x, io.pointer.y)
      if (key >= 0 && s.queue.length < 4) s.queue.push({ key, wait: TIMES.pressWait, click: s.click })
    }
    for (const q of s.queue) q.wait -= io.dt
    const head = s.queue[0]
    if (head) {
      if (head.wait <= 0 || inside(seats[head.key]!, io.cursor.x, io.cursor.y)) {
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
      if (s.phaseTime >= live.skipLinkAfterSeconds) advance(io)
    }
  }

  const stepTurrets = (io: StepIo): void => {
    if (s.phase === 'name' && !s.armed && s.phaseTime >= TIMES.turretDelay) {
      s.armed = true
      io.emit('candidate-sensed', (turrets.at[0].x + turrets.at[1].x) / 2, turrets.at[0].y, false)
      turrets.raise(io.emit)
    }
    const body = { x: io.cursor.x + BODY.x, y: io.cursor.y + BODY.y }
    const exposed = s.phase === 'name' && io.cursor.onPage && !io.cursor.taken && s.shock <= 0
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
      s.thudKey = keyAt(HOME, body.x, body.y)
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
        s.values.name = s.values.name.slice(0, -1)
        s.glow = 0
      }
    }
    if (s.shock > 0) {
      s.shock -= io.dt
      if (s.shock <= 0 && s.phase === 'name') act(io, 'nervous')
    }
  }

  const slabAim = (io: StepIo): { x: number; y: number; base: number } => {
    const all = [...s.slabs, ...s.slabDue]
    const x = clamp(io.cursor.x + BODY.x - SLAB.w / 2, DECK.x + SLAB_GAP, DECK.x + DECK.w - SLAB.w - SLAB_GAP)
    const y = clamp(io.cursor.y + BODY.y - SLAB.h / 2, DECK.y + SLAB_GAP, DECK.y + DECK.h - SLAB.h - SLAB_GAP)
    const x0 = DECK.x + SLAB_GAP
    const x1 = DECK.x + DECK.w - SLAB.w - SLAB_GAP
    const y0 = DECK.y + SLAB_GAP
    const y1 = DECK.y + DECK.h - SLAB.h - SLAB_GAP
    const free = (px: number, py: number): boolean => all.every((b) => px >= b.x + SLAB.w + SLAB_CLEAR || px + SLAB.w + SLAB_CLEAR <= b.x || py >= b.y + SLAB.h + SLAB_CLEAR || py + SLAB.h + SLAB_CLEAR <= b.y)
    if (free(x, y)) return { x, y, base: DECK_TOP + SLAB_SUNK + TRAVEL }
    let best = { x, y, far: Infinity }
    const xs = [x, x0, x1, ...all.flatMap((b) => [b.x - SLAB.w - SLAB_CLEAR, b.x + SLAB.w + SLAB_CLEAR])]
    const ys = [y, y0, y1, ...all.flatMap((b) => [b.y - SLAB.h - SLAB_CLEAR, b.y + SLAB.h + SLAB_CLEAR])]
    for (const px of xs) for (const py of ys) {
      if (px < x0 || px > x1 || py < y0 || py > y1 || !free(px, py)) continue
      const far = Math.hypot(px - x, py - y)
      if (far < best.far) best = { x: px, y: py, far }
    }
    return { x: best.x, y: best.y, base: DECK_TOP + SLAB_SUNK + TRAVEL }
  }

  const slabGone = (TIMES.slabCount - 1) * SLAB_OUT.every + SLAB_OUT.wait + SLAB_OUT.fly
  const stepSlabs = (io: StepIo): void => {
    for (const d of s.slabDue) d.t += io.dt
    while (s.slabDue.length && s.slabDue[0]!.t >= SLAB_LAND - SLAB_FALL.seconds - 1.5 * io.dt) s.slabs.push({ ...s.slabDue.shift()!, landed: false, since: 0 })
    s.slabs.forEach((b, n) => {
      b.t += io.dt
      if (b.landed) b.since += io.dt
      if (b.landed || b.t < SLAB_LAND) return
      b.landed = true
      const under = inside({ x: b.x, y: b.y, w: SLAB.w, h: SLAB.h }, io.cursor.x + BODY.x, io.cursor.y + BODY.y)
      io.emit('slab-drop', b.x + SLAB.w / 2, b.y + SLAB.h / 2, under)
      const cx = b.x + SLAB.w / 2
      const cy = b.y + SLAB.h / 2
      let broke = 0
      seats.forEach((seat, key) => {
        if (s.broken.some((k) => k.key === key) || !(seat.x < b.x + SLAB.w && seat.x + seat.w > b.x && seat.y < b.y + SLAB.h && seat.y + seat.h > b.y)) return
        const dx = seat.cx - cx + (hash01(key, n, 61) - 0.5) * 60
        const dy = (seat.cy - cy) * 2.4 - BITS.bias * 100 + (hash01(key, n, 62) - 0.5) * 60
        const d = Math.hypot(dx, dy) || 1
        const ux = dx / d
        const uy = dy / d
        const px = clamp(seat.cx, b.x, b.x + SLAB.w)
        const py = clamp(seat.cy, b.y, b.y + SLAB.h)
        const out = Math.min(ux > 0 ? (b.x + SLAB.w - px) / ux : ux < 0 ? (b.x - px) / ux : Infinity, uy > 0 ? (b.y + SLAB.h - py) / uy : uy < 0 ? (b.y - py) / uy : Infinity)
        s.broken.push({ key, t: 0, ux, uy, x: px + ux * out, y: py + uy * out })
        broke++
      })
      s.craters.push({ x: b.x, y: b.y, t: 0 })
      if (broke) io.emit('keys-break', cx, cy, false)
      io.emit('page-crack', cx, cy, false)
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
      stageTo(2)
      io.emit('field-done', pockets.email.cx, pockets.email.cy, false)
      enter('resume')
      resume.begin(io)
      return
    }
    const sent = s.slabs.length + s.slabDue.length
    if (sent < TIMES.slabCount) {
      if (s.phaseTime >= TIMES.slabFirst + sent * TIMES.slabEvery) {
        const due = { t: 0, ...slabAim(io) }
        s.slabDue.push(due)
        io.emit('slab-shadow', due.x + SLAB.w / 2, due.y + SLAB.h / 2, false)
      }
      return
    }
    if (s.slabs.length === TIMES.slabCount && s.slabs[s.slabs.length - 1]!.t >= SLAB_LAND + TIMES.slabLie) s.slabClear = 0
  }

  const stepContinue = (io: StepIo): void => {
    if (s.pressed < 0) {
      const auto = s.mode === 'live' && resume.doneFor() + SHRED.end >= live.skipLinkAfterSeconds
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
    const stage = shows(2) ? resume.ground(io) : null
    if (stage !== null) return stage
    if (s.board <= 0 && (inside(go, io.cursor.x, io.cursor.y, GO_EDGE) || inside(go, io.cursor.x + BODY.x, io.cursor.y + BODY.y, GO_EDGE))) return heights.button - (s.pressed >= 0 ? TRAVEL : 0)
    if (s.board <= 0 || !onDeck(io.cursor.x, io.cursor.y)) return 0
    const key = keyAt(HOME, io.cursor.x, io.cursor.y)
    const down = key >= 0 ? s.keyDown[seats[key]!.name] : undefined
    const top = key >= 0 ? CAP_TOP - (down ? TRAVEL * Math.max(0, footing(PRESS - down)) : 0) : DECK_TOP
    return Math.max(0, top + lift(s.board))
  }

  const stateList = (): string[] => {
    const out = ['rest']
    if (s.stage === 0 || shows(0)) out.push(stageState('name'))
    if (shows(1)) out.push(stageState('email'))
    if (shows(1) && s.accepted) out.push('accepted')
    if (shows(2)) out.push(...resume.states())
    if (s.board > 0) out.push('keyboard', 'note')
    else out.push('closed')
    if (s.slabs.length) out.push('slab')
    return out
  }

  return {
    id: 'step1', unit: 'step1', width: 1920, height: SCREEN_H, layout, gags, start: START, control: 'pointer',
    reset(ctx: PageContext) {
      turrets.reset()
      s = fresh(ctx.mode, ctx.seed)
      resume.reset(ctx.mode, ctx.seed)
      const a = ctx.applicant ?? { firstName: film.filmFirstName, email: film.filmEmail }
      plan = makePlan(a.firstName, a.email)
    },
    step(io: StepIo) {
      s.time = io.time
      s.phaseTime += io.dt
      s.cx = io.cursor.x
      s.cy = io.cursor.y
      s.stageTime += io.dt
      if (s.skipped && !s.cleaned) {
        s.cleaned = true
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
      s.caret = Math.min(9, s.caret + io.dt)
      s.glow = Math.min(9, s.glow + io.dt)
      if (s.phase === 'rest') {
        const onField = inside(pockets.name, io.pointer.x, io.pointer.y)
        if ((io.pressed && onField) || (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds)) openKeyboard(io)
      } else if (s.phase === 'keyboard') {
        if (s.board >= 1) {
          enter('name')
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
      for (const k of s.broken) k.t += io.dt
      for (const c of s.craters) c.t += io.dt
      if (s.phase === 'slabs') stepSlabs(io)
      else if (s.phase === 'resume') {
        resume.step(io)
        if (resume.done()) {
          s.fields.done = STAGES.length
          stepContinue(io)
        }
      }
      io.cursor.setGround(ground(io))
    },
    save: () => JSON.parse(JSON.stringify({ ...s, turrets: turrets.s, resume: resume.save() })) as unknown,
    load(state) {
      const { turrets: t, resume: r, ...rest } = JSON.parse(JSON.stringify(state)) as State & { turrets: TurretsState; resume: unknown }
      s = rest
      turrets.load(t)
      resume.load(r)
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
        const shake = hit * hit * SHAKE.px * s.shakeAmp * Math.cos(s.shake * 58)
        const shaken = Math.abs(shake) > 0.01
        over['keyboard-deck'] = { y: DECK.y + shake, z0: WELL, z1: DECK_TOP + off, ...(shaken ? { moved: true } : {}), v: [s.board, Math.max(0, off), shake] }
        for (const side of [0, 1]) over[`hatch-${side}`] = { y: hatchY[side]! + shake, z0: DECK_TOP + off, z1: DECK_TOP + 0.6 + off, ...(shaken ? { moved: true } : {}) }
        const scorches = turrets.s.scorches
        const onSite = s.mode === 'live'
        const jarred = onSite && s.shakeAmp === THUD.shake && s.thud < JAR.seconds
        const gone = new Set(s.broken.map((k) => k.key))
        seats.forEach((seat, key) => {
          if (gone.has(key)) {
            over[`key-${seat.name}`] = null
            if (seat.name !== 'space') over[`key-${seat.name}-legend`] = null
            return
          }
          const at = { x: seat.x, y: seat.y + shake }
          const down = s.keyDown[seat.name]
          const far = Math.hypot(at.x + seat.w / 2 - s.shakeAt.x, at.y + seat.h / 2 - s.shakeAt.y)
          let thrown = false
          if (jarred && far < JAR.reach) {
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
          const sprung = !onSite && !down && !pinned && key === s.thudKey ? spring(s.thud, THUD.held, THUD.back) : 0
          const hop = kick + rattle + THUD.pop * 4 * Math.max(0, -sprung)
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
          const sunk = clamp(held, -0.25, 1)
          const press = sunk * TRAVEL + wave
          const top = CAP_TOP + off + hop - press
          if (key === s.thudKey) strikeTop = Math.max(strikeTop, top)
          const away = shaken || thrown
          const seen = top > 0 || at.y >= mouth + LEGEND_CLEAR
          const depth = clamp(press / TRAVEL, 0, 1)
          const lean = pinned ? 0 : down ? TIP.press * clamp(struck, -1, 1) : key === s.thudKey && !onSite ? TIP.rad * tipOf(s.thud) : 0
          const sink = onSite && down && !pinned ? clamp(struck, -1, 1) : 0
          const tipX = lean * (down ? 0 : s.thudLean.x) * Math.min(1, SLAB_HOP.wide / seat.w)
          const tipY = lean * (down ? 1 : s.thudLean.y)
          over[`key-${seat.name}`] = { x: at.x, y: at.y, z0: DECK_TOP + off + hop, z1: top, mechanism: top >= heights.machineMinTop, moved: away, ...(down ? { tone: 'pocket' as const } : {}), v: [depth, hop, 0, heat, tipY, tipX, ...(onSite ? [sink] : [])] }
          const legend = boxOf(layout, `key-${seat.name}`)
          const label = seat.name === 'space' ? null : boxOf(layout, `key-${seat.name}-legend`)
          if (label) over[`key-${seat.name}-legend`] = !seen ? null : { x: label.x + (at.x - legend.x) - TIP.lever * tipX + SINK.x * sink, y: label.y + (at.y - legend.y) - TIP.lever * tipY + SINK.y * sink, z0: top, z1: top, moved: away }
        })
      }
      const per = stepHz / SLAB_FALL.fps
      const late = ((Math.round(((s.time * SLAB_FALL.fps) % 1) * per) + 1) % per) / stepHz
      const slabAt = (b: { t: number; x: number; y: number; base: number }, n: number): { x: number; y: number; z: number } => {
        const u = clamp((b.t - (b.t < SLAB_LAND ? late : 0) - SLAB_LAND + SLAB_FALL.seconds) / SLAB_FALL.seconds, 0, 1)
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
      for (const f of FIELDS) over[`${f}-value`] = { z0: 0.1, z1: 0.1 }
      if (shows(2)) resume.pose(over, layout)
      if (resume.received()) {
        const top = heights.button - (s.pressed >= 0 ? TRAVEL : 0)
        over['continue-cap'] = { tone: 'accent', z1: top }
        over['continue-label'] = { tone: 'inkLight', z0: top, z1: top }
      }
      drawLayout(out, layout, { states: stateList(), over, runtime: { 'step1.name': s.values.name, 'step1.email': s.values.email } })
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
      const onBoard = (x: number, y: number): boolean => s.board > 0 && x >= DECK.x && x <= DECK.x + DECK.w && y >= DECK.y && y <= DECK.y + DECK.h
      s.slabDue.forEach((d, n) => {
        const u = smooth(clamp(d.t / (SLAB_LAND - SLAB_FALL.seconds), 0, 1))
        const k = SLAB_SHADOW.from + (SLAB_SHADOW.to - SLAB_SHADOW.from) * u
        out.push({ id: `slab-shadow-${s.slabs.length + n}`, part: 'slabs', kind: 'box', x: d.x + (SLAB.w * (1 - k)) / 2, y: d.y + (SLAB.h * (1 - k)) / 2, w: SLAB.w * k, h: SLAB.h * k, z0: CAP_TOP + 1.2 + off, z1: CAP_TOP + 1.2 + off, r: 10, tone: 'dark', v: [SLAB_SHADOW.dark * (0.35 + 0.65 * u)] })
      })
      s.slabs.forEach((b, n) => {
        if (b.landed) return
        const k = SLAB_SHADOW.to
        out.push({ id: `slab-shadow-${n}`, part: 'slabs', kind: 'box', x: b.x + (SLAB.w * (1 - k)) / 2, y: b.y + (SLAB.h * (1 - k)) / 2, w: SLAB.w * k, h: SLAB.h * k, z0: CAP_TOP + 1.2 + off, z1: CAP_TOP + 1.2 + off, r: 10, tone: 'dark', v: [SLAB_SHADOW.dark + (1 - SLAB_SHADOW.dark) * 0.5 * clamp((b.t - SLAB_LAND + SLAB_FALL.seconds) / SLAB_FALL.seconds, 0, 1)] })
      })
      if (shows(1)) s.craters.forEach((c, n) => {
        if (s.board > 0) out.push({ id: `slab-crater-${n}`, part: 'slabs', kind: 'box', x: c.x - 3, y: c.y - 3, w: SLAB.w + 6, h: SLAB.h + 6, z0: DECK_TOP + 0.7 + off, z1: DECK_TOP + 0.7 + off, r: 12, tone: 'dark', v: [1] })
        const cx = c.x + SLAB.w / 2
        const cy = c.y + SLAB.h / 2
        for (let i = 0; i < CRACKS.count; i++) {
          let a = ((i + hash01(i, n, 71)) / CRACKS.count) * Math.PI * 2
          const reach = Math.min(Math.abs(SLAB.w / 2 / Math.cos(a)), Math.abs(SLAB.h / 2 / Math.sin(a)))
          let x = cx + Math.cos(a) * reach
          let y = cy + Math.sin(a) * reach
          for (let j = 0; j < CRACKS.parts; j++) {
            const grown = clamp((c.t - j * CRACKS.grow * 0.5) / CRACKS.grow, 0, 1)
            if (grown <= 0) break
            a += (hash01(i * 7 + j, n, 72) - 0.5) * 2 * CRACKS.bend
            const long = (CRACKS.long[0]! + (CRACKS.long[1]! - CRACKS.long[0]!) * hash01(i * 7 + j, n, 73)) * grown
            const wide = CRACKS.wide[0]! + (CRACKS.wide[1]! - CRACKS.wide[0]!) * (j / (CRACKS.parts - 1))
            const mx = x + (Math.cos(a) * long) / 2
            const my = y + (Math.sin(a) * long) / 2
            const on = onBoard(mx, my)
            const inDeck = mx >= DECK.x && mx <= DECK.x + DECK.w && my >= DECK.y && my <= DECK.y + DECK.h
            const z = on ? CAP_TOP + 0.8 + off : 0.4
            if (on || !inDeck) out.push({ id: `slab-crack-${n}-${i}-${j}`, part: 'slabs', kind: 'box', x: mx - long / 2 - 1, y: my - wide / 2, w: long + 2, h: wide, z0: z, z1: z, rot: a, tone: 'dark', v: [1] })
            x += Math.cos(a) * long
            y += Math.sin(a) * long
          }
        }
      })
      if (shows(1)) {
        for (const k of s.broken) {
          const seat = seats[k.key]!
          for (const part of [0, 1]) {
            const h = (salt: number): number => hash01(k.key, part, salt)
            const up = BITS.up[0]! + (BITS.up[1]! - BITS.up[0]!) * h(81)
            const air = (2 * up) / BITS.pull
            const t = Math.min(k.t, air)
            const speed = (BITS.speed[0]! + (BITS.speed[1]! - BITS.speed[0]!) * h(82)) * (part === 0 ? 1 : 1.25)
            const turn = part === 0 ? 0 : (h(83) - 0.5) * 1.4
            const ux = k.ux * Math.cos(turn) - k.uy * Math.sin(turn)
            const uy = k.ux * Math.sin(turn) + k.uy * Math.cos(turn)
            const x = k.x + ux * speed * t
            const y = k.y + uy * speed * t
            const w = part === 0 ? seat.w : Math.min(seat.w, seat.h) * BITS.shard
            const hh = part === 0 ? seat.h : seat.h * BITS.shard
            const rest = onBoard(x, y) ? CAP_TOP + 1 + off : 0.5
            const z = Math.max(rest, CAP_TOP + up * t - (BITS.pull / 2) * t * t)
            const flips = 1 + Math.floor(h(84) * 2)
            out.push({ id: `slab-bit-${k.key}-${part}`, part: 'slabs', kind: 'box', x: x - w / 2, y: y - hh / 2, w, h: hh, z0: z, z1: z + (part === 0 ? CAP_TOP - DECK_TOP : BITS.thick * 0.5), r: 6, rot: (h(85) - 0.5) * BITS.turn * t, tone: 'raised', v: [flips * Math.PI * (t / air), (h(86) - 0.5) * 2 * Math.PI * (t / air) * (t < air ? 1 : 0)] })
          }
        }
      }
      const field = FIELD_OF[s.phase]
      if (field && shows(FIELDS.indexOf(field))) {
        const p = pockets[field]
        const glow = s.glow < PULSE.hold ? 1 : Math.max(0, 1 - (s.glow - PULSE.hold) / PULSE.fade)
        out.push({ id: 'field-focus', part: 'shell', kind: 'box', x: p.x + 14, y: p.y + p.h - 5, w: p.w - 28, h: 3, z0: 0.1, z1: 0.5, tone: 'accent', v: [glow] })
        const jump = s.caret < 0.2 ? 6 * Math.sin((Math.PI * s.caret) / 0.2) : 0
        if ((Math.floor(s.time * 2.5) % 2 === 0 || glow > 0 || jump > 0) && s.phase !== 'slabs') {
          const w = s.values[field] ? block(TYPE.value.font, s.values[field], TYPE.value.px).width : 0
          out.push({ id: 'field-caret', part: 'shell', kind: 'box', x: values[field].x + w + 4, y: p.y + 16 - jump, w: 3, h: p.h - 32, z0: 0.1, z1: 0.5, tone: 'ink', v: [jump] })
        }
      }
      if (s.board > 0) turrets.draw(out, off)
      if (s.board > 0 && s.thud < STRIKE.seconds && turrets.s.hits > 0) out.push({ id: `scorch-${STRIKE.id + turrets.s.hits}`, part: 'turrets', kind: 'disc', x: s.struckAt.x, y: s.struckAt.y, w: 0, h: 0, z0: STRIKE.z + off, z1: STRIKE.z + off, tone: 'dark', v: [1 - s.thud / TURRET.scorchSeconds, 1, STRIKE.z + off - strikeTop + STRIKE.over, ...(s.mode === 'live' ? [1] : [])] })
      if (shows(2)) resume.draw(out)
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
      const spot = (key: number): { x: number; y: number } => ({ x: seats[key]!.cx, y: seats[key]!.cy })
      if (s.phase === 'rest') return { x: pockets.name.cx, y: pockets.name.cy, down: blink }
      if (s.phase === 'keyboard') return { ...spot(seatIndex[names.name[0]!]!), down: false }
      if (s.phase === 'name' || s.phase === 'email') {
        const field = FIELD_OF[s.phase]!
        const n = s.values[field].length
        const want = n < live.step1.minChars ? names[field][n % names[field].length]! : 'enter'
        const p = spot(seatIndex[want]!)
        const hint: Hint = { ...p, down: blink && s.queue.length === 0 }
        if (s.phase === 'name') {
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
      if (!resume.done()) return resume.hint(blink)
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
      s.broken = []
      s.craters = []
      s.accepted = false
      s.values = { name: '', email: '' }
      s.phase = 'resume'
      s.phaseTime = 0
      s.stage = 2
      s.stageTime = SWAP.in
      s.fields.done = STAGES.length
      resume.skip()
    },
    done: () => s.done,
    gag: () => (s.phase === 'resume' ? resume.gag() : GAG[s.phase]),
    fields: () => ({ ...s.fields }),
    ignoring: () => false,
    typing: () => s.board > 0 && !s.skipped,
    states: stateList
  }
}
