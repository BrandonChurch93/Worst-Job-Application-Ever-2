// The one typed copy of the two files in content/, checked at startup.
// Every word a visitor reads and every line the narrator speaks comes through here.
import rawCopy from '../content/copy.json'
import rawDrafts from '../content/copy-drafts.json'
import rawNarration from '../content/narration.json'
import type { Config } from './config'

export type Copy = typeof rawCopy
export type Drafts = typeof rawDrafts.words
export type Narration = typeof rawNarration
// New on-screen words are drafts until Brandon approves them. They ride beside the locked copy under "drafts",
// so a layout names one as "copy:drafts.live.soundBar.words" and the locked file is untouched. An approved word
// moves into content/copy.json and leaves the drafts (the nine words of change note 002 did, by change note 004 item 9).
export const copy: Copy & { drafts: Drafts } = { ...rawCopy, drafts: rawDrafts.words }
export const narration: Narration = rawNarration

export interface FilmLine { at: number; text: string }

// Looks a word up by its key: "step1.heading", or "copy:step1.heading" as the layout trees write it.
export function lookup(source: unknown, key: string): string | undefined {
  const path = key.startsWith('copy:') ? key.slice(5) : key
  let v: unknown = source
  for (const part of path.split('.')) {
    if (v === null || typeof v !== 'object') return undefined
    v = (v as Record<string, unknown>)[part]
  }
  return typeof v === 'string' ? v : undefined
}

export function text(key: string): string {
  const v = lookup(copy, key)
  if (v === undefined) throw new Error(`No copy with the key "${key}"`)
  return v
}

// The words of a line that are spoken: the pause mark is never one of them.
export const spokenWords = (line: string, pauseMark: string): number => line.split(/\s+/).filter((w) => w.length > 0 && w !== pauseMark).length

export interface TimedLine { beat: string; index: number; text: string; start: number; end: number }

// When each line of the film starts and the soonest it can end, in film seconds.
export function timedLines(c: Config, n: Narration): TimedLine[] {
  const out: TimedLine[] = []
  let pageStart = 0
  for (const u of c.film.units) {
    for (const b of c.film.beats.filter((x) => x.unit === u.id).sort((a, x) => a.from - x.from)) {
      const lines = ((n.film as Record<string, FilmLine[]>)[b.id] ?? []).slice().sort((a, x) => a.at - x.at)
      lines.forEach((line, index) => {
        const start = pageStart + b.from + line.at * (b.to - b.from)
        out.push({ beat: b.id, index, text: line.text, start, end: start + spokenWords(line.text, n.pauseMark) / c.audio.narratorMaxWordsPerSecond })
      })
    }
    pageStart += u.seconds
  }
  return out
}

// A layout tree names its words by key. Every page's tree is given here to be checked.
export interface LayoutNode {
  id: string
  kind: string
  box: number[]
  copy?: string
  children?: LayoutNode[]
  part?: string
  height?: number
  floor?: number
  on?: number
  mechanism?: boolean
  over?: boolean
  states?: string[]
  type?: { font: string; px: number; align?: 'left' | 'centre' | 'right'; wrap?: number; lead?: number }
  shape?: 'box' | 'disc' | 'capsule' | 'none'
  tone?: string
  r?: number
  flow?: 'column' | 'row'
  gap?: number
}

export function copyKeysOf(node: LayoutNode, out: string[] = []): string[] {
  if (node.copy !== undefined) out.push(node.copy)
  for (const child of node.children ?? []) copyKeysOf(child, out)
  return out
}

// Every reason the content cannot be used. An empty list means it is sound.
export function contentProblems(c: Config, cp: Copy, n: Narration, layouts: Record<string, LayoutNode>): string[] {
  const out: string[] = []
  const beats = new Set(c.film.beats.map((b) => b.id))
  const spoken = n.film as Record<string, FilmLine[]>
  for (const id of Object.keys(spoken)) if (!beats.has(id)) out.push(`narration: it has the beat "${id}", which the config does not have`)
  for (const id of beats) if (spoken[id] === undefined) out.push(`narration: it lacks the beat "${id}", which the config has`)
  for (const [id, lines] of Object.entries(spoken)) {
    for (const line of lines) if (!(line.at >= 0 && line.at < 1)) out.push(`narration: a line of "${id}" starts at ${line.at}, which is not inside its beat`)
  }
  const lines = timedLines(c, n)
  for (let i = 1; i < lines.length; i++) {
    const a = lines[i - 1]!
    const b = lines[i]!
    if (a.end + c.audio.lineGapSeconds > b.start + 1e-9) {
      out.push(`narration: the line "${a.text}" of "${a.beat}" runs to ${a.end.toFixed(2)} s at ${c.audio.narratorMaxWordsPerSecond} words a second, and the next line, of "${b.beat}", starts at ${b.start.toFixed(2)} s, with less than ${c.audio.lineGapSeconds} s between them`)
    }
  }
  for (const [page, tree] of Object.entries(layouts)) {
    for (const key of copyKeysOf(tree)) if (key.startsWith('copy:') && lookup(cp, key) === undefined) out.push(`layout: the tree of "${page}" names the copy key "${key}", which does not exist`)
  }
  return out
}
