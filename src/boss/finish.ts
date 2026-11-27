import type { DrawList } from '../stage/types'
import { FINISH, FLAT } from './tune'

const part = 'shell'
const GOLD = { least: 70, most: 170, z: 3 } as const
const ARM = { long: 54, wide: 12, out: 30, z: 36 } as const
const BALL = { ahead: 46, z: 30 } as const
const BEAM = { z: 34, tall: 16, core: 0.45 } as const
const DENT = { off: [6, 11], grow: 0.06, fade: 0.5, cracks: 7, turn: [0.1, -0.22, 0.3, -0.08, 0.18], run: [[30, 0.25, 2.4], [22, -0.5, 1.6], [14, 0.4, 1.2]], puffs: 14, puff: 20 } as const

// Plain stand-ins for the power-up and the finishing blast; their look comes from the Builder's picture round.
export function drawPower(out: DrawList, x: number, y: number, k: number): void {
  if (k <= 0) return
  const d = GOLD.least + (GOLD.most - GOLD.least) * k
  out.push({ id: 'power-glow', part, kind: 'disc', x: x - d / 2, y: y - d / 2, w: d, h: d, z0: 0, z1: GOLD.z, tone: 'accent', moved: true })
  out.push({ id: 'power-core', part, kind: 'disc', x: x - d * 0.3, y: y - d * 0.3, w: d * 0.6, h: d * 0.6, z0: GOLD.z, z1: GOLD.z + 1, tone: 'light', moved: true })
}

export function drawFinish(out: DrawList, a: { x: number; y: number }, to: { x: number; y: number }, arms: number, charge: number, blast: { power: number; u: number } | null): void {
  const rot = Math.atan2(to.y - a.y, to.x - a.x)
  const ux = Math.cos(rot)
  const uy = Math.sin(rot)
  if (arms > 0.01) {
    for (const side of [-1, 1]) {
      const long = ARM.long * arms
      const cx = a.x - uy * side * ARM.out + ux * long * 0.5
      const cy = a.y + ux * side * ARM.out + uy * long * 0.5
      out.push({ id: `finish-arm-${side < 0 ? 0 : 1}`, part, kind: 'capsule', x: cx - long / 2, y: cy - ARM.wide / 2, w: long, h: ARM.wide, z0: ARM.z, z1: ARM.z + ARM.wide, tone: 'dark', rot, moved: true })
    }
  }
  if (charge > 0.01 && !blast) {
    const d = FINISH.ball * charge
    out.push({ id: 'finish-charge', part, kind: 'ball', x: a.x + ux * BALL.ahead - d / 2, y: a.y + uy * BALL.ahead - d / 2, w: d, h: d, z0: BALL.z, z1: BALL.z + d, tone: 'accent', moved: true })
  }
  if (blast) {
    const long = Math.hypot(to.x - a.x, to.y - a.y)
    const fade = blast.u < 0.8 ? 1 : Math.max(0, (1 - blast.u) / 0.2)
    const half = FINISH.wide * blast.power * fade
    if (long > 40 && half > 1) {
      const box = (id: string, h: number, z: number, tone: 'accent' | 'light'): void => {
        out.push({ id, part, kind: 'box', x: (a.x + to.x) / 2 - long / 2, y: (a.y + to.y) / 2 - h, w: long, h: h * 2, z0: z, z1: z + BEAM.tall, tone, rot, moved: true })
      }
      box('finish-blast', half, BEAM.z, 'accent')
      box('finish-blast-core', half * BEAM.core, BEAM.z + BEAM.tall, 'light')
    }
  }
}

// Where the arrow was laid flat: a shallow dent, a star of cracks round it and a ring of dust that leaves. `age` is seconds since the hit.
export function drawPancake(out: DrawList, x: number, y: number, age: number): void {
  if (age < 0 || age >= FLAT.mark) return
  const cx = x + DENT.off[0]
  const cy = y + DENT.off[1]
  const k = Math.min(1, age / DENT.grow) * Math.min(1, (FLAT.mark - age) / DENT.fade)
  const d = FLAT.dent * (0.6 + 0.4 * k)
  out.push({ id: 'arrow-dent', part, kind: 'disc', x: cx - d / 2, y: cy - d / 2, w: d, h: d, z0: 0, z1: 0.3, tone: 'pocket', moved: true })
  for (let i = 0; i < DENT.cracks; i++) {
    let a = (i / DENT.cracks) * Math.PI * 2 + DENT.turn[i % DENT.turn.length]!
    let px = cx + Math.cos(a) * FLAT.dent * 0.46
    let py = cy + Math.sin(a) * FLAT.dent * 0.46
    DENT.run.forEach(([len, bend, thick], j) => {
      a += bend * (i % 2 === 0 ? 1 : -1)
      const l = len * (0.7 + 0.3 * ((i * 7) % 5) / 4) * k
      if (l < 1) return
      out.push({ id: `arrow-crack-${i}-${j}`, part, kind: 'box', x: px + Math.cos(a) * l * 0.5 - l / 2, y: py + Math.sin(a) * l * 0.5 - thick / 2, w: l, h: thick, z0: 0, z1: 0.4, tone: 'dark', rot: a, moved: true })
      px += Math.cos(a) * l
      py += Math.sin(a) * l
    })
  }
  if (age < FLAT.dust) {
    const u = age / FLAT.dust
    const r = FLAT.dent * (0.45 + 0.75 * (1 - (1 - u) * (1 - u)))
    const size = DENT.puff * (1 - u)
    for (let i = 0; i < DENT.puffs; i++) {
      const a = (i / DENT.puffs) * Math.PI * 2 + 0.2
      if (size > 1) out.push({ id: `arrow-dust-${i}`, part, kind: 'ball', x: cx + Math.cos(a) * r - size / 2, y: cy + Math.sin(a) * r - size / 2, w: size, h: size, z0: 0, z1: size, tone: 'paper', moved: true })
    }
  }
}
