import type { GlassMode } from './levelPlan'

// The ball listens on the window for this name and takes `bend` from it (src/table/real/ball/index.ts).
export const GLASS_DOOR = 'wjb-ball'

// What a level's word for glass means for the ball: whether it bends a picture of the floor inside itself.
// A computed picture has no level and always bends.
export function glassBends(mode: GlassMode | null): boolean {
  return mode !== 'frosted'
}

export interface GlassTarget { dispatchEvent(event: Event): boolean }

export function setGlass(mode: GlassMode | null, target: GlassTarget | null = typeof window === 'undefined' ? null : window): void {
  if (!target || typeof CustomEvent === 'undefined') return
  target.dispatchEvent(new CustomEvent(GLASS_DOOR, { detail: { bend: glassBends(mode) } }))
}
