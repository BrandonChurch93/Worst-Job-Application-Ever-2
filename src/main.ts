import { App, type StillSpec } from './app'
import { makeShowcase, type Showcase } from './capture/showcase'
import { beat as beatOf, config, filmSeconds, stepHz, unitStart } from './config'
import { copy } from './copy'
import type { TargetKind } from './core/accumulator'
import { quality, qualityIds } from './core/quality'
import { samples } from './core/sampler'
import { views } from './diagnostics/views'
import { pages } from './pages'
import { words } from './shell/words'
import { BotDriver, type BotName } from './stage/bots'
import { liveFlow, liveView, MouseDriver, Stage, type Frame } from './stage/stage'
import type { CameraPose, Driver } from './stage/types'
import { lessMotion, makeQualityPicker, mountInterface, mountProbe, mountTouchMessage, ready as controlsReady, touchOnly, type InterfaceApi, type Mounted, type ProbeRunner } from './ui/api'
import { wallSeconds } from './ui/clock'

declare global {
  interface Window { showcase: Showcase; liveRun?: { state(): LiveShot; advance(seconds: number): LiveShot } }
}

interface LiveShot { time: number; page: string; gag: string | null; finished: boolean; png: string }
interface Size { width: number; height: number }
interface Picture { key: string; frame: Frame; size: Size; pose: CameraPose }
type PlayMode = 'live' | 'film' | 'loop'
type Sound = ReturnType<typeof import('./audio/index').makeSound>

const BOTS = ['keen', 'clumsy', 'random', 'skipper']
const MODES = ['live', 'film', 'loop', 'capture', 'probe']
const PLAY: PlayMode[] = ['live', 'film', 'loop']
const ROW = { x0: 128, x1: 700, y1: 56 }
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

