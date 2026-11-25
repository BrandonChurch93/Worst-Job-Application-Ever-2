import { beat, config, stepHz } from '../config'
import { blendPose, CursorBody, HANDOFF, type CursorPose } from '../cursor/body'
import { BotDriver, type BotName, type BotRun } from './bots'
import { homePose, smooth } from './camera'
import { arriveTurn, leaveTurn, shiverSeconds, TURN } from './turn'
import type { CameraPose, Driver, DrawList, FlowEntry, Mode, PageLogic, PageMaker, Pointer, Shape, StageEvent } from './types'

export * from './types'

export const TURN_HALF = 0.5
const dt = 1 / stepHz
const turnSteps = Math.round(TURN_HALF * stepHz)
const checkpointSteps = Math.round(config.sim.checkpointSeconds * stepHz)
const skipAfter = Math.round(config.live.skipLinkAfterSeconds * stepHz)
const armsBeat = beat(config.cursor.armsOnlyInBeat)

export interface StageOptions {
  mode: Mode
  flow: FlowEntry[]
  pages: Record<string, PageMaker>
  driver: Driver
  seed?: number
  film?: { arrive: boolean; leave: boolean }
}

type Phase = 'arrive' | 'play' | 'leave' | 'end'

interface Saved {
  step: number
  index: number
  pageStep: number
  unitStep: number
  phase: Phase
  phaseStep: number
  down: boolean
  skipped: boolean
  run: number
  max: { pointer: number; flippers: number }
  reached: string[]
  visited: string[]
  events: number
  page: unknown
  cursor: unknown
}

export interface Frame { list: DrawList; cursor: CursorPose; turn: number; scroll: number; page: string; view: CameraPose | null; cursors?: CursorPose[]; time?: number; settle?: number }

const applicant = { firstName: config.applicant.filmFirstName, lastName: config.applicant.filmLastName, email: config.applicant.filmEmail }

export class Stage {
  step = 0
  events: StageEvent[] = []
  readonly cursor = new CursorBody()
  page!: PageLogic
  private index = 0
  private pageStep = 0
  private unitStep = 0
  private phase: Phase = 'play'
  private phaseStep = 0
  private down = false
  private skipped = false
  private run = 0
  private max = { pointer: 0, flippers: 0 }
  private reached = new Set<string>()
  private visited = new Set<string>()
  private made = new Map<string, PageLogic>()
  private checkpoints = new Map<number, Saved>()
  private frames = new Map<number, Frame>()
  driver: Driver

  constructor(readonly o: StageOptions) {
    this.driver = o.driver
    this.reset()
  }

  private pageOf(entry: FlowEntry): PageLogic {
    let p = this.made.get(entry.page)
    if (!p) {
      const make = this.o.pages[entry.page]
      if (!make) throw new Error(`No page called "${entry.page}"`)
      p = make()
      this.made.set(entry.page, p)
    }
    return p
  }

  private enter(index: number, arrive: boolean): void {
    const entry = this.o.flow[index]!
    this.index = index
    this.page = this.pageOf(entry)
    this.page.reset({ mode: this.o.mode, variant: entry.variant ?? '', applicant: this.o.mode === 'film' ? applicant : null, seed: this.o.seed ?? config.seed })
    this.pageStep = 0
    this.skipped = false
    if (entry.opens !== false) this.unitStep = 0
    this.phaseStep = 0
    this.phase = arrive ? 'arrive' : 'play'
    this.visited.add(entry.page)
    if (arrive) this.cursor.reset(HANDOFF.x, this.page.scroll() + HANDOFF.y, true)
    else this.cursor.reset(this.page.start.x, this.page.start.y)
  }

  reset(): void {
    this.step = 0
    this.events = []
    this.down = false
    this.run = 0
    this.max = { pointer: 0, flippers: 0 }
    this.reached = new Set()
    this.visited = new Set()
    this.checkpoints.clear()
    this.frames.clear()
    this.enter(0, this.o.film?.arrive ?? false)
    this.checkpoints.set(0, this.save())
  }

  get entry(): FlowEntry { return this.o.flow[this.index]! }
  get entryIndex(): number { return this.index }
  get time(): number { return this.step / stepHz }
  get pageTime(): number { return this.pageStep / stepHz }
  get turning(): boolean { return this.phase !== 'play' }
  get finished(): boolean { return this.phase === 'end' || (this.index === this.o.flow.length - 1 && this.phase === 'play' && !this.o.film?.leave && this.index > 0) }
  get skipOffered(): boolean { return this.o.mode === 'live' && this.phase === 'play' && this.pageStep >= skipAfter && this.index < this.o.flow.length - 1 && this.page.unit !== 'marketing' }
  get longestIgnored(): { pointer: number; flippers: number } { return { pointer: this.max.pointer / stepHz, flippers: this.max.flippers / stepHz } }
  get gagsReached(): string[] { return [...this.reached] }
  get pagesVisited(): string[] { return [...this.visited] }

