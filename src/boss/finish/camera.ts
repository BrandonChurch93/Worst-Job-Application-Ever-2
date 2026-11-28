import { config } from '../../config'
import { feetFor, STAND } from '../../cursor/stand/rig'

export { feetFor }
import { toWorld } from '../../stage/camera'
import type { CameraPose } from '../../stage/types'
import { CAMERA, CLOSE, LAST, SHOUT } from '../tune'

type V3 = [number, number, number]
export interface Rig { at: V3; az: number; el: number; tall: number; fov: number }
export interface Key { at: readonly [number, number, number]; az: number; el: number; tall: number; fov: number }
export interface Marks { arms: number; turn: number; fire: number; round: number }
export type ViewName = 'above' | 'charge' | 'fire' | 'blast' | 'end'
export interface Shot { pose: CameraPose; rig: Rig; low: number; tip: number; view: ViewName; glare: number }

const RAD = Math.PI / 180
const clamp = (v: number): number => Math.min(1, Math.max(0, v))
const smooth = (v: number): number => { const t = clamp(v); return t * t * (3 - 2 * t) }
const ease = (t: number, from: number, to: number): number => smooth((t - from) / (to - from))
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k
const glide = (v: number, e: number): number => { const k = clamp(v); return k < e ? (k * k) / (2 * e * (1 - e)) : k > 1 - e ? 1 - ((1 - k) * (1 - k)) / (2 * e * (1 - e)) : (k - e / 2) / (1 - e) }

export const ABOVE: Rig = { at: toWorld(CLOSE.x + CLOSE.w / 2, CLOSE.y + CLOSE.h / 2, 0), az: -90, el: 90, tall: CLOSE.h, fov: config.cameras.home.fovDeg }
export const FEET = ((): V3 => { const f = feetFor({ x: LAST.stand[0], y: LAST.stand[1] }); return toWorld(f.x, f.y, 0) })()

export const keyAt = (k: Key, feet: V3 = FEET): Rig => ({ at: [feet[0] + k.at[0], feet[1] + k.at[1], feet[2] + k.at[2]], az: k.az, el: k.el, tall: k.tall, fov: k.fov })

const soon = (k: number, by: number): number => 1 - (1 - k) ** by
const late = (k: number, by: number): number => k ** by

export const mixRig = (a: Rig, b: Rig, k: number, at = k, el = k, lens = k, az = k): Rig => (k <= 0 ? a : k >= 1 ? b : {
  at: [lerp(a.at[0], b.at[0], at), lerp(a.at[1], b.at[1], at), lerp(a.at[2], b.at[2], at)],
  az: lerp(a.az, b.az, az), el: lerp(a.el, b.el, el), tall: Math.exp(lerp(Math.log(a.tall), Math.log(b.tall), lens)), fov: lerp(a.fov, b.fov, lens)
})

export const lowOf = (r: Rig): number => 1 - smooth((r.el - CAMERA.lowEl[0]) / (CAMERA.lowEl[1] - CAMERA.lowEl[0]))

export function poseOf(r: Rig, shake: readonly [number, number] = [0, 0]): CameraPose {
  const az = r.az * RAD
  const el = r.el * RAD
  const d = r.tall / 2 / Math.tan((r.fov * RAD) / 2)
  const ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(az), sa = Math.sin(az)
  const up: V3 = [-se * ca, -se * sa, ce]
  const right: V3 = [-sa, ca, 0]
  const at: V3 = [r.at[0] + right[0] * shake[0] + up[0] * shake[1], r.at[1] + right[1] * shake[0] + up[1] * shake[1], r.at[2] + up[2] * shake[1]]
  const low = lowOf(r)
  const pose: CameraPose = { eye: [at[0] + ce * ca * d, at[1] + ce * sa * d, at[2] + se * d], target: at, up, fov: r.fov }
  if (low > 0 && CAMERA.open > 0) { pose.focus = d; pose.aperture = CAMERA.open * low }
  return pose
}

const shot = (rig: Rig, view: ViewName, shake: readonly [number, number] = [0, 0], glare = 0): Shot => {
  const low = lowOf(rig)
  return { pose: poseOf(rig, shake), rig, low, tip: CAMERA.upright * low, view, glare }
}

export const marksOf = (film: boolean, arms: number, thrust: number, fire: number): Marks => (film ? { arms, turn: arms + SHOUT.fire - SHOUT.arms - CAMERA.ahead, fire, round: CAMERA.round } : { arms, turn: thrust >= 0 ? thrust : fire, fire, round: CAMERA.roundLive })

export const LAST_LOW = CAMERA.rise[1] + CAMERA.hold + CAMERA.turn

export const over = (time: number, m: Marks): boolean => m.arms < 0 || time <= m.arms + CAMERA.down[0] || (m.fire >= 0 && time >= m.fire + LAST_LOW)

export const TOP: Rig = { at: [FEET[0] + CAMERA.top.at[0], FEET[1] + CAMERA.top.at[1], CAMERA.top.at[2]], az: CAMERA.top.az, el: 90, tall: CAMERA.top.tall, fov: ABOVE.fov }

