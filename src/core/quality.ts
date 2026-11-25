import { config } from '../config'

export type QualityId = keyof typeof config.live.quality
export const qualityIds = Object.keys(config.live.quality) as QualityId[]

export function quality(id: string) {
  const q = (config.live.quality as Record<string, (typeof config.live.quality)[QualityId]>)[id]
  if (!q) throw new Error(`No live quality called "${id}"`)
  return q
}
