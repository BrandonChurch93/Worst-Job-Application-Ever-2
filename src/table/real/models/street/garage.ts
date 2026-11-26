import { config } from '../../../../config'
import { BALL, COLS, SPIRAL, railOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import type { Buckets, V3 } from './geo'
import { KIND, TONE, rgb, shade, site } from './kit'

export type V4 = [number, number, number, number]

// The wires of the highway stand wider than the ball: this much more room is left round its path.
const WIRES = 10

// How far a parking deck stands out from the ring, where nothing is in its way.
const DECK = 24

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

// The round garage: clear moulded decks stacked on grey posts round the clear spiral, each deck on a steel hoop, open where the highway comes in and where the ball leaves, hung from the right wall and tied to the police station.
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
  const con = rgb(0x596169)
  const hoop = rgb(0x7d858c)
  const CLEAR: [number, number, number] = [1, 1, 1]
  const CUT: [number, number, number] = [2.4, 2.4, 2.4]
  const pts = tube(z)
  const N = 96
  const step = (Math.PI * 2) / N
  const margin = 3
  // Toward the police station the garage stands no higher than that station's roof, so its front and its sign are left clear from above.
  const P = site(z, 'street.police')
  const toward = Math.atan2(P.cy - cy, P.cx - cx)
  const low = P.h + 0.3 * BALL
  const faces = (a: number): boolean => Math.abs(Math.atan2(Math.sin(a - toward), Math.cos(a - toward))) < 1.02
  const free = (a: number, z0: number, z1: number, half = 0): boolean => {
    if (z1 > low && faces(a)) return false
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
    if (zz + pitch * 0.5 + 0.34 * BALL < top - 0.42 * BALL - 4) {
      levels.push([zz + pitch * 0.5, zz + pitch * 0.5 + 0.34 * BALL])
      slim.push(false)
    }
  }
  levels.push([top - 0.42 * BALL, top - cap])
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
  const half = 4.6
  const rib = 3
  const fin = 1.4
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
    // The deck: a band of clear plastic with a bright cut edge on top, standing on a steel hoop.
    b.glass.lathe([[ri, z0 + 2.2], [ro, z0 + 2.2], [ro, z1 - 1], [ro - 1, z1], [ri + 1, z1], [ri, z1 - 1], [ri, z0 + 2.2]], cx, cy, n, (k) => (k === 3 ? CUT : k === 2 || k === 4 ? [2, 2, 2] : CLEAR), { arc: [a0, a1] })
    b.metal.lathe([[ri - 0.4, z0], [ro + 1.2, z0], [ro + 1.2, z0 + 2.2], [ri - 0.4, z0 + 2.2], [ri - 0.4, z0]], cx, cy, n, hoop, { arc: [a0, a1] })
    if (rim) g.lathe([[Ri - 0.3, z1], [Ro + 0.3, z1], [Ro + 0.3, z1 + 1.4], [Ri - 0.3, z1 + 1.4], [Ri - 0.3, z1]], cx, cy, n, shade(con, 1.1), { arc: [a0, a1], kind: KIND.gloss })
    if (!r.whole) {
      for (const [a, sg] of [[a0, -1], [a1, 1]] as const) {
        const c = Math.cos(a)
        const sn = Math.sin(a)
        const q: V3[] = [[cx + c * ri, cy + sn * ri, z0 + 2.2], [cx + c * ro, cy + sn * ro, z0 + 2.2], [cx + c * ro, cy + sn * ro, z1], [cx + c * ri, cy + sn * ri, z1]]
        b.glass.face(sg > 0 ? q : [...q].reverse(), CUT)
      }
    }
    // A strip lamp under the beam in each bay, lit, on the inner edge.
    for (let k = 0; !thin && k + 3 <= n; k += 3) {
      const a = a0 + (k + 1.5) * step
      const m = b.glow.mark()
      b.glow.box(Ri + 1, Ri + 3, -9, 9, z0 - 2.2, z0 - 0.2, [1.5, 1.4, 1.1], { under: true, skip: 't' })
      b.glow.place(m, cx, cy, 0, a)
    }
  }

  // The parking decks: a slab of grey concrete round each ring with a kerb at its edge and the bays marked on it. Each is as wide as its place allows: short of the stanchions on the right wall and, below the roof of the police station, short of that station's wall.
  const deckCol = rgb(0x858b8f)
  const mark: [number, number, number] = [0.8, 0.79, 0.74]
  const reachX = (localBalls(z, COLS.right, 0)[0] + localBalls(z, COLS.launchA, 0)[0]) / 2 + 1
  const outer = (a: number, z0: number): number => {
    let r = Ro + DECK
    const c = Math.cos(a)
    const sn = Math.sin(a)
    if (c > 0.05) r = Math.min(r, (reachX - cx) / c)
    if (sn > 0.05 && z0 < P.h + 4) r = Math.min(r, (P.yf - 3 - cy) / sn)
    return r
  }
  const put = (q: V3[], n: V3, col: [number, number, number], kind = KIND.concrete): void => {
    const [a, c, d] = [q[0]!, q[1]!, q[2]!]
    const ux = c[0] - a[0]
    const uy = c[1] - a[1]
    const uz = c[2] - a[2]
    const vx = d[0] - a[0]
    const vy = d[1] - a[1]
    const vz = d[2] - a[2]
    const dot = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2]
    g.face(dot < 0 ? [...q].reverse() : q, col, kind, n)
  }
  levels.forEach(([lz0, lz1], li) => {
    const zt = lz1
    const zb = lz1 - 6
    const zk = Math.min(top - 0.4, lz1 + 3.6)
    const zl = zt - 8
    const zu = zt - 18
    const rin = Ro + 0.3
    const ok = Array.from({ length: N }, (_, i) => {
      if (!has[li]![i] || !runs.some((r) => r.held && r.li === li && ((i - r.i + N * 2) % N) < r.n)) return false
      for (const a of [i * step, (i + 0.5) * step, (i + 1) * step]) {
        // No slab stands before the sign on the police station's roof.
        if (zk > P.h - 2 && faces(a)) return false
        const ro = outer(a, lz0)
        if (ro - Ro < 5) return false
        for (const r of [ro, (ro + Ro) / 2]) if (inTube(pts, cx + Math.cos(a) * r, cy + Math.sin(a) * r, zu, zk, margin)) return false
      }
      return true
    })
    for (let i = 0; i < N; i++) {
      if (!ok[i]) continue
      const a0 = i * step
      const a1 = (i + 1) * step
      const at = (a: number, r: number, zz: number): V3 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, zz]
      const r0 = outer(a0, lz0)
      const r1 = outer(a1, lz0)
      const am = (a0 + a1) / 2
      const out: V3 = [Math.cos(am), Math.sin(am), 0]
      const inn: V3 = [-out[0], -out[1], 0]
      // The edge of the slab is cast deep: a face with a moulded lip, a soffit under it and a haunch back to the thin of the slab.
      const lip = 1.5
      const sof = (r: number): number => Math.min(8, (r - rin) * 0.34)
      const hau = (r: number): number => Math.min(15, (r - rin) * 0.62)
      const band = (ra: number, za: number, rb: number, zb2: number, n: V3, col: [number, number, number]): void => put([at(a0, r0 - ra, za), at(a0, r0 - rb, zb2), at(a1, r1 - rb, zb2), at(a1, r1 - ra, za)], n, col)
      put([at(a0, rin, zt), at(a0, r0 - 2, zt), at(a1, r1 - 2, zt), at(a1, rin, zt)], [0, 0, 1], deckCol)
      band(2, zk, 0, zk, [0, 0, 1], shade(deckCol, 1.14))
      band(2, zt, 2, zk, inn, shade(deckCol, 0.78))
      band(0, zl, 0, zk, out, shade(deckCol, 0.96))
      band(0, zl, lip, zl, [0, 0, -1], shade(deckCol, 0.45))
      band(lip, zu, lip, zl, out, shade(deckCol, 0.8))
      put([at(a0, r0 - sof(r0), zu), at(a0, r0 - lip, zu), at(a1, r1 - lip, zu), at(a1, r1 - sof(r1), zu)], [0, 0, -1], shade(deckCol, 0.5))
      put([at(a0, r0 - hau(r0), zb), at(a0, r0 - sof(r0), zu), at(a1, r1 - sof(r1), zu), at(a1, r1 - hau(r1), zb)], [-out[0] * 0.8, -out[1] * 0.8, -0.6], shade(deckCol, 0.56))
      put([at(a0, rin, zb), at(a0, r0 - hau(r0), zb), at(a1, r1 - hau(r1), zb), at(a1, rin, zb)], [0, 0, -1], shade(deckCol, 0.5))
      for (const [a, r, on, sg] of [[a0, r0, ok[(i + N - 1) % N], -1], [a1, r1, ok[(i + 1) % N], 1]] as const) {
        if (on) continue
        const n: V3 = [-Math.sin(a) * sg, Math.cos(a) * sg, 0]
        const end = shade(deckCol, 0.85)
        put([at(a, rin, zb), at(a, r - lip, zb), at(a, r - lip, zt), at(a, rin, zt)], n, end)
        put([at(a, r - 2, zt), at(a, r, zt), at(a, r, zk), at(a, r - 2, zk)], n, end)
        put([at(a, r - lip, zl), at(a, r, zl), at(a, r, zt), at(a, r - lip, zt)], n, end)
        put([at(a, r - hau(r), zb), at(a, r - sof(r), zu), at(a, r - lip, zu), at(a, r - lip, zb)], n, end)
      }
      if (i % 2 === 0 && ok[(i + N - 1) % N] && r0 - Ro > 9) {
        const w = 0.6 / ((Ro + r0) / 2)
        put([at(a0 - w, rin + 3, zt + 0.3), at(a0 - w, r0 - 3.4, zt + 0.3), at(a0 + w, r0 - 3.4, zt + 0.3), at(a0 + w, rin + 3, zt + 0.3)], [0, 0, 1], mark, KIND.plain)
      }
    }
  })

  // The posts: grey painted steel outside the decks, a bolted clip at every deck and a cap where one reaches the rim.
  for (const p of piers) {
    if (!p.held) continue
    const m = g.mark()
    const mm = b.metal.mark()
    g.box(Ro + 0.6, Ro + rib + fin + 2.4, -half, half, p.lo, p.hi, con, { kind: KIND.gloss, under: true, bevel: 1.1 })
    g.box(Ri, Ro + 0.6, -1.6, 1.6, p.lo, p.hi, shade(con, 0.8), { kind: KIND.gloss, under: true, skip: 'r' })
    levels.forEach(([z0, z1]) => {
      if (z0 < p.lo - 1 || z1 > p.hi + 1) return
      b.metal.box(Ro + rib + fin + 2.4, Ro + rib + fin + 3.6, -half - 1.4, half + 1.4, z0 - 1, z0 + 7, hoop, { under: true, bevel: 0.4 })
    })
    if (p.hi >= top - 0.01) g.box(Ri, Ro + rib + fin + 3, -half - 1.4, half + 1.4, top - 2.4, top, shade(con, 1.15), { kind: KIND.gloss, under: true, bevel: 0.6 })
    g.place(m, cx, cy, 0, angle(p.k))
    b.metal.place(mm, cx, cy, 0, angle(p.k))
    levels.forEach(([z0, z1]) => {
      if (z0 < p.lo - 1 || z1 > p.hi + 1) return
      const a = angle(p.k)
      b.screws.push([cx + Math.cos(a) * (Ro + rib + fin + 3.7), cy + Math.sin(a) * (Ro + rib + fin + 3.7), z0 + 3, 0.9])
    })
  }

  // The lamps of the garage, each a real source of the tier's warm white (see `garageLamps`): a row on arms under the rim and a row half way up the wall. One that would stand in the way of the ball is left out.
  for (const l of garageLamps(z)) {
    const a = l.a
    const m = [g.mark(), b.metal.mark(), b.glow.mark()]
    b.metal.rod([Ro, 0, l.z + 12], [l.r - 3, 0, l.z + 3], 1.1, 8, TONE.steel)
    b.metal.box(Ro - 0.4, Ro + 1.6, -4, 4, l.z + 7, l.z + 16, TONE.steel, { under: true })
    g.box(l.r - 8, l.r + 6, -5, 5, l.z + 1.2, l.z + 4.6, shade(con, 0.8), { bevel: 1.2, kind: KIND.gloss, under: true })
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
