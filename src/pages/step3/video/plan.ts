import { config, stepHz } from '../../../config'

export const VIDEO = {
  // The film unit the video is cut from.
  unit: 'pinball',
  // The event the join in is counted back from: the ball leaves the cup.
  inEvent: 'tube-run',
  // Seconds of rest kept between the join in and that event, so the first pictures of the video stand still.
  inLead: 0.04,
  // The event the join out is counted on from: the flattened arrow is peeled up.
  outEvent: 'peel-up',
  // Seconds after that event before the page takes over: the arrow is up and still, and the film's script has not begun to walk it.
  outLag: 0.19,
  // Seconds the page waits at the join in for a video that is not ready, before it plays its own ending.
  waitMax: 4,
  // Seconds before the end of the video at which the page lays its own picture of the last frame under it.
  underlay: 0.3,
  // The largest step of the video's clock, in seconds, that is taken as play. A larger one is a seek or a tab that slept: its cues are not sounded.
  jumpMax: 0.25
} as const

export interface Join { frame: number; step: number; time: number; hash: string }

export const frameStep = (frame: number): number => Math.round((frame / config.film.fps) * stepHz)

export function joinsOf(events: readonly { name: string; step: number }[]): { from: number; to: number } {
  const at = (name: string): number => {
    const e = events.find((x) => x.name === name)
    if (!e) throw new Error(`The scene has no event "${name}" to join the video on`)
    return e.step / stepHz
  }
  return { from: Math.floor((at(VIDEO.inEvent) - VIDEO.inLead) * config.film.fps), to: Math.ceil((at(VIDEO.outEvent) + VIDEO.outLag) * config.film.fps) }
}
