// The site's sound engine. It is loaded only in the modes live, film and loop, and only main.ts may import it.
// Nothing here is created, fetched or played before unlock(), which the visitor's first click or key press calls.
// The narrator's lines are silent stand-ins (change note 003): no take is fetched or played, a line holds its time and gives its caption.
// The index of the sound files is part of the build, so the engine knows from the start whether there is any sound to play.
import { config, stepHz } from '../config'
import { narration } from '../copy'
import { openingFrames, openingTimes } from '../film/opening'
import { wallSeconds } from '../ui/clock'
import { CAPTION, type Caption, type CaptionSource } from '../ui/said'
import { changeCue, changeLoops, changeStops, coverOf, cueFor, keptChange, landers, landing } from './change'
import { allCues, alsoStarts, cueOfEvent, earlyEnd, endsSentence, eventCues, loopCues, markStandsFor, openingEvents, pageAfter, pickVariant, quietPage, quietPageCues, spoken, spokenKeysFor, stopEvents, turnWaitsFor, unitPage, waitsFor } from './cues'
import { dehum } from './dsp'
import { DUCK, LIVE, TONE, db } from './levels'
import { duckSpans, LiveDesk, Narrator, type Booking } from './narrator'
import { riseAfterFire } from '../ui/rise'
import { FINISH, SHOUT, SHOUT_LINE, shoutTake, voiceShout } from '../boss/tune'
import { builtTo, phraseStart, standIns, type StandIn, lineKey } from './standin'
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
  event(e: { name: string; x: number; y: number; hitsCursor: boolean; page?: string; step?: number }, mode: SoundMode): void
  beat(id: string, mode: SoundMode, into?: number): void
  trigger(name: string): void
  quiet(seconds: number): void
  // The page on screen, told by the site when it knows it: at a jump to a step and at each frame of the live site.
  // caption: where that page wants the spoken words, the y of the lower edge of their panel in pixels of the 1920 by 1080 page.
  page(id: string, caption?: number): void
  // The phrases of the lines that are booked or being spoken, each with its words and its start and end on the sound's clock, and that clock's time now.
  said(): { now: number; lines: SaidLine[] }
  // True while the line that page's own way on waits for is booked and has not ended: spoken, or with the sound off the span of its caption.
  owed(page: string): boolean
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
export interface SaidLine { id: string; line: string; words: string; start: number; end: number; draft: boolean; loud: boolean; step?: { k: number; n: number }; whole?: string }

export interface SoundIndex {
  version: number
  pack: { file: string; bytes: number; sha256?: string } | null
  sfx: { id: string; at: number; bytes: number; seconds: number; mime: string }[]
  loops: { id: string; file: string; seconds: number; mime: string; bytes?: number; sha256?: string }[]
  // words: the text the take was recorded from, with its pause marks. starts: the seconds from the file's start at which each phrase starts.
  lines: { id: string; file: string; seconds: number; mime: string; bytes?: number; sha256?: string; words?: string; starts?: number[] }[]
}

