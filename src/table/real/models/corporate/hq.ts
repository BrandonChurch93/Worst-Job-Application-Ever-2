import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { DOORS } from '../../../draw'
import { BALL, table } from '../../../layout'
import { colours } from '../../lights'
import { localBalls, type Zone } from '../../zone'
import { Geo, type RGB, type V2, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, hex, matsOf, mesh, moved, place, poseGlow, screw, shade, signBoard, smooth, textAt } from './mats'

const SEED = 20261125
const FLOOR = 20.5
const COL = 17
const WHITE: RGB = [1, 0.9, 0.72]
const COOL: RGB = [WHITE[0] / colours.CORPORATE_WINDOW[0], WHITE[1] / colours.CORPORATE_WINDOW[1], WHITE[2] / colours.CORPORATE_WINDOW[2]]
const STEEL = hex(0x9ca8bd)
const STEEL_DARK = hex(0x727d8f)
const PORTAL = hex(0x7a6238)
const ROOF = hex(0x474c55)
const BRIGHT = hex(0xbac4d4)
const HALL = 4
const warmLamp = (k: number): RGB => [COOL[0] * k, COOL[1] * k * 0.92, COOL[2] * k * 0.79]
// The light of the hall seen through its glass: amber where it is dim, cream where it is bright.
const hallLight = (k: number): RGB => {
  const t = Math.min(1, k / 0.8)
  return [(COOL[0] * k) / HALL, (COOL[1] * k * (0.72 + 0.2 * t)) / HALL, (COOL[2] * k * (0.42 + 0.37 * t)) / HALL]
}
// A sheet of that light: `level` gives it at each place, from 0 to 1 across and up.
function sheet(g: Geo, at: (u: number, v: number) => V3, normal: V3, along: V3, nu: number, nv: number, level: (u: number, v: number) => number): void {
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const u0 = i / nu
      const u1 = (i + 1) / nu
      const v0 = j / nv
      const v1 = (j + 1) / nv
      g.blend([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], normal, along, [hallLight(level(u0, v0)), hallLight(level(u1, v0)), hallLight(level(u1, v1)), hallLight(level(u0, v1))])
    }
  }
}
const bump = (x: number, at: number, wide: number): number => Math.exp(-((x - at) * (x - at)) / (wide * wide))
const lamp = (k: number, blue = 1): RGB => [COOL[0] * k, COOL[1] * k, COOL[2] * k * blue]
const LEAF = { thick: 4.8, lift: 1.5, open: 1.53, slam: 0.09 }
const VEST = { deep: 96, out: 5.8 }

interface Built { doors: THREE.InstancedMesh; hinge: number; y: number; cx: number }
const built = new WeakMap<THREE.Object3D, Built>()
const M = new THREE.Matrix4()
const Q = new THREE.Quaternion()
const UP = new THREE.Vector3(0, 0, 1)
const ONE = new THREE.Vector3(1, 1, 1)
const P = new THREE.Vector3()

const model = (id: string) => {
  const m = table.models.find((x) => x.id === id)
  if (!m) throw new Error(`No model "${id}" in the layout`)
  return m
}

