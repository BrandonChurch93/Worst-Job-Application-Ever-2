import * as THREE from 'three'
import { config } from '../../../config'
import type { PartMaker, RealContext } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import { arc, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'

const heights = config.scale.heights
const q = (v: number): number => Math.round(v * 4) / 4

export const VERIFY = { step: 4, bezel: 1.8, bezelHigh: 2, capHigh: 4, capLow: 1.9, stroke: 5.6, ink: 0.7, dip: 1.6 }
export const TICK: [number, number][] = [[10.5, 23], [18.5, 31], [33.5, 13.5]]

const stepped = (h: number): number => Math.ceil(h / VERIFY.step) * VERIFY.step

function mesh(g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh {
  const out = new THREE.Mesh(g, m)
  out.castShadow = cast
  out.receiveShadow = true
  return out
}

// The checkbox: a thin polished frame set on the glass, a dark seam inside it, and a cap. The cap is white enamel and sits low until it is ticked; then it is the orange and stands up.
function box(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const b = VERIFY.bezel
  const high = VERIFY.bezelHigh
  const frame: ProfilePoint[] = [[0, 0, true], [0, high - 0.9], ...arc(0, high - 0.9, 0.9, 0.9, 5).slice(1), [b - 0.9, high], ...[1, 2, 3, 4, 5].map((i): ProfilePoint => {
    const a = (i / 5) * (Math.PI / 2)
    return [b - 0.9 + 0.9 * Math.sin(a), high - 0.9 * (1 - Math.cos(a))]
  }), [b, 0.2, true]]
  root.add(mesh(sweep(outlineOf(s, 0, 12), profile(frame), false), m.chrome))
  root.add(mesh(sweep(outlineOf(s, b - 0.3, 12), [{ inset: 0, z: 0.3, out: 0, up: 1 }]), m.gap, false))
  const ticked = s.tone === 'accent'
  const top = ticked ? VERIFY.capHigh : VERIFY.capLow
  const inner = { kind: 'box', w: s.w - (b + 0.7) * 2, h: s.h - (b + 0.7) * 2, r: Math.max(1, (s.r ?? 0) - b - 0.7) }
  const round = ticked ? 2.2 : 1.1
  const cap: ProfilePoint[] = [[0, 0.3, true], [0, top - round], ...arc(0, top - round, round, round, 7).slice(1)]
  const lid = mesh(sweep(outlineOf(inner, 0, 12), profile(cap)), ticked ? m.orange : m.enamel)
  lid.name = 'cap'
  root.add(lid)
  return root
}

// The tick is drawn as one raised stroke with round ends, cut in slices in the order the pen moves, so it can be shown up to any point.
function tick(): THREE.BufferGeometry {
  const pts: [number, number][] = []
  const [a, b, c] = TICK as [[number, number], [number, number], [number, number]]
  const turn = 3
  const la = Math.hypot(b[0] - a[0], b[1] - a[1])
  const lc = Math.hypot(c[0] - b[0], c[1] - b[1])
  const p1: [number, number] = [b[0] - ((b[0] - a[0]) / la) * turn, b[1] - ((b[1] - a[1]) / la) * turn]
  const p2: [number, number] = [b[0] + ((c[0] - b[0]) / lc) * turn, b[1] + ((c[1] - b[1]) / lc) * turn]
  const line = (from: [number, number], to: [number, number], n: number, first: boolean): void => {
    for (let i = first ? 0 : 1; i <= n; i++) pts.push([from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n])
  }
  line(a, p1, 14, true)
  for (let i = 1; i <= 6; i++) {
    const t = i / 6
    pts.push([(1 - t) * (1 - t) * p1[0] + 2 * t * (1 - t) * b[0] + t * t * p2[0], (1 - t) * (1 - t) * p1[1] + 2 * t * (1 - t) * b[1] + t * t * p2[1]])
  }
  line(p2, c, 26, false)
  const hw = VERIFY.stroke / 2
  const along: number[] = [0]
  for (let i = 1; i < pts.length; i++) along.push(along[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]))
  const total = along[along.length - 1]!
  const pos: number[] = []
  const section = (i: number): [number, number, number][] => {
    const p = pts[i]!
    const before = pts[Math.max(0, i - 1)]!
    const after = pts[Math.min(pts.length - 1, i + 1)]!
    const dx = after[0] - before[0]
    const dy = after[1] - before[1]
    const l = Math.hypot(dx, dy) || 1
    const nx = -dy / l
    const ny = dx / l
    const end = Math.min(along[i]! + hw * 0.25, total - along[i]! + hw * 0.25)
    const k = end >= hw ? 1 : Math.sqrt(Math.max(0.02, 1 - (1 - end / hw) * (1 - end / hw)))
    const w = hw * k
    const lip = Math.min(0.9, w * 0.5)
    // Page y runs down; the object's y runs up, with the box's centre at its origin.
    const at = (o: number, z: number): [number, number, number] => [p[0] + nx * o - 22, 22 - (p[1] + ny * o), z]
    return [at(-w, 0), at(-w + lip, VERIFY.ink), at(w - lip, VERIFY.ink), at(w, 0)]
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const s0 = section(i)
    const s1 = section(i + 1)
    for (let j = 0; j < 3; j++) {
      const p = s0[j]!
      const r = s0[j + 1]!
      const p2b = s1[j]!
      const r2 = s1[j + 1]!
      pos.push(...p, ...r, ...p2b, ...r, ...r2, ...p2b)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  g.userData.slices = pts.length - 1
  return g
}

const kindOf = (s: Shape): string => {
  if (s.id === 'verify-card' || s.id === 'verify-card-open') return 'card'
  if (s.id === 'verify-box') return 'box'
  if (s.id === 'verify-tick') return 'tick'
  if (s.id === 'verify-rule') return 'rule'
  return ''
}

const cardOf = (s: Shape): Shape => ({ ...s, id: 'verify-card', h: stepped(s.h), role: 'card', moved: false })
const ruleOf = (s: Shape): Shape => ({ ...s, w: s.v?.[0] ?? s.w, role: 'rule', moved: false })

export const verifyCard: PartMaker | null = {
  key(s: Shape, ctx: RealContext): string | null {
    if (s.kind === 'text') return null
    switch (kindOf(s)) {
      case 'card': return `verify-${controls.key(cardOf(s), ctx)}`
      case 'box': return `verify-box:${q(s.w)}:${q(s.r ?? 0)}:${s.tone}`
      case 'tick': return 'verify-tick'
      case 'rule': return `verify-rule:${q(s.v?.[0] ?? s.w)}:${q(s.h)}`
      default: return null
    }
  },
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    switch (kindOf(s)) {
      case 'card': return controls.make(cardOf(s), ctx)
      case 'box': return box(s)
      case 'tick': {
        const m = mesh(tick(), materials().inkOnOrange, false)
        m.frustumCulled = false
        return m
      }
      default: return controls.make(ruleOf(s), ctx)
    }
  },
  pose(o: THREE.Object3D, s: Shape): void {
    switch (kindOf(s)) {
      case 'card':
        o.position.y += (s.h - stepped(s.h)) / 2
        break
      case 'box': {
        const t = s.v?.[0] ?? -1
        const cap = o.getObjectByName('cap')
        if (cap) cap.position.z = t >= 0 ? -VERIFY.dip * dipAt(t) : 0
        break
      }
      case 'tick': {
        const m = o as THREE.Mesh
        const slices = m.geometry.userData.slices as number
        const k = Math.min(1, Math.max(0, s.v?.[0] ?? 1))
        m.geometry.setDrawRange(0, Math.round(k * slices) * 18)
        m.position.z += -VERIFY.dip * dipAt(s.v?.[1] ?? 9)
        break
      }
      case 'rule': {
        const full = s.v?.[0] ?? s.w
        o.scale.x = Math.max(0.001, s.w / full)
        break
      }
      default:
        break
    }
  },
  drop(o: THREE.Object3D): void {
    const m = o as THREE.Mesh
    if (m.geometry && m.geometry.userData.slices) m.geometry.dispose()
  }
}

// The cap goes down under the click and springs back with one small bounce.
export function dipAt(t: number): number {
  if (t < 0 || t > 0.5) return 0
  if (t < 0.05) return t / 0.05
  const u = t - 0.05
  return Math.exp(-u * 16) * Math.cos(u * 34)
}

export const TICK_Z = heights.card + VERIFY.capHigh
