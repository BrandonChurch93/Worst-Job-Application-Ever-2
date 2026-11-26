import * as THREE from 'three'
import { config } from '../../../config'
import { Random } from '../../../core/random'

export const BRUSHED = { size: 512, level: 0.84, ring: 1, rings: 0.05, arcs: 2600, arc: 0.3, long: [0.05, 0.3] as [number, number], fine: 0.03 }

// A disc of metal brushed on a wheel, as what its colour is multiplied by: rings a hair wide, each of its own brightness,
// and short bright and dark arcs laid over them, the single strokes of the brush that are seen one by one.
export function brushedHeights(seed: number): Float32Array {
  const B = BRUSHED
  const rnd = new Random(seed, 'medal-picture')
  const n = B.size
  const half = n / 2
  const ring = new Float32Array(Math.ceil((half * Math.SQRT2) / B.ring) + 2)
  for (let i = 0; i < ring.length; i++) ring[i] = rnd.next() - 0.5
  const out = new Float32Array(n * n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const r = Math.hypot(x + 0.5 - half, y + 0.5 - half) / B.ring
    const i = Math.floor(r)
    const f = r - i
    out[y * n + x] = B.level + B.rings * 2 * (ring[i]! * (1 - f) + ring[i + 1]! * f) + B.fine * 2 * (rnd.next() - 0.5)
  }
  for (let k = 0; k < B.arcs; k++) {
    const r = Math.sqrt(rnd.next()) * half * 1.02
    const from = rnd.next() * Math.PI * 2
    const long = B.long[0] + (B.long[1] - B.long[0]) * rnd.next() ** 2
    const strength = B.arc * (rnd.next() < 0.5 ? -1 : 1) * (0.4 + 0.6 * rnd.next())
    const steps = Math.max(2, Math.ceil(long * r * 1.5))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const a = from + long * t
      for (const wide of [0]) {
        const x = Math.floor(half + Math.cos(a) * (r + wide))
        const y = Math.floor(half + Math.sin(a) * (r + wide))
        if (x < 0 || y < 0 || x >= n || y >= n) continue
        out[y * n + x] = out[y * n + x]! + strength * Math.sin(Math.PI * t)
      }
    }
  }
  return out
}

let made: THREE.DataTexture | null = null

export function brushedPicture(): THREE.DataTexture {
  if (made) return made
  const B = BRUSHED
  const h = brushedHeights(config.seed)
  const data = new Uint8Array(B.size * B.size * 4)
  for (let i = 0; i < h.length; i++) {
    const v = Math.round(Math.max(0, Math.min(1, h[i]!)) * 255)
    data.set([v, v, v, 255], i * 4)
  }
  const tex = new THREE.DataTexture(data, B.size, B.size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  made = tex
  return tex
}
