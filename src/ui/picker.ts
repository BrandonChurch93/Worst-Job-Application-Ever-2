export interface QualityLevel { id: string; minFps: number }

export interface QualityPicker {
  level(): string
  // One drawn frame's wall time in seconds. Gives back the level the next frame is drawn at.
  frame(seconds: number): string
  // True once the level its first frames can hold is found.
  settled(): boolean
  // Holds one level from now on: a level named by the config, the address or the menu.
  pin(level: string): void
  pinned(): boolean
}

export interface PickerOptions {
  start?: string
  fixed?: string
}

export const PICKER = {
  // Frames left out after a start or a change of level, while shaders compile and buffers are made.
  warmUpFrames: 12,
  // A frame longer than this is a stall, a hidden tab or a file loading, and says nothing about the level.
  stallSeconds: 1,
  // The first frames: one short window at each level, down to the first level that holds.
  firstWindowSeconds: 0.75,
  firstWindowMinFrames: 12,
  // After that: a level is left only when this many windows in a row stay under its minFps.
  steadyWindowSeconds: 2,
  steadyWindowMinFrames: 12,
  steadyWindowsUnder: 3
}

export function medianFps(times: number[]): number {
  if (!times.length) return 0
  const sorted = [...times].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
  return median > 0 ? 1 / median : 0
}

// The level only ever moves down the list, so it can never go up and down in a loop.
export function makeQualityPicker(levels: QualityLevel[], o: PickerOptions = {}): QualityPicker {
  if (!levels.length) throw new Error('The level picker was given no levels')
  const find = (id: string): number => {
    const i = levels.findIndex((l) => l.id === id)
    if (i < 0) throw new Error(`No live quality called "${id}"`)
    return i
  }
  let index = o.fixed !== undefined ? find(o.fixed) : o.start !== undefined ? find(o.start) : 0
  let fixed = o.fixed !== undefined
  let first = true
  let skip = PICKER.warmUpFrames
  let window: number[] = []
  let sum = 0
  let under = 0

  const clear = () => {
    window = []
    sum = 0
  }
  const down = () => {
    index++
    under = 0
    skip = PICKER.warmUpFrames
    clear()
  }

  return {
    level: () => levels[index]!.id,
    settled: () => fixed || !first,
    pinned: () => fixed,
    pin(level: string) {
      index = find(level)
      fixed = true
      first = false
      clear()
    },
    frame(seconds: number): string {
      const here = levels[index]!
      if (fixed || !(seconds > 0) || seconds > PICKER.stallSeconds) return here.id
      if (skip > 0) {
        skip--
        return here.id
      }
      window.push(seconds)
      sum += seconds
      const needSeconds = first ? PICKER.firstWindowSeconds : PICKER.steadyWindowSeconds
      const needFrames = first ? PICKER.firstWindowMinFrames : PICKER.steadyWindowMinFrames
      if (sum < needSeconds || window.length < needFrames) return here.id
      const slow = medianFps(window) < here.minFps
      clear()
      const last = index === levels.length - 1
      if (first) {
        if (slow && !last) down()
        else first = false
      } else if (slow && !last) {
        under++
        if (under >= PICKER.steadyWindowsUnder) down()
      } else {
        under = 0
      }
      return levels[index]!.id
    }
  }
}
