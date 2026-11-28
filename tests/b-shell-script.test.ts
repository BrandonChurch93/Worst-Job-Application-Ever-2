import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { cueOfEvent, liveTriggers, markStandsFor, quietPage, spoken, spokenKeysFor, unitPage } from '../src/audio/cues'
import { LIVE } from '../src/audio/levels'
import { CAPTION, shoutPx, shoutShake } from '../src/ui/said'
import { builtTo, draftFilm, filmCaptions, keyPage, phraseStart, phrasesOf, shippedLines, standIns, wordCount } from '../src/audio/standin'
import { ScriptDriver, Stage, wholeFilmFlow } from '../src/stage/stage'
import { pages } from '../src/pages'
import { mixFilm, scriptStandIns } from '../src/audio/mix'

const read = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const gap: number = cfg.audio.liveNarratorMinGapSeconds
const lineGap: number = cfg.audio.lineGapSeconds
const wps: number = cfg.audio.narratorMaxWordsPerSecond
const mark: string = narration.pauseMark

class Param {
  value = 1
  setValueAtTime(v: number) { this.value = v }
  linearRampToValueAtTime(v: number) { this.value = v }
  cancelScheduledValues() { return }
}
class Node { connect() { return } }
class Gain extends Node { gain = new Param() }
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
  createStereoPanner() { return Object.assign(new Node(), { pan: new Param() }) }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    ok({ id: new TextDecoder().decode(new Uint8Array(bytes)), numberOfChannels: 1 })
    return Promise.resolve()
  }
}

// Ten lines of eight words each, so each lasts eight words at the config's pace. The words stand for the script; the engine is given them in place of the files.
const eight = (a: string) => `${a} one two ${mark} three four five ${mark} six seven`
const film = Object.fromEntries(['marketing.stroll', 'step1.firstName', 'step1.shredded', 'pinball.seal', 'boss.verify', 'decision.letter'].map((b) => [b, [{ at: 0, text: eight(b) }]]))
film['step2.crank'] = [{ at: 0, text: eight('crank') }, { at: 0.5, text: eight('top') }]
// The first part of line 7 has two sentences: its second phrase ends the first.
const sentences = (a: string) => `${a} one two ${mark} three four five. ${mark} six seven.`
film['boss.unfold'] = [{ at: 0, text: sentences('beaten') }, { at: 0.5, text: eight('loans') }, { at: 0.8, text: eight('ready') }]
const shout = { seconds: 6, starts: [0.5, 1.5, 3] }
const drafts = { 'decision.reset': [{ at: 0, text: eight('next') }], 'boss.finish': [{ at: 0, text: `ka ${mark} me ${mark} ha`, loud: true, standIn: shout }] }
const L = 8 / wps
const id = (key: string) => `line.${key}`

const CUES = ['button-press', 'checkbox', 'step.1']
function site(): { index: SoundIndex; files: Map<string, Uint8Array> } {
  const enc = new TextEncoder()
  const parts = CUES.map((c) => enc.encode(c))
  const pack = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  const sfx: SoundIndex['sfx'] = []
  let at = 0
  parts.forEach((p, i) => {
    pack.set(p, at)
    sfx.push({ id: CUES[i]!, at, bytes: p.length, seconds: 0.2, mime: 'audio/flac' })
    at += p.length
  })
  const index: SoundIndex = {
    version: 1, pack: { file: 'sfx.bin', bytes: pack.length }, sfx,
    loops: ['room-tone', 'boss-loop'].map((x) => ({ id: x, file: `${x}.flac`, seconds: 8, mime: 'audio/flac' })),
    lines: Object.keys(spoken).map((key) => ({ id: id(key), file: `${id(key)}.mp3`, seconds: 2, mime: 'audio/mpeg' }))
  }
  const files = new Map<string, Uint8Array>([['sfx.bin', pack]])
  for (const f of [...index.loops, ...index.lines]) files.set(f.file, enc.encode(f.id))
  return { index, files }
}

let fetched: string[] = []
let hold: Promise<void> | null = null
beforeEach(() => {
  made = []
  fetched = []
  hold = null
  vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
})
afterEach(() => vi.unstubAllGlobals())

