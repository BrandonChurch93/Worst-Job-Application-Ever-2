import { openingFrames } from '../src/film/opening'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { filmKeysForEvent, filmKeysForGag, filmLive, filmLineId, liveLineId, liveTriggers, pagelessLive, unitPage } from '../src/audio/cues'
import { LiveDesk, Narrator, type Booking } from '../src/audio/narrator'
import { LIVE } from '../src/audio/levels'

const root = process.cwd()
const read = (...p: string[]) => JSON.parse(readFileSync(path.join(root, ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const gap: number = cfg.audio.liveNarratorMinGapSeconds
const lineGap: number = cfg.audio.lineGapSeconds
const filmWait: number = LIVE.waitSeconds['film']!
const unitOf = (beat: string): string | undefined => cfg.film.beats.find((b: any) => b.id === beat)?.unit
const beatOf = (key: string) => key.slice(0, key.lastIndexOf('.'))
const idOf = (key: string) => filmLineId(beatOf(key), Number(key.slice(key.lastIndexOf('.') + 1)))
const pageOf = (key: string) => unitPage[unitOf(beatOf(key))!]!
const pages = Object.fromEntries(Object.keys(filmLive).map((key) => [idOf(key), pageOf(key)]))
const desk = () => new LiveDesk(new Narrator({ minGap: gap, lineGap, beatLate: LIVE.beatLateSeconds, liveLate: LIVE.liveLateSeconds }), pages)
const film = (key: string, seconds = 3) => ({ id: idOf(key), group: beatOf(key), seconds, wait: filmWait, page: pageOf(key), once: true })
const only = (name: string, index: number, page: string | null, seconds = 2) => ({ id: liveLineId(name, index), group: name, seconds, wait: LIVE.waitSeconds[name] ?? LIVE.liveLateSeconds, page: pagelessLive.includes(name) ? null : page, once: false })

describe('the table of what sets each line of the film off on the live site', () => {
  const spoken: string[] = []
  for (const [beat, list] of Object.entries(narration.film as Record<string, { live?: string }[]>)) list.forEach((_, i) => spoken.push(`${beat}.${i}`))

  it('has one row for every line of the film, and the file gives each line its trigger in words', () => {
    expect(Object.keys(filmLive).sort()).toEqual(spoken.slice().sort())
    for (const [beat, list] of Object.entries(narration.film as Record<string, { live?: string }[]>)) for (const l of list) expect(typeof l.live === 'string' && l.live.length > 0, beat).toBe(true)
    expect(spoken.length).toBe(20)
  })

  it('still needs the beats of the file to be the beats of the config, exactly', () => {
    expect(Object.keys(narration.film).sort()).toEqual(cfg.film.beats.map((b: any) => b.id).sort())
  })

  it('names only events the pages emit, on the page the beat belongs to', () => {
    const src: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name)
        if (f.isDirectory()) {
          if (path.relative(root, p) !== path.join('src', 'audio')) walk(p)
        } else if (f.name.endsWith('.ts')) src.push(readFileSync(p, 'utf8'))
      }
    }
    walk(path.join(root, 'src'))
    const all = src.join('\n')
    for (const [key, t] of Object.entries(filmLive)) {
      expect(unitOf(beatOf(key)), key).toBeDefined()
      expect(unitPage[unitOf(beatOf(key))!], key).toBeDefined()
      if (t.on === 'event') expect(new RegExp(`(emit|say)\\(\\s*'${t.event}'`).test(all) || new RegExp(`'${t.event}'`).test(all), `${key}: ${t.event}`).toBe(true)
    }
    for (const [unit, page] of Object.entries(unitPage)) {
      const file = path.join(root, 'src', 'pages', page, 'index.ts')
      expect(existsSync(file), page).toBe(true)
      expect(new RegExp(`id: '${page}', unit: '${unit}'`).test(readFileSync(file, 'utf8')), `${page} is the page of ${unit}`).toBe(true)
    }
  })

  it('finds the lines of an event only on their own page', () => {
    expect(filmKeysForEvent('slab-drop', 'step1', unitOf)).toEqual(['step1.email.0'])
    expect(filmKeysForEvent('slab-drop', 'step4', unitOf)).toEqual([])
    expect(filmKeysForEvent('step', 'marketing', unitOf)).toEqual(['marketing.stroll.0'])
    expect(filmKeysForEvent('step', 'step2', unitOf)).toEqual([])
    expect(filmKeysForGag('step2.dial')).toEqual(['step2.dial.0'])
    expect(filmKeysForGag('step1.email')).toEqual([])
  })

  it('lists every event that is wanted and does not exist in the needs file', () => {
    const needs = readFileSync(path.join(root, 'pipeline', 'sound', 'NEEDS.md'), 'utf8')
    const standIns = Object.entries(filmLive).filter(([, t]) => t.on === 'gag' && t.standIn)
    expect(standIns.length).toBeGreaterThan(0)
    for (const [key, t] of standIns) {
      expect(needs.includes(`\`${(t as { standIn: string }).standIn}\``), key).toBe(true)
      expect(needs.includes(narration.film[beatOf(key)][0].live), key).toBe(true)
    }
  })

  it('says by number how long each kind of line may wait', () => {
    const keys = Object.keys(narration.liveOnly).filter((k) => Array.isArray(narration.liveOnly[k]))
    expect(Object.keys(liveTriggers).sort()).toEqual(keys.slice().sort())
    for (const k of [...keys, 'film']) {
      expect(typeof LIVE.waitSeconds[k], k).toBe('number')
      expect(LIVE.waitSeconds[k]!, k).toBeGreaterThanOrEqual(0)
    }
    for (const k of pagelessLive) expect(keys).toContain(k)
  })
})

