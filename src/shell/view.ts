import * as THREE from 'three'
import { waitsFor } from '../core/load'
import type { Bounds } from '../core/renderer'
import { CursorView, cursorUnmade } from '../cursor/view'
import { real } from '../real'
import type { Emitter, PartMaker, RealContext } from '../real/types'
import type { Frame } from '../stage/stage'
import { rattleAt, SHIVER, shiverAt, shiverBase, shiverDelay } from '../stage/turn'
import type { Shape, Tone } from '../stage/types'

export const TONES: Record<Tone, number> = {
  page: 0.62, pocket: 0.42, raised: 0.72, metal: 0.5, accent: 0.11, danger: 0.14, paper: 0.8, dark: 0.06, glass: 0.56, light: 0.86, ink: 0.04, inkLight: 0.9
}

const ORDER = { ground: -1000000, cursor: 1000000 }

interface RealEntry { object: THREE.Object3D; key: string; maker: PartMaker; part: string; seen: number }

const realKey = (s: Shape, ctx: RealContext): { maker: PartMaker; key: string } | null => {
  const own = real.parts[s.part]
  const mine = own ? own.key(s, ctx) : null
  if (own && mine !== null) return { maker: own, key: mine }
  if (s.kind !== 'text' || !real.type) return null
  const set = real.type.key(s, ctx)
  return set === null ? null : { maker: real.type, key: set }
}

const contextOf = (f: Frame, width: number, top: number, tall: number, light: (e: Emitter) => void): RealContext => {
  const byId = new Map<string, Shape>()
  for (const s of f.list) byId.set(s.id, s)
  return { page: f.page, list: f.list, byId, time: f.time ?? 0, scroll: f.scroll, turning: Math.abs(f.turn) > 1e-6, width, top, tall, light }
}

// The parts of a frame that nobody makes: a shape no maker answers, a slab with no maker, a part of the cursor with no maker. Nothing is drawn for them, and the list says so.
// A part that waits for its pictures is not on it: it is drawn as soon as they are in.
export function standInsOf(f: Frame, size: { width: number; height: number }): string[] {
  const ctx = contextOf(f, size.width, 0, size.height, () => undefined)
  const out = new Set<string>(cursorUnmade())
  if (!real.ground || real.ground.key(ctx) === null) {
    out.add('shell')
    for (const s of f.list) if (s.kind === 'well') out.add(s.part)
  }
  for (const s of f.list) if (s.kind !== 'well' && realKey(s, ctx) === null && !waitsFor(s.part)) out.add(s.part)
  return [...out]
}

// The parts of a frame that are not drawn yet because their pictures are not in.
export function waitingOf(f: Frame, size: { width: number; height: number }): string[] {
  const ctx = contextOf(f, size.width, 0, size.height, () => undefined)
  const out = new Set<string>()
  for (const s of f.list) if (s.kind !== 'well' && waitsFor(s.part) && realKey(s, ctx) === null) out.add(s.part)
  return [...out]
}

export class PageView {
  readonly scene = new THREE.Scene()
  private pivot = new THREE.Group()
  private sheet = new THREE.Group()
  private reals = new Map<string, RealEntry>()
  private realGround: { object: THREE.Object3D; key: string } | null = null
  private models: CursorView[] = []
  private lit: Emitter[] = []
  private world = new THREE.Vector3()
  private unmade = new Set<string>()
  private held = new Set<string>()
  private tick = 0
  private pageId = ''
  private lastScroll = 0
  private settle = -1
  private list: readonly Shape[] = []
  private size = { width: 1920, height: 1080 }
  focus = 0

  constructor() {
    this.scene.add(this.pivot)
    this.pivot.add(this.sheet)
  }

