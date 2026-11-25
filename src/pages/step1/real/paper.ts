import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { capHeight } from '../../../shell/metrics'
import { TypeRegister } from '../../../shell/type'
import type { Shape } from '../../../stage/types'
import { PAPER, PAPER_LINES, PAPER_TITLE, SLOT } from '../layout'
import { TUG } from '../script'
import { DRAWN, GRID, MARGIN, sheetAt, solveSheet, type Sheet, type SheetIn } from './paperSolve'
import { INK, STOCK, stock } from './paperStock'
import { UNIT, crest, openOf, riseOf } from './shredderShape'

const TITLE_KEY = 'copy:step1.resume.paperTitle'
const THICK = 0.3
const SIZE = PAPER.w / DRAWN
// The film's sheet is `resume-paper`. A sheet of any other frame is `resume-paper:<name>`.
const isSheet = (id: string): boolean => id === 'resume-paper' || id.startsWith('resume-paper:')
const CARRY = { from: 21, span: 14 }
const BAR = { inset: PAPER.inset, tall: 0.8, pad: (PAPER.bar - 0.8) / 2, cells: 44, wide: [0.46, 1, 0.9, 0.62, 1, 0.84, 0.52] }
// Between two of the layout's lines runs a thinner one, so the sheet reads as a page of close text.
const BETWEEN = { tall: 0.6, wide: [0.94, 0.78, 1, 0.34, 0.88, 0.97, 0.6] }
// The hood and the cutters keep the sky off the sheet where it goes in, and the sheet bends over to go down:
// a deep shade at the mouth, and below the line of the bend the sheet is turned from the light.
const MOUTH = { in: 0.5, near: 0.36, nearPx: 4, bent: 0.3, fold: 15, soft: 7, slant: 0.12, lit: 0.03, edge: 0.8 }
// The held sheet hangs in one soft S between the hands and the mouth: it sags under the hands and comes up again before the bend.
// From straight above a matte stock shows that only as tone, so it is laid in the sheet's colours: a broad soft valley across the sheet, on a slant, and the light the far flank of it takes.
const BEND = { at: 0.56, wide: 0.19, deep: 0.13, lit: 0.035, crown: 0.86, crownWide: 0.1, slant: 0.22, grip: 0.055 }
// The creases of a sheet that has been pulled at: each a line across the stock with a darker facet on one side and a lighter one on the other. Where, at what angle, how strong, how wide, how long, in shares of the sheet.
const CREASES: [number, number, number, number, number, number][] = [[0.3, 0.26, 0.42, 0.16, 0.05, 0.4], [0.72, 0.44, -0.62, 0.14, 0.045, 0.34], [0.42, 0.66, 1.35, 0.12, 0.04, 0.3], [0.2, 0.52, -0.2, 0.09, 0.035, 0.22]]
function creased(u: number, v: number): number {
  let sum = 0
  for (const [cu, cv, turn, deep, wide, long] of CREASES) {
    const x = (u - cu) * (PAPER.w / PAPER.h)
    const y = v - cv
    const off = (-x * Math.sin(turn) + y * Math.cos(turn)) / wide
    const run = (x * Math.cos(turn) + y * Math.sin(turn)) / long
    sum += deep * (2.33 * off + 0.35) * Math.exp(-off * off - run * run)
  }
  return sum
}
const PRINT_LIFT = 0.5
const WRAP_LEN = 1.12 * (UNIT.r + 0.7 * SIZE)