  private turnAt(): number {
    const u = Math.min(1, this.phaseStep / turnSteps)
    if (this.phase === 'arrive') return arriveTurn(u)
    if (this.phase === 'leave') return leaveTurn(u)
    if (this.phase === 'end') return Math.PI / 2
    return 0
  }

  private settledFor(): number | undefined {
    const seat = TURN.seat * turnSteps
    if (this.phase === 'arrive') return (this.phaseStep - seat) / stepHz
    if (this.phase !== 'play' || this.pageStep - this.phaseStep !== turnSteps) return undefined
    const t = (this.phaseStep + turnSteps - seat) / stepHz
    return t < shiverSeconds ? t : undefined
  }

  private one(): void {
    const page = this.page
    const scroll = page.scroll()
    const raw = this.driver.input({ step: this.step, time: this.time, pageStep: this.pageStep, pageTime: this.pageTime, page, scroll, cursor: this.cursor, turning: this.turning, skipOffered: this.skipOffered })
    const playing = this.phase === 'play'
    const pointer: Pointer = { ...raw, y: raw.y + scroll, down: playing && raw.down }
    if (!playing) {
      pointer.flipLeft = false
      pointer.flipRight = false
      delete pointer.key
      delete pointer.skip
    }
    const emit = (name: string, x: number, y: number, hitsCursor = false) => {
      this.events.push({ name, step: this.step, page: page.id, x, y, hitsCursor })
    }
    if (pointer.skip && this.skipOffered && !this.skipped) {
      this.skipped = true
      emit('skip', pointer.x, pointer.y)
      page.skip()
    }
    if (this.phase !== 'end') {
      page.step({ step: this.pageStep, time: this.pageTime, elapsed: this.time, dt, pointer, pressed: pointer.down && !this.down, released: !pointer.down && this.down, cursor: this.cursor, emit, mode: this.o.mode })
      const gag = page.gag()
      if (gag) this.reached.add(gag)
      const inBeat = this.o.mode === 'live' || (this.index === 0 && this.pageTime >= armsBeat.from && this.pageTime < armsBeat.to)
      this.cursor.step(pointer, emit, gag === config.cursor.armsOnlyInBeat && inBeat)
    }
    this.down = pointer.down
    const ignored = !playing || page.ignoring() || (page.control === 'pointer' && this.cursor.taken)
    if (ignored && this.phase !== 'end') {
      this.run++
      const key = page.control
      if (this.run > this.max[key]) this.max[key] = this.run
    } else this.run = 0
    this.pageStep++
    this.unitStep++
    this.phaseStep++
    this.step++
    this.advancePhase(emit)
  }

  private advancePhase(emit: (name: string, x: number, y: number) => void): void {
    const last = this.index === this.o.flow.length - 1
    const film = this.o.film
    if (this.phase === 'arrive' && this.phaseStep >= turnSteps) {
      this.phase = 'play'
      this.phaseStep = 0
      this.cursor.land()
      return
    }
    if (this.phase === 'play') {
      const closes = this.o.mode === 'film' ? this.entry.closes : undefined
      const forced = closes !== undefined && (!last || film?.leave === true) && this.unitStep >= Math.round((closes - TURN_HALF) * stepHz)
      const free = closes === undefined && !last && this.page.done()
      if (forced || free) {
        this.phase = 'leave'
        this.phaseStep = 0
        const y = this.page.scroll() + HANDOFF.y
        this.cursor.lift(HANDOFF.x, y)
        emit('page-turn', HANDOFF.x, y)
      }
      return
    }
    if (this.phase === 'leave' && this.phaseStep >= turnSteps) {
      if (last) {
        this.phase = 'end'
        this.phaseStep = 0
      } else this.enter(this.index + 1, true)
    }
  }

  private save(): Saved {
    return {
      step: this.step, index: this.index, pageStep: this.pageStep, unitStep: this.unitStep, phase: this.phase, phaseStep: this.phaseStep, down: this.down, skipped: this.skipped, run: this.run, max: { ...this.max },
      reached: [...this.reached], visited: [...this.visited], events: this.events.length, page: JSON.parse(JSON.stringify(this.page.save() ?? null)), cursor: this.cursor.save()
    }
  }

