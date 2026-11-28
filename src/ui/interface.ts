import { config } from '../config'
import { quality as qualityOf } from '../core/quality'
import type { InterfaceApi, Mounted } from './api'
import { wallSeconds } from './clock'
import { clockText } from './device'
import { draw } from './glyphs'
import { icon, setIcon } from './icons'
import css from './interface.module.css'
import { mountMenu } from './menu'
import { names } from './names'
import { makeQualityPicker, type QualityPicker } from './picker'
import { makeSaid } from './said'
import { word } from './words'

const PAGE_W = 1920
const TYPE = 'inter-500'
const HIDE_AFTER_MS = 2600
const SEEK_KEY_SECONDS = 5
// The height of the empty strip at the top of every page, in page units: the row of live controls has to end above it.
const STRIP = 56
// The room in px the row needs above the picture to stand there.
const ROW_ROOM = 6
// How often the sound controls look for the sound by themselves, so they come and change without waiting for a drawn frame.
const SOUND_LOOK_MS = 250
// How long the sound bar takes to leave, the same as its move in the style sheet.
const NOTICE_LEAVE_MS = 260

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string | undefined, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  parent?.append(e)
  return e
}

// While a control has the focus, every key is its own and the browser's: none goes on to the page.
function keep(control: HTMLElement): void {
  control.addEventListener('keydown', (e) => e.stopPropagation())
  control.addEventListener('keyup', (e) => e.stopPropagation())
}

// A click made with the pointer hands the keyboard back to the page.
function press(control: HTMLElement, act: () => void): void {
  control.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    act()
    if (e.detail > 0) control.blur()
  })
  // A link takes Enter by itself. Space it does not, so it is given here: every control answers both.
  if (control.tagName === 'A') control.addEventListener('keydown', (e) => {
    if (e.key !== ' ') return
    e.preventDefault()
    act()
  })
  keep(control)
}

