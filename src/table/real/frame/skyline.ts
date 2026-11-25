import * as THREE from 'three'
import { stream } from '../../../core/random'
import { colours } from '../lights'

// The face of the marquee, drawn by rule: a city at dusk in three bands of light, the towers' cold gold above, the offices' white in the middle, the street's warm lamps at the foot.
// It is the named fallback for a generated picture, and it has no letter in it.
export const FACE = { w: 1296, h: 336 }

interface Block { x0: number; x1: number; top: number; layer: number; cell: [number, number]; lit: number; crown: number; seed: number }

const mix = (a: number, b: number, t: number): number => a + (b - a) * t
const ease = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const hash = (a: number, b: number, c: number): number => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// How high the city may stand at a place across the face: low under the title and round the display, tall at both ends.
const roof = (x: number): number => {
  const edge = Math.abs(x - FACE.w / 2) / (FACE.w / 2)
  return 62 + 150 * ease(0.62, 1, edge) + 26 * ease(0.2, 0.62, edge)
}

function blocks(): Block[] {
  const r = stream('marquee-skyline')
  const out: Block[] = []
  for (let layer = 0; layer < 3; layer++) {
    let x = -20 - r.next() * 30
    while (x < FACE.w + 20) {
      const w = layer === 0 ? 34 + r.next() * 60 : layer === 1 ? 44 + r.next() * 70 : 54 + r.next() * 90
      const cap = roof(x + w / 2)
      const share = layer === 0 ? 0.72 + r.next() * 0.28 : layer === 1 ? 0.45 + r.next() * 0.3 : 0.2 + r.next() * 0.2
      out.push({ x0: Math.round(x), x1: Math.round(x + w), top: Math.round(cap * share), layer, cell: layer === 0 ? [5, 7] : layer === 1 ? [6, 8] : [8, 10], lit: layer === 0 ? 0.34 : layer === 1 ? 0.5 : 0.58, crown: r.next(), seed: Math.floor(r.next() * 100000) })
      x += w + (layer === 0 ? r.next() * 10 : r.next() * 16 - 4)
    }
  }
  return out
}

