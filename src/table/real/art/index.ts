import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { grainNormalMap } from '../../../shell/materials'
import { ask } from '../assets'
import { lit } from '../light'
import { whole, type Zone } from '../zone'
import { Floor } from './floor'
import { INSERT_GLOW } from './inserts'
import { setGlow, windowGeometry } from './windows'

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
  { roughness: 0.48, leaf: true, coat: 0.05, peel: 0.045, specular: 0, room: 1 },
  { roughness: 0.95, leaf: false, coat: 1, peel: 0.05, specular: 0, room: 1 },
  { roughness: 0.92, leaf: false, coat: 1, peel: 0.05, specular: 0, room: 1 }
]
const WINDOW = { lift: 0.35, bump: 2.2, segments: 56, inset: 0.975, room: 0.1 }

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
        specularIntensity: c.specular,
        envMapIntensity: c.room
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

// The three windows of a tier are one mesh and one drawing. How far each is lit rides on its corners, so one material serves all three.
function windowsOf(z: Zone): THREE.Mesh {
  const { geometry, spans, ids } = windowGeometry(z, WINDOW)
  const material = studio(
    new THREE.MeshPhysicalMaterial({
      map: lens.texture(),
      emissive: 0xffffff,
      emissiveMap: glow.texture(),
      emissiveIntensity: 1,
      bumpMap: relief.texture(),
      bumpScale: WINDOW.bump,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: WINDOW.room,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    })
  )
  const room = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    room.call(material, shader, renderer)
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float wjaGlow;\nvarying float vWjaGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWjaGlow = wjaGlow;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWjaGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vWjaGlow;')
  }
  material.customProgramCacheKey = () => 'wja-studio-art-window'
  material.userData.lit = true
  lit(material, z)
  material.name = `tier-art.windows.${z.id}`
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = PLATE.z + WINDOW.lift
  mesh.name = `tier-art.windows.${z.id}`
  mesh.userData.inserts = ids
  mesh.userData.spans = spans
  mesh.userData.coverage = 'mark'
  mesh.receiveShadow = true
  return mesh
}

function build(z: Zone): THREE.Object3D {
  const o = new Floor(PLATE.w, PLATE.h, PLATE.z + WINDOW.lift)
  o.name = `tier-art.${z.id}`
  o.add(plate(z))
  o.add(windowsOf(z))
  return o
}

function pose(o: THREE.Object3D, _z: Zone, ctx: RealContext): void {
  for (const c of o.children) {
    const ids = c.userData.inserts as string[] | undefined
    if (!ids) continue
    const spans = c.userData.spans as [number, number][]
    ids.forEach((id, k) => setGlow((c as THREE.Mesh).geometry, spans[k]!, INSERT_GLOW.off + (INSERT_GLOW.on - INSERT_GLOW.off) * (ctx.byId.get(`insert.${id}`)?.v?.[0] ?? 0)))
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
  'tier-art': whole('tier-art', { version: 'art-6', ready: () => pictures.every((p) => p.ready()), build, pose, drop })
}