function soundButton(api: InterfaceApi, parent: HTMLElement): { button: HTMLButtonElement; update(): void } {
  const button = el('button', css.icon, parent)
  button.type = 'button'
  button.setAttribute('aria-label', names.sound)
  const svg = icon('soundOff')
  button.append(svg)
  let shown: boolean | null = null
  let on: boolean | null = null
  const update = () => {
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
  // The control shows its new state at the press itself, not at the next drawn frame: a frame may be seconds away on a loaded machine.
  press(button, () => {
    api.sound.setMuted(!api.sound.muted())
    update()
  })
  return { button, update }
}

export function mountInterface(host: HTMLElement, api: InterfaceApi): Mounted {
  const root = el('div', css.root, host)
  const off: (() => void)[] = []
  const listen = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, capture = false) => {
    window.addEventListener(type, fn, capture)
    off.push(() => window.removeEventListener(type, fn, capture))
  }
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu'] as const) {
    root.addEventListener(type, (e) => e.stopPropagation())
  }

  const place = () => {
    const r = api.canvas.getBoundingClientRect()
    root.style.left = `${r.left}px`
    root.style.top = `${r.top}px`
    root.style.width = `${r.width}px`
    root.style.height = `${r.height}px`
    root.style.setProperty('--u', `${r.width / PAGE_W}px`)
    fit(r)
  }
  const live = el('div', css.live, root)
  // On a small picture the row keeps its least size and no longer fits the strip. It then stands above the picture where the window has room there, and on a capsule over the page where it has none.
  const fit = (r: { top: number; width: number }) => {
    root.dataset.row = 'strip'
    const h = live.offsetHeight
    if (!h) return
    if (live.offsetTop + h / 2 <= (STRIP * r.width) / PAGE_W) return
    root.dataset.row = r.top >= h + ROW_ROOM ? 'above' : 'over'
  }
  place()
  // The picture may get its new size in a listener that runs after this one: look again once all of them have run.
  listen('resize', () => {
    place()
    window.setTimeout(place, 0)
  })
  const watch = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
  watch?.observe(api.canvas)

  // The sound bar of the careers page (change note 004, item 6): one line and one button across the foot, while the browser still blocks sound.
  const notice = el('div', css.notice, root)
  root.insertBefore(notice, live)
  notice.hidden = true
  const noticeWords = el('p', css.noticeWords, notice)
  draw(noticeWords, word('soundBar'), 'inter-400')
  const accept = el('button', css.accept, notice)
  accept.type = 'button'
  draw(accept, word('soundAccept'), 'inter-600')
  // never: not shown yet. shown: on the page. leaving: on its short way out. gone: for the rest of the visit.
  let noticeState: 'never' | 'shown' | 'leaving' | 'gone' = 'never'
  const showNotice = () => {
    const wanted = api.mode() === 'live' && api.step() === 0 && api.sound.blocked?.() === true
    if (noticeState === 'never' && wanted) {
      noticeState = 'shown'
      notice.hidden = false
      root.style.setProperty('--row', `${live.offsetLeft + live.offsetWidth}px`)
    } else if (noticeState === 'shown' && !wanted) {
      noticeState = 'leaving'
      notice.dataset.leaving = 'true'
      if (notice.contains(document.activeElement)) accept.blur()
      window.setTimeout(() => {
        noticeState = 'gone'
        notice.hidden = true
      }, NOTICE_LEAVE_MS)
    } else if (noticeState === 'never' && api.mode() === 'live' && api.step() !== 0) noticeState = 'gone'
  }
  press(accept, () => {
    api.sound.allow?.()
    showNotice()
  })

  const liveSound = soundButton(api, live)
  const film = el('a', css.link, live)
  film.href = '?mode=film'
  draw(film, word('watchFilm'), TYPE)
  press(film, () => {
    api.watchFilm()
    showMode()
    showFilm()
  })
  const skip = el('button', css.link, live)
  skip.type = 'button'
  draw(skip, word('skip'), TYPE)
  skip.hidden = true
  press(skip, () => api.skip())

  live.addEventListener('wheel', (e) => {
    e.preventDefault()
    api.canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, bubbles: true, cancelable: true }))
  }, { passive: false })

  const surface = el('div', css.surface, root)
  const offer = el('div', css.offer, surface)
  offer.setAttribute('aria-hidden', 'true')
  offer.append(icon('play'))
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
    showPlaying(f.playing())
  }
  press(play, toggle)
  press(back, () => {
    api.backToSite()
    showMode()
  })
  surface.addEventListener('click', toggle)
  let dragging = false
  position.addEventListener('pointerdown', () => { dragging = true })
  position.addEventListener('input', () => api.film?.seek(Number(position.value)))
  position.addEventListener('change', () => {
    dragging = false
    if (document.activeElement === position && !position.matches(':focus-visible')) position.blur()
  })
  keep(position)

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

  const look = window.setInterval(() => {
    if (noticeState === 'shown') root.style.setProperty('--row', `${live.offsetLeft + live.offsetWidth}px`)
    showNotice()
    liveSound.update()
    barSound.update()
  }, SOUND_LOOK_MS)

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

  let picked = picker ? picker.level() : ''
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
    if (e.target instanceof Node && bar.contains(e.target)) return
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
  let backing = ''
  let stepShown = -1
  let heading = ''
  let playing: boolean | null = null
  let started: boolean | null = null
  let shownTime = ''
  let shownValue = -1
  const line = makeSaid()
  // Called at the press as well as once a frame, so the control answers a press before the next frame is drawn.
  function showPlaying(now: boolean): void {
    if (now === playing) return
    playing = now
    play.setAttribute('aria-pressed', String(now))
    setIcon(playIcon, now ? 'pause' : 'play')
    root.dataset.playing = String(now)
    wake()
  }

  // Both are called at the press as well as once a frame: on a machine that draws slowly the bar must not wait for the next picture.
  function showMode(): void {
    const m = api.mode()
    if (m === mode) return
    mode = m
    root.dataset.mode = m
    if (m !== 'live' && menu.open()) menu.toggle()
    api.canvas.classList.toggle(css.fitted!, m === 'film')
    place()
    if (m === 'film') wake()
  }
  function showFilm(): void {
    const f = api.film
    if (!!f !== hasFilm) {
      hasFilm = !!f
      root.dataset.film = String(hasFilm)
      if (f) position.max = String(f.seconds)
    }
    if (!f || mode !== 'film') return
    const now = f.playing()
    showPlaying(now)
    const t = f.time()
    const begun = now || t > 0
    if (begun !== started) {
      started = begun
      root.dataset.started = String(begun)
    }
    const label = `${clockText(t)} / ${clockText(f.seconds)}`
    if (label !== shownTime) {
      shownTime = label
      draw(time, label, TYPE, { tabular: true })
    }
    const value = Math.round(t * 10) / 10
    if (!dragging && value !== shownValue) {
      shownValue = value
      position.value = String(value)
    }
  }

  return {
    update() {
      showMode()
      const m = mode
      showFilm()
      if (m === 'live') {
        // The careers page has no empty strip at its top: its own bar with the company's name is there. The row then stands in the lower left corner of the picture.
        const stepNow = api.step()
        if (stepNow !== stepShown) {
          stepShown = stepNow
          root.dataset.step = String(stepNow)
          place()
        }
        liveSound.update()
        showNotice()
        const below = api.backing ? api.backing() : 'page'
        const under = below === 'page' && root.dataset.row === 'over' ? 'light' : below
        if (under !== backing) {
          backing = under
          root.dataset.backing = under
        }
        const due = api.skipOffered()
        if (due !== skipDue) {
          skipDue = due
          if (!due && document.activeElement === skip) skip.blur()
          skip.hidden = !due
        }
        if (picker && !picker.pinned()) {
          const level = picker.frame(api.frameSeconds())
          if (level !== picked) {
            picked = level
            const ids = api.quality.levels
            if (ids.indexOf(level) > ids.indexOf(api.quality.level())) api.quality.set(level)
          }
        }
        menu.update()
      } else if (m === 'film') barSound.update()
      const h = api.heading()
      if (h !== heading) {
        heading = h
        saidHeading.textContent = h
      }
      const words = line.frame(api.step(), api.messages(), wallSeconds())
      if (words !== null) saidMessage.textContent = words
    },
    destroy() {
      window.clearTimeout(timer)
      window.clearInterval(look)
      watch?.disconnect()
      api.canvas.classList.remove(css.fitted!)
      for (const fn of off) fn()
      root.remove()
    }
  }
}
