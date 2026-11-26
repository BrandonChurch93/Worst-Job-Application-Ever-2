import type { PageReal } from '../../../real/types'
import { rows } from './rows'
import { dial } from './dial'
import { slot } from './slot'
import { crank } from './crank'

export const real: PageReal = { parts: { rows, dial, slot, crank } }
