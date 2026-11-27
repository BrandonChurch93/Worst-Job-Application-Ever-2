import { afterEach, describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { bridge, type VideoPlayer } from '../src/pages/step3/video/bridge'
import manifest from '../src/pages/step3/video/manifest.json'
import { frameStep, joinsOf, VIDEO } from '../src/pages/step3/video/plan'
import states from '../src/pages/step3/video/states.json'
import { BotDriver, type BotName } from '../src/stage/bots'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

const STEP3 = liveFlow().findIndex((f) => f.page === 'step3')
const LIMIT = config.live.botMaxSeconds * stepHz
const SKIP = config.live.skipLinkAfterSeconds
// The arrow is handed back over the stage's eased blend. Farther than this in one step of the stage would be a jump, in page pixels.
const JUMP_PX = 12

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow(VIDEO.unit), pages, driver: new ScriptDriver(), film: filmOptions(VIDEO.unit) })
const plain = (o: unknown): unknown => JSON.parse(JSON.stringify(o))

class Presser implements Driver {
  readonly name = 'bot' as const
  private bot: BotDriver
  constructor(bot: BotName, seed: number, private skipAt = -1) {
    this.bot = new BotDriver(bot, seed)
  }
  input(v: DriverView): Pointer {
    const p = this.bot.input(v)
    if (this.skipAt >= 0 && v.page.id === 'step3' && v.skipOffered && v.pageTime >= this.skipAt) p.skip = true
    return p
  }
}

interface Watch { stage: Stage; from: number; to: number; filmSteps: number; names: string[]; farthest: number; left: { x: number; y: number } | null; done: boolean; lists: string[]; after: string[]; scroll: number }

function live(bot: BotName, seed: number, skipAt = -1): Watch {
  const stage = new Stage({ mode: 'live', flow: liveFlow().slice(STEP3), pages, driver: new Presser(bot, seed, skipAt), seed })
  const w: Watch = { stage, from: -1, to: -1, filmSteps: 0, names: [], farthest: 0, left: null, done: false, lists: [], after: [], scroll: -1 }
  let was = { x: 0, y: 0 }
  while (stage.entryIndex === 0 && stage.step < LIMIT) {
    stage.advance(1)
    if (stage.entryIndex !== 0) break
    if (stage.page.control === 'film') w.filmSteps++
    const c = stage.cursor.pose()
    if (w.from < 0 && stage.events.some((e) => e.name === 'video-in')) {
      w.from = stage.step
      w.lists.push(JSON.stringify(stage.frameAt(stage.time).list), JSON.stringify(stage.frameAt(stage.time).cursor))
    }
    if (w.from >= 0 && w.to < 0 && stage.events.some((e) => e.name === 'video-out')) {
      w.to = stage.step
      w.left = { x: c.x, y: c.y }
      w.scroll = stage.page.scroll()
      w.after.push(stage.frameAt(stage.time).list.map((x) => x.id).join(' '))
    } else if (w.to >= 0 && stage.step <= w.to + stepHz) w.farthest = Math.max(w.farthest, Math.hypot(c.x - was.x, c.y - was.y))
    was = { x: c.x, y: c.y }
  }
  w.done = stage.entryIndex > 0
  w.names = stage.events.filter((e) => e.page === 'step3').map((e) => e.name)
  return w
}

afterEach(() => {
  bridge.player = null
})

