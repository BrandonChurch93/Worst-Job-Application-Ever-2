import * as THREE from 'three'
import { BALL } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { INSERT_GLOW, insertCell, insertsOf } from './inserts'

export interface WindowShape {
  segments: number
  inset: number
}

// The discs of a tier's three windows in one geometry, each with its own cell of the atlases, and `wjaGlow` on every corner: how far that window is lit.
export function windowGeometry(z: Zone, w: WindowShape): { geometry: THREE.BufferGeometry; spans: [number, number][]; ids: string[] } {
  const list = insertsOf(z.tier)
  const at: number[] = []
  const up: number[] = []
  const uv: number[] = []
  const glow: number[] = []
  const index: number[] = []
  const spans: [number, number][] = []
  for (const n of list) {
    const g = new THREE.CircleGeometry(n.r * BALL, w.segments)
    const p = g.getAttribute('position')
    const t = g.getAttribute('uv')
    const [col, row] = insertCell(n)
    const [x, y] = localBalls(z, n.c[0], n.c[1])
    const first = at.length / 3
    for (let i = 0; i < p.count; i++) {
      at.push(p.getX(i) + x, p.getY(i) + y, 0)
      up.push(0, 0, 1)
      const u = 0.5 + (t.getX(i) - 0.5) * w.inset
      const v = 0.5 + (t.getY(i) - 0.5) * w.inset
      uv.push((col + u) / 3, 1 - (row + 1 - v) / 3)
      glow.push(INSERT_GLOW.off)
    }
    const tri = g.getIndex()!
    for (let i = 0; i < tri.count; i++) index.push(tri.getX(i) + first)
    spans.push([first, p.count])
    g.dispose()
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