const make = () => {
  const s0 = site()
  vi.stubGlobal('fetch', async (url: string) => {
    const name = url.replace('./audio/', '')
    fetched.push(name)
    if (hold) await hold
    const bytes = s0.files.get(name)
    if (!bytes) return { ok: false, status: 404 }
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
  return makeSound({ base: './audio/', index: s0.index, script: { film, drafts } })
}
// A site whose sound is allowed while the visitor is already on a page: the unlock is over before the first event.
const ready = async (page: string | null = null) => {
  const s = make()
  if (page !== null) s.page(page)
  await s.unlock()
  return { s, ctx: made[made.length - 1]! }
}
const ev = (name: string, page: string) => ({ name, step: 0, page, x: 960, y: 540, hitsCursor: false })
type Api = ReturnType<typeof make>
const near = (v: number) => Number(v.toFixed(3))
const W = LIVE.openingWaitSeconds
const booked = (s: Api) => s.log().filter((e) => e.what === 'spoken').map((e) => [e.line, e.start])
const back = (s: Api) => s.log().filter((e) => e.what === 'taken back').map((e) => e.line)
const linesAt = (s: Api) => [...new Set(s.said().lines.map((l) => l.line))]
const loops = (ctx: FakeContext, name: string) => ctx.sources.filter((x) => x.buffer?.id === name)

describe('change note 003: the table of the script', () => {
  it('has the spoken moments of the script in twelve lines and the shout of the boss, each on its event, and no line that only the live site has', () => {
    expect(Object.fromEntries(Object.entries(spoken).map(([k, r]) => [k, r.event]))).toEqual({
      'marketing.stroll.0': null, 'step1.firstName.0': 'candidate-sensed', 'step1.shredded.0': 'resume-received', 'step2.crank.0': 'volume-sign', 'step2.crank.1': 'crank-full',
      'pinball.seal.0': 'vacuum-on', 'boss.verify.0': 'checkbox', 'boss.unfold.0': 'boss-formed', 'boss.unfold.1': null, 'boss.unfold.2': null, 'boss.finish.0': 'finish-arms', 'decision.letter.0': 'stamp', 'decision.reset.0': 'page-turn'
    })
    expect(liveTriggers).toEqual({})
    for (const key of Object.keys(spoken)) expect(Object.values(unitPage), key).toContain(keyPage(key))
    expect(keyPage('marketing.stroll.0')).toBe(quietPage)
    expect(spoken['boss.unfold.1']!.after).toBe('boss.unfold.0')
    expect(spoken['boss.unfold.2']!.after).toBe('boss.unfold.1')
    expect(spoken['boss.unfold.0']!.jump).toEqual(['boss-turn'])
    expect(spoken['decision.reset.0']!.keeps).toBe(true)
    expect(keyPage('decision.reset.0')).toBe('step5')
    expect(Object.values(spoken).filter((r) => r.event === null && r.after === undefined).length).toBe(1)
  })

  it('sets a line off by its event on its own page only', () => {
    expect(spokenKeysFor('checkbox', 'step4')).toEqual(['boss.verify.0'])
    expect(spokenKeysFor('checkbox', 'step2')).toEqual([])
    expect(spokenKeysFor('stamp', 'step5')).toEqual(['decision.letter.0'])
    expect(spokenKeysFor('stamp', 'step1')).toEqual([])
    expect(spokenKeysFor('turret-rise', 'step1')).toEqual([])
  })

  it('names the moment the fight music comes in: the last phrase of the second part of line 7, with a cue, and the event of the stage that stands for it', () => {
    expect(spoken['boss.unfold.1']!.mark).toEqual({ phrase: -1, event: 'music-in' })
    expect(cueOfEvent('music-in')).toBe('boss-loop')
    expect(cueOfEvent('boss-music')).toBe('boss-loop')
    expect(markStandsFor['boss-music']).toBe('music-in')
    expect(cueOfEvent('unfold')).toBe('unfold')
  })
})

describe('change note 003: a line is a silent stand-in with its caption', () => {
  it('lasts its words divided by audio.narratorMaxWordsPerSecond, and shows each phrase for its share of the words', () => {
    const p = phrasesOf(`Ahh. ${mark} Here we have ${mark} another job applicant.`, mark, wps)
    expect(p.map((x) => x.words)).toEqual(['Ahh.', 'Here we have', 'another job applicant.'])
    expect(p.map((x) => [x.from, x.to])).toEqual([[0, 1 / wps], [1 / wps, 4 / wps], [4 / wps, 7 / wps]])
    expect(wordCount('  two   words ')).toBe(2)
    const all = standIns(film, drafts)
    expect([...all.keys()]).toEqual(Object.keys(spoken))
    for (const l of all.values()) {
      if (spoken[l.key]!.steps) continue
      expect(l.seconds, l.key).toBeCloseTo(wordCount(l.words) / wps, 12)
      expect(l.words.includes(mark), l.key).toBe(false)
      expect(l.phrases[0]!.from).toBe(0)
      for (let i = 1; i < l.phrases.length; i++) expect(l.phrases[i]!.from).toBe(l.phrases[i - 1]!.to)
      expect(l.phrases[l.phrases.length - 1]!.to).toBe(l.seconds)
    }
    expect(phraseStart(all.get('boss.unfold.1')!, -1)).toBeCloseTo(6 / wps, 12)
  })

  it('marks as a draft every line that comes from the drafts file and no other', () => {
    const all = standIns(film, drafts)
    expect([...all.values()].filter((l) => l.draft).map((l) => l.key)).toEqual(['boss.finish.0', 'decision.reset.0'])
    const real = standIns()
    const settled = narration.film as Record<string, unknown[]>
    for (const l of real.values()) expect(l.draft, l.key).toBe(settled[l.beat]?.[l.index] === undefined)
    for (const l of real.values()) if (l.draft) expect(draftFilm()[l.beat]?.[l.index]?.text, l.key).toBe(l.text)
  })

  it('fetches and plays no take of any line, and holds the effects down under none', async () => {
    const { s, ctx } = await ready('step4')
    expect(fetched.filter((f) => f.startsWith('line.'))).toEqual([])
    ctx.currentTime = 10
    s.event(ev('checkbox', 'step4'), 'live')
    expect(booked(s)).toEqual([[id('boss.verify.0'), 10]])
    expect(ctx.sources.filter((x) => x.buffer?.id.startsWith('line.'))).toEqual([])
    expect(LIVE.standInDucks).toBe(false)
  })

  it('gives the caption one phrase at a time, from the start of the line to its end, and says which line is a draft', async () => {
    const { s, ctx } = await ready('step5')
    ctx.currentTime = 20
    s.event(ev('page-turn', 'step5'), 'live')
    const said = s.said()
    expect(said.lines.map((l) => l.id)).toEqual([0, 1, 2].map((k) => `${id('decision.reset.0')}#${k}`))
    expect(said.lines.map((l) => l.words)).toEqual(['next one two', 'three four five', 'six seven'])
    expect(said.lines.map((l) => l.start)).toEqual([20, 20 + 3 / wps, 20 + 6 / wps])
    expect(said.lines[2]!.end).toBeCloseTo(20 + L, 12)
    expect(said.lines.every((l) => l.draft && !l.loud && l.line === id('decision.reset.0'))).toBe(true)
    ctx.currentTime = 20 + L + 0.01
    expect(s.said().lines).toEqual([])
  })
})

describe('change note 003: line 1, the moment sound is allowed on the careers page', () => {
  it('says nothing before the first click or key press, and line 1 a moment after the unlock is over with the careers page at rest on screen', async () => {
    const s = make()
    s.page('marketing')
    s.event(ev('step', 'marketing'), 'live')
    expect(made.length).toBe(0)
    expect(s.said().lines).toEqual([])
    await s.unlock()
    expect(booked(s)).toEqual([[id('marketing.stroll.0'), W]])
    made[0]!.currentTime = W + 0.01
    expect(linesAt(s)).toEqual([id('marketing.stroll.0')])
  })

  it('says no line 1 on a visit whose first press is the Apply button, whether the press is seen before the sound is loaded or just after, and not later in that visit', async () => {
    const s = make()
    s.page('marketing')
    let open = () => undefined as void
    hold = new Promise<void>((done) => { open = done })
    const unlocked = s.unlock()
    s.event(ev('button-press', 'marketing'), 'live')
    open()
    await unlocked
    expect(booked(s)).toEqual([])
    s.event(ev('step', 'marketing'), 'live')
    expect(booked(s)).toEqual([])
    const late = await ready('marketing')
    expect(booked(late.s)).toEqual([[id('marketing.stroll.0'), W]])
    late.ctx.currentTime = W / 2
    late.s.event(ev('button-press', 'marketing'), 'live')
    expect(back(late.s)).toEqual([id('marketing.stroll.0')])
    late.ctx.currentTime = 5
    late.s.event(ev('page-turn', 'marketing'), 'live')
    late.s.page('step1')
    late.s.page('marketing')
    late.ctx.currentTime = 50
    late.s.event(ev('step', 'marketing'), 'live')
    expect(booked(late.s).length).toBe(1)
    expect(late.s.said().lines).toEqual([])
  })

  it('ends line 1 over LIVE.openingFadeSeconds when Apply is pressed while it is being said, and takes nothing back', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 1
    s.event(ev('button-press', 'marketing'), 'live')
    expect(linesAt(s)).toEqual([id('marketing.stroll.0')])
    expect(Math.max(...s.said().lines.map((l) => l.end))).toBeCloseTo(1 + LIVE.openingFadeSeconds, 9)
    s.event(ev('page-turn', 'marketing'), 'live')
    s.page('step1')
    ctx.currentTime = 2
    s.event(ev('keyboard-rise', 'step1'), 'live')
    expect(back(s)).toEqual([])
    expect(linesAt(s)).toEqual([])
    expect(s.log().filter((e) => e.what === 'cut').map((e) => e.line)).toEqual([id('marketing.stroll.0')])
  })

  it('says no line 1 when the site is opened on a later step', async () => {
    const { s } = await ready('step3')
    expect(booked(s)).toEqual([])
  })

  it('says the line of the turn back to the start on that turn: line 8, still being said, goes out over the voice fade, line 9 follows after the gap and is kept through the turn, and nothing else is said on the restart: line 1 is said once a visit', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 100
    s.event(ev('page-turn', 'marketing'), 'live')
    s.page('step5')
    s.event(ev('stamp', 'step5'), 'live')
    ctx.currentTime = 102
    s.event(ev('page-turn', 'step5'), 'live')
    s.page('marketing')
    expect(booked(s).slice(1)).toEqual([[id('decision.letter.0'), 100], [id('decision.reset.0'), 102 + LIVE.voiceFadeSeconds + gap]])
    expect(s.log().filter((e) => e.what === 'cut').map((e) => [e.line, e.seconds])).toEqual([[id('decision.letter.0'), 2 + LIVE.voiceFadeSeconds]])
    expect(back(s)).toEqual([])
    ctx.currentTime = 300
    s.event(ev('step', 'marketing'), 'live')
    s.event(ev('page-turn', 'marketing'), 'live')
    s.page('step5')
    ctx.currentTime = 310
    s.event(ev('page-turn', 'step5'), 'live')
    s.page('marketing')
    expect(booked(s).slice(3)).toEqual([[id('decision.reset.0'), 310]])
    expect(booked(s).filter(([line]) => line === id('marketing.stroll.0')).length).toBe(1)
  })
})