// A wall of glass from a to b: lit rooms behind dark panes, a fin at every column and a band at every floor. The outside is to the right of the way from a to b.
function curtain(S: Geo, G: Geo, a: V2, b: V2, z0: number, z1: number, rnd: Random, o: { floor?: number; col?: number; lit?: number; gold?: number; fin?: number; rise?: number; hall?: boolean } = {}): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const cols = Math.max(1, Math.round(len / (o.col ?? COL)))
  const floors = Math.max(1, Math.round((z1 - z0) / (o.floor ?? FLOOR)))
  const cw = len / cols
  const fh = (z1 - z0) / floors
  const share = o.lit ?? 0.8
  const depth = o.fin ?? 3
  const turn = Math.atan2(b[1] - a[1], b[0] - a[0])
  const n: V3 = [0, -1, 0]
  const al: V3 = [1, 0, 0]
  moved(G, place(a[0], a[1], 0, turn), () => {
    fin(G, o.hall ? FINISH.polished : FINISH.stone, () => {
      for (let j = 0; j < floors; j++) {
        let run = 0
        let on = false
        let warm = 1
        let cool = 1
        let off = 0
        let kind = 0
        for (let i = 0; i < cols; i++) {
          if (run <= 0) {
            run = 1 + rnd.int(4)
            on = rnd.next() < share
            warm = rnd.range(0.72, 1.12)
            cool = rnd.next() < 0.2 ? 1.25 : 1
            off = rnd.range(-0.07, 0.07)
            kind = rnd.int(4)
          }
          run--
          const s0 = i * cw
          const s1 = s0 + cw
          const f0 = z0 + j * fh
          const f1 = f0 + fh
          const rect = (x0: number, x1: number, u0: number, u1: number, c: RGB, out = 0): void => {
            const xa = s0 + cw * x0
            const xb = s0 + cw * x1
            G.face([[xa, -out, f0 + fh * u0], [xb, -out, f0 + fh * u0], [xb, -out, f0 + fh * u1], [xa, -out, f0 + fh * u1]], n, al, c)
          }
          if (o.hall) {
            const h = (k: number): RGB => warmLamp(k / HALL)
            const side = i === 0 ? 0 : i === cols - 1 ? 1 : 0.5
            sheet(G, (u, v) => [s0 + cw * u, 0, f0 + fh * v], n, al, 2, 8, (u, v) => (0.1 + 0.4 * bump(v, 0.48, 0.3) * warm + 0.16 * bump(v, 0.93, 0.1) + 0.08 * bump(v, 0.04, 0.08)) * (1 - 0.3 * Math.abs(u - side)))
            rect(0.12, 0.88, 0.9, 0.935, h(1.1), 0.12)
            rect(0.24, 0.76, 0.82, 0.842, h(0.6), 0.12)
            rect(0, 1, 0.07, 0.22, h(0.07), 0.12)
            rect(0, 1, 0.22, 0.236, h(0.5), 0.14)
            continue
          }
          if (!on) {
            rect(0, 1, 0, 1, [0.008, 0.02, 0.05])
            continue
          }
          const k = warm
          const blind = rnd.next() < 0.08
          const room = (q: number): RGB => [COOL[0] * q * k * 0.5, COOL[1] * q * k * 0.9, COOL[2] * q * k * 1.1 * cool]
          rect(0, 1, 0.56, 1, blind ? lamp(0.11 * k) : lamp(0.075 * k, cool))
          rect(0, 1, 0.3, 0.56, blind ? lamp(0.11 * k) : room(0.05))
          rect(0, 1, 0, 0.3, rnd.next() < 0.5 ? room(0.018) : room(0.03))
          if (!blind) {
            if (kind !== 3) rect(0.14 + off, 0.86 + off, 0.8, 0.9, lamp(1.15 * k, cool), 0.12)
            if (kind < 2) rect(0.27 + off, 0.73 + off, 0.66, 0.71, lamp(0.7 * k, cool), 0.12)
            if (kind === 0) rect(0.36 + off, 0.64 + off, 0.58, 0.61, lamp(0.42 * k, cool), 0.12)
            if (kind === 3) {
              rect(0.08, 0.44, 0.74, 0.9, lamp(0.9 * k, cool), 0.12)
              rect(0.56, 0.92, 0.74, 0.9, lamp(0.9 * k, cool), 0.12)
            }
          }
        }
      }
    }, o.hall ? HALL : 1)
  })
  moved(S, place(a[0], a[1], 0, turn), () => {
    fin(S, FINISH.brushed, () => {
      for (let j = 0; j <= floors; j++) {
        const f = z0 + j * fh
        S.box(0, len, -1.2, 0.4, f - 0.9, f + 0.9, STEEL_DARK, { bottom: true })
      }
      for (let i = 0; i <= cols; i++) {
        if (o.gold && i % o.gold === 0) continue
        const s = i * cw
        S.box(s - 1.15, s + 1.15, -depth * 0.7, 0.4, z0, z1, STEEL)
      }
    })
    if (!o.gold) return
    fin(S, FINISH.polished, () => {
      for (let i = 0; i <= cols; i += o.gold!) {
        const s = i * cw
        S.box(s - 1.5, s + 1.5, -depth * 0.7, 0.4, z0, z1, STEEL)
        S.box(s - 0.7, s + 0.7, -depth * 1.35, -depth * 0.7, z0, z1 + (o.rise ?? 0), BRIGHT)
      }
    })
  })
}

