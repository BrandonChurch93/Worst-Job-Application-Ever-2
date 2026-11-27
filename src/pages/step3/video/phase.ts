import type { StepIo } from '../../../stage/types'
import { bridge } from './bridge'
import manifest from './manifest.json'
import { VIDEO } from './plan'
import states from './states.json'

export interface VideoState { phase: 'before' | 'play' | 'under' | 'after'; clock: number; sent: number; waited: number; stalled: number; leave: boolean; gaveUp: boolean }
export type VideoAct = null | 'hold' | 'ride' | { load: unknown }

export const videoFresh = (): VideoState => ({ phase: 'before', clock: 0, sent: 0, waited: 0, stalled: 0, leave: false, gaveUp: false })
export const videoFrom = manifest.from.time
export const videoSeconds = manifest.seconds
export const videoOn = (v: VideoState): boolean => v.phase === 'play' || v.phase === 'under'

const events = manifest.events as { at: number; name: string; x: number; y: number; hits: boolean }[]
const pin = (io: StepIo): void => {
  io.cursor.load(states.to.cursor)
  io.cursor.take('video')
}

export function videoStep(v: VideoState, io: StepIo, due: boolean): VideoAct {
  if (v.phase === 'after') return null
  const player = io.mode === 'live' ? bridge.player : null
  if (v.phase === 'before') {
    if (!due) return null
    if (player && !player.ready()) {
      v.waited += io.dt
      if (v.waited < VIDEO.waitMax) return 'hold'
      v.phase = 'after'
      v.gaveUp = true
      bridge.gaveUp = true
      return 'ride'
    }
    v.phase = 'play'
    io.cursor.load(states.from.cursor)
    io.emit('video-in', io.cursor.x, io.cursor.y)
    player?.enter()
    return { load: states.from.page }
  }
  const end = manifest.seconds
  if (player && !bridge.hold) {
    v.stalled = player.clock() > v.clock ? 0 : v.stalled + io.dt
    if (v.stalled > VIDEO.stallMax) v.leave = true
  }
  const now = v.leave ? end : player ? (player.over() ? end : Math.min(end, Math.max(v.clock, player.clock()))) : Math.min(end, v.clock + io.dt)
  const play = !v.leave && now - v.clock <= VIDEO.jumpMax
  while (v.sent < events.length && events[v.sent]!.at / manifest.stepHz <= now) {
    const e = events[v.sent++]!
    if (play) io.emit(e.name, e.x, e.y, e.hits)
    if (play && player) bridge.cues?.push({ name: e.name, at: e.at / manifest.stepHz, clock: now })
  }
  v.clock = now
  if (now >= end && !(player && bridge.hold?.out)) {
    const under = v.phase === 'under'
    v.phase = 'after'
    pin(io)
    io.cursor.release()
    player?.leave()
    io.emit('video-out', io.cursor.x, io.cursor.y)
    return under ? null : { load: states.to.page }
  }
  if (v.phase === 'play' && now >= end - VIDEO.underlay) {
    v.phase = 'under'
    pin(io)
    return { load: states.to.page }
  }
  if (v.phase === 'under') pin(io)
  else io.cursor.load(states.from.cursor)
  return 'hold'
}
