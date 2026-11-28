import { expect, test } from 'vitest'
import { config } from '../src/config'
import { standIns } from '../src/audio/standin'
import { ARRIVE, CUES, GIVE, HOPE, READ, pointerAt, type Marks } from '../src/pages/step5/script'
import { AT, FILM, SAID, holdAfterPress } from '../src/pages/step5/timeline'

const marks: Marks = { hand: { x: 960, y: 540 }, wait: { x: 1400, y: 780 }, spot: { x: 700, y: 620 }, drop: { x: 1300, y: 700 }, press: { x: 900, y: 800 } }
const moved = (a: number, b: number): number => {
  const p = pointerAt(marks, a)
  const q = pointerAt(marks, b)
  return Math.hypot(q.x - p.x, q.y - p.y)
}

test('the cursor starts at the hand-off place, backs off the counter and holds its place for the rest of the wait', () => {
  expect(moved(0, ARRIVE.look)).toBe(0)
  expect(pointerAt(marks, 0)).toMatchObject(marks.hand)
  expect(pointerAt(marks, ARRIVE.there)).toMatchObject(marks.wait)
  expect(AT.decide - ARRIVE.there).toBeGreaterThanOrEqual(0.4)
  expect(moved(ARRIVE.there, AT.decide)).toBe(0)
})

test('the letter is taken standing: a held tilt, a held puff, the dusting, and only then the walk to the corner the block strikes', () => {
  expect(moved(ARRIVE.there, HOPE.walk[0])).toBe(0)
  expect(HOPE.tilt).toBeGreaterThanOrEqual(AT.decide + AT.drop[1])
  expect(HOPE.proud - HOPE.tilt).toBeGreaterThanOrEqual(0.4)
  expect(HOPE.proud).toBeCloseTo(AT.decide + AT.proud, 5)
  expect(HOPE.dust - HOPE.proud).toBeGreaterThanOrEqual(0.4)
  expect(HOPE.walk[0]).toBeGreaterThanOrEqual(HOPE.dust + 0.4)
  expect(HOPE.walk[1]).toBeLessThanOrEqual(AT.decide + AT.pull)
  expect(AT.slam[1] - AT.loom).toBeGreaterThanOrEqual(0.4)
  expect(moved(HOPE.walk[1], FILM.flat)).toBe(0)
  expect(pointerAt(marks, FILM.landed)).toMatchObject(marks.drop)
  expect(moved(FILM.landed, GIVE.walk[0])).toBe(0)
})

test('the beaten walk to the button is slow, ends in a hold of at least 0.4 s and then one press', () => {
  // Was 0.4. The take's last phrase is 1.73 s and the press is 0.14 s before its end: the sag, the look, the walk of 0.6 s and the hold of 0.4 s must fit in 1.59 s.
  expect(GIVE.walk[0] - GIVE.look).toBeGreaterThanOrEqual(0.25)
  expect(GIVE.walk[1] - GIVE.walk[0]).toBeGreaterThanOrEqual(0.6)
  expect(FILM.press - GIVE.walk[1]).toBeGreaterThanOrEqual(0.4)
  expect(moved(GIVE.walk[1], FILM.press)).toBe(0)
  expect(pointerAt(marks, FILM.press - 0.01).down).toBe(false)
  expect(pointerAt(marks, FILM.press + 0.01).down).toBe(true)
  expect(pointerAt(marks, FILM.press + 0.3).down).toBe(false)
})

test('every cue of the acting sits before the press and in order', () => {
  for (let i = 0; i < CUES.length; i++) {
    expect(CUES[i]!.at).toBeGreaterThan(0)
    expect(CUES[i]!.at).toBeLessThan(FILM.press)
    if (i > 0) expect(CUES[i]!.at).toBeGreaterThan(CUES[i - 1]!.at + 0.3)
  }
})

test('the phrase times the acting keeps are those of the kept take of line 8: a new or edited take fails here', () => {
  const take = standIns().get('decision.letter.0')!
  expect(take.phrases).toHaveLength(5)
  expect(SAID).toHaveLength(take.phrases.length + 1)
  for (let i = 0; i < take.phrases.length; i++) expect(SAID[i]).toBe(take.phrases[i]!.from)
  expect(SAID[take.phrases.length]).toBe(take.seconds)
})

