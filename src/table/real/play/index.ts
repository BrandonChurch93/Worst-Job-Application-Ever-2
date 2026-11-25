import type { PartMaker } from '../../../real/types'
import { bumpers } from './bumpers'
import { flippers } from './flippers'
import { ramps } from './ramps'
import { targets } from './targets'

export const parts: Record<string, PartMaker | null> = { 'flippers': flippers, 'bumpers': bumpers, 'targets': targets, 'ramps': ramps }
