import { stubPage } from '../stub'
import type { PageLogic } from '../../stage/types'

export const makePage = (): PageLogic => stubPage('step3', 'pinball', 3, 'copy:step2.continue', '')
