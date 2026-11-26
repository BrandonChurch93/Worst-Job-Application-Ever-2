import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, MouseDriver, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'
import { listenToVisitor, type Visitor } from '../src/ui/pointer'

type Fn = (e: Fired) => void
interface Fired { type: string; target: Thing; stopPropagation(): void; preventDefault(): void; [k: string]: unknown }

// As much of a browser as the listeners use: a tree of targets, the capture phase down it and the bubble phase up it.
class Thing {
  dataset: Record<string, string | undefined> = {}
  hidden = false
  body?: Thing
  documentElement?: Thing
  private fns: { type: string; fn: Fn; capture: boolean }[] = []
  constructor(readonly parent: Thing | null, readonly tagName?: string) {}
  addEventListener(type: string, fn: Fn, options?: boolean | { capture?: boolean }): void {
    this.fns.push({ type, fn, capture: options === true || (typeof options === 'object' && options.capture === true) })
  }
  removeEventListener(type: string, fn: Fn): void {
    this.fns = this.fns.filter((l) => l.type !== type || l.fn !== fn)
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1920, height: 1080 }
  }
  count(): number {
    return this.fns.length
  }
  run(e: Fired, capture: boolean | 'both'): void {
    for (const l of [...this.fns]) if (l.type === e.type && (capture === 'both' || l.capture === capture)) l.fn(e)
  }
}

function fire(target: Thing, type: string, init: Record<string, unknown> = {}): Fired {
  let stopped = false
  const e: Fired = { clientX: 960, clientY: 540, key: '', code: '', ...init, type, target, prevented: false, stopPropagation: () => { stopped = true }, preventDefault: () => { e.prevented = true } }
  const path: Thing[] = []
  for (let t: Thing | null = target; t; t = t.parent) path.push(t)
  for (let i = path.length - 1; i > 0 && !stopped; i--) path[i]!.run(e, true)
  if (!stopped) target.run(e, 'both')
  for (let i = 1; i < path.length && !stopped; i++) path[i]!.run(e, false)
  return e
}

interface Page { window: Thing; document: Thing; body: Thing; html: Thing; canvas: Thing; control: Thing; mouse: MouseDriver; visitor: Visitor; live: { on: boolean }; touched: { n: number }; table: { on: boolean } }

function page(): Page {
  const window = new Thing(null)
  const document = new Thing(window)
  const html = new Thing(document, 'HTML')
  const body = new Thing(html, 'BODY')
  document.documentElement = html
  document.body = body
  const canvas = new Thing(body, 'CANVAS')
  // The interface: its root stops every press and release from reaching the window, its controls stop their keys (src/ui/interface.ts).
  const root = new Thing(body, 'DIV')
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click']) root.addEventListener(type, (e) => e.stopPropagation())
  const control = new Thing(root, 'BUTTON')
  for (const type of ['keydown', 'keyup']) control.addEventListener(type, (e) => e.stopPropagation())
  const mouse = new MouseDriver()
  const live = { on: true }
  const touched = { n: 0 }
  const table = { on: true }
  const visitor = listenToVisitor({ window, document, canvas, mouse, live: () => live.on, touched: () => { touched.n++ }, flippers: () => table.on })
  return { window, document, body, html, canvas, control, mouse, visitor, live, touched, table }
}

const none = { left: false, right: false, shiftLeft: false, shiftRight: false }
const shown = (p: Page) => ({ down: p.mouse.pointer.down, flipLeft: p.mouse.pointer.flipLeft === true, flipRight: p.mouse.pointer.flipRight === true })
const nothing = { down: false, flipLeft: false, flipRight: false }