test('the arrow acts the line: flat under the first phrase, up in the pause after it, a move in each pause, up on the fourth, down on the fifth, each pose held', () => {
  const frame = 1 / 30
  // The arrow lies flat a second or more, and the peel (the second half of the heal) starts in the pause before the second phrase, not under the first phrase's words.
  expect(FILM.heal / 2).toBeGreaterThanOrEqual(1)
  expect(FILM.flat + SAID[1]! - (FILM.landed + FILM.heal / 2)).toBeLessThan(0.7)
  // No damage lasts longer than cursor.damageHealSeconds from the hit, so the arrow is whole as the second phrase is said, and stands 0.2 s or more before its next move.
  expect(FILM.heal + (FILM.landed - FILM.flat)).toBeLessThan(config.cursor.damageHealSeconds)
  expect(FILM.landed + FILM.heal).toBeGreaterThan(FILM.flat + SAID[1]!)
  expect(FILM.landed + FILM.heal).toBeLessThan(READ.dust - 0.2)
  expect(READ.hear).toBeCloseTo(FILM.flat + SAID[2]!, 6)
  expect(READ.look).toBeCloseTo(FILM.flat + SAID[3]!, 6)
  expect(READ.sag).toBeCloseTo(FILM.flat + SAID[4]!, 6)
  // A move in each pause: it starts no sooner than 1.2 s before the phrase that follows (the take's pauses are about that long), is over 0.2 s or more before it, and starts 0.2 s or more after the pose before it was taken.
  const lasts = { dustOff: 0.9, anticipate: 0.35, jump: 0.5 }
  const pauses: [number, number, number, number][] = [[READ.dust, lasts.dustOff, READ.hear, FILM.landed + FILM.heal], [READ.breath, lasts.anticipate, READ.look, READ.hear], [READ.hop, lasts.jump, READ.sag, READ.look]]
  for (const [at, long, next, before] of pauses) {
    expect(next - at).toBeLessThanOrEqual(1.2)
    expect(next - (at + long)).toBeGreaterThanOrEqual(0.2)
    expect(at - before).toBeGreaterThanOrEqual(0.2)
  }
  expect(READ.sag - READ.look).toBeGreaterThanOrEqual(0.2)
  expect(GIVE.look - READ.sag).toBeGreaterThanOrEqual(0.2)
  const said = CUES.filter((c) => c.at >= READ.dust)
  expect(said.map((c) => c.act ?? c.react)).toEqual(['dustOff', 'nervous', 'anticipate', 'proud', 'jump', 'exhausted', 'doubleTake', 'stamp'])
  expect(FILM.press).toBeLessThanOrEqual(FILM.flat + SAID[5]!)
  expect(FILM.leave).toBeGreaterThanOrEqual(FILM.flat + SAID[5]! + config.audio.lineGapSeconds - 1e-9)
  expect(FILM.leave).toBeLessThan(FILM.flat + SAID[5]! + config.audio.lineGapSeconds + frame)
  expect(Math.abs(FILM.press * 30 - Math.round(FILM.press * 30))).toBeLessThan(1e-6)
})

test('a press while the line is being said holds the page to the end of the phrase being said and the gap; a press after the line turns as before', () => {
  const gap = config.audio.lineGapSeconds
  expect(holdAfterPress(-1)).toBe(AT.hold)
  expect(holdAfterPress(SAID[5])).toBe(AT.hold)
  expect(holdAfterPress(SAID[5] + 3)).toBe(AT.hold)
  for (let i = 0; i < 5; i++) {
    const at = SAID[i]! + 0.4
    expect(holdAfterPress(at)).toBeCloseTo(SAID[i + 1]! - at + gap, 9)
    expect(holdAfterPress(SAID[i + 1]! - 0.001)).toBeCloseTo(Math.max(AT.hold, 0.001 + gap), 9)
  }
  let longest = 0
  for (let t = 0; t < SAID[5]; t += 0.01) longest = Math.max(longest, holdAfterPress(t))
  expect(longest).toBeLessThanOrEqual(3.5 + gap)
  // The film's press is 0.14 s before the line's end: the film turns AT.hold after it, as its config says.
  expect(holdAfterPress(FILM.press - FILM.flat)).toBe(AT.hold)
})
