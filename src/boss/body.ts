import { config } from '../config'
import { block } from '../shell/metrics'
import { progressCentre, TYPE } from '../shell/parts'
import { words } from '../shell/words'
import type { DrawList, Shape, Tone, TypeSpec } from '../stage/types'
import { COLLAPSE_SECONDS, FALLEN, HOME, SOCKET, UNFOLD } from './plan'

const heights = config.scale.heights
const sizes = config.scale.sizes

export const CAP_W = 288
export const CAP_H = sizes.button
export const FOOT_OFF: [number, number][] = [[-236, -192], [236, -192], [-236, 192], [236, 192]]
export const HIP_OFF: [number, number][] = [[-168, -50], [168, -50], [-168, 50], [168, 50]]
export const CANNON_OFF: [number, number][] = [[-10, -94], [-10, 94]]
const SHIELD_OFF: [number, number] = [-252, 0]
const SIDE_OFF: [number, number][] = [[0, -100], [0, 100]]
export const CANNON_FROM = [1, 2] as const
export const BODY_Z = { side: 28, sideTop: 36, frame: 36, cap: 52, capTall: heights.button - heights.buttonSocket, hip: 46, cannonTall: 13, housing: 20 }
export const LEG = { link: 84, wide: 21, foot: 42, knee: 32 }
export const FRAME = { w: 372, h: 136, cut: 26, bedW: 300, bedH: 84, tall: 10 }
export const SIDE = { w: 224, h: 76, lean: 30, tall: 8 }
export const SHIELD = { w: 108, h: 236, tall: 12 }

export interface Spot { x: number; y: number; rot: number; k: number; z: number; flat?: number; turn?: number; recoil?: number }
export interface Leg { hx: number; hy: number; fx: number; fy: number; k: number; z: number; flat?: number }
export interface Rig { cap: { x: number; y: number; rot: number; lift: number; down: number }; plate: Spot; sides: Spot[]; legs: Leg[]; cannons: Spot[]; shield: Spot; hurt: number; flash?: number; split?: number }
export interface More { aim?: { x: number; y: number }; flash?: number; hurt?: number }

export const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}
export const prog = (t: number, a: number, b: number): number => smooth((t - a) / (b - a))
const mix = (a: number, b: number, t: number): number => a + (b - a) * t

export function label(id: string, part: string, key: string, cx: number, cy: number, type: TypeSpec, z: number, tone: Tone, rot = 0): Shape {
  const b = block(type.font, words(key), type.px)
  const s: Shape = { id, part, kind: 'text', x: cx - b.width / 2, y: cy - b.cap / 2, w: b.width, h: b.cap, z0: z, z1: z, tone, words: key, type: { ...type, align: 'centre' } }
  if (rot) s.rot = rot
  return s
}

export function fightRig(x: number, y: number, feet: { x: number; y: number; z: number }[] | null, recoil: [number, number] = [0, 0], bob = 0, more: More = {}): Rig {
  const flash = more.flash ?? 0
  return {
    cap: { x, y, rot: 0, lift: 1, down: 0 },
    plate: { x, y, rot: 0, k: 1, z: bob },
    sides: SIDE_OFF.map(([ox, oy]) => ({ x: x + ox, y: y + oy, rot: 0, k: 1, z: bob })),
    legs: HIP_OFF.map(([hx, hy], i) => ({ hx: x + hx, hy: y + hy, fx: feet ? feet[i]!.x : x + FOOT_OFF[i]![0], fy: feet ? feet[i]!.y : y + FOOT_OFF[i]![1], k: 1, z: feet ? feet[i]!.z : 0 })),
    cannons: CANNON_OFF.map(([ox, oy], i) => {
      const cx = x + ox
      const cy = y + oy
      const aim = more.aim ? Math.max(-0.5, Math.min(0.5, Math.atan2(cy - more.aim.y, cx - more.aim.x))) : 0
      return { x: cx, y: cy, rot: aim, k: 1, z: bob, recoil: recoil[i]! }
    }),
    shield: { x: x + SHIELD_OFF[0], y: y + SHIELD_OFF[1], rot: 0, k: 1, z: bob },
    hurt: more.hurt ?? 0,
    flash
  }
}

export function restRig(x: number = SOCKET.x, y: number = SOCKET.y): Rig {
  const rig = fightRig(x, y, null)
  rig.cap.lift = 0
  rig.plate.k = 0
  for (const s of rig.sides) s.k = 0
  for (const l of rig.legs) l.k = 0
  for (const c of rig.cannons) c.k = 0
  rig.shield.k = 0
  return rig
}

