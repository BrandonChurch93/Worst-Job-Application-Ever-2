// The film's sound, laid out from the events of the film. Pure arithmetic: the same inputs give the same samples.
import { eventCues, loopCues, pickVariant, stopEvents } from './cues'
import { master, repitch, type Mastered, type Sound } from './dsp'
import { DUCK, LIVE, MIX, db } from './levels'
import { duckAt, duckSpans } from './narrator'

export interface FilmEvent { name: string; frame: number; x: number }
export interface FilmLine { id: string; beat: string; frame: number }

export interface MixInput {
  sampleRate: number
  fps: number
  seconds: number
  events: FilmEvent[]
  lines: FilmLine[]
  sounds: Map<string, Sound>
  sfx: { id: string; seconds: number; variants?: number }[]
  duckDb: number
  holdMusicSeconds: number
  targetLufs: number
  truePeakDb: number
}

export interface Placed { kind: 'cue' | 'line' | 'tone'; event: string; cue: string; id: string; frame: number; sample: number; seconds: number; cents: number; pan: number }

export interface MixResult {
  sound: Sound
  placed: Placed[]
  missingCues: string[]
  missingLines: string[]
  mastered: Mastered
}

export const frameSample = (frame: number, fps: number, sampleRate: number): number => Math.round((frame / fps) * sampleRate)

// The pan law of the browser's stereo panner, so the site and the mix place a sound alike.
export function panGains(x: number): { left: number; right: number; pan: number } {
  const pan = Math.max(-1, Math.min(1, (x - 960) / 960)) * LIVE.panWidth
  const t = ((pan + 1) / 2) * (Math.PI / 2)
  return { left: Math.cos(t), right: Math.sin(t), pan }
}

export function mixFilm(o: MixInput): MixResult {
  const sr = o.sampleRate
  const length = Math.round(o.seconds * sr)
  const fx = [new Float32Array(length), new Float32Array(length)]
  const voice = new Float32Array(length)
  const tone = [new Float32Array(length), new Float32Array(length)]
  const placed: Placed[] = []
  const missingCues = new Set<string>()
  const missingLines: string[] = []
  const at = (frame: number) => frameSample(frame, o.fps, sr)
  const has = (id: string) => o.sounds.has(id)
  const fadeLen = Math.round(0.03 * sr)

  const events = o.events.map((e, i) => ({ ...e, i })).sort((a, b) => a.frame - b.frame || a.i - b.i)
  const counts = new Map<string, number>()
  const lastFrame = new Map<string, number>()
  const turns = events.filter((e) => e.name === 'page-turn').map((e) => e.frame)

  const stopFrame = (cue: string, from: number): number => {
    let end = Infinity
    for (const e of events) {
      if (e.frame <= from) continue
      if (stopEvents[e.name]?.includes(cue)) {
        end = e.frame
        break
      }
    }
    if (loopCues.includes(cue)) for (const f of turns) if (f > from && f < end) end = f
    return end
  }

  for (const e of events) {
    const cue = eventCues[e.name]
    if (!cue || cue === 'room-tone') continue
    if (lastFrame.get(cue) === e.frame) continue
    lastFrame.set(cue, e.frame)
    const spec = o.sfx.find((s) => s.id === cue)
    const count = counts.get(cue) ?? 0
    counts.set(cue, count + 1)
    const pick = pickVariant(cue, count, spec?.variants ?? 1, has)
    if (!pick) {
      missingCues.add(cue)
      continue
    }
    const kept = o.sounds.get(pick.id)!
    const start = at(e.frame)
    const gains = panGains(e.x)
    const loop = loopCues.includes(cue)
    const stop = stopFrame(cue, e.frame)
    let end = Number.isFinite(stop) ? at(stop) : length
    let dead = false
    if (cue === 'hold-music') {
      end = Math.min(end, start + Math.round(o.holdMusicSeconds * sr))
      dead = true
    }
    if (loop) end = Math.min(end, start + Math.round(LIVE.loopMaxSeconds * sr))
    end = Math.min(end, length)
    const mono = kept.channels.length === 1
    const src = kept.channels.map((c) => repitch(c, pick.cents))
    const n = src[0]!.length
    const until = loop ? end : Math.min(end, start + n)
    const cutShort = !loop && until < start + n
    for (let i = start; i < until; i++) {
      const k = loop ? (i - start) % n : i - start
      let g = 1
      if ((loop || cutShort) && !dead && until - i <= fadeLen) g = (until - i) / fadeLen
      if (mono) {
        const v = src[0]![k]! * g
        fx[0]![i]! += v * gains.left
        fx[1]![i]! += v * gains.right
      } else {
        fx[0]![i]! += src[0]![k]! * g
        fx[1]![i]! += src[1]![k]! * g
      }
    }
    placed.push({ kind: 'cue', event: e.name, cue, id: pick.id, frame: e.frame, sample: start, seconds: (until - start) / sr, cents: pick.cents, pan: gains.pan })
  }

  const spoken: { start: number; end: number }[] = []
  for (const line of o.lines.slice().sort((a, b) => a.frame - b.frame)) {
    const kept = o.sounds.get(line.id)
    if (!kept) {
      missingLines.push(line.id)
      continue
    }
    const start = at(line.frame)
    const src = kept.channels[0]!
    const until = Math.min(length, start + src.length)
    for (let i = start; i < until; i++) voice[i]! += src[i - start]!
    spoken.push({ start: start / sr, end: until / sr })
    placed.push({ kind: 'line', event: line.beat, cue: 'narrator', id: line.id, frame: line.frame, sample: start, seconds: (until - start) / sr, cents: 0, pan: 0 })
  }

  const room = o.sounds.get('room-tone')
  if (room && room.channels[0]!.length > 0) {
    const n = room.channels[0]!.length
    const l = room.channels[0]!
    const r = room.channels[1] ?? l
    for (let i = 0; i < length; i++) {
      tone[0]![i] = l[i % n]!
      tone[1]![i] = r[i % n]!
    }
    placed.push({ kind: 'tone', event: 'always', cue: 'room-tone', id: 'room-tone', frame: 0, sample: 0, seconds: o.seconds, cents: 0, pan: 0 })
  } else missingCues.add('room-tone')

  const spans = duckSpans(spoken, DUCK.attackSeconds, DUCK.releaseSeconds)
  const low = db(-o.duckDb)
  const out = [new Float32Array(length), new Float32Array(length)]
  const edge = Math.round((MIX.edgeFadeMs / 1000) * sr)
  let span = 0
  for (let i = 0; i < length; i++) {
    const t = i / sr
    while (span < spans.length && t >= spans[span]!.to + DUCK.releaseSeconds) span++
    const duck = span < spans.length ? duckAt(t, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds, span) : 1
    const fade = Math.min(1, i / edge, (length - 1 - i) / edge)
    out[0]![i] = (fx[0]![i]! * duck + voice[i]! + tone[0]![i]!) * fade
    out[1]![i] = (fx[1]![i]! * duck + voice[i]! + tone[1]![i]!) * fade
  }

  const sound: Sound = { sampleRate: sr, channels: out }
  const mastered = master(sound, o.targetLufs, o.truePeakDb)
  return { sound, placed, missingCues: [...missingCues].sort(), missingLines, mastered }
}
