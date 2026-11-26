import type { PartMaker } from '../../../real/types'
import { whole, zone } from '../zone'
import { apron } from './apron'
import { loader, loaderPose } from './loader'
import { marquee, marqueePose, skyReady } from './marquee'
import { levels } from '../lights/levels'
import { drop, liftFor, liftOf } from './mats'
import { tier } from './tier'
import { title, titled } from './title'

export const VERSION = 'frame-75'

// The marquee is built with the skyline drawn by rule until its picture is loaded, and built again when it is.
const board = whole('marquee', { get version() { return skyReady() ? `${VERSION}+picture` : VERSION }, build: marquee, pose: marqueePose, drop })

export const parts: Record<string, PartMaker | null> = {
  'table-frame': whole('table-frame', { version: VERSION, build: (z, ctx) => (z.tier >= 0 ? tier(z, ctx) : apron(z, ctx)), pose: (_o, z, ctx) => { if (z.tier < 0) liftOf(z).value = liftFor(levels(ctx, zone('street')).website) }, drop }),
  // The title on the marquee is the type's run on a material of the marquee's own, so the shell's type never sets it.
  'marquee': { key: (s, ctx) => title.key(s, ctx) ?? board.key(s, ctx), make: (s, ctx) => (titled(s) ? title : board).make(s, ctx), pose: (o, s, ctx) => (titled(s) ? title : board).pose?.(o, s, ctx), drop },
  'loader': whole('loader', { version: VERSION, build: loader, pose: loaderPose, drop })
}
