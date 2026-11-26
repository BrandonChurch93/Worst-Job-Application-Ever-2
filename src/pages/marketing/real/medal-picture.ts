import * as THREE from 'three'
import { config } from '../../../config'
import { Random } from '../../../core/random'

export const BRUSHED = { size: 512, level: 0.84, ring: 1, rings: 0.045, arcs: 1500, arc: 0.15, dark: 0.45, long: [14, 110] as [number, number], stray: 70, fine: 0.04 }

// A disc of metal brushed on a wheel, as what its colour is multiplied by: rings a hair wide, each of its own brightness,
// and bright and dark strokes laid over them, each a texel wide and `long` texels long, round a middle that strays from the disc's
// own by up to `stray` texels: the single strokes of the brush that are seen one by one, and that cross.
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
    const px = rnd.next() * n
    const py = rnd.next() * n
    const off = rnd.next() * B.stray
    const to = rnd.next() * Math.PI * 2
    const cx = half + Math.cos(to) * off
    const cy = half + Math.sin(to) * off
    const r = Math.hypot(px - cx, py - cy)
    if (r < 4) continue
    const from = Math.atan2(py - cy, px - cx)
    const long = B.long[0] + (B.long[1] - B.long[0]) * rnd.next() ** 2
    const strength = B.arc * (rnd.next() < 0.5 ? -B.dark : 1) * (0.4 + 0.6 * rnd.next())
    const steps = Math.max(2, Math.ceil(long / 0.75))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const a = from + (long * t) / r
      const x = Math.floor(cx + Math.cos(a) * r)
      const y = Math.floor(cy + Math.sin(a) * r)
      if (x < 0 || y < 0 || x >= n || y >= n) continue
      out[y * n + x] = out[y * n + x]! + strength * Math.sin(Math.PI * t)
    }
  }
  return out
}

let made: THREE.DataTexture | null = null

// `across` is the width of the disc the picture lies on, in page pixels: one texel is one page pixel, from the disc's middle.
export function brushedPicture(across: number): THREE.DataTexture {
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
  tex.repeat.set(across / B.size, across / B.size)
  tex.offset.set((1 - across / B.size) / 2, (1 - across / B.size) / 2)
  tex.needsUpdate = true
  made = tex
  return tex
}