export function bossPlaceAt(u: number): { x: number; y: number } {
  const e = prog(u, UNFOLD.lift, 2.3)
  return { x: mix(SOCKET.x, HOME.x, e), y: mix(SOCKET.y, HOME.y, e) - Math.sin(Math.PI * e) * 40 }
}

export function unfoldRig(u: number): Rig {
  const at = bossPlaceAt(u)
  const rig = fightRig(at.x, at.y, null)
  const fly = Math.sin(Math.PI * prog(u, UNFOLD.lift, 2.3)) * 46
  const shake = u < UNFOLD.crack ? Math.min(1, u / 0.5) : Math.max(0, 1 - (u - UNFOLD.crack) / 0.5)
  rig.cap.x += Math.sin(u * 61) * 3.5 * shake
  rig.cap.y += Math.sin(u * 47 + 1) * 1.5 * shake
  rig.cap.rot = Math.sin(u * 53) * 0.035 * shake + Math.sin(Math.PI * prog(u, UNFOLD.crack, UNFOLD.open + 0.4)) * -0.16
  rig.cap.lift = prog(u, UNFOLD.crack, UNFOLD.open)
  rig.plate.k = prog(u, UNFOLD.plates[0], UNFOLD.plates[0] + 0.5)
  rig.plate.z = fly
  rig.sides.forEach((s, i) => {
    const e = prog(u, UNFOLD.plates[0] + 0.25 + i * 0.12, UNFOLD.plates[1] + 0.25 + i * 0.12)
    const sign = i === 0 ? -1 : 1
    s.x = mix(SOCKET.x, s.x, e)
    s.y = mix(SOCKET.y + sign * 26, s.y, e)
    s.z = mix(-96, fly, e) + Math.sin(Math.PI * e) * 110
    s.turn = sign * (1 - prog(e, 0.15, 0.8)) * (Math.PI / 2)
    s.k = e
  })
  rig.legs.forEach((l, i) => {
    l.k = prog(u, UNFOLD.plates[0] + 0.5 + i * 0.1, UNFOLD.legs[1] - 0.3 + i * 0.1)
    l.z = fly
  })
  rig.cannons.forEach((c, i) => {
    const e = prog(u, UNFOLD.cannons[0] + i * 0.18, UNFOLD.cannons[1] - 0.18 + i * 0.18)
    const from = progressCentre(CANNON_FROM[i]!)
    const fl = prog(e, 0, 0.72)
    c.x = mix(from.x, c.x, fl)
    c.y = mix(from.y, c.y, fl) - Math.sin(Math.PI * fl) * 60
    c.k = e
    c.z = Math.sin(Math.PI * fl) * 90
    c.rot = (1 - fl) * 2.4
  })
  const sh = prog(u, UNFOLD.shield[0], UNFOLD.shield[1])
  rig.shield.x = mix(at.x - 78, rig.shield.x, prog(sh, 0, 0.6))
  rig.shield.k = sh
  return rig
}

const SCATTER = {
  plate: { x: 1296, y: 446, rot: 0.22 },
  sides: [{ x: 600, y: 850, rot: -0.32 }, { x: 1262, y: 862, rot: 0.2 }],
  legs: [{ x: 1064, y: 452, rot: 0.5 }, { x: 1622, y: 440, rot: -0.45 }, { x: 330, y: 930, rot: -0.3 }, { x: 1584, y: 800, rot: 0.9 }],
  cannons: [{ x: 1492, y: 408, rot: 2.9 }, { x: 870, y: 762, rot: 0.35 }],
  shield: { x: 1500, y: 978, rot: 1.48 }
}

