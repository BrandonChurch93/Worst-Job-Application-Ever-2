import { stepHz } from '../config'
import { Random, stream } from '../core/random'
import type { Driver, DriverView, Pointer } from './types'

export type BotName = 'keen' | 'clumsy' | 'random' | 'skipper'

const SPEED: Record<BotName, number> = { keen: 2600, clumsy: 520, random: 1800, skipper: 2600 }
const REACH = 22

export class BotDriver implements Driver {
  readonly name = 'bot' as const
  private x = 960
  private y = 540
  private rng: Random
  private goal = { x: 960, y: 540 }
  private until = 0
  private press = 0
  private left = 0
  private right = 0
  private lag: { left: boolean; right: boolean }[] = []
  private wheelAt = 0

  constructor(readonly bot: BotName, seed: number) {
    this.rng = stream(`bot:${bot}`, seed)
  }

  // The hand is somewhere else now: a visitor who left the picture comes back in where the mouse is.
  moveTo(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  private walk(tx: number, ty: number): void {
    const max = SPEED[this.bot] / stepHz
    const dx = tx - this.x
    const dy = ty - this.y
    const d = Math.hypot(dx, dy)
    if (d <= max) {
      this.x = tx
      this.y = ty
    } else {
      this.x += (dx / d) * max
      this.y += (dy / d) * max
    }
  }

  input(v: DriverView): Pointer {
    const out: Pointer = { x: this.x, y: this.y, down: false }
    if (v.turning) return out
    const careers = v.page.unit === 'marketing'
    if (v.skipOffered && (this.bot === 'skipper' || this.bot === 'random')) out.skip = true
    const hint = v.page.hint()
    if (this.bot === 'skipper' && !careers) return out
    if (this.bot === 'random') return this.wander(v, out, hint)
    if (!hint) return out
    const aim = this.bot === 'clumsy' || !hint.dodge ? hint : hint.dodge
    const ty = aim.y - v.scroll
    if (ty < 90 || ty > 990) {
      if (v.step >= this.wheelAt) {
        out.wheel = ty < 90 ? -120 : 120
        this.wheelAt = v.step + 10
      }
    }
    this.walk(aim.x, Math.min(1070, Math.max(10, ty)))
    out.x = this.x
    out.y = this.y
    const near = Math.hypot(hint.x - this.x, hint.y - v.scroll - this.y) <= REACH
    out.down = hint.down && near
    let left = hint.flipLeft === true
    let right = hint.flipRight === true
    if (this.bot === 'clumsy') {
      this.lag.push({ left, right })
      const late = this.lag.length > stepHz * 0.22 ? this.lag.shift()! : { left: false, right: false }
      left = late.left
      right = late.right
    }
    if (left) out.flipLeft = true
    if (right) out.flipRight = true
    if (hint.key !== undefined && near) out.key = hint.key
    return out
  }

  private wander(v: DriverView, out: Pointer, hint: Pointer | null): Pointer {
    const r = this.rng
    if (v.step >= this.until) {
      this.until = v.step + Math.round(r.range(0.3, 1.3) * stepHz)
      if (hint && r.next() < 0.4) {
        this.goal = { x: hint.x, y: hint.y - v.scroll }
        if (this.goal.y < 60 || this.goal.y > 1020) out.wheel = this.goal.y < 60 ? -480 : 480
        this.goal.y = Math.min(1070, Math.max(10, this.goal.y))
      } else {
        this.goal = { x: r.range(40, 1880), y: r.range(40, 1040) }
        if (r.next() < 0.15) out.wheel = r.range(-600, 600)
      }
      this.press = r.next() < 0.6 ? Math.round(r.range(0.05, 0.3) * stepHz) : 0
      this.left = r.next() < 0.5 ? Math.round(r.range(0.05, 0.5) * stepHz) : 0
      this.right = r.next() < 0.5 ? Math.round(r.range(0.05, 0.5) * stepHz) : 0
    }
    this.walk(this.goal.x, this.goal.y)
    out.x = this.x
    out.y = this.y
    const there = Math.hypot(this.goal.x - this.x, this.goal.y - this.y) < 2
    if (there && this.press > 0) {
      out.down = true
      this.press--
    }
    if (this.left > 0) {
      out.flipLeft = true
      this.left--
    }
    if (this.right > 0) {
      out.flipRight = true
      this.right--
    }
    return out
  }
}

export interface BotRun { bot: BotName; seed: number; finished: boolean; seconds: number; ignoredPointer: number; ignoredFlippers: number; gags: string[]; pages: string[]; pageSeconds: Record<string, number>; skips: number; stuckOn: string | null }
