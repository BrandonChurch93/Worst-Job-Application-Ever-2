// The finish: the standing arrow, its acting and what burns round it, as one thing the fight can pose.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
import * as THREE from 'three'
import { makeStand } from '../../cursor/stand/figure'
import { STAND } from '../../cursor/stand/rig'
import { look } from '../../post/look'
import type { Emitter, PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { finishState, type FinishInput, type FinishState } from './acting'
import { makeFinishFx, type Level } from './fx'

export { finishState, finishEvents, kneelSpot, GETUP, LEAD, LIEDOWN, POWER, CHARGE, FIRE, LAST } from './acting'
export type { FinishInput, FinishMarks, FinishState, FinishEvent, Fx } from './acting'
export type { Level } from './fx'

const FACE = { y: 46, z: 78, colour: [1, 0.975, 0.945] as [number, number, number], power: 0.3, reach: 190 }
// The shadow the beam throws behind the figure: px of shadow for each px of height, a little down the page, and how much darker than the key's.
const BLAST = { fall: 2.6, down: -0.35, dark: 0.5 }

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
        // A flame beside the figure outshines the key: its long shadow thins. The beam throws one of its own, long, away from the hands.
        const beam = s.fx.beam
        const key = look.key.direction
        const open = beam ? beam.open : 0
        const kx = (-key[0] / key[2]) * STAND.shadow
        const ky = (-key[1] / key[2]) * STAND.shadow
        const fall: [number, number] = beam ? [kx + (-Math.cos(beam.aim) * BLAST.fall - kx) * open, ky + (Math.sin(beam.aim) * BLAST.fall + BLAST.down - ky) * open] : [kx, ky]
        const lit = Math.max(0.75 * Math.min(1, s.fx.aura) * (1 - open), s.fx.ball ? 0.5 * Math.min(1, s.fx.ball.glow) : 0)
        stand.apply(s.pose, input.time, (1 - lit) * (1 + BLAST.dark * open), fall)
        fx.pose(s.fx, s.pose, input.time, light)
        // The white face is tipped away from the key when it stands: a little of the page's own light comes back up onto it.
        const up = Math.min(1, s.pose.rise * 1.5)
        if (light && up > 0.02) light({ x: s.pose.x, y: s.pose.y + FACE.y, z: s.pose.ground + FACE.z, colour: FACE.colour, power: FACE.power * up * (1 - 0.8 * open), reach: FACE.reach })
      }
      return s
    },
    setLevel(level: Level): void {
      stand.setLevel(level)
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

// The beam as the arena wants it for its cold wash and its drawn shadows: the line it burns along, page px, and how strong.
export function beamLight(s: FinishState | null): { x0: number; y0: number; x1: number; y1: number; strength: number } | null {
  const b = s?.fx.beam
  if (!b) return null
  return { x0: b.x, y0: b.y, x1: b.x + Math.cos(b.aim) * 2400, y1: b.y + Math.sin(b.aim) * 2400, strength: (0.4 + 0.6 * b.power) * b.open }
}
