import { config } from '../config'
import { quality as qualityOf } from '../core/quality'
import type { InterfaceApi, Mounted } from './api'
import { clockText } from './device'
import { icon, setIcon } from './icons'
import css from './interface.module.css'
import { mountMenu } from './menu'
import { names } from './names'
import { makeQualityPicker, type QualityPicker } from './picker'
import { word } from './words'

const PAGE_W = 1920
const HIDE_AFTER_MS = 2600
const SEEK_KEY_SECONDS = 5

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string | undefined, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  parent?.append(e)
  return e
}

// A control keeps the keys it uses itself. Every other key goes on to the page.
function keep(control: HTMLElement, keys: string[]): void {
  control.addEventListener('keydown', (e) => {
    if (keys.includes(e.key)) e.stopPropagation()
  })
  control.addEventListener('keyup', (e) => {
    if (keys.includes(e.key)) e.stopPropagation()
  })
}

// A click made with the pointer hands the keyboard back to the page.
function press(control: HTMLElement, act: () => void): void {
  control.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    act()
    if (e.detail > 0) control.blur()
  })
  keep(control, ['Enter', ' '])
}

function soundButton(api: InterfaceApi, parent: HTMLElement): { button: HTMLButtonElement; update(): void } {
  const button = el('button', css.icon, parent)
  button.type = 'button'
  button.setAttribute('aria-label', names.sound)
  const svg = icon('soundOff')
  button.append(svg)
  press(button, () => api.sound.setMuted(!api.sound.muted()))
  let shown: boolean | null = null
  let on: boolean | null = null
  return {
    button,
    update() {
      const available = api.sound.available()
      if (available !== shown) {
        shown = available
        button.hidden = !available
      }
      const sounding = !api.sound.muted()
      if (sounding !== on) {
        on = sounding
        button.setAttribute('aria-pressed', String(sounding))
        setIcon(svg, sounding ? 'soundOn' : 'soundOff')
      }
    }
  }
}

