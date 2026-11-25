import { config } from '../config'

export type TierId = keyof typeof config.tiers

export const tierIds = Object.keys(config.tiers) as TierId[]

export function samplesPerFrame(tier: string): number {
  const t = (config.tiers as Record<string, { samplesPerFrame: number }>)[tier]
  if (!t) throw new Error(`No tier called "${tier}"`)
  return t.samplesPerFrame
}
