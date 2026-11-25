import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'

const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

function noise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const a = hash01(x0, y0, seed)
  const b = hash01(x0 + 1, y0, seed)
  const c = hash01(x0, y0 + 1, seed)
  const d = hash01(x0 + 1, y0 + 1, seed)
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

function picture(size: number, colour: boolean, paint: (u: number, v: number) => [number, number, number, number]): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = paint(((x + 0.5) / size) * 2 - 1, ((y + 0.5) / size) * 2 - 1)
      const i = (y * size + x) * 4
      for (let k = 0; k < 4; k++) data[i + k] = Math.round(Math.min(1, Math.max(0, p[k]!)) * 255)
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

// The muzzle flash: a hot core and thin rays of unequal length. Grey, drawn additively.
function starPicture(seed: number): THREE.DataTexture {
  const rays = 9
  const len: number[] = []
  const dir: number[] = []
  for (let i = 0; i < rays; i++) {
    dir.push((i / rays) * Math.PI * 2 + (hash01(i, 1, seed) - 0.5) * 0.5)
    len.push(0.35 + 0.6 * hash01(i, 2, seed))
  }
  return picture(128, false, (u, v) => {
    const r = Math.hypot(u, v)
    const a = Math.atan2(v, u)
    let ray = 0
    for (let i = 0; i < rays; i++) {
      let d = Math.abs(a - dir[i]!) % (Math.PI * 2)
      if (d > Math.PI) d = Math.PI * 2 - d
      const across = Math.sin(Math.min(d, Math.PI / 2)) * r
      const along = Math.max(0, 1 - r / len[i]!)
      ray = Math.max(ray, Math.exp(-(across * across) / 0.0009) * along * along)
    }
    const core = Math.exp(-(r * r) / 0.02)
    const haze = Math.exp(-(r * r) / 0.12) * 0.18
    const g = Math.min(1, core + ray * 0.9 + haze) * smooth((1 - r) / 0.15)
    return [g, g, g, 1]
  })
}

// A soft puff of steam or smoke: its alpha only, read from the green channel.
function puffPicture(seed: number): THREE.DataTexture {
  return picture(64, false, (u, v) => {
    const r = Math.hypot(u, v)
    const n = noise(u * 2.2 + 7, v * 2.2 + 3, seed) * 0.6 + noise(u * 5 + 1, v * 5 + 9, seed + 5) * 0.4
    const a = smooth((1 - r - (1 - n) * 0.35) / 0.6)
    return [a, a, a, 1]
  })
}

// A scorch: a charred middle with a ragged edge, a brown ring that thins out, a few specks.
function scorchPicture(seed: number): THREE.DataTexture {
  return picture(128, true, (u, v) => {
    const r = Math.hypot(u, v)
    const a = Math.atan2(v, u)
    const ragged = noise(Math.cos(a) * 2.4 + 5, Math.sin(a) * 2.4 + 5, seed) * 0.5 + noise(Math.cos(a) * 6 + 9, Math.sin(a) * 6 + 9, seed + 3) * 0.3
    const edge = 0.3 + ragged * 0.22
    const char = 1 - smooth((r - edge) / 0.1)
    const ring = (1 - smooth((r - edge) / (0.7 - edge))) * 0.7
    const fine = noise(u * 22, v * 22, seed + 11)
    const speck = fine > 0.8 && r < 0.85 ? (fine - 0.8) * 3 * (1 - r) : 0
    const pit = smooth((0.16 - r) / 0.12) * 0.35
    const alpha = Math.max(char * 0.96, ring * (0.75 + fine * 0.25), speck) * smooth((1 - r) / 0.1)
    const k = char
    return [0.46 * (1 - k) + 0.05 * k + pit * 0.05, 0.25 * (1 - k) + 0.043 * k + pit * 0.03, 0.1 * (1 - k) + 0.038 * k, alpha]
  })
}