  private tag(o: THREE.Object3D, part: string, order: number, extra: Record<string, unknown> = {}): void {
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (!m.isMesh) return
      m.userData.part ??= part
      Object.assign(m.userData, extra)
      if (m.userData.order === undefined) m.renderOrder = order
    })
  }

  private made(s: Shape, hit: { maker: PartMaker; key: string }, order: number, ctx: RealContext): void {
    let entry = this.reals.get(s.id)
    if (entry && (entry.key !== hit.key || entry.maker !== hit.maker)) {
      this.sheet.remove(entry.object)
      entry.maker.drop?.(entry.object)
      entry = undefined
    }
    if (!entry) {
      entry = { object: hit.maker.make(s, ctx), key: hit.key, maker: hit.maker, part: s.part, seen: 0 }
      this.reals.set(s.id, entry)
      this.sheet.add(entry.object)
    }
    this.place(entry.object, s, s.z0)
    this.tag(entry.object, s.part, order, s.kind === 'text' ? { shape: s.id, type: s.words } : { shape: s.id })
    entry.object.visible = true
    hit.maker.pose?.(entry.object, s, ctx)
    this.shiver(entry.object, s)
    entry.seen = this.tick
  }

  private slab(ctx: RealContext): void {
    const maker = real.ground
    const key = maker ? maker.key(ctx) : null
    if (!maker || key === null) {
      if (this.realGround) {
        this.sheet.remove(this.realGround.object)
        maker?.drop?.(this.realGround.object)
        this.realGround = null
      }
      return
    }
    if (this.realGround && this.realGround.key !== key) {
      this.sheet.remove(this.realGround.object)
      maker.drop?.(this.realGround.object)
      this.realGround = null
    }
    if (!this.realGround) {
      this.realGround = { object: maker.make(ctx), key }
      this.sheet.add(this.realGround.object)
      this.tag(this.realGround.object, 'shell', ORDER.ground)
    }
    maker.pose?.(this.realGround.object, ctx)
  }

  private place(o: THREE.Object3D, s: Shape, z: number): void {
    o.position.set(s.x + s.w / 2 - 960, 540 - (s.y + s.h / 2), z)
    o.rotation.set(s.turnX ?? 0, s.turnY ?? 0, -(s.rot ?? 0))
  }

  private shiver(o: THREE.Object3D, s: Shape): void {
    if (this.settle < 0 || s.z1 <= SHIVER.loose || s.pocket === true) return
    const b = shiverBase(this.list, s)
    const t = this.settle - shiverDelay((b.y + b.h / 2 - this.lastScroll) / 1080)
    o.position.z += shiverAt(t)
    o.position.y += rattleAt(t)
  }

  apply(f: Frame, size: { width: number; height: number }): void {
    this.tick++
    if (f.page !== this.pageId) {
      for (const e of this.reals.values()) {
        this.sheet.remove(e.object)
        e.maker.drop?.(e.object)
      }
      this.reals.clear()
      this.pageId = f.page
    }
    this.size = size
    this.lastScroll = f.scroll
    this.settle = f.settle ?? -1
    this.list = f.list
    const turning = Math.abs(f.turn) > 1e-6
    const top = turning ? f.scroll : 0
    const tall = turning ? 1080 : size.height
    this.pivot.position.set(0, -f.scroll, 0)
    this.sheet.position.set(0, f.scroll, 0)
    this.pivot.rotation.x = f.turn
    this.pivot.updateMatrixWorld(true)
    this.lit = []
    const ctx = contextOf(f, size.width, top, tall, (e) => {
      this.world.set(e.x - 960, 540 - e.y, e.z)
      this.sheet.localToWorld(this.world)
      this.lit.push({ ...e, x: this.world.x, y: this.world.y, z: this.world.z })
    })
    this.slab(ctx)
    this.unmade.clear()
    this.held.clear()
    let order = 0
    for (const s of f.list) {
      order++
      if (s.kind === 'well') continue
      if (turning && !s.fixed && (s.y + s.h < top || s.y > top + tall)) continue
      const hit = realKey(s, ctx)
      if (hit) {
        if (hit.key !== '') this.made(s, hit, order, ctx)
      } else if (waitsFor(s.part)) this.held.add(s.part)
      else this.unmade.add(s.part)
    }
    for (const [id, e] of this.reals) {
      if (e.seen === this.tick) continue
      e.object.visible = false
      if (this.tick - e.seen > 240) {
        this.sheet.remove(e.object)
        e.maker.drop?.(e.object)
        this.reals.delete(id)
      }
    }
    const cursors = f.cursors ?? [f.cursor]
    while (this.models.length < cursors.length) {
      const model = new CursorView()
      this.tag(model.root, 'cursor-body', ORDER.cursor + 4096 + this.models.length * 64)
      this.scene.add(model.root)
      this.models.push(model)
    }
    this.models.forEach((m, i) => {
      const c = cursors[i]
      m.root.visible = c !== undefined && c.onPage
      if (c) m.apply(c, ctx)
    })
  }

  // The lights the parts gave off in the frame on show, in world units.
  emitters(): Emitter[] {
    return this.lit
  }

  bounds(reach = 1500): Bounds {
    const cy = -this.focus
    const bottom = 540 - this.size.height
    return { minX: -980, maxX: 980, minY: Math.max(bottom - 20, cy - reach), maxY: Math.min(560, cy + reach), minZ: -420, maxZ: 320 }
  }

  // The parts of the frame on show that nobody makes. Nothing is drawn for them: the list is how they are heard.
  standIns(): string[] {
    const out = new Set<string>(cursorUnmade())
    if (!this.realGround) out.add('shell')
    for (const name of this.unmade) out.add(name)
    return [...out]
  }

  // The parts of the frame on show that are not drawn yet because their pictures are not in.
  waiting(): string[] {
    return [...this.held]
  }
}
