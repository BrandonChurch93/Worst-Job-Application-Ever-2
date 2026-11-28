import * as THREE from 'three'
import { WARM } from '../../../boss/tune'
import { viewNow } from '../../../boss/viewof'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'

// The warm-up: as the button cracks, every material the fight will show is drawn once on a stand-in with nothing in it, so the renderer makes its program then and not in the middle of play.
function standIns(o: THREE.Object3D, seen: Set<string>, out: THREE.Object3D[]): void {
  const src = o as THREE.Mesh
  if (!src.geometry || !src.material || (o as THREE.SkinnedMesh).isSkinnedMesh || (o as unknown as THREE.Sprite).isSprite) return
  if (Object.keys(src.geometry.morphAttributes).length > 0) return
  const many = (o as THREE.InstancedMesh).isInstancedMesh === true
  const tint = many && (o as THREE.InstancedMesh).instanceColor !== null
  const kind = many ? 'many' : (o as unknown as THREE.Points).isPoints ? 'points' : (o as unknown as THREE.Line).isLine ? 'line' : 'mesh'
  const names = Object.keys(src.geometry.attributes).sort().join(',')
  for (const material of Array.isArray(src.material) ? src.material : [src.material]) {
    const key = [material.uuid, kind, tint, names, src.castShadow, src.receiveShadow, src.layers.mask, src.customDepthMaterial?.uuid ?? ''].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    const g = new THREE.BufferGeometry()
    for (const [name, a] of Object.entries(src.geometry.attributes)) {
      const size = a.itemSize
      g.setAttribute(name, (a as THREE.InstancedBufferAttribute).isInstancedBufferAttribute ? new THREE.InstancedBufferAttribute(new Float32Array(size), size) : new THREE.BufferAttribute(new Float32Array(3 * size), size))
    }
    g.setDrawRange(0, 0)
    let t: THREE.Mesh | THREE.Points | THREE.LineSegments
    if (many) {
      const m = new THREE.InstancedMesh(g, material, 1)
      if (tint) m.setColorAt(0, new THREE.Color(0, 0, 0))
      t = m
    } else if (kind === 'points') t = new THREE.Points(g, material)
    else if (kind === 'line') t = new THREE.LineSegments(g, material)
    else t = new THREE.Mesh(g, material)
    t.frustumCulled = false
    t.castShadow = src.castShadow
    t.receiveShadow = src.receiveShadow
    t.layers.mask = src.layers.mask
    t.renderOrder = src.renderOrder
    if (src.customDepthMaterial) t.customDepthMaterial = src.customDepthMaterial
    out.push(t)
  }
}

export interface Once { make(): THREE.Object3D[]; drop(o: THREE.Object3D): void }

function clear(group: THREE.Object3D): void {
  const hall = group.userData.hall as THREE.Group | null
  if (!hall) return
  for (const t of hall.children) {
    ;(t as THREE.Mesh).geometry.dispose()
    if ((t as THREE.InstancedMesh).isInstancedMesh) (t as THREE.InstancedMesh).dispose()
  }
  group.remove(hall)
  group.userData.hall = null
}

export function warmed(inner: PartMaker, more?: Once): PartMaker {
  return {
    key: (s: Shape, ctx: RealContext): string | null => inner.key(s, ctx),
    make(s: Shape, ctx: RealContext): THREE.Object3D {
      const group = inner.make(s, ctx)
      const hall = new THREE.Group()
      hall.name = 'warm-up'
      const seen = new Set<string>()
      const list: THREE.Object3D[] = []
      const once = more?.make() ?? []
      group.traverse((c) => standIns(c, seen, list))
      for (const x of once) x.traverse((c) => standIns(c, seen, list))
      for (const t of list) hall.add(t)
      hall.visible = false
      group.add(hall)
      group.userData.hall = hall
      group.userData.once = once
      group.userData.drawn = false
      group.userData.frames = 0
      if (list.length > 0) list[0]!.onBeforeRender = () => { group.userData.drawn = true }
      else clear(group)
      return group
    },
    pose(group: THREE.Object3D, s: Shape, ctx: RealContext): void {
      inner.pose?.(group, s, ctx)
      const hall = group.userData.hall as THREE.Group | null
      if (!hall) return
      if (group.userData.drawn) {
        group.userData.drawn = false
        group.userData.frames = (group.userData.frames as number) + 1
      }
      const view = viewNow()
      hall.visible = view !== null && view.time >= WARM.after
      if ((group.userData.frames as number) >= WARM.frames) clear(group)
    },
    drop(group: THREE.Object3D): void {
      clear(group)
      for (const x of group.userData.once as THREE.Object3D[]) more?.drop(x)
      group.userData.once = []
      inner.drop?.(group)
    }
  }
}
