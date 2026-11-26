import * as THREE from 'three'
import type { PartMaker } from '../../real/types'
import type { Shape } from '../../stage/types'
import { hash01 } from '../../core/random'
import { materials } from '../../shell/materials'
import { profile, roundedRect, sweep } from '../../shell/solids'
import { studio } from '../../post/studio'
import { BODY_Z, CAP_H, CAP_W, HOLE_H, HOLE_W, crackRuns } from '../body'
import { controls } from '../../shell/real/controls'
import type { RealContext } from '../../real/types'
import { mesh } from './body-kit'

const clamp = (t: number): number => Math.min(1, Math.max(0, t))
const smooth = (t: number): number => { const u = clamp(t); return u * u * (3 - 2 * u) }

export const SOOT_W = 512
export const SOOT_H = 128
export const PUFF_PX = 64

// Soot over the whole cap seen from above: thick and black at both ends where it burned, thinning to flecks toward the middle. Colour and alpha.
const cloud = (x: number, y: number, cell: number, seed: number): number => {
  const gx = x / cell
  const gy = y / cell
  const ix = Math.floor(gx)
  const iy = Math.floor(gy)
  const fx = smooth(gx - ix)
  const fy = smooth(gy - iy)
  const a = hash01(ix, iy, seed)
  const b = hash01(ix + 1, iy, seed)
  const c = hash01(ix, iy + 1, seed)
  const d = hash01(ix + 1, iy + 1, seed)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t
const BURNS: [number, number, number][] = [[-58, 12, 9], [30, -14, 7], [64, 16, 5], [-20, -20, 4]]

export function sootPixels(w = SOOT_W, h = SOOT_H): Uint8Array {
  const data = new Uint8Array(w * h * 4)
  const k = w / 256
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = ((x + 0.5) / w - 0.5) * CAP_W
      const py = ((y + 0.5) / h - 0.5) * CAP_H
      const big = cloud(x, y, 22 * k, 5)
      const mid = cloud(x, y, 8 * k, 7)
      const fine = cloud(x, y, 2.5 * k, 11)
      const edge = (px > 0 ? 88 : 78) + (big - 0.5) * 44 + (mid - 0.5) * 16 + 6 * Math.sin(py * 0.2 + (px > 0 ? 1.1 : 2.6))
      let d = smooth((Math.abs(px) - edge) / 18)
      const reach = smooth((Math.abs(px) - edge + 40) / 40)
      d = Math.max(d, reach * smooth((fine * 0.6 + mid * 0.4 - 0.52) / 0.12) * 0.8)
      let ash = smooth(1 - Math.abs(Math.abs(px) - edge + 4) / 9) * smooth((fine - 0.5) / 0.2)
      for (const [hx, hy, hr] of BURNS) {
        const far = Math.hypot(px - hx, py - hy) + (mid - 0.5) * 7
        d = Math.max(d, 1 - smooth((far - hr * 0.7) / (hr * 0.5)))
        ash = Math.max(ash, smooth(1 - Math.abs(far - hr * 1.15) / 3.5) * smooth((fine - 0.35) / 0.3))
      }
      const i = (y * w + x) * 4
      const tone = 7 + Math.round(10 * (1 - clamp(d)) + 7 * fine)
      const grey = 96 + Math.round(60 * fine)
      const k2 = clamp(ash) * 0.85
      data[i] = Math.round(mix(tone + 5, grey, k2))
      data[i + 1] = Math.round(mix(tone + 2, grey - 2, k2))
      data[i + 2] = Math.round(mix(tone, grey - 6, k2))
      data[i + 3] = Math.round(255 * Math.max(clamp(d) * 0.98, k2 * 0.8))
    }
  }
  return data
}

