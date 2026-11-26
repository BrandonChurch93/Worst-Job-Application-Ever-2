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
import { holeAt, pillGeometry, LIP, PILL } from './pill'

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
const CHAR: [number, number, number][] = [[-CAP_W / 2 + 26, 2, 34], [-CAP_W / 2 + 52, -12, 15], [CAP_W / 2 - 24, -2, 31], [CAP_W / 2 - 50, 14, 16], [CAP_W / 2 - 62, -6, 7]]
const SPLITS: [number, number, number, number][] = [[-96, -6, -74, -17], [-74, -17, -62, -15], [-92, 9, -76, 20], [84, 10, 66, 22], [66, 22, 58, 19], [88, -12, 72, -22]]

const toSplit = (px: number, py: number): number => {
  let best = 99
  for (const [x0, y0, x1, y1] of SPLITS) {
    const dx = x1 - x0
    const dy = y1 - y0
    const t = clamp(((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy))
    best = Math.min(best, Math.hypot(px - x0 - dx * t, py - y0 - dy * t) - 1.5 * (1 - t))
  }
  return best
}

export function sootPixels(w = SOOT_W, h = SOOT_H): Uint8Array {
  const data = new Uint8Array(w * h * 4)
  const k = w / 256
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = ((x + 0.5) / w - 0.5) * CAP_W
      const py = ((y + 0.5) / h - 0.5) * CAP_H
      const big = cloud(x, y, 20 * k, 5)
      const mid = cloud(x, y, 7 * k, 7)
      const fine = cloud(x, y, 2.2 * k, 11)
      let near = 99
      for (const [cx, cy, r] of CHAR) near = Math.min(near, Math.hypot(px - cx, (py - cy) * 1.15) - r)
      const lip = near + (big - 0.5) * 20 + (mid - 0.5) * 12
      let d = 1 - smooth((lip + 1.5) / 3)
      const flake = smooth((fine * 0.55 + mid * 0.45 - 0.56) / 0.04) * (1 - smooth((lip - 2) / 16))
      d = Math.max(d, flake)
      d = Math.max(d, 1 - smooth(toSplit(px, py) / 1.1))
      const halo = (1 - smooth(lip / 15)) * 0.34
      const inside = smooth(-lip / 8)
      const plate = cloud(x, y, 4.5 * k, 17)
      const seam = 1 - smooth(Math.abs(plate - 0.5) / 0.035)
      const ash = clamp(inside * smooth((mid * 0.6 + fine * 0.4 - 0.63) / 0.07) * 0.6 + smooth(1 - Math.abs(lip + 2.5) / 2.5) * smooth((fine - 0.5) / 0.2) * 0.7)
      const bare = inside * seam * smooth((big - 0.5) / 0.2) * 0.45
      const i = (y * w + x) * 4
      const tone = 9 + Math.round(9 * fine)
      const grey = 40 + Math.round(34 * fine)
      const hole = holeAt(px, -py).d
      const pit = 1 - smooth((hole - 0.86) / 0.1)
      const torn = hole < LIP.out ? smooth((hole - 0.9) / 0.1) * (1 - smooth((hole - 1.12) / (LIP.out - 1.12))) * (0.55 + 0.45 * smooth((fine - 0.35) / 0.3)) * smooth(((CAP_W / 2 - 21.5 - Math.abs(px)) / 14 + 0.9) / 0.8) : 0
      data[i] = Math.round(mix(mix(tone + 4, grey, ash), 5, pit))
      data[i + 1] = Math.round(mix(mix(tone + 2, grey - 2, ash), 4, pit))
      data[i + 2] = Math.round(mix(mix(tone, grey - 5, ash), 4, pit))
      data[i + 3] = Math.round(255 * Math.max(pit, Math.max(clamp(d) * 0.985 * (1 - bare), halo) * (1 - 0.9 * torn)))
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
      const v = 95 + Math.round(160 * clamp(0.5 + 0.5 * wrap(x, y, 32, 23) + 0.3 * (wrap(x, y, 8, 29) - 0.5)))
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

let charMaterial: THREE.MeshPhysicalMaterial | null = null
const charStuff = (): THREE.MeshPhysicalMaterial => {
  soot()
  charMaterial ??= studio(new THREE.MeshPhysicalMaterial({ map: sootMade, transparent: true, depthWrite: false, roughness: 0.86, metalness: 0, specularIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }))
  return charMaterial
}

const chipStuff = (): THREE.MeshPhysicalMaterial => {
  chipMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0xe9e6e0, THREE.SRGBColorSpace), roughness: 0.62, metalness: 0, specularIntensity: 0.5 }))
  return chipMaterial
}

let crackMaterial: THREE.MeshPhysicalMaterial | null = null
const crackStuff = (): THREE.MeshPhysicalMaterial => {
  crackMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x33231b, THREE.SRGBColorSpace), roughness: 0.9, metalness: 0, specularIntensity: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }))
  return crackMaterial
}

const CHIPS = 18

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
    let pw = r.wide * 2.5 * (1 - r.at * 0.5)
    for (let k = 1; k <= parts; k++) {
      const t = k / parts
      const j = k === parts ? 0 : (hash01(r.i, k, 31) - 0.5) * 2.4
      const qx = r.x0 + dx * t + nx * j
      const qy = r.y0 + dy * t + ny * j
      const qw = Math.max(0.6, r.wide * 2.5 * (1 - (r.at + (1 - r.at) * t * 0.5) * 0.82) * (0.7 + 0.6 * hash01(r.i, k, 37)))
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
    const far = 10 + hash01(i, 3, 43) ** 1.5 * 78
    out.push({ fx: ex * 0.96, fy: ey * 0.9, tx: ex + c * far, ty: ey + s * far * 0.9, size: 2.8 + hash01(i, 4, 47) ** 2 * 8.4, turn: hash01(i, 5, 53) * 6.283, tip: (hash01(i, 6, 59) - 0.5) * 0.9 })
  }
  return out
}

