import * as THREE from 'three'
import { config } from '../config'
import type { Bounds } from '../core/renderer'
import type { CursorPose } from '../cursor/body'
import type { Frame } from '../stage/stage'
import type { Shape, Tone } from '../stage/types'
import { studio } from './materials'
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

export class BlockoutView {
  readonly scene = new THREE.Scene()
  private pivot = new THREE.Group()
  private sheet = new THREE.Group()
  private materials = new Map<Tone, THREE.MeshStandardMaterial>()
  private solids = new Map<string, { mesh: THREE.Mesh; key: string; seen: number }>()
  private texts = new Map<string, { group: THREE.Group; key: string; seen: number }>()
  private geometry = new Cache<THREE.BufferGeometry>()
  private register = new TypeRegister()
  private unitBox = new THREE.BoxGeometry(1, 1, 1)
  private unitDisc = new THREE.CylinderGeometry(0.5, 0.5, 1, 40).rotateX(Math.PI / 2)
  private unitBall = new THREE.SphereGeometry(0.5, 32, 20)
  private slab = new THREE.Mesh(this.unitBox, this.tone('page'))
  private arrow = new THREE.Group()
  private arrowBody!: THREE.Mesh
  private mark!: THREE.Mesh
  private strips = new THREE.Group()
  private tick = 0
  private pageId = ''
  private lastScroll = 0
  private size = { width: 1920, height: 1080 }
  focus = 0

  constructor() {
    this.scene.add(this.pivot)
    this.pivot.add(this.sheet)
    this.slab.receiveShadow = true
    this.slab.castShadow = true
    this.slab.userData.standIn = 'shell'
    this.sheet.add(this.slab)
    this.makeArrow()
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

  private makeArrow(): void {
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
    this.arrowBody = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(1), { depth: 2.4, bevelEnabled: false }), this.tone('light'))
    this.arrowBody.position.z = 1.6
    const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(outline(1.16), { depth: 1.4, bevelEnabled: false }), this.tone('dark'))
    this.mark = new THREE.Mesh(this.unitDisc, this.tone('dark'))
    this.mark.scale.set(16, 16, 0.6)
    this.mark.position.set(5 * k, -9 * k, 4.4)
    for (let i = 0; i < 6; i++) {
      const strip = new THREE.Mesh(this.unitBox, this.tone('light'))
      strip.scale.set(7, 62, 1.2)
      strip.position.set(6 + i * 9, -34 - (i % 2) * 5, 1 + i * 0.4)
      strip.rotation.z = (i - 2.5) * 0.09
      this.strips.add(strip)
    }
    this.arrow.add(this.arrowBody, rim, this.mark, this.strips)
    this.arrow.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      m.userData.standIn = 'cursor-body'
    })
    this.scene.add(this.arrow)
  }

  private solidGeometry(s: Shape, depth: number): { geometry: THREE.BufferGeometry; unit: boolean } {
    if (s.kind === 'ball') return { geometry: this.unitBall, unit: true }
    if (s.kind === 'disc') return { geometry: this.unitDisc, unit: true }
    const r = s.kind === 'capsule' ? Math.min(s.w, s.h) / 2 : (s.r ?? 0)
    if (r <= 0.5) return { geometry: this.unitBox, unit: true }
    const key = `${q(s.w)}:${q(s.h)}:${q(r)}:${q(depth)}`
    return { geometry: this.geometry.get(key, () => sweep(roundedRect(s.w, s.h, r, 8), plateProfile(depth, Math.min(2.5, depth / 3), 0, 3))), unit: false }
  }

  private place(o: THREE.Object3D, s: Shape, z: number): void {
    o.position.set(s.x + s.w / 2 - 960, 540 - (s.y + s.h / 2), z)
    o.rotation.set(s.turnX ?? 0, s.turnY ?? 0, -(s.rot ?? 0))
  }

  private solid(s: Shape): void {
    let entry = this.solids.get(s.id)
    if (!entry) {
      const mesh = new THREE.Mesh(this.unitBox, this.tone(s.tone))
      mesh.receiveShadow = true
      entry = { mesh, key: '', seen: 0 }
      this.solids.set(s.id, entry)
      this.sheet.add(mesh)
    }
    const mesh = entry.mesh
    const pocket = s.z1 <= 0
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
    mesh.userData.standIn = s.part
    mesh.userData.shape = s.id
    entry.seen = this.tick
  }

  private text(s: Shape): void {
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
    this.place(entry.group, s, s.z1 + 0.09)
    entry.group.visible = true
    entry.seen = this.tick
  }

  private cursor(c: CursorPose): void {
    const a = this.arrow
    a.visible = c.onPage
    const flat = c.damage.includes('flattened')
    const shredded = c.damage.includes('shredded')
    a.position.set(c.x - 960, 540 - c.y, c.z)
    a.rotation.set(0, 0, -c.lean)
    const sq = Math.max(0.3, c.squash)
    a.scale.set(flat ? 1.35 : 1 / Math.sqrt(sq), flat ? 1.35 : sq, flat ? 0.25 : 1)
    this.mark.visible = c.damage.includes('burn') || c.damage.includes('scorched')
    this.strips.visible = shredded
    this.arrowBody.visible = !shredded
    this.arrow.children[1]!.visible = !shredded
    for (const strip of this.strips.children) strip.userData.standIn = 'cursor-damage'
    this.mark.userData.standIn = 'cursor-damage'
  }

  apply(f: Frame, size: { width: number; height: number }): void {
    this.tick++
    if (f.page !== this.pageId) {
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
    this.slab.scale.set(size.width, tall, slabDepth)
    this.slab.position.set(0, 540 - top - tall / 2, -slabDepth / 2)
    this.pivot.position.set(0, -f.scroll, 0)
    this.sheet.position.set(0, f.scroll, 0)
    this.pivot.rotation.x = f.turn
    for (const s of f.list) {
      if (turning && !s.fixed && (s.y + s.h < top || s.y > top + tall)) continue
      if (s.kind === 'text') this.text(s)
      else this.solid(s)
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
    this.cursor(f.cursor)
  }

  bounds(reach = 1500): Bounds {
    const cy = -this.focus
    const bottom = 540 - this.size.height
    return { minX: -980, maxX: 980, minY: Math.max(bottom - 20, cy - reach), maxY: Math.min(560, cy + reach), minZ: -420, maxZ: 320 }
  }

  standIns(): string[] {
    const out = new Set<string>(['shell', 'cursor-body'])
    for (const e of this.solids.values()) out.add(e.mesh.userData.standIn as string)
    for (const e of this.texts.values()) for (const child of e.group.children) out.add(child.userData.standIn as string)
    return [...out]
  }
}
