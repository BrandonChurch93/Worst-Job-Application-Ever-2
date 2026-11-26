import * as THREE from 'three'

export const MATRIX = { px: 32, pitch: 4.5, core: 0.3, edge: 0.47 }

let made: THREE.DataTexture | null = null

export function dotCover(u: number, v: number): number {
  const d = Math.hypot(u - 0.5, v - 0.5)
  const t = Math.min(1, Math.max(0, (MATRIX.edge - d) / (MATRIX.edge - MATRIX.core)))
  return t * t * (3 - 2 * t)
}

// One cell of the display: a round lamp with a soft edge, repeated across the glass at MATRIX.pitch.
export function matrix(): THREE.DataTexture {
  if (made) return made
  const n = MATRIX.px
  const data = new Uint8Array(n * n * 4)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const a = Math.round(dotCover((x + 0.5) / n, (y + 0.5) / n) * 255)
      data.set([a, a, a, 255], (y * n + x) * 4)
    }
  }
  made = new THREE.DataTexture(data, n, n, THREE.RGBAFormat)
  made.wrapS = THREE.RepeatWrapping
  made.wrapT = THREE.RepeatWrapping
  made.magFilter = THREE.LinearFilter
  made.minFilter = THREE.LinearMipmapLinearFilter
  made.generateMipmaps = true
  made.anisotropy = 4
  made.name = 'wait-matrix'
  made.needsUpdate = true
  return made
}

export function gridUv(position: ArrayLike<number>, ox: number, oy: number): Float32Array {
  const uv = new Float32Array((position.length / 3) * 2)
  for (let i = 0; i < uv.length / 2; i++) {
    uv[i * 2] = (position[i * 3]! + ox) / MATRIX.pitch
    uv[i * 2 + 1] = (position[i * 3 + 1]! + oy) / MATRIX.pitch
  }
  return uv
}
