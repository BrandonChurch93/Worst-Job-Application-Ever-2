import * as THREE from 'three'
import type { Emitter } from '../../real/types'
import { UNIT, type BodyLook, type BodyModel, type StripPose } from '../contract'
import { Deform } from './deform'
import { MAX_HOLES, bodyDepthMaterial, bodyMaterial, bodyUniforms, charMaterial, type BodyUniforms } from './material'
import { AXIS, heightAt, inside, solid } from './shape'
import { cutBand, stripSet, type StripSet } from './strips'

const HOLE_SEGMENTS = 28
const HOLE_ROWS = [0, 0.3, 0.65, 1]
const rag = (a: number): number => 1 + 0.06 * Math.sin(3 * a + 1.3) + 0.04 * Math.sin(7 * a + 0.4) + 0.03 * Math.sin(11 * a + 2.1)
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

export class Body implements BodyModel {
  readonly root = new THREE.Group()
  readonly deform = new Deform()
  private uniforms: BodyUniforms = bodyUniforms()
  private material = bodyMaterial(this.uniforms)
  private depth = bodyDepthMaterial(this.uniforms)
  private char = charMaterial()
  private whole: THREE.Mesh
  private cut: THREE.Mesh
  private walls: THREE.Mesh
  private set: StripSet | null = null
  private last = ''
  private p = { x: 0, y: 0, z: 0 }
  private heat = 0
  private holes: { x: number; y: number; glow: number; r: number }[] = []
  private q = new THREE.Quaternion()
  private qz = new THREE.Quaternion()
  private v = new THREE.Vector3()
  private long = new THREE.Vector3(AXIS[0], -AXIS[1], 0).normalize()
  private up = new THREE.Vector3(0, 0, 1)

