import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { actingLook } from '../src/cursor/act/acting'
import { damageLook } from '../src/cursor/act/damage'
import type { CursorPose } from '../src/cursor/body'
import { restLook, UNIT } from '../src/cursor/contract'
import { middleOf } from '../src/cursor/fit'
import { Deform, drawnStretch } from '../src/cursor/model/deform'
import { CENTRE, TOP } from '../src/cursor/model/shape'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const OUTLINE: [number, number][] = [[0, 0], [0, 16.2], [3.9, 12.6], [6.9, 19], [9.6, 17.8], [6.7, 11.6], [11.8, 11.6]]
const GLASS = 40
const BORE = 42
const BALL = config.table.ballPx
const UP = new THREE.Vector3(0, 0, 1)
const deform = new Deform()
const out = { x: 0, y: 0, z: 0 }

const reach = (c: CursorPose, time: number, ball: { x: number; y: number; z: number }): number => {
  const look = restLook(time)
  look.body.stretch = c.squash
  actingLook?.(c, look)
  damageLook?.(c, look)
  look.body.sealed = 1
  const turn = -c.lean - c.spin
  deform.set(look.body)
  deform.lean(turn)
  const q = new THREE.Quaternion()
  const m = middleOf(drawnStretch(look.body.stretch, look.body.melt))
  const at = c.centred ? new THREE.Vector3(-m.x * UNIT, m.y * UNIT, 0).applyAxisAngle(UP, turn) : new THREE.Vector3(-CENTRE[0] * UNIT, CENTRE[1] * UNIT, 0).applyAxisAngle(UP, -c.spin)
  if (c.face) {
    const n = new THREE.Vector3(c.face.x, c.face.y, c.face.z).normalize()
    q.setFromUnitVectors(UP, n)
    at.applyQuaternion(q).addScaledVector(n, -c.face.back)
  }
  at.x += c.x - ball.x * BALL
  at.y -= c.y - ball.y * BALL
  at.z += c.z - ball.z * BALL + 1
  let most = 0
  for (const [x, y] of OUTLINE) for (const z of [0, TOP]) {
    deform.point(x, y, z, 0, out)
    const p = new THREE.Vector3(out.x, out.y, out.z).applyAxisAngle(UP, turn).applyQuaternion(q).add(at)
    most = Math.max(most, p.length())
  }
  return most
}

const take = (() => {
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const rows: { time: number; reach: number; damage: string[]; acting: string; reaction: string | null }[] = []
  while (!s.finished && s.time < 42) {
    s.advance(1)
    const c = s.cursor.pose()
    const ball = (s.page.save() as { m: { balls: { x: number; y: number; z: number }[] } }).m.balls[0]
    if (c.inBall && ball) rows.push({ time: s.time, reach: reach(c, s.time, ball), damage: c.damage, acting: c.acting, reaction: c.reaction })
  }
  return { rows, events: s.events.map((e) => ({ name: e.name, time: e.step / stepHz })) }
})()

describe('the arrow in the ball over the whole take', () => {
  it('keeps every corner of the arrow inside the glass at every step', () => {
    expect(take.rows.length).toBeGreaterThan(30 * stepHz)
    const worst = take.rows.reduce((a, b) => (b.reach > a.reach ? b : a))
    expect(worst.reach, `at ${worst.time.toFixed(2)} s, ${worst.acting}, ${worst.reaction}`).toBeLessThanOrEqual(BORE)
    const whole = take.rows.filter((r) => r.damage.length === 0).reduce((a, b) => (b.reach > a.reach ? b : a))
    expect(whole.reach, `at ${whole.time.toFixed(2)} s, ${whole.acting}, ${whole.reaction}`).toBeLessThanOrEqual(GLASS)
  })

  it('is flattened in the ball by the doors of the headquarters alone', () => {
    const slam = take.events.filter((e) => e.name === 'doors-slam').map((e) => e.time)
    expect(slam.length).toBe(1)
    const flat = take.rows.filter((r) => r.damage.includes('flattened'))
    expect(flat.length).toBeGreaterThan(0)
    for (const r of flat) expect(r.time, `flattened at ${r.time.toFixed(2)} s`).toBeGreaterThanOrEqual(slam[0]! - 1 / stepHz)
    const last = flat[flat.length - 1]!.time
    const next = take.events.filter((e) => e.time > slam[0]! + 0.05 && ['bumper', 'sling', 'scoop-kick', 'ball-hit', 'ball-save', 'flipper-save', 'drain', 'tier-fall'].includes(e.name))[0]
    expect(next).toBeDefined()
    expect(last).toBeLessThan(next!.time)
    expect(take.rows.every((r) => r.damage.every((d) => d === 'flattened'))).toBe(true)
    expect(config.table.ballPx / 2).toBeGreaterThan(GLASS)
  })
})
