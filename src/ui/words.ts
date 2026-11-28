import { config } from '../config'
import { copy, lookup } from '../copy'

// Every run of words the interface shows, by its key. Nothing else is written on a control.
export const WORDS = {
  title: 'copy:site.title',
  skip: 'copy:live.skip',
  watchFilm: 'copy:live.watchFilm',
  soundBar: 'copy:drafts.live.soundBar.words',
  soundAccept: 'copy:drafts.live.soundBar.accept',
  touchTitle: 'copy:live.touchOnly.title',
  touchBody: 'copy:live.touchOnly.body',
  touchLink: 'copy:live.touchOnly.link',
  careers: 'employer.name'
} as const

export type WordId = keyof typeof WORDS

export function resolve(key: string): string | undefined {
  return key.startsWith('copy:') ? lookup(copy, key) : lookup(config, key)
}

export function word(id: WordId): string {
  const v = resolve(WORDS[id])
  if (v === undefined) throw new Error(`No word with the key "${WORDS[id]}"`)
  return v
}

// The names the menu shows for the steps: the careers page, then copy:site.steps.
export const stepNames = (): string[] => [word('careers'), ...copy.site.steps]
