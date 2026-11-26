import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { outlineOf, profile, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { look } from '../../../post/look'
import { cardGlass, GLASS, groundEdge, SLAB, slabGeometry } from '../../marketing/real/perk-cards'

const q = (v: number): number => Math.round(v * 4) / 4
const INSET = { thick: 12, face: 1.16, lit: 0.72, away: 1.16, band: 30, small: 0.55 }

function solid(g: THREE.BufferGeometry, cast: boolean): THREE.Mesh {
  const mesh = new THREE.Mesh(g, cardGlass())
  mesh.castShadow = cast
  mesh.receiveShadow = true
  mesh.userData.own = true
  return mesh
}

// The panel is the careers page's slab of pale glass, lying on the page: the light and shade of its ground edge are in the slab,
// and the shadow on the page is thrown by the printed foot inside it alone.
export function panelOf(s: Shape): THREE.Object3D {
  const thick = s.z1 - s.z0
  const root = new THREE.Group()
  const glass = solid(slabGeometry(s, thick), false)
  glass.position.z = thick / 2
  const foot = solid(sweep(outlineOf(s, SLAB.frame + 0.6, 8), profile([[0, 0, true], [0, Math.min(GLASS.caster, thick * 0.4), true]])), true)
  foot.name = 'foot'
  root.add(glass, foot)
  return root
}

export const panelKey = (s: Shape): string => `panel:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`

export function panelDrop(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh && m.userData.own) m.geometry.dispose()
  })
}

// The flat face inside a slab's ground edge, a little lighter than the panel under it: two thicknesses of glass gather more light than one.
function faceOf(s: Shape, z: number): THREE.BufferGeometry {
  const o = outlineOf(s, SLAB.frame, 14)
  const d = groundEdge(s) - SLAB.frame
  const n = o.count
  const [kx, ky] = look.key.direction
  const flat = Math.hypot(kx, ky) || 1
  let wide = 0
  let tall = 0
  for (let i = 0; i < n; i++) {
    wide = Math.max(wide, o.x[i]!)
    tall = Math.max(tall, o.y[i]!)
  }
  const pos: number[] = []
  const nor: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const reach = Math.min(wide, tall) - d - 1
  const rings: [number, number][] = [[0, 0], [Math.min(INSET.band, reach * 0.5), 1], [reach, 1]]
  for (const [more, t] of rings) {
    for (let i = 0; i < n; i++) {
      const side = (o.nx[i]! * kx + o.ny[i]! * ky) / flat
      const edge = side > 0 ? 1 + side * (INSET.lit - 1) : 1 - side * (INSET.away - 1)
      const v = edge + (INSET.face - edge) * t
      const at = d + more
      pos.push(Math.max(-(wide - at), Math.min(wide - at, o.x[i]! - at * o.nx[i]!)), Math.max(-(tall - at), Math.min(tall - at, o.y[i]! - at * o.ny[i]!)), z)
      nor.push(0, 0, 1)
      col.push(v, v, v)
    }
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(r * n + i, r * n + j, (r + 1) * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i)
    }
  }
  const last = (rings.length - 1) * n
  pos.push(0, 0, z)
  nor.push(0, 0, 1)
  col.push(INSET.face, INSET.face, INSET.face)
  for (let i = 0; i < n; i++) idx.push(rings.length * n, last + i, last + ((i + 1) % n))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// A readout is a smaller slab of the same glass let into the panel, standing a little proud of its face.
// It is cut at a larger size and set down smaller, so its ground edge is as narrow as a small piece of glass has it.
function readoutOf(s: Shape): THREE.Object3D {
  const root = new THREE.Group()
  const top = s.z1 - s.z0
  const k = INSET.small
  const cut: Shape = { ...s, w: s.w / k, h: s.h / k, r: (s.r ?? 0) / k }
  const glass = solid(slabGeometry(cut, INSET.thick, true), false)
  glass.position.z = top - INSET.thick / 2
  const small = new THREE.Group()
  small.add(glass, solid(faceOf(cut, top), false))
  small.scale.set(k, k, 1)
  root.add(small)
  return root
}

export const metrics: PartMaker | null = {
  key(s) {
    if (s.kind === 'text') return null
    if (s.role === 'card') return panelKey(s)
    if (s.role === 'readout') return `readout:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
    return null
  },
  make(s) {
    if (s.role === 'card') return panelOf(s)
    return readoutOf(s)
  },
  drop(o) {
    panelDrop(o)
  }
}
