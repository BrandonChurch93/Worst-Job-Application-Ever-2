// The site's sound engine. It is loaded only in the modes live, film and loop, and only main.ts may import it.
// Nothing here is created, fetched or played before unlock(), which the visitor's first click calls.
// The index of the sound files is part of the build, so the engine knows from the start whether there is any sound to play.
import { config } from '../config'
import { narration } from '../copy'
import { wallSeconds } from '../ui/clock'
import { eventCues, filmLineId, liveKeysFor, liveLineId, loopCues, pickVariant, stopEvents } from './cues'
import { DUCK, LIVE, db } from './levels'
import { duckSpans, Narrator, type Booking } from './narrator'
import shipped from '../../public/audio/index.json'

export type SoundMode = 'live' | 'film'
export type SoundState = 'locked' | 'loading' | 'ready' | 'silent'

export interface SoundApi {
  available(): boolean
  unlock(): Promise<void>
  setMuted(muted: boolean): void
  muted(): boolean
  setVolume(v: number): void
  volume(): number
  event(e: { name: string; x: number; y: number; hitsCursor: boolean }, mode: SoundMode): void
  beat(id: string, mode: SoundMode): void
  trigger(name: string): void
  stop(): void
  state(): SoundState
  backend(): 'graph' | 'elements' | 'none'
  onChange(listener: () => void): void
}

export interface SoundIndex {
  version: number
  pack: { file: string; bytes: number } | null
  sfx: { id: string; at: number; bytes: number; seconds: number; mime: string }[]
  loops: { id: string; file: string; seconds: number; mime: string }[]
  lines: { id: string; file: string; seconds: number; mime: string }[]
}

type Bus = 'fx' | 'voice' | 'tone'
interface PlayOptions { bus: Bus; when: number; cents: number; pan: number; loop: boolean; until?: number; fade?: number }
interface Voice { stop(fade: number): void }
interface Backend {
  readonly kind: 'graph' | 'elements'
  now(): number
  resume(): void
  add(id: string, bytes: ArrayBuffer, mime: string): Promise<boolean>
  play(id: string, o: PlayOptions): Voice | null
  duck(spans: { from: number; to: number }[], low: number): void
  master(v: number): void
  stopAll(): void
  close(): void
}

type ContextMaker = new () => AudioContext

