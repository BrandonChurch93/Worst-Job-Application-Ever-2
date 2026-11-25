import { config } from '../../config'
import { boxOf, drawLayout } from '../../shell/layout'
import type { DrawList, Shape } from '../../stage/types'
import { CAP_TOP, DECK, DECK_TOP, hatchCentre, homePlaces, keyAt, onDeck, seats, TRAVEL } from './keyboard'
import { buildLayout, FIELDS } from './layout'
import { Turrets } from './turrets'

const WELL = -(CAP_TOP + 12)

export interface FireView { typed: string; pressed: string[]; turrets: Turrets }

export const fireSurface = (x: number, y: number): number => (onDeck(x, y) ? (keyAt(homePlaces(), x, y) >= 0 ? CAP_TOP : DECK_TOP) : 0)

export function makeTurrets(): Turrets {
  return new Turrets([hatchCentre(0), hatchCentre(1)], DECK_TOP, config.live.step1.hitsBeforeTurretsOverheat, fireSurface)
}

const layout = buildLayout()

export function drawFire(out: DrawList, view: FireView): void {
  const over: Record<string, Partial<Shape> | null> = {}
  out.push({ id: 'keyboard-well', part: 'keyboard', kind: 'well', x: DECK.x, y: DECK.y, w: DECK.w, h: DECK.h, z0: WELL, z1: 0, tone: 'dark' })
  over['keyboard-deck'] = { z0: WELL, z1: DECK_TOP, mechanism: true }
  for (const side of [0, 1]) over[`hatch-${side}`] = { z0: DECK_TOP, z1: DECK_TOP + 0.6 }
  for (const seat of seats) {
    if (!view.pressed.includes(seat.name)) continue
    const top = CAP_TOP - TRAVEL
    over[`key-${seat.name}`] = { z1: top, mechanism: true }
    if (seat.name !== 'space') over[`key-${seat.name}-legend`] = { z0: top, z1: top }
  }
  for (const f of FIELDS) over[`${f}-value`] = { z0: 0.1, z1: 0.1 }
  drawLayout(out, layout, { states: ['rest', 'prompt', 'keyboard', 'note'], over, runtime: { 'step1.firstName': view.typed, 'step1.lastName': '', 'step1.email': '' } })
  const p = boxOf(layout, 'firstName-pocket')
  out.push({ id: 'field-focus', part: 'shell', kind: 'box', x: p.x + 14, y: p.y + p.h - 5, w: p.w - 28, h: 3, z0: 0.1, z1: 0.5, tone: 'accent' })
  view.turrets.draw(out, 0)
}
