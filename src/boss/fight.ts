import type { StepIo } from '../stage/types'
import { FOOT_OFF, muzzleAt, smooth } from './body'
import { ARENA, BODY, FLOOR, DART, EXPIRED_GAIN, HEALTH, HOME, LAST_CLEAR, LOOK_EASE, POPUP, SHIELD, SLAB, SOCKET, SLOW_SECONDS, THRESHOLD } from './plan'
import { CORNER, FILM, FLAT, GUARD, HEAL, IDLE, MOVE, REAL_DART, TRACK, WEAR } from './tune'

export interface SlabSize { w: number; h: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Arena { slabs: SlabSize[]; popups: { box: Rect; buttons: Rect[] }[]; keep?: Rect }

export interface Slab { m: number; x: number; y: number; dx: number; dy: number; rot: number; left: number; state: 0 | 1 | 2; t: number; push?: number; skid?: number; air?: number; rim?: boolean; ox?: number; oy?: number; ex?: number; ey?: number; far?: number; out?: number }
export interface Popup { slot: number; hp: number; t: number; closing: number; off: number; vel: number; dx: number; dy: number; shot: boolean }
export interface Dart { n: number; x: number; y: number; dx: number; dy: number; t: number; p: number }
export interface Flash { n: number; x: number; y: number; rot: number; t: number; r?: number }
export interface Spark { n: number; x: number; y: number; t: number; z?: number }
export interface Ball { n: number; i: number; x: number; y: number; dx: number; dy: number; t: number }
export interface Foot { x: number; y: number; fx: number; fy: number; tx: number; ty: number; t: number }

export interface Fight {
  phase: 0 | 1 | 2
  clock: number
  phaseClock: number
  health: number
  shown: number
  x: number
  y: number
  feet: Foot[]
  slabs: Slab[]
  popups: Popup[]
  darts: Dart[]
  sparks: Spark[]
  flashes: Flash[]
  nextSlab: number
  windup: number
  aim: { x: number; y: number }
  cannon: 0 | 1
  attacks: number
  burst: number
  burstDue: number
  recoil: [number, number]
  slabCount: number
  popupCount: number
  popupDue: number
  dartCount: number
  sparkCount: number
  expired: number
  slow: boolean
  safe: number
  dust: number
  hits: number
  flash: number
  look: { x: number; y: number }
  over: boolean
  face: number
  stall: number
  to: { x: number; y: number }
  leg: number
  moveDue: number
  cornerDue: number
  cornerCount: number
  tell: { i: number; t: number } | null
  balls: Ball[]
  ballCount: number
  flat: number
  healDue: number
  heals: number
  healed: number
  idle: number
  tired: number
  glances: number
  rounds: number
  run: number
  weakDue: number
  weak: number
  by: [number, number, number]
}

const START = [HEALTH, THRESHOLD[0], THRESHOLD[1] + EXPIRED_GAIN] as const
const POPUP_ORDER = [1, 2, 0] as const
const SLAB_HALF = 56
const SOCKET_CLEAR = { x: 168, y: 78 }
const RIM_GAP = 4
const STRIKE = { x: 4, y: 12, hold: 0.05 } as const
const LEAVE = { back: 0.3, pull: 9, power: 2.6, past: 30, tall: 44, machine: 230, least: 0.3, speed: 2400, most: 0.72 } as const
const PAGE = { w: 1920, h: 1080 } as const
export const SPARK_SECONDS = 0.3
export const FLASH_SECONDS = 0.16
const TIP_FLASH = { n: 5000, ahead: 14, r: 26 }

export const cursorCentre = (c: { x: number; y: number }): { x: number; y: number } => ({ x: c.x + 18, y: c.y + 32 })

export function newFight(x: number = HOME.x, y: number = HOME.y): Fight {
  return {
    phase: 0, clock: 0, phaseClock: 0, health: HEALTH, shown: HEALTH, x, y,
    feet: FOOT_OFF.map(([ox, oy]) => ({ x: x + ox, y: y + oy, fx: 0, fy: 0, tx: 0, ty: 0, t: -1 })),
    slabs: [], popups: [], darts: [], sparks: [], flashes: [], nextSlab: SLAB.first, windup: -1, aim: { x: 0, y: 0 }, cannon: 0, attacks: 0, burst: 0, burstDue: 0, recoil: [0, 0], slabCount: 3, popupCount: 0, popupDue: POPUP.first,
    dartCount: 0, sparkCount: 0, expired: -1, slow: false, safe: 0, dust: -1, hits: 0, flash: 0, look: { x: x - 600, y }, over: false,
    face: Math.PI, stall: 0, to: { x, y }, leg: 0, moveDue: MOVE.first, cornerDue: CORNER.first, cornerCount: 0, tell: null, balls: [], ballCount: 0, flat: 0, healDue: -1, heals: 0, healed: 0, idle: 0, tired: 0, glances: 0, rounds: 0, run: 0, weakDue: 0, weak: 0, by: [0, 0, 0]
  }
}

export const ceiling = (phase: number, tired: number): number => {
  const from = START[phase]!
  const to = THRESHOLD[phase]!
  return Math.max(to, from - ((from - to) * Math.max(0, tired)) / IDLE.ramp)
}

export const turn = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a))
export const bearing = (f: { x: number; y: number }, x: number, y: number): number => Math.atan2(y - f.y, x - f.x)
export const shielded = (f: { x: number; y: number; face: number }, x: number, y: number): boolean => Math.abs(turn(bearing(f, x, y) - f.face)) <= GUARD.cover
export const turnRate = (clock: number): number => TRACK.turn * Math.max(TRACK.least, 1 - ((1 - TRACK.least) * clock) / TRACK.tire)
export const wear = (clock: number): number => 1 + Math.max(0, clock - WEAR.from) / WEAR.double
export const healNext = (heals: number): number => HEAL.first * HEAL.shrink ** heals
export const cornerAt = (i: number): { x: number; y: number } => ({ x: CORNER.at[i]![0], y: CORNER.at[i]![1] })
export const weakSide = (f: { x: number; y: number; face: number }): { x: number; y: number } => ({ x: f.x - Math.cos(f.face) * BODY.rx * 0.8, y: f.y - Math.sin(f.face) * BODY.ry * 0.8 })
const touches = (f: Fight, x: number, y: number): boolean => ((x - f.x) / (BODY.rx + MOVE.touch)) ** 2 + ((y - f.y) / (BODY.ry + MOVE.touch)) ** 2 <= 1

