import { stubPage } from '../stub'
import type { PageLogic } from '../../stage/types'

export const makePage = (): PageLogic => stubPage('step1', 'step1', 1, 'copy:step1.continue', '')
