import type { PageMaker } from '../stage/types'
import { makePage as marketing } from './marketing'
import { makePage as step1 } from './step1'
import { makePage as step2 } from './step2'
import { makePage as step3 } from './step3'
import { makePage as step4 } from './step4'
import { makePage as step5 } from './step5'

export const pages: Record<string, PageMaker> = { marketing, step1, step2, step3, step4, step5 }

export const unitPages: Record<string, string[]> = { marketing: ['marketing'], step1: ['step1'], step2: ['step2'], pinball: ['step3'], boss: ['step4'], decision: ['step5'] }