// The held sheet as a height over its own plane, in px: a ridge from each hand to the mouth where the pull runs, a shorter buckle between them, a dent under each thumb where the arms lay it (the left 4 to 14 px under the top corner, the right 0 to 10), and the free top edge and the two side edges curled up.
// It is laid on the solved grid along its normals and its slopes turn them, so the light follows the bends.
const FOLD = { tall: 1.9, wide: 3.1, mid: 1, midWide: 4.2, dent: 1.4, dentWide: 3.6, curl: 2.6, curlWide: 5, side: 1.5, sideWide: 3.4, slack: 0.5, gain: 0.4, raise: 0.4, shade: 0.75, dark: 0.3, lit: 0.1, old: 0.45, sun: [0.6, 0.8], hand: { u: 0.02, v: [0.1, 0.06] }, foot: [0.35, 0.67] }
function ridge(x: number, y: number, x0: number, y0: number, x1: number, y1: number, wide: number, sharp: boolean): number {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const along = ((x - x0) * dx + (y - y0) * dy) / (len * len)
  const off = ((x - x0) * dy - (y - y0) * dx) / len
  const side = sharp ? Math.max(0, 1 - Math.abs(off) / wide) : Math.exp(-(off * off) / (wide * wide * 0.45))
  return side * smooth(along / 0.12) * smooth((1 - along) / 0.1)
}
function folded(u: number, v: number, foot: number, pull: number, sharp: boolean): number {
  const x = u * PAPER.w
  const y = v * PAPER.h
  const fy = foot * PAPER.h
  const ly = FOLD.hand.v[0]! * PAPER.h
  const ry = FOLD.hand.v[1]! * PAPER.h
  const hy = (ly + ry) / 2
  const lx = FOLD.hand.u * PAPER.w
  const rx = PAPER.w - lx
  const taut = FOLD.slack + (1 - FOLD.slack) * pull
  let h = FOLD.tall * taut * (ridge(x, y, lx + 5, ly + 2, FOLD.foot[0]! * PAPER.w, fy, FOLD.wide, sharp) + 0.8 * ridge(x, y, rx - 5, ry + 3, FOLD.foot[1]! * PAPER.w, fy, FOLD.wide * 1.2, sharp))
  h -= FOLD.mid * ridge(x, y, PAPER.w * 0.3, hy + (fy - hy) * 0.16, PAPER.w * 0.58, hy + (fy - hy) * 0.8, FOLD.midWide, sharp)
  h += 0.6 * FOLD.mid * ridge(x, y, PAPER.w * 0.86, hy + (fy - hy) * 0.3, PAPER.w * 0.5, hy + (fy - hy) * 0.62, FOLD.wide, sharp)
  h -= FOLD.dent * (Math.exp(-((x - lx - 3.5) ** 2 + (y - ly) ** 2) / FOLD.dentWide ** 2) + Math.exp(-((x - rx + 3.5) ** 2 + (y - ry) ** 2) / FOLD.dentWide ** 2))
  const between = smooth((x - lx - 5) / 8) * smooth((rx - 5 - x) / 8)
  h += FOLD.curl * between * Math.exp(-y / FOLD.curlWide) * (0.7 + 0.3 * Math.sin(u * 5.1 + 0.6))
  const down = smooth((y - hy - 8) / 10) * smooth((fy - 4 - y) / 10)
  h += FOLD.side * down * (Math.exp(-(PAPER.w - x) / FOLD.sideWide) - 0.7 * Math.exp(-x / FOLD.sideWide))
  return h
}
// What the folds do to the light is painted on the sheet with its other shades: the side of a ridge turned to the key is a little lighter, the side turned from it darker, with a clean line on the crest.
const foldTone = new Float32Array(GRID.nx * GRID.ny)
function fold(sheet: Sheet, foot: number, pull: number, k: number): void {
  foldTone.fill(0)
  if (k <= 0.001) return
  const { nx, ny, pos, nor } = sheet
  const e = 0.9
  const du = e / PAPER.w
  const dv = e / PAPER.h
  const t = [0, 0, 0, 0, 0, 0]
  const tangent = (a: number, b: number, at: number): void => {
    const x = pos[b]! - pos[a]!
    const y = pos[b + 1]! - pos[a + 1]!
    const z = pos[b + 2]! - pos[a + 2]!
    const l = Math.hypot(x, y, z) || 1
    t[at] = x / l
    t[at + 1] = y / l
    t[at + 2] = z / l
  }
  const lift = new Float32Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const u = i / (nx - 1)
      const v = j / (ny - 1)
      const o = (j * nx + i) * 3
      const fade = k * (1 - smooth((v - foot + 0.02) / 0.06))
      if (fade <= 0) continue
      tangent((j * nx + Math.max(0, i - 1)) * 3, (j * nx + Math.min(nx - 1, i + 1)) * 3, 0)
      tangent((Math.max(0, j - 1) * nx + i) * 3, (Math.min(ny - 1, j + 1) * nx + i) * 3, 3)
      const su = (folded(u + du, v, foot, pull, true) - folded(u - du, v, foot, pull, true)) / (2 * e)
      const sv = (folded(u, v + dv, foot, pull, true) - folded(u, v - dv, foot, pull, true)) / (2 * e)
      foldTone[j * nx + i] = clamp((su * FOLD.sun[0]! + sv * FOLD.sun[1]!) * FOLD.shade, -FOLD.dark, FOLD.lit) * fade
      const hu = ((folded(u + du, v, foot, pull, false) - folded(u - du, v, foot, pull, false)) / (2 * e)) * fade * FOLD.gain
      const hv = ((folded(u, v + dv, foot, pull, false) - folded(u, v - dv, foot, pull, false)) / (2 * e)) * fade * FOLD.gain
      const x = nor[o]! - hu * t[0]! - hv * t[3]!
      const y = nor[o + 1]! - hu * t[1]! - hv * t[4]!
      const z = nor[o + 2]! - hu * t[2]! - hv * t[5]!
      const l = Math.hypot(x, y, z) || 1
      lift[j * nx + i] = folded(u, v, foot, pull, false) * FOLD.raise * fade
      nor[o] = x / l
      nor[o + 1] = y / l
      nor[o + 2] = z / l
    }
  }
  for (let n = 0; n < nx * ny; n++) {
    const o = n * 3
    pos[o] = pos[o]! + nor[o]! * lift[n]!
    pos[o + 1] = pos[o + 1]! + nor[o + 1]! * lift[n]!
    pos[o + 2] = pos[o + 2]! + nor[o + 2]! * lift[n]!
  }
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const smooth = (t: number): number => {
  const u = clamp(t, 0, 1)
  return u * u * (3 - 2 * u)
}