const floor = (f: Fight): number => {
  const from = START[f.phase]!
  const clock = f.phase === 2 ? f.expired - 0.8 : f.phaseClock
  return from - ((from - THRESHOLD[f.phase]!) * Math.max(0, clock)) / FLOOR[f.phase]!
}

const inside = (r: Rect, x: number, y: number, grow = 0): boolean => x >= r.x - grow && x <= r.x + r.w + grow && y >= r.y - grow && y <= r.y + r.h + grow

export const muzzle = (f: Fight, i: number): { x: number; y: number; rot: number } => muzzleAt(f.x, f.y, i, f.look)

export const bannerUp = (f: Fight): boolean => f.expired >= 0 && f.expired < 1.5
export const spent = (f: Fight): boolean => f.phase === 2 && f.expired >= 1.5 && f.health <= LAST_CLEAR
const quiet = (f: Fight): boolean => bannerUp(f) || (f.phase === 2 && f.expired < 0) || spent(f)

function clearPage(f: Fight): void {
  for (const p of f.popups) if (p.closing < 0) p.closing = 0
  for (const s of f.slabs) {
    if (s.state !== 2) {
      s.state = 2
      s.t = 0
    }
  }
  f.windup = -1
  f.burst = 0
  f.tell = null
  f.leg = 0
}

function wander(f: Fight, io: StepIo): { x: number; y: number; speed: number } {
  const dt = io.dt
  const held = bannerUp(f) || (f.phase === 2 && f.expired < 0)
  if (held) {
    f.leg = 0
    return { x: f.x, y: f.y, speed: 0 }
  }
  if (f.leg > 0) {
    f.leg -= dt
    return { x: f.to.x, y: f.to.y, speed: MOVE.speed }
  }
  f.moveDue -= dt
  if (f.moveDue <= 0) {
    const at = cursorCentre(io.cursor)
    const x = Math.min(MOVE.fence.x1, Math.max(MOVE.fence.x0, at.x))
    const y = Math.min(MOVE.fence.y1, Math.max(MOVE.fence.y0, at.y))
    f.moveDue = MOVE.every
    if (Math.hypot(x - f.x, y - f.y) >= MOVE.least) {
      f.to = { x, y }
      f.leg = MOVE.leg
      io.emit('boss-move', f.x, f.y, false)
      return { x: x, y: y, speed: MOVE.speed }
    }
  }
  return { x: f.x, y: f.y, speed: 0 }
}

