import { boxToSegment } from '../arena/solids'
import type { StepIo } from '../stage/types'
import { FOOT_OFF, muzzleAt, smooth } from './body'
import { FLOOR, DART, EVENT, EXPIRED_GAIN, HEALTH, HOME, LAST_CLEAR, LOOK_EASE, POPUP, SHIELD, SLOW_SECONDS, THRESHOLD } from './plan'
import { BIG, CORNER, FILM, FLAT, GUARD, GUN, HEAL, IDLE, LOOK1_ON, MERCY, MOVE, POPUPS_ON, REAL_DART, SHAPE, SOLID, TRACK, WEAR } from './tune'

export interface Rect { x: number; y: number; w: number; h: number }
export interface Wall { id: string; kind: 'pillar' | 'pane' | 'bar'; x0: number; y0: number; x1: number; y1: number }
export interface Arena { popups: { box: Rect; buttons: Rect[] }[]; walls?: Wall[] }
export interface Break { n: number; at: number; x0: number; y0: number; x1: number; y1: number; width: number }

export interface Popup { slot: number; hp: number; t: number; closing: number; off: number; vel: number; dx: number; dy: number; shot: boolean }
export interface Dart { n: number; x: number; y: number; dx: number; dy: number; t: number; p: number }
export interface Flash { n: number; x: number; y: number; rot: number; t: number; r?: number }
export interface Spark { n: number; x: number; y: number; t: number; z?: number; k?: 'glance' | 'round' | 'solid' | 'arrow' }
// A bullet. `i` says whose it is: 0 to 3 a corner cannon, 4 the boss's own guns.
export interface Ball { n: number; i: number; x: number; y: number; dx: number; dy: number; t: number; v: number }
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
  big: { due: number; t: number; beam: number; a: number; x: number; y: number; last?: boolean }
  breaks: Break[]
  fallen: string[]
  walked: number
  speed: { x: number; y: number }
  at: { glance: number; gun: [number, number]; big: number; heal: number; hit: number; flat: number; weak: number; corner: [number, number, number, number] }
  mark: { x: number; y: number } | null
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
    vel: { x: 0, y: 0 }, prev: null, turret: 0, big: { due: BIG.first, t: -1, beam: 0, a: 0, x: 0, y: 0 }, breaks: [], fallen: [], walked: 0, speed: { x: 0, y: 0 },
    at: { glance: -1, gun: [-1, -1], big: -1, heal: -1, hit: -1, flat: -1, weak: -1, corner: [-1, -1, -1, -1] }, mark: null
  }
}

export const ceiling = (phase: number, tired: number): number => {
  const from = START[phase]!
  const to = THRESHOLD[phase]!
  return Math.max(to, from - ((from - to) * Math.max(0, tired)) / IDLE.ramp)
}

export const turn = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a))
export const bearing = (f: { x: number; y: number }, x: number, y: number): number => Math.atan2(y - f.y, x - f.x)
export const mercy = (clock: number): number => (clock < MERCY.from ? 0 : MERCY.share[Math.min(MERCY.share.length - 1, Math.floor((clock - MERCY.from) / MERCY.every))]!)
export const shielded = (f: { x: number; y: number; face: number }, x: number, y: number): boolean => Math.abs(turn(bearing(f, x, y) - f.face)) <= GUARD.cover
export const turnRate = (clock: number): number => TRACK.turn * Math.max(TRACK.least, 1 - ((1 - TRACK.least) * clock) / TRACK.tire)
export const wear = (clock: number): number => 1 + Math.max(0, clock - WEAR.from) / WEAR.double
export const healNext = (heals: number): number => HEAL.first * HEAL.shrink ** heals
export const cornerAt = (i: number): { x: number; y: number } => ({ x: CORNER.at[i]![0], y: CORNER.at[i]![1] })
export const weakSide = (f: { x: number; y: number; face: number }): { x: number; y: number } => ({ x: f.x - Math.cos(f.face) * SHAPE.rx * 0.8, y: f.y - Math.sin(f.face) * SHAPE.ry * 0.8 })
const touches = (f: Fight, x: number, y: number): boolean => ((x - f.x) / (SHAPE.rx + MOVE.touch)) ** 2 + ((y - f.y) / (SHAPE.ry + MOVE.touch)) ** 2 <= 1