let wallMaterial: THREE.MeshPhysicalMaterial | null = null
let floorMaterial: THREE.MeshPhysicalMaterial | null = null
let collarMaterial: THREE.MeshPhysicalMaterial | null = null
let lipMaterial: THREE.MeshPhysicalMaterial | null = null
const pitStuff = (): { wall: THREE.MeshPhysicalMaterial; floor: THREE.MeshPhysicalMaterial; collar: THREE.MeshPhysicalMaterial; lip: THREE.MeshPhysicalMaterial } => {
  const grain = materials().ceramic.normalMap
  wallMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x34312e, THREE.SRGBColorSpace), roughness: 0.96, metalness: 0, specularIntensity: 0.2, normalMap: grain, normalScale: new THREE.Vector2(0.3, 0.3) }))
  floorMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x0d0c0c, THREE.SRGBColorSpace), roughness: 0.95, metalness: 0, specularIntensity: 0.1 }))
  if (!collarMaterial) {
    collarMaterial = materials().aluminiumSatin.clone()
    collarMaterial.color.setHex(0xbfc0be, THREE.SRGBColorSpace)
    collarMaterial.roughness = 0.52
    collarMaterial.metalness = 0.3
    collarMaterial.envMapIntensity = 0.6
    collarMaterial.normalMap = grain
    collarMaterial.normalScale = new THREE.Vector2(0.1, 0.1)
    collarMaterial.roughnessMap = null
    studio(collarMaterial)
  }
  lipMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x403d3a, THREE.SRGBColorSpace), roughness: 0.9, metalness: 0.2, specularIntensity: 0.3, normalMap: grain, normalScale: new THREE.Vector2(0.55, 0.55) }))
  return { wall: wallMaterial, floor: floorMaterial, collar: collarMaterial, lip: lipMaterial }
}

export const PIT = { collar: 15, wallTo: 25, deep: -58 }

function rim(): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const line = roundedRect(HOLE_W, HOLE_H, HOLE_H / 2, 22)
  const ring = sweep(line, profile([[-5.4, 0, true], [-5.4, 0.7], [-4.9, 1.25], [-4, 1.5], [3.2, 1.5], [4.2, 1.2], [4.9, 0.4], [5.2, -0.8, true]]), false)
  const pit = pitStuff()
  root.add(mesh(ring, pit.collar, false, true))
  root.add(mesh(sweep(line, profile([[5, -0.6, true], [6.4, -5.4], [8.6, -9.6], [PIT.collar, -12, true]]), false), pit.lip, false, true))
  const wall = sweep(line, profile([[PIT.collar - 0.4, -12, true], [PIT.collar + 3, -17], [PIT.collar + 7, -36], [PIT.wallTo, PIT.deep, true]]), false)
  root.add(mesh(wall, pit.wall, false, true))
  root.add(mesh(sweep(roundedRect(HOLE_W - PIT.wallTo * 2 + 2, HOLE_H - PIT.wallTo * 2 + 2, HOLE_H / 2 - PIT.wallTo + 1, 14), [{ inset: 0, z: PIT.deep, out: 0, up: 1 }], true), pit.floor, false, true))
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
  const pill = mesh(pillGeometry(), charStuff(), false, false)
  pill.visible = false
  o.add(pill)
  o.userData.skin = m
  o.userData.pill = pill
  return o
}

const WISP_N = 30
const WISP_ACROSS = [0, 0.75, 1, 0.75, 0]
let wispMaterial: THREE.MeshBasicMaterial | null = null

export function wispPoint(u: number, t: number, w: number): [number, number, number, number] {
  const sway = Math.sin(u * 7.4 + w * 2.3 - t * 1.1) * 26 * Math.pow(u, 0.8) + Math.sin(u * 16 + w - t * 1.9) * 12 * u
  return [sway + u * 22, Math.pow(u, 1.3) * 190, u * 110, 6 + 22 * Math.pow(u, 0.9)]
}

function smoke(): THREE.Object3D {
  if (!puffMade) {
    puffMade = texture(puffPixels(), PUFF_PX, PUFF_PX, false)
    puffMade.wrapT = THREE.RepeatWrapping
  }
  wispMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(0.12, 0.12, 0.125), alphaMap: puffMade, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  const across = WISP_ACROSS.length
  const count = (WISP_N + 1) * across
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2))
  const colour = new Float32Array(count * 4)
  const index: number[] = []
  for (let i = 0; i <= WISP_N; i++) {
    const u = i / WISP_N
    const along = smooth((u - 0.02) / 0.16) * Math.pow(1 - u, 0.55)
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
      soot().opacity = smooth(((s.v?.[0] ?? 1) - 0.8) / 0.2)
      charStuff().opacity = soot().opacity
      const down = s.v?.[2] ?? 0
      const pill = o.userData.pill as THREE.Mesh
      pill.visible = down > 0
      ;(o.userData.skin as THREE.Mesh).visible = down <= 0
      pill.scale.set(1.002, 1.006, ((s.z1 - s.z0 - 0.3) / PILL.tall) * 1.012)
    } else if (s.role === 'bossSmoke') poseSmoke(o, s)
  },
  drop(o: THREE.Object3D): void {
    const g = o.userData.wisp as THREE.BufferGeometry | undefined
    if (g) g.dispose()
  }
}
