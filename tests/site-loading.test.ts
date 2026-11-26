import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as THREE from 'three'
import { config, stepHz } from '../src/config'
import { filesOf } from '../src/core/assets'
import { loadPage, loadState, pageReady, picturesOf, releasePage, resetLoading, showPage, stageLoading, waitsFor, wanted } from '../src/core/load'
import { pagePrepared, pages, preparePage, preparePages } from '../src/pages'
import { PageView, standInsOf, waitingOf } from '../src/shell/view'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage } from '../src/stage/stage'
import { setTurnWait, WAIT_TAP_SECONDS } from '../src/stage/turn'
import '../src/table/real'

const flow = liveFlow().map((e) => e.page)
const inWeb = filesOf('table', 'web').map((f) => f.file)

interface Fake { fetched: string[]; decoding: number; mostDecoding: number; closed: number; uploads: number[]; frame: number; hold: boolean; fail: boolean; letGo: (() => void)[] }
let fake: Fake
let frames: (() => void)[] = []

const settle = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await new Promise((done) => setTimeout(done, 0))
}
const frame = async (): Promise<void> => {
  fake.frame++
  const run = frames
  frames = []
  for (const f of run) f()
  await settle()
}
const play = async (n: number): Promise<void> => {
  for (let i = 0; i < n; i++) await frame()
}
const card = { initTexture: (_t: THREE.Texture): void => void fake.uploads.push(fake.frame) }

beforeEach(() => {
  resetLoading()
  fake = { fetched: [], decoding: 0, mostDecoding: 0, closed: 0, uploads: [], frame: 0, hold: false, fail: false, letGo: [] }
  frames = []
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => frames.push(f))
  vi.stubGlobal('fetch', async (url: string) => {
    fake.fetched.push(url)
    if (fake.hold) await new Promise<void>((done) => fake.letGo.push(done))
    if (fake.fail) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }
    return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(1000) }
  })
  vi.stubGlobal('createImageBitmap', async () => {
    fake.decoding++
    fake.mostDecoding = Math.max(fake.mostDecoding, fake.decoding)
    await new Promise((done) => setTimeout(done, 0))
    fake.decoding--
    return { width: 64, height: 32, close: () => void fake.closed++ }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  setTurnWait(null)
  resetLoading()
})

