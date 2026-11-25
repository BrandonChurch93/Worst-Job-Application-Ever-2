import { stubPage } from '../stub'
import type { PageLogic } from '../../stage/types'

export const makePage = (): PageLogic => stubPage('step2', 'step2', 2, 'copy:step2.continue', '')
