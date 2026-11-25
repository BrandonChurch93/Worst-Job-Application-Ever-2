import { config } from '../config'
import { homePose } from '../stage/camera'
import type { PageLogic, SheetFrame } from '../stage/types'
import { ACTING, DAMAGE, restPose, type CursorPose, type Place } from './body'

const hover = config.scale.heights.cursorHover

const across = (n: number, i: number): number => 960 + (i - (n - 1) / 2) * (880 / Math.max(1, n - 1))

const reach = (x: number, y: number, left: [number, number, number], right: [number, number, number]): [Place, Place] => [
  { x: x + left[0], y: y + left[1], z: left[2] },
  { x: x + right[0], y: y + right[1], z: right[2] }
]

const ARMS: { left: [number, number, number]; right: [number, number, number]; lean: number }[] = [
  { left: [-52, 44, 8], right: [60, 44, 8], lean: 0 },
  { left: [-70, -24, 30], right: [78, -24, 30], lean: 0 },
  { left: [20, -84, 40], right: [70, -78, 40], lean: 0.12 },
  { left: [-76, 14, 12], right: [84, -44, 50], lean: -0.1 },
  { left: [-24, 78, 6], right: [36, 78, 6], lean: 0 }
]

export function cursorSheet(id: string, page: PageLogic): SheetFrame | null {
  void page
  const y = 520
  let cursors: CursorPose[] | null = null
  if (id === 'cursor-arms') cursors = ARMS.map((a, i) => restPose(across(5, i) - 30, y, { arms: true, lean: a.lean, hands: reach(across(5, i) - 30 + 24, y + 58, a.left, a.right) }))
  if (id === 'cursor-damage') cursors = DAMAGE.map((d, i) => restPose(across(5, i) - 30, y, { damage: [d], squash: d === 'flattened' ? 0.6 : 1 }))
  if (id === 'cursor-acting') {
    const shown = ACTING.filter((a) => a !== 'plain' && a !== 'confident' && a !== 'proud')
    cursors = shown.map((a, i) => restPose(across(shown.length, i) - 30, y, { acting: a, lean: a === 'angry' ? 0.3 : a === 'scared' ? -0.3 : 0, squash: a === 'exhausted' ? 0.7 : a === 'shocked' ? 1.3 : 1, z: a === 'shocked' ? hover + 60 : hover }))
  }
  if (!cursors) return null
  const view = homePose(0)
  return { list: [], cursors, view: { ...view, eye: [0, 0, view.eye[2] * 0.6], target: [0, 0, 0] } }
}
