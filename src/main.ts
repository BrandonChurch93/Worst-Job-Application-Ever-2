import { App, type StillSpec } from './app'
import { makeShowcase, type Showcase } from './capture/showcase'
import { beat as beatOf, config, filmSeconds, stepHz, unitStart } from './config'
import { copy } from './copy'
import type { TargetKind } from './core/accumulator'
import { quality, qualityIds, type QualityId } from './core/quality'
import { samples } from './core/sampler'
import { views } from './diagnostics/views'
import { pages } from './pages'
import { words } from './shell/words'
import { BotDriver, type BotName } from './stage/bots'
import { liveFlow, liveView, MouseDriver, Stage, type Frame } from './stage/stage'
import type { CameraPose, Driver, Hint } from './stage/types'
import { lessMotion, makeQualityPicker, messagesOf, mountInterface, mountProbe, mountTouchMessage, ready as controlsReady, touchOnly, type InterfaceApi, type Mounted, type ProbeRunner } from './ui/api'
import { backingOf, type Backing } from './ui/backing'
import { wallSeconds } from './ui/clock'
import { listenToVisitor } from './ui/pointer'
import { fitPicture } from './core/levelFit'
import { levelIsFixedOf, startLevelOf } from './core/levelStart'

declare global {
  interface Window { showcase: Showcase; liveRun?: { state(): LiveShot; advance(seconds: number, quiet?: boolean): LiveShot; told(): LiveTold } }
}

interface LiveShot { time: number; page: string; gag: string | null; finished: boolean; png: string }
// What a walk tool needs to act as a visitor would with real mouse and key events: where the page wants the pointer, and where the hero is.
interface LiveTold { time: number; pageTime: number; page: string; gag: string | null; gags: string[]; finished: boolean; turning: boolean; skipOffered: boolean; scroll: number; hint: Hint | null; hero: { x: number; y: number }; hits: { name: string; time: number; page: string; x: number; y: number }[]; control: string | null }
interface Size { width: number; height: number }
interface Picture { key: string; frame: Frame; size: Size; pose: CameraPose }
type PlayMode = 'live' | 'film' | 'loop'
type Sound = ReturnType<typeof import('./audio/index').makeSound>

const BOTS = ['keen', 'clumsy', 'random', 'skipper']
const MODES = ['live', 'film', 'loop', 'capture', 'probe']
const PLAY: PlayMode[] = ['live', 'film', 'loop']
const params = new URLSearchParams(location.search)
const mode = params.get('mode') ?? (lessMotion() && !touchOnly() && !params.get('bot') ? 'film' : 'live')
const canvas = document.getElementById('stage') as HTMLCanvasElement
const host = document.getElementById('controls') as HTMLElement
const app = new App()
const fps = config.film.fps
document.title = copy.site.title

function stop(error: unknown): void {
  const box = document.getElementById('fail')!
  box.textContent = error instanceof Error ? error.message : String(error)
  box.hidden = false
  canvas.hidden = true
}

const startLevel = (): string => startLevelOf(params.get('quality'), config.live.defaultQuality)
const levelIsFixed = (): boolean => levelIsFixedOf(params.get('quality'), config.live.defaultQuality)

async function start(): Promise<void> {
  if (!MODES.includes(mode)) throw new Error(`No mode called "${mode}"`)
  const capture = mode === 'capture'
  if (mode === 'live' && touchOnly() && !params.get('bot')) {
    canvas.hidden = true
    await controlsReady()
    mountTouchMessage(host)
    return
  }
  await app.start(canvas, {
    format: params.get('format') ?? 'hd',
    assets: params.get('assets') ?? (capture ? 'full' : 'web'),
    capture,
    stepped: params.get('clock') === 'steps' || mode === 'probe',
    whole: mode !== 'live' || params.has('step'),
    forceKind: (params.get('target') as TargetKind | null) ?? undefined
  })
  if (params.get('diag')) app.setDiagnostic(params.get('diag')!)
  await controlsReady()
  if (capture) {
    canvas.style.width = `${app.format.width}px`
    canvas.style.height = `${app.format.height}px`
    return
  }
  if (mode === 'probe') probe()
  else play(mode as PlayMode)
}

