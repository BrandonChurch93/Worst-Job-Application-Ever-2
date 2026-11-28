// What the page says to a screen reader: every message once a step, in the order it came on the page, and no faster than a voice can take.

// The time a message has the live region to itself before the next takes its place: a base and a part for each letter, never more than the cap.
export const SAY = { baseSeconds: 0.6, secondsPerLetter: 0.03, capSeconds: 3 }

export const sayTime = (text: string): number => Math.min(SAY.capSeconds, SAY.baseSeconds + SAY.secondsPerLetter * text.length)

interface Words { kind: string; words?: string; text?: string }

// The messages in a drawn frame, oldest first: the runs of copy that were not on the page when it came.
export function messagesOf(list: Words[], atRest: Set<string>, words: (key: string, runtime?: string) => string): string[] {
  const out: string[] = []
  for (const s of list) {
    if (s.kind !== 'text' || !s.words || !s.words.startsWith('copy:') || atRest.has(s.words)) continue
    const text = words(s.words, s.text)
    if (text && !out.includes(text)) out.push(text)
  }
  return out
}

export interface Said {
  // Called once a drawn frame with the step and the messages on the page now. Gives the words to write into the live region, or null to leave what is there.
  // New words join the line and each is given its time alone. Words that joined before in this step are not said again.
  // At a new step what still waits is said together at once, so no message is lost, and the line starts empty.
  frame(step: number, messages: string[], seconds: number): string | null
  waiting(): number
}

export function makeSaid(): Said {
  const heard = new Set<string>()
  let line: string[] = []
  let free = -Infinity
  let at: number | null = null
  const hear = (messages: string[]) => {
    for (const m of messages) {
      if (!m || heard.has(m)) continue
      heard.add(m)
      line.push(m)
    }
  }
  return {
    frame(step, messages, seconds) {
      if (step !== at) {
        const first = at === null
        at = step
        const rest = line.join(' ')
        heard.clear()
        line = []
        hear(messages)
        free = rest ? seconds + sayTime(rest) : -Infinity
        return first && !rest ? null : rest
      }
      hear(messages)
      const m = line[0]
      if (m === undefined || seconds < free) return null
      line.shift()
      free = seconds + sayTime(m)
      return m
    },
    waiting: () => line.length
  }
}

// What the narrator says is shown while it is said, phrase by phrase: one soft panel at the bottom centre of the page, over every page alike.
// The sound engine owns the clock. The caption reads it at each drawn frame, so the words come on at the frame the voice starts and go at the frame it ends.

// A line of content/narration.json as it is read: the pause mark is never spoken and never shown.
export const sayable = (text: string, pauseMark: string): string => text.split(pauseMark).map((p) => p.trim()).filter((p) => p.length > 0).join(' ')

// loud: the words are one short phrase shown in capitals, large.
export interface CaptionLine { id: string; words: string; start: number; end: number; loud?: boolean; step?: { k: number; n: number }; whole?: string }
export interface CaptionSource { now: number; lines: CaptionLine[] }

// The line that is being spoken at the clock's time, if one is.
export const captionAt = (s: CaptionSource): CaptionLine | null => s.lines.find((l) => l.start <= s.now && s.now < l.end) ?? null

// The panel, in pixels of the 1920 by 1080 page; it is scaled with the page. wide and high are the largest it gets: two rows of words.
// low is the y of its lower edge when the page names none. A page keeps the box wide by high above its lower edge clear.
export const CAPTION = {
  wide: 900,
  high: 96,
  low: 1044,
  // The y of the lower edge on a page that names none and has a thing at the foot of its middle: on the boss page, just above the cracks round the slot;
  // on the decision page, in the clear band between the head of the page and the letter, since the button and the link fill the foot.
  lowOn: { step4: 828, step5: 264 } as Record<string, number>,
  // A line that builds one part a mark on one row (the shout of the boss): px of the first step, the growth a step, the most px of the last, the y of the panel's upper edge
  // and the lowest its lower edge may come (the top band of the screen), the widest it gets, its line height, and the px and turns a second by which the last step shakes.
  // The whole line at its last step is fitted into that band, and every step before it is one growth smaller, so the type never shrinks.
  shout: { firstPx: 150, grow: 1.25, lastPx: 240, top: 96, low: 330, wide: 1760, lineHigh: 1, shakePx: 5, shakeHz: 17 },
  fontPx: 26,
  // The size of a loud phrase, shown in capitals.
  loudFontPx: 64,
  minFontPx: 13,
  // The least the panel keeps clear of the two edges of the window together, in px of the window.
  windowEdge: 16,
  lineHigh: 1.3,
  padX: 34,
  padY: 14,
  round: 18,
  // The panel moves to a new place over about this long, and only jumps when no words are on it.
  easeSeconds: 0.25,
  face: 'inter-500',
  ink: '#262522',
  panel: 'rgba(231, 228, 221, 0.97)',
  edge: 'rgba(38, 37, 34, 0.16)',
  shade: 'rgba(38, 37, 34, 0.18)',
  logMax: 60
}