function walk(f: Fight, io: StepIo): void {
  const dt = io.dt
  const to = wander(f, io)
  const dx = to.x - f.x
  const dy = to.y - f.y
  const d = Math.hypot(dx, dy)
  const max = to.speed * dt
  let vx = 0
  let vy = 0
  if (d <= 0.5 && f.leg > 0) f.leg = 0
  if (d > 0.5 && max > 0) {
    const k = Math.min(1, max / d)
    vx = (dx * k) / dt
    vy = (dy * k) / dt
    f.x += dx * k
    f.y += dy * k
  }
  const busy = (i: number): boolean => f.feet[i]!.t >= 0
  f.feet.forEach((foot, i) => {
    const ix = f.x + FOOT_OFF[i]![0]
    const iy = f.y + FOOT_OFF[i]![1]
    if (foot.t >= 0) {
      foot.t += dt / 0.16
      const e = smooth(foot.t)
      foot.x = foot.fx + (foot.tx - foot.fx) * e
      foot.y = foot.fy + (foot.ty - foot.fy) * e
      if (foot.t >= 1) {
        foot.x = foot.tx
        foot.y = foot.ty
        foot.t = -1
      }
      return
    }
    const other = i === 0 || i === 3 ? [1, 2] : [0, 3]
    if (Math.hypot(ix - foot.x, iy - foot.y) > 42 && !busy(other[0]!) && !busy(other[1]!)) {
      foot.fx = foot.x
      foot.fy = foot.y
      foot.tx = ix + vx * 0.22
      foot.ty = iy + vy * 0.22
      foot.t = 0
    }
  })
}

function spark(f: Fight, x: number, y: number, z = 0): void {
  f.sparks.push({ n: f.sparkCount++, x, y, t: 0, z })
}

// Which slab a shot of a salvo is, and where it goes beside the aim: the middle one first, then below, then above.
const SALVO: { m: number; side: number }[] = [{ m: 1, side: 0 }, { m: 2, side: 1 }, { m: 0, side: -1 }]

function fire(f: Fight, io: StepIo, arena: Arena, shot: { m: number; side: number } | null = null): void {
  let m = -1
  const first = shot ? shot.m : f.slabCount
  for (let k = 0; k < arena.slabs.length; k++) {
    const c = (first + k) % arena.slabs.length
    if (!f.slabs.some((s) => s.m === c)) {
      m = c
      break
    }
  }
  if (m < 0) return
  if (shot) f.cannon = shot.side > 0 ? 1 : 0
  const from = muzzle(f, f.cannon)
  let dx = f.aim.x - from.x
  let dy = f.aim.y - from.y
  const d = Math.hypot(dx, dy) || 1
  dx /= d
  dy /= d
  if (shot && shot.side !== 0) {
    const turn = (dx < 0 ? -1 : 1) * shot.side * SLAB.fan
    const c = Math.cos(turn)
    const n = Math.sin(turn)
    const rx = dx * c - dy * n
    dy = dx * n + dy * c
    dx = rx
  }
  let left = d + SLAB.overshoot
  const pad = 70
  const half = arena.slabs[m]!.w / 2
  if (dx < 0) left = Math.min(left, (from.x - (ARENA.x0 + pad + half)) / -dx)
  if (dx > 0) left = Math.min(left, (ARENA.x1 - pad - from.x) / dx)
  if (dy < 0) left = Math.min(left, (from.y - (ARENA.y0 + pad)) / -dy)
  if (dy > 0) left = Math.min(left, (ARENA.y1 - pad - from.y) / dy)
  const keep = arena.keep
  let rim = false
  if (keep) {
    const tall = SLAB_HALF / 2 + 20
    for (let go = 0; go <= left; go += 4) {
      const x = from.x + dx * go
      const y = from.y + dy * go
      if (x > keep.x - half - RIM_GAP && x < keep.x + keep.w + half + RIM_GAP && y > keep.y - tall && y < keep.y + keep.h + tall) {
        left = go - 4
        rim = true
        break
      }
    }
  }
  const over = (go: number): boolean => Math.abs(from.x + dx * go - SOCKET.x) < half + SOCKET_CLEAR.x && Math.abs(from.y + dy * go - SOCKET.y) < SOCKET_CLEAR.y
  if (over(left)) {
    let short = left
    while (short > 40 && over(short)) short -= 8
    let long = left
    while (long < left + 160 && over(long)) long += 8
    const to = short > 120 || over(long) ? short : long
    if (to !== left) rim = false
    left = to
  }
  const rot = -0.12 + 0.03 * (m % 3)
  f.slabs.push({ m, x: from.x, y: from.y, dx, dy, rot, left: Math.max(40, left), state: 0, t: 0, rim })
  f.slabCount = m + 1
  f.recoil[f.cannon] = 26
  f.flashes.push({ n: f.slabCount + f.attacks * 3, x: from.x, y: from.y, rot: Math.atan2(dy, dx), t: 0 })
  io.emit('slab-fire', from.x, from.y, false)
  f.cannon = f.cannon === 0 ? 1 : 0
}

