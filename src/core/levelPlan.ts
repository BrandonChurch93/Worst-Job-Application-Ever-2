import { quality, type QualityId } from './quality'
import { samples, type Sample } from './sampler'

// What a level of `live.quality` does with its shadows, its glass and its small things. The words are the config's own.
export type ShadowMode = 'accumulated' | 'filtered' | 'baked'
export type GlassMode = 'refracting' | 'frosted'

const SHADOWS: Record<string, ShadowMode> = { 'accumulated at rest': 'accumulated', filtered: 'filtered', baked: 'baked' }
const GLASS: Record<string, GlassMode> = { refracting: 'refracting', 'frosted, no refraction': 'frosted' }

export interface LevelPlan { id: QualityId; shadows: ShadowMode; glass: GlassMode; particles: number; restFrames: number }

// How many frames a page at rest is gathered over. `accumulated` moves the light over its area as a computed picture does.
// The two others keep the light where it stands and only turn the taps of the shadow filter, so its grain averages out.
export const REST_FRAMES: Record<ShadowMode, number> = { accumulated: 64, filtered: 8, baked: 8 }

export function levelPlan(id: QualityId): LevelPlan {
  const q = quality(id)
  const shadows = SHADOWS[q.softShadows]
  const glass = GLASS[q.glass]
  if (!shadows) throw new Error(`The level "${id}" asks for shadows called "${q.softShadows}", which the site does not know`)
  if (!glass) throw new Error(`The level "${id}" asks for glass called "${q.glass}", which the site does not know`)
  if (!(q.particleFraction > 0 && q.particleFraction <= 1)) throw new Error(`The level "${id}" asks for a share of ${q.particleFraction} of the small things`)
  return { id, shadows, glass, particles: q.particleFraction, restFrames: REST_FRAMES[shadows] }
}

const held = new Map<string, Sample[]>()

// The sample the live picture draws for the frame the caller counts as `s` of a page at rest, or null once the level has gathered all it gathers.
// `filtered` and `baked` take their own short list. `baked` keeps the shadow map where the first frame put it, so what was drawn once stays true.
export function restSample(mode: ShadowMode, s: Sample): Sample | null {
  if (mode === 'accumulated') return s
  const n = REST_FRAMES[mode]
  if (s.index >= n) return null
  const key = `${mode}:${s.count}`
  let list = held.get(key)
  if (!list) {
    const first = samples(s.count)[0]!
    list = samples(n).map((x) => (mode === 'baked' ? { ...x, texel: first.texel } : x))
    held.set(key, list)
  }
  return list[s.index]!
}
