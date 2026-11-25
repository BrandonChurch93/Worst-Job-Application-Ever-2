import * as THREE from 'three'
import { hashName } from '../core/random'

export const views = ['beauty', 'standins'] as const

const plain = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.02, 0.02) })
const flags = new Map<string, THREE.MeshBasicMaterial>()

// The flat colour the `standins` view paints a stand-in with. One colour per name, so a check can tell them apart.
export function standInColour(name: string): [number, number, number] {
  const h = hashName(name)
  return [0.35 + 0.65 * ((h & 255) / 255), 0.1 + 0.3 * (((h >>> 8) & 255) / 255), 0.35 + 0.65 * (((h >>> 16) & 255) / 255)]
}

function flag(name: string): THREE.MeshBasicMaterial {
  let m = flags.get(name)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...standInColour(name)) })
    flags.set(name, m)
  }
  return m
}

// Swaps the scene's materials for a diagnostic view, and gives back what puts them right again.
export function applyView(view: string, scene: THREE.Scene): (() => void) | void {
  if (view === 'beauty') return
  if (view === 'standins') {
    const saved: [THREE.Mesh, THREE.Material | THREE.Material[]][] = []
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      saved.push([m, m.material])
      const name = m.userData.standIn as string | undefined
      m.material = name ? flag(name) : plain
    })
    return () => {
      for (const [m, material] of saved) m.material = material
    }
  }
  throw new Error(`No diagnostic view called "${view}"`)
}
