// The narrator's script as the site and the film use it while no line is recorded: each line is a silent stand-in with its caption.
// A line lasts its words divided by audio.narratorMaxWordsPerSecond. Its caption is shown phrase by phrase, split at the pause mark, each phrase for its share of the words.
import { config } from '../config'
import { narration } from '../copy'
import { sayable } from '../ui/said'
import { spoken, unitPage } from './cues'

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

export interface StandIn { key: string; id: string; beat: string; index: number; page: string; at: number; text: string; words: string; seconds: number; phrases: Phrase[]; draft: boolean }

type Film = Record<string, { at: number; text: string }[]>

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
export function standIns(film: Film = narration.film as Film, drafts: Film = draftFilm(), wordsPerSecond: number = config.audio.narratorMaxWordsPerSecond, pauseMark: string = narration.pauseMark): Map<string, StandIn> {
  const out = new Map<string, StandIn>()
  for (const key of Object.keys(spoken)) {
    const beat = keyBeat(key)
    const index = keyIndex(key)
    const settled = film[beat]?.[index]
    const line = settled ?? drafts[beat]?.[index]
    if (!line) continue
    const phrases = phrasesOf(line.text, pauseMark, wordsPerSecond)
    out.set(key, { key, id: `line.${key}`, beat, index, page: keyPage(key), at: line.at, text: line.text, words: sayable(line.text, pauseMark), seconds: phrases.length ? phrases[phrases.length - 1]!.to : 0, phrases, draft: !settled })
  }
  return out
}

// The seconds from the start of a line to the start of one of its phrases; a phrase counted from the end is negative.
export const phraseStart = (line: StandIn, phrase: number): number => line.phrases[phrase < 0 ? line.phrases.length + phrase : phrase]?.from ?? 0

export interface FilmCaption { id: string; key: string; phrase: number; words: string; first: number; last: number; draft: boolean; loud: boolean }

// The captions of the film by frame: each phrase of a line from its first frame to its last, the line starting on the frame the film gives it.
export function filmCaptions(lines: { id: string; frame: number }[], fps: number, script: Map<string, StandIn> = standIns()): FilmCaption[] {
  const byId = new Map([...script.values()].map((l) => [l.id, l]))
  const out: FilmCaption[] = []
  for (const at of lines) {
    const line = byId.get(at.id)
    if (!line) continue
    line.phrases.forEach((p, k) => {
      const first = at.frame + Math.round(p.from * fps)
      const last = at.frame + Math.round(p.to * fps) - 1
      if (last >= first) out.push({ id: line.id, key: line.key, phrase: k, words: p.words, first, last, draft: line.draft, loud: spoken[line.key]?.loud === true })
    })
  }
  return out
}