// Smoke along a wisp: streaks that run with it and close on themselves top to bottom, so the picture can slide. Alpha only.
export function puffPixels(size = PUFF_PX): Uint8Array {
  const data = new Uint8Array(size * size * 4)
  const wrap = (x: number, y: number, cell: number, seed: number): number => {
    const n = size / cell
    const gy = y / cell
    const iy = Math.floor(gy)
    const fy = smooth(gy - iy)
    const gx = x / (cell / 2)
    const ix = Math.floor(gx)
    const fx = smooth(gx - ix)
    const at = (cx: number, cy: number): number => hash01(cx, ((cy % n) + n) % n, seed)
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * fx
    const low = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * fx
    return top + (low - top) * fy
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const v = 20 + Math.round(220 * clamp(0.5 + 0.5 * wrap(x, y, 32, 23) + 0.3 * (wrap(x, y, 8, 29) - 0.5)))
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }
  }
  return data
}

let sootMade: THREE.DataTexture | null = null
let puffMade: THREE.DataTexture | null = null
let sootMaterial: THREE.MeshBasicMaterial | null = null
let chipMaterial: THREE.MeshPhysicalMaterial | null = null

function texture(pixels: Uint8Array, w: number, h: number, colour: boolean): THREE.DataTexture {
  const t = new THREE.DataTexture(pixels, w, h, THREE.RGBAFormat)
  if (colour) t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  t.needsUpdate = true
  return t
}

const soot = (): THREE.MeshBasicMaterial => {
  if (!sootMade) {
    sootMade = texture(sootPixels(), SOOT_W, SOOT_H, true)
    sootMade.repeat.set(1 / CAP_W, -1 / CAP_H)
    sootMade.offset.set(0.5, 0.5)
  }
  sootMaterial ??= new THREE.MeshBasicMaterial({ map: sootMade, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
  return sootMaterial
}

const chipStuff = (): THREE.MeshPhysicalMaterial => {
  chipMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0xe9e6e0, THREE.SRGBColorSpace), roughness: 0.62, metalness: 0, specularIntensity: 0.5 }))
  return chipMaterial
}

let crackMaterial: THREE.MeshPhysicalMaterial | null = null
const crackStuff = (): THREE.MeshPhysicalMaterial => {
  crackMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x2b2622, THREE.SRGBColorSpace), roughness: 0.9, metalness: 0, specularIntensity: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }))
  return crackMaterial
}

const CHIPS = 14