const floor = (f: Fight, film: boolean): number => {
  const from = START[f.phase]!
  const clock = f.phase === 2 ? f.expired - 0.8 : f.phaseClock
  return from - ((from - THRESHOLD[f.phase]!) * Math.max(0, clock)) / (FLOOR[f.phase]! * (film ? FILM.floor[f.phase]! : 1))
}

const inside = (r: Rect, x: number, y: number, grow = 0): boolean => x >= r.x - grow && x <= r.x + r.w + grow && y >= r.y - grow && y <= r.y + r.h + grow

// A small gun's muzzle. On the stand-in the two guns sit above and below the body and do not turn with it; on LOOK 1 the whole body turns with the way he faces.
export const muzzle = (f: Fight, i: number): { x: number; y: number; rot: number } => {
  if (!LOOK1_ON) return muzzleAt(f.x, f.y, i, f.look)
  const side = (i === 0 ? -1 : 1) * SHAPE.gun
  const px = f.x - Math.sin(f.face) * side
  const py = f.y + Math.cos(f.face) * side
  const rot = Math.atan2(f.look.y - py, f.look.x - px)
  return { x: px + Math.cos(rot) * SHAPE.barrel, y: py + Math.sin(rot) * SHAPE.barrel, rot }
}

// What stands in the arena and stops a shot: the pillars and panes that no blast has broken, and the box round the health bar, which never breaks.
const ALL_WALLS: Wall[] = [
  ...SOLID.pillars.map(([x, y], i): Wall => ({ id: `pillar-${i}`, kind: 'pillar', x0: x - SOLID.side / 2, y0: y - SOLID.side / 2, x1: x + SOLID.side / 2, y1: y + SOLID.side / 2 })),
  ...SOLID.panes.map(([x0, y0, x1, y1], i): Wall => ({ id: `pane-${i}`, kind: 'pane', x0, y0, x1, y1 }))
]
export const BAR_WALL: Wall = { id: 'bar', kind: 'bar', x0: SOLID.bar[0], y0: SOLID.bar[1], x1: SOLID.bar[2], y1: SOLID.bar[3] }
export const standing = (f: { fallen: string[] }): Wall[] => ALL_WALLS.filter((w) => !f.fallen.includes(w.id))
export const wallsOf = (f: Fight, arena: Arena): Wall[] => [...(arena.walls ?? standing(f)).filter((w) => !f.fallen.includes(w.id)), BAR_WALL]

// Where along the way from (x0, y0) to (x1, y1) a shot first meets the box grown by `grow`: 0 to 1, or -1 when it does not.
export function meets(x0: number, y0: number, x1: number, y1: number, w: Wall, grow = 0): number {
  let t0 = 0
  let t1 = 1
  const dx = x1 - x0
  const dy = y1 - y0
  for (const [p, d, lo, hi] of [[x0, dx, w.x0 - grow, w.x1 + grow], [y0, dy, w.y0 - grow, w.y1 + grow]] as const) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return -1
    } else {
      const a = (lo - p) / d
      const b = (hi - p) / d
      t0 = Math.max(t0, Math.min(a, b))
      t1 = Math.min(t1, Math.max(a, b))
      if (t0 > t1) return -1
    }
  }
  return t0
}

// How near the stretch from (x0, y0) to (x1, y1) comes to the box, in px.
export function nearBox(x0: number, y0: number, x1: number, y1: number, w: Wall): number {
  if (meets(x0, y0, x1, y1, w) >= 0) return 0
  const toSeg = (px: number, py: number): number => {
    const dx = x1 - x0
    const dy = y1 - y0
    const u = Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(x0 + dx * u - px, y0 + dy * u - py)
  }
  const toBox = (px: number, py: number): number => Math.hypot(Math.max(w.x0 - px, 0, px - w.x1), Math.max(w.y0 - py, 0, py - w.y1))
  return Math.min(toSeg(w.x0, w.y0), toSeg(w.x1, w.y0), toSeg(w.x0, w.y1), toSeg(w.x1, w.y1), toBox(x0, y0), toBox(x1, y1))
}