describe('what is loaded when', () => {
  it('wants the page on show and the next one, and the pinball machine from step 1 on', () => {
    expect(wanted(flow, 'marketing')).toEqual(['marketing', 'step1'])
    expect(wanted(flow, 'step1')).toEqual(['step1', 'step2', 'step3'])
    expect(wanted(flow, 'step2')).toEqual(['step2', 'step3'])
    expect(wanted(flow, 'step3')).toEqual(['step3', 'step4'])
    expect(wanted(flow, 'step4')).toEqual(['step4', 'step5'])
  })

  it('knows the pictures of the table as the pictures of step 3, and no other page has any', () => {
    expect(picturesOf('step3').length).toBeGreaterThanOrEqual(inWeb.length)
    for (const file of inWeb) expect(picturesOf('step3')).toContain(file)
    for (const page of ['marketing', 'step1', 'step2', 'step4', 'step5']) {
      expect(picturesOf(page)).toEqual([])
      expect(pageReady(page)).toBe(true)
    }
  })

  it('loads a page whole and keeps it for a capture: every picture ready when the promise ends, no source let go, nothing released', async () => {
    await loadPage('step3', 'web')
    const s = loadState()
    expect(s.staged).toBe(false)
    expect(s.pages.step3!.loaded).toBe(inWeb.length)
    expect(s.pages.step3!.sources).toBe(inWeb.length)
    expect(pageReady('step3')).toBe(true)
    expect(fake.closed).toBe(0)
    expect(fake.uploads).toEqual([])
    showPage(flow, 'step5', 'web')
    releasePage('step3')
    expect(loadState().pages.step3!.loaded).toBe(inWeb.length)
    expect(fake.fetched.length).toBe(inWeb.length)
  })

  it('puts no picture on the card while a page is turning, and goes on when the turn is over', async () => {
    stageLoading(card, () => 0)
    showPage(flow, 'step1', 'web', true)
    await play(12)
    expect(loadState().pages.step3!.loaded).toBeGreaterThan(0)
    expect(fake.uploads).toEqual([])
    expect(pageReady('step3')).toBe(false)
    showPage(flow, 'step1', 'web', false)
    await play(inWeb.length * 3 + 4)
    expect(loadState().pages.step3).toMatchObject({ onCard: inWeb.length, ready: true })
    const at = fake.uploads.length
    showPage(flow, 'step1', 'web', true)
    await play(4)
    expect(fake.uploads.length).toBe(at)
  })

  it('fetches nothing on the careers page, the table from step 1 on, and lets it go after step 3', async () => {
    stageLoading(card, () => 0)
    showPage(flow, 'marketing', 'web')
    await play(3)
    expect(fake.fetched).toEqual([])
    expect(pageReady('step3')).toBe(false)
    showPage(flow, 'step1', 'web')
    await settle()
    expect(fake.fetched.length).toBe(inWeb.length)
    expect(waitsFor('tier-art')).toBe(true)
    await play(inWeb.length * 3 + 4)
    const s = loadState()
    expect(s.pages.step3).toMatchObject({ loaded: inWeb.length, onCard: inWeb.length, sources: 0, failed: 0, ready: true })
    expect(s.waiting).toEqual([])
    expect(fake.closed).toBe(inWeb.length)
    showPage(flow, 'step2', 'web')
    showPage(flow, 'step3', 'web')
    expect(loadState().pages.step3!.onCard).toBe(inWeb.length)
    expect(fake.fetched.length).toBe(inWeb.length)
    showPage(flow, 'step4', 'web')
    expect(loadState().pages.step3).toMatchObject({ loaded: 0, onCard: 0, sources: 0, ready: false, cardMb: 0 })
    showPage(flow, 'step3', 'web')
    await play(inWeb.length * 3 + 4)
    expect(loadState().pages.step3!.onCard).toBe(inWeb.length)
  })

  it('puts at most one picture on the card in a frame, decodes one at a time, and lets each decoded source go once it is on the card', async () => {
    stageLoading(card, () => 0)
    showPage(flow, 'step1', 'web')
    let most = 0
    for (let i = 0; i < inWeb.length * 3 + 4; i++) {
      await frame()
      const s = loadState().pages.step3!
      most = Math.max(most, s.sources)
      expect(s.sources).toBeLessThanOrEqual(1)
      expect(s.loaded - s.onCard).toBeLessThanOrEqual(1)
    }
    expect(fake.uploads.length).toBe(inWeb.length)
    expect(new Set(fake.uploads).size).toBe(inWeb.length)
    expect(fake.mostDecoding).toBe(1)
    expect(most).toBeLessThanOrEqual(1)
  })

  it('calls a part waiting while its pictures are on their way, and missing once they have failed', async () => {
    stageLoading(card, () => 0)
    fake.hold = true
    showPage(flow, 'step1', 'web')
    await play(5)
    expect(pageReady('step3')).toBe(false)
    expect(waitsFor('tier-art')).toBe(true)
    const stage = new Stage({ mode: 'live', flow: liveFlow().slice(3), pages, driver: new BotDriver('keen', 1), seed: 1 })
    const f = stage.frameAt(0)
    const size = { width: 1920, height: 5976 }
    expect(waitingOf(f, size)).toContain('tier-art')
    expect(standInsOf(f, size)).not.toContain('tier-art')
    const view = new PageView()
    view.apply(f, size)
    expect(view.waiting()).toContain('tier-art')
    expect(view.standIns()).not.toContain('tier-art')
    let drawn = 0
    view.scene.traverse((o) => {
      if (o.userData.part === 'tier-art') drawn++
    })
    expect(drawn).toBe(0)
    fake.fail = true
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    for (const go of fake.letGo) go()
    await play(4)
    errors.mockRestore()
    expect(pageReady('step3')).toBe(true)
    expect(waitsFor('tier-art')).toBe(false)
    expect(standInsOf(f, size)).toContain('tier-art')
    expect(loadState().pages.step3!.failed).toBe(inWeb.length)
  })
})

