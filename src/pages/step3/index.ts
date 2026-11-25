import { config, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { HANDOFF, restPose, type CursorPose } from '../../cursor/body'
import { boxOf, drawLayout, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, HEADER, LEFT, page, RIGHT, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { frame, homePose, mixPose, smooth, toWorld } from '../../stage/camera'
import { TURN_HALF } from '../../stage/stage'
import type { CameraPose, DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, SheetFrame, StepIo, TableState } from '../../stage/types'
import take from '../../../cut/TABLE-TAKE.json'
import { fixedShapes, movingShapes } from '../../table/draw'
import { APRON_Y, BALL, LAST_Y, MARQUEE_Y, MID, OUTLET, PAGE_H, PORT, TH, TIERS, TIER_Y, floorZ, holdOf, railLength, railOf, table, tierAt } from '../../table/layout'
import { Machine, prepare as startPhysics, type MachineState, type TableEvent } from '../../table/physics'

export const prepare = (): Promise<void> => startPhysics()

const beats = config.film.beats.filter((b) => b.unit === 'pinball')
const seconds = config.film.units.find((u) => u.id === 'pinball')!.seconds
const live = config.live.pinball
const dt = 1 / stepHz
const beatAt = (id: string): { from: number; to: number } => beats.find((b) => b.id === `pinball.${id}`)!
const px = (v: number): number => v * BALL

export const T = {
  arrive: 0.8, seal: 2.4, tube: 3.3, lightsDown: 4.0, powerOn: 5.2, atPlunger: 8.3, plunger: 9.4, onTable: 10.85, doorKick: 13.2, doorOpen: 14.1, lobbyEnd: 14.9, inboxOn: 18.3, inboxBy: 19.1,
  drops: [20.0, 20.35, 20.7], eject: 21.4, officeOpen: 24.6, officeBy: 25.2, firedBy: 27.2, scoopKick: 28.5, flapOn: 29.6, flapBy: 30.8, highwayEnd: 32.7, spiralEnd: 34.2, streetOpen: 37.3, streetBy: 37.9,
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
  kids.push(text('intro', 'copy:transitions.step3', { ...TYPE.body, wrap: 760, lead: 34 }, LEFT, HEADER.contentY, { part: 'type' }))
  kids.push(node('loader-port', 'port', [px(PORT.x - PORT.ring / 2), px(PORT.y - PORT.ring / 2), px(PORT.ring), px(PORT.ring)], { part: 'loader', shape: 'none' }))
  const my = px(MARQUEE_Y)
  kids.push(node('marquee', 'marquee', [312, my + 24, 1296, 336], {
    part: 'marquee', shape: 'none', children: [
      text('marquee-title', 'copy:step3.table.title', { font: 'inter-display-600', px: 128, align: 'centre' }, 960, my + 70, { part: 'marquee', on: 41, tone: 'inkLight' }),
      text('marquee-score', 'runtime:score', { font: 'inter-600', px: 44, align: 'centre', wrap: 420 }, 960, my + 250, { part: 'displays', on: 41, tone: 'inkLight' })
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
    for (const n of table.inserts) {
      if (n.tier !== k) continue
      kids.push(text(`insert-label.${n.id}`, `copy:step3.table.modes.${n.mode}.insert`, { font: 'inter-500', px: 15, align: 'centre', wrap: 138, lead: 19 }, px(n.c[0]), px(n.c[1] + n.r + 0.08), { part: 'table-lights', on: f + 4, tone: light ? 'inkLight' : 'ink' }))
    }
    const d = table.displays[k]!
    for (const n of table.inserts) {
      if (n.tier !== k) continue
      kids.push(text(`display.${name}.${n.mode}`, `copy:step3.table.modes.${n.mode}.display`, { font: 'inter-500', px: 16, wrap: px(d.box[2]) - 20, lead: 21 }, px(d.box[0]) + 10, px(d.box[1]) + 6, { part: 'displays', on: f + 31, tone: 'inkLight', states: [`mode${n.mode}`] }))
    }
    kids.push(text(`display.${name}.score`, 'runtime:score', { font: 'inter-600', px: 30, align: 'centre', wrap: px(d.box[2]) - 20 }, px(d.box[0] + d.box[2] / 2), px(d.box[1]) + 18, { part: 'displays', on: f + 31, tone: 'inkLight', states: [`score${k}`] }))
  }
  const ay = px(APRON_Y)
  kids.push(node('apron-left', 'slab', [312, ay + 24, 520, 144], { part: 'table-frame' }))
  kids.push(node('apron-right', 'slab', [1088, ay + 24, 520, 144], {
    part: 'table-frame', children: [node('apron-card', 'paper', [1128, ay + 56, 440, 80], {
      part: 'table-frame', floor: 16, height: 17, tone: 'paper', children: [centred('apron-card-words', 'copy:step3.table.apronCard', { font: 'inter-500', px: 18 }, 1348, ay + 96, { part: 'type', on: 18 })]
    })]
  }))
  kids.push(centred('drain-label', 'copy:step3.table.buildings.drain', { font: 'inter-600', px: 18 }, 960, ay + 48, { part: 'table-frame', on: 7, tone: 'inkLight' }))
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
  scroll: number; floor: number; opened: number; result: number; pressed: boolean; hold: number; done: boolean; skipped: boolean; saved: boolean; score: number
}

const fresh = (): State => ({ mode: 'live', time: 0, t: 0, phase: 'wait', pull: 0, said: [], drops: 0, tows: 0, scroll: 0, floor: 0, opened: 0, result: 0, pressed: false, hold: 0, done: false, skipped: false, saved: false, score: 0 })

const flips = (take as unknown as { flips: [string, number, number][] }).flips
const held = (side: string, time: number): boolean => flips.some((f) => f[0] === side && time >= f[1] && time < f[2])

const tierPose = (k: number): CameraPose => homePose(px(TIER_Y[k]!), px(floorZ(k)))
const fov = (name: string): number => (config.cameras as Record<string, { fovDeg?: number }>)[name]?.fovDeg ?? config.cameras.home.fovDeg
const look = (name: string, eye: [number, number, number], at: [number, number, number]): CameraPose => ({ eye: toWorld(px(eye[0]), px(eye[1]), px(eye[2])), target: toWorld(px(at[0]), px(at[1]), px(at[2])), up: [0, 0, 1], fov: fov(name) })
const Y0 = TIER_Y[0]!
const Y1 = TIER_Y[1]!
const Y2 = TIER_Y[2]!
const NAMED: Record<string, CameraPose> = {
  'tier-3': tierPose(0), 'tier-2': tierPose(1), 'tier-1': tierPose(2),
  'table-wide': look('table-wide', [MID, APRON_Y + 15.5, 15.5], [MID, APRON_Y - 10.6, -1.2]),
  'table-lobby': look('table-lobby', [MID + 3.6, Y0 + 7.9, 1.5], [MID - 0.5, Y0 + 4.6, -0.2]),
  'table-replyall': look('table-replyall', [MID + 2, Y1 + 15.5, 14], [MID + 1.2, Y1 + 5.4, -2]),
  'table-fired': look('table-fired', [8.2, Y2 + 8.0, 0.8], [4.8, Y2 + 3.5, -2.2]),
  'table-save': look('table-save', [MID + 0.2, Y2 + 13.5, 9], [MID, Y2 + 8.4, -3])
}
const FILM: [number, string][] = [
  [0, 'follow'], [5.0, 'table-wide'], [9.5, 'follow'], [11.2, 'tier-3'], [13.0, 'table-lobby'], [14.3, 'follow'], [20.6, 'table-replyall'], [22.6, 'follow'], [27.2, 'table-fired'], [28.8, 'follow'],
  [31.0, 'rail'], [33.0, 'follow'], [34.3, 'table-save'], [36.6, 'follow']
]
const BLEND = 0.6

export function makePage(): PageLogic {
  const layout = buildLayout()
  const go = boxOf(layout, 'go-cap')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: b.event ?? null }))
  const start = { x: 1180, y: 760 }
  const port = { x: px(PORT.x), y: px(PORT.y) }
  const outlet = { x: px(OUTLET.x), y: px(OUTLET.y) }
  const lastScroll = PAGE_H - 1080
  let s = fresh()
  let m: Machine | null = null
  const machine = (): Machine => {
    if (!m) m = new Machine()
    return m
  }
  const gagAt = (t: number): string => (beats.find((b) => t < b.to) ?? beats[beats.length - 1]!).id
  const ball = () => machine().balls[0]!
  const lit = (): boolean[] => table.inserts.map((n) => MODES.some((x) => x.mode === n.mode && s.t >= x.at && s.phase !== 'wait' && s.phase !== 'pull'))
  const modeOf = (k: number): number | null => {
    let out: number | null = null
    if (s.phase === 'wait' || s.phase === 'pull') return null
    for (const x of MODES) if (x.tier === k && s.t >= x.at) out = x.mode
    return out
  }
  const activeStates = (): string[] => {
    const out = [s.phase === 'result' ? 'result' : s.phase === 'wait' ? 'rest' : 'play']
    for (let k = 0; k < 3; k++) {
      const mode = modeOf(k)
      out.push(mode === null ? `score${k}` : `mode${mode}`)
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
      if (b.rail === 'feed' && b.y > Y2 + 2) return { scroll: px(Y2), floor: px(floorZ(2)) }
      return { scroll: Math.max(0, Math.min(lastScroll, y - 540)), floor: inTier ? px(floorZ(tierAt(b.y))) : 0 }
    }
    const k = b.mode === 'rail' && b.rail.startsWith('chute.') ? TIERS.indexOf(b.rail.slice(6) as never) + 1 : b.mode === 'rail' && b.rail.startsWith('lift.') ? tierAt(railOf(b.rail).points[3]![1]) : tierAt(Math.max(Y0, Math.min(APRON_Y - 0.01, b.y)))
    return { scroll: px(TIER_Y[k]!), floor: px(floorZ(k)) }
  }
  const railPose = (): CameraPose => {
    const b = ball()
    const sp = Math.hypot(b.vx, b.vy) || 1
    const dx = b.vx / sp
    const dy = b.vy / sp
    return { eye: toWorld(px(b.x - dx * 1.6), px(b.y - dy * 1.6), px(b.z + 4.2)), target: toWorld(px(b.x + dx * 1.2), px(b.y + dy * 1.2), px(b.z + 0.5)), up: [0, 0, 1], fov: fov('rail') }
  }
  const follow = (): CameraPose => homePose(s.scroll, s.floor)
  const named = (name: string): CameraPose | null => (name === 'follow' ? follow() : name === 'rail' ? railPose() : NAMED[name] ?? null)

  const emitTable = (io: StepIo, e: TableEvent): void => {
    const gag = gagAt(s.t)
    const x = px(e.x)
    const y = px(e.y)
    const say = (name: string, hits = false) => io.emit(name, x, y, hits)
    if (e.name === 'flipper') {
      io.emit('flipper', px(e.x), px(TIER_Y[ball().mode === 'none' ? 2 : ball().tier]! + 8.8), false)
      const want = machine().wants(0.3, -60)
      if (gag === 'pinball.save' && !s.saved && (e.id === 'left' ? want[0] : want[1])) {
        s.saved = true
        io.emit('flipper-save', px(ball().x), px(ball().y), false)
      }
      return
    }
    if (e.ball > 0) {
      if (e.name === 'bumper' || e.name === 'sling') say('flasher')
      return
    }
    if (e.name === 'bumper') {
      if (gag === 'pinball.coffee') say('bumper', true)
      else say('flasher', true)
    } else if (e.name === 'scoop-kick') say('scoop-kick', true)
    else if (e.name === 'ball-hit') say('flasher', true)
    else if (e.name === 'ball-save') {
      if (gag === 'pinball.save' && !s.saved) {
        s.saved = true
        say('flipper-save', true)
      } else say('flasher')
    } else if (e.name === 'doors-slam') {
      say('doors-slam', true)
      io.cursor.hurt('flattened')
      io.cursor.act('shocked')
    } else if (e.name === 'tier-fall') {
      say('tier-fall')
      io.cursor.act('scared')
    } else if (e.name === 'drain') {
      say('drain')
      io.cursor.act('exhausted')
    } else if (e.name === 'ramp-roll' || e.name === 'spiral' || e.name === 'lift' || e.name === 'spinner' || e.name === 'drop-target' || e.name === 'sling' || e.name === 'tube-run' || e.name === 'plunger') say(e.name)
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
    on['plunger'] = false
    on['corporate.ladder'] = false
    on['street.mom'] = t > T.spiralEnd
    mc.gate = [t >= T.doorOpen, t >= T.officeOpen, t >= T.streetOpen]
    mc.magnet = null
    if (b.mode === 'hold' && b.hold === 'loader' && t >= T.tube) {
      mc.release(0)
      io.cursor.act('nervous')
    }
    if (t >= T.lightsDown && once('lights-down')) io.emit('lights-down', px(MID), px(MARQUEE_Y + 2), false)
    if (t >= T.powerOn && once('power-on')) io.emit('power-on', px(MID), px(MARQUEE_Y + 2), false)
    if (b.mode === 'rail' && b.rail === 'feed') b.speed = Math.max(6, Math.min(40, (railLength(railOf('feed')) - b.s) / Math.max(0.05, T.atPlunger - t)))
    if (b.mode === 'hold' && b.hold === 'plunger' && t >= T.plunger) {
      mc.release(0)
      io.cursor.act('scared')
    }
    if (b.mode === 'rail' && b.rail === 'launch') b.speed = Math.max(20, Math.min(60, (railLength(railOf('launch')) - b.s) / Math.max(0.05, T.onTable - t)))
    on['corporate.revolving'] = t < T.doorKick
    on['corporate.doors'] = t < T.doorOpen
    if (b.mode === 'hold' && b.hold === 'corporate.revolving') {
      b.wait = t >= T.doorKick ? Math.min(b.wait, 0.05) : 1e9
    }
    if (b.mode === 'hold' && b.hold === 'corporate.doors') b.wait = t >= T.doorOpen ? Math.min(b.wait, 0.01) : 1e9
    if (b.tier === 0 && b.mode === 'plane') {
      if (t >= T.doorKick - 0.6 && t < T.doorKick) towTo('corporate.revolving', 14)
      else if (t >= T.lobbyEnd) towGate(0)
      else if (t < T.doorKick) mc.magnet = [MID, Y0 + 6.0, b.y < Y0 + 8.4 ? 26 : 0]
    }
    on['office.inbox'] = t >= T.inboxOn && t < T.eject
    if (b.tier === 1 && b.mode === 'plane') {
      if (t >= T.inboxOn && t < T.eject) {
        if (t >= T.inboxBy) towTo('office.inbox')
        else mc.magnet = [holdOf('office.inbox').c[0], holdOf('office.inbox').c[1], 50]
      } else if (t < T.inboxOn) mc.magnet = [MID, Y1 + 4.3, b.y < Y1 + 7.5 ? 14 : 0]
      else if (t >= T.officeBy) towGate(1)
      else if (t >= T.officeOpen) mc.magnet = [MID, Y1 + 11, 30]
    }
    if (b.mode === 'hold' && b.hold === 'office.inbox') {
      b.wait = 1e9
      const h = holdOf('office.inbox')
      while (s.drops < T.drops.length && t >= T.drops[s.drops]!) {
        s.drops++
        if (s.drops < mc.balls.length) {
          mc.toPlane(s.drops, h.c[0], h.c[1], -7 - s.drops * 1.5, -5 + s.drops * 2.5)
          io.emit('ball-drop', px(h.c[0]), px(h.c[1]), false)
        }
      }
      if (t >= T.eject) {
        b.wait = 0
        io.cursor.act('angry')
      }
    }
    if (t >= T.officeBy + 2) for (let i = 1; i < mc.balls.length; i++) if (mc.balls[i]!.mode !== 'none') mc.remove(i)
    on['street.firehouse'] = t < T.scoopKick + 0.3
    if (b.tier === 2 && b.mode === 'plane') {
      if (t < T.scoopKick) {
        if (t >= T.firedBy) towTo('street.firehouse')
        else mc.magnet = [holdOf('street.firehouse').c[0], holdOf('street.firehouse').c[1], 50]
      } else if (t >= T.flapOn && t < T.highwayEnd) {
        const p = railOf('highway').points[0]!
        if (t >= T.flapBy || Math.hypot(b.x - p[0], b.y - p[1]) < 0.7) {
          if (t >= T.flapBy) s.tows++
          mc.tow(0, p[0], p[1], 16, 'rail:highway')
        } else mc.magnet = [p[0], p[1], 45]
      } else if (t >= T.streetBy) towGate(2)
      else if (t >= T.streetOpen) mc.magnet = [MID, Y2 + 11, 30]
    }
    if (b.mode === 'hold' && b.hold === 'street.firehouse') {
      b.wait = t >= T.scoopKick ? Math.min(b.wait, 0.01) : 1e9
      if (t >= T.scoopKick - 1.2) io.cursor.act('scared')
    }
    on['street.flap'] = false
    if (b.mode === 'rail' && b.rail === 'highway') b.speed = Math.max(3, Math.min(14, (railLength(railOf('highway')) - b.s) / Math.max(0.05, T.highwayEnd - t)))
    if (b.mode === 'rail' && b.rail === 'spiral') b.speed = Math.max(8, Math.min(30, (railLength(railOf('spiral')) - b.s) / Math.max(0.05, T.spiralEnd - t)))
    if (b.mode === 'rail' && b.rail === 'drain') b.speed = s.skipped ? 40 : 13
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
      drawLayout(out, layout, { states: activeStates(), runtime: { score: scoreText() }, over: s.pressed ? { 'go-cap': { z1: config.scale.heights.button - config.scale.heights.keyTravel } } : {} })
      for (const shape of fixedShapes()) out.push(shape)
      for (const shape of movingShapes(mc, lit(), false)) out.push(shape)
    },
    scroll: () => s.scroll,
    view: () => (s.floor === 0 ? null : follow()),
    camera(name: string, time: number): CameraPose | null {
      if (name === 'film') {
        let i = 0
        while (i + 1 < FILM.length && time >= FILM[i + 1]![0]) i++
        const now = named(FILM[i]![1])!
        const u = i > 0 ? (time - FILM[i]![0]) / BLEND : 1
        if (u >= 1) return now
        return mixPose(named(FILM[i - 1]![1])!, now, smooth(Math.max(0, u)))
      }
      return named(name)
    },
    script(time: number): Pointer {
      const flipLeft = held('L', time)
      const flipRight = held('R', time)
      if (time < T.press - 1.2) {
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
        const want = machine().wants()
        const b = ball()
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
    sheet(id: string): SheetFrame | null {
      if (id === 'clear-ball') {
        const mc = machine()
        const list: DrawList = []
        drawLayout(list, layout, { states: ['play', 'mode0', 'score0', 'score2'], runtime: { score: scoreText() } })
        for (const shape of fixedShapes()) list.push(shape)
        for (const shape of movingShapes(mc, table.inserts.map(() => true), true)) list.push(shape)
        const f = px(floorZ(1))
        const spots: { x: number; y: number; lift: number; pose: Partial<CursorPose> }[] = [
          { x: 7.68, y: Y1 + 8.84, lift: 0, pose: { acting: 'nervous' } },
          { x: 8.3, y: Y1 + 5.6, lift: 0.7, pose: { acting: 'scared', lean: 0.3 } },
          { x: MID + 1.3, y: Y1 + 5.95, lift: 0, pose: { acting: 'shocked', damage: ['flattened'] } }
        ]
        spots.forEach((p, i) => list.push({ id: `sheet-ball-${i + 1}`, part: 'clear-ball', kind: 'ball', x: px(p.x - 0.5), y: px(p.y - 0.5), w: BALL, h: BALL, z0: f + px(p.lift), z1: f + px(p.lift) + BALL, tone: 'glass' }))
        return { list, cursors: spots.map((p) => restPose(px(p.x), px(p.y), { z: f + px(p.lift), inBall: true, taken: true, ...p.pose })), view: frame({ x: px(6.6), y: px(Y1 + 4.7), w: px(6.4), h: px(5.2) }, 1, f, fov('sheet')) }
      }
      if (id !== 'table-map') return null
      const mc = machine()
      const list: DrawList = []
      drawLayout(list, layout, { states: ['play', 'mode5', 'mode0', 'mode3'], runtime: { score: scoreText() } })
      for (const shape of fixedShapes()) list.push(shape)
      for (const shape of movingShapes(mc, table.inserts.map(() => true), true)) list.push(shape)
      const top = px(MARQUEE_Y)
      const tall = px(APRON_Y + 2 - MARQUEE_Y)
      const f = fov('table-map')
      const c = toWorld(960, top + tall / 2, 0)
      const need = Math.max(tall, (1920 * 1920) / 1080) / 0.98
      return { list, cursors: [], view: { eye: [c[0], c[1], need / 2 / Math.tan((f * Math.PI) / 360)], target: c, fov: f }, width: 1080, height: 1920 }
    }
  }
  return logic
}
