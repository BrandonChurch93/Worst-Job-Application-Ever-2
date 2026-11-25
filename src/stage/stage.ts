import type * as THREE from 'three'
import { stepHz } from '../config'
import type { Bounds } from '../core/renderer'
import type { TypeRun } from '../shell/type'

// Where the pointer is, in page pixels, and whether its button is down. The one thing a driver feeds the stage.
export interface Pointer { x: number; y: number; down: boolean }

export interface Driver {
  readonly name: 'mouse' | 'script' | 'bot' | 'loop'
  input(step: number, time: number): Pointer
}

export interface StageEvent { name: string; step: number; x: number; y: number; hitsCursor: boolean }
export type Emit = (name: string, x: number, y: number, hitsCursor?: boolean) => void

export interface CursorState {
  x: number
  y: number
  heightPx: number
  screenHeightPx: number
  worldScale: number
  acting: string
  damage: string[]
  arms: boolean
  onPage: boolean
  inBall: boolean
  ballScreenPx: number
}

export interface LayoutPart { id: string; kind: string; planned: number[]; drawn: number[]; plannedHeight: number | null; height: number; mechanism: boolean }

export interface PageRuntime {
  readonly id: string
  readonly scene: THREE.Scene
  readonly bounds: Bounds
  // The length of the page's script, in seconds.
  readonly seconds: number
  reset(): void
  // One sim step. Everything that moves by steps moves here and nowhere else.
  step(input: Pointer, step: number, emit: Emit): void
  // Puts the scene between the step before the last and the last: 0 is the earlier, 1 the later.
  pose(alpha: number): void
  save(): number[]
  load(state: number[]): void
  script(time: number): Pointer
  cursor(): { x: number; y: number; z: number; scale: number; acting: string; damage: string[]; arms: boolean; onPage: boolean; inBall: boolean }
  layout(): LayoutPart[]
  type(): TypeRun[]
  standIns(): { name: string; unit: string }[]
  textureBytes(): number
}

export class Stage {
  // How many steps have been taken. The page holds the state after this many, and the one before it.
  step = 0
  events: StageEvent[] = []
  private emit: Emit = (name, x, y, hitsCursor = false) => {
    this.events.push({ name, step: this.step, x, y, hitsCursor })
  }

  constructor(readonly page: PageRuntime, public driver: Driver) {
    this.reset()
  }

  reset(): void {
    this.page.reset()
    this.step = 0
    this.events = []
  }

  advance(steps: number): void {
    for (let i = 0; i < steps; i++) {
      const input = this.driver.input(this.step, this.step / stepHz)
      this.page.step(input, this.step, this.emit)
      this.step++
    }
  }

  // Moves to a moment and poses the page there. A moment between two steps takes the state between them.
  seek(time: number): void {
    const s = Math.max(0, time) * stepHz
    const n = Math.floor(s + 1e-7)
    const alpha = Math.min(1, Math.max(0, s - n))
    if (n === 0 && alpha === 0) {
      if (this.step !== 0) this.reset()
      this.page.pose(1)
      return
    }
    if (this.step > n + 1) this.reset()
    this.advance(n + 1 - this.step)
    this.page.pose(alpha)
  }

  eventsBetween(fromStep: number, toStep: number): StageEvent[] {
    return this.events.filter((e) => e.step >= fromStep && e.step < toStep)
  }
}

export class ScriptDriver implements Driver {
  readonly name = 'script' as const
  constructor(private page: PageRuntime) {}
  input(_step: number, time: number): Pointer {
    return this.page.script(time)
  }
}

export class MouseDriver implements Driver {
  readonly name = 'mouse' as const
  pointer: Pointer = { x: 960, y: 540, down: false }
  input(): Pointer {
    return this.pointer
  }
}
