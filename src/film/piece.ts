import type { Frame } from '../stage/stage'
import type { CameraPose } from '../stage/types'

export interface FilmPiece {
  frameCount: number
  seconds: number
  size: { width: number; height: number }
  frame(index: number): Frame
  pose(index: number): CameraPose
}

export interface Box { x: number; y: number; w: number; h: number }
