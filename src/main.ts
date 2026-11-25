import { App } from './app'
import { makeShowcase, type Showcase } from './capture/showcase'
import { config } from './config'
import { copy } from './copy'
import { samples } from './core/sampler'
import { MouseDriver } from './stage/stage'
import { wallSeconds } from './ui/clock'
import type { TargetKind } from './core/accumulator'

declare global {
  interface Window { showcase: Showcase }
}

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

// The site running in real time. The wall clock paces it; the simulation still moves in fixed steps.
function play(): void {
  const unit = params.get('unit') ?? config.lookLockUnit
  const l = app.page(unit)
  const mouse = new MouseDriver()
  const scripted = mode !== 'live'
  l.stage.driver = scripted ? l.script : mouse
  l.stage.reset()
  const camera = app.cameraFor('home')
  const restSamples = samples(64)
  const stepHz = config.sim.stepHz

  const fit = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9)
    const h = (w * 9) / 16
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const pw = Math.min(1920, Math.round(w * ratio))
    app.engine.setSize(pw, Math.round((pw * 9) / 16))
    app.format = { id: 'live', width: app.engine.width, height: app.engine.height }
    app.cameraFor('home')
  }
  fit()
  window.addEventListener('resize', fit)
  const toPage = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    mouse.pointer = { x: ((e.clientX - r.left) / r.width) * 1920, y: ((e.clientY - r.top) / r.height) * 1080, down: mouse.pointer.down }
  }
  canvas.addEventListener('pointermove', toPage)
  canvas.addEventListener('pointerdown', (e) => {
    toPage(e)
    mouse.pointer = { ...mouse.pointer, down: true }
  })
  window.addEventListener('pointerup', () => {
    mouse.pointer = { ...mouse.pointer, down: false }
  })

  let last = wallSeconds()
  let owed = 0
  let still = 0
  let frame = 0
  let before: number[] = []
  const tick = () => {
    const now = wallSeconds()
    owed += Math.min(0.1, now - last)
    last = now
    const steps = Math.floor(owed * stepHz)
    owed -= steps / stepHz
    l.stage.advance(steps)
    l.page.pose(Math.min(1, owed * stepHz))
    const state = l.page.save()
    let moved = state.length !== before.length
    for (let i = 0; i < state.length && !moved; i++) moved = Math.abs(state[i]! - before[i]!) > 1e-3
    before = state
    still = moved ? 0 : Math.min(still + 1, restSamples.length)
    if (still < restSamples.length) {
      frame++
      app.engine.frame(app.shot(l, camera), restSamples[still]!, still === 0, frame, app.diagnostic)
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const ready = start()
window.showcase = makeShowcase(app, ready)
ready.catch(stop)
