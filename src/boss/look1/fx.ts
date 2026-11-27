import * as THREE from 'three'
import type { BossView } from '../view'
import type { Emitter } from '../../real/types'
import { hash01 } from '../../core/random'
import { CANNON, FEET, GUN, HATCH, PAGE_BTN, SHIELD } from './numbers'
import { FORM, K, TIMES, bigMuzzleOf, clamp01, kick, lin, mix, muzzleOf, outCubic, prog, smooth, type LookOptions, type Pose } from './pose'
import { boxAt, crackStar, joined, lookKit, mesh, pillOutline, ringPlate } from './kit'

// Everything round the body: the broken socket, the cracks where he lands, chunks, dust and smoke, bullets, flashes, the beam.
// All of it is a pure function of the view and the seed: a puff's age is read from the view's own clocks, never kept.

export type Level = 'low' | 'medium' | 'high' | null

export interface Fx {
  object: THREE.Object3D
  pose(view: BossView, p: Pose, light?: (e: Emitter) => void): void
  setLevel(level: Level): void
  dispose(): void
}

const ORANGE: [number, number, number] = [1, 0.42, 0.1]
const HOT: [number, number, number] = [1, 0.82, 0.55]
const DUST: [number, number, number] = [0.42, 0.4, 0.37]
const SMOKE: [number, number, number] = [0.018, 0.018, 0.02]
const STEAM: [number, number, number] = [0.56, 0.57, 0.59]
const SHADE: [number, number, number] = [0.05, 0.048, 0.045]
const SOOT: [number, number, number] = [0.006, 0.006, 0.006]

function texture(alpha: (u: number, v: number) => number, n = 64): THREE.DataTexture {
  const data = new Uint8Array(n * n * 4)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = clamp01(alpha(((i + 0.5) / n) * 2 - 1, ((j + 0.5) / n) * 2 - 1))
    const k = (j * n + i) * 4
    data[k] = 255
    data[k + 1] = 255
    data[k + 2] = 255
    data[k + 3] = Math.round(a * 255)
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat)
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

const blob = (u: number, v: number): number => { const r = Math.hypot(u, v); return r >= 1 ? 0 : Math.pow(1 - r * r, 2) }
const noise = (x: number, y: number, seed: number): number => {
  const i = Math.floor(x)
  const j = Math.floor(y)
  const fx = x - i
  const fy = y - j
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = hash01(i, j, seed)
  const b = hash01(i + 1, j, seed)
  const c = hash01(i, j + 1, seed)
  const d = hash01(i + 1, j + 1, seed)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}
// A puff: a soft ball whose edge is eaten by lumps, so it reads as smoke and not as a blurred dot.
const puff = (u: number, v: number): number => {
  const r = Math.hypot(u, v)
  if (r >= 1) return 0
  const n = 0.6 * noise(u * 2.6 + 9, v * 2.6 + 9, 71) + 0.4 * noise(u * 6.1 + 3, v * 6.1 + 3, 72)
  return clamp01((1 - r * r) * 1.9 - n * 1.25) * (1 - r * r * r * r)
}
const ring = (u: number, v: number): number => { const r = Math.hypot(u, v); return Math.exp(-Math.pow((r - 0.8) / 0.09, 2)) }
const bar = (_u: number, v: number): number => Math.pow(Math.max(0, 1 - v * v), 1.5)

// Flat pictures facing up, many in one draw: each has a place, a size, a turn, a colour and a strength.
class Sprites {
  mesh: THREE.InstancedMesh
  private n = 0
  private m = new THREE.Matrix4()
  private s = new THREE.Vector3()
  private c = new THREE.Color()
  private fade: THREE.InstancedBufferAttribute | null = null
  constructor(private max: number, map: THREE.Texture, private additive: boolean, order: number, depth = true) {
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, depthTest: depth, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: true })
    const geo = new THREE.PlaneGeometry(1, 1)
    if (!additive) {
      this.fade = new THREE.InstancedBufferAttribute(new Float32Array(max), 1)
      geo.setAttribute('aFade', this.fade)
      mat.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFade;\nvarying float vFade;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = aFade;')
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFade;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vFade;')
      }
      mat.customProgramCacheKey = () => 'bosslook-fade'
    }
    this.mesh = new THREE.InstancedMesh(geo, mat, max)
    this.mesh.frustumCulled = false
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false
    this.mesh.renderOrder = order
    this.mesh.userData.order = true
    this.mesh.setColorAt(0, this.c.setRGB(1, 1, 1))
    this.mesh.count = 0
  }
  begin(): void { this.n = 0 }
  add(x: number, y: number, z: number, w: number, h: number, turn: number, colour: [number, number, number], a: number): void {
    if (this.n >= this.max || a <= 0.003 || w <= 0 || h <= 0) return
    this.m.makeRotationZ(turn).scale(this.s.set(w, h, 1)).setPosition(x, y, z)
    this.mesh.setMatrixAt(this.n, this.m)
    const k = this.additive ? a : 1
    this.mesh.setColorAt(this.n, this.c.setRGB(colour[0] * k, colour[1] * k, colour[2] * k))
    if (this.fade) this.fade.setX(this.n, Math.min(1, a))
    this.n++
  }
  end(): void {
    this.mesh.count = this.n
    this.mesh.visible = this.n > 0
    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
    if (this.fade) this.fade.needsUpdate = true
  }
  dispose(): void { this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose() }
}

