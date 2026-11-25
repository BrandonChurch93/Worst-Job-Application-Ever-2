import { App } from './app'
import { makeShowcase, type Showcase } from './capture/showcase'
import { stepHz } from './config'
import { copy } from './copy'
import { samples } from './core/sampler'
import { pages } from './pages'
import { BotDriver, type BotName } from './stage/bots'
import { filmFlow, liveFlow, liveView, MouseDriver, ScriptDriver, Stage, wholeFilmFlow } from './stage/stage'
import type { Driver } from './stage/types'
import { wallSeconds } from './ui/clock'
import type { TargetKind } from './core/accumulator'

declare global {
  interface Window { showcase: Showcase; liveRun?: { state(): LiveShot; advance(seconds: number): LiveShot } }
}

interface LiveShot { time: number; page: string; gag: string | null; finished: boolean; png: string }

const BOTS = ['keen', 'clumsy', 'random', 'skipper']
const MODES = ['live', 'film', 'loop', 'capture', 'probe']
const params = new URLSearchParams(location.search)
const mode = params.get('mode') ?? 'live'
const canvas = document.getElementById('stage') as HTMLCanvasElement
const app = new App()
document.title = copy.site.title

function stop(error: unknown): void {
  const box = document.getElementById('fail')!
  box.textContent = error instanceof Error ? error.message : String(error)
  box.hidden = false
  canvas.hidden = true
}

async function start(): Promise<void> {
  if (!MODES.includes(mode)) throw new Error(`No mode called "${mode}"`)
  const capture = mode === 'capture'
  await app.start(canvas, {
    format: params.get('format') ?? 'hd',
    assets: params.get('assets') ?? (capture ? 'full' : 'web'),
    capture,
    forceKind: (params.get('target') as TargetKind | null) ?? undefined
  })
  if (params.get('diag')) app.setDiagnostic(params.get('diag')!)
  if (capture) {
    canvas.style.width = `${app.format.width}px`
    canvas.style.height = `${app.format.height}px`
    return
  }
  play()
}

function makeStage(mouse: MouseDriver): Stage {
  if (mode === 'film') {
    const unit = params.get('unit')
    if (unit) return new Stage({ mode: 'film', flow: filmFlow(unit), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
    return new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
  }
  const flow = liveFlow()
  const step = Number(params.get('step') ?? 0)
  const from = step >= 1 && step <= 5 ? flow.slice(step) : flow
  const bot = params.get('bot')
  if (bot && !BOTS.includes(bot)) throw new Error(`No bot called "${bot}"`)
  const driver: Driver = bot ? new BotDriver(bot as BotName, Number(params.get('seed') ?? 1)) : mouse
  return new Stage({ mode: 'live', flow: from, pages, driver })
}

function play(): void {
  const mouse = new MouseDriver()
  const stage = makeStage(mouse)
  const restSamples = samples(64)

  const fit = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9)
    const h = (w * 9) / 16
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const pw = Math.min(1920, Math.round(w * ratio))
    app.engine.setSize(pw, Math.round((pw * 9) / 16))
    app.format = { id: 'live', width: app.engine.width, height: app.engine.height }
  }
  fit()
  window.addEventListener('resize', fit)
  const toPage = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    mouse.pointer = { ...mouse.pointer, x: ((e.clientX - r.left) / r.width) * 1920, y: ((e.clientY - r.top) / r.height) * 1080 }
  }
  canvas.addEventListener('pointermove', toPage)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  canvas.addEventListener('pointerdown', (e) => {
    toPage(e)
    if (e.button === 2) mouse.pointer = { ...mouse.pointer, flipRight: true }
    else mouse.pointer = { ...mouse.pointer, down: true, flipLeft: true }
  })
  window.addEventListener('pointerup', (e) => {
    if (e.button === 2) mouse.pointer = { ...mouse.pointer, flipRight: false }
    else mouse.pointer = { ...mouse.pointer, down: false, flipLeft: false }
  })
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft') mouse.pointer = { ...mouse.pointer, flipLeft: true }
    else if (e.code === 'ShiftRight') mouse.pointer = { ...mouse.pointer, flipRight: true }
    else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') mouse.pulse({ key: e.key })
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft') mouse.pointer = { ...mouse.pointer, flipLeft: false }
    else if (e.code === 'ShiftRight') mouse.pointer = { ...mouse.pointer, flipRight: false }
  })
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    mouse.pulse({ wheel: e.deltaY })
  }, { passive: false })

  let last = wallSeconds()
  let owed = 0
  let still = 0
  let frame = 0
  let before = ''
  const draw = () => {
    const f = stage.frameAt(stage.time)
    const state = stage.hash()
    still = state !== before ? 0 : Math.min(still + 1, restSamples.length)
    before = state
    if (still < restSamples.length) {
      frame++
      const pose = mode === 'film' ? app.poseFor('film', stage.page, f, stage.pageTime) : liveView(f)
      app.put(f, stage.page, pose)
      app.setCamera(pose)
      app.engine.frame(app.shot(), restSamples[still]!, still === 0, frame, app.diagnostic)
    }
  }
  if (params.get('clock') === 'steps') {
    const shot = (): LiveShot => {
      before = ''
      draw()
      return { time: stage.time, page: stage.page.id, gag: stage.gagsReached.at(-1) ?? null, finished: stage.finished, png: canvas.toDataURL('image/png') }
    }
    window.liveRun = { state: shot, advance: (seconds) => { stage.advance(Math.round(seconds * stepHz)); return shot() } }
    return
  }
  const tick = () => {
    const now = wallSeconds()
    owed += Math.min(0.1, now - last)
    last = now
    const steps = Math.floor(owed * stepHz)
    owed -= steps / stepHz
    stage.advance(steps)
    draw()
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const ready = start()
window.showcase = makeShowcase(app, ready)
ready.catch(stop)
