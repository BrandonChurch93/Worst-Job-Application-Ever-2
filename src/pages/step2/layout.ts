import { config } from '../../config'
import type { LayoutNode } from '../../copy'
import { find, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, HEADER, LEFT, page, RIGHT, SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { registerData, words } from '../../shell/words'
import legends from './legends.json'

registerData('step2', legends)

const sizes = config.scale.sizes
const heights = config.scale.heights

export const ROWS = ['phone', 'birth', 'volume'] as const
export type RowName = (typeof ROWS)[number]

export const FX = 1000
export const FW = RIGHT - FX
export const FH = sizes.field
export const ROW_Y = HEADER.contentY
export const PITCH = 144
export const TRAY_GAP = 12
export const TRAY_H = 250
export const TRAY_R = 18
// A tray's liner, in page pixels, and the shade its wall lays on its floor.
export const TRAY = { sink: 0.5, joint: 0.3, jointDeep: 0.7, rim: 6.5, lean: 1.25, rimShade: 0.8, wallShade: 0.5, wallShadeTop: 0.22, wallFoot: 0.36, wallFootTop: 0.05, cool: 0.12, soakOver: 0.5,
  floor: { soak: 0.3, hold: 0.2, reach: 20, bounce: 0.12, bounceReach: 9, base: 1, side: 0.8 },
  soak: { soak: 0.88, hold: 1, reach: 10, bounce: 0.16, bounceReach: 12, base: 0.76, side: 0.8, cool: 0.14 } }
export const SHIFT = TRAY_H + TRAY_GAP
export const TRAY_Z = heights.machineTray
export const TOP = heights.machineMinTop
export const PAD = 24
export const VALUE_Z = heights.field

export const rowY = (i: number, low = false): number => ROW_Y + i * PITCH + (low ? SHIFT : 0)
export const trayY = (i: number): number => rowY(i) + FH + TRAY_GAP

const DEG = Math.PI / 180

export const DIAL = {
  r: 100, ring: 66, hole: 15, stop: 30 * DEG, first: -30 * DEG, pitch: 30 * DEG,
  cx: FX + PAD + 136, cy: trayY(0) + TRAY_H / 2,
  holeAngle: (k: number): number => -30 * DEG - 30 * DEG * (k - 1),
  travel: (k: number): number => 60 * DEG + 30 * DEG * (k - 1),
  digit: (k: number): string => String(k % 10)
}

// The dial's body, in page pixels: how tall it stands on the tray's floor, how much of it shows before it has risen, and its turned steps.
// A stand-in for a fault of the shared orange, which renders too dark on the hub. It goes, and the hub takes the shared colour unchanged, as soon as the shared orange is right.
export const HUB_ORANGE_LIFT = 1.6

export const DIAL_BODY = {
  tall: TOP + 2 - TRAY_Z, rest: 1.6, plateLeast: 0.4, below: 2, plate: 6.6, bezel: 10, bezelDrop: 0.8, bezelChamfer: 2, bezelSlope: 0.9, wheel: 88.4, thick: 5.2, chamfer: 1, holeRim: 0.8, holeChamfer: 2.6,
  hub: 30, hubTall: 17, hubFlat: 0.02, hubCoat: 0.14, hubRough: 0.4, hubIor: 1.5, hubEnv: 0.3, hubFoot: 3, hubStep: 3.2, hubSeat: 3, hubSeatDeep: 1.8, turned: 256, cut: 0.012, faceRough: 0.17, faceStretch: 1, faceLight: 1.45,
  housingDark: 0.8, housingRough: 0.3, seat: 9, seatGap: 1.8, seatTall: 10, seatSlope: 1, stopIn: 71, stopOut: 109, stopWide: 12, stopClear: 3, stopTall: 8, stopFoot: 12,
  grooveOver: 0.15, grooveUnder: 3,
  glint: 0.5, glintLong: 13, glintWide: 10, glintOut: 9, glintUp: 17.3,
  shade: 0.6, shadeReach: 0.78, cast: 0.72, castIn: 8, castOut: 36, castAway: 34, castOver: 0.2
}

// How far the top of the dial's wheel stands above the tray's floor when the machine has risen by `lift` (0 to 1). Before it rises it lies in the tray's floor, its wheel under the floor of a field, its hub and its stop drawn down into it.
export const dialTop = (lift: number): number => Math.max(DIAL_BODY.rest, DIAL_BODY.tall * lift)
// How far the numeral plate stands above the tray's floor under a wheel whose top stands at `top`: it never sinks into the floor.
export const dialPlate = (top: number): number => Math.max(DIAL_BODY.plateLeast, top - DIAL_BODY.plate)

const sy = trayY(1) + 9
const sx = FX + PAD + 12
export const SLOT = {
  x: sx, y: sy + PAD, w: 336, h: 150,
  reelW: 92, reelH: 106, reelGap: 12,
  reelX: (r: number): number => sx + 18 + r * (92 + 12),
  reelY: sy + PAD + 22,
  leverX: sx + 336 + 34, knobY: sy + PAD + 30, pull: 96, knob: 44, pivotY: sy + PAD + 58,
  payX: sx + 60, payY: sy + PAD + 150 + 8, payW: 216, payH: 22,
  strips: [Object.keys(legends.months).sort(), Object.keys(legends.days).sort(), Object.keys(legends.years).sort()] as string[][],
  names: ['months', 'days', 'years'] as const,
  film: ['07', '23', '1991']
}

const cy = trayY(2)
export const CRANK = {
  hx: FX + PAD + 73, hy: cy + 156, rest: -0.75, arm: 96, armW: 24, gripW: 84, gripH: 52, tip: 126, base: 110, hub: 44,
  segW: 28, segH: 96, segGap: 13, segX: FX + PAD + 73 + 227, segY: cy + 156 - 48
}

export const ROW_TITLE = { font: 'inter-600', px: 26 }
export const ROW_HELPER = { font: 'inter-400', px: 20 }
export const REEL_TYPE = { font: 'inter-600', px: 34, align: 'centre' as const }
export const DIAL_TYPE = { font: 'inter-600', px: 22, align: 'centre' as const }

export const reelId = (r: number, legend: string): string => `reel-${r}-${legend}`

function rowNodes(i: number, low: boolean): LayoutNode[] {
  const name = ROWS[i]!
  const id = low ? `${name}-low` : name
  const y = rowY(i, low)
  const here = i === 0 ? undefined : low ? [`${name}-low`] : ['rest', `${name}-up`]
  const when = (cond: string): string[] => (i === 0 ? [`${name}-${cond}`] : [`${name}-${low ? 'low' : 'up'}-${cond}`])
  const capY = y + (FH - block(TYPE.value.font, 'X', TYPE.value.px).cap) / 2
  const value = (suffix: string, key: string, cond: string): LayoutNode =>
    text(`${id}-${suffix}`, key, { ...TYPE.value, wrap: FW - 116 }, FX + PAD, capY, { part: 'type', on: VALUE_Z, states: when(cond) })
  const values: LayoutNode[] = []
  if (name === 'phone') values.push(value('typed', 'runtime:step2.phone', 'typing'), value('value', 'copy:step2.rows.phone.gaveUp', 'done'))
  if (name === 'birth') values.push(value('value', 'copy:step2.rows.birth.recorded', 'done'))
  if (name === 'volume') values.push(value('value', 'copy:step2.rows.volume.done', 'done'))
  const chevron = node(`${id}-chevron`, 'chevron', [FX + FW - PAD - 28, y + (FH - 28) / 2, 28, 28], { part: 'rows', shape: 'none' })
  const extra = here ? { states: here } : {}
  return [
    text(`${id}-label`, `copy:step2.rows.${name}.label`, ROW_TITLE, LEFT, y + 6, { part: 'type', ...extra }),
    text(`${id}-helper`, `copy:step2.rows.${name}.helper`, ROW_HELPER, LEFT, y + 42, { part: 'type', ...extra }),
    node(`${id}-pocket`, 'field', [FX, y, FW, FH], { part: 'rows', r: 14, children: [...values, chevron], ...extra })
  ]
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
  const prompt = text('dial-prompt', 'copy:step2.rows.phone.panel', TYPE.body, d.cx + d.r + 48, d.cy - block(TYPE.body.font, 'X', TYPE.body.px).cap / 2, { part: 'type', on: TRAY_Z, states: ['phone-panel'] })
  return [wheel, prompt]
}

function slotNodes(): LayoutNode[] {
  const s = SLOT
  const reels: LayoutNode[] = []
  const cap = block(REEL_TYPE.font, '0', REEL_TYPE.px).cap
  for (let r = 0; r < 3; r++) {
    const marks = s.strips[r]!.map((legend) =>
      text(reelId(r, legend), `data:step2.${s.names[r]}.${legend}`, REEL_TYPE, s.reelX(r) + s.reelW / 2, s.reelY + (s.reelH - cap) / 2, { part: 'type', on: TOP + 14, states: [reelId(r, legend)] }))
    reels.push(node(`slot-reel-${r}`, 'slotReel', [s.reelX(r), s.reelY, s.reelW, s.reelH], { part: 'slot', height: TOP + 14, floor: TOP + 10, tone: 'paper', r: 6, children: marks }))
  }
  const window = node('slot-window', 'slotWindow', [s.x + 10, s.y + 14, s.w - 20, s.h - 28], { part: 'slot', height: TOP + 10, floor: TOP + 8, tone: 'dark', r: 8, children: reels })
  const cabinet = node('slot-cabinet', 'slotCabinet', [s.x, s.y, s.w, s.h], { part: 'slot', height: TOP + 20, floor: TRAY_Z, tone: 'metal', r: 12, mechanism: true, children: [window] })
  const knob = node('slot-knob', 'slotKnob', [s.leverX - s.knob / 2, s.knobY - s.knob / 2, s.knob, s.knob], { part: 'slot', shape: 'disc', height: TOP + 40, floor: TOP + 12, tone: 'accent', mechanism: true })
  const payout = node('slot-payout', 'slotPayout', [s.payX, s.payY, s.payW, s.payH], { part: 'slot', height: 6, floor: TRAY_Z, tone: 'dark', r: 6 })
  const px = s.leverX + s.knob / 2 + 52
  const wrap = FX + FW - PAD - px
  const b = block(TYPE.body.font, words('copy:step2.rows.birth.panel'), TYPE.body.px, wrap)
  const prompt = text('slot-prompt', 'copy:step2.rows.birth.panel', { ...TYPE.body, wrap }, px, trayY(1) + (TRAY_H - b.height) / 2, { part: 'type', on: TRAY_Z, states: ['birth-panel'] })
  return [cabinet, knob, payout, prompt]
}

function crankNodes(): LayoutNode[] {
  const c = CRANK
  const prompt = text('crank-prompt', 'copy:step2.rows.volume.panel', TYPE.body, FX + PAD + 12, cy + PAD + 22, { part: 'type', on: TRAY_Z, states: ['volume-panel'] })
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
  const meter: LayoutNode = { id: 'meter', kind: 'row', box: [c.segX, c.segY, 10 * c.segW + 9 * c.segGap, c.segH], children: segs, flow: 'row', gap: c.segGap, part: 'crank' }
  return [prompt, base, arm, hub, grip, meter]
}

export function buildLayout(): LayoutNode {
  const machines = [dialNodes(), slotNodes(), crankNodes()]
  const trays = ROWS.map((name, i) => node(`${name}-tray`, 'machineTray', [FX, trayY(i), FW, TRAY_H], { part: 'rows', r: TRAY_R, tone: 'glass', states: [`${name}-open`], children: machines[i]! }))
  const rows: LayoutNode[] = []
  for (let i = 0; i < 3; i++) {
    rows.push(...rowNodes(i, false))
    if (i > 0) rows.push(...rowNodes(i, true))
  }
  const w = buttonWidth('copy:step2.continue')
  const by = SCREEN_H - 40 - sizes.button
  const go = button('continue', RIGHT - w, by, w, 'copy:step2.continue', { part: 'shell', tone: 'metal' })
  find(go, 'continue-label').tone = 'ink'
  const note = text('note', 'copy:step2.note', ROW_HELPER, LEFT, by + (sizes.button - block(ROW_HELPER.font, 'X', ROW_HELPER.px).cap) / 2, { part: 'type' })
  return page('step2', SCREEN_H, [...stepHead(2), ...rows, ...trays, note, go])
}

export interface StateView { open: number; panel: boolean; done: boolean[]; typing: boolean[]; settled: string[] | null }

export function statesOf(v: StateView): string[] {
  const out: string[] = []
  if (v.open < 0) out.push('rest')
  for (let i = 0; i < 3; i++) {
    const name = ROWS[i]!
    const low = v.open >= 0 && v.open < i
    const base = i === 0 ? name : `${name}-${low ? 'low' : 'up'}`
    if (i > 0) out.push(base)
    if (v.done[i]) out.push(`${base}-done`)
    else if (v.typing[i]) out.push(`${base}-typing`)
  }
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
