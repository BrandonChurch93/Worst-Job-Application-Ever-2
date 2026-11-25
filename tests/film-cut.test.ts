import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { eventCues } from '../src/audio/cues'
import { config, filmSeconds } from '../src/config'
import { narration, timedLines } from '../src/copy'
import { cuesText, equivalentMm, framing, makeCut, moveOf, shotsText, type Cut } from '../src/film/cut'
import { pages, preparePages } from '../src/pages'
import { frame, homePose, mixPose } from '../src/stage/camera'
import type { CameraPose } from '../src/stage/types'

const fps = config.film.fps
let cut: Cut

beforeAll(async () => {
  await preparePages()
  cut = makeCut(pages)
})

describe('the cut list', () => {
  it('has the frame count of film B, from film.units and film.fps', () => {
    expect(cut.list.fps).toBe(fps)
    expect(cut.list.frameCount).toBe(Math.round(filmSeconds() * fps))
    expect(cut.list.frameCount).toBe(config.film.units.reduce((n, u) => n + Math.round(u.seconds * fps), 0))
  })

  it('has units that follow one another with no gap and add up to the film', () => {
    let next = 0
    for (const u of cut.list.units) {
      expect(u.first, u.id).toBe(next)
      expect(u.frames, u.id).toBe(u.last - u.first + 1)
      next = u.last + 1
    }
    expect(next).toBe(cut.list.frameCount)
    expect(cut.list.units.reduce((n, u) => n + u.frames, 0)).toBe(cut.list.frameCount)
  })

  it('has beats that fill each unit with no gap and add up to it', () => {
    expect(cut.list.beats.map((b) => b.id)).toEqual(config.film.beats.map((b) => b.id))
    for (const u of cut.list.units) {
      const beats = cut.list.beats.filter((b) => b.unit === u.id)
      let next = u.first
      for (const b of beats) {
        expect(b.first, b.id).toBe(next)
        expect(b.frames, b.id).toBe(b.last - b.first + 1)
        next = b.last + 1
      }
      expect(next, u.id).toBe(u.last + 1)
      expect(beats.reduce((n, b) => n + b.frames, 0), u.id).toBe(u.frames)
    }
    expect(cut.list.beats.reduce((n, b) => n + b.frames, 0)).toBe(cut.list.frameCount)
  })

  it('gives every beat that has an event the frame it fell on, and says inside only when it is', () => {
    const tolerance = Math.round(config.film.beatToleranceSeconds * fps)
    expect(cut.list.beatToleranceFrames).toBe(tolerance)
    for (const b of cut.list.beats) {
      const wanted = (config.film.beats.find((x) => x.id === b.id) as { event?: string | null }).event ?? null
      if (!wanted) {
        expect(b.event, b.id).toBeNull()
        continue
      }
      expect(b.event?.name, b.id).toBe(wanted)
      const e = b.event!
      if (e.frame === null) expect(e.inside, b.id).toBe(false)
      else {
        expect(cut.list.events.some((x) => x.name === wanted && x.frame === e.frame), b.id).toBe(true)
        expect(e.inside, b.id).toBe(e.frame >= b.first - tolerance && e.frame <= b.last + tolerance)
      }
      const told = cut.problems.some((p) => p.includes(`the beat ${b.id} `))
      expect(told, b.id).toBe(!e.inside)
    }
  })

  it('lists every event inside the film, in order, in the beat its frame is in, with its cue', () => {
    let before = -1
    for (const e of cut.list.events) {
      expect(e.frame).toBeGreaterThanOrEqual(0)
      expect(e.frame).toBeLessThan(cut.list.frameCount)
      expect(e.step).toBeGreaterThanOrEqual(before)
      before = e.step
      expect(e.frame).toBe(Math.floor((e.step * fps) / config.sim.stepHz))
      const b = cut.list.beats.find((x) => x.id === e.beat)!
      expect(e.frame >= b.first && e.frame <= b.last, `${e.name} on ${e.frame}`).toBe(true)
      expect(e.cue).toBe(eventCues[e.name] ?? null)
    }
  })

  it('starts every narrator line of the film at its place in its beat', () => {
    const timed = timedLines(config, narration)
    expect(cut.list.lines).toHaveLength(timed.length)
    cut.list.lines.forEach((l, i) => {
      const t = timed[i]!
      const b = cut.list.beats.find((x) => x.id === l.beat)!
      expect(l.text).toBe(t.text)
      expect(l.first, l.id).toBe(Math.round(t.start * fps))
      expect(l.first >= b.first && l.first <= b.last, l.id).toBe(true)
      expect(l.last, l.id).toBeGreaterThanOrEqual(l.first)
      expect(l.length).toBe('estimate')
      const after = cut.list.lines[i + 1]
      if (after) expect(l.gapToNextSeconds!, l.id).toBeCloseTo(after.startSeconds - l.endSeconds, 3)
    })
  })

  it('takes the length of a line from its kept take once there is one', () => {
    const line = cut.list.lines[0]!
    const withTake = makeCut(pages, [{ file: 'audio/kept/a-line.json', record: { text: line.text, seconds: 2.5 } }])
    const l = withTake.list.lines[0]!
    expect(l.length).toBe('take')
    expect(l.take).toBe('audio/kept/a-line.json')
    expect(l.seconds).toBe(2.5)
    expect(l.last).toBe(Math.round((line.startSeconds + 2.5) * fps) - 1)
    expect(withTake.list.lines[1]!.length).toBe('estimate')
  })

  it('carries the opening of film A and the card loop', () => {
    expect(cut.list.opening.frameCount).toBeLessThanOrEqual(config.intro.maxSeconds * fps)
    expect(cut.list.opening.seconds).toBeCloseTo(cut.list.opening.frameCount / fps, 3)
    for (const m of Object.values(cut.list.opening.marks)) {
      expect(Number.isInteger(m)).toBe(true)
      expect(m).toBeGreaterThan(0)
      expect(m).toBeLessThan(cut.list.opening.frameCount)
    }
    expect(cut.list.loop.frameCount).toBe(config.deliver.cardLoop.seconds * fps)
  })

  it('is the same every time it is made', () => {
    expect(JSON.stringify(makeCut(pages).list)).toBe(JSON.stringify(cut.list))
  })

  it('matches cut/CUTLIST.json in its frame counts when the file exists', () => {
    const file = path.resolve(__dirname, '..', 'cut', 'CUTLIST.json')
    if (!fs.existsSync(file)) return
    const kept = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(kept.fps).toBe(fps)
    expect(kept.frameCount).toBe(Math.round(filmSeconds() * fps))
    expect(kept.units.reduce((n: number, u: { frames: number }) => n + u.frames, 0)).toBe(kept.frameCount)
    expect(kept.beats.reduce((n: number, b: { frames: number }) => n + b.frames, 0)).toBe(kept.frameCount)
    expect(kept.opening.frameCount).toBe(cut.list.opening.frameCount)
    expect(kept.loop.frameCount).toBe(cut.list.loop.frameCount)
  })
})

