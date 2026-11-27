import * as THREE from 'three'
import { arenaPart } from '../../../arena'
import { makeBoss, type BossLook } from '../../../boss/look1'
import { viewNow } from '../../../boss/viewof'
import type { PageReal, PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { verifyCard } from './verify-card'
import { healthBar } from './health-bar'
import { bossWeapons } from './boss-weapons'
import { bossBody } from '../../../boss/real/body'
import { bossTransform } from '../../../boss/real/transform'

const bossLook: PartMaker = {
  key: (s: Shape): string | null => (s.kind === 'anchor' ? 'boss-look1' : ''),
  make(): THREE.Object3D {
    const look = makeBoss()
    look.object.userData.look = look
    look.object.visible = false
    return look.object
  },
  pose(o: THREE.Object3D, _s: Shape, ctx: RealContext): void {
    const view = viewNow()
    o.visible = view !== null && !((view.boss.gone ?? 0) >= 1)
    if (o.visible && view) (o.userData.look as BossLook).pose(view, 1 / 60, ctx.light)
  },
  drop(o: THREE.Object3D): void {
    ;(o.userData.look as BossLook | undefined)?.dispose()
  }
}

export const real: PageReal = { parts: { 'verify-card': verifyCard, 'health-bar': healthBar, 'boss-weapons': bossWeapons, 'boss-body': bossBody, 'boss-transform': bossTransform, 'boss-arena': arenaPart(viewNow), 'boss-look1': bossLook } }