function leaf(): Geo {
  const g = new Geo()
  const W = ((DOORS.w - DOORS.seam) / 2) * BALL
  const H = (DOORS.h - 0.05) * BALL
  const t = LEAF.thick / 2
  const z0 = LEAF.lift
  const st = 6
  const kick = 24
  fin(g, FINISH.brushed, () => {
    g.box(0, st, -t, t, z0, H, TONE.brass, { bottom: true, bevel: 0.6 })
    g.box(W - st, W, -t, t, z0, H, TONE.brass, { bottom: true, bevel: 0.6 })
    g.box(st, W - st, -t, t, H - 7, H, TONE.brass, { bottom: true })
    g.box(st, W - st, -t, t, z0, kick, TONE.brassDark, { bottom: true })
  }, 0)
  fin(g, FINISH.polished, () => {
    for (const s of [-1, 1]) {
      const y = s * 0.9
      const quad = (x0: number, x1: number, a: number, b: number, c: RGB, out = 0): void => {
        const yy = y + s * out
        g.face([[x0, yy, a], [x1, yy, a], [x1, yy, b], [x0, yy, b]], [0, s, 0], [1, 0, 0], c)
      }
      const h = (k: number): RGB => warmLamp(k / HALL)
      sheet(g, (u, v) => [st + (W - 2 * st) * u, y, kick + (H - 7 - kick) * v], [0, s, 0], [1, 0, 0], 4, 10, (u, v) => 0.16 + 0.62 * bump(v, 0.46, 0.34) * (0.66 + 0.34 * bump(u, 0.8, 0.5)) + 0.14 * bump(v, 0.95, 0.08))
      quad(st + 5, W - st - 5, H - 30, H - 24, h(1.1), 0.05)
      quad(st + 9, W - st - 9, H - 44, H - 40, h(0.8), 0.05)
      quad(st + 12, W - st - 12, H - 55, H - 52.6, h(0.55), 0.05)
    }
  }, HALL)
  fin(g, FINISH.polished, () => {
    for (const s of [-1, 1]) {
      g.box(st + 3, W - st - 3, s > 0 ? t : -t - 0.9, s > 0 ? t + 0.9 : -t, 5, kick - 4, shade(TONE.brass, 0.92), { bevel: 0.5 })
      const hy = s * (t + 5.2)
      g.lathe([[0, -2], [1.7, -1.2], [1.7, 71.2], [0, 72]], W - st / 2, hy, 8, TONE.gold, 44)
      for (const hz of [50, 110]) g.box(W - st / 2 - 1.1, W - st / 2 + 1.1, Math.min(s * t, hy), Math.max(s * t, hy), hz - 1.1, hz + 1.1, TONE.brassDark, { bottom: true })
      for (const sx of [st + 5, W - st - 5]) for (const sz of [7.5, kick - 6.5]) screw(g, sx, s * (t + 0.9), sz, 1, TONE.gold, [0, s, 0])
      g.box(st, W - st, s * 1.2 - 0.4, s * 1.2 + 0.4, 83, 85, TONE.brass)
    }
  }, 0)
  return g
}

