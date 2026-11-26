import type { PartMaker } from '../../../../real/types'
import { levels } from '../../lights'
import { whole } from '../../zone'
import { buildCoffee } from './coffee'
import { buildCubicles } from './cubicles'
import { buildInbox, poseInbox } from './inbox'
import { FILL, matsOf } from './kit'
import { buildStaplers, poseStaplers } from './staplers'

const VERSION = 'office-7'

export const parts: Record<string, PartMaker | null> = {
  'model-coffee-machine': whole('model-coffee-machine', {
    version: VERSION,
    build: (z, ctx) => buildCoffee(z, ctx),
    pose: (_o, z, ctx) => {
      const l = levels(ctx, z)
      const m = matsOf(z)
      m.level.value = l.byName.windows ?? 0
      m.fill.value = l.general * FILL
    }
  }),
  'model-cubicles': whole('model-cubicles', { version: VERSION, build: (z, ctx) => buildCubicles(z, ctx) }),
  'model-inbox': whole('model-inbox', { version: VERSION, build: (z) => buildInbox(z), pose: poseInbox }),
  'model-staplers': whole('model-staplers', { version: VERSION, build: (z) => buildStaplers(z), pose: poseStaplers })
}
