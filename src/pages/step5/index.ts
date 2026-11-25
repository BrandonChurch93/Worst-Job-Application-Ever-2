import { stubPage } from '../stub'
import type { PageLogic } from '../../stage/types'

export const makePage = (): PageLogic => stubPage('step5', 'decision', 5, 'copy:step5.accept', '')