function graphBackend(Maker: ContextMaker): Backend {
  const ctx = new Maker()
  const out = ctx.createGain()
  out.connect(ctx.destination)
  const buses: Record<Bus, GainNode> = { fx: ctx.createGain(), voice: ctx.createGain(), tone: ctx.createGain() }
  for (const b of Object.values(buses)) b.connect(out)
  const buffers = new Map<string, AudioBuffer>()
  const voices = new Set<Voice>()
  return {
    kind: 'graph',
    now: () => ctx.currentTime,
    resume: () => { if (ctx.state !== 'running') void ctx.resume().catch(() => undefined) },
    add: (id, bytes) => new Promise<boolean>((done) => {
      const ok = (b: AudioBuffer) => {
        buffers.set(id, b)
        done(true)
      }
      try {
        const p = ctx.decodeAudioData(bytes, ok, () => done(false))
        if (p && typeof p.catch === 'function') p.catch(() => done(false))
      } catch {
        done(false)
      }
    }),
    play(id, o) {
      const buffer = buffers.get(id)
      if (!buffer) return null
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = o.loop
      src.playbackRate.value = Math.pow(2, o.cents / 1200)
      const gain = ctx.createGain()
      src.connect(gain)
      if (o.bus === 'fx' && buffer.numberOfChannels === 1 && typeof ctx.createStereoPanner === 'function') {
        const pan = ctx.createStereoPanner()
        pan.pan.value = o.pan
        gain.connect(pan)
        pan.connect(buses[o.bus])
      } else gain.connect(buses[o.bus])
      const when = Math.max(o.when, ctx.currentTime)
      src.start(when)
      if (o.until !== undefined) {
        const fade = o.fade ?? 0
        if (fade > 0) {
          gain.gain.setValueAtTime(1, Math.max(when, o.until - fade))
          gain.gain.linearRampToValueAtTime(0, o.until)
        }
        src.stop(o.until)
      }
      const voice: Voice = {
        stop(fade) {
          voices.delete(voice)
          try {
            const t = ctx.currentTime
            gain.gain.cancelScheduledValues(t)
            gain.gain.setValueAtTime(gain.gain.value, t)
            gain.gain.linearRampToValueAtTime(0, t + fade)
            src.stop(t + fade)
          } catch {
            return
          }
        }
      }
      voices.add(voice)
      src.onended = () => voices.delete(voice)
      return voice
    },
    duck(spans, low) {
      const g = buses.fx.gain
      const t = ctx.currentTime
      g.cancelScheduledValues(t)
      g.setValueAtTime(g.value, t)
      for (const s of spans) {
        if (s.to + DUCK.releaseSeconds <= t) continue
        if (t < s.from - DUCK.attackSeconds) {
          g.setValueAtTime(1, s.from - DUCK.attackSeconds)
          g.linearRampToValueAtTime(low, s.from)
        } else if (t < s.to) g.linearRampToValueAtTime(low, Math.max(s.from, t + DUCK.attackSeconds))
        if (s.to > t) g.setValueAtTime(low, Math.max(s.to, t + DUCK.attackSeconds))
        g.linearRampToValueAtTime(1, Math.max(s.to, t) + DUCK.releaseSeconds)
      }
      if (!spans.some((s) => s.to + DUCK.releaseSeconds > t)) g.linearRampToValueAtTime(1, t + DUCK.releaseSeconds)
    },
    master(v) {
      const t = ctx.currentTime
      out.gain.cancelScheduledValues(t)
      out.gain.setValueAtTime(out.gain.value, t)
      out.gain.linearRampToValueAtTime(v, t + LIVE.volumeRampSeconds)
    },
    stopAll() {
      for (const v of [...voices]) v.stop(LIVE.volumeRampSeconds)
    },
    close() {
      void ctx.close().catch(() => undefined)
    }
  }
}

// The named fallback: plain audio elements, one for each sound.
function elementBackend(): Backend {
  const elements = new Map<string, { el: HTMLAudioElement; bus: Bus; timers: number[] }>()
  let level = 1
  let fx = 1
  let timers: number[] = []
  const volume = (bus: Bus) => Math.max(0, Math.min(1, level * (bus === 'fx' ? fx : 1)))
  const refresh = () => { for (const e of elements.values()) e.el.volume = volume(e.bus) }
  const later = (at: number, run: () => void): number => window.setTimeout(run, Math.max(0, (at - wallSeconds()) * 1000))
  return {
    kind: 'elements',
    now: () => wallSeconds(),
    resume: () => undefined,
    add: (id, bytes, mime) => new Promise<boolean>((done) => {
      const el = new Audio()
      el.preload = 'auto'
      el.oncanplaythrough = () => done(true)
      el.onerror = () => done(false)
      el.src = URL.createObjectURL(new Blob([bytes], { type: mime }))
      elements.set(id, { el, bus: 'fx', timers: [] })
    }),
    play(id, o) {
      const e = elements.get(id)
      if (!e) return null
      for (const t of e.timers) window.clearTimeout(t)
      e.timers = []
      e.bus = o.bus
      const el = e.el
      const stop = () => {
        el.pause()
        for (const t of e.timers) window.clearTimeout(t)
        e.timers = []
      }
      const start = () => {
        el.loop = o.loop
        el.playbackRate = Math.pow(2, o.cents / 1200)
        el.volume = volume(o.bus)
        try {
          el.currentTime = 0
        } catch {
          return
        }
        void el.play().catch(() => undefined)
      }
      if (o.when > wallSeconds() + 0.005) e.timers.push(later(o.when, start))
      else start()
      if (o.until !== undefined) e.timers.push(later(o.until, stop))
      return { stop }
    },
    duck(spans, low) {
      for (const t of timers) window.clearTimeout(t)
      timers = []
      const now = wallSeconds()
      fx = spans.some((s) => s.from <= now && s.to > now) ? low : 1
      refresh()
      for (const s of spans) {
        if (s.from > now) timers.push(later(s.from, () => { fx = low; refresh() }))
        if (s.to > now) timers.push(later(s.to, () => { fx = 1; refresh() }))
      }
    },
    master(v) {
      level = v
      refresh()
    },
    stopAll() {
      for (const e of elements.values()) {
        e.el.pause()
        for (const t of e.timers) window.clearTimeout(t)
        e.timers = []
      }
    },
    close() {
      this.stopAll()
      for (const e of elements.values()) URL.revokeObjectURL(e.el.src)
      elements.clear()
    }
  }
}

