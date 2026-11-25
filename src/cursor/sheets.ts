import { config } from '../config'
import { homePose } from '../stage/camera'
import type { DrawList, PageLogic, SheetFrame } from '../stage/types'
import { PAPER as SHEET_OF_STEP1, SLOT } from '../pages/step1/layout'
import { slotShapes } from '../pages/step1/real/shredderShape'
import { TUG } from '../pages/step1/script'
import { gatheredAt, pileAt, restPose, STRIKE, type CursorPose, type Place } from './body'

const hover = config.scale.heights.cursorHover
const seed = config.seed

// Each sheet shows its states in the order of its approved image, straight on, with the camera pushed in: the cursor's own size never changes.
const SHEET = { acting: { step: 60, zoom: 5.2 }, damage: { step: 72, zoom: 5.2 }, arms: { zoom: 3.6, step: 100 }, y: 508 }

const across = (n: number, i: number, step: number): number => 960 + (i - (n - 1) / 2) * step - 22

const reach = (x: number, y: number, left: [number, number, number], right: [number, number, number]): [Place, Place] => [
  { x: x + left[0], y: y + left[1], z: left[2] },
  { x: x + right[0], y: y + right[1], z: right[2] }
]

// The resume sheet of the tug, at its true size beside the cursor, held by its two sides near the top corners.
const PAPER = { w: SHEET_OF_STEP1.w, h: SHEET_OF_STEP1.h, hands: TUG.hands, edge: 0, hold: 24, tall: config.scale.heights.paper, front: hover + 13 }

// The row stands round step 1's own slot: the pulling pose, the fourth, feeds its sheet to it.
const ROW = { x: SLOT.cx - 16 - 3 * SHEET.arms.step, y: SLOT.cy - 132, pull: { x: -22, y: -8, from: 86, in: 0.34 } }

// Standing idle, waving, holding, pulling, bracing to push. Hands in page pixels from the tip.
// A pose with a sheet names where the middle of the sheet's top edge is from the tip. A held sheet hangs low at the body's side with the hands on its two sides, `PAPER.hold` under that edge.
const ARMS: { x: number; y: number; left: [number, number, number]; right: [number, number, number]; lean: number; grip: [number, number]; strain: number; squash: number; sheet?: { name: string; x: number; y: number; z: number; pull: number; turn: number } }[] = [
  { x: -20, y: 0, left: [-19, 75, 4], right: [41, 63, 4], lean: 0.03, grip: [0.3, 0.2], strain: 0, squash: 1 },
  { x: -26, y: 0, left: [-19, -6, 12], right: [43, 66, 4], lean: -0.07, grip: [0, 0.25], strain: 0, squash: 1.05 },
  { x: -44, y: -2, left: [0, 0, 0], right: [0, 0, 0], lean: 0, grip: [1, 1], strain: 0.1, squash: 1, sheet: { name: 'holding', x: 46, y: 42, z: PAPER.front, pull: 0, turn: 0.13 } },
  { x: ROW.pull.x, y: ROW.pull.y, left: [0, 0, 0], right: [0, 0, 0], lean: -0.3, grip: [1, 1], strain: 0.85, squash: 1.1, sheet: { name: 'pulling', x: 20, y: ROW.pull.from, z: 3, pull: 1, turn: 0 } },
  { x: -6, y: 0, left: [58, 47, 15], right: [58, 24, 9], lean: 0.14, grip: [0, 0], strain: 0.4, squash: 0.94 }
]

function held(x: number, y: number, sheet: NonNullable<(typeof ARMS)[number]['sheet']>): { hands: [Place, Place]; shapes: DrawList } {
  const mx = x + sheet.x
  const my = y + sheet.y
  const fed = sheet.pull > 0
  const whole = fed ? Math.hypot(SLOT.cx - mx, SLOT.cy - my) : PAPER.h
  const rot = fed ? Math.atan2(SLOT.cy - my, SLOT.cx - mx) - Math.PI / 2 : sheet.turn
  const c = Math.cos(rot)
  const n = Math.sin(rot)
  const z = sheet.z + PAPER.edge
  const down = fed ? 0 : PAPER.hold
  const at = (side: number): Place => ({ x: mx + side * c * PAPER.hands - n * down, y: my + side * n * PAPER.hands + c * down, z })
  const hands: [Place, Place] = [at(-1), at(1)]
  const cx = mx - n * (whole / 2)
  const cy = my + c * (whole / 2)
  const amount = fed ? 1 - whole / PAPER.h : 0
  const v = [fed ? sheet.z : 0, fed ? 1 : 0, amount, sheet.pull, hands[0].x, hands[0].y, hands[1].x, hands[1].y, 0, 0, 1]
  const shapes: DrawList = fed ? slotShapes([1, 0.4, 0]) : []
  shapes.push({ id: fed ? 'resume-paper' : `resume-paper:${sheet.name}`, part: 'paper', kind: 'box', x: cx - PAPER.w / 2, y: cy - whole / 2, w: PAPER.w, h: whole, z0: sheet.z, z1: sheet.z + PAPER.tall, rot, tone: 'paper', moved: true, v })
  return { hands, shapes }
}

