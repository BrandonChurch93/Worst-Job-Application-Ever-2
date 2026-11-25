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
export const FOOT_OFF: [number, number][] = [[-218, -150], [218, -150], [-218, 150], [218, 150]]
const HIP_OFF: [number, number][] = [[-150, -58], [150, -58], [-150, 58], [150, 58]]
export const CANNON_OFF: [number, number][] = [[-10, -94], [-10, 94]]
const SHIELD_OFF: [number, number] = [-222, 0]
const SIDE_OFF: [number, number][] = [[20, -86], [20, 86]]
export const CANNON_FROM = [1, 2] as const

export interface Spot { x: number; y: number; rot: number; k: number; z: number }
export interface Leg { hx: number; hy: number; fx: number; fy: number; k: number; z: number }
export interface Rig { cap: { x: number; y: number; rot: number; lift: number; down: number }; plate: Spot; sides: Spot[]; legs: Leg[]; cannons: Spot[]; shield: Spot; hurt: number }

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

export function fightRig(x: number, y: number, feet: { x: number; y: number; z: number }[] | null, recoil: [number, number] = [0, 0], bob = 0): Rig {
  return {
    cap: { x, y, rot: 0, lift: 1, down: 0 },
    plate: { x, y, rot: 0, k: 1, z: bob },
    sides: SIDE_OFF.map(([ox, oy]) => ({ x: x + ox, y: y + oy, rot: 0, k: 1, z: bob })),
    legs: HIP_OFF.map(([hx, hy], i) => ({ hx: x + hx, hy: y + hy, fx: feet ? feet[i]!.x : x + FOOT_OFF[i]![0], fy: feet ? feet[i]!.y : y + FOOT_OFF[i]![1], k: 1, z: feet ? feet[i]!.z : 0 })),
    cannons: CANNON_OFF.map(([ox, oy], i) => ({ x: x + ox + recoil[i]!, y: y + oy, rot: 0, k: 1, z: bob })),
    shield: { x: x + SHIELD_OFF[0], y: y + SHIELD_OFF[1], rot: 0, k: 1, z: bob },
    hurt: 0
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
  const shake = u < UNFOLD.crack ? Math.min(1, u / 0.5) : Math.max(0, 1 - (u - UNFOLD.crack) / 0.5)
  rig.cap.x += Math.sin(u * 61) * 3.5 * shake
  rig.cap.y += Math.sin(u * 47 + 1) * 1.5 * shake
  rig.cap.rot = Math.sin(u * 53) * 0.035 * shake + Math.sin(Math.PI * prog(u, UNFOLD.crack, UNFOLD.open + 0.4)) * -0.16
  rig.cap.lift = prog(u, UNFOLD.crack, UNFOLD.open)
  rig.plate.k = prog(u, UNFOLD.plates[0], UNFOLD.plates[1])
  rig.sides.forEach((s, i) => { s.k = prog(u, UNFOLD.plates[0] + 0.25 + i * 0.12, UNFOLD.plates[1] + 0.25 + i * 0.12) })
  rig.legs.forEach((l, i) => { l.k = prog(u, UNFOLD.legs[0] + i * 0.12, UNFOLD.legs[1] - 0.36 + i * 0.12) })
  rig.cannons.forEach((c, i) => {
    const e = prog(u, UNFOLD.cannons[0] + i * 0.18, UNFOLD.cannons[1] - 0.18 + i * 0.18)
    const from = progressCentre(CANNON_FROM[i]!)
    c.x = mix(from.x, c.x, e)
    c.y = mix(from.y, c.y, e) - Math.sin(Math.PI * e) * 60
    c.k = e
    c.z = Math.sin(Math.PI * e) * 90
    c.rot = (1 - e) * 2.4
  })
  const sh = prog(u, UNFOLD.shield[0], UNFOLD.shield[1])
  rig.shield.x = mix(at.x - 150, rig.shield.x, sh)
  rig.shield.k = sh
  return rig
}

const SCATTER = {
  plate: { x: 1296, y: 446, rot: 0.22 },
  sides: [{ x: 600, y: 850, rot: -0.32 }, { x: 1716, y: 612, rot: 1.25 }],
  legs: [{ x: 1064, y: 452, rot: 0.5 }, { x: 1622, y: 440, rot: -0.45 }, { x: 330, y: 930, rot: -0.3 }, { x: 1672, y: 832, rot: 0.9 }],
  cannons: [{ x: 1492, y: 408, rot: 2.9 }, { x: 870, y: 762, rot: 0.35 }],
  shield: { x: 1500, y: 978, rot: 1.48 }
}

export function collapseRig(from: Rig, c: number): Rig {
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, (c - 0.35) / 0.95)), 3)
  const hop = Math.sin(Math.PI * Math.min(1, Math.max(0, (c - 0.35) / 0.95)))
  const spot = (s: Spot, to: { x: number; y: number; rot: number }, turns = 0): Spot => ({ x: mix(s.x, to.x, e), y: mix(s.y, to.y, e) - hop * 50, rot: mix(s.rot, to.rot + turns, e), k: s.k, z: mix(s.z, -1, e) + hop * 70 })
  const fold = prog(c, 0, 0.35)
  const capE = prog(c, 0.3, 1.35)
  const bounce = c > 1.35 ? Math.max(0, Math.sin((c - 1.35) * 14)) * Math.exp(-(c - 1.35) * 6) * 14 : 0
  return {
    cap: { x: mix(from.cap.x, FALLEN.x, capE), y: mix(from.cap.y, FALLEN.y, capE) - Math.sin(Math.PI * capE) * 30 - bounce, rot: mix(from.cap.rot, FALLEN.rot, capE) + Math.sin(c * 40) * 0.03 * (1 - capE), lift: 1 - capE, down: capE },
    plate: { ...spot(from.plate, SCATTER.plate), k: mix(1, 0.62, e) },
    sides: from.sides.map((s, i) => spot(s, SCATTER.sides[i]!)),
    legs: from.legs.map((l, i) => {
      const to = SCATTER.legs[i]!
      const half = 62
      const cx = mix((l.hx + l.fx) / 2, to.x, e)
      const cy = mix((l.hy + l.fy) / 2, to.y, e) - hop * 40
      const a = mix(Math.atan2(l.fy - l.hy, l.fx - l.hx), to.rot, e)
      const len = mix(Math.hypot(l.fx - l.hx, l.fy - l.hy) / 2, half, e) * (1 - 0.25 * fold * (1 - e))
      return { hx: cx - Math.cos(a) * len, hy: cy - Math.sin(a) * len, fx: cx + Math.cos(a) * len, fy: cy + Math.sin(a) * len, k: 1, z: mix(l.z, -1, e) + hop * 50 }
    }),
    cannons: from.cannons.map((s, i) => spot(s, SCATTER.cannons[i]!)),
    shield: spot(from.shield, SCATTER.shield),
    hurt: 1
  }
}

