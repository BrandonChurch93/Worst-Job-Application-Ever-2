import * as THREE from 'three'
import type { Emitter } from '../../real/types'
import { hash01 } from '../../core/random'
import { UNIT, type BodyLook, type BodyModel, type StripPose } from '../contract'
import { Deform } from './deform'
import { MAX_HOLES, bodyDepthMaterial, bodyMaterial, bodyUniforms, charMaterial, type BodyUniforms } from './material'
import { AXIS, heightAt, inside, solid } from './shape'
import { cutBand, stripSet, type StripSet } from './strips'

const HOLE_SEGMENTS = 48
const HOLE_ROWS = [0, 0.3, 0.65, 1]
// A punched bore narrows to this share of its mouth at the foot, so its wall is seen from above.
const BORE = 0.7
const BORE_LIGHT = { power: 0.0035, reach: 3.4 }
const smooth01 = (v: number): number => {
  const t = Math.min(1, Math.max(0, v))
  return t * t * (3 - 2 * t)
}
const rag = (a: number, burnt: number): number => 1 + (0.25 + 0.3 * burnt) * (0.06 * Math.sin(3 * a + 1.3) + 0.04 * Math.sin(7 * a + 0.4) + 0.03 * Math.sin(11 * a + 2.1))
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
// A strip out of its place by more than a few pixels is a loose sliver, and lies thinner. It stays the piece of the arrow it was cut from: its ends keep the outline's slant and the dark edge. Each lies its own way: rolled a little about its length, one end up off the pile.
const LOOSE = { thin: 0.5, ribbon: 0, from: 12, to: 64, arm: 40, roll: 0.16, pitch: 0.1, seed: 23 }

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
  private holes: { x: number; y: number; glow: number; r: number; clean: number }[] = []
  private q = new THREE.Quaternion()
  private qz = new THREE.Quaternion()
  private v = new THREE.Vector3()
  private long = new THREE.Vector3(AXIS[0], -AXIS[1], 0).normalize()
  private up = new THREE.Vector3(0, 0, 1)
  private wide = new THREE.Vector3(AXIS[1], AXIS[0], 0).normalize()
  private qy = new THREE.Quaternion()

  constructor() {
    const s = solid()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(s.rest.length), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(s.rest.length), 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aRest', new THREE.BufferAttribute(s.rest, 3))
    g.setAttribute('aInset', new THREE.BufferAttribute(s.inset, 1))
    g.setAttribute('aInk', new THREE.BufferAttribute(s.ink, 1))
    g.setIndex(new THREE.BufferAttribute(s.index, 1))
    this.whole = this.mesh(g, this.material)
    this.whole.receiveShadow = false
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
    const turn = this.root.rotation.z
    const key = JSON.stringify(look) + turn.toFixed(3)
    if (key === this.last) return
    this.last = key
    this.deform.set(look)
    this.deform.lean(turn)
    this.deform.fit()
    const u = this.uniforms
    u.uState.value.set(clamp01(look.pale), clamp01(look.heat), clamp01(look.char), clamp01(look.melt))
    u.uShape.value.set(clamp01(look.flat), clamp01(look.sealed ?? 0), 0, 0)
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
        u.uBurnt.value.setComponent(i, clamp01(h.burnt ?? 1))
        this.holes.push({ x: h.x, y: h.y, glow: clamp01(h.glow), r: h.r, clean: look.strips ? 0 : smooth01(h.r / 1.2) })
      } else u.uHoles.value[i]!.set(0, 0, 0, 0)
    }
    this.heat = clamp01(look.heat)
    if (look.strips && look.strips.length > 0) this.applyStrips(look.strips, clamp01(look.ribbon ?? 0))
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

  private applyStrips(strips: StripPose[], ribbon: number): void {
    const set = stripSet(strips.length)
    const g = this.cut.geometry
    if (this.set !== set) {
      this.set = set
      const n = set.strip.length
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage))
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage))
      const rest = new Float32Array(n * 3)
      const inset = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        inset[i] = set.rest[i * 4 + 3]!
        rest[i * 3] = set.rest[i * 4]!
        rest[i * 3 + 1] = set.rest[i * 4 + 1]!
        rest[i * 3 + 2] = set.rest[i * 4 + 2]!
      }
      g.setAttribute('aRest', new THREE.BufferAttribute(rest, 3))
      g.setAttribute('aInset', new THREE.BufferAttribute(inset, 1).setUsage(THREE.DynamicDrawUsage))
      g.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(set.ink), 1).setUsage(THREE.DynamicDrawUsage))
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
    const loose = strips.map((s) => Math.max(ribbon, smooth01((Math.hypot(s.x, s.y) + Math.abs(s.rot) * LOOSE.arm - LOOSE.from) / (LOOSE.to - LOOSE.from))))
    const insetAt = g.getAttribute('aInset') as THREE.BufferAttribute
    const inkAt = g.getAttribute('aInk') as THREE.BufferAttribute
    const insets = insetAt.array as Float32Array
    const inks = inkAt.array as Float32Array
    const r = set.rest
    const o = set.ribbon
    const span = new Float64Array(count * 2)
    for (let k = 0; k < count; k++) {
      span[k * 2] = Infinity
      span[k * 2 + 1] = -Infinity
    }
    for (let i = 0; i < n; i++) {
      const l = loose[set.strip[i]!]! * LOOSE.ribbon
      const inset = r[i * 4 + 3]! + (o[i * 4 + 3]! - r[i * 4 + 3]!) * l
      this.deform.point(r[i * 4]! + (o[i * 4]! - r[i * 4]!) * l, r[i * 4 + 1]! + (o[i * 4 + 1]! - r[i * 4 + 1]!) * l, r[i * 4 + 2]! + (o[i * 4 + 2]! - r[i * 4 + 2]!) * l, inset, p)
      this.deform.thin(p, 1 - LOOSE.thin * loose[set.strip[i]!]!)
      insets[i] = inset
      inks[i] = set.ink[i]! + (set.ribbonInk[i]! - set.ink[i]!) * l
      a[i * 3] = p.x
      a[i * 3 + 1] = p.y
      a[i * 3 + 2] = p.z
      const k = set.strip[i]! * 4
      sum[k] += p.x
      sum[k + 1] += p.y
      sum[k + 2] += p.z
      sum[k + 3] += 1
      const along = p.x * this.long.x + p.y * this.long.y
      span[k >> 1] = Math.min(span[k >> 1]!, along)
      span[(k >> 1) + 1] = Math.max(span[(k >> 1) + 1]!, along)
    }
    const lift = new Float64Array(count)
    const turn: THREE.Quaternion[] = []
    for (let k = 0; k < count; k++) {
      const pose = strips[k]!
      const l = loose[k]!
      const pitch = (hash01(k, 2, LOOSE.seed) - 0.5) * 2 * LOOSE.pitch * l
      this.q.setFromAxisAngle(this.long, pose.tilt + (hash01(k, 1, LOOSE.seed) - 0.5) * 2 * LOOSE.roll * l)
      this.qz.setFromAxisAngle(this.up, pose.rot)
      this.qy.setFromAxisAngle(this.wide, pitch)
      turn.push(this.qz.clone().multiply(this.qy).multiply(this.q))
      lift[k] = Math.abs(Math.sin(pitch)) * Math.max(0, span[k * 2 + 1]! - span[k * 2]!) * 0.5
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
      a[i * 3 + 2] = v.z + cz + pose.z + lift[k]!
      const l = loose[k]! * LOOSE.ribbon
      const flat = set.ribbonNormal
      v.set(set.normal[i * 3]! + (flat[i * 3]! - set.normal[i * 3]!) * l, set.normal[i * 3 + 1]! + (flat[i * 3 + 1]! - set.normal[i * 3 + 1]!) * l, set.normal[i * 3 + 2]! + (flat[i * 3 + 2]! - set.normal[i * 3 + 2]!) * l).normalize().applyQuaternion(turn[k]!)
      b[i * 3] = v.x
      b[i * 3 + 1] = v.y
      b[i * 3 + 2] = v.z
    }
    pos.needsUpdate = true
    nor.needsUpdate = true
    insetAt.needsUpdate = true
    inkAt.needsUpdate = true
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
          const reach = hole.r * rag(ang, clamp01(hole.burnt ?? 1))
          const ex = hole.x + Math.cos(ang) * reach
          const ey = hole.y + Math.sin(ang) * reach
          const d = Math.max(0, inside(ex, ey))
          const z = (heightAt(ex, ey) - 0.03) * (1 - HOLE_ROWS[r]!)
          const up = clamp01(z / 2.3)
          const crater = clamp01(hole.burnt ?? 1)
          const k = reach * (BORE + (1 - BORE) * up + crater * (0.7 + 0.3 * Math.pow(up, 1.6) - BORE - (1 - BORE) * up)) * 1.012
          this.deform.point(hole.x + Math.cos(ang) * k, hole.y + Math.sin(ang) * k, z, d, p)
          a[i] = p.x
          a[i + 1] = p.y
          a[i + 2] = p.z
          const glow = clamp01(hole.glow)
          const flick = Math.pow(0.5 + 0.5 * Math.sin(ang * 5 + h * 2.1) * Math.sin(ang * 9 + 1.7), 3.4)
          const side = smooth01((Math.cos(ang) * -0.5 + Math.sin(ang) * 0.86 - 0.1) / 0.9)
          const lee = 0.3 + 0.7 * side
          const heat = (r === 0 ? 0.9 : r === 1 ? 0.5 : r === 2 ? 0.12 : 0.02) * lee
          const burnt = clamp01(hole.burnt ?? 1)
          const lit = Math.pow(glow, 0.9) * (0.5 + 3.2 * flick) * burnt
          const facing = clamp01(0.5 + 0.5 * (Math.cos(ang) * 0.5 + Math.sin(ang) * 0.86))
          const grit = 0.82 + 0.36 * hash01(j, r, 7 + h)
          const bare = (1 - burnt) * (0.15 + 0.22 * Math.pow(facing, 1.5)) * (1 - 0.3 * HOLE_ROWS[r]!) * (0.72 + 0.56 * hash01(j, r, 7 + h))
          const ash = burnt * (0.025 + 0.09 * facing) * (0.45 + 0.55 * HOLE_ROWS[r]!) * grit
          c[i] = 1.0 * heat * lit + bare * 0.84 + ash * 0.8
          c[i + 1] = (r === 0 ? 0.5 : 0.24) * heat * lit + bare * (0.66 + 0.1 * facing) + ash * 0.76
          c[i + 2] = 0.05 * heat * lit + bare * (0.42 + 0.18 * facing) + ash * 0.7
        }
      }
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    g.computeVertexNormals()
  }

  middle(): { x: number; y: number; r: number } {
    return this.deform.mid
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
    if (this.heat > 0.3) {
      const along = 1.5 + this.heat * 4.5
      this.deform.point(along * AXIS[0] * 0.9, along * AXIS[1], 2.4, 2, this.p)
      out.push({ x: this.p.x, y: this.p.y, z: this.p.z + 6 * UNIT, colour: [1, 0.3, 0.06], power: 0.022 * this.heat * smooth01((this.heat - 0.3) / 0.3), reach: (10 + 8 * this.heat) * UNIT })
    }
    for (const h of this.holes) {
      // Daylight comes down the bore: the page under it is seen, and the wall's far side is lit.
      if (h.clean > 0.04) {
        this.deform.point(h.x, h.y, 1.7, 2, this.p)
        out.push({ x: this.p.x, y: this.p.y, z: this.p.z, colour: [1, 0.97, 0.92], power: BORE_LIGHT.power * h.clean, reach: BORE_LIGHT.reach * h.r * UNIT })
      }
      if (h.glow < 0.04) continue
      this.deform.point(h.x, h.y, 2.4, 2, this.p)
      out.push({ x: this.p.x, y: this.p.y, z: this.p.z + 3.5 * UNIT, colour: [1, 0.42, 0.1], power: 0.02 * h.glow * h.glow, reach: (5 + 3 * h.r) * UNIT })
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
