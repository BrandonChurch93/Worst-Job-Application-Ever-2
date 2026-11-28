import { config } from '../../config'
import { feetFor, STAND } from '../../cursor/stand/rig'

export { feetFor }
import { ARENA, EYE, PANES, PILLARS } from '../../arena/layout'
import { project, toWorld } from '../../stage/camera'
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
  let rig = mixRig(ABOVE, { ...charge, tall: charge.tall * (1 - CAMERA.push * smooth(t / CAMERA.pushOver)) }, down, soon(down, CAMERA.dive[0]), late(down, CAMERA.dive[1]))
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
    rig = mixRig(rig, TOP, up, soon(up, CAMERA.lift), soon(up, CAMERA.lift), up, soon(up, CAMERA.lift))
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

export interface Rise { fists: number; burst: number; end: number }

export function riseRig(r: number, p: Rise, feet: V3, from: Rig): { rig: Rig; k: number } {
  const w = CAMERA.power
  const key = keyAt(w.key, feet)
  const k = Math.min(ease(r, p.fists, p.fists + w.down), 1 - glide((r - p.burst) / (p.end - p.burst), w.ramp))
  if (k <= 0) return { rig: from, k: 0 }
  const push = 1 - w.push * clamp((r - p.fists) / (p.burst - p.fists))
  const to = { ...key, tall: key.tall * push }
  const far = (from.tall / Math.tan((from.fov * RAD) / 2)) / (to.tall / Math.tan((to.fov * RAD) / 2))
  const lens = r > p.burst && far > 1 ? 1 - Math.log(1 + (far - 1) * (1 - k)) / Math.log(far) : k
  const rig = mixRig(from, to, k, soon(k, w.dive[0]), late(k, w.dive[1]), lens)
  return { rig: { ...rig, az: lerp(from.az, key.az, soon(k, w.swing)) }, k }
}

export function riseShot(r: number, p: Rise, feet: V3, from: Rig): Shot | null {
  if (!CAMERA.on) return null
  const at = riseRig(r, p, feet, from)
  return at.k <= 0 ? null : shot(at.rig, 'charge')
}

export interface Block { id: string; lo: V3; hi: V3 }
export const BLOCKS: Block[] = [
  ...PILLARS.map((p): Block => {
    const c = toWorld(p.x, p.y, 0)
    const h = ARENA.pillar.side / 2
    return { id: p.id, lo: [c[0] - h, c[1] - h, 0], hi: [c[0] + h, c[1] + h, ARENA.pillar.high] }
  }),
  ...PANES.map((p): Block => {
    const a = toWorld(p.x, p.y1, 0)
    const b = toWorld(p.x, p.y0, 0)
    const h = ARENA.pane.thick / 2
    return { id: p.id, lo: [a[0] - h, a[1], 0], hi: [b[0] + h, b[1], ARENA.pane.high] }
  })
]

const spotsAt = (feet: readonly number[], [half, high]: readonly [number, number]): V3[] => {
  const out: V3[] = []
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [0.03, 0.36, 0.7, 1]) out.push([feet[0]! + x * half * (z < 0.1 ? CAMERA.fade.feet : 1), feet[1]! + y * half * (z < 0.1 ? CAMERA.fade.feet : 1), z * high])
  return out
}
const SPOTS = spotsAt(FEET, [CAMERA.fade.body[0]!, CAMERA.fade.body[1]!])

export const nearOf = (eye: readonly number[], b: Block): number => Math.hypot(Math.max(0, b.lo[0] - eye[0]!, eye[0]! - b.hi[0]), Math.max(0, b.lo[1] - eye[1]!, eye[1]! - b.hi[1]), Math.max(0, b.lo[2] - eye[2]!, eye[2]! - b.hi[2]))

export function crosses(eye: readonly number[], to: readonly number[], b: Block): boolean {
  let t0 = 0
  let t1 = 1
  for (let i = 0; i < 3; i++) {
    const d = to[i]! - eye[i]!
    if (Math.abs(d) < 1e-9) {
      if (eye[i]! < b.lo[i]! || eye[i]! > b.hi[i]!) return false
      continue
    }
    const a = (b.lo[i]! - eye[i]!) / d
    const c = (b.hi[i]! - eye[i]!) / d
    t0 = Math.max(t0, Math.min(a, c))
    t1 = Math.min(t1, Math.max(a, c))
    if (t0 > t1) return false
  }
  return true
}

const tilt = (b: Block, low: number): [number, number] => [(1 - low) * (ARENA.leanX - (b.lo[0] + b.hi[0]) / 2 / EYE), (1 - low) * (ARENA.lean - (b.lo[1] + b.hi[1]) / 2 / EYE)]
const flat = (p: readonly number[], t: readonly [number, number]): V3 => [p[0]! - t[0] * p[2]!, p[1]! - t[1] * p[2]!, p[2]!]

const seen = (pose: CameraPose, b: Block, t: readonly [number, number]): boolean => {
  for (const x of [0, 0.5, 1]) for (const y of [0, 0.5, 1]) for (const z of [0, 0.34, 0.67, 1]) {
    const high = lerp(b.lo[2], b.hi[2], z)
    const p = project(pose, [lerp(b.lo[0], b.hi[0], x) + t[0] * high, lerp(b.lo[1], b.hi[1], y) + t[1] * high, high])
    if (p.depth > 0 && p.x >= 0 && p.x <= 1920 && p.y >= 0 && p.y <= 1080) return true
  }
  return false
}

export function hides(pose: CameraPose, b: Block, low: number, spots: readonly V3[] = SPOTS): boolean {
  const t = tilt(b, low)
  const eye = flat(pose.eye, t)
  return (nearOf(eye, b) < CAMERA.fade.near && seen(pose, b, t)) || spots.some((p) => crosses(eye, flat(p, t), b))
}

export function riseFades(r: number, p: Rise, feet: V3, from: Rig): Record<string, number> | null {
  if (!CAMERA.on) return null
  const n = Math.round(CAMERA.fade.over * 60)
  const spots = spotsAt(feet, CAMERA.power.body)
  let out: Record<string, number> | null = null
  for (let i = -n; i <= n; i++) {
    const s = riseShot(r + i / 60, p, feet, from)
    if (!s || s.low < CAMERA.power.low) continue
    const w = smooth(1 - Math.abs(i) / n)
    for (const b of BLOCKS) {
      if (w <= (out?.[b.id] ?? 0) || !hides(s.pose, b, s.low, spots)) continue
      out ??= {}
      out[b.id] = w
    }
  }
  return out
}

let kept: { time: number; m: Marks; out: Record<string, number> | null } | null = null

export function fadesOf(time: number, m: Marks): Record<string, number> | null {
  if (!CAMERA.on || m.arms < 0) return null
  if (kept && kept.time === time && kept.m.arms === m.arms && kept.m.turn === m.turn && kept.m.fire === m.fire && kept.m.round === m.round) return kept.out
  const n = Math.round(CAMERA.fade.over * 60)
  let out: Record<string, number> | null = null
  for (let i = -n; i <= n; i++) {
    const at = time + i / 60
    if (m.fire >= 0 && at > m.fire) continue
    const s = finishShot(at, m)
    if (!s || s.low <= 0) continue
    const k = smooth(1 - Math.abs(i) / n)
    if (k <= 0) continue
    for (const b of BLOCKS) {
      if (!hides(s.pose, b, s.low)) continue
      out ??= {}
      out[b.id] = Math.max(out[b.id] ?? 0, k)
    }
  }
  kept = { time, m, out }
  return out
}