describe('the rules of the live narrator, on a clock of plain numbers', () => {
  it('says a line of the film once in a visit, the first time its trigger happens', () => {
    const d = desk()
    const first = d.ask(10, film('marketing.perks.0'))
    expect(first).toMatchObject({ start: 10, end: 13 })
    expect(d.ask(100, film('marketing.perks.0'))).toBeNull()
    expect(d.ask(1000, film('marketing.perks.0'))).toBeNull()
  })

  it('gives a line one chance: dropped at its first trigger, it is not said at a later one', () => {
    const d = desk()
    d.ask(0, film('step1.firstName.0', 20))
    expect(d.ask(1, film('step1.firstName.1'))).toBeNull()
    expect(d.isSpent(idOf('step1.firstName.1'))).toBe(true)
    expect(d.ask(500, film('step1.firstName.1'))).toBeNull()
  })

  it('makes a trigger during a line wait for the end of the line and the gap', () => {
    const d = desk()
    const a = d.ask(0, film('step1.firstName.0', 2))!
    const b = d.ask(1, film('step1.firstName.1', 2))!
    expect(a).toMatchObject({ start: 0, end: 2 })
    expect(b.start).toBeCloseTo(2 + gap, 9)
    expect(b.start - a.end).toBeGreaterThanOrEqual(gap)
  })

  it('makes a trigger inside the gap wait for the rest of the gap', () => {
    const d = desk()
    d.ask(0, film('step1.firstName.0', 2))
    const b = d.ask(2 + gap / 2, film('step1.firstName.1', 2))!
    expect(b.start).toBeCloseTo(2 + gap, 9)
  })

  it('plays a trigger at once when nothing was said for the gap', () => {
    const d = desk()
    d.ask(0, film('step1.firstName.0', 2))
    expect(d.ask(2 + gap, film('step1.firstName.1', 2))!.start).toBe(2 + gap)
  })

  it('drops a line of the film that would start more than its wait after its trigger, and keeps one that would start just inside it', () => {
    const late = desk()
    late.ask(0, film('marketing.stroll.0', filmWait))
    expect(late.ask(gap - 0.01, film('marketing.perks.0'))).toBeNull()
    const inside = desk()
    inside.ask(0, film('marketing.stroll.0', filmWait))
    const b = inside.ask(gap + 0.01, film('marketing.perks.0'))!
    expect(b.start - (gap + 0.01)).toBeLessThanOrEqual(filmWait)
    expect(b.start).toBeCloseTo(filmWait + gap, 9)
  })

  it('drops each live line by its own number', () => {
    for (const name of Object.keys(liveTriggers)) {
      const wait = LIVE.waitSeconds[name]!
      const late = desk()
      late.ask(0, film('marketing.stroll.0', 5))
      expect(late.ask(5 + gap - wait - 0.01, only(name, 0, 'marketing')), `${name} late`).toBeNull()
      const inside = desk()
      inside.ask(0, film('marketing.stroll.0', 5))
      const b = inside.ask(5 + gap - wait + 0.01, only(name, 0, 'marketing'))
      expect(b, `${name} inside`).not.toBeNull()
      expect(b!.start).toBeCloseTo(5 + gap, 9)
    }
  })

  it('takes a waiting line back when its page is left, and lets a line that has begun run to its end', () => {
    const d = desk()
    const a = d.ask(0, film('step1.firstName.0', 3))!
    const b = d.ask(1, film('step1.firstName.1', 3))!
    expect(b.start).toBeGreaterThan(2)
    const back = d.leave(2, 'step1')
    expect(back).toEqual([b])
    expect(d.narrator.bookings(2).map((x) => x.id)).toEqual([a.id])
    expect(d.narrator.speaking(2)!.id).toBe(a.id)
  })

  it('never says the lines of a page that was left, by a skip or by its end', () => {
    const d = desk()
    d.at(0, 'step1')
    d.leave(5, 'step1')
    for (const key of Object.keys(filmLive).filter((k) => pageOf(k) === 'step1')) expect(d.ask(100, film(key)), key).toBeNull()
    expect(d.ask(100, film('step2.dial.0'))).not.toBeNull()
  })

  it('leaves the old page when the stage is on a new one', () => {
    const d = desk()
    d.at(0, 'marketing')
    d.ask(0, film('marketing.stroll.0', 3))
    const waiting = d.ask(1, film('marketing.perks.0', 3))!
    expect(d.at(2, 'marketing')).toEqual([])
    expect(d.at(2.5, 'step1')).toEqual([waiting])
    expect(d.page).toBe('step1')
  })

  it('keeps a line that belongs to no page through a page turn', () => {
    const d = desk()
    d.at(0, 'step1')
    d.ask(0, film('step1.firstName.0', 2))
    const asked = 2 + gap - LIVE.waitSeconds['skip']! + 0.5
    const skip = d.ask(asked, only('skip', 0, 'step1'))!
    expect(skip.start).toBeCloseTo(2 + gap, 9)
    expect(d.leave(asked + 0.1, 'step1')).toEqual([])
    expect(d.narrator.bookings(asked + 0.1).map((x) => x.id)).toContain(skip.id)
  })

  it('never lets two lines overlap or come closer than the gap, whatever is asked and whenever', () => {
    const d = desk()
    const keys = Object.keys(filmLive)
    const names = Object.keys(liveTriggers)
    const all: Booking[] = []
    let seed = 12345
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    let now = 0
    for (let i = 0; i < 4000; i++) {
      now += next() * 3
      const r = next()
      let b: Booking | null = null
      if (r < 0.4) b = d.ask(now, film(keys[Math.floor(next() * keys.length)]!, 1 + next() * 8))
      else if (r < 0.9) b = d.ask(now, only(names[Math.floor(next() * names.length)]!, 0, 'step1', 0.5 + next() * 6))
      else for (const x of d.leave(now, ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5'][Math.floor(next() * 6)]!)) all.splice(all.indexOf(x), 1)
      if (b) {
        expect(b.start).toBeGreaterThanOrEqual(now)
        all.push(b)
      }
    }
    all.sort((a, b) => a.start - b.start)
    expect(all.length).toBeGreaterThan(50)
    for (let i = 1; i < all.length; i++) expect(all[i]!.start - all[i - 1]!.end).toBeGreaterThanOrEqual(gap - 1e-9)
  })
})

class Param {
  value = 1
  setValueAtTime(v: number) { this.value = v }
  linearRampToValueAtTime(v: number) { this.value = v }
  cancelScheduledValues() { return undefined }
}
class Node {
  to: Node | null = null
  connect(n: Node) { this.to = n }
}
class Gain extends Node { gain = new Param() }
class Panner extends Node { pan = new Param() }
class Source extends Node {
  buffer: { id: string } | null = null
  loop = false
  playbackRate = new Param()
  started: number | null = null
  stopped: number | null = null
  onended: (() => void) | null = null
  start(t: number) { this.started = t }
  stop(t: number) { this.stopped = t }
}
let made: FakeContext[] = []
class FakeContext {
  currentTime = 0
  state = 'suspended'
  destination = new Node()
  sources: Source[] = []
  constructor() { made.push(this) }
  resume() { this.state = 'running'; return Promise.resolve() }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  close() { return Promise.resolve() }
  createGain() { return new Gain() }
  createStereoPanner() { return new Panner() }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    const id = new TextDecoder().decode(new Uint8Array(bytes))
    ok({ id, numberOfChannels: id === 'room-tone' ? 2 : 1 })
    return Promise.resolve()
  }
}

const LINE = 2
function site(): { index: SoundIndex; files: Map<string, Uint8Array> } {
  const enc = new TextEncoder()
  const ids = Object.keys(filmLive).map(idOf)
  for (const [name, list] of Object.entries(narration.liveOnly as Record<string, unknown>)) if (Array.isArray(list)) list.forEach((_, i) => ids.push(liveLineId(name, i)))
  const pack = enc.encode('step.1')
  const index: SoundIndex = {
    version: 1, pack: { file: 'sfx.bin', bytes: pack.length }, sfx: [{ id: 'step.1', at: 0, bytes: pack.length, seconds: 0.2, mime: 'audio/flac' }],
    loops: [{ id: 'room-tone', file: 'room-tone.flac', seconds: 8, mime: 'audio/flac' }],
    lines: ids.map((id) => ({ id, file: `${id}.mp3`, seconds: LINE, mime: 'audio/mpeg' }))
  }
  const files = new Map<string, Uint8Array>([['sfx.bin', pack]])
  for (const f of [...index.loops, ...index.lines]) files.set(f.file, enc.encode(f.id))
  return { index, files }
}

describe('the live narrator inside the sound engine, on a fake clock', () => {
  let errors: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    made = []
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
    errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    errors.mockRestore()
  })
  const ready = async () => {
    const s0 = site()
    vi.stubGlobal('fetch', async (url: string) => {
      const bytes = s0.files.get(url.replace('./audio/', ''))
      if (!bytes) return { ok: false, status: 404 }
      return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
    })
    const s = makeSound({ base: './audio/', index: s0.index })
    await s.unlock()
    return { s, ctx: made[0]! }
  }
  const ev = (name: string, page: string, hitsCursor = false) => ({ name, step: 0, page, x: 960, y: 540, hitsCursor })
  const said = (ctx: FakeContext) => ctx.sources.filter((x) => x.buffer?.id.startsWith('line.') && x.stopped === null).map((x) => x.buffer!.id)
  const source = (ctx: FakeContext, id: string) => ctx.sources.filter((x) => x.buffer?.id === id)
  const far = LINE + gap + 0.5

  it('says each line of the film at its own event, once, and not at the start of its beat', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.beat('marketing.stroll', 'live')
    s.beat('marketing.perks', 'live')
    expect(said(ctx)).toEqual([])
    s.event(ev('step', 'marketing'), 'live')
    expect(said(ctx)).toEqual(['line.marketing.stroll.0'])
    expect(source(ctx, 'line.marketing.stroll.0')[0]!.started).toBe(10)
    ctx.currentTime += far
    s.event(ev('step', 'marketing'), 'live')
    s.event(ev('card-flip', 'marketing'), 'live')
    ctx.currentTime += far
    s.event(ev('card-flip', 'marketing'), 'live')
    expect(said(ctx)).toEqual(['line.marketing.stroll.0', 'line.marketing.perks.0'])
  })

  it('says the line of a row of step 2 when the stage reports its beat, and the others only at their events', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('row-open', 'step2'), 'live')
    expect(said(ctx)).toEqual([])
    s.beat('step2.dial', 'live')
    expect(said(ctx)).toEqual(['line.step2.dial.0'])
    ctx.currentTime += far
    s.beat('step2.dial', 'live')
    s.beat('step2.slot', 'live')
    expect(said(ctx)).toEqual(['line.step2.dial.0'])
    s.beat('step2.crank', 'live')
    expect(said(ctx)).toEqual(['line.step2.dial.0', 'line.step2.crank.0'])
  })

  it('goes through all twenty lines of the film in a visit that sets every trigger off, each once', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    for (const round of [0, 1]) {
      for (const [key, t] of Object.entries(filmLive)) {
        ctx.currentTime += far
        if (t.on === 'event') s.event(ev(t.event, pageOf(key)), 'live')
        else s.beat(beatOf(key), 'live')
      }
      expect(said(ctx).filter((id) => !id.startsWith('line.live.')), `round ${round}`).toEqual(Object.keys(filmLive).map(idOf))
    }
  })

  it('makes a line whose trigger comes during another line start after it and the gap, on the sound clock', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 20
    s.event(ev('keyboard-rise', 'step1'), 'live')
    ctx.currentTime = 21
    s.event(ev('arms-out', 'step1'), 'live')
    expect(source(ctx, 'line.step1.firstName.0')[0]!.started).toBe(20)
    expect(source(ctx, 'line.step1.tug.0')[0]!.started).toBeCloseTo(20 + LINE + gap, 9)
    expect(source(ctx, 'line.step1.firstName.0')[0]!.stopped).toBeNull()
  })

  it('takes the waiting line back at a skip, and says none of that page afterwards', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 20
    s.event(ev('keyboard-rise', 'step1'), 'live')
    ctx.currentTime = 21
    s.event(ev('arms-out', 'step1'), 'live')
    ctx.currentTime = 20 + LINE + gap - LIVE.waitSeconds['skip']! + 0.5
    s.event(ev('skip', 'step1'), 'live')
    expect(source(ctx, 'line.step1.tug.0')[0]!.stopped).not.toBeNull()
    expect(source(ctx, 'line.step1.firstName.0')[0]!.stopped).toBeNull()
    s.event(ev('page-turn', 'step1'), 'live')
    ctx.currentTime += 60
    s.event(ev('bolt-hit-cursor', 'step1', false), 'live')
    s.event(ev('slab-drop', 'step1'), 'live')
    s.event(ev('arms-out', 'step1'), 'live')
    expect(said(ctx).filter((id) => id.startsWith('line.step1.'))).toEqual(['line.step1.firstName.0'])
    expect(source(ctx, 'line.live.skip.0').length).toBe(1)
    expect(source(ctx, 'line.live.skip.0')[0]!.stopped).toBeNull()
    expect(source(ctx, 'line.live.skip.0')[0]!.started).toBeCloseTo(20 + LINE + gap, 9)
  })

  it('takes the waiting line back when the page turns', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 20
    s.event(ev('ball-seal', 'step3'), 'live')
    ctx.currentTime = 21
    s.event(ev('plunger', 'step3'), 'live')
    expect(source(ctx, 'line.pinball.launch.0')[0]!.stopped).toBeNull()
    ctx.currentTime = 22
    s.event(ev('checkbox', 'step4'), 'live')
    expect(source(ctx, 'line.pinball.launch.0')[0]!.stopped).not.toBeNull()
    expect(source(ctx, 'line.boss.verify.0')[0]!.started).toBeCloseTo(20 + LINE + gap, 9)
  })

  it('drops the line whose start would be later than its wait', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 20
    s.event(ev('keyboard-rise', 'step1'), 'live')
    ctx.currentTime = 20.5
    s.event(ev('bolt-hit-cursor', 'step1', true), 'live')
    ctx.currentTime = 21
    s.event(ev('slab-drop', 'step1'), 'live')
    expect(source(ctx, 'line.step1.firstName.1')[0]!.started).toBeCloseTo(20 + LINE + gap, 9)
    expect(20 + LINE + gap + LINE + gap - 21).toBeGreaterThan(filmWait)
    expect(source(ctx, 'line.step1.email.0').length).toBe(0)
    expect(source(ctx, 'line.live.hit.0').length).toBe(0)
    ctx.currentTime = 200
    s.event(ev('slab-drop', 'step1'), 'live')
    expect(source(ctx, 'line.step1.email.0').length).toBe(0)
  })

  it('says the lines only the live site has in the order of the file, round and round', async () => {
    const { s, ctx } = await ready()
    const hits = (narration.liveOnly.hit as string[]).length
    ctx.currentTime = 50
    for (let i = 0; i < hits + 2; i++) {
      s.event(ev('bolt-hit', 'step1', true), 'live')
      ctx.currentTime += far
    }
    expect(said(ctx)).toEqual(Array.from({ length: hits + 2 }, (_, i) => liveLineId('hit', i % hits)))
  })

  it('says the line of the visitor who would rather watch only over the opening of the film, where it ends before the first line', async () => {
    const lineGap: number = cfg.audio.lineGapSeconds
    const opening = openingFrames() / cfg.film.fps
    const room = opening - LINE - lineGap
    expect(room).toBeGreaterThan(0)
    const a = await ready()
    a.ctx.currentTime = 20
    a.s.stop()
    a.s.opening(0, 0)
    a.s.start()
    a.s.trigger('watchFilm')
    expect(said(a.ctx)).toEqual([liveLineId('watchFilm', 0)])
    expect(source(a.ctx, liveLineId('watchFilm', 0))[0]!.started).toBe(20)
  })

  it('does not say it where it would not end before the first line of the film', async () => {
    const room = openingFrames() / cfg.film.fps - LINE - cfg.audio.lineGapSeconds
    const late = await ready()
    late.ctx.currentTime = 20
    late.s.stop()
    late.s.opening(0, room + 0.01)
    late.s.start()
    late.s.trigger('watchFilm')
    expect(said(late.ctx)).toEqual([])
  })

  it('does not say it where the film has no opening, and the first line of the film starts at its time', async () => {
    const none = await ready()
    none.ctx.currentTime = 20
    none.s.stop()
    none.s.start()
    none.s.trigger('watchFilm')
    expect(said(none.ctx)).toEqual([])
    none.s.beat('marketing.stroll', 'film')
    expect(source(none.ctx, 'line.marketing.stroll.0')[0]!.started).toBeCloseTo(20 + narration.film['marketing.stroll'][0].at * 2, 9)
  })

  it('says the button is winning once, at the first event of a fight that has lasted longer than the fight of the film', async () => {
    const beat = (id: string) => cfg.film.beats.find((x: any) => x.id === id)
    const fight = beat('boss.collapse').from - beat('boss.unfold').from
    expect(fight).toBeGreaterThan(0)
    const id = liveLineId('boss.slow', 0)
    const { s, ctx } = await ready()
    ctx.currentTime = 100
    s.event(ev('unfold', 'step4'), 'live')
    ctx.currentTime = 100 + fight - 0.01
    s.event(ev('slab-drop', 'step4'), 'live')
    expect(source(ctx, id).length).toBe(0)
    ctx.currentTime = 100 + fight
    s.event(ev('slab-drop', 'step4'), 'live')
    expect(source(ctx, id).map((x) => x.started)).toEqual([100 + fight])
    ctx.currentTime += far + fight
    s.event(ev('slab-drop', 'step4'), 'live')
    expect(source(ctx, id).length).toBe(1)
  })

  it.each(['power-down', 'skip', 'page-turn'])('does not say the button is winning when the fight ends in time by %s', async (end) => {
    const beat = (id: string) => cfg.film.beats.find((x: any) => x.id === id)
    const fight = beat('boss.collapse').from - beat('boss.unfold').from
    const { s, ctx } = await ready()
    ctx.currentTime = 100
    s.event(ev('unfold', 'step4'), 'live')
    ctx.currentTime = 100 + fight - 1
    s.event(ev(end, 'step4'), 'live')
    ctx.currentTime = 100 + fight + 1
    s.event(ev('slab-drop', 'step4'), 'live')
    expect(source(ctx, liveLineId('boss.slow', 0)).length).toBe(0)
  })

  it('leaves the button is winning to the page once the page reports it itself', async () => {
    const beat = (id: string) => cfg.film.beats.find((x: any) => x.id === id)
    const fight = beat('boss.collapse').from - beat('boss.unfold').from
    const id = liveLineId('boss.slow', 0)
    const { s, ctx } = await ready()
    ctx.currentTime = 100
    s.event(ev('unfold', 'step4'), 'live')
    ctx.currentTime = 110
    s.event(ev('boss-slow', 'step4'), 'live')
    expect(source(ctx, id).map((x) => x.started)).toEqual([110])
    ctx.currentTime = 100 + fight + far
    s.event(ev('slab-drop', 'step4'), 'live')
    expect(source(ctx, id).length).toBe(1)
  })

  it('leaves the film as it was: its lines are placed by their beats and events set none off', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('step', 'marketing'), 'film')
    s.event(ev('card-flip', 'marketing'), 'film')
    expect(said(ctx)).toEqual([])
    const b = cfg.film.beats.find((x: any) => x.id === 'marketing.perks')
    s.beat('marketing.perks', 'film')
    expect(source(ctx, 'line.marketing.perks.0')[0]!.started).toBeCloseTo(10 + narration.film['marketing.perks'][0].at * (b.to - b.from), 9)
    ctx.currentTime += 60
    s.beat('marketing.perks', 'film')
    expect(source(ctx, 'line.marketing.perks.0').length).toBe(2)
  })
})