// A slab that has lain its time is swept off the page: down, or down and aside, or sideways, by the shortest way that crosses neither the card, the socket nor the machine.
const WAYS: [number, number][] = [[0, 1], [-0.5, 0.866], [0.5, 0.866], [-0.8, 0.6], [0.8, 0.6], [-1, 0], [1, 0]]

function leave(f: Fight, s: Slab, arena: Arena): void {
  const size = arena.slabs[s.m]!
  const half = size.w / 2
  const keep = arena.keep
  const ways = WAYS.map(([ex, ey]) => {
    const down = ey > 0 ? (PAGE.h + size.h + half * Math.abs(ex) - s.y) / ey : Infinity
    const side = ex < 0 ? (s.x + half + LEAVE.past) / -ex : ex > 0 ? (PAGE.w - s.x + half + LEAVE.past) / ex : Infinity
    return { ex, ey, far: Math.min(down, side) }
  })
  const blocked = (w: { ex: number; ey: number; far: number }, machine = true): boolean => {
    for (let go = 16; go <= w.far; go += 16) {
      const x = s.x + w.ex * go
      const y = s.y + w.ey * go
      if (keep && x > keep.x - half + 4 && x < keep.x + keep.w + half - 4 && y > keep.y - LEAVE.tall && y < keep.y + keep.h + LEAVE.tall) return true
      if (Math.abs(x - SOCKET.x) < half + SOCKET_CLEAR.x && Math.abs(y - SOCKET.y) < SOCKET_CLEAR.y + size.h / 2) return true
      if (machine && Math.hypot(x - f.x, y - f.y) < LEAVE.machine + half * Math.abs(w.ex) * 0.4) return true
    }
    return false
  }
  const near = (a: { far: number }, b: { far: number }): number => a.far - b.far
  const way = ways.filter((w) => !blocked(w)).sort(near)[0] ?? ways.filter((w) => !blocked(w, false)).sort(near)[0] ?? ways[0]!
  s.ox = s.x
  s.oy = s.y
  s.ex = way.ex
  s.ey = way.ey
  s.far = way.far
  s.out = Math.min(LEAVE.most, Math.max(SLAB.out, LEAVE.least + way.far / LEAVE.speed))
}

function strike(f: Fight, io: StepIo, x: number, y: number, by: 0 | 1 | 2): void {
  f.by[by]++
  f.safe = FLAT.safe
  f.flat = FLAT.down
  f.healDue = FLAT.heal
  f.dust = FLAT.life
  f.hits++
  io.cursor.hurt('flattened', FLAT.life)
  io.emit('flatten', x, y, true)
}

function corners(f: Fight, io: StepIo): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  if (f.tell) {
    f.tell.t += dt
    if (f.tell.t >= CORNER.tell) {
      const from = cornerAt(f.tell.i)
      const d = Math.hypot(c.x - from.x, c.y - from.y) || 1
      f.balls.push({ n: f.ballCount++, i: f.tell.i, x: from.x, y: from.y, dx: (c.x - from.x) / d, dy: (c.y - from.y) / d, t: 0 })
      f.flashes.push({ n: 7000 + f.ballCount, x: from.x + ((c.x - from.x) / d) * CORNER.base, y: from.y + ((c.y - from.y) / d) * CORNER.base, rot: Math.atan2(c.y - from.y, c.x - from.x), t: 0 })
      io.emit('cannon-fire', from.x, from.y, false)
      f.tell = null
    }
  } else if (!quiet(f)) {
    f.cornerDue -= dt
    if (f.cornerDue <= 0 && f.flat <= 0) {
      const i = CORNER.order[f.cornerCount % CORNER.order.length]!
      f.cornerCount++
      f.cornerDue = CORNER.every
      f.tell = { i, t: 0 }
      const from = cornerAt(i)
      io.emit('cannon-tell', from.x, from.y, false)
    }
  }
  const keep: Ball[] = []
  for (const b of f.balls) {
    b.t += dt
    b.x += b.dx * CORNER.speed * dt
    b.y += b.dy * CORNER.speed * dt
    if (f.safe <= 0 && Math.hypot(c.x - b.x, c.y - b.y) < CORNER.ball + CORNER.reach) {
      strike(f, io, c.x, c.y, 1)
      spark(f, b.x, b.y)
      continue
    }
    if (b.t < CORNER.life && b.x > -60 && b.x < PAGE.w + 60 && b.y > CORNER.band && b.y < PAGE.h + 60) keep.push(b)
  }
  f.balls = keep
}

