import type { PageReal } from '../../../real/types'
import { keyboard } from './keyboard'
import { paper } from './paper'
import { shredder } from './shredder'
import { slabs } from './slabs'
import { turrets } from './turrets'

export const real: PageReal = { parts: { keyboard, turrets, slabs, paper, shredder } }
