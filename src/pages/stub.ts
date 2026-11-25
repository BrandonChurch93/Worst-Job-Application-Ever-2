import { config, stepHz } from '../config'
import type { LayoutNode } from '../copy'
import { boxOf, drawLayout } from '../shell/layout'
import { button, buttonWidth, HEADER, header, LEFT, page, SCREEN_H, stepHead, TYPE } from '../shell/parts'
import { text } from '../shell/layout'
import { TURN_HALF } from '../stage/stage'
import type { DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, StepIo } from '../stage/types'

interface State { time: number; fired: number; pressed: boolean; done: boolean; mode: 'live' | 'film'; variant: string; hold: number }

export function stubPage(id: string, unit: string, step: number | null, go: string, headline: string): PageLogic {
  const beats = config.film.beats.filter((b) => b.unit === unit)
  const seconds = config.film.units.find((u) => u.id === unit)!.seconds
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const w = buttonWidth(go)
  const press = button('go', LEFT, 520, w, go, { part: 'shell' })
  const top: LayoutNode[] = step === null ? [...header(0), text('heading', headline, { ...TYPE.heading, wrap: 1100 }, LEFT, HEADER.headingY, { part: 'type' })] : stepHead(step)
  const layout = page(id, SCREEN_H, [...top, press])
  const target = boxOf(layout, 'go-cap')
  const start = { x: 1180, y: 760 }
  const s: State = { time: 0, fired: 0, pressed: false, done: false, mode: 'live', variant: '', hold: 0 }
  const pressAt = unit === 'decision' ? 10.2 : seconds - TURN_HALF - 0.5
  const over = (p: { x: number; y: number }) => p.x >= target.x && p.x <= target.x + target.w && p.y >= target.y && p.y <= target.y + target.h

  return {
    id, unit, width: 1920, height: SCREEN_H, layout, gags, start, control: 'pointer',
    reset(ctx: PageContext) {
      Object.assign(s, { time: 0, fired: 0, pressed: false, done: false, mode: ctx.mode, variant: ctx.variant, hold: 0 })
    },
    step(io: StepIo) {
      s.time = io.time
      const pace = s.mode === 'film' ? 1 : 0.12
      while (s.fired < beats.length) {
        const b = beats[s.fired]!
        const at = (b.from + (b.to - b.from) * 0.4) * pace
        if (s.time < at) break
        const event = (b as { event?: string }).event
        if (event && event !== 'page-turn' && event !== 'step') io.emit(event, target.cx, target.cy, false)
        s.fired++
      }
      if (io.pressed && over(io.pointer) && !s.pressed && s.fired >= beats.length - 1) {
        s.pressed = true
        io.emit('button-press', target.cx, target.cy, false)
      }
      if (s.pressed) {
        s.hold += 1 / stepHz
        if (s.hold > 0.25) s.done = true
      }
    },
    save: () => ({ ...s }),
    load(state) {
      Object.assign(s, state as State)
    },
    draw(out: DrawList) {
      drawLayout(out, layout, { states: ['rest'], over: s.pressed ? { 'go-cap': { z1: config.scale.heights.button - config.scale.heights.keyTravel } } : {} })
    },
    scroll: () => 0,
    view: () => null,
    camera: () => null,
    script(time: number): Pointer {
      const u = Math.min(1, Math.max(0, (time - 0.8) / Math.max(0.5, pressAt - 1.6)))
      const e = u * u * (3 - 2 * u)
      return { x: start.x + (target.cx - start.x) * e, y: start.y + (target.cy - start.y) * e, down: time >= pressAt && time < pressAt + 0.2 }
    },
    hint(): Hint | null {
      return { x: target.cx, y: target.cy, down: s.fired >= beats.length - 1 && Math.floor(s.time * 4) % 2 === 0 }
    },
    skip() {
      s.pressed = true
    },
    done: () => s.done && s.variant !== 'rejected',
    gag: () => (s.fired > 0 ? beats[Math.min(s.fired, beats.length) - 1]!.id : null),
    ignoring: () => false,
    states: () => ['rest']
  }
}
