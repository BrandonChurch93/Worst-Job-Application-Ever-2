import { config, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { HANDOFF, restPose, type Acting, type CursorPose } from '../../cursor/body'
import { sealedFit } from '../../cursor/fit'
import { boxOf, drawLayout, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, HEADER, LEFT, page, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { basis, frame, homePose, mixPose, smooth, toWorld } from '../../stage/camera'
import { TURN_HALF } from '../../stage/stage'
import { ZONES } from '../../table/draw'
import type { CameraPose, Collider, DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo, TableState } from '../../stage/types'
import take from '../../../cut/TABLE-TAKE.json'
import { BOARD, boardAt, DOORS, fixedShapes, movingShapes } from '../../table/draw'
import { APRON_Y, BALL, FLIP, FLIP_REACH, LAST_Y, MARQUEE_Y, MID, MOUTH, OUTLET, PAGE_H, PORT, TH, TIERS, TIER_Y, floorZ, holdOf, railAt, railLength, railOf, solids, table, tierAt } from '../../table/layout'
import { drainWay, KNOCK, LET } from '../../table/real/frame/loader'
import { ANSWER } from '../../table/real/lights/levels'
import { stepOver } from '../../table/real/lights/over'
import { berth } from './director-arrow'
import { FRENZY, noted, STRIKE, strikeJolt, strikeOf, strikeShapes } from './strikes'
import { Machine, prepare as startPhysics, type MachineState, type TableEvent } from '../../table/physics'

export const prepare = (): Promise<void> => startPhysics()

const beats = config.film.beats.filter((b) => b.unit === 'pinball')
const seconds = config.film.units.find((u) => u.id === 'pinball')!.seconds
const live = config.live.pinball
const dt = 1 / stepHz
const beatAt = (id: string): { from: number; to: number } => beats.find((b) => b.id === `pinball.${id}`)!
const px = (v: number): number => v * BALL

export const T = {
  arrive: 0.8, seal: 2.4, tube: 3.3, lightsDown: 4.1, wake: 5.6, powerOn: 7.2, atPlunger: 8.6, plunger: 10.45, onTable: 11.9, doorKick: 12.9, doorOpen: 14.1, lobbyEnd: 14.9, officeKey: 17.4, inboxOn: 19.8, inboxBy: 20.3,
  drops: [20.78, 20.88, 20.98], eject: 20.72, officeOpen: 24.3, officeBy: 24.9, firedBy: 27.2, scoopKick: 29.35, flapOn: 29.4, flapBy: 31.2, highwayEnd: 33.0, spiralEnd: 34.45, save: 35.6, streetOpen: 36.9, streetBy: 37.9,
  press: seconds - TURN_HALF - 0.5
}
const MODES: { at: number; tier: number; mode: number }[] = [
  { at: 11.95, tier: 0, mode: 5 }, { at: 12.55, tier: 0, mode: 6 }, { at: 13.3, tier: 0, mode: 7 }, { at: 15, tier: 1, mode: 0 }, { at: 19, tier: 1, mode: 4 }, { at: 23, tier: 1, mode: 8 },
  { at: 26, tier: 2, mode: 3 }, { at: 29.5, tier: 2, mode: 1 }, { at: 34, tier: 2, mode: 2 }
]

const centred = (id: string, key: string, type: { font: string; px: number; wrap?: number; lead?: number }, cx: number, cy: number, extra: Parameters<typeof text>[5] = {}): LayoutNode => {
  const b = block(type.font, words(key, ''), type.px, type.wrap, type.lead)
  return text(id, key, { ...type, align: 'centre' }, cx, cy - b.height / 2, extra)
}

function buildLayout(): LayoutNode {
  const kids: LayoutNode[] = [...stepHead(3)]
  kids.push(text('intro', 'copy:transitions.step3', { ...TYPE.body, wrap: 600, lead: 34 }, LEFT, HEADER.contentY, { part: 'type' }))
  kids.push(node('loader-port', 'port', [px(PORT.x - PORT.ring / 2), px(PORT.y - PORT.ring / 2), px(PORT.ring), px(PORT.ring)], { part: 'loader', shape: 'none' }))
  const my = px(MARQUEE_Y)
  kids.push(node('marquee', 'marquee', [312, my + 24, 1296, 336], {
    part: 'marquee', shape: 'none', children: [
      text('marquee-title', 'copy:step3.table.title', { font: 'inter-400', px: 76, align: 'centre' }, 960, my + 62, { part: 'marquee', on: 41, tone: 'inkLight', states: ['on'] }),
      text('marquee-score', 'runtime:score', { font: 'inter-600', px: 44, align: 'centre', wrap: 420 }, 960, my + 250, { part: 'displays', on: 41, tone: 'inkLight', states: ['on'] })
    ]
  }))
  for (let k = 0; k < 3; k++) {
    const name = TIERS[k]!
    const f = px(floorZ(k))
    const light = k !== 1
    for (const m of table.models) {
      if (m.tier !== k || !m.sign) continue
      kids.push(centred(`sign.${m.id}`, m.sign, { font: 'inter-600', px: m.signPx ?? 22, wrap: px(m.signAt ? m.signAt[1] : m.box[2]) - 6 }, px(m.box[0] + (m.signAt ? m.signAt[0] : m.box[2] / 2)), px(m.box[1] + m.box[3] / 2), { part: m.part, on: f + px((m.base ?? 0) + m.h) + 1, tone: 'ink' }))
    }
    const d = table.displays[k]!
    for (const n of table.inserts) {
      if (n.tier !== k) continue
      kids.push(text(`display.${name}.${n.mode}`, `copy:step3.table.modes.${n.mode}.display`, { font: 'inter-500', px: 16, wrap: px(d.box[2]) - 20, lead: 21 }, px(d.box[0]) + 10, px(d.box[1]) + 6, { part: 'displays', on: f + 31, tone: 'inkLight', states: [`mode${n.mode}`] }))
      kids.push(centred(`display.${name}.${n.mode}.insert`, `copy:step3.table.modes.${n.mode}.insert`, { font: 'inter-600', px: 20, wrap: px(d.box[2]) - 20, lead: 24 }, px(d.box[0] + d.box[2] / 2), px(d.box[1] + d.box[3] / 2), { part: 'displays', on: f + 31, tone: 'inkLight', states: [`name${n.mode}`] }))
    }
    kids.push(text(`display.${name}.score`, 'runtime:score', { font: 'inter-600', px: 30, align: 'centre', wrap: px(d.box[2]) - 20 }, px(d.box[0] + d.box[2] / 2), px(d.box[1]) + 18, { part: 'displays', on: f + 31, tone: 'inkLight', states: [`score${k}`] }))
  }
  const ay = px(APRON_Y)
  const sunk = { part: 'table-frame', tone: 'danger' as const, height: config.scale.heights.slab }
  kids.push(node('apron-left', 'apronSlab', [312, ay + 24, 520, 144], {
    ...sunk, children: [node('apron-card', 'apronCard', [352, ay + 56, 440, 80], {
      part: 'table-frame', floor: 16, height: 17, tone: 'paper', children: [centred('apron-card-words', 'copy:step3.table.apronCard', { font: 'inter-500', px: 18 }, 572, ay + 96, { part: 'type', on: 18 })]
    })]
  }))
  kids.push(node('apron-right', 'apronSlab', [1088, ay + 24, 520, 144], sunk))
  kids.push(centred('drain-label', 'copy:step3.table.buildings.drain', { font: 'inter-600', px: 18 }, 960, ay + 48, { part: 'table-frame', on: 7, tone: 'ink' }))
  const ly = px(LAST_Y)
  kids.push(node('outlet-port', 'port', [px(OUTLET.x - OUTLET.ring / 2), px(OUTLET.y - OUTLET.ring / 2), px(OUTLET.ring), px(OUTLET.ring)], { part: 'loader', shape: 'none' }))
  kids.push(node('result', 'card', [560, ly + 255, 816, 236], {
    part: 'shell', r: CARD_R, states: ['result'], children: [
      text('result-title', 'copy:step3.result.title', TYPE.heading, 608, ly + 295, { part: 'type', on: 12 }),
      text('result-body', 'copy:step3.result.body', { ...TYPE.body, wrap: 720, lead: 34 }, 608, ly + 385, { part: 'type', on: 12 })
    ]
  }))
  kids.push(button('go', 560, ly + 255 + 236 + 32, buttonWidth('copy:step2.continue'), 'copy:step2.continue', { part: 'shell', states: ['result'] }))
  return page('step3', PAGE_H, kids)
}

interface State {
  mode: 'live' | 'film'; time: number; t: number; phase: 'wait' | 'pull' | 'sealed' | 'open' | 'result'; pull: number; said: string[]; drops: number; tows: number
  scroll: number; floor: number; opened: number; result: number; pressed: boolean; hold: number; took: number; home: number; pan: number[]; arc: number; blow: number[]; snap: number; sway: number; lay: number[]; seen: number; out: number[]; done: boolean; skipped: boolean; saved: boolean; score: number; shut: boolean; dim: number; struck: number; face: number[]; hit: number[]; was: number[]; scoreAt: number; scoreWas: number; flipped: boolean; sink: number[]; latch: number; sv: number; roll: number[]; fall?: number[]; room?: number[]; fx?: number[]
}

type Rolled = State & { over?: Record<string, number> }
const fresh = (): State => ({ mode: 'live', time: 0, t: 0, phase: 'wait', pull: 0, said: [], drops: 0, tows: 0, scroll: 0, floor: 0, opened: 0, result: 0, pressed: false, hold: 0, took: -1, home: -1, pan: [0, 0, 0, 1], arc: -9, blow: [0, 0, -9], snap: -9, sway: -9, lay: [0, -9], seen: -9, out: [-9, 0, 0], done: false, skipped: false, saved: false, score: 0, shut: false, dim: 0, struck: -9, face: [0, 0, 1, 0], hit: [0, 0], was: [0, 0, 1, 0], scoreAt: -9, scoreWas: 0, flipped: false, sink: [-1, 0, 0, 0, 0, 0], latch: -9, sv: 0, roll: [0, 0] })

const flips = (take as unknown as { flips: [string, number, number][] }).flips
const held = (side: string, time: number): boolean => flips.some((f) => f[0] === side && time >= f[1] && time < f[2])

const STREET = 0.95
// The corner of the result card: the radius of the site's other result cards, step 5's two panels.
const CARD_R = 24
// The rise of the result card and its button out of the page: its seconds, the height they start from, the share of the rise that is the settle at the top, how far past their height they go before it, in px, and how far over the card's face its words ride while it moves, so that they are not drawn under it as it comes back down.
const RISE = { seconds: 0.55, low: 0, settle: 0.3, over: 1.5, proud: 0.6, grain: 0.25 }
// How far along the rail `drain` the riser of the last screen stands, in balls: from there to the outlet port the ball is drawn in the tube that lies on the page.
const RISER_S = ((): number => {
  const p = railOf('drain').points
  return Math.hypot(p[1]![0] - p[0]![0], p[1]![1] - p[0]![1]) + Math.hypot(p[2]![0] - p[1]![0], p[2]![1] - p[1]![1])
})()
const tierPose = (k: number): CameraPose => homePose(px(TIER_Y[k]!), px(floorZ(k)))
const streetPose = (): CameraPose => {
  const f = px(floorZ(2))
  const p = homePose(px(TIER_Y[2]! + STREET), f)
  return { ...p, eye: [p.eye[0], p.eye[1], f + (p.eye[2] - f) * 1.05] }
}
const fov = (name: string): number => (config.cameras as Record<string, { fovDeg?: number }>)[name]?.fovDeg ?? config.cameras.home.fovDeg
const look = (name: string, eye: [number, number, number], at: [number, number, number]): CameraPose => ({ eye: toWorld(px(eye[0]), px(eye[1]), px(eye[2])), target: toWorld(px(at[0]), px(at[1]), px(at[2])), up: [0, 0, 1], fov: fov(name) })
const Y0 = TIER_Y[0]!
const Y1 = TIER_Y[1]!
const Y2 = TIER_Y[2]!
const LAST_OUT: Shape = { id: 'last.out', part: 'table-layout', kind: 'well', x: 0, y: px(LAST_Y), w: 1920, h: PAGE_H - px(LAST_Y), z0: -px(40), z1: 0, tone: 'dark' }
const NAMED: Record<string, CameraPose> = {
  'tier-3': tierPose(0), 'tier-2': tierPose(1), 'tier-1': streetPose(),
  'table-wide': { ...look('table-wide', [MID, APRON_Y + 17.4, 8.4], [MID, Y2 + 0.45, -1.86]), omit: LAST_OUT },
  'table-lobby': look('table-lobby', [MID + 0.35, Y0 + 9.2, 1.3], [MID - 0.55, Y0 + 5.02, 0.36]),
  'table-replyall': look('table-replyall', [MID, Y1 + 18.3, 13.6], [MID, Y1 + 5.9, -2]),
  'table-nest': { ...look('table-nest', [MID, Y1 + 12.4, 0.5], [MID, Y1 + 6.4, -1.4]), fov: fov('rail') },
  'table-fired': look('table-fired', [8.1, Y2 + 6.45, 0.25], [4.45, Y2 + 3.75, -1.95]),
  'table-save': { ...look('table-save', [MID - 0.15, Y2 + 19.5, 3.5], [MID, Y2 + 8.5, -2.2]), omit: LAST_OUT },
  'table-gap': { ...look('table-save', [11.9, Y2 + 14.3, 1.5], [12.2, Y2 + 8.3, -2.5]), omit: LAST_OUT }
}
const FILM: [number, string, number][] = [
  [0, 'follow', 0], [4.1, 'tube', 0.5], [5.2, 'table-wide', 0], [8.65, 'ride', 0], [11.55, 'tier-3', 0], [12.75, 'table-lobby', 0], [14.3, 'follow', 0], [16.55, 'table-nest', 0], [18.95, 'near-nest', 0], [20.5, 'table-replyall', 0], [22.2, 'follow', 0], [26.9, 'table-fired', 0], [29.6, 'follow', 0],
  [30.75, 'rail', 0], [32.3, 'follow', 0.6], [34.65, 'table-gap', 0], [35.35, 'table-save', 0], [37.2, 'follow', 0]
]
const TUBE: { eye: [number, number, number]; at: [number, number, number]; wide: number } = { eye: [0.55, 2.7, 1.5], at: [-2.7, -1.2, 0.1], wide: 12 }
const LENS: Record<string, number> = { tube: 9, 'table-wide': 5, 'table-lobby': 4, 'table-replyall': 12, 'table-nest': 12, 'table-fired': 3, 'table-save': 12, 'table-gap': 12, rail: 5, ride: 7, 'near-nest': 14, 'near-spent': 14 }
const HARD: Record<string, number> = { bumper: 1, sling: 0.7, 'doors-slam': 0.5, 'scoop-kick': 0.8, plunger: 1, 'ball-hit': 0.6, 'drop-target': 0.5, 'mom-save': 1, 'ball-save': 0.8 }
const SHAKE = { size: 0.006, decay: 0.09, hz: 23, most: 1.5, last: 0.5 }
const SOFT = 0.4
const NAME = 1
const HINT = 8
const TURN = 1.5707963267948966
const SIGN = { turn: 0.5235987755982988, cos: 0.8660254037844387, sin: 0.5, inset: 8, lift: 6, back: ['corporate.beach'] }
const WAKE = 0.4
const DIM = 1.1
const DUSK = config.table.pageDuskLevel
const ASLEEP = 0.25
const LOW = 2.4
const PULL = { door: 12, scoop: 30, near: 2.2, gate: 40, key: 14 }
const NEST = { sling: [3.3, 6.5], under: [0.5, 0.9], pour: [-10.6, 1.0, 0.3], key: [0.3, 1.2], wait: [0.45, 0.05], over: [1.05, 0.8] }
const ROLL: { rest: number; tip: Record<string, number> } = { rest: 1.992, tip: { rail: 0.77, 'table-lobby': 0.77, 'table-fired': 2.13 } }
const BACK = { behind: 2.8, up: 3.6, aim: 2.4, lift: -0.8, lag: 0.4, lead: 1.93, start: 0.9, keep: 0.6 }
const NEAR: Record<string, { off: [number, number, number]; mid: [number, number]; keep: number }> = { 'near-nest': { off: [0, 6, 15], mid: [11.3, Y1 + 6.9], keep: 0.6 }, 'near-spent': { off: [0, 3.4, 8.6], mid: [0, 0], keep: 1 } }
const PAN = { lag: 0.25, in: 0.68, slow: 0.5 }
const RIDE = { crest: 2.2, foot: 8.5, tip: 2 }
// slide, live play: [seconds of waiting a scene may spend before the bats' power is cut, seconds after which no deadline waits any more, seconds before the inbox's eject and the scoop's kick where a lob still counts, the same before the highway's end,
// balls a falling lob may be under its mark before it counts as missed, balls down a tier from where the ball is in the bats' reach, seconds after a stroke that met the ball in which the power is never cut, seconds before the inbox lights and before the firehouse's deadline from which a spent scene cuts the power]
const SHOT = { slide: [5, 8, 0.3, 0.8, 1.5, 6.6, 0.75, 0.5, 2], door: 13, scoop: 21, ramp: 21, nest: 17, save: 19, lob: 9, lean: 0.3, jets: 0.5, wide: 2.5, low: 7.5, early: 0.3, back: 1, cone: 0.7, sink: 0.9, air: 1.4, inbox: [20.5, 1, 0.35, 0.85], fire: [21.2, 1, 0.1, 1.2], flap: [20, 0, 0, 0.5] }
const FACE = { over: 0.94, low: 0.82, turn: 0.9, back: 5, press: 20, hit: 0.5, hold: 0.45, lag: 0.1, snap: 0.02, step: 0.03, wall: 0.6, lens: 0.8 }
const SHEET = { along: 0.9, gap: 0.5, press: 0.6, side: 2.6, fly: [0.4, 7.4, 0.6], from: [0.18, 0.76, 0.624], far: 10.2, open: 15 }
const LEAVE = { seconds: 0.55, in: 1.7, firm: 0.25, back: 5, settle: 0.12, up: 0.3 }
const LOADER = { land: [0.66, 0.1], away: [-0.7, 0.8, 0.5], go: [1.25, 0.2], short: 0.72, by: 1.8, low: 16, shut: [-0.6, 0.78], alarm: [0.55, 0.45, 0.8] }
const HIT = { least: 0.3, hold: 0.2, short: 0.66, big: 0.9, sway: [0.3, 8, 0.4] }
const LOAD = { reach: 0.8, gain: 1.6, most: 0.8, rock: [0.1, 1.3], hop: [0.385, 0.9, 0.05] }
const BEATS = { dread: [0.86, -0.6], brace: [0.4, 0.68], catch: [0.12, 0.64], shiver: [0.35, 0.12, 11, 1.3], kick: [0.12, 0.7], alarm: [0.3, 0.36, 1, -0.5], lip: [0.35, 0.72, -0.6], dizzy: [[0, 0.25, 3, 0.5], [0.5, 0.5, 3, 0.5], [1, 0.8, 2.5, 1.3]] }
const SHELL = { shut: 0.27, open: 0.2, soft: 3.6, full: 14.6 }
// The way into the cup: the seconds in which the pull's aim runs from the arrow to the port, with growing speed from `lead` of its mean speed and the body stretched to `long` as it goes, and the seconds of the sink, in which the arrow goes down into the cup to `floor` px over the page, shortens and turns to the pose it is sealed in.
const PLUNGE = { reach: 0.24, sink: 5 / 60, grow: 2, lead: 0.35, floor: 2, long: 1.3 }
// The latch of the half shells: the share of the close that is the slow swing and how far shut it brings them, then the snap into the seam. On the latch the ball is squeezed across the seam by `squeeze` for at most `over` seconds, and the port's ring answers a second time. From `turn` of the close on the arrow turns to the pose it is caught in, so the catch does not turn it in one frame.
const LATCH = { swing: 0.7, to: 0.5, squeeze: 0.85, way: 1.5707963267948966, over: 0.5, turn: 0.5 }
// The drop into the feed tube: the view follows the ball as a damped spring whose stiffness grows from `slow` to `firm` (1 / s) over `ramp` seconds after `hold`, so the ball runs down the screen and the view catches it up. After `over` seconds the page's plain rule follows again.
const DROP = { slow: 4, firm: 13.8, hold: 0.15, ramp: 0.8, over: 1.3 }
// The release out of the port, film and live alike. The ball as it ran before is kept as a shadow, and the view and the tube's events follow the shadow, so they are what they were. The drawn ball lies `still` seconds more while the port's ring is thrown open,
// then falls from rest down the straight tube with one steady gain of speed, so that `top` seconds later, at the tube's first bend, it is at its top pace. The bend takes the share of its speed that goes into the wall (`BEND.cos` is left), it gains again down the slope,
// and at the second bend, which it reaches on the step its shadow does, it is its shadow and has the tube's pace. `ring`: the seconds after the release at which the ring opens (half a frame, so the first frame that shows it is the frame before the ball moves).
const FALL = { still: 1 / 60, top: 46 / 60, ring: 1 / 120 }
const STEP = 1 / stepHz
// The feed tube's first two bends: how far down the rail each lies, in balls, and the share of the ball's speed that the first leaves it.
const BEND = (() => {
  const p = railOf('feed').points
  const d = (i: number): number => Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1])
  const first = d(1) + d(2)
  return { first, second: first + d(3), cos: (p[3]![1] - p[2]![1]) / d(3) }
})()
// How far the drawn ball is behind its shadow `u` seconds after the release, in balls, when the shadow runs `lead` balls a second.
const lagOf = (u: number, lead: number): number => {
  const over = BEND.second / lead
  if (u >= over) return 0
  if (u <= FALL.still) return lead * u
  const gain = (2 * BEND.first) / (FALL.top * FALL.top)
  const f = u - FALL.still
  if (f <= FALL.top) return lead * u - 0.5 * gain * f * f
  const v = gain * FALL.top * BEND.cos
  const d = over - FALL.still - FALL.top
  const w = f - FALL.top
  return Math.max(0, lead * u - (BEND.first + v * w + ((BEND.second - BEND.first - v * d) / (d * d)) * w * w))
}
// Live play, the room under a gate: while a ball is past the bats' tips on its way to a shut gate, lies on the gate's wire or was just thrown from it, the live view of the lobby and of the office stands `px` lower, so the wire, its posts and the hole under it are on the screen (the street's view has that room already). `stay`: the seconds after the kick it stays for the wire's swings.
// The view takes that room by a travel of its own, added to its follow: it gains speed by `gain` (px/s a second) up to `pace` (px/s), slows the same way and stands on its place with no step back and no tail; a way down once begun is gone to its end in that one move: when the ball is struck away the view stands lowered while the ball is in the lower part of the tier (`keep` balls or more down it), and goes back once the ball is above that or off the tier's floor.
const ROOM = { px: 90, stay: 0.6, gain: 9000, pace: 720, keep: 5.6, lead: 0.1, calm: 2, near: 0.6 }
// The roll in a tube: the arrow turns by `gear` radians for each ball's width travelled, a whole number of turns over the tube, and the last `ease` of the way slows the turn to rest. In the film the roll down the feed tube is over after `film` balls, before the cut to the wide view of the table.
const TUMBLE = { gear: 1, ease: 0.15, film: 10.5 }
// How far shut the half shells are for the share of the close that has passed: a slow swing, then a snap into the seam with growing speed.
const shutOf = (u: number): number => {
  if (u >= 1) return 1
  if (u <= LATCH.swing) return LATCH.to * Math.sin((Math.PI / 2) * Math.max(0, u / LATCH.swing))
  const k = (u - LATCH.swing) / (1 - LATCH.swing)
  return LATCH.to + (1 - LATCH.to) * k * k
}
const ACT = { wake: 0.3, doors: 0.6, shock: 0.45, realise: 0.45, slow: 7, lead: 0.1, tall: 1.01, ease: 0.06 }

