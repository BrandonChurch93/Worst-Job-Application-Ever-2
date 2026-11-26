import * as THREE from 'three'
import { config } from '../../../config'
import { Random } from '../../../core/random'

export const BRUSHED = { size: 1024, level: 0.84, ring: 3.2, rings: 0.045, arcs: 900, arc: 0.15, dark: 0.45, wide: 2, long: [38, 300] as [number, number], stray: 190, fine: 0.05, grain: 0.2, dash: [10, 70] as [number, number] }

// A disc of metal brushed on a wheel, as what its colour is multiplied by: rings a hair wide, each of its own brightness,
// each cut into dashes `dash` texels long that differ by `grain`, the scratches of the grit, and bright and dark strokes laid over them,
// each `wide` texels wide and `long` texels long, round a middle that strays from the disc's own by up to `stray` texels:
// the single strokes of the brush that are seen one by one, and that cross.
export function brushedHeights(seed: number): Float32Array {
  const B = BRUSHED
  const rnd = new Random(seed, 'medal-picture')
  const n = B.size
  const half = n / 2
  const ring = new Float32Array(Math.ceil((half * Math.SQRT2) / B.ring) + 2)
  const dashes: Float32Array[] = []
  const pace = new Float32Array(ring.length)
  for (let i = 0; i < ring.length; i++) {
    ring[i] = rnd.next() - 0.5
    pace[i] = B.dash[0] + (B.dash[1] - B.dash[0]) * rnd.next()
    const row = new Float32Array(Math.ceil((Math.PI * 2 * (i + 1) * B.ring) / pace[i]!) + 1)
    for (let j = 0; j < row.length; j++) row[j] = rnd.next() - 0.5
    dashes.push(row)
  }
  const out = new Float32Array(n * n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const r = Math.hypot(x + 0.5 - half, y + 0.5 - half) / B.ring
    const i = Math.floor(r)
    const f = r - i
    const turn = Math.atan2(y + 0.5 - half, x + 0.5 - half) + Math.PI
    const dash = dashes[i]![Math.floor((turn * (i + 0.5) * B.ring) / pace[i]!)]!
    out[y * n + x] = B.level + B.rings * 2 * (ring[i]! * (1 - f) + ring[i + 1]! * f) + B.grain * (dash + 0.5) + B.fine * 2 * (rnd.next() - 0.5)
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
      for (let w = 0; w < B.wide; w++) {
        const x = Math.floor(cx + Math.cos(a) * (r + w))
        const y = Math.floor(cy + Math.sin(a) * (r + w))
        if (x < 0 || y < 0 || x >= n || y >= n) continue
        out[y * n + x] = out[y * n + x]! + strength * Math.sin(Math.PI * t)
      }
    }
  }
  return out
}

let made: THREE.DataTexture | null = null

// The picture lies across the whole medal once, rim and all: on a medal 380 px wide that is 2.7 texels to a page pixel.
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
