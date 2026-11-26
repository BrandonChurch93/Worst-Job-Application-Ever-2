import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { controls } from '../../../shell/real/controls'

const q = (v: number): number => Math.round(v * 4) / 4

export const metrics: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text') return null
    if (s.role === 'card') return controls.key(s, ctx)
    if (s.role === 'readout') return `readout:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
    return null
  },
  make(s, ctx) {
    if (s.role === 'card') return controls.make(s, ctx)
    return controls.make({ ...s, role: 'card' }, ctx)
  },
  drop(o) {
    void (o as THREE.Object3D)
  }
}
