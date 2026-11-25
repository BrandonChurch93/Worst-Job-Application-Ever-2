import * as THREE from 'three'
import { APRON_Y, BALL, PLUNGER, railOf } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { Geo, type V2, type V3 } from './geo'
import { TUBE, clamp, coil, collar, frameAt, lengthOf, rounded, shells } from './kit'
import { FIN, Screws, TONE, shade } from './mats'

export const PLUNGE = { travel: 0.7 * BALL, knob: 0.32 * BALL, high: 30, housing: 0.92 * BALL, spring: 0.98 * BALL, shut: 0.29 * BALL, ring: 8, fade: 2, wave: 1.5, tip: 0.45 * BALL }

// The plunger on the apron: the housing screwed down at the wall, the rod through its bushing, the spring between the bushing and the clip on the rod, the knob. One morph pulls it.
export function plunger(z: Zone): Geo {
  const G = new Geo()
  const k = localBalls(z, PLUNGER[0], APRON_Y + 0.75)
  const x = k[0]
  const yk = k[1]
  const zc = PLUNGE.high
  const yh = localBalls(z, PLUNGER[0], APRON_Y)[1]
  const turn = (at: number): THREE.Matrix4 => new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(x, at, zc)

  G.f(FIN.zinc).box(x - 30, x + 30, yh - 40, yh - 2, 0.4, 4, TONE.zinc, { bevel: 1 })
  G.f(FIN.alu).box(x - 16, x + 16, yh - 34, yh - 6, 4, zc, TONE.alu)
  let from = G.vertices
  G.lathe([[7, 0], [16, 0], [17.5, 1.5], [17.5, 30], [16, 31.5], [13, 31.5], [13, 38], [11.5, 39.5], [7, 39.5]], 0, 0, 20, (i) => (i === 4 ? TONE.aluDark : TONE.alu))
  G.move(from, turn(yh - 36))
  const face = yh - 36 + 39.5
  for (const sx of [-1, 1]) {
    for (const sy of [-33, -9]) {
      from = G.vertices
      G.f(FIN.zinc).lathe([[5.4, 0], [5.4, 0.5], [4, 1.6], [0, 1.8]], x + sx * 24, yh + sy, 10, TONE.zinc, 4)
      G.f(FIN.dark).box(x + sx * 24 - 2.6, x + sx * 24 + 2.6, yh + sy - 0.5, yh + sy + 0.5, 5.6, 5.86, TONE.slot)
      G.box(x + sx * 24 - 0.5, x + sx * 24 + 0.5, yh + sy - 2.6, yh + sy + 2.6, 5.6, 5.87, TONE.slot)
    }
  }

  const moving = G.vertices
  const r = PLUNGE.knob
  from = G.vertices
  G.f(FIN.gloss).lathe([[0, -r], [r * 0.34, -r * 0.94], [r * 0.64, -r * 0.77], [r * 0.87, -r * 0.5], [r * 0.98, -r * 0.2], [r, 0.08 * r], [r * 0.93, r * 0.36], [r * 0.74, r * 0.62], [r * 0.5, r * 0.8], [r * 0.5, r * 0.92], [r * 0.6, r * 0.97], [r * 0.6, r * 1.1], [r * 0.4, r * 1.2], [r * 0.36, r * 1.4]], 0, 0, 28, TONE.knob).round(from, 0, 0, 0, r, r * 0.045)
  G.f(FIN.rubber).lathe([[r * 0.36, r * 1.4], [r * 0.48, r * 1.4], [r * 0.52, r * 1.47], [r * 0.52, r * 1.62], [r * 0.48, r * 1.7], [5.5, r * 1.7]], 0, 0, 16, TONE.rubberBlack)
  G.move(from, turn(yk))
  const clip = face + PLUNGE.spring
  from = G.vertices
  G.f(FIN.steel).lathe([[5.5, yk + r * 1.7 - yk], [5.5, clip + 12 - yk], [4, clip + 14 - yk], [0, clip + 14 - yk]], 0, 0, 12, TONE.steel)
  G.f(FIN.zinc).lathe([[5.5, clip - yk], [12.5, clip - yk], [12.5, clip + 3.4 - yk], [5.5, clip + 3.4 - yk]], 0, 0, 16, TONE.zinc)
  G.move(from, turn(yk))
  const rigid = G.vertices
  from = G.vertices
  G.f(FIN.dark)
  coil(G, 10.4, 2.1, 6, PLUNGE.spring, shade(TONE.steelDim, 0.6))
  G.move(from, turn(face))
  const end = G.vertices
  G.morph(0, moving, rigid, () => [0, -PLUNGE.travel, 0])
  const squeeze = 1 - (PLUNGE.spring - PLUNGE.travel) / PLUNGE.spring
  G.morph(0, rigid, end, (_x, y) => [0, -(y - face) * squeeze, 0])
  return G
}

