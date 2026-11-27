// The boss arena: the form page become another world. It draws itself from a BossView and from nothing else.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
import * as THREE from 'three'
import type { BossView } from '../boss/view'
import { config } from '../config'
import type { Emitter, PartMaker, RealContext } from '../real/types'
import type { Shape } from '../stage/types'
import { rise, seamLight } from './change'
import { makeGround } from './ground'
import { ARENA, PAGE } from './layout'
import { makeBar, makeGuns, makeKit, makePanes, makePillars, poseBar, poseGun } from './props'
import { makeWreck } from './wreck'

export { ARENA, MIDDLE, PANES, PILLARS, SEAMS, SLABS } from './layout'
export { solids, standing, brokenBy, breaksBox } from './solids'
export { shake, KNOCKS, BLAST_KNOCK } from './change'

export type Light = (e: Emitter) => void

export interface Arena {
  object: THREE.Object3D
  // Everything follows from the view. `dt` is not read: nothing here keeps a clock.
  pose(view: BossView, dt?: number, light?: Light): void
  dispose(): void
}

// The well the page's own ground is cut with while the arena's slabs are on: null before ARENA.clearAt.
export function arenaWell(view: BossView | null): { x: number; y: number; w: number; h: number; z0: number } | null {
  if (!view || view.time < ARENA.clearAt) return null
  return { x: 0, y: 0, w: PAGE.w, h: PAGE.h, z0: -ARENA.wellDepth }
}

// The light the seams throw on what stands near them, where the three brightest joints are.
const SEAM_LAMPS: { x: number; y: number }[] = [{ x: 598, y: 438 }, { x: 1368, y: 655 }, { x: 960, y: 812 }]

export function makeArena(o: { seed?: number } = {}): Arena {
  const seed = o.seed ?? config.seed
  const root = new THREE.Group()
  root.name = 'arena'
  const kit = makeKit()
  const ground = makeGround(seed)
  const pillars = makePillars(kit)
  const panes = makePanes(kit)
  const guns = makeGuns(kit)
  const bar = makeBar(kit)
  const wreck = makeWreck(seed, kit, ground.wounds, pillars.list, panes.list)
  root.add(ground.object, pillars.object, panes.object, guns.object, bar.bar.root, wreck.object)

  const pose = (view: BossView, _dt?: number, light?: Light): void => {
    const t = view.time
    root.visible = t >= 0
    if (!root.visible) return
    ground.pose(t)
    for (const p of pillars.list) {
      const up = rise(t, p.order)
      p.root.visible = up > 0
      p.foot.visible = up > 0
      p.foot.scale.set(1, 1, Math.min(1, Math.max(0.02, up * 6)))
      p.root.scale.set(1, 1, Math.max(0.02, up))
    }
    for (const p of panes.list) {
      const up = rise(t, p.order)
      p.root.visible = up > 0
      p.shade.visible = up > 0.5
      p.foot.visible = up > 0
      p.foot.scale.set(1, 1, Math.min(1, Math.max(0.02, up * 6)))
      p.root.scale.set(1, 1, Math.max(0.02, up))
    }
    guns.list.forEach((g, i) => poseGun(g, view.corners[i]!, t, light))
    poseBar(bar.bar, view)
    wreck.pose(view, light)
    // The surge of light as the page splits.
    if (light && t >= ARENA.splitAt && t < ARENA.splitAt + 1.1) {
      const surge = seamLight(t) - 1
      if (surge > 0.05) for (const l of SEAM_LAMPS) light({ x: l.x, y: l.y, z: 6, colour: [1, 0.45, 0.1], power: 0.9 * surge, reach: 520 })
    }
  }

  return {
    object: root,
    pose,
    dispose(): void {
      ground.dispose()
      pillars.dispose()
      panes.dispose()
      guns.dispose()
      bar.dispose()
      wreck.dispose()
      kit.own.forEach((m) => m.dispose())
    }
  }
}

// The same thing as a maker of the site: one shape of kind `anchor` over the whole page (x 0, y 0, w 1920, h 1080, z0 0) is all it wants.
export function arenaPart(viewOf: () => BossView | null): PartMaker {
  return {
    key: (s: Shape): string | null => (s.kind === 'anchor' ? 'arena' : ''),
    make(): THREE.Object3D {
      const arena = makeArena()
      arena.object.userData.arena = arena
      arena.object.visible = false
      return arena.object
    },
    pose(o: THREE.Object3D, _s: Shape, ctx: RealContext): void {
      const view = viewOf()
      const arena = o.userData.arena as Arena
      if (!view) {
        o.visible = false
        return
      }
      arena.pose(view, 0, ctx.light)
    },
    drop(o: THREE.Object3D): void {
      ;(o.userData.arena as Arena | undefined)?.dispose()
    }
  }
}