describe('site pointer listeners: nothing sticks', () => {
  it('the window loses the focus while both buttons and both Shift keys are held: all four are let go', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.canvas, 'pointermove', { buttons: 3 })
    fire(p.canvas, 'keydown', { key: 'Shift', code: 'ShiftLeft' })
    fire(p.canvas, 'keydown', { key: 'Shift', code: 'ShiftRight' })
    expect(p.visitor.held()).toEqual({ left: true, right: true, shiftLeft: true, shiftRight: true })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: true })
    fire(p.window, 'blur')
    expect(p.visitor.held()).toEqual(none)
    p.mouse.input()
    expect(shown(p)).toEqual(nothing)
    fire(p.canvas, 'pointermove', { buttons: 3 })
    expect(p.visitor.held(), 'a button still down when the focus comes back is not a new press').toEqual(none)
  })

  it('the tab is hidden while the left button is held: it is let go', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    p.document.hidden = true
    fire(p.document, 'visibilitychange')
    expect(p.visitor.held()).toEqual(none)
    expect(shown(p)).toEqual(nothing)
  })

  it('the mouse leaves the window with the left button held: it is let go, and coming back with it still down presses nothing', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    expect(p.visitor.held().left).toBe(true)
    fire(p.document.documentElement!, 'mouseout', { relatedTarget: null, buttons: 1 })
    expect(p.visitor.held()).toEqual(none)
    p.mouse.input()
    fire(p.canvas, 'pointermove', { buttons: 1 })
    expect(p.visitor.held()).toEqual(none)
    expect(p.mouse.input().down).toBe(false)
    fire(p.canvas, 'pointerup', { button: 0, buttons: 0 })
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    expect(p.visitor.held().left, 'the next real press is a press').toBe(true)
  })

  it('a mouse that only moves from the picture onto a control has not left the window', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.canvas, 'mouseout', { relatedTarget: p.control, buttons: 1 })
    expect(p.visitor.held().left).toBe(true)
  })

  it('a button let go where no event reaches the page: the next move says no button is down, and it is let go', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 2, buttons: 2 })
    expect(p.visitor.held().right).toBe(true)
    fire(p.control, 'pointermove', { buttons: 0 })
    expect(p.visitor.held()).toEqual(none)
  })

  it('a button let go over a control, whose release never reaches the window in the bubble phase, is still let go', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.control, 'pointerup', { button: 0, buttons: 0 })
    expect(p.visitor.held()).toEqual(none)
    fire(p.canvas, 'pointerdown', { button: 2, buttons: 2 })
    fire(p.control, 'pointercancel', {})
    expect(p.visitor.held()).toEqual(none)
  })

  it('the second button: pressed while the first is held it is the other flipper, and each is let go on its own', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: false })
    fire(p.canvas, 'pointermove', { buttons: 3 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: true })
    fire(p.canvas, 'pointermove', { buttons: 2 })
    expect(shown(p)).toEqual({ down: false, flipLeft: false, flipRight: true })
    fire(p.canvas, 'pointermove', { buttons: 3 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: true })
    fire(p.canvas, 'pointerup', { button: 2, buttons: 1 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: false })
    fire(p.canvas, 'pointerup', { button: 0, buttons: 0 })
    expect(shown(p)).toEqual(nothing)
    expect(p.visitor.held()).toEqual(none)
  })

  it('both buttons as a browser sends them: left down, right down, left up, right up, with both flippers up in the middle and both down at the end', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.canvas, 'pointermove', { button: 2, buttons: 3 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: true })
    fire(p.canvas, 'pointermove', { button: 0, buttons: 2 })
    expect(shown(p)).toEqual({ down: false, flipLeft: false, flipRight: true })
    fire(p.canvas, 'pointerup', { button: 2, buttons: 0 })
    expect(shown(p)).toEqual(nothing)
    expect(p.visitor.held()).toEqual(none)
    fire(p.canvas, 'pointerdown', { button: 2, buttons: 2 })
    fire(p.canvas, 'pointermove', { button: 0, buttons: 3 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: true })
    fire(p.canvas, 'pointermove', { button: 2, buttons: 1 })
    expect(shown(p)).toEqual({ down: true, flipLeft: true, flipRight: false })
    fire(p.canvas, 'pointerup', { button: 0, buttons: 0 })
    expect(shown(p)).toEqual(nothing)
    expect(p.visitor.held()).toEqual(none)
  })

  it('the right button never presses, and the middle, back and forward buttons do nothing at all', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 2, buttons: 2 })
    expect(shown(p)).toEqual({ down: false, flipLeft: false, flipRight: true })
    expect(p.mouse.input().down).toBe(false)
    fire(p.canvas, 'pointerup', { button: 2, buttons: 0 })
    for (const [button, buttons] of [[1, 4], [3, 8], [4, 16]] as const) {
      fire(p.canvas, 'pointerdown', { button, buttons })
      expect(p.visitor.held(), `button ${button}`).toEqual(none)
      expect(p.mouse.input()).toMatchObject({ down: false })
      fire(p.canvas, 'pointermove', { buttons: buttons | 1 })
      expect(p.visitor.held().left, 'the left button pressed while it is held still presses').toBe(true)
      fire(p.canvas, 'pointerup', { button: 0, buttons })
      fire(p.canvas, 'pointerup', { button, buttons: 0 })
      expect(p.visitor.held()).toEqual(none)
      p.mouse.input()
    }
  })

  it('a second button pressed on a control is the control\'s, not the page\'s', () => {
    const p = page()
    fire(p.control, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.control, 'pointermove', { buttons: 3 })
    expect(p.visitor.held()).toEqual(none)
    fire(p.control, 'pointerup', { button: 0, buttons: 0 })
  })

  it('a Shift key let go while a control has the focus is still let go', () => {
    const p = page()
    fire(p.canvas, 'keydown', { key: 'Shift', code: 'ShiftRight' })
    expect(shown(p).flipRight).toBe(true)
    fire(p.control, 'keyup', { key: 'Shift', code: 'ShiftRight' })
    expect(p.visitor.held()).toEqual(none)
    expect(shown(p)).toEqual(nothing)
  })

  it('a key pressed on a control is the control\'s: it types nothing and moves no flipper', () => {
    const p = page()
    fire(p.control, 'keydown', { key: 'Shift', code: 'ShiftLeft' })
    fire(p.control, 'keydown', { key: ' ', code: 'Space' })
    expect(p.visitor.held()).toEqual(none)
    expect(p.mouse.input().key).toBeUndefined()
  })

  it('Tab is the browser\'s own on every page: it is never held back and never typed, so the controls are reached from the page and from the picture', () => {
    const p = page()
    for (const from of [p.body, p.canvas, p.control]) {
      for (const shiftKey of [false, true]) {
        const e = fire(from, 'keydown', { key: 'Tab', code: 'Tab', shiftKey })
        expect(e.prevented).toBe(false)
        expect(p.mouse.input().key ?? null).toBe(null)
      }
    }
    expect(fire(p.canvas, 'keydown', { key: ' ', code: 'Space' }).prevented).toBe(true)
    expect(p.mouse.input().key).toBe(' ')
  })

  it('while the film plays nothing a visitor presses is held', () => {
    const p = page()
    p.live.on = false
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.canvas, 'pointermove', { buttons: 3 })
    fire(p.canvas, 'keydown', { key: 'Shift', code: 'ShiftLeft' })
    expect(p.visitor.held()).toEqual(none)
    expect(p.mouse.input()).toMatchObject({ down: false })
  })

  it('a press and its release between two steps of the stage is still one press, for one step', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.canvas, 'pointerup', { button: 0, buttons: 0 })
    expect(p.mouse.input()).toMatchObject({ down: true, flipLeft: true })
    expect(p.mouse.input()).toMatchObject({ down: false, flipLeft: false })
  })

  it('every listener is taken off again', () => {
    const p = page()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    p.visitor.destroy()
    expect(p.window.count() + p.document.count() + p.canvas.count()).toBe(0)
    expect(shown(p)).toEqual(nothing)
  })
})