function slabs(f: Fight, io: StepIo, arena: Arena): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  if (f.windup >= 0) {
    f.windup += dt
    f.recoil[f.cannon] = -12 * Math.min(1, f.windup / SLAB.windup)
    if (f.windup >= SLAB.windup) {
      f.windup = -1
      const salvo = f.phase === 0 && f.attacks > 0
      fire(f, io, arena, salvo ? SALVO[0]! : null)
      f.burst = salvo ? SLAB.salvo - 1 : 0
      f.burstDue = SLAB.salvoGap
      f.attacks++
      f.nextSlab = salvo ? SLAB.again : SLAB.every[f.phase]!
    }
  } else if (f.burst > 0) {
    f.burstDue -= dt
    if (f.burstDue <= 0) {
      fire(f, io, arena, SALVO[SLAB.salvo - f.burst]!)
      f.burst--
      f.burstDue = SLAB.salvoGap
    }
  } else if (!quiet(f)) {
    f.nextSlab -= dt
    const armed = f.phase !== 1 || f.popupCount >= POPUP_ORDER.length || f.phaseClock >= POPUP.armed
    const read = f.phase === 1 ? POPUP.aim : POPUP.read
    const one = f.phase === 0 || (armed && f.slabs.length === 0 && !f.popups.some((p) => p.t < read))
    if (f.nextSlab <= 0 && one) {
      f.windup = 0
      f.stall = TRACK.stall
      f.aim = { x: c.x, y: c.y }
    }
  }
  for (let i = 0; i < 2; i++) if (!(f.windup >= 0 && f.cannon === i)) f.recoil[i] = f.recoil[i]! * Math.max(0, 1 - dt * 9)
  for (const s of f.slabs) {
    s.t += dt
    if (s.state === 0) {
      const go = Math.min(s.left, SLAB.speed[f.phase]! * dt)
      s.x += s.dx * go
      s.y += s.dy * go
      s.left -= go
      const size = arena.slabs[s.m]!
      const hit = f.safe <= 0 && s.t > 0.12 && Math.abs(c.x - s.x) < size.w / 2 + STRIKE.x && Math.abs(c.y - s.y) < size.h / 2 + STRIKE.y
      if (hit) {
        strike(f, io, c.x, c.y, 0)
        io.emit('slab-drop', c.x, c.y, true)
        s.air = s.t
        s.state = 1
        s.t = 0
        s.push = Math.min(SLAB.through, Math.max(0, s.left))
      } else if (s.left <= 0) {
        io.emit('slab-drop', s.x, s.y, false)
        s.air = s.t
        s.state = 1
        s.t = 0
        s.skid = s.rim ? -SLAB.bounce : SLAB.skid
      }
    } else if (s.state === 1 && (s.push ?? 0) > 0) {
      const go = Math.min(s.push!, SLAB.drive * dt)
      s.x += s.dx * go
      s.y += s.dy * go
      s.push = s.push! - go
    } else if (s.state === 1 && Math.abs(s.skid ?? 0) > 0.2) {
      const go = s.skid! * Math.min(1, SLAB.grip * dt)
      s.x += s.dx * go
      s.y += s.dy * go
      s.skid = s.skid! - go
    } else if (s.state === 1 && s.t >= (f.phase === 0 ? SLAB.rest : SLAB.restLate)) {
      s.state = 2
      s.t = 0
      leave(f, s, arena)
    } else if (s.state === 2) {
      const u = s.t / (s.out ?? SLAB.out)
      const back = u < LEAVE.back ? -LEAVE.pull * Math.sin((Math.PI * u) / LEAVE.back) : 0
      const go = back + (s.far ?? 0) * Math.pow(Math.min(1, Math.max(0, (u - LEAVE.back * 0.6) / (1 - LEAVE.back * 0.6))), LEAVE.power)
      s.x = (s.ox ?? s.x) + (s.ex ?? 0) * go
      s.y = (s.oy ?? s.y) + (s.ey ?? 1) * go
    }
  }
  f.slabs = f.slabs.filter((s) => !(s.state === 2 && s.t >= (s.out ?? SLAB.out)))
}

