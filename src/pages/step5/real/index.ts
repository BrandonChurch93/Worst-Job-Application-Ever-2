import type { PageReal } from '../../../real/types'
import { wait } from './wait'
import { letter } from './letter'
import { stamp } from './stamp'
import { metrics } from './metrics'

export const real: PageReal = { parts: { wait, letter, stamp, metrics } }
