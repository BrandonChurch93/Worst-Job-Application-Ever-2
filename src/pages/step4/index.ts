import { stubPage } from '../stub'
import type { PageLogic } from '../../stage/types'

export const makePage = (): PageLogic => stubPage('step4', 'boss', 4, 'copy:step4.submit', '')
