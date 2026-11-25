import { config } from '../../../../config'
import { BALL, COLS, SPIRAL, railOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import type { Buckets, V3 } from './geo'
import { KIND, TONE, shade, site } from './kit'

export type V4 = [number, number, number, number]

// The wires of the highway stand wider than the ball: this much more room is left round its path.
const WIRES = 10

// The tube the ball sweeps on the highway and down the spiral, in the zone's frame: points along both rails, a ball apart at most by a twelfth.
export function tube(z: Zone): V4[] {
  const out: V4[] = []
  for (const id of ['highway', 'spiral']) {
    const pts = railOf(id).points.map((p) => localBalls(z, p[0], p[1], p[2]))
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!
      const c = pts[i + 1]!
      const n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]) / (BALL / 12)))
      for (let k = 0; k <= n; k++) out.push([a[0] + ((c[0] - a[0]) * k) / n, a[1] + ((c[1] - a[1]) * k) / n, a[2] + ((c[2] - a[2]) * k) / n, id === 'highway' ? WIRES : 0])
    }
  }
  return out
}

// How far the tube reaches from the path: the ball's radius and half the layout's clearance to the side, the clearance over the path, and the trough under it.
export const REACH = { side: (0.5 + config.table.minClearanceBalls / 10) * BALL, over: config.table.minClearanceBalls * BALL, under: 0.14 * BALL }

export const inTube = (pts: V4[], x: number, y: number, z0: number, z1: number, grow = 0): boolean => {
  for (const p of pts) {
    const more = grow > 0 ? grow + p[3] : 0
    if (z1 < p[2] - REACH.under - more || z0 > p[2] + REACH.over + more) continue
    const r = REACH.side + more
    const dx = x - p[0]
    const dy = y - p[1]
    if (dx * dx + dy * dy < r * r) return true
  }
  return false
}

