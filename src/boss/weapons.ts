import { config } from '../config'
import { TYPE } from '../shell/parts'
import type { DrawList, TypeSpec } from '../stage/types'
import { label, prog } from './body'
import { bannerUp, type Fight } from './fight'
import { ARENA, POPUP, SLAB } from './plan'

const heights = config.scale.heights
const sizes = config.scale.sizes
const part = 'boss-weapons'

export interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number }
export interface SlabPlan { key: string; w: number; h: number; tw: number; cap: number }
export interface PopupPlan { title: string; box: Box; titleAt: { x: number; y: number; w: number; cap: number }; buttons: { key: string; box: Box; main: boolean }[] }
export interface BannerPlan { key: string; w: number; h: number }
export interface WeaponPlan { slabs: SlabPlan[]; popups: PopupPlan[]; banner: BannerPlan; slabType: TypeSpec; bannerType: TypeSpec; titleType: TypeSpec }

const FLY = { z0: 14, z1: 14 + heights.slab }

export function drawWeapons(out: DrawList, f: Fight, plan: WeaponPlan): void {
  for (const p of f.popups) {
    const made = plan.popups[p.slot]!
    const up = p.closing >= 0 ? 1 - prog(p.closing, 0, POPUP.close) : prog(p.t, 0, 0.14)
    const top = heights.card * up
    const b = made.box
    const dim = p.hp < POPUP.hp ? (POPUP.hp - p.hp) * 0.012 : 0
    out.push({ id: `popup-up-${p.slot}`, part, kind: 'box', x: b.x, y: b.y, w: b.w, h: b.h, z0: 0, z1: Math.max(0.4, top), tone: 'glass', r: 18, rot: dim * (p.slot === 1 ? -1 : 1) })
    const t = made.titleAt
    out.push({ id: `popup-up-${p.slot}-title`, part, kind: 'text', x: t.x, y: t.y, w: t.w, h: t.cap, z0: top, z1: top, tone: 'ink', words: made.title, type: plan.titleType })
    made.buttons.forEach((btn, j) => {
      const z1 = top + heights.button * up
      out.push({ id: `popup-up-${p.slot}-button-${j}`, part, kind: 'capsule', x: btn.box.x, y: btn.box.y, w: btn.box.w, h: btn.box.h, z0: top, z1: Math.max(top + 0.4, z1), tone: btn.main ? 'accent' : 'metal' })
      out.push(label(`popup-up-${p.slot}-button-${j}-word`, part, btn.key, btn.box.cx, btn.box.cy, TYPE.button, Math.max(top + 0.4, z1), btn.main ? 'inkLight' : 'ink'))
    })
    for (let i = p.hp; i < POPUP.hp; i++) {
      const n = POPUP.hp - 1 - i
      out.push({ id: `popup-up-${p.slot}-chip-${n}`, part, kind: 'disc', x: b.x + 30 + n * 46, y: b.y + b.h - 58 + (n % 2) * 10, w: 20, h: 20, z0: top, z1: top + 0.6, tone: 'dark' })
    }
  }
  for (const s of f.slabs) {
    const made = plan.slabs[s.m]!
    const k = s.state === 0 ? prog(s.t, 0, 0.1) : 1
    if (k <= 0.02) continue
    const w = made.w * k
    const h = made.h * k
    const drop = s.state === 0 ? 0 : 1 - prog(s.t, 0, 0.12)
    const z0 = s.state === 0 ? FLY.z0 : FLY.z0 * drop
    const thick = s.state === 2 ? Math.max(0.4, heights.slab * (1 - prog(s.t, 0, SLAB.out))) : heights.slab
    out.push({ id: `fired-${s.m}`, part, kind: 'box', x: s.x - w / 2, y: s.y - h / 2, w, h, z0, z1: z0 + thick, tone: 'danger', r: 8 * k, rot: s.rot })
    if (k >= 0.98) out.push(label(`fired-${s.m}-words`, part, made.key, s.x, s.y, plan.slabType, z0 + thick, 'inkLight', s.rot))
  }
  if (bannerUp(f)) {
    const k = Math.min(prog(f.expired, 0, 0.16), 1 - prog(f.expired, 1.3, 1.5))
    const w = plan.banner.w * k
    const h = plan.banner.h * k
    const y = Math.max(ARENA.y0 + 6 + plan.banner.h / 2, f.y - 208 - plan.banner.h / 2)
    out.push({ id: 'banner-up', part, kind: 'box', x: f.x - w / 2, y: y - h / 2, w, h, z0: 108, z1: 108 + heights.slab, tone: 'danger', r: 10 * k })
    if (k >= 0.98) out.push(label('banner-up-words', part, plan.banner.key, f.x, y, plan.bannerType, 108 + heights.slab, 'inkLight'))
  }
  for (const d of f.darts) {
    const rot = Math.atan2(d.dy, d.dx)
    const n = Math.hypot(d.dx, d.dy) || 1
    out.push({ id: `dart-${d.n}-trail`, part, kind: 'capsule', x: d.x - 46 * d.dx / n - 34, y: d.y - 46 * d.dy / n - 3, w: 68, h: 6, z0: 40, z1: 44, tone: 'raised', rot })
    out.push({ id: `dart-${d.n}`, part, kind: 'capsule', x: d.x - 22, y: d.y - 5, w: 44, h: 10, z0: 40, z1: 50, tone: 'light', rot })
    for (const side of [-1, 1]) {
      const br = rot + side * 0.62
      const bx = d.x + 24 * d.dx / n - 12 * Math.cos(br)
      const by = d.y + 24 * d.dy / n - 12 * Math.sin(br)
      out.push({ id: `dart-${d.n}-barb-${side}`, part, kind: 'capsule', x: bx - 15, y: by - 5, w: 30, h: 10, z0: 40, z1: 50, tone: 'light', rot: br })
    }
  }
  for (const s of f.sparks) {
    const u = s.t / 0.22
    for (let i = 0; i < 5; i++) {
      const a = 2.2 + i * 0.52 + (s.n % 5) * 0.3
      const r = 10 + u * 34
      const len = 14 * (1 - u) + 4
      out.push({ id: `spark-${s.n}-${i}`, part, kind: 'box', x: s.x + Math.cos(a) * r - len / 2, y: s.y + Math.sin(a) * r - 2, w: len, h: 4, z0: 60, z1: 64, tone: 'light', rot: a })
    }
  }
}

export const buttonHeight = sizes.button
