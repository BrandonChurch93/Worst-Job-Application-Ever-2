import * as THREE from 'three'
import { config } from '../config'
import type { Emitter, RealContext } from '../real/types'
import { actingLook } from './act/acting'
import { makeArms, type Arms } from './act/arms'
import { damageLook } from './act/damage'
import { makeTape, type Tape } from './act/tape'
import type { CursorPose } from './body'
import { restLook, SHOULDERS, UNIT, type BodyModel, type EffectsModel } from './contract'
import { makeBody } from './model/body'
import { makeEffects } from './model/effects'

// Which of the cursor's five parts are made. The rest are drawn as stand-ins by the page's view.
// Acting, damage and arms are drawn on the body, so none of them is real before the body is.
const whole = makeBody !== null
export const cursorReal = { body: whole, effects: makeEffects !== null, acting: whole && actingLook !== null, damage: whole && damageLook !== null, arms: whole && makeArms !== null }

const half = config.table.ballPx / 2
// A closed hand rides this far above where it holds, so that the fingers lie on what is held and not inside it.
const HOLD = 1
// An arm is rooted this share of the way in from the shoulder, so that it leaves from under the edge and never from beside it.
const ROOT = 0.2
// Two closed hands hold a sheet by its two side edges. Each stands `out` outside its edge, so that the palm is beside the sheet and the thumb on it. They are not level: one reaches `reach` further down its edge than the other, and it is the hand that is higher up the page, where a tilted sheet has the longer edge left. `tilt` is how fast the reach goes from one hand to the other as the sheet turns, `down` what each has when the sheet is square.
// After the sheet is lost, in shares of the time the body gives the arms (`ARM.shed`): the hands fall in `fall`, hang until `hold`, and are back in the body at 1. `under` is where each hangs, in the outline's units: under the body, below its own shoulder. The hose is `short` shorter by then, so no loop of it stands out beside the body.
const SHED = { fall: 0.3, hold: 0.62, under: [[1.5, 15.6], [7.3, 15.6]], low: 1, short: 0.55 }
const EDGE = { out: 6.5, down: [4, 0], reach: 10, tilt: 2, least: 12 }

