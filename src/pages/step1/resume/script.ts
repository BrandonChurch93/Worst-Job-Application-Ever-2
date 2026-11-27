import type { Acting, Reaction } from '../../../cursor/body'
import { frame, homePose, mixPose, smooth } from '../../../stage/camera'
import type { CameraPose } from '../../../stage/types'
import { config } from '../../../config'
import { buttonWidth, RIGHT } from '../../../shell/parts'
import { CONTINUE_Y } from '../layout'
import { browseBox, HALF_X, landing, PAPER, PAPER_REST, SLOT, TILE, ZONE } from './layout'

// How much later than before change note 002 the film's bite and all that follows it come, in seconds: the room the new beats before the bite take. The tug, the loss and the strips keep their shape and their length.
export const LATE = 1.5
// How long the film holds on "Resume received" before the page turns, in seconds: the room the narrator's line on that message takes. The unit ends half a second after the turn starts.
export const HOLD = 5.5
const TURN = config.film.units.find((u) => u.id === 'step1')!.seconds - 0.5

// Seconds of the stage: the sheet's slide in, the bite, the tug in the film, and how long the arrow stays lost, live and in the film.
export const RESUME_TIMES = { paperSlide: 0.42, bite: 0.4, tugFilm: 4.52, lost: 0.3, lostFilm: 0.84 }
// The beats before the bite, in seconds, in the film and on the live site, where the visitor sets the pace and each beat takes the room it needs: how long Browse stays down, the folder's way up and down, the file lit before the sheet leaves, the sheet's flight to the drop zone, how long it lies there, and the wind. The machine and its plate are up `machine` into the wind. `wait` is how long an idle visitor's folder stands open before the page picks the file itself.
export const FLOW = {
  film: { press: 0.1, pop: 0.25, shut: 0.25, lit: 0.12, fly: 0.45, lie: 0.25, wind: 0.8 },
  live: { press: 0.12, pop: 0.3, shut: 0.3, lit: 0.22, fly: 0.55, lie: 0.5, wind: 0.95 },
  machine: 0.25, wait: 0.5
}
// The wind: the sheet leaves the drop zone on a rising bend (`bend` px to the side of the straight line, `high` px over the card at the most), swinging `swing` radians `turns` times and coming to rest upright over the slot; `off` is the share of the wind that has blown before it lifts. The streaks: how many, how long each lives, how far apart they start, their speed in px a second and their heading in radians down from level.
export const WIND = { off: 0.16, bend: 70, high: 64, swing: 0.75, turns: 1.6, streaks: 10, life: 0.36, every: 0.065, speed: 1800, heading: 0.52, long: [264, 168, 312], wide: 6, z: 30, spread: 250 }

export const TUG = { stiff: 2600, damp: 36, strainPx: 9.6, lead: 0.4, shoulder: { x: 14, y: 30 }, hands: 31, rateLag: 0.07, inside: 4, least: 28, reach: { rest: 43, min: 37, max: 52, bite: 26, haul: 70 } }
export const BITE = { x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h + 11, jerk: 9, settle: 0.5, snap: 0.72 }
export const HOOD = { y: SLOT.cy + 17, z: 26 }
export const FRINGE = { from: 0.12, step: 0.03, rate: 1.2, most: 0.34 }
export const PILE = { x: SLOT.cx - 20, y: SLOT.cy + 60 }
export const SHRED = { in: 0.3, gone: 0.46, strips: 0.12, pile: 0.64, pileSeconds: 1.14, empty: 1.56, emptySeconds: 0.75, hold: 0.3, zip: 1.78, zipSeconds: 1.0, end: 2.8 }
export const TRUDGE = { x: 96, y: 84, first: [0.42, 0.62] as [number, number], share: 0.42, second: [0.8, 1.02] as [number, number] }
export const END = { sag: 0.03 }
// The film's hold on the message, every time in seconds before the page turns: the arrow looks up at the message from where it dragged itself, goes up under it and sags, then trudges to Continue and presses it. `under` is where it stands under the message, as shares of the drop zone.
export const AFTER = { look: 3.35, up: [3.05, 2.45] as [number, number], under: { x: 0.52, y: 0.83 }, sag: 2.28, go: [1.7, 0.52] as [number, number], on: { x: -6, y: 2 }, press: 0.3 }
// The film before the bite, every time a second of the unit: a wind-up where it stands, a strut to Browse files, a look at the ordinary field, the press; a start at the folder, a walk to the file, the pick; proud, it struts back to stand by its sheet in the drop zone and dusts itself off; the wind makes it start and it runs after the sheet. `drop` is the second the wind lets the sheet go over the slot.
export const RESUME = {
  leave: 19.9, walk: [20.1, 20.6] as [number, number], on: { x: 12, y: 6 }, press: 20.85,
  see: 20.97, toFile: [21.06, 21.36] as [number, number], file: { x: -8, y: -4 }, pick: 21.5,
  proud: 21.66, back: [21.76, 22.16] as [number, number], beside: { x: 58, y: 66 }, dust: 22.2,
  gust: 22.36, chase: [22.58, 23.02] as [number, number], near: { x: -96, y: -176 },
  raise: 0, high: 0, drop: 21.62 + LATE
}
// The temper of the tug: a stamp as the sheet is caught, a wind-up before each haul, a second stamp, and nothing in the half second before the key picture. Then the big bite: a start, and it stands scared and still, pulled thin, until the sheet goes.
export const TEMPER = { stamps: [22.24 + LATE, 24.12 + LATE], stamp: 330, hauls: [22.3 + LATE, 23.0 + LATE, 23.76 + LATE, 24.56 + LATE], scared: 25.3 + LATE, back: [25.62 + LATE, 26.06 + LATE], lost: [0, 0.46] as [number, number] }

