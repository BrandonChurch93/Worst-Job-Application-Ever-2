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

// The top of the low wall of the tier over its floor, as the frame builds it.
const WALL_TOP = 60

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
  const con = shade(TONE.concrete, 1.34)
  const pts = tube(z)
  const N = 96
  const step = (Math.PI * 2) / N
  const margin = 3
  const free = (a: number, z0: number, z1: number, half = 0): boolean => {
    for (const da of [-half, 0, half]) for (const r of [Ri, Ro]) if (inTube(pts, cx + Math.cos(a + da) * r, cy + Math.sin(a + da) * r, z0, z1, margin)) return false
    return true
  }

  // The ring beams: a deck edge under each turn of the spiral, a slimmer rail beam half way to the next, and a deeper one at the rim. Each is left out where the tube crosses it.
  const levels: [number, number][] = []
  const slim: boolean[] = []
  const cap = 4
  for (let zz = base; zz + pitch < top - 1; zz += pitch) {
    levels.push([zz, zz + 0.34 * BALL])
    slim.push(false)
    if (zz + pitch * 1.5 < top - 1) {
      levels.push([zz + pitch * 0.5 + 0.1 * BALL, zz + pitch * 0.5 + 0.3 * BALL])
      slim.push(true)
    }
  }
  levels.push([top - 0.5 * BALL, top - cap])
  slim.push(false)
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
      const thin = slim[li]!
      const ri = thin ? Ri + 1.6 : Ri
      const ro = thin ? Ro - 1.6 : Ro
      g.lathe([[ri, z0], [ro, z0], [ro, z1 - 1.2], [ro - 1.2, z1], [ri + 1.2, z1], [ri, z1 - 1.2], [ri, z0]], cx, cy, n, (k) => (k === 0 ? shade(con, 0.86) : k === 3 ? shade(con, 1.08) : con), { arc: [a0, a1], kind: KIND.concrete })
      // A dark joint cast into the outer face, and on the rim a steel coping.
      if (!thin) g.lathe([[Ro + 0.15, z0 + (z1 - z0) * 0.3], [Ro + 0.15, z0 + (z1 - z0) * 0.3 + 1.1]], cx, cy, n, shade(con, 0.38), { arc: [a0, a1] })
      if (rim) b.metal.lathe([[Ri - 0.3, z1], [Ro + 0.3, z1], [Ro + 0.3, z1 + 1.4], [Ri - 0.3, z1 + 1.4], [Ri - 0.3, z1]], cx, cy, n, TONE.steel, { arc: [a0, a1] })
      if (!whole) {
        for (const [a, s] of [[a0, -1], [a1, 1]] as const) {
          const c = Math.cos(a)
          const sn = Math.sin(a)
          const q: V3[] = [[cx + c * ri, cy + sn * ri, z0], [cx + c * ro, cy + sn * ro, z0], [cx + c * ro, cy + sn * ro, z1], [cx + c * ri, cy + sn * ri, z1]]
          g.face(s > 0 ? q : [...q].reverse(), shade(con, 0.9), KIND.concrete)
        }
      }
      // A strip lamp under the beam in each bay, lit, on the inner edge.
      for (let k = 0; !thin && k + 3 < n; k += 6) {
        const a = a0 + (k + 3) * step
        const m = b.glow.mark()
        b.glow.box(Ri + 0.6, Ri + 2.6, -8, 8, z0 - 1.6, z0 - 0.2, [1.5, 1.4, 1.1], { under: true, skip: 't' })
        b.glow.place(m, cx, cy, 0, a)
      }
      i += n
      done += n
    }
  })

  // The columns, eight round the ring, none on the open side: a ribbed pier from the lowest beam to a cap over the rim, left out where the tube passes.
  const cols = 8
  const half = 11
  const rib = 3
  const fin = 2
  const piece = 6
  const angle = (k: number): number => ((k + 0.5) / cols) * Math.PI * 2
  for (let k = 0; k < cols; k++) {
    const a = angle(k)
    const w = half / Rm
    const clear = (z0: number, z1: number): boolean => free(a, z0, z1, w) && !inTube(pts, cx + Math.cos(a) * (Ro + rib + fin), cy + Math.sin(a) * (Ro + rib + fin), z0, z1, margin)
    let lo = base
    while (lo < top) {
      while (lo < top && !clear(lo, Math.min(top, lo + piece))) lo += piece
      let hi = lo
      while (hi < top && clear(hi, Math.min(top, hi + piece))) hi = Math.min(top, hi + piece)
      if (hi - lo >= 18) {
        const m = g.mark()
        g.box(Ri, Ro + rib, -half, half, lo, hi, con, { kind: KIND.concrete, under: true, bevel: 0.8 })
        for (const s of [-1, 1]) g.box(Ro + rib - 0.5, Ro + rib + fin, s > 0 ? half - 5.5 : -half + 0.8, s > 0 ? half - 0.8 : -half + 5.5, lo + 1.5, hi - 1.5, shade(con, 1.04), { kind: KIND.concrete, under: true, skip: 'l' })
        if (hi >= top - 0.01) g.box(Ri - 0.0, Ro + rib + fin + 0.6, -half - 1.6, half + 1.6, top - 2.4, top, shade(con, 1.08), { kind: KIND.concrete, under: true, bevel: 0.6 })
        g.place(m, cx, cy, 0, a)
      }
      lo = hi + piece
    }
  }

  // Carried on the right wall: a steel stanchion stands on the wall's top behind each of the two piers nearest it, with an arm to the pier at every deck.
  const wall = localBalls(z, COLS.right, 0)[0]
  const far = localBalls(z, COLS.launchA, 0)[0]
  const px = (wall + far) / 2
  const post = Math.min(4.2, (far - wall) / 2 - 2)
  for (const k of [-1, 0]) {
    const a = angle(k)
    const y = cy + Math.sin(a) * (Ro + rib)
    const x = cx + Math.cos(a) * (Ro + rib) - 1
    if (px - x < 2 || post < 2) continue
    b.metal.box(px - post, px + post, y - post, y + post, WALL_TOP - 20, top - 0.2 * BALL, TONE.steel, { bevel: 0.7 })
    b.metal.box(px - post - 3.4, px + post + 3.4, y - post - 3.4, y + post + 3.4, WALL_TOP, WALL_TOP + 2, TONE.steel, { bevel: 0.5 })
    for (const [sx, sy] of [[-1, -1], [1, 1], [-1, 1], [1, -1]] as const) b.screws.push([px + sx * (post + 1.5), y + sy * (post + 1.5), WALL_TOP + 2, 0.9])
    levels.forEach(([z0], li) => {
      if (slim[li]) return
      b.metal.box(x, px + post, y - 2.8, y + 2.8, z0 + 8, z0 + 12, TONE.steel, { under: true, bevel: 0.6 })
      b.metal.box(x, x + 1.6, y - 6.5, y + 6.5, z0 + 2, z0 + 20, TONE.steel, { under: true })
    })
  }

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
