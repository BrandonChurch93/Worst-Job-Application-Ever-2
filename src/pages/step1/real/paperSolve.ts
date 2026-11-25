import { hash01 } from '../../../core/random'

// The sheet as a grid of points. Stateless: the same numbers give the same sheet.
// In: page pixels, y down the page, z up. Out: the view's units, x - 960, 540 - y, z.

export interface SheetIn {
  w: number
  l: number
  // The flat sheet's box on the page as the shape gives it, its turn, and the height it lies at.
  x: number
  y: number
  bw: number
  bh: number
  rot: number
  z: number
  lift: number
  bite: number
  amount: number
  pull: number
  lx: number
  ly: number
  rx: number
  ry: number
  hz: number
  vx: number
  vy: number
  hands: number
  // The roller the sheet is fed over: its crest line's centre, its radius, and how far the cassette has come up.
  cx: number
  cy: number
  cz: number
  r: number
  rise: number
  seed: number
}

export interface Sheet {
  nx: number
  ny: number
  pos: Float32Array
  nor: Float32Array
  abuse: number
  // The share of the sheet's length that is still out of the cutters.
  out: number
}

export const GRID = { nx: 49, ny: 67 }
export const MARGIN = 16
const WRAP = 1.12
const FEED = 18
const KW = 72
const KH = 96

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const smooth = (t: number): number => {
  const u = clamp(t, 0, 1)
  return u * u * (3 - 2 * u)
}

interface Fold { px: number; py: number; dx: number; dy: number; half: number; amp: number; len: number }
interface Field { table: Float32Array; folds: Fold[]; mid: number; span: number }
const fields = new Map<number, Field>()
const ASPECT = 1.36

const raw = (folds: Fold[], u: number, v: number): number => {
  let z = 0
  const vv = v * ASPECT
  for (const c of folds) {
    const rx = u - c.px
    const ry = vv - c.py * ASPECT
    const across = Math.abs(rx * c.dy - ry * c.dx)
    const t = across / c.half
    if (t >= 1) continue
    const along = Math.abs(rx * c.dx + ry * c.dy)
    const end = 1 - smooth((along - c.len * 0.5) / (c.len * 0.5))
    z += c.amp * (1 - t) * (1 - t) * end
  }
  return z
}

// The creases a sheet takes when it is grabbed and hauled: straight folds with a sharp ridge and soft flanks.
// Two in five run from a grip down the sheet, the rest are the short weak folds of crushing. Range -1 to 1.
function field(seed: number): Field {
  const hit = fields.get(seed)
  if (hit) return hit
  const folds: Fold[] = []
  for (let i = 0; i < 34; i++) {
    const h = (k: number): number => hash01(i, k, seed + 4409)
    const kind = i % 5
    const long = kind < 2
    const px = kind === 0 ? 0.25 + h(1) * 0.12 : kind === 1 ? 0.63 + h(1) * 0.12 : h(1)
    const py = long ? 0.02 + h(2) * 0.16 : 0.12 + h(2) * 0.85
    const a = long ? Math.PI * (0.2 + h(3) * 0.6) : h(3) * Math.PI
    folds.push({
      px, py, dx: Math.cos(a), dy: Math.sin(a),
      half: long ? 0.12 + h(4) * 0.2 : 0.08 + h(4) * 0.14,
      amp: (h(5) < 0.5 ? -1 : 1) * (long ? 0.5 + h(6) * 0.5 : 0.22 + h(6) * 0.3),
      len: long ? 0.5 + h(7) * 0.9 : 0.16 + h(7) * 0.34
    })
  }
  for (let i = 0; i < 8; i++) {
    const h = (k: number): number => hash01(i, k, seed + 5521)
    const left = i < 4
    const a = Math.PI * (0.14 + ((i % 4) + h(1) * 0.7) * 0.2)
    folds.push({
      px: (left ? 0.24 : 0.76) + (h(5) - 0.5) * 0.05, py: 0.07 + h(6) * 0.04, dx: Math.cos(a), dy: Math.sin(a),
      half: 0.045 + h(2) * 0.035,
      amp: (i % 2 === 0 ? 1 : -1) * (0.2 + h(3) * 0.22),
      len: 0.34 + h(4) * 0.3
    })
  }
  const table = new Float32Array(KW * KH)
  let lo = Infinity
  let hi = -Infinity
  for (let j = 0; j < KH; j++) {
    for (let i = 0; i < KW; i++) {
      const z = raw(folds, i / (KW - 1), j / (KH - 1))
      table[j * KW + i] = z
      if (z < lo) lo = z
      if (z > hi) hi = z
    }
  }
  const mid = (lo + hi) / 2
  const span = Math.max(1e-6, (hi - lo) / 2)
  for (let i = 0; i < table.length; i++) table[i] = (table[i]! - mid) / span
  const made = { table, folds, mid, span }
  fields.set(seed, made)
  return made
}

