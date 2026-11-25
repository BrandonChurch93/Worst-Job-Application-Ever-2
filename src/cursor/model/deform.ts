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
const PEEL_RADIUS = 5.5

// Turns a point of the body at rest, in outline units, into where it is now, in page pixels in the body's own space.
export class Deform {
  stretch = 1
  bend = 0
  puff = 0
  tremble = 0
  melt = 0
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
      const far = Math.hypot(dx, dy)
      const ang = Math.atan2(dy, dx)
      const wob = 0.5 * Math.sin(3 * ang + 0.7) + 0.3 * Math.sin(5 * ang + 2.1) + 0.2 * Math.sin(8 * ang + 4.0)
      const grow = 1 + 0.26 * f + (f * 0.11 * wob * far) / 8
      x = CENTRE[0] + dx * grow
      y = CENTRE[1] + dy * grow
      const lumps = Math.sin(x0 * 0.9 + 0.6) * Math.sin(y0 * 0.7 + 1.9) + 0.5 * Math.sin(x0 * 1.7 - y0 * 1.3)
      z *= 1 - 0.78 * f
      z += f * 0.2 * up * lumps * (1 - Math.exp(-inset / 0.8))
    }
    if (this.melt > 0) {
      const m = this.melt
      const low = smooth(3, 19, y0)
      const run = Math.pow(Math.max(0, Math.sin(x0 * 1.55 + 0.9) * 0.6 + Math.sin(x0 * 2.9 + 2.2) * 0.4), 2)
      y += m * (0.9 * low + 3.4 * low * low * run + 0.25 * Math.sin(x0 * 1.1 + 0.3))
      x += m * (0.45 * Math.sin(y0 * 0.62 + 1.4) + 0.3 * low * (x0 - CENTRE[0]) * 0.35)
      z *= 1 - 0.3 * m * (1 - 0.6 * low * run)
      z += m * up * (0.28 * run * low + 0.14 * Math.sin(x0 * 1.3 + y0 * 0.8)) * (1 - Math.exp(-inset / 0.6))
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
      const hinge = 21 - this.peel * 15
      if (u > hinge) {
        const a = (u - hinge) / PEEL_RADIUS
        const u1 = hinge + (PEEL_RADIUS - z) * Math.sin(a)
        z = PEEL_RADIUS - (PEEL_RADIUS - z) * Math.cos(a)
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
