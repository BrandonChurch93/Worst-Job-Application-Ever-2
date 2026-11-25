import type { PageMaker } from '../stage/types'
import * as marketing from './marketing'
import * as step1 from './step1'
import * as step2 from './step2'
import * as step3 from './step3'
import * as step4 from './step4'
import * as step5 from './step5'

interface PageModule { makePage: PageMaker; prepare?: () => Promise<void> }

const modules: Record<string, PageModule> = { marketing, step1, step2, step3, step4, step5 }

export const pages: Record<string, PageMaker> = Object.fromEntries(Object.entries(modules).map(([id, m]) => [id, m.makePage]))

export const unitPages: Record<string, string[]> = { marketing: ['marketing'], step1: ['step1'], step2: ['step2'], pinball: ['step3'], boss: ['step4'], decision: ['step5'] }

let prepared: Promise<void> | null = null

export function preparePages(): Promise<void> {
  if (!prepared) prepared = Promise.all(Object.values(modules).map((m) => m.prepare?.())).then(() => undefined)
  return prepared
}
