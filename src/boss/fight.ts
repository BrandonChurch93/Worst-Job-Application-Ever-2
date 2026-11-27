import type { StepIo } from '../stage/types'
import { FOOT_OFF, muzzleAt, smooth } from './body'
import { BODY, FLOOR, DART, EVENT, EXPIRED_GAIN, HEALTH, HOME, LAST_CLEAR, LOOK_EASE, POPUP, SHIELD, SLOW_SECONDS, THRESHOLD } from './plan'
import { BIG, CORNER, FILM, FLAT, GUARD, GUN, HEAL, IDLE, MOVE, REAL_DART, TRACK, WEAR } from './tune'

export interface Rect { x: number; y: number; w: number; h: number }
export interface Arena { popups: { box: Rect; buttons: Rect[] }[] }

export interface Popup { slot: number; hp: number; t: number; closing: number; off: number; vel: number; dx: number; dy: number; shot: boolean }
export interface Dart { n: number; x: number; y: number; dx: number; dy: number; t: number; p: number }
export interface Flash { n: number; x: number; y: number; rot: number; t: number; r?: number }
export interface Spark { n: number; x: number; y: number; t: number; z?: number }
// A bullet. `i` says whose it is: 0 to 3 a corner cannon, 4 the boss's own guns.
export interface Ball { n: number; i: number; x: number; y: number; dx: number; dy: number; t: number; v: number }
export interface Mark { n: number; x: number; y: number; rot: number; t: number }
export type Pattern = 'one' | 'fan' | 'line' | 'ring'
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
  popups: Popup[]
  darts: Dart[]
  sparks: Spark[]
  flashes: Flash[]
  gunDue: number
  shape: Pattern
  windup: number
  aim: { x: number; y: number }
  cannon: 0 | 1
  attacks: number
  burst: number
  burstDue: number
  recoil: [number, number]
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
  by: [number, number, number, number]
  vel: { x: number; y: number }
  prev: { x: number; y: number } | null
  turret: number
  big: { due: number; t: number; beam: number; a: number; x: number; y: number }
  marks: Mark[]
  markCount: number
}

const START = [HEALTH, THRESHOLD[0], THRESHOLD[1] + EXPIRED_GAIN] as const
const POPUP_ORDER = [1, 2, 0] as const
const PAGE = { w: 1920, h: 1080 } as const
export const SPARK_SECONDS = 0.3
export const FLASH_SECONDS = 0.16
const TIP_FLASH = { n: 5000, ahead: 14, r: 26 }

export const cursorCentre = (c: { x: number; y: number }): { x: number; y: number } => ({ x: c.x + 18, y: c.y + 32 })

