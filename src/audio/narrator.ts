// The narrator's rules as plain arithmetic on times, so the site and the tests share them.
// A line never interrupts another. A live line keeps its distance from every other line. A line that would be late is dropped.
export interface Booking { id: string; kind: 'beat' | 'live'; group: string; start: number; end: number }

export interface NarratorRules { minGap: number; lineGap: number; beatLate: number; liveLate: number }

export interface BeatLine { id: string; offset: number; seconds: number }

export class Narrator {
  private booked: Booking[] = []

  constructor(readonly rules: NarratorRules) {}

  bookings(now: number): Booking[] {
    this.booked = this.booked.filter((b) => b.end + Math.max(this.rules.minGap, this.rules.lineGap) > now)
    return this.booked
  }

  speaking(now: number): Booking | null {
    return this.booked.find((b) => b.start <= now && b.end > now) ?? null
  }

  private add(b: Booking): Booking {
    this.booked.push(b)
    this.booked.sort((a, x) => a.start - x.start)
    return b
  }

  // The lines of a beat, each wanted at its place. Lines of an earlier beat that have not started are given up.
  beat(now: number, group: string, lines: BeatLine[]): { spoken: Booking[]; dropped: string[]; cancelled: Booking[] } {
    const cancelled = this.bookings(now).filter((b) => b.kind === 'beat' && b.group !== group && b.start > now)
    this.booked = this.booked.filter((b) => !cancelled.includes(b))
    const spoken: Booking[] = []
    const dropped: string[] = []
    for (const line of lines.slice().sort((a, b) => a.offset - b.offset)) {
      const wanted = now + line.offset
      let start = wanted
      let moved = true
      while (moved) {
        moved = false
        for (const b of this.booked) {
          if (start < b.end + this.rules.lineGap && start + line.seconds + this.rules.lineGap > b.start) {
            start = b.end + this.rules.lineGap
            moved = true
          }
        }
      }
      if (start - wanted > this.rules.beatLate + 1e-9) dropped.push(line.id)
      else spoken.push(this.add({ id: line.id, kind: 'beat', group, start, end: start + line.seconds }))
    }
    return { spoken, dropped, cancelled }
  }

  // A live line is spoken now or not at all.
  live(now: number, id: string, group: string, seconds: number): Booking | null {
    let start = now
    for (const b of this.bookings(now)) if (b.start <= start && b.end + this.rules.minGap > start) start = b.end + this.rules.minGap
    if (start - now > this.rules.liveLate + 1e-9) return null
    for (const b of this.booked) if (b.start > start && start + seconds + this.rules.minGap > b.start) return null
    return this.add({ id, kind: 'live', group, start, end: start + seconds })
  }

  clear(): void {
    this.booked = []
  }
}

// The stretches over which the effects are held down: one for each line, joined where two lines sit close together.
export function duckSpans(lines: { start: number; end: number }[], attack: number, release: number): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = []
  for (const l of lines.slice().sort((a, b) => a.start - b.start)) {
    const last = out[out.length - 1]
    if (last && l.start - attack <= last.to + release) last.to = Math.max(last.to, l.end)
    else out.push({ from: l.start, to: l.end })
  }
  return out
}

// The gain of the effects at a time, from 1 down to the ducked level and back.
export function duckAt(t: number, spans: { from: number; to: number }[], low: number, attack: number, release: number, first = 0): number {
  for (let i = first; i < spans.length; i++) {
    const s = spans[i]!
    if (t < s.from - attack) return 1
    if (t < s.from) return 1 + ((t - (s.from - attack)) / attack) * (low - 1)
    if (t <= s.to) return low
    if (t < s.to + release) return low + ((t - s.to) / release) * (1 - low)
  }
  return 1
}