export const PORT = { clear: 20, step: 4, gap: 3, land: 20, far: 46, thick: 2.4, cuts: 10 }

export interface Drain { G: Geo; C: Geo; S: Screws }

// The clear tube the ball leaves by, where it shows on the last screen.
export function drain(z: Zone): Drain {
  const G = new Geo()
  const C = new Geo()
  const S = new Screws()
  const pts = railOf('drain').points.slice(1).map((p) => localBalls(z, p[0], p[1], p[2] + 0.5) as V3)
  const path = rounded(pts, TUBE.bend)
  shells(C, path)
  const length = lengthOf(path)
  const crown = (q: number): number => (frameAt(path, q)?.at.z ?? 0) + TUBE.outer
  let a = 0
  while (a < length && crown(a) < 0) a += PORT.step
  let b = a
  while (b < length && crown(b) < PORT.clear) b += PORT.step
  const gland = b + PORT.gap + TUBE.collar / 2 + 2
  for (let s = gland; s < length - 20; s += TUBE.collarStep) {
    const f = frameAt(path, s)
    if (f) collar(G, S, f)
    const g = frameAt(path, s + TUBE.collarStep / 2)
    if (g && g.flat && s + TUBE.collarStep / 2 < length - 30 && g.at.z > 20 && g.at.z < 90) clamp(G, S, g, 0)
  }
  const f = frameAt(path, length - TUBE.collar / 2 - 0.5)
  if (f) collar(G, S, f)

  // Where the tube comes up through the page: a steel plate screwed to the page, a long dark slot in it that the tube rises out of.
  if (b > a && b < length) {
    const edge = (q: number, w: number | null, side: number): V2 => {
      const g = frameAt(path, q)!
      const sx = g.m.elements[0]!
      const sy = g.m.elements[1]!
      const l = Math.hypot(sx, sy) || 1
      const half = w ?? Math.sqrt(Math.max(0, TUBE.outer * TUBE.outer - g.at.z * g.at.z)) + PORT.gap
      return [g.at.x + (side * half * sx) / l, g.at.y + (side * half * sy) / l]
    }
    const wide = TUBE.outer + PORT.land
    const g = frameAt(path, b)!
    const tl = Math.hypot(g.m.elements[8]!, g.m.elements[9]!) || 1
    const tx = g.m.elements[8]! / tl
    const ty = g.m.elements[9]! / tl
    const corner = (along: number, side: number): V2 => [g.at.x + tx * along - ty * side * wide, g.at.y + ty * along + tx * side * wide]
    G.f(FIN.zinc).slab([corner(a - b - PORT.land, 1), corner(PORT.far, 1), corner(PORT.far, -1), corner(a - b - PORT.land, -1)], 0.2, PORT.thick, shade(TONE.zinc, 0.5), { bevel: 0.8 })
    const up: V2[] = []
    const down: V2[] = []
    for (let i = 0; i <= PORT.cuts; i++) {
      const q = a + ((b + PORT.gap - a) * i) / PORT.cuts
      up.push(edge(q, null, 1))
      down.push(edge(q, null, -1))
    }
    G.f(FIN.dark).slab([...up, ...down.reverse()], PORT.thick - 0.4, PORT.thick + 0.1, TONE.pocketDeep, { sides: false })
    for (const along of [a - b - PORT.land + 9, PORT.far - 9]) {
      for (const side of [-1, 1]) {
        const c = corner(along, side * (1 - 9 / wide))
        S.add(c[0], c[1], PORT.thick, 0.7)
      }
    }
  }
  return { G, C, S }
}