// What the sheet is asked to do this frame, read from the shape and from the mechanism it is fed to.
export function sheetIn(s: Shape, ctx: RealContext): SheetIn {
  const jaw = ctx.byId.get('shredder-jaw-1')
  const rise = jaw ? riseOf(openOf(jaw)) : 0
  const c = crest(rise)
  const q: SheetIn = {
    w: PAPER.w, l: PAPER.h, x: s.x, y: s.y, bw: s.w, bh: s.h, rot: s.rot ?? 0, z: s.z0,
    lift: 0, bite: 0, amount: 0, pull: 0, lx: s.x + s.w / 2, ly: s.y, rx: s.x + s.w / 2, ry: s.y, hz: s.z0 + 5, vx: 0, vy: 0, hands: 0,
    cx: c.x, cy: c.y, cz: c.z, r: UNIT.r, rise, seed: STOCK.seed
  }
  const v = s.v
  if (v && v.length >= 11) {
    q.lift = clamp((v[0]! - CARRY.from) / CARRY.span, 0, 1)
    q.bite = v[1]!
    q.amount = v[2]!
    q.pull = v[3]!
    q.lx = v[4]!
    q.ly = v[5]!
    q.rx = v[6]!
    q.ry = v[7]!
    q.vx = v[8]!
    q.vy = v[9]!
    q.hands = v[10]!
    if ((q.rx - q.lx) * Math.cos(q.rot) + (q.ry - q.ly) * Math.sin(q.rot) < 0) {
      q.lx = v[6]!
      q.ly = v[7]!
      q.rx = v[4]!
      q.ry = v[5]!
    }
  } else if (s.rot !== undefined) {
    const cos = Math.cos(s.rot)
    const sin = Math.sin(s.rot)
    const gx = s.x + s.w / 2 + sin * (s.h / 2)
    const gy = s.y + s.h / 2 - cos * (s.h / 2)
    q.bite = 1
    q.hands = 1
    q.pull = 0.5
    q.lx = gx - cos * TUG.hands
    q.ly = gy - sin * TUG.hands
    q.rx = gx + cos * TUG.hands
    q.ry = gy + sin * TUG.hands
    q.amount = clamp(1 - (Math.hypot(gx - SLOT.cx, gy - c.y) + MARGIN * SIZE + WRAP_LEN) / PAPER.h, 0, 1)
  } else if (s.z0 > 30) {
    q.lift = 1
    q.lx = q.rx = s.x + s.w * 0.5
    q.ly = q.ry = s.y + s.h * 0.4
  }
  return q
}

const sig = (q: SheetIn): string =>
  [q.x, q.y, q.bw, q.bh, q.rot, q.z, q.lift, q.bite, q.amount, q.pull, q.lx, q.ly, q.rx, q.ry, q.vx, q.vy, q.hands, q.cz, q.rise].map((n) => n.toFixed(3)).join(',')

interface Mark { u: number; v: number }
interface Rig {
  sheet: Sheet
  body: THREE.BufferGeometry
  title: THREE.BufferGeometry
  bars: THREE.BufferGeometry
  titleMarks: Mark[]
  barMarks: Mark[]
  titleMesh: THREE.Mesh
  ring: number[]
  cast: THREE.MeshDepthMaterial
  sink: { value: number }
  was: string
}

