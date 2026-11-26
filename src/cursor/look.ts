import { actingLook } from './act/acting'
import { damageLook } from './act/damage'
import type { CursorPose } from './body'
import { restLook, type CursorLook } from './contract'

// What a pose asks its parts to look like: its length, its acting and its damage. Sealed in the clear ball, nothing rises out of it and the body is told so, which is how the glass comes to hold it.
export function lookOf(c: CursorPose, time: number): CursorLook {
  const look = restLook(time)
  look.body.stretch = c.squash
  actingLook?.(c, look)
  damageLook?.(c, look)
  if (c.inBall) {
    look.effects.smoke = []
    look.effects.steam = 0
    look.effects.dust = -1
  }
  look.body.sealed = c.inBall ? 1 : 0
  look.arms.grip = [c.grip[0], c.grip[1]]
  look.arms.strain = c.strain
  return look
}
