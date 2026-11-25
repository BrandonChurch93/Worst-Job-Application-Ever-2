import { describe, expect, it } from 'vitest'
import { config, filmSeconds, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { clock, makePage, secondsOf, spun } from '../src/pages/step5'
import { layoutProblems, typeRegister, walk } from '../src/shell/layout'
import { hasWords, words } from '../src/shell/words'
import { filmFlow, filmOptions, runBot, ScriptDriver, Stage, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'

const hz = stepHz
const tolerance = config.film.beatToleranceSeconds
const beats = config.film.beats.filter((b) => b.unit === 'decision')
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('decision'), pages, driver: new ScriptDriver(), film: filmOptions('decision') })
const live = (driver: Driver, seed = config.seed): Stage => new Stage({ mode: 'live', flow: [{ page: 'step5' }, { page: 'marketing', variant: 'rejected' }], pages, driver, seed })
const still = (x: number, y: number): Driver => ({ name: 'bot', input: (): Pointer => ({ x, y, down: false }) })
const state = (s: Stage): string => JSON.stringify({ page: s.page.save(), cursor: s.cursor.save(), id: s.page.id, step: s.step })
const draw = (s: Stage): Shape[] => {
  const list: Shape[] = []
  s.page.draw(list)
  return list
}
const runUntilTurned = (s: Stage, maxSeconds: number): number => {
  let n = 0
  while (s.page.id === 'step5' && n < maxSeconds * hz) {
    s.advance(1)
    n++
  }
  return n / hz
}

describe('step 5, the layout', () => {
  it('is a whole page of its own, with no stub left', () => {
    const page = makePage()
    expect(page.id).toBe('step5')
    expect(page.unit).toBe('decision')
    expect(page.gags.map((g) => g.id)).toEqual(beats.map((b) => b.id))
    expect(page.gags.map((g) => g.event)).toEqual(beats.map((b) => b.event))
  })

  it('has no layout problems', () => {
    const page = makePage()
    expect(layoutProblems(page.layout, { width: page.width, height: page.height })).toEqual([])
  })

  it('names every state a node waits for, and the page reaches every one of them', () => {
    const page = makePage()
    const wanted = new Set<string>()
    walk(page.layout, (n) => {
      for (const st of n.states ?? []) wanted.add(st)
    })
    const seen = new Set<string>()
    const s = film()
    for (let i = 0; i < 9.7 * hz; i += 6) {
      s.advance(6)
      if (s.page.id === 'step5') for (const st of s.page.states()) seen.add(st)
    }
    const shared = live({ name: 'bot', input: (v: DriverView): Pointer => {
      const link = v.page.layout.children!.find((n) => n.id === 'share')!.box
      return { x: link[0]! + link[2]! / 2, y: link[1]! + link[3]! / 2, down: v.pageTime > 7.5 && v.pageTime < 7.7 }
    } })
    shared.advance(8 * hz)
    for (const st of shared.page.states()) seen.add(st)
    expect([...wanted].filter((w) => !seen.has(w))).toEqual([])
    expect(seen.has('rest')).toBe(true)
  })

  it('keeps every drawn part on the page and every run of type readable, in every state', () => {
    const s = film()
    for (let i = 0; i < 9.7 * hz; i += 12) {
      s.advance(12)
      if (s.page.id !== 'step5') break
      const list = draw(s)
      const ids = new Set<string>()
      for (const shape of list) {
        expect(ids.has(shape.id), shape.id).toBe(false)
        ids.add(shape.id)
        for (const k of ['x', 'y', 'w', 'h', 'z0', 'z1'] as const) expect(Number.isFinite(shape[k]), `${shape.id}.${k}`).toBe(true)
        if (shape.kind === 'text') expect(shape.type!.px).toBeGreaterThanOrEqual(config.layout.minTextPx)
      }
    }
  })

  it('draws the page at rest exactly where the layout puts it', () => {
    const s = film()
    s.advance(Math.round(7.2 * hz))
    const list = draw(s)
    const planned = new Map<string, number[]>()
    walk(s.page.layout, (n) => planned.set(n.id, n.box))
    let checked = 0
    for (const shape of list) {
      const box = planned.get(shape.id)
      if (!box || shape.rot) continue
      expect([shape.x, shape.y, shape.w, shape.h].map((v) => Number(v.toFixed(3))), shape.id).toEqual(box.map((v) => Number(v.toFixed(3))))
      checked++
    }
    expect(checked).toBeGreaterThan(30)
    for (const id of ['letter', 'metrics', 'stamp-block', 'stamp-grip', 'accept-cap', 'letter-stamp', 'share-link']) expect(list.some((x) => x.id === id), id).toBe(true)
    expect(list.some((x) => x.id === 'wait-panel')).toBe(false)
  })
})

