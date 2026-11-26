import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { block } from '../../../shell/metrics'
import { setRun, type Style } from '../../../shell/real/type'
import { arc, outlineOf, profile, roundedRect, sweep, type ProfilePoint } from '../../../shell/solids'
import { words } from '../../../shell/words'
import type { Shape } from '../../../stage/types'
import { markOf } from '../layout'
import { studio } from '../../../post/studio'
import { INK, ink } from './stampInk'

const q = (v: number): number => Math.round(v * 4) / 4
const WHITE: [number, number, number] = [1, 1, 1]
const PRINT: Style = { setting: 'flat', fill: WHITE, lean: 0, rings: [{ d: 0.55, a: 0.7, c: WHITE }] }
const FRAME = { r: 12, inner: 12, thin: 2.6, feather: 0.7 }
const PAD = { out: 1.6, tall: 5, gap: 1.6 }

let lacquerMade: THREE.MeshPhysicalMaterial | null = null
function lacquer(): THREE.MeshPhysicalMaterial {
  lacquerMade ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0xa8140f, THREE.SRGBColorSpace), roughness: 0.38, metalness: 0, specularIntensity: 0.45, clearcoat: 1, clearcoatRoughness: 0.07 }))
  lacquerMade.name = 'stamp-lacquer'
  return lacquerMade
}

function solid(g: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(g, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

function blockOf(s: Shape): THREE.Object3D {
  const m = materials()
  const h = s.z1 - s.z0
  const root = new THREE.Group()
  const half = Math.min(s.w, s.h) / 2
  const pad: ProfilePoint[] = [[-PAD.out + 0.8, 0.2, true], [-PAD.out, 1], [-PAD.out, PAD.tall - 1], [-PAD.out + 1, PAD.tall], [2.4, PAD.tall, true], [2.4, PAD.tall + PAD.gap, true]]
  root.add(solid(sweep(outlineOf(s, 0, 12), profile(pad), false), m.rubber))
  const round = 12
  const top = h - 0.7
  const body: ProfilePoint[] = [[1.6, PAD.tall + PAD.gap - 0.4, true], [0.2, PAD.tall + PAD.gap + 1.2], [0, PAD.tall + PAD.gap + 3], [0, top - round], ...arc(0, top - round, round, round, 12).slice(1), ...[0.8, 0.55, 0.3, 0.06].map((t): ProfilePoint => [half - (half - round) * t, top + 0.7 * (1 - t * t)])]
  root.add(solid(sweep(outlineOf(s, 0, 12), profile(body)), lacquer()))
  return root
}

function gripOf(s: Shape): THREE.Object3D {
  const h = s.z1 - s.z0
  const half = Math.min(s.w, s.h) / 2
  const neck = Math.min(9, half * 0.3)
  const dome = Math.min(13, half - 3)
  const top = h - 1
  const points: ProfilePoint[] = [
    [-2.5, 0, true], [-2.5, 2.2], [-1.2, 3.6], [neck * 0.55, 5.5], [neck, 10], [neck, h * 0.42], [neck * 0.5, h * 0.55], [1.5, h * 0.64], [1, top - dome],
    ...arc(1, top - dome, dome, dome, 12).slice(1),
    ...[0.8, 0.55, 0.3, 0.06].map((t): ProfilePoint => [half - (half - dome - 1) * t, top + 1 * (1 - t * t)])
  ]
  return solid(sweep(outlineOf(s, 0, 20), profile(points)), lacquer())
}

function inked(position: ArrayLike<number>, colour: ArrayLike<number>, index: ArrayLike<number>, w: number, h: number, ox: number, oy: number): THREE.BufferGeometry {
  const n = position.length / 3
  const uv = new Float32Array(n * 2)
  const nor = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    uv[i * 2] = (position[i * 3]! + ox) / (w + INK.pad * 2) + 0.5
    uv[i * 2 + 1] = (position[i * 3 + 1]! + oy) / (h + INK.pad * 2) + 0.5
    nor[i * 3 + 2] = 1
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(position), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(colour), 4))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(Array.from(index))
  return g
}

function print(g: THREE.BufferGeometry): THREE.Mesh {
  const mesh = new THREE.Mesh(g, ink().material)
  mesh.position.z = 0.07
  mesh.receiveShadow = true
  mesh.castShadow = false
  return mesh
}

// The border the rubber leaves: a heavy line and a fine one inside it, both with soft edges.
function frameOf(): THREE.Mesh {
  const m = markOf()
  const per = 8
  const n = (per + 1) * 4
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const f = FRAME.feather
  const bands: [number, number][] = [[0, m.bar], [FRAME.inner, FRAME.inner + FRAME.thin]]
  for (const [from, to] of bands) {
    const base = pos.length / 3
    const rings: [number, number][] = [[from - f, 0], [from + f, 1], [to - f, 1], [to + f, 0]]
    for (const [inset, a] of rings) {
      const o = roundedRect(m.w - inset * 2, m.h - inset * 2, Math.max(1, FRAME.r - inset), per)
      for (let i = 0; i < n; i++) {
        pos.push(o.x[i]!, o.y[i]!, 0)
        col.push(1, 1, 1, a)
      }
    }
    for (let k = 0; k < rings.length - 1; k++) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        idx.push(base + k * n + i, base + k * n + j, base + (k + 1) * n + i, base + k * n + j, base + (k + 1) * n + j, base + (k + 1) * n + i)
      }
    }
  }
  const lift = (m.h - m.bar) / 2
  const g = inked(pos, col, idx, m.w, m.h, 0, 0)
  g.translate(0, -lift, 0)
  return print(g)
}

function wordOf(s: Shape): THREE.Mesh {
  const m = markOf()
  const t = s.type!
  const said = words(s.words!, s.text)
  const b = block(t.font, said, t.px, t.wrap, t.lead)
  const data = setRun({ font: t.font, px: t.px, lines: b.lines, align: t.align ?? 'left', x: 0, y: s.h / 2 - b.cap, lead: b.lead, style: PRINT })
  const pos = Float32Array.from(data.position)
  for (let i = 2; i < pos.length; i += 3) pos[i] = 0
  return print(inked(pos, data.colour, data.index, m.w, m.h, 0, 0))
}

export const stamp: PartMaker | null = {
  key(s) {
    if (s.id === 'letter-stamp') return `word:${s.type!.font}:${s.type!.px}:${q(s.w)}:${q(s.h)}:${words(s.words!, s.text)}`
    if (s.kind === 'text') return null
    if (s.id === 'letter-mark-top') return `frame:${q(s.w)}:${q(s.h)}`
    if (s.id.startsWith('letter-mark-')) return ''
    if (s.role === 'stampBlock') return `block:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
    if (s.role === 'stampGrip') return `grip:${q(s.w)}:${q(s.h)}:${q(s.z1 - s.z0)}`
    return null
  },
  make(s) {
    if (s.id === 'letter-stamp') return wordOf(s)
    if (s.id === 'letter-mark-top') return frameOf()
    if (s.role === 'stampGrip') return gripOf(s)
    return blockOf(s)
  },
  drop(o) {
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (m.isMesh) m.geometry.dispose()
    })
  }
}
