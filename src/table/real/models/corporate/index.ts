import type { PartMaker } from '../../../../real/types'
import { whole } from '../../zone'
import { buildBeach, dropBeach, poseBeach } from './beach'
import { buildBoardroom, dropBoardroom } from './boardroom'
import { buildHq, dropHq, poseHq } from './hq'
import { buildLadder, dropLadder } from './ladder'
import { buildNotes, dropNotes, poseNotes } from './notes'
import { buildRevolving, dropRevolving, poseRevolving } from './revolving'
import { buildWedges, dropWedges } from './wedges'

const VERSION = 'corporate-2'

export const parts: Record<string, PartMaker | null> = {
  'model-hq': whole('model-hq', { version: VERSION, build: buildHq, pose: poseHq, drop: dropHq }),
  'model-revolving-door': whole('model-revolving-door', { version: VERSION, build: buildRevolving, pose: poseRevolving, drop: dropRevolving }),
  'model-beach': whole('model-beach', { version: VERSION, build: buildBeach, pose: poseBeach, drop: dropBeach }),
  'model-boardroom': whole('model-boardroom', { version: VERSION, build: buildBoardroom, drop: dropBoardroom }),
  'model-ladder': whole('model-ladder', { version: VERSION, build: buildLadder, drop: dropLadder }),
  'model-notes': whole('model-notes', { version: VERSION, build: buildNotes, pose: poseNotes, drop: dropNotes }),
  'model-wedges': whole('model-wedges', { version: VERSION, build: buildWedges, drop: dropWedges })
}
