import * as THREE from 'three'
import { arenaPart, shake } from '../../../arena'
import { beamLight, finishPart, finishState } from '../../../boss/finish/index'
import { makeBoss, type BossLook } from '../../../boss/look1'
import { finishNow, viewNow } from '../../../boss/viewof'
import type { PageReal, PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { verifyCard } from './verify-card'
import { healthBar } from './health-bar'
import { bossWeapons } from './boss-weapons'
import { lit } from './rise'
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
    o.visible = view !== null
    if (o.visible && view) (o.userData.look as BossLook).pose(view, 1 / 60, ctx.light)
  },
  drop(o: THREE.Object3D): void {
    ;(o.userData.look as BossLook | undefined)?.dispose()
  }
}

// The ground's knocks (the crack, the split, each lock, the bar's landing, each blast) move the arena and the boss, never the arrow, the caption or the bar's words.
const shaken = (inner: PartMaker): PartMaker => ({
  key: (s: Shape, ctx: RealContext): string | null => inner.key(s, ctx),
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    const group = new THREE.Group()
    const o = inner.make(s, ctx)
    group.add(o)
    group.userData.inner = o
    return group
  },
  pose(group: THREE.Object3D, s: Shape, ctx: RealContext): void {
    inner.pose?.(group.userData.inner as THREE.Object3D, s, ctx)
    const view = viewNow()
    const k = view ? shake(view.time, view.breaks.map((b) => b.at)) : { x: 0, y: 0, roll: 0 }
    group.position.set(k.x, -k.y, 0)
    group.rotation.z = -k.roll
  },
  drop(group: THREE.Object3D): void {
    inner.drop?.(group.userData.inner as THREE.Object3D)
  }
})

export const real: PageReal = { parts: { 'verify-card': verifyCard, 'health-bar': healthBar, 'boss-weapons': bossWeapons, 'boss-body': bossBody, 'boss-transform': bossTransform, 'boss-arena': shaken(arenaPart(viewNow, { beam: () => { const i = finishNow(); return i ? beamLight(finishState(i)) : null } })), 'boss-look1': shaken(bossLook), 'boss-finish': finishPart(finishNow) } }
real.parts['boss-finish'] = lit(real.parts['boss-finish']!)
