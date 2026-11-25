import * as THREE from 'three'
import { studio } from '../../post/studio'
import type { BodyModel } from '../contract'
import { OUTLINE, UNIT } from '../contract'

// Two lengths of matte sticky tape hold the strips of a reassembled body: each is rolled on from one end and pulled off from the other.
export const TAPE = {
  along: 30,
  lie: 0.35,
  thick: 1.1,
  on: [0.4, 0.56] as [number, number],
  off: [0.8, 0.97] as [number, number],
  pieces: [
    { x: 4.3, y: 7.6, turn: 0.2, half: 25, wide: 6, cut: 2.2, late: 0 },
    { x: 6.4, y: 13.2, turn: -0.26, half: 22, wide: 5.2, cut: -1.8, late: 0.05 }
  ]
}

const ramp = (u: number, a: number, b: number): number => Math.min(1, Math.max(0, (u - a) / (b - a)))

function within(x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const a = OUTLINE[i]!
    const b = OUTLINE[j]!
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}

export interface Tape {
  root: THREE.Object3D
  // u is the share of the reassembly that has passed, lift is how far the strips stand off the body's face.
  apply(u: number, body: BodyModel, lift: number): void
  dispose(): void
}

export function makeTape(): Tape {
  const root = new THREE.Group()
  const rows = TAPE.along + 1
  const count = TAPE.pieces.length * rows * 2
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
  position.setUsage(THREE.DynamicDrawUsage)
  const index: number[] = []
  TAPE.pieces.forEach((_, p) => {
    for (let i = 0; i < TAPE.along; i++) {
      const a = (p * rows + i) * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', position)
  geometry.setIndex(index)
  const material = studio(new THREE.MeshPhysicalMaterial({ color: 0xe2dbc4, roughness: 0.3, metalness: 0, specularIntensity: 0.7, transparent: true, opacity: 0.44, depthWrite: false, side: THREE.DoubleSide }))
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = false
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  mesh.userData.part = 'cursor-damage'
  root.add(mesh)
  const at = new THREE.Vector3()
  const high = new Float32Array(rows)
  const soft = new Float32Array(rows)
  return {
    root,
    apply(u: number, body: BodyModel, lift: number): void {
      let shown = false
      TAPE.pieces.forEach((piece, p) => {
        const on = ramp(u, TAPE.on[0] + piece.late, TAPE.on[1] + piece.late)
        const off = ramp(u, TAPE.off[0] + piece.late * 0.5, TAPE.off[1] + piece.late * 0.5)
        if (on > off) shown = true
        const c = Math.cos(piece.turn)
        const n = Math.sin(piece.turn)
        const s0 = -piece.half + 2 * piece.half * off
        const s1 = -piece.half + 2 * piece.half * Math.max(on, off)
        for (let e = 0; e < 2; e++) {
          const side = e ? 1 : -1
          for (let i = 0; i < rows; i++) {
            const s = s0 + ((s1 - s0) * i) / TAPE.along + (i === 0 || i === TAPE.along ? side * piece.cut : 0)
            const x = piece.x * UNIT + s * c - side * piece.wide * n
            const y = -piece.y * UNIT + s * n + side * piece.wide * c
            high[i] = within(x / UNIT, -y / UNIT) ? body.anchor(x / UNIT, -y / UNIT, at).z * 2 + lift + TAPE.thick : TAPE.lie
            position.setXYZ((p * rows + i) * 2 + e, x, y, 0)
          }
          for (let i = 0; i < rows; i++) soft[i] = Math.max(high[Math.max(0, i - 1)]!, high[i]!, high[Math.min(rows - 1, i + 1)]!)
          high.set(soft)
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < rows; i++) soft[i] = Math.max(high[i]!, (high[Math.max(0, i - 1)]! + 2 * high[i]! + high[Math.min(rows - 1, i + 1)]!) / 4)
            high.set(soft)
          }
          // The free end curls up off the page as it is pulled.
          for (let i = 0; i < rows; i++) position.setZ((p * rows + i) * 2 + e, high[i]! + (off > 0 && off < 1 ? 9 * Math.exp(-i / 3) : 0))
        }
      })
      mesh.visible = shown
      if (!shown) return
      position.needsUpdate = true
      geometry.computeVertexNormals()
    },
    dispose(): void {
      geometry.dispose()
      material.dispose()
    }
  }
}
