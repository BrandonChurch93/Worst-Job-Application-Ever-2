import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { FAMILY_LINE, HOLD_LINE, cueLines, lineNumbers as numbersOf, listenerFindings, listenerSheet, promptLine, target } from '../tools/sound.mjs'
import * as cues from '../src/audio/cues'
import * as copy from '../src/copy'

const read = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const lineNumbers = numbersOf as (...a: unknown[]) => any
const mark: string = narration.pauseMark
const beat: string = Object.keys(narration.film).find((b) => narration.film[b].some((l: any) => l.text.includes(` ${mark} `)))!
const index: number = narration.film[beat].findIndex((l: any) => l.text.includes(` ${mark} `))
const text: string = narration.film[beat][index].text

describe('what an id on the command line names', () => {
  it('finds a cue with its class, its variants and its limit of takes', () => {
    const withVariants = cfg.audio.sfx.find((s: any) => (s.variants ?? 1) > 1)
    const t = target({ cue: withVariants.id }, cfg, cues)
    expect(t.kind).toBe('cue')
    expect(t.ids.length).toBe(withVariants.variants)
    expect(t.max).toBe(cfg.audio.maxTakesPerCue)
    expect(t.cls).toBe(cues.cueClass[withVariants.id])
    expect(target({ cue: 'room-tone' }, cfg, cues).loop).toBe(true)
  })

  it('finds a line of the film and a live line by their place, with the words as written', () => {
    const t = target({ line: `${beat}:${index}` }, cfg, cues)
    expect(t).toMatchObject({ kind: 'line', id: cues.filmLineId(beat, index), beat, index, text, max: cfg.audio.narratorMaxTakesPerLine })
    const live = target({ line: 'live.hit:1' }, cfg, cues)
    expect(live).toMatchObject({ kind: 'line', id: cues.liveLineId('hit', 1), beat: null, liveKey: 'hit', text: narration.liveOnly.hit[1] })
  })

  it('refuses a name that is not there', () => {
    expect(() => target({ cue: 'no-such-cue' }, cfg, cues)).toThrow()
    expect(() => target({ line: `${beat}:99` }, cfg, cues)).toThrow()
    expect(() => target({ line: 'live.nothing:0' }, cfg, cues)).toThrow()
    expect(() => target({}, cfg, cues)).toThrow()
  })
})

describe('what the listener says', () => {
  const line = target({ line: `${beat}:${index}` }, cfg, cues)
  const said = { transcript: text, whisper: false, laugh: false, warmth: false, excitement: false, unimpressedAndSmug: true }

  it('counts as nothing until a listener has answered', () => {
    expect(listenerFindings(line, null)).toMatchObject({ answered: false, holds: false })
  })

  it('holds a line written down word for word, whatever the capitals, the stops and the pause marks', () => {
    expect(listenerFindings(line, said).holds).toBe(true)
    const loose = text.split(mark).join(' ').toUpperCase().replace(/[.,]/g, '')
    expect(listenerFindings(line, { ...said, transcript: loose }).holds).toBe(true)
  })

  it('fails a line with one word changed, dropped or added', () => {
    const words = text.split(/\s+/).filter((w) => w !== mark)
    const changed = [...words.slice(0, -1), 'banana'].join(' ')
    const dropped = words.slice(1).join(' ')
    const added = [...words, 'indeed'].join(' ')
    for (const transcript of [changed, dropped, added, '']) {
      const f = listenerFindings(line, { ...said, transcript })
      expect(f.holds, transcript).toBe(false)
      expect(f.why.some((w: string) => w.includes('is not the line')), transcript).toBe(true)
    }
  })

  it('fails a line spoken with a whisper, a laugh, warmth or excitement, or by the wrong speaker', () => {
    for (const k of ['whisper', 'laugh', 'warmth', 'excitement']) expect(listenerFindings(line, { ...said, [k]: true }).holds, k).toBe(false)
    expect(listenerFindings(line, { ...said, unimpressedAndSmug: false }).holds).toBe(false)
  })

  it('fails an effect with a voice, a word, music or a melody in it, and lets the hold music be music', () => {
    const effect = target({ cue: 'button-press' }, cfg, cues)
    const clean = { voice: false, word: false, music: false, melody: false, fits: true }
    expect(listenerFindings(effect, clean).holds).toBe(true)
    for (const k of ['voice', 'word', 'music', 'melody']) expect(listenerFindings(effect, { ...clean, [k]: true }).holds, k).toBe(false)
    expect(listenerFindings(effect, { ...clean, fits: false }).holds).toBe(false)
    const hold = target({ cue: 'hold-music' }, cfg, cues)
    expect(listenerFindings(hold, { ...clean, music: true, melody: true }).holds).toBe(true)
    expect(listenerFindings(hold, { ...clean, music: true, voice: true }).holds).toBe(false)
  })
})

