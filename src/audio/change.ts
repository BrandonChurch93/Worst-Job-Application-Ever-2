// The cues Brandon's change notes ordered: the rows of audio/CHANGE-CUES.json, the one place that holds their lengths, classes and events.
// A row's events play its cue once its sound is kept and packed. Until then they play what they play today: the row's stand-in, or nothing.
// The table of cues (cues.ts) may import nothing, so the list is read here, by the audio code and the tools only.
import list from '../../audio/CHANGE-CUES.json'
import { cueOfEvent, type CueClass } from './cues'

export interface ChangeCue {
  id: string
  seconds: number
  class: CueClass
  loop?: boolean
  made: boolean
  events: string[]
  page?: string
  standIn: string | null
  covers?: string[]
  stops?: string[]
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

// The cue an event plays: its row's own cue when that sound is kept, otherwise what the table of cues gives it today.
export function cueFor(name: string, page: string | undefined | null, has: (id: string) => boolean): string | undefined {
  const own = changeCuesOf(name, page).find((c) => has(c.id))
  return own ? own.id : cueOfEvent(name)
}

// The cue that covers an event: a kept cue of the list that plays in the same step and carries this event's sound in its own.
export function coverOf(name: string, has: (id: string) => boolean): ChangeCue | undefined {
  return changeCues.find((c) => (c.covers?.includes(name) ?? false) && has(c.id))
}

export const changeLoops: string[] = changeCues.filter((c) => c.loop).map((c) => c.id)
// The loops of the list an event ends.
export const changeStops = (name: string): string[] => changeCues.filter((c) => c.stops?.includes(name)).map((c) => c.id)
