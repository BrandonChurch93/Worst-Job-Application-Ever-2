import { config, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { Random, stream } from '../../core/random'
import { restPose, type Acting } from '../../cursor/body'
import { boxOf, drawLayout, find, walk } from '../../shell/layout'
import { measure } from '../../shell/metrics'
import { SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { frame } from '../../stage/camera'
import type { DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo, Tone } from '../../stage/types'
import type { FieldProgress } from '../../stage/types'
import { buildLayout, COIN, CRANK, DIAL, DIAL_BODY, dialPlate, dialTop, FH, FIELDS, FW, FX, HOLE, PAD, reelId, reelType, ROWS, rowY, SHEET, SIGN_TYPE, SIGN_Z, SLIDE, SLOT, statesOf, STOP_Z, stopId, TOP, TRAY_Z, trayY, VALUE_Z, scaleOf, SH, SW } from './layout'
import { actingAt, AWAY, FILM, filmAt, LANDING, LEVER_AT, PEEL_AT, TOSS, pointerAt, poses, reactions, type Mark, type Marks } from './script'

const dt = 1 / stepHz
const LIMIT = config.live.skipLinkAfterSeconds
const DIGITS = config.live.step2.dialDigitsBeforeItGivesUp
const TURNS = config.live.step2.crankTurnsBeforeItRunsAway
const HEAL = config.cursor.damageHealSeconds * 0.85
const hover = config.scale.heights.cursorHover
// How the cursor comes to a thing: how far ahead it sees it, how fast the ground it stands on may rise, and how long its hand takes to close on a grip.
const CLIMB = { ahead: 44, looks: 4, rise: 900 }
const REACH = 0.09
// The cursor is swung by the crank it turns, and stands straight again over the last turns before the crank takes off.
const SWING = { settle: 1.5 }
const heights = config.scale.heights
const G = 2400
const TAU = Math.PI * 2
const REEL = { gather: 0.3, die: 13, ring: 24, read: 0.588, auto: 0.35, still: 0.5 }
// The date is typed on the keyboard. A second press on the field, or this long without a key, and the field types the rest itself, a digit every `every` seconds. A full date stands for `open` seconds before the field turns.
const TYPED = { digits: 8, after: 4, every: 0.07, open: 0.14, first: 0.12 }
// A stop button stays down this long. A date that was missed pays one coin, and its stage is over this long after it.
const STOP = { down: 0.16, dip: 9, reach: 6 }
const MISS = { coins: 1, long: 0.8, fall: 150 }
// The level of the volume belongs to the crank's turning: a tenth a turn in the visitor's hand, and the rest of the way over `turns` turns once the crank runs by itself (`film` turns in the film, where the narrator's line is spoken over it), which it does no faster than `most` rad a second so that each drawn frame shows it further round.
const RUN = { turns: 7, film: 10.5, most: 21, hand: 0.1 }
const SPIT = { first: 3, air: [0.15, 0.19], aim: 0.3, far: 7, die: 14, ring: 50, every: 0.035, long: 0.9 }
const kickOf = (slot: SlotState): number => (slot.phase === 'pay' ? -SPIT.far * Math.exp(-SPIT.die * slot.t) * Math.sin(Math.min(Math.PI * 3, SPIT.ring * slot.t)) : 0)
const LEVER = { rise: 0.1, give: 0.045, drive: 5.5, hold: 0.42, spring: 230, damp: 12, over: 0.075 }
const REEL_PITCH = 62
const REEL_SEEN = 58
const COINS = 14
// How fast the rail's fill glides to the count of fields that are done.
const EASE = 7
// The hint presses a stop while the visitor's own legend is this near the window's middle, in legends.
const HINT = { from: -0.44, to: -0.2 }
// The dial runs home: it gathers speed, runs, and slows into its stop.
const RETURN = { most: 42, gather: 300, least: 4, slow: 30 }
// The crank draws back before it takes off.
// The whip: the arrow hangs from the hole by its tip, its tail thrown outward and trailing the turn, drawn long by the speed. Flung, it goes end over end and lands the right way up.
const WHIP = { tip: 1.965, follow: 30, long: 0.3, slow: 5, fast: 36, gain: 8.5, rise: 4, air: 0.6, tumble: 2, thrown: 1.24 }
const FLUNG = { short: 64, lie: 1.35, tumble: 1.5, high: 150, long: 1.25, low: 0.7 }
const SKID = { short: 96, long: 0.26, lie: -1.3, low: 0.8 }
const SNAG = { held: 0.05, long: 1.62, amp: 0.085, die: 13, hz: 46 }
const dialShown = (d: DialState): number => d.a + (d.home >= 0 ? SNAG.amp * Math.exp(-SNAG.die * d.home) * Math.sin(SNAG.hz * d.home) : 0)
const WIND = { long: 0.12, back: 1.6, out: 0.2 }
const BLOW = { load: 0.2, kick: 1170, out: 0.15, drag: 9, stuck: 0.45, dip: 0.07, lamps: 2 }

// A machine comes out of the bare page and goes back into it. The field leaves in `field` s from the click, the machine starts `from` s after it and stands `long` s after it; it is gone `out` s after it starts to go.
export const ENTER = { field: 0.2, from: 0.08, long: [0.84, 0.8, 0.86], out: [0.5, 0.46, 0.5], held: 0.4 }
// How a machine is drawn on its way: the page's opening under it, how far the whole of it and each of its parts lie under where they stand (page pixels), and what its own parts do meanwhile.
interface Pose { hole: { x: number; y: number; w: number; h: number; r: number; deep: number } | null; sink: number; drop: (id: string) => number; spin: number; lever: number | null; jolt: number; swing: number; sign: number; shown: boolean; coin: ((n: number, x: number, y: number) => { x: number; y: number; down: number }) | null }
const STANDING: Pose = { hole: null, sink: 0, drop: () => 0, spin: 0, lever: null, jolt: 0, swing: 0, sign: 1, shown: true, coin: null }
const seg = (t: number, a: number, b: number): number => Math.min(1, Math.max(0, (t - a) / (b - a)))
const out3 = (u: number): number => 1 - (1 - u) * (1 - u) * (1 - u)
const back = (u: number): number => 1 + 2.70158 * (u - 1) * (u - 1) * (u - 1) + 1.70158 * (u - 1) * (u - 1)
const hop = (u: number): number => Math.sin(Math.PI * u)
const unfold = (u: number): number => (u < 0.78 ? 1.07 * (u / 0.78) * (u / 0.78) * (3 - (2 * u) / 0.78) : 1.07 - 0.07 * ((u - 0.78) / 0.22) ** 2 * (3 - (2 * (u - 0.78)) / 0.22))
const CRANK_BODY = ['crank-base', 'crank-arm', 'crank-hub', 'crank-grip']
// A legend is not drawn while its part lies further than this under where it stands: type has no page to hide under.
const UNDER = 1.5
// How far a bar of the level goes under the page, how little of a lit bar must stand over the page for it to stay lit, and how the coins are swept into the hatch after the machine: when the first one starts, how much later each next one, how long the way takes, how far inside the hatch's ends they stop, how far apart their rows lie and how deep they fall.
const BAR_UNDER = 44
const BAR_DARK = 14
const SWEEP = { from: 0.12, each: 0.006, long: 0.15, in: 46, apart: 24, row: 9, deep: 130 }

type RowPhase = 'closed' | 'opening' | 'ready' | 'ending' | 'closing'
interface Coin { n: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; rot: number; hit: boolean; still: boolean; falls: boolean; row: number; hops: number }
interface DialState { a: number; k: number; phase: 'rest' | 'drag' | 'return' | 'whip' | 'snag' | 'fly' | 'skid' | 'over'; home: number; digits: string; w: number; left: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; r: number; turn: number; from: number; air: number }
interface SlotState { p: number; pv: number; grab: boolean; phase: 'rest' | 'spin' | 'read' | 'pay' | 'over'; t: number; from: number[]; to: number[]; latch: number; coins: Coin[]; spawned: number; cool: number; rang: boolean; own: number[]; stopped: number[]; at: number[]; down: number[]; win: boolean; wait: number }
interface BirthState { focus: boolean; typed: string; t: number; fill: string }
interface CrankState { b: number; set: boolean; grab: boolean; total: number; turns: number; phase: 'rest' | 'runaway' | 'full' | 'over'; w: number; level: number; hit: boolean; hitAt: number; peeled: boolean; t: number; stuck: number; sx: number; sy: number; kx: number; ky: number; o: number; toss: number; ox: number; oy: number; oz: number }
interface State {
  mode: 'live' | 'film'
  time: number
  open: number
  phase: RowPhase
  lift: number
  rowT: number
  endT: number
  outT: number
  idle: number
  done: boolean[]
  field: number
  count: number
  eased: number
  turn: number
  slide: number
  birth: BirthState
  px: number
  py: number
  dial: DialState
  slot: SlotState
  crank: CrankState
  pressed: boolean
  hold: number
  finished: boolean
  skipping: boolean
  gripped: boolean
  reach: { x: number; y: number; z: number; t: number }
  swing: { x: number; y: number } | null
  climb: number
  marks: Marks
  rng: number[]
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const smooth = (u: number): number => {
  const c = clamp(u, 0, 1)
  return c * c * (3 - 2 * c)
}
const wrapPi = (a: number): number => a - TAU * Math.round(a / TAU)
const mod = (a: number, m: number): number => ((a % m) + m) % m
const mix = (a: number, b: number, t: number): number => a + (b - a) * t

const freshDial = (): DialState => ({ a: 0, k: 0, phase: 'rest', home: -1, digits: '', w: 0, left: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, r: 0, turn: 0, from: 0, air: 0 })
const freshSlot = (): SlotState => ({ p: 0, pv: 0, grab: false, phase: 'rest', t: 0, from: [0, 0, 0], to: [0, 0, 0], latch: 0, coins: [], spawned: 0, cool: 0, rang: false, own: [0, 0, 0], stopped: [-1, -1, -1], at: [0, 0, 0], down: [0, 0, 0], win: false, wait: 0 })
const freshBirth = (): BirthState => ({ focus: false, typed: '', t: 0, fill: '' })
const freshCrank = (): CrankState => ({ b: CRANK.rest, set: false, grab: false, total: 0, turns: 0, phase: 'rest', w: 0, level: 0, hit: false, hitAt: -1, peeled: false, t: 0, stuck: 0, sx: 0, sy: 0, kx: 0, ky: 0, o: 0, toss: -1, ox: 0, oy: 0, oz: 0 })
const fresh = (mode: 'live' | 'film'): State => ({
  mode, time: 0, open: -1, phase: 'closed', lift: 0, rowT: 0, endT: 0, outT: 0, idle: 0, done: [false, false, false], field: 0, count: 0, eased: 0, turn: 0, slide: -1, birth: freshBirth(), px: 0, py: 0,
  dial: freshDial(), slot: freshSlot(), crank: freshCrank(), pressed: false, hold: 0, finished: false, skipping: false, gripped: false, reach: { x: 0, y: 0, z: 0, t: 1 }, swing: null, climb: 0, marks: {}, rng: []
})

export const volumeMask = (level: number): string => String(Math.round(clamp(level, 0, 1) * 100)) + words('data:step2.volume.percent')
export const phoneMask = (digits: string): string => words('data:step2.phone.prefix') + digits
export const dateMask = (digits: string): string => digits.slice(0, 2) + (digits.length >= 2 ? words('data:step2.birth.gap') : '') + digits.slice(2, 4) + (digits.length >= 4 ? words('data:step2.birth.gap') : '') + digits.slice(4)
const two = (n: number): string => String(n).padStart(2, '0')
// A typed date as the reels can show it: each part held to its strip.
export function ownDate(digits: string): { typed: string; own: number[] } {
  const years = SLOT.strips[2]!
  const part = (from: number, to: number, lo: number, hi: number): number => clamp(Number(digits.slice(from, to)) || lo, lo, hi)
  const legends = [two(part(0, 2, 1, 12)), two(part(2, 4, 1, 31)), String(part(4, 8, Number(years[0]), Number(years[years.length - 1])))]
  return { typed: legends.join(''), own: legends.map((legend, r) => SLOT.strips[r]!.indexOf(legend)) }
}

const holePlace = (k: number, a: number): { x: number; y: number } => ({ x: DIAL.cx + DIAL.ring * Math.cos(DIAL.holeAngle(k) + a), y: DIAL.cy + DIAL.ring * Math.sin(DIAL.holeAngle(k) + a) })
const gripPlace = (b: number, r: number = CRANK.arm): { x: number; y: number } => ({ x: CRANK.hx + r * Math.cos(b), y: CRANK.hy + r * Math.sin(b) })

// The corners of the crank's arm and of its grip at one angle, as boxes turned about the hub.
export function crankCorners(b: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const [from, to, half] of [[-CRANK.armW / 2, CRANK.arm + CRANK.armW / 2, CRANK.armW / 2], [CRANK.arm - CRANK.gripW / 2, CRANK.arm + CRANK.gripW / 2, CRANK.gripH / 2]] as const)
    for (const along of [from, to]) for (const side of [-half, half]) out.push({ x: CRANK.hx + along * Math.cos(b) - side * Math.sin(b), y: CRANK.hy + along * Math.sin(b) + side * Math.cos(b) })
  return out
}
// The crank can go down into its tray at an angle where every corner of the arm and the grip lies inside the tray's floor, this far from the tray's edge (the rim and its cove).
export const CRANK_CLEAR = 8
export const crankInTray = (b: number): boolean => crankCorners(b).every((c) => c.x >= FX + CRANK_CLEAR && c.x <= FX + SW(2) - CRANK_CLEAR && c.y >= trayY(2) + CRANK_CLEAR && c.y <= trayY(2) + SH(2) - CRANK_CLEAR)
// The arc of such angles round the arm's resting angle, found once in steps of 0.001 rad and drawn in by HOME_PAD at each end: a live run ends inside it. It ends at HOME_LOW: with the arm lower the grip is the first thing the tray shuts over, while the crank still stands a little; up to here the shutting tray reaches the grip on the step the crank lies housed.
const HOME_PAD = 0.03
const HOME_LOW = -0.5
export const CRANK_HOME = ((): { from: number; to: number } => {
  let from = CRANK.rest
  let to = CRANK.rest
  while (from > CRANK.rest - Math.PI && crankInTray(from - 0.001)) from -= 0.001
  while (to < CRANK.rest + Math.PI && crankInTray(to + 0.001)) to += 0.001
  return { from: from + HOME_PAD, to: Math.min(to - HOME_PAD, HOME_LOW) }
})()
// The limits of the crank's blow, as its test in `stepCrank` holds them: the arm strikes a cursor only above this speed, under this height and within this reach of the hub. Outside them the arm's angle decides nothing but the picture, and only there is a coasting crank steered.
const BLOW_REACH = { speed: 6, high: 70, far: CRANK.tip + 26 }
// The pace at which a full crank loses its speed, and the speed under which its run is over.
const COAST = { loss: 5, least: 0.5 }
// The share of its speed a coasting crank turns by on the live site, so that the run ends with the arm inside the tray: 1 where it would end there anyway, else what brings it to the nearer end of the arc in the same time.
function homeward(b: number, w: number): number {
  const left = (w - COAST.least) / COAST.loss
  if (left <= 1e-3) return 1
  const end = b + left
  const mid = (CRANK_HOME.from + CRANK_HOME.to) / 2
  const off = wrapPi(end - mid)
  const half = (CRANK_HOME.to - CRANK_HOME.from) / 2
  if (Math.abs(off) <= half) return 1
  const more = off > 0 ? half - off : -half - off
  return Math.max(0, 1 + more / left)
}
// A Skip pressed while the arm stands outside that arc: the arm goes on in the run's direction to the arc's near end before the lift lowers, at its own speed and never under `least` rad a second, falling to `least` over the last `soft` rad.
const SKIP_HOME = { least: 14, soft: 0.6 }
// How far past the arc's ends an angle still counts as in it, in rad: the arm is set on the end itself.
const HOME_NEAR = 1e-9
const crankHome = (b: number): boolean => Math.abs(wrapPi(b - (CRANK_HOME.from + CRANK_HOME.to) / 2)) <= (CRANK_HOME.to - CRANK_HOME.from) / 2 + HOME_NEAR
function skipHome(b: number, w: number, dt: number): number {
  const left = mod(CRANK_HOME.from - b, TAU)
  return b + Math.min(left, (SKIP_HOME.least + Math.max(0, w - SKIP_HOME.least) * Math.min(1, left / SKIP_HOME.soft)) * dt)
}
const knobY = (p: number): number => SLOT.knobY + SLOT.pull * clamp(p, -LEVER.rise, 1 + LEVER.give)
// Where a reel stands, in legends of its strip. It rests on a whole legend, gathers, turns at its one speed, and where it is stopped it rings on the legend nearest the window's middle.
export const reelPos = (slot: SlotState, r: number): number => {
  const rest = Math.floor(slot.from[r]! + 1e-9)
  if (slot.phase === 'rest') return rest
  if (slot.stopped[r]! >= 0) return slot.to[r]! + (slot.at[r]! - slot.to[r]!) * Math.exp(-REEL.die * slot.stopped[r]!) * Math.cos(REEL.ring * slot.stopped[r]!)
  const track = (t: number): number => slot.from[r]! + SLOT.speed[r]! * t
  if (slot.t >= REEL.gather) return track(slot.t)
  const u = slot.t / REEL.gather
  return rest + (track(REEL.gather) - rest) * u * u
}
// The window of a reel in milliseconds: how long one legend is the nearest to the window's middle.
export const reelWindow = (r: number): number => 1000 / SLOT.speed[r]!

interface RowIds { ids: { id: string; x: number }[] }

function rowParts(tree: LayoutNode, prefix: string): RowIds {
  const ids: { id: string; x: number }[] = []
  for (const top of [`${prefix}-label`, `${prefix}-helper`, `${prefix}-pocket`]) walk(find(tree, top), (n) => void ids.push({ id: n.id, x: n.box[0]! }))
  return { ids }
}

// The slot and the crank are housed in the floor of their trays, as the dial is: they lie there at this share of their height while the tray opens over them and while it shuts over them, and rise from it. Their makers draw a part above 0.02 of its height, and at 0.0256 the slot's knob would reach the floor of the field below (`scale.heights.field`), whose pocket passes over the machine as the tray opens.
export const HOUSED = 0.022
// How far below its centre the dial reaches on the page, its seat ring and 4 px more: while the tray's opening ends above that, part of the dial lies under the page, and the live site tells the dial's maker where the opening ends, so that it draws what is under the page low (`levelDial` in real/dial.ts). The film is not told.
export const DIAL_REACH = DIAL.r + DIAL_BODY.seat + 4

function machineParts(tree: LayoutNode, tray: string): { id: string; floor: number; top: number; text: boolean }[] {
  const out: { id: string; floor: number; top: number; text: boolean }[] = []
  for (const child of find(tree, tray).children ?? []) {
    walk(child, (n) => {
      if (n.kind === 'row') return
      if (n.copy !== undefined) {
        if ((n.on ?? 0) > TRAY_Z) out.push({ id: n.id, floor: n.on!, top: n.on!, text: true })
      } else out.push({ id: n.id, floor: n.floor ?? 0, top: n.height ?? 0, text: false })
    })
  }
  return out
}

// The shapes of a page as its machines were built: each shape the page drew larger is given back as it was before.
const builtOf = new WeakMap<Shape, Shape>()
export function drawBuilt(page: { draw(out: DrawList): void }, out: DrawList): void {
  const list: DrawList = []
  page.draw(list)
  for (const shape of list) out.push(builtOf.get(shape) ?? shape)
}

export function makePage(): PageLogic {
  const layout = buildLayout()
  const beats = config.film.beats.filter((b) => b.unit === 'step2')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string | null }).event ?? null }))
  const go = boxOf(layout, 'continue-cap')
  const up = ROWS.map((name) => rowParts(layout, name))
  const stops = [0, 1, 2].map((r) => boxOf(layout, stopId(r)))
  const sign = boxOf(layout, 'crank-sign')
  const signWords = boxOf(layout, 'crank-sign-words')
  const parts = ROWS.map((name) => machineParts(layout, `${name}-stage`))
  const scales = [0, 1, 2].map(scaleOf)
  const inStage = new Set<string>()
  for (const name of ROWS) for (const child of find(layout, `${name}-stage`).children ?? []) walk(child, (n) => void inStage.add(n.id))
  // What a machine is told and what it tells, in its stage: the pointer and the arrow come to it at its built size, and where it puts the arrow or tells of a thing goes out at the size it is drawn.
  function staged(io: StepIo, i: number): StepIo {
    const m = scales[i]!
    const cursor = new Proxy(io.cursor, {
      get(t, name) {
        if (name === 'x') return m.backX(t.x)
        if (name === 'y') return m.backY(t.y)
        if (name === 'z') return m.backAir(t.z)
        if (name === 'place') return (x: number, y: number, z?: number): void => (z === undefined ? t.place(m.x(x), m.y(y)) : t.place(m.x(x), m.y(y), m.air(z)))
        if (name === 'knock') return (vx: number, vy: number, vz = 0): void => t.knock(vx * m.k, vy * m.k, vz * m.k)
        if (name === 'setGround') return (z: number): void => t.setGround(m.ground(z))
        const v: unknown = Reflect.get(t, name, t)
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v
      }
    })
    return { ...io, pointer: { ...io.pointer, x: m.backX(io.pointer.x), y: m.backY(io.pointer.y) }, cursor, emit: (name, x, y, hits) => io.emit(name, m.x(x), m.y(y), hits) }
  }
  const middle = [{ x: scales[0]!.x(DIAL.cx), y: scales[0]!.y(DIAL.cy) }, { x: scales[1]!.x(SLOT.x + SLOT.w / 2), y: scales[1]!.y(SLOT.y + SLOT.h / 2) }, { x: scales[2]!.x(CRANK.hx), y: scales[2]!.y(CRANK.hy) }]
  const plates = ROWS.map((name) => (find(layout, 'step2').children ?? []).filter((n) => n.id.startsWith(`${name}-plate-`)).map((n) => n.id))
  const plateX = boxOf(layout, 'phone-plate-typed').x
  const legendBox = SLOT.strips.map((strip, r) => boxOf(layout, reelId(r, strip[0]!)))
  let s = fresh('live')
  let rng: Random = stream('step2', config.seed)
  let seed: number = config.seed

  const allDone = (): boolean => s.field >= FIELDS
  // Live site only: the narrator still owes this page a line, so Continue is not ready yet. Never set in the film.
  let held = false
  const inStop = (p: { x: number; y: number }, r: number): boolean => p.x >= stops[r]!.x - STOP.reach && p.x <= stops[r]!.x + stops[r]!.w + STOP.reach && p.y >= stops[r]!.y - STOP.reach && p.y <= stops[r]!.y + stops[r]!.h + STOP.reach
  const fieldAt = (i: number): { x: number; y: number } => ({ x: FX + FW / 2, y: rowY(i) + FH / 2 })
  const inField = (p: { x: number; y: number }, i: number): boolean => p.x >= FX && p.x <= FX + FW && p.y >= rowY(i) && p.y <= rowY(i) + FH
  const overGo = (p: { x: number; y: number }): boolean => p.x >= go.x && p.x <= go.x + go.w && p.y >= go.y && p.y <= go.y + go.h
  const still = (sl: SlotState): boolean => sl.phase === 'rest' || sl.stopped.every((v) => v >= REEL.still)
  const settled = (): string[] | null => (still(s.slot) ? SLOT.strips.map((strip, r) => strip[mod(Math.round(reelPos(s.slot, r)), strip.length)]!) : null)

  function openRow(i: number, io: StepIo): void {
    s.open = i
    s.phase = 'opening'
    s.rowT = 0
    s.endT = 0
    s.outT = 0
    s.lift = 0
    s.idle = 0
    if (i === 2) s.crank.set = true
    if (i === 1) {
      const sl = s.slot
      const date = ownDate(s.birth.typed)
      s.birth.typed = date.typed
      sl.own = date.own
      for (let r = 0; r < 3; r++) sl.from[r] = sl.own[r]! - (s.mode === 'film' ? SLOT.speed[r]! * (FILM.stops[r]! - FILM.lever) : SLOT.lead[r]!)
    }
    io.emit('row-open', FX + FW / 2, rowY(i) + FH / 2, false)
    io.emit(`stage-in-${ROWS[i]}`, middle[i]!.x, middle[i]!.y, false)
    if (i === 2) staged(io, 2).emit('volume-sign', sign.cx, sign.cy, false)
  }

  function closeRow(io: StepIo): void {
    s.phase = 'closing'
    s.outT = 0
    io.emit(`stage-out-${ROWS[s.open]}`, middle[s.open]!.x, middle[s.open]!.y, false)
  }

  function dialRelease(io: StepIo): void {
    const d = s.dial
    const at = holePlace(d.k, d.a)
    if (d.a >= Math.PI / 4) {
      const n = clamp(Math.round((d.a - Math.PI / 6) / DIAL.pitch), 1, d.k)
      d.digits += DIAL.digit(n)
      io.emit('dial-return', at.x, at.y, false)
      if (d.digits.length >= DIGITS) {
        d.phase = 'whip'
        d.w = WHIP.slow
        d.turn = 0
        d.t = 0
        d.left = d.a + TAU + mod(DIAL.holeAngle(d.k) + Math.PI / 2, TAU)
        io.cursor.take('dial')
        if (s.mode === 'live') io.cursor.act('scared')
        return
      }
    } else if (d.a > 0.09) io.emit('dial-return', at.x, at.y, false)
    d.phase = 'return'
  }

  function unwind(d: DialState): void {
    if (d.a <= 0) {
      d.r = 0
      return
    }
    d.r = Math.min(RETURN.most, d.r + RETURN.gather * dt)
    d.a = Math.max(0, d.a - Math.min(d.r, RETURN.least + RETURN.slow * d.a) * dt)
    if (d.a === 0) d.r = 0
  }

  function stepDial(io: StepIo, forced: boolean): boolean {
    const d = s.dial
    const p = io.pointer
    if (forced && (d.phase === 'rest' || d.phase === 'drag' || d.phase === 'return')) {
      d.phase = d.a > 0 ? 'return' : 'over'
      s.done[0] = true
      d.t = 1
    }
    if (d.phase === 'rest' && !s.done[0] && io.pressed) {
      for (let k = 1; k <= 10; k++) {
        const h = holePlace(k, 0)
        if (Math.hypot(p.x - h.x, p.y - h.y) <= DIAL.hole + 6) {
          d.k = k
          d.phase = 'drag'
          io.emit('dial-wind', h.x, h.y, false)
          break
        }
      }
    } else if (d.phase === 'drag') {
      const far = Math.hypot(p.x - DIAL.cx, p.y - DIAL.cy)
      if (!p.down || far > DIAL.r + 90) dialRelease(io)
      else if (far > 12) d.a = clamp(d.a + clamp(wrapPi(Math.atan2(p.y - DIAL.cy, p.x - DIAL.cx) - (DIAL.holeAngle(d.k) + d.a)), -0.6, 0.6), 0, DIAL.travel(d.k))
    } else if (d.phase === 'return') {
      unwind(d)
      if (d.a === 0) {
        d.phase = s.done[0] ? 'over' : 'rest'
        d.k = 0
      }
    } else if (d.phase === 'whip') {
      d.t += dt
      d.w = Math.min(WHIP.fast, WHIP.slow + WHIP.gain * Math.pow(d.t, WHIP.rise))
      const turn = Math.min(d.left, d.w * dt)
      d.a -= turn
      d.left -= turn
      const at = holePlace(d.k, d.a)
      io.cursor.place(at.x, at.y, TOP + 6)
      const want = WHIP.tip + Math.PI + Math.atan2(at.y - DIAL.cy, at.x - DIAL.cx)
      d.turn += wrapPi(want - d.turn) * Math.min(1, WHIP.follow * dt)
      io.cursor.strike(wrapPi(d.turn), dt * 2)
      io.cursor.press(1 + WHIP.long * clamp((d.w - WHIP.slow) / (WHIP.fast - WHIP.slow), 0, 1), dt * 2)
      if (d.left <= 1e-9) {
        io.emit('dial-fling', at.x, at.y, true)
        mark(io, 'fling', 'shocked')
        d.phase = 'snag'
        d.x = at.x
        d.y = at.y
        d.a = mod(d.a, TAU)
        d.t = 0
      }
    } else if (d.phase === 'snag') {
      d.t += dt
      io.cursor.place(d.x, d.y, TOP + 6)
      io.cursor.strike(wrapPi(d.turn), dt * 2)
      io.cursor.press(SNAG.long, dt * 2)
      if (d.t >= SNAG.held) {
        d.phase = 'fly'
        d.z = TOP + 6
        const air = WHIP.air - SNAG.held
        d.from = wrapPi(d.turn) - (wrapPi(d.turn) > 0 ? TAU : 0)
        d.air = 0
        const far = Math.hypot(LANDING.x - d.x, LANDING.y - d.y)
        d.vx = ((LANDING.x - d.x) * (1 - SKID.short / far)) / air
        d.vy = ((LANDING.y - d.y) * (1 - SKID.short / far)) / air
        d.vz = (hover - d.z) / air + (G * air) / 2
        s.done[0] = true
        d.t = 0
      }
    } else if (d.phase === 'fly') {
      unwind(d)
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.vz -= G * dt
      d.z += d.vz * dt
      d.air = Math.min(1, d.air + dt / (WHIP.air - SNAG.held))
      io.cursor.strike(wrapPi(d.from + (SKID.lie - TAU * WHIP.tumble - d.from) * d.air), dt * 2)
      io.cursor.press(WHIP.thrown, dt * 2)
      if (d.z <= hover && d.vz < 0) {
        io.cursor.place(d.x, d.y, hover)
        io.cursor.react('recoil')
        d.phase = 'skid'
        d.air = 0
        d.vx = LANDING.x - d.x
        d.vy = LANDING.y - d.y
      } else io.cursor.place(d.x, d.y, Math.max(hover, d.z))
    } else if (d.phase === 'skid') {
      unwind(d)
      d.air = Math.min(1, d.air + dt / SKID.long)
      const u = 1 - (1 - d.air) * (1 - d.air)
      io.cursor.place(d.x + d.vx * u, d.y + d.vy * u, hover)
      io.cursor.strike(SKID.lie, dt * 2)
      io.cursor.press(SKID.low, dt * 2)
      if (d.air >= 1) {
        io.cursor.release()
        if (s.mode === 'live') io.cursor.act('nervous')
        d.phase = 'return'
      }
    }
    if (s.done[0]) {
      d.t += dt
      if (d.home >= 0) d.home += dt
      else if (d.a === 0) d.home = 0
    }
    return s.done[0]! && d.phase === 'over' && d.t > 0.5
  }

  function pull(io: StepIo): void {
    const sl = s.slot
    sl.pv = LEVER.drive
    sl.latch = LEVER.hold
    sl.phase = 'spin'
    sl.t = 0
    io.emit('lever-pull', SLOT.leverX, knobY(1), false)
    io.emit('reels-spin', SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h / 2, false)
  }

  function stopReel(io: StepIo, r: number): void {
    const sl = s.slot
    const at = reelPos(sl, r)
    sl.at[r] = at
    sl.to[r] = Math.round(at)
    sl.stopped[r] = 0
    sl.down[r] = STOP.down
    s.rowT = 0
    io.emit('reel-stop', SLOT.reelX(r) + SLOT.reelW / 2, SLOT.reelY + SLOT.reelH / 2, false)
    if (sl.stopped.every((v) => v >= 0)) {
      sl.phase = 'read'
      sl.t = 0
      sl.win = [0, 1, 2].every((k) => mod(sl.to[k]!, SLOT.strips[k]!.length) === sl.own[k])
      s.done[1] = true
    }
  }

  function stepBirth(io: StepIo): void {
    const b = s.birth
    const add = (digit: string): void => {
      b.typed += digit
      b.t = 0
      io.emit('date-key', FX + FW / 2, rowY(1) + FH / 2, false)
    }
    if (!b.focus) {
      if ((io.pressed && inField(io.pointer, 1)) || s.idle >= LIMIT) {
        b.focus = true
        b.t = 0
      }
      return
    }
    b.t += dt
    const full = b.typed.length >= TYPED.digits
    const key = io.pointer.key
    if (full) {
      if (b.t >= TYPED.open) openRow(1, io)
    } else if (s.mode === 'film') {
      if (b.t >= (b.typed.length === 0 ? TYPED.first : TYPED.every)) add(SLOT.film.join('')[b.typed.length]!)
    } else if (b.fill !== '') {
      if (b.t >= TYPED.every) add(b.fill[b.typed.length]!)
    } else if (key !== undefined && key >= '0' && key <= '9' && key.length === 1) add(key)
    else if (key === 'Backspace') {
      b.typed = b.typed.slice(0, -1)
      b.t = 0
    } else if ((io.pressed && inField(io.pointer, 1)) || b.t >= TYPED.after) {
      b.fill = two(1 + rng.int(12)) + two(1 + rng.int(28)) + String(1960 + rng.int(45))
      b.t = 0
    }
  }

  function mark(io: StepIo, name: Mark, live: Acting): void {
    s.marks[name] = io.time
    io.cursor.act(s.mode === 'film' ? actingAt(io.time, s.marks) : live)
  }

  function stepCoins(io: StepIo): void {
    const sl = s.slot
    const c = io.cursor
    const left = FX + COIN.wall + COIN.r
    const right = FX + SW(1) - COIN.wall - COIN.r
    const roof = trayY(1) + COIN.wall + COIN.r
    const lid = trayY(1) + COIN.r + 2
    const ledge = trayY(1) + SH(1) - COIN.wall - COIN.r
    const floor = TRAY_Z + COIN.clear
    sl.cool = Math.max(0, sl.cool - dt)
    for (const coin of sl.coins) {
      if (coin.still) {
        coin.y = Math.max(lid, Math.min(coin.y, ledge - coin.row * COIN.pitch))
        continue
      }
      if (coin.hit || coin.vz < 0) coin.falls = true
      if (coin.falls) coin.vy += COIN.fall * dt
      coin.x += coin.vx * dt
      coin.y += coin.vy * dt
      coin.vz -= G * dt
      coin.z += coin.vz * dt
      coin.rot += (Math.hypot(coin.vx, coin.vy) / 13) * dt
      if (!coin.hit && coin.vz < 0 && coin.z < 46 && Math.hypot(coin.x - (c.x + 14), coin.y - (c.y + 28)) < 38 && !c.taken) {
        coin.hit = true
        c.knock(coin.vx * 0.1, coin.vy * 0.1, 70)
        if (!sl.rang) {
          sl.rang = true
          io.emit('coins', c.x, c.y, true)
          mark(io, 'strike', 'scared')
        }
        if (sl.cool === 0 && s.mode === 'live') {
          c.react('flinch')
          sl.cool = 0.2
        }
        coin.vx = -coin.vx * 0.35 + rng.range(-120, 120)
        coin.vy = coin.vy * 0.3 + rng.range(-120, 120)
        coin.vz = 260
      }
      let row = 0
      while (row < COIN.rows && sl.coins.some((o) => o.still && o.row === row && Math.abs(o.x - coin.x) < COIN.r * 2 - 1)) row++
      coin.row = row
      const low = floor + row * COIN.stack
      const rest = Math.max(lid, ledge - row * COIN.pitch)
      if (coin.z <= low && coin.vz < 0) {
        if (!sl.rang) {
          sl.rang = true
          io.emit('coins', coin.x, coin.y, false)
        }
        coin.z = low
        coin.vz = -coin.vz > 140 ? -coin.vz * 0.42 : 0
      }
      if ((coin.x < left && coin.vx < 0) || (coin.x > right && coin.vx > 0)) coin.vx = -coin.vx * COIN.spring
      coin.x = clamp(coin.x, left, right)
      if (coin.y < roof && coin.vy < 0) {
        coin.y = roof
        coin.vy = -coin.vy * COIN.spring
      }
      if (coin.y >= rest && coin.vy >= 0) {
        coin.y = rest
        coin.hops++
        coin.vy = coin.vy > COIN.least && coin.hops <= COIN.hops ? -coin.vy * COIN.spring : 0
        coin.vx *= 0.6
        if (row === COIN.rows) coin.vx = (coin.n % 2 === 0 ? 1 : -1) * COIN.roll
        else if (coin.vy === 0 && coin.z === low && coin.vz === 0 && Math.abs(coin.vx) < 14) coin.still = true
      }
    }
  }

  function stepSlot(io: StepIo, forced: boolean): boolean {
    const sl = s.slot
    const p = io.pointer
    if (sl.phase === 'rest') {
      sl.wait += dt
      if (forced || (s.mode === 'film' ? io.time >= LEVER_AT - dt / 2 : sl.wait >= REEL.auto)) pull(io)
    } else if (sl.phase === 'spin') {
      sl.t += dt
      for (let r = 0; r < 3; r++) if (sl.stopped[r]! < 0 && (forced || (io.pressed && inStop(p, r)))) stopReel(io, r)
    }
    for (let r = 0; r < 3; r++) {
      if (sl.stopped[r]! >= 0) sl.stopped[r] = sl.stopped[r]! + dt
      sl.down[r] = Math.max(0, sl.down[r]! - dt)
    }
    if (!sl.grab && sl.latch > 0) {
      if (sl.p < 1 + LEVER.give) sl.p = Math.min(1 + LEVER.give, sl.p + sl.pv * dt)
      else {
        sl.latch = Math.max(0, sl.latch - dt)
        sl.pv = 0
      }
    } else if (!sl.grab && (sl.p !== 0 || sl.pv !== 0)) {
      sl.pv += (-LEVER.spring * sl.p - LEVER.damp * sl.pv) * dt
      sl.p += sl.pv * dt
      if (sl.p < -LEVER.over && sl.pv < 0) {
        sl.p = -LEVER.over
        sl.pv = -sl.pv * 0.3
      }
      if (Math.abs(sl.p) < 0.003 && Math.abs(sl.pv) < 0.08) {
        sl.p = 0
        sl.pv = 0
      }
    }
    if (sl.phase === 'read') {
      sl.t += dt
      if (sl.t >= REEL.read) {
        sl.phase = 'pay'
        sl.t = 0
        io.emit(sl.win ? 'date-hit' : 'date-miss', SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h / 2, false)
        if (!sl.win) sl.rang = true
        if (s.mode === 'live') io.cursor.act(sl.win ? 'shocked' : 'nervous')
      }
    } else if (sl.phase === 'pay' && !sl.win) {
      sl.t += dt
      if (sl.spawned < MISS.coins) {
        sl.coins.push({ n: sl.spawned, x: SLOT.payX + SLOT.payW / 2, y: SLOT.payY + SLOT.payH / 2, z: 6, vx: rng.range(-30, 30), vy: MISS.fall, vz: 180, rot: 0, hit: true, still: false, falls: true, row: 0, hops: 0 })
        sl.spawned++
      }
      if (sl.t >= MISS.long) {
        sl.phase = 'over'
        if (s.mode === 'live') io.cursor.act('plain')
      }
    } else if (sl.phase === 'pay') {
      sl.t += dt
      while (sl.spawned < COINS && sl.t >= sl.spawned * SPIT.every) {
        const x = SLOT.payX + SLOT.payW / 2 + rng.range(-70, 70)
        const y = SLOT.payY + SLOT.payH / 2
        const sure = sl.spawned < SPIT.first ? SPIT.aim : 1
        let dx = io.cursor.x + 14 + rng.range(-30, 30) * sure - x
        let dy = io.cursor.y + 28 + rng.range(-30, 30) * sure - y
        const far = Math.hypot(dx, dy)
        if (far > 430) {
          dx *= 430 / far
          dy *= 430 / far
        }
        if (far < 60) dy += 90
        const slow = rng.range(0.4, 0.52)
        const air = sl.spawned < SPIT.first ? mix(SPIT.air[0]!, SPIT.air[1]!, (slow - 0.4) / 0.12) : slow
        sl.coins.push({ n: sl.spawned, x, y, z: 6, vx: dx / air, vy: dy / air, vz: (16 - 6) / air + (G * air) / 2, rot: 0, hit: false, still: false, falls: false, row: 0, hops: 0 })
        sl.spawned++
      }
      if (sl.t >= SPIT.long) {
        sl.phase = 'over'
        if (s.mode === 'live') io.cursor.act('plain')
      }
    }
    stepCoins(io)
    return sl.phase === 'over'
  }

  function runaway(io: StepIo): void {
    const c = s.crank
    c.phase = 'runaway'
    c.grab = false
    c.t = 0
    c.w = clamp(c.w, 9, 14)
    io.emit('crank-runaway', CRANK.hx, CRANK.hy, false)
    if (s.mode === 'live') io.cursor.act('shocked')
  }

  function stepCrank(io: StepIo, forced: boolean): boolean {
    const c = s.crank
    const p = io.pointer
    const turned = (): void => {
      while (c.total >= (c.turns + 1) * TAU) {
        c.turns++
        if (c.phase === 'rest') {
          const at = gripPlace(c.b)
          io.emit('crank-turn', at.x, at.y, false)
        }
      }
    }
    if (c.phase === 'rest') {
      const at = gripPlace(c.b)
      if (forced) runaway(io)
      else if (!c.grab && io.pressed && Math.hypot(p.x - at.x, p.y - at.y) <= 32) c.grab = true
      else if (c.grab) {
        if (!p.down) c.grab = false
        else if (Math.hypot(p.x - CRANK.hx, p.y - CRANK.hy) > 14) {
          const d = Math.min(0.5, wrapPi(Math.atan2(p.y - CRANK.hy, p.x - CRANK.hx) - c.b))
          if (d > 0) {
            c.b += d
            c.total += d
            c.level = Math.min(1, c.level + (RUN.hand * d) / TAU)
            c.w = mix(c.w, d / dt, 0.2)
            turned()
            if (c.turns >= TURNS) runaway(io)
          }
        }
      }
    } else if (c.phase === 'runaway' || c.phase === 'full') {
      c.t += dt
      c.b -= c.o
      if (c.phase === 'runaway') c.w = Math.min(RUN.most, c.w + 26 * dt)
      else c.w *= 1 - COAST.loss * dt
      const hand = io.cursor
      const safe = c.hit || hand.taken || hand.z >= BLOW_REACH.high || c.w <= BLOW_REACH.speed || Math.hypot(hand.x + 10 - CRANK.hx, hand.y + 20 - CRANK.hy) > BLOW_REACH.far
      c.b += c.phase === 'full' && s.mode === 'live' && safe ? c.w * dt * homeward(c.b, c.w) : c.w * dt
      c.total += c.w * dt
      if (c.phase === 'runaway') c.level = Math.min(1, c.level + ((1 - RUN.hand * TURNS) * c.w * dt) / ((s.mode === 'film' ? RUN.film : RUN.turns) * TAU))
      c.o = c.phase === 'runaway' ? -WIND.back * (c.t < WIND.long ? Math.pow(smooth(c.t / WIND.long), 1.5) : 1 - smooth((c.t - WIND.long) / WIND.out)) : 0
      c.b += c.o
      turned()
      if (c.phase === 'runaway' && c.level >= 1) {
        c.phase = 'full'
        s.done[2] = true
        io.emit('crank-full', CRANK.segX + 5 * (CRANK.segW + CRANK.segGap), CRANK.segY + CRANK.segH / 2, false)
      }
      if (c.phase === 'full' && c.w < COAST.least) {
        c.phase = 'over'
        c.w = 0
      }
      const cur = io.cursor
      if (s.mode === 'film' && c.toss < 0 && !c.hit && !cur.taken && c.t >= TOSS.at && c.phase === 'runaway') {
        c.toss = 0
        c.ox = cur.x
        c.oy = cur.y
        c.oz = cur.z
        cur.take('crank')
      }
      if (c.toss >= 0 && c.toss < TOSS.air + TOSS.skid) {
        c.toss += dt
        const reach = 1 - FLUNG.short / Math.max(FLUNG.short + 1, Math.hypot(AWAY.x - c.ox, AWAY.y - c.oy))
        const u = Math.min(1, c.toss / TOSS.air)
        const v = clamp((c.toss - TOSS.air) / TOSS.skid, 0, 1)
        const k = u < 1 ? reach * u : reach + (1 - reach) * (1 - (1 - v) * (1 - v))
        cur.place(c.ox + (AWAY.x - c.ox) * k, c.oy + (AWAY.y - c.oy) * k, hover + (c.oz - hover) * (1 - u) + FLUNG.high * 4 * u * (1 - u))
        cur.strike(wrapPi(FLUNG.lie - TAU * FLUNG.tumble * (1 - u)), dt * 2)
        cur.press(u < 1 ? FLUNG.long : FLUNG.low, dt * 2)
        if (v >= 1) cur.release()
      }
      if (!c.hit && c.t >= 0.2 && c.w > 6 && cur.z < 70 && !cur.taken) {
        const tip = gripPlace(c.b, CRANK.tip)
        const mx = cur.x + 10 - CRANK.hx
        const my = cur.y + 20 - CRANK.hy
        const ax = tip.x - CRANK.hx
        const ay = tip.y - CRANK.hy
        const u = clamp((mx * ax + my * ay) / (ax * ax + ay * ay), 0.25, 1)
        if (Math.hypot(mx - ax * u, my - ay * u) < 26) {
          c.hit = true
          c.hitAt = s.time
          c.stuck = BLOW.stuck
          c.sx = cur.x
          c.sy = cur.y
          const far = Math.hypot(mx, my) || 1
          const kx = -my / far + (BLOW.out * mx) / far
          const ky = mx / far + (BLOW.out * my) / far
          c.kx = (BLOW.kick * kx) / Math.hypot(kx, ky)
          c.ky = (BLOW.kick * ky) / Math.hypot(kx, ky)
          c.w *= BLOW.load
          cur.take('crank')
          cur.hurt('flattened')
          if (s.mode === 'live') cur.act('exhausted')
          io.emit('flatten', cur.x, cur.y, true)
        }
      }
    }
    return c.phase === 'over'
  }

  function afterCrank(io: StepIo): void {
    const c = s.crank
    if (c.stuck > 0) {
      c.stuck -= dt
      c.sx += c.kx * dt
      c.sy += c.ky * dt
      c.kx *= 1 - BLOW.drag * dt
      c.ky *= 1 - BLOW.drag * dt
      io.cursor.place(c.sx, c.sy, hover)
      if (c.stuck <= 0) io.cursor.release()
    }
    if (c.hit && !c.peeled && s.time >= (s.mode === 'film' ? PEEL_AT - dt / 2 : c.hitAt + HEAL - 0.4)) {
      c.peeled = true
      io.emit('peel-up', io.cursor.x, io.cursor.y, false)
      if (s.mode === 'live') io.cursor.act('plain')
    }
  }

  function topAt(x: number, y: number): number {
    const i = s.open
    if (i < 0) return overGo({ x, y }) ? heights.button - (s.pressed ? heights.keyTravel : 0) : 0
    let top = TRAY_Z
    const put = (v: number): void => {
      top = Math.max(top, v)
    }
    if (i === 0) {
      const far = Math.hypot(x - DIAL.cx, y - DIAL.cy)
      if (far <= DIAL.r) put(TOP + 3)
      if (far <= 30) put(TOP + 16)
    } else if (i === 1) {
      const ky = knobY(s.slot.p)
      if (x >= SLOT.x && x <= SLOT.x + SLOT.w && y >= SLOT.y && y <= SLOT.y + SLOT.h) put(TOP + 20)
      if (x >= SLOT.x + 10 && x <= SLOT.x + SLOT.w - 10 && y >= SLOT.y + 14 && y <= SLOT.y + SLOT.h - 14) put(TOP + 14)
      if (Math.abs(x - SLOT.leverX) <= 6 && y >= Math.min(ky, SLOT.pivotY) && y <= Math.max(ky, SLOT.pivotY)) put(TOP + 12)
      if (Math.hypot(x - SLOT.leverX, y - ky) <= SLOT.knob / 2) put(TOP + 40)
      for (let r = 0; r < 3; r++) if (x >= stops[r]!.x && x <= stops[r]!.x + stops[r]!.w && y >= stops[r]!.y && y <= stops[r]!.y + stops[r]!.h) put(STOP_Z - (s.slot.stopped[r]! >= 0 ? STOP.dip : 0))
    } else {
      const c = s.crank
      const far = Math.hypot(x - CRANK.hx, y - CRANK.hy)
      if (far <= CRANK.base / 2) put(18)
      if (far <= CRANK.hub / 2) put(TOP + 10)
      if (x >= sign.x && x <= sign.x + sign.w && y >= sign.y && y <= sign.y + sign.h) put(SIGN_Z)
      if (x >= CRANK.segX && x <= CRANK.segX + 10 * CRANK.segW + 9 * CRANK.segGap && y >= CRANK.segY && y <= CRANK.segY + CRANK.segH) put(18)
      if (c.phase === 'rest') {
        const ux = Math.cos(c.b)
        const uy = Math.sin(c.b)
        const along = (x - CRANK.hx) * ux + (y - CRANK.hy) * uy
        const across = Math.abs(-(x - CRANK.hx) * uy + (y - CRANK.hy) * ux)
        if (along >= 0 && along <= CRANK.arm && across <= CRANK.armW / 2) put(TOP + 6)
        if (Math.abs(along - CRANK.arm) <= CRANK.gripW / 2 && across <= CRANK.gripH / 2) put(TOP + 30)
      }
    }
    return top <= TRAY_Z ? 0 : Math.max(0, mix(TRAY_Z, top, smooth(s.lift)))
  }

  const footing = (x: number, y: number): number => Math.max(topAt(x, y), topAt(x + 12, y + 18), topAt(x + 22, y + 34), topAt(x + 4, y + 34))

  // The cursor sees a thing in its way before it stands on it: the ground it is told of is the highest within a few steps toward the pointer, and it rises at a pace, so it climbs and is not lifted in one step.
  function ground(io: StepIo): void {
    const x = io.cursor.x
    const y = io.cursor.y
    let top = footing(x, y)
    const dx = io.pointer.x - x
    const dy = io.pointer.y - y
    const far = Math.hypot(dx, dy)
    if (far > 1) {
      for (let k = 1; k <= CLIMB.looks; k++) {
        const d = Math.min(far, (CLIMB.ahead * k) / CLIMB.looks)
        top = Math.max(top, footing(x + (dx / far) * d, y + (dy / far) * d))
      }
    }
    s.climb = top > s.climb ? Math.min(top, s.climb + CLIMB.rise * dt) : top
    io.cursor.setGround(s.climb)
  }

  function grip(io: StepIo): void {
    const ready = s.open >= 0 && s.phase === 'ready'
    let at: { x: number; y: number; z: number } | null = null
    if (ready && s.open === 0 && s.dial.phase === 'drag') at = { ...holePlace(s.dial.k, s.dial.a), z: TOP + 3 }
    if (ready && s.open === 2 && (s.crank.grab || (s.crank.phase === 'runaway' && s.crank.t < WIND.long))) {
      const shown = s.crank.b
      const hold = gripPlace(shown, CRANK.arm + CRANK.hold)
      at = { x: hold.x - Math.sin(shown) * CRANK.holdAside, y: hold.y + Math.cos(shown) * CRANK.holdAside, z: TOP + 30 }
    }
    if (at) {
      if (!s.gripped) s.reach = { x: io.cursor.x - at.x, y: io.cursor.y - at.y, z: io.cursor.z - (at.z + hover), t: 0 }
      s.reach.t = Math.min(1, s.reach.t + dt / REACH)
      const left = (1 - s.reach.t) * (1 - s.reach.t)
      io.cursor.take('grip')
      const swing = s.open === 2 && s.gripped && s.swing ? { x: (at.x - s.swing.x) / dt, y: (at.y - s.swing.y) / dt } : null
      io.cursor.place(at.x + s.reach.x * left, at.y + s.reach.y * left, at.z + hover + s.reach.z * left)
      if (swing) {
        const keep = clamp((TURNS * TAU - s.crank.total) / (SWING.settle * TAU), 0, 1)
        const share = keep * keep * s.reach.t
        io.cursor.knock(swing.x * share, swing.y * share)
      }
      s.swing = s.open === 2 ? { x: at.x, y: at.y } : null
      s.gripped = true
    } else if (s.gripped) {
      s.gripped = false
      if (s.swing) io.cursor.place(io.cursor.x, io.cursor.y, io.cursor.z)
      s.swing = null
      if (s.dial.phase !== 'whip' && s.dial.phase !== 'snag' && s.dial.phase !== 'fly' && s.dial.phase !== 'skid') io.cursor.release()
    }
  }

  function press(io: StepIo): void {
    s.pressed = true
    if (io.cursor.damaged) {
      io.cursor.hurt('flattened', 0.3)
      if (s.crank.hit && !s.crank.peeled) {
        s.crank.peeled = true
        io.emit('peel-up', io.cursor.x, io.cursor.y, false)
      }
      if (s.mode === 'live') io.cursor.act('plain')
    }
    io.emit('button-press', go.cx, go.cy, false)
  }

  // Each machine has its own way out of the page and back into it.
  // The phone: the page opens round under it like an iris, the dial is pushed up turning, the iris shuts under it and it lands. It goes back the same way and bounces once at the bottom.
  // The slot machine: a hatch gapes, the machine is shot up through it and hangs while the hatch slams shut, it lands with a thud, its lever unfolds and its three buttons come up through the page one after the other. Going, it pulls its own lever, hops, and drops through the hatch.
  // The crank: it winds itself up out of the page, the bars of the level come up through the page in a row, and the sign unfolds from its lower edge last. It folds away in the same order backwards.
  function pose(): Pose {
    const i = s.open
    if (i < 0 || s.phase === 'ready' || s.phase === 'ending') return STANDING
    const coming = s.phase === 'opening'
    const t = coming ? s.rowT - ENTER.from : s.outT
    if (coming && t < 0) return { ...STANDING, shown: false }
    const m = scales[i]!
    const { deep, flush } = HOLE
    if (i === 0) {
      const c = middle[0]!
      const round = (rho: number, down: number): Pose['hole'] => (rho >= 8 ? { x: c.x - rho, y: c.y - rho, w: rho * 2, h: rho * 2, r: rho, deep: down } : null)
      if (coming) {
        const rho = t < 0.5 ? HOLE.iris * out3(seg(t, 0, 0.2)) : mix(HOLE.iris, HOLE.seat, smooth(seg(t, 0.5, 0.72)))
        const down = mix(deep, flush, out3(seg(t, 0.14, 0.5)))
        return { ...STANDING, hole: t < 0.72 ? round(rho, HOLE.pit) : null, sink: down - flush - 12 * hop(seg(t, 0.5, 0.74)), spin: TAU * 1.25 * (1 - out3(seg(t, 0.14, 0.68))), shown: t >= 0.1 }
      }
      const rho = t < 0.34 ? mix(HOLE.seat, HOLE.iris, out3(seg(t, 0, 0.12))) : HOLE.iris * (1 - smooth(seg(t, 0.34, 0.5)))
      const fall = seg(t, 0.08, 0.36)
      return { ...STANDING, hole: round(rho, HOLE.pit), sink: HOLE.gone * fall * fall - 16 * hop(seg(t, 0, 0.14)), spin: TAU * fall * fall, shown: rho >= 8 }
    }
    if (i === 1) {
      const x0 = m.x(SLOT.x) - HOLE.hatch * 1.6
      const x1 = m.x(SLOT.leverX + SLOT.knob / 2) + HOLE.hatch * 1.6
      const y0 = m.y(SLOT.y - 6) - HOLE.hatch * 1.5
      const y1 = m.y(SLOT.payY + SLOT.payH) + HOLE.hatch * 1.5
      const hatch = (gape: number, down: number): Pose['hole'] => {
        const h = (y1 - y0) * gape
        return h >= 10 ? { x: x0, y: (y0 + y1) / 2 - h / 2, w: x1 - x0, h, r: Math.min(HOLE.hatchR, h / 2), deep: down } : null
      }
      const stop = (id: string): number => (id.startsWith('slot-stop-') ? Number(id.charAt(10)) : -1)
      if (coming) {
        const gape = t < 0.3 ? out3(seg(t, 0, 0.1)) : 1 - smooth(seg(t, 0.3, 0.42))
        const rise = seg(t, 0.08, 0.24)
        const under = HOLE.gone * (1 - rise * rise)
        const leap = 30 * hop(seg(t, 0.24, 0.46)) + 9 * hop(seg(t, 0.46, 0.56))
        return {
          ...STANDING, hole: hatch(gape, HOLE.pit), sink: under - leap,
          jolt: t > 0.46 ? 5 * Math.exp(-16 * (t - 0.46)) * Math.sin(60 * (t - 0.46)) : 0,
          lever: t < 0.4 ? 1 : 1 - back(seg(t, 0.4, 0.64)),
          drop: (id) => (stop(id) < 0 ? 0 : HOLE.under * (1 - back(seg(t, 0.46 + 0.07 * stop(id), 0.58 + 0.07 * stop(id)))) + (t < 0.46 + 0.07 * stop(id) ? leap : 0)),
          shown: t >= 0.05
        }
      }
      const gape = t < 0.34 ? out3(seg(t, 0.05, 0.15)) : 1 - smooth(seg(t, 0.34, 0.455))
      const fall = seg(t, 0.17, 0.32)
      const under = HOLE.gone * fall * fall
      const midY = (y0 + y1) / 2
      const midX = (x0 + x1) / 2
      return {
        ...STANDING, hole: hatch(gape, HOLE.pit), sink: under - 14 * hop(seg(t, 0.03, 0.17)), lever: smooth(seg(t, 0, 0.14)),
        drop: (id) => (stop(id) < 0 ? 0 : HOLE.under * seg(t, 0.03 * (2 - stop(id)), 0.03 * (2 - stop(id)) + 0.08) ** 2),
        coin: (n, x, y) => {
          const from = SWEEP.from + SWEEP.each * (n % 7)
          const u = seg(t, from, from + SWEEP.long)
          const tx = clamp(x, x0 + SWEEP.in, x1 - SWEEP.in)
          return { x: mix(x, tx + Math.sign(midX - tx) * SWEEP.apart * ((n * 3) % 5), smooth(u)), y: mix(y, midY + SWEEP.row * ((n % 5) - 2), smooth(u)), down: SWEEP.deep * seg(t, from + SWEEP.long, from + SWEEP.long + 0.08) ** 2 }
        },
        shown: t < 0.455
      }
    }
    const bar = (id: string): number => (id.startsWith('meter-') ? Number(id.slice(6)) : -1)
    if (coming)
      return {
        ...STANDING, swing: -TAU * 1.5 * (1 - out3(seg(t, 0.02, 0.52))), sign: t < 0.27 ? 0 : unfold(seg(t, 0.27, 0.77)),
        drop: (id) => (CRANK_BODY.includes(id) ? 100 * (1 - back(seg(t, 0, 0.34))) : bar(id) > 0 ? BAR_UNDER * (1 - back(seg(t, 0.14 + 0.03 * bar(id), 0.27 + 0.03 * bar(id)))) : 0)
      }
    const u = seg(t, 0.14, 0.46)
    return {
      ...STANDING, swing: -TAU * 1.5 * u * u, sign: 1 - seg(t, 0, 0.18) ** 2,
      drop: (id) => (CRANK_BODY.includes(id) ? 100 * u * u : bar(id) > 0 ? BAR_UNDER * seg(t, 0.1 + 0.026 * (10 - bar(id)), 0.2 + 0.026 * (10 - bar(id))) ** 2 : 0)
    }
  }

  const page: PageLogic = {
    id: 'step2', unit: 'step2', width: 1920, height: SCREEN_H, layout, gags, start: { x: 1560, y: 440 }, control: 'pointer',
    reset(ctx: PageContext) {
      s = fresh(ctx.mode)
      seed = ctx.seed
      rng = stream('step2', seed)
      s.rng = rng.state()
    },
    step(io: StepIo) {
      rng.restore(s.rng)
      held = io.wait === true
      s.time = io.time
      s.px = io.pointer.x
      s.py = io.pointer.y
      if (s.mode === 'film') {
        io.cursor.act(actingAt(io.time, s.marks))
        for (const [at, name] of reactions) if (io.step === Math.round(filmAt(at) * stepHz)) io.cursor.react(name)
        for (const [at, kind, a, b, c] of poses) {
          if (io.step !== Math.round(filmAt(at) * stepHz)) continue
          if (kind === 'aim') io.cursor.aim(a)
          else if (kind === 'press') io.cursor.press(a, b)
          else if (kind === 'hold') io.cursor.hold(a)
          else if (kind === 'wobble') io.cursor.wobble(a, b, c)
          else if (io.cursor.damaged) io.cursor.hurt('flattened', a)
        }
      }
      if (s.skipping && !s.pressed) {
        for (let i = 0; i < 3; i++) s.done[i] = true
        s.crank.level = 1
        if (s.open < 0) {
          s.field = FIELDS
          s.count = FIELDS
          s.slide = -1
        }
        if (s.open >= 0 && s.phase !== 'closing') {
          if (io.cursor.taken) io.cursor.release()
          if (s.open === 2 && !crankHome(s.crank.b)) {
            s.crank.b = skipHome(s.crank.b, s.crank.w, dt)
            s.endT = 0
          } else closeRow(io)
        }
      }
      if (s.slide >= 0) {
        s.slide += dt
        if (s.slide >= SLIDE.long) s.slide = -1
      }
      if (s.open < 0) {
        s.idle += dt
        const i = s.field
        if (i < FIELDS && s.done[i]) {
          s.turn += dt
          if (i === FIELDS - 1) s.field = FIELDS
          else if (s.turn >= (s.mode === 'film' ? SLIDE.filmHold : SLIDE.hold)) {
            s.field = i + 1
            s.slide = 0
            s.idle = 0
            io.emit('field-next', FX + FW / 2, rowY(i + 1) + FH / 2, false)
          }
        } else if (i < FIELDS && s.slide < 0) {
          if (i === 1) stepBirth(io)
          else if ((io.pressed && inField(io.pointer, i)) || s.idle >= LIMIT) openRow(i, io)
        } else if (i >= FIELDS && !s.pressed && (s.skipping || (!held && ((io.pressed && overGo(io.pointer)) || s.idle >= LIMIT)))) press(io)
      } else {
        const i = s.open
        s.rowT += dt
        const forced = s.phase === 'ready' && s.rowT >= LIMIT
        const active = s.phase === 'ready' || s.phase === 'ending' || s.phase === 'closing'
        if (s.phase === 'opening') {
          s.lift = seg(s.rowT, ENTER.from, ENTER.long[i]!)
          if (s.rowT >= ENTER.long[i]! - dt / 2) {
            s.phase = 'ready'
            s.lift = 1
          }
        }
        let over = false
        if (active && !s.skipping) {
          const sio = staged(io, i)
          if (i === 0) over = stepDial(sio, forced)
          else if (i === 1) over = stepSlot(sio, forced)
          else over = stepCrank(sio, forced)
        }
        if (s.phase === 'ready' && over) {
          s.phase = 'ending'
          s.endT = 0
        } else if (s.phase === 'ending') {
          s.endT += dt
          if (s.endT >= ENTER.held) closeRow(io)
        } else if (s.phase === 'closing') {
          s.outT += dt
          s.lift = 1 - seg(s.outT, 0, ENTER.out[i]!)
          if (s.outT >= ENTER.out[i]! - dt / 2) {
            s.lift = 0
            s.open = -1
            s.phase = 'closed'
            s.idle = 0
            s.turn = 0
            if (s.done[i]) {
              s.count = Math.max(s.count, i + 1)
              io.emit('field-done', FX + FW / 2, rowY(i) + FH / 2, false)
            }
            s.slot.coins = []
            if (io.cursor.taken && s.crank.stuck <= 0) io.cursor.release()
            if (s.mode === 'live' && (!s.crank.hit || s.crank.peeled)) io.cursor.act('plain')
          }
        }
      }
      afterCrank(staged(io, 2))
      ground(s.open >= 0 ? staged(io, s.open) : io)
      if (s.mode === 'film') grip(s.open >= 0 ? staged(io, s.open) : io)
      s.eased += (s.count - s.eased) * Math.min(1, EASE * dt)
      if (Math.abs(s.count - s.eased) < 1e-3) s.eased = s.count
      if (s.pressed) {
        s.hold += dt
        if (s.hold > 0.25 && !io.cursor.damaged) s.finished = true
      }
      s.rng = rng.state()
    },
    save: () => JSON.parse(JSON.stringify(s)) as State,
    load(state) {
      s = JSON.parse(JSON.stringify(state)) as State
      rng = stream('step2', seed)
      rng.restore(s.rng)
    },
    draw(out: DrawList) {
      drawPage(out)
    },
    scroll: () => 0,
    view: () => null,
    camera: () => null,
    script: (time: number): Pointer => pointerAt(time),
    hint(): Hint | null {
      const m = s.open >= 0 ? scales[s.open]! : null
      const px = m ? m.backX(s.px) : s.px
      const py = m ? m.backY(s.py) : s.py
      const inner = (): Hint | null => {
        const here = { x: px, y: py, down: false }
        const blink = Math.floor(s.time * 4) % 2 === 0
        if (s.pressed || s.skipping) return here
        if (s.open < 0) {
          if (allDone()) return { x: go.cx, y: go.cy, down: blink }
          const at = fieldAt(s.field)
          if (s.done[s.field] || s.slide >= 0) return { x: at.x, y: at.y, down: false }
          if (s.field === 1 && s.birth.focus) {
            const next = SLOT.film.join('')[s.birth.typed.length]
            return { x: at.x, y: at.y, down: false, ...(next !== undefined && s.birth.fill === '' ? { key: next } : {}) }
          }
          return { x: at.x, y: at.y, down: blink }
        }
        if (s.open === 0) {
          const d = s.dial
          const k = d.k || 5
          const rest = holePlace(k, 0)
          if (s.phase === 'opening') return { ...rest, down: false }
          if (s.phase !== 'ready' || s.done[0]) return here
          if (d.phase === 'rest') return { ...rest, down: Math.hypot(px - rest.x, py - rest.y) <= DIAL.hole * 0.6 }
          if (d.phase === 'drag') {
            const full = DIAL.travel(k)
            if (d.a >= full - 0.01) return { ...holePlace(k, full), down: false }
            return { ...holePlace(k, Math.min(full + 0.03, d.a + 0.16)), down: true }
          }
          return { ...rest, down: false }
        }
        if (s.open === 1) {
          const sl = s.slot
          const r = sl.stopped.findIndex((v) => v < 0)
          if (r >= 0 && s.phase !== 'ending' && s.phase !== 'closing') {
            const len = SLOT.strips[r]!.length
            const off = mod(reelPos(sl, r) - sl.own[r]! + len / 2, len) - len / 2
            return { x: stops[r]!.cx, y: stops[r]!.cy, down: sl.phase === 'spin' && sl.t >= REEL.gather && off >= HINT.from && off <= HINT.to && Math.hypot(px - stops[r]!.cx, py - stops[r]!.cy) <= 20 }
          }
          const out: Hint = { x: SLOT.leverX + 6, y: SLOT.y + SLOT.h + 6, down: false }
          if (sl.win && (sl.phase === 'read' || sl.phase === 'pay')) out.dodge = { x: 420, y: trayY(1) + 60 }
          return out
        }
        const c = s.crank
        if (s.phase === 'opening') return { ...gripPlace(c.b), down: false }
        if (c.phase === 'rest' && s.phase === 'ready') {
          const at = gripPlace(c.b)
          return { ...gripPlace(c.b + (c.grab ? 0.15 : 0)), down: c.grab || Math.hypot(px - at.x, py - at.y) <= 20 }
        }
        const out: Hint = { ...gripPlace(CRANK.rest), down: false }
        if (c.phase === 'runaway' && !c.hit) out.dodge = { x: CRANK.hx + 300, y: CRANK.hy - 110 }
        return out
      }
      const h = inner()
      if (!h || !m) return h
      return { ...h, x: m.x(h.x), y: m.y(h.y), ...(h.dodge ? { dodge: { x: m.x(h.dodge.x), y: m.y(h.dodge.y) } } : {}) }
    },
    skip() {
      s.skipping = true
    },
    done: () => s.finished,
    gag() {
      if (s.open >= 0) return gags[s.open + 1]!.id
      if (allDone()) return gags[4]!.id
      if (s.field === 1 && s.birth.focus) return gags[2]!.id
      return s.done.some(Boolean) ? null : gags[0]!.id
    },
    typing: () => s.open < 0 && s.field === 1 && s.birth.focus && !s.done[1] && !s.pressed && !s.skipping,
    fields: (): FieldProgress => ({ done: s.eased, total: FIELDS }),
    ignoring: () => s.pressed || s.skipping,
    volume: () => (s.crank.set && !s.done[2] ? Math.max(0.1, Math.floor(s.crank.level * 10 + 1e-9) / 10) : 1),
    states: () => {
      const i = s.open
      const plate = ['', '', '']
      const verdict = (k: number): string => (k === 1 && !s.slot.win ? 'missed' : 'done')
      if (i >= 0) plate[i] = s.done[i] ? verdict(i) : s.phase === 'opening' ? '' : 'typing'
      else if (s.slide >= 0) plate[s.field - 1] = verdict(s.field - 1)
      else if (allDone()) plate[FIELDS - 1] = verdict(FIELDS - 1)
      else if (s.done[s.field]) plate[s.field] = verdict(s.field)
      return statesOf({
        here: i >= 0 ? (s.phase === 'opening' && s.rowT < ENTER.field ? [i] : []) : s.field < FIELDS && !s.done[s.field] ? [s.field] : [],
        open: i >= 0 && pose().shown ? i : -1,
        hole: i >= 0 && pose().hole !== null ? i : -1,
        panel: i >= 0 && (s.phase === 'ready' || s.phase === 'ending') && !s.done[i],
        plate,
        value: s.birth.typed.length > 0 ? 'typing' : 'ask',
        note: i < 0,
        settled: settled()
      })
    },
    sheet(id: string): SheetFrame | null {
      if (id !== 'machines') return null
      return machinesSheet()
    }
  }

  function chevron(out: DrawList, id: string, x: number, y: number, turn: number): void {
    const tilt = 0.7 * (1 - 2 * turn)
    for (const side of [-1, 1]) out.push({ id: `${id}-${side < 0 ? 'a' : 'b'}`, part: 'rows', kind: 'box', x: x + 14 + side * 5.2 - 8, y: y + 12.5, w: 16, h: 3, z0: VALUE_Z + 0.05, z1: VALUE_Z + 0.6, tone: 'ink', rot: -tilt * side, r: 1.5 })
  }

  const risen = (i: number, lift: number): number => smooth(lift) + (i > 0 ? HOUSED * (1 - smooth(lift)) : 0)

  function machine(out: DrawList, i: number, m: { dial: DialState; slot: SlotState; crank: CrankState }, lift: number, dx: number, dy: number, tag: string, a: Pose = STANDING): void {
    const L = risen(i, lift)
    const z = (v: number): number => mix(TRAY_Z, v, L)
    if (i === 0) {
      const plate = TRAY_Z + dialPlate(dialTop(L))
      for (let k = 1; k <= 10; k++) {
        const h = holePlace(k, dialShown(m.dial) + a.spin)
        out.push({ id: `${tag}dial-hole-${k}`, part: 'dial', kind: 'disc', x: h.x - DIAL.hole + dx, y: h.y - DIAL.hole + dy, w: DIAL.hole * 2, h: DIAL.hole * 2, z0: plate - 0.5, z1: plate, tone: 'light' })
      }
      const sx = DIAL.cx + (DIAL.ring + 20) * Math.cos(DIAL.stop)
      const sy = DIAL.cy + (DIAL.ring + 20) * Math.sin(DIAL.stop)
      out.push({ id: `${tag}dial-stop`, part: 'dial', kind: 'capsule', x: sx - 20 + dx, y: sy - 5 + dy, w: 40, h: 10, z0: z(TOP + 2), z1: z(TOP + 12), tone: 'dark', rot: DIAL.stop, mechanism: true })
    } else if (i === 1) {
      const ky = knobY(a.lever ?? m.slot.p) + kickOf(m.slot) + a.jolt
      const pivot = SLOT.pivotY + kickOf(m.slot) + a.jolt
      out.push({ id: `${tag}slot-mount`, part: 'slot', kind: 'box', x: SLOT.x + SLOT.w - 2 + dx, y: pivot - 10 + dy, w: 50, h: 20, z0: z(0), z1: z(TOP), tone: 'metal', r: 4 })
      out.push({ id: `${tag}slot-arm`, part: 'slot', kind: 'capsule', x: SLOT.leverX - 6 + dx, y: Math.min(ky, pivot) + dy, w: 12, h: Math.max(1, Math.abs(pivot - ky)), z0: z(TOP), z1: z(TOP + 12), tone: 'raised', v: [ky <= pivot ? 1 : -1], mechanism: true })
      for (let r = 0; r < 3; r++) {
        const strip = SLOT.strips[r]!
        const pos = reelPos(m.slot, r)
        const b = legendBox[r]!
        for (const n of still(m.slot) ? [] : [Math.floor(pos), Math.floor(pos) + 1]) {
          const off = (n - pos) * REEL_PITCH
          if (Math.abs(off) > REEL_SEEN) continue
          const legend = strip[mod(n, strip.length)]!
          out.push({ id: `${tag}${reelId(r, legend)}`, part: 'slot', kind: 'text', x: SLOT.reelX(r) + dx, y: b.y + off + dy, w: SLOT.reelW, h: b.h, z0: z(TOP + 14), z1: z(TOP + 14), tone: 'ink', words: `data:step2.${SLOT.names[r]}.${legend}`, type: reelType(r) })
        }
      }
      for (const coin of m.slot.coins) out.push({ id: `${tag}coin-${coin.n}`, part: 'slot', kind: 'disc', x: coin.x - COIN.r + dx, y: coin.y - COIN.r + dy, w: COIN.r * 2, h: COIN.r * 2, z0: coin.z, z1: coin.z + 4, tone: 'light', rot: coin.rot })
    }
  }

  function overMachine(over: Record<string, Partial<Shape> | null>, i: number, m: { dial: DialState; slot: SlotState; crank: CrankState }, lift: number, edge: number | null = null, a: Pose = STANDING): void {
    const L = risen(i, lift)
    for (const part of parts[i]!) over[part.id] = part.text ? { z0: mix(TRAY_Z, part.top, L), z1: mix(TRAY_Z, part.top, L) } : { z0: mix(TRAY_Z, part.floor, L), z1: mix(TRAY_Z, part.top, L) }
    if (i === 0) {
      const top = dialTop(L)
      const plate = TRAY_Z + dialPlate(top)
      Object.assign(over['dial-wheel']!, { z1: TRAY_Z + top, v: edge === null ? [dialShown(m.dial) + a.spin] : [dialShown(m.dial) + a.spin, edge] })
      for (let k = 1; k <= 10; k++) over[`dial-numeral-${DIAL.digit(k)}`] = { z0: plate, z1: plate }
    }
    if (i === 1) {
      const knob = boxOf(layout, 'slot-knob')
      const p = clamp(a.lever ?? m.slot.p, -LEVER.rise, 1 + LEVER.give)
      const kick = kickOf(m.slot) + a.jolt
      Object.assign(over['slot-knob']!, { y: knob.y + SLOT.pull * p + kick, ...(Math.abs(p) > 0.002 || Math.abs(kick) > 0.002 ? { moved: true } : {}) })
      if (Math.abs(kick) > 0.002) {
        Object.assign(over['slot-cabinet']!, { y: SLOT.y + kick, moved: true })
        for (let r = 0; r < 3; r++) Object.assign(over[`slot-reel-${r}`]!, { y: boxOf(layout, `slot-reel-${r}`).y + kick, moved: true })
        for (const part of parts[1]!) if (part.text && part.id !== 'slot-prompt' && over[part.id]) Object.assign(over[part.id]!, { y: boxOf(layout, part.id).y + kick })
      }
      for (let r = 0; r < 3; r++) {
        Object.assign(over[`slot-reel-${r}`]!, { v: [reelPos(m.slot, r)] })
        const dip = m.slot.down[r]! > 0 ? STOP.dip : m.slot.stopped[r]! >= 0 ? STOP.dip / 2 : 0
        if (dip > 0 && over[stopId(r)]) {
          Object.assign(over[stopId(r)]!, { z1: mix(TRAY_Z, STOP_Z - dip, L), tone: 'metal' as Tone })
          over[`${stopId(r)}-label`] = { z0: mix(TRAY_Z, STOP_Z - dip, L), z1: mix(TRAY_Z, STOP_Z - dip, L), tone: 'ink' as Tone }
        }
      }
    }
    if (i === 2) {
      const b = m.crank.b + a.swing
      const arm = gripPlace(b, CRANK.arm / 2)
      const grip = gripPlace(b)
      const away = Math.abs(wrapPi(b - CRANK.rest)) > 0.002 ? { moved: true } : {}
      Object.assign(over['crank-arm']!, { x: arm.x - (CRANK.arm + CRANK.armW) / 2, y: arm.y - CRANK.armW / 2, rot: b, ...away })
      Object.assign(over['crank-grip']!, { x: grip.x - CRANK.gripW / 2, y: grip.y - CRANK.gripH / 2, rot: b, ...away })
      const lit = Math.floor(m.crank.level * 10 + 1e-6)
      for (let k = 1; k <= 10; k++) Object.assign(over[`meter-${k}`]!, { tone: (k <= lit ? 'accent' : 'glass') as Tone, z1: mix(TRAY_Z, k <= lit ? 18 : 12, L) })
      if (a.sign <= 0.02) over['crank-sign'] = null
      else if (a.sign !== 1) {
        const tall = sign.h * a.sign
        const cap = sign.h - 2 * (signWords.y - sign.y)
        Object.assign(over['crank-sign']!, { y: sign.y + sign.h - tall, h: tall, r: Math.min(16, tall / 2) })
        if (a.sign < 0.5) over['crank-sign-words'] = null
        else Object.assign(over['crank-sign-words']!, { y: sign.y + sign.h - tall + (tall - cap * a.sign) / 2, type: { ...SIGN_TYPE, px: SIGN_TYPE.px * a.sign } })
      }
    }
  }

  // A shape of a stage, at the size and the place it is drawn on the page.
  function grown(shape: Shape, i: number, sink: number): Shape {
    const m = scales[i]!
    const k = m.k
    const made = shape.part === 'dial' || shape.part === 'slot' || shape.part === 'crank'
    const moved: Shape = { ...shape, x: m.x(shape.x + shape.w / 2) - (shape.w * k) / 2, y: m.y(shape.y + shape.h / 2) - (shape.h * k) / 2, w: shape.w * k, h: shape.h * k, z0: m.z(shape.z0) - sink, z1: m.z(shape.z1) - sink, ...(!made && shape.r !== undefined ? { r: shape.r * k } : {}) }
    const out: Shape = shape.kind !== 'text' || !shape.type ? moved : { ...moved, x: shape.type.align === 'centre' ? moved.x : m.x(shape.x), y: m.y(shape.y), type: { ...shape.type, px: shape.type.px * k } }
    builtOf.set(out, shape)
    return out
  }

  const inHole = (h: Pose['hole'], x: number, y: number): boolean => {
    if (!h) return false
    const qx = Math.abs(x - h.x - h.w / 2) - (h.w / 2 - h.r)
    const qy = Math.abs(y - h.y - h.h / 2) - (h.h / 2 - h.r)
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - h.r < -HOLE.clear
  }

  function drawPage(out: DrawList): void {
    const states = page.states()
    const over: Record<string, Partial<Shape> | null> = {}
    const a = pose()
    const shown = s.open >= 0 && a.shown ? s.open : -1
    const dx = [0, 0, 0]
    const leaving = s.open >= 0 && s.phase === 'opening' && s.rowT < ENTER.field
    if (leaving) {
      dx[s.open] = -SLIDE.far * smooth(s.rowT / ENTER.field) ** 2
      for (const part of up[s.open]!.ids) over[part.id] = { x: part.x + dx[s.open]! }
    }
    if (s.slide >= 0) {
      const u = smooth(s.slide / SLIDE.long)
      dx[s.field - 1] = -SLIDE.far * u
      dx[s.field] = SLIDE.far * (1 - u)
      for (const part of up[s.field]!.ids) over[part.id] = { x: part.x + dx[s.field]! }
      for (const id of plates[s.field - 1]!) over[id] = { x: plateX + dx[s.field - 1]! }
    }
    if (a.hole) over[`${ROWS[s.open]}-hole`] = { x: a.hole.x, y: a.hole.y, w: a.hole.w, h: a.hole.h, r: a.hole.r, z0: -a.hole.deep }
    if (shown >= 0) {
      overMachine(over, shown, s, 1, null, a)
    }
    if (allDone() && !held) {
      over['continue-cap'] = { tone: 'accent', ...(s.pressed ? { z1: heights.button - heights.keyTravel } : {}) }
      over['continue-label'] = { tone: 'inkLight', ...(s.pressed ? { z0: heights.button - heights.keyTravel, z1: heights.button - heights.keyTravel } : {}) }
    }
    const first = out.length
    drawLayout(out, layout, { states, over, runtime: { 'step2.phone': phoneMask(s.dial.digits), 'step2.birth': dateMask(s.birth.typed), 'step2.volume': volumeMask(s.crank.level) } })
    const staged: number[] = []
    if (shown >= 0) for (let j = first; j < out.length; j++) if (inStage.has(out[j]!.id)) staged.push(j)
    const here = s.open >= 0 ? (leaving ? [s.open] : []) : s.field < FIELDS && !s.done[s.field] ? [s.field] : []
    for (const i of here) {
      const y = rowY(i)
      if (i !== 1) chevron(out, `${ROWS[i]}-chevron`, FX + FW - 24 - 28 + dx[i]!, y + (FH - 28) / 2, 0)
      const lit = leaving || (i === 1 && s.birth.focus && !s.done[1])
      if (lit) out.push({ id: 'field-focus', part: 'rows', kind: 'box', x: FX + 14 + dx[i]!, y: y + FH - 5, w: FW - 28, h: 3, z0: 0.1, z1: 0.5, tone: 'accent', v: [0.3] })
    }
    const blink = Math.floor(s.time * 2) % 2 === 0
    const caret = blink && s.slide < 0 && s.open < 0 && s.field === 1 && s.birth.focus && !s.done[1]
    if (caret) {
      const wide = (s.birth.typed.length > 0 ? measure(TYPE.value.font, dateMask(s.birth.typed), TYPE.value.px).width : 0) + 4
      out.push({ id: 'field-caret', part: 'rows', kind: 'box', x: FX + PAD + wide, y: rowY(s.field) + 16, w: 3, h: FH - 32, z0: 0.1, z1: 0.5, tone: 'ink' })
    }
    if (shown >= 0) {
      const from = out.length
      machine(out, shown, s, 1, 0, 0, '', a)
      for (let j = from; j < out.length; j++) staged.push(j)
      const gone = new Set<number>()
      for (const j of staged) {
        const id = out[j]!.id
        if (id.startsWith('coin-')) {
          const g = grown(out[j]!, shown, 0)
          const c = a.coin?.(Number(id.slice(5)), g.x + g.w / 2, g.y + g.h / 2)
          if (c) {
            const swept: Shape = { ...g, x: c.x - g.w / 2, y: c.y - g.h / 2, z0: g.z0 - c.down, z1: g.z1 - c.down }
            builtOf.set(swept, builtOf.get(g)!)
            out[j] = swept
          } else out[j] = g
          continue
        }
        const down = a.sink + a.drop(id)
        const g = grown(out[j]!, shown, down)
        if (down > 0 && g.tone === 'accent' && id.startsWith('meter-') && g.z1 < BAR_DARK) g.tone = 'glass'
        if (g.kind === 'text' && down > UNDER && (g.z1 < -HOLE.pit || !inHole(a.hole, g.x + g.w / 2, g.y + g.h / 2))) gone.add(j)
        else out[j] = g
      }
      if (gone.size > 0) {
        const kept = out.filter((_, j) => !gone.has(j))
        out.length = 0
        out.push(...kept)
      }
    }
  }

  function machinesSheet(): SheetFrame {
    const list: DrawList = []
    for (const part of stepHead(2)) drawLayout(list, part, { states: [], over: {} })
    const demo = { dial: freshDial(), slot: { ...freshSlot(), p: 1 }, crank: { ...freshCrank(), level: SHEET.meter.level, b: SHEET.crank.turn } }
    demo.slot.from = SLOT.film.map((legend, r) => SLOT.strips[r]!.indexOf(legend))
    const spots = [SHEET.dial, SHEET.slot, SHEET.crank]
    const origin = [{ x: DIAL.cx, y: DIAL.cy }, { x: SLOT.x, y: SLOT.y }, { x: CRANK.hx, y: CRANK.hy }]
    const put = (shape: Shape, from: { x: number; y: number }, to: { x: number; y: number; times: number }): Shape => {
      const k = to.times
      const moved = { ...shape, x: to.x + (shape.x + shape.w / 2 - from.x) * k - (shape.w * k) / 2, y: to.y + (shape.y + shape.h / 2 - from.y) * k - (shape.h * k) / 2, w: shape.w * k, h: shape.h * k, z0: (shape.z0 - TRAY_Z) * k, z1: (shape.z1 - TRAY_Z) * k }
      if (shape.kind !== 'text' || !shape.type) return moved
      const centred = shape.type.align === 'centre'
      return { ...moved, x: centred ? moved.x : to.x + (shape.x - from.x) * k, y: to.y + (shape.y - from.y) * k, type: { ...shape.type, px: shape.type.px * k } }
    }
    for (let i = 0; i < 3; i++) {
      const over: Record<string, Partial<Shape> | null> = {}
      overMachine(over, i, demo, 1)
      const local: DrawList = []
      const settledNow = SLOT.film.map((legend, r) => reelId(r, legend))
      for (const child of find(layout, `${ROWS[i]}-stage`).children ?? []) if (!child.id.startsWith('slot-stop') && child.id !== 'crank-sign') drawLayout(local, child, { states: i === 1 ? settledNow : [], over })
      machine(local, i, demo, 1, 0, 0, '')
      for (const shape of local) {
        const meter = shape.id.startsWith('meter-')
        list.push(put({ ...shape, id: `sheet-${shape.id}` }, meter ? { x: CRANK.segX, y: CRANK.segY } : origin[i]!, meter ? SHEET.meter : spots[i]!))
      }
      const label = find(layout, `${ROWS[i]}-label`)
      list.push({ id: `sheet-${label.id}`, part: 'type', kind: 'text', x: SHEET.labelX[i]!, y: SHEET.labelY, w: label.box[2]!, h: label.box[3]!, z0: 0, z1: 0, tone: 'ink', words: label.copy!, type: TYPE.label })
    }
    return { list, cursors: [restPose(SHEET.cursor.x, SHEET.cursor.y)], view: frame({ x: 0, y: 0, w: 1920, h: SCREEN_H }, 1) }
  }

  return page
}
