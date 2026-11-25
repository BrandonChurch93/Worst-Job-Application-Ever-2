import { config } from '../../config'
import { hash01, stream } from '../../core/random'
import type { Acting } from '../../cursor/body'
import { boxOf, drawLayout } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { SCREEN_H, TYPE } from '../../shell/parts'
import { smooth } from '../../stage/camera'
import type { CameraPose, DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, StepIo } from '../../stage/types'
import { CAP_TOP, DECK, DECK_TOP, hatchCentre, homePlaces, keyAt, onDeck, seatIndex, seats, shuffled, TRAVEL, typed } from './keyboard'
import { buildLayout, FIELDS, PAPER, PAPER_LINES, PAPER_REST, PAPER_TITLE, SLAB, SLOT, ZONE, type FieldName } from './layout'
import { BITE, filmCamera, makePlan, PILE, pointerAt, START, TIMES, TUG, tugCurve, type Plan } from './script'
import { Turrets, type TurretsState } from './turrets'

const live = config.live
const heights = config.scale.heights
const WELL = -(CAP_TOP + 12)
const MAX_CHARS = 26
const BODY = { x: 14, y: 26 }
const STRIPS = 9
const LIE = heights.card + 9
const IDLE_SHUFFLE = 5

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
  queue: { key: number; wait: number }[]
  keyDown: Record<string, number>
  drum: number
  shock: number
  slab: { n: number; t: number; x: number; landed: boolean } | null
  accepted: boolean
  slow: number
  slowFired: boolean
  realFired: boolean
  paper: { on: boolean; slide: number; x: number; y: number; held: boolean; dx: number; dy: number; feed: number; fx: number; fy: number }
  slot: number
  tug: { t: number; amount: number; cool: number; gx: number; gy: number }
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
  const hatches: [{ x: number; y: number }, { x: number; y: number }] = [hatchCentre(0), hatchCentre(1)]
  const lift = (board: number): number => -(1 - smooth((board - 0.25) / 0.75)) * (CAP_TOP + 8)
  const surface = (x: number, y: number): number => (onDeck(x, y) ? (keyAt(homePlaces(), x, y) >= 0 ? CAP_TOP : DECK_TOP) : 0)
  const turrets = new Turrets(hatches, DECK_TOP, live.step1.hitsBeforeTurretsOverheat, surface)
  const film = config.applicant
  let plan: Plan = makePlan(config.seed, film.filmFirstName, film.filmLastName, film.filmEmail)
  let names: Record<FieldName, string[]> = { firstName: ['p', 'e', 'r'], lastName: ['c', 'o', 'm'], email: ['a', 'at', 'b'] }

  const fresh = (mode: Mode, seed: number): State => ({
    mode, seed, time: 0, phase: 'rest', phaseTime: 0, board: 0, boardUp: false, values: { firstName: '', lastName: '', email: '' }, places: homePlaces(), from: homePlaces(), shuffle: 1, blocks: false,
    rng: stream('step1:shuffle', seed).state(), shuffles: 0, shuffledAt: 0, queue: [], keyDown: {}, drum: 0, shock: 0, slab: null, accepted: false, slow: 0, slowFired: false, realFired: false,
    paper: { on: false, slide: 0, x: PAPER_REST.x, y: SCREEN_H + 20, held: false, dx: 0, dy: 0, feed: -1, fx: 0, fy: 0 }, slot: 0, tug: { t: 0, amount: 0, cool: 0, gx: SLOT.cx, gy: SLOT.cy - PAPER.h },
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
  const seatOf = (key: number, u: number): { x: number; y: number; moved: boolean } => {
    const a = seats[s.from[key]!]!
    const b = seats[s.places[key]!]!
    const own = seats[key]!
    return { x: lerp(a.cx, b.cx, u) - own.w / 2, y: lerp(a.y, b.y, u), moved: s.from[key] !== s.places[key] }
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
    s.blocks = true
    s.shuffles++
    s.shuffledAt = s.phaseTime
    io.emit('keys-shuffle', DECK.x + DECK.w / 2, DECK.y + DECK.h / 2, false)
  }
  const goHome = (): void => {
    s.from = s.places.slice()
    s.places = homePlaces()
    s.shuffle = 0
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
  const strike = (io: StepIo, key: number): void => {
    const name = seats[key]!.name
    const at = seatOf(key, 1)
    io.emit('key-press', at.x + seats[key]!.w / 2, at.y + seats[key]!.h / 2, false)
    s.keyDown[name] = 0.14
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
    s.values[field] = value + (field !== 'email' && value.length === 0 ? ch.toUpperCase() : ch)
    if (s.phase === 'lastName' && seats[key]!.letter) {
      reshuffle(io)
      if (s.shuffles === 4) act(io, 'nervous')
    }
  }
  const paperTarget = (): { x: number; y: number } => ({ x: BITE.x, y: BITE.y })

  const stepKeys = (io: StepIo): void => {
    for (const k of Object.keys(s.keyDown)) {
      s.keyDown[k] = s.keyDown[k]! - io.dt
      if (s.keyDown[k]! <= 0) delete s.keyDown[k]
    }
    if (s.drum > 0) s.drum = Math.max(0, s.drum - io.dt)
    if (s.shuffle < 1) {
      s.shuffle = Math.min(1, s.shuffle + io.dt / TIMES.shuffleSeconds)
      if (s.shuffle >= 1) s.blocks = false
    }
    const typing = s.phase === 'firstName' || s.phase === 'lastName' || s.phase === 'email'
    if (io.pressed && s.board >= 1 && !s.blocks && (typing || s.phase === 'slabs')) {
      const key = keyAt(s.places, io.pointer.x, io.pointer.y)
      if (key >= 0 && s.queue.length < 4) s.queue.push({ key, wait: TIMES.pressWait })
    }
    for (const q of s.queue) q.wait -= io.dt
    const head = s.queue[0]
    if (head) {
      const at = seatOf(head.key, 1)
      const own = seats[head.key]!
      if (head.wait <= 0 || inside({ x: at.x, y: at.y, w: own.w, h: own.h }, io.cursor.x, io.cursor.y)) {
        s.queue.shift()
        strike(io, head.key)
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
      if (s.phase === 'lastName' && !s.blocks && s.phaseTime - s.shuffledAt >= IDLE_SHUFFLE) reshuffle(io)
      if (s.phaseTime >= live.skipLinkAfterSeconds) advance(io)
    }
  }

  const stepTurrets = (io: StepIo): void => {
    const exposed = s.phase === 'firstName' && io.cursor.onPage && !io.cursor.taken
    const hits = turrets.step(io.dt, { x: io.cursor.x + BODY.x, y: io.cursor.y + BODY.y }, exposed, io.emit)
    for (const h of hits) {
      io.emit('bolt-hit-cursor', h.x, h.y, true)
      io.emit('sizzle', h.x, h.y, true)
      io.cursor.hurt('burn')
      io.cursor.knock(h.dx * 900, h.dy * 900, 380)
      io.cursor.react('recoil')
      act(io, 'shocked')
      s.shock = 0.9
      s.values.firstName = s.values.firstName.slice(0, -1)
      s.queue = []
    }
    if (s.shock > 0) {
      s.shock -= io.dt
      if (s.shock <= 0 && s.phase === 'firstName') act(io, 'nervous')
    }
  }

  const stepSlabs = (io: StepIo): void => {
    const every = TIMES.slabEvery
    if (!s.slab) {
      if (s.phaseTime >= TIMES.slabFirst) {
        const x = clamp(io.cursor.x + BODY.x - SLAB.w / 2, pockets.email.x, pockets.email.x + pockets.email.w - SLAB.w)
        s.slab = { n: 0, t: 0, x, landed: false }
      }
      return
    }
    const b = s.slab
    b.t += io.dt
    if (!b.landed && b.t >= TIMES.slabFall) {
      b.landed = true
      const under = inside({ x: b.x, y: slabHome.y, w: SLAB.w, h: SLAB.h }, io.cursor.x + BODY.x, io.cursor.y + BODY.y)
      io.emit('slab-drop', b.x + SLAB.w / 2, slabHome.cy, under)
      if (under) {
        io.cursor.hurt('flattened')
        io.cursor.react('flinch')
      } else io.cursor.react(b.n === 0 ? 'jump' : 'flinch')
      act(io, b.n === 2 ? 'angry' : 'scared')
    }
    if (b.t >= every) {
      if (b.n >= 2) {
        s.slab = null
        s.accepted = true
        s.boardUp = false
        turrets.retract()
        enter('resume')
        act(io, 'proud')
      } else {
        const x = clamp(io.cursor.x + BODY.x - SLAB.w / 2, pockets.email.x, pockets.email.x + pockets.email.w - SLAB.w)
        s.slab = { n: b.n + 1, t: 0, x, landed: false }
      }
    }
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
      p.y = lerp(SCREEN_H + 20, PAPER_REST.y, smooth(p.slide))
      return
    }
    if (p.feed >= 0) {
      p.feed += io.dt
      const u = smooth(p.feed / TIMES.bite)
      const to = paperTarget()
      p.x = lerp(p.fx, to.x, u)
      p.y = lerp(p.fy, to.y, u)
      if (p.feed >= TIMES.bite) {
        enter('tug')
        s.tug = { t: 0, amount: tugCurve(0), cool: 0.5, gx: io.cursor.x + TUG.grip.x, gy: io.cursor.y + TUG.grip.y }
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
      if (io.pressed && inside({ x: p.x, y: p.y, w: PAPER.w, h: PAPER.h }, io.pointer.x, io.pointer.y, 8)) {
        p.held = true
        p.dx = io.pointer.x - p.x
        p.dy = io.pointer.y - p.y
      } else if (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds) feed()
      return
    }
    const k = Math.min(1, io.dt * 28)
    p.x += (io.cursor.x - p.dx - p.x) * k
    p.y += (io.cursor.y - p.dy - p.y) * k
    p.x = clamp(p.x, 0, 1920 - PAPER.w)
    p.y = clamp(p.y, 0, SCREEN_H - 40)
    const over = inside(ZONE, p.x + PAPER.w / 2, p.y + PAPER.h / 2, -10)
    if ((!io.pointer.down && over) || (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds * 2)) feed()
  }

  const stepTug = (io: StepIo): void => {
    const t = s.tug
    t.t += io.dt
    t.gx = io.cursor.x + TUG.grip.x
    t.gy = io.cursor.y + TUG.grip.y
    const dx = t.gx - SLOT.cx
    const dy = t.gy - SLOT.cy
    const d = Math.hypot(dx, dy) || 1
    const rest = Math.max(36, PAPER.h * (1 - t.amount))
    const strain = Math.max(0, d - rest)
    if (strain > 0) {
      const a = TUG.stiff * Math.min(strain, 320) * io.dt
      io.cursor.knock((-dx / d) * a, (-dy / d) * a, 0)
    }
    const pull = Math.min(1, strain / TUG.strainPx)
    if (s.mode === 'film') t.amount = tugCurve(t.t)
    else t.amount = clamp(t.amount + (0.11 - 0.2 * pull + Math.max(0, t.t - 5) * 0.2) * io.dt, 0.03, 1)
    t.cool -= io.dt
    if (pull > 0.7 && t.cool <= 0) {
      t.cool = 0.9
      io.emit('paper-strain', t.gx, t.gy, false)
      io.cursor.react('flinch')
    }
    const px = -dy / d
    const py = dx / d
    io.cursor.setArms(true, [{ x: t.gx - px * 44, y: t.gy - py * 44, z: LIE + 6 }, { x: t.gx + px * 44, y: t.gy + py * 44, z: LIE + 6 }])
    act(io, t.amount > 0.7 ? 'scared' : t.amount > 0.45 ? 'nervous' : 'angry')
    const lost = s.mode === 'film' ? t.t >= TIMES.tugFilm : t.amount >= 0.9 || t.t >= 9
    if (lost) {
      io.cursor.setArms(false)
      if (s.mode === 'live') io.emit('tug-lost', SLOT.cx, SLOT.cy, true)
      io.cursor.take('shredder')
      io.cursor.drive(SLOT.cx - BODY.x, SLOT.cy - 44, 2)
      io.cursor.react('recoil')
      s.shred = 0
      enter('shredded')
    }
  }

  const stepShredded = (io: StepIo): void => {
    const before = s.shred
    s.shred += io.dt
    const crossed = (at: number): boolean => before < at && s.shred >= at
    s.tug.amount = Math.min(1, s.tug.amount + io.dt / 0.25)
    if (crossed(0.2)) io.cursor.drive(SLOT.cx - BODY.x, SLOT.cy - 30, -60)
    if (crossed(0.4)) io.cursor.setOnPage(false)
    if (crossed(1.5)) {
      io.cursor.place(PILE.x, PILE.y)
      io.cursor.setOnPage(true)
      io.cursor.hurt('shredded', 0.45)
      io.emit('strips-zip', PILE.x + BODY.x, PILE.y + BODY.y, true)
    }
    if (crossed(1.9)) {
      io.cursor.hurt('reassembled', 0.6)
      s.received = true
      s.accepted = false
      s.values = { firstName: '', lastName: '', email: '' }
      act(io, 'exhausted')
    }
    if (crossed(2.0)) {
      io.cursor.release()
      enter('received')
    }
  }

  const stepReceived = (io: StepIo): void => {
    if (s.pressed < 0) {
      const auto = s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds
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
    if (inside(ZONE, io.cursor.x + BODY.x, io.cursor.y + BODY.y)) return heights.card
    if (s.board <= 0 || !onDeck(io.cursor.x, io.cursor.y)) return 0
    const key = keyAt(s.places, io.cursor.x, io.cursor.y)
    const top = key >= 0 ? CAP_TOP - (s.keyDown[seats[key]!.name] ? TRAVEL : 0) : DECK_TOP
    return Math.max(0, top + lift(s.board))
  }

  const strips = (out: DrawList): void => {
    const t = s.shred
    const gone = s.phase === 'received' ? smooth(s.phaseTime / 0.5) : 0
    if (s.phase !== 'shredded' && s.phase !== 'received') return
    if (gone >= 1) return
    for (let i = 0; i < STRIPS; i++) {
      const start = 0.45 + i * 0.07
      const u = clamp((t - start) / 0.4, 0, 1)
      if (u <= 0 && s.phase === 'shredded') continue
      const v = s.phase === 'received' ? 1 : u
      const ink = i % 3 === 1
      const tx = PILE.x + BODY.x + (i - (STRIPS - 1) / 2) * 22 + (hash01(i, 3, s.seed) - 0.5) * 16
      const ty = PILE.y + 6 + (hash01(i, 5, s.seed) - 0.5) * 40
      const x = lerp(SLOT.cx + (i - (STRIPS - 1) / 2) * 14, tx, v)
      const y = lerp(SLOT.cy, ty, v)
      const z = Math.sin(Math.PI * v) * 70
      const len = (ink ? 64 : 84) * (1 - gone)
      const zipped = ink && t >= 1.5
      if (zipped) continue
      out.push({ id: `strip-${i}`, part: 'shredder', kind: 'box', x: x - 5, y: y - len / 2, w: 10, h: len, z0: z + 0.4 + i * 0.12, z1: z + 1.4 + i * 0.12, rot: (hash01(i, 7, s.seed) - 0.5) * 1.1 * v, tone: ink ? 'dark' : 'paper' })
    }
  }

  const tugPaper = (out: DrawList): void => {
    const t = s.tug
    const dx = SLOT.cx - t.gx
    const dy = SLOT.cy - t.gy
    const whole = Math.hypot(dx, dy) || 1
    const shown = s.phase === 'shredded' ? whole * Math.max(0, 1 - smooth(s.shred / 0.3)) : whole
    if (shown < 4) return
    const ux = dx / whole
    const uy = dy / whole
    const rot = Math.atan2(dy, dx) - Math.PI / 2
    const startV = whole - shown
    const at = (v: number, across: number): { x: number; y: number } => ({ x: t.gx + ux * v - uy * across, y: t.gy + uy * v + ux * across })
    const c = at(startV + shown / 2, 0)
    out.push({ id: 'resume-paper', part: 'paper', kind: 'box', x: c.x - PAPER.w / 2, y: c.y - shown / 2, w: PAPER.w, h: shown, z0: LIE, z1: LIE + heights.paper, rot, tone: 'paper', mechanism: true })
    const rest = Math.max(36, PAPER.h * (1 - t.amount))
    const scale = whole / rest
    if (s.phase === 'tug' && rest > 70) {
      const p = at(30 * scale + 10, -PAPER.w / 2 + 24 + 50)
      out.push({ id: 'resume-paper-title', part: 'type', kind: 'text', x: p.x - 50, y: p.y - 10, w: 100, h: 20, z0: LIE + 0.1 + heights.paper, z1: LIE + 0.1 + heights.paper, rot, tone: 'ink', words: 'copy:step1.resume.paperTitle', type: PAPER_TITLE })
    }
    PAPER_LINES.forEach((f, i) => {
      const v = f * PAPER.h
      if (v > rest - 12 || s.phase !== 'tug') return
      const w = (PAPER.w - 48) * (i === 3 || i === 6 ? 0.6 : 1)
      const p = at(v * scale, -(PAPER.w - 48 - w) / 2)
      out.push({ id: `resume-paper-line-${i}`, part: 'paper', kind: 'box', x: p.x - w / 2, y: p.y - 4, w, h: 8, z0: LIE + heights.paper, z1: LIE + 0.4 + heights.paper, rot, tone: 'pocket' })
    })
  }

  const stateList = (): string[] => {
    const out = ['rest']
    out.push(s.received ? 'received' : 'prompt')
    if (s.accepted) out.push('accepted')
    if (s.board > 0) out.push('keyboard', 'note')
    else out.push('closed')
    if (s.slab) out.push('slab')
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
      s.board = clamp(s.board + ((s.boardUp ? 1 : -1) * io.dt) / (s.boardUp ? TIMES.riseSeconds : TIMES.sinkSeconds), 0, 1)
      const slotOpen = (s.phase === 'resume' && s.paper.feed >= 0) || s.phase === 'tug' || s.phase === 'shredded'
      s.slot = clamp(s.slot + ((slotOpen ? 1 : -1) * io.dt) / 0.25, 0, 1)

      if (s.phase === 'rest') {
        const onField = FIELDS.some((f) => inside(pockets[f], io.pointer.x, io.pointer.y))
        if ((io.pressed && onField) || (s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds)) openKeyboard(io)
      } else if (s.phase === 'keyboard') {
        if (s.board >= 1 && s.phaseTime >= TIMES.riseSeconds + TIMES.turretDelay) {
          enter('firstName')
          turrets.raise(io.emit)
          act(io, 'plain')
        }
      }
      stepKeys(io)
      stepTurrets(io)
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
      if (s.board > 0) {
        const open = smooth(s.board / 0.3)
        const w = DECK.w * open
        out.push({ id: 'keyboard-well', part: 'keyboard', kind: 'well', x: DECK.x + (DECK.w - w) / 2, y: DECK.y, w, h: DECK.h, z0: WELL, z1: 0, tone: 'dark' })
        over['keyboard-deck'] = { z0: WELL, z1: DECK_TOP + off, mechanism: true }
        for (const side of [0, 1]) over[`hatch-${side}`] = { z0: DECK_TOP + off, z1: DECK_TOP + 0.6 + off }
        const u = smooth(s.shuffle)
        seats.forEach((seat, key) => {
          const at = seatOf(key, u)
          const hop = at.moved ? Math.sin(Math.PI * u) * (18 + 14 * hash01(key, s.shuffles, 11)) : 0
          const wave = s.drum > 0 ? Math.max(0, Math.sin((0.8 - s.drum) * 14 - (seat.cx - DECK.x) / 160)) * TRAVEL : 0
          const press = (s.keyDown[seat.name] ? TRAVEL : 0) + wave
          const top = CAP_TOP + off + hop - press
          over[`key-${seat.name}`] = { x: at.x, y: at.y, z0: DECK_TOP + off + hop, z1: top, mechanism: true }
          const legend = boxOf(layout, `key-${seat.name}`)
          const label = seat.name === 'space' ? null : boxOf(layout, `key-${seat.name}-legend`)
          if (label) over[`key-${seat.name}-legend`] = { x: label.x + (at.x - legend.x), y: label.y + (at.y - legend.y), z0: top, z1: top }
        })
      }
      if (s.slab) {
        const b = s.slab
        const fall = 1 - smooth(b.t / TIMES.slabFall)
        const rise = smooth((b.t - TIMES.slabFall - TIMES.slabLie) / TIMES.slabLift)
        const z = 520 * fall * fall + 520 * rise * rise
        over['email-slab'] = { x: b.x, z0: z, z1: z + heights.slab, mechanism: true }
        over['email-slab-label'] = { x: slabLabel.x + (b.x - slabHome.x), z0: z + heights.slab, z1: z + heights.slab }
      }
      if (s.paper.on && s.phase === 'resume') {
        const dx = s.paper.x - PAPER_REST.x
        const dy = s.paper.y - PAPER_REST.y
        const up = s.paper.held ? LIE + 14 : s.paper.feed >= 0 ? LIE : 0.6
        over['resume-paper'] = { x: s.paper.x, y: s.paper.y, z0: up, z1: up + heights.paper, mechanism: true }
        const title = boxOf(layout, 'resume-paper-title')
        over['resume-paper-title'] = { x: title.x + dx, y: title.y + dy, z0: up + heights.paper + 0.1, z1: up + heights.paper + 0.1 }
        PAPER_LINES.forEach((_, i) => {
          const line = boxOf(layout, `resume-paper-line-${i}`)
          over[`resume-paper-line-${i}`] = { x: line.x + dx, y: line.y + dy, z0: up + heights.paper, z1: up + heights.paper + 0.4 }
        })
      }
      for (const f of FIELDS) over[`${f}-value`] = { z0: 0.1, z1: 0.1 }
      if (s.pressed >= 0) over['continue-cap'] = { z1: heights.button - TRAVEL }
      drawLayout(out, layout, { states: stateList(), over, runtime: { 'step1.firstName': s.values.firstName, 'step1.lastName': s.values.lastName, 'step1.email': s.values.email } })
      const field = FIELD_OF[s.phase]
      if (field) {
        const p = pockets[field]
        out.push({ id: 'field-focus', part: 'shell', kind: 'box', x: p.x + 14, y: p.y + p.h - 5, w: p.w - 28, h: 3, z0: 0.1, z1: 0.5, tone: 'accent' })
        if (Math.floor(s.time * 2.5) % 2 === 0 && s.phase !== 'slabs') {
          const w = s.values[field] ? block(TYPE.value.font, s.values[field], TYPE.value.px).width : 0
          out.push({ id: 'field-caret', part: 'shell', kind: 'box', x: values[field].x + w + 4, y: p.y + 16, w: 3, h: p.h - 32, z0: 0.1, z1: 0.5, tone: 'ink' })
        }
      }
      if (s.board > 0) turrets.draw(out, off)
      if (s.slot > 0) {
        const w = SLOT.w * smooth(s.slot)
        out.push({ id: 'shredder-slot', part: 'shredder', kind: 'well', x: SLOT.cx - w / 2, y: SLOT.cy - SLOT.h / 2, w, h: SLOT.h, z0: -44, z1: 0, tone: 'dark' })
        const spin = s.phase === 'tug' || s.phase === 'shredded' ? Math.sin(s.time * 40) * 1.5 : 0
        for (const side of [0, 1]) {
          const y = SLOT.cy + (side === 0 ? -SLOT.h / 2 - 12 : SLOT.h / 2 + 2)
          out.push({ id: `shredder-jaw-${side}`, part: 'shredder', kind: 'capsule', x: SLOT.cx - w / 2 - 8 + spin, y, w: w + 16, h: 10, z0: 0, z1: 7, tone: 'metal', mechanism: true })
        }
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
        if (!p.on || p.slide < 1) return { x: PAPER_REST.x + PAPER.w / 2, y: PAPER_REST.y + 40, down: false }
        if (p.feed >= 0) return { x: s.cx, y: s.cy, down: false }
        if (!p.held) return { x: p.x + PAPER.w / 2, y: p.y + 40, down: blink }
        return { x: ZONE.x + ZONE.w / 2 - PAPER.w / 2 + p.dx, y: ZONE.y + ZONE.h / 2 - PAPER.h / 2 + p.dy, down: false }
      }
      if (s.phase === 'tug') return { x: SLOT.cx - 220, y: SLOT.cy - 520, down: false }
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
      s.slab = null
      s.paper.on = false
      s.paper.held = false
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