// The line of the big cannon: from its muzzle, ahead of the boss, along `a` to the edge of the screen.
export function blastLine(f: { x: number; y: number }, a: number): { x0: number; y0: number; x1: number; y1: number } {
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  const x0 = f.x + dx * BIG.muzzle
  const y0 = f.y + dy * BIG.muzzle
  const tx = dx > 1e-9 ? (PAGE.w - x0) / dx : dx < -1e-9 ? -x0 / dx : Infinity
  const ty = dy > 1e-9 ? (PAGE.h - y0) / dy : dy < -1e-9 ? -y0 / dy : Infinity
  const t = Math.max(0, Math.min(tx, ty))
  return { x0, y0, x1: x0 + dx * t, y1: y0 + dy * t }
}

// The way the big cannon will fire: the way he faces, turned to the nearer side of the health bar's box when the line would cross it.
export function clearAim(f: { x: number; y: number }, a: number): number {
  const crosses = (b: number): boolean => {
    const l = blastLine(f, b)
    return nearBox(f.x, f.y, l.x1, l.y1, BAR_WALL) <= BIG.wide
  }
  if (!crosses(a)) return a
  for (let k = 1; k * BIG.swing < Math.PI; k++) {
    if (!crosses(a + k * BIG.swing)) return turn(a + k * BIG.swing)
    if (!crosses(a - k * BIG.swing)) return turn(a - k * BIG.swing)
  }
  return a
}

export const bannerUp = (f: Fight): boolean => f.expired >= 0 && f.expired < 1.5
export const spent = (f: Fight): boolean => f.phase === 2 && f.expired >= 1.5 && f.health <= LAST_CLEAR
const quiet = (f: Fight): boolean => bannerUp(f) || (f.phase === 2 && f.expired < 0) || spent(f)

function clearPage(f: Fight): void {
  for (const p of f.popups) if (p.closing < 0) p.closing = 0
  f.windup = -1
  f.burst = 0
  f.tell = null
  f.leg = 0
  if (!f.big.last) f.big.t = -1
}

function wander(f: Fight, io: StepIo): { x: number; y: number; speed: number } {
  const dt = io.dt
  const held = bannerUp(f) || (f.phase === 2 && f.expired < 0) || f.big.t >= 0
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
    f.walked += d * k
  }
  f.speed = { x: vx, y: vy }
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

function spark(f: Fight, x: number, y: number, z = 0, k: Spark['k'] = 'round'): void {
  f.sparks.push({ n: f.sparkCount++, x, y, t: 0, z, k })
}

function strike(f: Fight, io: StepIo, x: number, y: number, by: 0 | 1 | 2 | 3): void {
  f.by[by]++
  f.safe = FLAT.safe
  f.flat = FLAT.down
  f.healDue = FLAT.heal
  f.dust = FLAT.life
  f.hits++
  f.at.flat = f.clock
  f.mark = { x: io.cursor.x, y: io.cursor.y }
  io.cursor.hurt('flattened', FLAT.life)
  io.cursor.spread(FLAT.spread, FLAT.down)
  io.emit('flatten', x, y, true)
}

