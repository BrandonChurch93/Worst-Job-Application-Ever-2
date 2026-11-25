import type * as THREE from 'three'
import { hook } from './lights/hook'
import type { Zone } from './zone'

// Every material that is drawn in a zone of the table passes through here once, when it is made, so that the owner of the table's lights can light it by the zone's light groups.
export const lit = <T extends THREE.Material>(m: T, z: Zone): T => {
  hook?.(m, z)
  return m
}