// One cursor made of its parts: the body, its effects and its arms, posed from what the cursor is doing.
export class CursorView {
  readonly root = new THREE.Group()
  private at = new THREE.Group()
  private body: BodyModel | null = makeBody ? makeBody() : null
  private effects: EffectsModel | null = makeEffects ? makeEffects() : null
  private arms: Arms | null = makeArms ? makeArms() : null
  private tape: Tape | null = makeBody ? makeTape() : null
  private from: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()]
  private to: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()]
  private lit: Emitter[] = []
  private spot = new THREE.Vector3()
  private hang = new THREE.Vector3()

  constructor() {
    this.root.add(this.at)
    if (this.body) this.at.add(this.body.root)
    if (this.effects) this.at.add(this.effects.root)
    if (this.tape) this.at.add(this.tape.root)
    if (this.arms) this.root.add(this.arms.root)
  }

  apply(c: CursorPose, ctx: RealContext): void {
    const look = restLook(ctx.time)
    look.body.stretch = c.squash
    actingLook?.(c, look)
    damageLook?.(c, look)
    look.arms.grip = [c.grip[0], c.grip[1]]
    look.arms.strain = c.strain
    const turn = -c.lean - c.spin
    if (c.inBall) this.at.position.set(c.x - 960 - 4.2 * UNIT, 540 - c.y + 9.5 * UNIT, c.z + half + 1)
    else this.at.position.set(c.x - 960, 540 - c.y, c.z)
    this.at.scale.setScalar(c.scale)
    if (this.body) {
      this.body.root.rotation.set(0, 0, turn)
      this.body.apply(look.body)
    }
    if (this.effects && this.body) this.effects.apply(look.effects, this.body, turn)
    if (this.tape && this.body) {
      const back = c.wounds.find((w) => w.kind === 'reassembled')
      this.tape.root.rotation.set(0, 0, turn)
      this.tape.apply(back ? back.at : 0, this.body, c.strips ? Math.max(0, ...c.strips.map((p) => p.z)) : 0)
    }
    if (this.body?.emit) {
      this.root.updateMatrixWorld(true)
      this.lit.length = 0
      this.body.emit(this.lit)
      for (const e of this.lit) {
        this.body.root.localToWorld(this.spot.set(e.x, e.y, e.z))
        ctx.light({ ...e, x: this.spot.x + 960, y: 540 - this.spot.y, z: this.spot.z })
      }
    }
    if (!this.arms) return
    const hands = c.arms ? c.hands : null
    this.arms.root.visible = hands !== null
    if (!hands || !this.body) return
    this.root.updateMatrixWorld(true)
    const grown = Math.max(0, c.sprout)
    const gone = Math.min(1, Math.max(0, (c.shed - SHED.hold) / (1 - SHED.hold)))
    const back = gone * gone * (3 - 2 * gone)
    for (let i = 0; i < 2; i++) {
      const s = SHOULDERS[i]!
      const from = this.from[i]!
      const to = this.to[i]!
      const o = SHOULDERS[1 - i]!
      this.body.root.localToWorld(this.body.anchor(s[0] + (o[0] - s[0]) * ROOT, s[1], from))
      this.root.worldToLocal(from)
      const h = hands[i]!
      to.set(h.x - 960, 540 - h.y, h.z + HOLD * c.grip[i]!)
      to.lerpVectors(from, to, Math.min(1.12, grown))
      // Let go: the hand opens and falls to hang close under its own side of the body, stays there, and is drawn back into the shoulder. The arms go with the body and are never left where the sheet was.
      if (c.shed > 0) {
        const fall = 1 - Math.pow(1 - Math.min(1, c.shed / SHED.fall), 3)
        this.body.root.localToWorld(this.body.anchor(SHED.under[i]![0], SHED.under[i]![1], this.hang))
        this.root.worldToLocal(this.hang)
        this.hang.z = from.z - SHED.low
        to.lerp(this.hang, fall)
        to.lerp(from, back)
        look.arms.grip[i] = c.grip[i]! * (1 - fall)
      }
    }
    const a = this.to[0]!
    const b = this.to[1]!
    const span = Math.hypot(b.x - a.x, b.y - a.y)
    const held = Math.min(c.grip[0], c.grip[1]) * (c.shed > 0 ? 0 : 1)
    if (held > 0 && span > EDGE.least) {
      const ex = (b.x - a.x) / span
      const ey = (b.y - a.y) / span
      const away = (a.x + b.x - this.from[0]!.x - this.from[1]!.x) * -ey + (a.y + b.y - this.from[0]!.y - this.from[1]!.y) * ex < 0 ? -1 : 1
      const high = Math.min(1, Math.max(0, 0.5 + ey * EDGE.tilt))
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1
        const down = (EDGE.down[i]! + EDGE.reach * (i === 0 ? 1 - high : high)) * held * away
        this.to[i]!.x += side * ex * EDGE.out * held - ey * down
        this.to[i]!.y += side * ey * EDGE.out * held + ex * down
      }
      this.arms.inward = [[ex, ey], [-ex, -ey]]
    } else this.arms.inward = [null, null]
    this.arms.grown = c.shed > 0 ? (1 - SHED.short * Math.min(1, c.shed / SHED.fall)) * (1 - back) : grown
    this.arms.over = c.z + 2 * (Math.max(this.from[0]!.z, this.from[1]!.z) - c.z)
    const ax = this.from[1]!.x - this.from[0]!.x
    const ay = this.from[1]!.y - this.from[0]!.y
    const al = Math.hypot(ax, ay) || 1
    this.arms.axis = [ax / al, ay / al]
    this.arms.apply(this.from, this.to, look.arms)
  }

  dispose(): void {
    this.body?.dispose()
    this.effects?.dispose()
    this.arms?.dispose()
    this.tape?.dispose()
  }
}