describe('step 5, the words', () => {
  it('resolves every word it shows to a key', () => {
    const page = makePage()
    for (const r of typeRegister(page.layout)) {
      expect(hasWords(r.key), r.key).toBe(true)
      expect(/^(copy:|runtime:|data:|applicant\.)/.test(r.key), r.key).toBe(true)
    }
    const s = film()
    for (let i = 0; i < 9.7 * hz; i += 24) {
      s.advance(24)
      if (s.page.id !== 'step5') break
      for (const shape of draw(s)) {
        if (shape.kind !== 'text') continue
        expect(hasWords(shape.words!), shape.id).toBe(true)
        if (shape.words!.startsWith('runtime:')) expect(typeof shape.text, shape.id).toBe('string')
        else expect(shape.text, shape.id).toBeUndefined()
      }
    }
  })

  it('uses all of the copy of step 5 but the closing, which is the last page footer', () => {
    const page = makePage()
    const used = new Set(typeRegister(page.layout).map((r) => r.key))
    const all: string[] = []
    const collect = (v: unknown, path: string): void => {
      if (typeof v === 'string') all.push(path)
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) collect(x, `${path}.${k}`)
    }
    collect(copy.step5, 'copy:step5')
    const made: Record<string, string> = { 'copy:step5.shareText': 'runtime:step5.shareText' }
    const missing = all.filter((k) => !used.has(k) && !(made[k] && used.has(made[k]!)) && k !== 'copy:step5.closing')
    expect(missing).toEqual([])
    expect(used.has('copy:transitions.step5')).toBe(true)
  })

  it('makes its numbers from the values in the copy', () => {
    expect(spun(words('copy:step5.wait.value'), 0)).toBe(words('copy:step5.wait.value'))
    expect(spun(words('copy:step5.wait.value'), 1)).toBe(words('copy:step5.wait.value').replace(/\d/g, '0'))
    expect(clock(secondsOf(words('copy:step5.metrics.averageTimeValue')))).toBe(words('copy:step5.metrics.averageTimeValue'))
    expect(clock(secondsOf(words('copy:step5.metrics.targetTimeValue')))).toBe(words('copy:step5.metrics.targetTimeValue'))
    const s = film()
    s.advance(Math.round(7.2 * hz))
    const list = draw(s)
    const text = (id: string): string | undefined => list.find((x) => x.id === id)?.text
    expect(text('metrics-your-value')).toBe(clock(filmSeconds()))
    expect(list.find((x) => x.id === 'metrics-average-value')?.words).toBe('copy:step5.metrics.averageTimeValue')
    expect(list.find((x) => x.id === 'metrics-target-value')?.words).toBe('copy:step5.metrics.targetTimeValue')
  })
})