// The picture's size on the screen and in pixels, at one level of live.quality.
// `film` says whether the film's bar stands under the picture, which is then shown that much shorter.
function sizer(film: () => boolean = () => false): { level(): string; set(level: string): void; fit(): void; changed(): boolean } {
  let level = startLevel()
  let dirty = true
  let barred = false
  const fit = () => {
    barred = film()
    const f = fitPicture(window.innerWidth, window.innerHeight, window.devicePixelRatio, quality(level).pixelRatioCap, barred)
    canvas.style.width = `${f.cssWidth}px`
    canvas.style.height = `${f.cssHeight}px`
    app.engine.setSize(f.width, f.height)
    app.format = { id: 'live', width: app.engine.width, height: app.engine.height }
    dirty = true
  }
  const shadows = () => app.setLevel(level as QualityId)
  shadows()
  fit()
  window.addEventListener('resize', fit)
  return {
    level: () => level,
    set(next) {
      if (next === level) return
      quality(next)
      level = next
      shadows()
      fit()
    },
    fit,
    changed() {
      if (film() !== barred) fit()
      const was = dirty
      dirty = false
      return was
    }
  }
}

function graphicsCard(): string {
  const gl = app.engine.renderer.getContext()
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  return String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
}

function probe(): void {
  const size = sizer()
  const one = samples(1)[0]!
  let count = 0
  const run: ProbeRunner = {
    play(scene, level, seconds, frame) {
      return new Promise<void>((done, fail) => {
        let from = 0
        let length = 1
        try {
          const b = beatOf(scene.beat)
          from = b.from
          length = b.to - b.from
          size.set(level)
        } catch (e) {
          fail(e)
          return
        }
        let first = -1
        let last = 0
        const tick = () => {
          const now = wallSeconds()
          if (first < 0) first = last = now
          else frame(now - last)
          last = now
          if (now - first >= seconds) {
            done()
            return
          }
          try {
            const f = app.filmFrame(scene.unit, from + ((now - first) % length))
            app.put(f.frame, f.page, f.pose)
            app.setCamera(f.pose)
            app.engine.frame(app.shot(), one, true, ++count, app.diagnostic)
          } catch (e) {
            fail(e)
            return
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    },
    graphicsCard
  }
  mountProbe(host, run)
}

function play(first: PlayMode): void {
  let now: PlayMode = first
  const size = sizer(() => now === 'film')
  const mouse = new MouseDriver()
  const rest = samples(64)
  const stepped = params.get('clock') === 'steps'

  let sound: Sound | null = null
  if (!stepped) {
    let touched = false
    const unlock = () => {
      touched = true
      void sound?.unlock()
    }
    window.addEventListener('pointerdown', unlock, { capture: true })
    window.addEventListener('keydown', unlock, { capture: true })
    void Promise.all([import('./audio/index'), import('./ui/said')]).then(([{ makeSound }, { makeCaption }]) => {
      sound = makeSound({ base: `${import.meta.env.BASE_URL}audio/`, caption: makeCaption })
      if (!flowing()) sound.stop()
      if (touched) void sound.unlock()
    })
  }
  const soundMode = () => (now === 'live' ? 'live' : 'film')
  const flowing = () => now !== 'film' || playing

  const botName = params.get('bot')
  if (botName && !BOTS.includes(botName)) throw new Error(`No bot called "${botName}"`)
  const driver = (): Driver => (botName ? new BotDriver(botName as BotName, Number(params.get('seed') ?? 1)) : mouse)
  const asked = Number(params.get('step') ?? 0)
  let base = asked >= 1 && asked <= 5 ? asked : 0
  const makeStage = () => new Stage({ mode: 'live', flow: liveFlow().slice(base), pages, driver: driver() })
  let stage = makeStage()
  let sent = 0
  let gags = 0
  let entry = -1
  let atRest = new Set<string>()
  let shown: Frame | null = null
  let volume = -1
  let lastInput = wallSeconds()

  const stepNow = (): number => {
    const i = base + stage.entryIndex
    return i >= 1 && i <= 5 ? i : 0
  }
  const headings = [copy.marketing.hero.headline, copy.step1.heading, copy.step2.heading, copy.step3.heading, copy.step4.heading, copy.step5.heading]

  const opening = now === 'film' && params.get('which') === 'a' ? app.opening() : null
  const lead = opening ? opening.seconds : 0
  const oneUnit = params.get('unit')
  if (oneUnit && !config.film.units.some((u) => u.id === oneUnit)) throw new Error(`No page called "${oneUnit}"`)
  const body = oneUnit ? config.film.units.find((u) => u.id === oneUnit)!.seconds : filmSeconds()
  const total = lead + body
  const beats = config.film.beats.filter((b) => !oneUnit || b.unit === oneUnit).map((b) => ({ id: b.id, at: lead + (oneUnit ? 0 : unitStart(b.unit)) + b.from }))
  let T = 0
  let playing = !lessMotion()
  let heardTo = 0
  const quiet = () => {
    sound?.stop()
    heardTo = T
    if (opening) sound?.opening(T, T)
  }
  const midBeat = () => {
    const b = beats.reduce<{ id: string; at: number } | null>((best, x) => (x.at < T && (!best || x.at > best.at) ? x : best), null)
    if (b) sound?.beat(b.id, 'film', T - b.at)
  }
  const film = {
    seconds: total,
    time: () => T,
    playing: () => playing,
    play() {
      if (T >= total - 1 / fps) T = 0
      playing = true
      heardTo = T
      if (opening) sound?.opening(T, T)
      sound?.start()
      midBeat()
    },
    pause() {
      playing = false
      quiet()
    },
    seek(seconds: number) {
      T = Math.min(total, Math.max(0, seconds))
      quiet()
      if (playing) {
        sound?.start()
        midBeat()
      }
    }
  }
  const filmMoment = (t: number): { unit: string; time: number } => (oneUnit ? { unit: oneUnit, time: Math.min(t, body) } : app.filmMomentAt(t))
  const filmPicture = (): Picture => {
    if (opening && T < lead) {
      const i = Math.min(opening.frameCount - 1, T * fps)
      return { key: `a${i}`, frame: opening.frame(i), size: opening.size, pose: opening.pose(i) }
    }
    const { unit, time } = filmMoment(Math.min(body - 1 / stepHz, T - lead))
    const f = app.filmFrame(unit, time)
    return { key: `b${unit}${time}`, frame: f.frame, size: f.page, pose: f.pose }
  }
  const filmSound = (from: number, to: number) => {
    if (!sound || to <= from) return
    if (opening) sound.opening(from, to)
    for (const b of beats) if (b.at >= from && b.at < to) sound.beat(b.id, 'film')
    if (to <= lead) return
    const a = filmMoment(Math.max(0, from - lead))
    const z = filmMoment(to - lead)
    if (a.unit !== z.unit) return
    const s = app.film(z.unit)
    for (const e of s.eventsBetween(app.stepOf(a.time), app.stepOf(z.time))) sound.event(e, 'film')
  }

  const piece = app.loop()
  let loopAt = 0
  const loopPicture = (): Picture => {
    const i = loopAt * fps
    return { key: `l${i}`, frame: piece.frame(i), size: piece.size, pose: piece.pose(i) }
  }

  const livePicture = (): Picture => {
    const f = stage.frameAt(stage.time)
    return { key: JSON.stringify([f.list, f.cursor, f.cursors ?? null, f.turn, f.scroll, f.view]), frame: f, size: stage.page, pose: liveView(f) }
  }
  const liveSound = () => {
    if (stage.entryIndex !== entry && shown) {
      entry = stage.entryIndex
      atRest = new Set(shown.list.filter((s) => s.kind === 'text' && s.words).map((s) => s.words!))
    }
    if (!sound) {
      sent = stage.events.length
      gags = stage.gagsReached.length
      return
    }
    sound.page(stage.page.id, stage.page.chrome?.()?.caption)
    for (; sent < stage.events.length; sent++) sound.event(stage.events[sent]!, 'live')
    const reached = stage.gagsReached
    for (; gags < reached.length; gags++) sound.beat(reached[gags]!, 'live')
    const v = stage.page.volume?.() ?? 1
    if (v !== volume) {
      volume = v
      sound.setVolume(v)
    }
    sound.quiet(wallSeconds() - lastInput)
  }
  const touched = () => {
    lastInput = wallSeconds()
  }

  const setMode = (next: PlayMode, record = true) => {
    if (next === now) return
    sound?.stop()
    now = next
    before = ''
    if (next === 'film') {
      T = 0
      heardTo = 0
      playing = !lessMotion()
    }
    if (next === 'live') sent = stage.events.length
    if (opening && next === 'film') sound?.opening(0, 0)
    if (flowing()) sound?.start()
    if (record) {
      const q = new URLSearchParams(location.search)
      if (next === 'live') q.delete('mode')
      else q.set('mode', next)
      const text = q.toString()
      history.pushState(null, '', text ? `?${text}` : location.pathname)
    }
  }
  window.addEventListener('popstate', () => {
    const m = new URLSearchParams(location.search).get('mode') ?? 'live'
    if ((PLAY as string[]).includes(m)) setMode(m as PlayMode, false)
  })

  const backing = (): Backing => backingOf(shown, stage.page.unit)

  let frameSeconds = 1 / 60
  const api: InterfaceApi = {
    mode: () => now,
    canvas,
    step: stepNow,
    setStep(step) {
      const to = Math.min(5, Math.max(0, Math.round(step)))
      if (!app.code(liveFlow()[to]!.page, () => api.setStep(to))) return
      base = to
      stage = makeStage()
      sound?.stop()
      sound?.page(liveFlow()[to]!.page)
      if (flowing()) sound?.start()
      sent = 0
      gags = 0
      entry = -1
      before = ''
    },
    heading: () => headings[stepNow()]!,
    messages: () => (shown && now === 'live' ? messagesOf(shown.list, atRest, words) : []),
    skipOffered: () => now === 'live' && stage.skipOffered,
    skip: () => mouse.pulse({ skip: true }),
    watchFilm() {
      setMode('film')
      sound?.trigger('watchFilm')
    },
    backToSite: () => setMode('live'),
    sound: {
      available: () => sound?.available() ?? false,
      muted: () => sound?.muted() ?? true,
      setMuted: (m) => sound?.setMuted(m)
    },
    quality: { levels: [...qualityIds], level: size.level, set: size.set, auto: () => !levelIsFixed() },
    diagnostics: [...views],
    diagnostic: () => app.diagnostic,
    setDiagnostic(view) {
      app.setDiagnostic(view)
      before = ''
    },
    get film() {
      return now === 'film' ? film : undefined
    },
    frameSeconds: () => frameSeconds,
    backing,
    typing: () => now === 'live' && (stage.page.typing?.() ?? false)
  }
  const picker = makeQualityPicker(qualityIds.map((id) => ({ id, minFps: quality(id).minFps })), levelIsFixed() ? { fixed: size.level() } : { start: size.level() })

  listenToVisitor({ window, document, canvas, mouse, live: () => now === 'live', touched, flippers: () => stage.page.control === 'flippers' })

  let still = 0
  let frame = 0
  let before = ''
  const draw = (): void => {
    const p = now === 'live' ? livePicture() : now === 'film' ? filmPicture() : loopPicture()
    if (now === 'live') shown = p.frame
    const key = `${now}${app.diagnostic}${p.key}`
    still = size.changed() || key !== before ? 0 : Math.min(still + 1, rest.length)
    before = key
    if (still >= rest.length) return
    frame++
    app.put(p.frame, p.size, p.pose)
    app.setCamera(p.pose)
    app.engine.frame(app.shot(), rest[still]!, still === 0, frame, app.diagnostic)
    if (now !== 'live' || base > 0 || stage.page.id !== liveFlow()[0]!.page) app.loadLater()
  }

  if (stepped) {
    const shot = (): LiveShot => {
      before = ''
      draw()
      return { time: stage.time, page: stage.page.id, gag: stage.gagsReached.at(-1) ?? null, finished: stage.finished, png: canvas.toDataURL('image/png') }
    }
    const quietShot = (): LiveShot => ({ time: stage.time, page: stage.page.id, gag: stage.gagsReached.at(-1) ?? null, finished: stage.finished, png: '' })
    const told = (): LiveTold => {
      const pose = stage.cursor.pose()
      return { time: stage.time, pageTime: stage.pageTime, page: stage.page.id, gag: stage.gagsReached.at(-1) ?? null, gags: stage.gagsReached, finished: stage.finished, turning: stage.turning, skipOffered: stage.skipOffered, scroll: stage.page.scroll(), hint: stage.page.hint(), hero: { x: pose.x, y: pose.y }, hits: stage.events.filter((e) => e.hitsCursor).map((e) => ({ name: e.name, time: e.step / stepHz, page: e.page, x: e.x, y: e.y })), control: stage.page.control ?? null }
    }
    window.liveRun = { state: shot, advance: (seconds, quiet) => { stage.advance(Math.round(seconds * stepHz)); return quiet ? quietShot() : shot() }, told }
    return
  }

  const controls: Mounted = mountInterface(host, api)
  let last = wallSeconds()
  let owed = 0
  const tick = () => {
    const t = wallSeconds()
    const dt = t - last
    last = t
    frameSeconds = Math.min(0.5, dt)
    const run = Math.min(0.1, dt)
    if (now === 'film' && !app.code(null)) {
      controls.update()
      requestAnimationFrame(tick)
      return
    }
    if (now === 'live') {
      owed += run
      const steps = Math.floor(owed * stepHz)
      owed -= steps / stepHz
      stage.advance(steps)
      draw()
      liveSound()
    } else if (now === 'film') {
      if (playing) {
        T = Math.min(total, T + Math.min(0.5, dt))
        if (T >= total) {
          playing = false
          quiet()
        }
      }
      draw()
      if (playing) {
        filmSound(heardTo, T)
        heardTo = T
        const level = picker.frame(frameSeconds)
        if (level !== size.level()) size.set(level)
      }
    } else {
      loopAt = (loopAt + run) % piece.seconds
      draw()
    }
    controls.update()
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// A still of the site with its controls over it, or of the message a touch screen gets, for the judged list.
function overlays(): (spec: StillSpec | null) => void {
  let mounted: { destroy(): void } | null = null
  return (spec) => {
    mounted?.destroy()
    mounted = null
    canvas.hidden = false
    if (!spec) return
    if (spec.touchOnly) {
      canvas.hidden = true
      mounted = mountTouchMessage(host)
      return
    }
    if (!spec.interface) return
    const unit = config.film.units.findIndex((u) => u.id === spec.page)
    const api: InterfaceApi = {
      mode: () => 'live',
      canvas,
      step: () => Math.max(0, unit),
      setStep: () => undefined,
      heading: () => '',
      messages: () => [],
      skipOffered: () => unit > 0,
      skip: () => undefined,
      watchFilm: () => undefined,
      backToSite: () => undefined,
      sound: { available: () => true, muted: () => true, setMuted: () => undefined },
      quality: { levels: [...qualityIds], level: () => qualityIds[0]!, set: () => undefined, auto: () => false },
      diagnostics: [...views],
      diagnostic: () => app.diagnostic,
      setDiagnostic: () => undefined,
      frameSeconds: () => 1 / 60
    }
    const made = mountInterface(host, api)
    made.update()
    mounted = made
  }
}

const ready = start()
const showcase = makeShowcase(app, ready)
if (mode === 'capture') {
  canvas.removeAttribute('tabindex')
  const overlay = overlays()
  const draws = showcase as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>
  for (const name of Object.keys(draws)) {
    if (!name.startsWith('render')) continue
    const render = draws[name]!
    draws[name] = async (...args) => {
      overlay(null)
      const result = await render(...args)
      if (name === 'renderStill') overlay(args[0] as StillSpec)
      return result
    }
  }
}
window.showcase = showcase
ready.catch(stop)
