import * as THREE from 'three'
import { config } from '../config'
import type { Bounds } from '../core/renderer'
import type { CursorPose } from '../cursor/body'
import { CursorView, cursorReal } from '../cursor/view'
import { real } from '../real'
import type { Emitter, PartMaker, RealContext } from '../real/types'
import type { Frame } from '../stage/stage'
import type { Shape, Tone } from '../stage/types'
import { studio } from '../post/studio'
import { block } from './metrics'
import { circle, plateProfile, roundedRect, sweep } from './solids'
import { TypeRegister } from './type'
import { words } from './words'

export const TONES: Record<Tone, number> = {
  page: 0.62, pocket: 0.42, raised: 0.72, metal: 0.5, accent: 0.11, danger: 0.14, paper: 0.8, dark: 0.06, glass: 0.56, light: 0.86, ink: 0.04, inkLight: 0.9
}

const slabDepth = config.scale.heights.slab
const LIMIT = 900

class Cache<T extends { dispose(): void }> {
  private map = new Map<string, T>()
  get(key: string, make: () => T): T {
    const hit = this.map.get(key)
    if (hit) {
      this.map.delete(key)
      this.map.set(key, hit)
      return hit
    }
    const made = make()
    this.map.set(key, made)
    if (this.map.size > LIMIT) {
      const [first, value] = this.map.entries().next().value as [string, T]
      this.map.delete(first)
      value.dispose()
    }
    return made
  }
}

const q = (v: number): number => Math.round(v * 4) / 4

interface Arrow { group: THREE.Group; body: THREE.Mesh; rim: THREE.Mesh; mark: THREE.Mesh; strips: THREE.Group; sweat: THREE.Group; arms: THREE.Group; limbs: THREE.Mesh[]; fists: THREE.Mesh[] }

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

// The parts of a frame that would be drawn as stand-ins, without drawing it.
export function standInsOf(f: Frame, size: { width: number; height: number }): string[] {
  const ctx = contextOf(f, size.width, 0, size.height, () => undefined)
  const out = new Set<string>()
  if (!real.ground || real.ground.key(ctx) === null) {
    out.add('shell')
    for (const s of f.list) if (s.kind === 'well') out.add(s.part)
  }
  for (const s of f.list) if (s.kind !== 'well' && realKey(s, ctx) === null) out.add(s.part)
  for (const c of f.cursors ?? [f.cursor]) for (const name of cursorStandIns(c)) out.add(name)
  return [...out]
}

function cursorStandIns(c: CursorPose): string[] {
  const out: string[] = []
  if (!cursorReal.body) out.push('cursor-body')
  if (c.arms && c.hands && !cursorReal.arms) out.push('cursor-arms')
  if (c.damage.length && !cursorReal.damage) out.push('cursor-damage')
  if ((c.acting !== 'plain' || c.reaction) && !cursorReal.acting) out.push('cursor-acting')
  return out
}

export class PageView {
  readonly scene = new THREE.Scene()
  private pivot = new THREE.Group()
  private sheet = new THREE.Group()
  private materials = new Map<Tone, THREE.MeshStandardMaterial>()
  private solids = new Map<string, { mesh: THREE.Mesh; key: string; seen: number }>()
  private texts = new Map<string, { group: THREE.Group; key: string; seen: number }>()
  private reals = new Map<string, RealEntry>()
  private realGround: { object: THREE.Object3D; key: string } | null = null
  private models: CursorView[] = []
  private lit: Emitter[] = []
  private world = new THREE.Vector3()
  private geometry = new Cache<THREE.BufferGeometry>()
  private register = new TypeRegister()
  private unitBox = new THREE.BoxGeometry(1, 1, 1)
  private unitDisc = new THREE.CylinderGeometry(0.5, 0.5, 1, 40).rotateX(Math.PI / 2)
  private unitBall = new THREE.SphereGeometry(0.5, 32, 20)
  private slab = new THREE.Group()
  private slabKey = ''
  private wells: Shape[] = []
  private arrows: Arrow[] = []
  private tick = 0
  private pageId = ''
  private lastScroll = 0
  private size = { width: 1920, height: 1080 }
  private cursors: CursorPose[] = []
  focus = 0

  constructor() {
    this.scene.add(this.pivot)
    this.pivot.add(this.sheet)
    this.sheet.add(this.slab)
    this.arrows.push(this.makeArrow())
  }

