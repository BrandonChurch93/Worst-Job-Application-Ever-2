// What the picture is like under the row of controls: the row stands bare on the page, on a pale capsule or on a dark one.
import type { Frame } from '../stage/stage'
import { BALL, LAST_Y, MARQUEE_Y } from '../table/layout'

export type Backing = 'page' | 'light' | 'dark'

// The row's place on the page, in page px from the upper left of the picture.
export const ROW = { x0: 128, x1: 700, y1: 56 }
// The pinball machine is set into the page from the marquee's upper edge to the apron's lower edge, and all of it is dark.
export const MACHINE = { top: MARQUEE_Y * BALL, bottom: LAST_Y * BALL }
// The cabinet stands over the page above its upper edge and shades it. Measured in the picture at the low level, under the
// row: 0.78 with the row's lower edge 444 px above that edge, 0.57 at 249 px, 0.27 at 10 px. The row's ink needs 0.575.
export const SHADE = 400

export function backingOf(f: Frame | null, unit: string): Backing {
  if (!f) return 'page'
  // On the pinball page the machine is dark under every camera, and under none too: the view goes down the page beside the feed tube before the first tier camera takes over. The page above the marquee is in the cabinet's shade and counts with it.
  if (unit === 'pinball' && (f.view || (f.scroll + ROW.y1 > MACHINE.top - SHADE && f.scroll < MACHINE.bottom))) return 'dark'
  if (f.view) return 'light'
  // A turning page shows the dark room past its upper edge, where the row's ink cannot be read.
  if (f.turn !== 0) return 'light'
  let under: Backing = 'page'
  for (const s of f.list) {
    if (s.kind === 'well' || s.kind === 'anchor' || s.x >= ROW.x1 || s.x + s.w <= ROW.x0 || s.y >= f.scroll + ROW.y1 || s.y + s.h <= f.scroll) continue
    if (s.w >= 1900 && s.z1 <= 0) continue
    if (s.tone === 'dark') return 'dark'
    under = 'light'
  }
  return under
}