export const creaseField = (seed: number): Float32Array => field(seed).table

// The same creases at any point, for the picture of them the paper is shaded with.
export function creaseExact(seed: number, u: number, v: number): number {
  const f = field(seed)
  return (raw(f.folds, u, v) - f.mid) / f.span
}

export function creaseAt(f: Float32Array, u: number, v: number): number {
  const x = clamp(u, 0, 1) * (KW - 1)
  const y = clamp(v, 0, 1) * (KH - 1)
  const i = Math.min(KW - 2, Math.floor(x))
  const j = Math.min(KH - 2, Math.floor(y))
  const tx = x - i
  const ty = y - j
  const a = f[j * KW + i]!
  const b = f[j * KW + i + 1]!
  const c = f[(j + 1) * KW + i]!
  const d = f[(j + 1) * KW + i + 1]!
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

// How deep the folds stand is settled column by column, then evened out across the sheet so no column stands apart from the next.
function even(v: Float32Array): void {
  const n = v.length
  const t = new Float32Array(n)
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < n; i++) {
      let sum = 0
      for (let k = -3; k <= 3; k++) sum += v[Math.min(n - 1, Math.max(0, i + k))]!
      t[i] = sum / 7
    }
    v.set(t)
  }
}

const NS = 56
const NT = 6

