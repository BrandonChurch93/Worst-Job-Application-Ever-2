import * as THREE from 'three'
import { config } from '../../../config'
import { Random } from '../../../core/random'

export const PICTURE = { size: 512, level: 0.93, cloud: 0.02, blotch: 0.01, grain: 0.011 }

function blurWrap(src: Float32Array, size: number, sigma: number): Float32Array {
  const reach = Math.max(1, Math.ceil(sigma * 3))
  const weights: number[] = []
  let sum = 0
  for (let i = -reach; i <= reach; i++) {
    const w = Math.exp((-i * i) / (2 * sigma * sigma))
    weights.push(w)
    sum += w
  }
  const mask = size - 1
  const mid = new Float32Array(size * size)
  const out = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0
    for (let i = -reach; i <= reach; i++) v += src[y * size + ((x + i) & mask)]! * weights[i + reach]!
    mid[y * size + x] = v / sum
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0
    for (let i = -reach; i <= reach; i++) v += mid[((y + i) & mask) * size + x]! * weights[i + reach]!
    out[y * size + x] = v / sum
  }
  return out
}

function unit(h: Float32Array): Float32Array {
  let mean = 0
  for (let i = 0; i < h.length; i++) mean += h[i]!
  mean /= h.length
  let spread = 0
  for (let i = 0; i < h.length; i++) spread += (h[i]! - mean) ** 2
  spread = Math.sqrt(spread / h.length) || 1
  for (let i = 0; i < h.length; i++) h[i] = Math.max(-2.5, Math.min(2.5, (h[i]! - mean) / spread))
  return h
}

// Noise between two widths, made small and read large: `size` texels a side, tiling.
function band(rnd: Random, size: number, near: number, far: number): Float32Array {
  const white = new Float32Array(size * size)
  for (let i = 0; i < white.length; i++) white[i] = rnd.next() - 0.5
  const a = blurWrap(white, size, near)
  const b = blurWrap(white, size, far)
  for (let i = 0; i < a.length; i++) a[i] = a[i]! - b[i]!
  return unit(a)
}

function read(h: Float32Array, size: number, u: number, v: number): number {
  const x = u * size - 0.5
  const y = v * size - 0.5
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const mask = size - 1
  const at = (i: number, j: number): number => h[((y0 + j) & mask) * size + ((x0 + i) & mask)]!
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  return (at(0, 0) * (1 - sx) + at(1, 0) * sx) * (1 - sy) + (at(0, 1) * (1 - sx) + at(1, 1) * sx) * sy
}

// What shows through a slab of frosted glass, as what its colour is multiplied by: the soft clouds of the frosting, the blotches of the
// page's light under it, and the page's grain, blurred by the depth of the glass. One texel is one page pixel and the picture tiles.
export function glassHeights(seed: number): Float32Array {
  const rnd = new Random(seed, 'glass-picture')
  const P = PICTURE
  const cloud = band(rnd, 32, 1.1, 3.2)
  const blotch = band(rnd, 128, 1.6, 4.5)
  const grain = band(rnd, P.size, 0.9, 2.2)
  const out = new Float32Array(P.size * P.size)
  for (let y = 0; y < P.size; y++) for (let x = 0; x < P.size; x++) {
    const u = (x + 0.5) / P.size
    const v = (y + 0.5) / P.size
    out[y * P.size + x] = P.level + P.cloud * read(cloud, 32, u, v) + P.blotch * read(blotch, 128, u, v) + P.grain * grain[y * P.size + x]!
  }
  return out
}

let made: THREE.DataTexture | null = null

export function glassPicture(): THREE.DataTexture {
  if (made) return made
  const P = PICTURE
  const h = glassHeights(config.seed)
  const data = new Uint8Array(P.size * P.size * 4)
  for (let i = 0; i < h.length; i++) {
    const v = Math.round(Math.max(0, Math.min(1, h[i]!)) * 255)
    data.set([v, v, v, 255], i * 4)
  }
  const tex = new THREE.DataTexture(data, P.size, P.size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = THREE.NoColorSpace
  tex.repeat.set(1 / P.size, 1 / P.size)
  tex.needsUpdate = true
  made = tex
  return tex
}
