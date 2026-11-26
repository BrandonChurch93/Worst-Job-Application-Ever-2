import * as THREE from 'three'
import type { PartMaker } from '../../real/types'
import type { Shape } from '../../stage/types'
import { hash01 } from '../../core/random'
import { materials } from '../../shell/materials'
import { profile, roundedRect, sweep } from '../../shell/solids'
import { studio } from '../../post/studio'
import { HOLE_H, HOLE_W, crackRuns } from '../body'
import { mesh } from './body-kit'

const clamp = (t: number): number => Math.min(1, Math.max(0, t))
const smooth = (t: number): number => { const u = clamp(t); return u * u * (3 - 2 * u) }

export const SOOT_PX = 128
export const PUFF_PX = 64

// Soot seen from above: a ragged black blot, dense in the middle, breaking into flecks toward its rim. Alpha only.
export function sootPixels(size = SOOT_PX): Uint8Array {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size - 0.5
      const v = (y + 0.5) / size - 0.5
      const a = Math.atan2(v, u)
      const lobe = 0.38 + 0.05 * Math.sin(a * 3 + 1.3) + 0.035 * Math.sin(a * 7 + 0.4) + 0.02 * Math.sin(a * 13 + 2.2)
      const d = Math.hypot(u, v) / lobe
      const coarse = hash01(Math.floor(x / 6), Math.floor(y / 6), 5)
      const fine = hash01(x, y, 11)
      let alpha = 1 - smooth((d - 0.35) / 0.65)
      alpha *= 0.72 + 0.28 * coarse
      if (d > 0.6) alpha *= fine > 0.35 + (d - 0.6) * 1.2 ? 1 : 0.25
      const i = (y * size + x) * 4
      const tone = 10 + Math.round(26 * smooth((d - 0.5) / 0.5) * (0.6 + 0.4 * coarse))
      data[i] = tone + 6
      data[i + 1] = tone + 2
      data[i + 2] = tone
      data[i + 3] = Math.round(255 * clamp(alpha) * 0.94)
    }
  }
  return data
}

// A puff of smoke seen from above: thick in the middle, gone at the edge. Alpha only.
export function puffPixels(size = PUFF_PX): Uint8Array {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot((x + 0.5) / size - 0.5, (y + 0.5) / size - 0.5) * 2
      const i = (y * size + x) * 4
      const soft = Math.pow(clamp(1 - d), 1.6) * (0.85 + 0.15 * hash01(Math.floor(x / 4), Math.floor(y / 4), 23))
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.round(255 * soft)
    }
  }
  return data
}

let sootMade: THREE.DataTexture | null = null
let puffMade: THREE.DataTexture | null = null
let sootMaterial: THREE.MeshBasicMaterial | null = null
let chipMaterial: THREE.MeshPhysicalMaterial | null = null

function texture(pixels: Uint8Array, size: number, colour: boolean): THREE.DataTexture {
  const t = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat)
  if (colour) t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  t.needsUpdate = true
  return t
}

const soot = (): THREE.MeshBasicMaterial => {
  sootMade ??= texture(sootPixels(), SOOT_PX, true)
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

let plane: THREE.BufferGeometry | null = null
let ball: THREE.BufferGeometry | null = null

function scorch(): THREE.Object3D {
  plane ??= new THREE.PlaneGeometry(1, 1)
  const o = new THREE.Group()
  o.add(mesh(plane, soot(), false, false))
  return o
}

function smoke(): THREE.Object3D {
  if (!ball) {
    ball = new THREE.SphereGeometry(0.5, 20, 14)
    const p = ball.getAttribute('position')
    const u = ball.getAttribute('uv')
    for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) + 0.5, p.getY(i) + 0.5)
  }
  puffMade ??= texture(puffPixels(), PUFF_PX, false)
  const stuff = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.2, 0.21), alphaMap: puffMade, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })
  const o = new THREE.Group()
  o.add(mesh(ball, stuff, false, false))
  o.userData.stuff = stuff
  return o
}

export const bossTransform: PartMaker = {
  key(s: Shape): string | null {
    if (s.role === 'bossRim') return 'rim'
    if (s.role === 'bossScorch') return 'scorch'
    if (s.role === 'bossSmoke') return 'smoke'
    if (s.id.includes('-crack-')) return ''
    return null
  },
  make(s: Shape): THREE.Object3D {
    if (s.role === 'bossRim') return rim()
    if (s.role === 'bossScorch') return scorch()
    return smoke()
  },
  pose(o: THREE.Object3D, s: Shape): void {
    if (s.role === 'bossRim') poseRim(o, s)
    else if (s.role === 'bossScorch') {
      const m = o.children[0] as THREE.Mesh
      m.scale.set(s.w, s.h, 1)
      m.position.z = s.z1 - s.z0
      soot().opacity = clamp(s.v?.[0] ?? 1)
    } else if (s.role === 'bossSmoke') {
      const u = s.v?.[0] ?? 0
      const m = o.children[0] as THREE.Mesh
      m.scale.setScalar(s.w)
      m.position.z = s.w / 2
      ;(o.userData.stuff as THREE.MeshBasicMaterial).opacity = 0.55 * smooth(u / 0.12) * Math.pow(1 - u, 1.4)
    }
  },
  drop(o: THREE.Object3D): void {
    const stuff = o.userData.stuff as THREE.Material | undefined
    if (stuff) stuff.dispose()
  }
}
