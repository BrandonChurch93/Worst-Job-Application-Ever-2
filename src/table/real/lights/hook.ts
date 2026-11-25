import type * as THREE from 'three'
import type { Zone } from '../zone'

export const hook: ((m: THREE.Material, z: Zone) => void) | null = null
