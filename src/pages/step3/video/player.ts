import { lessMotion, touchOnly } from '../../../ui/device'
import { bridge, type VideoPlayer } from './bridge'
import manifest from './manifest.json'
import { VIDEO } from './plan'

interface Trace { asked: number; shown: number; played: number; faded: number; left: number; waits: number; loaded: number; frames: { now: number; media: number; shown: number; count: number }[]; live: number[] }

const sources = import.meta.glob('./pinball.*', { query: '?url', import: 'default', eager: true }) as Record<string, string>
const files = (manifest.files as { file: string; mime: string }[]).map((f) => ({ url: sources[`./${f.file}`], mime: f.mime })).filter((f) => f.url)

let mounted = false

export function mountVideo(): void {
  if (mounted || typeof document === 'undefined' || typeof window === 'undefined') return
  const asked = new URLSearchParams(window.location.search)
  const mode = asked.get('mode') ?? (lessMotion() && !touchOnly() && !asked.get('bot') ? 'film' : 'live')
  if (mode !== 'live' || (asked.get('clock') && asked.get('video') !== 'trace')) return
  mounted = true
  bridge.player = { ready: () => false, enter: () => undefined, clock: () => 0, over: () => true, gone: () => true, leave: () => undefined }
  const canvas = document.getElementById('stage')
  const host = document.getElementById('controls')
  const video = document.createElement('video')
  const pick = files.find((f) => video.canPlayType(f.mime) === 'probably') ?? files.find((f) => video.canPlayType(f.mime) !== '')
  if (!canvas || !host || !pick || asked.get('video') === 'off') {
    bridge.off = true
    return
  }
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.disablePictureInPicture = true
  video.setAttribute('aria-hidden', 'true')
  video.tabIndex = -1
  video.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;margin:0;object-fit:fill;pointer-events:none;opacity:0;background:transparent'
  document.body.insertBefore(video, host)
  const trace: Trace | null = asked.get('video') === 'trace' ? { asked: -1, shown: -1, played: -1, faded: -1, left: -1, waits: 0, loaded: -1, frames: [], live: [] } : null
  if (trace) (window as unknown as { videoTrace: Trace; videoBridge: typeof bridge }).videoTrace = trace
  if (trace) (window as unknown as { videoBridge: typeof bridge }).videoBridge = bridge
  if (trace) bridge.cues = []
  let primed = false
  let state: 'idle' | 'entering' | 'rising' | 'playing' | 'falling' | 'gone' | 'done' = 'idle'
  let wait = 0
  let since = 0
  const fit = (): void => {
    const r = canvas.getBoundingClientRect()
    video.style.left = `${r.left}px`
    video.style.top = `${r.top}px`
    video.style.width = `${r.width}px`
    video.style.height = `${r.height}px`
  }
  const frame = (now: number, meta: { mediaTime: number; expectedDisplayTime: number; presentedFrames: number }): void => {
    primed = true
    if (trace && state !== 'idle') trace.frames.push({ now, media: meta.mediaTime, shown: meta.expectedDisplayTime, count: meta.presentedFrames })
    video.requestVideoFrameCallback(frame)
  }
  const tick = (now: number): void => {
    if (state === 'idle' || state === 'gone' || state === 'done') return
    fit()
    if (state === 'entering') {
      if (trace) trace.live.push(now)
      if (--wait <= 0 && !bridge.hold?.in) {
        state = 'rising'
        since = now
        if (trace) trace.shown = now
      }
    }
    if (state === 'rising') {
      const k = Math.min(1, (now - since) / (VIDEO.fade * 1000))
      video.style.opacity = String(k)
      if (k >= 1) {
        state = 'playing'
        if (trace) trace.played = now
        void video.play().catch(() => undefined)
      }
    } else if (state === 'falling') {
      const k = Math.min(1, (now - since) / (VIDEO.fade * 1000))
      video.style.opacity = String(1 - k)
      if (k >= 1) {
        state = 'gone'
        if (trace) trace.faded = now
        return
      }
    }
    requestAnimationFrame(tick)
  }
  const player: VideoPlayer = {
    ready() {
      const ok = primed && video.readyState >= 3 && !video.error
      if (trace && !ok) trace.waits++
      return ok
    },
    enter() {
      if (state !== 'idle') return
      state = 'entering'
      wait = 2
      fit()
      if (trace) trace.asked = performance.now()
      requestAnimationFrame(tick)
    },
    clock: () => (state === 'playing' || state === 'falling' || state === 'gone' ? video.currentTime : 0),
    over: () => state === 'done' || state === 'falling' || state === 'gone' || video.ended || video.error !== null,
    gone() {
      if (state === 'playing' || state === 'rising' || state === 'entering') {
        const from = state
        state = 'falling'
        since = performance.now()
        video.pause()
        if (from === 'entering') state = 'gone'
      }
      return state !== 'falling'
    },
    leave() {
      if (state === 'idle') return
      state = 'idle'
      video.style.opacity = '0'
      video.pause()
      video.currentTime = 0
      if (trace) trace.left = performance.now()
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (state !== 'playing' || video.ended) return
    if (document.visibilityState === 'hidden') video.pause()
    else void video.play().catch(() => undefined)
  })
  window.addEventListener('resize', fit)
  video.addEventListener('error', () => {
    if (state === 'playing') state = 'done'
  })
  if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(frame)
  else (video as HTMLVideoElement).addEventListener('loadeddata', () => { primed = true })
  void fetch(pick.url)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then((blob) => {
      video.src = URL.createObjectURL(blob)
      if (trace) trace.loaded = performance.now()
      video.load()
      bridge.player = player
    })
    .catch(() => undefined)
}
