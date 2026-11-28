export interface VideoPlayer {
  ready(): boolean
  enter(): void
  clock(): number
  over(): boolean
  gone(): boolean
  leave(): void
}

export const bridge: { player: VideoPlayer | null; hold: { in: boolean; out: boolean } | null; cues: { name: string; at: number; clock: number }[] | null; gaveUp: boolean; off: boolean } = { player: null, hold: null, cues: null, gaveUp: false, off: false }
