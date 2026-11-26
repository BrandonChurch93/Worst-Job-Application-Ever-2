import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import { arc, circle, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { contact, dims, disc, flange, leaf, leaned, mesh, pressed, q, scattered, shared, sheen, srgb } from './careers-solids'
import { BRUSHED, brushedPicture } from './medal-picture'
import { engraved, restingSlab, slabKey } from './perk-cards'

export const MEDAL_LOOK = { lobes: 30, deep: 9, toward: 2.4, side: 0.5, wall: 3.4, wallSide: 0.8, under: [[-2.5, 0.94], [0, 0.94], [1.5, 0.86], [4, 0.6], [8, 0.3], [13, 0.09], [18, 0]] as [number, number][], underTurn: 1.5, band: 141, ring: 138, face: 130.5, wreath: 119, leaves: 12, leaf: [27, 11.5, 2.6] as const, sheen: 0.62, axis: 2.55, rim: 1.02, lean: 0.6, cap: 0.26, capFrom: 0.6, narrow: 3.2, bow: [2.9, 0.5] as [number, number], lip: [2.6, 2.3] as [number, number], ridge: 1.7, groove: 0.5, pressed: [0.9, 0.32, 1.35] as [number, number, number] }


let faceMade: THREE.MeshPhysicalMaterial | null = null

// The medal's face: the shared turned aluminium's own pictures on a paler, softer metal, as a struck medal is beside a machined knob.
function medalFace(): THREE.MeshPhysicalMaterial {
  if (!faceMade) {
    const turned = materials().aluminiumTurned
    faceMade = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x919395).multiplyScalar(1 / BRUSHED.level), map: brushedPicture(), roughness: 0.5, metalness: 0.88, vertexColors: true, normalMap: turned.normalMap, normalScale: new THREE.Vector2(0.02, 0.02), anisotropy: 0.45, anisotropyMap: turned.anisotropyMap }))
  }
  return faceMade
}

let metalMade: THREE.MeshPhysicalMaterial | null = null

// The medal's rim, ring and leaves: the same metal as its face, left as it was struck.
function medalMetal(): THREE.MeshPhysicalMaterial {
  if (!metalMade) metalMade = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x8e8f8e).multiplyScalar(1 / BRUSHED.level), map: brushedPicture(), roughness: 0.42, metalness: 0.9, vertexColors: true }))
  return metalMade
}

let underMade: THREE.MeshPhysicalMaterial | null = null

// The dark under the medal's far edge, where no light gets between it and the page.
const underDark = (): THREE.MeshPhysicalMaterial =>
  (underMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x2b2824), roughness: 1, metalness: 0, specularIntensity: 0, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })))

// The face of a turned part: its pictures lie across the whole disc once.
function discUv(g: THREE.BufferGeometry, d: number): THREE.BufferGeometry {
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / d + 0.5, uv.getY(i) / d + 0.5)
  return g
}

let leafMade: THREE.MeshPhysicalMaterial | null = null

// The wreath: pressed into the face, so it is the face's own darker metal.
const leafMetal = (): THREE.MeshPhysicalMaterial => (leafMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x9a9b9c), roughness: 0.46, metalness: 0.9, vertexColors: true })))