export function crackGeometry(): THREE.BufferGeometry {
  const runs = crackRuns().map((r, i) => ({ ...r, i })).sort((a, b) => a.at - b.at)
  const pos: number[] = []
  for (const r of runs) {
    const dx = r.x1 - r.x0
    const dy = r.y1 - r.y0
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const parts = Math.max(2, Math.round(len / 5))
    let px = r.x0
    let py = r.y0
    let pw = r.wide * (1 - r.at * 0.5)
    for (let k = 1; k <= parts; k++) {
      const t = k / parts
      const j = k === parts ? 0 : (hash01(r.i, k, 31) - 0.5) * 2.4
      const qx = r.x0 + dx * t + nx * j
      const qy = r.y0 + dy * t + ny * j
      const qw = Math.max(0.35, r.wide * (1 - (r.at + (1 - r.at) * t * 0.5) * 0.7) * (0.7 + 0.6 * hash01(r.i, k, 37)))
      const ax = px - nx * pw * 0.5
      const ay = py - ny * pw * 0.5
      const bx = px + nx * pw * 0.5
      const by = py + ny * pw * 0.5
      const cx = qx - nx * qw * 0.5
      const cy = qy - ny * qw * 0.5
      const ex = qx + nx * qw * 0.5
      const ey = qy + ny * qw * 0.5
      pos.push(ax, -ay, 0, bx, -by, 0, cx, -cy, 0, bx, -by, 0, ex, -ey, 0, cx, -cy, 0)
      px = qx
      py = qy
      pw = qw
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const nor = new Float32Array(pos.length)
  for (let i = 2; i < nor.length; i += 3) nor[i] = 1
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  return g
}

interface Chip { fx: number; fy: number; tx: number; ty: number; size: number; turn: number; tip: number }

function chipPlaces(): Chip[] {
  const out: Chip[] = []
  const r = HOLE_H / 2
  const half = HOLE_W / 2 - r
  for (let i = 0; i < CHIPS; i++) {
    const a = (i / CHIPS) * Math.PI * 2 + hash01(i, 2, 41) * 0.3
    const c = Math.cos(a)
    const s = Math.sin(a)
    const ex = c * (half + r)
    const ey = s * r
    const far = 6 + hash01(i, 3, 43) ** 2 * 44
    out.push({ fx: ex * 0.96, fy: ey * 0.9, tx: ex + c * far, ty: ey + s * far * 0.9, size: 1.6 + hash01(i, 4, 47) * 3.4, turn: hash01(i, 5, 53) * 6.283, tip: (hash01(i, 6, 59) - 0.5) * 0.9 })
  }
  return out
}

function rim(): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const ring = sweep(roundedRect(HOLE_W, HOLE_H, HOLE_H / 2, 20), profile([[0.25, -4.9, true], [0.25, -1.7], [0.9, -1.0], [4.4, -1.0], [6.4, -2.6], [6.6, -6.4, true]]), false)
  root.add(mesh(ring, m.aluminiumEdge, false, true))
  const cracks = mesh(crackGeometry(), crackStuff(), false, false)
  cracks.position.z = 0.12
  root.add(cracks)
  const chips = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), chipStuff(), CHIPS)
  chips.castShadow = true
  chips.receiveShadow = true
  chips.frustumCulled = false
  root.add(chips)
  root.userData.r = { cracks, chips, places: chipPlaces(), last: -1 }
  return root
}

const dummy = new THREE.Object3D()

function poseRim(o: THREE.Object3D, s: Shape): void {
  const d = o.userData.r as { cracks: THREE.Mesh; chips: THREE.InstancedMesh; places: Chip[]; last: number }
  const grow = clamp(s.v?.[0] ?? 1)
  const all = d.cracks.geometry.getAttribute('position').count
  d.cracks.geometry.setDrawRange(0, Math.floor((all / 6) * grow) * 6)
  if (Math.abs(grow - d.last) < 1e-4) return
  d.last = grow
  d.places.forEach((c, i) => {
    const e = 1 - Math.pow(1 - grow, 2)
    const hop = Math.sin(Math.PI * grow)
    dummy.position.set(c.fx + (c.tx - c.fx) * e, -(c.fy + (c.ty - c.fy) * e), -3 * (1 - e) + c.size * 0.3 + hop * (8 + c.size * 3))
    dummy.rotation.set(c.tip + hop * 2, c.tip * 0.6, c.turn + grow * 3)
    dummy.scale.set(c.size, c.size * 0.62, c.size * 0.3)
    dummy.updateMatrix()
    d.chips.setMatrixAt(i, dummy.matrix)
  })
  d.chips.instanceMatrix.needsUpdate = true
}

function scorch(s: Shape, ctx: RealContext): THREE.Object3D {
  const o = new THREE.Group()
  const made = controls.make({ ...s, id: 'boss-cap-skin', part: 'shell', kind: 'capsule', role: 'button', tone: 'accent', w: CAP_W, h: CAP_H, z0: 0, z1: BODY_Z.capTall, rot: 0, v: undefined }, ctx)
  let skin: THREE.BufferGeometry | null = null
  made.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh && !skin) skin = m.geometry
  })
  const m = mesh(skin ?? new THREE.PlaneGeometry(CAP_W, CAP_H), soot(), false, false)
  m.scale.set(1.002, 1.006, 1.012)
  o.add(m)
  return o
}

const WISP_N = 30
const WISP_ACROSS = [0, 0.55, 1, 0.55, 0]
let wispMaterial: THREE.MeshBasicMaterial | null = null

