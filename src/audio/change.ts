// The cues Brandon's change notes ordered: the rows of audio/CHANGE-CUES.json, the one place that holds their lengths, classes and events.
// A row's events play its cue once its sound is kept and packed. Until then they play what they play today: the row's stand-in, or nothing.
// The table of cues (cues.ts) may import nothing, so the list is read here, by the audio code and the tools only.
import list from '../../audio/CHANGE-CUES.json'
import { cueOfEvent, variantId, type CueClass } from './cues'

export interface ChangeCue {
  id: string
  seconds: number
  class: CueClass
  loop?: boolean
  variants?: number
  made: boolean
  events: string[]
  page?: string
  standIn: string | null
  covers?: string[]
  stops?: string[]
  lands?: { on: string; from: string; tail: number }
  describes: string
  playedBy: string
  orderedBy: string
}

export const changeCues: ChangeCue[] = list.cues as ChangeCue[]

const byId = new Map(changeCues.map((c) => [c.id, c]))
export const changeCue = (id: string): ChangeCue | undefined => byId.get(id)

// An event name of a row: the name itself, or with * for any run of letters, as in strike:*.bumper.*
const patterns = new Map<string, RegExp>()
export function eventMatches(pattern: string, name: string): boolean {
  if (!pattern.includes('*')) return pattern === name
  let re = patterns.get(pattern)
  if (!re) {
    re = new RegExp(`^${pattern.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
    patterns.set(pattern, re)
  }
  return re.test(name)
}

const onPage = (c: ChangeCue, page: string | undefined | null): boolean => c.page === undefined || page === undefined || page === null || page === c.page

// The rows an event belongs to, in the order of the list. page: the page the event happened on, where it is known.
export function changeCuesOf(name: string, page?: string | null): ChangeCue[] {
  return changeCues.filter((c) => onPage(c, page) && c.events.some((p) => eventMatches(p, name)))
}

// Whether a row's sound is kept: its file, or one of its variants' files, is among the sounds there are.
export function keptChange(c: ChangeCue, has: (id: string) => boolean): boolean {
  const v = Math.max(1, Math.floor(c.variants ?? 1))
  for (let i = 0; i < v; i++) if (has(variantId(c.id, i, v))) return true
  return false
}

// The cue an event plays: its row's own cue when that sound is kept, otherwise what the table of cues gives it today.
export function cueFor(name: string, page: string | undefined | null, has: (id: string) => boolean): string | undefined {
  const own = changeCuesOf(name, page).find((c) => keptChange(c, has))
  return own ? own.id : cueOfEvent(name)
}

// The cue that covers an event: a kept cue of the list that plays in the same step and carries this event's sound in its own.
export function coverOf(name: string, has: (id: string) => boolean): ChangeCue | undefined {
  return changeCues.find((c) => (c.covers?.includes(name) ?? false) && keptChange(c, has))
}

// A row with `lands` is not laid at an event. It is played once so that the end of its body, its kept length less `tail`, falls on the event `on`,
// and no sooner than the event `from`; the tail runs on under what `on` plays. room: the time there is from the earliest start to `on`.
// With room to spare it waits. With less room than its body it starts that much later into itself, so its top still falls on `on`.
// The three are in one unit, seconds on the live site and samples in the film's mix.
export const landers: ChangeCue[] = changeCues.filter((c) => c.lands !== undefined)
export function landing(length: number, tail: number, room: number): { wait: number; skip: number } {
  const body = Math.max(0, length - tail)
  return { wait: Math.max(0, room - body), skip: Math.max(0, body - room) }
}

export const changeLoops: string[] = changeCues.filter((c) => c.loop).map((c) => c.id)
// The loops of the list an event ends.
export const changeStops = (name: string): string[] => changeCues.filter((c) => c.stops?.includes(name)).map((c) => c.id)
