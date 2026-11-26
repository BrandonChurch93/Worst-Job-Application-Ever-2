import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { outlineOf, profile, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { look } from '../../../post/look'
import { cardGlass, GLASS, groundEdge, SLAB, slabGeometry } from '../../marketing/real/perk-cards'

const q = (v: number): number => Math.round(v * 4) / 4
const INSET = { thick: 12, face: 1.16, lit: 0.94, away: 1.16, band: 30, small: 0.55 }

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

// What is painted over the glass: the thin bright rim of a readout's rounded lip, the soft shade where the lip rolls into the face,
// the blue-green of the panel's body, and the faint reflection of the room that lies across the cover over one readout.
const LIP = { rim: 0xf6fbf9, lit: 0.78, away: 0.42, shade: 0x3f4f4b, shadeLit: 0.035, shadeAway: 0.17, tint: 0x7fb5a8, body: 0.13, glare: 0xffffff, glareMost: 0.085 }
let paintMade: THREE.MeshBasicMaterial | null = null
const paint = (): THREE.MeshBasicMaterial => (paintMade ??= new THREE.MeshBasicMaterial({ name: 'metrics-paint', vertexColors: true, transparent: true, depthWrite: false }))

function painted(pos: number[], col: number[], idx: number[]): THREE.Mesh {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  const mesh = new THREE.Mesh(g, paint())
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.userData.own = true
  return mesh
}

const rgb = (hex: number): [number, number, number] => {
  const c = new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
  return [c.r, c.g, c.b]
}

// Bands that follow a shape's outline. Each ring is how far in from the outline and how strong; `lit` and `away` are the strength on the side toward the light and on the far side.
function bandsOf(s: Shape, z: number, rings: [number, number][], hex: number, lit: number, away: number): THREE.Mesh {
  const [kx, ky] = look.key.direction
  const flat = Math.hypot(kx, ky) || 1
  const c = rgb(hex)
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  let n = 0
  rings.forEach(([d, a], r) => {
    const o = outlineOf(s, d, 12)
    n = o.count
    for (let i = 0; i < n; i++) {
      const side = (o.nx[i]! * kx + o.ny[i]! * ky) / flat
      const k = 0.5 + 0.5 * side
      pos.push(o.x[i]!, o.y[i]!, z)
      col.push(c[0], c[1], c[2], a * (away + (lit - away) * k * k * (3 - 2 * k)))
    }
    if (r === 0) return
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push((r - 1) * n + i, (r - 1) * n + j, r * n + i, (r - 1) * n + j, r * n + j, r * n + i)
    }
  })
  return painted(pos, col, idx)
}

function fillOf(s: Shape, inset: number, z: number, hex: number, a: number): THREE.Mesh {
  const c = rgb(hex)
  const pos: number[] = [0, 0, z]
  const col: number[] = [c[0], c[1], c[2], a]
  const idx: number[] = []
  const edge = outlineOf(s, inset, 12)
  const soft = outlineOf(s, inset + 5, 12)
  const n = edge.count
  for (let i = 0; i < n; i++) {
    pos.push(soft.x[i]!, soft.y[i]!, z)
    col.push(c[0], c[1], c[2], a)
  }
  for (let i = 0; i < n; i++) {
    pos.push(edge.x[i]!, edge.y[i]!, z)
    col.push(c[0], c[1], c[2], 0)
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    idx.push(0, 1 + i, 1 + j, 1 + i, 1 + n + i, 1 + j, 1 + j, 1 + n + i, 1 + n + j)
  }
  return painted(pos, col, idx)
}

// A soft band of light leaning across a readout, strongest in its middle and gone at its sides and ends.
function glareOf(s: Shape, z: number): THREE.Mesh {
  const c = rgb(LIP.glare)
  const hw = s.w / 2 - 12
  const hh = s.h / 2 - 10
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const rows = 6
  const across: [number, number][] = [[-0.34, 0], [-0.16, 1], [0.02, 0.55], [0.22, 0]]
  for (let j = 0; j <= rows; j++) {
    const v = j / rows
    const y = hh - v * 2 * hh
    const lean = (0.5 - v) * 0.5
    const end = Math.sin(Math.PI * Math.min(1, Math.max(0, v * 1.1 - 0.05)))
    for (const [u, a] of across) {
      pos.push((u + lean + 0.18) * hw, y, z)
      col.push(c[0], c[1], c[2], LIP.glareMost * a * end)
    }
  }
  const w = across.length
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < w - 1; i++) {
      const a = j * w + i
      idx.push(a, a + w, a + 1, a + 1, a + w, a + w + 1)
    }
  }
  return painted(pos, col, idx)
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
  root.add(bandsOf(s, top + 0.12, [[4, 0], [6.5, 1], [9.5, 0.55], [15, 0]], LIP.shade, LIP.shadeLit, LIP.shadeAway))
  root.add(bandsOf(s, top + 0.16, [[-0.7, 0], [0.2, 1], [1.5, 1], [3.2, 0]], LIP.rim, LIP.lit, LIP.away))
  if (s.id === 'metrics-average') root.add(glareOf(s, top + 0.2))
  return root
}

// The line under the link is printed: flat ink, close under its words, with no height to throw a shade.
const UNDERLINE = { ink: 0x3a3733, soft: 0.5 }
let lineMade: THREE.MeshBasicMaterial | null = null

function underlineOf(s: Shape): THREE.Object3D {
  const m = (lineMade ??= new THREE.MeshBasicMaterial({ name: 'share-underline', color: new THREE.Color().setHex(UNDERLINE.ink, THREE.SRGBColorSpace), vertexColors: true, transparent: true, depthWrite: false }))
  const hw = s.w / 2
  const hh = s.h / 2
  const f = UNDERLINE.soft
  const pos: number[] = []
  const col: number[] = []
  for (const [y, a] of [[hh + f, 0], [hh - f, 1], [-hh + f, 1], [-hh - f, 0]] as [number, number][]) {
    pos.push(-hw, y, 0.02, hw, y, 0.02)
    col.push(1, 1, 1, a, 1, 1, 1, a)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5, 4, 6, 5, 5, 6, 7])
  const mesh = new THREE.Mesh(g, m)
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.userData.own = true
  return mesh
}

export const metrics: PartMaker | null = {
  key(s) {
    if (s.kind === 'text') return null
    if (s.role === 'underline') return `underline:${q(s.w)}:${q(s.h)}`
    if (s.role === 'card') return panelKey(s)
    if (s.role === 'readout') return `readout:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}:${s.id === 'metrics-average' ? 'lit' : 'plain'}`
    return null
  },
  make(s) {
    if (s.role === 'card') {
      const root = panelOf(s)
      root.add(fillOf(s, groundEdge(s) - 4, s.z1 - s.z0 + 0.1, LIP.tint, LIP.body))
      return root
    }
    if (s.role === 'underline') return underlineOf(s)
    return readoutOf(s)
  },
  drop(o) {
    panelDrop(o)
  }
}
