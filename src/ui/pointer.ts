// The visitor's hand: every listener that turns the mouse and the keyboard into the pointer the stage reads.
// It takes its window, document and picture as arguments, so the tests drive the same listeners without a browser.
import type { Pointer } from '../stage/types'

type Listener = (e: any) => void

export interface Target {
  addEventListener(type: string, fn: Listener, options?: boolean | { capture?: boolean; passive?: boolean }): void
  removeEventListener(type: string, fn: Listener, options?: boolean | { capture?: boolean; passive?: boolean }): void
}

export interface Picture extends Target {
  getBoundingClientRect(): { left: number; top: number; width: number; height: number }
  dataset: Record<string, string | undefined>
}

export interface Hand {
  pointer: Pointer
  pulse(p: Partial<Pointer>): void
}

export interface VisitorHost {
  window: Target
  document: Target & { body?: unknown; documentElement?: unknown; hidden?: boolean }
  canvas: Picture
  mouse: Hand
  // True while the live site plays: in the film nothing a visitor presses reaches the page.
  live(): boolean
  // True while the page takes typed letters.
  typing(): boolean
  // Called at every sign of life, for the idle line.
  touched(): void
}

export interface Visitor {
  // What is held now: for the tests and for nothing else.
  held(): { left: boolean; right: boolean; shiftLeft: boolean; shiftRight: boolean }
  // Lets go of everything, as when the window loses the focus.
  release(): void
  destroy(): void
}

// The bits of `buttons` on a pointer event. The left button presses and is the left flipper, the right button is the right flipper. No other button does anything.
export const LEFT = 1
export const RIGHT = 2
const PAGE = { width: 1920, height: 1080 }

export function listenToVisitor(o: VisitorHost): Visitor {
  const { canvas, mouse } = o
  const off: (() => void)[] = []
  const on = (target: Target, type: string, fn: Listener, options?: boolean | { capture?: boolean; passive?: boolean }) => {
    target.addEventListener(type, fn, options)
    off.push(() => target.removeEventListener(type, fn, options))
  }
  let held = 0
  let seen = 0
  let shiftLeft = false
  let shiftRight = false

  const show = () => {
    mouse.pointer = { ...mouse.pointer, down: (held & LEFT) !== 0, flipLeft: (held & LEFT) !== 0 || shiftLeft, flipRight: (held & RIGHT) !== 0 || shiftRight }
  }
  // A press shorter than one step of the stage is still seen: the pulse lasts one step.
  const hold = (next: number) => {
    const fresh = next & ~held
    held = next & (LEFT | RIGHT)
    show()
    if (fresh & LEFT) mouse.pulse({ down: true, flipLeft: true })
    if (fresh & RIGHT) mouse.pulse({ flipRight: true })
  }
  // What is let go here stays let go until it is pressed again: a button still down when the visitor comes back is not a press.
  const release = () => {
    held = 0
    shiftLeft = false
    shiftRight = false
    show()
  }
  const toPage = (e: { clientX: number; clientY: number }) => {
    const r = canvas.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) mouse.pointer = { ...mouse.pointer, x: ((e.clientX - r.left) / r.width) * PAGE.width, y: ((e.clientY - r.top) / r.height) * PAGE.height }
    o.touched()
  }
  const bit = (button: number) => (button === 0 ? LEFT : button === 2 ? RIGHT : 0)
  // Every pointer event says which buttons are down now. What it does not name is let go, whatever event was missed.
  const settle = (e: { buttons?: number }) => {
    if (typeof e.buttons !== 'number') return
    if (held & ~e.buttons) hold(held & e.buttons)
  }

  // Seen before any control can stop it, so the buttons known here are the buttons that are down.
  on(o.window, 'pointerdown', (e) => {
    if (typeof e.buttons === 'number') seen = e.buttons
  }, true)
  on(o.window, 'pointermove', (e) => {
    toPage(e)
    settle(e)
    if (typeof e.buttons !== 'number') return
    // A second button pressed while one is held comes as a move, not as a press.
    const fresh = e.buttons & ~seen & (LEFT | RIGHT)
    seen = e.buttons
    if (fresh && e.target === canvas && o.live()) hold(held | fresh)
  })
  on(o.window, 'pointerover', settle, true)
  on(canvas, 'contextmenu', (e) => e.preventDefault())
  on(canvas, 'pointerdown', (e) => {
    toPage(e)
    if (!o.live()) return
    hold((held | bit(e.button)) & (typeof e.buttons === 'number' ? e.buttons | bit(e.button) : ~0))
  })
  // In the capture phase: a button let go over a control is still let go.
  const up = (e: { button?: number; buttons?: number }) => {
    const left = typeof e.buttons === 'number' ? e.buttons : 0
    seen = left
    hold(held & left & ~bit(e.button ?? -1))
  }
  on(o.window, 'pointerup', up, true)
  on(o.window, 'pointercancel', () => up({ buttons: 0 }), true)
  on(o.window, 'blur', release)
  // The mouse left the window: a button let go out there sends nothing, so nothing is held from here on.
  on(o.window, 'mouseout', (e) => {
    if (e.relatedTarget === null || e.relatedTarget === undefined) hold(0)
  }, true)
  on(o.document, 'visibilitychange', () => {
    if (o.document.hidden) release()
  })

  let tabbed = false
  on(o.window, 'keydown', (e) => {
    if (e.key === 'Tab') tabbed = true
  }, true)
  on(o.window, 'pointerdown', () => {
    tabbed = false
    canvas.dataset.ring = 'false'
  }, true)
  on(canvas, 'focus', () => {
    canvas.dataset.ring = String(tabbed)
  })
  on(canvas, 'blur', () => {
    canvas.dataset.ring = 'false'
  })
  const onControl = (e: { target?: unknown }): boolean => {
    const t = e.target as { tagName?: unknown } | null | undefined
    return !!t && typeof t.tagName === 'string' && t !== canvas && t !== o.document.body && t !== o.document.documentElement
  }
  on(o.window, 'keydown', (e) => {
    o.touched()
    if (!o.live() || e.ctrlKey || e.metaKey || e.altKey || onControl(e)) return
    if (e.code === 'ShiftLeft') {
      shiftLeft = true
      show()
      if (!e.repeat) mouse.pulse({ flipLeft: true })
    } else if (e.code === 'ShiftRight') {
      shiftRight = true
      show()
      if (!e.repeat) mouse.pulse({ flipRight: true })
    } else if (e.key === 'Tab') {
      if (e.shiftKey || !o.typing()) return
      mouse.pulse({ key: 'Tab' })
      e.preventDefault()
    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      mouse.pulse({ key: e.key })
      if (e.key === ' ' || e.key === 'Backspace') e.preventDefault()
    }
  })
  // In the capture phase: a Shift let go while a control has the focus is still let go.
  on(o.window, 'keyup', (e) => {
    if (e.code === 'ShiftLeft') shiftLeft = false
    else if (e.code === 'ShiftRight') shiftRight = false
    else return
    show()
  }, true)
  on(canvas, 'wheel', (e) => {
    e.preventDefault()
    o.touched()
    if (o.live()) mouse.pulse({ wheel: e.deltaY })
  }, { passive: false })

  return {
    held: () => ({ left: (held & LEFT) !== 0, right: (held & RIGHT) !== 0, shiftLeft, shiftRight }),
    release,
    destroy() {
      for (const fn of off) fn()
      release()
    }
  }
}
