import { config } from '../config'
import { TYPE } from '../shell/parts'
import type { DrawList, TypeSpec } from '../stage/types'
import { label, MUZZLE, prog, smooth } from './body'
import { bannerUp, cornerAt, FLASH_SECONDS, SPARK_SECONDS, weakSide, type Fight } from './fight'
import { ARENA, POPUP, SLAB } from './plan'
import { CORNER, GUARD } from './tune'

const heights = config.scale.heights
const sizes = config.scale.sizes
const part = 'boss-weapons'

export interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number }
export interface SlabPlan { key: string; w: number; h: number; tw: number; cap: number }
export interface PopupPlan { title: string; box: Box; titleAt: { x: number; y: number; w: number; cap: number }; buttons: { key: string; box: Box; main: boolean }[] }
export interface BannerPlan { key: string; w: number; h: number }
export interface WeaponPlan { slabs: SlabPlan[]; popups: PopupPlan[]; banner: BannerPlan; slabType: TypeSpec; bannerType: TypeSpec; titleType: TypeSpec }

// A slab is lobbed: it leaves the mouth, clears the top of the shield (z 80), comes down to its flying height and dives into the page over the last of its way.
const FLY = { z0: 24, rise: 0.12, over: 112, fall: 0.5, dive: 150, hop: 5, hopFrom: 0.02, hopTo: 0.16, drop: 0.1 }
const flightHeight = (t: number, left: number): number => {
  const from = MUZZLE.z - heights.slab / 2
  const up = prog(t, 0, FLY.rise)
  const high = t < FLY.rise ? from + (FLY.over - from) * (1 - (1 - up) ** 2) : FLY.z0 + (FLY.over - FLY.z0) * (1 - smooth(prog(t, FLY.rise, FLY.fall)))
  const near = Math.min(1, Math.max(0, left / FLY.dive))
  return high * near * (2 - near)
}
export const DART_LONG = 26
export const DART_Z = 17
export const SPARK_Z = 30
export const MUZZLE_Z = MUZZLE.z
export const BANNER_Z = 64
const BANNER_LEAST = 0.6
const SLAB_LEAST = 0.12

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
  for (const s of f.slabs) {
    const made = plan.slabs[s.m]!
    const k = s.state === 0 ? Math.min(1, (2 * SLAB.speed[f.phase]! * s.t) / made.w) : 1
    if (k < SLAB_LEAST) continue
    const struck = s.push !== undefined
    const fell = s.state === 0 ? 0 : flightHeight(s.air ?? 9, struck ? s.left : 0)
    const hop = s.state === 1 && !struck ? FLY.hop * Math.sin(Math.PI * prog(s.t, FLY.hopFrom, FLY.hopTo)) : 0
    const z0 = s.state === 0 ? flightHeight(s.t, s.left) : s.state === 1 ? fell * (1 - prog(s.t, 0, FLY.drop)) + hop : 0
    const landed = s.state === 0 ? 9 : s.state === 1 ? s.t : s.t + 9
    const sx = s.x
    const sy = s.y
    out.push({ id: `fired-${s.m}`, part, kind: 'box', x: sx - made.w / 2, y: sy - made.h / 2, w: made.w, h: made.h, z0, z1: z0 + heights.slab, tone: 'danger', r: 8, rot: s.rot, role: 'slab', v: [k, landed, s.state === 0 ? s.t : 9, struck || s.rim ? 1 : 0] })
    const type = k >= 1 ? plan.slabType : { ...plan.slabType, px: plan.slabType.px * k }
    if (k >= 0.25) out.push(label(`fired-${s.m}-words`, part, made.key, sx, sy, type, Math.max(0.3, z0 + heights.slab) + (s.state === 1 && s.t < 0.6 ? 1.2 : 0), 'inkLight', s.rot))
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

// The plainest things that show the rules: two side plates of the shield, the lamp on the open flank, the four corner cannons with their tells, and their balls.
export function drawRules(out: DrawList, f: Fight): void {
  for (const side of [-1, 1]) {
    const a = f.face + side * GUARD.wing
    const x = f.x + Math.cos(a) * GUARD.radius
    const y = f.y + Math.sin(a) * GUARD.radius
    out.push({ id: `guard-wing-${side < 0 ? 0 : 1}`, part: plain, kind: 'box', x: x - WING.w / 2, y: y - WING.h / 2, w: WING.w, h: WING.h, z0: WING.z, z1: WING.z + WING.tall, tone: 'glass', r: 10, rot: a - Math.PI })
  }
  if (f.weak > 0 && Math.floor(f.weak * BLINK) % 2 === 0) {
    const w = weakSide(f)
    out.push({ id: 'weak-lamp', part: plain, kind: 'disc', x: w.x - LAMP / 2, y: w.y - LAMP / 2, w: LAMP, h: LAMP, z0: 112, z1: 118, tone: 'accent' })
  }
  CORNER.at.forEach((_, i) => {
    const c = cornerAt(i)
    const rot = Math.atan2(f.look.y - c.y, f.look.x - c.x)
    out.push({ id: `corner-${i}`, part: plain, kind: 'disc', x: c.x - CORNER.base, y: c.y - CORNER.base, w: CORNER.base * 2, h: CORNER.base * 2, z0: 0, z1: 22, tone: 'metal' })
    out.push({ id: `corner-${i}-barrel`, part: plain, kind: 'box', x: c.x + Math.cos(rot) * BARREL.w * 0.45 - BARREL.w / 2, y: c.y + Math.sin(rot) * BARREL.w * 0.45 - BARREL.h / 2, w: BARREL.w, h: BARREL.h, z0: 22, z1: 40, tone: 'dark', r: 8, rot })
    if (f.tell && f.tell.i === i && Math.floor(f.tell.t * BLINK) % 2 === 0) out.push({ id: `corner-${i}-tell`, part: plain, kind: 'disc', x: c.x - TELL / 2, y: c.y - TELL / 2, w: TELL, h: TELL, z0: 40, z1: 46, tone: 'danger' })
  })
  for (const b of f.balls) out.push({ id: `corner-ball-${b.n}`, part: plain, kind: 'ball', x: b.x - CORNER.ball, y: b.y - CORNER.ball, w: CORNER.ball * 2, h: CORNER.ball * 2, z0: 14, z1: 14 + CORNER.ball * 2, tone: 'danger' })
}

export const buttonHeight = sizes.button
