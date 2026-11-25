import * as THREE from 'three'
import type { Zone } from '../zone'
import { FILL } from './colours'
import { groupsOf } from './groups'

// What the steel, the chrome and the clear coat of a zone reflect once the studio is put out: darkness, with the zone's lamps in it as bright spots at their true directions and colours, and the lit floor below.
const W = 256
const H = 128
const EYE = 20
const FAR = 420
const made = new Map<string, THREE.DataTexture>()

export function surroundPixels(z: Zone): Float32Array {
  const px = new Float32Array(W * H * 3)
  const fill = FILL[z.id] ?? [0.5, 0.5, 0.5]
  const dirs: { x: number; y: number; z: number; c: [number, number, number]; size: number; gain: number }[] = []
  for (const g of groupsOf(z)) {
    if (g.name === 'flash' || g.name === 'display' || g.name.startsWith('insert.')) continue
    for (const s of g.sources) {
      if (s.z > 100 && g.mode === 2) continue
      if (s.on !== undefined && s.on.startsWith('sling.')) continue
      // A lamp is seen from all over its tier, not from the middle of it: none is nearer than FAR, so none is a wide blob on the horizon.
      const flat = Math.hypot(s.x, s.y) || 1
      const far = Math.max(flat, FAR)
      const dz = s.z - EYE
      const d = Math.hypot(far, dz)
      const size = Math.max(0.03, Math.min(0.045, 18 / d))
      dirs.push({ x: (s.x / flat) * (far / d), y: (s.y / flat) * (far / d), z: dz / d, c: g.colour, size, gain: Math.min(3, s.power * 2.4) })
    }
  }
  for (let j = 0; j < H; j++) {
    const theta = ((j + 0.5) / H - 0.5) * Math.PI
    for (let i = 0; i < W; i++) {
      const phi = ((i + 0.5) / W - 0.5) * 2 * Math.PI
      const ex = Math.cos(theta) * Math.cos(phi)
      const ey = Math.sin(theta)
      const ez = Math.cos(theta) * Math.sin(phi)
      // The reflection is looked up by a direction in the world: x to the right, y up the page, z out of the floor.
      const x = ex
      const y = ey
      const zz = ez
      const haze = Math.exp(-Math.abs(zz) * 5.5)
      const below = zz < 0 ? 0.05 + 0.07 * Math.min(1, -zz * 3) : 0
      let r = 0.004 + fill[0] * (0.02 * haze + below)
      let g = 0.004 + fill[1] * (0.02 * haze + below)
      let b = 0.005 + fill[2] * (0.02 * haze + below)
      for (const d of dirs) {
        const dot = x * d.x + y * d.y + zz * d.z
        if (dot < 0.97) continue
        const a = Math.acos(Math.min(1, dot)) / d.size
        const v = d.gain * Math.exp(-a * a)
        r += d.c[0] * v
        g += d.c[1] * v
        b += d.c[2] * v
      }
      const o = (j * W + i) * 3
      px[o] = r
      px[o + 1] = g
      px[o + 2] = b
    }
  }
  return px
}

export function surroundOf(z: Zone): THREE.DataTexture {
  let t = made.get(z.id)
  if (t) return t
  const px = surroundPixels(z)
  const data = new Uint16Array(W * H * 4)
  for (let i = 0; i < W * H; i++) {
    for (let c = 0; c < 3; c++) data[i * 4 + c] = THREE.DataUtils.toHalfFloat(Math.min(60000, px[i * 3 + c]!))
    data[i * 4 + 3] = THREE.DataUtils.toHalfFloat(1)
  }
  t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType)
  t.name = `table-lights.surround.${z.id}`
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.LinearSRGBColorSpace
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  made.set(z.id, t)
  return t
}
