import type * as THREE from 'three'
import { config } from '../config'
import type { CursorPose } from './body'

// The arrow's outline in its own units: the tip, the hot spot, is the first point. x runs right, y runs down the page.
export const OUTLINE: [number, number][] = [[0, 0], [0, 16.2], [3.9, 12.6], [6.9, 19], [9.6, 17.8], [6.7, 11.6], [11.8, 11.6]]
export const OUTLINE_BOX = { w: 12, h: 19 }
// Page pixels to one unit of the outline.
export const UNIT = config.cursor.heightPxAt1080 / OUTLINE_BOX.h
// Where an arm leaves the body, in outline units: left, right.
export const SHOULDERS: [[number, number], [number, number]] = [[-0.2, 10.5], [8.6, 10.5]]

// A burn hole, in outline units. glow runs from 1, just burnt, to 0, cold.
export interface Hole { x: number; y: number; r: number; glow: number }
// Where one strip of a shredded body lies: page pixels away from its place in the whole body, and its turns in radians.
export interface StripPose { x: number; y: number; z: number; rot: number; tilt: number }

// Everything the body can be asked to look like. Each number is 0 at rest unless it says otherwise.
export interface BodyLook {
  // Length along the arrow, 1 at rest. The body keeps its volume.
  stretch: number
  // Curl of the tail to one side, -1 to 1.
  bend: number
  // Swollen with pride or anger.
  puff: number
  // How hard it shakes. The body draws the shake from time.
  tremble: number
  // Glossy enamel to pale matte stone.
  pale: number
  // Red to orange glow that climbs from the tip.
  heat: number
  // Sagging, with glossy runs.
  melt: number
  // Pressed thin.
  flat: number
  // Blackened from the tip.
  char: number
  holes: Hole[]
  // Null for a body in one piece. Otherwise the body is cut along its length into this many strips.
  strips: StripPose[] | null
  time: number
}

export interface EffectsLook {
  // Beads of sweat on and round the body.
  sweat: number
  // Steam off the top.
  steam: number
  // Wisps of smoke, each from a point of the outline.
  smoke: { x: number; y: number; amount: number }[]
  // A puff of dust: how far through it is, 0 to 1, or -1 for none.
  dust: number
  time: number
}

export interface ArmsLook {
  // How closed each hand is: 0 open, 1 a fist.
  grip: [number, number]
  // How hard the arms pull: they thin and straighten.
  strain: number
  time: number
}

export interface CursorLook { body: BodyLook; effects: EffectsLook; arms: ArmsLook }

export const restLook = (time = 0): CursorLook => ({
  body: { stretch: 1, bend: 0, puff: 0, tremble: 0, pale: 0, heat: 0, melt: 0, flat: 0, char: 0, holes: [], strips: null, time },
  effects: { sweat: 0, steam: 0, smoke: [], dust: -1, time },
  arms: { grip: [1, 1], strain: 0, time }
})

// The body is built in page pixels with the tip at the origin, x to the right, y up the page (so the arrow hangs down), z off the page.
export interface BodyModel {
  root: THREE.Object3D
  apply(look: BodyLook): void
  // Where a point of the outline is on the body as it is drawn now, in the root's own space.
  anchor(x: number, y: number, out: THREE.Vector3): THREE.Vector3
  dispose(): void
}

// The effects live in the same space as the body's root, but are not turned with it: steam rises and sweat falls the same way however the body leans.
export interface EffectsModel {
  root: THREE.Object3D
  apply(look: EffectsLook, body: BodyModel, turn: number): void
  dispose(): void
}

// Arms are drawn in the page's space: world units, from each shoulder to each hand.
export interface ArmsModel {
  root: THREE.Object3D
  apply(from: [THREE.Vector3, THREE.Vector3], to: [THREE.Vector3, THREE.Vector3], look: ArmsLook): void
  dispose(): void
}

// Turns what the cursor is doing into what it looks like. It changes the look it is given.
export type LookMaker = (pose: CursorPose, look: CursorLook) => void