describe('change note 003: no line talks over another', () => {
  it('makes a line whose event comes while another is spoken wait for its end and the gap, and says it then if its moment still stands', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 4
    s.event(ev('page-turn', 'marketing'), 'live')
    ctx.currentTime = 4.5
    s.event(ev('candidate-sensed', 'step1'), 'live')
    // Line 1 belongs to the careers page (ruling of 03:02Z): the turn ends it over LIVE.openingFadeSeconds, and line 2 waits for that end and the gap.
    const after = 4 + LIVE.openingFadeSeconds + gap
    expect(booked(s)).toEqual([[id('marketing.stroll.0'), W], [id('step1.firstName.0'), near(after)]])
    ctx.currentTime = after + 0.1
    expect(linesAt(s)).toEqual([id('step1.firstName.0')])
    expect(back(s)).toEqual([])
    s.event(ev('field-done', 'step1'), 'live')
    expect(back(s)).toEqual([])
    expect(linesAt(s)).toEqual([id('step1.firstName.0')])
  })

  it('drops the waiting line when its moment ends first: the event that ends it, a turn of its page or a skip', async () => {
    for (const end of ['field-done', 'page-turn', 'skip']) {
      const { s, ctx } = await ready('marketing')
      ctx.currentTime = 4
      s.event(ev('page-turn', 'marketing'), 'live')
      ctx.currentTime = 4.1
      s.event(ev('candidate-sensed', 'step1'), 'live')
      ctx.currentTime = 4 + LIVE.openingFadeSeconds + gap - 0.05
      s.event(ev(end, 'step1'), 'live')
      expect(back(s), end).toEqual([id('step1.firstName.0')])
      ctx.currentTime = L + gap + 0.1
      expect(s.said().lines, end).toEqual([])
      s.event(ev('candidate-sensed', 'step1'), 'live')
      expect(booked(s).length, end).toBe(2)
    }
  })

  it('says each line once in a run, however often its event comes, and never two at a time over a storm of every event', async () => {
    const { s, ctx } = await ready('marketing')
    const names = [...new Set(Object.values(spoken).flatMap((r) => (r.event ? [r.event] : [])))]
    const pages = ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']
    let t = 0
    for (const page of pages) {
      for (let n = 0; n < 40; n++) {
        t += 0.7
        ctx.currentTime = t
        for (const name of names) s.event(ev(name, page), 'live')
      }
      t += 0.7
      ctx.currentTime = t
      s.event(ev('page-turn', page), 'live')
    }
    const gone = new Set(s.log().filter((e) => e.what === 'taken back').map((e) => `${e.line}@${e.start}`))
    const heard = s.log().filter((e) => e.what === 'spoken' && !gone.has(`${e.line}@${e.start}`)).sort((a, b) => a.start! - b.start!)
    expect(new Set(heard.map((e) => e.line)).size).toBe(heard.length)
    expect(heard.length).toBeGreaterThanOrEqual(6)
    // A line that was cut lasts what its cut says: line 8 is, when the careers page comes while it is said.
    const cut = new Map(s.log().filter((e) => e.what === 'cut').map((e) => [`${e.line}@${e.start}`, e.seconds!]))
    for (let i = 1; i < heard.length; i++) {
      const parts = heard[i]!.line === id('boss.unfold.1') || heard[i]!.line === id('boss.unfold.2')
      const before = heard[i - 1]!
      expect(heard[i]!.start! - (before.start! + (cut.get(`${before.line}@${before.start}`) ?? before.seconds!)), heard[i]!.line).toBeGreaterThanOrEqual((parts ? lineGap : gap) - 1e-3)
    }
  })
})