// The y of the ordinary panel's lower edge on a page that names none: what the live site gives the panel there, and what the film's overlay must give it too.
export const captionLow = (page?: string): number => CAPTION.lowOn[page ?? ''] ?? CAPTION.low

// The size of step k of n of a line that builds on marks, in page pixels. `most` is the size at which the whole line fits its band.
export const shoutPx = (k: number, n: number, most: number = CAPTION.shout.lastPx): number => {
  const last = Math.min(CAPTION.shout.lastPx, most)
  return Math.min(k >= n - 1 ? last : CAPTION.shout.firstPx * CAPTION.shout.grow ** k, last / CAPTION.shout.grow ** Math.max(0, n - 1 - k))
}

// The most px of type, in page pixels, at which the whole of such a line stands in one row inside its band: the row is `wideEm` wide and `highEm` high in ems of its type,
// the page is drawn at `u` of its size in a window `windowWide` px wide. The panel keeps the shake of the last step clear on each side.
export const shoutMost = (wideEm: number, highEm: number, u: number, windowWide: number): number => {
  const wide = Math.min(windowWide - CAPTION.windowEdge, CAPTION.shout.wide * u) - 2 * (CAPTION.padX + CAPTION.shout.shakePx) * u
  const high = (CAPTION.shout.low - CAPTION.shout.top - CAPTION.shout.shakePx - 2 * CAPTION.padY) * u
  return Math.min(wide / Math.max(0.01, wideEm), high / Math.max(0.01, highEm)) / u
}

// How far the last word of such a line is off its place at a time of the sound's clock, in page pixels.
export const shoutShake = (now: number): { x: number; y: number } => ({ x: CAPTION.shout.shakePx * Math.sin(now * CAPTION.shout.shakeHz * 2 * Math.PI), y: CAPTION.shout.shakePx * Math.sin(now * CAPTION.shout.shakeHz * 2.74 * Math.PI + 1) })

// The y of the panel's lower edge a step of the clock later: it nears where it is wanted and never jumps while words are shown.
export const easeCaption = (y: number, want: number, seconds: number, shown: boolean): number => (shown ? want + (y - want) * Math.exp(-Math.max(0, seconds) / CAPTION.easeSeconds) : want)

// What the caption did with a line, on the sound's clock: when its words came on and went, beside when its voice starts and ends.
export interface CaptionShown { id: string; start: number; end: number; shown: number; hidden: number | null }

export interface Caption {
  // A line was booked or taken back: look at the clock again from the next drawn frame on.
  wake(): void
  // Where the page on screen wants the panel: the y of its lower edge in page pixels, or nothing for the usual place.
  place(y: number | undefined): void
  log(): CaptionShown[]
}

