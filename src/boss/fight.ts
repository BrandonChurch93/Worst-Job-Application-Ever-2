import type { StepIo } from '../stage/types'
import { CANNON_OFF, FOOT_OFF, smooth } from './body'
import { ARENA, BODY, CAPS, DART, EXPIRED_GAIN, HEALTH, HIT, HOME, POPUP, RAMP, SLAB, SLOW_SECONDS, THRESHOLD } from './plan'

export interface SlabSize { w: number; h: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Arena { slabs: SlabSize[]; popups: { box: Rect; buttons: Rect[] }[] }

export interface Slab { m: number; x: number; y: number; dx: number; dy: number; rot: number; left: number; state: 0 | 1 | 2; t: number }
export interface Popup { slot: number; hp: number; t: number; closing: number }
export interface Dart { n: number; x: number; y: number; dx: number; dy: number; t: number }
export interface Spark { n: number; x: number; y: number; t: number }
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
  nextSlab: number
  windup: number
  aim: { x: number; y: number }
  cannon: 0 | 1
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
  over: boolean
}

const START = [HEALTH, THRESHOLD[0], THRESHOLD[1] + EXPIRED_GAIN] as const
const POPUP_ORDER = [1, 0, 2] as const
const SLAB_HALF = 56

export const cursorCentre = (c: { x: number; y: number }): { x: number; y: number } => ({ x: c.x + 18, y: c.y + 32 })

export function newFight(x: number = HOME.x, y: number = HOME.y): Fight {
  return {
    phase: 0, clock: 0, phaseClock: 0, health: HEALTH, shown: HEALTH, x, y,
    feet: FOOT_OFF.map(([ox, oy]) => ({ x: x + ox, y: y + oy, fx: 0, fy: 0, tx: 0, ty: 0, t: -1 })),
    slabs: [], popups: [], darts: [], sparks: [], nextSlab: SLAB.first, windup: -1, aim: { x: 0, y: 0 }, cannon: 0, recoil: [0, 0], slabCount: 0, popupCount: 0, popupDue: POPUP.first,
    dartCount: 0, sparkCount: 0, expired: -1, slow: false, safe: 0, dust: -1, hits: 0, flash: 0, over: false
  }
}

export const ceiling = (phase: number, phaseClock: number): number => {
  const from = START[phase]!
  const to = THRESHOLD[phase]!
  const cap = CAPS[phase]!
  const ramp = RAMP[phase]!
  if (phaseClock <= cap - ramp) return from
  return Math.max(to, from - ((from - to) * (phaseClock - (cap - ramp))) / ramp)
}

const inside = (r: Rect, x: number, y: number, grow = 0): boolean => x >= r.x - grow && x <= r.x + r.w + grow && y >= r.y - grow && y <= r.y + r.h + grow

export const muzzle = (f: Fight, i: number): { x: number; y: number } => ({ x: f.x + CANNON_OFF[i]![0] - 70, y: f.y + CANNON_OFF[i]![1] })

export const bannerUp = (f: Fight): boolean => f.expired >= 0 && f.expired < 1.5

function wander(f: Fight): { x: number; y: number; speed: number } {
  if (f.phase === 0) return { x: HOME.x - 50 + 60 * Math.sin(f.clock * 0.6), y: HOME.y + 150 * Math.sin(f.clock * 0.5 + 0.4), speed: 130 }
  if (f.phase === 1) return { x: HOME.x, y: HOME.y, speed: 170 }
  return { x: HOME.x - 60 + 80 * Math.sin(f.clock * 0.9), y: HOME.y + 170 * Math.sin(f.clock * 0.75), speed: bannerUp(f) ? 0 : 210 }
}

