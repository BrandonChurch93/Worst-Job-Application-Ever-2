import { stubPage } from '../stub'
import type { PageLogic } from '../../stage/types'

export const makePage = (): PageLogic => stubPage('marketing', 'marketing', null, 'copy:marketing.hero.cta', 'copy:marketing.hero.headline')
