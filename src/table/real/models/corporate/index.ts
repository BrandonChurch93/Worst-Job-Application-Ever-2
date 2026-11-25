import type { PartMaker } from '../../../../real/types'
import { whole } from '../../zone'
import { buildHq, dropHq, poseHq } from './hq'

const VERSION = 'corporate-1'

export const parts: Record<string, PartMaker | null> = {
  'model-hq': whole('model-hq', { version: VERSION, build: buildHq, pose: poseHq, drop: dropHq }),
  'model-revolving-door': null,
  'model-beach': null,
  'model-boardroom': null,
  'model-ladder': null,
  'model-notes': null,
  'model-wedges': null
}
