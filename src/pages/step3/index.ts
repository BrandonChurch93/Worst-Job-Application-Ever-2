import { config, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { HANDOFF, restPose, type Acting, type CursorPose } from '../../cursor/body'
import { boxOf, drawLayout, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, HEADER, LEFT, page, RIGHT, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { basis, frame, homePose, mixPose, smooth, toWorld } from '../../stage/camera'
import { TURN_HALF } from '../../stage/stage'
import { ZONES } from '../../table/draw'
import type { CameraPose, Collider, DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo, TableState } from '../../stage/types'
import take from '../../../cut/TABLE-TAKE.json'
import { BOARD, boardAt, DOORS, fixedShapes, movingShapes } from '../../table/draw'
import { APRON_Y, BALL, FLIP, LAST_Y, MARQUEE_Y, MID, MOUTH, OUTLET, PAGE_H, PORT, TH, TIERS, TIER_Y, floorZ, holdOf, railAt, railLength, railOf, table, tierAt } from '../../table/layout'
import { Machine, prepare as startPhysics, type MachineState, type TableEvent } from '../../table/physics'

export const prepare = (): Promise<void> => startPhysics()

const beats = config.film.beats.filter((b) => b.unit === 'pinball')
const seconds = config.film.units.find((u) => u.id === 'pinball')!.seconds
const live = config.live.pinball
const dt = 1 / stepHz
const beatAt = (id: string): { from: number; to: number } => beats.find((b) => b.id === `pinball.${id}`)!
const px = (v: number): number => v * BALL

export const T = {
  arrive: 0.8, seal: 2.4, tube: 3.3, lightsDown: 4.0, powerOn: 5.2, atPlunger: 8.3, plunger: 9.4, onTable: 10.85, doorKick: 13.2, doorOpen: 14.1, lobbyEnd: 14.9, inboxOn: 17.9, inboxBy: 19.1,
  drops: [20.78, 20.88, 20.98], eject: 20.72, officeOpen: 24.6, officeBy: 25.2, firedBy: 27.2, scoopKick: 28.5, flapOn: 29.6, flapBy: 30.8, highwayEnd: 32.7, spiralEnd: 34.6, save: 35.6, streetOpen: 36.9, streetBy: 37.9,
  press: seconds - TURN_HALF - 0.5
}
const MODES: { at: number; tier: number; mode: number }[] = [
  { at: 11, tier: 0, mode: 5 }, { at: 13.3, tier: 0, mode: 6 }, { at: 14.2, tier: 0, mode: 7 }, { at: 15, tier: 1, mode: 0 }, { at: 19, tier: 1, mode: 4 }, { at: 23, tier: 1, mode: 8 },
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
      text('marquee-title', 'copy:step3.table.title', { font: 'inter-display-600', px: 128, align: 'centre' }, 960, my + 70, { part: 'marquee', on: 41, tone: 'inkLight', states: ['on'] }),
      text('marquee-score', 'runtime:score', { font: 'inter-600', px: 44, align: 'centre', wrap: 420 }, 960, my + 250, { part: 'displays', on: 41, tone: 'inkLight', states: ['on'] })
    ]
  }))
  for (let k = 0; k < 3; k++) {
    const name = TIERS[k]!
    const f = px(floorZ(k))
    const light = k !== 1
    for (const m of table.models) {
      if (m.tier !== k || !m.sign) continue
      const dark = m.tone === 'danger'
      kids.push(centred(`sign.${m.id}`, m.sign, { font: 'inter-600', px: m.signPx ?? 22, wrap: px(m.box[2]) - 6 }, px(m.box[0] + m.box[2] / 2), px(m.box[1] + m.box[3] / 2), { part: m.part, on: f + px((m.base ?? 0) + m.h) + 1, tone: dark ? 'inkLight' : 'ink' }))
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
  kids.push(node('apron-left', 'slab', [312, ay + 24, 520, 144], { part: 'table-frame' }))
  kids.push(node('apron-right', 'slab', [1088, ay + 24, 520, 144], {
    part: 'table-frame', children: [node('apron-card', 'apronCard', [1128, ay + 56, 440, 80], {
      part: 'table-frame', floor: 16, height: 17, tone: 'paper', children: [centred('apron-card-words', 'copy:step3.table.apronCard', { font: 'inter-500', px: 18 }, 1348, ay + 96, { part: 'type', on: 18 })]
    })]
  }))
  kids.push(centred('drain-label', 'copy:step3.table.buildings.drain', { font: 'inter-600', px: 18 }, 960, ay + 48, { part: 'table-frame', on: 7, tone: 'ink' }))
  const ly = px(LAST_Y)
  kids.push(node('outlet-port', 'port', [px(OUTLET.x - OUTLET.ring / 2), px(OUTLET.y - OUTLET.ring / 2), px(OUTLET.ring), px(OUTLET.ring)], { part: 'loader', shape: 'none' }))
  kids.push(node('result', 'card', [560, ly + 255, RIGHT - 560, 236], {
    part: 'shell', states: ['result'], children: [
      text('result-title', 'copy:step3.result.title', TYPE.heading, 608, ly + 295, { part: 'type', on: 12 }),
      text('result-body', 'copy:step3.result.body', { ...TYPE.body, wrap: 1040, lead: 34 }, 608, ly + 385, { part: 'type', on: 12 })
    ]
  }))
  kids.push(button('go', 560, ly + 255 + 236 + 32, buttonWidth('copy:step2.continue'), 'copy:step2.continue', { part: 'shell', states: ['result'] }))
  return page('step3', PAGE_H, kids)
}

interface State {
  mode: 'live' | 'film'; time: number; t: number; phase: 'wait' | 'pull' | 'sealed' | 'open' | 'result'; pull: number; said: string[]; drops: number; tows: number
  scroll: number; floor: number; opened: number; result: number; pressed: boolean; hold: number; done: boolean; skipped: boolean; saved: boolean; score: number; shut: boolean; dim: number; struck: number
}

const fresh = (): State => ({ mode: 'live', time: 0, t: 0, phase: 'wait', pull: 0, said: [], drops: 0, tows: 0, scroll: 0, floor: 0, opened: 0, result: 0, pressed: false, hold: 0, done: false, skipped: false, saved: false, score: 0, shut: false, dim: 0, struck: -9 })

const flips = (take as unknown as { flips: [string, number, number][] }).flips
const held = (side: string, time: number): boolean => flips.some((f) => f[0] === side && time >= f[1] && time < f[2])

const STREET = 0.95
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
const NAMED: Record<string, CameraPose> = {
  'tier-3': tierPose(0), 'tier-2': tierPose(1), 'tier-1': streetPose(),
  'table-wide': look('table-wide', [MID, APRON_Y + 16.41, 12.61], [MID, Y2 + 3.94, 1.96]),
  'table-lobby': look('table-lobby', [MID + 1.2, Y0 + 7.0, -0.25], [MID + 0.14, Y0 + 4.23, 0.17]),
  'table-replyall': look('table-replyall', [MID, Y1 + 16.35, 15.4], [MID, Y1 + 6.3, -2]),
  'table-fired': look('table-fired', [7.6, Y2 + 7.14, -0.2], [4.8, Y2 + 3.8, -2.2]),
  'table-save': look('table-save', [MID, Y2 + 13.4, 6.05], [MID, Y2 + 8.6, -2.26])
}
const FILM: [number, string, number][] = [
  [0, 'follow', 0], [4.2, 'table-wide', 0], [8.5, 'ride', 0], [10.25, 'tier-3', 0.6], [13.0, 'table-lobby', 0], [14.3, 'follow', 0], [19.5, 'table-replyall', 0], [22.2, 'follow', 0], [27.2, 'table-fired', 0], [28.8, 'follow', 0],
  [31.15, 'rail', 0], [32.3, 'follow', 0.6], [34.3, 'table-save', 0], [36.6, 'follow', 0]
]
const LENS: Record<string, number> = { 'table-wide': 5, 'table-lobby': 7, 'table-replyall': 12, 'table-fired': 10, 'table-save': 9, rail: 6, ride: 7 }
const HARD: Record<string, number> = { bumper: 1, sling: 0.7, 'doors-slam': 1.3, 'scoop-kick': 0.8, plunger: 1, 'ball-hit': 0.6, 'drop-target': 0.5, 'mom-save': 1, 'ball-save': 0.8 }
const SHAKE = { size: 0.006, decay: 0.09, hz: 23, most: 1.5, last: 0.5 }
const SOFT = 0.4
const NAME = 1.5
const TURN = 1.5707963267948966
const SIGN = { turn: 0.5235987755982988, cos: 0.8660254037844387, sin: 0.5, inset: 8, lift: 6, back: ['corporate.beach'] }
const WAKE = 0.35
const DUSK = config.table.pageDuskLevel
const ASLEEP = 0.25
const LOW = 2.4
const PULL = { door: 12, scoop: 30, near: 2.2, gate: 40 }
const NEST = { sling: [3.3, 6.5], under: [0.5, 0.9], pour: [-10.6, 1.0, 0.3] }
const SHOT = { door: 13, scoop: 21, nest: 17, save: 19, lob: 9, lean: 0.3, jets: 0.5, wide: 2.5, low: 7.5, early: 0.3, back: 1 }
const ACT = { bumper: 0.5, kick: 0.7, doors: 0.45, shock: 0.45, realise: 0.45, slow: 7, lead: 0.3 }

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
  for (const [id, z0, z1] of [['apron-left', 0, slab], ['apron-right', 0, slab], ['apron-card', slab, slab + 1], ['apron-card-words', slab + 2, slab + 2], ['drain-label', 7, 7]] as const) stood[id] = { z0: af + z0, z1: af + z1 }
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
  const powered = (): boolean => s.said.includes('power-on')
  const drawn = (): number => {
    const b = ball()
    return b.mode === 'hold' && b.hold === 'plunger' && s.t < T.plunger ? Math.max(0, Math.min(1, (s.t - T.atPlunger) / (T.plunger - T.atPlunger - 0.15))) : 0
  }
  const glow = (): boolean[] => [0, 1, 2].map((k) => powered() && s.t >= T.powerOn + k * WAKE)
  // How bright the website's own light is: full on the page, down to dusk by the time the machine wakes, and up again once the ball leaves by the drain.
  const website = (): number => 1 - (1 - DUSK) * smooth(s.dim)
  // How bright each tier's general lighting is: a wave down the tiers when the machine wakes, and a slow dim once the ball has left by the drain.
  const general = (): number[] => [0, 1, 2].map((k) => (powered() ? smooth((s.t - T.powerOn - k * WAKE) / WAKE) * (s.t > T.powerOn + 3 * WAKE ? ASLEEP + (1 - ASLEEP) * smooth(s.dim) : 1) : 0))
  const lit = (): boolean[] => table.inserts.map((n) => (powered() && s.t >= T.powerOn + n.tier * WAKE && s.t < T.powerOn + n.tier * WAKE + 0.6) || MODES.some((x) => x.mode === n.mode && s.t >= x.at && s.phase !== 'wait' && s.phase !== 'pull'))
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
      const y = px(b.y)
      const inTier = b.y >= Y0 && b.y < APRON_Y && b.rail !== 'feed'
      if (b.rail === 'launch' && b.y < Y0 + TH) return { scroll: px(Y0), floor: px(floorZ(0)) }
      if (b.rail === 'feed' && b.y > Y2 + 2) return { scroll: px(Y2 + LOW), floor: px(floorZ(2)) }
      return { scroll: Math.max(0, Math.min(lastScroll, y - 540)), floor: inTier ? px(floorZ(tierAt(b.y))) : 0 }
    }
    if (b.mode === 'hold' && b.hold === 'plunger') return { scroll: px(Y2 + LOW), floor: px(floorZ(2)) }
    const k = b.mode === 'rail' && b.rail.startsWith('chute.') ? TIERS.indexOf(b.rail.slice(6) as never) + 1 : b.mode === 'rail' && b.rail.startsWith('lift.') ? tierAt(railOf(b.rail).points[3]![1]) : tierAt(Math.max(Y0, Math.min(APRON_Y - 0.01, b.y)))
    return { scroll: px(TIER_Y[k]! + (k === 2 ? STREET : 0)), floor: px(floorZ(k)) }
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
  const follow = (): CameraPose => homePose(s.scroll, s.floor)
  const lens = (name: string, p: CameraPose | null): CameraPose | null => {
    const open = LENS[name]
    if (!p || open === undefined) return p
    const b = ball()
    const on = name === 'table-wide' || b.mode === 'none' ? p.target : toWorld(px(b.x), px(b.y), px(b.z) + BALL / 2)
    const f = basis(p).forward
    return { ...p, focus: Math.max(BALL, (on[0] - p.eye[0]) * f[0] + (on[1] - p.eye[1]) * f[1] + (on[2] - p.eye[2]) * f[2]), aperture: open }
  }
  const named = (name: string): CameraPose | null => lens(name, name === 'follow' ? follow() : name === 'rail' ? railPose() : name === 'ride' ? ridePose() : NAMED[name] ?? null)

  const cut = (time: number): CameraPose => {
    let i = 0
    while (i + 1 < FILM.length && time >= FILM[i + 1]![0]) i++
    const now = named(FILM[i]![1])!
    const u = i > 0 && FILM[i]![2] > 0 ? (time - FILM[i]![0]) / FILM[i]![2] : 1
    if (u >= 1) return now
    return mixPose(named(FILM[i - 1]![1])!, now, smooth(Math.max(0, u)))
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
    const j = jolt()
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
    const flat = (seconds: number): void => {
      s.struck = s.t
      io.cursor.hurt('flattened', seconds)
      io.cursor.react('recoil')
    }
    if (e.name === 'bumper') {
      say(gag === 'pinball.coffee' ? 'bumper' : 'flasher', true)
      flat(ACT.bumper)
    } else if (e.name === 'scoop-kick') {
      say('scoop-kick', true)
      flat(ACT.kick)
    } else if (e.name === 'ball-hit') {
      say('flasher', true)
      flat(ACT.bumper)
    } else if (e.name === 'ball-save') {
      if (gag === 'pinball.save' && !s.saved) {
        s.saved = true
        say('flipper-save', true)
        flat(ACT.kick)
      } else say('flasher')
    } else if (e.name === 'doors-slam') {
      s.shut = true
      say('doors-slam', true)
      s.struck = s.t
      io.cursor.hurt('flattened', ACT.doors)
    } else if (e.name === 'scoop-in') {
      if (e.id === 'office.inbox') say('inbox-take', true)
      if (e.id === 'street.firehouse') say('firehouse-take', true)
      io.cursor.react(e.id === 'street.firehouse' ? 'cower' : 'duck')
    } else if (e.name === 'kicker-in') io.cursor.react('doubleTake')
    else if (e.name === 'sling' || e.name === 'drop-target' || e.name === 'standup') {
      if (e.name !== 'standup') say(e.name)
      io.cursor.react('flinch')
    } else if (e.name === 'at-plunger') io.cursor.react('doubleTake')
    else if (e.name === 'mom-save') io.cursor.react('jump')
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
      if (b.rail === 'feed') return 'nervous'
      if (b.rail === 'highway' || b.rail.startsWith('lift.')) return 'confident'
      return b.rail === 'drain' || b.rail.startsWith('outlane.') ? 'exhausted' : 'scared'
    }
    if (b.mode === 'tow') return b.then.startsWith('gate:') ? 'exhausted' : 'scared'
    if (t - s.struck < ACT.shock) return 'shocked'
    if (s.saved && b.tier === 2) return 'exhausted'
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
    const towTo = (hold: string, speed = 16): void => {
      if (b.mode !== 'plane') return
      const h = holdOf(hold)
      s.tows++
      mc.tow(0, h.c[0], h.c[1], speed, `hold:${hold}`)
    }
    const towGate = (k: number): void => {
      if (b.mode !== 'plane' || b.tier !== k) return
      s.tows++
      mc.tow(0, MID, TIER_Y[k]! + 11.0, 16, `gate:${k}`)
    }
    const shoot = (x: number, y: number, speed: number, pull = 0): void => {
      const far = (x - MID) * (b.x - MID) > 0 && Math.abs(x - MID) > SHOT.wide && b.y > TIER_Y[b.tier]! + SHOT.low
      mc.shot = [x, y, far ? SHOT.lob : speed]
      mc.aim = [x, y, SHOT.lean]
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
    if (b.mode === 'hold' && b.hold === 'loader' && t >= T.tube) {
      mc.release(0)
    }
    if (t >= T.lightsDown && once('lights-down')) io.emit('lights-down', px(MID), px(MARQUEE_Y + 2), false)
    if (t >= T.powerOn && once('power-on')) io.emit('power-on', px(MID), px(MARQUEE_Y + 2), false)
    if (b.mode === 'rail' && b.rail === 'feed') b.speed = Math.max(6, Math.min(40, (railLength(railOf('feed')) - b.s) / Math.max(0.05, T.atPlunger - t)))
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
    if (b.tier === 0 && b.mode === 'plane') {
      if (t >= T.doorKick - 0.3 && t < T.doorKick) towTo('corporate.revolving', 18)
      else if (t >= T.lobbyEnd) towGate(0)
      else if (t < T.doorKick) shoot(MID, Y0 + 6.0, SHOT.door, PULL.door)
      else if (t >= T.doorOpen) mc.magnet = [MID, Y0 + 11.2, PULL.gate]
    }
    on['office.inbox'] = t >= T.inboxOn && t < T.eject
    if (b.tier === 1 && b.mode === 'plane') {
      if (t >= T.inboxOn && t < T.eject) {
        const c = holdOf('office.inbox').c
        if (t >= T.inboxBy) towTo('office.inbox')
        else shoot(c[0], c[1], SHOT.scoop, PULL.scoop)
      } else if (t >= T.officeOpen - SHOT.back) {
        if (t >= T.officeBy) towGate(1)
        else if (t >= T.officeOpen) mc.magnet = [MID, Y1 + 11.2, PULL.gate]
        mc.aim = [MID, Y1 + MOUTH.v, SHOT.lean]
      } else {
        const low = table.bumpers.filter((m) => m.tier === 1)[2]!.c
        mc.shot = [low[0], low[1], SHOT.nest]
        mc.aim = b.vy < 0 ? [b.x < MID ? MID - NEST.sling[0]! : MID + NEST.sling[0]!, Y1 + NEST.sling[1]!, SHOT.lean] : [b.x < MID ? low[0] - NEST.under[0]! : low[0] + NEST.under[0]!, low[1] + NEST.under[1]!, SHOT.lean]
      }
    }
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
    if (b.tier === 2 && b.mode === 'plane') {
      if (t < T.scoopKick) {
        const c = holdOf('street.firehouse').c
        if (t >= T.firedBy) towTo('street.firehouse')
        else shoot(c[0], c[1], SHOT.scoop, PULL.scoop)
      } else if (t >= T.flapOn - SHOT.early && t < T.highwayEnd) {
        const p = railOf('highway').points[0]!
        if (t >= T.flapBy || (t >= T.flapOn && Math.hypot(b.x - p[0], b.y - p[1]) < 0.7)) {
          if (t >= T.flapBy) s.tows++
          mc.tow(0, p[0], p[1], 16, 'rail:highway')
        } else shoot(p[0], p[1], SHOT.scoop, PULL.scoop)
      } else if (t >= T.spiralEnd && t < T.streetOpen - SHOT.back) mc.shot = [MID + 1.2, Y2 + 2.2, SHOT.save]
      else {
        if (t >= T.streetBy) towGate(2)
        else if (t >= T.streetOpen) mc.magnet = [MID, Y2 + 11.2, PULL.gate]
        if (t >= T.streetOpen - SHOT.back) mc.aim = [MID, Y2 + MOUTH.v, SHOT.lean]
      }
    }
    if (b.mode === 'hold' && b.hold === 'street.firehouse') {
      b.wait = t >= T.scoopKick ? Math.min(b.wait, 0.01) : 1e9
    }
    on['street.flap'] = false
    if (b.mode === 'rail' && b.rail === 'highway') b.speed = Math.max(3, Math.min(14, (railLength(railOf('highway')) - b.s) / Math.max(0.05, T.highwayEnd - t)))
    if (b.mode === 'rail' && b.rail === 'spiral') b.speed = Math.max(8, Math.min(30, (railLength(railOf('spiral')) - b.s) / Math.max(0.05, T.spiralEnd - t)))
    if (b.mode === 'rail' && b.rail === 'drain') b.speed = s.skipped ? 40 : 13
    io.cursor.act(mood())
  }

  const sealNow = (io: StepIo): void => {
    const mc = machine()
    s.phase = 'sealed'
    io.cursor.take('ball')
    io.cursor.seal(true)
    io.cursor.act('nervous')
    mc.hold(0, 'loader', 1e9)
    mc.balls[0]!.z = -0.4
    io.emit('ball-seal', port.x, port.y, true)
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
        if (s.phase === 'wait' && d < reach && io.time >= T.arrive && !io.cursor.inAir) {
          s.phase = 'pull'
          s.pull = 0
          io.cursor.take('ball')
        }
        if (s.phase === 'pull') {
          s.pull += dt
          io.cursor.drive(port.x, port.y, 30)
          if ((d < 14 && s.pull > 0.3 && (s.mode === 'live' || io.time >= T.seal - 0.1)) || s.pull > 1.1) sealNow(io)
        }
      } else s.t += dt
      if (s.phase === 'sealed') {
        direct(io)
        const events = mc.step(io.pointer.flipLeft === true, io.pointer.flipRight === true)
        for (const e of events) emitTable(io, e)
        s.score = mc.score
        const b = ball()
        io.cursor.place(px(b.x), px(b.y), px(b.z))
        if (b.mode !== 'hold') io.cursor.knock(px(b.vx) * ACT.lead, px(b.vy) * ACT.lead)
        if (b.mode === 'hold' && b.hold === 'outlet') {
          s.opened += dt
          if (s.opened >= 0.2) {
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
      s.dim = Math.max(0, Math.min(1, s.dim + (inside ? dt : -dt) / (T.powerOn - T.lightsDown)))
      if (s.phase !== 'sealed') {
        const on = [port, outlet].some((c) => Math.hypot(io.cursor.x + 8 - c.x, io.cursor.y + 14 - c.y) < px(OUTLET.ring) / 2 + 12)
        io.cursor.setGround(on ? PORT_TOP : 0)
      }
      const to = target()
      const rate = Math.min(1, dt / (live.tierTravelSeconds / 4))
      const cap = 4200 * dt
      s.scroll += Math.max(-cap, Math.min(cap, (to.scroll - s.scroll) * rate))
      s.floor += (to.floor - s.floor) * rate
      if (Math.abs(to.scroll - s.scroll) < 0.01) s.scroll = to.scroll
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
      for (const m of MODES) {
        if (!states.includes(`mode${m.mode}`)) continue
        over[`display.${TIERS[m.tier]!}.${m.mode}`] = { v: [s.t - m.at] }
        if (s.t < m.at + NAME) states.push(`name${m.mode}`)
      }
      drawLayout(out, layout, { states, runtime: { score: scoreText() }, over })
      for (const shape of fixedShapes()) out.push(shape)
      for (const shape of movingShapes(mc, lit(), false, general(), drawn(), s.shut, website())) out.push(shape)
      out.push(hqPlate)
    },
    scroll: () => s.scroll,
    view: () => (s.floor === 0 ? null : follow()),
    camera(name: string, time: number): CameraPose | null {
      return name === 'film' ? filmPose(time) : named(name)
    },
    script(time: number): Pointer {
      const flipLeft = held('L', time)
      const flipRight = held('R', time)
      if (time < T.streetBy) {
        const u = smooth(Math.min(1, Math.max(0, (time - TURN_HALF - 0.1) / 1.2)))
        return { x: HANDOFF.x + (port.x - 40 - HANDOFF.x) * u, y: HANDOFF.y + (port.y + 30 - HANDOFF.y) * u, down: false, flipLeft, flipRight }
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
        const want = machine().shot && b.mode === 'plane' && !machine().gate[b.tier] && !held ? machine().wants() : [false, false]
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
    ignoring: () => false,
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
      for (const m of table.models) if (m.solid) add(m.id, 'model', m.tier, m.round ? [m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2] : corners(m.box), m.round ? { r: m.box[2] / 2 } : { closed: true })
      for (const t of table.targets) if (t.kind !== 'drop' || !mc.down[t.index]) add(t.id, 'target', t.tier, corners(t.box), { closed: true })
      for (const f of table.flippers) {
        const a = (mc.flipperAngle(f.side) * Math.PI) / 180
        const dir = f.side === 'left' ? 1 : -1
        add(f.id, 'flipper', f.tier, [...f.pivot, f.pivot[0] + dir * FLIP.length * Math.cos(a), f.pivot[1] + FLIP.length * Math.sin(a)], { r: FLIP.radius })
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
        const f = px(floorZ(1))
        const bat = table.flippers.find((x) => x.tier === 1 && x.side === 'left')!.pivot
        const cup = table.bumpers.filter((x) => x.tier === 1).reduce((p, q) => (q.c[1] > p.c[1] ? q : p))
        const lean = (FLIP.rest * Math.PI) / 180
        const rest = { x: bat[0] + 0.9 * Math.cos(lean) + (0.6 + FLIP.radius) * Math.sin(lean), y: bat[1] + 0.9 * Math.sin(lean) - (0.6 + FLIP.radius) * Math.cos(lean) }
        const hit = { x: cup.c[0] + (cup.r + 0.45) * 0.26, y: cup.c[1] + (cup.r + 0.45) * 0.966 }
        const mid = { x: (rest.x + hit.x) / 2, y: (rest.y + hit.y) / 2 }
        const spots: { x: number; y: number; lift: number; pose: Partial<CursorPose> }[] = [
          { x: rest.x, y: rest.y, lift: 0, pose: { acting: 'nervous' } },
          { x: mid.x, y: mid.y, lift: 0.5, pose: { acting: 'scared', lean: 0.3 } },
          { x: hit.x, y: hit.y, lift: 0, pose: { acting: 'shocked', damage: ['flattened'] } }
        ]
        spots.forEach((p, i) => list.push({ id: `sheet-ball-${i + 1}`, part: 'clear-ball', kind: 'ball', x: px(p.x - 0.5), y: px(p.y - 0.5), w: BALL, h: BALL, z0: f + px(p.lift), z1: f + px(p.lift) + BALL, tone: 'glass' }))
        return { list, cursors: spots.map((p) => restPose(px(p.x), px(p.y), { z: f + px(p.lift), inBall: true, taken: true, ...p.pose })), view: { ...look('home', [mid.x + 1.92, mid.y + 6.1, 3.2], [mid.x, mid.y, -1.45]), focus: px(7.9), aperture: 15 } }
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
