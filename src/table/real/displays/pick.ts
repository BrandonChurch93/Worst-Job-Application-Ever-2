import type { RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { words } from '../../../shell/words'
import { zoneAt } from '../../draw'
import { PACE, modeSeconds, scrollSeconds, type Show } from './screen'

const MODE = /^copy:step3\.table\.modes\.(\d+)\.display$/
const SCORE = 'runtime:score'
// With no time on a mode's shape the line is shown in a round of its own length and this much of the score, on the frame's time.
const REST = 4

const first = (s: Shape, i: number): number | undefined => (s.v !== undefined && s.v.length > i ? s.v[i] : undefined)

// A mode that lights is shown at once and cuts the line that is running. A line that was cut waits and is shown whole, once, in the order the modes were lit, as soon as no newer mode is on.
export function running(lit: { id: string; since: number; line: string }[]): { id: string; t: number } | null {
  const order = lit.map((m) => ({ id: m.id, line: m.line, at: -Math.max(0, m.since) })).sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1))
  const wait: typeof order = []
  let on: { m: (typeof order)[number]; from: number; again: boolean } | null = null
  const ends = (): number => on!.from + (on!.again ? scrollSeconds(on!.m.line) : modeSeconds(on!.m.line))
  const run = (to: number): void => {
    while (on && ends() <= to) {
      const next = wait.shift()
      on = next ? { m: next, from: ends(), again: true } : null
    }
  }
  for (const m of order) {
    run(m.at)
    if (on) wait.push(on.m)
    on = { m, from: m.at, again: false }
  }
  run(0)
  return on ? { id: on.m.id, t: (on.again ? PACE.hold : 0) - on.from } : null
}

// What all four displays show on this frame, read from the `text` shapes of the part and from nothing else.
export function pick(ctx: RealContext): Show {
  const hint = ctx.byId.get('display.hint')
  if (hint && hint.part === 'displays') return { kind: 'hint', t: first(hint, 0) ?? ctx.time }
  const modes: Shape[] = []
  let scoreShape: Shape | null = null
  for (const s of ctx.list) {
    if (s.part !== 'displays' || s.kind !== 'text' || !s.words) continue
    if (MODE.test(s.words)) modes.push(s)
    else if (s.words === SCORE && (scoreShape === null || s.id === 'marquee-score')) scoreShape = s
  }
  const score: Show = scoreShape
    ? { kind: 'score', digits: words(scoreShape.words!, scoreShape.text), since: first(scoreShape, 0) ?? 9, before: first(scoreShape, 1) === undefined ? null : String(Math.round(first(scoreShape, 1)!)).padStart(words(scoreShape.words!, scoreShape.text).length, '0') }
    : { kind: 'blank' }
  if (modes.length === 0) return score
  const say = (s: Shape, t: number): Show => ({ kind: 'mode', name: words(s.words!.replace(/\.display$/, '.insert')), line: words(s.words!), t })
  const timed = modes.filter((s) => first(s, 0) !== undefined)
  if (timed.length > 0) {
    const now = running(timed.map((s) => ({ id: s.id, since: first(s, 0)!, line: words(s.words!) })))
    return now ? say(timed.find((s) => s.id === now.id)!, now.t) : scoreShape ? score : say(timed[timed.length - 1]!, 0)
  }
  const ball = ctx.byId.get('ball.clear')
  const where = ball ? zoneAt(ball.y + ball.h / 2) : ''
  const here = modes.filter((s) => s.id.startsWith(`display.${where}.`))
  const s = here.length > 0 ? here[here.length - 1]! : modes[modes.length - 1]!
  if (!scoreShape) return say(s, ctx.time % modeSeconds(words(s.words!)))
  const round = modeSeconds(words(s.words!)) + REST
  const t = ((ctx.time % round) + round) % round
  return t < round - REST ? say(s, t) : score
}
