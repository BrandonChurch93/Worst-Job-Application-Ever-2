import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { DOORS } from '../../../draw'
import { BALL, table } from '../../../layout'
import { colours } from '../../lights'
import { localBalls, type Zone } from '../../zone'
import { Geo, type RGB, type V2 } from './geo'
import { FINISH, TONE, drop as free, fin, hex, matsOf, mesh, moved, place, poseGlow, screw, shade, signBoard, smooth, textAt } from './mats'

const SEED = 20261125
const FLOORS = 4
const BAY = 31
const WHITE: RGB = [1, 0.9, 0.72]
const COOL: RGB = [WHITE[0] / colours.CORPORATE_WINDOW[0], WHITE[1] / colours.CORPORATE_WINDOW[1], WHITE[2] / colours.CORPORATE_WINDOW[2]]
const STEEL = hex(0x9ca8bd)
const STEEL_DARK = hex(0x727d8f)
const PORTAL = hex(0x8a6a2c)
const ROOF = hex(0x6a707a)
const BRIGHT = hex(0xbac4d4)
const GLASS: RGB = [0.016, 0.085, 0.1]
const CARPET: RGB = [0.028, 0.05, 0.075]
const CEILING: RGB = [COOL[0] * 0.004, COOL[1] * 0.008, COOL[2] * 0.01]
const PILE = { step: 3, lean: 0.56 }
const DESK: RGB = [0.5, 0.38, 0.24]
const GLASS_PALE: RGB = [0.02, 0.085, 0.1]
const LOBBY = { dense: 0.32, mirrored: 0.8 }
const GLASS_ROOF: RGB = [0.02, 0.09, 0.1]
const lamp = (k: number, blue = 1): RGB => [COOL[0] * k, COOL[1] * k, COOL[2] * k * blue]
const warm = (k: number): RGB => [COOL[0] * k, COOL[1] * k * 0.84, COOL[2] * k * 0.56]
const LEAF = { thick: 4.8, lift: 1.5, open: 1.53, slam: 0.09 }
const ROOM = { glass: 5, side: 9, back: 8, ring: 26, step: 12, slab: 3.5 }

interface Rect { x0: number; x1: number; y0: number; y1: number }
interface Built { doors: THREE.InstancedMesh; panes: THREE.InstancedMesh; hinge: number; y: number; cx: number }
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

const inset = (r: Rect, d: number): Rect => ({ x0: r.x0 + d, x1: r.x1 - d, y0: r.y0 + d, y1: r.y1 - d })
const flat = (g: Geo, r: Rect, z: number, up: number, col: RGB): void => {
  if (r.x1 - r.x0 < 0.01 || r.y1 - r.y0 < 0.01) return
  g.face([[r.x0, r.y0, z], [r.x1, r.y0, z], [r.x1, r.y1, z], [r.x0, r.y1, z]], [0, 0, up], [1, 0, 0], col)
}
// A level floor or ceiling between an outer edge and a hole.
function level(g: Geo, o: Rect, h: Rect | null, z: number, up: number, col: RGB): void {
  if (!h) return flat(g, o, z, up, col)
  flat(g, { x0: o.x0, x1: o.x1, y0: o.y0, y1: h.y0 }, z, up, col)
  flat(g, { x0: o.x0, x1: o.x1, y0: h.y1, y1: o.y1 }, z, up, col)
  flat(g, { x0: o.x0, x1: h.x0, y0: h.y0, y1: h.y1 }, z, up, col)
  flat(g, { x0: h.x1, x1: o.x1, y0: h.y0, y1: h.y1 }, z, up, col)
}
// The four upright faces of a rectangle, turned to its inside or its outside.
function upright(g: Geo, r: Rect, z0: number, z1: number, inside: boolean, col: RGB): void {
  const k = inside ? 1 : -1
  g.face([[r.x0, r.y0, z0], [r.x1, r.y0, z0], [r.x1, r.y0, z1], [r.x0, r.y0, z1]], [0, k, 0], [1, 0, 0], col)
  g.face([[r.x0, r.y1, z0], [r.x1, r.y1, z0], [r.x1, r.y1, z1], [r.x0, r.y1, z1]], [0, -k, 0], [1, 0, 0], col)
  g.face([[r.x0, r.y0, z0], [r.x0, r.y1, z0], [r.x0, r.y1, z1], [r.x0, r.y0, z1]], [k, 0, 0], [0, 1, 0], col)
  g.face([[r.x1, r.y0, z0], [r.x1, r.y1, z0], [r.x1, r.y1, z1], [r.x1, r.y0, z1]], [-k, 0, 0], [0, 1, 0], col)
}
// Rows of light panels let into a ceiling, each one a lamp of the room under it.
function panels(g: Geo, o: Rect, h: Rect | null, z: number, k: (x: number, y: number) => number, tone: (v: number) => RGB = lamp): void {
  const nx = Math.max(2, 2 * Math.round((o.x1 - o.x0) / BAY))
  const ny = Math.max(2, Math.round((o.y1 - o.y0) / 21))
  const px = (o.x1 - o.x0) / nx
  const py = (o.y1 - o.y0) / ny
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x = o.x0 + (i + 0.5) * px
      const y = o.y0 + (j + 0.5) * py
      if (h && x > h.x0 - 5 && x < h.x1 + 5 && y > h.y0 - 3 && y < h.y1 + 3) continue
      const v = k(x, y)
      if (v <= 0) continue
      flat(g, { x0: x - px * 0.3, x1: x + px * 0.3, y0: y - 3.6, y1: y + 3.6 }, z, -1, tone(v))
    }
  }
}

