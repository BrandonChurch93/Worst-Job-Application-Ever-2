import { real as marketing } from '../pages/marketing/real'
import { real as step1 } from '../pages/step1/real'
import { real as step2 } from '../pages/step2/real'
import { real as step4 } from '../pages/step4/real'
import { real as step5 } from '../pages/step5/real'
import { controls } from '../shell/real/controls'
import { real as table } from '../table/real'
import { ground } from '../shell/real/ground'
import { type } from '../shell/real/type'
import type { Shape } from '../stage/types'
import type { PartMaker, Real } from './types'

const parts: Record<string, PartMaker | null> = { shell: controls }
for (const page of [marketing, step1, step2, table, step4, step5]) {
  for (const [name, maker] of Object.entries(page.parts)) {
    if (name in parts) throw new Error(`Two makers claim the part "${name}"`)
    parts[name] = maker
  }
}

export const real: Real = { ground, type, parts }

// How bright the website's own light is in a frame, 0 to 1: the anchors of the table's lights carry it. It counts once the table's lights are real, so a machine of stand-ins is never left in the dark.
export const websiteLevel = (list: Shape[], lit = parts['table-lights'] !== null && parts['table-lights'] !== undefined): number => {
  let level = 1
  if (!lit) return level
  for (const s of list) if (s.kind === 'anchor' && s.part === 'table-lights' && s.v !== undefined && s.v.length > 1) level = Math.min(level, s.v[1]!)
  return level
}