describe('change note 003: the parts of one moment', () => {
  it('says the second part of line 4 on its own event, no sooner than the end of the first and the gap between two lines of a beat, and keeps it through the field-done of the crank', async () => {
    const { s, ctx } = await ready('step2')
    ctx.currentTime = 10
    s.event(ev('volume-sign', 'step2'), 'live')
    ctx.currentTime = 11
    s.event(ev('crank-full', 'step2'), 'live')
    expect(booked(s).map(([line, start]) => [line, near(start as number)])).toEqual([[id('step2.crank.0'), 10], [id('step2.crank.1'), near(10 + L + lineGap)]])
    ctx.currentTime = 12
    s.event(ev('field-done', 'step2'), 'live')
    expect(back(s)).toEqual([])
    const slow = await ready('step2')
    slow.ctx.currentTime = 10
    slow.s.event(ev('volume-sign', 'step2'), 'live')
    slow.ctx.currentTime = 10 + L + 5
    slow.s.event(ev('crank-full', 'step2'), 'live')
    expect(booked(slow.s)[1]).toEqual([id('step2.crank.1'), 10 + L + 5])
  })

  it('takes the second part back when the page turns before it began, and never says it when the first part was not said', async () => {
    const { s, ctx } = await ready('step2')
    ctx.currentTime = 10
    s.event(ev('volume-sign', 'step2'), 'live')
    ctx.currentTime = 11
    s.event(ev('crank-full', 'step2'), 'live')
    ctx.currentTime = 12
    s.event(ev('page-turn', 'step2'), 'live')
    expect(back(s)).toEqual([id('step2.crank.1')])
    const alone = await ready('step2')
    alone.ctx.currentTime = 10
    alone.s.event(ev('crank-full', 'step2'), 'live')
    expect(booked(alone.s)).toEqual([])
    expect(alone.s.log().filter((e) => e.what === 'dropped').map((e) => [e.line, e.why])).toEqual([[id('step2.crank.1'), 'the part before it was not said']])
    const both = await ready('step1')
    both.s.event(ev('resume-received', 'step1'), 'live')
    both.ctx.currentTime = 1
    both.s.event(ev('page-turn', 'step1'), 'live')
    both.s.page('step2')
    both.s.event(ev('volume-sign', 'step2'), 'live')
    both.ctx.currentTime = 2
    both.s.event(ev('crank-full', 'step2'), 'live')
    expect(booked(both.s).map(([line, start]) => [line, near(start as number)])).toEqual([[id('step1.shredded.0'), 0], [id('step2.crank.0'), near(L + gap)], [id('step2.crank.1'), near(2 * L + gap + lineGap)]])
    both.ctx.currentTime = 3
    both.s.event(ev('field-done', 'step2'), 'live')
    expect(back(both.s).sort()).toEqual([id('step2.crank.0'), id('step2.crank.1')])
  })
})