export function collapseRig(from: Rig, c: number): Rig {
  const t = Math.min(1, Math.max(0, (c - 0.35) / 0.95))
  const e = 1 - Math.pow(1 - t, 3)
  const hop = Math.sin(Math.PI * t)
  const fold = prog(c, 0, 0.35)
  const sag = fold * (1 - e) * 20
  const spot = (s: Spot, to: { x: number; y: number; rot: number }, turns = 0): Spot => ({ ...s, x: mix(s.x, to.x, e), y: mix(s.y, to.y, e) - hop * 50, rot: mix(s.rot, to.rot + turns, e), k: s.k, z: mix(s.z - sag, 0, e) + hop * 70, flat: e, recoil: 0 })
  const capE = prog(c, 0.3, 1.35)
  const bounce = c > 1.35 ? Math.max(0, Math.sin((c - 1.35) * 14)) * Math.exp(-(c - 1.35) * 6) * 14 : 0
  return {
    cap: { x: mix(from.cap.x, FALLEN.x, capE), y: mix(from.cap.y, FALLEN.y, capE) - Math.sin(Math.PI * capE) * 30 - bounce, rot: mix(from.cap.rot, FALLEN.rot, capE) + Math.sin(c * 40) * 0.03 * (1 - capE), lift: 1 - capE, down: capE },
    plate: spot(from.plate, SCATTER.plate),
    sides: from.sides.map((s, i) => spot(s, SCATTER.sides[i]!)),
    legs: from.legs.map((l, i) => {
      const to = SCATTER.legs[i]!
      const half = 62
      const cx = mix((l.hx + l.fx) / 2, to.x, e)
      const cy = mix((l.hy + l.fy) / 2, to.y, e) - hop * 40
      const a = mix(Math.atan2(l.fy - l.hy, l.fx - l.hx), to.rot, e)
      const len = mix(Math.hypot(l.fx - l.hx, l.fy - l.hy) / 2, half, e) * (1 - 0.18 * fold * (1 - e))
      return { hx: cx - Math.cos(a) * len, hy: cy - Math.sin(a) * len, fx: cx + Math.cos(a) * len, fy: cy + Math.sin(a) * len, k: 1, z: hop * 50, flat: e }
    }),
    cannons: from.cannons.map((s, i) => spot(s, SCATTER.cannons[i]!)),
    shield: spot(from.shield, SCATTER.shield),
    hurt: mix(from.hurt, 1, prog(c, 0, 0.5)),
    flash: 0,
    split: e
  }
}

export const collapseDone = (c: number): boolean => c >= COLLAPSE_SECONDS

