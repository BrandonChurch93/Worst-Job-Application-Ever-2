import type * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { controls } from '../../../shell/real/controls'

// A machine's tray is cut and lined the way a field is: a rolled lip, an aluminium sleeve and a floor of frosted glass in the shade of its own wall.
const lined = (s: Shape): Shape => (s.role === 'machineTray' ? { ...s, role: 'field' } : s)

export const rows: PartMaker = {
  key: (s: Shape, ctx: RealContext): string | null => controls.key(lined(s), ctx),
  make: (s: Shape, ctx: RealContext): THREE.Object3D => controls.make(lined(s), ctx),
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    controls.pose?.(o, lined(s), ctx)
  }
}