function acting(): CursorPose[] {
  const n = 6
  const at = (i: number) => across(n, i, SHEET.acting.step)
  const y = SHEET.y
  return [
    restPose(at(0), y, { acting: 'nervous', squash: 0.95, lean: 0.08 }),
    restPose(at(1), y - 20, { acting: 'shocked', squash: 1.14, lean: 0.08, z: hover + 6, reaction: 'doubleTake', reactionAt: 0.7 }),
    restPose(at(2), y, { acting: 'angry', squash: 1.03, lean: 0.1 }),
    restPose(at(3), y, { acting: 'scared', squash: 0.9, lean: 0.06, bend: -0.1 }),
    restPose(at(4), y, { acting: 'exhausted', squash: 0.8, lean: 0.1, bend: 0.15 }),
    restPose(at(5), y, { acting: 'plain', z: 1, lean: 0.08, damage: ['burn'], healing: 0.2, wounds: [{ kind: 'burn', at: 0.2, x: STRIKE.x, y: STRIKE.y }] })
  ]
}

// On the approved sheet every damaged body lies on the page.
const LIE = 0.6

// The pile lies down the page and to the right of where the body was cut: the sheet sets the body back by that much, so the pile is in its cell.
const PILE = { x: 33, y: 62 }

function damage(): CursorPose[] {
  const n = 5
  const at = (i: number) => across(n, i, SHEET.damage.step)
  const y = SHEET.y
  const wound = (kind: CursorPose['damage'][number], life: number) => ({ damage: [kind], healing: life, wounds: [{ kind, at: life, x: STRIKE.x, y: STRIKE.y }] })
  return [
    restPose(at(0) - PILE.x, y - PILE.y, { ...wound('shredded', 0.8), strips: pileAt(seed + 1, 2), z: LIE }),
    restPose(at(1), y, { ...wound('reassembled', 0.64), strips: gatheredAt(seed + 1, 0.64), z: LIE }),
    restPose(at(2), y, { ...wound('scorched', 0.15), z: LIE }),
    restPose(at(3), y, { ...wound('burn', 0.63), z: LIE }),
    restPose(at(4), y, { ...wound('flattened', 0.3), squash: 0.96, z: LIE })
  ]
}

function arms(): { cursors: CursorPose[]; list: DrawList } {
  const list: DrawList = []
  const cursors = ARMS.map((a, i) => {
    const x = ROW.x + i * SHEET.arms.step + a.x
    const y = ROW.y + a.y
    const grip = a.sheet ? held(x, y, a.sheet) : null
    if (grip) list.push(...grip.shapes)
    return restPose(x, y, { arms: true, lean: a.lean, squash: a.squash, grip: a.grip, strain: a.strain, sprout: 1, hands: grip ? grip.hands : reach(x, y, a.left, a.right) })
  })
  return { cursors, list }
}

export function cursorSheet(id: string, page: PageLogic): SheetFrame | null {
  void page
  const view = homePose(0)
  const shot = (zoom: number, mid = [960, 540]) => ({ ...view, eye: [mid[0]! - 960, 540 - mid[1]!, view.eye[2] / zoom] as [number, number, number], target: [mid[0]! - 960, 540 - mid[1]!, 0] as [number, number, number] })
  if (id === 'cursor-arms') return { ...arms(), view: shot(SHEET.arms.zoom, [ROW.x + 2 * SHEET.arms.step + 18, ROW.y + 62]) }
  if (id === 'cursor-damage') return { list: [], cursors: damage(), view: shot(SHEET.damage.zoom) }
  if (id === 'cursor-acting') return { list: [], cursors: acting(), view: shot(SHEET.acting.zoom) }
  return null
}