describe('the questions the listener gets', () => {
  const line = target({ line: `${beat}:${index}` }, cfg, cues)
  const effect = target({ cue: 'button-press' }, cfg, cues)

  it('has one describing line for every cue of the config, read from the kit', () => {
    const lines: Record<string, string> = cueLines()
    for (const s of cfg.audio.sfx) expect(lines[s.id], s.id).toMatch(/^[A-Z].{8,}/)
    expect(Object.keys(lines).length).toBe(cfg.audio.sfx.length)
    expect(new Set([lines['ui-tick'], lines['key-tap'], lines['ui-send']]).size).toBe(3)
  })

  it('never tells the listener the line it has to write down', () => {
    const sheet = listenerSheet(line, undefined)
    const said = text.split(/\s+/).filter((w) => w !== mark).slice(0, 2).join(' ')
    expect(sheet.questions.join(' ')).not.toContain(said)
  })

  it('asks an effect against its describing line', () => {
    const lines: Record<string, string> = cueLines()
    expect(listenerSheet(effect, lines['button-press']).questions.join(' ')).toContain(lines['button-press'])
  })

  it('hands out an answers file that does not hold until every question is answered', () => {
    for (const t of [line, effect]) {
      const sheet = listenerSheet(t, 'x')
      const f = listenerFindings(t, sheet.answers)
      expect(f.answered).toBe(true)
      expect(f.holds).toBe(false)
      expect(f.why.some((w: string) => w.includes('unanswered'))).toBe(true)
    }
    expect(listenerFindings(effect, { voice: false, word: false, music: false, melody: false }).holds).toBe(false)
    expect(listenerFindings(effect, { voice: false, word: false, music: false, melody: false, fits: true, sameRoom: false }).holds).toBe(false)
    expect(listenerFindings(effect, { voice: false, word: false, music: false, melody: false, fits: true, sameRoom: null }).holds).toBe(true)
  })
})

describe('what the numbers say about a line', () => {
  const line = target({ line: `${beat}:${index}` }, cfg, cues)
  const words = text.split(/\s+/).filter((w) => w !== mark).length
  const marks = text.split(/\s+/).filter((w) => w === mark).length
  const slow = words / (cfg.audio.narratorMaxWordsPerSecond * 0.9)
  const fast = words / (cfg.audio.narratorMaxWordsPerSecond * 1.2)
  const pauses = Array.from({ length: marks }, (_, i) => ({ start: 0.5 + i, end: 0.9 + i }))

  it('counts the words without the pause marks and holds the pace under the limit', () => {
    const n = lineNumbers(line, { start: 0.1, end: 0.1 + slow }, pauses, cfg, copy)
    expect(n.words).toBe(words)
    expect(n.pauseMarks).toBe(marks)
    expect(n.paceHolds).toBe(true)
    expect(n.pausesHold).toBe(true)
    expect(lineNumbers(line, { start: 0.1, end: 0.1 + fast }, pauses, cfg, copy).paceHolds).toBe(false)
  })

  it('misses a pause that cannot be measured', () => {
    expect(lineNumbers(line, { start: 0, end: slow }, [], cfg, copy).pausesHold).toBe(marks === 0)
  })

  it('knows the room a line of the film has and gives a live line none', () => {
    const n = lineNumbers(line, { start: 0, end: 0.2 }, pauses, cfg, copy)
    expect(n.fits).toBe(true)
    if (n.room !== null) expect(lineNumbers(line, { start: 0, end: n.room + 1 }, pauses, cfg, copy).fits).toBe(false)
    const live = target({ line: 'live.hit:0' }, cfg, cues)
    expect(lineNumbers(live, { start: 0, end: 30 }, [], cfg, copy)).toMatchObject({ room: null, fits: true })
  })
})

describe('the line that ends every effect prompt', () => {
  it('forbids music, melody and voice, and for the hold music only the voice', () => {
    expect(promptLine('button-press')).toBe(FAMILY_LINE)
    expect(FAMILY_LINE).toMatch(/no music, no melody, no voice$/)
    expect(promptLine('hold-music')).toBe(HOLD_LINE)
    expect(HOLD_LINE).not.toMatch(/no music|no melody/)
    expect(HOLD_LINE).toMatch(/no voice$/)
  })
})