export function wispPoint(u: number, t: number, w: number): [number, number, number, number] {
  const sway = Math.sin(u * 5.1 + w * 2.3 - t * 1.1) * 18 * u + Math.sin(u * 11 + w - t * 1.9) * 4 * u
  return [sway + u * 30, Math.pow(u, 1.4) * 190, u * 110, 13 + 44 * Math.pow(u, 0.8)]
}

function smoke(): THREE.Object3D {
  if (!puffMade) {
    puffMade = texture(puffPixels(), PUFF_PX, PUFF_PX, false)
    puffMade.wrapT = THREE.RepeatWrapping
  }
  wispMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.2, 0.205), alphaMap: puffMade, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  const across = WISP_ACROSS.length
  const count = (WISP_N + 1) * across
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2))
  const colour = new Float32Array(count * 4)
  const index: number[] = []
  for (let i = 0; i <= WISP_N; i++) {
    const u = i / WISP_N
    const along = smooth(u / 0.06) * Math.pow(1 - u, 0.9)
    for (let j = 0; j < across; j++) {
      const n = (i * across + j) * 4
      colour[n] = 1
      colour[n + 1] = 1
      colour[n + 2] = 1
      colour[n + 3] = along * WISP_ACROSS[j]!
      if (i < WISP_N && j < across - 1) {
        const a = i * across + j
        index.push(a, a + 1, a + across, a + 1, a + across + 1, a + across)
      }
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(colour, 4))
  g.setIndex(index)
  const m = mesh(g, wispMaterial, false, false)
  m.frustumCulled = false
  const o = new THREE.Group()
  o.add(m)
  o.userData.wisp = g
  return o
}

function poseSmoke(o: THREE.Object3D, s: Shape): void {
  const t = s.v?.[0] ?? 0
  const w = s.v?.[1] ?? 0
  const g = o.userData.wisp as THREE.BufferGeometry
  const p = g.getAttribute('position') as THREE.BufferAttribute
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  const across = WISP_ACROSS.length
  for (let i = 0; i <= WISP_N; i++) {
    const u = i / WISP_N
    const [x, y, z, wide] = wispPoint(u, t, w)
    const [bx, by] = wispPoint(Math.min(1, u + 0.02), t, w)
    const [ax, ay] = wispPoint(Math.max(0, u - 0.02), t, w)
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = (by - ay) / len
    const ny = -(bx - ax) / len
    for (let j = 0; j < across; j++) {
      const k = j / (across - 1) - 0.5
      p.setXYZ(i * across + j, x + nx * wide * k, y + ny * wide * k, z)
      uv.setXY(i * across + j, k + 0.5 + w * 0.31, u * 1.6 - t * 0.21 + w * 0.37)
    }
  }
  p.needsUpdate = true
  uv.needsUpdate = true
}

export const bossTransform: PartMaker = {
  key(s: Shape): string | null {
    if (s.role === 'bossRim') return 'rim'
    if (s.role === 'bossScorch') return 'scorch'
    if (s.role === 'bossSmoke') return 'smoke'
    if (s.id.includes('-crack-')) return ''
    return null
  },
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    if (s.role === 'bossRim') return rim()
    if (s.role === 'bossScorch') return scorch(s, ctx)
    return smoke()
  },
  pose(o: THREE.Object3D, s: Shape): void {
    if (s.role === 'bossRim') poseRim(o, s)
    else if (s.role === 'bossScorch') {
      const t = s.v?.[1] ?? 0
      o.position.y += BODY_Z.capTall * Math.sin(t)
      o.position.z += BODY_Z.capTall * (1 - Math.cos(t))
      soot().opacity = clamp(s.v?.[0] ?? 1)
    } else if (s.role === 'bossSmoke') poseSmoke(o, s)
  },
  drop(o: THREE.Object3D): void {
    const g = o.userData.wisp as THREE.BufferGeometry | undefined
    if (g) g.dispose()
  }
}