// The round garage: a concrete frame of columns and ring beams round the clear spiral, open where the highway comes in and where the ball leaves, hung from the right wall and tied to the police station.
export function garage(b: Buckets, z: Zone): void {
  const S = site(z, 'street.garage')
  const g = b.paint
  const cx = S.cx
  const cy = S.cy
  const Ro = SPIRAL.frame * BALL
  const Ri = Ro - 0.095 * BALL
  const Rm = (Ro + Ri) / 2
  const base = S.base
  const top = S.base + S.h
  const pitch = SPIRAL.pitch * BALL
  const con = TONE.concrete
  const pts = tube(z)
  const N = 96
  const step = (Math.PI * 2) / N
  const margin = 3
  const free = (a: number, z0: number, z1: number, half = 0): boolean => {
    for (const da of [-half, 0, half]) for (const r of [Ri, Ro]) if (inTube(pts, cx + Math.cos(a + da) * r, cy + Math.sin(a + da) * r, z0, z1, margin)) return false
    return true
  }

  // The ring beams: one under each turn of the spiral and a deeper one at the rim. Each is left out where the tube crosses it.
  const levels: [number, number][] = []
  for (let zz = base; zz + pitch < top - 1; zz += pitch) levels.push([zz, zz + 0.27 * BALL])
  levels.push([top - 0.42 * BALL, top])
  const has: boolean[][] = levels.map(([z0, z1]) => Array.from({ length: N }, (_, i) => free((i + 0.5) * step, z0, z1, step / 2)))
  levels.forEach(([z0, z1], li) => {
    const row = has[li]!
    if (row.every((v) => !v)) return
    let start = row.findIndex((v, i) => v && !row[(i + N - 1) % N])
    const whole = start < 0
    if (whole) start = 0
    let i = start
    let done = 0
    while (done < N) {
      if (!row[i % N]) {
        i++
        done++
        continue
      }
      let n = 0
      while (n < N && row[(i + n) % N] && done + n < N) n++
      const a0 = i * step
      const a1 = (i + n) * step
      const rim = li === levels.length - 1
      g.lathe([[Ri, z0], [Ro, z0], [Ro, z1 - 1.2], [Ro - 1.2, z1], [Ri + 1.2, z1], [Ri, z1 - 1.2], [Ri, z0]], cx, cy, n, (k) => (k === 0 ? shade(con, 0.7) : k === 3 ? shade(con, 1.08) : con), { arc: [a0, a1], kind: KIND.concrete })
      // A dark joint cast into the outer face, and on the rim a steel coping.
      g.lathe([[Ro + 0.15, z0 + (z1 - z0) * 0.3], [Ro + 0.15, z0 + (z1 - z0) * 0.3 + 1.1]], cx, cy, n, shade(con, 0.38), { arc: [a0, a1] })
      if (rim) b.metal.lathe([[Ri - 0.3, z1], [Ro + 0.3, z1], [Ro + 0.3, z1 + 1.4], [Ri - 0.3, z1 + 1.4], [Ri - 0.3, z1]], cx, cy, n, TONE.steel, { arc: [a0, a1] })
      if (!whole) {
        for (const [a, s] of [[a0, -1], [a1, 1]] as const) {
          const c = Math.cos(a)
          const sn = Math.sin(a)
          const q: V3[] = [[cx + c * Ri, cy + sn * Ri, z0], [cx + c * Ro, cy + sn * Ro, z0], [cx + c * Ro, cy + sn * Ro, z1], [cx + c * Ri, cy + sn * Ri, z1]]
          g.face(s > 0 ? q : [...q].reverse(), shade(con, 0.9), KIND.concrete)
        }
      }
      // A strip lamp under the beam in each bay, lit, on the inner edge.
      for (let k = 0; k + 3 < n; k += 6) {
        const a = a0 + (k + 3) * step
        const m = b.glow.mark()
        b.glow.box(Ri + 0.6, Ri + 2.6, -8, 8, z0 - 1.6, z0 - 0.2, [1.5, 1.4, 1.1], { under: true, skip: 't' })
        b.glow.place(m, cx, cy, 0, a)
      }
      i += n
      done += n
    }
  })

  // The columns, one every sixteenth of the round, cast in pieces from beam to beam and left out where the tube passes.
  const cols = 16
  const half = 7
  for (let k = 0; k < cols; k++) {
    const a = (k / cols) * Math.PI * 2
    const at = Math.round(a / step) % N
    for (let li = 0; li < levels.length - 1; li++) {
      const z0 = levels[li]![1]
      const z1 = levels[li + 1]![0]
      const lower = has[li]![at]! && has[li]![(at + N - 1) % N]!
      const upper = has[li + 1]![at]! && has[li + 1]![(at + N - 1) % N]!
      if (!lower && !upper) continue
      let lo = z0
      let hi = z1
      const piece = 6
      if (!upper) while (hi > lo && !free(a, hi - piece, hi, half / Rm)) hi -= piece
      if (!lower) while (lo < hi && !free(a, lo, lo + piece, half / Rm)) lo += piece
      if (hi - lo < 18 || !free(a, lo, hi, half / Rm)) continue
      const m = g.mark()
      g.box(Ri, Ro, -half, half, lo, hi, con, { kind: KIND.concrete, skip: upper && lower ? 't' : '', under: !lower })
      // A haunch under the upper beam.
      if (upper) g.box(Ri + 0.4, Ro - 0.4, -half - 3, half + 3, hi - 5, hi, shade(con, 1.05), { under: true, skip: 't' })
      g.place(m, cx, cy, 0, a)
      // A guard rail of steel tube from this column to the next, over the beam below.
      const next = ((k + 1) / cols) * Math.PI * 2
      const rz = z0 + 0.2 * BALL
      if (lower) {
        const parts = 4
        for (let j = 0; j < parts; j++) {
          const p = a + ((next - a) * j) / parts
          const q = a + ((next - a) * (j + 1)) / parts
          if (!free((p + q) / 2, rz - 2, rz + 2, (q - p) / 2)) continue
          if (!has[li]![Math.floor(((p + q) / 2) / step) % N]) continue
          b.metal.rod([cx + Math.cos(p) * Rm, cy + Math.sin(p) * Rm, rz], [cx + Math.cos(q) * Rm, cy + Math.sin(q) * Rm, rz], 1.1, 5, TONE.steel, 0, false)
        }
      }
    }
  }

  // Hung from the right wall: a steel bracket at each beam under the three columns nearest the wall, bolted through.
  const wall = localBalls(z, COLS.right, 0)[0]
  levels.forEach(([z0, z1]) => {
    for (const k of [-1, 0, 1]) {
      const a = (k / cols) * Math.PI * 2
      const x = cx + Math.cos(a) * Ro
      const y = cy + Math.sin(a) * Ro
      if (wall - x < 0.5) continue
      b.metal.box(x - 1.5, wall, y - 4.5, y + 4.5, z0 + 2, z0 + 5, TONE.steel, { under: true, bevel: 0.6 })
      b.metal.box(x - 1.5, x, y - 6.5, y + 6.5, z0 + 1, Math.min(z1 - 2, z0 + 20), TONE.steel, { under: true, skip: 'r' })
      b.screws.push([x - 1.5, y - 4.2, z0 + 12, 1.2], [x - 1.5, y + 4.2, z0 + 12, 1.2])
    }
  })

  // Tied to the police station: a steel angle from the lowest beam to the top of its front wall.
  const police = site(z, 'street.police')
  const ty = cy + Ro
  if (police.yf > ty && police.h > base + 4) {
    for (const dx of [-16, 16]) {
      b.metal.box(cx + dx - 3.5, cx + dx + 3.5, ty - 2, police.yf + 3, base + 3, base + 6, TONE.steel, { under: true, bevel: 0.6 })
      b.screws.push([cx + dx, police.yf + 1.4, base + 6, 1.1])
    }
  }
}