describe('change note 004, item 3: what the narrator owes a page', () => {
  it('owes step 2 the second part of line 4 from its event to its end, spoken or with the sound off, and nothing before or after', async () => {
    for (const muted of [false, true]) {
      const { s, ctx } = await ready('step2')
      if (muted) s.setMuted(true)
      ctx.currentTime = 10
      s.event(ev('volume-sign', 'step2'), 'live')
      expect(s.owed('step2'), 'the first part alone').toBe(false)
      ctx.currentTime = 11
      s.event(ev('crank-full', 'step2'), 'live')
      expect(s.owed('step2'), 'booked behind the first part').toBe(true)
      ctx.currentTime = 12
      s.event(ev('field-done', 'step2'), 'live')
      expect(s.owed('step2')).toBe(true)
      ctx.currentTime = 10 + L + lineGap + L - 0.05
      expect(s.owed('step2'), 'in its last moment').toBe(true)
      ctx.currentTime = 10 + L + lineGap + L + 0.05
      expect(s.owed('step2'), 'after its end').toBe(false)
      expect(s.owed('step1')).toBe(false)
    }
  })

  it('owes nothing while sound is not allowed', () => {
    const s = make()
    s.page('step2')
    s.event(ev('crank-full', 'step2'), 'live')
    expect(s.owed('step2')).toBe(false)
  })
})

