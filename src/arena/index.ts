// The boss arena: the form page become another world. It draws itself from a BossView and from nothing else.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
import * as THREE from 'three'
import type { BossView } from '../boss/view'
import { config } from '../config'
import type { Emitter, PartMaker, RealContext } from '../real/types'
import type { Shape } from '../stage/types'
import { rise, seamLight } from './change'
import { makeFinish, type BeamDriver } from './finish'
import { makeGround } from './ground'
import { studio } from '../post/studio'
import { ARENA, EYE, PAGE, PANES, PILLARS } from './layout'
import { makeBar, makeGuns, makeKit, makePanes, makePillars, poseBar, poseGun } from './props'
import { makeWreck } from './wreck'

export { ARENA, MIDDLE, PANES, PILLARS, SEAMS, SLABS } from './layout'
export { solids, standing, brokenBy, breaksBox } from './solids'
export { shake, KNOCKS, BLAST_KNOCK } from './change'
export { SCORCH, beamOf, scorchFrom, scorchOf, type BeamLight, type BlastLine } from './scorch'
export type { BeamDriver } from './finish'

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

// `beam`: who drives the arena's answer to a cold beam (the light on the ground from its line, the long shadows of what stands). Left out, the arena reads the finishing blast from the view (beamOf).
// `upright`: 0 to 1, how far what stands is stood upright for a low lens. 0, and left out, is the picture's own lean.
// `shade`: 0 to 1, how far the pillars' bodies and the sides of their stumps stand in shade for a low lens: at 1 they keep 0.4 of their colour and of the light they mirror. 0, and left out, is the picture's own light.
// `fade`: by the id of a pillar or a pane, 0 to 1, how far it has faded out of the picture for a low lens it stands in the way of. Nothing said, or 0, is the arena as it was.
export interface ArenaOptions { seed?: number; beam?: BeamDriver; upright?: () => number; shade?: () => number; fade?: () => Readonly<Record<string, number>> | null }

export function makeArena(o: ArenaOptions = {}): Arena {
  const seed = o.seed ?? config.seed
  const root = new THREE.Group()
  root.name = 'arena'
  const kit = makeKit()
  const metal = { colour: kit.standing.color.clone(), mirrored: kit.standing.envMapIntensity }
  const ghosts: THREE.MeshPhysicalMaterial[] = []
  const glasses: [THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial][] = []
  const thin = <T extends THREE.MeshPhysicalMaterial>(m: T): T => {
    const g = studio(m.clone())
    g.transparent = true
    return g
  }
  const ground = makeGround(seed)
  const pillars = makePillars(kit)
  const panes = makePanes(kit)
  const guns = makeGuns(kit)
  const bar = makeBar(kit)
  const wreck = makeWreck(seed, kit, ground.wounds, pillars.list, panes.list)
  const finish = makeFinish(seed, kit, ground.wounds)
  root.add(ground.object, pillars.object, panes.object, guns.object, bar.bar.root, wreck.object, finish.object)

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
      p.whole.visible = true
      p.shade.visible = up > 0.5
      p.foot.visible = up > 0
      p.foot.scale.set(1, 1, Math.min(1, Math.max(0.02, up * 6)))
      p.root.scale.set(1, 1, Math.max(0.02, up))
    }
    guns.list.forEach((g, i) => poseGun(g, view.corners[i]!, t, light))
    poseBar(bar.bar, view)
    wreck.pose(view, light)
    finish.pose(view, light, o.beam)
    const lit = 1 - 0.6 * Math.min(1, Math.max(0, o.shade?.() ?? 0))
    kit.standing.color.copy(metal.colour).multiplyScalar(lit)
    kit.standing.envMapIntensity = metal.mirrored * lit
    const k = Math.min(1, Math.max(0, o.upright?.() ?? 0))
    for (const g of [pillars.object, panes.object, wreck.object]) {
      if (k > 0) {
        g.matrixAutoUpdate = false
        g.matrix.set(1, 0, -k * ARENA.leanX, 0, 0, 1, -k * ARENA.lean, 0, 0, 0, 1, 0, 0, 0, -k / EYE, 1)
        g.matrixWorldNeedsUpdate = true
      } else g.matrixAutoUpdate = true
    }
    const faded = o.fade?.() ?? null
    panes.list.forEach((p, i) => {
      const gone = Math.min(1, Math.max(0, faded?.[PANES[i]!.id] ?? 0))
      const [sheet, cap] = p.whole.children as [THREE.Mesh, THREE.Mesh]
      if (gone > 0 && p.whole.visible) {
        if (gone >= 1) p.whole.visible = false
        else {
          const g = (glasses[i] ??= [thin(kit.glass), thin(kit.glassEdge)])
          g[0].opacity = kit.glass.opacity * (1 - gone)
          g[1].opacity = kit.glassEdge.opacity * (1 - gone)
          sheet.material = g[0]
          cap.material = g[1]
        }
      } else if (sheet.material !== kit.glass) {
        sheet.material = kit.glass
        cap.material = kit.glassEdge
      }
    })
    // Once every pillar is up, the eight are drawn as one body and one set of feet.
    const settled = t >= ARENA.riseTo + 0.1
    pillars.one.bodies.visible = settled
    pillars.one.feet.visible = settled
    if (settled) {
      let standing = 0
      pillars.list.forEach((p, i) => {
        const gone = Math.min(1, Math.max(0, faded?.[PILLARS[i]!.id] ?? 0))
        const stands = p.root.visible
        if (stands && gone <= 0) standing |= 1 << i
        p.root.visible = stands && gone > 0 && gone < 1
        p.foot.visible = false
        if (p.root.visible) {
          const g = (ghosts[i] ??= thin(kit.standing))
          g.color.copy(kit.standing.color)
          g.envMapIntensity = kit.standing.envMapIntensity
          g.opacity = 1 - gone
          p.body.material = g
          p.body.castShadow = gone < 0.5
        } else if (p.body.material !== kit.standing) {
          p.body.material = kit.standing
          p.body.castShadow = true
        }
      })
      pillars.one.show(standing)
      pillars.one.bodies.visible = standing !== 0
    }
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
      finish.dispose()
      kit.own.forEach((m) => m.dispose())
      ghosts.forEach((m) => m.dispose())
      glasses.forEach((g) => g.forEach((m) => m.dispose()))
    }
  }
}

// The same thing as a maker of the site: one shape of kind `anchor` over the whole page (x 0, y 0, w 1920, h 1080, z0 0) is all it wants.
export function arenaPart(viewOf: () => BossView | null, o: ArenaOptions = {}): PartMaker {
  return {
    key: (s: Shape): string | null => (s.kind === 'anchor' ? 'arena' : ''),
    make(): THREE.Object3D {
      const arena = makeArena(o)
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
