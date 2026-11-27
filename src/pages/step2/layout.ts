import { config } from '../../config'
import type { LayoutNode } from '../../copy'
import { find, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, HEADER, page, PAGE_W, RIGHT, SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { registerData, words } from '../../shell/words'
import legends from './legends.json'

registerData('step2', legends)

const sizes = config.scale.sizes
const heights = config.scale.heights

export const ROWS = ['phone', 'birth', 'volume'] as const
export type RowName = (typeof ROWS)[number]

export const FW = 1100
export const FX = (PAGE_W - FW) / 2
export const FH = sizes.field
export const HEAD_Y = HEADER.contentY + 12
export const ROW_Y = HEAD_Y + 84
export const TRAY_GAP = 12
export const TRAY_H = 448
export const TRAY_R = 18
// A tray's liner, in page pixels, and the shade its wall lays on its floor.
export const TRAY = { sink: 0.5, joint: 0.3, jointDeep: 0.7, rim: 3.4, lean: 0.3, cove: 2, rimShade: 0.66, wallShade: 0.36, wallShadeTop: 0.2, wallFoot: 0.2, wallFootTop: 0.04, cool: 0.12, soakOver: 0.5,
  floor: { soak: 0.4, hold: 0.2, reach: 13, bounce: 0.16, bounceReach: 24, base: 1.28, side: 0.8, far: 0.4, farReach: 120, warm: 0.035 },
  soak: { soak: 0.62, hold: 1, reach: 15, bounce: 0.05, bounceReach: 20, base: 0.94, side: 0.8, cool: 0.14 } }
export const COIN = { r: 13, wall: 14, clear: 0.3, fall: 2600, spring: 0.38, least: 150, hops: 2, rows: 2, roll: 150, pitch: 23, stack: 1.4 }
// One field stands on the page at a time. The one that is done leaves to the left by this much and the next comes in from the right.
export const FIELDS = 3
export const SLIDE = { far: 1560, long: 0.42, hold: 0.7, filmHold: 0 }
export const TRAY_Z = heights.machineTray
export const TOP = heights.machineMinTop
export const PAD = 24
export const VALUE_Z = heights.field
export const STOP_Z = 16
export const SIGN_Z = 22

export const rowY = (_i = 0): number => ROW_Y
export const trayY = (_i = 0): number => ROW_Y + FH + TRAY_GAP
export const PROMPT_Y = trayY() + 30
// The lowest band of the page is kept for the spoken words: the footnote stands above it, under the stage.
export const BAND = 150
export const NOTE_Y = trayY() + 10

// Each machine is laid out and run at the size it was built, on a stage of its own, and drawn `times` larger about the stage's upper left corner, `up` px higher on the page.
// A machine stands on the bare page: the floor it was built on (`machineTray`) is the page's face.
export const STAGE = { times: [1.5, 1.4, 1.25], up: 60 }
export const SW = (i: number): number => FW / STAGE.times[i]!
export const SH = (i: number): number => TRAY_H / STAGE.times[i]!
const TRAY_FLOOR = heights.machineTray
const HOVER = heights.cursorHover
export interface Scale { k: number; x: (x: number) => number; y: (y: number) => number; z: (z: number) => number; ground: (z: number) => number; air: (z: number) => number; backX: (x: number) => number; backY: (y: number) => number; backAir: (z: number) => number }
// From a stage to the page and back. A part's height grows from the floor it was built on, which is the page's face. The arrow's height grows from where it hovers, and joins the parts' heights a little above that, so it stands as far over a larger part as over the built one.
export function scaleOf(i: number): Scale {
  const k = STAGE.times[i]!
  const ty = trayY(i)
  const oy = ty - STAGE.up
  const join = 2 * (k * (HOVER - TRAY_FLOOR) - HOVER)
  const z = (v: number): number => (v - TRAY_FLOOR) * k
  return {
    k,
    x: (x) => FX + (x - FX) * k,
    y: (y) => oy + (y - ty) * k,
    z,
    ground: (v) => (v <= 0 ? v : k * v + z(0) * Math.min(1, v / -TRAY_FLOOR)),
    air: (v) => (v <= HOVER ? v : v < HOVER + join ? HOVER + (v - HOVER) * (k + 0.5) : z(v)),
    backX: (x) => FX + (x - FX) / k,
    backY: (y) => ty + (y - oy) / k,
    backAir: (v) => (v <= HOVER ? v : v < HOVER + join * (k + 0.5) ? HOVER + (v - HOVER) / (k + 0.5) : TRAY_FLOOR + v / k)
  }
}

const DEG = Math.PI / 180

export const DIAL = {
  r: 100, ring: 70, hole: 15, stop: 30 * DEG, first: -30 * DEG, pitch: 30 * DEG,
  cx: FX + SW(0) / 2, cy: trayY(0) + 172,
  holeAngle: (k: number): number => -30 * DEG - 30 * DEG * (k - 1),
  travel: (k: number): number => 60 * DEG + 30 * DEG * (k - 1),
  digit: (k: number): string => String(k % 10)
}

// The dial's body, in page pixels: how tall it stands on the tray's floor, how much of it shows before it has risen, and its turned steps.
export const DIAL_BODY = {
  tall: TOP + 2 - TRAY_Z, rest: 1.6, plateLeast: 0.4, below: 2, plate: 6.6, bezel: 5.5, bezelDrop: 0.8, bezelChamfer: 2, bezelSlope: 0.9, wheel: 92.9, thick: 5.2, chamfer: 1, holeRim: 0.8, holeChamfer: 2.6,
  hub: 30, hubTall: 14, hubFlat: 0.018, hubCoat: 0.13, hubRough: 0.42, hubIor: 1.5, hubEnv: 0.75, hubGrain: 0.25, hubFoot: 3.4, hubStep: 3.2, hubShoulder: 0.5, hubCrown: 0.55, hubSeat: 3, hubSeatDeep: 1.8, turned: 256, cut: 0.012, faceRough: 0.27, faceStretch: 1, faceLight: 1.5,
  housingDark: 1.18, housingRough: 0.46, seat: 10, seatDark: 0.92, seatGap: 0.7, seatTall: 10, seatSlope: 1, stopIn: 69, stopOut: 112, stopWide: 19, stopTip: 7, stopClear: 2.4, stopTall: 3, stopFoot: 12, stopDark: 0.62,
  inner: 49, innerTall: 0.35, innerSeam: 0.5, innerRing: 2.4, innerRingTall: 1.1, innerTone: 0xdcdad3, innerRough: 0.55, footLine: 0.5,
  grooveOver: 0.15, grooveUnder: 4.2, fanAxis: 0.2, fanLow: 0.78, fanGain: 0.5, fanSharp: 1.6,
  glint: 0.5, glintLong: 13, glintWide: 10, glintOut: 9, glintUp: 17.3,
  shade: 0.6, shadeReach: 0.78, cast: 0.8, castIn: 8, castOut: 46, castAway: 42, castOver: 0.2
}

// How far the top of the dial's wheel stands above the tray's floor when the machine has risen by `lift` (0 to 1). Before it rises it lies in the tray's floor, its wheel under the floor of a field, its hub and its stop drawn down into it.
export const dialTop = (lift: number): number => Math.max(DIAL_BODY.rest, DIAL_BODY.tall * lift)
// How far the numeral plate stands above the tray's floor under a wheel whose top stands at `top`: it never sinks into the floor.
export const dialPlate = (top: number): number => Math.max(DIAL_BODY.plateLeast, top - DIAL_BODY.plate)

const sy = trayY(1) + 40
const sx = FX + (SW(1) - 392) / 2
export const SLOT = {
  x: sx, y: sy + PAD, w: 336, h: 150,
  reelW: 92, reelH: 106, reelGap: 12,
  reelX: (r: number): number => sx + 18 + r * (92 + 12),
  reelY: sy + PAD + 22,
  leverX: sx + 336 + 34, knobY: sy + PAD + 18, pull: 126, knob: 44, pivotY: sy + PAD + 58,
  payX: sx + 60, payY: sy + PAD + 150 + 8, payW: 216, payH: 22,
  strips: [Object.keys(legends.months).sort(), Object.keys(legends.days).sort(), Object.keys(legends.years).sort()] as string[][],
  names: ['months', 'days', 'years'] as const,
  film: ['07', '23', '1991'],
  stopY: sy + PAD + 150 + 42, stopH: 48,
  // How many legends a second each reel turns, and how many legends before the visitor's own each reel starts.
  speed: [2.5, 3.125, 3.85], lead: [3, 7, 13]
}

const cy = trayY(2)
export const CRANK = {
  hx: FX + 200, hy: cy + SH(2) / 2, rest: -0.75, arm: 128, armW: 23, gripW: 90, gripH: 52, tip: 136, hold: 8, holdAside: 6, base: 110, hub: 44,
  segW: 34, segH: 124, segGap: 13, segX: FX + 388, segY: cy + 204,
  signY: cy + 36, signH: 140
}

// The sheet of the machines: the page's header, and each machine under its label at the size the approved sheet shows it.
export const SHEET = {
  labelY: 355, labelX: [128, 739, 1384],
  dial: { x: 373, y: 656, times: 2.2 }, slot: { x: 735, y: 510, times: 1.52 }, crank: { x: 1584, y: 669, times: 1.94, turn: 0.9 }, meter: { x: 1448, y: 432, times: 0.75, level: 0.4 },
  cursor: { x: 613, y: 899 }
}
export function sheetScale(id: string): number {
  if (!id.startsWith('sheet-')) return id.startsWith('meter-') || id.startsWith('crank-') ? STAGE.times[2]! : id.startsWith('dial-') ? STAGE.times[0]! : STAGE.times[1]!
  if (id.includes('meter-')) return SHEET.meter.times
  if (id.includes('dial-')) return SHEET.dial.times
  if (id.includes('crank-')) return SHEET.crank.times
  return SHEET.slot.times
}

export const ROW_TITLE = { font: 'inter-600', px: 26 }
export const ROW_HELPER = { font: 'inter-400', px: 20 }
export const REEL_TYPE = { font: 'inter-600', px: 48, align: 'centre' as const }
export const YEAR_TYPE = { font: 'inter-600', px: 34, align: 'centre' as const }
export const reelType = (r: number): typeof REEL_TYPE => (r === 2 ? YEAR_TYPE : REEL_TYPE)
export const DIAL_TYPE = { font: 'inter-600', px: 22, align: 'centre' as const }

export const reelId = (r: number, legend: string): string => `reel-${r}-${legend}`

export const STOP_TYPE = { font: 'inter-600', px: 20, align: 'centre' as const }
export const SIGN_TYPE = { font: 'inter-600', px: 56, align: 'centre' as const }
export const PROMPT_TYPE = { ...TYPE.body, align: 'centre' as const }
export const stopId = (r: number): string => `slot-stop-${r}`
// What a field would hold while its machine is out stands on the bare page over the machine, as a line of type.
export const PLATE_TYPE = { font: 'inter-600', px: 34, align: 'centre' as const }
export const PLATE_Y = ROW_Y - 14
// The openings of the page: the phone's round one and the slot machine's hatch, in page pixels, and how deep they go.
export const HOLE = { deep: 64, flush: 2, iris: 208, seat: 112, hatch: 16, hatchR: 14 }

const centred = (id: string, key: string, state: string, i: number): LayoutNode => text(id, key, PROMPT_TYPE, FX + SW(i) / 2, PROMPT_Y, { part: 'type', on: TRAY_Z, states: [state] })

function rowNodes(i: number): LayoutNode[] {
  const name = ROWS[i]!
  const y = rowY(i)
  const capY = y + (FH - block(TYPE.value.font, 'X', TYPE.value.px).cap) / 2
  const value = (suffix: string, key: string, cond: string, soft: boolean): LayoutNode =>
    text(`${name}-${suffix}`, key, { ...TYPE.value, wrap: FW - 116, ...(soft ? { ink: 'soft' } : {}) }, FX + PAD, capY, { part: 'type', on: VALUE_Z, states: [`${name}-${cond}`] })
  const values: LayoutNode[] = []
  if (name === 'birth') values.push(value('ask', 'copy:drafts.step2.birth.placeholder', 'ask', true), value('typed', 'runtime:step2.birth', 'typing', false))
  const chevron = node(`${name}-chevron`, 'chevron', [FX + FW - PAD - 28, y + (FH - 28) / 2, 28, 28], { part: 'rows', shape: 'none' })
  const here = { states: [`${name}-here`] }
  return [
    text(`${name}-label`, `copy:step2.rows.${name}.label`, ROW_TITLE, FX, HEAD_Y + 6, { part: 'type', ...here }),
    text(`${name}-helper`, `copy:step2.rows.${name}.helper`, ROW_HELPER, FX, HEAD_Y + 42, { part: 'type', ...here }),
    node(`${name}-pocket`, 'field', [FX, y, FW, FH], { part: 'rows', r: 14, children: name === 'birth' ? values : [...values, chevron], ...here })
  ]
}

// The lines of a machine on the bare page: what is being set, and what the form made of it.
function plateNodes(i: number): LayoutNode[] {
  const name = ROWS[i]!
  const line = (suffix: string, key: string, cond: string): LayoutNode => text(`${name}-plate-${suffix}`, key, PLATE_TYPE, PAGE_W / 2, PLATE_Y, { part: 'type', states: [`${name}-plate-${cond}`] })
  const out = [line('typed', `runtime:step2.${name}`, 'typing')]
  if (name === 'phone') out.push(line('value', 'copy:step2.rows.phone.gaveUp', 'done'))
  if (name === 'birth') out.push(line('value', 'copy:step2.rows.birth.recorded', 'done'), line('missed', 'copy:drafts.step2.birth.missed', 'missed'))
  if (name === 'volume') out.push(line('value', 'copy:step2.rows.volume.done', 'done'))
  return out
}

function dialNodes(): LayoutNode[] {
  const d = DIAL
  const cap = block(DIAL_TYPE.font, '0', DIAL_TYPE.px).cap
  const numerals: LayoutNode[] = []
  for (let k = 1; k <= 10; k++) {
    const a = d.holeAngle(k)
    numerals.push(text(`dial-numeral-${d.digit(k)}`, `data:step2.dial.${d.digit(k)}`, DIAL_TYPE, d.cx + d.ring * Math.cos(a), d.cy + d.ring * Math.sin(a) - cap / 2, { part: 'type', on: TOP + 2 - DIAL_BODY.plate }))
  }
  const centre = node('dial-centre', 'dialCentre', [d.cx - 30, d.cy - 30, 60, 60], { part: 'dial', shape: 'disc', height: TOP + 16, floor: TOP + 2, tone: 'accent', mechanism: true })
  const wheel = node('dial-wheel', 'dialWheel', [d.cx - d.r, d.cy - d.r, d.r * 2, d.r * 2], { part: 'dial', shape: 'disc', height: TOP + 2, floor: TRAY_Z, tone: 'metal', mechanism: true, children: [...numerals, centre] })
  return [wheel, centred('dial-prompt', 'copy:step2.rows.phone.panel', 'phone-panel', 0)]
}

function slotNodes(): LayoutNode[] {
  const s = SLOT
  const reels: LayoutNode[] = []
  const stops: LayoutNode[] = []
  for (let r = 0; r < 3; r++) {
    const type = reelType(r)
    const cap = block(type.font, '0', type.px).cap
    const marks = s.strips[r]!.map((legend) =>
      text(reelId(r, legend), `data:step2.${s.names[r]}.${legend}`, type, s.reelX(r) + s.reelW / 2, s.reelY + (s.reelH - cap) / 2, { part: 'slot', on: TOP + 14, states: [reelId(r, legend)] }))
    reels.push(node(`slot-reel-${r}`, 'slotReel', [s.reelX(r), s.reelY, s.reelW, s.reelH], { part: 'slot', height: TOP + 14, floor: TOP + 10, tone: 'paper', r: 6, children: marks }))
    const label = text(`${stopId(r)}-label`, 'copy:drafts.step2.birth.stop', STOP_TYPE, s.reelX(r) + s.reelW / 2, s.stopY + (s.stopH - block(STOP_TYPE.font, 'X', STOP_TYPE.px).cap) / 2, { part: 'type', on: STOP_Z, tone: 'inkLight' })
    stops.push(node(stopId(r), 'button', [s.reelX(r), s.stopY, s.reelW, s.stopH], { part: 'rows', shape: 'capsule', height: STOP_Z, floor: TRAY_Z, tone: 'accent', children: [label] }))
  }
  const window = node('slot-window', 'slotWindow', [s.x + 10, s.y + 14, s.w - 20, s.h - 28], { part: 'slot', height: TOP + 10, floor: TOP + 8, tone: 'dark', r: 8, children: reels })
  const cabinet = node('slot-cabinet', 'slotCabinet', [s.x, s.y, s.w, s.h], { part: 'slot', height: TOP + 20, floor: TRAY_Z, tone: 'metal', r: 12, mechanism: true, children: [window] })
  const knob = node('slot-knob', 'slotKnob', [s.leverX - s.knob / 2, s.knobY - s.knob / 2, s.knob, s.knob], { part: 'slot', shape: 'disc', height: TOP + 40, floor: TOP + 12, tone: 'accent', mechanism: true })
  const payout = node('slot-payout', 'slotPayout', [s.payX, s.payY, s.payW, s.payH], { part: 'slot', height: 6, floor: TRAY_Z, tone: 'dark', r: 6 })
  return [cabinet, knob, payout, ...stops, centred('slot-prompt', 'copy:drafts.step2.birth.panel', 'birth-panel', 1)]
}

function crankNodes(): LayoutNode[] {
  const c = CRANK
  const base = node('crank-base', 'crankBase', [c.hx - c.base / 2, c.hy - c.base / 2, c.base, c.base], { part: 'crank', shape: 'disc', height: 18, floor: TRAY_Z, tone: 'metal' })
  const ax = c.hx + (c.arm / 2) * Math.cos(c.rest)
  const ay = c.hy + (c.arm / 2) * Math.sin(c.rest)
  const gx = c.hx + c.arm * Math.cos(c.rest)
  const gy = c.hy + c.arm * Math.sin(c.rest)
  const arm = node('crank-arm', 'crankArm', [ax - (c.arm + c.armW) / 2, ay - c.armW / 2, c.arm + c.armW, c.armW], { part: 'crank', shape: 'capsule', height: TOP + 6, floor: TOP - 4, tone: 'metal', mechanism: true, over: true })
  const hub = node('crank-hub', 'crankHub', [c.hx - c.hub / 2, c.hy - c.hub / 2, c.hub, c.hub], { part: 'crank', shape: 'disc', height: TOP + 10, floor: 18, tone: 'raised', mechanism: true, over: true })
  const grip = node('crank-grip', 'crankGrip', [gx - c.gripW / 2, gy - c.gripH / 2, c.gripW, c.gripH], { part: 'crank', shape: 'capsule', height: TOP + 30, floor: TOP + 6, tone: 'accent', mechanism: true, over: true })
  const segs: LayoutNode[] = []
  for (let k = 0; k < 10; k++) segs.push(node(`meter-${k + 1}`, 'meterSegment', [c.segX + k * (c.segW + c.segGap), c.segY, c.segW, c.segH], { part: 'crank', shape: 'capsule', height: 12, floor: TRAY_Z, tone: 'glass' }))
  const wide = 10 * c.segW + 9 * c.segGap
  const meter: LayoutNode = { id: 'meter', kind: 'row', box: [c.segX, c.segY, wide, c.segH], children: segs, flow: 'row', gap: c.segGap, part: 'crank' }
  const words = text('crank-sign-words', 'copy:drafts.step2.volume.sign', SIGN_TYPE, c.segX + wide / 2, c.signY + (c.signH - block(SIGN_TYPE.font, 'X', SIGN_TYPE.px).cap) / 2, { part: 'type', on: SIGN_Z, tone: 'inkLight' })
  const sign = node('crank-sign', 'sign', [c.segX, c.signY, wide, c.signH], { part: 'rows', height: SIGN_Z, floor: TRAY_Z, tone: 'accent', r: 16, children: [words] })
  return [base, arm, hub, grip, meter, sign]
}

export function buildLayout(): LayoutNode {
  const machines = [dialNodes(), slotNodes(), crankNodes()]
  const stages = ROWS.map((name, i): LayoutNode => ({ id: `${name}-stage`, kind: 'row', box: [FX, trayY(i), SW(i), SH(i)], children: machines[i]!, states: [`${name}-open`], part: 'rows' }))
  const holes = ROWS.slice(0, 2).map((name, i) => node(`${name}-hole`, 'machineTray', [PAGE_W / 2 - HOLE.iris, trayY(i), HOLE.iris * 2, HOLE.iris * 2], { part: 'rows', r: HOLE.iris, tone: 'glass', states: [`${name}-hole`] }))
  const plates = ROWS.flatMap((_, i) => plateNodes(i))
  const rows: LayoutNode[] = []
  for (let i = 0; i < 3; i++) rows.push(...rowNodes(i))
  const w = buttonWidth('copy:step2.continue')
  const by = SCREEN_H - 40 - sizes.button
  const go = button('continue', RIGHT - w, by, w, 'copy:step2.continue', { part: 'shell', tone: 'metal' })
  find(go, 'continue-label').tone = 'ink'
  const note = text('note', 'copy:step2.note', { ...ROW_HELPER, wrap: FW }, FX, NOTE_Y, { part: 'type', states: ['note'] })
  return page('step2', SCREEN_H, [...stepHead(2), ...rows, ...holes, ...stages, ...plates, note, go])
}

// What the page shows: which fields stand on it (none while a machine is out), which machine is out, which has the page open under it, and the line over it: '' for none, or 'typing', 'done', 'missed'. `value` is what the date's field holds: 'ask' or 'typing'.
export interface StateView { here: number[]; open: number; hole: number; panel: boolean; plate: string[]; value: string; note: boolean; settled: string[] | null }

export function statesOf(v: StateView): string[] {
  const out: string[] = []
  if (v.note) out.push('note')
  for (const i of v.here) {
    out.push(`${ROWS[i]}-here`)
    if (i === 1) out.push(`birth-${v.value}`)
  }
  v.plate.forEach((p, i) => {
    if (p) out.push(`${ROWS[i]}-plate-${p}`)
  })
  if (v.hole >= 0) out.push(`${ROWS[v.hole]}-hole`)
  if (v.open >= 0) {
    out.push(`${ROWS[v.open]}-open`)
    if (v.panel) out.push(`${ROWS[v.open]}-panel`)
    if (v.open === 1 && v.settled) v.settled.forEach((legend, r) => out.push(reelId(r, legend)))
  }
  return out
}

export function pruned(tree: LayoutNode, states: string[]): LayoutNode {
  const keep = (n: LayoutNode): LayoutNode | null => {
    if (n.states && !n.states.some((s) => states.includes(s))) return null
    const { states: _drop, children, ...rest } = n
    void _drop
    const kids = (children ?? []).map(keep).filter((c): c is LayoutNode => c !== null)
    return children ? { ...rest, children: kids } : rest
  }
  return keep(tree)!
}
