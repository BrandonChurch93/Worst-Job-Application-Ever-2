import type { DrawList } from '../stage/types'
import { FINISH } from './tune'

const part = 'shell'
const GOLD = { least: 70, most: 170, z: 3 } as const
const ARM = { long: 54, wide: 12, out: 30, z: 36 } as const
const BALL = { ahead: 46, z: 30 } as const
const BEAM = { z: 34, tall: 16, core: 0.45 } as const
const FLAT_DISC = { w: 184, h: 138, rim: 12 } as const

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

export function drawPancake(out: DrawList, x: number, y: number, k: number): void {
  if (k <= 0) return
  const w = FLAT_DISC.w * k
  const h = FLAT_DISC.h * k
  const rim = FLAT_DISC.rim * k
  out.push({ id: 'arrow-flat-rim', part, kind: 'disc', x: x - w / 2, y: y - h / 2, w, h, z0: 0, z1: 1, tone: 'dark', moved: true })
  out.push({ id: 'arrow-flat', part, kind: 'disc', x: x - w / 2 + rim, y: y - h / 2 + rim, w: Math.max(1, w - rim * 2), h: Math.max(1, h - rim * 2), z0: 1, z1: 2, tone: 'metal', moved: true })
}