describe('step 5, the film', () => {
  it('reports the event of every beat inside its beat', () => {
    const s = film()
    s.advance(12 * hz)
    for (const b of beats) {
      const hits = s.events.filter((e) => e.name === b.event).map((e) => e.step / hz)
      expect(hits.length, b.id).toBeGreaterThan(0)
      for (const t of hits) {
        expect(t, `${b.id} ${b.event}`).toBeGreaterThanOrEqual(b.from - tolerance)
        expect(t, `${b.id} ${b.event}`).toBeLessThanOrEqual(b.to + tolerance)
      }
    }
  })

  it('plays the beats in the order the film tells them', () => {
    const s = film()
    s.advance(12 * hz)
    const order = s.events.filter((e) => e.name !== 'step').map((e) => e.name)
    expect(order).toEqual(['hold-music', 'letter-drop', 'paper-slide', 'stamp', 'flatten', 'peel-up', 'button-press', 'page-turn'])
    const stamp = s.events.find((e) => e.name === 'stamp')!
    expect(stamp.hitsCursor).toBe(true)
    expect(s.pagesVisited).toEqual(['step5', 'marketing'])
    expect(s.page.id).toBe('marketing')
  })

  it('flattens the cursor under the stamp, shows it flat at the key moment and whole again before the button', () => {
    const s = film()
    const key = config.keys.find((k) => k.id === 'decision')!
    const b = beats.find((x) => x.id === key.beat)!
    const at = b.from + (b.to - b.from) * key.at
    s.advance(Math.round(at * hz))
    expect(s.cursor.pose().damage).toEqual(['flattened'])
    const press = 9.3
    s.advance(Math.round((press - at) * hz) - 1)
    expect(s.cursor.damaged).toBe(false)
    const cap = draw(s).find((x) => x.id === 'accept-cap')!
    expect(s.cursor.x).toBeGreaterThan(cap.x)
    expect(s.cursor.x).toBeLessThan(cap.x + cap.w)
    expect(s.cursor.y).toBeGreaterThan(cap.y)
    expect(s.cursor.y).toBeLessThan(cap.y + cap.h)
  })

  it('never gives the cursor arms and never changes its size', () => {
    const s = film()
    for (let i = 0; i < 12 * hz; i += 8) {
      s.advance(8)
      const pose = s.cursor.pose()
      expect(pose.arms).toBe(false)
      expect(pose.scale).toBe(1)
    }
  })

  it('is a pure function of time in its script', () => {
    const a = makePage()
    const b = makePage()
    for (let t = 0; t <= 12; t += 0.37) expect(a.script(t)).toEqual(b.script(t))
    expect(a.script(3.3)).toEqual(a.script(3.3))
  })
})

