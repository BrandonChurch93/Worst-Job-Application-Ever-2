import type { PageReal } from '../../../real/types'
import { applyButton } from './apply-button'
import { careersPage } from './careers-page'
import { perkCards } from './perk-cards'
import { ticker } from './ticker'

export const real: PageReal = { parts: { 'careers-page': careersPage, 'perk-cards': perkCards, ticker, 'apply-button': applyButton } }