  private load(s: Saved): void {
    this.step = s.step
    this.index = s.index
    this.page = this.pageOf(this.o.flow[s.index]!)
    const entry = this.o.flow[s.index]!
    this.page.reset({ mode: this.o.mode, variant: entry.variant ?? '', applicant: this.o.mode === 'film' ? applicant : null, seed: this.o.seed ?? config.seed })
    this.page.load(JSON.parse(JSON.stringify(s.page)))
    this.cursor.load(s.cursor)
    this.pageStep = s.pageStep
    this.unitStep = s.unitStep
    this.phase = s.phase
    this.phaseStep = s.phaseStep
    this.down = s.down
    this.skipped = s.skipped
    this.run = s.run
    this.max = { ...s.max }
    this.reached = new Set(s.reached)
    this.visited = new Set(s.visited)
    this.events.length = s.events
  }

  checkpoint(step: number): unknown {
    return this.checkpoints.get(step)
  }

  checkpointSteps(): number[] {
    return [...this.checkpoints.keys()].sort((a, b) => a - b)
  }

  restore(saved: unknown): void {
    const s = saved as Saved
    this.checkpoints.set(s.step, s)
  }

  advance(steps: number): void {
    for (let i = 0; i < steps; i++) {
      this.one()
      if (this.step % checkpointSteps === 0 && !this.checkpoints.has(this.step)) this.checkpoints.set(this.step, this.save())
    }
  }

  goto(step: number): void {
    if (step < this.step) {
      let best = 0
      for (const k of this.checkpoints.keys()) if (k <= step && k > best) best = k
      this.load(this.checkpoints.get(best)!)
      for (const k of [...this.frames.keys()]) if (k > best) this.frames.delete(k)
    } else {
      let best = -1
      for (const k of this.checkpoints.keys()) if (k <= step && k > this.step && k > best) best = k
      if (best > 0) this.load(this.checkpoints.get(best)!)
    }
    this.advance(step - this.step)
  }

  private snap(): Frame {
    const hit = this.frames.get(this.step)
    if (hit) return hit
    const list: DrawList = []
    if (this.phase !== 'end') this.page.draw(list)
    const made: Frame = { list, cursor: this.cursor.pose(), turn: this.turnAt(), scroll: this.page.scroll(), page: this.page.id, view: this.page.view(), time: this.step / stepHz }
    const settle = this.settledFor()
    if (settle !== undefined) made.settle = settle
    this.frames.set(this.step, made)
    if (this.frames.size > 12) {
      const oldest = Math.min(...this.frames.keys())
      this.frames.delete(oldest)
    }
    return made
  }

  frameAt(time: number): Frame {
    const s = Math.max(0, time) * stepHz
    const n = Math.floor(s + 1e-7)
    const alpha = Math.min(1, Math.max(0, s - n))
    let a = this.frames.get(n)
    if (!a) {
      this.goto(n)
      a = this.snap()
    }
    if (alpha < 1e-6) return a
    let b = this.frames.get(n + 1)
    if (!b) {
      this.goto(n + 1)
      b = this.snap()
    }
    return blendFrames(a, b, alpha)
  }

  pageTimeAt(time: number): number {
    return this.o.flow.length === 1 ? time : this.pageTime
  }

  seek(time: number): void {
    this.goto(Math.floor(Math.max(0, time) * stepHz + 1e-7))
  }

  eventsBetween(fromStep: number, toStep: number): StageEvent[] {
    return this.events.filter((e) => e.step >= fromStep && e.step < toStep)
  }

  hash(): string {
    let h = 0x811c9dc5
    const text = JSON.stringify({ page: this.page.save(), cursor: this.cursor.save(), step: this.step, index: this.index, phase: this.phase })
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    return (h >>> 0).toString(16).padStart(8, '0')
  }
}

const NUMBERS = ['x', 'y', 'w', 'h', 'z0', 'z1', 'rot', 'turnX', 'turnY', 'r'] as const

export function blendFrames(a: Frame, b: Frame, t: number): Frame {
  if (a.page !== b.page) return t < 0.5 ? a : b
  const before = new Map<string, Shape>()
  for (const s of a.list) before.set(s.id, s)
  const list = b.list.map((s) => {
    const p = before.get(s.id)
    if (!p) return s
    const out: Shape = { ...s }
    for (const k of NUMBERS) {
      const u = p[k]
      const v = s[k]
      if (typeof u === 'number' && typeof v === 'number' && u !== v) out[k] = u + (v - u) * t
    }
    if (p.v && s.v && p.v.length === s.v.length) out.v = s.v.map((v, i) => p.v![i]! + (v - p.v![i]!) * t)
    return out
  })
  const view = a.view && b.view ? { ...b.view, eye: b.view.eye.map((v, i) => a.view!.eye[i]! + (v - a.view!.eye[i]!) * t) as [number, number, number], target: b.view.target.map((v, i) => a.view!.target[i]! + (v - a.view!.target[i]!) * t) as [number, number, number], fov: a.view.fov + (b.view.fov - a.view.fov) * t } : b.view
  const out: Frame = { list, cursor: blendPose(a.cursor, b.cursor, t), turn: a.turn + (b.turn - a.turn) * t, scroll: a.scroll + (b.scroll - a.scroll) * t, page: b.page, view, time: (a.time ?? 0) + ((b.time ?? 0) - (a.time ?? 0)) * t }
  const settle = a.settle !== undefined && b.settle !== undefined ? a.settle + (b.settle - a.settle) * t : b.settle
  if (settle !== undefined) out.settle = settle
  return out
}

