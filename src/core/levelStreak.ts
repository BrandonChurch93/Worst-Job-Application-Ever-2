import * as THREE from 'three'

// The live site's motion blur for small fast things drawn as instances: each is drawn longer along the way it went since the frame before.
// `most` caps how long a thing may get, in its own lengths; `least` is the growth under which nothing is done. The share of a frame the shutter is open is the film's.
export const STREAK = { most: 3, least: 0.04 } as const

// How many times its own length a thing `size` long is drawn when it went `travel` in one frame.
export function streakOf(travel: number, size: number, shutter: number): number {
  if (!(size > 0) || !(travel > 0)) return 1
  const k = 1 + (shutter * travel) / size
  return k - 1 < STREAK.least ? 1 : Math.min(STREAK.most, k)
}

// The slot's coins: the slot keeps them on its own root under this name (src/pages/step2/real/slot.ts).
export const isCoins = (o: THREE.Object3D): boolean => o.parent?.userData.coins === o

interface Held { version: number; count: number; source: Float32Array; at: Float32Array }


// Draws a matrix `k` times as long along the unit direction (x, y, z) about its own place.
export function stretchAlong(e: Float32Array, o: number, x: number, y: number, z: number, k: number): void {
  const f = k - 1
  for (let c = 0; c < 3; c++) {
    const i = o + c * 4
    const d = (e[i]! * x + e[i + 1]! * y + e[i + 2]! * z) * f
    e[i] = e[i]! + d * x
    e[i + 1] = e[i + 1]! + d * y
    e[i + 2] = e[i + 2]! + d * z
  }
}

export class Streaks {
  private held = new Map<THREE.InstancedMesh, Held>()

  // Called after the page has placed its things for a live frame. `marked` says which instanced things take part.
  apply(scene: THREE.Scene, shutter: number, marked: (o: THREE.Object3D) => boolean): void {
    scene.traverse((o) => {
      const m = o as THREE.InstancedMesh
      if (!m.isInstancedMesh || !marked(o)) return
      this.one(m, shutter)
    })
  }

  // Gives every thing back as its page placed it: a computed picture is never drawn with a stretch.
  release(): void {
    for (const [m, h] of this.held) {
      if (h.version === m.instanceMatrix.version) {
        ;(m.instanceMatrix.array as Float32Array).set(h.source.subarray(0, h.count * 16))
        m.instanceMatrix.needsUpdate = true
      }
    }
    this.held.clear()
  }

  private one(m: THREE.InstancedMesh, shutter: number): void {
    const a = m.instanceMatrix.array as Float32Array
    const h = this.held.get(m)
    const posed = !h || h.version !== m.instanceMatrix.version
    if (h && !posed) a.set(h.source.subarray(0, h.count * 16))
    const count = h && !posed ? h.count : m.count
    const source = h && h.source.length === a.length ? h.source : new Float32Array(a.length)
    source.set(a)
    const at = new Float32Array(count * 3)
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere()
    const size = 2 * (m.geometry.boundingSphere?.radius ?? 0)
    let changed = h !== undefined && !posed
    for (let i = 0; i < count; i++) {
      const o = i * 16
      at[i * 3] = a[o + 12]!
      at[i * 3 + 1] = a[o + 13]!
      at[i * 3 + 2] = a[o + 14]!
      if (!h || i >= h.count || count < h.count) continue
      const dx = at[i * 3]! - h.at[i * 3]!
      const dy = at[i * 3 + 1]! - h.at[i * 3 + 1]!
      const dz = at[i * 3 + 2]! - h.at[i * 3 + 2]!
      const travel = Math.hypot(dx, dy, dz)
      const scale = Math.hypot(a[o]!, a[o + 1]!, a[o + 2]!)
      const k = streakOf(travel, size * scale, shutter)
      if (k === 1) continue
      stretchAlong(a, o, dx / travel, dy / travel, dz / travel, k)
      changed = true
    }
    if (changed) m.instanceMatrix.needsUpdate = true
    this.held.set(m, { version: m.instanceMatrix.version, count, source, at })
  }
}