export function makeCaption(read: () => CaptionSource): Caption | null {
  if (typeof document === 'undefined' || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function' || !document.body) return null
  const el = document.createElement('div')
  el.dataset.narratorCaption = ''
  const st = el.style
  st.position = 'fixed'
  st.left = '50%'
  st.transform = 'translateX(-50%)'
  st.zIndex = '40'
  st.display = 'none'
  st.boxSizing = 'border-box'
  st.pointerEvents = 'none'
  st.textAlign = 'center'
  st.lineHeight = String(CAPTION.lineHigh)
  st.fontFamily = "Inter, 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif"
  st.fontWeight = '500'
  st.color = CAPTION.ink
  st.backgroundColor = CAPTION.panel
  document.body.append(el)
  const shown: CaptionShown[] = []
  let on: CaptionShown | null = null
  let words = ''
  let loud = false
  let step: { k: number; n: number } | null = null
  let whole = ''
  let fit: { whole: string; u: number; most: number } | null = null
  let now = 0
  let frame = 0
  let want = CAPTION.low
  let y = CAPTION.low
  let last = 0
  let drawWords: ((to: HTMLElement, text: string, row: boolean) => void) | null = null
  let row = false
  const write = () => {
    if (row !== (step !== null)) delete el.dataset.drawn
    row = step !== null
    try {
      if (drawWords) drawWords(el, words, row)
      else el.textContent = words
    } catch {
      drawWords = null
      el.textContent = words
    }
  }
  void import('./glyphs').then((g) => {
    drawWords = (to, text, row) => g.draw(to, text, CAPTION.face, { wrap: !row })
    fit = null
    if (on) write()
  }).catch(() => undefined)
  const put = () => {
    const canvas = document.querySelector('canvas')
    const box = canvas ? canvas.getBoundingClientRect() : null
    const fits = box !== null && box.width > 0
    const u = (fits ? box.width : window.innerWidth) / 1920
    const top = fits ? box.top : 0
    st.padding = `${CAPTION.padY * u}px ${CAPTION.padX * u}px`
    st.borderRadius = `${CAPTION.round * u}px`
    if (step) {
      const off = step.k >= step.n - 1 ? shoutShake(now) : { x: 0, y: 0 }
      st.lineHeight = String(CAPTION.shout.lineHigh)
      st.whiteSpace = 'nowrap'
      st.maxWidth = 'none'
      st.width = 'max-content'
      st.bottom = 'auto'
      st.top = `${top + CAPTION.shout.top * u}px`
      st.transform = `translate(calc(-50% + ${(off.x * u).toFixed(2)}px), ${(off.y * u).toFixed(2)}px)`
      if (!fit || fit.whole !== whole || fit.u !== u) {
        const trial = 100 * u
        const said = words
        st.fontSize = `${trial}px`
        words = whole
        write()
        const box = el.getBoundingClientRect()
        words = said
        write()
        fit = { whole, u, most: shoutMost((box.width - 2 * CAPTION.padX * u) / trial, (box.height - 2 * CAPTION.padY * u) / trial, u, window.innerWidth) }
      }
      st.fontSize = `${shoutPx(step.k, step.n, fit.most) * u}px`
    } else {
      st.fontSize = `${Math.max(CAPTION.minFontPx, (loud ? CAPTION.loudFontPx : CAPTION.fontPx) * u)}px`
      st.lineHeight = String(CAPTION.lineHigh)
      st.whiteSpace = 'normal'
      st.width = 'auto'
      st.maxWidth = `${Math.min(window.innerWidth - CAPTION.windowEdge, CAPTION.wide * u)}px`
      st.top = 'auto'
      st.transform = 'translateX(-50%)'
      st.bottom = `${Math.max(0, window.innerHeight - (top + y * u))}px`
    }
    st.boxShadow = `0 0 0 1px ${CAPTION.edge}, 0 ${4 * u}px ${14 * u}px ${CAPTION.shade}`
    el.dataset.y = y.toFixed(1)
  }
  const keep = () => {
    el.dataset.log = JSON.stringify(shown)
  }
  const tick = () => {
    frame = 0
    const s = read()
    const line = captionAt(s)
    if (on && (!line || line.id !== on.id || line.start !== on.start)) {
      on.hidden = s.now
      on = null
      keep()
    }
    y = easeCaption(y, want, s.now - last, on !== null)
    last = s.now
    now = s.now
    if (line && !on) {
      on = { id: line.id, start: line.start, end: line.end, shown: s.now, hidden: null }
      shown.push(on)
      if (shown.length > CAPTION.logMax) shown.splice(0, shown.length - CAPTION.logMax)
      words = line.loud ? line.words.toUpperCase() : line.words
      loud = line.loud === true
      step = line.step ?? null
      whole = line.whole ?? words
      if (step && line.loud) whole = whole.toUpperCase()
      el.dataset.line = line.id
      write()
      keep()
    }
    st.display = on ? 'block' : 'none'
    if (on) put()
    if (s.lines.length) frame = window.requestAnimationFrame(tick)
  }
  return {
    wake() {
      if (!frame) frame = window.requestAnimationFrame(tick)
    },
    place(at) {
      want = at === undefined || !Number.isFinite(at) ? CAPTION.low : at
    },
    log: () => shown.map((x) => ({ ...x }))
  }
}