const startLevel = (): string => {
  const asked = params.get('quality')
  if (asked) return quality(asked) && asked
  return config.live.defaultQuality === 'auto' ? qualityIds[0]! : config.live.defaultQuality
}
const levelIsFixed = (): boolean => params.get('quality') !== null || config.live.defaultQuality !== 'auto'

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
function sizer(): { level(): string; set(level: string): void; fit(): void; changed(): boolean } {
  let level = startLevel()
  let dirty = true
  const fit = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, quality(level).pixelRatioCap)
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9)
    const h = (w * 9) / 16
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const pw = Math.max(320, Math.min(1920, Math.round(w * ratio)))
    app.engine.setSize(pw, Math.round((pw * 9) / 16))
    app.format = { id: 'live', width: app.engine.width, height: app.engine.height }
    dirty = true
  }
  const shadows = () => app.rig.setQuality(quality(level).shadowMapPx, quality(level).shadowMapPx / 2)
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
  const size = sizer()
  const mouse = new MouseDriver()
  const rest = samples(64)
  const stepped = params.get('clock') === 'steps'

  let sound: Sound | null = null
  if (!stepped) {
    void import('./audio/index').then(({ makeSound }) => {
      sound = makeSound({ base: `${import.meta.env.BASE_URL}audio/` })
      const unlock = () => void sound?.unlock()
      window.addEventListener('pointerdown', unlock, { once: true, capture: true })
      window.addEventListener('keydown', unlock, { once: true, capture: true })
    })
  }
  const soundMode = () => (now === 'live' ? 'live' : 'film')

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
  let idleSaid = false

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
  }
  const film = {
    seconds: total,
    time: () => T,
    playing: () => playing,
    play() {
      if (T >= total - 1 / fps) T = 0
      playing = true
      heardTo = T
    },
    pause() {
      playing = false
      quiet()
    },
    seek(seconds: number) {
      T = Math.min(total, Math.max(0, seconds))
      quiet()
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
    for (; sent < stage.events.length; sent++) sound.event(stage.events[sent]!, 'live')
    const reached = stage.gagsReached
    for (; gags < reached.length; gags++) sound.beat(reached[gags]!, 'live')
    const v = stage.page.volume?.()
    if (v !== undefined && v !== volume) {
      volume = v
      sound.setVolume(v)
    }
    if (!idleSaid && wallSeconds() - lastInput >= config.live.idleSeconds) {
      idleSaid = true
      sound.trigger('idle')
    }
  }
  const touched = () => {
    lastInput = wallSeconds()
    idleSaid = false
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

  const backing = (): 'page' | 'light' | 'dark' => {
    const f = shown
    if (!f) return 'page'
    if (f.view) return stage.page.unit === 'pinball' ? 'dark' : 'light'
    let under: 'page' | 'light' | 'dark' = 'page'
    for (const s of f.list) {
      if (s.kind === 'well' || s.x >= ROW.x1 || s.x + s.w <= ROW.x0 || s.y >= f.scroll + ROW.y1 || s.y + s.h <= f.scroll) continue
      if (s.w >= 1900 && s.z1 <= 0) continue
      if (s.tone === 'dark') return 'dark'
      under = 'light'
    }
    return under
  }

  let frameSeconds = 1 / 60
  const api: InterfaceApi = {
    mode: () => now,
    canvas,
    step: stepNow,
    setStep(step) {
      base = Math.min(5, Math.max(0, Math.round(step)))
      stage = makeStage()
      sound?.stop()
      sent = 0
      gags = 0
      entry = -1
      before = ''
    },
    heading: () => headings[stepNow()]!,
    messages() {
      const out: string[] = []
      if (!shown || now !== 'live') return out
      for (const s of shown.list) {
        if (s.kind !== 'text' || !s.words || !s.words.startsWith('copy:') || atRest.has(s.words)) continue
        const text = words(s.words, s.text)
        if (text && !out.includes(text)) out.push(text)
      }
      return out
    },
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

  const toPage = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    mouse.pointer = { ...mouse.pointer, x: ((e.clientX - r.left) / r.width) * 1920, y: ((e.clientY - r.top) / r.height) * 1080 }
    touched()
  }
  window.addEventListener('pointermove', toPage)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  canvas.addEventListener('pointerdown', (e) => {
    toPage(e)
    if (now !== 'live') return
    if (e.button === 2) {
      mouse.pointer = { ...mouse.pointer, flipRight: true }
      mouse.pulse({ flipRight: true })
    } else {
      mouse.pointer = { ...mouse.pointer, down: true, flipLeft: true }
      mouse.pulse({ down: true, flipLeft: true })
    }
  })
  window.addEventListener('pointerup', (e) => {
    if (e.button === 2) mouse.pointer = { ...mouse.pointer, flipRight: false }
    else mouse.pointer = { ...mouse.pointer, down: false, flipLeft: false }
  })
  let tabbed = false
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') tabbed = true
  }, true)
  window.addEventListener('pointerdown', () => {
    tabbed = false
    canvas.dataset.ring = 'false'
  }, true)
  canvas.addEventListener('focus', () => {
    canvas.dataset.ring = String(tabbed)
  })
  canvas.addEventListener('blur', () => {
    canvas.dataset.ring = 'false'
  })
  const onControl = (e: KeyboardEvent): boolean => {
    const t = e.target
    return t instanceof HTMLElement && t !== canvas && t !== document.body && t !== document.documentElement
  }
  window.addEventListener('keydown', (e) => {
    touched()
    if (now !== 'live' || e.ctrlKey || e.metaKey || e.altKey || onControl(e)) return
    if (e.code === 'ShiftLeft') mouse.pointer = { ...mouse.pointer, flipLeft: true }
    else if (e.code === 'ShiftRight') mouse.pointer = { ...mouse.pointer, flipRight: true }
    else if (e.key === 'Tab') {
      if (e.shiftKey || !api.typing!()) return
      mouse.pulse({ key: 'Tab' })
      e.preventDefault()
    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      mouse.pulse({ key: e.key })
      if (e.key === ' ' || e.key === 'Backspace') e.preventDefault()
    }
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft') mouse.pointer = { ...mouse.pointer, flipLeft: false }
    else if (e.code === 'ShiftRight') mouse.pointer = { ...mouse.pointer, flipRight: false }
  })
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    touched()
    if (now === 'live') mouse.pulse({ wheel: e.deltaY })
  }, { passive: false })

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
  }

  if (stepped) {
    const shot = (): LiveShot => {
      before = ''
      draw()
      return { time: stage.time, page: stage.page.id, gag: stage.gagsReached.at(-1) ?? null, finished: stage.finished, png: canvas.toDataURL('image/png') }
    }
    window.liveRun = { state: shot, advance: (seconds) => { stage.advance(Math.round(seconds * stepHz)); return shot() } }
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
        if (T >= total) playing = false
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
function overlays(): (spec: StillSpec) => void {
  let mounted: { destroy(): void } | null = null
  return (spec) => {
    mounted?.destroy()
    mounted = null
    canvas.hidden = false
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
  const overlay = overlays()
  const render = showcase.renderStill
  showcase.renderStill = async (spec) => {
    await render(spec)
    overlay(spec)
  }
}
window.showcase = showcase
ready.catch(stop)