const HALF = 55
export const sideOf = (r: Rig): number => {
  const e = poseOf(r).eye
  const a = STAND.rise + CAMERA.upright * lowOf(r)
  const v: V3 = [e[0] - FEET[0], e[1] - FEET[1] - HALF * Math.cos(a), e[2] - HALF * Math.sin(a)]
  return Math.asin((-v[1] * Math.sin(a) + v[2] * Math.cos(a)) / Math.hypot(v[0], v[1], v[2])) / RAD
}

const orbit = (k: number): Rig => mixRig(keyAt(CAMERA.charge), keyAt(CAMERA.fire), k, soon(k, CAMERA.lead), k, late(k, CAMERA.lag))
export const THIN = ((): [number, number] => {
  let from = 1
  let to = 0
  for (let i = 0; i <= 4000; i++) {
    if (Math.abs(sideOf(orbit(i / 4000))) >= CAMERA.thin) continue
    from = Math.min(from, i / 4000)
    to = Math.max(to, i / 4000)
  }
  return [from, to]
})()

export const whip = (u: number, round: number): { k: number; glare: number } => {
  const step = 1 / 60 / round
  const a = CAMERA.cross - (CAMERA.whip * step) / 2
  const b = a + CAMERA.whip * step
  const k = u <= 0 ? 0 : u >= 1 ? 1 : u < a ? THIN[0] * (u / a) ** 2 : u <= b ? lerp(THIN[0], THIN[1], (u - a) / (b - a)) : 1 - (1 - THIN[1]) * ((1 - u) / (1 - b)) ** 2
  const g = CAMERA.glare
  const glare = Math.min(ease(u, a - g[0] * step, a - g[1] * step), 1 - ease(u, b + g[2] * step, b + g[3] * step))
  return { k, glare }
}

export function finishRig(time: number, m: Marks): { rig: Rig; view: ViewName; shake: [number, number]; glare: number } {
  const t = time - m.arms
  const charge = keyAt(CAMERA.charge)
  const down = ease(t, CAMERA.down[0], CAMERA.down[1])
  let rig = mixRig(ABOVE, { ...charge, tall: charge.tall * (1 - CAMERA.push * smooth(t / CAMERA.pushOver)) }, down, soon(down, CAMERA.lead), late(down, CAMERA.lag))
  rig = { ...rig, az: lerp(ABOVE.az, charge.az, soon(down, CAMERA.swing)) }
  let view: ViewName = t <= CAMERA.down[0] ? 'above' : 'charge'
  let shake: [number, number] = [0, 0]
  let glare = 0
  if (m.turn >= 0 && time > m.turn) {
    const w = whip((time - m.turn) / m.round, m.round)
    rig = mixRig(rig, keyAt(CAMERA.fire), w.k, soon(w.k, CAMERA.lead), w.k, late(w.k, CAMERA.lag))
    glare = w.glare
    view = 'fire'
  }
  if (m.fire >= 0 && time > m.fire) {
    const f = time - m.fire
    rig = mixRig(rig, keyAt(CAMERA.blast), ease(f, CAMERA.back[0], CAMERA.back[1]))
    const up = ease(f, CAMERA.rise[0], CAMERA.rise[1])
    rig = mixRig(rig, TOP, up, up, soon(up, CAMERA.lift))
    if (up > 0 && up < 1) rig = { ...rig, tall: rig.tall * (1 + CAMERA.wide * Math.sin(Math.PI * up)) }
    const turn = glide((f - CAMERA.rise[1] - CAMERA.hold) / CAMERA.turn, CAMERA.ramp)
    if (turn > 0) {
      const to = soon(turn, CAMERA.lift)
      const tall = Math.exp(lerp(Math.log(TOP.tall), Math.log(ABOVE.tall), late(turn, CAMERA.lift)))
      rig = { at: [lerp(TOP.at[0], ABOVE.at[0], to), lerp(TOP.at[1], ABOVE.at[1], to), 0], az: lerp(TOP.az, ABOVE.az, turn), el: 90, tall, fov: ABOVE.fov }
    }
    if (f > CAMERA.back[0]) {
      view = f < CAMERA.rise[0] ? 'blast' : up < 1 ? 'end' : 'above'
      const b = f - CAMERA.back[0]
      const k = CAMERA.shake * Math.exp(-b / CAMERA.shakeDies) * smooth(b / 0.05) * (1 - up)
      shake = [k * Math.sin(b * 83), k * Math.sin(b * 67 + 1.3)]
    }
  }
  return { rig, view, shake, glare }
}

export function finishShot(time: number, m: Marks): Shot | null {
  if (!CAMERA.on || over(time, m)) return null
  const r = finishRig(time, m)
  return shot(r.rig, r.view, r.shake, r.glare)
}

export const underOf = (time: number, m: Marks): number => (!CAMERA.on || m.fire < 0 || time <= m.fire + CAMERA.rise[0] ? 0 : 1 - (finishShot(time, m)?.low ?? 0))

export function facing(from: Rig, feet: V3, k: number): Shot | null {
  if (!CAMERA.on || k <= 0) return null
  return shot(mixRig(from, keyAt(CAMERA.charge, feet), smooth(k)), 'charge')
}