// A run of glass from a to b, pane by pane, no two of quite one tint. The outside is to the right of the way from a to b.
function glazing(g: Geo, a: V2, b: V2, z0: number, z1: number, cols: number, rows: number, rnd: Random, tint: RGB, dense: number): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  moved(g, place(a[0], a[1], 0, Math.atan2(b[1] - a[1], b[0] - a[0])), () => {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const s0 = (i * len) / cols
        const s1 = ((i + 1) * len) / cols
        const f0 = z0 + ((z1 - z0) * j) / rows
        const f1 = z0 + ((z1 - z0) * (j + 1)) / rows
        const k = rnd.range(0.8, 1.25)
        fin(g, FINISH.stone, () => g.face([[s0, 0, f0], [s1, 0, f0], [s1, 0, f1], [s0, 0, f1]], [0, -1, 0], [1, 0, 0], shade(tint, k)), 2 * dense * rnd.range(0.9, 1.1))
      }
    }
  })
}

// The steel that holds a run of glass: a mullion at every bay, a rail at every floor, a slim transom between.
function framing(S: Geo, W: Geo, a: V2, b: V2, z0: number, z1: number, cols: number, floors: number, o: { fin?: number; wide?: number; transom?: number; ends?: boolean } = {}): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const deep = o.fin ?? 3
  const w = (o.wide ?? 1.7) / 2
  moved(S, place(a[0], a[1], 0, Math.atan2(b[1] - a[1], b[0] - a[0])), () => {
    fin(S, FINISH.brushed, () => {
      for (let i = o.ends === false ? 1 : 0; i <= cols - (o.ends === false ? 1 : 0); i++) {
        const s = (i * len) / cols
        S.box(s - w, s + w, -deep, 0.5, z0, z1, i % 2 === 0 ? STEEL : STEEL_DARK)
      }
      for (let j = 0; j <= floors; j++) {
        const f = z0 + ((z1 - z0) * j) / floors
        S.box(0, len, -deep * 0.6, 0.5, f - 2.4, f + 2.4, shade(STEEL_DARK, 0.86), { bottom: true })
      }
    })
  })
  if (!o.transom) return
  moved(W, place(a[0], a[1], 0, Math.atan2(b[1] - a[1], b[0] - a[0])), () => {
    fin(W, FINISH.brushed, () => {
      for (let j = 0; j < floors; j++) {
        const f = z0 + ((z1 - z0) * (j + o.transom!)) / floors
        W.box(0, len, -1.4, 0.4, f - 0.7, f + 0.7, STEEL_DARK, { bottom: true })
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
    const deep = shade(TONE.brass, 0.58)
    g.box(0, st, -t, t, z0, H, deep, { bottom: true, bevel: 0.6 })
    g.box(W - st, W, -t, t, z0, H, deep, { bottom: true, bevel: 0.6 })
    g.box(st, W - st, -t, t, H - 7, H, deep, { bottom: true })
    g.box(st, W - st, -t, t, z0, kick, shade(TONE.brassDark, 0.6), { bottom: true })
    // The worn edges of each stile and rail, where the brass is bright.
    for (const s of [-1, 1]) {
      const y = s * (t + 0.06)
      const line = (x0: number, x1: number, a: number, b: number, k: number): void => { g.face(s > 0 ? [[x1, y, a], [x0, y, a], [x0, y, b], [x1, y, b]] : [[x0, y, a], [x1, y, a], [x1, y, b], [x0, y, b]], [0, s, 0], [0, 0, 1], shade(TONE.gold, k)) }
      line(0.7, 1.5, z0 + 1, H - 1, 1.7)
      line(st - 1.3, st - 0.6, kick, H - 7, 1.25)
      line(W - st + 0.6, W - st + 1.3, kick, H - 7, 1.25)
      line(W - 1.5, W - 0.7, z0 + 1, H - 1, 1.7)
      line(st, W - st, H - 7.6, H - 6.9, 1.25)
      line(st, W - st, kick - 0.7, kick, 1.5)
      line(2.4, 3.6, z0 + 1, H - 1, 0.5)
      line(W - 3.6, W - 2.4, z0 + 1, H - 1, 0.5)
    }
  }, 0)
  fin(g, FINISH.polished, () => {
    for (const s of [-1, 1]) {
      g.box(st + 3, W - st - 3, s > 0 ? t : -t - 0.9, s > 0 ? t + 0.9 : -t, 5, kick - 4, shade(TONE.brass, 0.92), { bevel: 0.5 })
      const hy = s * (t + 5.2)
      g.lathe([[0, -2], [1.7, -1.2], [1.7, 71.2], [0, 72]], W - st / 2, hy, 8, TONE.gold, 44)
      for (const hz of [50, 110]) g.box(W - st / 2 - 1.1, W - st / 2 + 1.1, Math.min(s * t, hy), Math.max(s * t, hy), hz - 1.1, hz + 1.1, TONE.brassDark, { bottom: true })
      for (const sx of [st + 5, W - st - 5]) for (const sz of [7.5, kick - 6.5]) screw(g, sx, s * (t + 0.9), sz, 1, TONE.gold, [0, s, 0])
    }
  }, 0)
  return g
}

// The glass of one leaf.
function leafGlass(): Geo {
  const g = new Geo()
  const W = ((DOORS.w - DOORS.seam) / 2) * BALL
  const H = (DOORS.h - 0.05) * BALL
  fin(g, FINISH.stone, () => g.face([[6, 0, 24], [W - 6, 0, 24], [W - 6, 0, H - 7], [6, 0, H - 7]], [0, -1, 0], [1, 0, 0], GLASS_PALE), 0.2)
  // What the pane mirrors: two slanting streaks of the room's light.
  const gw = W - 12
  fin(g, FINISH.stone, () => {
    for (const [at, w] of [[0.1, 0.2], [0.4, 0.05]] as V2[]) {
      const x = 6 + gw * at
      g.face([[x, -0.08, 24], [x + gw * w, -0.08, 24], [x + gw * (w + 0.34), -0.08, H - 7], [x + gw * 0.34, -0.08, H - 7]], [0, -1, 0], [1, 0, 0], [0.5, 0.6, 0.62])
    }
  }, 2 * 0.028)
  return g
}

export function buildHq(z: Zone, ctx: RealContext): THREE.Object3D {
  const m = model('corporate.hq')
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const G = new Geo()
  const W = new Geo()
  const C = new Geo()
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
  const face = F - 0.1 * BALL
  const roof = top - 6
  const fh = (roof - pz1) / FLOORS
  // The lobby behind its glass, the shaft of the tower over the band, and the hall that runs up the middle of both.
  const room: Rect = { x0: -HW + ROOM.side, x1: HW - ROOM.side, y0: F + ROOM.glass, y1: B - ROOM.back }
  const shaft: Rect = { x0: -HW + 6, x1: HW - 6, y0: F + 2, y1: B - 6 }
  const lantern = inset(shaft, ROOM.ring)
  const hole = (i: number): Rect => inset(lantern, ROOM.step * (FLOORS - i))
  const mid: V2 = [0, (lantern.y0 + lantern.y1) / 2]
  const cols = Math.round((shaft.x1 - shaft.x0) / BAY)
  const rows = Math.round((shaft.y1 - shaft.y0) / BAY)
  const here = (fn: () => void, ...gs: Geo[]): void => {
    const from = gs.map((g) => g.vertices)
    fn()
    gs.forEach((g, i) => g.move(from[i]!, place(cx, 0, 0)))
  }

  here(() => {
    // The base plate, the piers at the corners of the lobby and its back wall.
    fin(S, FINISH.stone, () => S.box(-HW, HW, F, B, 0, 6, shade(TONE.graphite, 0.8), { bevel: 1.2 }))
    const piers = S.vertices
    fin(S, FINISH.brushed, () => {
      for (const s of [-1, 1]) S.box(s > 0 ? HW - 14 : -HW, s > 0 ? HW : -HW + 14, F - 2, F + 12, 6, pz0, STEEL_DARK, { bevel: 1.5 })
    })
    S.grade(piers, (_x, _y, zz) => 0.72 + 0.4 * Math.max(0, Math.min(1, (zz - 6) / (pz0 - 6))))
    fin(S, FINISH.satin, () => S.box(-HW + 4, HW - 4, room.y1, B - 0.6, 6, pz0, TONE.graphite))

    // The band: one long run of brushed steel, wider than the glass under it, with a chamfered lower lip.
    const band = S.vertices
    const lip = 7
    const out = HW + 5
    const profile = (deep: number): V2[] => [[8, pz0 + 1], [-deep + 4.3, pz0 + 1], [-deep, pz0 + lip], [-deep, pz1 - 1.2], [-deep + 1.2, pz1], [8, pz1]].map((q) => [-q[0]!, q[1]!] as V2)
    fin(S, FINISH.brushed, () => {
      S.prism(profile(F - face - 0.2), [-out, F], [out, F], STEEL)
      // The brushing of the band: long streaks, no two of one grey.
      const brush = new Random(SEED, 'corporate.hq.band')
      for (let zz = pz0 + lip; zz < pz1 - 1.3; ) {
        const up = Math.min(pz1 - 1.2, zz + brush.range(0.7, 2.6))
        for (let x = -out; x < out; ) {
          const x1 = Math.min(out, x + brush.range(40, 160))
          S.face([[x, face + 0.1, zz], [x1, face + 0.1, zz], [x1, face + 0.1, up], [x, face + 0.1, up]], [0, -1, 0], [1, 0, 0], shade(STEEL, brush.range(0.72, 1.12)))
          x = x1
        }
        zz = up
      }
      S.prism(profile(5), [HW, F], [HW, B + 1], STEEL)
      S.prism(profile(5), [-HW, B + 1], [-HW, F], STEEL)
      S.box(-out, out, B - 4, B + 1, pz0 + 1, pz1, STEEL_DARK, { bottom: true })
    })
    S.grade(band, (_x, _y, zz) => 0.7 + 0.42 * Math.max(0, Math.min(1, (zz - pz0) / (pz1 - pz0))) ** 1.4)
    fin(S, FINISH.polished, () => {
      S.box(-out - 0.4, out + 0.4, face - 0.5, face + 1.4, pz0 + lip - 0.6, pz0 + lip + 0.6, BRIGHT, { bottom: true })
      S.box(-out - 0.4, out + 0.4, face - 0.5, face + 1.4, pz1 - 2.4, pz1 - 1.4, BRIGHT, { bottom: true })
    })
    for (const s of [-1, 1]) for (const u of [0.74, 0.97]) screw(S, s * out * u, face + 0.2, (pz0 + lip + pz1) / 2, 1.8, STEEL, [0, -1, 0])

    // The brass portal round the doorway, in two steps, its head up to the band and its threshold.
    fin(S, FINISH.brushed, () => {
      for (const s of [-1, 1]) {
        const a = s > 0 ? dw : -dw - 11
        S.box(a, a + 11, F - 6, F + 6, 0, pz0, shade(PORTAL, 0.5), { bevel: 1.2 })
        const c = s > 0 ? dw + 11 : -dw - 17
        S.box(c, c + 6, F - 3, F + 6, 0, pz0, shade(PORTAL, 0.32), { bevel: 0.8 })
      }
      S.box(-dw, dw, F - 6, F + 6, dh - 4.6, pz0, shade(PORTAL, 0.5), { bottom: true })
      S.box(-dw, dw, F + 6, F + 6.1, dh - 4.6, dh - 3.8, shade(TONE.gold, 1.5))
      S.box(-dw, dw, F + 6, F + 6.1, pz0 - 1.6, pz0 - 0.8, shade(TONE.gold, 1.1))
      // What polished brass mirrors: upright streaks of the room, no two of one tone.
      const gleam = new Random(SEED, 'corporate.hq.brass')
      for (const s of [-1, 1]) {
        const a = s > 0 ? dw : -dw - 11
        for (let x = a + 1.2; x < a + 9.4;) {
          const w = gleam.range(0.5, 2.2)
          S.face([[x, F + 6.12, 2.4], [Math.min(a + 9.8, x + w), F + 6.12, 2.4], [Math.min(a + 9.8, x + w), F + 6.12, pz0 - 0.5], [x, F + 6.12, pz0 - 0.5]], [0, 1, 0], [0, 0, 1], shade(PORTAL, gleam.next() < 0.2 ? gleam.range(1.6, 2.8) : gleam.range(0.2, 0.6)))
          x += w + gleam.range(0, 1.4)
        }
      }
      S.box(-dw - 1, dw + 1, F - 14, F + 6, 0, 2, PORTAL, { bevel: 0.6 })
    })
    fin(S, FINISH.matte, () => S.box(-3, 3, F - 9, F - 5, 2, 5, TONE.rubber, { bevel: 1 }))

    // The hall: a pale stone floor with a dark border and a brass round under the open middle, a runner in from the doors, columns, a desk and three lifts in the back wall.
    fin(G, FINISH.stone, () => {
      flat(G, room, 6.2, 1, warm(0.15))
      level(G, inset(room, 7), inset(room, 9.5), 6.3, 1, warm(0.16))
      G.lathe([[30, 0], [30, 0.3], [0, 0.3]], mid[0], mid[1], 28, (k) => (k === 0 ? warm(0.2) : warm(0.62)), 6.2)
      G.lathe([[23, 0], [23, 0.2], [0, 0.2]], mid[0], mid[1], 28, [COOL[0] * 0.5, COOL[1] * 0.36, COOL[2] * 0.16], 6.5)
      G.lathe([[17, 0], [17, 0.2], [0, 0.2]], mid[0], mid[1], 28, warm(0.7), 6.7)
      // The back wall: dim at the floor, lit under the ceiling.
      const rise = [6, 6 + (pz0 - 6) * 0.45, 6 + (pz0 - 6) * 0.8, pz0]
      ;[0.05, 0.1, 0.19].forEach((k, i) => G.face([[room.x0, room.y1, rise[i]!], [room.x1, room.y1, rise[i]!], [room.x1, room.y1, rise[i + 1]!], [room.x0, room.y1, rise[i + 1]!]], [0, -1, 0], [1, 0, 0], warm(k)))
      for (const s of [-1, 0, 1]) {
        const x = s * 46
        G.face([[x - 15, room.y1 - 0.4, 6], [x + 15, room.y1 - 0.4, 6], [x + 15, room.y1 - 0.4, 104], [x - 15, room.y1 - 0.4, 104]], [0, -1, 0], [1, 0, 0], [0.26, 0.19, 0.09])
        G.face([[x - 0.6, room.y1 - 0.8, 6], [x + 0.6, room.y1 - 0.8, 6], [x + 0.6, room.y1 - 0.8, 104], [x - 0.6, room.y1 - 0.8, 104]], [0, -1, 0], [1, 0, 0], [0.03, 0.03, 0.03])
        G.face([[x - 6, room.y1 - 0.8, 109], [x + 6, room.y1 - 0.8, 109], [x + 6, room.y1 - 0.8, 114], [x - 6, room.y1 - 0.8, 114]], [0, -1, 0], [1, 0, 0], lamp(1.3))
      }
      for (const sx of [-1, 1]) for (const y of [room.y0 + 34, room.y1 - 40]) G.box(sx * 112 - 6, sx * 112 + 6, y - 6, y + 6, 6, pz0, warm(0.1))
    }, 1)
    fin(G, FINISH.cloth, () => flat(G, { x0: -dw + 14, x1: dw - 14, y0: F + 6, y1: mid[1] - 30 }, 6.5, 1, [0.36, 0.03, 0.05]), 1)
    fin(G, FINISH.gloss, () => {
      G.box(-34, 34, room.y1 - 44, room.y1 - 32, 6, 30, [0.2, 0.1, 0.045], { top: warm(0.55) })
    }, 1)
    // The lobby's ceiling and the walls of the open middle up through the band.
    fin(G, FINISH.matte, () => {
      level(G, room, hole(0), pz0 - 0.4, -1, warm(0.1))
      upright(G, hole(0), pz0 - 0.4, pz1, true, warm(0.3))
      panels(G, room, hole(0), pz0 - 0.9, () => 1.5)
      // The lit soffit of the band over the doors.
      for (const s of [-2, -1, 0, 1, 2]) flat(G, { x0: s * 38 - 7, x1: s * 38 + 7, y0: face + 4, y1: face + 8 }, pz0 + 0.9, -1, lamp(1.2))
    }, 1)

    // The floors of the tower, each a gallery round the open middle: a lit floor, a bright edge, a ceiling of lamps for the floor under it.
    const dark = new Random(SEED, 'corporate.hq.floors')
    for (let i = 0; i <= FLOORS; i++) {
      const zz = pz1 + i * fh
      const h = i < FLOORS ? hole(i) : lantern
      const gone = Array.from({ length: 48 }, () => (dark.next() < 0.2 ? 0 : dark.range(0.7, 1.15)))
      const zone = (x: number, y: number): number => {
        const front = y < mid[1] ? 0 : 1
        const side = Math.abs(x) > shaft.x1 - 40 ? (x < 0 ? 1 : 2) : 0
        return gone[(front * 3 + side) * 6 + Math.floor(((x - shaft.x0) / (shaft.x1 - shaft.x0)) * 5.99)] ?? 1
      }
      if (i < FLOORS) {
        fin(G, FINISH.satin, () => {
          const deep = 0.3 + (0.7 * i) / (FLOORS - 1)
          level(G, shaft, h, zz + 0.5, 1, shade(CARPET, deep))
          level(G, inset(h, -1.6), h, zz + 0.6, 1, warm(0.5 * deep))
          // The desks of the floor, in a row round the open middle, each under its own lamp.
          const row = inset(h, -6.5)
          const nx = Math.round((row.x1 - row.x0) / 15)
          const ny = Math.round((row.y1 - row.y0) / 15)
          const desk = (x: number, y: number, along: boolean): void => {
            if (dark.next() < 0.12) return
            const a = along ? 4.6 : 2.3
            const b = along ? 2.3 : 4.6
            G.box(x - a, x + a, y - b, y + b, zz + 0.5, zz + 4, shade(DESK, deep * dark.range(0.8, 1.15)))
            flat(G, { x0: x - 1.1, x1: x + 1.1, y0: y - 1.1, y1: y + 1.1 }, zz + 4.1, 1, lamp(dark.range(0.5, 1.3) * deep))
          }
          for (let k = 0; k <= nx; k++) for (const y of [row.y0, row.y1]) desk(row.x0 + ((row.x1 - row.x0) * k) / nx, y, true)
          for (let k = 1; k < ny; k++) for (const x of [row.x0, row.x1]) desk(x, row.y0 + ((row.y1 - row.y0) * k) / ny, false)
        }, 1)
        fin(G, FINISH.matte, () => upright(G, h, zz - ROOM.slab, zz + 0.5, true, lamp(1.5)), 1)
        fin(G, FINISH.polished, () => upright(G, inset(h, -0.5), zz + 0.5, zz + 7, true, [0.5, 0.42, 0.26]), 0.5)
      }
      if (i > 0) {
        fin(G, FINISH.matte, () => {
          level(G, shaft, h, zz - ROOM.slab, -1, CEILING)
          panels(G, shaft, h, zz - ROOM.slab - 0.5, (x, y) => 0.8 * zone(x, y), warm)
        }, 1)
      }
    }
    // A lit sill outside the front glass at every rail and transom: from above, the leaning front shows as rows of lit panes between the fins.
    fin(G, FINISH.matte, () => {
      for (let j = 0; j < FLOORS * 2; j++) {
        const zz = pz1 + (j * fh) / 2 + 1.2
        for (let i = 0; i < cols; i++) {
          const x0 = shaft.x0 + ((shaft.x1 - shaft.x0) * i) / cols + 1.6
          const x1 = shaft.x0 + ((shaft.x1 - shaft.x0) * (i + 1)) / cols - 1.6
          flat(G, { x0, x1, y0: shaft.y0 - 2.6, y1: shaft.y0 - 0.2 }, zz, 1, lamp(dark.next() < 0.18 ? 0.12 : dark.range(0.35, 0.7)))
        }
      }
    }, 1)
  }, S, G)

  // The glass: clear in the lobby, darker under the band where its shadow lies, blue green up the tower, and clear over the hall.
  const sides: [V2, V2, number][] = [[[shaft.x0, shaft.y0], [shaft.x1, shaft.y0], cols], [[shaft.x1, shaft.y0], [shaft.x1, shaft.y1], rows], [[shaft.x1, shaft.y1], [shaft.x0, shaft.y1], cols], [[shaft.x0, shaft.y1], [shaft.x0, shaft.y0], rows]]
  here(() => {
    sides.forEach(([a, b, n], k) => {
      glazing(C, a, b, pz1, roof, k === 2 ? 1 : n, k === 2 ? 1 : FLOORS * 2, rnd, GLASS, k === 2 ? 0.8 : k === 0 ? 0.36 : 0.66)
      framing(S, W, a, b, pz1, roof, n, FLOORS, { transom: 0.5, fin: k === 0 ? 3.6 : 3 })
    })
    fin(S, FINISH.polished, () => {
      for (const sx of [-1, 1]) for (const y of [shaft.y0, shaft.y1]) S.box(sx * shaft.x1 - 2.6, sx * shaft.x1 + 2.6, y - 2.6, y + 2.6, pz1, roof + 2, BRIGHT)
    })
    const lobby: [V2, V2][] = [[[room.x0 + 5, room.y0], [-dw - 17, room.y0]], [[dw + 17, room.y0], [room.x1 - 5, room.y0]], [[room.x1, F + 12], [room.x1, room.y1]], [[room.x0, room.y1], [room.x0, F + 12]]]
    for (const [a, b] of lobby) {
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 23))
      glazing(C, a, b, 6, pz0 - 20, n, 1, rnd, GLASS_PALE, LOBBY.dense)
      const from = C.vertices
      glazing(C, a, b, pz0 - 20, pz0, n, 1, rnd, shade(GLASS, 0.4), LOBBY.dense)
      C.map(from, (_x, _y, zz) => [(FINISH.stone + 0.5) / 8, LOBBY.dense + (0.62 - LOBBY.dense) * smooth(pz0 - 20, pz0 - 3, zz)])
      framing(S, W, a, b, 6, pz0, n, 1, { fin: 2.2, wide: 1.3 })
    }
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < 4; j++) {
        const r: Rect = { x0: lantern.x0 + ((lantern.x1 - lantern.x0) * i) / cols, x1: lantern.x0 + ((lantern.x1 - lantern.x0) * (i + 1)) / cols, y0: lantern.y0 + ((lantern.y1 - lantern.y0) * j) / 4, y1: lantern.y0 + ((lantern.y1 - lantern.y0) * (j + 1)) / 4 }
        fin(C, FINISH.stone, () => flat(C, r, roof + 7, 1, shade(GLASS_ROOF, rnd.range(0.7, 1.3))), 2 * rnd.range(0.1, 0.2))
      }
    }
    // What the lantern mirrors: soft streaks of the room's light across its panes.
    fin(C, FINISH.stone, () => {
      const lw = lantern.x1 - lantern.x0
      const ld = lantern.y1 - lantern.y0
      for (const [at, w] of [[0.08, 0.1], [0.24, 0.03], [0.55, 0.06]] as V2[]) {
        const x = lantern.x0 + lw * at
        C.face([[x, lantern.y0, roof + 7.3], [x + lw * w, lantern.y0, roof + 7.3], [x + lw * w + ld * 0.45, lantern.y1, roof + 7.3], [x + ld * 0.45, lantern.y1, roof + 7.3]], [0, 0, 1], [1, 0, 0], [1.5, 1.8, 1.85])
      }
    }, 2 * 0.05)
  }, S, W, C)

  // The roof: a steel coping, a walk of dark slabs, and the lantern of glass over the hall with its bars.
  here(() => {
    const walk = inset(shaft, -2.4)
    fin(S, FINISH.brushed, () => {
      const curb = inset(lantern, -4)
      S.box(walk.x0, walk.x1, walk.y0, curb.y0, roof - 2.2, roof + 2.2, STEEL, { bevel: 1.2, bottom: true })
      S.box(walk.x0, walk.x1, curb.y1, walk.y1, roof - 2.2, roof + 2.2, STEEL, { bevel: 1.2, bottom: true })
      S.box(walk.x0, curb.x0, curb.y0, curb.y1, roof - 2.2, roof + 2.2, STEEL, { bottom: true })
      S.box(curb.x1, walk.x1, curb.y0, curb.y1, roof - 2.2, roof + 2.2, STEEL, { bottom: true })
      S.box(curb.x0, curb.x1, curb.y0, lantern.y0, roof + 2.2, roof + 8, STEEL, { bevel: 0.8 })
      S.box(curb.x0, curb.x1, lantern.y1, curb.y1, roof + 2.2, roof + 8, STEEL, { bevel: 0.8 })
      S.box(curb.x0, lantern.x0, lantern.y0, lantern.y1, roof + 2.2, roof + 8, STEEL, { bevel: 0.8 })
      S.box(lantern.x1, curb.x1, lantern.y0, lantern.y1, roof + 2.2, roof + 8, STEEL, { bevel: 0.8 })
    })
    fin(S, FINISH.satin, () => {
      const slab = new Random(SEED, 'corporate.hq.roof')
      const ringOf = (r: Rect, n: number, across: boolean): void => {
        for (let i = 0; i < n; i++) {
          const k = slab.range(0.86, 1.1)
          const q: Rect = across ? { x0: r.x0 + ((r.x1 - r.x0) * i) / n + 0.4, x1: r.x0 + ((r.x1 - r.x0) * (i + 1)) / n - 0.4, y0: r.y0, y1: r.y1 } : { x0: r.x0, x1: r.x1, y0: r.y0 + ((r.y1 - r.y0) * i) / n + 0.4, y1: r.y0 + ((r.y1 - r.y0) * (i + 1)) / n - 0.4 }
          flat(S, q, roof + 2.3, 1, shade(ROOF, k))
        }
      }
      const inner = inset(lantern, -4.6)
      const outer = inset(shaft, 3)
      ringOf({ x0: outer.x0, x1: outer.x1, y0: outer.y0, y1: inner.y0 }, cols, true)
      ringOf({ x0: outer.x0, x1: outer.x1, y0: inner.y1, y1: outer.y1 }, cols, true)
      ringOf({ x0: outer.x0, x1: inner.x0, y0: inner.y0, y1: inner.y1 }, rows - 2, false)
      ringOf({ x0: inner.x1, x1: outer.x1, y0: inner.y0, y1: inner.y1 }, rows - 2, false)
    })
    fin(S, FINISH.polished, () => {
      for (let i = 0; i <= cols; i++) {
        const x = lantern.x0 + ((lantern.x1 - lantern.x0) * i) / cols
        S.box(x - (i % 2 ? 0.8 : 1.3), x + (i % 2 ? 0.8 : 1.3), lantern.y0, lantern.y1, roof + 6.4, roof + 9, BRIGHT)
      }
      for (let j = 1; j < 4; j++) {
        const y = lantern.y0 + ((lantern.y1 - lantern.y0) * j) / 4
        S.box(lantern.x0, lantern.x1, y - (j === 2 ? 1.6 : 0.8), y + (j === 2 ? 1.6 : 0.8), roof + 6.4, roof + (j === 2 ? 10 : 8.6), BRIGHT)
      }
      for (const sx of [-1, 1]) for (const y of [shaft.y0 + 4.5, shaft.y1 - 4.5]) {
        const x = sx * (shaft.x1 - 4.5)
        S.box(x - 4.5, x + 4.5, y - 4.5, y + 4.5, roof + 2.2, roof + 6, BRIGHT, { bevel: 0.8 })
        S.box(x - 2.6, x + 2.6, y - 2.6, y + 2.6, roof + 6, roof + 10, BRIGHT, { bevel: 0.8 })
      }
    })
  }, S)

  // The two globe lamps at the doors, as the lobby glass mirrors them.
  for (const q of table.posts) {
    if (!q.lamp || q.tier !== z.tier) continue
    const p = localBalls(z, q.c[0], q.c[1])
    const x = p[0] - cx
    if (Math.abs(x) < dw + 20 || Math.abs(x) > room.x1 - 4) continue
    const y = 2 * room.y0 - p[1]
    const ball: V2[] = Array.from({ length: 9 }, (_, k) => [21 * Math.sin((k / 8) * Math.PI), 49 - 21 * Math.cos((k / 8) * Math.PI)] as V2)
    fin(G, FINISH.matte, () => G.lathe(ball, p[0], y, 16, lamp(LOBBY.mirrored)), 1)
  }

  // The board the name stands on, at the front edge of the roof.
  const h0 = 22
  const sign = textAt(ctx, z, 'sign.corporate.hq', { c: [cx, F + 8 + (h0 / 2) * 0.866, top + 6 + h0 / 4], w: 150, h: h0, tilt: 0.5235987755982988 })
  signBoard(S, sign.c, sign.w, sign.h, sign.tilt, roof + 2.2, STEEL, STEEL)

  // The carpet: pile with a bound edge and a brass line along each long side.
  const carpet = table.flats.find((f) => f.id === 'corporate.carpet')
  if (carpet) {
    const c0 = localBalls(z, carpet.box[0], carpet.box[1])
    const c1 = localBalls(z, carpet.box[0] + carpet.box[2], carpet.box[1] + carpet.box[3])
    fin(S, FINISH.cloth, () => {
      S.box(c0[0] + 5, c1[0] - 5, c1[1] + 5, c0[1], 0, 2.2, TONE.carpet)
      const rows = Math.max(2, Math.round((c1[0] - c0[0] - 10) / PILE.step))
      for (let i = 0; i < rows; i++) {
        const xa = c0[0] + 5 + ((c1[0] - c0[0] - 10) * i) / rows
        const xb = c0[0] + 5 + ((c1[0] - c0[0] - 10) * (i + 1)) / rows
        S.face([[xa, c1[1] + 5, 2.5], [xb, c1[1] + 5, 2.5], [xb, c0[1], 2.5], [xa, c0[1], 2.5]], [i % 2 ? PILE.lean : -PILE.lean, 0, 1], [0, 1, 0], shade(TONE.carpet, i % 2 ? 1 : 0.94))
      }
      S.box(c0[0], c0[0] + 5, c1[1], c0[1], 0, 3, TONE.carpetEdge, { bevel: 0.8 })
      S.box(c1[0] - 5, c1[0], c1[1], c0[1], 0, 3, TONE.carpetEdge, { bevel: 0.8 })
      S.box(c0[0] + 5, c1[0] - 5, c1[1], c1[1] + 5, 0, 3, TONE.carpetEdge, { bevel: 0.8 })
    })
    fin(S, FINISH.polished, () => {
      S.box(c0[0] + 7.5, c0[0] + 9.3, c1[1] + 7.5, c0[1], 2.5, 3, TONE.gold)
      S.box(c1[0] - 9.3, c1[0] - 7.5, c1[1] + 7.5, c0[1], 2.5, 3, TONE.gold)
    })
  }

  o.add(mesh(S, mats.solid, `hq.solid.${z.id}`, { cast: true }))
  o.add(mesh(G, mats.glow, `hq.glow.${z.id}`, { group: mats.group }))
  o.add(mesh(W, mats.solid, `hq.frame.${z.id}`, { fine: true }))
  o.add(mesh(C, mats.pane, `hq.glass.${z.id}`, { order: 3 }))
  const sphere = new THREE.Sphere(new THREE.Vector3(cx, F + 30, dh / 2), dw + 110)
  const doors = new THREE.InstancedMesh(leaf().done(), mats.glow, 2)
  if (mats.group) doors.userData.lightGroup = mats.group
  doors.name = `hq.doors.${z.id}`
  doors.receiveShadow = true
  doors.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  doors.boundingSphere = sphere
  o.add(doors)
  const panes = new THREE.InstancedMesh(leafGlass().done(), mats.pane, 2)
  panes.name = `hq.doors.glass.${z.id}`
  panes.renderOrder = 3
  panes.userData.fine = true
  panes.userData.order = 3
  panes.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  panes.boundingSphere = sphere
  o.add(panes)
  built.set(o, { doors, panes, hinge: dw, y: F - LEAF.thick / 2 - 0.4, cx })
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
  b.panes.setMatrixAt(0, M)
  Q.setFromAxisAngle(UP, Math.PI - a)
  b.doors.setMatrixAt(1, M.compose(P.set(x + b.hinge, b.y, 0), Q, ONE))
  b.panes.setMatrixAt(1, M)
  b.doors.instanceMatrix.needsUpdate = true
  b.panes.instanceMatrix.needsUpdate = true
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