// An aimed shot allows for a share of the arrow's own travel while the bullet flies, and never for all of it.
export function leadAim(f: Fight, from: { x: number; y: number }, c: { x: number; y: number }, speed: number): { x: number; y: number } {
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

function corners(f: Fight, io: StepIo, walls: Wall[]): void {
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
      f.at.corner[f.tell.i as 0 | 1 | 2 | 3] = f.clock
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
    const wx = b.x
    const wy = b.y
    b.x += b.dx * b.v * dt
    b.y += b.dy * b.v * dt
    if (f.safe <= 0 && Math.hypot(c.x - b.x, c.y - b.y) < GUN.r + GUN.reach) {
      strike(f, io, c.x, c.y, b.i === 4 ? 0 : 1)
      spark(f, b.x, b.y, 0, 'arrow')
      continue
    }
    let stop = -1
    let bar = false
    for (const w of walls) {
      const u = meets(wx, wy, b.x, b.y, w, GUN.r * 0.5)
      if (u >= 0 && (stop < 0 || u < stop)) {
        stop = u
        bar = w.kind === 'bar'
      }
    }
    if (stop >= 0) {
      if (!bar) spark(f, wx + (b.x - wx) * stop, wy + (b.y - wy) * stop, 0, 'solid')
      continue
    }
    if (b.t < GUN.life && b.x > -60 && b.x < PAGE.w + 60 && b.y > -60 && b.y < PAGE.h + 60) keep.push(b)
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
  f.at.gun[f.cannon] = f.clock
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
          shoot(f, 4, { x: f.x + Math.cos(a) * SHAPE.rx, y: f.y + Math.sin(a) * SHAPE.ry }, a, GUN.speed[f.phase]!)
        }
        f.recoil = [26, 26]
        f.at.gun = [f.clock, f.clock]
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
  } else if (!quiet(f) && f.big.t < 0) {
    f.gunDue -= dt
    const armed = !POPUPS_ON || f.phase !== 1 || f.popupCount >= POPUP_ORDER.length || f.phaseClock >= POPUP.armed
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

// The big cannon: a long tell along the way he faces, to the edge of the screen, then one blast down that line. Every pillar and pane on the line breaks for good; an arrow on it is laid flat.
function big(f: Fight, io: StepIo, walls: Wall[]): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  const b = f.big
  if (b.beam > 0) b.beam -= dt
  if (b.t >= 0) {
    b.t += dt
    if (b.t >= BIG.tell) {
      const l = blastLine(f, b.a)
      b.t = -1
      b.beam = BIG.beam
      b.due = BIG.every
      b.last = false
      f.at.big = f.clock
      f.breaks.push({ n: f.breaks.length, at: f.clock, x0: l.x0, y0: l.y0, x1: l.x1, y1: l.y1, width: BIG.wide * 2 })
      io.emit('big-fire', f.x, f.y, false)
      io.emit('arena-break', l.x1, l.y1, false)
      for (const w of walls) {
        if (w.kind === 'bar' || boxToSegment(w, l.x0, l.y0, l.x1, l.y1) > BIG.wide) continue
        f.fallen.push(w.id)
        io.emit(w.kind === 'pane' ? 'pane-shatter' : 'pillar-break', (w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, false)
      }
      const rx = c.x - f.x
      const ry = c.y - f.y
      const along = rx * Math.cos(b.a) + ry * Math.sin(b.a)
      const across = -rx * Math.sin(b.a) + ry * Math.cos(b.a)
      if (f.safe <= 0 && along > 0 && Math.abs(across) < BIG.wide) strike(f, io, c.x, c.y, 3)
    }
  } else if (!quiet(f) || (b.last && !bannerUp(f))) {
    b.due -= dt
    if (b.due <= 0 && f.flat <= 0 && f.windup < 0 && f.burst === 0) {
      b.t = 0
      b.a = clearAim(f, f.face)
      b.x = c.x
      b.y = c.y
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
  if (!POPUPS_ON || f.phase === 0 || quiet(f)) return used
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

function darts(f: Fight, io: StepIo, arena: Arena, used: boolean, walls: Wall[]): void {
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
    const wx = d.x
    const wy = d.y
    d.x += d.dx * DART.speed * dt
    d.y += d.dy * DART.speed * dt
    let stop = -1
    let bar = false
    for (const w of walls) {
      const u = meets(wx, wy, d.x, d.y, w)
      if (u >= 0 && (stop < 0 || u < stop)) {
        stop = u
        bar = w.kind === 'bar'
      }
    }
    if (stop >= 0) {
      if (!bar) {
        const sx = wx + (d.x - wx) * stop
        const sy = wy + (d.y - wy) * stop
        spark(f, sx, sy, 0, 'solid')
        io.emit('cover-hit', sx, sy, false)
      }
      continue
    }
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
    const ex = (d.x - f.x) / SHAPE.rx
    const ey = (d.y - f.y) / SHAPE.ry
    if (glass || ex * ex + ey * ey <= 1) {
      if (glass) {
        const a = bearing(f, d.x, d.y)
        d.x = f.x + Math.cos(a) * GUARD.radius
        d.y = f.y + Math.sin(a) * GUARD.radius
      }
      const open = !(f.phase === 2 && f.expired < 0.8)
      const real = REAL_DART[f.phase]! * wear(f.clock) * (io.mode === 'film' ? FILM.dart[f.phase]! : 1)
      const worth = glass ? Math.max(GUARD.chip, real * mercy(f.clock)) : real
      if (open && d.p === f.phase) f.health = Math.max(THRESHOLD[f.phase]!, Math.min(f.health, floor(f, io.mode === 'film')), f.health - worth)
      spark(f, d.x, d.y, glass ? SHIELD.z : 0, glass ? 'glance' : 'round')
      if (glass) {
        f.glances++
        f.at.glance = f.clock
        f.run++
        io.emit('shield-glance', d.x, d.y, false)
      } else {
        f.rounds++
        f.at.hit = f.clock
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

// `deaf`: no click fires a dart in this step.
export function stepFight(f: Fight, io: StepIo, arena: Arena, deaf = false): void {
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
      if (f.expired >= 1.5 && f.expired - dt < 1.5 && io.mode !== 'film') {
        f.big.last = true
        f.big.due = Math.min(f.big.due, BIG.last)
      }
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
        f.at.heal = f.clock
        io.emit('boss-heal', f.x, f.y, false)
      }
    }
  }
  if (f.big.t >= 0) {
    const max = BIG.turn * dt
    f.face = turn(f.face + Math.max(-max, Math.min(max, turn(f.big.a - f.face))))
    if (f.stall > 0) f.stall -= dt
  } else if (f.stall > 0) f.stall -= dt
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
    f.at.weak = f.clock
    const w = weakSide(f)
    io.emit('weak-tell', w.x, w.y, false)
  }
  walk(f, io)
  if (f.safe <= 0 && f.turret >= 1 && touches(f, at.x, at.y)) {
    strike(f, io, at.x, at.y, 2)
    const d = Math.hypot(f.x - at.x, f.y - at.y) || 1
    f.to = { x: Math.min(MOVE.fence.x1, Math.max(MOVE.fence.x0, at.x + ((f.x - at.x) / d) * MOVE.back)), y: Math.min(MOVE.fence.y1, Math.max(MOVE.fence.y0, at.y + ((f.y - at.y) / d) * MOVE.back)) }
    f.leg = MOVE.leg
    f.moveDue = MOVE.every
    io.emit('boss-move', f.x, f.y, false)
  }
  const walls = wallsOf(f, arena)
  guns(f, io)
  big(f, io, walls)
  corners(f, io, walls)
  const used = popups(f, io, arena)
  darts(f, io, arena, used || deaf, wallsOf(f, arena))
  if (!(f.phase === 2 && f.expired < 0.5)) f.health = Math.min(f.health, ceiling(f.phase, f.tired))
  if (io.mode === 'film' && f.clock >= FILM.ends[f.phase]!) f.health = THRESHOLD[f.phase]!
  else if (io.mode === 'film' && LOOK1_ON) f.health = Math.max(f.health, THRESHOLD[f.phase]! + FILM.spare)
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
      if (!POPUPS_ON && f.phase === 1) io.emit(EVENT.second, f.x, f.y, false)
    }
  }
}

export function clearSpot(f: Fight, arena: Arena, x: number, y: number): boolean {
  for (const w of wallsOf(f, arena)) if (meets(x, y, f.x, f.y, w, 6) >= 0) return false
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
  if (touches({ ...f, x: f.leg > 0 ? f.to.x : f.x, y: f.leg > 0 ? f.to.y : f.y } as Fight, c.x, c.y) || Math.hypot(c.x - f.x, c.y - f.y) < SHAPE.rx + MOVE.touch + 40) {
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
  else if (f.big.due < BIG.wary && (!quiet(f) || f.big.last)) lanes.push({ x: f.x, y: f.y, dx: Math.cos(f.face), dy: Math.sin(f.face), reach: 2400, half: BIG.wide })
  for (const l of lanes) {
    const rx = c.x - l.x
    const ry = c.y - l.y
    const along = rx * l.dx + ry * l.dy
    const across = -rx * l.dy + ry * l.dx
    if (along > -GUN.r && along < l.reach && Math.abs(across) < l.half) return { dx: -l.dy * (across >= 0 ? 1 : -1), dy: l.dx * (across >= 0 ? 1 : -1) }
  }
  return null
}
