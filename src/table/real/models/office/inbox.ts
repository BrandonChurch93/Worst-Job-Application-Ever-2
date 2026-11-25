import * as THREE from 'three'
import { config } from '../../../../config'
import { Random } from '../../../../core/random'
import type { RealContext } from '../../../../real/types'
import { BALL, table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { hex, Kit, matsOf, meshOf, mix, rrect, shade, smooth, SURF, type RGB, type V3 } from './kit'

const C = {
  housing: hex(0xcbbf9f),
  housingDark: hex(0xa89c7e),
  pad: hex(0x2b2b2c),
  wire: hex(0x9aa3ad),
  white: hex(0xeeeae0),
  manila: hex(0xd3b073),
  kraft: hex(0xb99560),
  window: hex(0x5f6a6b),
  stamp: [hex(0xa33a36), hex(0x3d6a8f), hex(0x4f7c4e)] as RGB[],
  band: hex(0xa2452f),
  label: hex(0xe9e5da)
}

const LOOSE_Z = 35
const TRAY = { inset: 15, w: 124, d: 96, h: 27, rest: 33, tip: 0.36 }

export function boxOf(z: Zone, id: string): { x: number; y: number; w: number; d: number; h: number } {
  const m = table.models.find((q) => q.id === id)
  if (!m) throw new Error(`No model "${id}" in the layout`)
  const [x, y] = localBalls(z, m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2)
  return { x, y, w: m.box[2] * BALL, d: m.box[3] * BALL, h: m.h * BALL }
}

function envelope(k: Kit, w: number, d: number, col: RGB, r: Random, face: number): void {
  const t = 1.3
  k.box(0, 0, 0, w, d, t, col, SURF.paper, 0.35)
  const z = t + 0.06
  const up: V3 = [0, 0, 1]
  const fold = shade(col, 0.86)
  if (face === 0) {
    const tip = -d * 0.08
    k.flat([[-w / 2 + 0.6, d / 2 - 0.6, z], [w / 2 - 0.6, d / 2 - 0.6, z], [0, tip, z]], up, shade(col, 0.95), SURF.paper)
    const lw = 0.5
    const line = (a: V3, b: V3): void => {
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const l = Math.hypot(dx, dy)
      const nx = (-dy / l) * lw
      const ny = (dx / l) * lw
      k.flat([[a[0] - nx, a[1] - ny, z + 0.05], [b[0] - nx, b[1] - ny, z + 0.05], [b[0] + nx, b[1] + ny, z + 0.05], [a[0] + nx, a[1] + ny, z + 0.05]], up, fold, SURF.paper)
    }
    line([-w / 2 + 0.6, d / 2 - 0.6, 0], [0, tip, 0])
    line([w / 2 - 0.6, d / 2 - 0.6, 0], [0, tip, 0])
    line([-w / 2 + 0.6, -d / 2 + 0.6, 0], [-w * 0.12, d * 0.04, 0])
    line([w / 2 - 0.6, -d / 2 + 0.6, 0], [w * 0.12, d * 0.04, 0])
  } else {
    if (face === 1) {
      const ww = w * 0.38
      const wd = d * 0.26
      const cx = -w * 0.16
      const cy = -d * 0.12
      k.flat([[cx - ww / 2, cy - wd / 2, z], [cx + ww / 2, cy - wd / 2, z], [cx + ww / 2, cy + wd / 2, z], [cx - ww / 2, cy + wd / 2, z]], up, C.window, SURF.gloss)
    } else {
      const lw = w * 0.4
      const ld = d * 0.3
      k.flat([[-lw / 2, -ld / 2 - 2, z], [lw / 2, -ld / 2 - 2, z], [lw / 2, ld / 2 - 2, z], [-lw / 2, ld / 2 - 2, z]], up, C.label, SURF.paper)
    }
    const s = 5.2
    const sx = w / 2 - s / 2 - 2.4
    const sy = d / 2 - s * 0.6 - 2.4
    k.flat([[sx - s / 2, sy - s * 0.6, z], [sx + s / 2, sy - s * 0.6, z], [sx + s / 2, sy + s * 0.6, z], [sx - s / 2, sy + s * 0.6, z]], up, r.pick(C.stamp), SURF.satin)
  }
}

function heap(k: Kit, r: Random, count: number, x0: number, x1: number, y0: number, y1: number, zBase: number, zStep: number, wild: number): void {
  for (let i = 0; i < count; i++) {
    const manila = r.next() < 0.36
    const w = manila ? r.range(46, 54) : r.range(38, 46)
    const d = manila ? r.range(30, 35) : r.range(25, 30)
    const base = manila ? (r.next() < 0.4 ? C.kraft : C.manila) : C.white
    const col = mix(base, shade(base, 0.9), r.next())
    const x = r.range(x0, x1)
    const y = r.range(y0, y1)
    const face = r.next() < 0.55 ? 0 : r.next() < 0.5 ? 1 : 2
    k.at(x, y, zBase + i * zStep, r.range(0, Math.PI * 2), r.range(-wild, wild), r.range(-wild, wild))
    envelope(k, w, d, col, r, face)
    k.back()
  }
}

function tray(k: Kit): void {
  const { w, d, h } = TRAY
  const wire = C.wire
  const cx = w / 2
  const loop = (ww: number, dd: number, zz: number): V3[] => rrect(ww, dd, 7, 3).map((q) => [cx + q[0], q[1], zz] as V3)
  k.tube(loop(w, d, h), 2.1, wire, SURF.chrome, 6, true)
  k.tube(loop(w - 5, d - 5, h * 0.5), 1.1, wire, SURF.chrome, 4, true)
  k.tube(loop(w - 10, d - 10, 1.4), 1.5, wire, SURF.chrome, 5, true)
  const top = loop(w, d, h)
  const bot = loop(w - 10, d - 10, 1.4)
  const sides = 4
  for (let i = 0; i < top.length; i++) {
    const a = top[i]!
    const b = top[(i + 1) % top.length]!
    const c = bot[i]!
    const e = bot[(i + 1) % bot.length]!
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.max(1, Math.round(len / 7.5))
    for (let j = 0; j < n; j++) {
      const t = j / n
      k.tube([[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, h], [c[0] + (e[0] - c[0]) * t, c[1] + (e[1] - c[1]) * t, 1.4]], 0.75, wire, SURF.chrome, sides)
    }
  }
  for (let x = 10; x < w - 6; x += 7.5) k.tube([[x, -d / 2 + 6, 1.2], [x, d / 2 - 6, 1.2]], 0.75, wire, SURF.chrome, sides)
  for (let y = -d / 2 + 10; y < d / 2 - 6; y += 7.5) k.tube([[6, y, 1.9], [w - 6, y, 1.9]], 0.75, wire, SURF.chrome, sides)
  for (const y of [-d / 2 + 16, d / 2 - 16]) {
    k.at(0, y, 0, 0, Math.PI / 2)
    k.cyl(0, 0, -9, 3.1, 18, shade(wire, 0.9), SURF.steel, 10, 0.5)
    k.back()
    k.box(5, y, -2.4, 12, 9, 2.4, shade(wire, 0.85), SURF.steel, 0.4)
  }
}

interface Built { tray: THREE.Object3D; loose: THREE.Object3D }
const built = new WeakMap<THREE.Object3D, Built>()

export function inboxScrews(z: Zone): [number, number, number][] {
  const b = boxOf(z, 'office.inbox')
  const out: [number, number, number][] = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push([b.x + sx * (b.w / 2 - 9), b.y + sy * (b.d / 2 - 9), 4])
  return out
}

export function buildInbox(z: Zone): THREE.Object3D {
  const b = boxOf(z, 'office.inbox')
  const mats = matsOf(z)
  const root = new THREE.Group()
  root.name = 'office.inbox'
  const r = new Random(config.seed, 'office.inbox')

  const k = new Kit()
  k.at(b.x, b.y, 0)
  k.poly(rrect(b.w - 2, b.d - 2, 10, 4), 0, 4, C.housingDark, SURF.plastic, 1)
  k.at(0, 0, 4)
  k.poly(rrect(b.w - 10, b.d - 10, 8, 4), 0, 24, C.housing, SURF.plastic, 2.2)
  k.back()
  const hx = -b.w / 2 + TRAY.inset
  for (const y of [-TRAY.d / 2 + 16, TRAY.d / 2 - 16]) {
    k.box(hx, y - 11.5, 28, 9, 4, 8.5, C.housingDark, SURF.plastic, 0.8)
    k.box(hx, y + 11.5, 28, 9, 4, 8.5, C.housingDark, SURF.plastic, 0.8)
  }
  for (const y of [-30, 30]) k.cyl(hx + TRAY.w - 14, y, 28, 4.2, 4.6, C.pad, SURF.rubber, 12, 1)
  k.box(hx + TRAY.w * 0.5, -b.d / 2 + 5.2, 9, 46, 1.2, 12, shade(C.housing, 0.8), SURF.plastic, 0.4)
  k.back()
  root.add(meshOf(k.done(), mats.solid, 'office.inbox.stand', { cast: true }))

  const t = new Kit()
  tray(t)
  heap(t, r, 9, 26, TRAY.w - 28, -22, 22, 3, 1.7, 0.05)
  heap(t, r, 8, 30, TRAY.w - 26, -24, 24, 19, 1.9, 0.2)
  const trayMesh = meshOf(t.done(), mats.solid, 'office.inbox.tray', { cast: true })
  trayMesh.position.set(b.x + hx, b.y, TRAY.rest)
  root.add(trayMesh)

  const l = new Kit()
  heap(l, r, 5, 34, TRAY.w - 34, -26, 26, 0, 2.1, 0.28)
  const bx = TRAY.w * 0.62
  const by = 10
  l.at(bx, by, 11.5, 0.5, 0.06, -0.05)
  for (let i = 0; i < 5; i++) {
    l.at(r.range(-1.2, 1.2), r.range(-1, 1), i * 1.5, r.range(-0.05, 0.05))
    envelope(l, 44, 28, i % 2 ? C.white : shade(C.white, 0.94), r, i === 4 ? 2 : 0)
    l.back()
  }
  l.box(-6, 0, -0.4, 1.8, 29.6, 8.6, C.band, SURF.rubber, 0.5)
  l.back()
  const loose = meshOf(l.done(), mats.solid, 'office.inbox.loose', { cast: false })
  loose.position.set(0, 0, LOOSE_Z)
  trayMesh.add(loose)

  built.set(root, { tray: trayMesh, loose })
  return root
}

// The tray tips toward its scoop when the ball goes in, shivers while the steel balls pour, and swings back with two small swings when the ball is sent on.
export function poseInbox(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  if (!b) return
  const v = ctx.byId.get('model.office.inbox')?.v ?? [0, 9, 9]
  const held = (v[0] ?? 0) > 0.5
  const sinceIn = v[1] ?? 9
  const sinceOut = v[2] ?? 9
  let tip = 0
  let slide = 0
  if (held) {
    const u = Math.min(1, sinceIn / 0.32)
    const over = 1 + 2.2 * (u - 1) * (u - 1) * (u - 1) + 1.2 * (u - 1) * (u - 1)
    tip = TRAY.tip * over
    slide = smooth(0.1, 0.55, sinceIn)
    let pour = 0
    const hold = table.holds.find((h) => h.id === 'office.inbox')!
    for (let i = 1; i < 12; i++) {
      const s = ctx.byId.get(`ball.steel.${i}`)
      if (!s) continue
      const d = Math.hypot(s.x + s.w / 2 - hold.c[0] * BALL, s.y + s.h / 2 - hold.c[1] * BALL)
      pour = Math.max(pour, 1 - smooth(0.6 * BALL, 2.6 * BALL, d))
    }
    const shake = smooth(0.3, 0.5, sinceIn) * (0.25 + 0.75 * pour)
    tip += shake * (0.016 * Math.sin(ctx.time * 61) + 0.011 * Math.sin(ctx.time * 97 + 1.3))
  } else if (sinceOut < 3) {
    const e = Math.exp(-3.4 * sinceOut)
    tip = TRAY.tip * e * Math.cos(sinceOut * 11.5)
    slide = 1 - smooth(0.05, 0.7, sinceOut)
  }
  b.tray.rotation.y = -tip
  b.loose.position.x = -11 * slide
  b.loose.position.z = LOOSE_Z - 2.5 * slide
}
