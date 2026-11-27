import { stepHz } from '../src/config'
import type { CursorPose } from '../src/cursor/body'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'

export const FILM_FROM = 840
export const FILM_FRAMES = 1920
export interface FilmRow { frame: number; pose: CursorPose; events: string[]; list: DrawList }

// The film's own path through step 1 on the stepped stage with no browser: one row for each film frame.
export function film(): FilmRow[] {
  const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
  const per = stepHz / 60
  const rows: FilmRow[] = []
  let seen = 0
  let events: string[] = []
  for (let n = 1; n <= FILM_FRAMES * per; n++) {
    s.advance(1)
    events = events.concat(s.events.slice(seen).map((e) => e.name))
    seen = s.events.length
    if (n % per !== 0) continue
    const list: DrawList = []
    s.page.draw(list)
    rows.push({ frame: n / per + FILM_FROM, pose: s.cursor.pose(), events, list })
    events = []
  }
  return rows
}
