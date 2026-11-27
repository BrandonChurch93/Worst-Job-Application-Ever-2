import { bridge, type VideoPlayer } from './bridge'
import manifest from './manifest.json'

interface Trace { asked: number; shown: number; left: number; frames: { now: number; media: number; shown: number; count: number }[]; live: number[] }

const sources = import.meta.glob('./pinball.*', { query: '?url', import: 'default', eager: true }) as Record<string, string>
const files = (manifest.files as { file: string; mime: string }[]).map((f) => ({ url: sources[`./${f.file}`], mime: f.mime })).filter((f) => f.url)

let mounted = false

export function mountVideo(): void {
  if (mounted || typeof document === 'undefined' || typeof window === 'undefined') return
  const asked = new URLSearchParams(window.location.search)
  if ((asked.get('mode') ?? 'live') !== 'live' || asked.get('clock') || asked.get('video') === 'off') return
  const canvas = document.getElementById('stage')
  const host = document.getElementById('controls')
  if (!canvas || !host) return
  const video = document.createElement('video')
  const pick = files.find((f) => video.canPlayType(f.mime) === 'probably') ?? files.find((f) => video.canPlayType(f.mime) !== '')
  if (!pick) return
  mounted = true
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.disablePictureInPicture = true
  video.setAttribute('aria-hidden', 'true')
  video.tabIndex = -1
  video.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;margin:0;object-fit:fill;pointer-events:none;opacity:0;background:transparent'
  document.body.insertBefore(video, host)
  const trace: Trace | null = asked.get('video') === 'trace' ? { asked: -1, shown: -1, left: -1, frames: [], live: [] } : null
  if (trace) (window as unknown as { videoTrace: Trace; videoBridge: typeof bridge }).videoTrace = trace
  if (trace) (window as unknown as { videoBridge: typeof bridge }).videoBridge = bridge
  let primed = false
  let state: 'idle' | 'entering' | 'playing' | 'done' = 'idle'
  let wait = 0
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
    if (state === 'entering') {
      fit()
      if (trace) trace.live.push(now)
      if (--wait <= 0 && !bridge.hold?.in) {
        state = 'playing'
        video.style.opacity = '1'
        if (trace) trace.shown = now
        void video.play().catch(() => undefined)
      }
    } else if (state === 'playing') fit()
    if (state === 'entering' || state === 'playing') requestAnimationFrame(tick)
  }
  const player: VideoPlayer = {
    ready: () => primed && video.readyState >= 3 && !video.error,
    enter() {
      if (state !== 'idle') return
      state = 'entering'
      wait = 2
      fit()
      if (trace) trace.asked = performance.now()
      requestAnimationFrame(tick)
    },
    clock: () => (state === 'playing' ? video.currentTime : 0),
    over: () => state === 'done' || video.ended || video.error !== null,
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
      video.load()
      bridge.player = player
    })
    .catch(() => undefined)
  bridge.player = { ...player, ready: () => false }
}