describe('the cue sheet and the shot list', () => {
  it('lists every beat, every event with a cue and every narrator line in the cue sheet', () => {
    const text = cuesText(cut.list)
    for (const b of cut.list.beats) expect(text).toContain(`| \`${b.id}\` | ${(b.first / fps).toFixed(3)} | ${b.first} | ${b.last} |`)
    const cued = cut.list.events.filter((e) => e.cue !== null)
    for (const e of cued) expect(text).toContain(`| ${e.seconds.toFixed(3)} | ${e.frame} | \`${e.beat}\` | \`${e.name}\` | \`${e.cue}\` |`)
    for (const l of cut.list.lines) expect(text).toContain(`| \`${l.id}\` | \`${l.beat}\` | ${l.startSeconds.toFixed(3)} | ${l.first} | ${l.endSeconds.toFixed(3)} | ${l.last} |`)
    expect(text).not.toMatch(/\u2014/)
  })

  it('has one shot for every beat, with a camera, a move and a framing', () => {
    expect(cut.shots.map((s) => s.beat)).toEqual(config.film.beats.map((b) => b.id))
    const text = shotsText(cut.list, cut.shots)
    for (const s of cut.shots) {
      expect(s.cameras.length, s.beat).toBeGreaterThan(0)
      expect(s.move.length, s.beat).toBeGreaterThan(0)
      expect(s.start.w, s.beat).toBeGreaterThan(0)
      expect(text).toContain(`| \`${s.beat}\` | ${s.first} to ${s.last} |`)
      if (s.unit === 'pinball') {
        expect(s.lens.length, s.beat).toBeGreaterThan(0)
        expect(s.focus.length, s.beat).toBeGreaterThan(0)
      }
    }
  })

  it('frames the home camera as the whole screen and a closer camera as its box', () => {
    expect(framing(homePose(0))).toMatchObject({ x: 0, y: 0, w: 1920, h: 1080, corners: null })
    expect(framing(homePose(300))).toMatchObject({ x: 0, y: 300, w: 1920, h: 1080 })
    expect(framing(frame({ x: 480, y: 270, w: 960, h: 540 }))).toMatchObject({ x: 480, y: 270, w: 960, h: 540 })
  })

  it('gives a tilted camera the four corners of its frame on the floor', () => {
    const f = framing({ eye: [0, -2000, 3000], target: [0, 0, 0], fov: 35 })
    expect(f.corners).toHaveLength(4)
    const [tl, tr, br, bl] = f.corners as number[][]
    expect(tr![0]! - tl![0]!).toBeGreaterThan(br![0]! - bl![0]!)
    expect(tl![1]!).toBeLessThan(bl![1]!)
  })

  it('names the move of a shot from its framings', () => {
    const wide = homePose(0)
    const close = frame({ x: 480, y: 270, w: 960, h: 540 })
    const run = (pose: (u: number) => CameraPose, n = 60) => Array.from({ length: n }, (_, i) => ({ pose: pose(i / (n - 1)), camera: 'home', page: 'p' }))
    expect(moveOf(run(() => wide))).toEqual({ move: 'holds', cuts: [] })
    expect(moveOf(run((u) => mixPose(wide, close, u))).move).toBe('pushes in')
    expect(moveOf(run((u) => mixPose(close, wide, u))).move).toBe('eases out')
    expect(moveOf(run((u) => homePose(600 * u))).move).toBe('follows')
    expect(moveOf(run((u) => homePose(9 * Math.sin(u * 40) * (1 - u)))).move).toBe('holds, shakes')
    expect(moveOf(run((u) => (u < 0.5 ? wide : close)))).toEqual({ move: 'holds, cuts once', cuts: [30] })
    const turn = run((u) => (u < 0.5 ? wide : close)).map((s, i) => ({ ...s, page: i < 30 ? 'p' : 'q' }))
    expect(moveOf(turn).cuts).toEqual([])
  })

  it('names a lens by the focal length with the same horizontal view on a 36 mm frame', () => {
    expect(equivalentMm(35)).toBeCloseTo(18 / (Math.tan((35 * Math.PI) / 360) * (16 / 9)), 1)
    expect(equivalentMm(12)).toBeGreaterThan(equivalentMm(35))
  })
})
