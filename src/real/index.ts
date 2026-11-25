import { real as step1 } from '../pages/step1/real'
import { controls } from '../shell/real/controls'
import { real as table } from '../table/real'
import { ground } from '../shell/real/ground'
import { type } from '../shell/real/type'
import type { PartMaker, Real } from './types'

const parts: Record<string, PartMaker | null> = { shell: controls }
for (const page of [step1, table]) {
  for (const [name, maker] of Object.entries(page.parts)) {
    if (name in parts) throw new Error(`Two makers claim the part "${name}"`)
    parts[name] = maker
  }
}

export const real: Real = { ground, type, parts }
