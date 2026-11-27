import { config } from '../config'
import { TYPE } from '../shell/parts'
import type { DrawList, TypeSpec } from '../stage/types'
import { label, MUZZLE, prog, smooth } from './body'
import { bannerUp, cornerAt, FLASH_SECONDS, muzzle, SPARK_SECONDS, weakSide, type Fight } from './fight'
import { ARENA, POPUP } from './plan'
import { BIG, CORNER, GUARD, GUN } from './tune'

const heights = config.scale.heights
const sizes = config.scale.sizes
const part = 'boss-weapons'

export interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number }
export interface SlabPlan { key: string; w: number; h: number; tw: number; cap: number }
export interface PopupPlan { title: string; box: Box; titleAt: { x: number; y: number; w: number; cap: number }; buttons: { key: string; box: Box; main: boolean }[] }
export interface BannerPlan { key: string; w: number; h: number }
export interface WeaponPlan { slabs: SlabPlan[]; popups: PopupPlan[]; banner: BannerPlan; slabType: TypeSpec; bannerType: TypeSpec; titleType: TypeSpec }

export const DART_LONG = 26
export const DART_Z = 17
export const SPARK_Z = 30
export const MUZZLE_Z = MUZZLE.z
export const BANNER_Z = 64
const BANNER_LEAST = 0.6

export function drawWeapons(out: DrawList, f: Fight, plan: WeaponPlan): void {
  for (const p of f.popups) {
    const made = plan.popups[p.slot]!
    const up = p.closing >= 0 ? 1 - prog(p.closing, POPUP.hold, POPUP.hold + POPUP.close) : prog(p.t, 0, 0.14)
    const top = heights.card * up
    const b = made.box
    const lost = p.shot ? 3 : Math.floor(((POPUP.hp - p.hp) * 3) / POPUP.hp)
    const side = p.slot === 1 ? -1 : 1
    const turn = (lost * 0.012 + p.off * 0.0034) * side
    const ox = p.dx * p.off
    const oy = p.dy * p.off
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    const put = (x: number, y: number, w: number, h: number): { x: number; y: number } => {
      const rx = x + w / 2 - b.cx
      const ry = y + h / 2 - b.cy
      return { x: b.cx + rx * cos - ry * sin + ox - w / 2, y: b.cy + rx * sin + ry * cos + oy - h / 2 }
    }
    const struck = p.closing >= 0 ? p.closing : 9
    out.push({ id: `popup-up-${p.slot}`, part, kind: 'box', x: b.x + ox, y: b.y + oy, w: b.w, h: b.h, z0: 0, z1: Math.max(0.4, top), tone: 'glass', r: 18, rot: turn, role: 'card', v: [up, lost, struck] })
    const t = made.titleAt
    out.push({ id: `popup-up-${p.slot}-title`, part, kind: 'text', ...put(t.x, t.y, t.w, t.cap), w: t.w, h: t.cap, z0: top, z1: top, tone: 'ink', words: made.title, type: plan.titleType, rot: turn })
    made.buttons.forEach((btn, j) => {
      const z1 = top + heights.button * up
      const at = put(btn.box.x, btn.box.y, btn.box.w, btn.box.h)
      out.push({ id: `popup-up-${p.slot}-button-${j}`, part, kind: 'capsule', x: at.x, y: at.y, w: btn.box.w, h: btn.box.h, z0: top, z1: Math.max(top + 0.4, z1), tone: btn.main ? 'accent' : 'metal', role: 'button', rot: turn, v: [up] })
      out.push(label(`popup-up-${p.slot}-button-${j}-word`, part, btn.key, at.x + btn.box.w / 2, at.y + btn.box.h / 2, TYPE.button, Math.max(top + 0.4, z1), btn.main ? 'inkLight' : 'ink', turn))
    })
    for (let n = 0; n < lost; n++) {
      const at = put(b.x + 22 + n * 52, b.y + b.h - 66 + (n % 2) * 12, 40, 40)
      out.push({ id: `popup-up-${p.slot}-chip-${n}`, part, kind: 'disc', x: at.x, y: at.y, w: 40, h: 40, z0: top, z1: top + 0.6, tone: 'dark', v: [n + p.slot * 3] })
    }
  }
  const banner = bannerUp(f) ? Math.min(prog(f.expired, 0, 0.16), 1 - prog(f.expired, 1.3, 1.5)) : 0
  if (banner >= BANNER_LEAST) {
    const k = banner
    const w = plan.banner.w
    const h = plan.banner.h
    const y = Math.max(ARENA.y0 + 6 + h / 2, f.y - 208 - h / 2) + (1 - k) * 22
    const z0 = BANNER_Z * k
    out.push({ id: 'banner-up', part, kind: 'box', x: f.x - w / 2, y: y - h / 2, w, h, z0, z1: z0 + heights.slab, tone: 'danger', r: 10, role: 'slab', v: [k, f.expired] })
    if (k >= 0.6) out.push(label('banner-up-words', part, plan.banner.key, f.x, y, plan.bannerType, z0 + heights.slab, 'inkLight'))
  }
  for (const m of f.flashes) {
    const r = m.r ?? 30
    out.push({ id: `muzzle-${m.n}`, part, kind: 'disc', x: m.x - r, y: m.y - r, w: r * 2, h: r * 2, z0: MUZZLE_Z, z1: MUZZLE_Z + 4, tone: 'light', rot: m.rot, v: [m.t / FLASH_SECONDS, m.n] })
  }
  for (const d of f.darts) {
    if (d.t < 0) continue
    out.push({ id: `dart-${d.n}`, part, kind: 'capsule', x: d.x - DART_LONG / 2, y: d.y - 6, w: DART_LONG, h: 12, z0: DART_Z, z1: DART_Z + 4, tone: 'light', rot: Math.atan2(d.dy, d.dx), v: [Math.min(1, d.t / 0.08)] })
  }
  for (const s of f.sparks) {
    const z = Math.max(SPARK_Z, s.z ?? 0)
    out.push({ id: `spark-${s.n}`, part, kind: 'disc', x: s.x - 40, y: s.y - 40, w: 80, h: 80, z0: z, z1: z + 4, tone: 'light', v: [s.t / SPARK_SECONDS, s.n] })
  }
}

