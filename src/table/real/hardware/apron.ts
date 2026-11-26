import * as THREE from 'three'
import { APRON_Y, BALL, PLUNGER } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { Geo } from './geo'
import { coil } from './kit'
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

  G.f(FIN.zinc).box(x - 30, x + 30, yh - 40, yh - 2, 0.4, 4, shade(TONE.zinc, 0.5), { bevel: 1 })
  // The dark channel the rod and its spring run in, with a low lip either side.
  G.f(FIN.dark).box(x - 19, x + 19, yk - PLUNGE.knob * 0.6, yh - 40, 0.3, 1.2, TONE.slot)
  for (const sx of [-1, 1]) G.f(FIN.zinc).box(x + sx * 21.5 - 2.5, x + sx * 21.5 + 2.5, yk - PLUNGE.knob * 0.6, yh - 40, 0.3, 3.2, shade(TONE.zinc, 0.38), { bevel: 0.9, top: shade(TONE.zinc, 0.7) })
  G.f(FIN.spring).box(x - 16, x + 16, yh - 11, yh - 2, 4, zc, TONE.alu)
  let from = G.vertices
  G.lathe([[7, 24], [16, 24], [17.5, 25.5], [17.5, 30], [16, 31.5], [13, 31.5], [13, 38], [11.5, 39.5], [7, 39.5]], 0, 0, 20, (i) => (i === 4 ? TONE.aluDark : TONE.alu))
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
  G.f(FIN.amber).lathe([[0, -r], [r * 0.34, -r * 0.94], [r * 0.64, -r * 0.77], [r * 0.87, -r * 0.5], [r * 0.98, -r * 0.2], [r, 0.08 * r], [r * 0.93, r * 0.36], [r * 0.74, r * 0.62], [r * 0.5, r * 0.8], [r * 0.5, r * 0.86], [r * 0.58, r * 0.9], [r * 0.58, r * 0.98], [5.5, r * 0.98]], 0, 0, 28, TONE.knob).round(from, 0, 0, 0, r, r * 0.045)
  G.move(from, turn(yk))
  // The knob is a bead of amber glass: light goes into it, so its shaded side glows deeper and never goes to mud, and the side to the lamps is paler.
  G.tint(from, (nx, ny, nz) => {
    const up = Math.max(0, nz * 0.8 - nx * 0.3 + ny * 0.25)
    const deep = Math.max(0, -nz * 0.7 - ny * 0.5)
    const k = 1.7 + 1.1 * up * up + 1.1 * deep
    return [k, k * (1 + 0.22 * up * up - 0.2 * deep), k]
  })
  const clip = face + PLUNGE.spring
  from = G.vertices
  G.f(FIN.steel).lathe([[5.5, r * 0.98], [5.5, clip + 12 - yk], [4, clip + 14 - yk], [0, clip + 14 - yk]], 0, 0, 12, TONE.steel)
  G.f(FIN.zinc).lathe([[5.5, clip - yk], [12.5, clip - yk], [12.5, clip + 3.4 - yk], [5.5, clip + 3.4 - yk]], 0, 0, 16, TONE.zinc)
  G.move(from, turn(yk))
  const rigid = G.vertices
  from = G.vertices
  G.f(FIN.spring)
  coil(G, 12.6, 2.9, 5, PLUNGE.spring, TONE.chrome)
  G.move(from, turn(face))
  const end = G.vertices
  G.morph(0, moving, rigid, () => [0, -PLUNGE.travel, 0])
  const squeeze = 1 - (PLUNGE.spring - PLUNGE.travel) / PLUNGE.spring
  G.morph(0, rigid, end, (_x, y) => [0, -(y - face) * squeeze, 0])
  // The spring the player sees: round the rod between the knob and the housing. It is drawn out as the knob is pulled.
  const s0 = yk + r * 0.98
  const s1 = yh - 36 + 24
  from = G.vertices
  G.f(FIN.spring)
  coil(G, 10.2, 2.5, 5, s1 - s0, TONE.chrome)
  G.move(from, turn(s0))
  G.morph(0, end, G.vertices, (_x, y) => [0, -PLUNGE.travel * Math.min(1, Math.max(0, (s1 - y) / (s1 - s0))), 0])
  return G
}

export interface Drain { G: Geo; C: Geo; S: Screws }

// The drain tube of the last screen is the loader's: it is built with the feed tube, in `frame/loader.ts`. The hardware draws nothing there.
export function drain(_z: Zone): Drain {
  return { G: new Geo(), C: new Geo(), S: new Screws() }
}
