import { config } from '../config'
import { TYPE } from '../shell/parts'
import type { DrawList, TypeSpec } from '../stage/types'
import { label, prog, smooth } from './body'
import { bannerUp, FLASH_SECONDS, SPARK_SECONDS, type Fight } from './fight'
import { ARENA, MUZZLE, POPUP, SLAB } from './plan'

const heights = config.scale.heights
const sizes = config.scale.sizes
const part = 'boss-weapons'

export interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number }
export interface SlabPlan { key: string; w: number; h: number; tw: number; cap: number }
export interface PopupPlan { title: string; box: Box; titleAt: { x: number; y: number; w: number; cap: number }; buttons: { key: string; box: Box; main: boolean }[] }
export interface BannerPlan { key: string; w: number; h: number }
export interface WeaponPlan { slabs: SlabPlan[]; popups: PopupPlan[]; banner: BannerPlan; slabType: TypeSpec; bannerType: TypeSpec; titleType: TypeSpec }

// A slab is lobbed: it leaves the mouth, clears the top of the shield (z 80) and comes down to its flying height.
const FLY = { z0: 14, z1: 14 + heights.slab, rise: 0.12, over: 112, fall: 0.5 }
export const DART_LONG = 26
export const DART_Z = 17
export const SPARK_Z = 30
export const MUZZLE_Z = MUZZLE.z
export const BANNER_Z = 64

export function drawWeapons(out: DrawList, f: Fight, plan: WeaponPlan): void {
  for (const p of f.popups) {
    const made = plan.popups[p.slot]!
    const up = p.closing >= 0 ? 1 - prog(p.closing, 0, POPUP.close) : prog(p.t, 0, 0.14)
    const top = heights.card * up
    const b = made.box
    const lost = Math.floor(((POPUP.hp - p.hp) * 3) / POPUP.hp)
    const dim = lost * 0.012
    const struck = p.closing >= 0 ? p.closing : 9
    out.push({ id: `popup-up-${p.slot}`, part, kind: 'box', x: b.x, y: b.y, w: b.w, h: b.h, z0: 0, z1: Math.max(0.4, top), tone: 'glass', r: 18, rot: dim * (p.slot === 1 ? -1 : 1), role: 'card', v: [up, lost, struck] })
    const t = made.titleAt
    out.push({ id: `popup-up-${p.slot}-title`, part, kind: 'text', x: t.x, y: t.y, w: t.w, h: t.cap, z0: top, z1: top, tone: 'ink', words: made.title, type: plan.titleType })
    made.buttons.forEach((btn, j) => {
      const z1 = top + heights.button * up
      out.push({ id: `popup-up-${p.slot}-button-${j}`, part, kind: 'capsule', x: btn.box.x, y: btn.box.y, w: btn.box.w, h: btn.box.h, z0: top, z1: Math.max(top + 0.4, z1), tone: btn.main ? 'accent' : 'metal', role: 'button', v: [up] })
      out.push(label(`popup-up-${p.slot}-button-${j}-word`, part, btn.key, btn.box.cx, btn.box.cy, TYPE.button, Math.max(top + 0.4, z1), btn.main ? 'inkLight' : 'ink'))
    })
    for (let n = 0; n < lost; n++) {
      out.push({ id: `popup-up-${p.slot}-chip-${n}`, part, kind: 'disc', x: b.x + 22 + n * 52, y: b.y + b.h - 66 + (n % 2) * 12, w: 40, h: 40, z0: top, z1: top + 0.6, tone: 'dark', v: [n + p.slot * 3] })
    }
  }
  for (const s of f.slabs) {
    const made = plan.slabs[s.m]!
    const k = s.state === 0 ? prog(s.t, 0, 0.1) : 1
    if (k <= 0.02) continue
    const drop = s.state === 0 ? 0 : 1 - prog(s.t, 0, 0.12)
    const sink = s.state === 2 ? prog(s.t, 0, SLAB.out) : 0
    const from = MUZZLE.z - heights.slab / 2
    const up = prog(s.t, 0, FLY.rise)
    const high = s.state !== 0 ? 0 : s.t < FLY.rise ? from + (FLY.over - from) * (1 - (1 - up) ** 2) - FLY.z0 : (FLY.over - FLY.z0) * (1 - smooth(prog(s.t, FLY.rise, FLY.fall)))
    const z0 = (s.state === 0 ? FLY.z0 + high : FLY.z0 * drop) - sink * (heights.slab + 1.5)
    const landed = s.state === 0 ? 9 : s.state === 1 ? s.t : s.t + 9
    const ahead = s.state === 0 ? (made.w / 2) * k * (1 - prog(s.t, 0.1, 0.4)) : 0
    const sx = s.x + s.dx * ahead
    const sy = s.y + s.dy * ahead
    out.push({ id: `fired-${s.m}`, part, kind: 'box', x: sx - made.w / 2, y: sy - made.h / 2, w: made.w, h: made.h, z0, z1: z0 + heights.slab, tone: 'danger', r: 8, rot: s.rot, role: 'slab', v: [k, landed, s.state === 0 ? s.t : 9] })
    if (k >= 0.98 && sink < 0.5) out.push(label(`fired-${s.m}-words`, part, made.key, sx, sy, plan.slabType, z0 + heights.slab + (s.state === 1 && s.t < 0.6 ? 1.2 : 0), 'inkLight', s.rot))
  }
  if (bannerUp(f)) {
    const k = Math.min(prog(f.expired, 0, 0.16), 1 - prog(f.expired, 1.3, 1.5))
    const w = plan.banner.w
    const h = plan.banner.h
    const y = Math.max(ARENA.y0 + 6 + h / 2, f.y - 208 - h / 2) + (1 - k) * 22
    const z0 = BANNER_Z * k
    out.push({ id: 'banner-up', part, kind: 'box', x: f.x - w / 2, y: y - h / 2, w, h, z0, z1: z0 + heights.slab, tone: 'danger', r: 10, role: 'slab', v: [k, f.expired] })
    if (k >= 0.6) out.push(label('banner-up-words', part, plan.banner.key, f.x, y, plan.bannerType, z0 + heights.slab, 'inkLight'))
  }
  for (const m of f.flashes) {
    out.push({ id: `muzzle-${m.n}`, part, kind: 'disc', x: m.x - 30, y: m.y - 30, w: 60, h: 60, z0: MUZZLE_Z, z1: MUZZLE_Z + 4, tone: 'light', rot: m.rot, v: [m.t / FLASH_SECONDS, m.n] })
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

export const buttonHeight = sizes.button
