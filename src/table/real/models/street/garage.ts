import { config } from '../../../../config'
import { BALL, COLS, SPIRAL, railOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import type { Buckets, V3 } from './geo'
import { KIND, TONE, rgb, shade, site } from './kit'

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

export interface GarageLamp { a: number; r: number; z: number; at: V3 }

// Where the lamps of the garage hang, in the zone's frame: `at` is the lit face of each, `a` its angle round the garage, `r` how far out it is.
export function garageLamps(z: Zone): GarageLamp[] {
  const S = site(z, 'street.garage')
  const pts = tube(z)
  const Ro = SPIRAL.frame * BALL
  const top = S.base + S.h
  const out: GarageLamp[] = []
  for (const roof of [true, false]) {
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2
      const r = Ro + 0.5 * BALL
      const zz = roof ? top - 22 : S.base + S.h * 0.4
      const at: V3 = [S.cx + Math.cos(a) * r, S.cy + Math.sin(a) * r, zz]
      let free = true
      for (let q = Ro - 6; q <= r + 8; q += 4) if (inTube(pts, S.cx + Math.cos(a) * q, S.cy + Math.sin(a) * q, zz - 4, zz + 22, 4)) free = false
      if (free) out.push({ a, r, z: zz, at })
    }
  }
  return out
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
  const con = rgb(0x9aa5b0)
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
    levels.push([zz, zz + 0.44 * BALL])
    slim.push(false)
    if (zz + pitch * 1.5 < top - 1) {
      levels.push([zz + pitch * 0.5, zz + pitch * 0.5 + 0.44 * BALL])
      slim.push(false)
    }
  }
  levels.push([top - 0.5 * BALL, top - cap])
  slim.push(false)
  const has: boolean[][] = levels.map(([z0, z1]) => Array.from({ length: N }, (_, i) => free((i + 0.5) * step, z0, z1, step / 2)))

  // The lengths of beam that are left, and the pieces of pier that are left: eight piers round the ring, each cut where the tube passes.
  type Run = { li: number; i: number; n: number; whole: boolean; held: boolean }
  type Pier = { k: number; lo: number; hi: number; held: boolean }
  const runs: Run[] = []
  has.forEach((row, li) => {
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
      runs.push({ li, i, n, whole, held: false })
      i += n
      done += n
    }
  })
  const cols = 8
  const half = 7
  const rib = 3
  const fin = 2
  const piece = 6
  const angle = (k: number): number => ((k + 0.5) / cols) * Math.PI * 2
  const piers: Pier[] = []
  for (let k = 0; k < cols; k++) {
    const a = angle(k)
    const w = half / Rm
    const clear = (z0: number, z1: number): boolean => free(a, z0, z1, w) && !inTube(pts, cx + Math.cos(a) * (Ro + rib + fin), cy + Math.sin(a) * (Ro + rib + fin), z0, z1, margin)
    let lo = base
    while (lo < top) {
      while (lo < top && !clear(lo, Math.min(top, lo + piece))) lo += piece
      let hi = lo
      while (hi < top && clear(hi, Math.min(top, hi + piece))) hi = Math.min(top, hi + piece)
      if (hi - lo >= 18) piers.push({ k, lo, hi, held: k === 0 || k === cols - 1 })
      lo = hi + piece
    }
  }

  // Nothing hangs in the air: a length of beam or a piece of pier is built only if it is joined, through beams and piers, to one of the two piers that the stanchions carry.
  const joined = (r: Run, p: Pier): boolean => {
    const [z0, z1] = levels[r.li]!
    if (z1 < p.lo + 2 || z0 > p.hi - 2) return false
    const at = (((angle(p.k) / step - r.i) % N) + N) % N
    return at > 0.5 && at < r.n - 0.5
  }
  for (let grew = true; grew; ) {
    grew = false
    for (const r of runs) {
      for (const p of piers) {
        if (r.held === p.held || !joined(r, p)) continue
        r.held = true
        p.held = true
        grew = true
      }
    }
  }

  for (const r of runs) {
    if (!r.held) continue
    const [z0, z1] = levels[r.li]!
    const n = r.n
    const a0 = r.i * step
    const a1 = (r.i + n) * step
    const rim = r.li === levels.length - 1
    const thin = slim[r.li]!
    const ri = thin ? Ri + 1.6 : Ri
    const ro = thin ? Ro - 1.6 : Ro
    g.lathe([[ri, z0], [ro, z0], [ro, z1 - 1.2], [ro - 1.2, z1], [ri + 1.2, z1], [ri, z1 - 1.2], [ri, z0]], cx, cy, n, (k) => (k === 0 ? shade(con, 0.86) : k === 3 ? shade(con, 1.08) : con), { arc: [a0, a1], kind: KIND.concrete })
    // A dark joint cast into the outer face, and on the rim a steel coping.
    if (!thin) g.lathe([[Ro + 0.15, z0 + (z1 - z0) * 0.3], [Ro + 0.15, z0 + (z1 - z0) * 0.3 + 1.1]], cx, cy, n, shade(con, 0.38), { arc: [a0, a1] })
    if (rim) b.metal.lathe([[Ri - 0.3, z1], [Ro + 0.3, z1], [Ro + 0.3, z1 + 1.4], [Ri - 0.3, z1 + 1.4], [Ri - 0.3, z1]], cx, cy, n, TONE.steel, { arc: [a0, a1] })
    if (!r.whole) {
      for (const [a, sg] of [[a0, -1], [a1, 1]] as const) {
        const c = Math.cos(a)
        const sn = Math.sin(a)
        const q: V3[] = [[cx + c * ri, cy + sn * ri, z0], [cx + c * ro, cy + sn * ro, z0], [cx + c * ro, cy + sn * ro, z1], [cx + c * ri, cy + sn * ri, z1]]
        g.face(sg > 0 ? q : [...q].reverse(), shade(con, 0.9), KIND.concrete)
      }
    }
    // A strip lamp under the beam in each bay, lit, on the inner edge.
    for (let k = 0; !thin && k + 3 <= n; k += 3) {
      const a = a0 + (k + 1.5) * step
      const m = b.glow.mark()
      b.glow.box(Ri + 0.5, Ri + 3.2, -12, 12, z0 - 3, z0 - 0.2, [1.5, 1.4, 1.1], { under: true, skip: 't' })
      b.glow.place(m, cx, cy, 0, a)
    }
  }

  // The piers: ribbed on the outer face, with a cap where one reaches the rim.
  for (const p of piers) {
    if (!p.held) continue
    const m = g.mark()
    g.box(Ri, Ro + rib, -half, half, p.lo, p.hi, con, { kind: KIND.concrete, under: true, bevel: 0.8 })
    for (const sg of [-1, 1]) g.box(Ro + rib - 0.5, Ro + rib + fin, sg > 0 ? half - 4.5 : -half + 0.8, sg > 0 ? half - 0.8 : -half + 4.5, p.lo + 1.5, p.hi - 1.5, shade(con, 1.04), { kind: KIND.concrete, under: true, skip: 'l' })
    if (p.hi >= top - 0.01) g.box(Ri, Ro + rib + fin + 0.6, -half - 1.6, half + 1.6, top - 2.4, top, shade(con, 1.08), { kind: KIND.concrete, under: true, bevel: 0.6 })
    g.place(m, cx, cy, 0, angle(p.k))
  }

  // The lamps of the garage, each a real source of the tier's warm white (see `garageLamps`): a row on arms under the rim and a row half way up the wall. One that would stand in the way of the ball is left out.
  for (const l of garageLamps(z)) {
    const a = l.a
    const m = [g.mark(), b.metal.mark(), b.glow.mark()]
    b.metal.rod([Ro, 0, l.z + 12], [l.r - 3, 0, l.z + 3], 1.1, 8, TONE.steel)
    b.metal.box(Ro - 0.4, Ro + 1.6, -4, 4, l.z + 7, l.z + 16, TONE.steel, { under: true })
    g.box(l.r - 8, l.r + 6, -5, 5, l.z + 1.2, l.z + 4.6, shade(con, 0.72), { bevel: 1.2, kind: KIND.gloss, under: true })
    b.glow.box(l.r - 7.5, l.r + 5.5, -4.6, 4.6, l.z, l.z + 1.2, [1.9, 1.7, 1.3], { under: true, skip: 't' })
    g.place(m[0]!, cx, cy, 0, a)
    b.metal.place(m[1]!, cx, cy, 0, a)
    b.glow.place(m[2]!, cx, cy, 0, a)
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
      if (slim[li] || !piers.some((p) => p.held && p.k === (k + cols) % cols && p.lo <= z0 + 2 && p.hi >= z0 + 20)) return
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
