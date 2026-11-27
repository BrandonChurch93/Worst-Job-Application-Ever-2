import * as THREE from 'three'
import type { BossView } from '../view'
import type { Emitter } from '../../real/types'
import type { LookOptions, Pose } from './pose'

export interface Fx {
  object: THREE.Object3D
  pose(view: BossView, p: Pose, light?: (e: Emitter) => void): void
  dispose(): void
}

export function makeFx(_o: LookOptions, _level: 'low' | 'medium' | 'high' | null): Fx {
  const object = new THREE.Group()
  return { object, pose: () => undefined, dispose: () => undefined }
}