  private tone(t: Tone): THREE.MeshStandardMaterial {
    let m = this.materials.get(t)
    if (!m) {
      const v = TONES[t]
      m = studio(new THREE.MeshStandardMaterial({ color: new THREE.Color(v, v, v), roughness: 0.9, metalness: 0, envMapIntensity: 0.35 }))
      if (t === 'ink' || t === 'inkLight') {
        m.polygonOffset = true
        m.polygonOffsetFactor = -1
        m.polygonOffsetUnits = -2
      }
      this.materials.set(t, m)
    }
    return m
  }

  private makeArrow(): Arrow {
    const k = config.cursor.heightPxAt1080 / 19
    const pts: [number, number][] = [[0, 0], [0, 16.2], [3.9, 12.6], [6.9, 19], [9.6, 17.8], [6.7, 11.6], [11.8, 11.6]]
    const outline = (grow: number) => {
      const s = new THREE.Shape()
      pts.forEach(([x, y], i) => {
        const px = (4.2 + (x - 4.2) * grow) * k
        const py = -(9.5 + (y - 9.5) * grow) * k
        if (i === 0) s.moveTo(px, py)
        else s.lineTo(px, py)
      })
      s.closePath()
      return s
    }
    const group = new THREE.Group()
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(1), { depth: 2.4, bevelEnabled: false }), this.tone('light'))
    body.position.z = 1.6
    const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(1.16), { depth: 1.4, bevelEnabled: false }), this.tone('dark'))
    const mark = new THREE.Mesh(this.unitDisc, this.tone('dark'))
    mark.scale.set(16, 16, 0.6)
    mark.position.set(5 * k, -9 * k, 4.4)
    const strips = new THREE.Group()
    for (let i = 0; i < 6; i++) {
      const strip = new THREE.Mesh(this.unitBox, this.tone('light'))
      strip.scale.set(7, 62, 1.2)
      strip.position.set(6 + i * 9, -34 - (i % 2) * 5, 1 + i * 0.4)
      strip.rotation.z = (i - 2.5) * 0.09
      strips.add(strip)
    }
    const sweat = new THREE.Group()
    for (let i = 0; i < 3; i++) {
      const drop = new THREE.Mesh(this.unitBall, this.tone('glass'))
      drop.scale.set(7, 10, 4)
      drop.position.set(-8 + i * 22, 6 - (i % 2) * 14, 5)
      sweat.add(drop)
    }
    group.add(body, rim, mark, strips, sweat)
    group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      m.userData.standIn = 'cursor-body'
    })
    for (const strip of strips.children) strip.userData.standIn = 'cursor-damage'
    mark.userData.standIn = 'cursor-damage'
    for (const drop of sweat.children) drop.userData.standIn = 'cursor-acting'
    const arms = new THREE.Group()
    const limbs: THREE.Mesh[] = []
    const fists: THREE.Mesh[] = []
    for (let i = 0; i < 2; i++) {
      const limb = new THREE.Mesh(this.unitBox, this.tone('light'))
      const fist = new THREE.Mesh(this.unitBall, this.tone('light'))
      for (const m of [limb, fist]) {
        m.castShadow = true
        m.receiveShadow = true
        m.userData.standIn = 'cursor-arms'
      }
      limbs.push(limb)
      fists.push(fist)
      arms.add(limb, fist)
    }
    const base = ORDER.cursor + this.arrows.length * 64
    let part = 0
    for (const root of [group, arms]) root.traverse((o) => (o.renderOrder = (o as THREE.Group).isGroup ? base : part++))
    this.scene.add(group, arms)
    return { group, body, rim, mark, strips, sweat, arms, limbs, fists }
  }

  private solidGeometry(s: Shape, depth: number): { geometry: THREE.BufferGeometry; unit: boolean } {
    if (s.kind === 'ball') return { geometry: this.unitBall, unit: true }
    if (s.kind === 'disc') return { geometry: this.unitDisc, unit: true }
    const r = s.kind === 'capsule' ? Math.min(s.w, s.h) / 2 : (s.r ?? 0)
    if (r <= 0.5) return { geometry: this.unitBox, unit: true }
    const key = `${q(s.w)}:${q(s.h)}:${q(r)}:${q(depth)}`
    return { geometry: this.geometry.get(key, () => sweep(roundedRect(s.w, s.h, r, 8), plateProfile(depth, Math.min(2.5, depth / 3), 0, 3))), unit: false }
  }

  // The page's slab with its wells cut in: columns of one height each, from a shared bottom, so walls and risers come by themselves.
  private ground(list: Shape[], width: number, top: number, tall: number): void {
    const wells: { x0: number; x1: number; y0: number; y1: number; z: number; tone: Tone; part: string }[] = []
    for (const s of list) {
      if (s.kind !== 'well') continue
      const x0 = Math.max(0, s.x)
      const x1 = Math.min(width, s.x + s.w)
      const y0 = Math.max(top, s.y)
      const y1 = Math.min(top + tall, s.y + s.h)
      if (x1 - x0 > 0.5 && y1 - y0 > 0.5) wells.push({ x0, x1, y0, y1, z: s.z0, tone: s.tone, part: s.part })
    }
    const key = `${width}:${top}:${tall}:${wells.map((w) => `${q(w.x0)},${q(w.x1)},${q(w.y0)},${q(w.y1)},${q(w.z)},${w.tone}`).join(';')}`
    if (key === this.slabKey) return
    this.slabKey = key
    for (const child of [...this.slab.children]) {
      this.slab.remove(child)
      ;(child as THREE.Mesh).geometry.dispose()
    }
    let bottom = -slabDepth
    for (const w of wells) bottom = Math.min(bottom, w.z - 8)
    const xs = [...new Set([0, width, ...wells.flatMap((w) => [w.x0, w.x1])])].sort((a, b) => a - b)
    const ys = [...new Set([top, top + tall, ...wells.flatMap((w) => [w.y0, w.y1])])].sort((a, b) => a - b)
    const nx = xs.length - 1
    const ny = ys.length - 1
    const cells: { z: number; tone: Tone; part: string }[][] = []
    for (let j = 0; j < ny; j++) {
      const row: { z: number; tone: Tone; part: string }[] = []
      for (let i = 0; i < nx; i++) {
        const cx = (xs[i]! + xs[i + 1]!) / 2
        const cy = (ys[j]! + ys[j + 1]!) / 2
        const cell: { z: number; tone: Tone; part: string } = { z: 0, tone: 'page', part: 'shell' }
        for (const w of wells) {
          if (cx > w.x0 && cx < w.x1 && cy > w.y0 && cy < w.y1 && w.z < cell.z) {
            cell.z = w.z
            cell.tone = w.tone
            cell.part = w.part
          }
        }
        row.push(cell)
      }
      cells.push(row)
    }
    const groups = new Map<string, { tone: Tone; part: string; pos: number[]; nor: number[] }>()
    const quad = (tone: Tone, part: string, a: number[], b: number[], c: number[], d: number[], n: number[]) => {
      const k = `${tone}|${part}`
      let g = groups.get(k)
      if (!g) {
        g = { tone, part, pos: [], nor: [] }
        groups.set(k, g)
      }
      for (const v of [a, b, c, a, c, d]) {
        g.pos.push(v[0]! - 960, 540 - v[1]!, v[2]!)
        g.nor.push(n[0]!, n[1]!, n[2]!)
      }
    }
    const zAt = (i: number, j: number): number => (i < 0 || j < 0 || i >= nx || j >= ny ? bottom : cells[j]![i]!.z)
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const c = cells[j]![i]!
        const x0 = xs[i]!
        const x1 = xs[i + 1]!
        const y0 = ys[j]!
        const y1 = ys[j + 1]!
        const side = c.z === 0 ? 'page' : c.tone
        quad(c.tone, c.part, [x0, y1, c.z], [x1, y1, c.z], [x1, y0, c.z], [x0, y0, c.z], [0, 0, 1])
        const west = zAt(i - 1, j)
        if (west < c.z) quad(side, c.part, [x0, y0, west], [x0, y1, west], [x0, y1, c.z], [x0, y0, c.z], [-1, 0, 0])
        const east = zAt(i + 1, j)
        if (east < c.z) quad(side, c.part, [x1, y1, east], [x1, y0, east], [x1, y0, c.z], [x1, y1, c.z], [1, 0, 0])
        const north = zAt(i, j - 1)
        if (north < c.z) quad(side, c.part, [x1, y0, north], [x0, y0, north], [x0, y0, c.z], [x1, y0, c.z], [0, 1, 0])
        const south = zAt(i, j + 1)
        if (south < c.z) quad(side, c.part, [x0, y1, south], [x1, y1, south], [x1, y1, c.z], [x0, y1, c.z], [0, -1, 0])
      }
    }
    quad('page', 'shell', [0, top, bottom], [width, top, bottom], [width, top + tall, bottom], [0, top + tall, bottom], [0, 0, -1])
    for (const g of groups.values()) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3))
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(g.nor, 3))
      const mesh = new THREE.Mesh(geometry, this.tone(g.tone))
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.standIn = g.part
      mesh.renderOrder = ORDER.ground + this.slab.children.length
      this.slab.add(mesh)
    }
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
    entry.seen = this.tick
  }

  private realSlab(ctx: RealContext): boolean {
    const maker = real.ground
    const key = maker ? maker.key(ctx) : null
    if (!maker || key === null) {
      if (this.realGround) {
        this.sheet.remove(this.realGround.object)
        maker?.drop?.(this.realGround.object)
        this.realGround = null
      }
      this.slab.visible = true
      return false
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
    this.slab.visible = false
    return true
  }

  private place(o: THREE.Object3D, s: Shape, z: number): void {
    o.position.set(s.x + s.w / 2 - 960, 540 - (s.y + s.h / 2), z)
    o.rotation.set(s.turnX ?? 0, s.turnY ?? 0, -(s.rot ?? 0))
  }

  private solid(s: Shape, order: number): void {
    let entry = this.solids.get(s.id)
    if (!entry) {
      const mesh = new THREE.Mesh(this.unitBox, this.tone(s.tone))
      mesh.receiveShadow = true
      entry = { mesh, key: '', seen: 0 }
      this.solids.set(s.id, entry)
      this.sheet.add(mesh)
    }
    const mesh = entry.mesh
    const pocket = s.pocket === true
    const z0 = pocket ? 0.02 : s.z0
    const z1 = pocket ? 0.07 : Math.max(s.z1, s.z0 + 0.05)
    const depth = z1 - z0
    const { geometry, unit } = this.solidGeometry(s, depth)
    mesh.geometry = geometry
    mesh.material = this.tone(pocket && s.tone !== 'dark' ? 'pocket' : s.tone)
    mesh.castShadow = !pocket
    if (s.kind === 'ball') {
      this.place(mesh, s, s.z0 + s.w / 2)
      mesh.scale.set(s.w, s.w, s.w)
    } else if (unit) {
      this.place(mesh, s, (z0 + z1) / 2)
      mesh.scale.set(s.w, s.h, depth)
    } else {
      this.place(mesh, s, z0)
      mesh.scale.set(1, 1, 1)
    }
    mesh.visible = true
    mesh.renderOrder = order
    mesh.userData.standIn = s.part
    mesh.userData.shape = s.id
    entry.seen = this.tick
  }

  // A pocket is drawn flat in this view, so type that sits on a pocket's floor is lifted to the flat pocket's top. Type in a real well stays down.
  private sunk(s: Shape): boolean {
    const x = s.x + s.w / 2
    const y = s.y + s.h / 2
    return this.realGround !== null || this.wells.some((w) => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h)
  }

  private text(s: Shape, order: number): void {
    const type = s.type!
    const said = words(s.words!, s.text)
    const key = `${s.words}|${said}|${type.font}|${type.px}|${type.wrap ?? ''}|${type.align ?? ''}|${type.lead ?? ''}|${s.tone}|${q(s.w)}`
    let entry = this.texts.get(s.id)
    if (!entry) {
      entry = { group: new THREE.Group(), key: '', seen: 0 }
      this.texts.set(s.id, entry)
      this.sheet.add(entry.group)
    }
    if (entry.key !== key) {
      for (const child of [...entry.group.children]) {
        entry.group.remove(child)
        ;(child as THREE.Mesh).geometry.dispose()
      }
      const b = block(type.font, said, type.px, type.wrap, type.lead)
      const anchor = type.align === 'centre' ? 0 : type.align === 'right' ? s.w / 2 : -s.w / 2
      b.lines.forEach((line, i) => {
        if (!line) return
        const run = this.register.set({ key: s.words!, line, font: type.font, px: type.px, x: 0, y: 0, align: type.align ?? 'left' }, this.tone(s.tone))
        this.register.runs.length = 0
        const mesh = run.mesh
        mesh.position.set(anchor + (mesh.position.x + 960), s.h / 2 - b.cap - i * b.lead, 0)
        mesh.userData.standIn = s.part
        mesh.userData.type = s.words
        entry!.group.add(mesh)
      })
      entry.key = key
    }
    this.place(entry.group, s, (s.z1 < 0 && !this.sunk(s) ? 0.07 : s.z1) + 0.09)
    entry.group.children.forEach((child, i) => (child.renderOrder = order + i / 1024))
    entry.group.visible = true
    entry.seen = this.tick
  }

  private cursor(c: CursorPose, a: Arrow): void {
    const k = config.cursor.heightPxAt1080 / 19
    a.group.visible = c.onPage
    const flat = c.damage.includes('flattened')
    const shredded = c.damage.includes('shredded')
    if (c.inBall) a.group.position.set(c.x - 960 - 4.2 * k, 540 - c.y + 9.5 * k, c.z + config.table.ballPx / 2 + 1)
    else a.group.position.set(c.x - 960, 540 - c.y, c.z)
    a.group.rotation.set(0, 0, -c.lean - c.spin)
    const sq = Math.max(0.3, c.squash)
    a.group.scale.set(flat ? 1.35 : 1 / Math.sqrt(sq), flat ? 1.35 : sq, flat ? 0.25 : 1)
    a.mark.visible = !cursorReal.damage && (c.damage.includes('burn') || c.damage.includes('scorched'))
    a.strips.visible = !cursorReal.damage && shredded
    a.body.visible = !cursorReal.body && !shredded
    a.rim.visible = !cursorReal.body && !shredded
    a.sweat.visible = !cursorReal.acting && (c.acting === 'nervous' || c.acting === 'scared' || c.acting === 'exhausted')
    const hands = c.onPage && c.arms && !cursorReal.arms ? c.hands : null
    a.arms.visible = hands !== null
    if (!hands) return
    const sides = [-1, 1]
    for (let i = 0; i < 2; i++) {
      const from = new THREE.Vector3(c.x - 960 + (4.2 + sides[i]! * 4.4) * k, 540 - c.y - 10.5 * k, c.z + 2.8)
      const h = hands[i]!
      const to = new THREE.Vector3(h.x - 960, 540 - h.y, h.z)
      const limb = a.limbs[i]!
      const d = Math.max(1, from.distanceTo(to))
      limb.position.copy(from).add(to).multiplyScalar(0.5)
      limb.scale.set(d, 6.5, 6.5)
      limb.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), to.clone().sub(from).normalize())
      const fist = a.fists[i]!
      fist.position.copy(to)
      fist.scale.set(17, 17, 12)
    }
  }

  apply(f: Frame, size: { width: number; height: number }): void {
    this.tick++
    if (f.page !== this.pageId) {
      for (const e of this.reals.values()) {
        this.sheet.remove(e.object)
        e.maker.drop?.(e.object)
      }
      this.reals.clear()
      for (const e of this.solids.values()) this.sheet.remove(e.mesh)
      for (const e of this.texts.values()) {
        this.sheet.remove(e.group)
        for (const child of e.group.children) (child as THREE.Mesh).geometry.dispose()
      }
      this.solids.clear()
      this.texts.clear()
      this.pageId = f.page
    }
    this.size = size
    this.lastScroll = f.scroll
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
    if (!this.realSlab(ctx)) this.ground(f.list, size.width, top, tall)
    this.wells = f.list.filter((s) => s.kind === 'well')
    let order = 0
    for (const s of f.list) {
      order++
      if (s.kind === 'well') continue
      if (turning && !s.fixed && (s.y + s.h < top || s.y > top + tall)) continue
      const hit = realKey(s, ctx)
      if (hit) {
        if (hit.key !== '') this.made(s, hit, order, ctx)
      } else if (s.kind === 'text') this.text(s, order)
      else this.solid(s, order)
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
    for (const [id, e] of this.solids) {
      if (e.seen === this.tick) continue
      e.mesh.visible = false
      if (this.tick - e.seen > 240) {
        this.sheet.remove(e.mesh)
        this.solids.delete(id)
      }
    }
    for (const [id, e] of this.texts) {
      if (e.seen === this.tick) continue
      e.group.visible = false
      if (this.tick - e.seen > 240) {
        this.sheet.remove(e.group)
        for (const child of e.group.children) (child as THREE.Mesh).geometry.dispose()
        this.texts.delete(id)
      }
    }
    const cursors = f.cursors ?? [f.cursor]
    while (this.arrows.length < cursors.length) this.arrows.push(this.makeArrow())
    this.arrows.forEach((a, i) => {
      const c = cursors[i]
      if (c) this.cursor(c, a)
      else {
        a.group.visible = false
        a.arms.visible = false
      }
    })
    if (cursorReal.body) {
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
    this.cursors = cursors
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

  standIns(): string[] {
    const out = new Set<string>()
    if (!this.realGround) {
      out.add('shell')
      for (const m of this.slab.children) out.add(m.userData.standIn as string)
    }
    for (const c of this.cursors) for (const name of cursorStandIns(c)) out.add(name)
    for (const e of this.solids.values()) if (e.seen === this.tick) out.add(e.mesh.userData.standIn as string)
    for (const e of this.texts.values()) if (e.seen === this.tick) for (const child of e.group.children) out.add(child.userData.standIn as string)
    return [...out]
  }
}