describe('the shout of the boss: a draft that builds on one row, a part a mark of the page', () => {
  it('takes its times from the stand-in of the drafts file, not from the pace of the narrator, and is large and a draft', () => {
    const l = standIns(film, drafts).get('boss.finish.0')!
    expect(l.phrases).toEqual([{ words: 'ka', from: 0.5, to: 1.5 }, { words: 'me', from: 1.5, to: 3 }, { words: 'ha', from: 3, to: 6 }])
    expect([l.seconds, l.draft, l.loud, l.page]).toEqual([6, true, true, 'step4'])
    expect(filmCaptions([{ id: id('boss.finish.0'), frame: 600 }], 60, standIns(film, drafts)).map((c) => [c.words, c.first, c.last, c.loud, c.draft])).toEqual([['ka', 630, 689, true, true], ['ka me', 690, 779, true, true], ['ka me ha', 780, 959, true, true]])
    const real = standIns().get('boss.finish.0')!
    expect(real.draft && real.loud).toBe(true)
    expect(real.text).toBe(draftFilm()['boss.finish']![0]!.text)
    expect(real.phrases.length).toBe(real.text.split(mark).length)
    expect(real.join).toBe((draftFilm()['boss.finish']![0] as { join?: string }).join ?? ' ')
    expect(builtTo(real, real.phrases.length - 1)).toBe(real.phrases.map((x) => x.words).join(real.join))
  })

  it('shows nothing on finish-arms, adds a part on each finish-charge and the last on finish-fire, keeps what was shouted, and goes when the last part has been held for its length', async () => {
    const { s, ctx } = await ready('step4')
    const words = () => s.said().lines.filter((l) => l.start <= ctx.currentTime && ctx.currentTime < l.end).map((l) => [l.words, l.loud])
    ctx.currentTime = 100
    s.event(ev('finish-arms', 'step4'), 'live')
    expect(booked(s)).toEqual([[id('boss.finish.0'), 100]])
    ctx.currentTime = 100.05
    expect(words()).toEqual([])
    ctx.currentTime = 100.4
    s.event(ev('finish-charge', 'step4'), 'live')
    ctx.currentTime = 100.5
    expect(words()).toEqual([['ka', true]])
    ctx.currentTime = 102
    s.event(ev('finish-charge', 'step4'), 'live')
    ctx.currentTime = 102.5
    expect(words()).toEqual([['ka me', true]])
    s.event(ev('finish-charge', 'step4'), 'live')
    expect(words()).toEqual([['ka me', true]])
    ctx.currentTime = 103
    s.event(ev('finish-fire', 'step4'), 'live')
    ctx.currentTime = 104
    expect(words()).toEqual([['ka me ha', true]])
    ctx.currentTime = 105.9
    expect(words()).toEqual([['ka me ha', true]])
    ctx.currentTime = 106.01
    expect(s.said().lines).toEqual([])
  })

  it('tells the panel which step of how many it shows and the whole line, grows each step by the rate of the panel and never shrinks, and keeps to the top band', async () => {
    const { s, ctx } = await ready('step4')
    ctx.currentTime = 10
    s.event(ev('finish-arms', 'step4'), 'live')
    s.event(ev('finish-charge', 'step4'), 'live')
    ctx.currentTime = 11
    s.event(ev('finish-fire', 'step4'), 'live')
    expect(s.said().lines.map((l) => [l.words, l.step, l.whole])).toEqual([['ka', { k: 0, n: 3 }, 'ka me ha'], ['ka me ha', { k: 2, n: 3 }, 'ka me ha']])
    expect(filmCaptions([{ id: id('boss.finish.0'), frame: 0 }], 60, standIns(film, drafts)).map((c) => c.step)).toEqual([{ k: 0, n: 3 }, { k: 1, n: 3 }, { k: 2, n: 3 }])
    expect(filmCaptions([{ id: id('boss.verify.0'), frame: 0 }], 60, standIns(film, drafts)).every((c) => c.step === undefined)).toBe(true)
    expect([0, 1, 2, 3, 4].map((k) => Math.round(shoutPx(k, 5)))).toEqual([150, 168, 188, 211, 240])
    expect([0, 1, 2].map((k) => Math.round(shoutPx(k, 3)))).toEqual([150, 168, 240])
    expect([0, 1, 2, 3, 4].map((k) => Math.round(shoutPx(k, 5, 166)))).toEqual([105, 118, 132, 148, 166])
    for (const n of [3, 4, 5, 6]) for (const most of [60, 166, 240, 400]) for (let k = 1; k < n; k++) expect(shoutPx(k, n, most)).toBeGreaterThan(shoutPx(k - 1, n, most))
    for (const t of [0, 0.01, 0.37, 2.2]) {
      const off = shoutShake(t)
      expect(Math.abs(off.x)).toBeLessThanOrEqual(CAPTION.shout.shakePx)
      expect(Math.abs(off.y)).toBeLessThanOrEqual(CAPTION.shout.shakePx)
    }
    expect(shoutShake(0.37)).toEqual(shoutShake(0.37))
    expect(CAPTION.lowOn.step4).toBeLessThan(CAPTION.low)
    expect(CAPTION.lowOn.step5).toBeGreaterThanOrEqual(168 + 62)
    expect(CAPTION.lowOn.step5).toBeLessThanOrEqual(298)
    expect([CAPTION.shout.top, CAPTION.shout.low]).toEqual([96, 330])
  })

  it('shows the whole line on a finish-fire that comes early and ends it the last part\'s length after that mark, and takes the shout back when boss-gone comes before it began', async () => {
    const { s, ctx } = await ready('step4')
    const words = () => s.said().lines.filter((l) => l.start <= ctx.currentTime && ctx.currentTime < l.end).map((l) => l.words)
    ctx.currentTime = 10
    s.event(ev('finish-arms', 'step4'), 'live')
    ctx.currentTime = 10.2
    s.event(ev('finish-charge', 'step4'), 'live')
    ctx.currentTime = 10.6
    s.event(ev('finish-fire', 'step4'), 'live')
    ctx.currentTime = 10.7
    expect(words()).toEqual(['ka me ha'])
    ctx.currentTime = 13.5
    expect(words()).toEqual(['ka me ha'])
    ctx.currentTime = 13.61
    expect(s.said().lines).toEqual([])
    const late = await ready('step4')
    late.s.event(ev('checkbox', 'step4'), 'live')
    late.ctx.currentTime = 1
    late.s.event(ev('finish-arms', 'step4'), 'live')
    late.ctx.currentTime = 2
    late.s.event(ev('boss-gone', 'step4'), 'live')
    expect(back(late.s)).toEqual([id('boss.finish.0')])
  })
})

