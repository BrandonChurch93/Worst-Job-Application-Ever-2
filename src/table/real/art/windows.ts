import * as THREE from 'three'
import { BALL } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { INSERT_GLOW, insertCell, insertsOf } from './inserts'

export interface WindowShape {
  segments: number
  inset: number
  dome?: number
}

const RINGS = [0.45, 0.72, 0.9, 1]

// One window: a disc, or with `dome` a low cap of glass whose middle stands that many units over its rim. The first corner is the middle.
function cap(r: number, segments: number, dome: number): { at: number[]; up: number[]; uv: number[]; index: number[] } {
  const at = [0, 0, dome]
  const up = [0, 0, 1]
  const uv = [0.5, 0.5]
  const index: number[] = []
  const rings = dome > 0 ? RINGS : [1]
  const round = dome > 0 ? (r * r + dome * dome) / (2 * dome) : 0
  const row = segments + 1
  rings.forEach((f, j) => {
    const d = f * r
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      const x = Math.cos(a) * d
      const y = Math.sin(a) * d
      const h = dome > 0 ? Math.sqrt(round * round - d * d) - (round - dome) : 0
      at.push(x, y, h)
      if (dome > 0) up.push(x / round, y / round, (h + round - dome) / round)
      else up.push(0, 0, 1)
      uv.push(0.5 + (x / r) * 0.5, 0.5 + (y / r) * 0.5)
    }
    const here = 1 + j * row
    for (let i = 0; i < segments; i++) {
      if (j === 0) index.push(0, here + i, here + i + 1)
      else index.push(here - row + i, here + i, here + i + 1, here - row + i, here + i + 1, here - row + i + 1)
    }
  })
  return { at, up, uv, index }
}

// The glasses of a tier's three windows in one geometry, each with its own cell of the atlases, and `wjaGlow` on every corner: how far that window is lit.
export function windowGeometry(z: Zone, w: WindowShape): { geometry: THREE.BufferGeometry; spans: [number, number][]; ids: string[] } {
  const list = insertsOf(z.tier)
  const at: number[] = []
  const up: number[] = []
  const uv: number[] = []
  const glow: number[] = []
  const index: number[] = []
  const spans: [number, number][] = []
  for (const n of list) {
    const g = cap(n.r * BALL, w.segments, w.dome ?? 0)
    const [col, row] = insertCell(n)
    const [x, y] = localBalls(z, n.c[0], n.c[1])
    const first = at.length / 3
    const count = g.at.length / 3
    for (let i = 0; i < count; i++) {
      at.push(g.at[i * 3]! + x, g.at[i * 3 + 1]! + y, g.at[i * 3 + 2]!)
      up.push(g.up[i * 3]!, g.up[i * 3 + 1]!, g.up[i * 3 + 2]!)
      const u = 0.5 + (g.uv[i * 2]! - 0.5) * w.inset
      const v = 0.5 + (g.uv[i * 2 + 1]! - 0.5) * w.inset
      uv.push((col + u) / 3, 1 - (row + 1 - v) / 3)
      glow.push(INSERT_GLOW.off)
    }
    for (const k of g.index) index.push(k + first)
    spans.push([first, count])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(at, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(up, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setAttribute('wjaGlow', new THREE.Float32BufferAttribute(glow, 1))
  geometry.setIndex(index)
  return { geometry, spans, ids: list.map((n) => n.id) }
}

// Sets how far one window is lit. Nothing is sent to the card when the level has not changed.
export function setGlow(geometry: THREE.BufferGeometry, span: [number, number], level: number): boolean {
  const a = geometry.getAttribute('wjaGlow') as THREE.BufferAttribute
  if (a.getX(span[0]) === Math.fround(level)) return false
  for (let i = span[0]; i < span[0] + span[1]; i++) a.setX(i, level)
  a.needsUpdate = true
  return true
}