type Bus = 'fx' | 'voice' | 'tone'
// offset: the seconds of the sound that are left out at its start.
interface PlayOptions { bus: Bus; when: number; cents: number; pan: number; loop: boolean; until?: number; fade?: number; fadeIn?: number; offset?: number }
// stop: it goes out from now over the fade. until: it is out at a time to come, having gone down over the fade before it, or from now when that is later.
interface Voice { stop(fade: number): void; until(at: number, fade: number): void }
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
      if (o.offset) src.start(when, o.offset)
      else src.start(when)
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
        },
        until(at, fade) {
          try {
            const t = ctx.currentTime
            const from = Math.max(t, when, at - fade)
            const to = Math.max(at, from + fade)
            gain.gain.cancelScheduledValues(t)
            gain.gain.setValueAtTime(1, from)
            gain.gain.linearRampToValueAtTime(0, to)
            src.stop(to)
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
          el.currentTime = o.offset ?? 0
        } catch {
          return
        }
        void el.play().catch(() => undefined)
      }
      if (o.when > wallSeconds() + LIVE.elementSoonSeconds) e.timers.push(later(o.when, start))
      else start()
      if (o.until !== undefined) e.timers.push(later(o.until, stop))
      return { stop, until: (at) => { e.timers.push(later(at, stop)) } }
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
  const lines = standIns(o.script?.film, o.script?.drafts, undefined, undefined, (o.index ?? (shipped as SoundIndex)).lines)
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
  let openingOpen = true
  const told = new Set<string>()
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
  const coveredAt = new Map<string, number>()
  const running = new Map<string, Voice[]>()
  const speaking = new Map<Booking, StandIn>()
  let heard: number | undefined
  const turnHeld = new Map<string, number>()
  const voices = new Map<Booking, Voice>()
  const marks = new Map<Booking, string>()
  const stepped = new WeakMap<Booking, number[]>()
  const hidden = new WeakMap<Booking, number>()
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
    const voiced = new Set([...lines.values()].filter((l) => l.kept).map((l) => l.id))
    const jobs = [...index.loops, ...index.lines.filter((f) => voiced.has(f.id))].map(async (f) => {
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

  const stopCue = (cue: string, fade: number = LIVE.loopFadeSeconds) => {
    for (const v of running.get(cue) ?? []) v.stop(fade)
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
      if (from !== null) {
        desk.restart()
        told.clear()
      } else wantOpening('the careers page on screen')
    }
    if (page !== quietPage) {
      openingOpen = false
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

  const has = (id: string): boolean => loaded.has(id)
  // A kept cue of the change list that carries another event's sound in its own: that event plays nothing at the moment the cue plays.
  const covers = (cue: string, now: number) => {
    for (const name of changeCue(cue)?.covers ?? []) coveredAt.set(name, now)
  }
  const covered = (name: string, now: number): boolean => {
    const at = coveredAt.get(name)
    return at !== undefined && coverOf(name, has) !== undefined && Math.abs(now - at) < LIVE.sameCueSeconds
  }

  // room: for a cue that lands on an event (`lands` in the change list), the seconds from now to that event, where they are known.
  // Its body then ends on the event: it waits, or starts that much into itself. Unknown, it starts whole and at once.
  const playCue = (cue: string, x: number, when?: number, room?: number) => {
    const b = backend!
    let now = Math.max(when ?? 0, b.now())
    const last = lastPlay.get(cue)
    if (last !== undefined && Math.abs(now - last) < LIVE.sameCueSeconds) return
    lastPlay.set(cue, now)
    const spec = allCues(audio.sfx as { id: string; seconds: number; variants?: number }[]).find((s) => s.id === cue) ?? changeCue(cue)
    const count = counts.get(cue) ?? 0
    counts.set(cue, count + 1)
    const pick = pickVariant(cue, count, spec?.variants ?? 1, has)
    if (!pick) return
    const loop = loopCues.includes(cue) || changeLoops.includes(cue)
    const pan = Math.max(-1, Math.min(1, (x - 960) / 960)) * LIVE.panWidth
    let until: number | undefined
    let fade = 0
    if (cue === 'hold-music') until = now + audio.holdMusicSeconds
    else if (loop) {
      until = now + LIVE.loopMaxSeconds
      fade = LIVE.loopFadeSeconds
    }
    if (loop) stopCue(cue)
    const lands = changeCue(cue)?.lands
    const kept = lengths.get(pick.id) ?? spec?.seconds ?? 0
    const fit = lands && room !== undefined ? landing(kept, lands.tail, room) : { wait: 0, skip: 0 }
    if (lands && fit.skip >= kept - lands.tail) return
    now += fit.wait
    const voice = b.play(pick.id, { bus: 'fx', when: now, cents: pick.cents, pan, loop, until, fade, fadeIn: loop || fit.skip > 0 ? LIVE.loopFadeSeconds : undefined, ...(fit.skip > 0 ? { offset: fit.skip } : {}) })
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

  // The cue that lands on the fire of the finish. The arms and the first charge mark after them, the press, are kept as they come.
  // On the live site while FINISH.onVoice the blast is set at the press (`voiceShout`, as the page reads it), so the seconds to it are known when the cue's own event comes.
  // With the switch off the blast comes when the button is let go, which nobody knows before: the cue then starts whole.
  // In the film on the site the cue has no event of its own: it starts at the arms, and the fire is `SHOUT.fire` after them.
  let armed: { step: number | undefined; at: number } | null = null
  let pressed: { step: number | undefined; at: number } | null = null
  const after = (a: { step: number | undefined; at: number }, step: number | undefined, at: number): number => (step !== undefined && a.step !== undefined ? (step - a.step) / stepHz : at - a.at)
  const roomToFire = (step: number | undefined, now: number): number | undefined => {
    if (!FINISH.onVoice || !armed) return undefined
    const p = pressed ?? { step, at: now }
    return voiceShout(SHOUT.arms + after(armed, p.step, p.at), shoutTake()).due - SHOUT.arms - after(armed, step, now)
  }
  const land = (e: { name: string; x: number; step?: number; page?: string }, mode: SoundMode, now: number) => {
    for (const row of landers) {
      const l = row.lands!
      if (e.name === l.from) {
        armed = { step: e.step, at: now }
        pressed = null
        if (mode === 'film' && keptChange(row, has) && !hushed(e, mode, row.id)) playCue(row.id, e.x, undefined, SHOUT.fire - SHOUT.arms)
      } else if (e.name === spoken[SHOUT_LINE]?.steps?.next) {
        if (armed && !pressed) pressed = { step: e.step, at: now }
      } else if (e.name === l.on) {
        if (mode !== 'film') stopCue(row.id, LIVE.landCutSeconds)
        armed = null
      } else if (e.name === 'page-turn' || e.name === 'skip') stopCue(row.id)
    }
  }

  const reduck = () => {
    if (!backend) return
    const now = backend.now()
    backend.duck(duckSpans([...speaking.keys()].filter((b) => b.end > now && b.end > b.start && (LIVE.standInDucks || voices.has(b))), DUCK.attackSeconds, DUCK.releaseSeconds), db(-audio.duckDb))
  }

  const inMode = (mode: SoundMode) => {
    if (mode === lastMode) return
    if (lastMode !== null) {
      desk.restart()
      told.clear()
    }
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

  // The take of a line with a voice, set on the sound clock at the start of its booking. A line that is a stand-in, or whose file did not come, plays nothing.
  const voice = (booking: Booking, line: StandIn, offset = 0) => {
    voices.get(booking)?.stop(0)
    voices.delete(booking)
    if (waits.has(booking) || !line.kept || !loaded.has(line.id)) return
    const v = backend!.play(line.id, { bus: 'voice', when: booking.start, cents: 0, pan: 0, loop: false, ...(offset > 0 ? { offset } : {}) })
    if (v) voices.set(booking, v)
  }

  // A line that now ends sooner than its file: its voice is out at the booking's end. One that will not be said at all is stopped before it starts.
  const cut = (booking: Booking, fade: number = LIVE.voiceFadeSeconds) => {
    const v = voices.get(booking)
    if (!v) return
    if (booking.start >= booking.end) {
      v.stop(0)
      voices.delete(booking)
    } else v.until(booking.end, fade)
  }

  // The shout on the live site while FINISH.onVoice: booked on its event as ever, its voice and its words wait for the first charge mark, the visitor's press.
  // Until then the booking is held open for as long as the page waits before it presses by itself.
  const waits = new Map<Booking, { step: number | undefined; at: number }>()
  const onVoice = new Set<Booking>()
  const speak = (booking: Booking, line: StandIn) => {
    if (FINISH.onVoice && lastMode === 'live' && line.key === SHOUT_LINE && spoken[line.key]?.steps) {
      waits.set(booking, { step: heard, at: booking.start })
      booking.end = booking.start + FINISH.alone + line.seconds
    }
    speaking.set(booking, line)
    voice(booking, line)
    setMark(booking, line)
    if (!caption && o.caption) caption = o.caption(() => api.said())
    caption?.place(captionAt ?? CAPTION.lowOn[here ?? ''])
    caption?.wake()
  }

  const takeBack = (list: Booking[], why: string) => {
    for (const c of list) {
      const gone = speaking.get(c)
      speaking.delete(c)
      voices.get(c)?.stop(0)
      voices.delete(c)
      if (gone) {
        told.delete(gone.key)
        const later = [...speaking].filter(([b, l]) => l.beat === gone.beat && l.index > gone.index && desk.drop(backend!.now(), b)).map(([b]) => b)
        if (later.length) list.push(...later)
      }
      const cue = marks.get(c)
      if (cue) stopCue(cue)
      marks.delete(c)
      note({ at: round(backend!.now()), line: c.id, trigger: why, what: 'taken back', start: round(c.start), why: `${why} before it began` })
    }
    if (list.length) reduck()
  }

  // A line of the script: once in a run, at its event or after the line that is being said and the gap. In the film the gap is the one between two lines of a beat.
  const openingKey = Object.keys(spoken).find((k) => spoken[k]!.event === null && spoken[k]!.after === undefined) ?? ''
  const say = (key: string, trigger: string, mode: SoundMode, from?: number) => {
    const line = lines.get(key)
    const row = spoken[key]
    if (!line || !row || !backend || desk.isSpent(line.id)) return
    const now = backend.now()
    if (line.index > 0 && !told.has(lineKey(line.beat, line.index - 1))) {
      note({ at: round(now), line: line.id, trigger, what: 'dropped', why: 'the part before it was not said' })
      return
    }
    const booking = desk.ask(now, { id: line.id, group: line.beat, seconds: line.seconds, page: row.keeps ? null : line.page, until: row.until, gap: mode === 'film' ? audio.lineGapSeconds : undefined, from })
    if (!booking) {
      note({ at: round(now), line: line.id, trigger, what: 'dropped', why: narrator.why ?? '' })
      return
    }
    note({ at: round(now), line: line.id, trigger, what: 'spoken', start: round(booking.start), seconds: round(line.seconds) })
    told.add(key)
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

  // A line whose phrases come on marks of its page: each mark shows the next phrase, the last mark the last phrase, and the end mark ends the line.
  // A row with hidesOnRise: its caption leaves riseAfterFire() after the first last mark and stays away; the voice is not touched.
  // The shout on the live site while FINISH.onVoice: the first charge mark is the press. The file starts there, whole but for its silent lead-in, so that its peak
  // comes where voiceShout puts the blast, and each phrase is shown as the file reaches it. The later marks and the letting go move nothing; the fire mark takes the caption away on the rise.
  const step = (name: string, page: string) => {
    const now = backend!.now()
    for (const [b, l] of [...speaking]) {
      const steps = spoken[l.key]?.steps
      if (!steps || l.page !== page || b.end <= now) continue
      const got = stepped.get(b) ?? []
      const at = Math.max(now, b.start)
      const wait = waits.get(b)
      if (wait || onVoice.has(b)) {
        if (wait && name === steps.next) {
          const press = SHOUT.arms + (heard !== undefined && wait.step !== undefined ? (heard - wait.step) / stepHz : now - wait.at)
          const v = voiceShout(press, { starts: l.phrases.map((p) => p.from), seconds: l.seconds, ...(l.peak !== undefined ? { peak: l.peak } : {}) })
          const start = at + v.from - press
          waits.delete(b)
          onVoice.add(b)
          b.start = start
          b.end = start + l.seconds - v.skip
          voice(b, l, v.skip)
          stepped.set(b, v.says.map((x) => start + x - v.from))
          note({ at: round(now), line: b.id, trigger: `event ${name}`, what: 'spoken', start: round(start), seconds: round(b.end - start), why: `its voice starts with the press, ${round(v.skip)} s into its file, and its peak comes ${round(v.due - press)} s after the press` })
          reduck()
        } else if (name === steps.last) {
          if (wait) {
            waits.delete(b)
            b.end = at
          } else if (steps.hidesOnRise && !hidden.has(b)) hidden.set(b, at + riseAfterFire())
        } else continue
        caption?.wake()
        continue
      }
      if (name === steps.next) {
        if (got.length < l.phrases.length - 1) got.push(at)
      } else if (name === steps.last) {
        if (steps.hidesOnRise && !hidden.has(b)) hidden.set(b, at + riseAfterFire())
        if (got.length < l.phrases.length) {
          while (got.length < l.phrases.length) got.push(at)
          const lasts = l.seconds - (l.phrases[l.phrases.length - 1]?.from ?? 0)
          if (at + lasts < b.end) {
            desk.shorten(now, b, at + lasts, [])
            cut(b)
          }
        }
      } else if (steps.ends !== undefined && name === steps.ends) {
        desk.shorten(now, b, at, [])
        cut(b)
        if (b.start >= b.end) speaking.delete(b)
        note({ at: round(now), line: b.id, trigger: `event ${name}`, what: 'cut', start: round(b.start), seconds: round(b.end - b.start), why: 'its moment ended on the mark of its page' })
      } else continue
      stepped.set(b, got)
      caption?.wake()
    }
  }

  // An event that makes a line jump to its next part: the line is said to where earlyEnd puts its end and no further.
  // An event that comes before the line has begun is taken as one that comes at the line's first moment: the line is not dropped.
  // A line its page's turn waits for jumps on the live site only: in the film it is said whole, as the mix lays it.
  const jump = (name: string, page: string, mode: SoundMode) => {
    const now = backend!.now()
    for (const [b, l] of [...speaking]) {
      if (b.end <= now || l.page !== page || !spoken[l.key]?.jump?.includes(name) || (mode !== 'live' && turnWaitsFor[page] === l.key)) continue
      const held = turnWaitsFor[page] === l.key
      const sentences = held ? [] : l.phrases.filter((p) => endsSentence(p.words)).map((p) => p.to)
      const end = Math.min(b.end, b.start + earlyEnd(l.phrases.map((p) => p.to), sentences, Math.max(0, now - b.start)))
      if (end >= b.end) continue
      const parts = partsAfter(l.key)
      desk.shorten(now, b, end, parts.map(([x]) => x))
      cut(b)
      if (b.start >= b.end) speaking.delete(b)
      for (const [x, part] of parts) {
        voice(x, part)
        setMark(x, part)
      }
      note({ at: round(now), line: b.id, trigger: `event ${name}`, what: 'cut', start: round(b.start), seconds: round(b.end - b.start), why: held ? 'it ends at its next pause and its page may turn' : 'it ends with its sentence, or at its next pause when the sentence is long, and its next part follows' })
      if (turnWaitsFor[page] === l.key) turnHeld.set(page, b.end + audio.liveNarratorMinGapSeconds)
      caption?.wake()
      reduck()
    }
  }

  // The careers page is silent apart from the line its turn sets off: a line still being said when the live site turns to it goes out there.
  const hushTurn = (now: number, name: string, page: string) => {
    turnHeld.delete(page)
    if (pageAfter[page] !== quietPage) return
    for (const [b, l] of [...speaking]) {
      if (spoken[l.key]?.keeps || b.start > now || b.end <= now + LIVE.voiceFadeSeconds) continue
      desk.shorten(now, b, now + LIVE.voiceFadeSeconds, [])
      cut(b)
      note({ at: round(now), line: b.id, trigger: `event ${name}`, what: 'cut', start: round(b.start), seconds: round(b.end - b.start), why: 'the careers page came while it was said' })
      caption?.wake()
      reduck()
    }
  }

  // The line that hangs on no event: it is said when sound is allowed while its page stands at rest on screen, once a visit.
  // A press of the page's button or a turn away from it closes it for the visit; it starts a moment late so that the press that allowed the sound is seen first.
  // Line 1 belongs to the careers page. When that page is closed while the line is being said, the line ends there: it goes out and the next line may follow.
  const closeOpening = (now: number, name: string) => {
    for (const [b, l] of [...speaking]) {
      if (l.key !== openingKey || b.start > now || b.end <= now + LIVE.openingFadeSeconds) continue
      desk.shorten(now, b, now + LIVE.openingFadeSeconds, [])
      cut(b, LIVE.openingFadeSeconds)
      note({ at: round(now), line: b.id, trigger: `event ${name}`, what: 'cut', start: round(b.start), seconds: round(b.end - b.start), why: 'its page was closed while it was said' })
      caption?.wake()
      reduck()
    }
  }

  function wantOpening(trigger: string): void {
    if (!openingOpen) return
    if (state !== 'ready' || !backend) {
      owedOpen = unlocking !== null
      return
    }
    owedOpen = false
    openingOpen = false
    for (const [key, row] of Object.entries(spoken)) if (row.event === null && row.after === undefined && lines.get(key)?.page === quietPage) say(key, trigger, 'live', backend.now() + LIVE.openingWaitSeconds)
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
        if (ok && lastMode !== 'film' && here === quietPage) wantOpening('sound allowed')
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
      const closes = e.page === quietPage && (e.name === 'page-turn' || (spoken[openingKey]?.until.includes(e.name) ?? false))
      if (state !== 'ready' || !backend) {
        if (closes) openingOpen = false
        if (e.name === 'page-turn' && e.page !== undefined) turnFrom(e.page, mode)
        return
      }
      backend.resume()
      flowing = true
      startTone()
      for (const cue of [...(stopEvents[e.name] ?? []), ...changeStops(e.name)]) stopCue(cue)
      if (e.name === 'page-turn' || e.name === 'skip') for (const cue of [...loopCues, ...changeLoops]) if (cue !== 'room-tone') stopCue(cue)
      const cue = cueFor(e.name, e.page ?? here, has)
      const mark = markStandsFor[e.name]
      const marked = mark !== undefined && cue !== undefined && byMark.has(cue)
      land(e, mode, backend.now())
      if (cue && cue !== 'room-tone' && !marked && !hushed(e, mode, cue) && !covered(e.name, backend.now())) {
        if (!changeCue(cue)?.lands) playCue(cue, e.x)
        else if (mode !== 'film') playCue(cue, e.x, undefined, roomToFire(e.step, backend.now()))
        covers(cue, backend.now())
      }
      for (const more of alsoStarts[e.name] ?? []) if (!hushed(e, mode, more)) playCue(more, e.x)
      if (e.name === 'page-turn' && e.page !== undefined) turnFrom(e.page, mode)
      const page = e.page ?? desk.page ?? here
      if (page === null) return
      const now = backend.now()
      takeBack(desk.at(now, page), 'its page was left')
      takeBack(desk.ended(now, page, e.name), `its moment ended with ${e.name}`)
      if (closes && mode !== 'film') closeOpening(now, e.name)
      if (mode === 'live' && (e.name === 'page-turn' || e.name === 'skip')) hushTurn(now, e.name, page)
      jump(e.name, page, mode)
      heard = e.step
      step(e.name, page)
      if (e.name === 'skip' || e.name === 'page-turn') takeBack(desk.leave(now, page), e.name === 'skip' ? 'its page was skipped' : 'its page was turned')
      if (closes) openingOpen = false
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
        told.clear()
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
      caption?.place(at ?? CAPTION.lowOn[id])
    },
    said() {
      const now = backend ? backend.now() : 0
      const out: SaidLine[] = []
      for (const [b, l] of speaking) {
        if (b.end <= now) {
          speaking.delete(b)
          marks.delete(b)
          voices.delete(b)
        } else {
          const got = spoken[l.key]?.steps ? stepped.get(b) ?? [] : null
          l.phrases.forEach((p, k) => {
            const start = got ? got[k] : b.start + p.from
            const end = Math.min(b.end, hidden.get(b) ?? b.end, got ? got[k + 1] ?? b.end : b.start + p.to)
            if (start !== undefined && start < end - 1e-9) out.push({ id: `${b.id}#${k}`, line: b.id, words: got ? builtTo(l, k) : p.words, start, end, draft: l.draft, loud: l.loud, ...(got ? { step: { k, n: l.phrases.length }, whole: builtTo(l, l.phrases.length - 1) } : {}) })
          })
        }
      }
      return { now, lines: out.sort((a, b) => a.start - b.start) }
    },
    owed(page) {
      const key = waitsFor[page]
      if (state !== 'ready' || !backend) return false
      const now = backend.now()
      if ((turnHeld.get(page) ?? -Infinity) > now) return true
      if (key === undefined) return false
      for (const [b, l] of speaking) if (l.key === key && b.end > now) return true
      return false
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
      armed = null
      pressed = null
      if (backend) {
        const now = backend.now()
        for (const b of speaking.keys()) if (b.end > now) note({ at: round(now), line: b.id, trigger: 'stop', what: b.start <= now ? 'cut' : 'taken back', start: round(b.start), why: 'the sound was stopped' })
      }
      narrator.clear()
      desk.clear()
      speaking.clear()
      voices.clear()
      turnHeld.clear()
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
