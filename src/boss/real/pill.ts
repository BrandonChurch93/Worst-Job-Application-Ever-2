import * as THREE from 'three'
import { hash01 } from '../../core/random'
import { sweep, type Outline, type Ring } from '../../shell/solids'
import { CAP_H, CAP_W, PILL_TALL } from '../body'

export const PILL = { tall: PILL_TALL, rings: 18, perEnd: 56, perSide: 26, seed: 67 }
export const BLISTERS: [number, number, number, number][] = [
  [-99, 4, 7, 4.2], [-104, -14, 6, 3.6], [-106, 18, 5.5, 3.2], [-88, -4, 4.5, 2.6], [-94, 13, 3.6, 2.2], [-81, 8, 3, 1.8],
  [98, -3, 6.8, 4], [101, 15, 6, 3.6], [104, -17, 5.5, 3.1], [87, 6, 4.2, 2.4], [92, -12, 3.6, 2.2], [80, -2, 3, 1.8]
]
// Where the ends burst: an opening with a torn lip that stands up and a pit behind it.
export const HOLES: [number, number, number, number, number][] = [[-123, 1, 14, 17, 3], [122, 2, 12.5, 15, 8]]
export const LIP = { out: 1.38, up: 2.6, wall: 0.3 }

export function holeAt(x: number, y: number): { d: number; deep: number } {
  let d = 9
  let deep = 0
  for (const [hx, hy, r, down, seed] of HOLES) {
    const a = Math.atan2(y - hy, x - hx)
    const rag = 1 + 0.2 * Math.sin(3 * a + seed) + 0.12 * Math.sin(7 * a + seed * 2) + 0.07 * Math.sin(13 * a + seed * 3)
    const at = Math.hypot(x - hx, y - hy) / (r * rag)
    if (at < d) {
      d = at
      deep = down
    }
  }
  return { d, deep }
}
export const NICKS: [number, number, number][] = [[-58, -36, 7], [34, 36, 9], [137, -14, 6]]
export const DENT = { x: 62, y: 7, wide: 30, deep: 5.5 }

const smooth = (t: number): number => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u) }

export function pillBump(x: number, y: number): number {
  let up = 0
  for (const [bx, by, r, h] of BLISTERS) {
    const d = Math.hypot(x - bx, y - by) / r
    if (d < 1) up = Math.max(up, h * Math.sqrt(1 - d * d))
  }
  const dent = Math.hypot((x - DENT.x) / DENT.wide, (y - DENT.y) / (DENT.wide * 0.6))
  const hole = holeAt(x, y)
  if (hole.d < LIP.out) up = hole.d >= 1 ? Math.max(up, LIP.up * smooth((LIP.out - hole.d) / (LIP.out - 1))) : LIP.up - (hole.deep + LIP.up) * smooth((1 - hole.d) / LIP.wall)
  return up - DENT.deep * (1 - smooth(dent))
}

function stadium(w: number, r: number): Outline {
  const half = w / 2 - r
  const x: number[] = []
  const y: number[] = []
  const nx: number[] = []
  const ny: number[] = []
  const arc = (cx: number, from: number): void => {
    for (let i = 0; i <= PILL.perEnd; i++) {
      const a = from + (i / PILL.perEnd) * Math.PI
      x.push(cx + r * Math.cos(a)); y.push(r * Math.sin(a)); nx.push(Math.cos(a)); ny.push(Math.sin(a))
    }
  }
  const run = (from: number, side: number): void => {
    for (let i = 1; i < PILL.perSide; i++) {
      x.push(from + (-from * 2 * i) / PILL.perSide); y.push(r * side); nx.push(0); ny.push(side)
    }
  }
  arc(half, -Math.PI / 2)
  run(half, 1)
  arc(-half, Math.PI / 2)
  run(-half, -1)
  return { x: new Float32Array(x), y: new Float32Array(y), nx: new Float32Array(nx), ny: new Float32Array(ny), count: x.length }
}

let made: THREE.BufferGeometry | null = null

export function pillGeometry(): THREE.BufferGeometry {
  if (made) return made
  const r = CAP_H / 2
  const rings: Ring[] = [{ inset: 0, z: 0, out: 1, up: 0 }]
  for (let i = 1; i <= PILL.rings; i++) {
    const a = (i / PILL.rings) * (Math.PI / 2)
    rings.push({ inset: r * (1 - Math.cos(a)) * 0.985, z: PILL.tall * Math.sin(a), out: Math.cos(a), up: Math.sin(a) })
  }
  const line = stadium(CAP_W, r)
  const g = sweep(line, rings, true)
  const p = g.getAttribute('position')
  const ridge: number[] = []
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const high = z / PILL.tall
    let dz = pillBump(x, y) * smooth(high * 1.6)
    let pull = 0
    for (const [nx, ny, wide] of NICKS) {
      const d = Math.hypot(x - nx, y - ny) / wide
      if (d < 1 && high < 0.75) pull = Math.max(pull, (1 - d) * (0.6 + 0.4 * hash01(i, 3, PILL.seed)))
    }
    dz -= pull * 3
    const k = 1 - pull * 0.07
    p.setXYZ(i, x * k, y * k, Math.max(0, z + dz))
    if (high > 0.985 && Math.abs(dz) < 0.02) ridge.push(i)
  }
  g.computeVertexNormals()
  const n = g.getAttribute('normal')
  for (const i of ridge) n.setXYZ(i, 0, 0, 1)
  made = g
  return g
}
