import * as THREE from 'three'
import { config } from '../../../config'
import type { PartMaker } from '../../../real/types'
import { controls } from '../../../shell/real/controls'
import { q } from './careers-solids'

const heights = config.scale.heights
const REST = heights.button - heights.buttonSocket

// The cap is made once at its resting height. A press only moves it down in its socket, by what the page took off its top.
export const applyButton: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.role === 'button' || s.role === 'heroButton') return `applyCap:${q(s.w)}x${q(s.h)}:${s.tone}`
    return controls.key(s, ctx)
  },
  make(s, ctx): THREE.Object3D {
    if (s.role === 'button' || s.role === 'heroButton') return controls.make({ ...s, z1: s.z0 + REST }, ctx)
    return controls.make(s, ctx)
  },
  pose(o, s) {
    if (s.role !== 'button' && s.role !== 'heroButton') return
    o.position.z -= REST - (s.z1 - s.z0)
  }
}
