import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { makeLoop, makeOpening } from '../src/film'
import { boltFlights, cursorAt, cursorTrack, fireScene, fireScript, LOOP_SECONDS, TRACK_DELAY } from '../src/film/fire'
import { cropOf, cursorBox, inside, threatOf } from '../src/film/loop'
import { buildLayout, openingFrames, openingSeconds, openingTimes, promptLayout, typedAt, LEVEL_SECONDS, SEND_SECONDS } from '../src/film/opening'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords, words } from '../src/shell/words'

const intro = config.intro
const fps = config.film.fps

describe('the opening of film A', () => {
  const opening = makeOpening()

  it('is as long as the numbers of intro give, and no longer than intro.maxSeconds', () => {
    const seconds = intro.prompt.length / intro.charsPerSecond + LEVEL_SECONDS + intro.readHoldSeconds + SEND_SECONDS + intro.steps.length * intro.stepSeconds + intro.endHoldSeconds
    expect(openingSeconds()).toBeCloseTo(seconds, 9)
    expect(opening.frameCount).toBe(Math.ceil(seconds * fps - 1e-9))
    expect(opening.frameCount).toBe(openingFrames())
    expect(opening.seconds).toBeCloseTo(opening.frameCount / fps, 9)
    expect(opening.seconds).toBeLessThanOrEqual(intro.maxSeconds)
    expect(opening.size).toEqual({ width: 1920, height: 1080 })
  })

  it('types the prompt at intro.charsPerSecond, holds it for intro.readHoldSeconds and fills a line every intro.stepSeconds', () => {
    const t = openingTimes()
    expect(typedAt(0)).toBe(intro.prompt.slice(0, 1))
    expect(typedAt(1)).toBe(intro.prompt.slice(0, intro.charsPerSecond + 1))
    expect(typedAt(t.typed)).toBe(intro.prompt)
    expect(t.held - t.levelCloses).toBeGreaterThanOrEqual(intro.readHoldSeconds)
    expect(t.sent - t.typed).toBeGreaterThanOrEqual(intro.readHoldSeconds)
    t.lines.forEach((l, i) => {
      expect(l.done - l.shown).toBeCloseTo(intro.stepSeconds, 9)
      if (i > 0) expect(l.done - t.lines[i - 1]!.done).toBeCloseTo(intro.stepSeconds, 9)
    })
    expect(t.end - t.lines.at(-1)!.done).toBeCloseTo(intro.endHoldSeconds, 9)
  })

  it('holds no word of its own: every string resolves to a key of the config', () => {
    const allowed = new Set(['intro.prompt', 'intro.title', 'intro.reasoningLevel', ...intro.steps.map((_, i) => `intro.steps.${i}`)])
    const seen = new Set<string>()
    for (const tree of [promptLayout(), buildLayout()]) {
      for (const r of typeRegister(tree)) {
        if (r.made === 'runtime') continue
        expect(allowed.has(r.key), r.key).toBe(true)
        expect(hasWords(r.key)).toBe(true)
        seen.add(r.key)
      }
    }
    for (let i = 0; i < opening.frameCount; i += 3) {
      for (const s of opening.frame(i).list) {
        if (s.kind !== 'text') continue
        if (s.words!.startsWith('runtime:')) {
          expect(intro.prompt.startsWith(s.text!)).toBe(true)
          continue
        }
        expect(allowed.has(s.words!), s.words).toBe(true)
        expect(s.text).toBeUndefined()
        seen.add(s.words!)
      }
    }
    expect([...seen].sort()).toEqual(['intro.reasoningLevel', 'intro.title', ...intro.steps.map((_, i) => `intro.steps.${i}`)].sort())
    expect(words('intro.steps.0')).toBe(intro.steps[0])
  })

  it('shows the whole prompt before it is sent and every line of intro.steps by the end', () => {
    const t = openingTimes()
    const before = opening.frame(Math.floor(t.sent * fps) - 1)
    expect(before.list.find((s) => s.id === 'prompt-typed')!.text).toBe(intro.prompt)
    expect(before.list.some((s) => s.words === 'intro.reasoningLevel' && s.id === 'level-word')).toBe(true)
    const last = opening.frame(opening.frameCount - 1)
    for (let i = 0; i < intro.steps.length; i++) {
      expect(last.list.some((s) => s.words === `intro.steps.${i}`)).toBe(true)
      expect(last.list.some((s) => s.id === `build-done-${i}`)).toBe(true)
    }
    expect(last.list.some((s) => s.words === 'intro.title')).toBe(true)
  })

  it('starts on a finished picture: frame 0 has the screen, the input, the caret, the level control and the send button', () => {
    const f = opening.frame(0)
    const ids = new Set(f.list.map((s) => s.id))
    for (const id of ['opening-prompt-screen', 'prompt-panel', 'prompt-typed', 'prompt-caret', 'level', 'send', 'send-mark']) expect(ids.has(id), id).toBe(true)
    expect(f.list.find((s) => s.id === 'prompt-typed')!.text).toBe(intro.prompt[0])
    expect(f.turn).toBe(0)
    expect(f.cursor.onPage).toBe(false)
    for (const s of f.list) expect(s.part).toBe('opening')
  })

  it('draws the reasoning level control open on its mark, and its marks fall where they say', () => {
    const t = openingTimes()
    const { typing, level, build } = opening.marks
    expect(typing / fps).toBeLessThan(t.typed)
    expect(opening.frame(level).list.some((s) => s.id === 'level-menu')).toBe(true)
    expect(opening.frame(level).list.some((s) => s.id === 'level-option-word')).toBe(true)
    expect(build / fps).toBeGreaterThan(t.sent)
    expect(build).toBeLessThan(opening.frameCount)
    let open = 0
    for (let i = 0; i < opening.frameCount; i++) if (opening.frame(i).list.some((s) => s.id === 'level-menu')) open++
    expect(open).toBeGreaterThanOrEqual(12)
  })

  it('lays both screens out with nothing outside the screen, nothing overlapping and even gaps', () => {
    expect(layoutProblems(promptLayout(), { width: 1920, height: 1080 })).toEqual([])
    expect(layoutProblems(buildLayout(), { width: 1920, height: 1080 })).toEqual([])
  })

  it('is a pure function of the index, whole or fractional', () => {
    const a = JSON.stringify(opening.frame(200.25))
    opening.frame(650)
    opening.frame(3)
    expect(JSON.stringify(opening.frame(200.25))).toBe(a)
    expect(opening.pose(10)).toEqual(opening.pose(500))
  })

  it('has no surface that is pure black or pure white, and no cursor', () => {
    for (const i of [0, opening.marks.level, opening.marks.build]) for (const s of opening.frame(i).list) expect(['dark', 'raised', 'metal', 'pocket', 'accent', 'light', 'ink', 'inkLight']).toContain(s.tone)
  })
})

