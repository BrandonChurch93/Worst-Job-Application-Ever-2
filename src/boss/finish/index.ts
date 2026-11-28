// The finish: the standing arrow, its acting and what burns round it, as one thing the fight can pose.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
import * as THREE from 'three'
import { makeStand } from '../../cursor/stand/figure'
import type { Emitter, PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { finishState, type FinishInput, type FinishState } from './acting'
import { makeFinishFx, type Level } from './fx'

export { finishState, finishEvents, kneelSpot, GETUP, LIEDOWN, POWER, CHARGE, FIRE, LAST } from './acting'
export type { FinishInput, FinishMarks, FinishState, FinishEvent, Fx } from './acting'
export type { Level } from './fx'

export interface Finish {
  object: THREE.Object3D
  // Draws one moment. Returns the state it drew: `up` says the ordinary arrow is to be hidden, `press` how far the button is down.
  pose(input: FinishInput, light?: (e: Emitter) => void): FinishState
  setLevel(level: Level): void
  counts(): { draws: number; triangles: number }
  dispose(): void
}

export function makeFinish(): Finish {
  const object = new THREE.Group()
  object.name = 'finish'
  const stand = makeStand()
  const fx = makeFinishFx()
  object.add(stand.object, fx.object)
  object.visible = false
  return {
    object,
    pose(input: FinishInput, light?: (e: Emitter) => void): FinishState {
      const s = finishState(input)
      object.visible = s.up
      if (s.up) {
        stand.apply(s.pose, input.time)
        fx.pose(s.fx, s.pose, input.time, light)
      }
      return s
    },
    setLevel(level: Level): void {
      fx.setLevel(level)
    },
    counts(): { draws: number; triangles: number } {
      if (!object.visible) return { draws: 0, triangles: 0 }
      const a = stand.counts()
      return { draws: a.draws + fx.counts().draws, triangles: a.triangles }
    },
    dispose(): void {
      stand.dispose()
      fx.dispose()
    }
  }
}

// The finish as a part of a page: one anchor shape, posed from what the fight says now.
export function finishPart(inputOf: () => FinishInput | null, level: () => Level = () => null): PartMaker {
  return {
    key: (s: Shape): string | null => (s.kind === 'anchor' ? 'finish' : ''),
    make(): THREE.Object3D {
      const finish = makeFinish()
      finish.object.userData.finish = finish
      return finish.object
    },
    pose(o: THREE.Object3D, _s: Shape, ctx: RealContext): void {
      const finish = o.userData.finish as Finish
      const input = inputOf()
      if (!input) {
        o.visible = false
        return
      }
      finish.setLevel(level())
      finish.pose(input, ctx.light)
    },
    drop(o: THREE.Object3D): void {
      ;(o.userData.finish as Finish | undefined)?.dispose()
    }
  }
}