// Solid bits, many in one draw.
class Bits {
  mesh: THREE.InstancedMesh
  private n = 0
  private m = new THREE.Matrix4()
  private q = new THREE.Quaternion()
  private e = new THREE.Euler()
  private v = new THREE.Vector3()
  private s = new THREE.Vector3()
  constructor(private max: number, geo: THREE.BufferGeometry, mat: THREE.Material, shadow: boolean) {
    this.mesh = new THREE.InstancedMesh(geo, mat, max)
    this.mesh.frustumCulled = false
    this.mesh.castShadow = shadow
    this.mesh.receiveShadow = shadow
    this.mesh.count = 0
  }
  begin(): void { this.n = 0 }
  add(x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number): void {
    if (this.n >= this.max) return
    this.m.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e.set(rx, ry, rz)), this.s.set(sx, sy, sz))
    this.mesh.setMatrixAt(this.n++, this.m)
  }
  end(): void { this.mesh.count = this.n; this.mesh.visible = this.n > 0; this.mesh.instanceMatrix.needsUpdate = true }
  dispose(): void { this.mesh.geometry.dispose() }
}

function chunkGeo(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 0)
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const k = 0.72 + 0.5 * hash01(Math.round(p.getX(i) * 7), Math.round(p.getY(i) * 7), Math.round(p.getZ(i) * 7) + 3)
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k * 0.6)
  }
  g.computeVertexNormals()
  return g
}

const COUNTS = { low: { chunks: 10, puffs: 40, lamps: 2 }, medium: { chunks: 18, puffs: 90, lamps: 5 }, high: { chunks: 26, puffs: 150, lamps: 8 }, film: { chunks: 26, puffs: 150, lamps: 10 } }