export function drawRig(out: DrawList, rig: Rig, id = 'boss', pressed = 0): void {
  const body = 'boss-body'
  const cap = rig.cap
  rig.legs.forEach((l, i) => {
    if (l.k <= 0.01) return
    const flat = l.flat ?? 0
    out.push({ id: `${id}-leg-${i}`, part: body, kind: 'box', role: 'bossLeg', x: l.hx - 8, y: l.hy - 8, w: 16, h: 16, z0: 0, z1: BODY_Z.hip, tone: 'raised', v: [l.fx - l.hx, l.fy - l.hy, l.z, l.k, i % 2 === 0 ? -1 : 1, flat, i < 2 ? -1 : 1] })
  })
  rig.sides.forEach((s, i) => {
    if (s.k <= 0.01) return
    const flat = s.flat ?? 0
    const z0 = mix(BODY_Z.side, 0, flat) + s.z
    const side: Shape = { id: `${id}-side-${i}`, part: body, kind: 'box', role: 'bossSide', x: s.x - SIDE.w / 2, y: s.y - SIDE.h / 2, w: SIDE.w, h: SIDE.h, z0, z1: z0 + SIDE.tall, tone: 'metal', rot: s.rot, r: 8, v: [s.k, flat, i] }
    if (s.turn) side.turnX = s.turn
    out.push(side)
  })
  if (rig.plate.k > 0.01) {
    const p = rig.plate
    const flat = p.flat ?? 0
    const z0 = mix(BODY_Z.frame, 0, flat) + p.z
    out.push({ id: `${id}-plate`, part: body, kind: 'box', role: 'bossFrame', x: p.x - FRAME.w / 2, y: p.y - FRAME.h / 2, w: FRAME.w, h: FRAME.h, z0, z1: z0 + FRAME.tall, tone: 'metal', rot: p.rot, r: 22, v: [p.k, flat, rig.split ?? 0] })
  }
  if (rig.shield.k > 0.01) {
    const s = rig.shield
    const flat = s.flat ?? 0
    const z0 = mix(BODY_Z.side, 0, flat) + s.z
    out.push({ id: `${id}-shield`, part: body, kind: 'box', role: 'bossShield', x: s.x - SHIELD.w / 2, y: s.y - SHIELD.h / 2, w: SHIELD.w, h: SHIELD.h, z0, z1: z0 + SHIELD.tall, tone: 'glass', rot: s.rot, r: 12, v: [s.k, flat, rig.flash ?? 0, rig.plate.x - FRAME.w / 2 + 12 - s.x, rig.plate.y - s.y, rig.hurt] })
  }
  rig.cannons.forEach((c, i) => {
    if (c.k <= 0.01) return
    const flat = c.flat ?? 0
    const up = prog(c.k, 0.55, 0.8)
    const z0 = mix(mix(heights.progressRail, BODY_Z.sideTop, prog(c.k, 0.6, 1)), 0, flat) + c.z
    const z1 = z0 + BODY_Z.cannonTall + BODY_Z.housing * up
    const d = sizes.progressButton
    out.push({ id: `${id}-cannon-${i}`, part: body, kind: 'disc', role: 'bossCannon', x: c.x - d / 2, y: c.y - d / 2, w: d, h: d, z0, z1, tone: 'metal', rot: c.rot, v: [c.k, c.recoil ?? 0, flat] })
    out.push(label(`${id}-cannon-${i}-numeral`, body, `data:numerals.${CANNON_FROM[i]!}`, c.x, c.y, TYPE.numeral, z1, 'ink', c.rot))
  })
  const z0 = (cap.down > 0 ? mix(BODY_Z.cap, 0, cap.down) : mix(heights.buttonSocket, BODY_Z.cap, cap.lift)) + (cap.lift > 0 && cap.down <= 0 ? rig.plate.z : 0) - pressed * 0.4
  const z1 = z0 + BODY_Z.capTall
  const tilt = cap.down > 0 ? 0 : Math.sin(Math.PI * Math.min(1, cap.lift)) * 0.2
  const top: Shape = { id: `${id}-cap`, part: body, kind: 'capsule', role: 'bossCap', x: cap.x - CAP_W / 2, y: cap.y - CAP_H / 2, w: CAP_W, h: CAP_H, z0, z1, tone: 'accent', rot: cap.rot, v: [rig.hurt, pressed, tilt] }
  const word = label(`${id}-cap-word`, body, 'copy:step4.submit', cap.x, cap.y, TYPE.button, z1, 'inkLight', cap.rot)
  if (tilt > 0.001) {
    top.turnX = tilt
    word.turnX = tilt
  }
  out.push(top, word)
  if (rig.hurt > 0.01) {
    const soot: Shape = { id: `${id}-scorch`, part: 'boss-transform', kind: 'capsule', role: 'bossScorch', x: cap.x - CAP_W / 2, y: cap.y - CAP_H / 2, w: CAP_W, h: CAP_H, z0, z1: z1 + 0.3, tone: 'dark', rot: cap.rot, v: [Math.min(1, rig.hurt), tilt] }
    if (tilt > 0.001) soot.turnX = tilt
    out.push(soot)
  }
}

const HOLE = { lip: -5, floor: -150, inset: 6, strip: 3 }
const CRACKS: { at: [number, number]; a: number; run: [number, number][]; fork?: [number, number, number] }[] = [
  { at: [-146, -15], a: 3.52, run: [[22, 0], [17, 0.5], [12, -0.75]], fork: [0, -0.8, 13] },
  { at: [-131, 34], a: 2.3, run: [[13, 0], [9, 0.55]] },
  { at: [-64, -41], a: -1.85, run: [[18, 0], [24, 0.42], [13, -0.6]], fork: [1, -0.9, 15] },
  { at: [22, -41], a: -1.4, run: [[11, 0], [7, -0.5]] },
  { at: [118, -40], a: -0.86, run: [[20, 0], [15, -0.45], [19, 0.6]], fork: [1, 0.85, 11] },
  { at: [147, 12], a: 0.3, run: [[14, 0], [10, 0.6]] },
  { at: [70, 41], a: 1.2, run: [[16, 0], [21, -0.5], [9, 0.7]] },
  { at: [-36, 41], a: 1.78, run: [[10, 0], [6, 0.6]] }
]

function hole(out: DrawList, id: string, cx: number, cy: number, w: number, h: number, z: number, tone: Tone): void {
  const r = h / 2
  const half = w / 2 - r
  const well = (n: string, x: number, y: number, ww: number, hh: number): void => {
    out.push({ id: `${id}-${n}`, part: 'boss-transform', kind: 'well', x, y, w: ww, h: hh, z0: z, z1: 0, tone })
  }
  well('mid', cx - half, cy - r, half * 2, h)
  let k = 0
  for (let d = 0; d < r - 0.01; d += HOLE.strip) {
    const d1 = Math.min(r, d + HOLE.strip)
    const reach = Math.sqrt(Math.max(0, r * r - ((d + d1) / 2) ** 2))
    well(`w${k}`, cx - half - d1, cy - reach, d1 - d, reach * 2)
    well(`e${k}`, cx + half + d, cy - reach, d1 - d, reach * 2)
    k++
  }
}

