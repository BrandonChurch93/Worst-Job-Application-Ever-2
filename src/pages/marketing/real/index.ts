import type { PageReal } from '../../../real/types'
import { careersPage } from './careers-page'
import { perkCards } from './perk-cards'
import { ticker } from './ticker'
import { applyButton } from './apply-button'

export const real: PageReal = { parts: { 'careers-page': careersPage, 'perk-cards': perkCards, ticker, 'apply-button': applyButton } }