export function skyline(): { art: THREE.DataTexture; glow: THREE.DataTexture } {
  const { w, h } = FACE
  const art = new Uint8Array(w * h * 4)
  const glow = new Uint8Array(w * h * 4)
  const col = new Float32Array(w * h * 3)
  const lum = new Float32Array(w * h * 3)
  const gold = colours.CORPORATE_GOLD
  const white = colours.OFFICE_FLUORESCENT
  const warm = colours.STREET_SODIUM
  for (let y = 0; y < h; y++) {
    const up = (h - 1 - y) / (h - 1)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      const horizon = Math.exp(-up * 3.4)
      const side = 0.86 + 0.14 * Math.cos(((x - w * 0.42) / w) * 3.2)
      col[i] = mix(0.03, 0.5, horizon) * side
      col[i + 1] = mix(0.05, 0.26, horizon * horizon) * side
      col[i + 2] = mix(0.14, 0.24, horizon * 0.8)
      lum[i] = col[i]! * 0.5
      lum[i + 1] = col[i + 1]! * 0.5
      lum[i + 2] = col[i + 2]! * 0.5
    }
  }
  const list = blocks().sort((a, b) => a.layer - b.layer)
  for (const b of list) {
    const haze = b.layer === 0 ? 0.42 : b.layer === 1 ? 0.2 : 0.05
    const step = b.crown > 0.55 ? Math.max(4, Math.round((b.x1 - b.x0) * 0.18)) : 0
    for (let x = Math.max(0, b.x0); x < Math.min(w, b.x1); x++) {
      const inset = step > 0 ? (x - b.x0 < step || b.x1 - x <= step ? 14 : x - b.x0 < step * 2 || b.x1 - x <= step * 2 ? 7 : 0) : 0
      const mast = b.crown > 0.86 && Math.abs(x - Math.round((b.x0 + b.x1) / 2)) < 1 ? 22 : 0
      const top = b.top - inset + mast
      for (let up = 0; up < top; up++) {
        const y = h - 1 - up
        if (y < 0) break
        const i = (y * w + x) * 3
        const body = up >= b.top - inset
        const sky = [col[i]!, col[i + 1]!, col[i + 2]!]
        const base = [0.022 + 0.01 * b.layer, 0.03 + 0.008 * b.layer, 0.05 + 0.006 * b.layer]
        let r = mix(base[0]!, sky[0]! * 0.55, haze)
        let g = mix(base[1]!, sky[1]! * 0.55, haze)
        let bl = mix(base[2]!, sky[2]! * 0.7, haze)
        let er = 0
        let eg = 0
        let eb = 0
        if (!body) {
          const cx = Math.floor((x - b.x0) / b.cell[0])
          const cy = Math.floor(up / b.cell[1])
          const inX = (x - b.x0) % b.cell[0]
          const inY = up % b.cell[1]
          const pane = inX >= 1 && inX < b.cell[0] - 2 && inY >= 2 && inY < b.cell[1] - 2 && x - b.x0 > 2 && b.x1 - x > 3 && up < b.top - inset - 3
          const floorLit = hash(b.seed, cy, 7) < 0.16
          if (pane && (hash(b.seed, cx, cy) < b.lit || floorLit)) {
            const band = up < 34 ? warm : up < 92 ? white : gold
            const k = (0.55 + 0.45 * hash(b.seed + 3, cx, cy)) * (1 - haze * 0.7)
            er = band[0] * k
            eg = band[1] * k
            eb = band[2] * k
            r = mix(r, band[0], 0.8 * k)
            g = mix(g, band[1], 0.8 * k)
            bl = mix(bl, band[2], 0.8 * k)
          }
        }
        col[i] = r
        col[i + 1] = g
        col[i + 2] = bl
        lum[i] = er + r * 0.12
        lum[i + 1] = eg + g * 0.12
        lum[i + 2] = eb + bl * 0.12
      }
    }
  }
  // The lamps of the street: a row of warm points along the foot, each with its pool.
  for (let n = 0; n < 34; n++) {
    const lx = 18 + n * 38.4 + (hash(n, 5, 1) - 0.5) * 6
    const ly = h - 13
    for (let dy = -16; dy <= 12; dy++) for (let dx = -18; dx <= 18; dx++) {
      const x = Math.round(lx + dx)
      const y = ly + dy
      if (x < 0 || x >= w || y < 0 || y >= h) continue
      const k = Math.exp(-(dx * dx + dy * dy * 1.6) / 46) * 0.95
      const i = (y * w + x) * 3
      col[i] = Math.min(1, col[i]! + warm[0] * k * 0.8)
      col[i + 1] = Math.min(1, col[i + 1]! + warm[1] * k * 0.8)
      col[i + 2] = Math.min(1, col[i + 2]! + warm[2] * k * 0.8)
      lum[i] = lum[i]! + warm[0] * k
      lum[i + 1] = lum[i + 1]! + warm[1] * k
      lum[i + 2] = lum[i + 2]! + warm[2] * k
    }
  }
  const enc = (v: number): number => Math.max(1, Math.min(254, Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2))))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = (y * w + x) * 3
    const d = ((h - 1 - y) * w + x) * 4
    art[d] = enc(col[s]!)
    art[d + 1] = enc(col[s + 1]!)
    art[d + 2] = enc(col[s + 2]!)
    art[d + 3] = 255
    glow[d] = enc(lum[s]!)
    glow[d + 1] = enc(lum[s + 1]!)
    glow[d + 2] = enc(lum[s + 2]!)
    glow[d + 3] = 255
  }
  const tex = (data: Uint8Array, name: string): THREE.DataTexture => {
    const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat)
    t.colorSpace = THREE.SRGBColorSpace
    t.magFilter = THREE.LinearFilter
    t.minFilter = THREE.LinearMipmapLinearFilter
    t.generateMipmaps = true
    t.anisotropy = 8
    t.name = name
    t.needsUpdate = true
    return t
  }
  return { art: tex(art, 'marquee.skyline'), glow: tex(glow, 'marquee.skyline.glow') }
}
