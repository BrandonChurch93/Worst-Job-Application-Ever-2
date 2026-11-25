import * as THREE from 'three'
import { config } from '../../../config'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { grainNormalMap } from '../../../shell/materials'
import { roundedRect } from '../../../shell/solids'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
const q = (v: number): number => Math.round(v * 4) / 4

let redMade: THREE.MeshPhysicalMaterial | null = null
let underMade: THREE.MeshPhysicalMaterial | null = null

// Red is kept for things that hurt. This is the slabs' own red, its numbers are in the notes for whoever needs the same.
export function red(): THREE.MeshPhysicalMaterial {
  if (!redMade) {
    const grain = grainNormalMap(256, config.seed + 71, 1.6)
    grain.repeat.set(1 / 90, 1 / 90)
    redMade = studio(
      new THREE.MeshPhysicalMaterial({
        color: srgb(0xa00d0b),
        roughness: 0.46,
        metalness: 0,
        specularIntensity: 0.4,
        clearcoat: 1,
        clearcoatRoughness: 0.09,
        clearcoatNormalMap: grain,
        clearcoatNormalScale: new THREE.Vector2(0.035, 0.035),
        envMapIntensity: 1.05
      })
    )
  }
  return redMade
}

function under(): THREE.MeshPhysicalMaterial {
  underMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x4a0f0c), roughness: 0.7, metalness: 0, envMapIntensity: 0.3 }))
  return underMade
}

interface Ring { inset: number; z: number }

// A closed plate: a foot chamfer that leaves a dark line at the contact, a wall, a broad soft shoulder,
// and a face that crowns by a hair so the studio's box of light slides across it.
function plate(w: number, h: number, r: number, depth: number, bevel: number, foot: number, crown: number): { body: THREE.BufferGeometry; base: THREE.BufferGeometry } {
  const rings: Ring[] = [{ inset: foot, z: 0 }, { inset: 0, z: foot }, { inset: 0, z: depth - bevel }]
  const steps = 12
  const top = depth - crown
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    rings.push({ inset: bevel * (1 - Math.pow(Math.cos(a), 0.85)), z: top - bevel + bevel * Math.pow(Math.sin(a), 0.85) })
  }
  const half = Math.min(w, h) / 2
  for (const f of [0.12, 0.3, 0.55, 0.8, 0.95]) rings.push({ inset: bevel + f * (half - bevel), z: top + crown * (1 - (1 - f) * (1 - f)) })
  const per = 10
  const n = (per + 1) * 4
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (const ring of rings) {
    const o = roundedRect(w - 2 * ring.inset, h - 2 * ring.inset, Math.max(0.4, r - ring.inset), per)
    for (let i = 0; i < n; i++) {
      pos.push(o.x[i]!, o.y[i]!, ring.z)
      uv.push(o.x[i]!, o.y[i]!)
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(k * n + i, k * n + j, (k + 1) * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i)
    }
  }
  const last = (rings.length - 1) * n
  const centre = pos.length / 3
  pos.push(0, 0, depth)
  uv.push(0, 0)
  for (let i = 0; i < n; i++) idx.push(centre, last + i, last + ((i + 1) % n))
  const body = new THREE.BufferGeometry()
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  body.setIndex(idx)
  body.computeVertexNormals()
  const outer = roundedRect(w - 2 * foot, h - 2 * foot, Math.max(0.4, r - foot), per)
  const shape = new THREE.Shape()
  for (let i = 0; i < n; i++) {
    if (i === 0) shape.moveTo(outer.x[i]!, outer.y[i]!)
    else shape.lineTo(outer.x[i]!, outer.y[i]!)
  }
  shape.closePath()
  const base = new THREE.ShapeGeometry(shape)
  base.rotateX(Math.PI)
  return { body, base }
}

const cache = new Map<string, { body: THREE.BufferGeometry; base: THREE.BufferGeometry }>()

export function slabGeometry(w: number, h: number, r: number, depth: number): { body: THREE.BufferGeometry; base: THREE.BufferGeometry } {
  const key = `${q(w)}:${q(h)}:${q(r)}:${q(depth)}`
  let g = cache.get(key)
  if (!g) {
    const bevel = Math.min(depth * 0.42, Math.min(w, h) * 0.16)
    g = plate(w, h, Math.max(r, bevel + 2), depth, bevel, Math.min(1.2, depth * 0.08), Math.min(0.6, depth * 0.04))
    cache.set(key, g)
  }
  return g
}

// A block by its size: the boss throws the same slab.
export function makeSlab(w: number, h: number, r: number, depth: number): THREE.Group {
  const g = slabGeometry(w, h, r, depth)
  const group = new THREE.Group()
  const body = new THREE.Mesh(g.body, red())
  body.castShadow = true
  body.frustumCulled = false
  body.receiveShadow = true
  const base = new THREE.Mesh(g.base, under())
  base.castShadow = true
  base.frustumCulled = false
  group.add(body, base)
  return group
}

export const slabs: PartMaker | null = {
  key(s) {
    if (s.kind === 'text') return null
    return `slab:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
  },
  make(s) {
    return makeSlab(s.w, s.h, s.r ?? 0, s.z1 - s.z0)
  },
  pose(o, s) {
    // The landing rings through the block for a moment: a slow rock on its long axis that dies fast with the impact the
    // page reports. Its label is laid flat by the type maker at the face's resting height, so the block sinks by as much
    // as its highest edge would rise: no part of the face ever comes up through the label.
    const hit = s.v && s.v.length > 1 ? s.v[1]! : 0
    const t = s.v && s.v.length > 0 ? s.v[0]! : 0
    const ring = hit * hit
    const rx = ring * 0.028 * Math.cos(t * 52)
    const ry = ring * 0.007 * Math.sin(t * 41)
    o.rotation.x += rx
    o.rotation.y += ry
    o.position.z -= Math.abs(Math.sin(rx)) * (s.h / 2) + Math.abs(Math.sin(ry)) * (s.w / 2)
  }
}