function popups(f: Fight, io: StepIo, arena: Arena): boolean {
  const dt = io.dt
  let used = false
  for (const p of f.popups) {
    p.t += dt
    const rest = p.shot && p.closing >= 0 ? POPUP.lean : 0
    p.vel += (POPUP.spring * (rest - p.off) - POPUP.damp * p.vel) * dt
    p.off += p.vel * dt
    if (p.closing >= 0) p.closing += dt
    else if (io.pressed && !used && arena.popups[p.slot]!.buttons.some((b) => inside(b, io.pointer.x, io.pointer.y, 4))) {
      p.closing = POPUP.hold
      used = true
      io.emit('popup-close', io.pointer.x, io.pointer.y, false)
    }
  }
  f.popups = f.popups.filter((p) => p.closing < POPUP.hold + POPUP.close)
  if (f.phase === 0 || quiet(f)) return used
  f.popupDue -= dt
  if (f.popupDue <= 0) {
    const free = POPUP_ORDER.filter((slot) => (f.phase !== 2 || slot !== 0) && !f.popups.some((p) => p.slot === slot))
    const first = f.phase === 1 && f.popupCount < POPUP_ORDER.length && f.health > THRESHOLD[1] + DART.damage[1] * DART.volley
    const one = f.windup < 0 && !f.slabs.some((s) => s.state === 0)
    if (free.length && one && (first || f.phase === 2)) {
      const want = POPUP_ORDER[f.popupCount % POPUP_ORDER.length]!
      const slot = free.includes(want) ? want : free[0]!
      const box = arena.popups[slot]!.box
      f.popups.push({ slot, hp: POPUP.hp, t: 0, closing: -1, off: 0, vel: 0, dx: 1, dy: 0, shot: false })
      for (const s of f.slabs) {
        if (s.state === 1) {
          s.state = 2
          s.t = 0
        }
      }
      f.popupCount++
      io.emit('popup', box.x + box.w / 2, box.y + box.h / 2, false)
      f.popupDue = f.phase === 1 ? POPUP.gaps[Math.min(f.popupCount, POPUP.gaps.length) - 1]! : POPUP.again
    } else f.popupDue = 0.2
  }
  return used
}

function darts(f: Fight, io: StepIo, arena: Arena, used: boolean): void {
  const dt = io.dt
  if (io.pressed && !used && f.flat <= 0) {
    f.idle = 0
    f.tired = 0
    for (let i = 0; i < DART.volley; i++) f.darts.push({ n: f.dartCount++, x: io.cursor.x, y: io.cursor.y, dx: 0, dy: 0, t: -i * DART.gap, p: f.phase })
  }
  const keep: Dart[] = []
  for (const d of f.darts) {
    const was = d.t
    d.t += dt
    if (d.t < 0) {
      keep.push(d)
      continue
    }
    if (was < 0 || (was === 0 && d.dx === 0 && d.dy === 0)) {
      const tip = { x: io.cursor.x, y: io.cursor.y }
      const dx = f.x - tip.x
      const dy = f.y - tip.y
      const len = Math.hypot(dx, dy) || 1
      d.x = tip.x
      d.y = tip.y
      d.dx = dx / len
      d.dy = dy / len
      f.flashes.push({ n: TIP_FLASH.n + d.n, x: d.x + d.dx * TIP_FLASH.ahead, y: d.y + d.dy * TIP_FLASH.ahead, rot: Math.atan2(d.dy, d.dx), t: 0, r: TIP_FLASH.r })
      io.emit('dart-fire', d.x, d.y, false)
    }
    d.x += d.dx * DART.speed * dt
    d.y += d.dy * DART.speed * dt
    const wall = f.popups.find((p) => p.closing < 0 && p.t > 0.12 && inside(arena.popups[p.slot]!.box, d.x, d.y))
    if (wall) {
      const fresh = wall.hp === POPUP.hp
      wall.hp--
      wall.dx = d.dx
      wall.dy = d.dy
      wall.vel += POPUP.kick[wall.hp <= 0 ? 2 : fresh ? 0 : 1]
      if (wall.hp <= 0) {
        wall.closing = 0
        wall.shot = true
      }
      spark(f, d.x, d.y)
      io.emit('dart-hit', d.x, d.y, false)
      continue
    }
    const far = Math.hypot(d.x - f.x, d.y - f.y)
    const was2 = Math.hypot(d.x - d.dx * DART.speed * dt - f.x, d.y - d.dy * DART.speed * dt - f.y)
    const glass = (was2 > GUARD.radius || d.t <= dt) && far <= GUARD.radius && shielded(f, d.x, d.y)
    const ex = (d.x - f.x) / BODY.rx
    const ey = (d.y - f.y) / BODY.ry
    if (glass || ex * ex + ey * ey <= 1) {
      if (glass) {
        const a = bearing(f, d.x, d.y)
        d.x = f.x + Math.cos(a) * GUARD.radius
        d.y = f.y + Math.sin(a) * GUARD.radius
      }
      const open = !(f.phase === 2 && f.expired < 0.8)
      const worth = glass ? GUARD.chip : REAL_DART[f.phase]! * wear(f.clock) * (io.mode === 'film' ? FILM.dart : 1)
      if (open && d.p === f.phase) f.health = Math.max(THRESHOLD[f.phase]!, Math.min(f.health, floor(f)), f.health - worth)
      spark(f, d.x, d.y, glass ? SHIELD.z : 0)
      if (glass) {
        f.glances++
        f.run++
        io.emit('shield-glance', d.x, d.y, false)
      } else {
        f.rounds++
        f.run = 0
        f.flash = 0.12
        io.emit('dart-hit', d.x, d.y, false)
        io.emit('shot-round', d.x, d.y, false)
      }
      continue
    }
    if (d.t < DART.life && d.x > -40 && d.x < 1960 && d.y > -40 && d.y < 1120) keep.push(d)
  }
  f.darts = keep
  for (const s of f.sparks) s.t += dt
  f.sparks = f.sparks.filter((s) => s.t < SPARK_SECONDS)
  for (const m of f.flashes) m.t += dt
  f.flashes = f.flashes.filter((m) => m.t < FLASH_SECONDS)
}

