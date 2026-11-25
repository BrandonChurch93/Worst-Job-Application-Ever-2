import { UNIT, type BodyLook } from '../contract'
import { AXIS, CENTRE, TOP, UNDER_TOP, inside } from './shape'

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
const POINTS: [number, number, number, number][] = [[0, 0, 0.035, 9], [0, 16.2, 0.06, 5], [11.8, 11.6, 0.07, 5]]
const PEEL_TURN = 1.0
// The body stands a little out of plumb, as a thing photographed from just off its axis: its face sits up and to the left of its foot, so the dark wall shows on the side away from the lamp.
export const SLANT = 0.24
// A melting body: how much of the pose's squash it gives back, how its section rounds, how its stem runs, sways and hooks, how its tip bows, how its wings hang and how its folds stand.
// A flattened body: how much wider it lies, how its stem spreads, how its outline waves, how its corners round, how its rim sinks and how its face lumps.
const FLAT = { wide: 0.2, stem: 0.3, wave: 0.14, corner: 3.2, cornerMost: 0.24, cornerWide: 0.5, sink: 0.5, lump: 1.3, valley: 0.3, roll: 0.8, over: 0.24, overAt: 0.56, overTo: 1.6 }
const MELT = { back: 1.7, wide: 0.55, foot: 0.32, run: 3.6, pull: 1.6, sway: 0.9, hook: 0.9, lift: 0.25, bowAlong: 0.4, bowAcross: 0.8, hang: 1.1, straight: 0.5, lobe: 0.6, dull: 0.18, tip: 0.07, dullWide: 3.2, wave: 2.1, thin: 0.08, fold: 1.05, valley: 0.3 }

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

  // A sliver cut loose lies thinner than the whole body stands: keep is the share of the thickness left, taken off about the foot.
  thin(out: { x: number; y: number; z: number }, keep: number): void {
    out.x -= this.slantX * out.z * (1 - keep)
    out.y += this.slantY * out.z * (1 - keep)
    out.z *= keep
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
    // A melting body slumps by its own running, not by being pressed short: most of the pose's squash is given back, or the arrow reads as a cap on a stalk.
    this.stretch += (1 - this.stretch) * Math.min(1, MELT.back * this.melt)
    // And it keeps the line of an arrow: a soft body curls less than a stiff one is asked to.
    this.bend *= 1 - MELT.straight * this.melt
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
    const reach = ROUND_WIDE + MELT.wide * round
    if (inset < reach) {
      if (round > 0) {
        const k = 1 - Math.min(1, inset / reach)
        const foot = UNDER_TOP * MELT.foot
        const target = z0 >= UNDER_TOP - 1e-4 ? foot + (ROUND_TOP - foot) * Math.sqrt(1 - k * k) : z0 * MELT.foot
        z += (target - z) * round
      }
      // Stone has no groove and no bevel line: one soft roll from the wall up to the face.
      if (this.pale > 0 && z0 >= 1.2 && inset < ROUND_WIDE) z += (TOP * (1 - 0.42 * Math.pow(1 - Math.min(1, inset / ROUND_WIDE), 2.5)) - z) * this.pale * (1 - round)
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
      const u0 = x0 * AXIS[0] + y0 * AXIS[1]
      const v0 = x0 * AXIS[1] - y0 * AXIS[0]
      // The stem spreads most: it is the narrowest part, and a pressed arrow is nearly as wide there as its wings are deep.
      const stem = (1 - smooth(1.75, 2.9, Math.abs(v0))) * smooth(12.4, 14.4, u0)
      x += f * FLAT.stem * v0 * stem * AXIS[1]
      y -= f * FLAT.stem * v0 * stem * AXIS[0]
      // The pressed face spreads out over its rim.
      if (inset > 0.02 && inset < FLAT.overTo) {
        const e = 0.05
        const gx = inside(x0 + e, y0) - inside(x0 - e, y0)
        const gy = inside(x0, y0 + e) - inside(x0, y0 - e)
        const g = Math.hypot(gx, gy)
        if (g > 1e-6) {
          const over = f * FLAT.over * (inset < FLAT.overAt ? smooth(0, FLAT.overAt, inset) : 1 - smooth(FLAT.overAt, FLAT.overTo, inset))
          x -= (gx / g) * over
          y -= (gy / g) * over
        }
      }
      const dx = x - CENTRE[0]
      const dy = y - CENTRE[1]
      const ang = Math.atan2(dy, dx)
      const far = Math.hypot(dx, dy)
      const wob = 0.5 * Math.sin(3 * ang + 0.7) + 0.3 * Math.sin(5 * ang + 2.1) + 0.2 * Math.sin(8 * ang + 4.0)
      let soft = 0
      for (const c of POINTS) soft += c[2] * Math.exp(-((x0 - c[0]) * (x0 - c[0]) + (y0 - c[1]) * (y0 - c[1])) / (c[3] * FLAT.cornerWide))
      const grow = (1 + FLAT.wide * f + (f * FLAT.wave * wob * far) / 8) * (1 - f * Math.min(FLAT.cornerMost, FLAT.corner * soft))
      x = CENTRE[0] + dx * grow
      y = CENTRE[1] + dy * grow
      x += f * (0.3 * Math.sin(y0 * 0.72 + 1.0) + 0.1 * Math.sin(y0 * 1.5 + x0 * 0.6 + 2.2))
      y += f * (0.3 * Math.sin(x0 * 0.78 + 2.0) + 0.1 * Math.sin(x0 * 1.4 - y0 * 0.5 + 0.4))
      // The face stays a pillow: it sinks a little and swells in broad lumps that stand over the rim, so the rim is a thin line on the lit side.
      const lumps = 0.5 + 0.5 * Math.sin(x0 * 0.62 + 0.6) * Math.sin(y0 * 0.5 + 1.9) + 0.2 * Math.sin(x0 * 1.1 - y0 * 0.9)
      const face = 1 - Math.exp(-inset / FLAT.roll)
      z *= 1 - FLAT.sink * f * (1 - 0.4 * face)
      z += f * FLAT.lump * up * (lumps - FLAT.valley) * face
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
      let dull = Math.exp(-(x0 * x0 + y0 * y0) / 2.2) * (MELT.tip / MELT.dull)
      for (const c of POINTS) {
        const cx = x0 - c[0]
        const cy = y0 - c[1]
        const near = Math.exp(-(cx * cx + cy * cy) / c[3])
        blunt += c[2] * near
        if (c[1] > 1) {
          droop += near
          dull += Math.exp(-(cx * cx + cy * cy) / MELT.dullWide)
        }
      }
      const grow = (1 + m * 0.045 * wob * (1 - stem)) * (1 - m * Math.min(0.2, blunt) - m * MELT.dull * dull)
      x = CENTRE[0] + dx * grow
      y = CENTRE[1] + dy * grow
      y += m * (0.3 * low + MELT.hang * droop + 0.16 * Math.sin(x0 * 0.85 + 1.4) * (1 - stem))
      x += m * MELT.wave * (0.2 * Math.sin(y0 * 0.42 + 1.0) + 0.14 * Math.sin(y0 * 0.95 + 0.3)) * (1 - stem)
      // The stem runs a little longer, leans to the right and turns up at its end in a soft hook.
      const du = m * (MELT.run * t - MELT.pull * t * t * t * t)
      const dv = m * (MELT.hook * t * t * t - MELT.sway * Math.sin(Math.PI * t) * (1 - 0.5 * t))
      x += du * AXIS[0] + dv * AXIS[1]
      y += du * AXIS[1] - dv * AXIS[0]
      // The tip bows over to one side and sinks, and the whole body spreads: the droop is in the outline.
      const bow = smooth(8.5, 0, u0)
      const tu = m * MELT.bowAlong * bow
      const tv = m * (MELT.bowAcross * bow * bow + 0.09 * v0 * (1 - stem))
      x += tu * AXIS[0] + tv * AXIS[1]
      y += tu * AXIS[1] - tv * AXIS[0]
      const end = clamp01((u0 - 18.85) / 1.3)
      const lobe = (1 + MELT.lobe * smooth(16.6, 18.8, u0)) * Math.sqrt(Math.max(0.2, 1 - end * end)) - 1
      const lv = m * v0 * lobe * smooth(15.2, 16.8, u0) * stem
      x += lv * AXIS[1]
      y -= lv * AXIS[0]
      // Folds run the length of the body and wander across it: ridges of thick material, with shallow valleys between them and none at the rim.
      const fold = 0.5 + 0.5 * Math.sin(v0 * 1.7 + 1.1 * Math.sin(u0 * 0.33 + 0.4) + 0.6)
      z *= (1 - MELT.thin * m) * (1 - m * stem * (1 - Math.sqrt(Math.max(0.1, 1 - end * end))))
      z += m * MELT.lift * smooth(0.72, 1, t) * (0.35 + 0.65 * up)
      z += m * up * MELT.fold * (fold - MELT.valley) * (1 - Math.exp(-inset / 0.9))
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
