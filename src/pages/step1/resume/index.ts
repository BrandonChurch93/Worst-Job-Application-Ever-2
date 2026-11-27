import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { HAND, type Acting } from '../../../cursor/body'
import { boxOf, find } from '../../../shell/layout'
import type { LayoutNode } from '../../../copy'
import { smooth } from '../../../stage/camera'
import type { DrawList, Hint, Mode, Shape, StepIo } from '../../../stage/types'
import { SNAP_FROM, slotShapes } from '../real/shredderShape'
import { browseBox, landing, PAPER, PAPER_LINES, PAPER_REST, PAPER_TITLE, PLATE, resumeNodes, RING, SLOT, STAGE, TILE, uploadGlyph, WIN, ZONE } from './layout'
import { BITE, FLOW, FRINGE, HOOD, PILE, RESUME, RESUME_TIMES as TIMES, SHRED, TUG, tugCurve, tugReach, WIND } from './script'

export { resumeNodes, STAGE } from './layout'
export { filmCamera, planResume, type Writer } from './script'

const live = config.live
const heights = config.scale.heights
const BODY = { x: 14, y: 26 }
const STRIPS = 20
const STRIP = { paper: 42, ink: 26, wide: 2.5, every: 4, askew: 0.44 }
// How far outside Browse files and the file's tile a press still counts, in page pixels: a finger is wider than an arrow's tip.
const GRAB = 26
// The arrow stands on Browse files, not in it: this far outside the chip the ground under the arrow is already the chip's top.
const CHIP_EDGE = 4
// The beats before the bite. `field`: the drop zone as any form has it, until Browse files is pressed; `press`: the chip is down; `folder`: the window is up and waits for the file to be picked; `lit`: the file is picked;
// `fly`: the sheet is on its way to the drop zone; `lie`: it lies there; `wind`: the wind has it; `feed`: the slot has it.
type Beat = 'field' | 'press' | 'folder' | 'lit' | 'fly' | 'lie' | 'wind' | 'feed'
// The chip goes down `chip` px under a press. The window comes up out of the page `over` px past its place and settles; everything in it rides with it. The picked tile goes down `tile` px.
// The sheet flies to the drop zone `arc` px above the straight line and `high` px over the page at the most, leaning `lean` radians on the way; it lies `lie` px over the card. Before the wind lifts it the sheet shivers `shiver` radians.
const POP = { chip: 4, over: 5, tile: 1.2, arc: 54, high: 46, lean: 0.24, lie: 0.6, shiver: 0.07 }
const WINDOW = ['resume-folder', 'resume-folder-bar', 'resume-folder-knob', 'resume-folder-title', 'resume-file', 'resume-file-name']
const LIE = heights.card + 9
// The live arrow's run after the sheet: it starts `from` into the wind, and stands where the tug starts `stand` into the slot's catch.
const CHASE = { on: true, from: 0.22, x: -252, y: -155, back: 0.3 }
const JAW = { tug: 14, shred: 30, lag: 0.3 }
const EATEN = -30
const HEAP = { y: 20, spread: 34 }
const TIDY = 0.3
// The live takeover: the seconds the hands travel to the bitten paper before they close on it, then the seconds over which the taut arms haul the arrow in to arm's length, and the most the held paper leans from upright, in radians, wherever the arrow stands. On the step the hands close the paper swings to the arrow and a little past (`swing`: how fast it dies and how fast it turns, a second), and the arrow is drawn long (`long`) for `jolt` seconds and thrown toward the paper at `kick` px a second. Until that step the live sheet lies as the bite left it, and from it the sheet takes its held look over `crease` seconds, in the film too, where the sheet is at the hands' place from the first frame and shows `bare` of that look until then.
const TAKE = { reach: 0.075, haul: 0.15, lean: 0.6, swing: { dies: 20, turns: 30 }, long: 1.2, jolt: 0.05, kick: 240, crease: 0.05, bare: 0.001 }
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
// The live give-back: how short the whole arrow is pressed as it drops its pose, for how long, and the seconds over which the page lets it back to its length; the seconds from there to the release (`settle`), of which the last `hold` it stands still at its plain tilt; and the seconds over which the arrow is then eased to the mouse. From the step it is handed back the arrow is drawn up to `wake` of its length over `woke` seconds and let go.
const GIVE = { settle: 0.42, hold: 0.2, low: 0.78, press: 0.06, rise: 0.2, back: 0.44, wake: 1.12, woke: 0.034 }
// The give back on the live site. The mended arrow lies with its tip `under` px beneath the hood's lip and is drawn out to `long` over `strain` seconds before the page lets go.
// Then the cassette kicks by `kick`, the arrow is thrown back to where the pile lay inside `fall` seconds, short by `low` for `press` seconds and at its length again by `rise`, swinging `swing` radians at `hz` over `ring` seconds, and `beat` seconds after the kick, having stood, it is the visitor's again, eased over `GIVE.back`.
const CAUGHT = { under: 7, long: 1.24, strain: 0.5, kick: 22, low: 0.7, press: 0.034, rise: 0.084, fall: 0.067, swing: 0.3, hz: 12, ring: 0.084, beat: 0.4 }
// The slot closes after the tug: the hood folds and the cassette starts down at `seconds` for the whole travel, as far as `down` of it, where the cassette is still half up in its well; from there the two panels snap shut over it in `snap` seconds, three frames, each frame further than the last, the cassette going down under them, and on the step they meet the slot is gone and the tray is thrown `kick` px and comes back.
const SHUT = { seconds: 0.36, down: SNAP_FROM, snap: 0.05, kick: 4 }
// The live loss, after the paper is in: the seconds the empty hands are shed while the arrow is thrown back from the mouth, and how far, in page pixels.
const SHED = { seconds: 0.29, back: 16, out: 0.1 }
const PANEL = ['resume-zone', 'resume-prompt', 'resume-browse', 'resume-browse-label', 'resume-received']

