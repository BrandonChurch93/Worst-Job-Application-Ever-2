import type { LayoutNode } from '../copy'
import type { CursorBody, CursorPose } from '../cursor/body'

export type Mode = 'live' | 'film'

export interface Pointer {
  x: number
  y: number
  down: boolean
  flipLeft?: boolean
  flipRight?: boolean
  key?: string
  wheel?: number
  scroll?: number
  skip?: boolean
}

export interface Hint extends Pointer {
  dodge?: { x: number; y: number }
}

export interface Driver {
  readonly name: 'mouse' | 'script' | 'bot' | 'loop'
  input(view: DriverView): Pointer
}

export interface DriverView {
  step: number
  time: number
  pageStep: number
  pageTime: number
  page: PageLogic
  scroll: number
  cursor: CursorBody
  turning: boolean
  skipOffered: boolean
}

export type Tone = 'page' | 'pocket' | 'raised' | 'metal' | 'accent' | 'danger' | 'paper' | 'dark' | 'glass' | 'light' | 'ink' | 'inkLight'
// An anchor shows nothing by itself: it is a place, with no size, where the maker of a part may hang everything that part has in one zone of a page.
export type ShapeKind = 'box' | 'disc' | 'capsule' | 'ball' | 'text' | 'well' | 'anchor'

export interface TypeSpec {
  font: string
  px: number
  align?: 'left' | 'centre' | 'right'
  wrap?: number
  lead?: number
  // Asks for the quieter ink where the ground has one: the fine print on a card of glass.
  ink?: 'soft'
  // The run is set only as far as its box is wide, in whole glyphs from the end it is aligned to.
  cut?: boolean
}

export interface Shape {
  id: string
  part: string
  kind: ShapeKind
  x: number
  y: number
  w: number
  h: number
  z0: number
  z1: number
  tone: Tone
  r?: number
  rot?: number
  turnX?: number
  turnY?: number
  words?: string
  text?: string
  type?: TypeSpec
  mechanism?: boolean
  fixed?: boolean
  pocket?: boolean
  moved?: boolean
  // What the layout tree calls this kind of thing: field, button, keycap. The makers of real parts read it.
  role?: string
  // Numbers a page hands to the maker of its part: how far a key is down, where a barrel points. They are blended between sim steps.
  v?: number[]
}

export type DrawList = Shape[]

export interface CameraPose {
  eye: [number, number, number]
  target: [number, number, number]
  up?: [number, number, number]
  fov: number
  focus?: number
  aperture?: number
  // A well this camera sees in place of a box of the page: the shapes that lie wholly inside the box are left out of its frame.
  omit?: Shape
}

export interface Applicant { firstName: string; lastName: string; email: string }

export interface PageContext {
  mode: Mode
  variant: string
  applicant: Applicant | null
  seed: number
}

export type Emit = (name: string, x: number, y: number, hitsCursor?: boolean) => void

export interface StepIo {
  step: number
  time: number
  elapsed?: number
  dt: number
  pointer: Pointer
  pressed: boolean
  released: boolean
  cursor: CursorBody
  emit: Emit
  mode: Mode
}

export interface GagInfo {
  id: string
  event: string | null
}

export interface TableState {
  tiers: { id: string; standingParts: number; inserts: number; dropTargets: number; display: { box: number[]; charPx: number } }[]
  openings: { id: string; tier: string; clearBalls: number }[]
  rails: { id: string; from: string; to: string }[]
  holds: { id: string; releases: boolean }[]
  sealed: string[]
}

export interface Collider {
  id: string
  kind: 'wall' | 'post' | 'bumper' | 'sling' | 'flipper' | 'model' | 'target' | 'rail' | 'hold' | 'opening' | 'body'
  tier: string
  points: number[]
  z: number
  r?: number
  closed?: boolean
}

// One panel of a sheet that an approved image shows as several pictures side by side: its own moment and its own camera.
export interface SheetPanel {
  list?: DrawList
  cursors: CursorPose[]
  view: CameraPose
}

export interface SheetFrame {
  list: DrawList
  cursors: CursorPose[]
  view: CameraPose
  width?: number
  height?: number
  // Panels are drawn one by one, each as its own picture, and put side by side with a dark gutter of `gutter` px (at 1920 wide) between them.
  panels?: SheetPanel[]
  gutter?: number
}

// How far a page is through its own fields: `done` of `total`. `done` may be a fraction while a page eases it. The header's rail fills by it.
export interface FieldProgress { done: number; total: number }

// How far the header and its step rail are in: 1 in place, 0 off the top of the screen.
// caption: where the page wants the panel of the spoken words, as the y of its lower edge in pixels of the 1920 by 1080 page. Absent: near the bottom.
export interface Chrome { header: number; caption?: number }

export interface PageLogic {
  readonly id: string
  readonly unit: string
  readonly width: number
  readonly height: number
  readonly layout: LayoutNode
  readonly gags: GagInfo[]
  readonly start: { x: number; y: number }
  readonly control: 'pointer' | 'flippers' | 'film'
  reset(ctx: PageContext): void
  step(io: StepIo): void
  save(): unknown
  load(state: unknown): void
  draw(out: DrawList): void
  scroll(): number
  view(): CameraPose | null
  camera(name: string, time: number): CameraPose | null
  script(time: number): Pointer
  hint(): Hint | null
  skip(): void
  done(): boolean
  gag(): string | null
  ignoring(): boolean
  states(): string[]
  tableState?(): TableState
  colliders?(): Collider[]
  sheet?(id: string): SheetFrame | null
  typing?(): boolean
  volume?(): number
  fields?(): FieldProgress | null
  chrome?(): Chrome | null
  // True while the page needs the arrow's arms outside the beat `cursor.armsOnlyInBeat`.
  arms?(): boolean
}

export type PageMaker = () => PageLogic

export interface StageEvent { name: string; step: number; page: string; x: number; y: number; hitsCursor: boolean }

export interface FlowEntry { page: string; variant?: string; opens?: boolean; closes?: number }
