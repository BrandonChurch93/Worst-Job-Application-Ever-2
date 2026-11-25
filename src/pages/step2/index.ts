import { config, stepHz } from '../../config'
import type { LayoutNode } from '../../copy'
import { Random, stream } from '../../core/random'
import { restPose, type Acting } from '../../cursor/body'
import { boxOf, drawLayout, find, walk } from '../../shell/layout'
import { measure } from '../../shell/metrics'
import { SCREEN_H, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { frame } from '../../stage/camera'
import type { DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo, Tone } from '../../stage/types'
import { buildLayout, CRANK, DIAL, FH, FW, FX, PAD, reelId, ROWS, rowY, SHIFT, SLOT, statesOf, TOP, TRAY_H, TRAY_Z, trayY } from './layout'
import { actingAt, LANDING, pointerAt, reactions, type Mark, type Marks } from './script'

const dt = 1 / stepHz
const LIMIT = config.live.skipLinkAfterSeconds
const DIGITS = config.live.step2.dialDigitsBeforeItGivesUp
const TURNS = config.live.step2.crankTurnsBeforeItRunsAway
const HEAL = config.cursor.damageHealSeconds * 0.85
const hover = config.scale.heights.cursorHover
const heights = config.scale.heights
const G = 2400
const TAU = Math.PI * 2
const STOPS = [0.8, 1.15, 1.5]
const REEL_PITCH = 62
const COINS = 14
const RETURN = 18

type RowPhase = 'closed' | 'opening' | 'ready' | 'ending' | 'closing'
interface Coin { n: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; rot: number; hit: boolean; still: boolean }
interface DialState { a: number; k: number; phase: 'rest' | 'drag' | 'return' | 'whip' | 'fly' | 'over'; digits: string; w: number; left: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number }
interface SlotState { p: number; pv: number; grab: boolean; phase: 'rest' | 'spin' | 'read' | 'pay' | 'over'; t: number; from: number[]; to: number[]; coins: Coin[]; spawned: number; cool: number; rang: boolean }
interface CrankState { b: number; set: boolean; grab: boolean; total: number; turns: number; phase: 'rest' | 'runaway' | 'full' | 'over'; w: number; level: number; hit: boolean; hitAt: number; peeled: boolean; t: number; stuck: number; sx: number; sy: number }
interface State {
  mode: 'live' | 'film'
  time: number
  open: number
  phase: RowPhase
  spring: number[]
  springV: number[]
  lift: number
  rowT: number
  endT: number
  idle: number
  done: boolean[]
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

const freshDial = (): DialState => ({ a: 0, k: 0, phase: 'rest', digits: '', w: 0, left: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0 })
const freshSlot = (): SlotState => ({ p: 0, pv: 0, grab: false, phase: 'rest', t: 0, from: [0, 0, 0], to: [0, 0, 0], coins: [], spawned: 0, cool: 0, rang: false })
const freshCrank = (): CrankState => ({ b: CRANK.rest, set: false, grab: false, total: 0, turns: 0, phase: 'rest', w: 0, level: 0, hit: false, hitAt: -1, peeled: false, t: 0, stuck: 0, sx: 0, sy: 0 })
const fresh = (mode: 'live' | 'film'): State => ({
  mode, time: 0, open: -1, phase: 'closed', spring: [0, 0, 0], springV: [0, 0, 0], lift: 0, rowT: 0, endT: 0, idle: 0, done: [false, false, false], px: 0, py: 0,
  dial: freshDial(), slot: freshSlot(), crank: freshCrank(), pressed: false, hold: 0, finished: false, skipping: false, gripped: false, marks: {}, rng: []
})

export const phoneMask = (digits: string): string => words('data:step2.phone.prefix') + digits

const holePlace = (k: number, a: number): { x: number; y: number } => ({ x: DIAL.cx + DIAL.ring * Math.cos(DIAL.holeAngle(k) + a), y: DIAL.cy + DIAL.ring * Math.sin(DIAL.holeAngle(k) + a) })
const gripPlace = (b: number, r: number = CRANK.arm): { x: number; y: number } => ({ x: CRANK.hx + r * Math.cos(b), y: CRANK.hy + r * Math.sin(b) })
const knobY = (p: number): number => SLOT.knobY + SLOT.pull * clamp(p, 0, 1)
const reelPos = (slot: SlotState, r: number): number => {
  if (slot.phase === 'rest') return slot.to[r]!
  if (slot.phase !== 'spin') return slot.to[r]!
  const stop = STOPS[r]!
  if (slot.t < stop) return mix(slot.from[r]!, slot.to[r]!, slot.t / stop)
  const late = slot.t - stop
  return slot.to[r]! + 0.22 * Math.exp(-11 * late) * Math.sin(20 * late)
}

interface RowIds { ids: { id: string; y: number }[] }

function rowParts(tree: LayoutNode, prefix: string): RowIds {
  const ids: { id: string; y: number }[] = []
  for (const top of [`${prefix}-label`, `${prefix}-helper`, `${prefix}-pocket`]) walk(find(tree, top), (n) => void ids.push({ id: n.id, y: n.box[1]! }))
  return { ids }
}

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

export function makePage(): PageLogic {
  const layout = buildLayout()
  const beats = config.film.beats.filter((b) => b.unit === 'step2')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string | null }).event ?? null }))
  const go = boxOf(layout, 'continue-cap')
  const up = ROWS.map((name) => rowParts(layout, name))
  const low = ROWS.map((name, i) => (i > 0 ? rowParts(layout, `${name}-low`) : null))
  const parts = ROWS.map((name) => machineParts(layout, `${name}-tray`))
  const legendBox = SLOT.strips.map((strip, r) => boxOf(layout, reelId(r, strip[0]!)))
  let s = fresh('live')
  let rng: Random = stream('step2', config.seed)
  let seed: number = config.seed

  const allDone = (): boolean => s.done.every(Boolean)
  const fieldAt = (i: number): { x: number; y: number } => ({ x: FX + FW / 2, y: rowY(i) + FH / 2 })
  const inField = (p: { x: number; y: number }, i: number): boolean => p.x >= FX && p.x <= FX + FW && p.y >= rowY(i) && p.y <= rowY(i) + FH
  const overGo = (p: { x: number; y: number }): boolean => p.x >= go.x && p.x <= go.x + go.w && p.y >= go.y && p.y <= go.y + go.h
  const settled = (): string[] | null => (s.slot.phase === 'spin' ? null : SLOT.strips.map((strip, r) => strip[mod(Math.round(s.slot.to[r]!), strip.length)]!))

  function openRow(i: number, io: StepIo): void {
    s.open = i
    s.phase = 'opening'
    s.rowT = 0
    s.endT = 0
    s.lift = 0
    s.idle = 0
    if (i === 2) s.crank.set = true
    io.emit('row-open', FX + FW / 2, rowY(i) + FH / 2, false)
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
        d.w = 5
        d.left = d.a + TAU + mod(DIAL.holeAngle(d.k) + Math.PI / 2, TAU)
        io.cursor.take('dial')
        if (s.mode === 'live') io.cursor.act('scared')
        return
      }
    } else if (d.a > 0.09) io.emit('dial-return', at.x, at.y, false)
    d.phase = 'return'
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
      d.a = Math.max(0, d.a - RETURN * dt)
      if (d.a === 0) {
        d.phase = s.done[0] ? 'over' : 'rest'
        d.k = 0
      }
    } else if (d.phase === 'whip') {
      d.w = Math.min(30, d.w + 38 * dt)
      const turn = Math.min(d.left, d.w * dt)
      d.a -= turn
      d.left -= turn
      const at = holePlace(d.k, d.a)
      io.cursor.place(at.x, at.y, TOP + 6)
      if (d.left <= 1e-9) {
        io.emit('dial-fling', at.x, at.y, true)
        mark(io, 'fling', 'shocked')
        d.phase = 'fly'
        d.x = at.x
        d.y = at.y
        d.z = TOP + 6
        const air = 0.72
        d.vx = (LANDING.x - at.x) / air
        d.vy = (LANDING.y - at.y) / air
        d.vz = (hover - d.z) / air + (G * air) / 2
        d.a = mod(d.a, TAU)
        s.done[0] = true
        d.t = 0
      }
    } else if (d.phase === 'fly') {
      d.a = Math.max(0, d.a - RETURN * dt)
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.vz -= G * dt
      d.z += d.vz * dt
      if (d.z <= hover && d.vz < 0) {
        io.cursor.place(d.x, d.y, hover)
        io.cursor.release()
        io.cursor.react('recoil')
        if (s.mode === 'live') io.cursor.act('nervous')
        d.phase = 'return'
      } else io.cursor.place(d.x, d.y, Math.max(hover, d.z))
    }
    if (s.done[0]) d.t += dt
    return s.done[0]! && d.phase === 'over' && d.t > 0.5
  }

  function pull(io: StepIo): void {
    const sl = s.slot
    sl.grab = false
    sl.p = 1
    sl.pv = 0
    sl.phase = 'spin'
    sl.t = 0
    io.emit('lever-pull', SLOT.leverX, knobY(1), false)
    io.emit('reels-spin', SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h / 2, false)
    for (let r = 0; r < 3; r++) {
      const strip = SLOT.strips[r]!
      const want = s.mode === 'film' ? strip.indexOf(SLOT.film[r]!) : rng.int(strip.length)
      const least = Math.ceil(sl.from[r]! + 13 * STOPS[r]!)
      sl.to[r] = least + mod(want - least, strip.length)
    }
  }

  function mark(io: StepIo, name: Mark, live: Acting): void {
    s.marks[name] = io.time
    io.cursor.act(s.mode === 'film' ? actingAt(io.time, s.marks) : live)
  }

  function stepCoins(io: StepIo): void {
    const sl = s.slot
    const c = io.cursor
    sl.cool = Math.max(0, sl.cool - dt)
    for (const coin of sl.coins) {
      if (coin.still) continue
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
        if (sl.cool === 0) {
          c.react('flinch')
          sl.cool = 0.2
        }
        coin.vx = -coin.vx * 0.35 + rng.range(-120, 120)
        coin.vy = coin.vy * 0.3 + rng.range(-120, 120)
        coin.vz = 260
      }
      if (coin.z <= 0 && coin.vz < 0) {
        if (!sl.rang) {
          sl.rang = true
          io.emit('coins', coin.x, coin.y, false)
        }
        coin.z = 0
        coin.vz = -coin.vz > 140 ? -coin.vz * 0.42 : 0
        coin.vx *= 0.72
        coin.vy *= 0.72
      }
      if (coin.z === 0 && coin.vz === 0) {
        const k = 1 - 2.6 * dt
        coin.vx *= k
        coin.vy *= k
        if (Math.hypot(coin.vx, coin.vy) < 10) coin.still = true
      }
      coin.x = clamp(coin.x, 20, 1900)
      coin.y = clamp(coin.y, 170, SCREEN_H - 20)
    }
  }

  function stepSlot(io: StepIo, forced: boolean): boolean {
    const sl = s.slot
    const p = io.pointer
    if (sl.phase === 'rest') {
      if (forced) pull(io)
      else if (!sl.grab && io.pressed && Math.hypot(p.x - SLOT.leverX, p.y - knobY(sl.p)) <= SLOT.knob / 2 + 8) sl.grab = true
      else if (sl.grab) {
        if (!p.down) sl.grab = false
        else {
          sl.p = clamp((p.y - SLOT.knobY) / SLOT.pull, 0, 1)
          sl.pv = 0
          if (sl.p >= 0.85) pull(io)
        }
      }
    }
    if (!sl.grab && (sl.p !== 0 || sl.pv !== 0)) {
      sl.pv += (-260 * sl.p - 18 * sl.pv) * dt
      sl.p += sl.pv * dt
      if (sl.p < 0) {
        sl.p = 0
        sl.pv = Math.abs(sl.pv) > 0.4 ? -sl.pv * 0.3 : 0
      }
    }
    if (sl.phase === 'spin') {
      sl.t += dt
      if (sl.t >= STOPS[2]! + 0.25) {
        sl.phase = 'read'
        sl.t = 0
        s.done[1] = true
        for (let r = 0; r < 3; r++) sl.from[r] = sl.to[r]!
      }
    } else if (sl.phase === 'read') {
      sl.t += dt
      if (sl.t >= 0.4) {
        sl.phase = 'pay'
        sl.t = 0
        if (s.mode === 'live') io.cursor.act('shocked')
      }
    } else if (sl.phase === 'pay') {
      sl.t += dt
      while (sl.spawned < COINS && sl.t >= sl.spawned * 0.05) {
        const x = SLOT.payX + SLOT.payW / 2 + rng.range(-70, 70)
        const y = SLOT.payY + SLOT.payH / 2
        let dx = io.cursor.x + 14 + rng.range(-30, 30) - x
        let dy = io.cursor.y + 28 + rng.range(-30, 30) - y
        const far = Math.hypot(dx, dy)
        if (far > 430) {
          dx *= 430 / far
          dy *= 430 / far
        }
        if (far < 60) dy += 90
        const air = rng.range(0.4, 0.52)
        sl.coins.push({ n: sl.spawned, x, y, z: 6, vx: dx / air, vy: dy / air, vz: (16 - 6) / air + (G * air) / 2, rot: 0, hit: false, still: false })
        sl.spawned++
      }
      if (sl.t >= 1.2) {
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
        c.level = Math.min(1, 0.1 * c.turns)
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
            c.w = mix(c.w, d / dt, 0.2)
            turned()
            if (c.turns >= TURNS) runaway(io)
          }
        }
      }
    } else if (c.phase === 'runaway' || c.phase === 'full') {
      c.t += dt
      if (c.phase === 'runaway') c.w = Math.min(42, c.w + 26 * dt)
      else c.w *= 1 - 5 * dt
      c.b += c.w * dt
      c.total += c.w * dt
      turned()
      if (c.phase === 'runaway' && c.level >= 1) {
        c.phase = 'full'
        s.done[2] = true
      }
      if (c.phase === 'full' && c.w < 0.5) {
        c.phase = 'over'
        c.w = 0
      }
      const cur = io.cursor
      if (!c.hit && c.t >= 0.2 && c.w > 6 && cur.z < 70 && !cur.taken) {
        const tip = gripPlace(c.b, CRANK.arm + CRANK.gripW / 2)
        const mx = cur.x + 10 - CRANK.hx
        const my = cur.y + 20 - CRANK.hy
        const ax = tip.x - CRANK.hx
        const ay = tip.y - CRANK.hy
        const u = clamp((mx * ax + my * ay) / (ax * ax + ay * ay), 0.25, 1)
        if (Math.hypot(mx - ax * u, my - ay * u) < 26) {
          c.hit = true
          c.hitAt = s.time
          c.stuck = 0.45
          c.sx = cur.x
          c.sy = cur.y
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
      io.cursor.place(c.sx, c.sy, hover)
      if (c.stuck <= 0) io.cursor.release()
    }
    if (c.hit && !c.peeled && s.time >= c.hitAt + HEAL - 0.4) {
      c.peeled = true
      io.emit('peel-up', io.cursor.x, io.cursor.y, false)
      if (s.mode === 'live') io.cursor.act('plain')
    }
  }

  function topAt(x: number, y: number): number {
    const i = s.open
    if (i < 0) return 0
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
      if (x >= SLOT.x && x <= SLOT.x + SLOT.w && y >= SLOT.y && y <= SLOT.y + SLOT.h) put(TOP + 8)
      if (x >= SLOT.x + 10 && x <= SLOT.x + SLOT.w - 10 && y >= SLOT.y + 14 && y <= SLOT.y + SLOT.h - 14) put(TOP + 14)
      if (Math.abs(x - SLOT.leverX) <= 6 && y >= ky && y <= SLOT.knobY + SLOT.pull + 34) put(TOP + 12)
      if (Math.hypot(x - SLOT.leverX, y - ky) <= SLOT.knob / 2) put(TOP + 40)
    } else {
      const c = s.crank
      const far = Math.hypot(x - CRANK.hx, y - CRANK.hy)
      if (far <= CRANK.base / 2) put(18)
      if (far <= CRANK.hub / 2) put(TOP + 10)
      if (x >= CRANK.segX && x <= CRANK.segX + 10 * CRANK.segW + 9 * CRANK.segGap && y >= CRANK.segY && y <= CRANK.segY + CRANK.segH) put(18)
      if (c.phase === 'rest') {
        const ux = Math.cos(c.b)
        const uy = Math.sin(c.b)
        const along = (x - CRANK.hx) * ux + (y - CRANK.hy) * uy
        const across = Math.abs(-(x - CRANK.hx) * uy + (y - CRANK.hy) * ux)
        if (along >= 0 && along <= CRANK.arm && across <= 8) put(TOP + 6)
        if (Math.abs(along - CRANK.arm) <= CRANK.gripW / 2 && across <= CRANK.gripH / 2) put(TOP + 30)
      }
    }
    return top <= TRAY_Z ? 0 : Math.max(0, mix(TRAY_Z, top, smooth(s.lift)))
  }

  function ground(io: StepIo): void {
    const x = io.cursor.x
    const y = io.cursor.y
    io.cursor.setGround(Math.max(topAt(x, y), topAt(x + 12, y + 18), topAt(x + 22, y + 34), topAt(x + 4, y + 34)))
  }

  function grip(io: StepIo): void {
    const ready = s.open >= 0 && s.phase === 'ready'
    let at: { x: number; y: number; z: number } | null = null
    if (ready && s.open === 0 && s.dial.phase === 'drag') at = { ...holePlace(s.dial.k, s.dial.a), z: TOP + 3 }
    if (ready && s.open === 1 && s.slot.grab) at = { x: SLOT.leverX, y: knobY(s.slot.p), z: TOP + 40 }
    if (ready && s.open === 2 && s.crank.grab) at = { ...gripPlace(s.crank.b), z: TOP + 30 }
    if (at) {
      io.cursor.take('grip')
      io.cursor.place(at.x, at.y, at.z + hover)
      s.gripped = true
    } else if (s.gripped) {
      s.gripped = false
      if (s.dial.phase !== 'whip' && s.dial.phase !== 'fly') io.cursor.release()
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
      s.time = io.time
      s.px = io.pointer.x
      s.py = io.pointer.y
      if (s.mode === 'film') {
        io.cursor.act(actingAt(io.time, s.marks))
        for (const [at, name] of reactions) if (io.step === Math.round(at * stepHz)) io.cursor.react(name)
      }
      if (s.skipping && !s.pressed) {
        for (let i = 0; i < 3; i++) s.done[i] = true
        s.crank.level = 1
        if (s.open >= 0 && s.phase !== 'closing') {
          s.phase = 'closing'
          if (io.cursor.taken) io.cursor.release()
        }
      }
      if (s.open < 0) {
        s.idle += dt
        if (!allDone()) {
          let pick = -1
          if (io.pressed) for (let i = 0; i < 3; i++) if (!s.done[i] && inField(io.pointer, i)) pick = i
          if (pick < 0 && s.idle >= LIMIT) pick = s.done.indexOf(false)
          if (pick >= 0) openRow(pick, io)
        } else if (!s.pressed && ((io.pressed && overGo(io.pointer)) || s.idle >= LIMIT || s.skipping)) press(io)
      } else {
        const i = s.open
        s.rowT += dt
        const forced = s.phase === 'ready' && s.rowT >= LIMIT
        const active = s.phase === 'ready' || s.phase === 'ending' || s.phase === 'closing'
        if (s.phase === 'opening' && s.spring[i]! >= 0.9) {
          s.lift = Math.min(1, s.lift + dt / 0.25)
          if (s.lift >= 1) s.phase = 'ready'
        }
        let over = false
        if (active && !s.skipping) {
          if (i === 0) over = stepDial(io, forced)
          else if (i === 1) over = stepSlot(io, forced)
          else over = stepCrank(io, forced)
        }
        if (s.phase === 'ready' && over) {
          s.phase = 'ending'
          s.endT = 0
        } else if (s.phase === 'ending') {
          s.endT += dt
          if (s.endT >= 0.4) s.phase = 'closing'
        } else if (s.phase === 'closing') {
          s.lift = Math.max(0, s.lift - dt / 0.25)
          if (s.lift === 0 && s.spring[i]! <= 0.004) {
            s.open = -1
            s.phase = 'closed'
            s.idle = 0
            s.spring[i] = 0
            s.springV[i] = 0
            s.slot.coins = []
            if (io.cursor.taken && s.crank.stuck <= 0) io.cursor.release()
            if (s.mode === 'live' && (!s.crank.hit || s.crank.peeled)) io.cursor.act('plain')
          }
        }
      }
      afterCrank(io)
      ground(io)
      if (s.mode === 'film') grip(io)
      for (let i = 0; i < 3; i++) {
        const target = s.open === i && (s.phase === 'opening' || s.phase === 'ready' || s.phase === 'ending' || (s.phase === 'closing' && s.lift > 0)) ? 1 : 0
        if (target === 0 && s.spring[i] === 0) continue
        s.springV[i] = s.springV[i]! + (300 * (target - s.spring[i]!) - 27 * s.springV[i]!) * dt
        s.spring[i] = s.spring[i]! + s.springV[i]! * dt
        if (target === 0 && s.spring[i]! < 0.004 && s.open !== i) {
          s.spring[i] = 0
          s.springV[i] = 0
        }
      }
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
      const here = { x: s.px, y: s.py, down: false }
      const blink = Math.floor(s.time * 4) % 2 === 0
      if (s.pressed || s.skipping) return here
      if (s.open < 0) {
        if (allDone()) return { x: go.cx, y: go.cy, down: blink }
        const at = fieldAt(s.done.indexOf(false))
        return { x: at.x, y: at.y, down: blink }
      }
      if (s.open === 0) {
        const d = s.dial
        const k = d.k || 5
        const rest = holePlace(k, 0)
        if (s.phase === 'opening') return { ...rest, down: false }
        if (s.phase !== 'ready' || s.done[0]) return here
        if (d.phase === 'rest') return { ...rest, down: Math.hypot(s.px - rest.x, s.py - rest.y) <= DIAL.hole * 0.6 }
        if (d.phase === 'drag') {
          const full = DIAL.travel(k)
          if (d.a >= full - 0.01) return { ...holePlace(k, full), down: false }
          return { ...holePlace(k, Math.min(full + 0.03, d.a + 0.16)), down: true }
        }
        return { ...rest, down: false }
      }
      if (s.open === 1) {
        const sl = s.slot
        if (s.phase === 'opening') return { x: SLOT.leverX, y: SLOT.knobY, down: false }
        if (sl.phase === 'rest' && s.phase === 'ready') return { x: SLOT.leverX, y: sl.grab ? Math.min(knobY(1) + 4, Math.max(s.py, knobY(sl.p)) + 12) : knobY(sl.p), down: sl.grab || Math.hypot(s.px - SLOT.leverX, s.py - knobY(sl.p)) <= SLOT.knob / 2 }
        const out: Hint = { x: SLOT.leverX + 6, y: SLOT.y + SLOT.h + 6, down: false }
        if (sl.phase === 'read' || sl.phase === 'pay') out.dodge = { x: 420, y: trayY(1) + 60 }
        return out
      }
      const c = s.crank
      if (s.phase === 'opening') return { ...gripPlace(c.b), down: false }
      if (c.phase === 'rest' && s.phase === 'ready') {
        const at = gripPlace(c.b)
        return { ...gripPlace(c.b + (c.grab ? 0.15 : 0)), down: c.grab || Math.hypot(s.px - at.x, s.py - at.y) <= 20 }
      }
      const out: Hint = { ...gripPlace(CRANK.rest), down: false }
      if (c.phase === 'runaway' && !c.hit) out.dodge = { x: CRANK.hx + 300, y: CRANK.hy - 110 }
      return out
    },
    skip() {
      s.skipping = true
    },
    done: () => s.finished,
    gag() {
      if (s.open >= 0) return gags[s.open + 1]!.id
      if (allDone()) return gags[4]!.id
      return s.done.some(Boolean) ? null : gags[0]!.id
    },
    ignoring: () => s.pressed || s.skipping,
    volume: () => (s.crank.set && !s.done[2] ? Math.max(0.1, s.crank.level) : 1),
    states: () => statesOf({ open: s.spring.findIndex((v) => v > 0.004), panel: s.open >= 0 && s.spring[s.open]! > 0.9, done: s.done, typing: [s.open === 0 || s.dial.digits.length > 0, false, false], settled: settled() }),
    sheet(id: string): SheetFrame | null {
      if (id !== 'machines') return null
      return machinesSheet()
    }
  }

  function chevron(out: DrawList, id: string, x: number, y: number, flip: boolean): void {
    const tilt = flip ? -0.7 : 0.7
    for (const side of [-1, 1]) out.push({ id: `${id}-${side < 0 ? 'a' : 'b'}`, part: 'rows', kind: 'box', x: x + 14 + side * 5.2 - 8, y: y + 12.5, w: 16, h: 3, z0: 0.1, z1: 0.9, tone: 'ink', rot: -tilt * side, r: 1.5 })
  }

  function machine(out: DrawList, i: number, m: { dial: DialState; slot: SlotState; crank: CrankState }, lift: number, dx: number, dy: number, tag: string, fade = 1): void {
    const L = smooth(lift)
    const z = (v: number): number => mix(TRAY_Z, v, L)
    if (i === 0) {
      for (let k = 1; k <= 10; k++) {
        const h = holePlace(k, m.dial.a)
        out.push({ id: `${tag}dial-hole-${k}`, part: 'dial', kind: 'disc', x: h.x - DIAL.hole + dx, y: h.y - DIAL.hole + dy, w: DIAL.hole * 2, h: DIAL.hole * 2, z0: z(TOP + 2), z1: z(TOP + 3), tone: 'light' })
      }
      const sx = DIAL.cx + (DIAL.ring + 20) * Math.cos(DIAL.stop)
      const sy = DIAL.cy + (DIAL.ring + 20) * Math.sin(DIAL.stop)
      out.push({ id: `${tag}dial-stop`, part: 'dial', kind: 'capsule', x: sx - 20 + dx, y: sy - 5 + dy, w: 40, h: 10, z0: z(TOP + 2), z1: z(TOP + 12), tone: 'dark', rot: DIAL.stop, mechanism: true })
    } else if (i === 1) {
      const ky = knobY(m.slot.p)
      const pivot = SLOT.knobY + SLOT.pull + 34
      out.push({ id: `${tag}slot-mount`, part: 'slot', kind: 'box', x: SLOT.x + SLOT.w - 2 + dx, y: pivot - 10 + dy, w: 50, h: 20, z0: z(0), z1: z(TOP), tone: 'metal', r: 4 })
      out.push({ id: `${tag}slot-arm`, part: 'slot', kind: 'capsule', x: SLOT.leverX - 6 + dx, y: ky + dy, w: 12, h: pivot - ky, z0: z(TOP), z1: z(TOP + 12), tone: 'raised', mechanism: true })
      for (let r = 0; r < 3; r++) {
        const strip = SLOT.strips[r]!
        const pos = reelPos(m.slot, r)
        const b = legendBox[r]!
        for (const n of m.slot.phase === 'spin' ? [Math.floor(pos), Math.floor(pos) + 1] : []) {
          const off = (n - pos) * REEL_PITCH
          if (Math.abs(off) > (SLOT.reelH - b.h) / 2 - 6) continue
          const legend = strip[mod(n, strip.length)]!
          out.push({ id: `${tag}${reelId(r, legend)}`, part: 'type', kind: 'text', x: SLOT.reelX(r) + dx, y: b.y + off + dy, w: SLOT.reelW, h: b.h, z0: z(TOP + 14), z1: z(TOP + 14), tone: 'ink', words: `data:step2.${SLOT.names[r]}.${legend}`, type: { font: 'inter-600', px: 34, align: 'centre' } })
        }
      }
      for (const coin of m.slot.coins) out.push({ id: `${tag}coin-${coin.n}`, part: 'slot', kind: 'disc', x: coin.x - 13 * fade + dx, y: coin.y - 13 * fade + dy, w: 26 * fade, h: 26 * fade, z0: coin.z, z1: coin.z + 4 * fade, tone: 'light', rot: coin.rot })
    }
  }

  function overMachine(over: Record<string, Partial<Shape> | null>, i: number, m: { slot: SlotState; crank: CrankState }, lift: number): void {
    const L = smooth(lift)
    for (const part of parts[i]!) over[part.id] = part.text ? { z0: mix(TRAY_Z, part.top, L), z1: mix(TRAY_Z, part.top, L) } : { z0: mix(TRAY_Z, part.floor, L), z1: mix(TRAY_Z, part.top, L) }
    if (i === 1) {
      const knob = boxOf(layout, 'slot-knob')
      const p = clamp(m.slot.p, 0, 1)
      Object.assign(over['slot-knob']!, { y: knob.y + SLOT.pull * p, ...(p > 0.002 ? { moved: true } : {}) })
    }
    if (i === 2) {
      const b = m.crank.b
      const arm = gripPlace(b, CRANK.arm / 2)
      const grip = gripPlace(b)
      const away = Math.abs(wrapPi(b - CRANK.rest)) > 0.002 ? { moved: true } : {}
      Object.assign(over['crank-arm']!, { x: arm.x - (CRANK.arm + 16) / 2, y: arm.y - 8, rot: b, ...away })
      Object.assign(over['crank-grip']!, { x: grip.x - CRANK.gripW / 2, y: grip.y - CRANK.gripH / 2, rot: b, ...away })
      const lit = Math.round(m.crank.level * 10)
      for (let k = 1; k <= 10; k++) Object.assign(over[`meter-${k}`]!, { tone: (k <= lit ? 'accent' : 'glass') as Tone, z1: mix(TRAY_Z, k <= lit ? 18 : 12, L) })
    }
  }

  function drawPage(out: DrawList): void {
    const states = page.states()
    const over: Record<string, Partial<Shape> | null> = {}
    const offsets = [0, 0, 0]
    for (let i = 1; i < 3; i++) offsets[i] = offsets[i - 1]! + SHIFT * Math.max(0, s.spring[i - 1]!)
    const shown = s.spring.findIndex((v) => v > 0.004)
    for (let i = 1; i < 3; i++) {
      const isLow = shown >= 0 && shown < i
      const set = isLow ? low[i]! : up[i]!
      const dy = offsets[i]! - (isLow ? SHIFT : 0)
      if (Math.abs(dy) > 1e-6) for (const part of set.ids) over[part.id] = { y: part.y + dy }
    }
    if (shown >= 0) {
      const name = ROWS[shown]!
      over[`${name}-tray`] = { kind: 'well', pocket: false, h: Math.max(1, TRAY_H * clamp(s.spring[shown]!, 0, 1)), z0: TRAY_Z, z1: 0, tone: 'pocket' }
      overMachine(over, shown, s, s.lift)
    }
    if (allDone()) {
      over['continue-cap'] = { tone: 'accent', ...(s.pressed ? { z1: heights.button - heights.keyTravel } : {}) }
      over['continue-label'] = { tone: 'inkLight', ...(s.pressed ? { z0: heights.button - heights.keyTravel, z1: heights.button - heights.keyTravel } : {}) }
    }
    drawLayout(out, layout, { states, over, runtime: { 'step2.phone': phoneMask(s.dial.digits) } })
    for (let i = 0; i < 3; i++) {
      const y = rowY(i) + offsets[i]!
      const isOpen = s.open === i && s.phase !== 'closing'
      chevron(out, `${ROWS[i]}-chevron`, FX + FW - 24 - 28, y + (FH - 28) / 2, isOpen)
      if (isOpen) {
        const t = 3
        const ring: [string, number, number, number, number][] = [['n', FX - t, y - t, FW + 2 * t, t], ['s', FX - t, y + FH, FW + 2 * t, t], ['w', FX - t, y, t, FH], ['e', FX + FW, y, t, FH]]
        for (const [side, x, yy, w, h] of ring) out.push({ id: `focus-${side}`, part: 'rows', kind: 'box', x, y: yy, w, h, z0: 0, z1: 2, tone: 'accent' })
      }
    }
    const caret = s.open === 0 && !s.done[0] && s.phase !== 'closing' && Math.floor(s.time * 2) % 2 === 0
    if (caret) {
      const wide = measure(TYPE.value.font, phoneMask(s.dial.digits), TYPE.value.px).width + 4
      out.push({ id: 'caret', part: 'rows', kind: 'box', x: FX + PAD + wide, y: rowY(s.open) + offsets[s.open]! + 17, w: 2, h: 30, z0: 0.1, z1: 0.6, tone: 'ink' })
    }
    if (shown >= 0) machine(out, shown, s, s.lift, 0, 0, '', s.phase === 'closing' ? Math.max(0.02, smooth(s.lift)) : 1)
  }

  function machinesSheet(): SheetFrame {
    const list: DrawList = []
    const demo = { dial: freshDial(), slot: { ...freshSlot(), p: 1 }, crank: { ...freshCrank(), level: 0.4, b: 0.6 } }
    demo.slot.to = SLOT.film.map((legend, r) => SLOT.strips[r]!.indexOf(legend))
    const spots = [{ x: 150, y: 400 }, { x: 450, y: 425 }, { x: 1010, y: 560 }]
    const origin = [{ x: DIAL.cx - DIAL.r, y: DIAL.cy - DIAL.r }, { x: SLOT.x, y: SLOT.y }, { x: CRANK.hx, y: CRANK.hy }]
    const meterAt = { x: 900, y: 372 }
    const labelX = [150, 450, 900]
    for (let i = 0; i < 3; i++) {
      const dx = spots[i]!.x - origin[i]!.x
      const dy = spots[i]!.y - origin[i]!.y
      const over: Record<string, Partial<Shape> | null> = {}
      overMachine(over, i, demo, 1)
      const local: DrawList = []
      const settledNow = SLOT.film.map((legend, r) => reelId(r, legend))
      for (const child of find(layout, `${ROWS[i]}-tray`).children ?? []) drawLayout(local, child, { states: i === 1 ? settledNow : [], over })
      for (const shape of local) {
        const meter = shape.id.startsWith('meter-')
        list.push({ ...shape, id: `sheet-${shape.id}`, x: meter ? shape.x - CRANK.segX + meterAt.x : shape.x + dx, y: meter ? shape.y - CRANK.segY + meterAt.y : shape.y + dy })
      }
      const extra: DrawList = []
      machine(extra, i, demo, 1, dx, dy, 'sheet-')
      for (const shape of extra) list.push(shape)
      const label = find(layout, `${ROWS[i]}-label`)
      list.push({ id: `sheet-${label.id}`, part: 'type', kind: 'text', x: labelX[i]!, y: 316, w: label.box[2]!, h: label.box[3]!, z0: 0, z1: 0, tone: 'ink', words: label.copy!, type: label.type! })
    }
    return { list, cursors: [restPose(400, 640)], view: frame({ x: 100, y: 120, w: 1240, h: 697 }, 1) }
  }

  return page
}