describe('the video is of the scene as it is built now', () => {
  const whole = film()
  whole.advance(Math.round(config.film.units.find((u) => u.id === VIDEO.unit)!.seconds * stepHz))
  const joins = joinsOf(whole.events)

  it('joins on the frames the events of the scene give', () => {
    expect([manifest.from.frame, manifest.to.frame]).toEqual([joins.from, joins.to])
    expect(manifest.frames).toBe(joins.to - joins.from + 1)
    expect(manifest.seconds).toBeCloseTo(manifest.frames / config.film.fps, 9)
  })

  it('carries the state and the hash of the film at both joins, and its events between them', () => {
    const stage = film()
    stage.advance(frameStep(joins.from))
    expect(stage.hash()).toBe(manifest.from.hash)
    expect(plain(stage.page.save())).toEqual(states.from.page)
    expect(plain(stage.cursor.save())).toEqual(states.from.cursor)
    stage.advance(frameStep(joins.to) - stage.step)
    expect(stage.hash()).toBe(manifest.to.hash)
    expect(plain(stage.page.save())).toEqual(states.to.page)
    expect(plain(stage.cursor.save())).toEqual(states.to.cursor)
    const between = whole.events.filter((e) => e.step >= manifest.from.step && e.step < manifest.to.step)
    expect(manifest.events.map((e) => [e.name, e.at + manifest.from.step])).toEqual(between.map((e) => [e.name, e.step]))
  })

  it('stands still at the join in and leaves before the film walks the arrow', () => {
    const at = (name: string): number => whole.events.find((e) => e.name === name)!.step / stepHz
    expect(manifest.from.time).toBeLessThan(at(VIDEO.inEvent))
    expect(manifest.from.time).toBeGreaterThan(at('ball-seal'))
    expect(manifest.to.time).toBeGreaterThan(at(VIDEO.outEvent))
    const a = whole.frameAt(manifest.to.time - 2 / config.film.fps).cursor
    const b = whole.frameAt(manifest.to.time + 2 / config.film.fps).cursor
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(0.5)
  })

  it('ends on a film frame that is over before the result card begins to rise', () => {
    const stage = film()
    stage.advance(frameStep(joins.to + 1))
    const s = (stage.page.save() as { s: { phase: string; result: number } }).s
    expect(s.phase).toBe('open')
    expect(s.result).toBe(0)
    stage.advance(frameStep(joins.to + 3) - stage.step)
    expect((stage.page.save() as { s: { phase: string } }).s.phase).toBe('result')
  })
})