export function solveSheet(q: SheetIn, into?: Sheet): Sheet {
  const { nx, ny } = GRID
  const out: Sheet = into ?? { nx, ny, pos: new Float32Array(nx * ny * 3), nor: new Float32Array(nx * ny * 3), abuse: 0, out: 1 }
  const K = creaseField(q.seed)
  const W = q.w
  const L = q.l
  const bite = smooth(q.bite)
  const abuse = clamp(0.05 + bite * (0.3 + 0.5 * q.amount + 0.2 * q.pull) + (1 - bite) * 0.5 * q.pull * smooth(q.hands), 0, 1)
  const g0 = 0.5 + 3.4 * abuse
  out.abuse = abuse

  const cos = Math.cos(q.rot)
  const sin = Math.sin(q.rot)
  const mx = q.x + q.bw / 2
  const my = q.y + q.bh / 2
  const tx = mx + sin * (q.bh / 2)
  const ty = my - cos * (q.bh / 2)
  const R = q.r + 0.7
  const rise = smooth(q.rise)
  const crestZ = q.cz
  const hx = (q.lx + q.rx) / 2
  const hy = (q.ly + q.ry) / 2
  const held = Number.isFinite(hx) && (q.lift > 0 || q.hands > 0)

  const free = (a: number, b: number, o: number[]): void => {
    const dx = a - W / 2
    let px = tx + cos * dx - sin * b
    let py = ty + sin * dx + cos * b
    const ua = a / W
    const vb = b / L
    const corner = smooth((ua + vb - 1.5) / 0.5)
    const other = smooth((1 - ua + (1 - vb) - 1.62) / 0.38)
    let z = q.z + 2.6 * corner * corner + 1.1 * other * other + creaseAt(K, ua, vb) * g0 * 0.35 + 0.5
    if (held && q.lift > 0) {
      const ex = px - hx
      const ey = py - hy
      const d2 = ex * ex + ey * ey
      const lag = clamp((q.vx * ex + q.vy * ey) * 0.00004, -7, 7)
      z += q.lift * (-Math.min(7, d2 * 0.00011) - lag)
    }
    if (rise > 0.001) {
      const south = py - q.cy
      if (south <= 0) {
        const ramp = crestZ - Math.pow(-south, 1.25) * 0.085
        if (ramp > z) z += (ramp - z) * rise
      } else {
        const phi = Math.min(south / R, WRAP)
        const more = Math.min(14, Math.max(0, south - WRAP * R))
        const wy = q.cy + R * Math.sin(phi) + more * Math.cos(phi)
        const wz = crestZ - R + R * Math.cos(phi) - more * Math.sin(phi)
        py += (wy - py) * rise
        z += (wz - z) * rise
      }
    }
    o[0] = px
    o[1] = py
    o[2] = z
  }

  const p = [0, 0, 0]
  const da = W / (nx - 1)
  const db = L / (ny - 1)

  // The fed sheet, column by column: straight from the crest to where it is held, with whatever slack it has standing up as an arch.
  const span = Math.hypot(q.rx - q.lx, q.ry - q.ly)
  const grip = clamp(span, 40, W - 16)
  const al = W / 2 - grip / 2
  const gx = span > 1 ? (q.rx - q.lx) / span : 1
  const gy = span > 1 ? (q.ry - q.ly) / span : 0
  const hands = smooth(q.hands)
  const wrapLen = WRAP * R
  let sec = 1
  const chord = (a: number, o: number[]): number => {
    free(a, MARGIN, p)
    const fx = p[0]!
    const fy = p[1]!
    const fz = p[2]!
    const hxa = q.lx + gx * (a - al)
    const hya = q.ly + gy * (a - al)
    o[0] = fx + (hxa - fx) * hands - (q.cx + (a - W / 2) * sec)
    o[1] = fy + (hya - fy) * hands - q.cy
    o[2] = fz + (q.hz - fz) * hands - crestZ
    return Math.hypot(o[0]!, o[1]!, o[2]!)
  }
  const d = [0, 0, 0]
  // A sheet held askew goes into the cutters askew: it turns in its own plane and the crest cuts it on a slant.
  let reach = 0
  let skew = 0
  if (bite > 0) {
    for (let it = 0; it < 3; it++) {
      const cl = chord(al, d)
      const cr = chord(al + grip, d)
      reach = (cl + cr) / 2
      skew = clamp(((cr - cl) / grip) * hands, -0.7, 0.7)
      sec = Math.sqrt(1 + skew * skew)
    }
  }
  const F0 = L * (1 - q.amount) - MARGIN - Math.max(wrapLen, FEED)
  const Fm = Math.min(L - MARGIN - wrapLen, F0 + (Math.max(F0, reach) - F0) * hands)
  out.out = clamp((Fm + MARGIN + wrapLen) / L, 0, 1)

  const sig = new Float32Array(NS + NT + 1)
  const zk = new Float32Array(NS + NT + 1)
  const zc = new Float32Array(NS + NT + 1)
  const zs = new Float32Array(NS + NT + 1)
  const arch = new Float32Array(NS + 1)
  for (let k = 0; k <= NS; k++) arch[k] = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(k / NS, 1.0))), 1.3)
  const edgeFrom = grip / 2 + 6
  const fed = [0, 0, 0]

  const scales = new Float32Array(nx).fill(1)
  const crestAt = new Float32Array(nx).fill(-1)
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) even(scales)
    for (let i = 0; i < nx; i++) {
      const a = i * da
      let ux = 0
      let uy = -1
      let uz = 0
      let nxn = 0
      let nyn = 0
      let nzn = 1
      let c = 0
      let h = 0
      let scale = 1
      const live = bite > 0 && Fm > 2
      const F = clamp(Fm + skew * (a - W / 2), 2, L - MARGIN)
      const bCrest = F + MARGIN
      let wx = 0
      let wy = 1
      if (live) {
        c = chord(a, d)
        ux = d[0]! / c
        uy = d[1]! / c
        uz = d[2]! / c
        const flat = Math.hypot(ux, uy) || 1
        wx = -ux / flat
        wy = -uy / flat
        nxn = -uz * ux
        nyn = -uz * uy
        nzn = 1 - uz * uz
        const nl = Math.hypot(nxn, nyn, nzn) || 1
        nxn /= nl
        nyn /= nl
        nzn /= nl
        const e = clamp((Math.abs(a - W / 2) - edgeFrom) / Math.max(1, W / 2 - edgeFrom), 0, 1)
        const curl = (0.5 + 2.4 * q.pull) * e * e
        const wr = 1.1 * q.pull * (1 - e) * Math.cos((Math.PI * 3 * (a - W / 2)) / grip + 0.6)
        const ds = F / NS
        const dt = MARGIN / NT
        for (let k = 0; k <= NS + NT; k++) {
          const s = k <= NS ? k * ds : F + (k - NS) * dt
          const t = Math.min(1, s / F)
          const env = Math.sin(Math.PI * Math.pow(t, 0.8))
          const start = smooth(s / 16)
          zc[k] = g0 * creaseAt(K, a / W, (bCrest - s) / L) * start * (1 - 0.7 * hands * (1 - smooth(Math.abs(F - s) / 22)))
          zk[k] = (curl + wr) * Math.pow(Math.max(0, env), 0.7) + (k > NS ? 0.012 * (s - F) * (s - F) : 0)
        }
        const run = (hh: number, gs: number): number => {
          let atGrip = 0
          sig[0] = 0
          zs[0] = gs * zc[0]! + zk[0]!
          for (let k = 1; k <= NS + NT; k++) {
            const step = k <= NS ? ds : dt
            zs[k] = gs * zc[k]! + zk[k]! + (k <= NS ? hh * arch[k]! : 0)
            const dz = zs[k]! - zs[k - 1]!
            sig[k] = sig[k - 1]! + Math.sqrt(Math.max(step * step - dz * dz, 0.09 * step * step))
            if (k === NS) atGrip = sig[k]!
          }
          return atGrip
        }
        const want = Math.min(c, F)
        const slack = Math.max(0, F - want)
        let got = run(0, 1)
        const allowed = slack / F + 0.03
        const short = 1 - got / F
        if (short > allowed) {
          scale = Math.sqrt(allowed / short)
          got = run(0, scale)
          if (1 - got / F > allowed) {
            scale *= Math.sqrt(allowed / (1 - got / F))
            got = run(0, scale)
          }
        }
        if (got > want && hands > 0) {
          // Slack crumples the sheet before it lifts it: the folds deepen first, the arch takes what is left.
          let lo = scale
          let hi = scale * 1.6
          for (let it = 0; it < 10; it++) {
            const mid = (lo + hi) / 2
            if (run(0, mid) > want) lo = mid
            else hi = mid
          }
          scale = scale + (lo - scale) * hands
          got = run(0, scale)
        }
        if (pass === 0) {
          scales[i] = scale
          continue
        }
        scale = scales[i]!
        got = run(0, scale)
        if (got > want && hands > 0) {
          let lo = 0
          let hi = Math.min(0.2 * F, 44)
          for (let it = 0; it < 18; it++) {
            const mid = (lo + hi) / 2
            if (run(mid, scale) > want) lo = mid
            else hi = mid
          }
          h = lo * hands
        }
        got = run(h, scale)
        const fit = hands > 0 ? Math.min(1.012, 1 + (want / got - 1) * hands) : 1
        if (fit !== 1) for (let k = 0; k <= NS + NT; k++) sig[k] = sig[k]! * fit
      }
      if (pass === 0) continue
      if (live) crestAt[i] = bCrest
      for (let j = 0; j < ny; j++) {
        const b = j * db
        free(a, b, p)
        let x = p[0]!
        let y = p[1]!
        let z = p[2]!
        if (live) {
          const s = bCrest - b
          if (s >= 0) {
            const ds = F / NS
            let k: number
            let t: number
            if (s <= F) {
              const f = s / ds
              k = Math.min(NS - 1, Math.floor(f))
              t = f - k
            } else {
              const f = (s - F) / (MARGIN / NT)
              k = NS + Math.min(NT - 1, Math.floor(f))
              t = f - (k - NS)
            }
            const sg = sig[k]! + (sig[k + 1]! - sig[k]!) * t
            const zz = zs[k]! + (zs[k + 1]! - zs[k]!) * t
            fed[0] = q.cx + (a - W / 2) * sec + ux * sg + nxn * zz
            fed[1] = q.cy + uy * sg + nyn * zz
            fed[2] = crestZ + uz * sg + nzn * zz
          } else {
            const round = -s * wy
            const phi = Math.min(round / R, WRAP)
            const more = Math.min(16, Math.max(0, round - wrapLen))
            fed[0] = q.cx + (a - W / 2) * sec - s * wx
            fed[1] = q.cy + R * Math.sin(phi) + more * Math.cos(phi)
            fed[2] = crestZ - R + R * Math.cos(phi) - more * Math.sin(phi)
          }
          x += (fed[0]! - x) * bite
          y += (fed[1]! - y) * bite
          z += (fed[2]! - z) * bite
        } else if (bite > 0) {
          // Nothing is left out of the cutters: what remains of the grid is drawn in at the nip.
          x += (q.cx + a - W / 2 - x) * bite
          y += (q.cy + R * Math.sin(WRAP) + 16 * Math.cos(WRAP) - y) * bite
          z += (crestZ - R + R * Math.cos(WRAP) - 16 * Math.sin(WRAP) - z) * bite
        }
        const o = (j * nx + i) * 3
        out.pos[o] = x - 960
        out.pos[o + 1] = 540 - y
        out.pos[o + 2] = z
      }
    }
  }
  hold(out, da, db, 6)
  normals(out)
  const turned = Math.max(bite, q.pull * smooth(q.hands))
  if (turned > 0.02) {
    ear(out, W, L, turned * (0.55 + 0.45 * abuse))
    hold(out, da, db, 3)
    normals(out)
  }
  if (bite > 0) calm(out, crestAt, db, bite)
  return out
}

