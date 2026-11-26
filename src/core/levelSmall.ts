import * as THREE from 'three'

// The small things of a page, sparks, drops, puffs, coins, chips, of which a level draws the share `particleFraction` names.
// An emitter says so on the object that draws them, as `userData.small`:
//   'each'   an InstancedMesh that always holds all its instances,
//   'count'  an InstancedMesh whose maker sets `count` every time it places them,
//   a number a mesh whose geometry holds that many small things one after the other, all of one size.
export type SmallMark = 'each' | 'count' | number

const GOLD = 0.6180339887498949

// A number from 0 to 1 for a name, the same on every machine.
export function smallOffset(name: string, seed: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d) >>> 0
  h ^= h >>> 12
  return (h >>> 0) / 4294967296
}

// Whether the small thing number `index` of an emitter is drawn at a share. The ones a lower share keeps are among the ones
// a higher share keeps, a thing keeps its answer from frame to frame, and any run of them holds close to the share.
export function keepsSmall(index: number, share: number, offset: number): boolean {
  if (share >= 1) return true
  const u = offset + index * GOLD
  return u - Math.floor(u) < share
}

// How many of `n` small things a share draws when they are taken from the front of one geometry: never none.
export const smallCount = (n: number, share: number): number => (share >= 1 ? n : Math.max(1, Math.round(n * share)))

interface Held { version: number; kept: number; count: number; share: number; full: { a: THREE.BufferAttribute; copy: Float32Array }[] }

const perInstance = (m: THREE.InstancedMesh): THREE.BufferAttribute[] => {
  const out: THREE.BufferAttribute[] = [m.instanceMatrix]
  if (m.instanceColor) out.push(m.instanceColor)
  for (const a of Object.values(m.geometry.attributes)) if ((a as THREE.InstancedBufferAttribute).isInstancedBufferAttribute && (a as THREE.InstancedBufferAttribute).meshPerAttribute === 1) out.push(a as THREE.BufferAttribute)
  return out
}

export class SmallThings {
  private held = new Map<THREE.InstancedMesh, Held>()
  private ranged = new Map<THREE.BufferGeometry, number>()
  private share = 1

  // Called after the page has placed its things for a frame.
  apply(scene: THREE.Scene, share: number, seed: number): void {
    if (share >= 1 && this.share >= 1) return
    scene.traverse((o) => {
      const mark = o.userData.small as SmallMark | undefined
      if (mark === undefined) return
      const name = `${String(o.userData.shape ?? '')}/${o.name}`
      if (typeof mark === 'number') this.range(o as THREE.Mesh, mark, share)
      else if ((o as THREE.InstancedMesh).isInstancedMesh) this.thin(o as THREE.InstancedMesh, mark, share, smallOffset(name, seed))
    })
    this.share = share
  }

  private range(m: THREE.Mesh, n: number, share: number): void {
    const g = m.geometry
    if (!g || !(n > 0)) return
    if (this.ranged.get(g) === share) return
    const total = g.index ? g.index.count : g.attributes.position!.count
    const each = total / n
    g.setDrawRange(0, share >= 1 ? Infinity : Math.round(each * smallCount(n, share)))
    if (share >= 1) this.ranged.delete(g)
    else this.ranged.set(g, share)
  }

  private thin(m: THREE.InstancedMesh, mark: 'each' | 'count', share: number, offset: number): void {
    const h = this.held.get(m)
    const posed = !h || h.version !== m.instanceMatrix.version
    if (share >= 1) {
      if (!h) return
      if (!posed) {
        for (const f of h.full) {
          ;(f.a.array as Float32Array).set(f.copy)
          f.a.needsUpdate = true
        }
        m.count = h.count
      } else if (mark === 'each') m.count = h.count
      this.held.delete(m)
      return
    }
    if (h && !posed && h.share === share) return
    const list = perInstance(m)
    if (h && !posed) for (const f of h.full) (f.a.array as Float32Array).set(f.copy)
    const count = h && (!posed || mark === 'each') ? h.count : m.count
    const same = h !== undefined && h.full.length === list.length && h.full.every((f, i) => f.a === list[i] && f.copy.length === f.a.array.length)
    const full = same ? h.full : list.map((a) => ({ a, copy: (a.array as Float32Array).slice() }))
    if (same && posed) for (const f of full) f.copy.set(f.a.array as Float32Array)
    let kept = 0
    for (let i = 0; i < count; i++) {
      if (!keepsSmall(i, share, offset)) continue
      if (kept !== i) for (const a of list) (a.array as Float32Array).copyWithin(kept * a.itemSize, i * a.itemSize, (i + 1) * a.itemSize)
      kept++
    }
    for (const a of list) a.needsUpdate = true
    m.count = kept
    this.held.set(m, { version: m.instanceMatrix.version, kept, count, share, full })
  }
}