describe('change note 003: line 7 and the fight music', () => {
  it('says its three parts one straight after the other and brings the music in at the start of the phrase that names it, once', async () => {
    const { s, ctx } = await ready('step4')
    ctx.currentTime = 50
    s.event(ev('boss-formed', 'step4'), 'live')
    const second = 50 + L + lineGap
    expect(booked(s)).toEqual([[id('boss.unfold.0'), 50], [id('boss.unfold.1'), near(second)], [id('boss.unfold.2'), near(second + L + lineGap)]])
    const music = loops(ctx, 'boss-loop')
    expect(music.map((x) => near(x.started!))).toEqual([near(second + 6 / wps)])
    ctx.currentTime = second + 6 / wps + 0.2
    s.event(ev('boss-music', 'step4'), 'live')
    expect(loops(ctx, 'boss-loop').length).toBe(1)
    ctx.currentTime = 90
    s.event(ev('power-down', 'step4'), 'live')
    expect(music[0]!.stopped).not.toBeNull()
  })

  it('ends the first part at the end of the sentence being said when the visitor clicks, not at the pause inside it, and lets the second part and the music follow at once', async () => {
    const { s, ctx } = await ready('step4')
    ctx.currentTime = 50
    s.event(ev('boss-formed', 'step4'), 'live')
    ctx.currentTime = 50 + 1 / wps
    s.event(ev('boss-turn', 'step4'), 'live')
    const pause = 50 + 6 / wps
    const lines = s.said().lines
    expect(lines.filter((l) => l.line === id('boss.unfold.0')).map((l) => [l.words, l.end])).toEqual([['beaten one two', 50 + 3 / wps], ['three four five.', pause]])
    expect(lines.filter((l) => l.line === id('boss.unfold.1'))[0]!.start).toBeCloseTo(pause + lineGap, 9)
    expect(lines.filter((l) => l.line === id('boss.unfold.2'))[0]!.start).toBeCloseTo(pause + lineGap + L + lineGap, 9)
    const music = loops(ctx, 'boss-loop')
    expect(music.length).toBe(2)
    expect(music[0]!.stopped!).toBeLessThan(music[1]!.started!)
    expect(music[1]!.started).toBeCloseTo(pause + lineGap + 6 / wps, 9)
    expect(music[1]!.stopped!).toBeCloseTo(music[1]!.started! + LIVE.loopMaxSeconds, 9)
    expect(s.log().filter((e) => e.what === 'cut').map((e) => e.line)).toEqual([id('boss.unfold.0')])
    s.event(ev('boss-turn', 'step4'), 'live')
    expect(s.log().filter((e) => e.what === 'cut').length).toBe(1)
  })

  it('takes a click that comes before the first part has begun as one at its first moment: the part is said to the end of its first sentence and the second follows it', async () => {
    const { s, ctx } = await ready('step4')
    ctx.currentTime = 50
    s.event(ev('checkbox', 'step4'), 'live')
    ctx.currentTime = 51
    s.event(ev('boss-formed', 'step4'), 'live')
    ctx.currentTime = 52
    s.event(ev('boss-turn', 'step4'), 'live')
    const lines = s.said().lines
    const first = 50 + L + gap
    expect(lines.filter((l) => l.line === id('boss.unfold.0')).map((l) => [l.words, l.start, l.end])).toEqual([['beaten one two', near(first), near(first + 3 / wps)], ['three four five.', near(first + 3 / wps), near(first + 6 / wps)]])
    expect(lines.filter((l) => l.line === id('boss.unfold.1'))[0]!.start).toBeCloseTo(first + 6 / wps + lineGap, 9)
    expect(s.log().filter((e) => e.what === 'cut').map((e) => e.line)).toEqual([id('boss.unfold.0')])
  })

  it('says nothing of line 7 that has not started once the turrets rise, takes its music back with it, and lets the event of the stage bring the music in then', async () => {
    const { s, ctx } = await ready('step4')
    ctx.currentTime = 50
    s.event(ev('checkbox', 'step4'), 'live')
    ctx.currentTime = 51
    s.event(ev('boss-formed', 'step4'), 'live')
    const first = 50 + L + gap
    expect(booked(s).slice(1)).toEqual([[id('boss.unfold.0'), near(first)], [id('boss.unfold.1'), near(first + L + lineGap)], [id('boss.unfold.2'), near(first + 2 * (L + lineGap))]])
    ctx.currentTime = 52
    s.event(ev('turret-rise', 'step4'), 'live')
    expect(back(s).sort()).toEqual([id('boss.unfold.0'), id('boss.unfold.1'), id('boss.unfold.2')])
    expect(loops(ctx, 'boss-loop').every((x) => x.stopped !== null)).toBe(true)
    const before = loops(ctx, 'boss-loop').length
    s.event(ev('boss-music', 'step4'), 'live')
    expect(loops(ctx, 'boss-loop').length).toBe(before + 1)
  })
})