export function drawSocket(out: DrawList, x: number, y: number, cracked: number, id = 'socket'): void {
  const gap = 5
  const w = CAP_W + gap * 2
  const h = CAP_H + gap * 2
  if (cracked <= 0) {
    out.push({ id, part: 'shell', kind: 'capsule', x: x - w / 2, y: y - h / 2, w, h, z0: heights.buttonSocket, z1: 0, tone: 'dark', pocket: true })
    return
  }
  drawRim(out, x, y, cracked, id)
  hole(out, `${id}-lip`, x, y, w, h, HOLE.lip, 'pocket')
  hole(out, `${id}-wall`, x, y, w - HOLE.inset * 2, h - HOLE.inset * 2, HOLE.lip - 1, 'ink')
  hole(out, `${id}-pit`, x, y, w - HOLE.inset * 2 - 3, h - HOLE.inset * 2 - 3, HOLE.floor, 'ink')
  const grow = Math.min(1, cracked)
  CRACKS.forEach((c, i) => {
    let px = x + c.at[0]
    let py = y + c.at[1]
    let a = c.a
    const piece = (n: string, fx: number, fy: number, dir: number, len: number, thick: number): void => {
      if (len < 1) return
      out.push({ id: `${id}-crack-${i}-${n}`, part: 'boss-transform', kind: 'box', x: fx + Math.cos(dir) * len * 0.5 - len / 2, y: fy + Math.sin(dir) * len * 0.5 - thick / 2, w: len, h: thick, z0: 0, z1: 0.4, tone: 'dark', rot: dir })
    }
    c.run.forEach(([len, turn], j) => {
      a += turn
      const l = len * grow
      piece(`${j}`, px, py, a, l + 1, j === 0 ? 2.4 : 1.6)
      px += Math.cos(a) * l
      py += Math.sin(a) * l
      if (c.fork && c.fork[0] === j) piece('fork', px, py, a + c.fork[1], c.fork[2] * grow, 1.4)
    })
  })
}

export const HOLE_W = CAP_W + 10
export const HOLE_H = CAP_H + 10

export function crackRuns(): { x0: number; y0: number; x1: number; y1: number; wide: number; at: number }[] {
  const runs: { x0: number; y0: number; x1: number; y1: number; wide: number; at: number }[] = []
  CRACKS.forEach((c) => {
    let px = c.at[0]
    let py = c.at[1]
    let a = c.a
    const total = c.run.reduce((n, r) => n + r[0], 0)
    let gone = 0
    c.run.forEach(([len, turn], j) => {
      a += turn
      const nx = px + Math.cos(a) * len
      const ny = py + Math.sin(a) * len
      runs.push({ x0: px, y0: py, x1: nx, y1: ny, wide: j === 0 ? 2.4 : 1.6, at: gone / total })
      gone += len
      px = nx
      py = ny
      if (c.fork && c.fork[0] === j) runs.push({ x0: px, y0: py, x1: px + Math.cos(a + c.fork[1]) * c.fork[2], y1: py + Math.sin(a + c.fork[1]) * c.fork[2], wide: 1.4, at: gone / total })
    })
  })
  return runs
}

export function drawRim(out: DrawList, x: number, y: number, cracked: number, id: string): void {
  out.push({ id: `rim-${id}`, part: 'boss-transform', kind: 'capsule', role: 'bossRim', x: x - HOLE_W / 2, y: y - HOLE_H / 2, w: HOLE_W, h: HOLE_H, z0: 0, z1: 0.5, tone: 'metal', v: [Math.min(1, cracked)] })
}

export function drawSmoke(out: DrawList, x: number, y: number, t: number, id = 'smoke'): void {
  const c = Math.cos(FALLEN.rot)
  const s = Math.sin(FALLEN.rot)
  const from: [number, number][] = [[-116, -4], [110, 2]]
  from.forEach(([ox, oy], w) => {
    const px = x + ox * c - oy * s
    const py = y + ox * s + oy * c
    out.push({ id: `${id}-${w}`, part: 'boss-transform', kind: 'box', role: 'bossSmoke', x: px - 4, y: py - 4, w: 8, h: 8, z0: 20, z1: 28, tone: 'light', v: [t, w] })
  })
}
