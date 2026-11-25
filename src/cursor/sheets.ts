import { config } from '../config'
import { homePose } from '../stage/camera'
import type { PageLogic, SheetFrame } from '../stage/types'
import { gatheredAt, pileAt, restPose, STRIKE, type CursorPose, type Place } from './body'

const hover = config.scale.heights.cursorHover
const seed = config.seed

// Each sheet shows its states in the order of its approved image, straight on, with the camera pushed in: the cursor's own size never changes.
const SHEET = { acting: { step: 66, zoom: 4.5 }, damage: { step: 72, zoom: 5.2 }, arms: { step: 94, zoom: 3.9 }, y: 508 }

const across = (n: number, i: number, step: number): number => 960 + (i - (n - 1) / 2) * step - 22

const reach = (x: number, y: number, left: [number, number, number], right: [number, number, number]): [Place, Place] => [
  { x: x + left[0], y: y + left[1], z: left[2] },
  { x: x + right[0], y: y + right[1], z: right[2] }
]

// Standing idle, waving, holding, pulling, bracing to push. Hands in page pixels from the tip.
const ARMS: { left: [number, number, number]; right: [number, number, number]; lean: number; grip: [number, number]; strain: number; squash: number }[] = [
  { left: [-13, 67, 5], right: [47, 66, 5], lean: 0, grip: [0.3, 0.3], strain: 0, squash: 1 },
  { left: [-15, -8, 12], right: [47, 66, 5], lean: -0.06, grip: [0, 0.3], strain: 0, squash: 1.06 },
  { left: [8, 60, 13], right: [36, 58, 13], lean: 0, grip: [1, 1], strain: 0, squash: 1 },
  { left: [64, 86, 9], right: [78, 74, 9], lean: -0.22, grip: [1, 1], strain: 0.9, squash: 1.1 },
  { left: [58, 26, 10], right: [62, 46, 10], lean: 0.12, grip: [0, 0], strain: 0.15, squash: 0.94 }
]

function acting(): CursorPose[] {
  const n = 6
  const at = (i: number) => across(n, i, SHEET.acting.step)
  const y = SHEET.y
  return [
    restPose(at(0), y, { acting: 'nervous', squash: 0.95, lean: -0.07 }),
    restPose(at(1), y - 20, { acting: 'shocked', squash: 1.36, lean: -0.08, z: hover + 6, reaction: 'doubleTake', reactionAt: 0.7 }),
    restPose(at(2), y, { acting: 'angry', squash: 1.03, lean: 0.08 }),
    restPose(at(3), y, { acting: 'scared', squash: 0.9, lean: -0.16, bend: -0.2 }),
    restPose(at(4), y, { acting: 'exhausted', squash: 0.8, lean: 0.1, bend: 0.15 }),
    restPose(at(5), y, { acting: 'plain', damage: ['burn'], healing: 0.2, wounds: [{ kind: 'burn', at: 0.2, x: STRIKE.x, y: STRIKE.y }] })
  ]
}

function damage(): CursorPose[] {
  const n = 5
  const at = (i: number) => across(n, i, SHEET.damage.step)
  const y = SHEET.y
  const wound = (kind: CursorPose['damage'][number], life: number) => ({ damage: [kind], healing: life, wounds: [{ kind, at: life, x: STRIKE.x, y: STRIKE.y }] })
  return [
    restPose(at(0), y, { ...wound('shredded', 0.8), strips: pileAt(seed + 1, 2) }),
    restPose(at(1), y, { ...wound('reassembled', 0.64), strips: gatheredAt(seed + 1, 0.64) }),
    restPose(at(2), y, { ...wound('scorched', 0.15) }),
    restPose(at(3), y, { ...wound('burn', 0.52) }),
    restPose(at(4), y, { ...wound('flattened', 0.3), squash: 0.96 })
  ]
}

function arms(): CursorPose[] {
  return ARMS.map((a, i) => {
    const x = across(5, i, SHEET.arms.step)
    return restPose(x, SHEET.y, { arms: true, lean: a.lean, squash: a.squash, grip: a.grip, strain: a.strain, sprout: 1, hands: reach(x, SHEET.y, a.left, a.right) })
  })
}

export function cursorSheet(id: string, page: PageLogic): SheetFrame | null {
  void page
  const made = id === 'cursor-arms' ? { cursors: arms(), zoom: SHEET.arms.zoom } : id === 'cursor-damage' ? { cursors: damage(), zoom: SHEET.damage.zoom } : id === 'cursor-acting' ? { cursors: acting(), zoom: SHEET.acting.zoom } : null
  if (!made) return null
  const view = homePose(0)
  return { list: [], cursors: made.cursors, view: { ...view, eye: [0, 0, view.eye[2] / made.zoom], target: [0, 0, 0] } }
}