export function makePage(): PageLogic {
  const layout = buildLayout()
  const go = boxOf(layout, 'go-cap')
  const stood: Record<string, Partial<Shape>> = {}
  for (const id of ['marquee-title', 'marquee-score']) {
    const b = boxOf(layout, id)
    const at = boardAt(b.y, b.h, 2)
    stood[id] = { y: at.y, z0: at.z, z1: at.z, turnX: BOARD.turn }
  }
  for (const m of table.models) {
    if (!m.sign) continue
    const b = boxOf(layout, `sign.${m.id}`)
    const back = SIGN.back.includes(m.id)
    const foot = back ? px(m.box[1]) + SIGN.inset + b.h * SIGN.cos : px(m.box[1] + m.box[3]) - SIGN.inset
    const z = px(floorZ(m.tier) + (m.base ?? 0) + m.h) + SIGN.lift + (b.h / 2) * SIGN.sin
    stood[`sign.${m.id}`] = { y: foot - (b.h / 2) * SIGN.cos - b.h / 2, z0: z, z1: z, turnX: SIGN.turn }
  }
  const af = px(ZONES.find((z) => z.id === 'apron')!.z)
  const slab = config.scale.heights.slab
  for (const [id, z0, z1] of [['apron-left', 0, slab], ['apron-right', 0, slab], ['apron-card', slab, slab + 1], ['apron-card-words', slab + 1.3, slab + 1.3], ['drain-label', 6.3, 6.3]] as const) stood[id] = { z0: af + z0, z1: af + z1 }
  const hqType = { font: 'inter-600', px: 30, align: 'centre' as const }
  const hqBlock = block(hqType.font, words('copy:step3.table.buildings.hq', ''), hqType.px)
  const hqZ = px(floorZ(0) + DOORS.plate + DOORS.plateH / 2)
  const hqPlate: Shape = { id: 'sign.corporate.hq.plate', part: 'model-hq', kind: 'text', x: px(MID) - hqBlock.width / 2, y: px(Y0 + DOORS.y + 0.1) + 1 - hqBlock.height / 2, w: hqBlock.width, h: hqBlock.height, z0: hqZ, z1: hqZ, tone: 'ink', words: 'copy:step3.table.buildings.hq', type: hqType, turnX: TURN }
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: b.event ?? null }))
  const start = { x: 1180, y: 760 }
  const port = { x: px(PORT.x), y: px(PORT.y) }
  const outlet = { x: px(OUTLET.x), y: px(OUTLET.y) }
  const PORT_TOP = 28
  const lastScroll = PAGE_H - 1080
  let s = fresh()
  let m: Machine | null = null
  const machine = (): Machine => {
    if (!m) m = new Machine()
    return m
  }
  const gagAt = (t: number): string => (beats.find((b) => t < b.to) ?? beats[beats.length - 1]!).id
  const ball = () => machine().balls[0]!
  const seen3 = (): { x: number; y: number; z: number } => {
    const b = ball()
    if (b.mode !== 'rail' || b.rail !== 'drain' || b.s <= RISER_S) return b
    const p = drainWay((b.s - RISER_S) / (railLength(railOf('drain')) - RISER_S))
    return { x: p.x / BALL, y: p.y / BALL, z: (p.z - BALL / 2) / BALL }
  }
  const powered = (): boolean => s.said.includes('wake')
  const drawn = (): number => {
    const b = ball()
    return b.mode === 'hold' && b.hold === 'plunger' && s.t < T.plunger ? Math.max(0, Math.min(1, (s.t - T.atPlunger) / (T.plunger - T.atPlunger - 0.15))) : 0
  }
  const glow = (): boolean[] => [0, 1, 2].map((k) => powered() && s.t >= T.wake + (k + 1) * WAKE)
  // How bright the website's own light is: full on the page, down to dusk by the time the machine wakes, and up again once the ball leaves by the drain.
  const website = (): number => 1 - (1 - DUSK) * smooth(s.dim)
  // How bright each tier's general lighting is: a wave down the tiers when the machine wakes, and a slow dim once the ball has left by the drain.
  const general = (): number[] => [0, 1, 2].map((k) => (powered() ? smooth((s.t - T.wake - (k + 1) * WAKE) / WAKE) * (s.t > T.wake + 4 * WAKE ? ASLEEP + (1 - ASLEEP) * smooth(s.dim) : 1) * (machine().cut && ball().tier === k ? ASLEEP : 1) : 0))
  const lit = (): boolean[] => table.inserts.map((n) => (powered() && s.t >= T.wake + (n.tier + 1) * WAKE && s.t < T.wake + (n.tier + 1) * WAKE + 0.6) || MODES.some((x) => x.mode === n.mode && s.t >= x.at && s.phase !== 'wait' && s.phase !== 'pull'))
  // The count each window keeps of a ball over its glass (table/real/lights/over.ts). It is in the state only while a ball is in reach of a window, so a table with no ball near one saves and draws as it did.
  const rollOver = (): void => {
    const was = (s as Rolled).over
    let next: Record<string, number> | undefined
    for (const n of table.inserts) {
      let gap = 9
      machine().balls.forEach((b, i) => {
        if (b.mode === 'none') return
        const at = i === 0 ? seen3() : b
        if (Math.abs(at.z - floorZ(n.tier)) <= 0.6) gap = Math.min(gap, Math.hypot(at.x - n.c[0], at.y - n.c[1]) - n.r - 0.5)
      })
      const k = stepOver(was?.[`insert.${n.id}`], gap, ANSWER.reach, STEP)
      if (k !== undefined) (next ??= {})[`insert.${n.id}`] = k
    }
    if (next) (s as Rolled).over = next
    else delete (s as Rolled).over
  }
  const modeOf = (k: number): number | null => {
    let out: number | null = null
    if (s.phase === 'wait' || s.phase === 'pull') return null
    for (const x of MODES) if (x.tier === k && s.t >= x.at) out = x.mode
    return out
  }
  const activeStates = (): string[] => {
    const out = [s.phase === 'result' ? 'result' : s.phase === 'wait' ? 'rest' : 'play']
    if (powered()) out.push('on')
    const lamps = glow()
    for (let k = 0; k < 3; k++) {
      const mode = modeOf(k)
      if (lamps[k]) out.push(mode === null ? `score${k}` : `mode${mode}`)
    }
    return out
  }
  const scoreText = (): string => String(s.score).padStart(config.table.displayDigits, '0')
  const once = (name: string): boolean => {
    if (s.said.includes(name)) return false
    s.said.push(name)
    return true
  }
  const target = (): { scroll: number; floor: number } => {
    const b = ball()
    if (s.phase === 'wait' || s.phase === 'pull' || b.mode === 'none') return s.phase === 'open' || s.phase === 'result' ? { scroll: lastScroll, floor: 0 } : { scroll: 0, floor: 0 }
    if (b.mode === 'hold' && b.hold === 'loader') return { scroll: 0, floor: 0 }
    if (b.mode === 'hold' && b.hold === 'outlet') return { scroll: lastScroll, floor: 0 }
    if (b.mode === 'rail' && (b.rail === 'feed' || b.rail === 'launch' || b.rail === 'drain')) {
      const by = b.rail === 'feed' && s.fall && s.fall[0]! >= 0 ? railAt(railOf('feed'), s.fall[0]!).y : b.y
      const y = px(by)
      const inTier = by >= Y0 && by < APRON_Y && b.rail !== 'feed'
      if (b.rail === 'launch' && by < Y0 + TH) return { scroll: px(Y0), floor: px(floorZ(0)) }
      if (b.rail === 'feed' && by > Y2 + 2) return { scroll: px(Y2 + LOW), floor: px(floorZ(2)) }
      return { scroll: Math.max(0, Math.min(lastScroll, y - 540)), floor: inTier ? px(floorZ(tierAt(b.y))) : 0 }
    }
    if (b.mode === 'hold' && b.hold === 'plunger') return { scroll: px(Y2 + LOW), floor: px(floorZ(2)) }
    const lane = b.mode === 'rail' && b.rail.startsWith('outlane.') ? railOf(b.rail).points : null
    const shut = lane !== null && !machine().gate[tierAt(lane[0]![1])]
    const sunk = lane && (shut || b.s >= lane[1]![1] - lane[0]![1]) ? lane[shut ? 0 : 1]![1] : b.y
    const k = b.mode === 'rail' && b.rail.startsWith('chute.') ? TIERS.indexOf(b.rail.slice(6) as never) + 1 : b.mode === 'rail' && b.rail.startsWith('lift.') ? tierAt(railOf(b.rail).points[3]![1]) : tierAt(Math.max(Y0, Math.min(APRON_Y - 0.01, sunk)))
    return { scroll: px(TIER_Y[k]! + (k === 2 ? STREET : 0)), floor: px(floorZ(k)) }
  }
  const atGate = (): boolean => {
    if (s.mode !== 'live' || s.phase !== 'sealed') return false
    const mc = machine()
    const b = ball()
    const k = b.tier
    if (k > 1 || mc.gate[k] || (b.mode !== 'plane' && b.mode !== 'tow')) return false
    if (mc.taken >= 0 || mc.since(`ball-save:${TIERS[k]}.gate`) < ROOM.stay) return true
    if (b.mode !== 'plane' || b.vy < -ROOM.calm || Math.abs(b.x - MID) > MOUTH.half) return false
    const past = b.y - TIER_Y[k]! - FLIP.pivotV - FLIP_REACH * Math.sin((FLIP.rest * Math.PI) / 180)
    if (s.room !== undefined) return past > -ROOM.near || past + b.vy * ROOM.lead > 0
    return past + b.vy * ROOM.lead > 0 && Math.abs(b.x + b.vx * ROOM.lead - MID) < MOUTH.half
  }
  const soft = (r: ReturnType<typeof railOf>, at: number): { x: number; y: number; z: number } => {
    const end = railLength(r)
    const out = { x: 0, y: 0, z: 0 }
    for (let k = -3; k <= 3; k++) {
      const p = railAt(r, Math.max(0, Math.min(end, at + k * SOFT)))
      const w = (4 - Math.abs(k)) / 16
      out.x += p.x * w
      out.y += p.y * w
      out.z += p.z * w
    }
    return out
  }
  const railPose = (back = 2.8, up = 2.5, ahead = 0.7, lift = 0, wide = 0): CameraPose => {
    const b = ball()
    let c = { x: b.x, y: b.y, z: b.z }
    let vx = b.vx
    let vy = b.vy
    if (b.mode === 'rail') {
      const r = railOf(b.rail)
      const p0 = railAt(r, Math.max(0, b.s - 1.6))
      const p1 = railAt(r, Math.min(railLength(r), b.s + 2.2))
      vx = p1.x - p0.x
      vy = p1.y - p0.y
      c = soft(r, b.s)
    } else if (b.mode === 'hold' && b.hold === 'plunger') {
      vx = 0
      vy = -1
    } else if (s.t < T.onTable + 1) {
      vx = 0
      vy = 1
    }
    const sp = Math.hypot(vx, vy) || 1
    const dx = vx / sp
    const dy = vy / sp
    return { eye: toWorld(px(c.x - dx * back), px(c.y - dy * back), px(c.z + up)), target: toWorld(px(c.x + dx * ahead), px(c.y + dy * ahead), px(c.z + lift)), up: [0, 0, 1], fov: fov('rail') + wide }
  }
  const ridePose = (): CameraPose => {
    const b = ball()
    const u = b.mode === 'rail' && b.rail === 'launch' ? smooth(Math.min(1, b.s / 7)) : b.mode === 'hold' ? 0 : 1
    return railPose(0.7 + 2.7 * u, 2.6 + 0.8 * u, 0.95 + 1.55 * u, 0.5, 36 * (1 - u))
  }
  const backPose = (): CameraPose => {
    const b = ball()
    if (b.mode !== 'rail' || b.rail !== 'highway') return railPose()
    const r = railOf(b.rail)
    const g = s.arc < -8 ? b.s : s.arc + BACK.lead + BACK.keep * (b.speed * BACK.lag - BACK.lead)
    const c = soft(r, g)
    const e = soft(r, Math.max(0, g - BACK.behind))
    const a = soft(r, Math.min(railLength(r), g + BACK.aim))
    const d = Math.hypot(a.x - e.x, a.y - e.y) || 1
    const along = [(a.x - e.x) / d, (a.y - e.y) / d]
    return { eye: toWorld(px(c.x - along[0]! * BACK.behind), px(c.y - along[1]! * BACK.behind), px(c.z + BACK.up)), target: toWorld(px(c.x + along[0]! * BACK.aim), px(c.y + along[1]! * BACK.aim), px(c.z + BACK.lift)), up: [0, 0, 1], fov: fov('rail') }
  }
  // The view as it is seen in the drop: it follows the drawn ball, and from the step the ball is its shadow to the end of the drop's own follow it goes over to the view that followed the shadow, which is the view of before.
  const viewed = (): number => {
    if (!s.fall) return s.scroll
    const meet = T.tube + BEND.second / s.fall[2]!
    return s.fall[3]! + (s.scroll - s.fall[3]!) * smooth(Math.max(0, Math.min(1, (s.t - meet) / (T.tube + DROP.over - meet))))
  }
  const follow = (): CameraPose => homePose(viewed(), s.floor)
  const tubePose = (): CameraPose => {
    const b = ball()
    const c = b.mode === 'rail' ? soft(railOf(b.rail), b.s) : { x: b.x, y: b.y, z: b.z }
    return { eye: toWorld(px(c.x + TUBE.eye[0]), px(c.y + TUBE.eye[1]), px(c.z + TUBE.eye[2])), target: toWorld(px(c.x + TUBE.at[0]), px(c.y + TUBE.at[1]), px(c.z + TUBE.at[2])), up: [0, 0, 1], fov: fov('rail') + TUBE.wide }
  }
  const nearPose = (name: string): CameraPose => {
    const n = NEAR[name]!
    const keep = n.keep + ((1 - n.keep) * (1 - s.pan[3]!)) / (1 - PAN.in)
    const x = n.mid[0] + (s.pan[0]! - n.mid[0]) * keep
    const y = n.mid[1] + (s.pan[1]! - n.mid[1]) * keep
    const z = s.pan[2]! + 0.5
    return look(name, [x + n.off[0] * s.pan[3]!, y + n.off[1] * s.pan[3]!, z + n.off[2] * s.pan[3]!], [x, y, z])
  }
  const lens = (name: string, p: CameraPose | null): CameraPose | null => {
    const open = LENS[name]
    if (!p || open === undefined) return p
    const b = ball()
    const on = name === 'table-wide' || b.mode === 'none' ? p.target : toWorld(px(b.x), px(b.y), px(b.z) + BALL / 2)
    const f = basis(p).forward
    return { ...p, focus: Math.max(BALL, (on[0] - p.eye[0]) * f[0] + (on[1] - p.eye[1]) * f[1] + (on[2] - p.eye[2]) * f[2]), aperture: open }
  }
  const named = (name: string): CameraPose | null => lens(name, name === 'follow' ? follow() : name === 'rail' ? backPose() : name === 'ride' ? ridePose() : name === 'tube' ? tubePose() : name in NEAR ? nearPose(name) : NAMED[name] ?? null)

  const shot = (time: number): string => {
    let i = 0
    while (i + 1 < FILM.length && time >= FILM[i + 1]![0]) i++
    return FILM[i]![1]
  }
  const cut = (time: number): CameraPose => {
    let i = 0
    while (i + 1 < FILM.length && time >= FILM[i + 1]![0]) i++
    const now = named(FILM[i]![1])!
    const u = i > 0 && FILM[i]![2] > 0 ? (time - FILM[i]![0]) / FILM[i]![2] : 1
    if (u >= 1) return now
    const before = named(FILM[i - 1]![1])!
    const omit = now.omit ?? before.omit
    const mixed = mixPose(before, now, smooth(Math.max(0, u)))
    return omit ? { ...mixed, omit } : mixed
  }
  const jolt = (): { x: number; y: number } => {
    const mc = machine()
    let x = 0
    let y = 0
    for (const key in mc.last) {
      const i = key.indexOf(':')
      const hard = i < 0 ? 0 : HARD[key.slice(0, i)] ?? 0
      const age = (mc.steps - mc.last[key]!) / stepHz
      if (hard === 0 || age > SHAKE.last) continue
      const e = hard * Math.exp(-age / SHAKE.decay)
      const turn = 6.283185307179586 * SHAKE.hz * age + key.length * 1.7
      x += e * Math.sin(turn)
      y += e * Math.cos(turn * 0.83)
    }
    const size = Math.hypot(x, y)
    const k = size > SHAKE.most ? SHAKE.most / size : 1
    return { x: x * k, y: y * k }
  }
  const filmPose = (time: number): CameraPose => {
    const p = cut(time)
    const a = jolt()
    const k = strikeJolt(s.fx, s.t)
    const j = { x: a.x + k.x, y: a.y + k.y }
    if (j.x === 0 && j.y === 0) return p
    const b = basis(p)
    const d = Math.hypot(p.target[0] - p.eye[0], p.target[1] - p.eye[1], p.target[2] - p.eye[2])
    const reach = 2 * d * Math.tan((p.fov * Math.PI) / 360) * SHAKE.size
    return { ...p, target: [p.target[0] + (b.right[0] * j.x + b.up[0] * j.y) * reach, p.target[1] + (b.right[1] * j.x + b.up[1] * j.y) * reach, p.target[2] + (b.right[2] * j.x + b.up[2] * j.y) * reach] }
  }
  const seen = (x: number, y: number, z: number): { x: number; y: number } => {
    const eye = (s.mode === 'film' ? cut(s.time) : follow()).eye
    const w = toWorld(x, y, z)
    const k = eye[2] / Math.max(1, eye[2] - w[2])
    return { x: eye[0] + (w[0] - eye[0]) * k + 960, y: 540 - (eye[1] + (w[1] - eye[1]) * k) }
  }

  const emitTable = (io: StepIo, e: TableEvent): void => {
    const gag = gagAt(s.t)
    const from = machine().balls[e.ball]
    const at = seen(px(e.x), px(e.y), from && from.mode !== 'none' ? px(from.z) + BALL / 2 : px(floorZ(tierAt(Math.max(Y0, Math.min(APRON_Y - 0.01, e.y))))) + BALL / 2)
    const x = at.x
    const y = at.y
    const say = (name: string, hits = false) => io.emit(name, x, y, hits)
    const struck = strikeOf(e, machine().frenzy > 0)
    if (struck) {
      s.fx = noted(s.fx, s.t, e, struck)
      if (e.ball === 0) io.emit(`strike:${struck.id}:${struck.hard}`, x, y, false)
      if (e.ball === 0 && struck.loot > 0) io.emit('loot', x, y, false)
    }
    if (e.name === 'flipper') {
      io.emit('flipper', px(e.x), px(TIER_Y[ball().mode === 'none' ? 2 : ball().tier]! + FLIP.pivotV), false)
      const want = machine().wants(0.3, -60)
      if (gag === 'pinball.save' && !s.saved && (e.id === 'left' ? want[0] : want[1])) {
        s.saved = true
        const b = seen(px(ball().x), px(ball().y), px(ball().z) + BALL / 2)
        io.emit('flipper-save', b.x, b.y, false)
      }
      return
    }
    if (e.ball > 0) {
      if (e.name === 'bumper' || e.name === 'sling') say('flasher')
      return
    }
    const flat = (): void => {
      s.struck = s.t
      io.cursor.react('recoil')
    }
    if (e.name === 'bumper') {
      say(gag === 'pinball.coffee' ? 'bumper' : 'flasher', true)
      flat()
    } else if (e.name === 'scoop-kick') {
      say('scoop-kick', true)
      flat()
      io.cursor.press(BEATS.kick[1]!, BEATS.kick[0]!)
      s.snap = s.t
    } else if (e.name === 'ball-hit') {
      say('flasher', true)
      flat()
    } else if (e.name === 'ball-save') {
      const first = gag === 'pinball.save' && !s.saved
      if (first) s.saved = true
      say(first ? 'flipper-save' : 'flasher', first)
      if (first || s.mode === 'live') flat()
      if (s.mode === 'live') {
        // Live play: the gate's kick throws the arrow against its shell as any blow on the ball does.
        const b = ball()
        const way = Math.atan2(-b.vy, -b.vx)
        const turn = ROLL.rest + way + TURN
        s.blow = [Math.min(1, (Math.hypot(b.vx, b.vy) - SHELL.soft) / (SHELL.full - SHELL.soft)), way, s.t]
        s.lay = [turn - 6.283185307179586 * Math.round(turn / 6.283185307179586), s.t + HIT.hold]
        io.cursor.strike(s.lay[0]!, HIT.hold)
        io.cursor.press(HIT.short, HIT.hold)
        s.snap = s.t
        s.sway = s.blow[0]! >= HIT.big ? s.t + HIT.hold : -9
      }
    } else if (e.name === 'gate-take') {
      say('flasher', true)
      io.cursor.react('flinch')
      const p = io.cursor.pose()
      s.lay = [p.lean + p.spin, s.t]
      s.sway = -9
      io.cursor.wobble(0, 1, 0)
    } else if (e.name === 'doors-slam') {
      s.shut = true
      say('doors-slam', true)
      s.struck = s.t
      io.cursor.hurt('flattened', ACT.doors)
    } else if (e.name === 'scoop-in') {
      if (e.id === 'office.inbox') say('inbox-take', true)
      if (e.id === 'street.firehouse') say('firehouse-take', true)
      io.cursor.react('cower')
      io.cursor.press(BEATS.catch[1]!, BEATS.catch[0]!)
      s.snap = s.t
    } else if (e.name === 'kicker-in') io.cursor.react('flinch')
    else if (e.name === 'sling' || e.name === 'drop-target' || e.name === 'standup') {
      if (e.name !== 'standup') say(e.name)
      io.cursor.react('flinch')
    } else if (e.name === 'at-plunger' || e.name === 'mom-save') io.cursor.react('flinch')
    else if (e.name === 'carpet-roll') {
      if (once('carpet-roll')) say('carpet-roll')
    } else if (e.name === 'tier-fall' || e.name === 'drain' || e.name === 'ramp-roll' || e.name === 'spiral' || e.name === 'lift' || e.name === 'spinner' || e.name === 'tube-run' || e.name === 'plunger') say(e.name)
  }

  // The one word the cursor says with its whole body, from where the ball is and what last happened to it.
  const mood = (): Acting => {
    const mc = machine()
    const b = ball()
    const t = s.t
    if (b.mode === 'hold') {
      if (b.hold === 'plunger') return t >= T.atPlunger + ACT.realise ? 'scared' : 'nervous'
      if (b.hold === 'corporate.doors') return 'shocked'
      if (b.hold === 'office.inbox') return s.drops > 0 ? 'scared' : 'nervous'
      if (b.hold === 'street.firehouse') return t >= T.scoopKick - 1.2 ? 'scared' : 'nervous'
      return b.hold === 'outlet' ? 'exhausted' : 'nervous'
    }
    if (b.mode === 'rail') {
      if (b.rail === 'feed') return t < T.wake ? 'nervous' : t < T.powerOn + ACT.shock ? 'shocked' : 'scared'
      if (b.rail === 'highway' || b.rail.startsWith('lift.')) return 'confident'
      return b.rail === 'drain' || b.rail.startsWith('outlane.') ? 'exhausted' : 'scared'
    }
    if (b.mode === 'tow') return b.then.startsWith('gate:') ? 'exhausted' : 'scared'
    if (t - s.struck < ACT.shock) return 'shocked'
    if (s.saved && b.tier === 2) return 'exhausted'
    if (b.tier === 2 && !s.saved && t >= T.spiralEnd && t < T.save - ACT.wake) return 'exhausted'
    const w = mc.wants(0.2, -60)
    if ((w[0] || w[1]) && Math.hypot(b.vx, b.vy) < ACT.slow) return 'nervous'
    if (b.tier === 0) return s.shut ? 'scared' : 'confident'
    if (b.tier === 1) return t >= T.eject && t < T.officeOpen ? 'angry' : 'scared'
    return t < T.scoopKick ? 'nervous' : 'scared'
  }

  const direct = (io: StepIo): void => {
    const mc = machine()
    const b = ball()
    const t = s.t
    const on = mc.on
    const live = s.mode === 'live'
    const lean = live ? SHOT.cone : SHOT.lean
    mc.live = live
    const towTo = (hold: string, speed = 16): void => {
      if (b.mode !== 'plane') return
      const c = holdOf(hold).stand ?? holdOf(hold).c
      s.tows++
      mc.tow(0, c[0], c[1], speed, `hold:${hold}`)
    }
    const towGate = (k: number): void => {
      if (b.mode !== 'plane' || b.tier !== k) return
      s.tows++
      mc.tow(0, MID, TIER_Y[k]! + 11.0, 16, `gate:${k}`)
    }
    const slide = SHOT.slide
    const wasCut = mc.cut
    const play = b.mode === 'plane' || b.mode === 'tow'
    // Live play: a deadline waits while the ball is in play on its tier. The scene's clock holds just under it, and what the page ages from that clock keeps ageing.
    const stay = (at: number, end: number, k: number): boolean => {
      if (!live || b.tier !== k || !(play || (b.mode === 'rail' && b.rail.startsWith('outlane.'))) || t < at - 2 * dt || t >= end || mc.slid >= slide[1]!) return false
      s.t -= dt
      mc.slid += dt
      s.struck -= dt
      s.snap -= dt
      s.scoreAt -= dt
      s.blow[2] = s.blow[2]! - dt
      s.lay[1] = s.lay[1]! - dt
      if (s.sway >= 0) s.sway -= dt
      return true
    }
    // Live play, the last resort when the scene's waiting is spent: the machine cuts the bats' power while the ball is in their reach, so the ball drains to the gate and its save.
    const spent = (from: number, k: number): boolean => live && b.tier === k && play && mc.slid >= slide[0]! && t >= from
    const cut = (): void => {
      if (b.mode === 'tow' || (b.y > TIER_Y[b.tier]! + slide[5]! && (wasCut || mc.since('met') >= slide[6]!))) mc.cut = true
    }
    const lob = (to: readonly number[], set: readonly number[], by: number, gate: string, end: number, from: number): number => {
      if (!live) return 0
      const flown = mc.since(`ball-save:${gate}.gate`)
      if (t < end) mc.mark = [to[0]!, to[1]!, set[0]!, set[1]!]
      if (flown < SHOT.air && t < end && !(b.vy > 0 && b.y > to[1]! + slide[4]!)) {
        if (mc.slid >= slide[0]!) cut()
        return 1
      }
      if (t >= end || !play) return 0
      if (spent(from, b.tier)) cut()
      return (t >= by - set[2]! - SHOT.sink || spent(from, b.tier)) && Math.hypot(to[0]! - b.x, to[1]! - b.y) > PULL.near ? 2 : 0
    }
    const sink = (): void => {
      if (b.mode === 'plane') mc.magnet = [MID, TIER_Y[b.tier]! + 11.2, PULL.gate]
    }
    const shoot = (x: number, y: number, speed: number, pull = 0): void => {
      const far = (x - MID) * (b.x - MID) > 0 && Math.abs(x - MID) > SHOT.wide && b.y > TIER_Y[b.tier]! + SHOT.low
      mc.shot = [x, y, far ? SHOT.lob : speed]
      mc.aim = [x, y, lean]
      if (pull > 0) mc.magnet = [x, y, pull, PULL.near]
    }
    on['plunger'] = false
    on['lifts'] = false
    on['corporate.ladder'] = false
    on['street.mom'] = t > T.spiralEnd
    mc.gate = [t >= T.doorOpen, t >= T.officeOpen, t >= T.streetOpen]
    mc.magnet = null
    mc.aim = null
    mc.shot = null
    mc.mark = null
    mc.cut = false
    if (b.mode === 'hold' && b.hold === 'loader' && t >= T.tube) {
      mc.release(0)
    }
    if (t >= T.lightsDown && once('lights-down')) io.emit('lights-down', px(MID), px(MARQUEE_Y + 2), false)
    if (t >= T.wake) once('wake')
    if (t >= T.powerOn && once('power-on')) io.emit('power-on', px(MID), px(MARQUEE_Y + 2), false)
    if (b.mode === 'rail' && b.rail === 'feed') {
      const pace = (at: number): number => Math.max(6, Math.min(40, (railLength(railOf('feed')) - at) / Math.max(0.05, T.atPlunger - t)))
      if (!s.fall && b.s === 0) s.fall = [0, 1, pace(0), s.scroll, s.sv]
      if (s.fall) {
        const [was, n, lead] = s.fall as [number, number, number]
        if (was >= 0) {
          const go = pace(was) * STEP
          b.s = Math.max(-go, was - lagOf(n * STEP, lead))
          b.speed = pace(was)
          s.fall[0] = n * STEP >= BEND.second / lead ? -1 : was + go
        } else b.speed = pace(b.s)
        s.fall[1] = n + 1
      } else b.speed = pace(b.s)
    }
    if (b.mode === 'hold' && b.hold === 'plunger' && t >= T.plunger) {
      mc.release(0)
    }
    if (b.mode === 'rail' && b.rail === 'launch') b.speed = Math.max(20, Math.min(60, (railLength(railOf('launch')) - b.s) / Math.max(0.05, T.onTable - t)))
    on['corporate.revolving'] = t < T.doorKick
    on['corporate.doors'] = t < T.doorOpen && mc.since('spinner:corporate.revolving') < 1
    if (b.mode === 'hold' && b.hold === 'corporate.revolving') {
      b.wait = t >= T.doorKick ? Math.min(b.wait, 0.05) : 1e9
    }
    if (b.mode === 'hold' && b.hold === 'corporate.doors') b.wait = t >= T.doorOpen ? Math.min(b.wait, 0.01) : 1e9
    if (!stay(T.lobbyEnd, 1e9, 0) && !stay(T.inboxBy, T.eject - slide[2]!, 1) && !stay(T.officeBy, 1e9, 1) && !stay(T.firedBy, T.scoopKick - slide[2]!, 2) && !stay(T.flapBy, T.highwayEnd - slide[3]!, 2)) stay(T.streetBy, 1e9, 2)
    if (spent(T.doorOpen, 0) || spent(T.officeOpen, 1) || spent(T.streetOpen, 2)) cut()
    if (b.tier === 0 && b.mode === 'plane') {
      if (t >= T.doorKick - 0.3 && t < T.doorKick) towTo('corporate.revolving', 18)
      else if (!live && t >= T.lobbyEnd) towGate(0)
      else if (t < T.doorKick) shoot(holdOf('corporate.revolving').stand![0], holdOf('corporate.revolving').stand![1], SHOT.door, PULL.door)
      else if (t >= T.doorOpen) mc.magnet = [MID, Y0 + 11.2, PULL.gate]
    }
    on['office.inbox'] = t >= T.inboxOn && t < T.eject
    const inbox = b.tier === 1 && t >= T.inboxOn - SHOT.back && t < T.eject ? lob(holdOf('office.inbox').c, SHOT.inbox, T.inboxBy, 'office', T.eject - slide[2]!, T.inboxOn - slide[7]!) : 0
    const wild = !live && b.tier === 1 && t >= FRENZY.from && t < FRENZY.to
    mc.frenzy = wild ? FRENZY.speed : 0
    if (wild && once('frenzy-on')) io.emit('frenzy-on', px(MID), px(Y1 + FRENZY.low[1]!), false)
    if (!wild && t >= FRENZY.to && s.said.includes('frenzy-on') && once('frenzy-off')) io.emit('frenzy-off', px(MID), px(Y1 + FRENZY.low[1]!), false)
    if (b.tier === 1 && b.mode === 'plane') {
      if (wild) {
        const n = (s.fx?.length ?? 0) / STRIKE.each
        const to = FRENZY.round[n % FRENZY.round.length]!
        const last = s.fx && s.fx.length > 0 ? s.fx[s.fx.length - STRIKE.each + 1]! : -9
        mc.magnet = null
        mc.aim = [MID + to[0]!, Y1 + to[1]!, FRENZY.cone]
        const d = Math.hypot(mc.aim[0] - b.x, mc.aim[1] - b.y)
        if (Math.hypot(b.vx, b.vy) < FRENZY.speed * FRENZY.slow && t - last >= FRENZY.gap && d > 0.5) {
          mc.kick(0, ((mc.aim[0] - b.x) / d) * FRENZY.speed, ((mc.aim[1] - b.y) / d) * FRENZY.speed)
          emitTable(io, { name: 'rebound', ball: 0, id: 'office.rail', x: b.x, y: b.y })
        }
      } else if (t >= T.inboxOn && t < T.eject) {
        const c = holdOf('office.inbox').c
        if (!live && t >= T.inboxBy) towTo('office.inbox')
        else shoot(c[0], c[1], SHOT.scoop, inbox === 1 ? 0 : PULL.scoop)
      } else if (t >= T.officeOpen - SHOT.back) {
        mc.aim = [MID, Y1 + MOUTH.v, lean]
        if (!live && t >= T.officeBy) towGate(1)
        else if (t >= T.officeOpen) mc.magnet = [MID, Y1 + 11.2, PULL.gate]
      } else {
        const low = table.bumpers.filter((m) => m.tier === 1)[2]!.c
        mc.shot = [low[0], low[1], SHOT.nest]
        if (!live && t >= T.officeKey - NEST.wait[0]! && t < T.officeKey + NEST.wait[1]!) mc.magnet = [low[0] + NEST.key[0]!, low[1] + NEST.key[1]!, PULL.key, PULL.near]
        if (!live) mc.aim = b.vy < 0 ? [b.x < MID ? MID - NEST.sling[0]! : MID + NEST.sling[0]!, Y1 + NEST.sling[1]!, lean] : [b.x < MID ? low[0] - NEST.under[0]! : low[0] + NEST.under[0]!, low[1] + NEST.under[1]!, lean]
        if (!live && b.y < table.bumpers.filter((m) => m.tier === 1)[0]!.c[1]) mc.aim = [b.x > MID ? MID - NEST.over[0]! : MID + NEST.over[0]!, Y1 + NEST.over[1]!, lean]
      }
    }
    if (inbox === 2) sink()
    if (b.mode === 'hold' && b.hold === 'office.inbox') b.wait = t >= T.eject ? 0 : 1e9
    while (s.drops < T.drops.length && t >= T.drops[s.drops]! && b.tier === 1) {
      const h = holdOf('office.inbox')
      s.drops++
      if (s.drops < mc.balls.length) {
        mc.toPlane(s.drops, h.c[0], h.c[1], NEST.pour[0]! + s.drops * NEST.pour[2]!, NEST.pour[1]! - s.drops * NEST.pour[2]!)
        io.emit('ball-drop', px(h.c[0]), px(h.c[1]), false)
      }
    }
    if (t >= T.officeBy + 2) for (let i = 1; i < mc.balls.length; i++) if (mc.balls[i]!.mode !== 'none') mc.remove(i)
    on['street.firehouse'] = t < T.scoopKick + 0.3
    const street = b.tier !== 2 ? 0 : t < T.scoopKick ? lob(holdOf('street.firehouse').mouth!, SHOT.fire, T.firedBy, 'street', T.scoopKick - slide[2]!, T.firedBy - slide[8]!) : t >= T.flapOn && t < T.highwayEnd ? lob(railOf('highway').points[0]!, SHOT.flap, T.flapBy, 'street', T.highwayEnd - slide[3]!, T.flapOn) : 0
    if (b.tier === 2 && b.mode === 'plane') {
      if (t < T.scoopKick) {
        const c = holdOf('street.firehouse').mouth!
        if (!live && t >= T.firedBy) towTo('street.firehouse')
        else shoot(c[0], c[1], SHOT.scoop, PULL.scoop)
      } else if (t < T.highwayEnd) {
        const p = railOf('highway').points[0]!
        if (!live && t >= T.flapBy) {
          s.tows++
          mc.tow(0, p[0], p[1], 16, 'rail:highway')
        } else mc.shot = [p[0], p[1], SHOT.ramp]
      } else if (t >= T.spiralEnd && t < T.streetOpen - SHOT.back) mc.shot = [MID + 1.2, Y2 + 2.2, SHOT.save]
      else {
        if (t >= T.streetOpen - SHOT.back) mc.aim = [MID, Y2 + MOUTH.v, lean]
        if (!live && t >= T.streetBy) towGate(2)
        else if (t >= T.streetOpen) mc.magnet = [MID, Y2 + 11.2, PULL.gate]
      }
    }
    if (street === 2) sink()
    if (b.mode === 'hold' && b.hold === 'street.firehouse') {
      b.wait = t >= T.scoopKick ? Math.min(b.wait, 0.01) : 1e9
    }
    on['street.flap'] = t >= T.flapOn && t < T.highwayEnd
    if (b.mode === 'rail' && b.rail === 'highway') b.speed = Math.max(RIDE.crest, Math.min(16, (2 * (railLength(railOf('highway')) - b.s)) / Math.max(0.05, T.highwayEnd - t) - RIDE.crest))
    if (b.mode === 'rail' && b.rail === 'spiral') b.speed = Math.max(RIDE.crest, Math.min(30, (2 * (railLength(railOf('spiral')) - b.s)) / Math.max(0.05, T.spiralEnd - t) - RIDE.foot))
    if (b.mode === 'rail' && b.rail === 'drain') b.speed = s.skipped ? 40 : 13
    io.cursor.act(mood())
    const snap = (squash: number, seconds: number, turn = 0): void => {
      const p = io.cursor.pose()
      if (turn !== 0) {
        s.lay = [p.lean + p.spin + turn, s.t + seconds]
        io.cursor.strike(s.lay[0]!, seconds)
      }
      io.cursor.press(squash, seconds)
      s.snap = s.t
    }
    if (s.took >= 0 && t >= s.took + SHELL.shut && t < T.tube && once('act.caught')) {
      io.cursor.react('flinch')
      io.cursor.hold(LOADER.alarm[1]!)
      s.lay = [LOADER.alarm[0]!, t + LOADER.alarm[1]!]
      io.cursor.strike(s.lay[0]!, LOADER.alarm[1]!)
      io.cursor.press(LOADER.alarm[2]!, LOADER.alarm[1]!)
      s.snap = t
    }
    if (b.mode === 'hold' && b.hold === 'plunger' && t >= T.atPlunger + ACT.realise && t < T.plunger - BEATS.brace[0]! && once('act.dread')) {
      snap(BEATS.dread[0]!, T.plunger - BEATS.brace[0]! - t, BEATS.dread[1]!)
      io.cursor.wobble(BEATS.shiver[1]!, BEATS.shiver[2]!, T.plunger - BEATS.brace[0]! - t)
    }
    if (t >= T.plunger - BEATS.brace[0]! && t < T.plunger && once('act.brace')) snap(BEATS.brace[1]!, BEATS.brace[0]!)
    if (t >= T.eject - BEATS.alarm[1]! && t < T.eject && once('act.alarm')) {
      io.cursor.react('startle')
      io.cursor.hold(BEATS.alarm[0]!)
      snap(BEATS.alarm[2]!, BEATS.alarm[1]!, BEATS.alarm[3]!)
    }
    if (b.mode === 'hold' && b.hold === 'street.firehouse' && t >= T.firedBy + BEATS.shiver[0]! && once('act.shiver')) io.cursor.wobble(BEATS.shiver[1]!, BEATS.shiver[2]!, BEATS.shiver[3]!)
    if (b.mode === 'rail' && b.rail === 'highway' && t < T.highwayEnd - BEATS.lip[0]! - LOAD.hop[0]! && Math.floor(t / LOAD.hop[0]!) !== Math.floor((t - dt) / LOAD.hop[0]!)) io.cursor.press(LOAD.hop[1]!, LOAD.hop[2]!)
    if (b.mode === 'rail' && b.rail === 'highway' && t >= T.highwayEnd - BEATS.lip[0]! && once('act.lip')) snap(BEATS.lip[1]!, BEATS.lip[0]!, BEATS.lip[2]!)
    if (b.mode === 'rail' && b.rail === 'spiral') for (const d of BEATS.dizzy) if (t >= T.highwayEnd + d[0]! * (T.spiralEnd - T.highwayEnd) && once(`act.dizzy.${d[0]}`)) io.cursor.wobble(d[1]!, d[2]!, d[3]!)
  }

  const sealNow = (io: StepIo): void => {
    const mc = machine()
    s.phase = 'sealed'
    s.took = s.t
    io.cursor.take('ball')
    io.cursor.seal(true, true)
    io.cursor.act('nervous')
    s.lay = [LOADER.shut[0]!, s.t + SHELL.shut]
    io.cursor.strike(s.lay[0]!, SHELL.shut)
    io.cursor.press(LOADER.shut[1]!, SHELL.shut)
    s.snap = s.t
    mc.hold(0, 'loader', 1e9)
    mc.balls[0]!.z = -0.4
    io.emit('ball-seal', port.x, port.y, true)
  }

  const face = (io: StepIo): void => {
    const b = ball()
    const lies = seen3()
    const eye = (s.mode === 'film' ? cut(s.time) : follow()).eye
    const c = toWorld(px(lies.x), px(lies.y), px(lies.z) + BALL / 2)
    const d = Math.hypot(eye[0] - c[0], eye[1] - c[1], eye[2] - c[2]) || 1
    const e = [(eye[0] - c[0]) / d, (eye[1] - c[1]) / d, (eye[2] - c[2]) / d]
    const low = smooth(Math.max(0, Math.min(1, (FACE.over - e[2]!) / (FACE.over - FACE.low))))
    const k = FACE.turn * low
    const want = [e[0]! * k, e[1]! * k, 1 - k + e[2]! * k, FACE.back]
    const speed = Math.hypot(b.vx, b.vy)
    if (s.struck === s.t) s.hit = speed > 0.01 ? [b.vx / speed, -b.vy / speed] : [0, 0]
    const age = (s.t - s.struck) / FACE.hit
    if (age >= 0 && age < 1) {
      const w = age < FACE.hold ? 1 : 1 - smooth((age - FACE.hold) / (1 - FACE.hold))
      const n = [e[0]! * FACE.lens - s.hit[0]! * FACE.wall, e[1]! * FACE.lens - s.hit[1]! * FACE.wall, Math.max(0.2, e[2]!) * FACE.lens, FACE.press]
      for (let i = 0; i < 4; i++) want[i] = want[i]! * (1 - w) + n[i]! * w
    }
    const rate = s.mode === 'film' && shot(s.time) !== shot(s.time - dt) ? 1 : Math.min(1, dt / (age >= 0 && age < FACE.hold ? FACE.snap : FACE.lag))
    for (let i = 0; i < 4; i++) s.face[i] = s.face[i]! + (want[i]! - s.face[i]!) * rate
    const flat = Math.hypot(e[0]!, e[1]!)
    const tip = s.mode === 'film' ? ROLL.tip[shot(s.time)] : undefined
    const round = b.mode === 'rail' && b.rail === 'spiral'
    const held = round || (tip !== undefined && flat > 0.05 && (b.mode === 'rail' || shot(s.time) !== 'rail'))
    if (round) {
      const at = railAt(railOf('spiral'), b.s)
      const turn = ROLL.rest + Math.atan2(at.dy, at.dx)
      const p = io.cursor.pose()
      io.cursor.aim(turn - Math.PI * 2 * Math.round((turn - p.lean - p.spin) / (Math.PI * 2)))
    } else if (held) {
      let load = 0
      if (b.mode === 'rail' && b.rail === 'highway') {
        const r = railOf('highway')
        const a0 = railAt(r, Math.max(0, b.s - LOAD.reach))
        const a1 = railAt(r, Math.min(railLength(r), b.s + LOAD.reach))
        load = Math.max(-LOAD.most, Math.min(LOAD.most, (a0.dx * a1.dy - a0.dy * a1.dx) * LOAD.gain)) + LOAD.rock[0]! * Math.sin(2 * Math.PI * LOAD.rock[1]! * s.t)
      }
      const turn = ROLL.rest - (tip ?? 0) - Math.atan2(e[0]!, -e[1]!) + load
      const p = io.cursor.pose()
      io.cursor.aim(s.was[4] === 1 ? turn - Math.PI * 2 * Math.round((turn - p.lean - p.spin) / (Math.PI * 2)) : turn - Math.PI * 2 * Math.floor((turn + Math.PI / 2) / (Math.PI * 2)))
    } else if (b.mode === 'rail' && (b.rail === 'feed' || b.rail === 'drain')) {
      const whole = railLength(railOf(b.rail))
      const far = b.rail === 'feed' && s.mode === 'film' ? Math.min(whole, TUMBLE.film) : whole
      const p = io.cursor.pose()
      const id = b.rail === 'feed' ? 1 : 2
      if (s.roll[0] !== id) s.roll = [id, p.spin]
      const f = Math.max(0, Math.min(1, b.s / far))
      const u = (f - (1 - TUMBLE.ease)) / TUMBLE.ease
      const g = u <= 0 ? f : 1 - TUMBLE.ease + TUMBLE.ease * (1.5 * u - 0.5 * u * u * u)
      const turns = Math.max(1, Math.round((far * TUMBLE.gear) / 6.283185307179586))
      io.cursor.aim(f >= 1 ? null : p.feel.lean + s.roll[1]! * (1 - g) + 6.283185307179586 * turns * g)
    } else {
      s.roll = [0, 0]
      io.cursor.aim(null)
    }
    if (s.mode === 'live' && machine().taken >= 0) io.cursor.strike(s.lay[0]!, dt)
    if (s.t < s.lay[1]! && (s.was[4] === 1) !== held) {
      io.cursor.strike(s.lay[0]!, s.lay[1]! - s.t)
      s.snap = s.t
    }
    const pose = io.cursor.pose()
    const len = Math.hypot(s.face[0]!, s.face[1]!, s.face[2]!) || 1
    const n = [s.face[0]! / len, s.face[1]! / len, s.face[2]! / len]
    s.was = [pose.lean, pose.spin, pose.squash, 1, held ? 1 : 0]
    const at = berth(pose, pose.lean, pose.spin, pose.squash, n, s.face[3]!, s.time)
    io.cursor.turn({ x: n[0]!, y: n[1]!, z: n[2]!, back: at.back })
    io.cursor.place(px(lies.x), px(lies.y), px(lies.z) - 1)
  }

  const logic: PageLogic = {
    id: 'step3', unit: 'pinball', width: 1920, height: PAGE_H, layout, gags, start,
    get control(): 'pointer' | 'flippers' { return s.phase === 'sealed' ? 'flippers' : 'pointer' },
    reset(ctx: PageContext) {
      s = fresh()
      s.mode = ctx.mode
      if (m) m.reset()
    },
    step(io: StepIo) {
      const mc = machine()
      s.time = io.time
      if (s.skipped && (s.phase === 'wait' || s.phase === 'pull')) {
        sealNow(io)
        s.t = Math.max(s.t, T.streetBy)
        mc.ride(0, 'drain')
      } else if (s.phase === 'wait' || s.phase === 'pull') {
        s.t = Math.min(s.t + dt, T.seal)
        const reach = 150 + Math.max(0, io.time - 1.2) * 420
        const d = Math.hypot(io.cursor.x - port.x, io.cursor.y - port.y)
        if (s.mode === 'film' && io.time > 0.5 && io.cursor.pose().z < LOADER.low && once('act.land')) io.cursor.press(LOADER.land[0]!, LOADER.land[1]!)
        if (s.phase === 'wait' && d < reach && io.time >= T.arrive && !io.cursor.inAir) {
          if (s.seen < 0) {
            const p = io.cursor.pose()
            s.seen = io.time
            io.cursor.react('recoil')
            io.cursor.hold(LOADER.away[2]!)
            io.cursor.strike(p.lean + p.spin + LOADER.away[0]!, LOADER.away[2]!)
            io.cursor.press(LOADER.away[1]!, LOADER.away[2]!)
          } else if (io.time >= s.seen + LOADER.away[2]!) {
            s.phase = 'pull'
            s.pull = 0
            s.sink = [-1, io.cursor.x, io.cursor.y, 0, 0, 0]
            io.cursor.take('ball')
            io.cursor.press(LOADER.go[0]!, LOADER.go[1]!)
          }
        }
        if (s.phase === 'pull') {
          s.pull += dt
          const due = s.mode === 'live' ? s.pull > 0.3 - PLUNGE.sink : io.time >= T.seal - 0.1 - PLUNGE.sink
          if (s.sink[0]! < 0 && ((d < 14 && due) || s.pull > 1.1 - PLUNGE.sink)) {
            const p = io.cursor.pose()
            const turn = p.lean + p.spin
            s.sink = [0, p.x, p.y, p.z, p.squash, turn]
          }
          if (s.sink[0]! < 0) {
            const f = Math.min(1, s.pull / PLUNGE.reach)
            const u = PLUNGE.lead * f + (1 - PLUNGE.lead) * Math.pow(f, PLUNGE.grow)
            io.cursor.drive(s.sink[1]! + (port.x - s.sink[1]!) * u, s.sink[2]! + (port.y - s.sink[2]!) * u, 30)
            io.cursor.press(LOADER.go[0]! + (PLUNGE.long - LOADER.go[0]!) * u, dt)
          } else {
            s.sink[0] = s.sink[0]! + dt
            const film = s.mode === 'film' && s.pull <= 1.1 - PLUNGE.sink
            const k = smooth(Math.max(0, Math.min(1, film ? 1 - (T.seal - 0.1 - io.time) / PLUNGE.sink : s.sink[0]! / PLUNGE.sink)))
            const p = io.cursor.pose()
            const to = LOADER.shut[0]! - 6.283185307179586 * Math.round((LOADER.shut[0]! - s.sink[5]!) / 6.283185307179586)
            const turn = s.sink[5]! + (to - s.sink[5]!) * k
            const squash = s.sink[4]! + (LOADER.shut[1]! - s.sink[4]!) * k
            const mid = sealedFit({ ...p, spin: to - p.lean, squash: LOADER.shut[1]! }, s.time)
            const cs = Math.cos(-to) * p.scale
            const sn = Math.sin(-to) * p.scale
            io.cursor.place(s.sink[1]! + (port.x - mid.x * cs + mid.y * sn - s.sink[1]!) * k, s.sink[2]! + (port.y + mid.x * sn + mid.y * cs - s.sink[2]!) * k, s.sink[3]! + (PLUNGE.floor - s.sink[3]!) * k * k)
            io.cursor.strike(turn, dt)
            io.cursor.press(squash, dt)
            if (film ? io.time >= T.seal - 0.1 : s.sink[0]! >= PLUNGE.sink - dt / 2) sealNow(io)
          }
        }
      } else s.t += dt
      if (s.phase === 'sealed') {
        direct(io)
        if (s.took >= 0 && s.t < s.took + SHELL.shut && s.t < T.tube) {
          const k = smooth(Math.max(0, ((s.t - s.took) / SHELL.shut - LATCH.turn) / (1 - LATCH.turn)))
          if (k > 0) {
            s.lay = [LOADER.shut[0]! + (LOADER.alarm[0]! - LOADER.shut[0]!) * k, s.lay[1]!]
            io.cursor.strike(s.lay[0]!, dt)
            io.cursor.press(LOADER.shut[1]! + (LOADER.alarm[2]! - LOADER.shut[1]!) * k, dt)
          }
        }
        if (s.latch < 0 && s.took >= 0 && s.t >= s.took + SHELL.shut) {
          s.latch = s.t
          if (s.t < T.tube) s.blow = [LATCH.squeeze, LATCH.way, s.t]
        }
        if (s.blow[2] === s.latch && s.t >= s.latch + LATCH.over) s.blow = [0, 0, -9]
        const before = ball()
        const was = before.mode === 'plane' ? [before.vx, before.vy] : null
        const events = mc.step(io.pointer.flipLeft === true, io.pointer.flipRight === true)
        rollOver()
        const after = ball()
        if (was && after.mode === 'plane') {
          const push = Math.hypot(was[0]! - after.vx, was[1]! - after.vy)
          if (push > SHELL.soft) {
            const way = Math.atan2(was[1]! - after.vy, was[0]! - after.vx)
            s.blow = [Math.min(1, (push - SHELL.soft) / (SHELL.full - SHELL.soft)), way, s.t]
            if (s.blow[0]! >= HIT.least) {
              const along = was[1]! * Math.cos(way) - was[0]! * Math.sin(way)
              const turn = ROLL.rest + way + (along >= 0 ? TURN : -TURN)
              s.lay = [turn - 6.283185307179586 * Math.round(turn / 6.283185307179586), s.t + HIT.hold]
              io.cursor.strike(s.lay[0]!, HIT.hold)
              io.cursor.press(HIT.short, HIT.hold)
              s.snap = s.t
              s.sway = s.blow[0]! >= HIT.big ? s.t + HIT.hold : -9
            }
          }
        }
        for (const e of events) emitTable(io, e)
        if (mc.score !== s.score) {
          s.scoreWas = s.score
          s.scoreAt = s.t
        }
        s.score = mc.score
        if (io.pointer.flipLeft === true || io.pointer.flipRight === true) s.flipped = true
        if (s.sway >= 0 && s.t >= s.sway) {
          io.cursor.wobble(HIT.sway[0]!, HIT.sway[1]!, HIT.sway[2]!)
          s.sway = -9
        }
        const b = ball()
        const ease = b.mode === 'none' ? 0 : s.t < T.onTable ? 1 : Math.min(1, dt / PAN.lag)
        s.pan = [s.pan[0]! + (b.x - s.pan[0]!) * ease, s.pan[1]! + (b.y - s.pan[1]!) * ease, s.pan[2]! + (b.z - s.pan[2]!) * ease, s.pan[3]! + ((b.mode === 'hold' ? PAN.in : 1) - s.pan[3]!) * Math.min(1, dt / PAN.slow)]
        s.arc = b.mode === 'rail' && b.rail === 'highway' ? (s.arc < -8 ? b.s - BACK.start : s.arc + (b.s - s.arc) * Math.min(1, dt / BACK.lag)) : -9
        face(io)
        const lead = ACT.lead * Math.max(0, Math.min(1, (ACT.tall - io.cursor.pose().squash) / ACT.ease))
        if (b.mode !== 'hold') io.cursor.knock(px(b.vx) * lead, px(b.vy) * lead)
        if (b.mode === 'hold' && b.hold === 'outlet') {
          if (s.home < 0) s.home = s.t
          s.opened += dt
          if (s.opened >= SHELL.open) {
            mc.remove(0)
            s.phase = 'open'
            s.opened = 0
            io.cursor.seal(false)
            io.cursor.release()
            io.cursor.hurt('flattened', 0.6)
            io.emit('ball-open', outlet.x, outlet.y, true)
            io.emit('flatten', outlet.x, outlet.y, true)
          }
        }
      } else if (s.phase === 'open') {
        s.opened += dt
        if (s.opened >= 0.5 && once('peel-up')) {
          io.cursor.heal()
          io.cursor.act('exhausted')
          io.emit('peel-up', outlet.x, outlet.y, true)
        }
        if (s.opened >= 0.7) s.phase = 'result'
      } else if (s.phase === 'result') {
        s.result += dt
        const over = io.pointer.x >= go.x && io.pointer.x <= go.x + go.w && io.pointer.y >= go.y && io.pointer.y <= go.y + go.h
        if (io.pressed && over && !s.pressed) {
          s.pressed = true
          io.emit('button-press', go.cx, go.cy, false)
        }
        if (!s.pressed && s.result >= (s.skipped ? 1 : config.live.idleSeconds)) s.pressed = true
        if (s.pressed) {
          s.hold += dt
          if (s.hold > 0.25) s.done = true
        }
      }
      const inside = s.phase === 'sealed' && s.t >= T.lightsDown && !(ball().mode === 'rail' && ball().rail === 'drain') && !(ball().mode === 'hold' && ball().hold === 'outlet')
      if (s.out[0]! < 0 && s.phase === 'sealed' && ball().mode === 'rail' && ball().rail === 'drain') s.out = [s.time, s.scroll, s.floor]
      s.dim = Math.max(0, Math.min(1, s.dim + (inside ? dt / DIM : -dt / (s.out[0]! < 0 ? DIM : LEAVE.up))))
      if (s.phase !== 'sealed') {
        const on = [port, outlet].some((c) => Math.hypot(io.cursor.x + 8 - c.x, io.cursor.y + 14 - c.y) < px(OUTLET.ring) / 2 + 12)
        io.cursor.setGround(on ? PORT_TOP : 0)
      }
      const to = target()
      const low = atGate()
      if (low || s.room) {
        const [x, v, gone] = s.room ?? [0, 0, 0]
        const b = ball()
        const back = !low && (gone === 1 || b.mode !== 'plane' || b.tier > 1 || b.y - TIER_Y[b.tier]! < ROOM.keep)
        const goal = back ? 0 : ROOM.px
        const way = goal >= x! ? 1 : -1
        const far = Math.abs(goal - x!)
        const u = v! * way
        const up = Math.min(ROOM.pace, u + ROOM.gain * dt)
        const w = u > 0 && far - ((u + up) / 2) * dt < (up * up) / (2 * ROOM.gain) ? Math.max(0, u - ((u * u) / (2 * far)) * dt) : up
        const y = x! + way * ((u + w) / 2) * dt
        const there = (w <= 0 && u > 0) || (goal - y) * way <= 1e-3
        const now = there ? goal : Math.max(0, Math.min(ROOM.px, y))
        if (now > 0 || low) s.room = [now, there ? 0 : way * w, back ? 1 : 0]
        else delete s.room
        to.scroll = Math.min(lastScroll, to.scroll + now)
        s.scroll = Math.min(lastScroll, s.scroll + now - x!)
      }
      const rate = Math.min(1, dt / (live.tierTravelSeconds / 4))
      const cap = 4200 * dt
      if (s.out[0]! >= 0) {
        const u = (s.time - s.out[0]! - LEAVE.up) / LEAVE.seconds
        const w = Math.pow(Math.max(0, Math.min(1, u)), LEAVE.in)
        const p = (1 - LEAVE.firm) * w * (2 - w) + LEAVE.firm * w
        const after = (u - 1) * LEAVE.seconds / LEAVE.settle
        s.scroll = s.out[1]! + (lastScroll - s.out[1]!) * p - (after > 0 && after < 1 ? LEAVE.back * Math.sin(Math.PI * after) : 0)
        s.floor = s.out[2]! * (1 - p)
      } else {
        const b = ball()
        if (s.phase === 'sealed' && b.mode === 'rail' && b.rail === 'feed' && b.y <= Y2 + 2 && s.t < T.tube + DROP.over) {
          const w = DROP.slow + (DROP.firm - DROP.slow) * smooth(Math.max(0, Math.min(1, (s.t - T.tube - DROP.hold) / DROP.ramp)))
          s.sv += (w * w * (to.scroll - s.scroll) - 2 * w * s.sv) * dt
          s.scroll += s.sv * dt
          if (s.fall) {
            s.fall[4] = s.fall[4]! + (w * w * (Math.max(0, Math.min(lastScroll, px(b.y) - 540)) - s.fall[3]!) - 2 * w * s.fall[4]!) * dt
            s.fall[3] = s.fall[3]! + s.fall[4]! * dt
          }
        } else {
          if (s.fall) delete s.fall
          s.sv = 0
          s.scroll += Math.max(-cap, Math.min(cap, (to.scroll - s.scroll) * rate))
        }
        s.floor += (to.floor - s.floor) * rate
        if (Math.abs(to.scroll - s.scroll) < 0.01) s.scroll = to.scroll
      }
    },
    save() {
      return { s: { ...s, said: [...s.said] }, m: machine().save() }
    },
    load(state) {
      const x = state as { s: State; m: MachineState }
      s = { ...x.s, said: [...x.s.said] }
      machine().load(x.m)
    },
    draw(out: DrawList) {
      const mc = machine()
      const states = activeStates()
      const over: Record<string, Partial<Shape>> = s.pressed ? { ...stood, 'go-cap': { z1: config.scale.heights.button - config.scale.heights.keyTravel } } : { ...stood }
      if (s.phase === 'result' && s.result < RISE.seconds) {
        const t = s.result / RISE.seconds
        const a = Math.min(1, t / (1 - RISE.settle))
        const back = Math.max(0, (t - (1 - RISE.settle)) / RISE.settle)
        const u = a * a * (3 - 2 * a)
        const past = RISE.over * (t < 1 - RISE.settle ? u * u : (1 - back) * (1 - back) * Math.cos(Math.PI * back))
        const step = (z: number): number => Math.max(RISE.grain, Math.round(z / RISE.grain) * RISE.grain)
        const card = step(RISE.low + (config.scale.heights.card - RISE.low) * u + past)
        const cap = step(RISE.low + (config.scale.heights.button - RISE.low) * u + past)
        over.result = { z1: card }
        for (const id of ['result-title', 'result-body']) over[id] = { z0: card + RISE.proud, z1: card + RISE.proud }
        if (!s.pressed) {
          over['go-cap'] = { z1: cap }
          over['go-label'] = { z0: cap, z1: cap }
        }
      }
      for (const m of MODES) {
        if (!states.includes(`mode${m.mode}`)) continue
        over[`display.${TIERS[m.tier]!}.${m.mode}`] = { v: [s.t - m.at] }
        if (s.t < m.at + NAME) states.push(`name${m.mode}`)
      }
      const changed = { v: [Math.min(9, s.t - s.scoreAt), s.scoreWas] }
      for (const id of ['marquee-score', ...TIERS.map((z) => `display.${z}.score`)]) over[id] = { ...over[id], ...changed }
      drawLayout(out, layout, { states, runtime: { score: scoreText() }, over })
      if (s.mode === 'live' && s.phase === 'sealed' && !s.flipped && s.t >= T.onTable && s.t < T.onTable + HINT) out.push({ id: 'display.hint', part: 'displays', kind: 'box', x: px(MID), y: px(MARQUEE_Y), w: 0, h: 0, z0: 0, z1: 0, tone: 'dark', v: [s.t - T.onTable] })
      const ago = (at: number): number => (at < 0 ? 9 : Math.min(9, s.t - at))
      const rings: Record<string, number> = { 'loader.ring': Math.min(ago(s.took), ago(s.latch)), 'outlet.ring': ago(s.home) }
      const gone = s.fall ? (s.fall[1]! - 1) * STEP - FALL.ring : -1
      const since = s.fall ? (s.fall[1]! - 1) * STEP : -1
      const struck = s.fall ? [since - FALL.still - FALL.top, since - BEND.second / s.fall[2]!] : [-1, -1]
      const knock = struck.some((t) => t >= 0 && t < KNOCK.over)
      for (const shape of fixedShapes()) out.push(shape.id in rings ? { ...shape, v: shape.id === 'loader.ring' && knock ? [rings[shape.id]!, gone >= 0 && gone < LET.over ? gone : 9, ...struck] : shape.id === 'loader.ring' && gone >= 0 && gone < LET.over ? [rings[shape.id]!, gone] : [rings[shape.id]!] } : shape)
      const shell = s.phase === 'sealed' && s.home >= 0 ? [Math.max(0, 1 - s.opened / SHELL.open), 9, 0, 0, 0, 9] : [shutOf(ago(s.took) / SHELL.shut), Math.max(0, ago(s.took) - SHELL.shut), 0, s.blow[0]!, s.blow[1]!, Math.min(9, s.t - s.blow[2]!), ...(ago(s.took) < SHELL.shut ? [1] : [])]
      const lies = seen3()
      for (const shape of movingShapes(mc, lit(), false, general(), drawn(), s.shut, website())) out.push(shape.id === 'ball.clear' ? { ...shape, x: px(lies.x - 0.5), y: px(lies.y - 0.5), z0: px(lies.z), z1: px(lies.z) + BALL, v: shell } : shape)
      for (const shape of strikeShapes(s.fx, s.t)) out.push(shape)
      const counts = (s as Rolled).over
      if (counts) for (const shape of out) if (shape.id in counts) shape.v = [shape.v?.[0] ?? 0, counts[shape.id]!]
      out.push(hqPlate)
    },
    scroll: () => viewed(),
    view: () => (s.floor === 0 ? null : follow()),
    camera(name: string, time: number): CameraPose | null {
      return name === 'film' ? filmPose(time) : named(name)
    },
    script(time: number): Pointer {
      const flipLeft = held('L', time)
      const flipRight = held('R', time)
      if (time < T.streetBy) {
        const u = smooth(Math.min(1, Math.max(0, (time - TURN_HALF - 0.1) / 1.2)))
        const v = time < LOADER.by ? Math.min(u, LOADER.short) : u
        return { x: HANDOFF.x + (port.x - 40 - HANDOFF.x) * v, y: HANDOFF.y + (port.y + 30 - HANDOFF.y) * v, down: false, flipLeft, flipRight }
      }
      const u = smooth(Math.min(1, Math.max(0, (time - (T.press - 1.2)) / 0.9)))
      const from = { x: outlet.x, y: outlet.y - lastScroll }
      return { x: from.x + (go.cx - from.x) * u, y: from.y + (go.cy - lastScroll - from.y) * u, down: time >= T.press && time < T.press + 0.2 }
    },
    hint(): Hint | null {
      if (s.phase === 'wait' || s.phase === 'pull') return { x: port.x, y: port.y, down: false }
      if (s.phase === 'sealed') {
        const b = ball()
        const held = gagAt(s.t) === 'pinball.save' && !s.saved && s.t < T.save
        const want = machine().shot && b.mode === 'plane' && !machine().gate[b.tier] && !held ? machine().wants(s.t >= T.scoopKick && s.t < T.highwayEnd ? RIDE.tip : 1.2) : [false, false]
        return { x: px(MID), y: px(TIER_Y[b.mode === 'none' ? 2 : Math.min(2, b.tier)]! + 10), down: false, flipLeft: want[0], flipRight: want[1] }
      }
      return { x: go.cx, y: go.cy, down: s.phase === 'result' && Math.floor(s.time * 4) % 2 === 0 }
    },
    skip() {
      if (s.skipped) return
      s.skipped = true
      if (s.phase === 'sealed') {
        const mc = machine()
        for (let i = 1; i < mc.balls.length; i++) mc.remove(i)
        s.t = Math.max(s.t, T.streetBy)
        mc.gate = [true, true, true]
        mc.ride(0, 'drain')
      }
    },
    done: () => s.done,
    gag: () => gagAt(s.t),
    ignoring: () => machine().cut || machine().own.some((n) => n > 0),
    states: () => activeStates(),
    tableState(): TableState {
      const mc = machine()
      return {
        tiers: TIERS.map((id, k) => {
          const d = table.displays[k]!
          const standing = table.models.filter((x) => x.tier === k && x.standing).length + table.posts.filter((x) => x.tier === k).length + table.bumpers.filter((x) => x.tier === k).length + table.slings.filter((x) => x.tier === k).length +
            table.flippers.filter((x) => x.tier === k).length + table.targets.filter((x) => x.tier === k && (x.kind !== 'drop' || !mc.down[x.index])).length
          return { id, standingParts: standing, inserts: table.inserts.filter((x) => x.tier === k).length, dropTargets: table.targets.filter((x) => x.tier === k && x.kind === 'drop').length, display: { box: d.box.map((v) => px(v)), charPx: 16 } }
        }),
        openings: table.openings.map((o) => ({ id: o.id, tier: TIERS[o.tier]!, clearBalls: Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]) })),
        rails: table.rails.map((r) => ({ id: r.id, from: r.from, to: r.to })),
        holds: table.holds.map((h) => ({ id: h.id, releases: h.releases })),
        sealed: [...table.sealed]
      }
    },
    colliders(): Collider[] {
      const mc = machine()
      const out: Collider[] = []
      const add = (id: string, kind: Collider['kind'], tier: number, points: number[], o: { r?: number; closed?: boolean; z?: number } = {}): void => {
        const on = Math.min(2, Math.max(0, tier))
        const c: Collider = { id, kind, tier: TIERS[tier] ?? 'machine', points: points.map((v) => px(v)), z: o.z ?? px(floorZ(on)) }
        if (o.r !== undefined) c.r = px(o.r)
        if (o.closed) c.closed = true
        out.push(c)
      }
      const corners = (b: number[]): number[] => [b[0]!, b[1]!, b[0]! + b[2]!, b[1]!, b[0]! + b[2]!, b[1]! + b[3]!, b[0]!, b[1]! + b[3]!]
      for (const g of table.segs) add(g.id, 'wall', g.tier, [...g.a, ...g.b])
      for (const p of table.posts) add(p.id, 'post', p.tier, [...p.c], { r: p.r })
      for (const b of table.bumpers) add(b.id, 'bumper', b.tier, [...b.c], { r: b.r })
      for (const g of table.slings) add(g.id, 'sling', g.tier, [...g.a, ...g.b, ...g.c], { closed: true })
      for (const m of table.models) if (m.solid) solids(m).forEach((q, n) => add(n ? `${m.id}.${n + 1}` : m.id, 'model', m.tier, m.round ? [m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2] : corners(q), m.round ? { r: m.box[2] / 2 } : { closed: true }))
      for (const t of table.targets) if (t.kind !== 'drop' || !mc.down[t.index]) add(t.id, 'target', t.tier, corners(t.box), { closed: true })
      for (const f of table.flippers) {
        const a = (mc.flipperAngle(f.side) * Math.PI) / 180
        const dir = f.side === 'left' ? 1 : -1
        const d = [dir * Math.cos(a), Math.sin(a)]
        const tip = [f.pivot[0] + d[0]! * FLIP_REACH, f.pivot[1] + d[1]! * FLIP_REACH]
        const side = (c: number[], r: number, k: number): number[] => [c[0]! - d[1]! * r * k, c[1]! + d[0]! * r * k]
        add(f.id, 'flipper', f.tier, [...side(f.pivot, FLIP.radius, -1), ...side(tip, FLIP.tip, -1), ...side(tip, FLIP.tip, 1), ...side(f.pivot, FLIP.radius, 1)], { closed: true })
        add(`${f.id}.pivot`, 'flipper', f.tier, [...f.pivot], { r: FLIP.radius })
        add(`${f.id}.tip`, 'flipper', f.tier, tip, { r: FLIP.tip })
      }
      for (const h of table.holds) add(h.id, 'hold', h.tier, [...h.c], { r: h.r })
      for (const o of table.openings) add(o.id, 'opening', o.tier, [...o.a, ...o.b])
      for (const r of table.rails) add(r.id, 'rail', tierAt(r.points[0]![1]), r.points.flatMap((q) => [q[0], q[1]]), { z: px(r.points.reduce((sum, q) => sum + q[2], 0) / r.points.length) })
      mc.balls.forEach((b, i) => {
        if (b.mode !== 'none') add(i === 0 ? 'ball.clear' : `ball.steel.${i}`, 'body', b.tier, [b.x, b.y], { r: 0.5, z: px(b.z) })
      })
      return out
    },
    sheet(id: string): SheetFrame | null {
      if (id === 'clear-ball') {
        const mc = machine()
        const list: DrawList = []
        drawLayout(list, layout, { states: ['play', 'on', 'mode0', 'score0', 'score2'], runtime: { score: scoreText() }, over: stood })
        for (const shape of fixedShapes()) list.push(shape)
        for (const shape of movingShapes(mc, table.inserts.map(() => true), true, [true, true, true], 0, false, DUSK)) list.push(shape)
        const bat = table.flippers.find((x) => x.tier === 2 && x.side === 'left')!.pivot
        const cup = table.bumpers.filter((x) => x.tier === 1).reduce((p, q) => (q.c[1] > p.c[1] ? q : p))
        const lean = (FLIP.rest * Math.PI) / 180
        const rest = { x: bat[0] + SHEET.along * Math.cos(lean) + (0.46 + FLIP.radius) * Math.sin(lean), y: bat[1] + SHEET.along * Math.sin(lean) - (0.46 + FLIP.radius) * Math.cos(lean) }
        const side = [Math.cos(SHEET.side), Math.sin(SHEET.side)]
        const hit = { x: cup.c[0] + (cup.r + SHEET.gap) * side[0]!, y: cup.c[1] + (cup.r + SHEET.gap) * side[1]! }
        const spots: { x: number; y: number; f: number; lift: number; v: number[]; pose: Partial<CursorPose> }[] = [
          { x: rest.x, y: rest.y, f: px(floorZ(2)), lift: 0, v: [1, 9, 1, 0, 0, 9], pose: { acting: 'nervous' } },
          { x: MID + SHEET.fly[0]!, y: Y2 + SHEET.fly[1]!, f: px(floorZ(2)), lift: SHEET.fly[2]!, v: [1, 9, 0, 0, 0, 9], pose: { acting: 'scared', lean: 0.3 } },
          { x: hit.x, y: hit.y, f: px(floorZ(1)), lift: 0, v: [1, 9, 0, SHEET.press, Math.atan2(-side[1]!, -side[0]!), 0], pose: { acting: 'scared', reaction: 'recoil', reactionAt: 0.5 } }
        ]
        const seen = (p: (typeof spots)[number]): CameraPose => {
          const c: [number, number, number] = [p.x, p.y, p.f / BALL + p.lift + 0.5]
          return { ...look('home', [c[0]! + SHEET.from[0]! * SHEET.far, c[1]! + SHEET.from[1]! * SHEET.far, c[2]! + SHEET.from[2]! * SHEET.far], c), focus: px(SHEET.far), aperture: SHEET.open }
        }
        const seat = (p: (typeof spots)[number], view: CameraPose, wall: number[] | null): CursorPose => {
          const at = restPose(px(p.x), px(p.y), { z: p.f + px(p.lift), inBall: true, taken: true, ...p.pose })
          const c = toWorld(px(p.x), px(p.y), p.f + px(p.lift) + BALL / 2)
          const d = Math.hypot(view.eye[0] - c[0], view.eye[1] - c[1], view.eye[2] - c[2]) || 1
          const e = [(view.eye[0] - c[0]) / d, (view.eye[1] - c[1]) / d, (view.eye[2] - c[2]) / d]
          const n = wall ? [e[0]! * FACE.lens - wall[0]! * FACE.wall, e[1]! * FACE.lens - wall[1]! * FACE.wall, Math.max(0.2, e[2]!) * FACE.lens] : [e[0]! * FACE.turn, e[1]! * FACE.turn, 1 - FACE.turn + e[2]! * FACE.turn]
          const len = Math.hypot(n[0]!, n[1]!, n[2]!) || 1
          for (let i = 0; i < 3; i++) n[i] = n[i]! / len
          at.squash = Math.min(1, at.feel.stretch + (wall ? 0.1 : 0))
          at.lean = p.pose.lean ?? at.feel.lean
          const room = berth(at, at.lean, at.spin, at.squash, n, wall ? FACE.press : FACE.back, 0)
          return { ...at, x: at.x + room.x, y: at.y - room.y, z: at.z + room.z, face: { x: n[0]!, y: n[1]!, z: n[2]!, back: room.back } }
        }
        const wall = (i: number): number[] | null => (i === 2 ? [side[0]!, -side[1]!] : null)
        spots.forEach((p, i) => list.push({ id: `sheet-ball-${i + 1}`, part: 'clear-ball', kind: 'ball', x: px(p.x - 0.5), y: px(p.y - 0.5), w: BALL, h: BALL, z0: p.f + px(p.lift), z1: p.f + px(p.lift) + BALL, tone: 'glass', v: p.v }))
        const views = spots.map(seen)
        return { list, cursors: spots.map((p, i) => seat(p, views[0]!, wall(i))), view: views[0]!, panels: spots.map((p, i) => ({ cursors: [seat(p, views[i]!, wall(i))], view: views[i]! })), gutter: 21 }
      }
      if (id !== 'table-map') return null
      const mc = machine()
      const list: DrawList = []
      drawLayout(list, layout, { states: ['play', 'on', 'score0', 'score1', 'score2'], runtime: { score: scoreText() }, over: stood })
      for (const shape of fixedShapes()) list.push(shape)
      const tall = (1920 * 1920) / 1080
      const top = px(Y0 - 0.35)
      for (const shape of movingShapes(mc, table.inserts.map(() => true), true, [true, true, true], 0, false, DUSK)) list.push(shape)
      const inside = list.filter((x) => !x.id.startsWith('rail.') || (x.y >= top && x.y + x.h <= top + tall))
      list.length = 0
      for (const shape of inside) list.push(shape)
      const f = fov('table-map')
      const c = toWorld(px(MID), top + tall / 2, 0)
      const need = tall
      return { list, cursors: [], view: { eye: [c[0], c[1], need / 2 / Math.tan((f * Math.PI) / 360)], target: c, fov: f }, width: 1080, height: 1920 }
    }
  }
  return logic
}
