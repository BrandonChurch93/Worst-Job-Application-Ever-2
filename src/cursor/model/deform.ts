import { UNIT, type BodyLook } from '../contract'
import { AXIS, CENTRE, TOP } from './shape'

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const BEND_FROM = 4.5
const BEND_TO = 20.2
const BEND_TURN = 0.85
const ROUND_WIDE = 1.15
const ROUND_TOP = 2.12
const PEEL_RADIUS = 9
const POINTS: [number, number, number, number][] = [[0, 0, 0.1, 3.6], [0, 16.2, 0.11, 3.2], [11.8, 11.6, 0.12, 3.2]]
const PEEL_TURN = 1.0
// The body stands a little out of plumb, as a thing photographed from just off its axis: its face sits up and to the left of its foot, so the dark wall shows on the side away from the lamp.
export const SLANT = 0.17

// Turns a point of the body at rest, in outline units, into where it is now, in page pixels in the body's own space.
export class Deform {
  stretch = 1
  bend = 0
  puff = 0
  tremble = 0
  melt = 0
  pale = 0
  flat = 0
  peel = 0
  gulp = -1
  time = 0
  private wide = 1
  private shakeX = 0
  private shakeY = 0
  private shakeTurn = 0
  private slantX = -SLANT
  private slantY = -SLANT

  // The slant keeps its direction on the page however the body is turned.
  lean(turn: number): void {
    const c = Math.cos(turn)
    const n = Math.sin(turn)
    const wx = -SLANT
    const wy = SLANT
    this.slantX = c * wx + n * wy
    this.slantY = -(-n * wx + c * wy)
  }

  set(look: BodyLook): void {
    this.stretch = Math.min(2.2, Math.max(0.3, look.stretch))
    this.bend = Math.min(1.2, Math.max(-1.2, look.bend))
    this.puff = clamp01(look.puff)
    this.tremble = clamp01(look.tremble)
    this.melt = clamp01(look.melt)
    this.pale = clamp01(look.pale)
    this.flat = clamp01(look.flat)
    this.peel = clamp01(look.peel)
    this.gulp = look.gulp < 0 ? -1 : clamp01(look.gulp)
    this.time = look.time
    this.wide = 1 / Math.sqrt(this.stretch)
    const t = look.time
    const k = this.tremble
    this.shakeX = k * (0.2 * Math.sin(t * 83.1) + 0.12 * Math.sin(t * 131.7 + 1.1))
    this.shakeY = k * (0.13 * Math.sin(t * 97.3 + 2.0) + 0.09 * Math.sin(t * 149.9 + 0.4))
    this.shakeTurn = k * 0.012 * Math.sin(t * 71.9 + 0.7)
  }

