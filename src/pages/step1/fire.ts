import { config } from '../../config'
import { boxOf, drawLayout } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { TYPE } from '../../shell/parts'
import type { DrawList, Shape } from '../../stage/types'
import { CAP_TOP, DECK, DECK_TOP, hatchCentre, homePlaces, keyAt, onDeck, seats, TRAVEL } from './keyboard'
import { buildLayout, FIELDS, stageState } from './layout'
import { Turrets, type Tune } from './turrets'

const WELL = -(CAP_TOP + 12)

export interface FireView { typed: string; pressed: string[]; turrets: Turrets; time?: number }

export const fireSurface = (x: number, y: number): number => (onDeck(x, y) ? (keyAt(homePlaces(), x, y) >= 0 ? CAP_TOP : DECK_TOP) : 0)

export function makeTurrets(tune?: Tune): Turrets {
  return new Turrets([hatchCentre(0), hatchCentre(1)], DECK_TOP, config.live.step1.hitsBeforeTurretsOverheat, fireSurface, tune)
}

let built: ReturnType<typeof buildLayout> | null = null

export function drawFire(out: DrawList, view: FireView): void {
  built ??= buildLayout()
  const layout = built
  const over: Record<string, Partial<Shape> | null> = {}
  out.push({ id: 'keyboard-well', part: 'keyboard', kind: 'well', x: DECK.x, y: DECK.y, w: DECK.w, h: DECK.h, z0: WELL, z1: 0, tone: 'dark' })
  over['keyboard-deck'] = { z0: WELL, z1: DECK_TOP }
  for (const side of [0, 1]) over[`hatch-${side}`] = { z0: DECK_TOP, z1: DECK_TOP + 0.6 }
  for (const seat of seats) {
    const top = CAP_TOP - (view.pressed.includes(seat.name) ? TRAVEL : 0)
    over[`key-${seat.name}`] = { z0: DECK_TOP, z1: top, mechanism: true }
    if (seat.name !== 'space') over[`key-${seat.name}-legend`] = { z0: top, z1: top }
  }
  for (const f of FIELDS) over[`${f}-value`] = { z0: 0.1, z1: 0.1 }
  drawLayout(out, layout, { states: ['rest', 'keyboard', 'note', stageState('name')], over, runtime: { 'step1.name': view.typed, 'step1.email': '' } })
  const p = boxOf(layout, 'name-pocket')
  out.push({ id: 'field-focus', part: 'shell', kind: 'box', x: p.x + 14, y: p.y + p.h - 5, w: p.w - 28, h: 3, z0: 0.1, z1: 0.5, tone: 'accent' })
  if (view.time !== undefined && Math.floor(view.time * 2.5) % 2 === 0) {
    const v = boxOf(layout, 'name-value')
    const w = view.typed ? block(TYPE.value.font, view.typed, TYPE.value.px).width : 0
    out.push({ id: 'field-caret', part: 'shell', kind: 'box', x: v.x + w + 4, y: p.y + 16, w: 3, h: p.h - 32, z0: 0.1, z1: 0.5, tone: 'ink' })
  }
  view.turrets.draw(out, 0)
}