export function buildHq(z: Zone, ctx: RealContext): THREE.Object3D {
  const m = model('corporate.hq')
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const G = new Geo()
  const W = new Geo()
  const rnd = new Random(SEED, 'corporate.hq.windows')
  const p0 = localBalls(z, m.box[0], m.box[1])
  const p1 = localBalls(z, m.box[0] + m.box[2], m.box[1] + m.box[3])
  const X0 = p0[0]
  const X1 = p1[0]
  const B = p0[1]
  const F = p1[1]
  const HW = (X1 - X0) / 2
  const cx = (X0 + X1) / 2
  const top = m.h * BALL
  const dw = (DOORS.w * BALL) / 2
  const dh = DOORS.h * BALL
  const pz0 = DOORS.plate * BALL
  const pz1 = (DOORS.plate + DOORS.plateH) * BALL
  const vw = dw + VEST.out
  const vb = F + VEST.deep
  const X = (x: number): number => cx + x

  moved(S, place(cx, 0, 0), () => {
    // The base plate and the body of the lobby floor, built round the vestibule behind the doors.
    fin(S, FINISH.stone, () => {
      S.box(-HW, HW, F, B, 0, 6, shade(TONE.graphite, 0.8), { bevel: 1.2 })
    })
    fin(S, FINISH.brushed, () => {
      S.box(-HW, -HW + 14, F - 2, F + 6, 6, pz0, STEEL_DARK, { bevel: 1.5 })
      S.box(HW - 14, HW, F - 2, F + 6, 6, pz0, STEEL_DARK, { bevel: 1.5 })
    })
    fin(S, FINISH.satin, () => {
      S.box(-HW + 0.6, -vw, F + 0.6, B - 0.6, 6, pz1, TONE.graphite)
      S.box(vw, HW - 0.6, F + 0.6, B - 0.6, 6, pz1, TONE.graphite)
      S.box(-vw, vw, vb, B - 0.6, 6, pz1, TONE.graphite)
      S.box(-vw, vw, F + 0.6, vb, dh + 4, pz1, TONE.graphite, { bottom: true })
    })
    // The fascia over the lobby, with the plate the name stands on, and the canopy over the doors.
    fin(S, FINISH.brushed, () => {
      S.box(-HW - 1, HW + 1, F - 4, F + 1, pz0, pz1 - 0.4, STEEL_DARK, { bevel: 1, bottom: true })
      S.box(-dw - 19.2, dw + 19.2, F - 9.6, F - 4, pz0 + 2, pz1 - 2, shade(STEEL, 0.8), { bottom: true })
      const fx = dw + 19.2
      for (const s of [-1, 1]) S.box(s > 0 ? fx : -fx - 3, s > 0 ? fx + 3 : -fx, F - 11.4, F - 4, pz0, pz1, STEEL, { bevel: 0.8, bottom: true })
      S.box(-fx - 3, fx + 3, F - 11.4, F - 4, pz1 - 2.6, pz1 + 0.4, STEEL, { bevel: 0.8, bottom: true })
      S.box(-fx - 3, fx + 3, F - 11.4, F - 4, pz0 - 0.4, pz0 + 2.6, STEEL, { bevel: 0.8, bottom: true })
      S.box(-dw - 22, dw + 22, F - 26, F, dh + 4, pz0 - 0.4, STEEL, { bevel: 1.4, bottom: true })
    })
    for (const s of [-1, 1]) screw(S, s * (dw + 12), F - 9.6, (pz0 + pz1) / 2, 2, STEEL, [0, -1, 0])
    fin(S, FINISH.polished, () => {
      for (const zz of [pz0 + 0.8, pz1 - 3.2]) {
        S.box(-HW - 1.6, -dw - 22.4, F - 5, F, zz, zz + 2, BRIGHT, { bottom: true })
        S.box(dw + 22.4, HW + 1.6, F - 5, F, zz, zz + 2, BRIGHT, { bottom: true })
      }
      S.box(-dw - 22.6, dw + 22.6, F - 26.8, F - 25.4, dh + 5.4, pz0 - 1.8, TONE.gold)
      // The brass portal round the doorway, in two steps.
      for (const s of [-1, 1]) {
        const a = s > 0 ? dw : -dw - 11
        S.box(a, a + 11, F - 6, F + 4, 0, dh + 4, PORTAL, { bevel: 1.2 })
        const c = s > 0 ? dw + 11 : -dw - 17
        S.box(c, c + 6, F - 3, F + 4, 0, dh + 4, shade(PORTAL, 0.8), { bevel: 0.8 })
      }
      S.box(-dw, dw, F - 6, F + 4, dh - 4.6, dh + 4, PORTAL, { bottom: true })
      S.box(-dw - 1, dw + 1, F - 19.2, F + 4, 0, 2, PORTAL, { bevel: 0.6 })
    })
    fin(S, FINISH.matte, () => S.box(-3, 3, F - 9, F - 5, 2, 5, TONE.rubber, { bevel: 1 }))
    fin(S, FINISH.cloth, () => S.box(-dw, dw, F + 4, vb, 0, 2.4, TONE.carpet))
  })

  // The lobby behind the doors: lit stone, two lift doors and a lit ceiling.
  moved(G, place(cx, 0, 0), () => {
    fin(G, FINISH.stone, () => {
      const wall: RGB = lamp(0.085)
      G.face([[-vw, F, 0], [-vw, vb, 0], [-vw, vb, dh + 4], [-vw, F, dh + 4]], [1, 0, 0], [0, 1, 0], wall)
      G.face([[vw, F, 0], [vw, vb, 0], [vw, vb, dh + 4], [vw, F, dh + 4]], [-1, 0, 0], [0, 1, 0], wall)
      G.face([[-vw, vb, 0], [vw, vb, 0], [vw, vb, dh + 4], [-vw, vb, dh + 4]], [0, -1, 0], [1, 0, 0], wall)
      G.face([[-vw, F, dh + 4], [vw, F, dh + 4], [vw, vb, dh + 4], [-vw, vb, dh + 4]], [0, 0, -1], [1, 0, 0], lamp(0.1))
      for (const s of [-1, 1]) {
        G.face([[s * 62 - 22, vb - 0.4, 3], [s * 62 + 22, vb - 0.4, 3], [s * 62 + 22, vb - 0.4, 104], [s * 62 - 22, vb - 0.4, 104]], [0, -1, 0], [1, 0, 0], [0.2, 0.15, 0.08])
        G.face([[s * 62 - 0.8, vb - 0.8, 3], [s * 62 + 0.8, vb - 0.8, 3], [s * 62 + 0.8, vb - 0.8, 104], [s * 62 - 0.8, vb - 0.8, 104]], [0, -1, 0], [1, 0, 0], [0.03, 0.03, 0.03])
        G.face([[s * 62 - 8, vb - 0.8, 110], [s * 62 + 8, vb - 0.8, 110], [s * 62 + 8, vb - 0.8, 116], [s * 62 - 8, vb - 0.8, 116]], [0, -1, 0], [1, 0, 0], lamp(1.1))
        G.face([[s * 40 - 12, F + 14, dh + 3.6], [s * 40 + 12, F + 14, dh + 3.6], [s * 40 + 12, vb - 14, dh + 3.6], [s * 40 - 12, vb - 14, dh + 3.6]], [0, 0, -1], [1, 0, 0], lamp(0.95))
      }
      G.face([[-20, vb - 0.4, 20], [20, vb - 0.4, 20], [20, vb - 0.4, 120], [-20, vb - 0.4, 120]], [0, -1, 0], [1, 0, 0], lamp(0.16))
      G.face([[-vw, vb - 0.4, dh - 8], [vw, vb - 0.4, dh - 8], [vw, vb - 0.4, dh + 2], [-vw, vb - 0.4, dh + 2]], [0, -1, 0], [1, 0, 0], lamp(0.3))
      // The lit soffit of the canopy.
      for (const s of [-1, 0, 1]) G.face([[s * (dw - 6) - 14, F - 19, dh + 3.9], [s * (dw - 6) + 14, F - 19, dh + 3.9], [s * (dw - 6) + 14, F - 11, dh + 3.9], [s * (dw - 6) - 14, F - 11, dh + 3.9]], [0, 0, -1], [1, 0, 0], lamp(0.8))
    })
  })

  // The lobby's glass, either side of the portal.
  const lobby = { floor: pz0 - 6, col: 19, lit: 1, gold: 0, fin: 3.2, hall: true }
  curtain(W, G, [X(-HW + 14), F], [X(-dw - 17), F], 6, pz0, rnd, lobby)
  curtain(W, G, [X(dw + 17), F], [X(HW - 14), F], 6, pz0, rnd, lobby)
  curtain(W, G, [X(HW), F], [X(HW), B], 6, pz1, rnd, { gold: 5 })
  curtain(W, G, [X(-HW), B], [X(-HW), F], 6, pz1, rnd, { gold: 5 })

  // The tower: three steps back, each with its own coping, flush at the front.
  const steps = [
    { hx: HW - 16, yb: B - 14, z0: pz1, z1: 296, rise: 7 },
    { hx: HW - 46, yb: B - 42, z0: 296, z1: 346, rise: 7 },
    { hx: HW - 71, yb: B - 70, z0: 346, z1: top - 6, rise: 0 }
  ]
  const slab = new Random(SEED, 'corporate.hq.roof')
  const coping = (hx: number, yb: number, zz: number): void => {
    moved(S, place(cx, 0, 0), () => {
      fin(S, FINISH.brushed, () => S.box(-hx - 2.4, hx + 2.4, F - 2.4, yb + 2.4, zz - 2.2, zz + 2.2, STEEL, { bevel: 1.2, bottom: true }))
      fin(S, FINISH.satin, () => {
        S.box(-hx + 5, hx - 5, F + 5, yb - 5, zz + 2.2, zz + 2.66, shade(ROOF, 0.8))
        // Paving slabs, no two the same grey.
        const cuts = (from: number, to: number): number[] => {
          const out = [from]
          for (let v = from + 21; v < to - 8; v += 24) out.push(v)
          out.push(to)
          return out
        }
        const xs = cuts(-hx + 5, hx - 5)
        const ys = cuts(F + 5, yb - 5)
        for (let i = 0; i < xs.length - 1; i++) {
          for (let j = 0; j < ys.length - 1; j++) {
            const k = slab.range(0.9, 1.1)
            const tint = slab.range(-0.006, 0.006)
            S.face([[xs[i]!, ys[j]!, zz + 2.7], [xs[i + 1]!, ys[j]!, zz + 2.7], [xs[i + 1]!, ys[j + 1]!, zz + 2.7], [xs[i]!, ys[j + 1]!, zz + 2.7]], [0, 0, 1], [1, 0, 0], [ROOF[0] * k + tint, ROOF[1] * k, ROOF[2] * k - tint])
          }
        }
      })
      fin(S, FINISH.polished, () => {
        S.box(-hx + 2.6, hx - 2.6, F + 2.6, F + 4, zz + 2.2, zz + 3.2, BRIGHT)
        S.box(-hx + 2.6, hx - 2.6, yb - 4, yb - 2.6, zz + 2.2, zz + 3.2, BRIGHT)
        S.box(-hx + 2.6, -hx + 4, F + 4, yb - 4, zz + 2.2, zz + 3.2, BRIGHT)
        S.box(hx - 4, hx - 2.6, F + 4, yb - 4, zz + 2.2, zz + 3.2, BRIGHT)
      })
    })
  }
  const paving = (hx: number, yb: number, zz: number, hole: number, holeY: number): void => {
    moved(W, place(cx, 0, 0), () => {
      fin(W, FINISH.satin, () => {
        const line = shade(ROOF, 0.55)
        for (let x = -hx + 26; x < hx - 20; x += 24) {
          if (Math.abs(x) < hole) {
            W.box(x - 0.5, x + 0.5, F + 6, holeY, zz + 2.7, zz + 2.86, line)
            continue
          }
          W.box(x - 0.5, x + 0.5, F + 6, yb - 6, zz + 2.7, zz + 2.86, line)
        }
        for (let y = F + 26; y < yb - 20; y += 24) {
          if (y > holeY) {
            for (const sx of [-1, 1]) W.box(sx > 0 ? hole : -hx + 6, sx > 0 ? hx - 6 : -hole, y - 0.5, y + 0.5, zz + 2.7, zz + 2.86, line)
            continue
          }
          W.box(-hx + 6, hx - 6, y - 0.5, y + 0.5, zz + 2.7, zz + 2.86, line)
        }
      })
    })
  }
  coping(HW, B, pz1)
  paving(HW, B, pz1, HW - 16, F + 8)
  for (const st of steps) {
    moved(S, place(cx, 0, 0), () => fin(S, FINISH.satin, () => S.box(-st.hx + 0.6, st.hx - 0.6, F + 0.6, st.yb, st.z0, st.z1, TONE.graphite)))
    curtain(W, G, [X(-st.hx), F], [X(st.hx), F], st.z0 + 2.2, st.z1 - 2.2, rnd, { gold: 5, rise: st.rise, fin: 3.6 })
    curtain(W, G, [X(st.hx), F], [X(st.hx), st.yb], st.z0 + 2.2, st.z1 - 2.2, rnd, { gold: 5, rise: st.rise })
    curtain(W, G, [X(-st.hx), st.yb], [X(-st.hx), F], st.z0 + 2.2, st.z1 - 2.2, rnd, { gold: 5, rise: st.rise })
    coping(st.hx, st.yb, st.z1)
  }
  paving(steps[0]!.hx, steps[0]!.yb, steps[0]!.z1, steps[1]!.hx, F + 8)
  paving(steps[1]!.hx, steps[1]!.yb, steps[1]!.z1, steps[2]!.hx, F + 8)
  paving(steps[2]!.hx, steps[2]!.yb, steps[2]!.z1, 48, F + 80)

  // What stands on the roofs: plant on the first step, lamps on the second, a skylight and two fans on the crown.
  const s1 = steps[0]!
  const s2 = steps[1]!
  const s3 = steps[2]!
  moved(S, place(cx, 0, 0), () => {
    fin(S, FINISH.satin, () => {
      for (const s of [-1, 1]) {
        const x = s * (s1.hx - 15)
        for (let i = 0; i < 4; i++) {
          const y = F + 34 + i * 42
          S.box(x - 9, x + 9, y - 12, y + 12, s1.z1 + 2.2, s1.z1 + 13, STEEL_DARK, { bevel: 1.4 })
          S.lathe([[6.5, 0], [6.5, 1], [0, 1]], x, y, 14, shade(TONE.graphite, 0.5), s1.z1 + 13)
          S.box(x - 0.8, x + 0.8, y - 6, y + 6, s1.z1 + 14, s1.z1 + 14.6, STEEL)
          S.box(x - 6, x + 6, y - 0.8, y + 0.8, s1.z1 + 14, s1.z1 + 14.6, STEEL)
        }
      }
      for (let i = 0; i < 5; i++) {
        const x = -s1.hx + 40 + (i * (2 * s1.hx - 80)) / 4
        S.box(x - 16, x + 16, s1.yb - 22, s1.yb - 8, s1.z1 + 2.2, s1.z1 + 10, STEEL_DARK, { bevel: 1.2 })
      }
      S.lathe([[9, 0], [9, 5], [7.5, 6.5], [0, 6.5]], -s3.hx + 22, F + 58, 16, STEEL_DARK, s3.z1 + 2.2)
      S.lathe([[9, 0], [9, 5], [7.5, 6.5], [0, 6.5]], s3.hx - 22, F + 58, 16, STEEL_DARK, s3.z1 + 2.2)
      S.lathe([[6, 0], [6, 0.6], [0, 0.6]], -s3.hx + 22, F + 58, 12, shade(TONE.graphite, 0.5), s3.z1 + 8.7)
      S.lathe([[6, 0], [6, 0.6], [0, 0.6]], s3.hx - 22, F + 58, 12, shade(TONE.graphite, 0.5), s3.z1 + 8.7)
    })
    fin(S, FINISH.brushed, () => {
      // The ducts that join the plant, a hatch, a dish and a mast.
      for (const s of [-1, 1]) {
        const x = s * (s1.hx - 15)
        S.pipe([[x, F + 34, s1.z1 + 5], [x, F + 34 + 3 * 42, s1.z1 + 5]], 2.2, 6, STEEL)
        S.pipe([[x, F + 34 + 3 * 42, s1.z1 + 5], [x, s1.yb - 15, s1.z1 + 5], [s * (s1.hx - 60), s1.yb - 15, s1.z1 + 5]], 2.2, 6, STEEL)
        S.pipe([[s * (s3.hx - 22), F + 67, s3.z1 + 4.4], [s * (s3.hx - 22), F + 96, s3.z1 + 4.4], [s * 47, F + 96, s3.z1 + 4.4]], 1.8, 6, STEEL)
      }
      S.box(-10, 10, F + 46, F + 62, s3.z1 + 2.2, s3.z1 + 6.4, STEEL_DARK, { bevel: 1 })
      S.box(-8.5, 8.5, F + 47.5, F + 60.5, s3.z1 + 6.4, s3.z1 + 7.2, STEEL, { bevel: 0.5 })
      S.pipe([[-4, F + 50, s3.z1 + 7.2], [-4, F + 50, s3.z1 + 9], [4, F + 50, s3.z1 + 9], [4, F + 50, s3.z1 + 7.2]], 0.6, 4, BRIGHT)
      const dx = -s3.hx + 20
      const dy = s3.yb - 18
      S.lathe([[1.4, 0], [1.4, 9]], dx, dy, 6, STEEL_DARK, s3.z1 + 2.2)
      moved(S, place(dx, dy, s3.z1 + 12, 0.6, 0.5, 0), () => {
        S.lathe([[0, 0], [5, 0.7], [9, 2.6], [10.5, 4.4], [10.5, 5], [9, 3.4], [5, 1.5], [0, 0.9]], 0, 0, 16, BRIGHT)
        S.pipe([[0, 0, 0.9], [0, 0, 8]], 0.5, 4, STEEL_DARK)
      })
      const mx = s3.hx - 16
      const my = s3.yb - 16
      S.lathe([[4, 0], [4, 1.6], [1.5, 2.6], [1.1, 46], [0, 48]], mx, my, 8, BRIGHT, s3.z1 + 2.2)
      for (const zz of [22, 32, 41]) {
        S.pipe([[mx - (52 - zz) * 0.22, my, s3.z1 + zz], [mx + (52 - zz) * 0.22, my, s3.z1 + zz]], 0.45, 4, BRIGHT)
        S.pipe([[mx, my - (52 - zz) * 0.22, s3.z1 + zz + 2.5], [mx, my + (52 - zz) * 0.22, s3.z1 + zz + 2.5]], 0.45, 4, BRIGHT)
      }
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) moved(S, place(s * (s3.hx - 22), F + 58, s3.z1 + 9, (k / 5) * Math.PI * 2 + 0.3), () => S.box(1.2, 5.4, -1.1, 1.1, 0, 0.3, STEEL))
    })
    fin(S, FINISH.polished, () => {
      for (const st of [{ hx: HW, yb: B, z: pz1 }, { hx: s1.hx, yb: s1.yb, z: s1.z1 }, { hx: s2.hx, yb: s2.yb, z: s2.z1 }]) {
        for (const sx of [-1, 1]) for (const y of [F + 4.5, st.yb - 4.5]) {
          const x = sx * (st.hx - 4.5)
          S.box(x - 4.5, x + 4.5, y - 4.5, y + 4.5, st.z + 2.2, st.z + 6, BRIGHT, { bevel: 0.8 })
          S.box(x - 3, x + 3, y - 3, y + 3, st.z + 6, st.z + 9.5, BRIGHT, { bevel: 0.8 })
          S.box(x - 1.5, x + 1.5, y - 1.5, y + 1.5, st.z + 9.5, st.z + 13, BRIGHT, { bevel: 0.6 })
        }
      }
      // The frame of the skylight.
      const kx = 44
      const ky0 = F + 84
      const ky1 = s3.yb - 12
      const kz = s3.z1 + 2.2
      S.box(-kx - 3, kx + 3, ky0 - 3, ky0, kz, kz + 5, STEEL, { bevel: 0.8 })
      S.box(-kx - 3, kx + 3, ky1, ky1 + 3, kz, kz + 5, STEEL, { bevel: 0.8 })
      S.box(-kx - 3, -kx, ky0, ky1, kz, kz + 5, STEEL, { bevel: 0.8 })
      S.box(kx, kx + 3, ky0, ky1, kz, kz + 5, STEEL, { bevel: 0.8 })
      for (let i = 1; i < 4; i++) S.box(-kx + (i * 2 * kx) / 4 - 0.8, -kx + (i * 2 * kx) / 4 + 0.8, ky0, ky1, kz, kz + 4.6, BRIGHT)
      S.box(-kx, kx, (ky0 + ky1) / 2 - 0.8, (ky0 + ky1) / 2 + 0.8, kz, kz + 4.6, BRIGHT)
    })
  })
  moved(G, place(cx, 0, 0), () => {
    fin(G, FINISH.stone, () => {
      const kx = 44
      const ky0 = F + 84
      const ky1 = s3.yb - 12
      const kz = s3.z1 + 5.4
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.face([[sx * 22 - 9, (ky0 + ky1) / 2 + sy * 13 - 4, kz + 0.1], [sx * 22 + 9, (ky0 + ky1) / 2 + sy * 13 - 4, kz + 0.1], [sx * 22 + 9, (ky0 + ky1) / 2 + sy * 13 + 4, kz + 0.1], [sx * 22 - 9, (ky0 + ky1) / 2 + sy * 13 + 4, kz + 0.1]], [0, 0, 1], [1, 0, 0], lamp(0.85))
      // Small lamps on the second step that wash the crown.
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) G.lathe([[3.2, 0], [3.2, 2.4], [2.2, 3.4], [0, 3.6]], sx * (s2.hx - 12), F + 30 + i * 44, 10, lamp(1.2), s2.z1 + 2.2)
    })
  })

  // The glass of the skylight, with the lit hall far below it.
  moved(G, place(cx, 0, 0), () => {
    fin(G, FINISH.polished, () => {
      const kx = 44
      const ky0 = F + 84
      const ky1 = s3.yb - 12
      sheet(G, (u, v) => [-kx + 2 * kx * u, ky0 + (ky1 - ky0) * v, s3.z1 + 5.4], [0, 0, 1], [1, 0, 0], 8, 6, (u, v) => 0.05 + 0.3 * bump(u, 0.5, 0.42) * bump(v, 0.5, 0.42))
    }, HALL)
  })

  // The board the name stands on, at the front edge of the crown.
  const h0 = 22
  const sign = textAt(ctx, z, 'sign.corporate.hq', { c: [cx, F + 8 + (h0 / 2) * 0.866, top + 6 + h0 / 4], w: 150, h: h0, tilt: 0.5235987755982988 })
  signBoard(S, sign.c, sign.w, sign.h, sign.tilt, s3.z1 + 2.2, STEEL, STEEL)

  // The carpet: pile with a bound edge, brass rods across it at even steps.
  const carpet = table.flats.find((f) => f.id === 'corporate.carpet')
  if (carpet) {
    const c0 = localBalls(z, carpet.box[0], carpet.box[1])
    const c1 = localBalls(z, carpet.box[0] + carpet.box[2], carpet.box[1] + carpet.box[3])
    fin(S, FINISH.cloth, () => {
      S.box(c0[0] + 5, c1[0] - 5, c1[1] + 5, c0[1], 0, 2.5, TONE.carpet)
      S.box(c0[0], c0[0] + 5, c1[1], c0[1], 0, 3, TONE.carpetEdge, { bevel: 0.8 })
      S.box(c1[0] - 5, c1[0], c1[1], c0[1], 0, 3, TONE.carpetEdge, { bevel: 0.8 })
      S.box(c0[0] + 5, c1[0] - 5, c1[1], c1[1] + 5, 0, 3, TONE.carpetEdge, { bevel: 0.8 })
    })
    fin(S, FINISH.polished, () => {
      S.box(c0[0] + 7.5, c0[0] + 9, c1[1] + 7.5, c0[1], 2.5, 2.9, TONE.gold)
      S.box(c1[0] - 9, c1[0] - 7.5, c1[1] + 7.5, c0[1], 2.5, 2.9, TONE.gold)
      S.box(c0[0] + 9, c1[0] - 9, c1[1] + 7.5, c1[1] + 9, 2.5, 2.9, TONE.gold)
      const n = 7
      const step = (c0[1] - c1[1]) / n
      for (let i = 0; i < n; i++) {
        const y = c0[1] - step * (i + 0.5)
        S.pipe([[c0[0] - 3, y, 3.1], [c1[0] + 3, y, 3.1]], 1.5, 6, TONE.brass)
        for (const x of [c0[0] - 4, c1[0] + 4]) {
          S.lathe([[0, 0], [2.6, 0.8], [2.6, 3.4], [1.4, 4.6], [0, 4.8]], x, y, 8, TONE.gold, 0.8)
          S.box(x - 4, x + 4, y - 3.4, y + 3.4, 0, 0.9, TONE.brassDark, { bevel: 0.4 })
        }
      }
    })
  }

  o.add(mesh(S, mats.solid, `hq.solid.${z.id}`, { cast: true }))
  o.add(mesh(G, mats.glow, `hq.glow.${z.id}`, { group: mats.group }))
  o.add(mesh(W, mats.solid, `hq.frame.${z.id}`, { fine: true }))
  const doors = new THREE.InstancedMesh(leaf().done(), mats.glow, 2)
  if (mats.group) doors.userData.lightGroup = mats.group
  doors.name = `hq.doors.${z.id}`
  doors.castShadow = true
  doors.receiveShadow = true
  doors.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  doors.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, F + 30, dh / 2), dw + 110)
  o.add(doors)
  built.set(o, { doors, hinge: dw, y: F - LEAF.thick / 2 - 0.4, cx })
  setDoors(o, 0)
  return o
}