function walk(f: Fight, dt: number): void {
  const to = wander(f)
  const dx = to.x - f.x
  const dy = to.y - f.y
  const d = Math.hypot(dx, dy)
  const max = to.speed * dt
  let vx = 0
  let vy = 0
  if (d > 0.5) {
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

function spark(f: Fight, x: number, y: number): void {
  f.sparks.push({ n: f.sparkCount++, x, y, t: 0 })
}

function fire(f: Fight, io: StepIo, arena: Arena): void {
  let m = -1
  for (let k = 0; k < arena.slabs.length; k++) {
    const c = (f.slabCount + k) % arena.slabs.length
    if (!f.slabs.some((s) => s.m === c)) {
      m = c
      break
    }
  }
  if (m < 0) return
  const from = muzzle(f, f.cannon)
  let dx = f.aim.x - from.x
  let dy = f.aim.y - from.y
  const d = Math.hypot(dx, dy) || 1
  dx /= d
  dy /= d
  let left = d + SLAB.overshoot
  const pad = 70
  if (dx < 0) left = Math.min(left, (from.x - (ARENA.x0 + pad + arena.slabs[m]!.w / 2 * Math.abs(dx))) / -dx)
  if (dx > 0) left = Math.min(left, (ARENA.x1 - pad - from.x) / dx)
  if (dy < 0) left = Math.min(left, (from.y - (ARENA.y0 + pad)) / -dy)
  if (dy > 0) left = Math.min(left, (ARENA.y1 - pad - from.y) / dy)
  let rot = Math.atan2(dy, dx)
  if (rot > Math.PI / 2) rot -= Math.PI
  if (rot < -Math.PI / 2) rot += Math.PI
  f.slabs.push({ m, x: from.x, y: from.y, dx, dy, rot, left: Math.max(40, left), state: 0, t: 0 })
  f.slabCount = m + 1
  f.recoil[f.cannon] = 26
  io.emit('slab-fire', from.x, from.y, false)
  f.cannon = f.cannon === 0 ? 1 : 0
}

function slabs(f: Fight, io: StepIo, arena: Arena): void {
  const dt = io.dt
  const c = cursorCentre(io.cursor)
  if (f.windup >= 0) {
    f.windup += dt
    f.recoil[f.cannon] = -12 * Math.min(1, f.windup / SLAB.windup)
    if (f.windup >= SLAB.windup) {
      f.windup = -1
      fire(f, io, arena)
      f.nextSlab = SLAB.every[f.phase]!
    }
  } else if (!bannerUp(f) && !(f.phase === 2 && f.expired < 0)) {
    f.nextSlab -= dt
    if (f.nextSlab <= 0) {
      f.windup = 0
      f.aim = { x: c.x, y: c.y }
    }
  }
  for (let i = 0; i < 2; i++) if (!(f.windup >= 0 && f.cannon === i)) f.recoil[i] = f.recoil[i]! * Math.max(0, 1 - dt * 9)
  for (const s of f.slabs) {
    s.t += dt
    if (s.state === 0) {
      const go = Math.min(s.left, SLAB.speed * dt)
      s.x += s.dx * go
      s.y += s.dy * go
      s.left -= go
      const size = arena.slabs[s.m]!
      const rx = c.x - s.x
      const ry = c.y - s.y
      const along = rx * s.dx + ry * s.dy
      const across = -rx * s.dy + ry * s.dx
      const hit = f.safe <= 0 && s.t > 0.12 && Math.abs(along) < size.w / 2 + 14 && Math.abs(across) < size.h / 2 + 24
      if (hit) {
        f.safe = HIT.safe
        f.dust = 0.95
        f.hits++
        io.cursor.hurt('scorched')
        io.cursor.knock(s.dx * HIT.knock, s.dy * HIT.knock, 260)
        io.cursor.react('recoil')
        io.emit('slab-drop', c.x, c.y, true)
        s.state = 1
        s.t = 0
      } else if (s.left <= 0) {
        io.emit('slab-drop', s.x, s.y, false)
        s.state = 1
        s.t = 0
      }
    } else if (s.state === 1 && s.t >= SLAB.rest) {
      s.state = 2
      s.t = 0
    }
  }
  f.slabs = f.slabs.filter((s) => !(s.state === 2 && s.t >= SLAB.out))
}

function popups(f: Fight, io: StepIo, arena: Arena): boolean {
  const dt = io.dt
  let used = false
  for (const p of f.popups) {
    p.t += dt
    if (p.closing >= 0) p.closing += dt
    else if (io.pressed && !used && arena.popups[p.slot]!.buttons.some((b) => inside(b, io.pointer.x, io.pointer.y, 4))) {
      p.closing = 0
      used = true
      io.emit('popup-close', io.pointer.x, io.pointer.y, false)
    }
  }
  f.popups = f.popups.filter((p) => p.closing < POPUP.close)
  if (f.phase === 0 || bannerUp(f) || (f.phase === 2 && f.expired < 0)) return used
  f.popupDue -= dt
  if (f.popupDue <= 0) {
    const free = POPUP_ORDER.filter((slot) => !f.popups.some((p) => p.slot === slot))
    const first = f.phase === 1 && f.popupCount < POPUP_ORDER.length
    if (free.length && (first || f.phase === 2)) {
      const slot = free[0]!
      const box = arena.popups[slot]!.box
      f.popups.push({ slot, hp: POPUP.hp, t: 0, closing: -1 })
      f.popupCount++
      io.emit('popup', box.x + box.w / 2, box.y + box.h / 2, false)
      f.popupDue = f.phase === 1 ? POPUP.every : POPUP.again
    } else f.popupDue = 0.2
  }
  return used
}

function darts(f: Fight, io: StepIo, arena: Arena, used: boolean): void {
  const dt = io.dt
  if (io.pressed && !used) {
    const dx = f.x - io.cursor.x
    const dy = f.y - io.cursor.y
    const d = Math.hypot(dx, dy) || 1
    f.darts.push({ n: f.dartCount++, x: io.cursor.x, y: io.cursor.y, dx: dx / d, dy: dy / d, t: 0 })
    io.emit('dart-fire', io.cursor.x, io.cursor.y, false)
  }
  const keep: Dart[] = []
  for (const d of f.darts) {
    d.t += dt
    d.x += d.dx * DART.speed * dt
    d.y += d.dy * DART.speed * dt
    const wall = f.popups.find((p) => p.closing < 0 && p.t > 0.12 && inside(arena.popups[p.slot]!.box, d.x, d.y))
    if (wall) {
      wall.hp--
      if (wall.hp <= 0) wall.closing = 0
      spark(f, d.x, d.y)
      io.emit('dart-hit', d.x, d.y, false)
      continue
    }
    const ex = (d.x - f.x) / BODY.rx
    const ey = (d.y - f.y) / BODY.ry
    if (ex * ex + ey * ey <= 1) {
      const open = !(f.phase === 2 && f.expired < 0.8)
      if (open) f.health = Math.max(THRESHOLD[f.phase]!, f.health - DART.damage)
      f.flash = 0.12
      spark(f, d.x, d.y)
      io.emit('dart-hit', d.x, d.y, false)
      continue
    }
    if (d.t < DART.life && d.x > -40 && d.x < 1960 && d.y > -40 && d.y < 1120) keep.push(d)
  }
  f.darts = keep
  for (const s of f.sparks) s.t += dt
  f.sparks = f.sparks.filter((s) => s.t < 0.22)
}

export function stepFight(f: Fight, io: StepIo, arena: Arena): void {
  if (f.over) return
  const dt = io.dt
  f.clock += dt
  f.phaseClock += dt
  if (f.safe > 0) f.safe -= dt
  if (f.flash > 0) f.flash -= dt
  if (f.dust >= 0) {
    f.dust -= dt
    if (f.dust < 0) io.cursor.react('dustOff')
  }
  if (f.phase === 2) {
    if (f.expired < 0 && f.phaseClock >= 0.3) {
      f.expired = 0
      io.emit('session-expired', f.x, f.y, false)
      io.cursor.react('doubleTake')
    } else if (f.expired >= 0) {
      if (f.expired < 0.5) f.health = Math.min(START[2], f.health + (EXPIRED_GAIN * dt) / 0.5)
      f.expired += dt
    }
  }
  walk(f, dt)
  slabs(f, io, arena)
  const used = popups(f, io, arena)
  darts(f, io, arena, used)
  if (!(f.phase === 2 && f.expired < 0.5)) f.health = Math.min(f.health, ceiling(f.phase, f.phaseClock))
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
      f.popupDue = POPUP.first
      f.nextSlab = f.phase === 2 ? 0.5 : Math.max(f.nextSlab, 0.9)
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
  for (const s of f.slabs) if (s.state === 0) lanes.push({ x: s.x, y: s.y, dx: s.dx, dy: s.dy, reach: s.left + arena.slabs[s.m]!.w / 2 + 30, half: arena.slabs[s.m]!.h / 2 + 24 })
  if (f.windup >= 0) {
    const from = muzzle(f, f.cannon)
    const d = Math.hypot(f.aim.x - from.x, f.aim.y - from.y) || 1
    lanes.push({ x: from.x, y: from.y, dx: (f.aim.x - from.x) / d, dy: (f.aim.y - from.y) / d, reach: d + SLAB.overshoot + 260, half: SLAB_HALF })
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
