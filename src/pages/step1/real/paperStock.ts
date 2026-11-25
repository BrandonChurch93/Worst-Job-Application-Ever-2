import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import { creaseExact } from './paperSolve'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

export const STOCK = { seed: config.seed + 1907, fibrePx: 512, creaseW: 512, creaseH: 704, fibreTile: 54, drawn: 220 }

// Paper fibre: short pale and dark strands laid every way over a faint cloud, as a colour picture that tiles.
export function fibreMap(size: number, seed: number): THREE.DataTexture {
  const f = new Float32Array(size * size)
  const strands = Math.round(size * size * 0.012)
  for (let n = 0; n < strands; n++) {
    const x0 = hash01(n, 1, seed) * size
    const y0 = hash01(n, 2, seed) * size
    const a = hash01(n, 3, seed) * Math.PI
    const len = 5 + hash01(n, 4, seed) * 22
    const tone = (hash01(n, 5, seed) - 0.42) * 0.6
    const bend = (hash01(n, 6, seed) - 0.5) * 0.06
    let x = x0
    let y = y0
    let dir = a
    for (let k = 0; k < len; k++) {
      const i = ((Math.floor(y) % size) + size) % size
      const j = ((Math.floor(x) % size) + size) % size
      f[i * size + j] = f[i * size + j]! + tone
      x += Math.cos(dir)
      y += Math.sin(dir)
      dir += bend
    }
  }
  const cell = (x: number, y: number, period: number, salt: number) => hash01(((x % period) + period) % period, ((y % period) + period) % period, seed + salt)
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const cloud = (x: number, y: number, freq: number, salt: number) => {
    const period = size / freq
    const fx = x / freq
    const fy = y / freq
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = smooth(fx - x0)
    const ty = smooth(fy - y0)
    const a = cell(x0, y0, period, salt)
    const b = cell(x0 + 1, y0, period, salt)
    const c = cell(x0, y0 + 1, period, salt)
    const d = cell(x0 + 1, y0 + 1, period, salt)
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const blur = (f[i]! * 2 + f[y * size + ((x + 1) % size)]! + f[((y + 1) % size) * size + x]!) / 4
      const v = 0.968 + blur * 0.035 + (cloud(x, y, 32, 3) - 0.5) * 0.012 + (cloud(x, y, 8, 5) - 0.5) * 0.008 + (hash01(x, y, seed + 9) - 0.5) * 0.02
      const c = Math.round(Math.min(1, Math.max(0.8, v)) * 255)
      data[i * 4] = c
      data[i * 4 + 1] = c
      data[i * 4 + 2] = c
      data[i * 4 + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

// The sheet's creases as a normal picture over the whole sheet, with a breath of fibre tooth in it.
export function creaseMap(w: number, h: number, seed: number, sheetW: number, sheetL: number, depth: number): THREE.DataTexture {
  const z = new Float32Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) z[y * w + x] = creaseExact(seed, x / (w - 1), y / (h - 1)) * depth
  const data = new Uint8Array(w * h * 4)
  const px = sheetW / w
  const py = sheetL / h
  const at = (x: number, y: number) => z[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]!
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) / (2 * px) + (hash01(x, y, seed + 31) - 0.5) * 0.05
      const dy = (at(x, y + 1) - at(x, y - 1)) / (2 * py) + (hash01(x, y, seed + 37) - 0.5) * 0.05
      const l = Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * w + x) * 4
      data[i] = Math.round((-dx / l) * 127.5 + 127.5)
      data[i + 1] = Math.round((-dy / l) * 127.5 + 127.5)
      data[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

export interface Stock {
  sheet: THREE.MeshPhysicalMaterial
  strip: THREE.MeshPhysicalMaterial
  print: THREE.MeshPhysicalMaterial
  fibre: THREE.DataTexture
  crease: THREE.DataTexture
  megabytes: number
}

let made: Stock | null = null

export function stock(sheetW: number, sheetL: number): Stock {
  if (made) return made
  const fibre = fibreMap(STOCK.fibrePx, STOCK.seed)
  fibre.repeat.set(sheetW / STOCK.fibreTile, sheetL / STOCK.fibreTile)
  const crease = creaseMap(STOCK.creaseW, STOCK.creaseH, STOCK.seed, STOCK.drawn, (STOCK.drawn * sheetL) / sheetW, 5)
  const base = { color: srgb(0xf3f3f1), roughness: 0.9, metalness: 0, specularIntensity: 0.35, side: THREE.DoubleSide }
  const sheet = studio(new THREE.MeshPhysicalMaterial({ ...base, map: fibre, normalMap: crease, normalScale: new THREE.Vector2(0.2, 0.2) }))
  const strip = studio(new THREE.MeshPhysicalMaterial({ ...base, vertexColors: true }))
  const print = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, specularIntensity: 0.3, vertexColors: true, side: THREE.DoubleSide }))
  print.polygonOffset = true
  print.polygonOffsetFactor = -2
  print.polygonOffsetUnits = -4
  const megabytes = ((STOCK.fibrePx * STOCK.fibrePx + STOCK.creaseW * STOCK.creaseH) * 4 * (4 / 3)) / (1024 * 1024)
  made = { sheet, strip, print, fibre, crease, megabytes }
  return made
}

export const INK = { title: srgb(0x2b2a28), bar: srgb(0x8d8d90), paper: srgb(0xf1f2f5) }
