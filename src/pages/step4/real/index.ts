import type { PageReal } from '../../../real/types'
import { verifyCard } from './verify-card'
import { healthBar } from './health-bar'
import { bossWeapons } from './boss-weapons'
import { bossBody } from '../../../boss/real/body'
import { bossTransform } from '../../../boss/real/transform'

export const real: PageReal = { parts: { 'verify-card': verifyCard, 'health-bar': healthBar, 'boss-weapons': bossWeapons, 'boss-body': bossBody, 'boss-transform': bossTransform } }
