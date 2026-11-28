import * as THREE from 'three'
import { arenaPart, shake } from '../../../arena'
import { barDrop } from '../../../arena/change'
import { ARENA } from '../../../arena/layout'
import { beamLight, finishPart, finishState } from '../../../boss/finish/index'
import { makeBoss, type BossLook } from '../../../boss/look1'
import { barNow, finishNow, seatView, viewNow } from '../../../boss/viewof'
import type { PageReal, PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { verifyCard } from './verify-card'
import { healthBar } from './health-bar'
import { bossWeapons, weaponsOnce } from './boss-weapons'
import { lit } from './rise'
import { warmed } from './warm'
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
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    seatView(s)
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
    seatView(s)
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

// The health bar after the kill: the arena has posed it where it stands; from `boss-gone` it is put where its own drop had it, run backwards, and at the end it is taken out.
const barLeaves = (inner: PartMaker): PartMaker => ({
  ...inner,
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    inner.pose?.(o, s, ctx)
    const k = barNow()
    const bar = k > 0 ? o.getObjectByName('arena-bar') : undefined
    if (!bar) return
    bar.position.z = barDrop(ARENA.barLands - k * (ARENA.barLands - ARENA.barAt)).lift
    if (k >= 1) bar.visible = false
  }
})

export const real: PageReal = { parts: { 'verify-card': verifyCard, 'health-bar': healthBar, 'boss-weapons': bossWeapons, 'boss-body': bossBody, 'boss-transform': bossTransform, 'boss-arena': shaken(arenaPart(viewNow, { beam: () => { const i = finishNow(); return i ? beamLight(finishState(i)) : null }, upright: () => finishNow()?.low ?? 0, shade: () => finishNow()?.low ?? 0, fade: () => finishNow()?.fade ?? null })), 'boss-look1': shaken(bossLook), 'boss-finish': finishPart(finishNow) } }
real.parts['boss-finish'] = lit(real.parts['boss-finish']!)
real.parts['boss-arena'] = barLeaves(real.parts['boss-arena']!)
real.parts['boss-arena'] = warmed(real.parts['boss-arena']!, weaponsOnce)
real.parts['boss-look1'] = warmed(real.parts['boss-look1']!)
real.parts['boss-finish'] = warmed(real.parts['boss-finish']!)
