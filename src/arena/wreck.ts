// What the big cannon breaks. Filled in the next commit.
import * as THREE from 'three'
import type { BossView } from '../boss/view'
import type { Emitter } from '../real/types'
import type { Wounds } from './ground'
import type { Kit, Pane, Pillar } from './props'

export interface Wreck { object: THREE.Group; pose(view: BossView, light?: (e: Emitter) => void): void; dispose(): void }

export function makeWreck(_seed: number, _kit: Kit, _wounds: Wounds, _pillars: Pillar[], _panes: Pane[]): Wreck {
  return { object: new THREE.Group(), pose: () => undefined, dispose: () => undefined }
}
