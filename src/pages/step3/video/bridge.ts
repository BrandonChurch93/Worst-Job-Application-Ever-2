export interface VideoPlayer {
  ready(): boolean
  enter(): void
  clock(): number
  over(): boolean
  leave(): void
}

export const bridge: { player: VideoPlayer | null; hold: { in: boolean; out: boolean } | null } = { player: null, hold: null }
