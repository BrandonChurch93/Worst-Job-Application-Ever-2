import { config } from '../config'
import { homePose } from '../stage/camera'
import type { DrawList, PageLogic, SheetFrame } from '../stage/types'
import { gatheredAt, pileAt, restPose, STRIKE, type CursorPose, type Place } from './body'

const hover = config.scale.heights.cursorHover
const seed = config.seed

// Each sheet shows its states in the order of its approved image, straight on, with the camera pushed in: the cursor's own size never changes.
const SHEET = { acting: { step: 60, zoom: 5.2 }, damage: { step: 72, zoom: 5.2 }, arms: { zoom: 2.66, y: 470, mid: [952, 606] }, y: 508 }

const across = (n: number, i: number, step: number): number => 960 + (i - (n - 1) / 2) * step - 22

const reach = (x: number, y: number, left: [number, number, number], right: [number, number, number]): [Place, Place] => [
  { x: x + left[0], y: y + left[1], z: left[2] },
  { x: x + right[0], y: y + right[1], z: right[2] }
]

// The resume sheet of the tug, at its true size beside the cursor: flat on the page, held by its top edge.
const PAPER = { w: 220, h: 300, hands: 52, edge: 5, tall: config.scale.heights.paper }

// Standing idle, waving, holding, pulling, bracing to push. Hands in page pixels from the tip.
// A pose with a sheet names where the middle of the sheet's top edge is from the tip: its hands are on that edge.
const ARMS: { x: number; y: number; left: [number, number, number]; right: [number, number, number]; lean: number; grip: [number, number]; strain: number; squash: number; sheet?: { name: string; x: number; y: number; z: number; rot: number; pull: number } }[] = [
  { x: 648, y: 0, left: [-13, 67, 5], right: [47, 66, 5], lean: 0, grip: [0.3, 0.3], strain: 0, squash: 1 },
  { x: 736, y: 0, left: [-15, -8, 12], right: [47, 66, 5], lean: -0.06, grip: [0, 0.3], strain: 0, squash: 1.06 },
  { x: 846, y: -4, left: [0, 0, 0], right: [0, 0, 0], lean: 0, grip: [1, 1], strain: 0, squash: 1, sheet: { name: 'holding', x: 22, y: 84, z: 1, rot: 0, pull: 0 } },
  { x: 1080, y: -18, left: [0, 0, 0], right: [0, 0, 0], lean: -0.2, grip: [1, 1], strain: 0.9, squash: 1.1, sheet: { name: 'pulling', x: 18, y: 112, z: 3, rot: 0.07, pull: 1 } },
  { x: 1216, y: 0, left: [58, 26, 10], right: [62, 46, 10], lean: 0.12, grip: [0, 0], strain: 0.15, squash: 0.94 }
]

function held(x: number, y: number, sheet: NonNullable<(typeof ARMS)[number]['sheet']>): { hands: [Place, Place]; shape: DrawList[number] } {
  const mx = x + sheet.x
  const my = y + sheet.y
  const c = Math.cos(sheet.rot)
  const n = Math.sin(sheet.rot)
  const z = sheet.z + PAPER.edge
  const hands: [Place, Place] = [{ x: mx - c * PAPER.hands, y: my - n * PAPER.hands, z }, { x: mx + c * PAPER.hands, y: my + n * PAPER.hands, z }]
  const cx = mx - n * (PAPER.h / 2)
  const cy = my + c * (PAPER.h / 2)
  const v = [0, 0, 0, sheet.pull, hands[0].x, hands[0].y, hands[1].x, hands[1].y, 0, 0, 1]
  return { hands, shape: { id: `resume-paper:${sheet.name}`, part: 'paper', kind: 'box', x: cx - PAPER.w / 2, y: cy - PAPER.h / 2, w: PAPER.w, h: PAPER.h, z0: sheet.z, z1: sheet.z + PAPER.tall, rot: sheet.rot, tone: 'paper', moved: true, v } }
}

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
    restPose(at(3), y, { ...wound('burn', 0.63) }),
    restPose(at(4), y, { ...wound('flattened', 0.3), squash: 0.96 })
  ]
}

function arms(): { cursors: CursorPose[]; list: DrawList } {
  const list: DrawList = []
  const cursors = ARMS.map((a) => {
    const y = SHEET.arms.y + a.y
    const grip = a.sheet ? held(a.x, y, a.sheet) : null
    if (grip) list.push(grip.shape)
    return restPose(a.x, y, { arms: true, lean: a.lean, squash: a.squash, grip: a.grip, strain: a.strain, sprout: 1, hands: grip ? grip.hands : reach(a.x, y, a.left, a.right) })
  })
  return { cursors, list }
}

export function cursorSheet(id: string, page: PageLogic): SheetFrame | null {
  void page
  const view = homePose(0)
  const shot = (zoom: number, mid = [960, 540]) => ({ ...view, eye: [mid[0]! - 960, 540 - mid[1]!, view.eye[2] / zoom] as [number, number, number], target: [mid[0]! - 960, 540 - mid[1]!, 0] as [number, number, number] })
  if (id === 'cursor-arms') return { ...arms(), view: shot(SHEET.arms.zoom, SHEET.arms.mid) }
  if (id === 'cursor-damage') return { list: [], cursors: damage(), view: shot(SHEET.damage.zoom) }
  if (id === 'cursor-acting') return { list: [], cursors: acting(), view: shot(SHEET.acting.zoom) }
  return null
}