// A keen bot plays until the test takes the mouse out of its hand.
class Hands implements Driver {
  readonly name = 'bot' as const
  own = false
  wants: [boolean, boolean] = [false, false]
  private bot = new BotDriver('keen', config.seed)
  constructor(private mouse: MouseDriver) {}
  input(v: DriverView): Pointer {
    const p = this.own ? this.mouse.input() : this.bot.input(v)
    this.wants = [p.flipLeft === true, p.flipRight === true]
    return p
  }
}

// Reading the table costs a whole save of the page: it is read at every step the hand changes its mind and at every twelfth step between.
const SAMPLE = 12
interface Table { flip: [number, number]; held: [boolean, boolean] }
const table = (s: Stage): Table => (s.page.save() as { m: Table }).m

describe('site pointer listeners: the flippers of step 3', () => {
  const sealed = (): { p: Page; s: Stage; d: Hands } => {
    const p = page()
    const d = new Hands(p.mouse)
    const s = new Stage({ mode: 'live', flow: liveFlow().slice(3), pages, driver: d })
    while (s.page.control !== 'flippers' && s.time < 60) s.advance(1)
    s.advance(stepHz * 3)
    expect(s.page.id).toBe('step3')
    expect(s.page.control).toBe('flippers')
    d.own = true
    s.advance(stepHz / 2)
    expect(table(s).flip).toEqual([0, 0])
    return { p, s, d }
  }

  it('the left button and the left Shift key raise the left flipper, the right button and the right Shift key the right one, each inside one step', () => {
    const { p, s } = sealed()
    const ways: { side: 0 | 1; press: () => void; let: () => void }[] = [
      { side: 0, press: () => fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 }), let: () => fire(p.canvas, 'pointerup', { button: 0, buttons: 0 }) },
      { side: 1, press: () => fire(p.canvas, 'pointerdown', { button: 2, buttons: 2 }), let: () => fire(p.canvas, 'pointerup', { button: 2, buttons: 0 }) },
      { side: 0, press: () => fire(p.canvas, 'keydown', { key: 'Shift', code: 'ShiftLeft' }), let: () => fire(p.canvas, 'keyup', { key: 'Shift', code: 'ShiftLeft' }) },
      { side: 1, press: () => fire(p.canvas, 'keydown', { key: 'Shift', code: 'ShiftRight' }), let: () => fire(p.canvas, 'keyup', { key: 'Shift', code: 'ShiftRight' }) }
    ]
    for (const [i, w] of ways.entries()) {
      const other = w.side === 0 ? 1 : 0
      w.press()
      s.advance(1)
      const up = table(s)
      expect(up.held[w.side], `way ${i}`).toBe(true)
      expect(up.flip[w.side], `way ${i}`).toBeGreaterThan(0)
      expect(up.flip[other], `way ${i}`).toBe(0)
      s.advance(stepHz / 4)
      expect(table(s).flip[w.side], `way ${i}`).toBe(1)
      w.let()
      s.advance(1)
      const down = table(s)
      expect(down.held[w.side], `way ${i}`).toBe(false)
      expect(down.flip[w.side], `way ${i}`).toBeLessThan(1)
      s.advance(stepHz / 4)
      expect(table(s).flip).toEqual([0, 0])
    }
  })

  it('a tap shorter than one step still moves the flipper', () => {
    const { p, s } = sealed()
    fire(p.canvas, 'pointerdown', { button: 2, buttons: 2 })
    fire(p.canvas, 'pointerup', { button: 2, buttons: 0 })
    s.advance(1)
    expect(table(s).flip[1]).toBeGreaterThan(0)
    s.advance(1)
    expect(table(s).held[1]).toBe(false)
  })

  it('a flipper held when the window loses the focus comes down', () => {
    const { p, s } = sealed()
    fire(p.canvas, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.canvas, 'pointermove', { buttons: 3 })
    s.advance(stepHz / 4)
    expect(table(s).flip).toEqual([1, 1])
    fire(p.window, 'blur')
    s.advance(stepHz / 4)
    expect(table(s).flip).toEqual([0, 0])
  })

  it('a button pressed in the dark band beside the picture moves its flipper and is never a press', () => {
    const { p, s } = sealed()
    for (const band of [p.body, p.html]) {
      fire(band, 'pointerdown', { button: 0, buttons: 1 })
      expect(shown(p)).toEqual({ down: false, flipLeft: true, flipRight: false })
      s.advance(stepHz / 4)
      expect(table(s).flip).toEqual([1, 0])
      fire(band, 'pointermove', { button: 2, buttons: 3 })
      expect(shown(p)).toEqual({ down: false, flipLeft: true, flipRight: true })
      s.advance(stepHz / 4)
      expect(table(s).flip).toEqual([1, 1])
      fire(band, 'pointermove', { button: 0, buttons: 2 })
      s.advance(stepHz / 4)
      expect(table(s).flip).toEqual([0, 1])
      fire(band, 'pointerup', { button: 2, buttons: 0 })
      expect(shown(p)).toEqual(nothing)
      expect(p.visitor.held()).toEqual(none)
      s.advance(stepHz / 4)
      expect(table(s).flip).toEqual([0, 0])
      fire(band, 'pointerdown', { button: 2, buttons: 2 })
      fire(band, 'pointerup', { button: 2, buttons: 0 })
      s.advance(1)
      expect(table(s).flip[1], 'a tap in the band').toBeGreaterThan(0)
      s.advance(stepHz / 4)
      expect(table(s).flip).toEqual([0, 0])
    }
    fire(p.body, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.window, 'blur')
    s.advance(stepHz / 4)
    expect(table(s).flip).toEqual([0, 0])
    fire(p.body, 'pointerdown', { button: 1, buttons: 4 })
    expect(shown(p)).toEqual(nothing)
  })

  it('a button pressed on a control of the page stays the control\'s own and moves no flipper', () => {
    const { p, s } = sealed()
    fire(p.control, 'pointerdown', { button: 0, buttons: 1 })
    fire(p.control, 'pointermove', { button: 2, buttons: 3 })
    expect(shown(p)).toEqual(nothing)
    s.advance(stepHz / 4)
    expect(table(s).flip).toEqual([0, 0])
    expect(table(s).held).toEqual([false, false])
    fire(p.control, 'pointerup', { button: 0, buttons: 2 })
    fire(p.control, 'pointerup', { button: 2, buttons: 0 })
    s.advance(stepHz / 4)
    expect(table(s).flip).toEqual([0, 0])
    expect(p.visitor.held()).toEqual(none)
  })

  it('on every other page a button pressed in the band is nothing: the page and the hero go on exactly as without it', () => {
    const flow = liveFlow()
    const others = flow.map((f, i) => ({ id: f.page, i })).filter((f) => f.id !== 'step3')
    expect(others.length).toBe(flow.length - 1)
    for (const { id, i } of others) {
      const run = (press: boolean) => {
        const p = page()
        const s = new Stage({ mode: 'live', flow: flow.slice(i), pages, driver: p.mouse })
        s.advance(stepHz * 2)
        expect(s.page.control).toBe('pointer')
        p.table.on = false
        if (press) {
          const e = fire(p.body, 'pointerdown', { button: 0, buttons: 1 })
          fire(p.body, 'pointermove', { button: 2, buttons: 3 })
          expect(shown(p)).toEqual(nothing)
          expect(p.visitor.held()).toEqual(none)
          expect(e.type).toBe('pointerdown')
        }
        s.advance(stepHz * 3)
        if (press) {
          fire(p.body, 'pointerup', { button: 0, buttons: 2 })
          fire(p.body, 'pointerup', { button: 2, buttons: 0 })
        }
        s.advance(stepHz)
        expect(s.page.id).toBe(id)
        return JSON.stringify([s.page.save(), s.cursor.pose(), s.events.length, s.frameAt(s.time).list.length])
      }
      expect(run(true), id).toBe(run(false))
    }
  })

  it('through a whole table, from the seal to the page turn, the flippers are what the hand asks in the same step: never taken, 0 steps ignored', () => {
    const d = new Hands(new MouseDriver())
    const s = new Stage({ mode: 'live', flow: liveFlow().slice(3), pages, driver: d })
    let steps = 0
    let late = 0
    let flips = 0
    let was: [boolean, boolean] = [false, false]
    while (s.page.id === 'step3' && !s.finished && s.time < config.live.botMaxSeconds) {
      s.advance(1)
      if (s.page.id !== 'step3' || s.page.control !== 'flippers' || s.turning) continue
      steps++
      const changed = d.wants[0] !== was[0] || d.wants[1] !== was[1]
      was = d.wants
      if (changed) flips++
      if (!changed && steps % SAMPLE !== 0) continue
      const t = table(s)
      if (t.held[0] !== d.wants[0] || t.held[1] !== d.wants[1]) late++
    }
    expect(steps).toBeGreaterThan(20 * stepHz)
    expect(flips).toBeGreaterThan(10)
    expect(late).toBe(0)
    expect(s.longestIgnored.flippers).toBe(0)
    expect(s.longestIgnored.flippers).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })
})
