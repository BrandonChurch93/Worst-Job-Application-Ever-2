import * as THREE from 'three'
import { config } from '../../config'
import { hash01 } from '../../core/random'

export const DETAIL_PX = 512
const CELLS = 18

let shared: THREE.DataTexture | null = null

// One picture of detail for the cursor, made from the seed. Red: how far a point is from the nearest crack of the crazing.
// Green and blue: two fields of soft cloud. Alpha: one number for each plate between the cracks.
export function detailData(size: number, seed: number): Uint8Array {
  const data = new Uint8Array(size * size * 4)
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const cloud = (x: number, y: number, salt: number): number => {
    let sum = 0
    let amp = 0.5
    let total = 0
    for (let o = 0; o < 5; o++) {
      const cells = 4 << o
      const fx = (x / size) * cells
      const fy = (y / size) * cells
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const tx = smooth(fx - x0)
      const ty = smooth(fy - y0)
      const at = (ix: number, iy: number) => hash01(((ix % cells) + cells) % cells, ((iy % cells) + cells) % cells, seed + salt + o * 17)
      const a = at(x0, y0)
      const b = at(x0 + 1, y0)
      const c = at(x0, y0 + 1)
      const d = at(x0 + 1, y0 + 1)
      sum += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty)
      total += amp
      amp *= 0.5
    }
    return sum / total
  }
  const px: number[] = []
  const py: number[] = []
  for (let j = 0; j < CELLS; j++) {
    for (let i = 0; i < CELLS; i++) {
      px.push(i + 0.15 + 0.7 * hash01(i, j, seed + 301))
      py.push(j + 0.15 + 0.7 * hash01(i, j, seed + 302))
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = ((x + 0.5) / size) * CELLS + (cloud(x, y, 401) - 0.5) * 0.7
      const fy = ((y + 0.5) / size) * CELLS + (cloud(x, y, 402) - 0.5) * 0.7
      const cx = Math.floor(fx)
      const cy = Math.floor(fy)
      let d1 = 1e9
      let d2 = 1e9
      let id = 0
      for (let j = -2; j <= 2; j++) {
        for (let i = -2; i <= 2; i++) {
          const gx = (((cx + i) % CELLS) + CELLS) % CELLS
          const gy = (((cy + j) % CELLS) + CELLS) % CELLS
          const k = gy * CELLS + gx
          const d = Math.hypot(px[k]! + (cx + i - gx) - fx, py[k]! + (cy + j - gy) - fy)
          if (d < d1) {
            d2 = d1
            d1 = d
            id = k
          } else if (d < d2) d2 = d
        }
      }
      const i4 = (y * size + x) * 4
      data[i4] = Math.round(Math.min(1, (d2 - d1) * 1.6) * 255)
      data[i4 + 1] = Math.round(cloud(x, y, 11) * 255)
      data[i4 + 2] = Math.round(cloud(x, y, 97) * 255)
      data[i4 + 3] = Math.round(hash01(id, 5, seed + 77) * 255)
    }
  }
  return data
}

export function detailTexture(): THREE.DataTexture {
  if (shared) return shared
  const tex = new THREE.DataTexture(detailData(DETAIL_PX, config.seed), DETAIL_PX, DETAIL_PX, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  shared = tex
  return tex
}