export function makeFx(o: LookOptions, level0: Level): Fx {
  const kit = lookKit()
  const object = new THREE.Group()
  object.name = 'boss-look1-fx'
  let level: Level = level0
  const budget = (): { chunks: number; puffs: number; lamps: number } => COUNTS[level ?? 'film']

  const tex = { blob: texture(blob), puff: texture(puff, 128), ring: texture(ring, 128), bar: texture(bar, 32) }
  const soft = new Sprites(260, tex.puff, false, 40, false)
  const shade = new Sprites(130, tex.puff, false, 39)
  const marks = new Sprites(8, tex.ring, false, 45, false)
  const lit = (c: [number, number, number], k: number): [number, number, number] => [Math.min(1, c[0] * k + 0.003), Math.min(1, c[1] * k + 0.003), Math.min(1, c[2] * k + 0.003)]
  // Each puff is laid twice, a darker underside and a lighter top pushed toward the light, and throws a faint shade on the ground: that is all its volume.
  const smoke = {
    add(x: number, y: number, z: number, w: number, h: number, turn: number, colour: [number, number, number], a: number): void {
      if (a <= 0.003) return
      if (z > 6) shade.add(x + z * 0.32, y - z * 0.42, 1.2, w * 1.15, h * 1.15, turn, SHADE, a * 0.3)
      soft.add(x + w * 0.05, y - h * 0.05, z, w, h, turn, lit(colour, 0.55), a)
      soft.add(x - w * 0.07, y + h * 0.07, z + 0.4, w * 0.8, h * 0.8, turn + 1.7, lit(colour, 1.5), a * 0.85)
    },
    begin: (): void => { soft.begin(); shade.begin() }, end: (): void => { soft.end(); shade.end() }, dispose: (): void => { soft.dispose(); shade.dispose() }, mesh: soft.mesh
  }
  const glow = new Sprites(160, tex.blob, true, 50)
  const rings = new Sprites(24, tex.ring, true, 51)
  const bars = new Sprites(96, tex.bar, true, 52)
  const chunks = new Bits(64, chunkGeo(), kit.ceramic, true)
  const shards = new Bits(24, new THREE.TetrahedronGeometry(1, 0), kit.glassEdge, true)
  const ballMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.35, 0.36, 0.05) })
  const balls = new Bits(96, new THREE.IcosahedronGeometry(1, 2), ballMat, true)
  balls.mesh.receiveShadow = false

  // The ground he breaks: the socket and the cracks where he lands.
  const sx = o.socket.x - 960
  const sy = 540 - o.socket.y
  const ground = new THREE.Group()
  const hw = PAGE_BTN.w / 2
  const hh = PAGE_BTN.h / 2
  const socket = new THREE.Group()
  socket.position.set(sx, sy, 0)
  const hole = mesh(joined([ringPlate(pillOutline(PAGE_BTN.w + 4, PAGE_BTN.h + 4, 22, 6), pillOutline(PAGE_BTN.w - 14, PAGE_BTN.h - 14, 16, 6).reverse(), 0.5, 0), boxAt(-hw + 6, -hh + 6, 0.02, hw - 6, hh - 6, 0.3, 0)]), kit.bore, false, true)
  const lip = mesh(ringPlate(pillOutline(PAGE_BTN.w + 22, PAGE_BTN.h + 22, 30, 6), pillOutline(PAGE_BTN.w + 2, PAGE_BTN.h + 2, 21, 6).reverse(), 3.2, 1.4), kit.ceramic, true, true)
  const socketCracks = mesh(crackStar(o.seed + 1, 13, (a) => [Math.cos(a) * (hw + 8), Math.sin(a) * (hh + 8)], 150, 2.6), kit.crack, false, false)
  socketCracks.position.z = 0.25
  socket.add(hole, lip, socketCracks)
  ground.add(socket)
  const hx = o.home.x - 960
  const hy = 540 - o.home.y
  const landCracks = mesh(crackStar(o.seed + 2, 12, (a) => [Math.cos(a) * 96, Math.sin(a) * 52], 120, 2.2), kit.crack, false, false)
  landCracks.position.set(hx, hy, 0.25)
  ground.add(landCracks)
  const footCracks = FEET.map(([fx, fy], i) => {
    const c = Math.cos(-o.home.heading)
    const s = Math.sin(-o.home.heading)
    const m = mesh(crackStar(o.seed + 10 + i, 9, (a) => [Math.cos(a) * 15, Math.sin(a) * 15], 54, 1.3), kit.crack, false, false)
    m.position.set(hx + (fx * c - fy * s) * K, hy + (fx * s + fy * c) * K, 0.25)
    ground.add(m)
    return m
  })
  object.add(ground, chunks.mesh, shards.mesh, balls.mesh, shade.mesh, smoke.mesh, marks.mesh, glow.mesh, rings.mesh, bars.mesh)

  const rnd = (i: number, j: number): number => hash01(i, j, o.seed)

  // A burst of puffs thrown out from a place at one moment; `age` is the time since.
  const burst = (x: number, y: number, z: number, age: number, n: number, id: number, speed: number, size: number, life: number, colour: [number, number, number], strength: number, ring0 = 0, squash = 1): void => {
    if (age < 0 || age >= life * 1.3) return
    for (let i = 0; i < n; i++) {
      const l = life * (0.7 + 0.6 * rnd(id + i, 21))
      if (age >= l) continue
      const u = age / l
      const a = ((i + rnd(id + i, 22)) / n) * Math.PI * 2
      const d = ring0 + speed * (0.5 + 0.8 * rnd(id + i, 23)) * l * outCubic(u)
      const s = size * (0.6 + 0.8 * rnd(id + i, 24)) * (0.45 + 1.1 * outCubic(u))
      smoke.add(x + Math.cos(a) * d, y + Math.sin(a) * d * squash, z + 6 + 30 * u, s, s, rnd(id + i, 25) * 6.28, colour, strength * (1 - u) * Math.min(1, u * 8 + 0.3))
    }
  }
  // A steady plume from a place: puffs born on the view's clock, drifting one way as they rise.
  const plume = (x: number, y: number, z: number, now: number, every: number, life: number, id: number, size: number, colour: [number, number, number], strength: number, dx = 14, dy = 22): void => {
    if (strength <= 0) return
    const last = Math.floor(now / every)
    for (let k = last; k > last - Math.ceil(life / every) - 1; k--) {
      const age = now - k * every
      if (age < 0 || age >= life) continue
      const u = age / life
      const j = (rnd(k + id * 977, 31) - 0.5) * 2
      const s = size * (0.5 + 1.5 * u) * (0.8 + 0.4 * rnd(k + id * 977, 32))
      smoke.add(x + (dx + 10 * j) * u * life, y + (dy + 8 * j) * u * life, z + 6 + 34 * u, s, s, rnd(k + id * 977, 33) * 6.28, colour, strength * Math.sin(Math.PI * Math.pow(u, 0.6)) * 0.9)
    }
  }
  // Sparks thrown from a place at one moment.
  const sparks = (x: number, y: number, z: number, age: number, n: number, id: number, speed: number, life: number, colour: [number, number, number], strength: number, dir = 0, spread = Math.PI): void => {
    if (age < 0 || age >= life) return
    for (let i = 0; i < n; i++) {
      const l = life * (0.5 + 0.5 * rnd(id + i, 41))
      if (age >= l) continue
      const u = age / l
      const a = dir + (rnd(id + i, 42) - 0.5) * 2 * spread
      const v = speed * (0.4 + 0.9 * rnd(id + i, 43))
      const d = v * l * (u - 0.4 * u * u)
      const len = Math.max(3, v * 0.035 * (1 - u))
      bars.add(x + Math.cos(a) * d, y + Math.sin(a) * d, z + 4, len, 2.4, a, colour, strength * (1 - u))
    }
  }
  const flash = (x: number, y: number, z: number, size: number, colour: [number, number, number], strength: number): void => {
    glow.add(x, y, z, size, size, 0, colour, strength)
    glow.add(x, y, z + 0.5, size * 0.45, size * 0.45, 0, [1, 1, 1], strength * 0.8)
  }
  const fromBody = (p: Pose, x: number, y: number): [number, number] => {
    const c = Math.cos(p.body.yaw)
    const s = Math.sin(p.body.yaw)
    const bx = (x + p.body.x) * K
    const by = (y + p.body.y) * K
    return [p.x + bx * c - by * s, p.y + bx * s + by * c]
  }

  const pose = (view: BossView, p: Pose, light?: (e: Emitter) => void): void => {
    const b = view.boss
    const now = view.time
    const f = clamp01(b.form)
    const t = clamp01(b.turret)
    const beaten = clamp01(b.beaten)
    const n = budget()
    let lamps = 0
    const lamp = (x: number, y: number, z: number, colour: [number, number, number], power: number, reach: number): void => {
      if (!light || power <= 0.01 || lamps >= n.lamps) return
      lamps++
      light({ x: x + 960, y: 540 - y, z, colour, power, reach })
    }
    smoke.begin(); marks.begin(); glow.begin(); rings.begin(); bars.begin(); chunks.begin(); shards.begin(); balls.begin()

    // The forming.
    const tf = f * TIMES.form
    const shown = p.shown && (o.ground || o.pit)
    ground.visible = shown
    socket.visible = o.pit
    landCracks.visible = false
    if (shown) {
      const open = prog(f, 0, FORM.launch + 0.01)
      hole.visible = f >= FORM.launch
      lip.visible = f >= FORM.launch
      socketCracks.scale.setScalar(0.25 + 0.75 * open)
      landCracks.visible = o.ground && f >= FORM.land
      landCracks.scale.setScalar(0.5 + 0.5 * outCubic(lin(f, FORM.land, FORM.land + 0.03)))
      footCracks.forEach((m, i) => {
        const at = FORM.legs[i]! + FORM.legTime
        const leg = p.legs[i]!
        m.visible = o.ground && f >= at && leg.lift < 0.5
        m.position.x = leg.planted[0]
        m.position.y = leg.planted[1]
        m.scale.setScalar(f >= 1 ? 1 - 0.6 * leg.lift * 2 : 0.4 + 0.6 * outCubic(lin(f, at, at + 0.03)))
      })
    }
    if (p.shown && f > 0) {
      const launch = tf - FORM.launch * TIMES.form
      const land = tf - FORM.land * TIMES.form
      if (f < FORM.launch) {
        const q = f / FORM.launch
        for (let i = 0; i < 6; i++) {
          const a = rnd(i, 51) * 6.28
          const s = 10 + 22 * q
          smoke.add(sx + Math.cos(a) * (hw + 6) * (0.6 + 0.5 * rnd(i, 52)), sy + Math.sin(a) * (hh + 8), 3, s, s, 0, DUST, 0.5 * q)
        }
        glow.add(sx, sy, 16, PAGE_BTN.w * 1.5, PAGE_BTN.h * 2.6, 0, ORANGE, 0.35 * q * q)
      }
      if (launch >= 0) {
        const all = n.chunks
        for (let i = 0; i < all; i++) {
          const first = i < Math.ceil(all * 0.62)
          const age = first ? launch : land
          if (age < 0) continue
          const a = rnd(i, 61) * 6.28
          const v = (first ? 150 : 110) * (0.35 + rnd(i, 62))
          const vz = (first ? 260 : 170) * (0.5 + 0.8 * rnd(i, 63))
          const g = 900
          const air = (2 * vz) / g
          const tt = Math.min(age, air)
          const slide = age > air ? 14 * (1 - Math.exp(-(age - air) * 6)) : 0
          const cx0 = first ? sx + Math.cos(a) * hw * 0.8 : hx + Math.cos(a) * 80
          const cy0 = first ? sy + Math.sin(a) * hh * 0.8 : hy + Math.sin(a) * 44
          const size = (first ? 8.5 : 5) * (0.5 + rnd(i, 64))
          const spin = tt * (4 + 8 * rnd(i, 65))
          chunks.add(cx0 + Math.cos(a) * (v * tt + slide), cy0 + Math.sin(a) * (v * tt + slide), Math.max(size * 0.45, vz * tt - 0.5 * g * tt * tt + size * 0.45), size, size * (0.6 + 0.6 * rnd(i, 66)), size * 0.7, spin, spin * 0.7, rnd(i, 67) * 6.28)
        }
        burst(sx, sy, 4, launch, 12, 100, 120, 46, 0.8, DUST, 0.7, 40, 0.5)
        sparks(sx, sy, 20, launch, 14, 120, 420, 0.35, HOT, 2.2)
        if (launch < 0.12) flash(sx, sy, 30, 260 * (1 - launch / 0.12) + 60, ORANGE, 1.6 * (1 - launch / 0.12))
        lamp(sx, sy, 60, ORANGE, 1.2 * kick(launch, 0.2), 320)
      }
      if (land >= 0 && f < 1) {
        burst(hx, hy, 4, land, 18, 200, 150, 54, 0.75, DUST, 0.75, 70, 0.62)
        if (land < 0.5) rings.add(hx, hy, 2, 220 + 520 * outCubic(land / 0.5), (220 + 520 * outCubic(land / 0.5)) * 0.72, 0, [1, 0.95, 0.9], 0.16 * (1 - land / 0.5))
        FORM.legs.forEach((at, i) => {
          const m = footCracks[i]!
          burst(m.position.x, m.position.y, 3, tf - (at + FORM.legTime) * TIMES.form, 6, 300 + i * 20, 90, 26, 0.36, DUST, 0.7, 6)
        })
      }
    }

    // The turret beat: steam from the bay while it opens and the cannon climbs, sparks and a ring on the lock.
    if (p.shown && f >= 1 && beaten < 0.3) {
      const tt = t * TIMES.turret
      const [bx, by] = fromBody(p, HATCH.cx + 30, 0)
      if (t > 0.04 && t < 1) {
        const fadeOut = 1 - prog(t, 0.9, 1)
        for (let k = 0; k < 16; k++) {
          const age = tt - 0.08 - k * 0.075
          if (age < 0 || age > 0.75) continue
          const u = age / 0.75
          const a = rnd(k, 71) * 6.28
          const s = 26 + 54 * u
          smoke.add(bx + Math.cos(a) * 46 * u + 10 * u, by + Math.sin(a) * 40 * u + 16 * u, 70 + 40 * u, s, s, a, STEAM, 0.5 * (1 - u) * fadeOut)
        }
      }
      if (b.locked || t >= 1) {
        const [s1x, s1y] = fromBody(p, HATCH.cx + 86, 132)
        const [s2x, s2y] = fromBody(p, HATCH.cx + 60, -138)
        plume(s1x, s1y, 44, now, 0.16, 1.4, 5, 24, STEAM, 0.5, 14, 6)
        plume(s2x, s2y, 44, now, 0.19, 1.3, 6, 21, STEAM, 0.42, 16, -12)
      }
      const lockAge = p.lockAge
      if (lockAge >= 0 && lockAge < 0.5) {
        const [px, py] = fromBody(p, CANNON.pivotX + 40, 0)
        sparks(px, py, 100, lockAge, 12, 400, 380, 0.3, HOT, 2)
        if (lockAge < 0.3) rings.add(p.x, p.y, 3, 260 + 420 * outCubic(lockAge / 0.3), 260 + 420 * outCubic(lockAge / 0.3), 0, [1, 0.9, 0.8], 0.14 * (1 - lockAge / 0.3))
        burst(p.x, p.y, 3, lockAge, 10, 420, 120, 34, 0.4, DUST, 0.5, 120)
      }
      if (p.cannon.show && p.cannon.window > 0.6 && t >= 1) {
        const [wx2, wy2] = fromBody(p, CANNON.pivotX + 240, 0)
        lamp(wx2, wy2, 120, ORANGE, 0.1 + 0.05 * p.cannon.window, 110)
      }
    }

    // The small guns.
    if (p.shown && f >= 1 && beaten <= 0) {
      for (const i of [0, 1] as const) {
        const g = b.guns[i]
        const m = muzzleOf(view, i)
        const mx = m.x - 960
        const my = 540 - m.y
        const age = g.firedAt === null ? -1 : now - g.firedAt
        if (g.tell > 0) glow.add(mx, my, m.z + 2, 26 + 30 * g.tell, 26 + 30 * g.tell, 0, ORANGE, 0.5 * g.tell * g.tell)
        if (age >= 0 && age < 0.09) {
          const k = 1 - age / 0.09
          flash(mx + Math.cos(-m.aim) * 10, my + Math.sin(-m.aim) * 10, m.z + 2, 70 * k + 26, HOT, 2.4 * k)
          bars.add(mx + Math.cos(-m.aim) * 30, my + Math.sin(-m.aim) * 30, m.z + 2, 70 * k + 10, 16, -m.aim, ORANGE, 2 * k)
          lamp(mx, my, m.z, [1, 0.36, 0.12], 0.6 * k, 170)
        }
        if (age >= 0) burst(mx + Math.cos(-m.aim) * 14, my + Math.sin(-m.aim) * 14, m.z, age, 4, 500 + i * 10, 60, 18, 0.4, STEAM, 0.4)
      }
    }

    // The big cannon: the charge, the line, the beam, the heat after.
    const big = b.big
    if (big && p.shown && beaten <= 0) {
      const m = bigMuzzleOf(view)
      const mx = m.x - 960
      const my = 540 - m.y
      const x0 = big.x0 - 960
      const y0 = 540 - big.y0
      const x1 = big.x1 - 960
      const y1 = 540 - big.y1
      const len = Math.hypot(x1 - x0, y1 - y0)
      const ang = Math.atan2(y1 - y0, x1 - x0)
      const age = big.firedAt === null ? -1 : now - big.firedAt
      const c = clamp01(big.tell)
      if (age < 0 && c > 0) {
        const pulse = 0.7 + 0.3 * Math.sin(now * (18 + 30 * c))
        bars.add((x0 + x1) / 2, (y0 + y1) / 2, m.z, len, 2.5 + 3.5 * c, ang, ORANGE, (0.3 + 1.1 * c) * pulse)
        flash(mx, my, m.z + 4, 30 + 70 * c, ORANGE, 0.6 + 1.6 * c * c)
        for (let k = 0; k < 8; k++) {
          const u = 1 - ((now * (1.2 + c) + rnd(k, 81)) % 1)
          const a = rnd(k, 82) * 6.28
          glow.add(mx + Math.cos(a) * 70 * u, my + Math.sin(a) * 70 * u, m.z + 4, 7, 7, 0, HOT, c * (1 - u) * 1.4)
        }
        lamp(mx, my, m.z, ORANGE, 0.25 + 1.1 * c * c, 150 + 120 * c)
      }
      if (age >= 0 && age < TIMES.beam) {
        const u = age / TIMES.beam
        const w = big.width * (u < 0.15 ? 0.7 + 2 * u : 1 - 0.55 * smooth((u - 0.5) / 0.5))
        const k = 1 - 0.5 * u
        bars.add((x0 + x1) / 2, (y0 + y1) / 2, m.z * 0.5, len, w * 2.3, ang, ORANGE, 1.5 * k)
        bars.add((x0 + x1) / 2, (y0 + y1) / 2, m.z * 0.5 + 0.5, len, w * 1.25, ang, [1, 0.8, 0.5], 3.2 * k)
        bars.add((x0 + x1) / 2, (y0 + y1) / 2, m.z * 0.5 + 1, len, w * 0.8, ang, [1, 1, 1], 7 * k)
        flash(mx, my, m.z + 6, big.width * (4.2 - 1.6 * u), HOT, 4 * k)
        for (let j = 0; j < 3; j++) lamp(x0 + (x1 - x0) * (0.08 + 0.38 * j), y0 + (y1 - y0) * (0.08 + 0.38 * j), 60, [1, 0.72, 0.42], 1.6 * k, 380)
      }
      if (age >= 0) {
        const dx = Math.cos(ang)
        const dy = Math.sin(ang)
        if (age < TIMES.after) {
          for (let k = 0; k < 14; k++) {
            const l = TIMES.after * (0.6 + 0.4 * rnd(k, 91))
            if (age >= l) continue
            const u = age / l
            const d = (40 + 190 * rnd(k, 92)) * outCubic(u)
            const side = (rnd(k, 93) - 0.5) * (30 + 110 * u)
            const s = (30 + 40 * rnd(k, 94)) * (0.5 + 1.3 * u)
            smoke.add(mx + dx * d - dy * side, my + dy * d + dx * side, m.z + 20 * u, s, s, rnd(k, 95) * 6.28, mix(0, 1, u) > 0.5 ? STEAM : DUST, 0.6 * (1 - u))
          }
          glow.add(mx - dx * 40, my - dy * 40, m.z + 3, 150, 60, ang, ORANGE, 0.7 * kick(age, TIMES.after))
          sparks(mx, my, m.z, age, 16, 600, 520, 0.4, HOT, 2.4, ang, 0.9)
          lamp(mx, my, m.z, ORANGE, 0.5 * kick(age, TIMES.after), 160)
        }
      }
    }

    // The shield glanced, a hit taken, a heal, the open flank.
    if (p.shown && f >= 1) {
      if (p.shield.flash > 0 && p.shield.broken <= 0) {
        for (let k = -3; k <= 3; k++) {
          const a = (k / 3) * 0.37
          const [x, y] = fromBody(p, Math.cos(a) * (SHIELD.r - 12) - (SHIELD.r - SHIELD.mid), Math.sin(a) * (SHIELD.r - 12))
          glow.add(x, y, 62, 46, 46, 0, [0.7, 1, 0.9], 1.5 * p.shield.flash)
        }
        const [x, y] = fromBody(p, SHIELD.mid, 0)
        lamp(x, y, 60, [0.6, 1, 0.85], 0.5 * p.shield.flash, 150)
      }
      if (p.hurt > 0 && b.hitAt !== null) {
        const age = now - b.hitAt
        const [x, y] = fromBody(p, HATCH.cx - 20, 0)
        flash(x, y, 70, 150 * p.hurt + 30, HOT, 2.6 * p.hurt)
        sparks(x, y, 66, age, 16, 700 + Math.floor(b.hitAt * 60), 420, 0.35, HOT, 2.4)
        burst(x, y, 60, age, 6, 720, 80, 30, 0.35, SMOKE, 0.5)
        lamp(x, y, 70, [1, 0.6, 0.3], 0.9 * p.hurt, 220)
      }
      if (p.heal > 0 && b.healedAt !== null) {
        const u = clamp01((now - b.healedAt) / TIMES.heal)
        const s = 120 + 330 * outCubic(u)
        rings.add(p.x, p.y, 76, s, s, 0, [0.35, 1, 0.75], 1.3 * (1 - u))
        glow.add(p.x, p.y, 75, 300, 220, p.body.yaw, [0.3, 1, 0.7], 0.5 * p.heal)
        for (let k = 0; k < 8; k++) {
          const a = rnd(k, 101) * 6.28
          const d = 40 + 70 * rnd(k, 102)
          glow.add(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.6 + 40 * u, 80, 8, 8, 0, [0.5, 1, 0.8], p.heal * 1.6)
        }
        lamp(p.x, p.y, 110, [0.35, 1, 0.75], 0.5 * p.heal, 240)
      }
      if (b.weak && b.weak.shownAt !== null && beaten <= 0) {
        const wx2 = b.weak.x - 960
        const wy2 = 540 - b.weak.y
        const age = now - b.weak.shownAt
        const beat = 0.5 + 0.5 * Math.sin(age * 16)
        const s = 44 + 14 * beat
        marks.add(wx2, wy2, 80, s * 1.5, s * 1.5, 0, [0.95, 0.12, 0.03], 0.75 + 0.25 * beat)
        const grow = (age * 1.4) % 1
        marks.add(wx2, wy2, 80, s * (1.5 + 1.3 * grow), s * (1.5 + 1.3 * grow), 0, [0.95, 0.12, 0.03], 0.6 * (1 - grow))
        rings.add(wx2, wy2, 64, s, s, 0, [1, 0.3, 0.12], 1.2 + 0.8 * beat)
        glow.add(wx2, wy2, 63, 54, 54, 0, [1, 0.25, 0.1], 0.5 + 0.5 * beat)
        lamp(wx2, wy2, 60, [1, 0.3, 0.12], 0.2 + 0.15 * beat, 120)
      }
    }

    // Damage: smoke where he is hurt, more as he falls from stage to stage; sparks that come and go at the last stage.
    if (p.shown && f >= 1 && (b.stage > 0 || beaten > 0)) {
      const heavy = b.stage >= 2 || beaten > 0
      const [ax, ay] = fromBody(p, 70, 214)
      plume(ax, ay, 64, now, heavy ? 0.09 : 0.13, 1.3, 11, heavy ? 40 : 30, SMOKE, heavy ? 0.8 : 0.62)
      if (heavy) {
        const [cx2, cy2] = fromBody(p, 150, -112)
        plume(cx2, cy2, 62, now, 0.11, 1.2, 12, 34, SOOT, 0.7, -8, 26)
        const flick = 0.6 + 0.4 * hash01(Math.floor(now * 24), 5, o.seed)
        glow.add(cx2, cy2, 70, 46 * flick + 14, 46 * flick + 14, 0, ORANGE, 0.9 * flick)
        glow.add(cx2, cy2, 70.5, 20 * flick + 6, 20 * flick + 6, 0, HOT, 1.2 * flick)
        lamp(cx2, cy2, 70, ORANGE, 0.25 * flick, 110)
        const tick = Math.floor(now / 0.45)
        const sAge = now - tick * 0.45
        if (rnd(tick, 111) > 0.35) {
          const [qx, qy] = fromBody(p, -220 + 440 * rnd(tick, 112), -100 + 200 * rnd(tick, 113))
          sparks(qx, qy, 66, sAge, 7, 800 + tick * 7, 260, 0.25, HOT, 2)
          if (sAge < 0.06) flash(qx, qy, 68, 30, [0.8, 0.9, 1], 1.6 * (1 - sAge / 0.06))
        }
      }
    }

    // Beaten: the cannon is blown off, the glass bursts, he smokes.
    if (p.shown && beaten > 0) {
      const age = beaten * TIMES.beaten
      const [ex, ey] = fromBody(p, CANNON.pivotX + 200, 0)
      if (age < 0.35) {
        const k = 1 - age / 0.35
        flash(ex, ey, 110, 300 * k + 100, HOT, 3 * k)
        rings.add(ex, ey, 20, 200 + 900 * outCubic(age / 0.35), 200 + 900 * outCubic(age / 0.35), 0, [1, 0.8, 0.6], 0.8 * k)
        lamp(ex, ey, 120, [1, 0.62, 0.3], 1.1 * k, 380)
      }
      sparks(ex, ey, 100, age, 22, 900, 620, 0.6, HOT, 2.6)
      burst(ex, ey, 80, age, 16, 940, 170, 70, 1.3, SOOT, 0.75, 20)
      burst(ex, ey, 60, age - 0.1, 10, 960, 110, 60, 1.1, SMOKE, 0.6, 10)
      const [hx2, hy2] = fromBody(p, HATCH.cx + 40, 0)
      const grow = smooth(lin(beaten, 0.1, 0.5))
      plume(hx2, hy2, 60, now, 0.09, 1.5, 21, 44, SOOT, 0.7 * grow, 20, 34)
      const [gx, gy] = fromBody(p, GUN.x, GUN.y)
      plume(gx, gy, 60, now, 0.14, 1.2, 22, 30, SMOKE, 0.5 * grow, 16, 26)
      const sh = (beaten - 0.05) * TIMES.beaten
      if (sh >= 0) {
        for (let i = 0; i < 18; i++) {
          const a0 = ((i + 0.5) / 18 - 0.5) * 2 * 0.37
          const [x, y] = fromBody(p, Math.cos(a0) * (SHIELD.r - 12) - (SHIELD.r - SHIELD.mid), Math.sin(a0) * (SHIELD.r - 12))
          const dir = p.body.yaw + a0 * 2.2 + (rnd(i, 121) - 0.5) * 0.8
          const v = 90 + 240 * rnd(i, 122)
          const vz = 120 + 200 * rnd(i, 123)
          const g = 900
          const air = (2 * vz + Math.sqrt(4 * vz * vz + 8 * g * 55)) / (2 * g)
          const tt = Math.min(sh, air)
          const z = Math.max(1.2, 55 + vz * tt - 0.5 * g * tt * tt)
          const size = 5 + 8 * rnd(i, 124)
          const spin = tt * (5 + 9 * rnd(i, 125))
          shards.add(x + Math.cos(dir) * v * tt, y + Math.sin(dir) * v * tt, z, size, size * 0.7, sh >= air ? 0.9 : size * 0.25, sh >= air ? 0 : spin, sh >= air ? 0 : spin * 0.6, rnd(i, 126) * 6.28)
        }
        if (sh < 0.2) {
          const [x, y] = fromBody(p, SHIELD.mid, 0)
          flash(x, y, 70, 200 * (1 - sh / 0.2) + 40, [0.75, 1, 0.9], 2 * (1 - sh / 0.2))
        }
      }
    }

    // Bullets: round, orange, glowing, each with a short trail.
    let lit = 0
    for (const s of view.bullets) {
      const x = s.x - 960
      const y = 540 - s.y
      const r = BULLET.r
      const z = BULLET.z
      const v = Math.hypot(s.vx, s.vy)
      const a = Math.atan2(-s.vy, s.vx)
      const tl = Math.min(BULLET.trail, v * 0.06)
      balls.add(x, y, z, r, r, r, 0, 0, 0)
      glow.add(x, y, z + r, r * 4.6, r * 4.6, 0, ORANGE, 0.5)
      glow.add(x - r * 0.3, y + r * 0.3, z + r + 0.6, r * 1.1, r * 1.1, 0, HOT, 0.9)
      if (tl > 2) {
        bars.add(x - Math.cos(a) * tl * 0.5, y - Math.sin(a) * tl * 0.5, z, tl, r * 2.1, a, ORANGE, 0.9)
        bars.add(x - Math.cos(a) * tl * 0.28, y - Math.sin(a) * tl * 0.28, z + 0.3, tl * 0.56, r * 1.2, a, HOT, 1.2)
      }
      if (lit < n.lamps - 2) { lit++; lamp(x, y, z, [1, 0.42, 0.12], 0.16, 70) }
    }

    // A flash where anything lands, by kind.
    for (const h of view.hits) {
      const age = now - h.at
      if (age < 0 || age > 0.4) continue
      const x = h.x - 960
      const y = 540 - h.y
      const id = 1000 + h.id * 13
      if (h.kind === 'glance') {
        const k = kick(age, 0.22)
        flash(x, y, 64, 60 * k + 14, [0.7, 1, 0.9], 2 * k)
        sparks(x, y, 62, age, 8, id, 360, 0.25, [0.8, 1, 0.92], 2)
        if (age < 0.25) rings.add(x, y, 63, 26 + 90 * outCubic(age / 0.25), 26 + 90 * outCubic(age / 0.25), 0, [0.6, 1, 0.85], 0.9 * (1 - age / 0.25))
      } else if (h.kind === 'solid') {
        continue
      } else if (h.kind === 'round') {
        const k = kick(age, 0.2)
        flash(x, y, 20, 54 * k + 12, ORANGE, 2 * k)
        sparks(x, y, 16, age, 7, id, 300, 0.22, ORANGE, 2)
        burst(x, y, 6, age, 4, id + 5, 60, 20, 0.3, DUST, 0.5)
      } else {
        const k = kick(age, 0.3)
        flash(x, y, 30, 110 * k + 20, [1, 0.35, 0.2], 2.6 * k)
        sparks(x, y, 26, age, 12, id, 420, 0.3, [1, 0.6, 0.4], 2.2)
        if (age < 0.3) rings.add(x, y, 28, 30 + 150 * outCubic(age / 0.3), 30 + 150 * outCubic(age / 0.3), 0, [1, 0.3, 0.15], 1.2 * (1 - age / 0.3))
        lamp(x, y, 30, [1, 0.3, 0.15], 0.4 * k, 140)
      }
    }
    smoke.end(); marks.end(); glow.end(); rings.end(); bars.end(); chunks.end(); shards.end(); balls.end()
  }

  const dispose = (): void => {
    for (const s of [smoke, marks, glow, rings, bars]) s.dispose()
    for (const s of [chunks, shards, balls]) s.dispose()
    ballMat.dispose()
    tex.blob.dispose(); tex.puff.dispose(); tex.ring.dispose(); tex.bar.dispose()
    ground.traverse((x) => { if ((x as THREE.Mesh).isMesh) (x as THREE.Mesh).geometry.dispose() })
  }
  return { object, pose, setLevel: (l) => { level = l }, dispose }
}

// A bullet as drawn: 19 px across on the page, flying at the height of the guns' mouths.
export const BULLET = { r: 9.5, z: 40, trail: 46 }