export function stepFight(f: Fight, io: StepIo, arena: Arena): void {
  if (f.over) return
  const dt = io.dt
  f.clock += dt
  f.phaseClock += dt
  if (f.safe > 0) f.safe -= dt
  if (f.flash > 0) f.flash -= dt
  const at = cursorCentre(io.cursor)
  const ease = 1 - Math.exp(-dt / LOOK_EASE)
  f.look.x += (at.x - f.look.x) * ease
  f.look.y += (at.y - f.look.y) * ease
  if (f.dust >= 0) {
    f.dust -= dt
    if (f.dust < 0) io.cursor.react('dustOff')
  }
  if (f.phase === 2) {
    if (f.expired < 0 && f.phaseClock >= 0.3) {
      f.expired = 0
      clearPage(f)
      io.emit('session-expired', f.x, f.y, false)
      io.cursor.react('doubleTake')
    } else if (f.expired >= 0) {
      if (f.expired < 0.5) f.health = Math.min(START[2], f.health + (EXPIRED_GAIN * dt) / 0.5)
      f.expired += dt
    }
  }
  if (spent(f)) clearPage(f)
  f.idle += dt
  if (f.idle >= IDLE.after) f.tired += dt
  if (f.flat > 0) {
    f.flat -= dt
    if (f.flat <= 0) io.emit('peel-up', at.x, at.y, false)
  }
  if (f.healDue >= 0) {
    f.healDue -= dt
    if (f.healDue < 0) {
      const gain = Math.max(0, Math.min(healNext(f.heals), START[f.phase] - f.health))
      f.heals++
      if (gain > 0.01 && !(f.phase === 2 && f.expired < 0.5)) {
        f.health += gain
        f.healed += gain
        io.emit('boss-heal', f.x, f.y, false)
      }
    }
  }
  if (f.stall > 0) f.stall -= dt
  else if (!bannerUp(f)) {
    const max = turnRate(f.clock) * dt
    f.face = turn(f.face + Math.max(-max, Math.min(max, turn(bearing(f, at.x, at.y) - f.face))))
  }
  if (f.weak > 0) f.weak -= dt
  if (f.weakDue > 0) f.weakDue -= dt
  if (f.run >= GUARD.tellAfter && f.weakDue <= 0) {
    f.weakDue = GUARD.tellEvery
    f.weak = GUARD.tellSeconds
    f.run = 0
    const w = weakSide(f)
    io.emit('weak-tell', w.x, w.y, false)
  }
  walk(f, io)
  if (f.safe <= 0 && touches(f, at.x, at.y)) {
    strike(f, io, at.x, at.y, 2)
    const d = Math.hypot(f.x - at.x, f.y - at.y) || 1
    f.to = { x: Math.min(MOVE.fence.x1, Math.max(MOVE.fence.x0, at.x + ((f.x - at.x) / d) * MOVE.back)), y: Math.min(MOVE.fence.y1, Math.max(MOVE.fence.y0, at.y + ((f.y - at.y) / d) * MOVE.back)) }
    f.leg = MOVE.leg
    f.moveDue = MOVE.every
    io.emit('boss-move', f.x, f.y, false)
  }
  slabs(f, io, arena)
  corners(f, io)
  const used = popups(f, io, arena)
  darts(f, io, arena, used)
  if (!(f.phase === 2 && f.expired < 0.5)) f.health = Math.min(f.health, ceiling(f.phase, f.tired))
  if (!f.slow && f.clock >= SLOW_SECONDS) {
    f.slow = true
    if (io.mode === 'live' && f.health > HEALTH / 2) io.emit('boss-slow', f.x, f.y, false)
  }
  f.shown += (f.health - f.shown) * Math.min(1, dt * 12)
  if (f.health <= THRESHOLD[f.phase]! + 1e-6) {
    if (f.phase === 2) {
      f.over = true
      f.health = 0
    } else {
      f.phase = (f.phase + 1) as 1 | 2
      f.phaseClock = 0
      f.tired = 0
      f.popupDue = f.phase === 2 ? POPUP.late : POPUP.first
      f.nextSlab = f.phase === 2 ? SLAB.late : Math.max(f.nextSlab, 0.9)
      f.windup = -1
      f.burst = 0
      for (const s of f.slabs) {
        if (s.state === 1) {
          s.state = 2
          s.t = 0
        }
      }
    }
  }
}

