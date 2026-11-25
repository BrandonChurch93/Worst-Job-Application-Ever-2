import type * as THREE from 'three'
import type { Shape } from '../stage/types'

// A light a part gives off for one frame: a bolt, a muzzle flash, a glowing edge. Page pixels and heights.
export interface Emitter {
  x: number
  y: number
  z: number
  colour: [number, number, number]
  power: number
  reach: number
  shadow?: boolean
}

export interface RealContext {
  page: string
  list: Shape[]
  byId: Map<string, Shape>
  time: number
  scroll: number
  turning: boolean
  width: number
  // The part of the page the slab is built for: the whole page, or the screen on show while the page turns.
  top: number
  tall: number
  light(e: Emitter): void
}

// Makes one shape of the draw list out of real things.
// key: null while the shape is still a stand-in; '' when another shape's object draws it; otherwise what the object is built from.
// make: the object, built round the shape's centre with z = 0 at the shape's z0. The view puts it in place and turns it.
// pose: runs for every sample of every frame. It moves what moves without building anything.
// drop: the object is no longer used. The maker frees what it alone owns.
export interface PartMaker {
  key(s: Shape, ctx: RealContext): string | null
  make(s: Shape, ctx: RealContext): THREE.Object3D
  pose?(o: THREE.Object3D, s: Shape, ctx: RealContext): void
  drop?(o: THREE.Object3D): void
}

// Makes the page's slab, with its pockets and wells cut in, in world units: x = page x - 960, y = 540 - page y.
export interface GroundMaker {
  key(ctx: RealContext): string | null
  make(ctx: RealContext): THREE.Object3D
  pose?(o: THREE.Object3D, ctx: RealContext): void
  drop?(o: THREE.Object3D): void
}

export interface PageReal {
  parts: Record<string, PartMaker | null>
}

export interface Real {
  ground: GroundMaker | null
  type: PartMaker | null
  parts: Record<string, PartMaker | null>
}
