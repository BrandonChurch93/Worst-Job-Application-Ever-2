// Where each line of the script starts in the film, from the film's own events.
// A line with an event starts when the film gives that event on the line's page. The shout starts `SHOUT.lead` s after its event, so that its last phrase lands on the fire mark. A later part of a line starts straight after the part before it.
// No line starts sooner than the end of the line before it plus the gap between two lines (audio.lineGapSeconds): it waits, as it does on the live site.
// The start is kept in the script as `at`, a share of the line's beat. `at` is rounded up, so that a start is never sooner than it should be.
import { jumpsLiveOnly, spoken, type SpokenRow } from '../audio/cues'
import { keyBeat, standIns, type StandIn } from '../audio/standin'
import { SHOUT, SHOUT_LINE } from '../boss/tune'
import { config, type Config } from '../config'

export interface FilmEvent { name: string; seconds: number; unit: string }
export interface LineStart { key: string; beat: string; draft: boolean; event: string | null; eventSeconds: number | null; start: number; end: number; at: number; waited: number; inside: boolean }

const up = (v: number): number => Math.ceil(v * 1e5 - 1e-6) / 1e5

export function lineStarts(events: FilmEvent[], script: Map<string, StandIn> = standIns(), rows: Record<string, SpokenRow> = spoken, c: Config = config): { lines: LineStart[]; problems: string[]; notes: string[] } {
  const problems: string[] = []
  const notes: string[] = []
  const lines: LineStart[] = []
  const gap = c.audio.lineGapSeconds
  const unitStart = new Map<string, number>()
  let filmEnd = 0
  for (const u of c.film.units) {
    unitStart.set(u.id, filmEnd)
    filmEnd += u.seconds
  }
  const ends = new Map<string, number>()
  let lastEnd = -Infinity
  for (const [key, row] of Object.entries(rows)) {
    const line = script.get(key)
    if (line === undefined) continue
    const beat = c.film.beats.find((b) => b.id === keyBeat(key))
    const base = beat === undefined ? undefined : unitStart.get(beat.unit)
    if (beat === undefined || base === undefined) {
      problems.push(`the line ${key} has no beat in the config`)
      continue
    }
    const from = base + beat.from
    const length = beat.to - beat.from
    let wanted: number
    let eventSeconds: number | null = null
    if (row.after !== undefined) {
      const before = ends.get(row.after)
      if (before === undefined) {
        problems.push(`the line ${key} follows ${row.after}, which has no place in the film`)
        continue
      }
      wanted = before + gap
    } else if (row.event === null) wanted = from
    else {
      const e = events.find((x) => x.name === row.event && x.unit === beat.unit)
      if (e === undefined) {
        problems.push(`the line ${key} is set off by ${row.event}, which the film never gives in the unit ${beat.unit}`)
        continue
      }
      eventSeconds = e.seconds
      wanted = e.seconds + (key === SHOUT_LINE ? SHOUT.lead : 0)
    }
    let start = Math.max(wanted, lastEnd + gap)
    const waited = start - wanted
    // A wait is a fault where the page keeps time by the line: a line with a jump, or one that later parts follow. Elsewhere it is a pause before the line.
    const led = (row.jump !== undefined && !jumpsLiveOnly(key)) || Object.values(rows).some((r) => r.after === key)
    if (row.after === undefined && waited > c.film.beatToleranceSeconds) (led ? problems : notes).push(`the line ${key} waits ${waited.toFixed(3)} s for the line before it to end${led ? ': its page keeps time by it, and the picture runs that far ahead of the words' : ''}`)
    if (start < from) {
      if (from - start > c.film.beatToleranceSeconds) problems.push(`the line ${key} starts ${(from - start).toFixed(3)} s before its beat ${beat.id}, more than film.beatToleranceSeconds`)
      start = from
    }
    const at = up((start - from) / length)
    const inside = at >= 0 && at < 1
    if (!inside) problems.push(`the line ${key} starts at ${at} of its beat ${beat.id}, which is not inside it`)
    start = from + at * length
    const end = start + line.seconds
    if (end > filmEnd + 1e-9) problems.push(`the line ${key} runs to ${end.toFixed(3)} s and the film ends at ${filmEnd.toFixed(3)} s`)
    ends.set(key, end)
    lastEnd = end
    lines.push({ key, beat: beat.id, draft: line.draft, event: row.event, eventSeconds, start, end, at, waited, inside })
  }
  return { lines, problems, notes }
}