describe('change note 003: the same lines in the film on the site', () => {
  it('says line 1 at the start of its beat and not when the film is joined later in it, and every other line on its event with the gap of the film', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 30
    s.beat('marketing.stroll', 'film', 0)
    expect(booked(s)).toEqual([[id('marketing.stroll.0'), 30]])
    ctx.currentTime = 30 + L - 1
    s.event(ev('candidate-sensed', 'step1'), 'film')
    expect(booked(s)[1]).toEqual([id('step1.firstName.0'), 30 + L + lineGap])
    const late = await ready()
    late.s.beat('marketing.stroll', 'film', LIVE.beatLateSeconds + 1)
    expect(booked(late.s)).toEqual([])
  })
})

describe('change note 003: the film', () => {
  it('gives the caption writer each phrase of line 1 on the frame its start in the index asks for, one after the other with no hole, holds the caption through the page turn while the line is still said, reports how far line 1 runs past the press of Apply, and marks line 9 as settled', () => {
    const fps: number = cfg.film.fps
    const at = 0
    const caps = filmCaptions([{ id: id('marketing.stroll.0'), frame: at }, { id: id('decision.reset.0'), frame: 9000 }, { id: 'line.not.one.0', frame: 5 }], fps)
    const one = caps.filter((x) => x.key === 'marketing.stroll.0')
    const line = standIns().get('marketing.stroll.0')!
    const take = shippedLines().find((l) => l.id === line.id && l.words === line.text)
    expect(one.map((x) => x.words)).toEqual(line.phrases.map((p) => p.words))
    const starts = take?.starts ?? line.phrases.map((p) => p.from)
    expect(one.length).toBe(starts.length)
    one.forEach((x, i) => expect(Math.abs(x.first - (at + starts[i]! * fps)), x.words).toBeLessThanOrEqual(1))
    for (let i = 1; i < one.length; i++) expect(one[i]!.first).toBe(one[i - 1]!.last + 1)
    if (take) expect(line.seconds).toBe(take.seconds)
    const end = at + Math.round(line.seconds * fps)
    expect(one[one.length - 1]!.last).toBe(end - 1)
    const stage = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
    stage.advance(Math.round(cfg.film.units[0].seconds * cfg.sim.stepHz))
    const frameOf = (name: string): number => Math.floor((stage.events.find((e) => e.name === name)!.step * fps) / cfg.sim.stepHz)
    const press = frameOf('button-press')
    const turn = frameOf('page-turn')
    expect(turn).toBeGreaterThanOrEqual(press)
    const shown = (f: number): string[] => one.filter((x) => x.first <= f && f <= x.last).map((x) => x.words)
    for (const f of [press, turn]) expect(shown(f), `frame ${f}`).toEqual(f < end ? [one[one.length - 1]!.words] : [])
    console.info(`MEASURED line 1 (${take ? 'kept take' : 'stand-in'}, ${line.seconds} s) ends ${((end - press) / fps).toFixed(3)} s after the press of Apply at ${(press / fps).toFixed(3)} s and ${((end - turn) / fps).toFixed(3)} s after the page turn at ${(turn / fps).toFixed(3)} s`)
    expect(one.every((x) => !x.draft && !x.loud)).toBe(true)
    const nine = caps.filter((x) => x.key === 'decision.reset.0')
    expect(nine.length).toBeGreaterThan(0)
    // Line 9 is settled since change note 004 item 5: it is no draft any more. The one draft left is the shout.
    expect(nine.every((x) => !x.draft && x.first >= 9000)).toBe(true)
    expect([...standIns().values()].filter((l) => l.draft).map((l) => l.key)).toEqual(['boss.finish.0'])
    expect(caps.some((x) => x.id === 'line.not.one.0')).toBe(false)
  })

  it('lays no take in the mix for a line that is a stand-in, kept or not, and places it as a stand-in of its length', () => {
    const sr = 8000
    const take = { sampleRate: sr, channels: [new Float32Array(sr).fill(0.5)] }
    const r = mixFilm({ sampleRate: sr, fps: 60, seconds: 20, events: [], lines: [{ id: id('marketing.stroll.0'), beat: 'marketing.stroll', frame: 0 }], sounds: new Map([[id('marketing.stroll.0'), take]]) as never, sfx: [], duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb, standIns: scriptStandIns([]) })
    expect(r.missingLines).toEqual([])
    expect(r.placed.filter((p) => p.kind === 'line')).toEqual([])
    expect(r.placed.filter((p) => p.kind === 'stand-in').map((p) => [p.id, p.frame, p.seconds])).toEqual([[id('marketing.stroll.0'), 0, scriptStandIns([]).get(id('marketing.stroll.0'))]])
    expect(r.sound.channels.every((ch) => ch.every((v) => v === 0))).toBe(true)
  })
})
