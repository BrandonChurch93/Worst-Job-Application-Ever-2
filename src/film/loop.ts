import { config } from '../config'
import type { CursorPose } from '../cursor/body'
import { homePose } from '../stage/camera'
import type { Frame } from '../stage/stage'
import type { CameraPose } from '../stage/types'
import { CURSOR_BOX, cursorAt, fireScene, LOOP_SECONDS, type Threat } from './fire'
import type { Box, FilmPiece } from './piece'

const fps = config.film.fps
const loop = config.deliver.cardLoop

export interface LoopPiece extends FilmPiece {
  scene: string
  state(index: number): { cursor: Box; threat: Box }
}

export const cropOf = (ratio: number, width = 1920, height = 1080): Box => {
  const w = Math.min(width, height * ratio)
  return { x: (width - w) / 2, y: 0, w, h: height }
}
export const inside = (b: Box, crop: Box): boolean => b.x >= crop.x && b.y >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h <= crop.y + crop.h
export const cursorBox = (c: CursorPose): Box => ({ x: c.x - CURSOR_BOX.left, y: c.y - CURSOR_BOX.top, w: CURSOR_BOX.w, h: CURSOR_BOX.h })

const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

export function threatOf(threats: Threat[], cursor: Box): Box | null {
  const c = centre(cursor)
  const square = cropOf(1)
  let best: Box | null = null
  let far = Infinity
  let bestIn = false
  for (const t of threats) {
    const p = centre(t.box)
    const d = Math.hypot(p.x - c.x, p.y - c.y)
    const within = inside(t.box, square)
    if ((within && !bestIn) || (within === bestIn && d < far)) {
      best = t.box
      far = d
      bestIn = within
    }
  }
  return best
}

export function makeLoop(): LoopPiece {
  const frameCount = Math.round(loop.seconds * fps)
  const pose = homePose(0)
  const size = { width: 1920, height: 1080 }
  const timeOf = (index: number): number => {
    const i = ((index % frameCount) + frameCount) % frameCount
    return i / fps
  }

  return {
    frameCount,
    seconds: loop.seconds,
    size,
    scene: loop.candidates[0]!,
    frame(index: number): Frame {
      const time = timeOf(index)
      const scene = fireScene(time / LOOP_SECONDS)
      return { list: scene.list, cursor: cursorAt(time), turn: 0, scroll: 0, page: 'loop', view: null }
    },
    pose: (): CameraPose => pose,
    state(index: number) {
      const time = timeOf(index)
      const cursor = cursorBox(cursorAt(time))
      const threat = threatOf(fireScene(time / LOOP_SECONDS).threats, cursor)
      return { cursor, threat: threat ?? cursor }
    }
  }
}
