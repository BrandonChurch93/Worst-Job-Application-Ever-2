import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import { fibreHeights } from './letterStock'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

export const INK = { seed: config.seed + 5303, w: 1024, h: 256, colour: 0xbe2110, pad: 14 }

// How much ink the rubber left at each place of the mark: less where the block rocked off the sheet, none in the paper's hollows.
export function inkCover(w: number, h: number, seed: number): Float32Array {
  const tooth = fibreHeights(512, seed)
  const out = new Float32Array(w * h)
  const ease = (t: number) => t * t * (3 - 2 * t)
  const cell = (x: number, y: number, salt: number) => hash01(x, y, seed + salt)
  const cloud = (x: number, y: number, freq: number, salt: number) => {
    const fx = x / freq
    const fy = y / freq
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = ease(fx - x0)
    const ty = ease(fy - y0)
    const a = cell(x0, y0, salt)
    const b = cell(x0 + 1, y0, salt)
    const c = cell(x0, y0 + 1, salt)
    const d = cell(x0 + 1, y0 + 1, salt)
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w
      const v = y / h
      const rock = 0.2 * ease(Math.min(1, Math.max(0, (0.34 - u) / 0.34))) * ease(Math.min(1, Math.max(0, (v - 0.2) / 0.8))) + 0.16 * ease(Math.min(1, Math.max(0, (u - 0.78) / 0.22))) * ease(Math.min(1, Math.max(0, (0.6 - v) / 0.6)))
      const press = 1.22 - rock - 0.4 * Math.pow(cloud(x, y, 150, 11), 2) - 0.16 * cloud(x, y, 34, 13)
      const t = tooth[(y % 512) * 512 + (x % 512)]!
      const hollow = Math.max(0, -t - 0.02 - 0.2 * (press - 0.6)) * 3.2
      const pin = hash01(x >> 1, y >> 1, seed + 17) < 0.03 + 0.26 * Math.max(0, 1 - press) ? 0.5 : 0
      const patch = 0.42 * ease(Math.min(1, Math.max(0, (cloud(x, y, 58, 23) - 0.72) / 0.14))) * (0.55 + 0.9 * cloud(x, y, 9, 29))
      const fleck = hash01(x >> 2, y >> 2, seed + 31) < 0.011 ? 0.85 * ease(1 - Math.min(1, Math.hypot((x & 3) - 1.5, (y & 3) - 1.5) / 2.4)) : 0
      out[y * w + x] = Math.min(1, Math.max(0, press - hollow - pin - patch - fleck + (cloud(x, y, 5, 19) - 0.5) * 0.2))
    }
  }
  return out
}

export interface Ink { material: THREE.MeshPhysicalMaterial; cover: THREE.DataTexture; megabytes: number }

let made: Ink | null = null

export function ink(): Ink {
  if (made) return made
  const { w, h } = INK
  const a = inkCover(w, h, INK.seed)
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const c = Math.round(a[i]! * 255)
      data[i * 4] = c
      data[i * 4 + 1] = c
      data[i * 4 + 2] = c
      data[i * 4 + 3] = 255
    }
  }
  const cover = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  cover.wrapS = THREE.ClampToEdgeWrapping
  cover.wrapT = THREE.ClampToEdgeWrapping
  cover.magFilter = THREE.LinearFilter
  cover.minFilter = THREE.LinearMipmapLinearFilter
  cover.generateMipmaps = true
  cover.anisotropy = 4
  cover.colorSpace = THREE.NoColorSpace
  cover.needsUpdate = true
  const material = studio(new THREE.MeshPhysicalMaterial({ color: srgb(INK.colour), roughness: 0.82, metalness: 0, specularIntensity: 0.2, alphaMap: cover, vertexColors: true, transparent: true, depthWrite: false }))
  material.name = 'stamp-ink'
  material.polygonOffset = true
  material.polygonOffsetFactor = -2
  material.polygonOffsetUnits = -4
  made = { material, cover, megabytes: (w * h * 4 * (4 / 3)) / (1024 * 1024) }
  return made
}