// What throws the fed sheet's shadow lies a little under what is seen, so a sheet that leans away from the light
// does not shade itself in teeth.
const SINK = 0.5
function caster(sink: { value: number }): THREE.MeshDepthMaterial {
  const m = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSink = sink
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uSink;\nattribute float aSide;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed -= normalize(normal) * (aSide * uSink);')
  }
  return m
}

function ringOf(nx: number, ny: number): number[] {
  const out: number[] = []
  for (let i = 0; i < nx - 1; i++) out.push(i)
  for (let j = 0; j < ny - 1; j++) out.push(j * nx + nx - 1)
  for (let i = nx - 1; i > 0; i--) out.push((ny - 1) * nx + i)
  for (let j = ny - 1; j > 0; j--) out.push(j * nx)
  return out
}

function bodyGeometry(ring: number[]): THREE.BufferGeometry {
  const { nx, ny } = GRID
  const n = nx * ny
  const m = ring.length
  const count = n * 2 + m * 2
  const g = new THREE.BufferGeometry()
  const side = new Float32Array(count)
  side.fill(1, 0, n)
  side.fill(-1, n, n * 2)
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  const uv = new Float32Array(count * 2)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i
      uv[k * 2] = i / (nx - 1)
      uv[k * 2 + 1] = j / (ny - 1)
      uv[(n + k) * 2] = i / (nx - 1)
      uv[(n + k) * 2 + 1] = j / (ny - 1)
    }
  }
  // The cut edge is thin: its lower line reads the stock 1 px further in, so the fibre does not smear down it.
  ring.forEach((k, r) => {
    const u = uv[k * 2]!
    const v = uv[k * 2 + 1]!
    uv[(n * 2 + r) * 2] = u
    uv[(n * 2 + r) * 2 + 1] = v
    uv[(n * 2 + m + r) * 2] = u + Math.sign(0.5 - u) * (1 / PAPER.w)
    uv[(n * 2 + m + r) * 2 + 1] = v + Math.sign(0.5 - v) * (1 / PAPER.h)
  })
  const index: number[] = []
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i
      const b = a + 1
      const c = a + nx
      const d = c + 1
      index.push(a, c, b, b, c, d)
      index.push(n + a, n + b, n + c, n + b, n + d, n + c)
    }
  }
  for (let r = 0; r < m; r++) {
    const r1 = (r + 1) % m
    const t0 = n * 2 + r
    const t1 = n * 2 + r1
    const b0 = n * 2 + m + r
    const b1 = n * 2 + m + r1
    index.push(t0, t1, b0, t1, b1, b0)
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3))
  g.setIndex(index)
  return g
}

function flat(marks: Mark[], index: number[], colour: THREE.Color): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const col = new Float32Array(marks.length * 3)
  for (let i = 0; i < marks.length; i++) {
    col[i * 3] = colour.r
    col[i * 3 + 1] = colour.g
    col[i * 3 + 2] = colour.b
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(marks.length * 3), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(marks.length * 3), 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setIndex(index)
  return g
}

function barMarks(): { marks: Mark[]; index: number[] } {
  const marks: Mark[] = []
  const index: number[] = []
  const rule = (b0: number, share: number, tall: number): void => {
    const w = (PAPER.w - BAR.inset * 2) * share
    const base = marks.length
    for (let k = 0; k <= BAR.cells; k++) {
      const a = BAR.inset + (w * k) / BAR.cells
      marks.push({ u: a / PAPER.w, v: b0 / PAPER.h }, { u: a / PAPER.w, v: (b0 + tall) / PAPER.h })
    }
    for (let k = 0; k < BAR.cells; k++) {
      const a = base + k * 2
      index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
    }
  }
  PAPER_LINES.forEach((at, i) => {
    const next = PAPER_LINES[i + 1] ?? at + (at - (PAPER_LINES[i - 1] ?? at))
    rule(PAPER.h * at + BAR.pad, BAR.wide[i] ?? 1, BAR.tall)
    rule(PAPER.h * (at + next) * 0.5 + BAR.pad, BETWEEN.wide[i] ?? 1, BETWEEN.tall)
  })
  return { marks, index }
}