// A sheet fed askew crosses the crest on a slant, and the grid would shade that line in teeth. The rows by the crest
// take the light as the row a little above them does, so the sheet goes over the roller as one clean bend.
function calm(s: Sheet, crestAt: Float32Array, db: number, bite: number): void {
  const { nx, ny, nor } = s
  const before = 2.5 * db
  const after = 1.5 * db
  for (let i = 0; i < nx; i++) {
    const bc = crestAt[i]!
    if (bc < 0) continue
    const js = Math.max(0, Math.floor((bc - before) / db))
    const from = (js * nx + i) * 3
    const sx = nor[from]!
    const sy = nor[from + 1]!
    const sz = nor[from + 2]!
    for (let j = js + 1; j < ny; j++) {
      const b = j * db
      if (b > bc + after) break
      const w = bite * (b < bc ? smooth((b - (bc - before)) / before) : 1 - smooth((b - bc) / after))
      const o = (j * nx + i) * 3
      const x = nor[o]! + (sx - nor[o]!) * w
      const y = nor[o + 1]! + (sy - nor[o + 1]!) * w
      const z = nor[o + 2]! + (sz - nor[o + 2]!) * w
      const l = Math.hypot(x, y, z) || 1
      nor[o] = x / l
      nor[o + 1] = y / l
      nor[o + 2] = z / l
    }
  }
}

