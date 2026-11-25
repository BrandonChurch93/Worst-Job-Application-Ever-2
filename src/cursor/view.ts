import * as THREE from 'three'
import { config } from '../config'
import type { RealContext } from '../real/types'
import { actingLook } from './act/acting'
import { makeArms } from './act/arms'
import { damageLook } from './act/damage'
import type { CursorPose } from './body'
import { restLook, SHOULDERS, UNIT, type ArmsModel, type BodyModel, type EffectsModel } from './contract'
import { makeBody } from './model/body'
import { makeEffects } from './model/effects'

// Which of the cursor's five parts are made. The rest are drawn as stand-ins by the page's view.
export const cursorReal = { body: makeBody !== null, effects: makeEffects !== null, acting: actingLook !== null, damage: damageLook !== null, arms: makeArms !== null }

const half = config.table.ballPx / 2

// One cursor made of its parts: the body, its effects and its arms, posed from what the cursor is doing.
export class CursorView {
  readonly root = new THREE.Group()
  private at = new THREE.Group()
  private body: BodyModel | null = makeBody ? makeBody() : null
  private effects: EffectsModel | null = makeEffects ? makeEffects() : null
  private arms: ArmsModel | null = makeArms ? makeArms() : null
  private from: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()]
  private to: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()]

  constructor() {
    this.root.add(this.at)
    if (this.body) this.at.add(this.body.root)
    if (this.effects) this.at.add(this.effects.root)
    if (this.arms) this.root.add(this.arms.root)
  }

  apply(c: CursorPose, ctx: RealContext): void {
    const look = restLook(ctx.time)
    look.body.stretch = c.squash
    actingLook?.(c, look)
    damageLook?.(c, look)
    const turn = -c.lean - c.spin
    if (c.inBall) this.at.position.set(c.x - 960 - 4.2 * UNIT, 540 - c.y + 9.5 * UNIT, c.z + half + 1)
    else this.at.position.set(c.x - 960, 540 - c.y, c.z)
    this.at.scale.setScalar(c.scale)
    if (this.body) {
      this.body.root.rotation.set(0, 0, turn)
      this.body.apply(look.body)
    }
    if (this.effects && this.body) this.effects.apply(look.effects, this.body, turn)
    if (!this.arms) return
    const hands = c.arms ? c.hands : null
    this.arms.root.visible = hands !== null
    if (!hands || !this.body) return
    this.root.updateMatrixWorld(true)
    for (let i = 0; i < 2; i++) {
      const s = SHOULDERS[i]!
      this.body.root.localToWorld(this.body.anchor(s[0], s[1], this.from[i]!))
      this.root.worldToLocal(this.from[i]!)
      const h = hands[i]!
      this.to[i]!.set(h.x - 960, 540 - h.y, h.z)
    }
    this.arms.apply(this.from, this.to, look.arms)
  }

  dispose(): void {
    this.body?.dispose()
    this.effects?.dispose()
    this.arms?.dispose()
  }
}