describe('the wait before a page turn', () => {
  const waitSteps = Math.round(config.live.loadWaitSeconds * stepHz)
  const every = Math.round(WAIT_TAP_SECONDS * stepHz)

  function visit(ready: ((page: string, stage: Stage) => boolean) | null): { turns: Record<string, number>; taps: number[]; finished: boolean; hash: string; ignored: number } {
    const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver('skipper', 1), seed: 1 })
    setTurnWait(ready ? { ready: (page) => ready(page, stage), steps: waitSteps, every } : null)
    const taps: number[] = []
    const react = stage.cursor.react.bind(stage.cursor)
    stage.cursor.react = (name) => {
      if (name === 'tap' && stage.page.id === 'step2' && stage.page.done()) taps.push(stage.step)
      react(name)
    }
    while (!stage.finished && stage.time < 400) stage.advance(240)
    const turns: Record<string, number> = {}
    for (const e of stage.events) if (e.name === 'page-turn') turns[e.page] ??= e.step
    return { turns, taps, finished: stage.finished, hash: stage.hash(), ignored: stage.longestIgnored.pointer }
  }

  it('reads the length of the wait from live.loadWaitSeconds', () => {
    expect(config.live.loadWaitSeconds).toBe(4)
    expect(waitSteps).toBe(4 * stepHz)
  })

  it('turns at once when the next page is ready: the visit is the same step for step as with no wait at all', { timeout: 120000 }, () => {
    const plain = visit(null)
    const ready = visit(() => true)
    expect(plain.finished).toBe(true)
    expect(ready.turns).toEqual(plain.turns)
    expect(ready.hash).toBe(plain.hash)
    expect(ready.taps).toEqual([])
  })

  it('turns after exactly the wait when the pictures of step 3 never arrive, with the cursor tapping all the while', { timeout: 120000 }, () => {
    const plain = visit(null)
    const never = visit((page) => page !== 'step3')
    expect(never.finished).toBe(true)
    expect(never.turns.step2! - plain.turns.step2!).toBe(waitSteps)
    expect(never.turns.step1).toBe(plain.turns.step1)
    expect(never.turns.step3! - plain.turns.step3!).toBe(waitSteps)
    expect(never.taps.length).toBe(Math.ceil(waitSteps / every))
    expect(never.taps[0]!).toBe(plain.turns.step2!)
    for (let i = 1; i < never.taps.length; i++) expect(never.taps[i]! - never.taps[i - 1]!).toBe(every)
    expect(never.ignored).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('turns when the pictures arrive, 1 s into the wait', { timeout: 120000 }, () => {
    const plain = visit(null)
    const late = visit((page, stage) => page !== 'step3' || stage.step >= plain.turns.step2! + stepHz)
    expect(late.finished).toBe(true)
    expect(late.turns.step2! - plain.turns.step2!).toBe(stepHz)
    expect(late.taps.length).toBe(Math.ceil(stepHz / every))
  })

  it('hands the cursor back within live.controlTakenMaxSeconds for every bot when every turn is held for the whole wait', { timeout: 240000 }, () => {
    for (const bot of ['keen', 'clumsy', 'random', 'skipper'] as const) {
      const run = (held: boolean): { finished: boolean; ignored: number; seconds: number } => {
        const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver(bot, 1), seed: 1 })
        setTurnWait(held ? { ready: () => false, steps: waitSteps, every } : null)
        while (!stage.finished && stage.time < config.live.botMaxSeconds + 30) stage.advance(240)
        return { finished: stage.finished, ignored: stage.longestIgnored.pointer, seconds: stage.time }
      }
      const plain = run(false)
      const held = run(true)
      console.log(`${bot}: longest pointer ignored ${plain.ignored.toFixed(2)} s with no wait, ${held.ignored.toFixed(2)} s with every turn held ${config.live.loadWaitSeconds} s; the visit ${plain.seconds.toFixed(1)} s and ${held.seconds.toFixed(1)} s`)
      expect(held.finished, bot).toBe(true)
      expect(held.ignored, bot).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    }
  })

  it('never holds a film: a stage in film mode steps the same with the wait set', () => {
    const run = (): string => {
      const stage = new Stage({ mode: 'film', flow: [{ page: 'step2', closes: 3 }, { page: 'step3' }], pages, driver: new BotDriver('keen', 1), seed: 1 })
      stage.advance(5 * stepHz)
      return `${stage.page.id} ${stage.hash()}`
    }
    const plain = run()
    setTurnWait({ ready: () => false, steps: waitSteps, every })
    expect(run()).toBe(plain)
  })

  it('holds a turn for as long as the code of the next page has not arrived, with the tip tapping, and goes once it has', () => {
    const arrives = 3 * waitSteps
    const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver('skipper', 1), seed: 1 })
    let asked = 0
    let free = -1
    const taps: number[] = []
    setTurnWait({
      ready: () => true,
      code: (page) => {
        if (page !== 'step3') return true
        if (free < 0) free = stage.step
        asked++
        return stage.step - free >= arrives
      },
      steps: waitSteps,
      every
    })
    const react = stage.cursor.react.bind(stage.cursor)
    stage.cursor.react = (name) => {
      if (name === 'tap' && stage.page.id === 'step2' && stage.page.done()) taps.push(stage.step - free)
      react(name)
    }
    while (stage.page.id !== 'step3' && stage.time < 400) stage.advance(1)
    expect(stage.page.id).toBe('step3')
    expect(asked).toBeGreaterThan(arrives)
    expect(taps.length).toBe(Math.ceil(arrives / every))
    expect(taps.at(-1)!).toBeGreaterThan(waitSteps)
    expect(taps.every((t, i) => t === i * every)).toBe(true)
  })
})

