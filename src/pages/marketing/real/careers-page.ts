import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import { arc, circle, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { dims, leaf, mesh, q, scalloped, scattered, shared, srgb } from './careers-solids'
import { engraved, restingSlab, slabKey } from './perk-cards'

export const MEDAL_LOOK = { lobes: 28, deep: 10, rim: 9.2, band: 150, ring: 145, face: 134, wreath: 119, leaves: 11, leaf: [30, 11, 1.6] as const }

let faceMade: THREE.MeshPhysicalMaterial | null = null

// The medal's face: the shared turned aluminium's own pictures on a paler, softer metal, as a struck medal is beside a machined knob.
function medalFace(): THREE.MeshPhysicalMaterial {
  if (!faceMade) {
    const turned = materials().aluminiumTurned
    faceMade = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x8a8d8f), roughness: 0.5, metalness: 0.88, normalMap: turned.normalMap, normalScale: new THREE.Vector2(0.06, 0.06), anisotropy: 0.45, anisotropyMap: turned.anisotropyMap }))
  }
  return faceMade
}

let metalMade: THREE.MeshPhysicalMaterial | null = null

// The medal's rim, ring and leaves: the same metal as its face, left as it was struck.
function medalMetal(): THREE.MeshPhysicalMaterial {
  if (!metalMade) metalMade = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x96989a), roughness: 0.46, metalness: 0.88 }))
  return metalMade
}

// The face of a turned part: its pictures lie across the whole disc once.
function discUv(g: THREE.BufferGeometry, d: number): THREE.BufferGeometry {
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / d + 0.5, uv.getY(i) / d + 0.5)
  return g
}

// A medal struck from aluminium: a scalloped rim, a band, a ring cut with two grooves, a turned face and a wreath pressed into it.
// Its face lies at the shape's height, where the type is laid. The rim and the ring stand a little above it.
function medallion(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const h = s.z1 - s.z0
  const k = s.w / 324
  const L = MEDAL_LOOK
  const r = s.w / 2
  const rimTop = h + 1.4
  const rim: ProfilePoint[] = [[0.9, 0, true], [0, 0.9, true], [0, rimTop - 3.2], ...arc(0, rimTop - 3.2, 3.4 * k, 3.2, 8).slice(1), [5.2 * k, rimTop - 0.5], [7.4 * k, rimTop - 2.6], [9.5 * k, rimTop - 3, true]]
  root.add(mesh(shared(`medalRim:${q(s.w)}:${q(h)}`, () => sweep(scalloped(r, L.lobes, L.deep * k), profile(rim), false)), medalMetal()))
  const band = L.band * k
  const ring = L.ring * k
  const face = L.face * k
  const b = (radius: number): number => band - radius
  const body: ProfilePoint[] = [
    [b(band), h - 2.4, true], [b(band), h - 1.3, true], [b(ring + 0.4), h - 1.3, true],
    [b(ring), h - 0.6], [b(ring - 1.1), h + 1.1], [b(ring - 3.1), h + 1.1], [b(ring - 3.7), h + 0.2], [b(ring - 4.2), h - 0.9, true],
    [b(ring - 5.1), h - 0.9, true], [b(ring - 5.6), h + 0.2], [b(ring - 6.2), h + 0.9], [b(ring - 8.0), h + 0.9], [b(ring - 8.7), h + 0.3], [b(face + 1.4), h - 0.7, true], [b(face + 0.5), h - 0.7, true], [b(face), h, true]
  ]
  root.add(mesh(shared(`medalBody:${q(s.w)}:${q(h)}`, () => sweep(circle(band, 144), profile(body), false)), medalMetal()))
  root.add(mesh(shared(`medalFace:${q(s.w)}:${q(h)}`, () => discUv(sweep(circle(face + 0.2, 144), [{ inset: 0, z: h, out: 0, up: 1 }]), face * 2)), medalFace(), false))
  const wreath = shared(`medalWreath:${q(s.w)}:${q(h)}`, () => {
    const one = leaf(L.leaf[0] * k, L.leaf[1] * k, L.leaf[2])
    const places: { x: number; y: number; z: number; turn: number }[] = []
    for (const side of [-1, 1]) {
      for (let i = 0; i < L.leaves; i++) {
        const a = ((19 + (i * 142) / (L.leaves - 1)) * Math.PI) / 180
        const x = side * Math.sin(a) * L.wreath * k
        const y = -Math.cos(a) * L.wreath * k
        const along = Math.atan2(Math.sin(a), side * Math.cos(a))
        places.push({ x, y, z: h - 0.05, turn: along - side * 0.55 })
      }
    }
    const g = scattered(one, places)
    one.dispose()
    return g
  })
  root.add(mesh(wreath, medalMetal(), false))
  return root
}

let printMade: THREE.MeshPhysicalMaterial | null = null
let blackMade: THREE.MeshPhysicalMaterial | null = null
let tapeMade: THREE.MeshPhysicalMaterial | null = null

const print = (): THREE.MeshPhysicalMaterial => (printMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xe9e6df), roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 })))
const black = (): THREE.MeshPhysicalMaterial => (blackMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x202124), roughness: 0.78, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, specularIntensity: 0.3 })))
const marker = (): THREE.MeshPhysicalMaterial => (tapeMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1d1d1e), roughness: 0.82, metalness: 0, specularIntensity: 0.35 })))

// A photograph for a staff badge: a print with a white border, its picture blacked out.
function photo(s: Shape): THREE.Object3D {
  const root = new THREE.Group()
  const h = Math.max(0.6, s.z1 - s.z0)
  root.add(mesh(shared(`photoPrint:${dims(s)}`, () => sweep(outlineOf(s, 0, 8), profile([[0, 0, true], [0, h - 0.3], [0.3, h, true]]))), print()))
  const inner = { kind: 'box', w: s.w - 12, h: s.h - 12, r: 3 }
  const picture = mesh(shared(`photoBlack:${dims(s)}`, () => sweep(outlineOf(inner, 0, 6), [{ inset: 0, z: h + 0.05, out: 0, up: 1 }])), black(), false)
  root.add(picture)
  return root
}

// A name struck out: a strip of matt black tape laid over it.
function redaction(s: Shape): THREE.Object3D {
  const h = Math.max(0.5, s.z1 - s.z0)
  return mesh(shared(`redact:${dims(s)}`, () => sweep(outlineOf({ kind: 'box', w: s.w, h: s.h, r: 1.6 }, 0, 4), profile([[0, 0, true], [0, h - 0.3], [0.3, h, true]]))), marker())
}

export const careersPage: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text' || s.kind === 'well' || s.kind === 'anchor') return null
    if (s.role === 'medallion') return `medal:${q(s.w)}:${q(s.z1 - s.z0)}`
    if (s.role === 'badgePhoto') return `photo:${dims(s)}`
    if (s.role === 'redaction') return `redact:${dims(s)}`
    if (s.role === 'cardRule') return `tableRule:${q(s.w)}x${q(s.h)}`
    if (s.role === 'card') return slabKey(s)
    return controls.key(s, ctx)
  },
  make(s, ctx) {
    if (s.role === 'medallion') return medallion(s)
    if (s.role === 'badgePhoto') return photo(s)
    if (s.role === 'redaction') return redaction(s)
    if (s.role === 'cardRule') return engraved(s)
    if (s.role === 'card') return restingSlab(s)
    return controls.make(s, ctx)
  }
}