// The seconds the stage waits, once it has begun, before the sheet comes in: as long as the keyboard takes to sink.
const WAIT = 0.6

type Phase = 'idle' | 'resume' | 'tug' | 'shredded' | 'received'
const GAG: Record<Phase, string> = { idle: 'step1.resume', resume: 'step1.resume', tug: 'step1.tug', shredded: 'step1.shredded', received: 'step1.shredded' }

interface State {
  mode: Mode
  seed: number
  time: number
  phase: Phase
  phaseTime: number
  paper: { on: boolean; slide: number; x: number; y: number; held: boolean; dx: number; dy: number; feed: number; fx: number; fy: number; vx: number; vy: number; z: number; rot: number }
  flow: { at: Beat; t: number; win: number; lit: boolean; plate: number; fast: boolean; cx: number; cy: number; cz: number }
  slot: number
  shut: number
  tug: { t: number; amount: number; most: number; cool: number; gx: number; gy: number; reach: number; rate: number; pull: number; vx: number; vy: number; hx: number; hy: number; slack: number; far: number; from: number; into: number; ax: number; ay: number; heave: number; size: number; held: number }
  lost: number
  last: number
  lostFrom: { x: number; y: number; ux: number; uy: number }
  jolt: number
  joltAmp: number
  give: number
  spin: number
  turn: number
  shred: number
  emptied: number
  received: boolean
  skipped: boolean
  cleaned: boolean
  cx: number
  cy: number
}

// What the stage asks of the page it stands on.
export interface ResumeHost {
  // The page's one way to set how the arrow carries itself.
  act(io: StepIo, a: Acting): void
  // True once the ground of the stage is free: the keyboard is down.
  clear(): boolean
  // The form is emptied behind the stage: called every step of the emptying with the share of it that is done, 0 to 1 and a little past.
  wipe(share: number): void
}

// The stage of the resume, behind one seam. The page makes it once, puts `nodes` in its layout tree, and from then on calls:
// `reset` with the page, `begin` on the step the stage comes up, `step` every step from then on, `pose` before it draws its layout and `draw` after,
// and reads `done` (the resume is received, the arrow is on its way back to the visitor), `gag`, `states`, `ground`, `hint`.
// Events it emits: browse-press, folder-open, file-pick, paper-slide, slot-in, wind-gust, shredder, arms-out, paper-strain, tug-lost, strips-zip, resume-received, shredder-stop.
// `resume-received` is emitted once, on the step the drop zone first says the resume is received; a skip does not emit it.
export interface ResumeStage {
  nodes: LayoutNode[]
  reset(mode: Mode, seed: number): void
  begin(io: StepIo): void
  step(io: StepIo): void
  pose(over: Record<string, Partial<Shape> | null>, layout: LayoutNode): void
  draw(out: DrawList): void
  begun(): boolean
  done(): boolean
  received(): boolean
  doneFor(): number
  gag(): string
  states(): string[]
  ground(io: StepIo): number | null
  hint(blink: boolean): Hint
  skip(): void
  save(): unknown
  load(state: unknown): void
}