export function newFight(x: number = HOME.x, y: number = HOME.y): Fight {
  return {
    phase: 0, clock: 0, phaseClock: 0, health: HEALTH, shown: HEALTH, x, y,
    feet: FOOT_OFF.map(([ox, oy]) => ({ x: x + ox, y: y + oy, fx: 0, fy: 0, tx: 0, ty: 0, t: -1 })),
    popups: [], darts: [], sparks: [], flashes: [], gunDue: GUN.first, shape: 'one', windup: -1, aim: { x: 0, y: 0 }, cannon: 0, attacks: 0, burst: 0, burstDue: 0, recoil: [0, 0], popupCount: 0, popupDue: POPUP.first,
    dartCount: 0, sparkCount: 0, expired: -1, slow: false, safe: 0, dust: -1, hits: 0, flash: 0, look: { x: x - 600, y }, over: false,
    face: Math.PI, stall: 0, to: { x, y }, leg: 0, moveDue: MOVE.first, cornerDue: CORNER.first, cornerCount: 0, tell: null, balls: [], ballCount: 0, flat: 0, healDue: -1, heals: 0, healed: 0, idle: 0, tired: 0, glances: 0, rounds: 0, run: 0, weakDue: 0, weak: 0, by: [0, 0, 0, 0],
    vel: { x: 0, y: 0 }, prev: null, turret: 0, big: { due: BIG.first, t: -1, beam: 0, a: 0, x: 0, y: 0 }, marks: [], markCount: 0
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
  f.windup = -1
  f.burst = 0
  f.tell = null
  f.leg = 0
  f.big.t = -1
}

function wander(f: Fight, io: StepIo): { x: number; y: number; speed: number } {
  const dt = io.dt
  const held = bannerUp(f) || (f.phase === 2 && f.expired < 0) || f.big.t >= 0 || f.turret < 1
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
    const far = Math.hypot(at.x - f.x, at.y - f.y) || 1
    const go = Math.max(0, far - MOVE.short) / far
    const x = Math.min(MOVE.fence.x1, Math.max(MOVE.fence.x0, f.x + (at.x - f.x) * go))
    const y = Math.min(MOVE.fence.y1, Math.max(MOVE.fence.y0, f.y + (at.y - f.y) * go))
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

function strike(f: Fight, io: StepIo, x: number, y: number, by: 0 | 1 | 2 | 3): void {
  f.by[by]++
  f.safe = FLAT.safe
  f.flat = FLAT.down
  f.healDue = FLAT.heal
  f.dust = FLAT.life
  f.hits++
  io.cursor.hurt('flattened', FLAT.life)
  io.emit('flatten', x, y, true)
}

// An aimed shot allows for a share of the arrow's own travel while the bullet flies, and never for all of it.
function leadAim(f: Fight, from: { x: number; y: number }, c: { x: number; y: number }, speed: number): { x: number; y: number } {
  const go = (Math.hypot(c.x - from.x, c.y - from.y) / speed) * GUN.lead
  let lx = f.vel.x * go
  let ly = f.vel.y * go
  const l = Math.hypot(lx, ly)
  if (l > GUN.leadMost) {
    lx *= GUN.leadMost / l
    ly *= GUN.leadMost / l
  }
  return { x: c.x + lx, y: c.y + ly }
}

function shoot(f: Fight, i: number, from: { x: number; y: number }, a: number, speed: number): void {
  f.balls.push({ n: f.ballCount++, i, x: from.x, y: from.y, dx: Math.cos(a), dy: Math.sin(a), t: 0, v: speed })
}

function corners(f: Fight, io: StepIo): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  if (f.tell) {
    f.tell.t += dt
    if (f.tell.t >= CORNER.tell) {
      const from = cornerAt(f.tell.i)
      const to = leadAim(f, from, c, CORNER.speed)
      const a = Math.atan2(to.y - from.y, to.x - from.x)
      shoot(f, f.tell.i, from, a, CORNER.speed)
      f.flashes.push({ n: 7000 + f.ballCount, x: from.x + Math.cos(a) * CORNER.base, y: from.y + Math.sin(a) * CORNER.base, rot: a, t: 0 })
      io.emit('cannon-fire', from.x, from.y, false)
      f.tell = null
    }
  } else if (!quiet(f) && f.turret >= 1) {
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
    b.x += b.dx * b.v * dt
    b.y += b.dy * b.v * dt
    if (f.safe <= 0 && Math.hypot(c.x - b.x, c.y - b.y) < GUN.r + GUN.reach) {
      strike(f, io, c.x, c.y, b.i === 4 ? 0 : 1)
      spark(f, b.x, b.y)
      continue
    }
    if (b.t < GUN.life && b.x > -60 && b.x < PAGE.w + 60 && b.y > CORNER.band && b.y < PAGE.h + 60) keep.push(b)
  }
  f.balls = keep
}

// What the boss's own guns fire: one aimed bullet to open, then fans of three; a burst along a line among the pop-ups; rings and fans at the last.
export const patternOf = (phase: number, attacks: number): Pattern => (phase === 0 ? (attacks === 0 ? 'one' : 'fan') : phase === 1 ? 'line' : attacks % 2 === 0 ? 'ring' : 'fan')

function gunFire(f: Fight, io: StepIo, turnBy: number): void {
  const from = muzzle(f, f.cannon)
  const a = Math.atan2(f.aim.y - from.y, f.aim.x - from.x) + turnBy
  shoot(f, 4, from, a, GUN.speed[f.phase]!)
  f.recoil[f.cannon] = 26
  f.flashes.push({ n: 6000 + f.ballCount, x: from.x, y: from.y, rot: a, t: 0 })
  io.emit(EVENT.gun, from.x, from.y, false)
}

function guns(f: Fight, io: StepIo): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  if (f.windup >= 0) {
    f.windup += dt
    f.recoil[f.cannon] = -12 * Math.min(1, f.windup / GUN.tell)
    if (f.windup >= GUN.tell) {
      f.windup = -1
      f.shape = patternOf(f.phase, f.attacks)
      f.attacks++
      f.gunDue = GUN.every[f.phase]!
      if (f.shape === 'ring') {
        const a0 = bearing(f, f.aim.x, f.aim.y)
        for (let k = 0; k < GUN.ring; k++) {
          const a = a0 + (2 * Math.PI * k) / GUN.ring
          shoot(f, 4, { x: f.x + Math.cos(a) * BODY.rx, y: f.y + Math.sin(a) * BODY.ry }, a, GUN.speed[f.phase]!)
        }
        f.recoil = [26, 26]
        io.emit(EVENT.gun, f.x, f.y, false)
      } else {
        gunFire(f, io, 0)
        f.burst = f.shape === 'fan' ? 2 : f.shape === 'line' ? GUN.line - 1 : 0
        f.burstDue = f.shape === 'fan' ? GUN.fanGap : GUN.lineGap
        if (f.shape === 'fan') f.cannon = f.cannon === 0 ? 1 : 0
      }
    }
  } else if (f.burst > 0) {
    f.burstDue -= dt
    if (f.burstDue <= 0) {
      if (f.shape === 'fan') {
        gunFire(f, io, (f.burst === 2 ? 1 : -1) * GUN.fan)
        f.cannon = f.cannon === 0 ? 1 : 0
      } else gunFire(f, io, 0)
      f.burst--
      f.burstDue = f.shape === 'fan' ? GUN.fanGap : GUN.lineGap
    }
  } else if (!quiet(f) && f.turret >= 1 && f.big.t < 0) {
    f.gunDue -= dt
    const armed = f.phase !== 1 || f.popupCount >= POPUP_ORDER.length || f.phaseClock >= POPUP.armed
    const read = f.phase === 1 ? POPUP.aim : POPUP.read
    const one = f.phase === 0 || (armed && !f.popups.some((p) => p.t < read))
    if (f.gunDue <= 0 && one) {
      f.windup = 0
      f.stall = TRACK.stall
      f.aim = leadAim(f, muzzle(f, f.cannon), c, GUN.speed[f.phase]!)
    }
  }
  for (let i = 0; i < 2; i++) if (!(f.windup >= 0 && f.cannon === i)) f.recoil[i] = f.recoil[i]! * Math.max(0, 1 - dt * 9)
}