describe('step 5, the live site', () => {
  it('ends by itself with a pointer that never moves', () => {
    for (const at of [[960, 540], [40, 40], [700, 640]] as const) {
      const s = live(still(at[0], at[1]))
      const took = runUntilTurned(s, 60)
      expect(s.page.id, `${at}`).toBe('marketing')
      expect(took).toBeLessThan(2 + 4 + config.live.skipLinkAfterSeconds + 3)
      expect(s.events.filter((e) => e.name === 'button-press').length).toBe(1)
      expect(s.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      expect(s.gagsReached).toEqual(expect.arrayContaining(beats.map((b) => b.id)))
    }
  })

  it('ends by itself with a pointer that does the wrong thing', () => {
    const wrong: Driver = { name: 'bot', input: (v: DriverView): Pointer => ({ x: 300 + 500 * Math.abs(Math.sin(v.step / 97)), y: 420 + 300 * Math.abs(Math.cos(v.step / 61)), down: Math.floor(v.step / 30) % 2 === 0 }) }
    const s = live(wrong)
    runUntilTurned(s, 60)
    expect(s.page.id).toBe('marketing')
    expect(s.events.filter((e) => e.name === 'stamp').length).toBe(1)
    expect(s.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('waits for the press of the button and takes it as soon as the button is up', () => {
    const page = makePage()
    const cap = page.layout.children!.find((n) => n.id === 'accept')!.children![0]!.box
    const keen: Driver = { name: 'bot', input: (v: DriverView): Pointer => ({ x: cap[0]! + cap[2]! / 2, y: cap[1]! + cap[3]! / 2, down: Math.floor(v.step / 24) % 2 === 0 }) }
    const s = live(keen)
    const took = runUntilTurned(s, 60)
    const press = s.events.find((e) => e.name === 'button-press')!
    expect(press.step / hz).toBeGreaterThanOrEqual(7)
    expect(press.step / hz).toBeLessThan(7.3)
    expect(took).toBeLessThan(8.5)
    expect(s.events.find((e) => e.name === 'stamp')!.hitsCursor).toBe(false)
  })

  it('does nothing when the button is pressed before it is there', () => {
    const page = makePage()
    const cap = page.layout.children!.find((n) => n.id === 'accept')!.children![0]!.box
    const early: Driver = { name: 'bot', input: (v: DriverView): Pointer => ({ x: cap[0]! + cap[2]! / 2, y: cap[1]! + cap[3]! / 2, down: v.pageTime < 6.5 && Math.floor(v.step / 24) % 2 === 0 }) }
    const s = live(early)
    s.advance(10 * hz)
    expect(s.page.id).toBe('step5')
    expect(s.events.some((e) => e.name === 'button-press')).toBe(false)
  })

  it('plays its ending when the step is skipped, from any gag', () => {
    for (const at of [0.5, 2.2, 3, 4.4, 6.5, 12]) {
      const s = live(still(600, 600))
      s.advance(Math.round(at * hz))
      s.page.skip()
      const took = runUntilTurned(s, 5)
      expect(s.page.id, `${at}`).toBe('marketing')
      expect(took).toBeLessThan(1.5)
      expect(s.events.filter((e) => e.name === 'button-press').length).toBe(1)
      expect(s.cursor.taken).toBe(false)
    }
  })

  it('rejects every visitor: the letter and its stamp are there before the page can end', () => {
    const s = live(still(1400, 900))
    while (!s.page.done() && s.step < 60 * hz) s.advance(1)
    const ids = new Set(draw(s).map((x) => x.id))
    for (const id of ['letter', 'letter-title', 'letter-body', 'letter-closing', 'letter-stamp', 'metrics', 'accept-cap']) expect(ids.has(id), id).toBe(true)
  })

  it('hints at what a capable visitor would do, with a way out of the stamp', () => {
    const s = live(still(960, 900))
    s.advance(Math.round(3 * hz))
    const hint = s.page.hint()!
    expect(hint.dodge).toBeDefined()
    expect(hint.down).toBe(false)
    s.advance(Math.round(5 * hz))
    let pressed = false
    for (let i = 0; i < hz; i++) {
      s.advance(1)
      if (s.page.hint()?.down) pressed = true
    }
    expect(pressed).toBe(true)
  })

  it('lets every bot finish, and the keen bot reach every gag', () => {
    const flow = [{ page: 'step5' }, { page: 'marketing', variant: 'rejected' }]
    for (const bot of config.live.bots as ('keen' | 'clumsy' | 'random' | 'skipper')[]) {
      for (let i = 0; i < config.live.botSeeds; i++) {
        const r = runBot(pages, bot, config.seed + i, flow, 90)
        expect(r.finished, `${bot} ${i}`).toBe(true)
        expect(r.ignoredPointer, `${bot} ${i}`).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
        if (bot === 'keen') expect(r.gags).toEqual(expect.arrayContaining(beats.map((b) => b.id)))
      }
    }
  })
})

describe('step 5, save and load', () => {
  const N = Math.round(11 * hz)

  it('continues exactly after load(save()), in the film', () => {
    const a = film()
    a.advance(N)
    for (const cut of [0.3, 2.2, 2.6, 4.31, 5.2, 6.4, 9.35]) {
      const b = film()
      b.advance(Math.round(cut * hz))
      const page = JSON.parse(JSON.stringify(b.page.save()))
      const cursor = b.cursor.save()
      b.page.reset({ mode: 'film', variant: '', applicant: null, seed: config.seed })
      b.page.load(page)
      b.cursor.load(cursor)
      b.advance(N - b.step)
      expect(state(b), `${cut}`).toBe(state(a))
      expect(b.events, `${cut}`).toEqual(a.events)
    }
  })

  it('gives the same frames by seeking as by playing', () => {
    const a = film()
    const b = film()
    b.seek(11)
    for (const t of [9.4, 7.2, 4.35, 2.5, 0.2, 4.35, 8.8]) {
      const fresh = film()
      fresh.advance(Math.round(t * hz))
      b.seek(t)
      expect(state(b), `${t}`).toBe(state(fresh))
      expect(JSON.stringify(draw(b)), `${t}`).toBe(JSON.stringify(draw(fresh)))
      expect(JSON.stringify(b.frameAt(t)), `${t}`).toBe(JSON.stringify(a.frameAt(t)))
    }
  })

  it('continues exactly after load(save()), on the live site', () => {
    const drive = (): Driver => ({ name: 'bot', input: (v: DriverView): Pointer => ({ x: 500 + 400 * Math.sin(v.step / 131), y: 640 + 200 * Math.cos(v.step / 77), down: Math.floor(v.step / 45) % 3 === 0 }) })
    const a = live(drive())
    a.advance(30 * hz)
    for (const cut of [1, 4.4, 8, 26.3]) {
      const b = live(drive())
      b.advance(Math.round(cut * hz))
      const page = JSON.parse(JSON.stringify(b.page.save()))
      const cursor = b.cursor.save()
      b.page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
      b.page.load(page)
      b.cursor.load(cursor)
      b.advance(30 * hz - b.step)
      expect(state(b), `${cut}`).toBe(state(a))
    }
  })
})
