import type { Acting, Reaction } from '../../../cursor/body'
import { frame, homePose, mixPose, smooth } from '../../../stage/camera'
import type { CameraPose } from '../../../stage/types'
import { HALF_X, PAPER, PAPER_REST, SLOT } from './layout'

// Seconds of the stage: the sheet's slide in, the bite, the tug in the film, and how long the arrow stays lost, live and in the film.
export const RESUME_TIMES = { paperSlide: 0.42, bite: 0.4, tugFilm: 4.52, lost: 0.3, lostFilm: 0.84 }
export const TUG = { stiff: 2600, damp: 36, strainPx: 9.6, lead: 0.4, shoulder: { x: 14, y: 30 }, hands: 31, rateLag: 0.07, inside: 4, least: 28, reach: { rest: 43, min: 37, max: 52, bite: 26, haul: 70 } }
export const BITE = { x: SLOT.cx - PAPER.w / 2, y: SLOT.cy - PAPER.h + 11, jerk: 9, settle: 0.5, snap: 0.72 }
export const HOOD = { y: SLOT.cy + 17, z: 26 }
export const FRINGE = { from: 0.12, step: 0.03, rate: 1.2, most: 0.34 }
export const PILE = { x: SLOT.cx - 20, y: SLOT.cy + 60 }
export const SHRED = { in: 0.3, gone: 0.46, strips: 0.12, pile: 0.64, pileSeconds: 1.14, empty: 1.56, emptySeconds: 0.75, hold: 0.3, zip: 1.78, zipSeconds: 1.0, end: 2.8 }
export const TRUDGE = { x: 96, y: 84, first: [0.42, 0.62] as [number, number], share: 0.42, second: [0.8, 1.02] as [number, number] }
export const END = { sag: 0.03 }
// The resume: a wind-up where it stands, a strut to the place under the drop zone where the sheet comes in, an eager start as it arrives, a crouch on its corner, a heave that tips the body back and a dip under its weight,
// the sheet held up high and still with the chest out, a strut to the slot with it, and a short stop over the slot before it lets go.
export const RESUME = {
  leave: 19.9, walk: [20.04, 20.42] as [number, number], eager: 20.5, beside: { x: 22, y: 10 }, step: [20.8, 20.88] as [number, number], crouch: 20.78, grab: 20.96,
  hold: { x: 5, y: 46 }, raise: 34, high: 16,
  hoist: [20.99, 21.07] as [number, number], up: { x: -10, y: -50 }, dip: [21.08, 21.14] as [number, number], weight: 9, proud: 21.0, dust: 21.1,
  carry: [21.36, 21.54] as [number, number], drop: 21.62
}
// The temper of the tug: a stamp as the sheet is caught, a wind-up before each haul, a second stamp, and nothing in the half second before the key picture. Then the big bite: a start, and it stands scared and still, pulled thin, until the sheet goes.
export const TEMPER = { stamps: [22.24, 24.12], stamp: 330, hauls: [22.3, 23.0, 23.76, 24.56], scared: 25.3, back: [25.62, 26.06], lost: [0, 0.46] as [number, number] }

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

// How far the held sheet is raised over the place it is gripped: up as it is heaved, held, and down again on the way to the slot.
export function raised(time: number): number {
  return smooth((time - RESUME.hoist[0]) / 0.1) * (1 - smooth((time - RESUME.carry[0] - 0.03) / (RESUME.carry[1] - RESUME.carry[0] - 0.03)))
}

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
  // step1.resume: a wind-up, a strut to where its paper comes in, an eager start, a crouch on the corner, a heave, the sheet held up proud and still, a strut to the slot, a stop over it
  const grab = { x: PAPER_REST.x + PAPER.w - RESUME.hold.x, y: PAPER_REST.y + RESUME.hold.y }
  w.cue(RESUME.leave, { react: 'anticipate' })
  w.cue(RESUME.leave + 0.02, { act: 'confident' })
  w.to(RESUME.walk[0], RESUME.walk[1], PAPER_REST.x + PAPER.w + RESUME.beside.x, PAPER_REST.y + RESUME.beside.y, { arc: -34 })
  w.cue(RESUME.eager, { react: 'tap' })
  w.cue(RESUME.crouch, { react: 'anticipate' })
  w.to(RESUME.step[0], RESUME.step[1], grab.x, grab.y, { ease: 'out' })
  w.hold(RESUME.grab, RESUME.drop)
  w.cue(RESUME.hoist[0], { hop: 150 })
  w.to(RESUME.hoist[0], RESUME.hoist[1], grab.x + RESUME.up.x, grab.y + RESUME.up.y, { ease: 'out' })
  w.cue(RESUME.proud, { act: 'proud' })
  w.to(RESUME.dip[0], RESUME.dip[1], grab.x + RESUME.up.x, grab.y + RESUME.up.y + RESUME.weight, { ease: 'out' })
  w.cue(RESUME.dust, { react: 'dustOff' })
  w.to(RESUME.carry[0], RESUME.carry[1], BITE.x + (grab.x - PAPER_REST.x), BITE.y - BITE.jerk - 14 + (grab.y - PAPER_REST.y), { arc: 26 })

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
  w.to(whole + TRUDGE.first[0], whole + TRUDGE.first[1], PILE.x + TRUDGE.x * TRUDGE.share, PILE.y + TRUDGE.y * TRUDGE.share, { ease: 'out' })
  w.to(whole + TRUDGE.second[0], whole + TRUDGE.second[1], PILE.x + TRUDGE.x, PILE.y + TRUDGE.y, { ease: 'out' })
  return { drop: RESUME.drop, bite, lost }
}

// The film camera in the tug: one straight move in, one still frame, one straight move out. The eye goes down one line from home to the frame with one ease on all of it and looks straight down the whole way, so one point of the page keeps its place on the screen. The frame holds the drop zone's lower rim, the slot, the machine, the whole cursor with its arms and where the pile lands, and stands still from before the first bite until the pile is down.
const TUG_EDGE = HALF_X - 16
const TUG_FRAME = { w: 620, mid: SLOT.cx + 4, top: SLOT.cy - 205 }
const tugFrame = (): { x: number; y: number; w: number; h: number } => ({ x: Math.min(TUG_EDGE - TUG_FRAME.w, TUG_FRAME.mid - TUG_FRAME.w / 2), y: TUG_FRAME.top, w: TUG_FRAME.w, h: (TUG_FRAME.w * 9) / 16 })
export const CAMERA = { in: [20.3, 21.1] as [number, number], key: 25.125, out: [28.3, 28.9] as [number, number] }
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
