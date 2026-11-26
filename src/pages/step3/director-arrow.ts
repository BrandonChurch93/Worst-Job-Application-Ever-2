import { actingLook } from '../../cursor/act/acting'
import { damageLook } from '../../cursor/act/damage'
import type { CursorPose } from '../../cursor/body'
import { OUTLINE, restLook, UNIT } from '../../cursor/contract'
import { Deform } from '../../cursor/model/deform'
import { CENTRE, TOP } from '../../cursor/model/shape'

export const GLASS = { wall: 40, keep: 2.7 }
export interface Berth { x: number; y: number; z: number; back: number; reach: number }

const deform = new Deform()
const out = { x: 0, y: 0, z: 0 }
const pts: number[][] = OUTLINE.flatMap(() => [[0, 0, 0], [0, 0, 0]])

const tilt = (v: number[], n: number[]): number[] => {
  const sin = Math.hypot(n[0]!, n[1]!)
  if (sin < 1e-6) return v
  const ax = -n[1]! / sin
  const ay = n[0]! / sin
  const cos = n[2]!
  const dot = ax * v[0]! + ay * v[1]!
  return [
    v[0]! * cos + ay * v[2]! * sin + ax * dot * (1 - cos),
    v[1]! * cos - ax * v[2]! * sin + ay * dot * (1 - cos),
    v[2]! * cos + (ax * v[1]! - ay * v[0]!) * sin
  ]
}

// Where the body has to be put for its outline, as it is posed now, to lie round the middle of the ball, and how deep toward the wall behind it it may go before a corner meets the glass.
export function berth(c: CursorPose, lean: number, spin: number, squash: number, face: number[] | null, deep: number, time: number, seen = false): Berth {
  const look = restLook(time)
  look.body.stretch = squash
  actingLook?.(c, look)
  damageLook?.(c, look)
  look.body.sealed = 1
  const turn = -lean - spin
  deform.set(look.body)
  deform.lean(turn)
  const cs = Math.cos(turn)
  const sn = Math.sin(turn)
  let lo = Infinity
  let hi = -Infinity
  OUTLINE.forEach(([x, y], i) => {
    for (let k = 0; k < 2; k++) {
      deform.point(x, y, k * TOP, 0, out)
      const p = pts[i * 2 + k]!
      p[0] = out.x * cs - out.y * sn
      p[1] = out.x * sn + out.y * cs
      p[2] = out.z
      lo = Math.min(lo, out.z)
      hi = Math.max(hi, out.z)
    }
  })
  let mx = 0
  let my = 0
  for (const p of pts) {
    mx += p[0]! / pts.length
    my += p[1]! / pts.length
  }
  let reach = 0
  for (let i = 0; i < 80; i++) {
    let far = pts[0]!
    reach = 0
    for (const p of pts) {
      const d = Math.hypot(p[0]! - mx, p[1]! - my)
      if (d > reach) {
        reach = d
        far = p
      }
    }
    mx += (far[0]! - mx) / (i + 2)
    my += (far[1]! - my) / (i + 2)
  }
  reach = 0
  for (const p of pts) reach = Math.max(reach, Math.hypot(p[0]! - mx, p[1]! - my))
  const half = (hi - lo) / 2
  const behind = Math.max(0, Math.min(deep, Math.sqrt(Math.max(0, (GLASS.wall - GLASS.keep) * (GLASS.wall - GLASS.keep) - reach * reach)) - half))
  const ox = -CENTRE[0] * UNIT
  const oy = CENTRE[1] * UNIT
  const c0 = Math.cos(-spin)
  const s0 = Math.sin(-spin)
  const at = face ? [ox * c0 - oy * s0, ox * s0 + oy * c0, 0] : [ox, oy, 0]
  const n = face ?? [0, 0, 1]
  const back = behind + (lo + hi) / 2
  // A seen cursor is centred by its own view from the outline as it is drawn (`src/cursor/view.ts`), so the page adds nothing in the plane.
  const off = seen ? [0, 0, 0] : tilt([at[0]! + mx, at[1]! + my, 0], n)
  return { x: -off[0]!, y: -off[1]!, z: -off[2]! - 1, back, reach: Math.hypot(reach, behind + half) }
}