// A medal struck from aluminium: a scalloped rim, a band, a ring cut with two grooves, a turned face and a wreath pressed into it.
// Its face lies at the shape's height, where the type is laid. The rim and the ring stand a little above it.
function medallion(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const h = s.z1 - s.z0
  const k = s.w / 324
  const L = MEDAL_LOOK
  const r = s.w / 2
  const rimTop = h + 0.6
  const rim = [{ d: -L.wall, z: 0 }, { d: -L.wall + 0.5, z: 1 }, { d: -0.7, z: rimTop - 2.6 }, { d: 0, z: rimTop - 1.5 }, { d: 0.9, z: rimTop - 0.6 }, { d: 2.2, z: rimTop - 0.15 }, { d: 3.8, z: rimTop }, { t: 0.5, z: rimTop - 0.25 }, { t: 0.92, z: rimTop - 0.35 }, { t: 1, z: rimTop - 1.2 }, { t: 1.04, z: h - 2 }]
  root.add(mesh(shared(`medalRim:${q(s.w)}:${q(h)}`, () => leaned(flange(r, L.lobes, L.deep * k, L.band * k, rim), L.toward, L.side, s.w, [rimTop - 1.2, L.wallSide], L.bow, (z, facing) => (z > rimTop - 1.6 && z < rimTop - 0.1 ? (L.lip[1] + (L.lip[0] - L.lip[1]) * (0.5 + 0.5 * facing)) / Math.max(0.2, 1 + L.side * facing) : 1))), medalMetal()))
  root.add(mesh(shared(`medalUnder:${q(s.w)}`, () => contact(r, L.lobes, L.deep * k, L.toward, L.under, L.underTurn)), underDark(), false, false))
  const band = L.band * k
  const ring = L.ring * k
  const face = L.face * k
  const b = (radius: number): number => band - radius
  const body: ProfilePoint[] = [
    [b(band), h - 2.4, true], [b(band), h - 1.3, true], [b(ring + 0.4), h - 1.3, true],
    [b(ring), h - 0.6], [b(ring - 0.8), h + 1.0], [b(ring - 2.0), h + 1.0], [b(ring - 2.5), h + 0.2], [b(ring - 2.9), h - 0.8, true],
    [b(ring - 3.6), h - 0.8, true], [b(ring - 4.0), h + 0.2], [b(ring - 4.4), h + 0.8], [b(ring - 5.4), h + 0.8], [b(ring - 5.9), h + 0.3], [b(face + 1.2), h - 0.6, true], [b(face + 0.5), h - 0.6, true], [b(face), h, true]
  ]
  root.add(mesh(shared(`medalBody:${q(s.w)}:${q(h)}`, () => leaned(sweep(circle(band, 144), profile(body), false), L.toward, L.side, s.w, [-1, 0], L.bow, (z) => (z > h + 0.7 ? L.ridge : z < h - 0.7 ? L.groove : 1))), medalMetal()))
  root.add(mesh(shared(`medalFace:${q(s.w)}:${q(h)}`, () => sheen(discUv(disc(face + 0.2, h), s.w), L.axis, L.sheen, L.rim, L.lean, L.cap, L.capFrom, L.narrow)), medalFace(), false))
  const wreath = shared(`medalWreath:${q(s.w)}:${q(h)}`, () => {
    const one = leaf(L.leaf[0] * k, L.leaf[1] * k, L.leaf[2])
    const places: { x: number; y: number; z: number; turn: number }[] = []
    for (const side of [-1, 1]) {
      for (let i = 0; i < L.leaves; i++) {
        const a = ((20 + (i * 138) / (L.leaves - 1)) * Math.PI) / 180
        const x = side * Math.sin(a) * L.wreath * k
        const y = -Math.cos(a) * L.wreath * k
        const along = Math.atan2(Math.sin(a), side * Math.cos(a))
        places.push({ x, y, z: h + 0.06, turn: along - side * 0.55 })
      }
    }
    const g = pressed(scattered(one, places), L.toward, L.pressed[0], L.pressed[1], L.pressed[2])
    one.dispose()
    return g
  })
  root.add(mesh(wreath, leafMetal(), false))
  return root
}

let printMade: THREE.MeshPhysicalMaterial | null = null
let blackMade: THREE.MeshPhysicalMaterial | null = null
let tapeMade: THREE.MeshPhysicalMaterial | null = null

const print = (): THREE.MeshPhysicalMaterial => (printMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xe9e6df), roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 })))
const black = (): THREE.MeshPhysicalMaterial => (blackMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x232527), roughness: 0.66, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.34, specularIntensity: 0.4 })))
const marker = (): THREE.MeshPhysicalMaterial => (tapeMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1c1d1f), roughness: 0.7, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.45, specularIntensity: 0.42 })))

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
