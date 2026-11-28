// The film's sound, laid out from the events of the film. Pure arithmetic: the same inputs give the same samples.
import { allCues, alsoStarts, cueOfEvent, loopCues, pageAfter, pickVariant, quietPage, quietPageCues, stopEvents } from './cues'

export { openingEvents, type OpeningPlan } from './cues'
import { dehum, master, repitch, type Mastered, type Sound } from './dsp'
import { DUCK, LIVE, MIX, TONE, db } from './levels'
import { duckAt, duckSpans } from './narrator'
import { standIns, type KeptLine } from './standin'

// page: the page the event came from, when the list of events names it. A page-turn names the page it leaves.
export interface FilmEvent { name: string; frame: number; x: number; page?: string }
// A stretch of the film with the careers page on screen, in frames: from is its first frame, to is the frame after its last.
export interface QuietSpan { from: number; to: number }
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
  toneFromFrame?: number
  // The lines that are silent stand-ins, by id, with their seconds. Left out, it is every line of the script with no take in the sound index recorded from its words.
  standIns?: Map<string, number>
}

// The lines of the script that are silent stand-ins: id and seconds. A take kept under the id of one of them is not laid.
// takes: the kept takes with the words each was recorded from. A line whose take has the script's words is not a stand-in: its take is laid.
export function scriptStandIns(takes?: KeptLine[]): Map<string, number> {
  const all = takes ? standIns(undefined, undefined, undefined, undefined, takes) : standIns()
  return new Map([...all.values()].filter((l) => !l.kept).map((l) => [l.id, l.seconds]))
}

// Film A is the opening and then film B unchanged: every event and line of film B moves back by the opening's frames.
export function behindOpening<T extends { frame: number }>(list: T[], openingFrames: number): T[] {
  return list.map((e) => ({ ...e, frame: e.frame + openingFrames }))
}

export interface Placed { kind: 'cue' | 'line' | 'stand-in' | 'tone'; event: string; cue: string; id: string; frame: number; sample: number; seconds: number; cents: number; pan: number }

export interface MixResult {
  sound: Sound
  placed: Placed[]
  missingCues: string[]
  missingLines: string[]
  mastered: Mastered
  // The stretches with the careers page on screen, and the events in them that were given no sound because of it, each as name@frame.
  quiet: QuietSpan[]
  hushed: string[]
}

// The stretches of the film with the careers page on screen, read from the pages the events name. The film is on it from the start when the first
// event that names a page names it. The page is on screen until a turn away from it begins, and from half a turn after a turn to it begins.
// A list of events that names no page has no such stretch.
export function quietSpans(events: FilmEvent[], fromFrame: number, frames: number, fps: number): QuietSpan[] {
  const half = Math.round(LIVE.quietTurnSeconds * fps)
  const paged = events.filter((e) => e.page !== undefined && e.frame >= fromFrame).sort((a, b) => a.frame - b.frame)
  const out: QuietSpan[] = []
  let since: number | null = paged[0]?.page === quietPage ? fromFrame : null
  for (const e of paged) {
    if (e.name !== 'page-turn') continue
    if (e.page === quietPage && since !== null) {
      out.push({ from: since, to: e.frame })
      since = null
    } else if (pageAfter[e.page!] === quietPage) since = e.frame + half
  }
  if (since !== null && since < frames) out.push({ from: since, to: frames })
  return out
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
  const frames = Math.round(o.seconds * o.fps)
  const quiet = quietSpans(o.events, o.toneFromFrame ?? 0, frames, o.fps)
  const half = Math.round(LIVE.quietTurnSeconds * o.fps)
  // On the careers page, and at a turn to it or away from it, nothing sounds but the press of its button.
  const hush = (e: FilmEvent, cue: string): boolean => {
    if (e.name === 'page-turn') return quiet.some((q) => e.frame === q.to || e.frame + half === q.from)
    if (e.page !== undefined) return e.page === quietPage && !quietPageCues.includes(cue)
    return quiet.some((q) => e.frame >= q.from && e.frame < q.to) && !quietPageCues.includes(cue)
  }
  const hushed: string[] = []

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

  for (const e of events) for (const cue of [cueOfEvent(e.name), ...(alsoStarts[e.name] ?? [])]) {
    if (!cue || cue === 'room-tone') continue
    if (hush(e, cue)) {
      hushed.push(`${e.name}@${e.frame}`)
      continue
    }
    if (lastFrame.get(cue) === e.frame) continue
    lastFrame.set(cue, e.frame)
    const spec = allCues(o.sfx).find((s) => s.id === cue)
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
      if (loop && i - start < fadeLen) g *= (i - start) / fadeLen
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
  const silent = o.standIns ?? scriptStandIns()
  for (const line of o.lines.slice().sort((a, b) => a.frame - b.frame)) {
    const standIn = silent.get(line.id)
    if (standIn !== undefined) {
      placed.push({ kind: 'stand-in', event: line.beat, cue: 'narrator', id: line.id, frame: line.frame, sample: at(line.frame), seconds: standIn, cents: 0, pan: 0 })
      if (LIVE.standInDucks) spoken.push({ start: at(line.frame) / sr, end: at(line.frame) / sr + standIn })
      continue
    }
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
    const mended = TONE.dehum ? room.channels.map((c) => dehum(c, sr, TONE)) : room.channels
    const n = mended[0]!.length
    const l = mended[0]!
    const r = mended[1] ?? l
    // The room tone runs under every page but the careers page: it comes in when a turn away from that page is done and is out when a turn to it is done.
    const from = o.toneFromFrame ?? 0
    const runs: { first: number; last: number; out: number }[] = []
    let open = from
    for (const q of quiet) {
      if (q.from > open) runs.push({ first: open, last: q.from, out: half })
      open = q.to + half
    }
    if (open < frames) runs.push({ first: open, last: frames, out: 0 })
    const fadeIn = Math.round(LIVE.toneFadeInSeconds * sr)
    for (const run of runs) {
      const first = Math.min(length, at(run.first))
      const last = Math.min(length, at(run.last))
      const fadeOut = Math.round((run.out / o.fps) * sr)
      for (let i = first; i < last; i++) {
        let g = first > 0 ? Math.min(1, (i - first) / fadeIn) : 1
        if (fadeOut > 0 && last - i < fadeOut) g *= (last - i) / fadeOut
        tone[0]![i] = l[(i - first) % n]! * g
        tone[1]![i] = r[(i - first) % n]! * g
      }
      placed.push({ kind: 'tone', event: 'always', cue: 'room-tone', id: 'room-tone', frame: run.first, sample: first, seconds: (last - first) / sr, cents: 0, pan: 0 })
    }
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
  return { sound, placed, missingCues: [...missingCues].sort(), missingLines, mastered, quiet, hushed }
}
