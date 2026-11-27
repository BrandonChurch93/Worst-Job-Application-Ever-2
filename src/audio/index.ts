// The site's sound engine. It is loaded only in the modes live, film and loop, and only main.ts may import it.
// Nothing here is created, fetched or played before unlock(), which the visitor's first click or key press calls.
// The narrator's lines are silent stand-ins (change note 003): no take is fetched or played, a line holds its time and gives its caption.
// The index of the sound files is part of the build, so the engine knows from the start whether there is any sound to play.
import { config } from '../config'
import { narration } from '../copy'
import { openingFrames, openingTimes } from '../film/opening'
import { wallSeconds } from '../ui/clock'
import type { Caption, CaptionSource } from '../ui/said'
import { allCues, alsoStarts, cueOfEvent, eventCues, loopCues, markStandsFor, openingEvents, pageAfter, pickVariant, quietPage, quietPageCues, spoken, spokenKeysFor, stopEvents, unitPage } from './cues'
import { dehum } from './dsp'
import { DUCK, LIVE, TONE, db } from './levels'
import { duckSpans, LiveDesk, Narrator, type Booking } from './narrator'
import { phraseStart, standIns, type StandIn } from './standin'
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
  event(e: { name: string; x: number; y: number; hitsCursor: boolean; page?: string }, mode: SoundMode): void
  beat(id: string, mode: SoundMode, into?: number): void
  trigger(name: string): void
  quiet(seconds: number): void
  // The page on screen, told by the site when it knows it: at a jump to a step and at each frame of the live site.
  // caption: where that page wants the spoken words, the y of the lower edge of their panel in pixels of the 1920 by 1080 page.
  page(id: string, caption?: number): void
  // The phrases of the lines that are booked or being spoken, each with its words and its start and end on the sound's clock, and that clock's time now.
  said(): { now: number; lines: SaidLine[] }
  opening(from: number, to: number): void
  start(): void
  stop(): void
  state(): SoundState
  backend(): 'graph' | 'elements' | 'none'
  onChange(listener: () => void): void
  log(): SoundLogEntry[]
}

// What the narrator did with a line: the time on the sound's own clock, the line, what set it off, and why when it was not spoken whole.
export interface SoundLogEntry { at: number; line: string; trigger: string; what: 'spoken' | 'dropped' | 'taken back' | 'cut'; start?: number; seconds?: number; why?: string }

// One phrase of a line: id is the line's id, a # and the phrase's place in the line. draft: the line comes from content/narration-drafts.json.
export interface SaidLine { id: string; line: string; words: string; start: number; end: number; draft: boolean; loud: boolean }

export interface SoundIndex {
  version: number
  pack: { file: string; bytes: number; sha256?: string } | null
  sfx: { id: string; at: number; bytes: number; seconds: number; mime: string }[]
  loops: { id: string; file: string; seconds: number; mime: string; bytes?: number; sha256?: string }[]
  lines: { id: string; file: string; seconds: number; mime: string; bytes?: number; sha256?: string }[]
}

