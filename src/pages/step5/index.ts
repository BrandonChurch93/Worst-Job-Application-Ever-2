import { config, filmSeconds, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { drawLayout, find, shapeOf, walk } from '../../shell/layout'
import { words } from '../../shell/words'
import { homePose } from '../../stage/camera'
import type { CameraPose, DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, StepIo } from '../../stage/types'
import { KEYS, makeLayout, MARK_ROT, markOf, placesOf, spotOf, turned } from './layout'
import { CUES, pointerAt, type Marks } from './script'
import { AT } from './timeline'

type Phase = 'wait' | 'letter' | 'metrics' | 'reset'

interface State {
  n: number
  phase: Phase
  at: number
  mode: Mode
  music: boolean
  landed: boolean
  loomed: boolean
  stamped: boolean
  held: boolean
  flat: boolean
  peeled: boolean
  jolt: number
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
export const clock = (seconds: number): string => `${two(Math.floor(Math.max(0, seconds) / 60))}:${two(Math.floor(Math.max(0, seconds)) % 60)}`
export const secondsOf = (value: string): number => {
  const [m, s] = value.split(':')
  return Number(m) * 60 + Number(s)
}
export const spun = (value: string, u: number): string => value.replace(/\d/g, (d) => String(Math.ceil(Number(d) * (1 - clamp(u)))))

const fresh = (mode: Mode): State => ({
  n: 0, phase: 'wait', at: 0, mode, music: false, landed: false, loomed: false, stamped: false, held: false, flat: false, peeled: false, jolt: -1, your: 0, self: -1, shared: false, done: false, cue: 0, skip: false
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
  const start = { x: places.accept.cx, y: places.accept.cy + 14 }
  const marks: Marks = { start, spot, press: { x: places.accept.x + places.accept.w - 42, y: places.accept.cy - 8 } }
  const nodes = { wait: find(layout, 'wait-panel'), letter: find(layout, 'letter'), metrics: find(layout, 'metrics'), stamp: find(layout, 'stamp'), accept: find(layout, 'accept'), cap: find(layout, 'accept-cap') }
  const average = secondsOf(words(KEYS.averageValue))
  const target = secondsOf(words(KEYS.targetValue))
  const waitValue = words(KEYS.waitValue)
  const safe = { x: places.accept.cx, y: places.accept.cy + 14 }
  let s = fresh('live')

  const seconds = (): number => (s.n - s.at) / stepHz
  const inRect = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }, grow = 0): boolean => p.x >= b.x - grow && p.x <= b.x + b.w + grow && p.y >= b.y - grow && p.y <= b.y + b.h + grow
  const underStamp = (p: { x: number; y: number }): boolean => {
    const local = turned({ cx: 0, cy: 0 }, p.x + 20 - mark.cx, p.y + 34 - mark.cy, -MARK_ROT)
    return Math.abs(local.x) <= mark.blockW / 2 + 16 && Math.abs(local.y) <= mark.blockH / 2 + 30
  }
  const buttonShown = (): boolean => s.phase === 'reset' || (s.phase === 'metrics' && seconds() >= AT.button[0])
  const armed = (): boolean => s.phase === 'metrics' && seconds() >= AT.armed

  const groundAt = (x: number, y: number): number => {
    const p = { x, y }
    if (s.phase === 'wait') return inRect(p, { x: nodes.wait.box[0]!, y: nodes.wait.box[1]!, w: nodes.wait.box[2]!, h: nodes.wait.box[3]! }) ? heights.card : 0
    if (buttonShown() && inRect(p, places.accept)) return s.phase === 'reset' ? heights.button - heights.keyTravel : heights.button
    const m = nodes.metrics.box
    if ((s.phase !== 'letter' || seconds() >= AT.panel[1]) && inRect(p, { x: m[0]!, y: m[1]!, w: m[2]!, h: m[3]! })) return heights.card
    const l = nodes.letter.box
    if ((s.phase !== 'letter' || seconds() >= AT.drop[1]) && inRect(p, { x: l[0]!, y: l[1]!, w: l[2]!, h: l[3]! })) return heights.paper
    return 0
  }

  const press = (io: StepIo): void => {
    if (io.cursor.damaged) io.cursor.hurt('flattened', AT.hold - 0.12)
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
  }

  const yourTime = (io: StepIo): number => (s.mode === 'film' ? filmSeconds() : (io.elapsed ?? io.time))

  function stampPose(): { cx: number; cy: number; z: number; rot: number } | null {
    if (s.phase === 'wait') return null
    const rest = { cx: places.rest.cx, cy: places.rest.cy, z: 0, rot: 0 }
    if (s.phase !== 'letter') return rest
    const p = seconds()
    const high = 360
    const carryZ = 170
    const on = heights.paper
    if (p < AT.swoop[0]) return null
    if (p < AT.swoop[1]) {
      const u = out3(span(p, AT.swoop))
      return { cx: mark.cx + (1 - u) * 190, cy: mark.cy - (1 - u) * (mark.cy + 260), z: high + (1 - u) * 80, rot: MARK_ROT }
    }
    if (p < AT.slam[1]) {
      const u = span(p, AT.slam)
      return { cx: mark.cx, cy: mark.cy, z: on + (high - on) * (1 - u * u), rot: MARK_ROT }
    }
    if (p < AT.lift[0]) return { cx: mark.cx, cy: mark.cy, z: on, rot: MARK_ROT }
    if (p < AT.lift[1]) return { cx: mark.cx, cy: mark.cy, z: on + (carryZ - on) * smooth(span(p, AT.lift)), rot: MARK_ROT }
    if (p < AT.carry[1]) {
      const u = smooth(span(p, AT.carry))
      return { cx: mark.cx + (rest.cx - mark.cx) * u, cy: mark.cy + (rest.cy - mark.cy) * u, z: carryZ, rot: MARK_ROT * (1 - u) }
    }
    if (p < AT.lower[1]) {
      const u = span(p, AT.lower)
      return { ...rest, z: carryZ * (1 - u * u) }
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
    if (lettering && p < AT.slide[1]) {
      const fall = span(p, AT.drop)
      const k = 1 - out3(span(p, AT.slide))
      const b = nodes.letter.box
      carry(over, nodes.letter, { dx: -34 * k, dy: -52 * k, dz: 340 * (1 - fall * fall), rot: 0.045 * k, px: b[0]! + b[2]! / 2, py: b[1]! + b[3]! / 2 })
    }
    if (lettering && p < AT.panel[0]) over[nodes.metrics.id] = null
    else if (lettering && p < AT.panel[1]) carry(over, nodes.metrics, { dx: 0, dy: 0, dz: -(heights.card + 4) * (1 - smooth(span(p, AT.panel))), rot: 0, px: 0, py: 0 })
    const pose = stampPose()
    if (!pose) over[nodes.stamp.id] = null
    else if (pose.z !== 0 || pose.rot !== 0 || pose.cx !== places.rest.cx) carry(over, nodes.stamp, { dx: pose.cx - places.rest.cx, dy: pose.cy - places.rest.cy, dz: pose.z, rot: pose.rot, px: places.rest.cx, py: places.rest.cy })
    if (s.stamped) {
      states.push('stamped')
      over['letter-stamp'] = { ...(over['letter-stamp'] ?? {}), rot: MARK_ROT }
      const z = heights.paper
      const bar = (id: string, lx: number, ly: number, w: number, h: number): void => {
        const c = turned(mark, lx, ly)
        bars.push({ id, part: 'stamp', kind: 'box', x: c.x - w / 2, y: c.y - h / 2, w, h, z0: z, z1: z + 0.06, tone: 'danger', rot: MARK_ROT })
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
        if (s.phase === 'metrics') press(io)
      }
      if (s.mode === 'film') {
        while (s.cue < CUES.length && t >= CUES[s.cue]!.at) {
          const cue = CUES[s.cue++]!
          if (cursor.damaged) continue
          if (cue.act) cursor.act(cue.act)
          if (cue.react) cursor.react(cue.react)
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
          cursor.act('shocked')
          cursor.react('doubleTake')
        }
      } else if (s.phase === 'letter') {
        const p = seconds()
        if (!s.landed && p >= AT.drop[1]) {
          s.landed = true
          io.emit('letter-drop', places.letter.cx, places.letter.cy, false)
          io.emit('paper-slide', places.letter.cx, places.letter.cy, false)
          cursor.act('nervous')
          cursor.react('recoil')
        }
        if (!s.loomed && p >= AT.slam[0] - 0.22) {
          s.loomed = true
          if (underStamp(cursor)) {
            cursor.act('scared')
            cursor.react('flinch')
          }
        }
        if (!s.stamped && p >= AT.slam[1]) {
          s.stamped = true
          s.jolt = s.n
          const hit = underStamp(cursor)
          io.emit('stamp', mark.cx, mark.cy, hit)
          if (hit) {
            cursor.hurt('flattened')
            io.emit('flatten', cursor.x, cursor.y, true)
            cursor.take('stamp')
            cursor.place(cursor.x, cursor.y, heights.paper)
            s.held = true
            s.flat = true
            s.peeled = false
          } else {
            cursor.act('shocked')
            cursor.react('jump')
          }
        }
        if (s.held) {
          if (p >= AT.lift[1]) {
            s.held = false
            cursor.release()
          } else cursor.place(cursor.x, cursor.y, heights.paper)
        }
        if (p >= AT.letterSeconds) {
          s.phase = 'metrics'
          s.at = s.n
          s.your = yourTime(io)
          if (!s.flat) cursor.act('exhausted')
        }
      } else if (s.phase === 'metrics') {
        const p = seconds()
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
        if (seconds() >= AT.hold) {
          s.done = true
          if (s.self >= 0) cursor.release()
        }
      }
      if (s.flat) {
        if (!cursor.damaged) {
          s.flat = false
          if (!s.peeled) io.emit('peel-up', cursor.x, cursor.y, true)
          s.peeled = true
          cursor.act('exhausted')
        } else if (!s.peeled && cursor.pose().healing >= 0.82) {
          s.peeled = true
          io.emit('peel-up', cursor.x, cursor.y, true)
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
      if (s.jolt < 0) return null
      const j = (s.n - s.jolt) / stepHz
      if (j >= 0.32) return null
      const fade = 1 - j / 0.32
      return homePose(-9 * fade * fade * Math.cos(j * 46))
    },
    camera: () => null,
    script: (time: number): Pointer => pointerAt(marks, time),
    hint(): Hint | null {
      if (s.phase === 'wait') return { x: safe.x, y: safe.y, down: false }
      if (s.phase === 'letter' && !s.stamped) return { x: spot.x, y: spot.y, down: false, dodge: safe }
      return { x: marks.press.x, y: marks.press.y, down: armed() && s.self < 0 && Math.floor(s.n / (stepHz / 4)) % 2 === 0 }
    },
    skip() {
      if (s.phase !== 'reset') s.skip = true
    },
    done: () => s.done,
    gag: () => `decision.${s.phase}`,
    ignoring: () => false,
    states: () => look().states
  }
}