const lerp = (a: number, b: number, u: number): number => a + (b - a) * u
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const inside = (b: { x: number; y: number; w: number; h: number }, x: number, y: number, pad = 0): boolean => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad

export function makeResume(host: ResumeHost): ResumeStage {
  const glyph = uploadGlyph()
  const act = host.act
  const freshTug = (): State['tug'] => ({ t: 0, amount: 0, most: 0, cool: 0, gx: SLOT.cx, gy: SLOT.cy - PAPER.h, reach: TUG.reach.rest, rate: 0, pull: 0, vx: 0, vy: 0, hx: SLOT.cx, hy: SLOT.cy - PAPER.h, slack: -1, far: -1, from: 0, into: -1, ax: 0, ay: 0, heave: -1, size: 0, held: 0 })
  const fresh = (mode: Mode, seed: number): State => ({
    mode, seed, time: 0, phase: 'idle', phaseTime: 0,
    paper: { on: false, slide: 0, x: PAPER_REST.x, y: PAPER_REST.y, held: false, dx: 0, dy: 0, feed: -1, fx: 0, fy: 0, vx: 0, vy: 0, z: 0, rot: 0 }, flow: { at: 'field', t: 0, win: 0, lit: false, plate: 0, fast: false, cx: 0, cy: 0, cz: 0 }, slot: 0, shut: 0, tug: freshTug(),
    lost: -1, last: -1, lostFrom: { x: 0, y: 0, ux: 0, uy: -1 }, jolt: 9, joltAmp: 0, give: -1, spin: 0, turn: 0, shred: 0, emptied: -1, received: false, skipped: false, cleaned: false, cx: 0, cy: 0
  })
  let s = fresh('live', config.seed)
  const enter = (phase: Phase): void => {
    s.phase = phase
    s.phaseTime = 0
  }

  const paperTarget = (): { x: number; y: number } => ({ x: BITE.x, y: BITE.y })

  const chip = browseBox()
  const land = landing()
  const tile = { x: TILE.x, y: TILE.y, w: TILE.w, h: TILE.h }
  const windEnd = { x: BITE.x - 10, y: BITE.y - 58 }
  const beat = (at: Beat): void => {
    s.flow.at = at
    s.flow.t = 0
    s.flow.fast = s.mode !== 'film' && s.phaseTime >= live.skipLinkAfterSeconds
  }
  // The pace of the beats: the film's, and the film's too on the live site once the skip link is up, so a visitor who does nothing is through in time.
  const pace = (): typeof FLOW.film => (s.mode === 'film' || s.flow.fast ? FLOW.film : FLOW.live)
  const stand = { x: SLOT.cx + CHASE.x, y: SLOT.cy + CHASE.y }
  // The live site takes the arrow for the wind: it runs after the sheet and stands by the slot as the slot catches it, where the film's arrow stands.
  const chase = (io: StepIo, share: number): void => {
    const f = s.flow
    if (!CHASE.on) return
    const a = smooth(clamp((share - CHASE.from) / (1 - CHASE.from), 0, 1))
    io.cursor.drive(lerp(f.cx, stand.x, a), lerp(f.cy, stand.y, a), lerp(f.cz, heights.card + 6, a))
  }
  // How far up the window is, 0 under the page to 1 in its place, a little past 1 on the way.
  const windowUp = (): number => {
    const f = s.flow
    const flow = pace()
    if (f.at === 'folder' || f.at === 'lit') {
      const u = clamp((f.at === 'lit' ? flow.pop : f.t) / flow.pop, 0, 1)
      return 1 - (1 - u) ** 3 + (POP.over / (WIN.top + 4)) * Math.sin(Math.PI * u) * (1 - u)
    }
    if (f.at === 'fly') return 1 - smooth(f.t / flow.shut)
    return 0
  }

  const stepResume = (io: StepIo): void => {
    const p = s.paper
    const f = s.flow
    const film = s.mode === 'film'
    const flow = pace()
    const idle = !film && s.phaseTime >= live.skipLinkAfterSeconds
    f.t += io.dt
    f.win = windowUp()
    if (f.at === 'field') {
      if (!host.clear() || s.phaseTime < WAIT) return
      if ((io.pressed && (inside(chip, io.pointer.x, io.pointer.y, GRAB) || inside(ZONE, io.pointer.x, io.pointer.y))) || idle) {
        beat('press')
        io.emit('browse-press', chip.x + chip.w / 2, chip.y + chip.h / 2, false)
      }
      return
    }
    if (f.at === 'press') {
      if (f.t < flow.press) return
      beat('folder')
      p.on = true
      p.x = PAPER_REST.x
      p.y = PAPER_REST.y
      io.emit('folder-open', WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, false)
      if (!film) io.cursor.react('doubleTake')
      return
    }
    if (f.at === 'folder') {
      const ready = f.t >= flow.pop * 0.6
      f.lit = ready && inside(tile, io.cursor.x, io.cursor.y, 0)
      if (ready && ((io.pressed && inside(tile, io.pointer.x, io.pointer.y, GRAB)) || (idle && f.t >= FLOW.wait))) {
        beat('lit')
        f.lit = true
        io.emit('file-pick', TILE.x + TILE.w / 2, TILE.y + TILE.h / 2, false)
      }
      return
    }
    if (f.at === 'lit') {
      if (f.t < flow.lit) return
      beat('fly')
      f.lit = false
      io.emit('paper-slide', PAPER_REST.x + PAPER.w / 2, PAPER_REST.y + PAPER.h / 2, false)
      if (!film) act(io, 'proud')
      return
    }
    if (f.at === 'fly') {
      const u = clamp(f.t / flow.fly, 0, 1)
      const e = smooth(u)
      const bulge = Math.sin(Math.PI * e)
      const wx = p.x
      const wy = p.y
      p.x = lerp(PAPER_REST.x, land.x, e)
      p.y = lerp(PAPER_REST.y, land.y, e) - POP.arc * bulge
      p.z = lerp(WIN.top + TILE.up, heights.card, e) + POP.lie + POP.high * bulge
      p.rot = -POP.lean * Math.sin(Math.PI * u) * (1 - u * 0.4)
      p.vx = (p.x - wx) / io.dt
      p.vy = (p.y - wy) / io.dt
      if (u >= 1) {
        beat('lie')
        p.x = land.x
        p.y = land.y
        p.z = heights.card + POP.lie
        p.rot = 0
        p.vx = 0
        p.vy = 0
        io.emit('slot-in', land.x + PAPER.w / 2, land.y + PAPER.h / 2, false)
        jolt(JOLT.bite / 3)
      }
      return
    }
    if (f.at === 'lie') {
      if (film ? io.time < RESUME.drop - flow.wind : f.t < flow.lie) return
      beat('wind')
      io.emit('wind-gust', land.x + PAPER.w / 2, land.y + PAPER.h / 2, false)
      if (!film) {
        if (CHASE.on) {
          io.cursor.take('wind')
          f.cx = io.cursor.x
          f.cy = io.cursor.y
          f.cz = io.cursor.z
          io.cursor.drive(f.cx, f.cy, f.cz)
        }
        io.cursor.react('startle')
      }
      return
    }
    if (f.at === 'wind') {
      const share = film ? clamp(1 - (RESUME.drop - io.time) / flow.wind, 0, 1) : clamp(f.t / flow.wind, 0, 1)
      const u = clamp((share - WIND.off) / (1 - WIND.off), 0, 1)
      const e = u * u * (3 - 2 * u)
      const bulge = Math.sin(Math.PI * e)
      const dx = windEnd.x - land.x
      const dy = windEnd.y - land.y
      const d = Math.hypot(dx, dy)
      const wx = p.x
      const wy = p.y
      p.x = lerp(land.x, windEnd.x, e) + (dy / d) * WIND.bend * bulge
      p.y = lerp(land.y, windEnd.y, e) - (dx / d) * WIND.bend * bulge
      p.z = lerp(heights.card + POP.lie, LIE, e) + WIND.high * bulge
      p.rot = WIND.swing * Math.sin(Math.PI * 2 * WIND.turns * e) * (1 - e) + POP.shiver * Math.sin(share * 70) * (1 - u)
      p.vx = (p.x - wx) / io.dt
      p.vy = (p.y - wy) / io.dt
      if (!film) chase(io, share)
      if (film ? io.time >= RESUME.drop : f.t >= flow.wind) {
        beat('feed')
        p.rot = 0
        p.z = LIE
        p.held = false
        p.feed = 0
        p.fx = p.x
        p.fy = p.y
        if (!film && CHASE.on) io.cursor.release(CHASE.back)
      }
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
        s.tug = { ...freshTug(), amount: tugCurve(0), cool: 0.5 }
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
    t.held = since >= 0 ? Math.min(1, t.held + io.dt / TAKE.crease) : 0
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
    if (crossed(SHRED.empty)) s.emptied = 0
    if (s.emptied >= 0) {
      const u = (s.shred - SHRED.empty) / SHRED.emptySeconds
      s.emptied = u
      host.wipe(u)
      if (u >= 1 + SHRED.hold / SHRED.emptySeconds) {
        s.emptied = -1
        s.received = true
        io.emit('resume-received', ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h / 2, false)
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

  const stepGive = (io: StepIo): void => {
    if (s.give >= 0) {
      const fell = s.give >= CAUGHT.fall
      s.give += io.dt
      if (!fell) io.cursor.place(PILE.x, lerp(PILE.y, HOOD.y - CAUGHT.under, Math.pow(1 - Math.min(1, s.give / CAUGHT.fall), 3)))
      if (s.give > CAUGHT.press && s.give < CAUGHT.rise) io.cursor.press(lerp(CAUGHT.low, 1, smooth((s.give - CAUGHT.press) / (CAUGHT.rise - CAUGHT.press))), io.dt)
      if (s.give >= CAUGHT.beat) {
        const woke = s.give - CAUGHT.beat
        if (woke < io.dt) io.cursor.release(GIVE.back)
        io.cursor.press(lerp(1, GIVE.wake, Math.min(1, (woke + io.dt) / GIVE.woke)), io.dt)
        if (woke + io.dt >= GIVE.woke) s.give = -1
      }
    }
  }

  // The wind made visible: thin pale streaks that cross the drop zone the way the sheet is carried, each born a little after the last, short at its start and its end.
  const gusts = (out: DrawList): void => {
    const flow = s.mode === 'film' ? FLOW.film : FLOW.live
    const t = s.mode === 'film' ? flow.wind - (RESUME.drop - s.time) : s.flow.t
    const ux = Math.cos(WIND.heading)
    const uy = Math.sin(WIND.heading)
    for (let i = 0; i < WIND.streaks; i++) {
      const age = (t - i * WIND.every) / WIND.life
      if (age <= 0 || age >= 1) continue
      const full = WIND.long[i % WIND.long.length]!
      const len = Math.max(24, Math.round((full * Math.sin(Math.PI * age)) / 24) * 24)
      const across = (hash01(i, 21, s.seed) - 0.5) * WIND.spread
      const along = -330 + (hash01(i, 23, s.seed) - 0.5) * 120 + WIND.speed * WIND.life * age
      const cx = land.x + PAPER.w / 2 + ux * along - uy * across
      const cy = land.y + PAPER.h / 2 + uy * along + ux * across
      const z = WIND.z + hash01(i, 25, s.seed) * 30
      out.push({ id: `resume-gust-${i}`, part: 'shell', kind: 'capsule', x: cx - len / 2, y: cy - WIND.wide / 2, w: len, h: WIND.wide, z0: z, z1: z + 1.2, rot: WIND.heading, tone: 'light' })
    }
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
    const v = [LIE, 1, t.amount, armed ? t.pull : 0, hx - uy * reach, hy + ux * reach, hx + uy * reach, hy - ux * reach, t.vx, t.vy, armed ? Math.max(TAKE.bare, t.held) : 0]
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

  return {
    nodes: resumeNodes(),
    reset(mode: Mode, seed: number) {
      s = fresh(mode, seed)
    },
    begin(io: StepIo) {
      enter('resume')
      act(io, 'proud')
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
      }
      s.jolt = Math.min(9, s.jolt + io.dt)
      const eating = s.phase === 'tug' || (s.phase === 'shredded' && s.shred < SHRED.pile)
      s.spin += ((eating ? (s.phase === 'tug' && s.lost < 0 ? JAW.tug : JAW.shred) : 0) - s.spin) * Math.min(1, io.dt / JAW.lag)
      s.turn += s.spin * io.dt
      const slotOpen = (s.phase === 'resume' && (s.paper.feed >= 0 || s.flow.at === 'wind')) || s.phase === 'tug' || s.phase === 'shredded' || (s.phase === 'received' && s.phaseTime < TIDY && !s.skipped)
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
      s.flow.plate = clamp(s.flow.plate + (slotOpen ? io.dt / FLOW.machine : -io.dt / SHUT.seconds), 0, 1)
      if (s.phase === 'resume') stepResume(io)
      else if (s.phase === 'tug') stepTug(io)
      else if (s.phase === 'shredded') stepShredded(io)
      else if (s.phase === 'received') stepGive(io)
    },
    pose(over, layout) {
      const f = s.flow
      if (s.phase === 'resume' && f.at === 'press') {
        over['resume-browse'] = { z0: heights.card - POP.chip, z1: heights.card + 8 - POP.chip }
        over['resume-browse-label'] = { z0: heights.card + 8 - POP.chip, z1: heights.card + 8 - POP.chip }
      }
      const sunk = (f.win - 1) * (WIN.top + 4)
      if (f.win > 0 && sunk !== 0) {
        for (const id of WINDOW) {
          const n = find(layout, id)
          const text = n.copy !== undefined
          const top = n.height ?? n.on ?? 0
          const floor = text ? top : (n.floor ?? 0)
          over[id] = { z0: floor + sunk, z1: top + sunk }
        }
      }
      if (f.win > 0 && f.at === 'lit') {
        over['resume-file'] = { z0: WIN.top + sunk - POP.tile, z1: WIN.top + TILE.up + sunk - POP.tile }
        over['resume-file-name'] = { z0: WIN.top + TILE.up + sunk - POP.tile, z1: WIN.top + TILE.up + sunk - POP.tile }
      }
      if (f.plate > 0 && f.plate < 1) {
        const down = (smooth(f.plate) - 1) * (PLATE.thick + 2)
        over['resume-shredder-plate'] = { z0: down, z1: PLATE.thick + down }
        over['resume-shredder-label'] = { z0: PLATE.thick + down, z1: PLATE.thick + down }
      }
      if (s.paper.on && s.phase === 'resume') {
        const p = s.paper
        const resting = f.at === 'folder' || f.at === 'lit' || f.at === 'press' || f.at === 'field'
        const up = resting ? WIN.top + TILE.up + POP.lie + sunk - (f.at === 'lit' ? POP.tile : 0) : p.feed >= 0 ? LIE : p.z
        const dx = p.x - PAPER_REST.x
        const dy = p.y - PAPER_REST.y
        const moved = dx !== 0 || dy !== 0 || p.rot !== 0
        const cos = Math.cos(p.rot)
        const sin = Math.sin(p.rot)
        const mx = p.x + PAPER.w / 2
        const my = p.y + PAPER.h / 2
        const turned = (b: { cx: number; cy: number; w: number; h: number }): { x: number; y: number } => {
          const ox = b.cx - (PAPER_REST.x + PAPER.w / 2)
          const oy = b.cy - (PAPER_REST.y + PAPER.h / 2)
          return { x: mx + ox * cos - oy * sin - b.w / 2, y: my + ox * sin + oy * cos - b.h / 2 }
        }
        const hx = mx - (PAPER.h / 2) * -sin
        const hy = my - (PAPER.h / 2) * cos
        over['resume-paper'] = { x: p.x, y: p.y, z0: up, z1: up + heights.paper, rot: p.rot, moved, v: [up, p.feed >= 0 ? clamp(p.feed / TIMES.bite, 0, 1) : 0, 0, 0, hx, hy, hx, hy, p.vx, p.vy, 0] }
        over['resume-paper-title'] = { ...turned(boxOf(layout, 'resume-paper-title')), z0: up + heights.paper + 0.1, z1: up + heights.paper + 0.1, rot: p.rot, moved }
        PAPER_LINES.forEach((_, i) => {
          over[`resume-paper-line-${i}`] = { ...turned(boxOf(layout, `resume-paper-line-${i}`)), z0: up + heights.paper, z1: up + heights.paper + 0.4, rot: p.rot, moved }
        })
      }
      const thrown = joltNow() * JOLT.panel
      if (thrown > 0) for (const id of PANEL) over[id] = { y: boxOf(layout, id).y + thrown, moved: true }
    },
    draw(out: DrawList) {
      if (!s.received) for (const [i, g] of glyph.entries()) out.push({ id: `resume-glyph-${i}`, part: 'shell', kind: 'box', x: g.x, y: g.y + joltNow() * JOLT.panel, w: g.w, h: g.h, z0: heights.card, z1: heights.card + 0.4, r: 1.5, rot: g.rot, tone: 'ink' })
      if (s.slot > 0) {
        const open = smooth(s.slot)
        const rate = s.phase === 'tug' ? s.tug.rate : s.phase === 'shredded' && s.shred < SHRED.pile ? 1 / TIMES.lost : 0
        const thrown = joltNow()
        const slot = slotShapes([s.shut > 0 ? -s.shut / SHUT.snap : open, s.turn, rate])
        if (thrown > 0) for (const x of slot) if (x.mechanism) x.y += thrown
        out.push(...slot)
      }
      if (s.phase === 'resume' && s.flow.lit && s.flow.win > 0) {
        const z = WIN.top + (s.flow.win - 1) * (WIN.top + 4)
        out.push({ id: 'resume-file-ring', part: 'shell', kind: 'box', x: TILE.x - RING.out, y: TILE.y - RING.out, w: TILE.w + RING.out * 2, h: TILE.h + RING.out * 2, z0: z, z1: z + RING.up, r: TILE.r + RING.out, tone: 'accent' })
      }
      if (s.phase === 'resume' && s.flow.at === 'wind') gusts(out)
      if (s.phase === 'tug' || s.phase === 'shredded') tugPaper(out)
      strips(out)
    },
    begun: () => s.phase !== 'idle',
    done: () => s.phase === 'received',
    received: () => s.received,
    doneFor: () => (s.phase === 'received' ? s.phaseTime : 0),
    gag: () => GAG[s.phase],
    states: () => [STAGE, s.received ? 'received' : 'prompt', ...(s.paper.on && s.phase === 'resume' ? ['paper'] : []), ...(s.flow.win > 0 && s.phase === 'resume' ? ['folder'] : []), ...(s.flow.plate > 0 ? ['shredder'] : [])],
    ground(io: StepIo): number | null {
      if (s.phase === 'resume' && s.flow.win >= 1 && inside({ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h }, io.cursor.x + BODY.x, io.cursor.y + BODY.y)) return inside(tile, io.cursor.x + BODY.x, io.cursor.y + BODY.y) ? WIN.top + TILE.up : WIN.top
      if (!s.received && (inside(chip, io.cursor.x, io.cursor.y, CHIP_EDGE) || inside(chip, io.cursor.x + BODY.x, io.cursor.y + BODY.y, CHIP_EDGE))) return heights.card + 8 - (s.phase === 'resume' && s.flow.at === 'press' ? POP.chip : 0)
      if (inside(ZONE, io.cursor.x + BODY.x, io.cursor.y + BODY.y)) return heights.card
      return null
    },
    hint(blink: boolean): Hint {
      if (s.phase === 'idle' || s.phase === 'resume') {
        const f = s.flow
        const flow = pace()
        if (s.phase === 'idle' || f.at === 'field') return { x: chip.x + chip.w / 2, y: chip.y + chip.h / 2, down: s.phase === 'resume' && blink }
        if (f.at === 'press') return { x: chip.x + chip.w / 2, y: chip.y + chip.h / 2, down: false }
        if (f.at === 'folder') return { x: TILE.x + TILE.w / 2, y: PAPER_REST.y + PAPER.h / 2, down: f.t >= flow.pop && blink }
        return { x: stand.x, y: stand.y, down: false }
      }
      if (s.phase === 'tug') return { x: SLOT.cx - 90, y: SLOT.cy - 260, down: false }
      return { x: PILE.x, y: PILE.y, down: false }
    },
    skip() {
      if (s.skipped) return
      s.skipped = true
      s.cleaned = false
      s.paper.on = false
      s.paper.held = false
      s.flow.win = 0
      s.flow.lit = false
      s.lost = -1
      s.last = -1
      s.give = -1
      s.emptied = -1
      s.received = true
      s.phase = 'received'
      s.phaseTime = 0
    },
    save: () => JSON.parse(JSON.stringify(s)) as unknown,
    load(state: unknown) {
      s = JSON.parse(JSON.stringify(state)) as State
    }
  }
}