const plain = 'shell'
const WING = { w: 60, h: 190, tall: 24, z: 8 }
const BARREL = { w: 84, h: 34 }
const LAMP = 64
const TELL = 40
const BLINK = 8
const TURRET = { base: 150, long: 250, wide: 52, z: 112, tall: 44, fly: 900, spin: 5 }
const LINE = { long: 2400, z: 0.6, beamZ: 60, beamTall: 30 }

function turret(out: DrawList, x: number, y: number, rot: number, z: number): void {
  out.push({ id: 'boss-turret', part: plain, kind: 'disc', x: x - TURRET.base / 2, y: y - TURRET.base / 2, w: TURRET.base, h: TURRET.base, z0: z, z1: z + TURRET.tall, tone: 'dark' })
  out.push({ id: 'boss-turret-barrel', part: plain, kind: 'box', x: x + Math.cos(rot) * TURRET.long * 0.42 - TURRET.long / 2, y: y + Math.sin(rot) * TURRET.long * 0.42 - TURRET.wide / 2, w: TURRET.long, h: TURRET.wide, z0: z + 8, z1: z + TURRET.tall + 8, tone: 'metal', r: 10, rot })
}

// The turret blown off the beaten boss: it flies away from the shield's side, turning, and is gone.
export function drawTurretOff(out: DrawList, x: number, y: number, face: number, t: number): void {
  if (t >= BIG.off) return
  const go = TURRET.fly * t
  turret(out, x - Math.cos(face) * go, y - Math.sin(face) * go - Math.sin((Math.PI * t) / BIG.off) * 120, face + t * TURRET.spin, TURRET.z + Math.sin((Math.PI * t) / BIG.off) * 80)
}

// How long a strip from the boss along `a` may be before its far end comes above the band under the bar.
const stripLong = (f: Fight, a: number, half: number): number => {
  const dy = Math.sin(a)
  const top = dy < -0.02 ? (f.y - CORNER.band - half) / -dy : LINE.long
  return Math.max(0, Math.min(LINE.long, top))
}

