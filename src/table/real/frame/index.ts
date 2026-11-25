import type { PartMaker } from '../../../real/types'
import { whole } from '../zone'
import { apron } from './apron'
import { loader } from './loader'
import { marquee, marqueePose } from './marquee'
import { drop } from './mats'
import { tier } from './tier'

export const VERSION = 'frame-2'

export const parts: Record<string, PartMaker | null> = {
  'table-frame': whole('table-frame', { version: VERSION, build: (z, ctx) => (z.tier >= 0 ? tier(z, ctx) : apron(z, ctx)), drop }),
  'marquee': whole('marquee', { version: VERSION, build: marquee, pose: marqueePose, drop }),
  'loader': whole('loader', { version: VERSION, build: loader, drop })
}