function makeBackend(): Backend | null {
  const w = window as unknown as { AudioContext?: ContextMaker; webkitAudioContext?: ContextMaker }
  const Maker = w.AudioContext ?? w.webkitAudioContext
  try {
    if (Maker) return graphBackend(Maker)
  } catch {
    return typeof Audio === 'function' ? elementBackend() : null
  }
  return typeof Audio === 'function' ? elementBackend() : null
}

export function makeSound(o: { base: string; index?: SoundIndex }): SoundApi {
  const base = o.base.endsWith('/') ? o.base : `${o.base}/`
  const audio = config.audio
  const film = narration.film as Record<string, { at: number; text: string }[]>
  const live = narration.liveOnly as Record<string, unknown>
  const narrator = new Narrator({ minGap: audio.liveNarratorMinGapSeconds, lineGap: audio.lineGapSeconds, beatLate: LIVE.beatLateSeconds, liveLate: LIVE.liveLateSeconds })
  const index = o.index ?? (shipped as unknown as SoundIndex)
  const lists = index.sfx.length + index.loops.length + index.lines.length > 0
  let state: SoundState = lists ? 'locked' : 'silent'
  let backend: Backend | null = null
  let unlocking: Promise<void> | null = null
  let isMuted = false
  let level = 1
  let tone: Voice | null = null
  const listeners: (() => void)[] = []
  const loaded = new Set<string>()
  const lengths = new Map<string, number>()
  const counts = new Map<string, number>()
  const lastPlay = new Map<string, number>()
  const running = new Map<string, Voice[]>()
  const speaking = new Map<Booking, Voice>()
  const liveCounts = new Map<string, number>()
  const seenOnce = new Set<string>()

  const setState = (s: SoundState) => {
    if (state === s) return
    state = s
    for (const l of listeners) l()
  }
  const applyLevel = () => backend?.master(isMuted ? 0 : level)

  async function load(b: Backend): Promise<void> {
    const keep = (id: string, secs: number) => (ok: boolean) => {
      if (!ok) return
      loaded.add(id)
      lengths.set(id, secs)
    }
    if (index.pack && index.sfx.length) {
      const pack = await fetch(`${base}${index.pack.file}`)
      if (!pack.ok) return
      const bytes = await pack.arrayBuffer()
      await Promise.all(index.sfx.map((s) => b.add(s.id, bytes.slice(s.at, s.at + s.bytes), s.mime).then(keep(s.id, s.seconds))))
    }
    const jobs = [...index.loops, ...index.lines].map(async (f) => {
      const file = await fetch(`${base}${f.file}`)
      if (!file.ok) return
      await b.add(f.id, await file.arrayBuffer(), f.mime).then(keep(f.id, f.seconds))
    })
    await Promise.allSettled(jobs)
  }

  const startTone = () => {
    if (state !== 'ready' || !backend || tone || !loaded.has('room-tone')) return
    tone = backend.play('room-tone', { bus: 'tone', when: backend.now(), cents: 0, pan: 0, loop: true })
  }

  const stopCue = (cue: string) => {
    for (const v of running.get(cue) ?? []) v.stop(0.03)
    running.delete(cue)
  }

  const playCue = (cue: string, x: number) => {
    const b = backend!
    const now = b.now()
    const last = lastPlay.get(cue)
    if (last !== undefined && now - last < LIVE.sameCueSeconds) return
    lastPlay.set(cue, now)
    const spec = audio.sfx.find((s) => s.id === cue) as { id: string; seconds: number; variants?: number } | undefined
    const count = counts.get(cue) ?? 0
    counts.set(cue, count + 1)
    const pick = pickVariant(cue, count, spec?.variants ?? 1, (id) => loaded.has(id))
    if (!pick) return
    const loop = loopCues.includes(cue)
    const pan = Math.max(-1, Math.min(1, (x - 960) / 960)) * LIVE.panWidth
    let until: number | undefined
    let fade = 0
    if (cue === 'hold-music') until = now + audio.holdMusicSeconds
    else if (loop) {
      until = now + LIVE.loopMaxSeconds
      fade = 0.03
    }
    if (loop) stopCue(cue)
    const voice = b.play(pick.id, { bus: 'fx', when: now, cents: pick.cents, pan, loop, until, fade })
    if (voice) running.set(cue, [...(running.get(cue) ?? []).slice(-7), voice])
  }

  const reduck = () => {
    if (!backend) return
    const now = backend.now()
    backend.duck(duckSpans(narrator.bookings(now).filter((b) => b.end > now), DUCK.attackSeconds, DUCK.releaseSeconds), db(-audio.duckDb))
  }

  const speak = (booking: Booking) => {
    const voice = backend!.play(booking.id, { bus: 'voice', when: booking.start, cents: 0, pan: 0, loop: false })
    if (voice) speaking.set(booking, voice)
  }

  const api: SoundApi = {
    available: () => state !== 'silent',
    unlock() {
      if (unlocking) return unlocking
      if (!lists) return (unlocking = Promise.resolve())
      unlocking = (async () => {
        setState('loading')
        let ok = false
        try {
          backend = makeBackend()
          if (backend) {
            backend.resume()
            applyLevel()
            await load(backend)
            ok = loaded.size > 0
          }
        } catch {
          ok = false
        }
        if (!ok) {
          backend?.close()
          backend = null
        }
        setState(ok ? 'ready' : 'silent')
        startTone()
      })()
      return unlocking
    },
    setMuted(m) {
      isMuted = m
      applyLevel()
    },
    muted: () => isMuted,
    setVolume(v) {
      level = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))
      applyLevel()
    },
    volume: () => level,
    event(e, mode) {
      if (state !== 'ready' || !backend) return
      backend.resume()
      startTone()
      for (const cue of stopEvents[e.name] ?? []) stopCue(cue)
      if (e.name === 'page-turn') for (const cue of loopCues) if (cue !== 'room-tone') stopCue(cue)
      const cue = eventCues[e.name]
      if (cue && cue !== 'room-tone') playCue(cue, e.x)
      if (mode === 'live') for (const key of liveKeysFor(e, seenOnce)) api.trigger(key)
    },
    beat(id, _mode) {
      if (state !== 'ready' || !backend) return
      const b = config.film.beats.find((x) => x.id === id)
      const lines = film[id]
      if (!b || !lines) return
      startTone()
      const now = backend.now()
      const wanted = lines.map((l, i) => ({ id: filmLineId(id, i), offset: l.at * (b.to - b.from), seconds: lengths.get(filmLineId(id, i)) ?? 0 })).filter((l) => loaded.has(l.id))
      const plan = narrator.beat(now, id, wanted)
      for (const c of plan.cancelled) {
        speaking.get(c)?.stop(0)
        speaking.delete(c)
      }
      for (const s of plan.spoken) speak(s)
      reduck()
    },
    trigger(name) {
      if (state !== 'ready' || !backend) return
      const list = live[name]
      if (!Array.isArray(list) || !list.length) return
      const count = liveCounts.get(name) ?? 0
      const index = count % list.length
      const id = liveLineId(name, index)
      if (!loaded.has(id)) return
      const booking = narrator.live(backend.now(), id, name, lengths.get(id) ?? 0)
      if (!booking) return
      liveCounts.set(name, count + 1)
      speak(booking)
      reduck()
    },
    stop() {
      narrator.clear()
      speaking.clear()
      running.clear()
      tone = null
      if (!backend) return
      backend.stopAll()
      backend.duck([], 1)
    },
    state: () => state,
    backend: () => backend?.kind ?? 'none',
    onChange(listener) {
      listeners.push(listener)
    }
  }
  return api
}