export const liveView = (f: Frame): CameraPose => f.view ?? homePose(f.scroll)

export class ScriptDriver implements Driver {
  readonly name = 'script' as const
  input(v: { pageTime: number; page: PageLogic }): Pointer {
    return v.page.script(v.pageTime)
  }
}

export class MouseDriver implements Driver {
  readonly name = 'mouse' as const
  pointer: Pointer = { x: 960, y: 540, down: false }
  private once: Partial<Pointer> = {}
  private keys: string[] = []
  // What happened between two steps. Keys wait in line, one a step, so two keys pressed within one drawn frame both arrive.
  pulse(p: Partial<Pointer>): void {
    const { key, wheel, ...rest } = p
    if (key !== undefined) this.keys.push(key)
    if (wheel !== undefined) this.once.wheel = (this.once.wheel ?? 0) + wheel
    Object.assign(this.once, rest)
  }
  input(): Pointer {
    const out = { ...this.pointer, ...this.once }
    this.once = {}
    const key = this.keys.shift()
    if (key !== undefined) out.key = key
    return out
  }
}

export class StillDriver implements Driver {
  readonly name = 'script' as const
  constructor(private at: { x: number; y: number }) {}
  input(): Pointer {
    return { x: this.at.x, y: this.at.y, down: false }
  }
}

const UNIT_PAGES: Record<string, FlowEntry[]> = {
  marketing: [{ page: 'marketing' }],
  step1: [{ page: 'step1' }],
  step2: [{ page: 'step2' }],
  pinball: [{ page: 'step3' }],
  boss: [{ page: 'step4' }],
  decision: [{ page: 'step5' }, { page: 'marketing', variant: 'rejected' }]
}

export function filmFlow(unit: string): FlowEntry[] {
  const flow = UNIT_PAGES[unit]
  const entry = config.film.units.find((u) => u.id === unit)
  if (!flow || !entry) throw new Error(`No page called "${unit}"`)
  return flow.map((f, i) => ({ ...f, opens: i === 0, ...(i === flow.length - 1 ? { closes: entry.seconds } : {}) }))
}

export const wholeFilmFlow = (): FlowEntry[] => config.film.units.flatMap((u) => filmFlow(u.id))

export function runBot(pages: Record<string, PageMaker>, bot: BotName, seed: number, flow: FlowEntry[] = liveFlow(), maxSeconds: number = config.live.botMaxSeconds): BotRun {
  const stage = new Stage({ mode: 'live', flow, pages, driver: new BotDriver(bot, seed), seed })
  const limit = Math.round(maxSeconds * stepHz)
  const pageSeconds: Record<string, number> = {}
  let seen = 0
  while (!stage.finished && stage.step < limit) {
    stage.advance(24)
    const name = `${stage.page.id}${seen >= flow.length - 1 ? ' again' : ''}`
    if (stage.entryIndex > seen) seen = stage.entryIndex
    pageSeconds[name] = (pageSeconds[name] ?? 0) + 0.1
  }
  const ignored = stage.longestIgnored
  return {
    bot, seed, finished: stage.finished, seconds: stage.time, ignoredPointer: ignored.pointer, ignoredFlippers: ignored.flippers, gags: stage.gagsReached, pages: stage.pagesVisited, pageSeconds,
    skips: stage.events.filter((e) => e.name === 'skip').length, stuckOn: stage.finished ? null : stage.page.id
  }
}

export const liveFlow = (): FlowEntry[] => [{ page: 'marketing' }, { page: 'step1' }, { page: 'step2' }, { page: 'step3' }, { page: 'step4' }, { page: 'step5' }, { page: 'marketing', variant: 'rejected' }]

export function filmOptions(unit: string): { arrive: boolean; leave: boolean } {
  const units = config.film.units
  const i = units.findIndex((u) => u.id === unit)
  if (i < 0) throw new Error(`No page called "${unit}" in film.units`)
  return { arrive: i > 0, leave: i < units.length - 1 }
}