const EAR = { a: 34, b: 27, turn: 2.72 }
const earAt = new Float32Array(3)

// The dog ear: the corner by the left grip turned over along a straight fold, without stretching.
function ear(s: Sheet, W: number, L: number, k: number): void {
  const { nx, ny, pos } = s
  const da = W / (nx - 1)
  const db = L / (ny - 1)
  const ia = 1 / EAR.a
  const ib = 1 / EAR.b
  const n = Math.hypot(ia, ib)
  const theta = EAR.turn * smooth(k)
  const co = Math.cos(theta)
  const si = Math.sin(theta)
  const done: number[] = []
  for (let j = 0; j * db < EAR.b; j++) {
    for (let i = 0; i * da < EAR.a; i++) {
      const a = i * da
      const b = j * db
      const far = (1 - a * ia - b * ib) / n
      if (far <= 0) continue
      const step = (far - far * co) / n
      sheetAt(s, (a + step * ia) / W, (b + step * ib) / L, far * si + 0.25, earAt, 0)
      done.push((j * nx + i) * 3, earAt[0]!, earAt[1]!, earAt[2]!)
    }
  }
  for (let m = 0; m < done.length; m += 4) {
    const o = done[m]!
    pos[o] = done[m + 1]!
    pos[o + 1] = done[m + 2]!
    pos[o + 2] = done[m + 3]!
  }
}

// Paper does not stretch: where the shape asks an edge of the grid to be longer than the paper is, the sheet draws in instead.
// Across, from the middle out; along, from the cutters up. This is what takes the outline off the rectangle.
function hold(s: Sheet, da: number, db: number, passes: number): void {
  const { nx, ny, pos } = s
  const mid = (nx - 1) >> 1
  const pullTo = (from: number, to: number, max: number): void => {
    const x = pos[to]! - pos[from]!
    const y = pos[to + 1]! - pos[from + 1]!
    const z = pos[to + 2]! - pos[from + 2]!
    const l = Math.hypot(x, y, z)
    if (l <= max) return
    const k = max / l
    pos[to] = pos[from]! + x * k
    pos[to + 1] = pos[from + 1]! + y * k
    pos[to + 2] = pos[from + 2]! + z * k
  }
  for (let pass = 0; pass < passes; pass++) {
    for (let j = 0; j < ny; j++) {
      for (let i = mid; i + 1 < nx; i++) pullTo((j * nx + i) * 3, (j * nx + i + 1) * 3, da * 1.004)
      for (let i = mid; i > 0; i--) pullTo((j * nx + i) * 3, (j * nx + i - 1) * 3, da * 1.004)
    }
    for (let i = 0; i < nx; i++) {
      for (let j = ny - 1; j > 0; j--) pullTo((j * nx + i) * 3, ((j - 1) * nx + i) * 3, db * 1.004)
    }
  }
}

