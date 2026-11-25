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
const POINTS: [number, number, number, number][] = [[0, 0, 0.115, 3.2], [0, 16.2, 0.17, 4.5], [11.8, 11.6, 0.21, 5]]
const PEEL_TURN = 1.0

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
    const round = Math.max(smooth(0, 0.5, this.melt), this.pale)
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
      const grow = 1 + 0.16 * f + (f * 0.09 * wob * far) / 8
      x = CENTRE[0] + dx * grow
      y = CENTRE[1] + dy * grow
      x += f * (0.3 * Math.sin(y0 * 0.72 + 1.0) + 0.1 * Math.sin(y0 * 1.5 + x0 * 0.6 + 2.2))
      y += f * (0.3 * Math.sin(x0 * 0.78 + 2.0) + 0.1 * Math.sin(x0 * 1.4 - y0 * 0.5 + 0.4))
      const lumps = Math.sin(x0 * 0.62 + 0.6) * Math.sin(y0 * 0.5 + 1.9) + 0.4 * Math.sin(x0 * 1.1 - y0 * 0.9)
      z *= 1 - 0.5 * f
      z += f * 0.34 * up * lumps * (1 - Math.exp(-inset / 1.1))
    }
    if (this.melt > 0) {
      const m = this.melt
      const low = smooth(2, 19, y0)
      const tail = smooth(11.5, 19, y0)
      const dx = x - CENTRE[0]
      const dy = y - CENTRE[1]
      const ang = Math.atan2(dy, dx)
      const wob = 0.6 * Math.sin(2 * ang + 0.9) + 0.4 * Math.sin(3 * ang + 2.6)
      const wing = smooth(6.5, 10.5, y0) * (1 - smooth(11.5, 13.5, y0))
      let blunt = 0
      for (const c of POINTS) {
        const cx = x0 - c[0]
        const cy = y0 - c[1]
        blunt += c[2] * Math.exp(-(cx * cx + cy * cy) / c[3])
      }
      const grow = (1 + m * 0.07 * wob * (1 - tail)) * (1 - m * Math.min(0.24, blunt))
      x = CENTRE[0] + dx * grow * (1 - 0.2 * m * wing)
      y = CENTRE[1] + dy * grow + m * 0.16 * wing * Math.abs(dx)
      y += m * (0.7 * low + 2.4 * tail + 0.3 * Math.sin(x0 * 0.85 + 1.4) * (1 - tail))
      x += m * ((0.45 * Math.sin(y0 * 0.42 + 1.0) + 0.3 * Math.sin(y0 * 0.95 + 0.3)) * (1 - tail) + 0.9 * tail * Math.sin((y0 - 11.5) * 0.62) + 2.6 * tail * tail)
      const u0 = x0 * AXIS[0] + y0 * AXIS[1]
      const v0 = x0 * AXIS[1] - y0 * AXIS[0]
      const end = clamp01((u0 - 18.85) / 1.3)
      const lobe = (1 + 0.35 * smooth(16.6, 18.8, u0)) * Math.sqrt(Math.max(0.03, 1 - end * end)) - 1
      const dv = m * v0 * lobe * smooth(15.2, 16.8, u0) * (1 - smooth(1.8, 2.6, Math.abs(v0)))
      x += dv * AXIS[1]
      y -= dv * AXIS[0]
      const fold = Math.sin(x0 * 0.55 + y0 * 0.38 + 0.5) * Math.sin(y0 * 0.31 - x0 * 0.2 + 1.2)
      z *= 1 - 0.1 * m - 0.3 * m * tail
      const ripple = Math.sin(x0 * 1.7 + y0 * 1.15 + 0.4) * Math.sin(y0 * 1.45 - x0 * 0.8 + 2.1)
      z += m * up * (0.46 * fold + 0.02 * ripple) * (1 - Math.exp(-inset / 0.9)) * (1 - 0.5 * tail)
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
    out.x = x * UNIT
    out.y = -y * UNIT
    out.z = z * UNIT
  }
}