// The plainest things that show the rules: two side plates of the shield, the lamp on the open flank, the big turret with its line, its blast and its marks, the lamp of a gun that is about to fire, the four corner cannons with their tells, and the bullets.
export function drawRules(out: DrawList, f: Fight): void {
  for (const m of f.marks) out.push({ id: `scorch-${m.n}`, part: plain, kind: 'box', x: m.x - BIG.scorch.w / 2, y: m.y - BIG.scorch.h / 2, w: BIG.scorch.w, h: BIG.scorch.h, z0: 0, z1: 0.5, tone: 'dark', r: 6 })
  const strip = f.big.t >= 0 ? (Math.floor(f.big.t * BLINK) % 2 === 0 ? 'big-line' : '') : f.big.beam > 0 ? 'big-beam' : ''
  if (strip) {
    const long = stripLong(f, f.big.a, BIG.wide)
    const cx = f.x + (Math.cos(f.big.a) * long) / 2
    const cy = f.y + (Math.sin(f.big.a) * long) / 2
    const beam = strip === 'big-beam'
    if (long > 40) out.push({ id: strip, part: plain, kind: 'box', x: cx - long / 2, y: cy - BIG.wide, w: long, h: BIG.wide * 2, z0: beam ? LINE.beamZ : 0, z1: beam ? LINE.beamZ + LINE.beamTall : LINE.z, tone: beam ? 'light' : 'danger', rot: f.big.a, moved: true })
  }
  for (const side of [-1, 1]) {
    const a = f.face + side * GUARD.wing
    const x = f.x + Math.cos(a) * GUARD.radius
    const y = f.y + Math.sin(a) * GUARD.radius
    out.push({ id: `guard-wing-${side < 0 ? 0 : 1}`, part: plain, kind: 'box', x: x - WING.w / 2, y: y - WING.h / 2, w: WING.w, h: WING.h, z0: WING.z, z1: WING.z + WING.tall, tone: 'glass', r: 10, rot: a - Math.PI })
  }
  if (f.turret > 0) {
    const up = Math.min(1, (f.turret * (BIG.lock - BIG.rise)) / (BIG.up - BIG.rise))
    const over = f.turret >= 1 ? 1 : Math.max(0, (f.turret * (BIG.lock - BIG.rise) - (BIG.up - BIG.rise)) / (BIG.lock - BIG.up))
    const back = BIG.back * (1 - smooth(over))
    const rot = f.big.t >= 0 || f.big.beam > 0 ? f.big.a : Math.atan2(f.look.y - f.y, f.look.x - f.x)
    turret(out, f.x - Math.cos(f.face) * back, f.y - Math.sin(f.face) * back, rot, TURRET.z - (1 - smooth(up)) * (TURRET.tall + 20))
  }
  if (f.weak > 0 && Math.floor(f.weak * BLINK) % 2 === 0) {
    const w = weakSide(f)
    out.push({ id: 'weak-lamp', part: plain, kind: 'disc', x: w.x - LAMP / 2, y: w.y - LAMP / 2, w: LAMP, h: LAMP, z0: 112, z1: 118, tone: 'accent' })
  }
  if (f.windup >= 0 && Math.floor(f.windup * BLINK * 2) % 2 === 0) {
    const m = muzzle(f, f.cannon)
    out.push({ id: 'gun-tell', part: plain, kind: 'disc', x: m.x - TELL / 2, y: m.y - TELL / 2, w: TELL, h: TELL, z0: MUZZLE_Z + 4, z1: MUZZLE_Z + 10, tone: 'danger' })
  }
  CORNER.at.forEach((_, i) => {
    const c = cornerAt(i)
    const rot = Math.atan2(f.look.y - c.y, f.look.x - c.x)
    out.push({ id: `corner-${i}`, part: plain, kind: 'disc', x: c.x - CORNER.base, y: c.y - CORNER.base, w: CORNER.base * 2, h: CORNER.base * 2, z0: 0, z1: 22, tone: 'metal' })
    out.push({ id: `corner-${i}-barrel`, part: plain, kind: 'box', x: c.x + Math.cos(rot) * BARREL.w * 0.45 - BARREL.w / 2, y: c.y + Math.sin(rot) * BARREL.w * 0.45 - BARREL.h / 2, w: BARREL.w, h: BARREL.h, z0: 22, z1: 40, tone: 'dark', r: 8, rot })
    if (f.tell && f.tell.i === i && Math.floor(f.tell.t * BLINK) % 2 === 0) out.push({ id: `corner-${i}-tell`, part: plain, kind: 'disc', x: c.x - TELL / 2, y: c.y - TELL / 2, w: TELL, h: TELL, z0: 40, z1: 46, tone: 'danger' })
  })
  for (const b of f.balls) {
    const rot = Math.atan2(b.dy, b.dx)
    const tail = Math.min(GUN.trail, b.t * b.v)
    if (tail > GUN.r) out.push({ id: `bullet-${b.n}-trail`, part: plain, kind: 'capsule', x: b.x - (Math.cos(rot) * tail) / 2 - tail / 2, y: b.y - (Math.sin(rot) * tail) / 2 - GUN.r * 0.6, w: tail, h: GUN.r * 1.2, z0: 16, z1: 20, tone: 'light', rot, moved: true })
    out.push({ id: `bullet-${b.n}`, part: plain, kind: 'ball', x: b.x - GUN.r, y: b.y - GUN.r, w: GUN.r * 2, h: GUN.r * 2, z0: 14, z1: 14 + GUN.r * 2, tone: 'danger' })
  }
}

export const buttonHeight = sizes.button