function setDoors(o: THREE.Object3D, shut: number): void {
  const b = built.get(o)
  if (!b) return
  const a = (1 - shut) * LEAF.open
  const x = b.cx
  Q.setFromAxisAngle(UP, a)
  b.doors.setMatrixAt(0, M.compose(P.set(x - b.hinge, b.y, 0), Q, ONE))
  Q.setFromAxisAngle(UP, Math.PI - a)
  b.doors.setMatrixAt(1, M.compose(P.set(x + b.hinge, b.y, 0), Q, ONE))
  b.doors.instanceMatrix.needsUpdate = true
}

export function poseHq(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  poseGlow(z, ctx)
  const v = ctx.byId.get('hq.door.left')?.v ?? [0, 9, 9]
  const slam = v[1] ?? 9
  const letGo = v[2] ?? 9
  let shut = 0
  if ((v[0] ?? 0) > 0.5) {
    shut = smooth(0, LEAF.slam, slam)
    if (slam > LEAF.slam) shut -= 0.05 * Math.exp(-(slam - LEAF.slam) * 15) * Math.abs(Math.sin((slam - LEAF.slam) * 52))
    if (slam < 0.5) o.position.y += 0.7 * Math.exp(-slam * 16) * Math.sin(slam * 150)
  } else if (letGo < 9) shut = 1 - smooth(0.04, 0.75, letGo)
  setDoors(o, shut)
}

export const dropHq = free
