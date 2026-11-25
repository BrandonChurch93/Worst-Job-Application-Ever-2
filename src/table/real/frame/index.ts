import type { PartMaker } from '../../../real/types'
import { whole } from '../zone'
import { apron } from './apron'
import { loader } from './loader'
import { marquee, marqueePose, skyReady } from './marquee'
import { drop } from './mats'
import { tier } from './tier'

export const VERSION = 'frame-6'

export const parts: Record<string, PartMaker | null> = {
  'table-frame': whole('table-frame', { version: VERSION, build: (z, ctx) => (z.tier >= 0 ? tier(z, ctx) : apron(z, ctx)), drop }),
  // The marquee is built with the skyline drawn by rule until its picture is loaded, and built again when it is.
  'marquee': whole('marquee', { get version() { return skyReady() ? `${VERSION}+picture` : VERSION }, build: marquee, pose: marqueePose, drop }),
  'loader': whole('loader', { version: VERSION, build: loader, drop })
}