  // x, y, z at rest in outline units, with how far in from the outline the point lies. out gets page pixels: x right, y up, z off the page.
  point(x0: number, y0: number, z0: number, inset: number, out: { x: number; y: number; z: number }): void {
    let x = x0
    let y = y0
    let z = z0
    const up = z0 / TOP
    const round = smooth(0, 0.5, this.melt)
    if (round > 0 && inset < ROUND_WIDE) {
      const k = 1 - Math.min(1, inset / ROUND_WIDE)
      const target = z0 >= 1.2 ? ROUND_TOP * Math.sqrt(1 - k * k) : z0 * 0.32
      z += (target - z) * round
    }
    if (this.gulp >= 0) {
      const u = x * AXIS[0] + y * AXIS[1]
      const v = x * AXIS[1] - y * AXIS[0]
      const at = 1.5 + this.gulp * 17
      const lump = Math.exp(-(((u - at) / 1.5) * ((u - at) / 1.5))) * Math.sin(Math.PI * clamp01(this.gulp * 1.15))
      const v1 = v * (1 + 0.42 * lump)
      x += (v1 - v) * AXIS[1]
      y -= (v1 - v) * AXIS[0]
      z *= 1 + 0.35 * lump
    }
    if (this.puff > 0) {
      const p = this.puff
      x = CENTRE[0] + (x - CENTRE[0]) * (1 + 0.09 * p)
      y = CENTRE[1] + (y - CENTRE[1]) * (1 + 0.09 * p)
      z += p * 1.25 * up * (1 - Math.exp(-inset / 1.1))
    }
    if (this.flat > 0) {
      const f = this.flat
      const dx = x - CENTRE[0]
      const dy = y - CENTRE[1]
      const ang = Math.atan2(dy, dx)
      const far = Math.hypot(dx, dy)
      const wob = 0.5 * Math.sin(3 * ang + 0.7) + 0.3 * Math.sin(5 * ang + 2.1) + 0.2 * Math.sin(8 * ang + 4.0)
      let soft = 0
      for (const c of POINTS) soft += c[2] * Math.exp(-((x0 - c[0]) * (x0 - c[0]) + (y0 - c[1]) * (y0 - c[1])) / (c[3] * 1.6))
      const grow = (1 + 0.16 * f + (f * 0.14 * wob * far) / 8) * (1 - f * Math.min(0.2, 1.3 * soft))
      x = CENTRE[0] + dx * grow
      y = CENTRE[1] + dy * grow
      x += f * (0.3 * Math.sin(y0 * 0.72 + 1.0) + 0.1 * Math.sin(y0 * 1.5 + x0 * 0.6 + 2.2))
      y += f * (0.3 * Math.sin(x0 * 0.78 + 2.0) + 0.1 * Math.sin(x0 * 1.4 - y0 * 0.5 + 0.4))
      const lumps = Math.sin(x0 * 0.62 + 0.6) * Math.sin(y0 * 0.5 + 1.9) + 0.4 * Math.sin(x0 * 1.1 - y0 * 0.9)
      z *= 1 - 0.5 * f
      z += f * 0.5 * up * lumps * (1 - Math.exp(-inset / 1.1))
    }
    if (this.melt > 0) {
      const m = this.melt
      const u0 = x0 * AXIS[0] + y0 * AXIS[1]
      const v0 = x0 * AXIS[1] - y0 * AXIS[0]
      // The stem alone runs and curls: the wings and the notch between them stay where an arrow has them.
      const stem = (1 - smooth(1.75, 2.9, Math.abs(v0))) * smooth(12.4, 14.4, u0)
      const t = smooth(13.4, 20.2, u0) * stem
      const low = smooth(2, 19, y0)
      const dx = x - CENTRE[0]
      const dy = y - CENTRE[1]
      const ang = Math.atan2(dy, dx)
      const wob = 0.6 * Math.sin(2 * ang + 0.9) + 0.4 * Math.sin(5 * ang + 2.6)
      let blunt = 0
      let droop = 0
      for (const c of POINTS) {
        const cx = x0 - c[0]
        const cy = y0 - c[1]
        const near = Math.exp(-(cx * cx + cy * cy) / c[3])
        blunt += c[2] * near
        if (c[1] > 1) droop += near
      }
      const grow = (1 + m * 0.045 * wob * (1 - stem)) * (1 - m * Math.min(0.2, blunt))
      x = CENTRE[0] + dx * grow
      y = CENTRE[1] + dy * grow
      y += m * (0.5 * low + 0.7 * droop + 0.22 * Math.sin(x0 * 0.85 + 1.4) * (1 - stem))
      x += m * (0.32 * Math.sin(y0 * 0.42 + 1.0) + 0.2 * Math.sin(y0 * 0.95 + 0.3)) * (1 - stem)
      // The stem runs a little longer, leans to the right and turns up at its end in a soft hook.
      const du = m * (1.1 * t - 1.5 * t * t * t * t)
      const dv = m * (0.5 * Math.sin(t * 3.4) * (1 - t) + 2.7 * t * t * t)
      x += du * AXIS[0] + dv * AXIS[1]
      y += du * AXIS[1] - dv * AXIS[0]
      const end = clamp01((u0 - 18.85) / 1.3)
      const lobe = (1 + 0.3 * smooth(16.6, 18.8, u0)) * Math.sqrt(Math.max(0.03, 1 - end * end)) - 1
      const lv = m * v0 * lobe * smooth(15.2, 16.8, u0) * stem
      x += lv * AXIS[1]
      y -= lv * AXIS[0]
      const fold = Math.sin(x0 * 0.55 + y0 * 0.38 + 0.5) * Math.sin(y0 * 0.31 - x0 * 0.2 + 1.2)
      z *= 1 - 0.12 * m - 0.22 * m * t
      z += m * up * 0.42 * fold * (1 - Math.exp(-inset / 0.9)) * (1 - 0.5 * t)
    }
    x *= this.wide
    y *= this.stretch
    z *= Math.min(1.45, Math.max(0.7, this.wide))
    if (this.bend !== 0) {
      const u = x * AXIS[0] + y * AXIS[1]
      const v = x * AXIS[1] - y * AXIS[0]
      const from = BEND_FROM * this.stretch
      if (u > from) {
        const k = (this.bend * BEND_TURN) / ((BEND_TO - BEND_FROM) * this.stretch)
        const s = u - from
        const a = k * s
        const along = Math.abs(k) < 1e-6 ? s : Math.sin(a) / k
        const across = Math.abs(k) < 1e-6 ? 0 : (1 - Math.cos(a)) / k
        const u1 = from + along - v * Math.sin(a)
        const v1 = across + v * Math.cos(a)
        x = u1 * AXIS[0] + v1 * AXIS[1]
        y = u1 * AXIS[1] - v1 * AXIS[0]
      }
    }
    if (this.peel > 0) {
      const u = x * AXIS[0] + y * AXIS[1]
      const v = x * AXIS[1] - y * AXIS[0]
      const hinge = 22 - this.peel * 14
      if (u > hinge) {
        const a = Math.min(PEEL_TURN, (u - hinge) / PEEL_RADIUS)
        const more = u - hinge - a * PEEL_RADIUS
        const u1 = hinge + (PEEL_RADIUS - z) * Math.sin(a) + more * Math.cos(a)
        z = PEEL_RADIUS - (PEEL_RADIUS - z) * Math.cos(a) + more * Math.sin(a)
        x = u1 * AXIS[0] + v * AXIS[1]
        y = u1 * AXIS[1] - v * AXIS[0]
      }
    }
    if (this.tremble > 0) {
      x += this.shakeX - this.shakeTurn * y
      y += this.shakeY + this.shakeTurn * x
    }
    out.x = (x + this.slantX * z) * UNIT
    out.y = -(y + this.slantY * z) * UNIT
    out.z = z * UNIT
  }
}
