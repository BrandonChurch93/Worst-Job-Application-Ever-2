import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { look } from '../../../post/look'
import { materials } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import { outlineOf, profile, sweep } from '../../../shell/solids'

const q = (v: number): number => Math.round(v * 4) / 4

// A hole in the page that a machine comes up through: the page's own ceramic turned down into it. A bevelled lip at the surface that takes the light,
// a wall that leans in and goes dark with its depth, darker on the light's side, and a floor in the dark.
const isHole = (s: Shape): boolean => s.role === 'machineTray' && s.pocket === true
const holeKey = (s: Shape): string => `hole:${q(s.w)}x${q(s.h)}:${q(s.r ?? 0)}:${q(s.z0)}`
const PIT = { lip: 5, lipDrop: 3.2, lean: 1.9, steps: 8, colour: 0xf2f1ee, top: 0.26, topSide: 0.12, foot: 0.9, footSide: 0.05, ease: 0.9, shallow: 20, least: 0.35, cool: 0.08 }
export const pitFoot = (depth: number): number => Math.min(PIT.lip, depth) + PIT.lean * depth

function pit(s: Shape): { lip: THREE.BufferGeometry; wall: THREE.BufferGeometry; floor: THREE.BufferGeometry } {
  const depth = -s.z0
  const outline = outlineOf(s, 0, 16)
  const foot = Math.min(pitFoot(depth), Math.min(s.w, s.h) / 2 - 1)
  const in0 = Math.min(PIT.lip, foot * 0.8)
  const drop = Math.min(PIT.lipDrop, depth * 0.5)
  const lip = sweep(outline, profile([[-0.3, depth + 0.02, true], [in0, depth - drop, true]]), false)
  const rungs: [number, number, number][] = []
  for (let i = 0; i <= PIT.steps; i++) rungs.push([in0 + ((foot - in0) * i) / PIT.steps, (depth - drop) * (1 - i / PIT.steps), i / PIT.steps])
  const wall = sweep(outline, rungs.map(([inset, z]) => ({ inset, z, out: 0, up: 1 })), false)
  const [lx, ly] = look.key.direction
  const l = Math.hypot(lx, ly) || 1
  const n = outline.count
  const base = new THREE.Color(PIT.colour)
  const much = PIT.least + (1 - PIT.least) * Math.min(1, depth / PIT.shallow)
  const colour = new Float32Array(rungs.length * n * 3)
  rungs.forEach(([, , down], k) => {
    for (let i = 0; i < n; i++) {
      const facing = (outline.nx[i]! * lx + outline.ny[i]! * ly) / l
      const top = PIT.top + PIT.topSide * facing
      const dark = Math.min(0.95, much * (top + (PIT.foot + PIT.footSide * facing - top) * Math.pow(down, PIT.ease)))
      const v = 1 - dark
      colour.set([base.r * v * (1 - PIT.cool * dark), base.g * v, base.b * v], (k * n + i) * 3)
    }
  })
  wall.setAttribute('color', new THREE.BufferAttribute(colour, 3))
  return { lip, wall, floor: sweep(outline, [{ inset: foot - 0.4, z: 0, out: 0, up: 1 }], true) }
}

let pitMaterial: THREE.MeshBasicMaterial | null = null

function hole(s: Shape): THREE.Object3D {
  const m = materials()
  const root = new THREE.Group()
  const { lip, wall, floor } = pit(s)
  const rim = new THREE.Mesh(lip, m.ceramic)
  rim.receiveShadow = true
  root.add(rim)
  pitMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true })
  root.add(new THREE.Mesh(wall, pitMaterial))
  const bottom = new THREE.Mesh(floor, m.gap)
  bottom.receiveShadow = true
  root.add(bottom)
  root.userData.passing = true
  return root
}

export const rows: PartMaker = {
  key: (s: Shape, ctx: RealContext): string | null => (isHole(s) ? holeKey(s) : controls.key(s, ctx)),
  make: (s: Shape, ctx: RealContext): THREE.Object3D => (isHole(s) ? hole(s) : controls.make(s, ctx)),
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    if (!isHole(s)) controls.pose?.(o, s, ctx)
  },
  drop(o: THREE.Object3D): void {
    if (o.userData.passing !== true) return
    o.traverse((c) => {
      const mesh = c as THREE.Mesh
      if (mesh.isMesh) mesh.geometry.dispose()
    })
  }
}
