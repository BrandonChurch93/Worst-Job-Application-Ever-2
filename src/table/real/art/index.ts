import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { grainNormalMap } from '../../../shell/materials'
import { BALL } from '../../layout'
import { ask } from '../assets'
import { lit } from '../light'
import { localBalls, whole, type Zone } from '../zone'
import { INSERT_GLOW, insertCell, insertsOf } from './inserts'

const TIER_NAMES = ['corporate', 'office', 'street'] as const
const floors = TIER_NAMES.map((id) => ask(`table/art/${id}.webp`, { colour: true }))
const masks = TIER_NAMES.map((id) => ask(`table/art/${id}-mask.png`, { colour: false }))
const coats = TIER_NAMES.map((id) => ask(`table/art/${id}-coat.png`, { colour: false }))
const lens = ask('table/art/inserts-lens.webp', { colour: true })
const glow = ask('table/art/inserts-glow.webp', { colour: true })
const relief = ask('table/art/inserts-relief.png', { colour: false })
const pictures = [...floors, ...masks, ...coats, lens, glow, relief]

// The plate of a tier: its top face half a pixel above the zone's floor, the whole width of the page.
const PLATE = { w: 1920, h: 1080, z: 0.5 }
// The ink has no shine of its own: its face meets the lacquer, not the air, so only the coat and the leaf reflect.
// What the print lies under: a hard clear coat, a little rougher where the coat map says the ball has run, with the orange peel of a sprayed lacquer. Where the coat map says leaf, the print is metal.
const COAT = [
  { roughness: 0.48, leaf: true, coat: 0.7, peel: 0.045, specular: 0 },
  { roughness: 0.95, leaf: false, coat: 0.7, peel: 0.05, specular: 0 },
  { roughness: 0.92, leaf: false, coat: 0.7, peel: 0.05, specular: 0 }
]
const WINDOW = { lift: 0.35, bump: 2.2, segments: 56, inset: 0.975 }

let peel: THREE.DataTexture | null = null
function peelMap(): THREE.DataTexture {
  if (!peel) {
    peel = grainNormalMap(512, 4107, 0.5)
    peel.repeat.set(14, 14 * (PLATE.h / PLATE.w))
    peel.name = 'tier-art.peel'
  }
  return peel
}

function plate(z: Zone): THREE.Mesh {
  const c = COAT[z.tier]!
  const material = lit(
    studio(
      new THREE.MeshPhysicalMaterial({
        map: floors[z.tier]!.texture(),
        roughness: c.roughness,
        metalness: c.leaf ? 1 : 0,
        metalnessMap: c.leaf ? coats[z.tier]!.texture() : null,
        clearcoat: c.coat,
        clearcoatRoughness: 1,
        clearcoatRoughnessMap: coats[z.tier]!.texture(),
        clearcoatNormalMap: peelMap(),
        clearcoatNormalScale: new THREE.Vector2(c.peel, c.peel),
        specularIntensity: c.specular
      })
    ),
    z
  )
  material.name = `tier-art.${z.id}`
  material.userData.coverage = 'floor'
  material.userData.coverageMap = masks[z.tier]!.texture()
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLATE.w, PLATE.h), material)
  mesh.position.z = PLATE.z
  mesh.name = `tier-art.floor.${z.id}`
  mesh.userData.coverage = 'floor'
  mesh.userData.coverageMap = masks[z.tier]!.texture()
  mesh.receiveShadow = true
  return mesh
}

function windowOf(z: Zone, n: ReturnType<typeof insertsOf>[number]): THREE.Mesh {
  const g = new THREE.CircleGeometry(n.r * BALL, WINDOW.segments)
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  const [col, row] = insertCell(n)
  for (let i = 0; i < uv.count; i++) {
    const u = 0.5 + (uv.getX(i) - 0.5) * WINDOW.inset
    const v = 0.5 + (uv.getY(i) - 0.5) * WINDOW.inset
    uv.setXY(i, (col + u) / 3, 1 - (row + 1 - v) / 3)
  }
  const material = lit(
    studio(
      new THREE.MeshPhysicalMaterial({
        map: lens.texture(),
        emissive: 0xffffff,
        emissiveMap: glow.texture(),
        emissiveIntensity: INSERT_GLOW.off,
        bumpMap: relief.texture(),
        bumpScale: WINDOW.bump,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    ),
    z
  )
  material.name = `tier-art.window.${n.id}`
  const mesh = new THREE.Mesh(g, material)
  const [x, y] = localBalls(z, n.c[0], n.c[1])
  mesh.position.set(x, y, PLATE.z + WINDOW.lift)
  mesh.name = `insert.${n.id}`
  mesh.userData.insert = n.id
  mesh.userData.coverage = 'mark'
  mesh.receiveShadow = true
  return mesh
}

function build(z: Zone): THREE.Object3D {
  const o = new THREE.Group()
  o.name = `tier-art.${z.id}`
  o.add(plate(z))
  for (const n of insertsOf(z.tier)) o.add(windowOf(z, n))
  return o
}

function pose(o: THREE.Object3D, _z: Zone, ctx: RealContext): void {
  for (const c of o.children) {
    const id = c.userData.insert as string | undefined
    if (!id) continue
    const on = ctx.byId.get(`insert.${id}`)?.v?.[0] ?? 0
    const m = (c as THREE.Mesh).material as THREE.MeshPhysicalMaterial
    m.emissiveIntensity = INSERT_GLOW.off + (INSERT_GLOW.on - INSERT_GLOW.off) * on
  }
}

function drop(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (!m.isMesh) return
    m.geometry.dispose()
    ;(m.material as THREE.Material).dispose()
  })
}

export const parts: Record<string, PartMaker | null> = {
  'tier-art': whole('tier-art', { version: 'art-3', ready: () => pictures.every((p) => p.ready()), build, pose, drop })
}
