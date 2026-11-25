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
  { roughness: 0.48, leaf: true, coat: 1, peel: 0.045, specular: 0 },
  { roughness: 0.95, leaf: false, coat: 1, peel: 0.05, specular: 0 },
  { roughness: 0.92, leaf: false, coat: 1, peel: 0.05, specular: 0 }
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

// The three windows of a tier are one mesh and one drawing. How far each is lit rides on its corners, so one material serves all three.
function windowsOf(z: Zone): THREE.Mesh {
  const list = insertsOf(z.tier)
  const at: number[] = []
  const up: number[] = []
  const uv: number[] = []
  const lit0: number[] = []
  const index: number[] = []
  const spans: [number, number][] = []
  for (const n of list) {
    const g = new THREE.CircleGeometry(n.r * BALL, WINDOW.segments)
    const p = g.getAttribute('position')
    const t = g.getAttribute('uv')
    const [col, row] = insertCell(n)
    const [x, y] = localBalls(z, n.c[0], n.c[1])
    const first = at.length / 3
    for (let i = 0; i < p.count; i++) {
      at.push(p.getX(i) + x, p.getY(i) + y, 0)
      up.push(0, 0, 1)
      const u = 0.5 + (t.getX(i) - 0.5) * WINDOW.inset
      const v = 0.5 + (t.getY(i) - 0.5) * WINDOW.inset
      uv.push((col + u) / 3, 1 - (row + 1 - v) / 3)
      lit0.push(INSERT_GLOW.off)
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
  geometry.setAttribute('wjaGlow', new THREE.Float32BufferAttribute(lit0, 1))
  geometry.setIndex(index)
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
  lit(material, z)
  material.name = `tier-art.windows.${z.id}`
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = PLATE.z + WINDOW.lift
  mesh.name = `tier-art.windows.${z.id}`
  mesh.userData.inserts = list.map((n) => n.id)
  mesh.userData.spans = spans
  mesh.userData.coverage = 'mark'
  mesh.receiveShadow = true
  return mesh
}

const seen = new THREE.Frustum()
const view = new THREE.Matrix4()
const flat = new THREE.Box3(new THREE.Vector3(-PLATE.w / 2, -PLATE.h / 2, 0), new THREE.Vector3(PLATE.w / 2, PLATE.h / 2, PLATE.z + WINDOW.lift))
const stood = new THREE.Box3()

// A floor is far wider than it is deep, so the sphere round it reaches into the tiers beside it. The renderer asks this before it draws: the floor is shown when its own rectangle is in the camera's view.
class Floor extends THREE.LOD {
  override update(camera: THREE.Camera): void {
    seen.setFromProjectionMatrix(view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
    const inView = seen.intersectsBox(stood.copy(flat).applyMatrix4(this.matrixWorld))
    for (const c of this.children) c.visible = inView
  }
}

function build(z: Zone): THREE.Object3D {
  const o = new Floor()
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
    const a = (c as THREE.Mesh).geometry.getAttribute('wjaGlow') as THREE.BufferAttribute
    ids.forEach((id, k) => {
      const on = ctx.byId.get(`insert.${id}`)?.v?.[0] ?? 0
      const to = INSERT_GLOW.off + (INSERT_GLOW.on - INSERT_GLOW.off) * on
      const [first, count] = spans[k]!
      if (a.getX(first) === Math.fround(to)) return
      for (let i = first; i < first + count; i++) a.setX(i, to)
      a.needsUpdate = true
    })
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