export const collapseDone = (c: number): boolean => c >= COLLAPSE_SECONDS

export function drawRig(out: DrawList, rig: Rig, id = 'boss', pressed = 0): void {
  const body = 'boss-body'
  const lying = (z: number): boolean => z < 0
  rig.legs.forEach((l, i) => {
    if (l.k <= 0.01) return
    const fx = mix(l.hx, l.fx, l.k)
    const fy = mix(l.hy, l.fy, l.k)
    const len = Math.hypot(fx - l.hx, fy - l.hy)
    const flat = lying(l.z)
    const lift = flat ? 0 : l.z
    const top = flat ? 14 : 38
    out.push({ id: `${id}-leg-${i}`, part: body, kind: 'box', x: (l.hx + fx) / 2 - len / 2, y: (l.hy + fy) / 2 - 8, w: len, h: 16, z0: flat ? 0 : 22 + lift * 0.5, z1: top + lift * 0.5, tone: 'raised', rot: Math.atan2(fy - l.hy, fx - l.hx), r: 6 })
    out.push({ id: `${id}-foot-${i}`, part: body, kind: 'disc', x: fx - 19, y: fy - 19, w: 38, h: 38, z0: lift, z1: (flat ? 18 : 26) + lift, tone: 'metal' })
    out.push({ id: `${id}-knee-${i}`, part: body, kind: 'disc', x: (l.hx + fx) / 2 - 12, y: (l.hy + fy) / 2 - 12, w: 24, h: 24, z0: top + lift * 0.5, z1: top + 6 + lift * 0.5, tone: 'metal' })
  })
  rig.sides.forEach((s, i) => {
    if (s.k <= 0.01) return
    const flat = lying(s.z)
    const w = 236 * s.k
    const h = 46 * s.k
    out.push({ id: `${id}-side-${i}`, part: body, kind: 'box', x: s.x - w / 2, y: s.y - h / 2, w, h, z0: flat ? 0 : 30 + s.z, z1: flat ? 12 : 46 + s.z, tone: 'metal', rot: s.rot, r: 8 })
  })
  if (rig.plate.k > 0.01) {
    const p = rig.plate
    const flat = lying(p.z)
    const w = 372 * p.k
    const h = 136 * p.k
    out.push({ id: `${id}-plate`, part: body, kind: 'box', x: p.x - w / 2, y: p.y - h / 2, w, h, z0: flat ? 0 : 34 + p.z, z1: flat ? 12 : 50 + p.z, tone: 'metal', rot: p.rot, r: 22 * p.k })
  }
  if (rig.shield.k > 0.01) {
    const s = rig.shield
    const flat = lying(s.z)
    out.push({ id: `${id}-shield`, part: body, kind: 'box', x: s.x - 20, y: s.y - 98 * s.k, w: 40, h: 196 * s.k, z0: flat ? 0 : 24 + s.z, z1: flat ? heights.card : 104 + s.z, tone: 'glass', rot: s.rot, r: 12 })
  }
  rig.cannons.forEach((c, i) => {
    if (c.k <= 0.01) return
    const flat = lying(c.z)
    const z0 = flat ? 0 : mix(heights.progressRail, 50, c.k) + c.z
    const z1 = z0 + (flat ? 18 : 20)
    const bx = c.x - Math.cos(c.rot) * 58 * c.k
    const by = c.y - Math.sin(c.rot) * 58 * c.k
    const bw = 68 * c.k
    if (bw > 2) out.push({ id: `${id}-barrel-${i}`, part: body, kind: 'box', x: bx - bw / 2, y: by - 11, w: bw, h: 22, z0: z0 + 2, z1: z1 - 4, tone: 'dark', rot: c.rot, r: 5 })
    out.push({ id: `${id}-cannon-${i}`, part: body, kind: 'disc', x: c.x - sizes.progressButton / 2, y: c.y - sizes.progressButton / 2, w: sizes.progressButton, h: sizes.progressButton, z0, z1, tone: 'metal' })
    out.push(label(`${id}-cannon-${i}-numeral`, body, `data:numerals.${CANNON_FROM[i]!}`, c.x, c.y, TYPE.numeral, z1, 'ink'))
  })
  const cap = rig.cap
  const z0 = cap.down > 0 ? mix(50, 0, cap.down) : mix(heights.buttonSocket, 50, cap.lift)
  const z1 = z0 + (cap.lift > 0 || cap.down > 0 ? 16 : heights.button - heights.buttonSocket) - pressed
  out.push({ id: `${id}-cap`, part: body, kind: 'capsule', x: cap.x - CAP_W / 2, y: cap.y - CAP_H / 2, w: CAP_W, h: CAP_H, z0, z1, tone: 'accent', rot: cap.rot })
  out.push(label(`${id}-cap-word`, body, 'copy:step4.submit', cap.x, cap.y, TYPE.button, z1, 'inkLight', cap.rot))
  if (rig.hurt > 0) {
    const c = Math.cos(cap.rot)
    const s = Math.sin(cap.rot)
    const marks: [number, number, number][] = [[-118, -4, 44], [112, 8, 50], [-60, 22, 20]]
    marks.forEach(([mx, my, d], i) => {
      const size = d * Math.min(1, rig.hurt)
      out.push({ id: `${id}-scorch-${i}`, part: 'boss-transform', kind: 'disc', x: cap.x + mx * c - my * s - size / 2, y: cap.y + mx * s + my * c - size / 2, w: size, h: size, z0: z1 - 2, z1: z1 + 0.6, tone: 'dark' })
    })
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

export function drawSmoke(out: DrawList, x: number, y: number, t: number, id = 'smoke'): void {
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.5 + i / 3) % 1
    const d = 16 + u * 22
    out.push({ id: `${id}-${i}`, part: 'boss-transform', kind: 'ball', x: x + (i - 1) * 96 + Math.sin(u * 5 + i) * 10 - d / 2, y: y - 30 - u * 90 - d / 2, w: d, h: d, z0: 30 + u * 60, z1: 30 + u * 60 + d, tone: 'light' })
  }
}
