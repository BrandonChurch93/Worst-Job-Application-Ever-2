import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { outlineOf } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { COLOUR, Z } from '../layout'
import { mesh, q } from './careers-solids'
import { flat, Paint, tint } from './flat'

export const BUTTON_LOOK = { rest: Z.button - Z.sheet - 0.4, squeeze: 0.025, dark: 0.45 }

function pill(s: Shape, hex: number): THREE.Mesh {
  const p = new Paint()
  p.face(outlineOf({ kind: 'capsule', w: s.w, h: s.h }, 0, 18), 0, 0, 0, tint(hex))
  return mesh(p.geometry(), flat(), false, true)
}

// The Apply button of the website: a flat orange pill. A press takes it down toward the sheet, a little smaller and a little darker.
export const applyButton: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.role !== 'applyCap') return ''
    return `applyPill:${q(s.w)}x${q(s.h)}`
  },
  make(s) {
    const root = new THREE.Group()
    const up = pill(s, COLOUR.deep)
    up.name = 'up'
    const down = pill(s, COLOUR.down)
    down.name = 'down'
    down.position.z = 0.1
    root.add(up, down)
    return root
  },
  pose(o, s) {
    const top = s.z1 - s.z0
    const sunk = Math.min(1, Math.max(0, 1 - (top - (Z.pressed - Z.sheet - 0.4)) / (BUTTON_LOOK.rest - (Z.pressed - Z.sheet - 0.4))))
    o.position.z += top
    const k = 1 - BUTTON_LOOK.squeeze * sunk
    o.scale.set(k, k, 1)
    o.getObjectByName('down')!.visible = sunk > BUTTON_LOOK.dark
  },
  drop(o) {
    o.traverse((c) => (c as THREE.Mesh).geometry?.dispose())
  }
}