function titleMarks(): { marks: Mark[]; index: number[] } {
  const register = new TypeRegister()
  const run = register.set({ key: TITLE_KEY, font: PAPER_TITLE.font, px: PAPER_TITLE.px, x: 0, y: 0 }, new THREE.MeshBasicMaterial())
  const cap = capHeight(PAPER_TITLE.font, PAPER_TITLE.px)
  const p = run.mesh.geometry.getAttribute('position')
  const marks: Mark[] = []
  for (let i = 0; i < p.count; i++) marks.push({ u: (BAR.inset + p.getX(i)) / PAPER.w, v: (PAPER.top + cap - p.getY(i)) / PAPER.h })
  const index = Array.from(run.mesh.geometry.getIndex()!.array)
  ;(run.mesh.material as THREE.Material).dispose()
  register.clear()
  return { marks, index }
}

function lay(g: THREE.BufferGeometry, marks: Mark[], sheet: Sheet, lift: number): void {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const nor = g.getAttribute('normal') as THREE.BufferAttribute
  const p = pos.array as Float32Array
  const n = nor.array as Float32Array
  for (let i = 0; i < marks.length; i++) sheetAt(sheet, marks[i]!.u, marks[i]!.v, lift, p, i * 3, n)
  pos.needsUpdate = true
  nor.needsUpdate = true
  g.computeBoundingSphere()
}

function shape(rig: Rig, q: SheetIn): void {
  const was = sig(q)
  if (was === rig.was) return
  rig.was = was
  const sheet = solveSheet(q, rig.sheet)
  const { nx, ny } = GRID
  const top0 = MARGIN / (DRAWN * (PAPER.h / PAPER.w))
  fold(sheet, Math.max(top0 + 0.05, sheet.out - WRAP_LEN / PAPER.h), clamp(q.pull, 0, 1), clamp(q.bite, 0, 1) * smooth(q.hands))
  const n = nx * ny
  const m = rig.ring.length
  const pos = rig.body.getAttribute('position') as THREE.BufferAttribute
  const nor = rig.body.getAttribute('normal') as THREE.BufferAttribute
  const p = pos.array as Float32Array
  const o = nor.array as Float32Array
  for (let k = 0; k < n; k++) {
    const a = k * 3
    const x = sheet.nor[a]!
    const y = sheet.nor[a + 1]!
    const z = sheet.nor[a + 2]!
    p[a] = sheet.pos[a]! + x * THICK
    p[a + 1] = sheet.pos[a + 1]! + y * THICK
    p[a + 2] = sheet.pos[a + 2]! + z * THICK
    o[a] = x
    o[a + 1] = y
    o[a + 2] = z
    const b = (n + k) * 3
    p[b] = sheet.pos[a]!
    p[b + 1] = sheet.pos[a + 1]!
    p[b + 2] = sheet.pos[a + 2]!
    o[b] = -x
    o[b + 1] = -y
    o[b + 2] = -z
  }
  for (let r = 0; r < m; r++) {
    const k = rig.ring[r]!
    const i = k % nx
    const j = (k - i) / nx
    const inner = (clamp(j, 1, ny - 2) * nx + clamp(i, 1, nx - 2)) * 3
    const a = k * 3
    let x = sheet.pos[a]! - sheet.pos[inner]!
    let y = sheet.pos[a + 1]! - sheet.pos[inner + 1]!
    let z = sheet.pos[a + 2]! - sheet.pos[inner + 2]!
    const l = Math.hypot(x, y, z) || 1
    x /= l
    y /= l
    z /= l
    const t = (n * 2 + r) * 3
    const b = (n * 2 + m + r) * 3
    p[t] = p[a]!
    p[t + 1] = p[a + 1]!
    p[t + 2] = p[a + 2]!
    p[b] = sheet.pos[a]!
    p[b + 1] = sheet.pos[a + 1]!
    p[b + 2] = sheet.pos[a + 2]!
    o[t] = o[b] = x
    o[t + 1] = o[b + 1] = y
    o[t + 2] = o[b + 2] = z
  }
  const col = rig.body.getAttribute('color') as THREE.BufferAttribute
  const c = col.array as Float32Array
  const bite = clamp(q.bite, 0, 1)
  const mouth = 540 - q.cy
  const across = q.cx - 960
  const uvs = rig.body.getAttribute('uv').array as Float32Array
  const top = MARGIN / (DRAWN * (PAPER.h / PAPER.w))
  const foot = Math.max(top + 0.05, sheet.out - WRAP_LEN / PAPER.h)
  const hung = bite * smooth(q.hands) * smooth((foot - top) / 0.3)
  for (let v = 0; v < c.length; v += 3) {
    const d = p[v + 1]! - mouth
    const fold = d - (p[v]! - across) * MOUTH.slant
    const below = 1 - smooth((fold - MOUTH.fold) / MOUTH.soft)
    const crown = Math.exp(-Math.pow((fold - MOUTH.fold - MOUTH.soft) / MOUTH.soft, 2))
    const k = (v / 3) * 2
    const t = (uvs[k + 1]! - top) / (foot - top) + (uvs[k]! - 0.5) * BEND.slant
    const sag = BEND.deep * Math.exp(-Math.pow((t - BEND.at) / BEND.wide, 2)) - BEND.lit * Math.exp(-Math.pow((t - BEND.crown) / BEND.crownWide, 2)) + BEND.grip * Math.exp(-Math.pow(Math.max(0, t) / 0.12, 2))
    const shade = 1 - bite * (d < 0 ? MOUTH.in : MOUTH.near * Math.exp(-d / MOUTH.nearPx) + MOUTH.bent * below - MOUTH.lit * crown) - hung * (sag + FOLD.old * creased(uvs[k]!, uvs[k + 1]!))
    c[v] = c[v + 1] = c[v + 2] = v < n * 6 ? shade + foldTone[(v / 3) % n]! : shade * MOUTH.edge
  }
  col.needsUpdate = true
  pos.needsUpdate = true
  nor.needsUpdate = true
  rig.body.computeBoundingSphere()
  lay(rig.title, rig.titleMarks, sheet, THICK + PRINT_LIFT)
  lay(rig.bars, rig.barMarks, sheet, THICK + PRINT_LIFT)
  const mat = stock(PAPER.w, PAPER.h)
  mat.sheet.normalScale.setScalar(0.16 + 0.5 * sheet.abuse)
}

