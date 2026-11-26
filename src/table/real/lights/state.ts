import * as THREE from 'three'
import { lightLaw } from '../../../post/studio'
import type { Zone } from '../zone'
import { DEEP } from './colours'
import { CHANNELS, HIGHS, SPILLS } from './groups'
import { picturesOf } from './pictures'

// What every material of one zone reads for a frame. The part's `pose` writes it; nothing is rebuilt when a level moves.
export interface ZoneLight {
  zone: Zone
  uniforms: {
    wjlA: { value: THREE.Texture }
    wjlB: { value: THREE.Texture }
    wjlC: { value: THREE.Texture }
    wjlViewInverse: { value: THREE.Matrix4 }
    wjlFrame: { value: THREE.Vector3 }
    wjlSize: { value: THREE.Vector2 }
    wjlCol: { value: THREE.Vector3[] }
    wjlFull: { value: THREE.Vector3[] }
    wjlSpill: { value: THREE.Vector4[] }
    wjlSpillCol: { value: THREE.Vector3[] }
    wjlSpillComb: { value: THREE.Vector2[] }
    wjlHigh: { value: THREE.Vector4[] }
    wjlHighCol: { value: THREE.Vector3[] }
    wjlAt: { value: THREE.Vector4[] }
    wjlFill: { value: THREE.Vector3 }
    wjlHole: { value: THREE.Vector4[] }
    wjlEnv: { value: number }
    wjlDeep: { value: THREE.Vector2 }
  }
}

const made = new Map<string, ZoneLight>()

export function zoneLight(z: Zone): ZoneLight {
  let s = made.get(z.id)
  if (s) return s
  const p = picturesOf(z)
  const col: THREE.Vector3[] = []
  const full: THREE.Vector3[] = []
  const at: THREE.Vector4[] = []
  for (let i = 0; i < CHANNELS; i++) {
    col.push(new THREE.Vector3())
    full.push(new THREE.Vector3())
    at.push(new THREE.Vector4())
  }
  s = {
    zone: z,
    uniforms: {
      wjlA: { value: p.textures[0]! },
      wjlB: { value: p.textures[1]! },
      wjlC: { value: p.textures[2]! },
      wjlViewInverse: lightLaw.viewInverse,
      wjlFrame: { value: new THREE.Vector3(0, 540 - (z.top + z.height / 2), z.floor) },
      wjlSize: { value: new THREE.Vector2(1920, z.height) },
      wjlCol: { value: col },
      wjlFull: { value: full },
      wjlSpill: { value: Array.from({ length: SPILLS }, () => new THREE.Vector4()) },
      wjlSpillCol: { value: Array.from({ length: SPILLS }, () => new THREE.Vector3()) },
      wjlSpillComb: { value: Array.from({ length: SPILLS }, () => new THREE.Vector2()) },
      wjlHigh: { value: Array.from({ length: HIGHS }, () => new THREE.Vector4()) },
      wjlHighCol: { value: Array.from({ length: HIGHS }, () => new THREE.Vector3()) },
      wjlAt: { value: at },
      wjlFill: { value: new THREE.Vector3() },
      wjlHole: { value: [new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0)] },
      wjlEnv: { value: 0 },
      wjlDeep: { value: new THREE.Vector2(...(DEEP[z.id] ?? [1, 1])) }
    }
  }
  made.set(z.id, s)
  return s
}
