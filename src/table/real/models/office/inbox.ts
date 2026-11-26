import * as THREE from 'three'
import { config } from '../../../../config'
import { Random } from '../../../../core/random'
import type { RealContext } from '../../../../real/types'
import { BALL, table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { hex, Kit, matsOf, meshOf, mix, rounded, shade, smooth, SURF, type RGB, type Surf, type V3 } from './kit'

const C = {
  cream: hex(0xc4b08c),
  creamIn: hex(0xa8946f),
  creamLow: hex(0x8c7a5c),
  white: hex(0xf5f3ec),
  shadeWhite: hex(0xe2dfd6),
  steel: hex(0xb4bac1),
  dark: hex(0x1b1a18),
  deep: hex(0x0d0c0b),
  stamp: [hex(0xa33a36), hex(0x3d6a8f), hex(0x4f7c4e)] as RGB[]
}

const MOULD: Surf = [0.56, 0, 0.12]
// The tray: how thick its wall is, how round its corners and its lip, and where the bed of the heap lies as a share of its height.
const TRAY = { wall: 14, round: 4, lip: 2.2, bed: 0.6, foot: 0.2, step: 1.8 }
// The card holder on the front wall: its width, its height and how high it sits as a share of the tray's height.
const CARD = { w: 46, h: 22, z: 0.44 }
// The chute on the side of the hold: how far it stands out, how wide its mouth is, and its steel frame.
const CHUTE = { deep: 40, wide: 88, drop: 8, tall: 84, bar: 6, proud: 2.4, side: 8 }
const LIFT = { mould: 0.36, paper: 0.52 }
// The shade one envelope lays on what is under it: how far it reaches, and its colour.
const SHADE = { x: 3, y: 4, col: [0.3, 0.27, 0.23] as RGB, lift: 0.16 }
// The layer that fills the tray to its walls under the two heaps that hop: how many envelopes, how far beyond the heaps they spread, how light they are.
const FILL_LAYER = { count: 13, out: 3, dim: 0.92 }
// The hop of the two heaps: how high, how much later the upper one goes, how much lower the hop on the way out is, and how far they swell and turn so that the hop is seen from straight above as well.
const HOP = { a: 15, b: 22, lag: 0.07, out: 0.6, swell: 0.16, turn: 0.34, slide: 5 }

export function boxOf(z: Zone, id: string): { x: number; y: number; w: number; d: number; h: number } {
  const m = table.models.find((q) => q.id === id)
  if (!m) throw new Error(`No model "${id}" in the layout`)
  const [x, y] = localBalls(z, m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2)
  return { x, y, w: m.box[2] * BALL, d: m.box[3] * BALL, h: m.h * BALL }
}

// One envelope, lying on z: its back with the flap a little lifted, or its front with a stamp.
export function envelope(k: Kit, w: number, d: number, col: RGB, r: Random, back: boolean): void {
  const t = 1.3
  k.box(0, 0, 0, w, d, t, col, SURF.paper, 0.35)
  const z = t + 0.06
  const up: V3 = [0, 0, 1]
  const fold = shade(col, 0.6)
  if (back) {
    const tip = -d * 0.1
    const lift = 1.5
    const a: V3 = [-w / 2 + 0.5, d / 2 - 0.5, z]
    const b: V3 = [w / 2 - 0.5, d / 2 - 0.5, z]
    const c: V3 = [0, tip, z + lift]
    const n: V3 = [0, lift, d / 2 - 0.5 - tip]
    const l = Math.hypot(n[1], n[2])
    const nn: V3 = [0, n[1] / l, n[2] / l]
    k.tri(a, b, c, nn, nn, nn, mix(col, [1, 1, 1], 0.2), SURF.paper)
    k.flat([[a[0], a[1], z + 0.02], [b[0], b[1], z + 0.02], [b[0] - 1.2, b[1] - 0.9, z + 0.02], [a[0] + 1.2, a[1] - 0.9, z + 0.02]], up, shade(col, 0.8), SURF.paper)
    k.tri(a, c, [a[0], a[1], z], [-0.6, -0.6, 0.5], [-0.6, -0.6, 0.5], [-0.6, -0.6, 0.5], fold, SURF.paper)
    k.tri(b, c, [b[0], b[1], z], [0.6, -0.6, 0.5], [0.6, -0.6, 0.5], [0.6, -0.6, 0.5], fold, SURF.paper)
    const lw = 0.75
    const line = (p: V3, q: V3): void => {
      const dx = q[0] - p[0]
      const dy = q[1] - p[1]
      const len = Math.hypot(dx, dy)
      const nx = (-dy / len) * lw
      const ny = (dx / len) * lw
      k.flat([[p[0] - nx, p[1] - ny, z], [q[0] - nx, q[1] - ny, z], [q[0] + nx, q[1] + ny, z], [p[0] + nx, p[1] + ny, z]], up, fold, SURF.paper)
    }
    line([-w / 2 + 0.6, -d / 2 + 0.6, 0], [-w * 0.13, d * 0.02, 0])
    line([w / 2 - 0.6, -d / 2 + 0.6, 0], [w * 0.13, d * 0.02, 0])
  } else {
    const lw = w * 0.4
    const ld = d * 0.26
    k.flat([[-lw / 2, -ld / 2 - 2, z], [lw / 2, -ld / 2 - 2, z], [lw / 2, ld / 2 - 2, z], [-lw / 2, ld / 2 - 2, z]], up, shade(col, 0.9), SURF.paper)
    const s = 5
    const sx = w / 2 - s / 2 - 2.4
    const sy = d / 2 - s * 0.6 - 2.4
    k.flat([[sx - s / 2, sy - s * 0.6, z], [sx + s / 2, sy - s * 0.6, z], [sx + s / 2, sy + s * 0.6, z], [sx - s / 2, sy + s * 0.6, z]], up, r.pick(C.stamp), SURF.satin)
  }
}

function heap(k: Kit, r: Random, count: number, hx: number, hy: number, z0: number, z1: number, wild: number, dim = 1): void {
  for (let i = 0; i < count; i++) {
    const w = r.range(44, 52)
    const d = r.range(29, 34)
    const col = shade(mix(C.white, C.shadeWhite, r.next()), dim * (0.9 + 0.1 * (i / Math.max(1, count - 1))))
    const a = (i / count) * Math.PI * 2 + r.range(-0.5, 0.5)
    const out = Math.sqrt(r.range(0.05, 1))
    const rot = r.pick([0, Math.PI, Math.PI / 2]) + r.range(-0.3, 0.3)
    k.at(Math.cos(a) * out * hx, Math.sin(a) * out * hy, z0 + ((z1 - z0) * i) / Math.max(1, count - 1), rot, r.range(-wild, wild), r.range(-wild, wild))
    envelope(k, w, d, col, r, r.next() < 0.82)
    const sx = Math.cos(rot) * SHADE.x + Math.sin(rot) * SHADE.y
    const sy = -Math.sin(rot) * SHADE.x + Math.cos(rot) * SHADE.y
    const lift = k.lift
    k.lift = SHADE.lift
    k.flat([[sx - w / 2, sy - d / 2, -0.7], [sx + w / 2, sy - d / 2, -0.7], [sx + w / 2, sy + d / 2, -0.7], [sx - w / 2, sy + d / 2, -0.7]], [0, 0, 1], SHADE.col, SURF.matte)
    k.lift = lift
    k.back()
  }
}

interface Plan { x: number; y: number; w: number; d: number; h: number; side: number; trayW: number; trayX: number; bed: number; chuteY: number; chuteW: number }

// Where the tray and its chute stand in the box of the layout: the chute is on the side of the hold, beside it.
export function planOf(z: Zone): Plan {
  const b = boxOf(z, 'office.inbox')
  const hold = table.holds.find((h) => h.id === 'office.inbox')!
  const [hx, hy] = localBalls(z, hold.c[0], hold.c[1])
  const side = hx < b.x ? -1 : 1
  const trayW = b.w - CHUTE.deep
  const chuteW = Math.min(CHUTE.wide, b.d - 6)
  const chuteY = Math.max(-b.d / 2 + 3 + chuteW / 2, Math.min(b.d / 2 - 3 - chuteW / 2, hy - b.y))
  return { ...b, side, trayW, trayX: (side * CHUTE.deep) / -2, bed: b.h * TRAY.bed, chuteY, chuteW }
}

function shell(k: Kit, p: Plan): void {
  const { points, out } = rounded(p.trayW, p.d, TRAY.round, 5)
  const T = TRAY.wall
  const L = TRAY.lip
  const H = p.h
  const F = H * TRAY.foot
  const S = TRAY.step
  const prof: [number, number][] = [[0.8, 0], [0, 1.2], [0, F], [S, F + S], [S, H - L], [S + L * 0.3, H - L * 0.3], [S + L, H], [T - L, H], [T - L * 0.3, H - L * 0.3], [T, H - L], [T, p.bed + (H - L - p.bed) * 0.5], [T - 1.5, p.bed]]
  const cols: RGB[] = [C.creamLow, shade(C.cream, 0.94), C.cream, C.cream, C.cream, C.cream, mix(C.cream, [1, 1, 1], 0.08), C.cream, C.creamIn, C.creamIn, shade(C.creamIn, 0.74)]
  k.at(p.trayX, 0, 0)
  k.ring(points, out, prof, cols, MOULD)
  const yf = -p.d / 2 + S
  const zc = H * CARD.z
  k.box(0, yf - 0.7, zc, CARD.w, 1.4, CARD.h, C.steel, SURF.brushed, 0.5)
  const lift = k.lift
  k.lift = LIFT.paper
  k.flat([[-CARD.w / 2 + 3, yf - 1.45, zc + 3], [CARD.w / 2 - 3, yf - 1.45, zc + 3], [CARD.w / 2 - 3, yf - 1.45, zc + CARD.h - 3], [-CARD.w / 2 + 3, yf - 1.45, zc + CARD.h - 3]], [0, -1, 0], C.shadeWhite, SURF.paper)
  k.lift = lift
  const inner = points.map((q, i) => [q[0] - out[i]![0] * T, q[1] - out[i]![1] * T] as [number, number])
  const tris = THREE.ShapeUtils.triangulateShape(inner.map((q) => new THREE.Vector2(q[0], q[1])), [])
  for (const t of tris) k.tri([inner[t[0]!]![0], inner[t[0]!]![1], p.bed], [inner[t[1]!]![0], inner[t[1]!]![1], p.bed], [inner[t[2]!]![0], inner[t[2]!]![1], p.bed], [0, 0, 1], [0, 0, 1], [0, 0, 1], shade(C.creamIn, 0.6), MOULD)
  k.back()
}

function chute(k: Kit, p: Plan): void {
  const Hc = Math.min(p.h - CHUTE.drop, CHUTE.tall)
  const D = CHUTE.deep
  const len = Math.hypot(D, Hc)
  const tilt = -Math.atan2(Hc, D)
  const y0 = p.chuteY - p.chuteW / 2
  const y1 = p.chuteY + p.chuteW / 2
  const v0 = y0 + CHUTE.side
  const v1 = y1 - CHUTE.side
  const s0 = 0.8
  const s1 = len * 0.84
  const xf = -p.w / 2 + 3.2
  const xb = xf + D
  if (p.side > 0) k.mirror()
  k.at(xf, 0, 0, 0, 0, tilt)
  const up: V3 = [0, 0, 1]
  const face = (a: [number, number], b: [number, number]): void => {
    k.flat([[a[0], a[1], 0], [b[0], a[1], 0], [b[0], b[1], 0], [a[0], b[1], 0]], up, C.cream, MOULD)
  }
  face([0, y0], [len, v0])
  face([0, v1], [len, y1])
  face([s1, v0], [len, v1])
  const bar = CHUTE.bar
  k.box(s1 / 2 + bar / 4, v0 - bar / 2 + 1, 0, s1 + bar / 2, bar, CHUTE.proud, C.cream, MOULD, 0.6)
  k.box(s1 / 2 + bar / 4, v1 + bar / 2 - 1, 0, s1 + bar / 2, bar, CHUTE.proud, C.cream, MOULD, 0.6)
  k.box(s1 + bar / 2 - 1, (v0 + v1) / 2, 0, bar, v1 - v0 + bar * 2 - 2, CHUTE.proud, C.cream, MOULD, 0.6)
  k.back()
  const at = (s: number): [number, number] => [xf + (D * s) / len, (Hc * s) / len]
  const [xa, za] = at(s0)
  const lift = k.lift
  k.lift = 0
  const [xt, zt] = at(s1)
  for (const [v, n] of [[v0, 1], [v1, -1]] as [number, number][]) {
    const nn: V3 = [0, n, 0]
    k.tri([xa, v, za], [xb, v, za], [xb, v, zt], nn, nn, nn, C.deep, SURF.matte)
    k.tri([xa, v, za], [xb, v, zt], [xt, v, zt], nn, nn, nn, C.dark, SURF.matte)
  }
  k.flat([[xt, v0, zt], [xb, v0, zt], [xb, v1, zt], [xt, v1, zt]], [0, 0, -1], C.dark, SURF.matte)
  k.flat([[xb, v0, za], [xb, v1, za], [xb, v1, zt], [xb, v0, zt]], [-1, 0, 0], C.deep, SURF.matte)
  k.quad([xa, v0, za + 0.4], [xa, v1, za + 0.4], [xb, v1, za + 0.4], [xb, v0, za + 0.4], up, up, up, up, C.dark, SURF.satin)
  k.lift = lift
  for (const [y, n] of [[y0, -1], [y1, 1]] as [number, number][]) {
    const nn: V3 = [0, n, 0]
    k.tri([xf, y, 0], [xb + 2, y, 0], [xb + 2, y, Hc], nn, nn, nn, shade(C.cream, 0.94), MOULD)
    k.tube([[xf + 0.4, y - n * 1.2, 1.6], [xb + 1, y - n * 1.2, Hc - 0.6]], 1.6, C.cream, MOULD, 5)
  }
  if (p.side > 0) k.back()
}

interface Built { a: THREE.Object3D; b: THREE.Object3D; x: number; z: number }
const built = new WeakMap<THREE.Object3D, Built>()

export function inboxScrews(z: Zone): [number, number, number][] {
  const p = planOf(z)
  const free = p.chuteY > 0 ? -1 : 1
  const x = p.x + p.side * (p.w / 2 - CHUTE.deep / 2)
  const y = p.y + free * (p.d / 2 - 9)
  return [[x - 9, y, 2.4], [x + 9, y, 2.4]]
}

export function buildInbox(z: Zone): THREE.Object3D {
  const p = planOf(z)
  const mats = matsOf(z)
  const root = new THREE.Group()
  root.name = 'office.inbox'
  const r = new Random(config.seed, 'office.inbox')
  const hx = p.trayW / 2 - TRAY.wall - 22
  const hy = p.d / 2 - TRAY.wall - 20

  const k = new Kit()
  k.lift = LIFT.mould
  k.at(p.x, p.y, 0)
  shell(k, p)
  chute(k, p)
  const free = p.chuteY > 0 ? -1 : 1
  k.box(p.side * (p.w / 2 - CHUTE.deep / 2), free * (p.d / 2 - 9), 0, CHUTE.deep - 6, 13, 2.4, shade(C.steel, 0.8), SURF.brushed, 0.8)
  k.lift = LIFT.paper
  k.at(p.trayX, 0, p.bed + 0.4)
  heap(k, r, 9, hx, hy, 0, p.h - p.bed - 12, 0.12, 0.8)
  heap(k, r, FILL_LAYER.count, hx + FILL_LAYER.out, hy + FILL_LAYER.out, p.h - p.bed - 20, p.h - p.bed - 11, 0.1, FILL_LAYER.dim)
  k.back()
  k.back()
  root.add(meshOf(k.done(), mats.solid, 'office.inbox.tray', { cast: true }))

  const top = p.h - 9
  const groups: THREE.Object3D[] = []
  for (const [name, count, z0, z1, wild, cast] of [['a', 7, 0, 10, 0.22, true], ['b', 6, 9, 19, 0.3, false]] as [string, number, number, number, number, boolean][]) {
    const g = new Kit()
    g.lift = LIFT.paper
    heap(g, r, count, hx + (name === 'b' ? -5 : 3), hy + (name === 'b' ? -5 : 3), z0, z1, wild)
    const mesh = meshOf(g.done(), mats.solid, `office.inbox.heap.${name}`, { cast })
    mesh.position.set(p.x + p.trayX, p.y, top)
    root.add(mesh)
    groups.push(mesh)
  }
  built.set(root, { a: groups[0]!, b: groups[1]!, x: p.x + p.trayX, z: top })
  return root
}

// How high a heap stands off its bed: one hop that dies in two small ones.
export function hopAt(since: number): number {
  if (since < 0 || since > 1.4) return 0
  return Math.abs(Math.sin((since * Math.PI) / 0.34)) * Math.exp(-4.2 * since) * smooth(0, 0.04, since)
}

// The envelopes jump when the ball goes in, shiver while the steel balls pour out, and jump again, lower, when the ball is sent on.
export function poseInbox(o: THREE.Object3D, _z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  if (!b) return
  const v = ctx.byId.get('model.office.inbox')?.v ?? [0, 9, 9]
  const held = (v[0] ?? 0) > 0.5
  const sinceIn = v[1] ?? 9
  const sinceOut = v[2] ?? 9
  let shake = 0
  if (held) {
    let pour = 0
    const hold = table.holds.find((h) => h.id === 'office.inbox')!
    for (let i = 1; i < 12; i++) {
      const s = ctx.byId.get(`ball.steel.${i}`)
      if (!s) continue
      const d = Math.hypot(s.x + s.w / 2 - hold.c[0] * BALL, s.y + s.h / 2 - hold.c[1] * BALL)
      pour = Math.max(pour, 1 - smooth(0.6 * BALL, 2.6 * BALL, d))
    }
    shake = smooth(0.3, 0.5, sinceIn) * pour
  }
  const wob = Math.sin(ctx.time * 61) + 0.7 * Math.sin(ctx.time * 97 + 1.3)
  const a = hopAt(sinceIn) + HOP.out * hopAt(sinceOut)
  const c = hopAt(sinceIn - HOP.lag) + HOP.out * hopAt(sinceOut - HOP.lag)
  b.a.position.z = b.z + HOP.a * a + 0.9 * shake * Math.abs(wob)
  b.b.position.z = b.z + HOP.b * c + 1.6 * shake * Math.abs(Math.sin(ctx.time * 73 + 0.4))
  b.a.rotation.set(0.05 * a, -0.04 * a, HOP.turn * 0.6 * a + 0.01 * shake * wob)
  b.b.rotation.set(-0.07 * c, 0.05 * c, -HOP.turn * c - 0.014 * shake * wob)
  b.a.scale.setScalar(1 + HOP.swell * 0.7 * a)
  b.b.scale.setScalar(1 + HOP.swell * c)
  b.a.position.x = b.x - HOP.slide * 0.6 * a
  b.b.position.x = b.x + HOP.slide * c
}