// The big turret: a long tell along a line from the boss through the arrow, then one blast down that line. Where the arrow stood the ground is marked.
function big(f: Fight, io: StepIo): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  const b = f.big
  if (b.beam > 0) b.beam -= dt
  for (const m of f.marks) m.t += dt
  f.marks = f.marks.filter((m) => m.t < BIG.scorchLife)
  if (b.t >= 0) {
    b.t += dt
    if (b.t >= BIG.tell) {
      b.t = -1
      b.beam = BIG.beam
      b.due = BIG.every
      io.emit('big-fire', f.x, f.y, false)
      f.marks.push({ n: f.markCount++, x: b.x, y: b.y, rot: b.a, t: 0 })
      io.emit('arena-break', b.x, b.y, false)
      const rx = c.x - f.x
      const ry = c.y - f.y
      const along = rx * Math.cos(b.a) + ry * Math.sin(b.a)
      const across = -rx * Math.sin(b.a) + ry * Math.cos(b.a)
      if (f.safe <= 0 && along > 0 && Math.abs(across) < BIG.wide) strike(f, io, c.x, c.y, 3)
    }
  } else if (!quiet(f) && f.turret >= 1 && f.windup < 0 && f.burst === 0) {
    b.due -= dt
    if (b.due <= 0 && f.flat <= 0) {
      b.t = 0
      b.a = bearing(f, c.x, c.y)
      b.x = c.x
      b.y = Math.max(CORNER.band + BIG.scorch.h / 2, c.y)
      f.leg = 0
      f.stall = BIG.tell
      io.emit('big-tell', f.x, f.y, false)
    }
  }
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
    const one = f.windup < 0 && f.burst === 0
    if (free.length && one && (first || f.phase === 2)) {
      const want = POPUP_ORDER[f.popupCount % POPUP_ORDER.length]!
      const slot = free.includes(want) ? want : free[0]!
      const box = arena.popups[slot]!.box
      f.popups.push({ slot, hp: POPUP.hp, t: 0, closing: -1, off: 0, vel: 0, dx: 1, dy: 0, shot: false })
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
  if (f.prev) {
    const k = Math.min(1, dt * GUN.follow)
    f.vel.x += ((at.x - f.prev.x) / dt - f.vel.x) * k
    f.vel.y += ((at.y - f.prev.y) / dt - f.vel.y) * k
  }
  f.prev = { x: at.x, y: at.y }
  if (f.turret < 1) {
    if (f.clock >= BIG.rise && f.clock - dt < BIG.rise) io.emit('turret-rise', f.x, f.y, false)
    f.turret = Math.min(0.999, Math.max(0, (f.clock - BIG.rise) / (BIG.lock - BIG.rise)))
    if (f.clock >= BIG.lock) {
      f.turret = 1
      io.emit('turret-lock', f.x, f.y, false)
    }
  }
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
  guns(f, io)
  big(f, io)
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
      f.gunDue = f.phase === 2 ? GUN.late : Math.max(f.gunDue, GUN.least)
      f.attacks = 0
      f.windup = -1
      f.burst = 0
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
  for (const b of f.balls) lanes.push({ x: b.x, y: b.y, dx: b.dx, dy: b.dy, reach: 2400, half: GUN.r + GUN.reach + GUN.berth })
  if (touches({ ...f, x: f.leg > 0 ? f.to.x : f.x, y: f.leg > 0 ? f.to.y : f.y } as Fight, c.x, c.y) || Math.hypot(c.x - f.x, c.y - f.y) < BODY.rx + MOVE.touch + 40) {
    const d = Math.hypot(c.x - f.x, c.y - f.y) || 1
    return { dx: (c.x - f.x) / d, dy: (c.y - f.y) / d }
  }
  if (f.windup >= 0) {
    const from = muzzle(f, f.cannon)
    const a = Math.atan2(f.aim.y - from.y, f.aim.x - from.x)
    const shape = patternOf(f.phase, f.attacks)
    const turns = shape === 'fan' ? [0, GUN.fan, -GUN.fan] : shape === 'ring' ? Array.from({ length: GUN.ring }, (_, k) => (2 * Math.PI * k) / GUN.ring) : [0]
    for (const t of turns) lanes.push({ x: shape === 'ring' ? f.x : from.x, y: shape === 'ring' ? f.y : from.y, dx: Math.cos((shape === 'ring' ? bearing(f, f.aim.x, f.aim.y) : a) + t), dy: Math.sin((shape === 'ring' ? bearing(f, f.aim.x, f.aim.y) : a) + t), reach: 2400, half: GUN.r + GUN.reach + GUN.berth })
  }
  if (f.big.t >= 0) lanes.push({ x: f.x, y: f.y, dx: Math.cos(f.big.a), dy: Math.sin(f.big.a), reach: 2400, half: BIG.wide + GUN.berth })
  for (const l of lanes) {
    const rx = c.x - l.x
    const ry = c.y - l.y
    const along = rx * l.dx + ry * l.dy
    const across = -rx * l.dy + ry * l.dx
    if (along > -GUN.r && along < l.reach && Math.abs(across) < l.half) return { dx: -l.dy * (across >= 0 ? 1 : -1), dy: l.dx * (across >= 0 ? 1 : -1) }
  }
  return null
}
