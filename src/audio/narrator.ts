// The narrator's rules as plain arithmetic on times, so the site and the tests share them.
// A line never interrupts another. A live line keeps its distance from every other line. A line that would be late is not said.
// On the live site a line is said once in a run. A line whose event comes while another is spoken waits for its end and the gap, and is taken back if its moment ends first.
export interface Booking { id: string; kind: 'beat' | 'live'; group: string; start: number; end: number }

export interface NarratorRules { minGap: number; lineGap: number; beatLate: number; liveLate: number }

export interface BeatLine { id: string; offset: number; seconds: number }

export class Narrator {
  private booked: Booking[] = []
  // Why the last line asked of live() was not booked, in words; null when it was.
  why: string | null = null

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

  // A live line starts as soon as nothing is said and the gap since the last line is kept. If that is later than it may wait, it is not spoken at all.
  live(now: number, id: string, group: string, seconds: number, wait: number = this.rules.liveLate, gap: number = this.rules.minGap, from: number = now): Booking | null {
    let start = Math.max(now, from)
    let after = ''
    this.why = null
    for (const b of this.bookings(now)) if (b.start <= start && b.end + gap > start) {
      start = b.end + gap
      after = b.id
    }
    if (start - now > wait + 1e-9) {
      this.why = wait < 0 ? 'it may not be said here' : `it could start ${(start - now).toFixed(2)} s after its trigger, ${this.rules.minGap} s after ${after} ends, and may wait ${wait.toFixed(2)} s`
      return null
    }
    for (const b of this.booked) if (b.start > start && start + seconds + this.rules.minGap > b.start) {
      this.why = `it would end less than ${this.rules.minGap} s before ${b.id}, which is booked`
      return null
    }
    return this.add({ id, kind: 'live', group, start, end: start + seconds })
  }

  // A line that has not started is taken back. One that has started is left to end.
  cancel(now: number, b: Booking): boolean {
    if (b.start <= now || !this.booked.includes(b)) return false
    this.booked = this.booked.filter((x) => x !== b)
    return true
  }

  clear(): void {
    this.booked = []
  }
}

// gap: the silence kept after the line before, the kit's gap when none is given. from: the line starts no sooner than this.
export interface LiveAsk { id: string; group: string; seconds: number; page: string | null; until: string[]; gap?: number; from?: number }

// The lines of a run of the live site. Each is asked for once, when its event comes: it starts at once, or after the line before it and the gap.
// A line that waits belongs to its moment: an event that ends the moment, or a turn or a skip of its page, takes it back before it began. A line that has begun is left to end.
export class LiveDesk {
  private spent = new Set<string>()
  private waiting = new Map<Booking, { page: string | null; until: string[] }>()
  private current: string | null = null

  constructor(readonly narrator: Narrator, readonly pageOfLine: Record<string, string>) {}

  get page(): string | null { return this.current }

  isSpent(id: string): boolean { return this.spent.has(id) }

  ask(now: number, a: LiveAsk): Booking | null {
    if (this.spent.has(a.id)) return null
    this.spent.add(a.id)
    const b = this.narrator.live(now, a.id, a.group, a.seconds, Infinity, a.gap, a.from)
    if (b) this.waiting.set(b, { page: a.page, until: a.until })
    return b
  }

  private takeBack(now: number, gone: (w: { page: string | null; until: string[] }) => boolean): Booking[] {
    const out: Booking[] = []
    for (const [b, w] of [...this.waiting]) {
      if (b.end <= now) this.waiting.delete(b)
      else if (gone(w) && this.narrator.cancel(now, b)) {
        this.waiting.delete(b)
        out.push(b)
      }
    }
    return out
  }

  // An event of the stage on a page: the lines whose moment it ends, and which have not begun, are taken back.
  ended(now: number, page: string, name: string): Booking[] {
    return this.takeBack(now, (w) => w.page === page && w.until.includes(name))
  }

  // The stage is on this page now. If it was on another, that one is left.
  at(now: number, page: string): Booking[] {
    const from = this.current
    this.current = page
    return from !== null && from !== page ? this.leave(now, from) : []
  }

  // A page is left, by its end or by a skip. Its lines that wait are taken back and its lines are not said afterwards in this run.
  leave(now: number, page: string): Booking[] {
    for (const [id, p] of Object.entries(this.pageOfLine)) if (p === page) this.spent.add(id)
    return this.takeBack(now, (w) => w.page === page)
  }

  // A new run of the site: the careers page is on screen again. Every line may be said once more.
  restart(): void {
    this.spent.clear()
  }

  // Everything that waits is forgotten. What was said in this run stays said.
  clear(): void {
    this.waiting.clear()
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