describe('the card loop', () => {
  const loop = makeLoop()
  const frames = Math.round(config.deliver.cardLoop.seconds * fps)

  it('is deliver.cardLoop.seconds long at film.fps and shows the first candidate', () => {
    expect(loop.frameCount).toBe(frames)
    expect(loop.seconds).toBe(config.deliver.cardLoop.seconds)
    expect(loop.scene).toBe(config.deliver.cardLoop.candidates[0])
    expect(loop.scene).toBe('step1-fire')
  })

  it('closes: the frame one past the last is frame 0, also with the shutter open', () => {
    expect(loop.frame(frames)).toEqual(loop.frame(0))
    expect(loop.frame(frames + 0.25)).toEqual(loop.frame(0.25))
    expect(loop.frame(frames + 0.5)).toEqual(loop.frame(0.5))
    expect(loop.frame(-1)).toEqual(loop.frame(frames - 1))
    expect(loop.state(frames)).toEqual(loop.state(0))
    expect(loop.pose(frames)).toEqual(loop.pose(0))
  })

  it('moves from the first frame and has no jump at the seam', () => {
    const a = loop.frame(0).cursor
    const b = loop.frame(1).cursor
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1)
    const last = loop.frame(frames - 1).cursor
    const before = loop.frame(frames - 2).cursor
    const stride = Math.hypot(last.x - before.x, last.y - before.y)
    expect(Math.hypot(a.x - last.x, a.y - last.y)).toBeLessThan(stride * 2 + 2)
    expect(cursorTrack().seam).toBeLessThan(1e-6)
  })

  it('has only periods that divide its length: the cursor, every key, every bolt and every mark come round after 8 s', () => {
    for (const i of [0, 22.25, 63, 174, 222, 222.5, 225, 312, 479, 479.5]) {
      expect(loop.frame(i + frames)).toEqual(loop.frame(i))
      expect(loop.frame(i + 2 * frames)).toEqual(loop.frame(i))
      expect(loop.frame(i - frames)).toEqual(loop.frame(i))
      expect(loop.state(i + frames)).toEqual(loop.state(i))
    }
    expect(fireScene(1.25)).toEqual(fireScene(0.25))
    for (const f of boltFlights()) {
      expect(f.seconds).toBeGreaterThan(0.1)
      expect(f.seconds).toBeLessThan(LOOP_SECONDS)
    }
    expect(fireScript.markSeconds).toBeLessThan(LOOP_SECONDS)
    const ids = new Map<string, number>()
    for (let i = 0; i < frames; i++) for (const s of loop.frame(i).list) ids.set(s.id, (ids.get(s.id) ?? 0) + 1)
    for (const b of fireScript.bolts) expect(ids.get(`fire-${b.id}`)).toBeGreaterThan(5)
  })

  it('keeps the cursor and what it is up against inside a centred 4:3 crop and a centred square crop on every frame', () => {
    const wide = cropOf(4 / 3)
    const square = cropOf(1)
    expect(wide).toEqual({ x: 240, y: 0, w: 1440, h: 1080 })
    expect(square).toEqual({ x: 420, y: 0, w: 1080, h: 1080 })
    for (let i = 0; i <= frames; i++) {
      for (const at of [i, i + 0.5]) {
        const time = (at / fps) % LOOP_SECONDS
        const cursor = cursorBox(cursorAt(time))
        const threat = threatOf(fireScene(time / LOOP_SECONDS).threats, cursor)
        expect(threat, `no bolt and no mark at frame ${at}`).not.toBeNull()
        const s = loop.state(at)
        expect(s.threat).toEqual(threat)
        expect(s.cursor).toEqual(cursor)
        for (const crop of [wide, square]) {
          expect(inside(s.cursor, crop), `cursor at frame ${at}`).toBe(true)
          expect(inside(s.threat, crop), `threat at frame ${at}`).toBe(true)
        }
      }
    }
  })

  it('plays fair: a turret fires at where the cursor was, a dodged bolt lands where the cursor no longer is, and one bolt hits', () => {
    for (const f of boltFlights()) {
      const aimed = cursorAt(f.fire - TRACK_DELAY)
      const there = cursorAt(f.plan.land)
      const gone = Math.hypot(there.x + 18 - f.to.x, there.y + 30 - f.to.y)
      if (f.plan.hits) expect(gone).toBeLessThan(4)
      else {
        expect(Math.hypot(aimed.x - f.to.x, aimed.y - f.to.y), f.plan.id).toBeLessThan(60)
        expect(gone, f.plan.id).toBeGreaterThan(70)
      }
    }
    expect(fireScript.bolts.filter((b) => b.hits).length).toBe(1)
    const hit = fireScript.hit.land
    expect(cursorAt(hit + 0.1).damage).toEqual(['burn'])
    expect(cursorAt(hit - 0.01).damage).toEqual([])
    expect(cursorAt(0).damage).toEqual([])
  })

  it('has one cursor with no arms, one size and no face to give', () => {
    for (let i = 0; i < frames; i++) {
      const f = loop.frame(i)
      expect(f.cursors).toBeUndefined()
      expect(f.cursor.arms).toBe(false)
      expect(f.cursor.hands).toBeNull()
      expect(f.cursor.scale).toBe(1)
      expect(f.cursor.onPage).toBe(true)
    }
  })

  it('marks its own shapes as stand-ins of the keyboard and the turrets', () => {
    const parts = new Set(loop.frame(100).list.filter((s) => s.id.startsWith('fire-')).map((s) => s.part))
    expect([...parts].sort()).toEqual(['keyboard', 'turrets'])
  })
})
