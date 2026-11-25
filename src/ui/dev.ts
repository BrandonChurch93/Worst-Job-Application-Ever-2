// The interface on its own, over a grey box or a still of a page, with a made-up site behind it. Not part of the built site.
// npx vite, then /src/ui/dev.html?view=live|skip|film|touch|menu|probe&bg=/out/work/stills/<file>.png
import { config } from '../config'
import { copy } from '../copy'
import { qualityIds } from '../core/quality'
import { lessMotion, mountInterface, mountProbe, mountTouchMessage, touchOnly, type InterfaceApi } from './api'
import { wallSeconds } from './clock'

const params = new URLSearchParams(location.search)
const view = params.get('view') ?? 'live'
const stage = document.getElementById('stage') as HTMLElement
document.title = copy.site.title

const fit = () => {
  const w = Math.min(window.innerWidth, (window.innerHeight * 16) / 9)
  stage.style.width = `${w}px`
  stage.style.height = `${(w * 9) / 16}px`
}
fit()
window.addEventListener('resize', fit)
const bg = params.get('bg')
if (bg) stage.style.backgroundImage = `url(${bg})`

const seconds = config.film.units.reduce((s, u) => s + u.seconds, 0)
const state = {
  mode: (view === 'film' ? 'film' : 'live') as 'live' | 'film' | 'loop',
  step: Number(params.get('step') ?? 1),
  muted: params.get('muted') !== '0',
  level: qualityIds[0] as string,
  diagnostic: 'beauty',
  playing: params.get('playing') === '1',
  time: Number(params.get('time') ?? 0),
  skip: view === 'skip',
  last: wallSeconds(),
  frame: 1 / 60
}
const log: string[] = []
Object.assign(window, { dev: { log, state } })
stage.addEventListener('pointerdown', () => log.push('page:pointerdown'))
stage.addEventListener('click', () => log.push('page:click'))
window.addEventListener('keydown', (e) => log.push(`page:key:${e.key}`))
const headings = [copy.marketing.hero.headline, copy.step1.heading, copy.step2.heading, copy.step3.heading, copy.step4.heading, copy.step5.heading]

const api: InterfaceApi = {
  mode: () => state.mode,
  canvas: stage,
  step: () => state.step,
  setStep: (n) => { state.step = n; log.push(`setStep:${n}`) },
  heading: () => headings[state.step] ?? '',
  messages: () => (params.get('message') ? [copy.step1.heading] : []),
  skipOffered: () => state.skip,
  skip: () => { state.skip = false; log.push('skip') },
  watchFilm: () => { state.mode = 'film'; log.push('watchFilm') },
  backToSite: () => { state.mode = 'live'; log.push('backToSite') },
  sound: { available: () => params.get('sound') !== '0', muted: () => state.muted, setMuted: (m) => { state.muted = m; log.push(`setMuted:${m}`) } },
  quality: { levels: [...qualityIds], level: () => state.level, set: (l) => { state.level = l; log.push(`quality:${l}`) }, auto: () => params.get('auto') === '1' },
  diagnostics: ['beauty', 'standins'],
  diagnostic: () => state.diagnostic,
  setDiagnostic: (v) => { state.diagnostic = v; log.push(`diag:${v}`) },
  film: {
    seconds,
    time: () => state.time,
    playing: () => state.playing,
    play: () => { state.playing = true; log.push('play') },
    pause: () => { state.playing = false; log.push('pause') },
    seek: (t) => { state.time = t; log.push(`seek:${t}`) }
  },
  frameSeconds: () => state.frame,
  typing: params.get('typing') ? () => true : undefined,
  backing: () => (params.get('backing') === 'dark' ? 'dark' : 'page')
}

if (view === 'touch' || (view === 'auto' && touchOnly())) {
  mountTouchMessage(document.body)
} else if (view === 'probe') {
  const fake = Number(params.get('fps') ?? 72)
  mountProbe(document.body, {
    async play(scene, level, _seconds, frame) {
      const at = fake * (level === 'high' ? 0.6 : level === 'medium' ? 0.9 : 1.4) * (scene.id === 'reply-all' ? 0.8 : 1)
      for (let i = 0; i < 400; i++) frame((i % 97 === 0 ? 2.4 : 1) / at)
      await new Promise((done) => setTimeout(done, Number(params.get('wait') ?? 60)))
    }
  })
} else {
  if (view === 'auto' && lessMotion()) state.mode = 'film'
  const ui = mountInterface(document.body, api)
  const tick = () => {
    const now = wallSeconds()
    state.frame = now - state.last
    state.last = now
    if (state.playing) state.time = Math.min(seconds, state.time + state.frame)
    ui.update()
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  if (view === 'menu') window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm' }))
}
