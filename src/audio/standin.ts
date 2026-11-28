// The narrator's script as the site and the film use it while no line is recorded: each line is a silent stand-in with its caption.
// A line lasts its words divided by audio.narratorMaxWordsPerSecond. Its caption is shown phrase by phrase, split at the pause mark, each phrase for its share of the words.
// A line whose phrases come on marks of its page carries the times of a stand-in instead: the start of each phrase and the length of the whole.
// A line with a kept take in the sound index, recorded from the very words of the script, lasts as long as its file and shows each phrase when the file says it.
import { config } from '../config'
import { narration } from '../copy'
import { sayable } from '../ui/said'
import shipped from '../../public/audio/index.json'
import { spoken, unitPage } from './cues'
import { riseAfterFire } from '../ui/rise'

export const wordCount = (text: string): number => text.split(/\s+/).filter((w) => w.length > 0).length

export interface Phrase { words: string; from: number; to: number }

// The phrases of a line with the seconds, from the line's start, over which each is shown.
export function phrasesOf(text: string, pauseMark: string, wordsPerSecond: number): Phrase[] {
  const out: Phrase[] = []
  let before = 0
  for (const part of text.split(pauseMark)) {
    const words = part.trim().split(/\s+/).filter((w) => w.length > 0).join(' ')
    const n = wordCount(words)
    if (!n) continue
    out.push({ words, from: before / wordsPerSecond, to: (before + n) / wordsPerSecond })
    before += n
  }
  return out
}

// kept: a take of the line is in the sound index and was recorded from these words, so the line has a voice. Otherwise it is a silent stand-in.
export interface StandIn { key: string; id: string; beat: string; index: number; page: string; at: number; text: string; words: string; seconds: number; phrases: Phrase[]; draft: boolean; loud: boolean; join: string; kept: boolean }

// A narrator line of the sound index: the words its take was recorded from and the seconds, from the file's start, at which each phrase starts.
export interface KeptLine { id: string; seconds: number; words?: string; starts?: number[] }

export const shippedLines = (): KeptLine[] => (shipped as { lines: KeptLine[] }).lines

// The phrases of a kept take whose pauses could not be counted: each for its share of the words, over the whole file.
export function phrasesOver(text: string, pauseMark: string, seconds: number): Phrase[] {
  const n = wordCount(sayable(text, pauseMark))
  return n > 0 && seconds > 0 ? phrasesOf(text, pauseMark, n / seconds) : []
}

type Film = Record<string, { at: number; text: string; loud?: boolean; join?: string; standIn?: { seconds: number; starts: number[] } }[]>

// The phrases of a line at the times of its stand-in: each from its start to the start of the next, the last to the end.
export function phrasesAt(text: string, pauseMark: string, starts: number[], seconds: number): Phrase[] {
  const words = text.split(pauseMark).map((part) => part.trim().split(/\s+/).filter((w) => w.length > 0).join(' ')).filter((w) => w.length > 0)
  return words.map((w, k) => ({ words: w, from: starts[k] ?? seconds, to: starts[k + 1] ?? seconds }))
}

const draftFiles = import.meta.glob('../../content/narration-drafts.json', { eager: true }) as Record<string, { default?: { film?: Film }; film?: Film }>

// The lines of content/narration-drafts.json, when that file is there. They are used for captions and timing only.
export function draftFilm(): Film {
  for (const m of Object.values(draftFiles)) return (m.default?.film ?? m.film ?? {}) as Film
  return {}
}

export const lineKey = (beat: string, index: number): string => `${beat}.${index}`
export const keyBeat = (key: string): string => key.slice(0, key.lastIndexOf('.'))
export const keyIndex = (key: string): number => Number(key.slice(key.lastIndexOf('.') + 1))
export const keyPage = (key: string): string => unitPage[key.slice(0, key.indexOf('.'))] ?? ''

// Every line of the cue table that has words, settled or draft. A line of the files with no row in the table is not spoken anywhere.
export function standIns(film: Film = narration.film as Film, drafts: Film = draftFilm(), wordsPerSecond: number = config.audio.narratorMaxWordsPerSecond, pauseMark: string = narration.pauseMark, takes: KeptLine[] = shippedLines()): Map<string, StandIn> {
  const out = new Map<string, StandIn>()
  const byId = new Map(takes.map((t) => [t.id, t]))
  for (const key of Object.keys(spoken)) {
    const beat = keyBeat(key)
    const index = keyIndex(key)
    const settled = film[beat]?.[index]
    const line = settled ?? drafts[beat]?.[index]
    if (!line) continue
    const take = byId.get(`line.${key}`)
    const kept = take !== undefined && take.words === line.text && take.seconds > 0 && spoken[key]?.steps === undefined
    const phrases = kept ? (take.starts ? phrasesAt(line.text, pauseMark, take.starts, take.seconds) : phrasesOver(line.text, pauseMark, take.seconds)) : line.standIn ? phrasesAt(line.text, pauseMark, line.standIn.starts, line.standIn.seconds) : phrasesOf(line.text, pauseMark, wordsPerSecond)
    out.set(key, { key, id: `line.${key}`, beat, index, page: keyPage(key), at: line.at, text: line.text, words: sayable(line.text, pauseMark), seconds: kept ? take.seconds : phrases.length ? phrases[phrases.length - 1]!.to : 0, phrases, draft: !settled, loud: line.loud === true || spoken[key]?.loud === true, join: line.join ?? ' ', kept })
  }
  return out
}

// The seconds from the start of a line to the start of one of its phrases; a phrase counted from the end is negative.
export const phraseStart = (line: StandIn, phrase: number): number => line.phrases[phrase < 0 ? line.phrases.length + phrase : phrase]?.from ?? 0

export interface FilmCaption { id: string; key: string; phrase: number; words: string; first: number; last: number; draft: boolean; loud: boolean; step?: { k: number; n: number }; whole?: string }

// A line that builds on marks: what has been said up to its phrase k, joined as its row says.
export const builtTo = (line: { phrases: { words: string }[]; join: string }, k: number): string => line.phrases.slice(0, k + 1).map((p) => p.words).join(line.join)

// The captions of the film by frame: each phrase of a line from its first frame to its last, the line starting on the frame the film gives it.
// events: the film's marks by frame (the cut list's). A line whose row has steps.hidesOnRise is shown up to the frame before the camera's rise begins: riseAfterFire() after the first of its last marks from its own first frame on.
export function filmCaptions(lines: { id: string; frame: number }[], fps: number, script: Map<string, StandIn> = standIns(), events: { name: string; frame: number }[] = []): FilmCaption[] {
  const byId = new Map([...script.values()].map((l) => [l.id, l]))
  const out: FilmCaption[] = []
  for (const at of lines) {
    const line = byId.get(at.id)
    if (!line) continue
    const steps = spoken[line.key]?.steps
    const gone = steps?.hidesOnRise ? Math.min(Infinity, ...events.filter((e) => e.name === steps.last && e.frame >= at.frame).map((e) => e.frame)) + Math.round(riseAfterFire() * fps) : Infinity
    line.phrases.forEach((p, k) => {
      const first = at.frame + Math.round(p.from * fps)
      const last = Math.min(at.frame + Math.round(p.to * fps), gone) - 1
      const built = spoken[line.key]?.steps !== undefined
      if (last >= first) out.push({ id: line.id, key: line.key, phrase: k, words: built ? builtTo(line, k) : p.words, first, last, draft: line.draft, loud: line.loud, ...(built ? { step: { k, n: line.phrases.length }, whole: builtTo(line, line.phrases.length - 1) } : {}) })
    })
  }
  return out
}