const TUG_CURVE: [number, number, number, number][] = [
  [0, 0.125, 0.2, 4], [0.3, 0.15, 0.14, 0], [0.8, 0.11, 0.28, 25], [1.05, 0.26, -0.12, 5], [1.55, 0.22, 0.42, 22], [1.8, 0.37, 0.06, 0], [2.3, 0.33, 0.52, 24],
  [2.6, 0.48, 0.16, 1], [2.95, 0.455, 0.47, 17], [3.2, 0.44, 0.47, 18], [3.48, 0.6, 0.1, 5], [3.62, 0.61, 0.1, 22], [3.9, 0.655, 0.12, 20], [4.2, 0.63, 0.13, 25], [4.52, 0.95, 0, 3]
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

function tugPoint(tau: number): { x: number; y: number } {
  const amount = tugCurve(tau)
  const reach = tugReach((tugCurve(tau + 0.03) - tugCurve(tau - 0.03)) / 0.06)
  const lean = tugAt(tau, 2)
  const strain = (tugAt(tau, 3) + 4 * Math.sin(tau * 23)) * TUG.lead
  const far = Math.max(TUG.least, PAPER.h * (1 - amount) - TUG.inside) + strain * (1 + TUG.stiff / 480) + reach
  return { x: SLOT.cx - Math.sin(lean) * far - TUG.shoulder.x, y: SLOT.cy - Math.cos(lean) * far - TUG.shoulder.y }
}

// The sheet is no longer carried in the film, so nothing raises it. Kept for the page's script, which hands it on.
export const raised = (_time: number): number => 0

type Ease = 'smooth' | 'line' | 'in' | 'out' | 'snap' | 'stomp'
export interface MoveOptions { arc?: number; side?: number; ease?: Ease; hop?: boolean }
// What the page's script hands a stage to write its part of the film with: a move of the pointer from where it is, a cue for the body, a press held from one second to another, and the first second that is still free.
export interface Writer {
  to(t0: number, t1: number, x: number, y: number, o?: MoveOptions): void
  cue(at: number, c: { act?: Acting; react?: Reaction; hop?: number }): void
  hold(from: number, to: number): void
  free(): number
}

// The film of the stage, every time a second of the unit. It answers the seconds of the drop, the bite and the loss.
export function planResume(w: Writer): { drop: number; bite: number; lost: number } {
  // step1.resume: a wind-up, a strut to Browse files, the press, a start at the folder, the pick of the file, a proud strut back to the sheet, a start at the wind, a run after the sheet
  const land = landing()
  const chip = browseBox()
  const browse = { x: chip.x + chip.w / 2 + RESUME.on.x, y: chip.y + chip.h / 2 + RESUME.on.y }
  const file = { x: PAPER_REST.x + PAPER.w / 2 + RESUME.file.x, y: PAPER_REST.y + PAPER.h / 2 + RESUME.file.y }
  w.cue(RESUME.leave, { react: 'anticipate' })
  w.cue(RESUME.leave + 0.02, { act: 'confident' })
  w.to(RESUME.walk[0], RESUME.walk[1], browse.x, browse.y, { arc: -34 })
  w.cue(RESUME.press - 0.03, { react: 'tap' })
  w.hold(RESUME.press, RESUME.press + 0.09)
  w.cue(RESUME.see, { react: 'doubleTake' })
  w.to(RESUME.toFile[0], RESUME.toFile[1], file.x, file.y, { arc: 30 })
  w.cue(RESUME.pick - 0.03, { react: 'tap' })
  w.hold(RESUME.pick, RESUME.pick + 0.09)
  w.cue(RESUME.proud, { act: 'proud' })
  w.to(RESUME.back[0], RESUME.back[1], land.x + PAPER.w + RESUME.beside.x, land.y + RESUME.beside.y, { arc: 44 })
  w.cue(RESUME.dust, { react: 'dustOff' })
  w.cue(RESUME.gust, { react: 'startle' })
  w.cue(RESUME.gust + 0.04, { act: 'nervous' })
  w.to(RESUME.chase[0], RESUME.chase[1], SLOT.cx + RESUME.near.x, SLOT.cy + RESUME.near.y, { arc: 16, ease: 'in' })

  // step1.tug: the paper's curve places the pointer, so the body leans, loses ground and wins a little of it back
  const bite = RESUME.drop + RESUME_TIMES.bite
  const lost = bite + RESUME_TIMES.tugFilm
  const over = tugPoint(0)
  w.to(RESUME.drop + 0.03, bite - 0.05, over.x, over.y, { arc: 10, ease: 'out' })
  for (let at = bite + 0.15; at < lost; at += 0.05) {
    const p = tugPoint(at - bite)
    w.to(Math.max(w.free(), at - 0.05), at, p.x, p.y, { ease: 'line' })
  }
  for (const at of TEMPER.stamps) {
    w.cue(at, { hop: TEMPER.stamp })
    w.cue(at + 0.02, { react: 'tap' })
  }
  for (const at of TEMPER.hauls) w.cue(at, { react: 'anticipate' })
  w.cue(TEMPER.scared, { react: 'startle' })
  for (const at of TEMPER.back) w.cue(at, { react: 'rear' })
  w.cue(TEMPER.scared + 0.02, { act: 'scared' })
  w.cue(lost + TEMPER.lost[0], { react: 'recoil' })
  w.cue(lost + TEMPER.lost[1], { react: 'cower' })

  // step1.shredded: where it comes back together. It sags at what the form says and stays an arrow, then drags itself off the slot in two pulls with a stop between, bent and low
  const whole = lost + RESUME_TIMES.lostFilm + SHRED.end
  w.to(lost + 0.1, lost + 0.2, PILE.x, PILE.y, { ease: 'out' })
  w.cue(whole + END.sag, { act: 'exhausted' })
  const pull = (t0: number, t1: number, x: number, y: number, o: MoveOptions): boolean => {
    if (t0 < w.free() || t1 >= TURN) return false
    w.to(t0, t1, x, y, o)
    return true
  }
  pull(whole + TRUDGE.first[0], whole + TRUDGE.first[1], PILE.x + TRUDGE.x * TRUDGE.share, PILE.y + TRUDGE.y * TRUDGE.share, { ease: 'out' })
  pull(whole + TRUDGE.second[0], whole + TRUDGE.second[1], PILE.x + TRUDGE.x, PILE.y + TRUDGE.y, { ease: 'out' })
  // The hold on the message: every move that has its room before the page turns is made, so a shorter unit only loses the last of them.
  const turn = lost + RESUME_TIMES.lostFilm + SHRED.empty + SHRED.emptySeconds + SHRED.hold + HOLD
  if (turn - AFTER.look > w.free() && turn - AFTER.look < TURN) w.cue(turn - AFTER.look, { react: 'doubleTake' })
  if (pull(turn - AFTER.up[0], turn - AFTER.up[1], ZONE.x + ZONE.w * AFTER.under.x, ZONE.y + ZONE.h * AFTER.under.y, { ease: 'out', arc: 8 })) w.cue(turn - AFTER.sag, { react: 'cower' })
  const wide = buttonWidth('copy:step1.continue')
  if (pull(turn - AFTER.go[0], turn - AFTER.go[1], RIGHT - 5 - wide / 2 + AFTER.on.x, CONTINUE_Y + 5 + config.scale.sizes.button / 2 + AFTER.on.y, { ease: 'smooth', arc: -18 }) && turn - AFTER.press + 0.09 < TURN) {
    w.cue(turn - AFTER.press - 0.03, { react: 'tap' })
    w.hold(turn - AFTER.press, turn - AFTER.press + 0.09)
  }
  return { drop: RESUME.drop, bite, lost }
}

// The film camera in the tug: one straight move in, one still frame, one straight move out. Until the wind it is at home, where the drop zone and the folder are both whole in the picture. The eye goes down one line from home to the frame with one ease on all of it and looks straight down the whole way, so one point of the page keeps its place on the screen. The frame holds the drop zone's lower rim, the slot, the machine, the whole cursor with its arms and where the pile lands, and stands still from before the first bite until the pile is down.
const TUG_EDGE = HALF_X - 16
const TUG_FRAME = { w: 620, mid: SLOT.cx + 4, top: SLOT.cy - 205 }
const tugFrame = (): { x: number; y: number; w: number; h: number } => ({ x: Math.min(TUG_EDGE - TUG_FRAME.w, TUG_FRAME.mid - TUG_FRAME.w / 2), y: TUG_FRAME.top, w: TUG_FRAME.w, h: (TUG_FRAME.w * 9) / 16 })
// It starts in as the wind starts and stands before the bite; `key` is the second of the kit's still and is not moved.
export const CAMERA = { in: [22.38, 23.3] as [number, number], key: 25.125, out: [28.3 + LATE, 28.9 + LATE] as [number, number] }
const glide = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * u * (u * (u * 6 - 15) + 10)
}

export function filmCamera(time: number): CameraPose {
  const home = homePose(0)
  if (time <= CAMERA.in[0] || time >= CAMERA.out[1]) return home
  const u = glide((time - CAMERA.in[0]) / (CAMERA.in[1] - CAMERA.in[0])) * (1 - glide((time - CAMERA.out[0]) / (CAMERA.out[1] - CAMERA.out[0])))
  return mixPose(home, frame(tugFrame()), u)
}
