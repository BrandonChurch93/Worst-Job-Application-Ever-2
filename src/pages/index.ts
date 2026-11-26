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

const starting = new Map<string, Promise<void>>()
const started = new Set<string>()

export const pagePrepared = (id: string): boolean => !modules[id]?.prepare || started.has(id)

export function preparePage(id: string): Promise<void> {
  if (pagePrepared(id)) return Promise.resolve()
  let p = starting.get(id)
  if (!p) {
    p = modules[id]!.prepare!().then(
      () => {
        started.add(id)
      },
      (e) => {
        starting.delete(id)
        throw e
      }
    )
    starting.set(id, p)
  }
  return p
}

export function preparePages(only: readonly string[] = Object.keys(modules)): Promise<void> {
  return Promise.all(only.map(preparePage)).then(() => undefined)
}
