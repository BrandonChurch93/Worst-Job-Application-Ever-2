import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { ZONES, zoneAt } from '../draw'
import { BALL, TIERS } from '../layout'

// One zone of the page of step 3, in page pixels. An anchor's object has its origin at the middle of the zone, on the zone's floor.
export interface Zone {
  id: string
  // 0, 1 or 2 for a tier, -1 for the zones that are not a tier.
  tier: number
  top: number
  height: number
  floor: number
}

export const zones: Zone[] = ZONES.map((z) => ({ id: z.id, tier: (TIERS as string[]).indexOf(z.id), top: z.y * BALL, height: z.h * BALL, floor: z.z * BALL }))

export const zone = (id: string): Zone => {
  const z = zones.find((x) => x.id === id)
  if (!z) throw new Error(`No zone "${id}" on the page of step 3`)
  return z
}

export const isAnchor = (s: Shape): boolean => s.kind === 'anchor'
export const zoneOf = (anchor: Shape): Zone => zone(anchor.id.slice(anchor.id.lastIndexOf('.') + 1))

export const balls = (v: number): number => v * BALL

// A place on the page, in pixels, in the frame of a zone's anchor: x to the right, y up the page, z up from the zone's floor.
export const local = (z: Zone, pageX: number, pageY: number, pageZ = z.floor): [number, number, number] => [pageX - 960, z.top + z.height / 2 - pageY, pageZ - z.floor]

// The same for a place given in balls, as `layout.ts` gives every place. Leave the height out for a place on the zone's floor.
export const localBalls = (z: Zone, x: number, y: number, height?: number): [number, number, number] => local(z, x * BALL, y * BALL, height === undefined ? z.floor : height * BALL)

// Where a shape of the draw list stands in a zone's frame: its centre, at its `z0`. Turn an object by `turnOf` to match the shape's `rot`.
export const localOf = (z: Zone, s: Shape): [number, number, number] => local(z, s.x + s.w / 2, s.y + s.h / 2, s.z0)
export const turnOf = (s: Shape): number => -(s.rot ?? 0)

// The shapes of one part that lie in one zone, anchors left out.
export const shapesIn = (ctx: RealContext, part: string, z: Zone): Shape[] => ctx.list.filter((s) => s.part === part && s.kind !== 'anchor' && s.kind !== 'well' && zoneAt(s.y + s.h / 2) === z.id)

export interface Whole {
  // Names everything the part is built from. Change it and every zone is built again.
  version: string
  // Everything the part has in one zone, in the zone's frame. Called once for each zone the part has an anchor in.
  build(z: Zone, ctx: RealContext): THREE.Object3D
  // Called for every sample of every frame. It moves what moves and builds nothing.
  pose?(o: THREE.Object3D, z: Zone, ctx: RealContext): void
  drop?(o: THREE.Object3D): void
  // False while a picture the part is built from is not loaded: the part is drawn by its stand-ins until it answers true.
  ready?(): boolean
  // True when the object draws the part's words itself, as a display draws its dots. Otherwise every `text` shape of the part is set by the owner of the type, on whatever the part has built under it.
  words?: boolean
}

// The maker of a part that is built whole, zone by zone, on its anchors. Its single shapes are drawn by the anchor's object.
export function whole(part: string, w: Whole): PartMaker {
  return {
    key: (s) => (w.ready && !w.ready() ? null : s.kind === 'anchor' ? `${w.version}|${s.id}` : s.kind === 'text' && !w.words ? null : ''),
    make(s, ctx) {
      const z = zoneOf(s)
      const o = w.build(z, ctx)
      let meshes = 0
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) meshes++
      })
      const there = shapesIn(ctx, part, z).length
      if (meshes === 0 && there > 0) throw new Error(`The maker of "${part}" built nothing in the zone "${z.id}", where the part has ${there} shapes`)
      return o
    },
    pose: w.pose ? (o, s, ctx) => w.pose!(o, zoneOf(s), ctx) : undefined,
    drop: w.drop
  }
}