export const GLOW = {
  boltHead: [16, 10, 4.5] as [number, number, number],
  boltTail: [3.2, 1.0, 0.18] as [number, number, number],
  flash: [9, 3.6, 0.9] as [number, number, number],
  chargeLow: [6, 2.5, 0.6] as [number, number, number],
  chargeHigh: [16, 7, 2] as [number, number, number],
  hot: [0.42, 0.03, 0.006] as [number, number, number]
}

export const EMIT = {
  bolt: { colour: [1, 0.42, 0.1] as [number, number, number], power: 1.0, reach: 260 },
  flash: { colour: [1, 0.5, 0.15] as [number, number, number], power: 2.2, reach: 380 },
  charge: { colour: [1, 0.45, 0.12] as [number, number, number], power: 0.6, reach: 160 },
  hot: { colour: [1, 0.12, 0.03] as [number, number, number], power: 0.35, reach: 140 }
}

export interface Fx {
  star: THREE.DataTexture
  puff: THREE.DataTexture
  scorch: THREE.DataTexture
  quad: THREE.PlaneGeometry
  head: THREE.BufferGeometry
  tail: THREE.BufferGeometry
  orb: THREE.SphereGeometry
  headMaterial: THREE.MeshBasicMaterial
  tailMaterial: THREE.MeshBasicMaterial
  flashMaterial: THREE.MeshBasicMaterial
  puffMaterial: THREE.MeshBasicMaterial
  scorchMaterial: THREE.MeshBasicMaterial
}

// The tail of a bolt: a cone that thins to nothing behind the head, brightest at the head.
function tailGeometry(length: number, radius: number, segments = 10, steps = 8): THREE.BufferGeometry {
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (let k = 0; k <= steps; k++) {
    const t = k / steps
    const r = radius * (1 - t) ** 1.4
    const fade = (1 - t) ** 2
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2
      pos.push(-t * length, Math.cos(a) * r, Math.sin(a) * r)
      col.push(fade, fade, fade)
    }
  }
  for (let k = 0; k < steps; k++) {
    for (let i = 0; i < segments; i++) {
      const a = k * segments + i
      const b = k * segments + ((i + 1) % segments)
      idx.push(a, b, a + segments, b, b + segments, a + segments)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// The head of a bolt: white hot on top, cooling to orange at its rim, as the camera above sees it.
function headGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 20, 12)
  g.rotateX(Math.PI / 2)
  const p = g.getAttribute('position')
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const t = smooth(Math.max(0, p.getZ(i)) / 0.75)
    col[i * 3] = 0.42 + 0.58 * t
    col[i * 3 + 1] = 0.16 + 0.84 * t
    col[i * 3 + 2] = 0.05 + 0.95 * t
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

let made: Fx | null = null

export function fx(): Fx {
  if (made) return made
  const seed = config.seed + 401
  const star = starPicture(seed)
  const puff = puffPicture(seed + 1)
  const scorch = scorchPicture(seed + 2)
  const add = { blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false }
  made = {
    star, puff, scorch,
    quad: new THREE.PlaneGeometry(1, 1),
    head: headGeometry(),
    tail: tailGeometry(1, 1),
    orb: new THREE.SphereGeometry(1, 16, 10),
    headMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...GLOW.boltHead), vertexColors: true, toneMapped: false }),
    tailMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...GLOW.boltTail), vertexColors: true, ...add }),
    flashMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...GLOW.flash), map: star, ...add }),
    puffMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.8, 0.8), alphaMap: puff, transparent: true, depthWrite: false, toneMapped: false }),
    scorchMaterial: new THREE.MeshBasicMaterial({ map: scorch, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
  }
  return made
}

export const OVER = 900000

export function overlay(m: THREE.Mesh, n = 0): THREE.Mesh {
  m.castShadow = false
  m.receiveShadow = false
  m.userData.order = OVER + n
  m.renderOrder = OVER + n
  return m
}