type Bus = 'fx' | 'voice' | 'tone'
interface PlayOptions { bus: Bus; when: number; cents: number; pan: number; loop: boolean; until?: number; fade?: number; fadeIn?: number }
interface Voice { stop(fade: number): void }
interface Backend {
  readonly kind: 'graph' | 'elements'
  now(): number
  resume(): void
  hold(on: boolean): boolean
  add(id: string, bytes: ArrayBuffer, mime: string, mend?: (channel: Float32Array, sampleRate: number) => Float32Array): Promise<boolean>
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
  const buses: Record<Bus, GainNode> = { fx: ctx.createGain(), voice: ctx.createGain(), tone: ctx.createGain() }
  for (const b of Object.values(buses)) b.connect(out)
  const head = ctx.createGain()
  head.gain.value = db(-LIVE.headroomDb)
  out.connect(head)
  head.connect(ctx.destination)
  const buffers = new Map<string, AudioBuffer>()
  const voices = new Set<Voice>()
  let held = false
  const resume = () => { if (!held && ctx.state !== 'running') void ctx.resume().catch(() => undefined) }
  if (typeof window.addEventListener === 'function') for (const name of LIVE.wakeEvents) window.addEventListener(name, resume, true)
  return {
    kind: 'graph',
    now: () => ctx.currentTime,
    resume,
    hold(on) {
      held = on
      void (on ? ctx.suspend() : ctx.resume()).catch(() => undefined)
      return true
    },
    add: (id, bytes, _mime, mend) => new Promise<boolean>((done) => {
      const ok = (b: AudioBuffer) => {
        if (mend && typeof b.getChannelData === 'function') for (let c = 0; c < b.numberOfChannels; c++) b.getChannelData(c).set(mend(b.getChannelData(c), b.sampleRate))
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
      if (o.fadeIn) {
        gain.gain.setValueAtTime(0, when)
        gain.gain.linearRampToValueAtTime(1, when + o.fadeIn)
      }
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
    hold: () => false,
    add: (id, bytes, mime) => new Promise<boolean>((done) => {
      const el = new Audio()
      el.preload = 'auto'
      const wait = window.setTimeout(() => done(false), LIVE.elementLoadSeconds * 1000)
      el.oncanplaythrough = () => {
        window.clearTimeout(wait)
        done(true)
      }
      el.onerror = () => {
        window.clearTimeout(wait)
        done(false)
      }
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

// caption: the maker of the panel that shows the words; the site gives it, the tools and the tests give none.
// script: the lines to say in place of the two files of content, for the tests.
export function makeSound(o: { base: string; index?: SoundIndex; caption?: (read: () => CaptionSource) => Caption | null; script?: { film: Record<string, { at: number; text: string }[]>; drafts: Record<string, { at: number; text: string }[]> } }): SoundApi {
  const base = o.base.endsWith('/') ? o.base : `${o.base}/`
  const audio = config.audio
  const narrator = new Narrator({ minGap: audio.liveNarratorMinGapSeconds, lineGap: audio.lineGapSeconds, beatLate: LIVE.beatLateSeconds, liveLate: LIVE.liveLateSeconds })
  const unitOfBeat = (beat: string): string | undefined => config.film.beats.find((x) => x.id === beat)?.unit
  const pageOfBeat = (beat: string): string | null => unitPage[unitOfBeat(beat) ?? ''] ?? null
  const lines = o.script ? standIns(o.script.film, o.script.drafts) : standIns()
  const desk = new LiveDesk(narrator, Object.fromEntries([...lines.values()].filter((l) => !spoken[l.key]?.keeps).map((l) => [l.id, l.page])))
  const index = o.index ?? (shipped as unknown as SoundIndex)
  const lists = index.sfx.length + index.loops.length + index.lines.length > 0
  let state: SoundState = lists ? 'locked' : 'silent'
  let backend: Backend | null = null
  let unlocking: Promise<void> | null = null
  let isMuted = false
  let level = 1
  let tone: Voice | null = null
  let here: string | null = null
  let leaving: string | null = null
  let toQuiet = false
  let owedOpen = false
  let lastMode: SoundMode | null = null
  let caption: Caption | null = null
  let captionAt: number | undefined
  let flowing = true
  let lead = false
  let filmAt = 0
  let aheadTo = -1
  let prelude: { at: number; cue: string; x: number }[] | null = null
  const listeners: (() => void)[] = []
  const loaded = new Set<string>()
  const lengths = new Map<string, number>()
  const counts = new Map<string, number>()
  const lastPlay = new Map<string, number>()
  const running = new Map<string, Voice[]>()
  const speaking = new Map<Booking, StandIn>()
  const marks = new Map<Booking, string>()
  const byMark = new Set<string>()
  const entries: SoundLogEntry[] = []
  const note = (e: SoundLogEntry) => {
    entries.push(e)
    if (entries.length > LIVE.logMax) entries.splice(0, entries.length - LIVE.logMax)
  }
  const round = (v: number) => Number(v.toFixed(3))

  const setState = (s: SoundState) => {
    if (state === s) return
    state = s
    for (const l of listeners) l()
  }
  const applyLevel = () => backend?.master(isMuted ? 0 : level)
  let watching = false
  const watchPage = () => {
    if (watching || typeof document === 'undefined') return
    watching = true
    document.addEventListener('visibilitychange', () => {
      if (!backend) return
      const away = document.visibilityState === 'hidden'
      if (!backend.hold(away) && away) api.stop()
    })
  }

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
    const jobs = index.loops.map(async (f) => {
      const file = await fetch(`${base}${f.file}`)
      if (!file.ok) return
      const mend = f.id === 'room-tone' && TONE.dehum ? (x: Float32Array, rate: number) => dehum(x, rate, TONE) : undefined
      await b.add(f.id, await file.arrayBuffer(), f.mime, mend).then(keep(f.id, f.seconds))
    })
    await Promise.allSettled(jobs)
  }

  const startTone = (after = 0) => {
    if (state !== 'ready' || !backend || tone || !flowing || lead || here === quietPage || toQuiet || !loaded.has('room-tone')) return
    tone = backend.play('room-tone', { bus: 'tone', when: backend.now() + after, cents: 0, pan: 0, loop: true, fadeIn: LIVE.toneFadeInSeconds })
  }

  const stopTone = (fade: number) => {
    tone?.stop(fade)
    tone = null
  }

  const stopCue = (cue: string) => {
    for (const v of running.get(cue) ?? []) v.stop(LIVE.loopFadeSeconds)
    running.delete(cue)
    byMark.delete(cue)
  }

  // The page on screen. On the careers page nothing sounds but the press of its button: what still rings is stopped, and the room tone with it.
  const atPage = (page: string, mode: SoundMode | null = null) => {
    if (page === leaving) return
    leaving = null
    if (page === here) return
    const from = here
    here = page
    if (page === quietPage && mode !== 'film' && lastMode !== 'film') {
      if (from !== null) desk.restart()
      wantOpening(from === null ? 'the careers page on screen' : 'the careers page on screen again')
    }
    if (page !== quietPage) {
      toQuiet = false
      startTone()
      return
    }
    toQuiet = false
    stopTone(LIVE.loopFadeSeconds)
    for (const cue of [...running.keys()]) if (!quietPageCues.includes(cue)) stopCue(cue)
  }

  // A turn has begun on this page. A turn to the careers page takes the room tone out before the page is on screen; a turn away from it brings the tone in after it has gone.
  const turnFrom = (page: string, mode: SoundMode) => {
    leaving = page
    const next = mode === 'live' ? pageAfter[page] : undefined
    if (next === quietPage) {
      toQuiet = true
      stopTone(LIVE.quietTurnSeconds)
    } else if (page === quietPage && next !== undefined) {
      toQuiet = false
      here = next
      startTone(LIVE.quietTurnSeconds)
    }
  }

  const hushed = (e: { name: string; page?: string }, mode: SoundMode, cue: string): boolean => {
    const page = e.page ?? here
    if (page === quietPage) return !quietPageCues.includes(cue)
    return e.name === 'page-turn' && mode === 'live' && page !== null && pageAfter[page] === quietPage
  }

  const playCue = (cue: string, x: number, when?: number) => {
    const b = backend!
    const now = Math.max(when ?? 0, b.now())
    const last = lastPlay.get(cue)
    if (last !== undefined && Math.abs(now - last) < LIVE.sameCueSeconds) return
    lastPlay.set(cue, now)
    const spec = allCues(audio.sfx as { id: string; seconds: number; variants?: number }[]).find((s) => s.id === cue)
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
      fade = LIVE.loopFadeSeconds
    }
    if (loop) stopCue(cue)
    const voice = b.play(pick.id, { bus: 'fx', when: now, cents: pick.cents, pan, loop, until, fade, fadeIn: loop ? LIVE.loopFadeSeconds : undefined })
    if (voice) running.set(cue, [...(running.get(cue) ?? []).slice(-7), voice])
  }

  const ahead = (from: number) => {
    if (state !== 'ready' || !backend || !flowing) return
    const fps = config.film.fps
    if (!prelude) {
      const t = openingTimes()
      const plan = { prompt: config.intro.prompt, charsPerSecond: config.intro.charsPerSecond, levelOpens: t.levelOpens, levelPicks: t.levelPicks, sendPressed: t.held, linesDone: t.lines.map((l) => l.done) }
      prelude = openingEvents(plan, fps).map((e) => ({ at: e.frame / fps, cue: eventCues[e.name] ?? '', x: e.x }))
    }
    const lo = aheadTo < 0 ? from : aheadTo
    const hi = filmAt + LIVE.aheadSeconds
    const now = backend.now()
    for (const s of prelude) if (s.cue && s.at >= lo && s.at < hi) playCue(s.cue, s.x, now + s.at - filmAt)
    aheadTo = Math.max(lo, hi)
  }

  const reduck = () => {
    if (!backend) return
    const now = backend.now()
    backend.duck(LIVE.standInDucks ? duckSpans(narrator.bookings(now).filter((b) => b.end > now), DUCK.attackSeconds, DUCK.releaseSeconds) : [], db(-audio.duckDb))
  }

  const inMode = (mode: SoundMode) => {
    if (mode === lastMode) return
    if (lastMode !== null) desk.restart()
    lastMode = mode
  }

  const setMark = (booking: Booking, line: StandIn) => {
    const mark = spoken[line.key]?.mark
    const cue = mark ? cueOfEvent(mark.event) : undefined
    if (!mark || !cue) return
    if (marks.has(booking)) stopCue(cue)
    lastPlay.delete(cue)
    playCue(cue, 960, booking.start + phraseStart(line, mark.phrase))
    marks.set(booking, cue)
    byMark.add(cue)
  }

  const speak = (booking: Booking, line: StandIn) => {
    speaking.set(booking, line)
    setMark(booking, line)
    if (!caption && o.caption) caption = o.caption(() => api.said())
    caption?.place(captionAt)
    caption?.wake()
  }

  const takeBack = (list: Booking[], why: string) => {
    for (const c of list) {
      speaking.delete(c)
      const cue = marks.get(c)
      if (cue) stopCue(cue)
      marks.delete(c)
      note({ at: round(backend!.now()), line: c.id, trigger: why, what: 'taken back', start: round(c.start), why: `${why} before it began` })
    }
    if (list.length) reduck()
  }

  // A line of the script: once in a run, at its event or after the line that is being said and the gap. In the film the gap is the one between two lines of a beat.
  const say = (key: string, trigger: string, mode: SoundMode, from?: number) => {
    const line = lines.get(key)
    const row = spoken[key]
    if (!line || !row || !backend || desk.isSpent(line.id)) return
    const now = backend.now()
    const booking = desk.ask(now, { id: line.id, group: line.beat, seconds: line.seconds, page: row.keeps ? null : line.page, until: row.until, gap: row.after !== undefined || mode === 'film' ? audio.lineGapSeconds : undefined, from })
    if (!booking) {
      note({ at: round(now), line: line.id, trigger, what: 'dropped', why: narrator.why ?? '' })
      return
    }
    note({ at: round(now), line: line.id, trigger, what: 'spoken', start: round(booking.start), seconds: round(line.seconds) })
    speak(booking, line)
    for (const [next, r] of Object.entries(spoken)) if (r.after === key) say(next, `after ${line.id}`, mode, booking.end)
    reduck()
  }

  // The lines that follow a line as its later parts, in order.
  const partsAfter = (key: string): [Booking, StandIn][] => {
    const out: [Booking, StandIn][] = []
    for (let at = key, found = true; found;) {
      found = false
      for (const [b, l] of speaking) if (spoken[l.key]?.after === at) {
        out.push([b, l])
        at = l.key
        found = true
        break
      }
    }
    return out
  }

  // An event that makes a line jump to its next part: the phrase being said is said to its end and no further.
  const jump = (name: string, page: string) => {
    const now = backend!.now()
    for (const [b, l] of [...speaking]) {
      if (b.end <= now || l.page !== page || !spoken[l.key]?.jump?.includes(name)) continue
      const at = l.phrases.find((p) => b.start + p.to > now)
      const end = b.start <= now && at ? b.start + at.to : b.start
      if (end >= b.end) continue
      const parts = partsAfter(l.key)
      desk.shorten(now, b, end, parts.map(([x]) => x))
      if (b.start >= b.end) speaking.delete(b)
      for (const [x, part] of parts) setMark(x, part)
      note({ at: round(now), line: b.id, trigger: `event ${name}`, what: 'cut', start: round(b.start), seconds: round(b.end - b.start), why: 'it ends at its next pause and its next part follows' })
      caption?.wake()
      reduck()
    }
  }

  // The line that hangs on no event: it is said the moment sound is allowed while its page is on screen.
  function wantOpening(trigger: string): void {
    if (state !== 'ready' || !backend) {
      owedOpen = unlocking !== null
      return
    }
    owedOpen = false
    for (const [key, row] of Object.entries(spoken)) if (row.event === null && row.after === undefined && lines.get(key)?.page === quietPage) say(key, trigger, 'live')
  }

  const api: SoundApi = {
    available: () => state !== 'silent',
    unlock() {
      if (unlocking) return unlocking
      if (!lists) return (unlocking = Promise.resolve())
      owedOpen = here === quietPage && lastMode !== 'film'
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
        if (ok) watchPage()
        if (here !== null) startTone()
        if (ok && lastMode !== 'film' && (owedOpen || here === quietPage)) wantOpening('sound allowed')
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
      inMode(mode)
      if (e.page !== undefined) atPage(e.page, mode)
      if (state !== 'ready' || !backend) {
        if (e.name === 'page-turn' && e.page !== undefined) turnFrom(e.page, mode)
        return
      }
      backend.resume()
      flowing = true
      startTone()
      for (const cue of stopEvents[e.name] ?? []) stopCue(cue)
      if (e.name === 'page-turn' || e.name === 'skip') for (const cue of loopCues) if (cue !== 'room-tone') stopCue(cue)
      const cue = cueOfEvent(e.name)
      const mark = markStandsFor[e.name]
      const marked = mark !== undefined && cue !== undefined && byMark.has(cue)
      if (cue && cue !== 'room-tone' && !marked && !hushed(e, mode, cue)) playCue(cue, e.x)
      for (const more of alsoStarts[e.name] ?? []) if (!hushed(e, mode, more)) playCue(more, e.x)
      if (e.name === 'page-turn' && e.page !== undefined) turnFrom(e.page, mode)
      const page = e.page ?? desk.page ?? here
      if (page === null) return
      const now = backend.now()
      takeBack(desk.at(now, page), 'its page was left')
      takeBack(desk.ended(now, page, e.name), `its moment ended with ${e.name}`)
      jump(e.name, page)
      if (e.name === 'skip' || e.name === 'page-turn') takeBack(desk.leave(now, page), e.name === 'skip' ? 'its page was skipped' : 'its page was turned')
      for (const key of spokenKeysFor(e.name, page)) say(key, `event ${e.name}`, mode)
    },
    beat(id, mode, into = 0) {
      inMode(mode)
      const on = pageOfBeat(id)
      if (on !== null) atPage(on, mode)
      if (state !== 'ready' || !backend) return
      flowing = true
      startTone()
      if (mode !== 'film' || !(into <= LIVE.beatLateSeconds)) return
      for (const [key, row] of Object.entries(spoken)) {
        if (row.event !== null || row.after !== undefined || lines.get(key)?.beat !== id) continue
        desk.restart()
        say(key, `beat ${id}`, 'film')
      }
    },
    // The site still calls this when a control is pressed. No line hangs on a call any more.
    trigger() {
      return
    },
    // The site still says how long the visitor has been still. No line hangs on it: a line is set off by an event, never by a clock.
    quiet() {
      return
    },
    page(id, at) {
      inMode('live')
      atPage(id, 'live')
      captionAt = at
      caption?.place(at)
    },
    said() {
      const now = backend ? backend.now() : 0
      const out: SaidLine[] = []
      for (const [b, l] of speaking) {
        if (b.end <= now) {
          speaking.delete(b)
          marks.delete(b)
        } else l.phrases.forEach((p, k) => {
          if (b.start + p.from < b.end - 1e-9) out.push({ id: `${b.id}#${k}`, line: b.id, words: p.words, start: b.start + p.from, end: Math.min(b.end, b.start + p.to), draft: l.draft, loud: spoken[l.key]?.loud === true })
        })
      }
      return { now, lines: out.sort((a, b) => a.start - b.start) }
    },
    opening(from, to) {
      lead = to < openingFrames() / config.film.fps
      filmAt = to
      if (lead && tone) {
        tone.stop(LIVE.loopFadeSeconds)
        tone = null
      }
      if (state !== 'ready' || !backend || to <= from) return
      backend.resume()
      flowing = true
      startTone()
      ahead(from)
    },
    start() {
      flowing = true
      if (state !== 'ready' || !backend) return
      backend.resume()
      startTone()
      if (lead) ahead(filmAt)
    },
    stop() {
      flowing = false
      lead = false
      aheadTo = -1
      lastPlay.clear()
      if (backend) {
        const now = backend.now()
        for (const b of speaking.keys()) if (b.end > now) note({ at: round(now), line: b.id, trigger: 'stop', what: b.start <= now ? 'cut' : 'taken back', start: round(b.start), why: 'the sound was stopped' })
      }
      narrator.clear()
      desk.clear()
      speaking.clear()
      marks.clear()
      byMark.clear()
      running.clear()
      tone = null
      leaving = null
      toQuiet = false
      caption?.wake()
      if (!backend) return
      backend.stopAll()
      backend.duck([], 1)
    },
    state: () => state,
    backend: () => backend?.kind ?? 'none',
    onChange(listener) {
      listeners.push(listener)
    },
    log: () => entries.slice()
  }
  return api
}
