import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

export const STOCK = { seed: config.seed + 5101, px: 512, tile: 256 }

function strands(size: number, seed: number): Float32Array {
  const f = new Float32Array(size * size)
  const count = Math.round(size * size * 0.016)
  for (let n = 0; n < count; n++) {
    let x = hash01(n, 1, seed) * size
    let y = hash01(n, 2, seed) * size
    let dir = hash01(n, 3, seed) * Math.PI * 2
    const len = 6 + hash01(n, 4, seed) * 30
    const tone = (hash01(n, 5, seed) - 0.45) * 0.7
    const bend = (hash01(n, 6, seed) - 0.5) * 0.09
    for (let k = 0; k < len; k++) {
      const i = ((Math.floor(y) % size) + size) % size
      const j = ((Math.floor(x) % size) + size) % size
      f[i * size + j] = f[i * size + j]! + tone
      x += Math.cos(dir)
      y += Math.sin(dir)
      dir += bend
    }
  }
  return f
}

function cloudOf(size: number, seed: number): (x: number, y: number, freq: number, salt: number) => number {
  const cell = (x: number, y: number, period: number, salt: number) => hash01(((x % period) + period) % period, ((y % period) + period) % period, seed + salt)
  const ease = (t: number) => t * t * (3 - 2 * t)
  return (x, y, freq, salt) => {
    const period = size / freq
    const fx = x / freq
    const fy = y / freq
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = ease(fx - x0)
    const ty = ease(fy - y0)
    const a = cell(x0, y0, period, salt)
    const b = cell(x0 + 1, y0, period, salt)
    const c = cell(x0, y0 + 1, period, salt)
    const d = cell(x0 + 1, y0 + 1, period, salt)
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }
}

export function fibreHeights(size: number, seed: number): Float32Array {
  const f = strands(size, seed)
  const cloud = cloudOf(size, seed)
  const out = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const blur = (f[i]! * 2 + f[y * size + ((x + 1) % size)]! + f[((y + 1) % size) * size + x]!) / 4
      out[i] = blur * 0.55 + (cloud(x, y, 64, 3) - 0.5) * 0.16 + (cloud(x, y, 16, 5) - 0.5) * 0.2 + (cloud(x, y, 4, 7) - 0.5) * 0.24 + (hash01(x, y, seed + 9) - 0.5) * 0.3
    }
  }
  return out
}

function texture(data: Uint8Array, size: number, colour: boolean): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

export interface Stock { sheet: THREE.MeshPhysicalMaterial; fibre: THREE.DataTexture; tooth: THREE.DataTexture; megabytes: number }

let made: Stock | null = null

export function stock(): Stock {
  if (made) return made
  const size = STOCK.px
  const h = fibreHeights(size, STOCK.seed)
  const tint = new Uint8Array(size * size * 4)
  const bump = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => h[(((y % size) + size) % size) * size + (((x % size) + size) % size)]!
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const v = Math.min(0.992, Math.max(0.84, 0.972 + h[y * size + x]! * 0.085))
      tint[i] = Math.round(v * 0.99 * 255)
      tint[i + 1] = Math.round(Math.min(1, v * 0.996) * 255)
      tint[i + 2] = Math.round(Math.min(1, v * 1.004) * 255)
      tint[i + 3] = 255
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.9
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.9
      const l = Math.sqrt(dx * dx + dy * dy + 1)
      bump[i] = Math.round((-dx / l) * 127.5 + 127.5)
      bump[i + 1] = Math.round((-dy / l) * 127.5 + 127.5)
      bump[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
      bump[i + 3] = 255
    }
  }
  const fibre = texture(tint, size, true)
  const tooth = texture(bump, size, false)
  const sheet = studio(
    new THREE.MeshPhysicalMaterial({ color: srgb(0xfefdfb), roughness: 0.93, metalness: 0, specularIntensity: 0.3, map: fibre, normalMap: tooth, normalScale: new THREE.Vector2(0.55, 0.55), vertexColors: true, side: THREE.DoubleSide })
  )
  sheet.name = 'letter-stock'
  const megabytes = (2 * size * size * 4 * (4 / 3)) / (1024 * 1024)
  made = { sheet, fibre, tooth, megabytes }
  return made
}