describe('the code the first load carries', () => {
  const root = path.resolve(__dirname, '..')

  it('leaves the physics library to a later fetch: nothing imports it at the top of a module', () => {
    const files = fs.readdirSync(path.join(root, 'src'), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts'))
    const top = files.filter((f) => /^import\s+(?!type\b)[^'"]*['"]@dimforge\//m.test(fs.readFileSync(path.join(root, 'src', f), 'utf8')))
    expect(top).toEqual([])
    expect(fs.readFileSync(path.join(root, 'src/table/physics.ts'), 'utf8')).toMatch(/await import\('@dimforge\/rapier2d-deterministic-compat'\)/)
  })

  it('does what was asked of a page whose code was not in when the code arrives, and only the last thing asked', async () => {
    vi.resetModules()
    const { App } = await import('../src/app')
    const fresh = await import('../src/pages')
    expect(fresh.pagePrepared('step3')).toBe(false)
    expect(fresh.pagePrepared('step2')).toBe(true)
    const app = new App()
    const done: string[] = []
    expect(app.code('step2', () => done.push('step2'))).toBe(true)
    expect(app.code('step3', () => done.push('first'))).toBe(false)
    expect(app.code('step3', () => done.push('second'))).toBe(false)
    expect(app.code(null)).toBe(false)
    expect(done).toEqual([])
    await fresh.preparePages()
    await Promise.resolve()
    expect(done).toEqual(['second'])
    expect(app.code('step3')).toBe(true)
    expect(app.code(null)).toBe(true)
    expect(app.code('step3', () => done.push('third'))).toBe(true)
    expect(done).toEqual(['second'])
  })

  it('knows which pages start with code of their own, and starts each once', async () => {
    expect(Object.keys(pages).filter((id) => !pagePrepared(id))).toEqual([])
    await preparePages(['marketing'])
    await preparePage('step3')
    expect(pagePrepared('step3')).toBe(true)
    expect(pagePrepared('marketing')).toBe(true)
  })
})