export function clearSpot(f: Fight, arena: Arena, x: number, y: number): boolean {
  for (const p of f.popups) {
    if (p.closing >= 0) continue
    const b = arena.popups[p.slot]!.box
    for (let k = 0; k <= 40; k++) {
      const px = x + ((f.x - x) * k) / 40
      const py = y + ((f.y - y) * k) / 40
      if (inside(b, px, py, 8)) return false
    }
  }
  return true
}

export function threat(f: Fight, arena: Arena, x: number, y: number): { dx: number; dy: number } | null {
  const c = { x: x + 18, y: y + 32 }
  const lanes: { x: number; y: number; dx: number; dy: number; reach: number; half: number }[] = []
  for (const s of f.slabs) if (s.state === 0) lanes.push({ x: s.x, y: s.y, dx: s.dx, dy: s.dy, reach: s.left + arena.slabs[s.m]!.w / 2 + 30, half: (Math.abs(s.dy) * arena.slabs[s.m]!.w + Math.abs(s.dx) * arena.slabs[s.m]!.h) / 2 + 24 })
  for (const b of f.balls) lanes.push({ x: b.x, y: b.y, dx: b.dx, dy: b.dy, reach: 2400, half: CORNER.ball + CORNER.reach + 30 })
  if (touches({ ...f, x: f.leg > 0 ? f.to.x : f.x, y: f.leg > 0 ? f.to.y : f.y } as Fight, c.x, c.y) || Math.hypot(c.x - f.x, c.y - f.y) < BODY.rx + MOVE.touch + 40) {
    const d = Math.hypot(c.x - f.x, c.y - f.y) || 1
    return { dx: (c.x - f.x) / d, dy: (c.y - f.y) / d }
  }
  if (f.windup >= 0) {
    const from = muzzle(f, f.cannon)
    const d = Math.hypot(f.aim.x - from.x, f.aim.y - from.y) || 1
    lanes.push({ x: from.x, y: from.y, dx: (f.aim.x - from.x) / d, dy: (f.aim.y - from.y) / d, reach: d + SLAB.overshoot + 260, half: SLAB_HALF + Math.abs((f.aim.y - from.y) / d) * 120 })
  }
  for (const l of lanes) {
    const rx = c.x - l.x
    const ry = c.y - l.y
    const along = rx * l.dx + ry * l.dy
    const across = -rx * l.dy + ry * l.dx
    if (along > -260 && along < l.reach && Math.abs(across) < l.half + 26) return { dx: -l.dy * (across >= 0 ? 1 : -1), dy: l.dx * (across >= 0 ? 1 : -1) }
  }
  return null
}