  constructor() {
    const s = solid()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(s.rest.length), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(s.rest.length), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aRest', new THREE.BufferAttribute(s.rest, 3))
    g.setAttribute('aInk', new THREE.BufferAttribute(s.ink, 1))
    g.setIndex(new THREE.BufferAttribute(s.index, 1))
    this.whole = this.mesh(g, this.material)
    this.cut = this.mesh(new THREE.BufferGeometry(), this.material)
    this.cut.visible = false
    const wall = new THREE.BufferGeometry()
    const count = MAX_HOLES * HOLE_SEGMENTS * HOLE_ROWS.length
    wall.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage))
    wall.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage))
    wall.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage))
    const index: number[] = []
    for (let h = 0; h < MAX_HOLES; h++) {
      for (let r = 0; r + 1 < HOLE_ROWS.length; r++) {
        for (let j = 0; j < HOLE_SEGMENTS; j++) {
          const a = (h * HOLE_ROWS.length + r) * HOLE_SEGMENTS + j
          const b = (h * HOLE_ROWS.length + r) * HOLE_SEGMENTS + ((j + 1) % HOLE_SEGMENTS)
          index.push(a, b, b + HOLE_SEGMENTS, a, b + HOLE_SEGMENTS, a + HOLE_SEGMENTS)
        }
      }
    }
    wall.setIndex(index)
    this.walls = new THREE.Mesh(wall, this.char)
    this.walls.frustumCulled = false
    this.walls.receiveShadow = true
    this.walls.visible = false
    this.root.add(this.walls)
    this.apply({ stretch: 1, bend: 0, puff: 0, tremble: 0, pale: 0, heat: 0, melt: 0, flat: 0, char: 0, holes: [], strips: null, seam: 0, seamCount: 9, crack: 0, peel: 0, gulp: -1, time: 0 })
  }

  private mesh(g: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh {
    const mesh = new THREE.Mesh(g, m)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.customDepthMaterial = this.depth
    this.root.add(mesh)
    return mesh
  }

  apply(look: BodyLook): void {
    const key = JSON.stringify(look)
    if (key === this.last) return
    this.last = key
    this.deform.set(look)
    const u = this.uniforms
    u.uState.value.set(clamp01(look.pale), clamp01(look.heat), clamp01(look.char), clamp01(look.melt))
    const crack = Math.max(clamp01(look.crack ?? 0), 0)
    const seamCount = look.strips ? look.strips.length : Math.max(1, Math.round(look.seamCount ?? 9))
    u.uMarks.value.set(crack, look.strips ? 0 : clamp01(look.seam ?? 0), seamCount, look.time)
    const band = cutBand(seamCount)
    u.uCut.value.set(band.from, band.width)
    this.holes = []
    for (let i = 0; i < MAX_HOLES; i++) {
      const h = look.holes[i]
      if (h && h.r > 0.02) {
        u.uHoles.value[i]!.set(h.x, h.y, h.r, clamp01(h.glow))
        this.holes.push({ x: h.x, y: h.y, glow: clamp01(h.glow), r: h.r })
      } else u.uHoles.value[i]!.set(0, 0, 0, 0)
    }
    this.heat = clamp01(look.heat)
    if (look.strips && look.strips.length > 0) this.applyStrips(look.strips)
    else this.applyWhole()
    this.applyWalls(look)
  }

  private applyWhole(): void {
    this.whole.visible = true
    this.cut.visible = false
    const s = solid()
    const g = this.whole.geometry
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const a = pos.array as Float32Array
    const p = this.p
    for (let i = 0, n = s.inset.length; i < n; i++) {
      this.deform.point(s.rest[i * 3]!, s.rest[i * 3 + 1]!, s.rest[i * 3 + 2]!, s.inset[i]!, p)
      a[i * 3] = p.x
      a[i * 3 + 1] = p.y
      a[i * 3 + 2] = p.z
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
  }

  private applyStrips(strips: StripPose[]): void {
    const set = stripSet(strips.length)
    const g = this.cut.geometry
    if (this.set !== set) {
      this.set = set
      const n = set.strip.length
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage))
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage))
      const rest = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        rest[i * 3] = set.rest[i * 4]!
        rest[i * 3 + 1] = set.rest[i * 4 + 1]!
        rest[i * 3 + 2] = set.rest[i * 4 + 2]!
      }
      g.setAttribute('aRest', new THREE.BufferAttribute(rest, 3))
      g.setAttribute('aInk', new THREE.BufferAttribute(set.ink, 1))
    }
    this.whole.visible = false
    this.cut.visible = true
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const nor = g.getAttribute('normal') as THREE.BufferAttribute
    const a = pos.array as Float32Array
    const b = nor.array as Float32Array
    const n = set.strip.length
    const count = set.count
    const sum = new Float64Array(count * 4)
    const p = this.p
    for (let i = 0; i < n; i++) {
      this.deform.point(set.rest[i * 4]!, set.rest[i * 4 + 1]!, set.rest[i * 4 + 2]!, set.rest[i * 4 + 3]!, p)
      a[i * 3] = p.x
      a[i * 3 + 1] = p.y
      a[i * 3 + 2] = p.z
      const k = set.strip[i]! * 4
      sum[k] += p.x
      sum[k + 1] += p.y
      sum[k + 2] += p.z
      sum[k + 3] += 1
    }
    const turn: THREE.Quaternion[] = []
    for (let k = 0; k < count; k++) {
      const pose = strips[k]!
      this.q.setFromAxisAngle(this.long, pose.tilt)
      this.qz.setFromAxisAngle(this.up, pose.rot)
      turn.push(this.qz.clone().multiply(this.q))
    }
    const v = this.v
    for (let i = 0; i < n; i++) {
      const k = set.strip[i]!
      const pose = strips[k]!
      const w = Math.max(1, sum[k * 4 + 3]!)
      const cx = sum[k * 4]! / w
      const cy = sum[k * 4 + 1]! / w
      const cz = sum[k * 4 + 2]! / w
      v.set(a[i * 3]! - cx, a[i * 3 + 1]! - cy, a[i * 3 + 2]! - cz).applyQuaternion(turn[k]!)
      a[i * 3] = v.x + cx + pose.x
      a[i * 3 + 1] = v.y + cy + pose.y
      a[i * 3 + 2] = v.z + cz + pose.z
      v.set(set.normal[i * 3]!, set.normal[i * 3 + 1]!, set.normal[i * 3 + 2]!).applyQuaternion(turn[k]!)
      b[i * 3] = v.x
      b[i * 3 + 1] = v.y
      b[i * 3 + 2] = v.z
    }
    pos.needsUpdate = true
    nor.needsUpdate = true
  }

  private applyWalls(look: BodyLook): void {
    const show = this.holes.length > 0 && !look.strips
    this.walls.visible = show
    if (!show) return
    const g = this.walls.geometry
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const col = g.getAttribute('color') as THREE.BufferAttribute
    const a = pos.array as Float32Array
    const c = col.array as Float32Array
    const p = this.p
    const rows = HOLE_ROWS.length
    for (let h = 0; h < MAX_HOLES; h++) {
      const hole = look.holes[h]
      const on = hole !== undefined && hole.r > 0.02
      for (let r = 0; r < rows; r++) {
        for (let j = 0; j < HOLE_SEGMENTS; j++) {
          const i = ((h * rows + r) * HOLE_SEGMENTS + j) * 3
          if (!on) {
            a[i] = 0
            a[i + 1] = 0
            a[i + 2] = 0
            continue
          }
          const ang = (j / HOLE_SEGMENTS) * Math.PI * 2
          const reach = hole.r * rag(ang)
          const ex = hole.x + Math.cos(ang) * reach
          const ey = hole.y + Math.sin(ang) * reach
          const d = Math.max(0, inside(ex, ey))
          const z = (heightAt(ex, ey) - 0.03) * (1 - HOLE_ROWS[r]!)
          const k = reach * (0.74 + 0.26 * clamp01(z / 2.3)) * 1.012
          this.deform.point(hole.x + Math.cos(ang) * k, hole.y + Math.sin(ang) * k, z, d, p)
          a[i] = p.x
          a[i + 1] = p.y
          a[i + 2] = p.z
          const glow = clamp01(hole.glow)
          const flick = Math.pow(0.5 + 0.5 * Math.sin(ang * 5 + h * 2.1) * Math.sin(ang * 9 + 1.7), 2.2)
          const heat = r === 0 ? 0.25 : r === 1 ? 1.5 : r === 2 ? 0.5 : 0.03
          c[i] = 1.0 * heat * glow * glow * flick
          c[i + 1] = (r === 0 ? 0.42 : 0.12) * heat * glow * glow * flick
          c[i + 2] = 0.05 * heat * glow * glow * flick
        }
      }
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    g.computeVertexNormals()
  }

  anchor(x: number, y: number, out: THREE.Vector3): THREE.Vector3 {
    const d = Math.max(0, inside(x, y))
    this.deform.point(x, y, heightAt(x, y) * 0.5, d, this.p)
    return out.set(this.p.x, this.p.y, this.p.z)
  }

  // Where a point of the enamel's face is, on top of the body as it is drawn now.
  surface(x: number, y: number, out: THREE.Vector3): THREE.Vector3 {
    const d = Math.max(0, inside(x, y))
    this.deform.point(x, y, heightAt(x, y), d, this.p)
    return out.set(this.p.x, this.p.y, this.p.z)
  }

  emit(out: Emitter[]): void {
    if (this.heat > 0.02) {
      const along = 1.5 + this.heat * 4.5
      this.deform.point(along * AXIS[0] * 0.9, along * AXIS[1], 2.4, 2, this.p)
      out.push({ x: this.p.x, y: this.p.y, z: this.p.z + 3 * UNIT, colour: [1, 0.3, 0.06], power: 0.9 * this.heat, reach: (14 + 16 * this.heat) * UNIT })
    }
    for (const h of this.holes) {
      if (h.glow < 0.04) continue
      this.deform.point(h.x, h.y, 2.4, 2, this.p)
      out.push({ x: this.p.x, y: this.p.y, z: this.p.z + 2 * UNIT, colour: [1, 0.42, 0.1], power: 0.7 * h.glow * h.glow, reach: (6 + 5 * h.r) * UNIT })
    }
  }

  dispose(): void {
    this.whole.geometry.dispose()
    this.cut.geometry.dispose()
    this.walls.geometry.dispose()
    this.material.dispose()
    this.depth.dispose()
    this.char.dispose()
  }
}

export const makeBody: (() => BodyModel) | null = () => new Body()