describe('step 3 of the live site plays the scene as a video', () => {
  const keen = live('keen', config.seed)

  it('reports the span as the film, for exactly the length of the video', () => {
    expect(keen.done).toBe(true)
    expect(keen.from).toBeGreaterThan(0)
    expect(keen.to).toBeGreaterThan(keen.from)
    expect(Math.abs(keen.filmSteps - manifest.seconds * stepHz)).toBeLessThanOrEqual(1)
    expect(keen.stage.longestIgnored.film).toBeCloseTo(manifest.seconds, 1)
    expect(keen.stage.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    expect(keen.stage.longestIgnored.flippers).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('relays the events of the film between the joins, each once and in order, on the step of the video it belongs to', () => {
    const events = keen.stage.events.filter((e) => e.page === 'step3')
    const i = events.findIndex((e) => e.name === 'video-in')
    const j = events.findIndex((e) => e.name === 'video-out')
    expect(events.slice(i + 1, j).map((e) => e.name)).toEqual(manifest.events.map((e) => e.name))
    const late = events.slice(i + 1, j).map((e, k) => e.step - events[i]!.step - manifest.events[k]!.at)
    expect(Math.min(...late)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...late)).toBeLessThanOrEqual(1)
  })

  it('reaches every gag of the scene', () => {
    const gags = config.film.beats.filter((b) => b.unit === VIDEO.unit && b.from < manifest.to.time).map((b) => b.id)
    for (const g of gags) expect(keen.stage.gagsReached, g).toContain(g)
  })

  it('shows the same picture at the join in whatever the visitor did', () => {
    const others = [live('keen', config.seed + 1), live('clumsy', config.seed), live('random', config.seed)].filter((w) => w.from >= 0)
    expect(others.length).toBeGreaterThan(0)
    for (const w of others) expect(w.lists).toEqual(keen.lists)
  })

  it('hands the arrow back where the video left it, without a jump', () => {
    const film = (states.to.cursor as { x: number; y: number })
    expect(Math.hypot(keen.left!.x - film.x, keen.left!.y - film.y)).toBeLessThan(1)
    expect(keen.farthest).toBeLessThan(JUMP_PX)
  })

  it('shows the picture of the film at the join out, and the page where the film left it', () => {
    const stage = film()
    stage.advance(manifest.to.step)
    expect(keen.scroll).toBeCloseTo(stage.page.scroll(), 6)
    expect(keen.after[0] === stage.frameAt(stage.time).list.map((x) => x.id).join(' ')).toBe(true)
  })

  it('lets the visitor out by the skip link at three moments of the video', () => {
    for (const at of [SKIP + 0.5, SKIP + 8, SKIP + 15]) {
      const w = live('keen', config.seed, at)
      const skip = w.stage.events.find((e) => e.name === 'skip')!
      const out = w.stage.events.find((e) => e.name === 'video-out')!
      expect(skip, `skip at ${at}`).toBeDefined()
      expect(out.step - skip.step).toBeLessThanOrEqual(2)
      expect(w.scroll, `the page after a skip at ${at}`).toBeCloseTo(keen.scroll, 6)
      expect(w.after[0] === keen.after[0]).toBe(true)
      expect(w.done).toBe(true)
    }
  })
})

describe('the video and the page', () => {
  const fake = (o: Partial<VideoPlayer>): VideoPlayer => ({ ready: () => true, enter: () => undefined, clock: () => 0, over: () => false, gone: () => true, leave: () => undefined, ...o })

  it('waits a named time for a video that is not ready and then plays the table itself, as before there was a video', () => {
    bridge.player = fake({ ready: () => false })
    bridge.gaveUp = false
    const w = live('keen', config.seed)
    expect(w.names).not.toContain('video-in')
    expect(w.names).toContain('tube-run')
    expect(w.names).toContain('ball-open')
    expect(bridge.gaveUp).toBe(true)
    expect(w.stage.longestIgnored.film).toBe(0)
    expect(w.stage.longestIgnored.flippers).toBeLessThan(config.live.controlTakenMaxSeconds)
    expect(w.done).toBe(true)
    expect(VIDEO.waitMax).toBeLessThanOrEqual(1)
  })

  it('plays the table itself at once where the video is switched off or no file can be played', () => {
    bridge.player = null
    bridge.off = true
    const w = live('keen', config.seed)
    bridge.off = false
    expect(w.names).not.toContain('video-in')
    expect(w.names).toContain('tube-run')
    expect(w.stage.longestIgnored.film).toBe(0)
    expect(w.done).toBe(true)
  })

  it('sounds each cue by the clock of the video, not by its own', () => {
    let t = 0
    let entered = false
    let left = false
    bridge.player = fake({ enter: () => { entered = true }, clock: () => t, over: () => t >= manifest.seconds, leave: () => { left = true } })
    const stage = new Stage({ mode: 'live', flow: liveFlow().slice(STEP3), pages, driver: new BotDriver('keen', config.seed), seed: config.seed })
    const heard: { name: string; clock: number }[] = []
    let seen = 0
    while (stage.entryIndex === 0 && stage.step < LIMIT && !left) {
      if (entered) t += 0.5 / stepHz
      stage.advance(1)
      for (; seen < stage.events.length; seen++) heard.push({ name: stage.events[seen]!.name, clock: t })
    }
    expect(left).toBe(true)
    const i = heard.findIndex((e) => e.name === 'video-in')
    const cues = heard.slice(i + 1).filter((e) => e.name !== 'video-out')
    expect(cues.map((e) => e.name)).toEqual(manifest.events.map((e) => e.name))
    const late = cues.map((e, k) => e.clock - manifest.events[k]!.at / stepHz)
    expect(Math.min(...late)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...late)).toBeLessThan(2 / stepHz)
  })

  it('does not sound the cues a sleeping tab passed over', () => {
    let t = 0
    let entered = false
    bridge.player = fake({ enter: () => { entered = true }, clock: () => t, over: () => t >= manifest.seconds })
    const stage = new Stage({ mode: 'live', flow: liveFlow().slice(STEP3), pages, driver: new BotDriver('keen', config.seed), seed: config.seed })
    while (!entered && stage.step < LIMIT) stage.advance(1)
    const before = stage.events.length
    t = manifest.seconds / 2
    stage.advance(1)
    expect(stage.events.length).toBe(before)
    t += 1 / stepHz
    stage.advance(1)
    const next = manifest.events.find((e) => e.at / stepHz > t)!
    t = next.at / stepHz
    stage.advance(1)
    expect(stage.events.at(-1)!.name).toBe(next.name)
  })
})