export function mountInterface(host: HTMLElement, api: InterfaceApi): Mounted {
  const root = el('div', css.root, host)
  const off: (() => void)[] = []
  const listen = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, capture = false) => {
    window.addEventListener(type, fn, capture)
    off.push(() => window.removeEventListener(type, fn, capture))
  }
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel'] as const) {
    root.addEventListener(type, (e) => e.stopPropagation())
  }

  const place = () => {
    const r = api.canvas.getBoundingClientRect()
    root.style.left = `${r.left}px`
    root.style.top = `${r.top}px`
    root.style.width = `${r.width}px`
    root.style.height = `${r.height}px`
    root.style.setProperty('--u', `${r.width / PAGE_W}px`)
  }
  place()
  listen('resize', place)
  const watch = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
  watch?.observe(api.canvas)

  const live = el('div', css.live, root)
  const liveSound = soundButton(api, live)
  const film = el('a', css.link, live)
  film.href = '?mode=film'
  film.textContent = word('watchFilm')
  press(film, () => api.watchFilm())
  const skip = el('button', css.link, live)
  skip.type = 'button'
  skip.textContent = word('skip')
  skip.hidden = true
  press(skip, () => api.skip())

  const surface = el('div', css.surface, root)
  const bar = el('div', css.bar, root)
  const play = el('button', css.icon, bar)
  play.type = 'button'
  play.setAttribute('aria-label', names.play)
  const playIcon = icon('play')
  play.append(playIcon)
  const position = el('input', css.position, bar)
  position.type = 'range'
  position.min = '0'
  position.step = '0.1'
  position.setAttribute('aria-label', names.position)
  const time = el('span', css.time, bar)
  const barSound = soundButton(api, bar)
  const back = el('button', css.icon, bar)
  back.type = 'button'
  back.setAttribute('aria-label', names.back)
  back.append(icon('back'))

  const toggle = () => {
    const f = api.film
    if (!f) return
    if (f.playing()) f.pause()
    else f.play()
  }
  press(play, toggle)
  press(back, () => api.backToSite())
  surface.addEventListener('click', toggle)
  let dragging = false
  position.addEventListener('pointerdown', () => { dragging = true })
  position.addEventListener('input', () => api.film?.seek(Number(position.value)))
  position.addEventListener('change', () => {
    dragging = false
    if (document.activeElement === position && !position.matches(':focus-visible')) position.blur()
  })
  keep(position, ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])

  let timer = 0
  const wake = () => {
    root.dataset.awake = 'true'
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (api.film?.playing() && !bar.contains(document.activeElement)) root.dataset.awake = 'false'
    }, HIDE_AFTER_MS)
  }
  root.addEventListener('pointermove', wake)
  bar.addEventListener('focusin', wake)

  const said = el('div', css.said, root)
  said.setAttribute('role', 'status')
  said.setAttribute('aria-live', 'polite')
  const saidHeading = el('p', undefined, said)
  const saidMessage = el('p', undefined, said)

  const auto = api.quality.auto ? api.quality.auto() : config.live.defaultQuality === 'auto'
  const levels = api.quality.levels.map((id) => ({ id, minFps: qualityOf(id).minFps }))
  const picker: QualityPicker | null = levels.length
    ? makeQualityPicker(levels, auto ? { start: levels.some((l) => l.id === api.quality.level()) ? api.quality.level() : undefined } : { fixed: api.quality.level() })
    : null

  const menu = mountMenu(root, api, (level) => picker?.pin(level))

  listen('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) return
    if (e.code === 'KeyM' && api.mode() === 'live' && !e.repeat) {
      if (api.typing?.() && !e.altKey && !menu.open()) return
      menu.toggle()
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (e.key === 'Escape' && menu.open()) {
      menu.toggle()
      e.stopPropagation()
      return
    }
    const f = api.film
    if (api.mode() !== 'film' || !f) return
    if (e.key === ' ' || e.key === 'k') {
      toggle()
      wake()
      e.preventDefault()
      e.stopPropagation()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      f.seek(Math.min(f.seconds, Math.max(0, f.time() + (e.key === 'ArrowLeft' ? -SEEK_KEY_SECONDS : SEEK_KEY_SECONDS))))
      wake()
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)

  let mode = ''
  let hasFilm: boolean | null = null
  let skipDue: boolean | null = null
  let heading = ''
  let step = -1
  let playing: boolean | null = null
  let shownTime = ''
  let shownValue = -1
  const heard = new Set<string>()

  return {
    update() {
      const m = api.mode()
      const f = api.film
      if (m !== mode) {
        mode = m
        root.dataset.mode = m
        if (m !== 'live' && menu.open()) menu.toggle()
        if (m === 'film') wake()
      }
      if (!!f !== hasFilm) {
        hasFilm = !!f
        root.dataset.film = String(hasFilm)
        if (f) position.max = String(f.seconds)
      }
      if (m === 'live') {
        liveSound.update()
        const due = api.skipOffered()
        if (due !== skipDue) {
          skipDue = due
          if (!due && document.activeElement === skip) skip.blur()
          skip.hidden = !due
        }
        if (picker && !picker.pinned()) {
          const level = picker.frame(api.frameSeconds())
          if (level !== api.quality.level()) api.quality.set(level)
        }
        menu.update()
      } else if (m === 'film') {
        barSound.update()
        if (f) {
          const now = f.playing()
          if (now !== playing) {
            playing = now
            play.setAttribute('aria-pressed', String(now))
            setIcon(playIcon, now ? 'pause' : 'play')
            root.dataset.playing = String(now)
            wake()
          }
          const t = f.time()
          const label = `${clockText(t)} / ${clockText(f.seconds)}`
          if (label !== shownTime) {
            shownTime = label
            time.textContent = label
          }
          const value = Math.round(t * 10) / 10
          if (!dragging && value !== shownValue) {
            shownValue = value
            position.value = String(value)
          }
        }
      }
      const s = api.step()
      if (s !== step) {
        step = s
        heard.clear()
        saidMessage.textContent = ''
      }
      const h = api.heading()
      if (h !== heading) {
        heading = h
        saidHeading.textContent = h
      }
      for (const message of api.messages()) {
        if (heard.has(message)) continue
        heard.add(message)
        saidMessage.textContent = message
      }
    },
    destroy() {
      window.clearTimeout(timer)
      watch?.disconnect()
      for (const fn of off) fn()
      root.remove()
    }
  }
}
