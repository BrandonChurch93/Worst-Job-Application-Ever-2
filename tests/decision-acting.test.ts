import { expect, test } from 'vitest'
import { config } from '../src/config'
import fast from '../pipeline/change002/fast-takes.json'
import { ARRIVE, CUES, GIVE, HOPE, READ, STUCK, pointerAt, type Marks } from '../src/pages/step5/script'
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
  // There was a look at the button 0.25 s or more before the walk. The last phrase without pauses is 1.23 s and the press is 0.15 s before its end: the walk of 0.6 s and the hold of 0.4 s fill it, so the walk starts as the arrow sags.
  expect(GIVE.walk[0]).toBeGreaterThanOrEqual(READ.sag)
  expect(GIVE.walk[0] - READ.sag).toBeLessThan(0.2)
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

test('the phrase times the acting keeps are those of line 8 said without pauses: other numbers fail here', () => {
  // On this branch SAID is held to the provisional numbers; it goes back to public/audio/index.json (standIns().get('decision.letter.0')) when the take is kept.
  const take = fast.lines['line.decision.letter.0']
  expect(take.starts).toHaveLength(5)
  expect(SAID).toHaveLength(take.starts.length + 1)
  for (let i = 0; i < take.starts.length; i++) expect(SAID[i]).toBe(take.starts[i])
  expect(SAID[take.starts.length]).toBe(take.seconds)
})

test('the arrow acts the line: flat under the first phrase, up under the second, up on the fourth, down on the fifth, and nothing else', () => {
  const frame = 1 / 30
  // The arrow is flat from the hit, lies still on the page for 0.4 s or more, and is whole as "the company" ends, no later than it would be for a visitor by more than 0.1 s.
  expect(FILM.landed + FILM.heal / 2 - FILM.flat).toBeGreaterThanOrEqual(2)
  expect(FILM.heal / 2).toBeGreaterThanOrEqual(0.4)
  expect(FILM.landed + FILM.heal).toBeCloseTo(FILM.flat + SAID[2]!, 9)
  expect(FILM.heal - STUCK.heal).toBeLessThan(0.1)
  // No damage lasts longer than cursor.damageHealSeconds from the hit.
  expect(FILM.heal + (FILM.landed - FILM.flat)).toBeLessThan(config.cursor.damageHealSeconds)
  // Two moves and no more, each as its phrase starts, each pose held a second or more; the first comes a second or more after the arrow is whole.
  expect(READ.look).toBeCloseTo(FILM.flat + SAID[3]!, 6)
  expect(READ.sag).toBeCloseTo(FILM.flat + SAID[4]!, 6)
  expect(READ.look - (FILM.landed + FILM.heal)).toBeGreaterThanOrEqual(1)
  expect(READ.sag - READ.look).toBeGreaterThanOrEqual(1)
  expect(FILM.press - READ.sag).toBeGreaterThanOrEqual(1)
  const said = CUES.filter((c) => c.at >= FILM.flat)
  expect(said.map((c) => c.act ?? c.react)).toEqual(['proud', 'exhausted', 'stamp'])
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
  // The film's press is 0.15 s before the line's end: the film turns AT.hold after it, as its config says.
  expect(holdAfterPress(FILM.press - FILM.flat)).toBe(AT.hold)
})
