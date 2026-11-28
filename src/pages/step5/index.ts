import { VOICE_FADE_SECONDS } from '../../audio/cues'
import { config, filmSeconds, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { drawLayout, find, shapeOf, walk } from '../../shell/layout'
import { words } from '../../shell/words'
import { frame, homePose } from '../../stage/camera'
import type { CameraPose, DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, StepIo } from '../../stage/types'
import { HANDOFF } from '../../cursor/body'
import { COUNTER_TOP, KEYS, makeLayout, MARK_ROT, markOf, SHEET_ROT, STAMP, placesOf, spotOf, turned, waitSpotOf } from './layout'
import { CUES, grown, HIT, hopAt, LIE, pointerAt, reboundAt, STUCK, type Marks } from './script'
import { AT, FILM, holdAfterPress, windowAt } from './timeline'

type Phase = 'wait' | 'letter' | 'metrics' | 'reset'

interface State {
  n: number
  phase: Phase
  at: number
  lt: number
  acted: number
  mode: Mode
  music: boolean
  landed: boolean
  loomed: boolean
  stamped: boolean
  held: boolean
  pull: number
  fx: number
  fy: number
  tx: number
  ty: number
  lx: number
  ly: number
  air: [number, number, number] | null
  flat: boolean
  peeled: boolean
  jolt: number
  hit: number
  turn: number
  your: number
  self: number
  shared: boolean
  done: boolean
  cue: number
  skip: boolean
}

type Over = Record<string, Partial<Shape> | null>
interface Move { dx: number; dy: number; dz: number; rot: number; px: number; py: number }

const heights = config.scale.heights
const clamp = (u: number): number => Math.min(1, Math.max(0, u))
const span = (p: number, range: readonly [number, number] | readonly number[]): number => clamp((p - range[0]!) / (range[1]! - range[0]!))
const smooth = (u: number): number => u * u * (3 - 2 * u)
const out3 = (u: number): number => 1 - (1 - u) * (1 - u) * (1 - u)
const two = (v: number): string => String(v).padStart(2, '0')
const capped = (seconds: number): number => Math.min(5999, Math.max(0, seconds))
export const clock = (seconds: number): string => `${two(Math.floor(capped(seconds) / 60))}:${two(Math.floor(capped(seconds)) % 60)}`
export const secondsOf = (value: string): number => {
  const [m, s] = value.split(':')
  return Number(m) * 60 + Number(s)
}
export const spun = (value: string, u: number): string => value.replace(/\d/g, (d) => String(Math.ceil(Number(d) * (1 - clamp(u)))))

const fresh = (mode: Mode): State => ({
  n: 0, phase: 'wait', at: 0, lt: -1, acted: 0, mode, music: false, landed: false, loomed: false, stamped: false, held: false, pull: -1, fx: 0, fy: 0, tx: 0, ty: 0, lx: 0, ly: 0, air: null, flat: false, peeled: false, jolt: -1, hit: -1, turn: AT.hold, your: 0, self: -1, shared: false, done: false, cue: 0, skip: false
})

function carry(over: Over, root: LayoutNode, m: Move): void {
  const c = Math.cos(m.rot)
  const s = Math.sin(m.rot)
  walk(root, (n, _parent, part) => {
    const shape = shapeOf(n, part)
    if (!shape) return
    const cx = shape.x + shape.w / 2 - m.px
    const cy = shape.y + shape.h / 2 - m.py
    const z1 = Math.max(shape.kind === 'text' ? 0 : 0.05, shape.z1 + m.dz)
    over[n.id] = { ...(over[n.id] ?? {}), x: m.px + cx * c - cy * s + m.dx - shape.w / 2, y: m.py + cx * s + cy * c + m.dy - shape.h / 2, z0: Math.min(z1, Math.max(0, shape.z0 + m.dz)), z1, rot: m.rot }
  }, null, root.part ?? 'shell')
}

export function makePage(): PageLogic {
  const beats = config.film.beats.filter((b) => b.unit === 'decision')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const layout = makeLayout()
  const places = placesOf(layout)
  const mark = markOf()
  const spot = spotOf()
  const start = { x: HANDOFF.x, y: HANDOFF.y }
  const drop = { x: places.rest.cx + markOf().blockW / 2 + STUCK.right, y: places.rest.cy + STUCK.down }
  const marks: Marks = { hand: start, wait: waitSpotOf(), spot, drop, press: { x: places.accept.x + places.accept.w - 42, y: places.accept.cy - 8 } }
  const counter = find(layout, 'wait-counter').box
  const nodes = { wait: find(layout, 'wait-panel'), letter: find(layout, 'letter'), metrics: find(layout, 'metrics'), stamp: find(layout, 'stamp'), accept: find(layout, 'accept'), cap: find(layout, 'accept-cap') }
  const average = secondsOf(words(KEYS.averageValue))
  const target = secondsOf(words(KEYS.targetValue))
  const waitValue = words(KEYS.waitValue)
  const safe = { x: places.accept.cx, y: places.accept.cy + 14 }
  let s = fresh('live')

  const seconds = (): number => (s.n - s.at) / stepHz
  const since = (): number => (s.phase === 'wait' ? -1 : s.lt < 0 ? 99 : (s.n - s.lt) / stepHz)
  const inRect = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }, grow = 0): boolean => p.x >= b.x - grow && p.x <= b.x + b.w + grow && p.y >= b.y - grow && p.y <= b.y + b.h + grow
  const underStamp = (p: { x: number; y: number }): boolean => {
    const local = turned({ cx: 0, cy: 0 }, p.x - mark.cx, p.y - mark.cy, -MARK_ROT)
    return Math.abs(local.x + 10) <= mark.blockW / 2 + 12 && local.y >= -mark.blockH / 2 - 40 && local.y <= mark.blockH / 2 - 4
  }
  const buttonShown = (): boolean => s.phase === 'reset' || (s.phase === 'metrics' && seconds() >= AT.button[0])
  const armed = (): boolean => s.phase === 'metrics' && seconds() >= AT.armed

  const groundAt = (x: number, y: number): number => {
    const p = { x, y }
    if (s.phase === 'wait') {
      if (inRect(p, { x: counter[0]!, y: counter[1]!, w: counter[2]!, h: counter[3]! })) return COUNTER_TOP
      return inRect(p, { x: nodes.wait.box[0]!, y: nodes.wait.box[1]!, w: nodes.wait.box[2]!, h: nodes.wait.box[3]! }) ? heights.card : 0
    }
    if (buttonShown() && inRect(p, places.accept)) return s.phase === 'reset' ? heights.button - heights.keyTravel : heights.button
    const m = nodes.metrics.box
    if ((s.phase !== 'letter' || seconds() >= AT.panel[1]) && inRect(p, { x: m[0]!, y: m[1]!, w: m[2]!, h: m[3]! })) return heights.card
    const l = nodes.letter.box
    if ((s.phase !== 'letter' || seconds() >= AT.drop[1]) && inRect(p, { x: l[0]!, y: l[1]!, w: l[2]!, h: l[3]! })) return heights.paper
    return 0
  }

  const hold = (io: StepIo, x: number, y: number): void => {
    io.cursor.take('stamp')
    s.held = true
    s.pull = s.n
    s.fx = io.cursor.x
    s.fy = io.cursor.y
    s.tx = x
    s.ty = y
  }

  // The press is seen at once. If the narrator's line on the stamp is being said, the page holds until the phrase being said has ended and the gap (`holdAfterPress`); the skip link turns at once, as it did.
  const press = (io: StepIo, atOnce: boolean = false): void => {
    if (io.cursor.damaged) io.cursor.hurt('flattened', AT.hold - 0.12)
    s.turn = atOnce || s.hit < 0 ? AT.hold : holdAfterPress((s.n - s.hit) / stepHz, s.mode === 'film' ? 0 : VOICE_FADE_SECONDS)
    // A visitor who is made to wait sees the arrow's blow on the button, as the film's arrow gives it.
    if (s.mode !== 'film' && s.turn > AT.hold) io.cursor.react('stamp')
    s.phase = 'reset'
    s.at = s.n
    io.emit('button-press', places.accept.cx, places.accept.cy, false)
  }

  const settle = (io: StepIo): void => {
    if (s.held) io.cursor.release()
    if (s.phase === 'wait' || s.phase === 'letter') {
      s.phase = 'metrics'
      s.at = s.n - Math.ceil(AT.armed * stepHz)
      s.your = yourTime(io)
    } else if (s.phase === 'metrics') s.at = Math.min(s.at, s.n - Math.ceil(AT.armed * stepHz))
    s.music = true
    s.landed = true
    s.loomed = true
    s.stamped = true
    s.held = false
    s.lt = -1
    s.jolt = -1
  }

  const yourTime = (io: StepIo): number => (s.mode === 'film' ? filmSeconds() : (io.elapsed ?? io.time))

  function stampPose(p: number = since()): { cx: number; cy: number; z: number; rot: number; tilt?: number; lay?: number } | null {
    if (s.phase === 'wait') return null
    const rest = { cx: places.rest.cx, cy: places.rest.cy, z: 0, rot: LIE.rot, lay: 1 }
    const high = STAMP.high
    const carryZ = HIT.carry
    const on = heights.paper
    if (p < AT.swoop[0]) return null
    const back = HIT.back
    if (p < AT.hang[0]) {
      const u = out3(span(p, AT.swoop))
      return { cx: mark.cx + back.x + (1 - u) * 230, cy: mark.cy + back.y - (1 - u) * (mark.cy + 420), z: high + (1 - u) * 16, rot: MARK_ROT + (1 - u) * 0.2 }
    }
    if (p < AT.hang[1]) {
      const wind = smooth(span(p, [AT.hang[1] - HIT.windSeconds, AT.hang[1]]))
      return { cx: mark.cx + back.x * (1 + 0.25 * wind), cy: mark.cy + back.y * (1 + 0.25 * wind), z: high + HIT.windRise * wind, rot: MARK_ROT, tilt: HIT.windTilt * wind }
    }
    if (p < AT.slam[1]) {
      const u = Math.pow(span(p, AT.slam), HIT.fallPower)
      return { cx: mark.cx + back.x * 1.25 * (1 - u), cy: mark.cy + back.y * 1.25 * (1 - u), z: on + (high + HIT.windRise - on) * (1 - u), rot: MARK_ROT, tilt: HIT.windTilt * (1 - u) }
    }
    const age = s.jolt >= 0 ? (s.n - s.jolt) / stepHz : HIT.over
    if (p < AT.lift[0]) return { cx: mark.cx, cy: mark.cy, z: on + HIT.rebound * reboundAt(age), rot: MARK_ROT }
    if (p < AT.lift[1]) return { cx: mark.cx, cy: mark.cy, z: on + (carryZ - on) * out3(span(p, AT.lift)), rot: MARK_ROT }
    if (p < AT.carry[1]) {
      const u = smooth(span(p, AT.carry))
      return { cx: mark.cx + (rest.cx - mark.cx) * u, cy: mark.cy + (rest.cy - mark.cy) * u, z: carryZ, rot: MARK_ROT + (LIE.rot - MARK_ROT) * u, lay: 0.35 * u }
    }
    if (p < AT.lower[1]) {
      const u = span(p, AT.lower)
      const v = span(p, AT.shake)
      const w = v < 1 ? Math.sin(3 * Math.PI * v) * (1 - v) : 0
      return { ...rest, cx: rest.cx + STUCK.shakeX * w, rot: LIE.rot + STUCK.shakeRot * w, z: carryZ * (1 - u * u), lay: 0.35 + 0.65 * smooth(u) }
    }
    return rest
  }

  function look(): { states: string[]; over: Over; runtime: Record<string, string>; bars: Shape[] } {
    const states: string[] = []
    const over: Over = {}
    const bars: Shape[] = []
    const p = seconds()
    const lettering = s.phase === 'letter'
    if (s.phase === 'wait') states.push('rest', 'wait', 'waiting')
    else if (lettering && p < AT.sink[1]) {
      states.push('wait', 'spinning')
      const u = smooth(span(p, AT.sink))
      if (u > 0) carry(over, nodes.wait, { dx: 0, dy: 0, dz: -(heights.card + 6) * u, rot: 0, px: 0, py: 0 })
    }
    const decided = !(s.phase === 'wait') && (!lettering || p >= AT.drop[0])
    const counting = s.phase === 'wait' || lettering || (s.phase === 'metrics' && p < AT.count[1])
    const u = s.phase === 'metrics' ? smooth(span(p, AT.count)) : 0
    const runtime: Record<string, string> = {
      'step5.waitValue': spun(waitValue, lettering ? p / AT.spin : 0),
      'step5.yourTime': clock(counting ? s.your * u : s.your),
      'step5.averageTime': clock(average * u),
      'step5.targetTime': clock(target * u),
      'step5.shareText': words(KEYS.shareText).replace('{time}', clock(s.your))
    }
    if (!decided) return { states, over, runtime, bars }
    states.push('decided', counting ? 'counting' : 'counted')
    const b = nodes.letter.box
    const mid = { cx: b[0]! + b[2]! / 2, cy: b[1]! + b[3]! / 2 }
    if (lettering && p < AT.slide[1]) {
      const fall = span(p, AT.drop)
      const k = 1 - out3(span(p, AT.slide))
      carry(over, nodes.letter, { dx: -56 * k, dy: 0, dz: 220 * (1 - fall * fall), rot: SHEET_ROT + 0.04 * k, px: mid.cx, py: mid.cy })
    } else carry(over, nodes.letter, { dx: 0, dy: 0, dz: 0, rot: SHEET_ROT, px: mid.cx, py: mid.cy })
    const struck = s.jolt >= 0 ? (s.n - s.jolt) / stepHz : HIT.over
    over[nodes.letter.id] = { ...(over[nodes.letter.id] ?? {}), v: [hopAt(struck), s.stamped ? Math.exp(-struck / 0.5) : 0] }
    if (lettering && p < AT.panel[0]) over[nodes.metrics.id] = null
    else if (lettering && p < AT.panel[1]) carry(over, nodes.metrics, { dx: 0, dy: 0, dz: -(heights.card + 4) * (1 - smooth(span(p, AT.panel))), rot: 0, px: 0, py: 0 })
    const pose = stampPose()
    if (!pose) over[nodes.stamp.id] = null
    else {
      carry(over, nodes.stamp, { dx: pose.cx - places.rest.cx, dy: pose.cy - places.rest.cy, dz: pose.z, rot: pose.rot, px: places.rest.cx, py: places.rest.cy })
      const age = struck
      const lp = since()
      const down = lp >= AT.lower[1] ? lp - AT.lower[1] : HIT.over
      const v = [Math.min(HIT.over, age), Math.min(HIT.over, down), pose.tilt ?? 0, pose.lay ?? 0, grown(pose.z - heights.paper) - (age < 0.02 ? HIT.pinch : 0), pose.z]
      over['stamp-block'] = { ...(over['stamp-block'] ?? {}), v }
      over['stamp-grip'] = { ...(over['stamp-grip'] ?? {}), v }
      if (age < HIT.dustSeconds) {
        const reach = HIT.dustReach
        bars.push({ id: 'stamp-dust', part: 'stamp', kind: 'box', role: 'dust', x: mark.cx - mark.blockW / 2 - reach, y: mark.cy - mark.blockH / 2 - reach, w: mark.blockW + reach * 2, h: mark.blockH + reach * 2, z0: heights.paper, z1: heights.paper + 0.05, tone: 'paper', rot: MARK_ROT, v: [age] })
      }
    }
    if (s.air && s.air[2] > 1) {
      const z = s.air[2]
      const r = STUCK.shade + z * 0.16
      const cx = s.air[0] + 20 + z * 0.44
      const cy = s.air[1] + 34 + z * 0.4
      bars.push({ id: 'cursor-fall-shade', part: 'stamp', kind: 'box', role: 'fallShade', x: cx - r, y: cy - r, w: r * 2, h: r * 2, z0: 1, z1: 1.05, tone: 'paper', rot: 0, v: [STUCK.shadeDark * Math.min(1, z / 14) * (1 - 0.45 * Math.min(1, z / 160))] })
    }
    if (s.stamped) {
      states.push('stamped')
      over['letter-stamp'] = { ...(over['letter-stamp'] ?? {}), rot: MARK_ROT + SHEET_ROT }
      const z = heights.paper
      const bar = (id: string, lx: number, ly: number, w: number, h: number): void => {
        const flat = turned(mark, lx, ly)
        const c = turned(mid, flat.x - mid.cx, flat.y - mid.cy, SHEET_ROT)
        bars.push({ id, part: 'stamp', kind: 'box', x: c.x - w / 2, y: c.y - h / 2, w, h, z0: z, z1: z + 0.06, tone: 'dark', rot: MARK_ROT + SHEET_ROT })
      }
      bar('letter-mark-top', 0, -(mark.h - mark.bar) / 2, mark.w, mark.bar)
      bar('letter-mark-bottom', 0, (mark.h - mark.bar) / 2, mark.w, mark.bar)
      bar('letter-mark-left', -(mark.w - mark.bar) / 2, 0, mark.bar, mark.h)
      bar('letter-mark-right', (mark.w - mark.bar) / 2, 0, mark.bar, mark.h)
    }
    if (!buttonShown()) over[nodes.accept.id] = null
    else {
      states.push(s.shared ? 'shared' : 'link')
      const rise = s.phase === 'metrics' ? smooth(span(p, AT.button)) : 1
      const top = s.phase === 'reset' ? heights.button - heights.keyTravel : 0.5 + (heights.button - 0.5) * rise
      over['accept-cap'] = { z1: top }
      over['accept-label'] = { z0: top, z1: top }
    }
    return { states, over, runtime, bars }
  }

  return {
    id: 'step5', unit: 'decision', width: 1920, height: 1080, layout, gags, start, control: 'pointer',
    reset(ctx: PageContext) {
      s = fresh(ctx.mode)
    },
    step(io: StepIo) {
      const cursor = io.cursor
      const t = s.n / stepHz
      if (s.skip) {
        s.skip = false
        settle(io)
        if (s.phase === 'metrics') press(io, true)
      }
      if (s.mode === 'film') {
        while (s.cue < CUES.length && t >= CUES[s.cue]!.at) {
          const cue = CUES[s.cue++]!
          if (cursor.damaged) continue
          if (cue.act) cursor.act(cue.act)
          if (cue.react) cursor.react(cue.react)
          if (cue.aim !== undefined) cursor.aim(cue.aim)
        }
      }
      if (s.phase === 'wait') {
        if (s.n === 0) cursor.act('nervous')
        if (!s.music && t >= AT.music) {
          s.music = true
          io.emit('hold-music', places.wait.cx, places.wait.cy, false)
        }
        if (t >= AT.decide) {
          s.phase = 'letter'
          s.at = s.n
          s.lt = s.n
        }
      } else if (s.phase === 'letter') {
        const p = seconds()
        if (s.n - s.at === Math.ceil(AT.panel[1] * stepHz)) io.emit('metrics-card', nodes.metrics.box[0]! + nodes.metrics.box[2]! / 2, nodes.metrics.box[1]! + nodes.metrics.box[3]! / 2, false)
        if (s.acted < 1 && p >= AT.drop[0]) {
          s.acted = 1
          cursor.act('shocked')
        }
        if (!s.landed && p >= AT.drop[1]) {
          s.landed = true
          io.emit('letter-drop', places.letter.cx, places.letter.cy, false)
          io.emit('paper-slide', places.letter.cx, places.letter.cy, false)
          cursor.react('jump')
        }
        if (s.acted < 2 && p >= AT.proud) {
          s.acted = 2
          cursor.act('proud')
        }
        if (!s.stamped && !s.held && p >= AT.pull && !underStamp(cursor)) hold(io, spot.x, spot.y)
        if (!s.loomed && p >= AT.loom) {
          s.loomed = true
          if (!s.held) hold(io, cursor.x, cursor.y)
          cursor.aim(null)
          cursor.act('scared')
          cursor.react('rear')
        }
        if (s.held && !s.stamped) {
          const left = Math.max(0.05, Math.min(AT.pullSeconds, AT.slam[1] - 0.06 - (s.pull - s.at) / stepHz))
          const u = smooth(clamp((s.n - s.pull) / stepHz / left))
          const x = s.fx + (s.tx - s.fx) * u
          const y = s.fy + (s.ty - s.fy) * u
          cursor.drive(x, y, heights.cursorHover + groundAt(x, y))
        }
        if (!s.stamped && p >= AT.slam[1]) {
          s.stamped = true
          s.jolt = s.n
          s.hit = s.n
          const hit = underStamp(cursor)
          io.emit('stamp', hit ? cursor.x : mark.cx, hit ? cursor.y : mark.cy, hit)
          if (hit) {
            cursor.hurt('flattened')
            io.emit('flatten', cursor.x, cursor.y, true)
            if (!s.held) cursor.take('stamp')
            s.held = true
            s.flat = true
            s.peeled = false
            s.tx = cursor.x
            s.ty = cursor.y
            const local = turned({ cx: 0, cy: 0 }, cursor.x - mark.cx, cursor.y - mark.cy, -MARK_ROT)
            s.lx = local.x
            s.ly = local.y
          } else {
            if (s.held) cursor.release()
            s.held = false
            cursor.act('shocked')
            cursor.react('jump')
          }
        }
        if (p >= AT.letterSeconds) {
          s.phase = 'metrics'
          s.at = s.n
          s.your = yourTime(io)
          if (!s.flat) cursor.act('exhausted')
        }
      } else if (s.phase === 'metrics') {
        const p = seconds()
        if (s.n - s.at === Math.ceil(AT.count[0] * stepHz)) io.emit('count-run', nodes.metrics.box[0]! + nodes.metrics.box[2]! / 2, nodes.metrics.box[1]! + nodes.metrics.box[3]! / 2, false)
        if (io.pressed && buttonShown() && !s.shared && (inRect(io.pointer, places.share, 10) || inRect(cursor, places.share, 10))) {
          s.shared = true
          io.emit('share', places.share.cx, places.share.cy, false)
        }
        if (s.self >= 0) {
          cursor.drive(marks.press.x, marks.press.y, heights.button + heights.cursorHover)
          if (inRect(cursor, places.accept) && (s.n - s.self) / stepHz >= 0.4) press(io)
          else if ((s.n - s.self) / stepHz >= AT.selfWalk) press(io)
        } else if (armed() && io.pressed && (inRect(io.pointer, places.accept, 4) || inRect(cursor, places.accept, 4))) press(io)
        else if (p >= AT.selfAfter) {
          s.self = s.n
          cursor.take('accept')
          cursor.drive(marks.press.x, marks.press.y, heights.button + heights.cursorHover)
        }
      } else if (!s.done) {
        if (s.self >= 0 && cursor.taken) cursor.drive(marks.press.x, marks.press.y, heights.button - heights.keyTravel + heights.cursorHover)
        if (seconds() >= s.turn) {
          s.done = true
          if (s.self >= 0) cursor.release()
        }
      }
      // A press in the last steps of the throw used to end the page 0.45 s later with the arrow still held. Now the page holds for the phrase being said, so the throw is let finish and the arrow is given back.
      if (s.held && s.stamped && (s.phase !== 'reset' || s.turn > AT.hold)) {
        const p = since()
        const pose = stampPose()
        s.air = null
        if (p >= AT.fling[1] || !pose) {
          s.held = false
          cursor.place(drop.x, drop.y, 0)
          // Landed after the press, the arrow is whole before the page turns, as it is when it is pressed lying flat.
          const heal = s.mode === 'film' ? FILM.heal : STUCK.heal
          cursor.hurt('flattened', s.phase === 'reset' ? Math.max(0.1, Math.min(heal, s.turn - seconds() - 0.12)) : heal)
          cursor.release()
        } else if (p < AT.lift[0]) cursor.place(s.tx, s.ty, heights.paper)
        else {
          const from = p < AT.fling[0] ? pose : (stampPose(AT.fling[0]) ?? pose)
          const k = grown(from.z - heights.paper)
          const at = turned({ cx: from.cx, cy: from.cy }, s.lx * k, s.ly * k + STUCK.hang * (from.lay ?? 0), from.rot)
          const u = span(p, AT.fling)
          const off = out3(Math.min(1, u / STUCK.off))
          const fall = Math.min(1, Math.max(0, (u - STUCK.off) / (STUCK.fall - STUCK.off)))
          const skid = smooth(Math.max(0, (u - STUCK.fall) / (1 - STUCK.fall)))
          const swing = Math.sin(2 * Math.PI * STUCK.swings * fall) * (1 - 0.6 * fall)
          const short = { x: drop.x - STUCK.skid, y: drop.y - STUCK.skid * 0.3 }
          const to: [number, number, number] = [
            at.x + (short.x - at.x) * off + STUCK.clear * off * (1 - fall) + STUCK.sway * swing + STUCK.skid * skid,
            at.y + (short.y - at.y) * off - STUCK.sway * 0.3 * Math.abs(swing) + STUCK.skid * 0.3 * skid,
            (from.z + STUCK.up * off) * (1 - fall) + STUCK.float * Math.abs(swing) * (1 - fall)
          ]
          cursor.place(to[0], to[1], to[2])
          if (p >= AT.fling[0]) s.air = to
        }
      }
      if (s.flat) {
        if (!cursor.damaged) {
          s.flat = false
          if (!s.peeled) io.emit('peel-up', cursor.x, cursor.y, false)
          s.peeled = true
          cursor.act('exhausted')
        } else if (!s.peeled && cursor.pose().healing >= 0.82) {
          s.peeled = true
          io.emit('peel-up', cursor.x, cursor.y, false)
        }
      }
      cursor.setGround(groundAt(cursor.x, cursor.y))
      s.n++
    },
    save: () => ({ ...s }),
    load(state) {
      s = { ...(state as State) }
    },
    draw(out: DrawList) {
      const made = look()
      drawLayout(out, layout, { states: made.states, over: made.over, runtime: made.runtime })
      for (const b of made.bars) out.push(b)
    },
    scroll: () => 0,
    view(): CameraPose | null {
      const j = s.jolt < 0 ? 1 : (s.n - s.jolt) / stepHz
      if (j < 0.3) {
        const fade = 1 - j / 0.3
        return homePose(-HIT.shake * fade * fade * Math.cos(j * 52))
      }
      // The film only: the slow push-in under the narrator's line (`VIEW` in timeline.ts). A visitor's view stays whole.
      const part = s.mode === 'film' ? windowAt(s.n / stepHz) : null
      return part ? frame(part) : null
    },
    camera: () => null,
    script: (time: number): Pointer => pointerAt(marks, time),
    hint(): Hint | null {
      if (s.phase === 'wait') return { x: safe.x, y: safe.y, down: false }
      if (s.phase === 'letter' && !s.stamped) return { x: spot.x, y: spot.y, down: false }
      return { x: marks.press.x, y: marks.press.y, down: armed() && s.self < 0 && Math.floor(s.n / (stepHz / 4)) % 2 === 0 }
    },
    skip() {
      if (s.phase !== 'reset') s.skip = true
    },
    done: () => s.done,
    gag: () => `decision.${s.phase}`,
    ignoring: () => s.held || (s.self >= 0 && !s.done),
    states: () => look().states
  }
}
