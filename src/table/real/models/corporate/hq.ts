import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { DOORS } from '../../../draw'
import { BALL, table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type RGB, type V2, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, matsOf, mesh, moved, place, poseGlow, screw, shade, signBoard, smooth, textAt } from './mats'

const SEED = 20261125
const FLOOR = 15.2
const COL = 21
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
function curtain(S: Geo, G: Geo, a: V2, b: V2, z0: number, z1: number, rnd: Random, o: { floor?: number; col?: number; lit?: number; gold?: number; fin?: number; rise?: number } = {}): void {
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
    fin(G, FINISH.stone, () => {
      for (let j = 0; j < floors; j++) {
        let run = 0
        let on = false
        let warm = 1
        for (let i = 0; i < cols; i++) {
          if (run <= 0) {
            run = 1 + rnd.int(4)
            on = rnd.next() < share
            warm = rnd.range(0.72, 1.12)
          }
          run--
          const s0 = i * cw
          const s1 = s0 + cw
          const f0 = z0 + j * fh
          const f1 = f0 + fh
          const band = (u0: number, u1: number, c: RGB): void => {
            G.face([[s0, 0, f0 + fh * u0], [s1, 0, f0 + fh * u0], [s1, 0, f0 + fh * u1], [s0, 0, f0 + fh * u1]], n, al, c)
          }
          if (!on) {
            band(0, 1, [0.016, 0.022, 0.034])
            continue
          }
          const k = warm * rnd.range(0.9, 1.05)
          const cool = rnd.next() < 0.18 ? 1.5 : 1
          band(0.74, 1, [1.25 * k, 1.25 * k, 1.2 * k * cool])
          band(0.3, 0.74, [0.42 * k, 0.4 * k, 0.37 * k * cool])
          band(0, 0.3, rnd.next() < 0.4 ? [0.05, 0.05, 0.055] : [0.16 * k, 0.15 * k, 0.14 * k])
        }
      }
    })
  })
  moved(S, place(a[0], a[1], 0, turn), () => {
    fin(S, FINISH.brushed, () => {
      for (let j = 0; j <= floors; j++) {
        const f = z0 + j * fh
        S.box(0, len, -1.5, 0.4, f - 1.25, f + 1.25, TONE.steelDark, { bottom: true })
      }
    })
    fin(S, FINISH.polished, () => {
      for (let i = 0; i <= cols; i++) {
        const gold = o.gold ? i % o.gold === 0 : false
        const s = i * cw
        const w = gold ? 1.5 : 0.9
        S.box(s - w, s + w, -(gold ? depth : depth * 0.55), 0.4, z0, z1 + (gold ? (o.rise ?? 0) : 0), gold ? TONE.gold : TONE.steel)
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
  fin(g, FINISH.brushed, () => {
    g.box(0, 9, -t, t, z0, H, TONE.brass, { bottom: true })
    g.box(W - 9, W, -t, t, z0, H, TONE.brass, { bottom: true })
    g.box(9, W - 9, -t, t, H - 11, H, TONE.brass, { bottom: true })
    g.box(9, W - 9, -t - 0.5, t + 0.5, z0, 32, TONE.brassDark, { bottom: true })
    g.box(9, W - 9, -t + 0.6, t - 0.6, 82, 86, TONE.brass, { bottom: true })
  })
  fin(g, FINISH.polished, () => {
    for (const s of [-1, 1]) {
      const y0 = s > 0 ? t : -t - 1
      g.box(9, W - 9, y0, y0 + 1, 32, 33.6, TONE.gold)
      g.box(9, W - 9, y0, y0 + 1, H - 12.6, H - 11, TONE.gold)
      g.box(9, 10.6, y0, y0 + 1, 33.6, H - 12.6, TONE.gold)
      g.box(W - 10.6, W - 9, y0, y0 + 1, 33.6, H - 12.6, TONE.gold)
      g.box(13, W - 13, s > 0 ? t + 0.5 : -t - 1.3, s > 0 ? t + 1.3 : -t - 0.5, 5, 28, shade(TONE.brass, 0.92), { bevel: 0.5 })
      const hy = s * (t + 5.2)
      g.lathe([[0, -2], [1.9, -1.2], [1.9, 69.2], [0, 70]], W - 17, hy, 8, TONE.gold, 46)
      for (const hz of [52, 110]) g.box(W - 18.2, W - 15.8, Math.min(s * t, hy), Math.max(s * t, hy), hz - 1.2, hz + 1.2, TONE.brassDark, { bottom: true })
      for (const sx of [14.5, W - 14.5]) for (const sz of [7.5, 25.5]) screw(g, sx, s * (t + 1.3), sz, 1.1, TONE.gold, [0, s, 0])
    }
    for (let i = 1; i <= 4; i++) {
      const u = 9 + ((W - 18) * i) / 5
      g.box(u - 0.6, u + 0.6, -0.7, 0.7, 86, H - 11, TONE.gold)
      g.box(u - 0.6, u + 0.6, -0.7, 0.7, 32, 82, TONE.gold)
    }
    const mid = W / 2
    for (const [dz, dw] of [[0, 20], [4, 13], [8, 6]] as V2[]) g.box(mid - dw, mid + dw, -1, 1, H - 22 - dz, H - 19.5 - dz, TONE.gold, { bottom: true })
  })
  return g
}

export function buildHq(z: Zone, ctx: RealContext): THREE.Object3D {
  const m = model('corporate.hq')
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const G = new Geo()
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
      S.box(-HW, -HW + 20, F - 2, F + 6, 6, pz0, TONE.stone, { bevel: 1.5 })
      S.box(HW - 20, HW, F - 2, F + 6, 6, pz0, TONE.stone, { bevel: 1.5 })
    })
    fin(S, FINISH.satin, () => {
      S.box(-HW + 0.6, -vw, F + 0.6, B - 0.6, 6, pz1, TONE.graphite)
      S.box(vw, HW - 0.6, F + 0.6, B - 0.6, 6, pz1, TONE.graphite)
      S.box(-vw, vw, vb, B - 0.6, 6, pz1, TONE.graphite)
      S.box(-vw, vw, F + 0.6, vb, dh + 4, pz1, TONE.graphite, { bottom: true })
    })
    // The fascia over the lobby, with the plate the name stands on, and the canopy over the doors.
    fin(S, FINISH.brushed, () => {
      S.box(-HW - 1, HW + 1, F - 4, F + 1, pz0, pz1 - 0.4, TONE.steel, { bevel: 1, bottom: true })
      S.box(-dw - 19.2, dw + 19.2, F - 9.6, F - 4, pz0 + 2, pz1 - 2, TONE.nickel, { bottom: true })
      const fx = dw + 19.2
      for (const s of [-1, 1]) S.box(s > 0 ? fx : -fx - 3, s > 0 ? fx + 3 : -fx, F - 11.4, F - 4, pz0, pz1, TONE.steel, { bevel: 0.8, bottom: true })
      S.box(-fx - 3, fx + 3, F - 11.4, F - 4, pz1 - 2.6, pz1 + 0.4, TONE.steel, { bevel: 0.8, bottom: true })
      S.box(-fx - 3, fx + 3, F - 11.4, F - 4, pz0 - 0.4, pz0 + 2.6, TONE.steel, { bevel: 0.8, bottom: true })
      S.box(-dw - 22, dw + 22, F - 26, F, dh + 4, pz0 - 0.4, TONE.steel, { bevel: 1.4, bottom: true })
    })
    for (const s of [-1, 1]) screw(S, s * (dw + 12), F - 9.6, (pz0 + pz1) / 2, 2, TONE.steel, [0, -1, 0])
    fin(S, FINISH.polished, () => {
      for (const zz of [pz0 + 0.8, pz1 - 3.2]) {
        S.box(-HW - 1.6, -dw - 22.4, F - 5, F, zz, zz + 2, TONE.gold, { bottom: true })
        S.box(dw + 22.4, HW + 1.6, F - 5, F, zz, zz + 2, TONE.gold, { bottom: true })
      }
      S.box(-dw - 22.6, dw + 22.6, F - 26.8, F - 25.4, dh + 5.4, pz0 - 1.8, TONE.gold)
      // The brass portal round the doorway, in two steps.
      for (const s of [-1, 1]) {
        const a = s > 0 ? dw : -dw - 11
        S.box(a, a + 11, F - 6, F + 4, 0, dh + 4, TONE.brass, { bevel: 1.2 })
        const c = s > 0 ? dw + 11 : -dw - 17
        S.box(c, c + 6, F - 3, F + 4, 0, dh + 4, TONE.brassDark, { bevel: 0.8 })
      }
      S.box(-dw, dw, F - 6, F + 4, dh - 4.6, dh + 4, TONE.brass, { bottom: true })
      S.box(-dw - 1, dw + 1, F - 19.2, F + 4, 0, 2, TONE.brass, { bevel: 0.6 })
    })
    fin(S, FINISH.matte, () => S.box(-3, 3, F - 9, F - 5, 2, 5, TONE.rubber, { bevel: 1 }))
    fin(S, FINISH.cloth, () => S.box(-dw, dw, F + 4, vb, 0, 2.4, TONE.carpet))
  })

  // The lobby behind the doors: lit stone, two lift doors and a lit ceiling.
  moved(G, place(cx, 0, 0), () => {
    fin(G, FINISH.stone, () => {
      const wall: RGB = [0.5, 0.46, 0.4]
      G.face([[-vw, F, 0], [-vw, vb, 0], [-vw, vb, dh + 4], [-vw, F, dh + 4]], [1, 0, 0], [0, 1, 0], wall)
      G.face([[vw, F, 0], [vw, vb, 0], [vw, vb, dh + 4], [vw, F, dh + 4]], [-1, 0, 0], [0, 1, 0], wall)
      G.face([[-vw, vb, 0], [vw, vb, 0], [vw, vb, dh + 4], [-vw, vb, dh + 4]], [0, -1, 0], [1, 0, 0], wall)
      G.face([[-vw, F, dh + 4], [vw, F, dh + 4], [vw, vb, dh + 4], [-vw, vb, dh + 4]], [0, 0, -1], [1, 0, 0], [0.5, 0.5, 0.5])
      for (const s of [-1, 1]) {
        G.face([[s * 62 - 22, vb - 0.4, 3], [s * 62 + 22, vb - 0.4, 3], [s * 62 + 22, vb - 0.4, 104], [s * 62 - 22, vb - 0.4, 104]], [0, -1, 0], [1, 0, 0], [0.2, 0.15, 0.08])
        G.face([[s * 62 - 0.8, vb - 0.8, 3], [s * 62 + 0.8, vb - 0.8, 3], [s * 62 + 0.8, vb - 0.8, 104], [s * 62 - 0.8, vb - 0.8, 104]], [0, -1, 0], [1, 0, 0], [0.03, 0.03, 0.03])
        G.face([[s * 62 - 8, vb - 0.8, 110], [s * 62 + 8, vb - 0.8, 110], [s * 62 + 8, vb - 0.8, 116], [s * 62 - 8, vb - 0.8, 116]], [0, -1, 0], [1, 0, 0], [1.6, 1.5, 1.3])
        G.face([[s * 40 - 12, F + 14, dh + 3.6], [s * 40 + 12, F + 14, dh + 3.6], [s * 40 + 12, vb - 14, dh + 3.6], [s * 40 - 12, vb - 14, dh + 3.6]], [0, 0, -1], [1, 0, 0], [1.9, 1.85, 1.7])
      }
      G.face([[-20, vb - 0.4, 20], [20, vb - 0.4, 20], [20, vb - 0.4, 120], [-20, vb - 0.4, 120]], [0, -1, 0], [1, 0, 0], [0.95, 0.9, 0.8])
      G.face([[-vw, vb - 0.4, dh - 8], [vw, vb - 0.4, dh - 8], [vw, vb - 0.4, dh + 2], [-vw, vb - 0.4, dh + 2]], [0, -1, 0], [1, 0, 0], [1.5, 1.45, 1.3])
      // The lit soffit of the canopy.
      G.face([[-dw - 16, F - 22, dh + 3.9], [dw + 16, F - 22, dh + 3.9], [dw + 16, F - 7, dh + 3.9], [-dw - 16, F - 7, dh + 3.9]], [0, 0, -1], [1, 0, 0], [1.5, 1.45, 1.3])
    })
  })

  // The lobby's glass, either side of the portal.
  const lobby = { floor: (pz0 - 6) / 2, col: 20, lit: 1, gold: 1, fin: 3.2 }
  curtain(S, G, [X(-HW + 20), F], [X(-dw - 17), F], 6, pz0, rnd, lobby)
  curtain(S, G, [X(dw + 17), F], [X(HW - 20), F], 6, pz0, rnd, lobby)
  curtain(S, G, [X(HW), F], [X(HW), B], 6, pz1, rnd, { gold: 3 })
  curtain(S, G, [X(-HW), B], [X(-HW), F], 6, pz1, rnd, { gold: 3 })

  // The tower: three steps back, each with its own coping, flush at the front.
  const steps = [
    { hx: HW - 16, yb: B - 14, z0: pz1, z1: 296, rise: 7 },
    { hx: HW - 46, yb: B - 42, z0: 296, z1: 346, rise: 7 },
    { hx: HW - 71, yb: B - 70, z0: 346, z1: top - 6, rise: 0 }
  ]
  const coping = (hx: number, yb: number, zz: number): void => {
    moved(S, place(cx, 0, 0), () => {
      fin(S, FINISH.brushed, () => S.box(-hx - 2.4, hx + 2.4, F - 2.4, yb + 2.4, zz - 2.2, zz + 2.2, TONE.steel, { bevel: 1.2, bottom: true }))
      fin(S, FINISH.satin, () => S.box(-hx + 5, hx - 5, F + 5, yb - 5, zz + 2.2, zz + 2.7, TONE.roof))
      fin(S, FINISH.polished, () => {
        S.box(-hx + 2.6, hx - 2.6, F + 2.6, F + 4, zz + 2.2, zz + 3.2, TONE.gold)
        S.box(-hx + 2.6, hx - 2.6, yb - 4, yb - 2.6, zz + 2.2, zz + 3.2, TONE.gold)
        S.box(-hx + 2.6, -hx + 4, F + 4, yb - 4, zz + 2.2, zz + 3.2, TONE.gold)
        S.box(hx - 4, hx - 2.6, F + 4, yb - 4, zz + 2.2, zz + 3.2, TONE.gold)
      })
    })
  }
  coping(HW, B, pz1)
  for (const st of steps) {
    moved(S, place(cx, 0, 0), () => fin(S, FINISH.satin, () => S.box(-st.hx + 0.6, st.hx - 0.6, F + 0.6, st.yb, st.z0, st.z1, TONE.graphite)))
    curtain(S, G, [X(-st.hx), F], [X(st.hx), F], st.z0 + 2.2, st.z1 - 2.2, rnd, { gold: 2, rise: st.rise, fin: 3.6 })
    curtain(S, G, [X(st.hx), F], [X(st.hx), st.yb], st.z0 + 2.2, st.z1 - 2.2, rnd, { gold: 2, rise: st.rise })
    curtain(S, G, [X(-st.hx), st.yb], [X(-st.hx), F], st.z0 + 2.2, st.z1 - 2.2, rnd, { gold: 2, rise: st.rise })
    coping(st.hx, st.yb, st.z1)
  }

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
          S.box(x - 9, x + 9, y - 12, y + 12, s1.z1 + 2.2, s1.z1 + 13, TONE.steelDark, { bevel: 1.4 })
          S.lathe([[6.5, 0], [6.5, 1], [0, 1]], x, y, 14, shade(TONE.graphite, 0.5), s1.z1 + 13)
          S.box(x - 0.8, x + 0.8, y - 6, y + 6, s1.z1 + 14, s1.z1 + 14.6, TONE.steel)
          S.box(x - 6, x + 6, y - 0.8, y + 0.8, s1.z1 + 14, s1.z1 + 14.6, TONE.steel)
        }
      }
      for (let i = 0; i < 5; i++) {
        const x = -s1.hx + 40 + (i * (2 * s1.hx - 80)) / 4
        S.box(x - 16, x + 16, s1.yb - 22, s1.yb - 8, s1.z1 + 2.2, s1.z1 + 10, TONE.steelDark, { bevel: 1.2 })
      }
      S.lathe([[9, 0], [9, 5], [7.5, 6.5], [0, 6.5]], -s3.hx + 22, F + 58, 16, TONE.steelDark, s3.z1 + 2.2)
      S.lathe([[9, 0], [9, 5], [7.5, 6.5], [0, 6.5]], s3.hx - 22, F + 58, 16, TONE.steelDark, s3.z1 + 2.2)
      S.lathe([[6, 0], [6, 0.6], [0, 0.6]], -s3.hx + 22, F + 58, 12, shade(TONE.graphite, 0.5), s3.z1 + 8.7)
      S.lathe([[6, 0], [6, 0.6], [0, 0.6]], s3.hx - 22, F + 58, 12, shade(TONE.graphite, 0.5), s3.z1 + 8.7)
    })
    fin(S, FINISH.polished, () => {
      for (const st of [{ hx: HW, yb: B, z: pz1 }, { hx: s1.hx, yb: s1.yb, z: s1.z1 }, { hx: s2.hx, yb: s2.yb, z: s2.z1 }]) {
        for (const sx of [-1, 1]) for (const y of [F + 4.5, st.yb - 4.5]) {
          const x = sx * (st.hx - 4.5)
          S.box(x - 4.5, x + 4.5, y - 4.5, y + 4.5, st.z + 2.2, st.z + 6, TONE.gold, { bevel: 0.8 })
          S.box(x - 3, x + 3, y - 3, y + 3, st.z + 6, st.z + 9.5, TONE.gold, { bevel: 0.8 })
          S.box(x - 1.5, x + 1.5, y - 1.5, y + 1.5, st.z + 9.5, st.z + 13, TONE.gold, { bevel: 0.6 })
        }
      }
      // The frame of the skylight.
      const kx = 44
      const ky0 = F + 84
      const ky1 = s3.yb - 12
      const kz = s3.z1 + 2.2
      S.box(-kx - 3, kx + 3, ky0 - 3, ky0, kz, kz + 5, TONE.steel, { bevel: 0.8 })
      S.box(-kx - 3, kx + 3, ky1, ky1 + 3, kz, kz + 5, TONE.steel, { bevel: 0.8 })
      S.box(-kx - 3, -kx, ky0, ky1, kz, kz + 5, TONE.steel, { bevel: 0.8 })
      S.box(kx, kx + 3, ky0, ky1, kz, kz + 5, TONE.steel, { bevel: 0.8 })
      for (let i = 1; i < 4; i++) S.box(-kx + (i * 2 * kx) / 4 - 0.8, -kx + (i * 2 * kx) / 4 + 0.8, ky0, ky1, kz, kz + 4.6, TONE.gold)
      S.box(-kx, kx, (ky0 + ky1) / 2 - 0.8, (ky0 + ky1) / 2 + 0.8, kz, kz + 4.6, TONE.gold)
    })
  })
  moved(G, place(cx, 0, 0), () => {
    fin(G, FINISH.stone, () => {
      const kx = 44
      const ky0 = F + 84
      const ky1 = s3.yb - 12
      const kz = s3.z1 + 5.4
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const k = rnd.range(0.75, 1.1)
        const x0 = -kx + (i * 2 * kx) / 4
        const y0 = ky0 + (j * (ky1 - ky0)) / 2
        G.face([[x0, y0, kz], [x0 + (2 * kx) / 4, y0, kz], [x0 + (2 * kx) / 4, y0 + (ky1 - ky0) / 2, kz], [x0, y0 + (ky1 - ky0) / 2, kz]], [0, 0, 1], [1, 0, 0], [0.9 * k, 0.88 * k, 0.8 * k])
      }
      // Small lamps on the second step that wash the crown.
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) G.lathe([[3.2, 0], [3.2, 2.4], [2.2, 3.4], [0, 3.6]], sx * (s2.hx - 12), F + 30 + i * 44, 10, [1.6, 1.55, 1.4], s2.z1 + 2.2)
    })
  })

  // The board the name stands on, at the front edge of the crown.
  const h0 = 22
  const sign = textAt(ctx, z, 'sign.corporate.hq', { c: [cx, F + 8 + (h0 / 2) * 0.866, top + 6 + h0 / 4], w: 150, h: h0, tilt: 0.5235987755982988 })
  signBoard(S, sign.c, sign.w, sign.h, sign.tilt, s3.z1 + 2.2, TONE.gold, TONE.nickel)

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
  const doors = new THREE.InstancedMesh(leaf().done(), mats.solid, 2)
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