// The sheet prints its own title. While the page still hands the title to the type maker, that one shows on the flat sheet
// and this one only once the sheet is bitten and stands clear of it.
const ownTitle = (ctx: RealContext, bitten: boolean): boolean => {
  const t = ctx.byId.get('resume-paper-title')
  return !t || t.part === 'paper' || bitten
}

export const paper: PartMaker = {
  key(s) {
    return isSheet(s.id) ? 'paper' : ''
  },
  make() {
    const mat = stock(PAPER.w, PAPER.h)
    const ring = ringOf(GRID.nx, GRID.ny)
    const t = titleMarks()
    const b = barMarks()
    const body = bodyGeometry(ring)
    const title = flat(t.marks, t.index, INK.title)
    const bars = flat(b.marks, b.index, INK.bar)
    const group = new THREE.Group()
    const sheetMesh = new THREE.Mesh(body, mat.sheet)
    sheetMesh.castShadow = true
    sheetMesh.receiveShadow = true
    const sink = { value: 0 }
    const cast = caster(sink)
    sheetMesh.customDepthMaterial = cast
    const titleMesh = new THREE.Mesh(title, mat.print)
    titleMesh.receiveShadow = true
    titleMesh.userData.type = TITLE_KEY
    const barMesh = new THREE.Mesh(bars, mat.print)
    barMesh.receiveShadow = true
    group.add(sheetMesh, titleMesh, barMesh)
    for (const c of group.children) c.frustumCulled = false
    const rig: Rig = {
      sheet: { nx: GRID.nx, ny: GRID.ny, pos: new Float32Array(GRID.nx * GRID.ny * 3), nor: new Float32Array(GRID.nx * GRID.ny * 3), abuse: 0, out: 1 },
      body, title, bars, titleMarks: t.marks, barMarks: b.marks, titleMesh, ring, cast, sink, was: ''
    }
    group.userData.rig = rig
    return group
  },
  pose(o, s, ctx) {
    if (!isSheet(s.id)) return
    const rig = o.userData.rig as Rig
    o.position.set(0, 0, 0)
    o.rotation.set(0, 0, 0)
    const q = sheetIn(s, ctx)
    shape(rig, q)
    rig.sink.value = SINK * clamp(q.bite, 0, 1)
    rig.titleMesh.visible = s.id !== 'resume-paper' || ownTitle(ctx, q.bite > 0.5)
  },
  drop(o) {
    const rig = o.userData.rig as Rig
    rig.body.dispose()
    rig.title.dispose()
    rig.bars.dispose()
    rig.cast.dispose()
  }
}