function normals(s: Sheet): void {
  const { nx, ny, pos, nor } = s
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const i0 = Math.max(0, i - 1)
      const i1 = Math.min(nx - 1, i + 1)
      const j0 = Math.max(0, j - 1)
      const j1 = Math.min(ny - 1, j + 1)
      const a = (j * nx + i0) * 3
      const b = (j * nx + i1) * 3
      const c = (j0 * nx + i) * 3
      const d = (j1 * nx + i) * 3
      const ax = pos[b]! - pos[a]!
      const ay = pos[b + 1]! - pos[a + 1]!
      const az = pos[b + 2]! - pos[a + 2]!
      const bx = pos[c]! - pos[d]!
      const by = pos[c + 1]! - pos[d + 1]!
      const bz = pos[c + 2]! - pos[d + 2]!
      let x = ay * bz - az * by
      let y = az * bx - ax * bz
      let z = ax * by - ay * bx
      const l = Math.hypot(x, y, z)
      if (l < 1e-9) {
        x = 0
        y = 0
        z = 1
      } else {
        x /= l
        y /= l
        z /= l
      }
      const o = (j * nx + i) * 3
      nor[o] = x
      nor[o + 1] = y
      nor[o + 2] = z
    }
  }
}

// The most any edge of the grid is longer than the paper it stands for, as a share: 0.01 is one percent.
export function stretchOf(s: Sheet, w: number, l: number): number {
  const { nx, ny, pos } = s
  const da = w / (nx - 1)
  const db = l / (ny - 1)
  let worst = 0
  const dist = (a: number, b: number): number => Math.hypot(pos[a]! - pos[b]!, pos[a + 1]! - pos[b + 1]!, pos[a + 2]! - pos[b + 2]!)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const o = (j * nx + i) * 3
      if (i + 1 < nx) worst = Math.max(worst, dist(o, o + 3) / da - 1)
      if (j + 1 < ny) worst = Math.max(worst, dist(o, o + nx * 3) / db - 1)
    }
  }
  return worst
}

// A point of the sheet between the grid's points, on the same two triangles a cell is drawn with:
// where a printed mark lies, and which way the paper faces there.
export function sheetAt(s: Sheet, u: number, v: number, lift: number, o: Float32Array, at: number, n?: Float32Array): void {
  const { nx, ny, pos, nor } = s
  const x = clamp(u, 0, 1) * (nx - 1)
  const y = clamp(v, 0, 1) * (ny - 1)
  const i = Math.min(nx - 2, Math.floor(x))
  const j = Math.min(ny - 2, Math.floor(y))
  const tx = x - i
  const ty = y - j
  const a = (j * nx + i) * 3
  const b = a + 3
  const c = a + nx * 3
  const d = c + 3
  const near = tx + ty <= 1
  const w0 = near ? 1 - tx - ty : 0
  const w1 = near ? tx : 1 - ty
  const w2 = near ? ty : 1 - tx
  const w3 = near ? 0 : tx + ty - 1
  let px = 0
  let py = 0
  let pz = 0
  let qx = 0
  let qy = 0
  let qz = 0
  px = pos[a]! * w0 + pos[b]! * w1 + pos[c]! * w2 + pos[d]! * w3
  py = pos[a + 1]! * w0 + pos[b + 1]! * w1 + pos[c + 1]! * w2 + pos[d + 1]! * w3
  pz = pos[a + 2]! * w0 + pos[b + 2]! * w1 + pos[c + 2]! * w2 + pos[d + 2]! * w3
  qx = nor[a]! * w0 + nor[b]! * w1 + nor[c]! * w2 + nor[d]! * w3
  qy = nor[a + 1]! * w0 + nor[b + 1]! * w1 + nor[c + 1]! * w2 + nor[d + 1]! * w3
  qz = nor[a + 2]! * w0 + nor[b + 2]! * w1 + nor[c + 2]! * w2 + nor[d + 2]! * w3
  const l = Math.hypot(qx, qy, qz) || 1
  o[at] = px + (qx / l) * lift
  o[at + 1] = py + (qy / l) * lift
  o[at + 2] = pz + (qz / l) * lift
  if (n) {
    n[at] = qx / l
    n[at + 1] = qy / l
    n[at + 2] = qz / l
  }
}
