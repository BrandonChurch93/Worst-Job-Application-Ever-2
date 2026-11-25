import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BANNED, blockoutGroups, briefFor, fileName, neutral, packPlan, pinballCameras, splitGroups } from '../tools/lib/pack-plan.mjs'
import { actingWindow, controlWindows, riskyType, windowRound, wrap } from '../tools/lib/pack-build.mjs'
import { ARROW_BODY, cursorBox } from '../tools/lib/image.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const kit = fs.readFileSync(path.join(root, 'kit/07-QUALITY-BAR.md'), 'utf8')
const plan = packPlan(cfg, { role: 'R4-blockout', round: 1, unit: 'blockout' })
const files = plan.sets.flatMap((s: { files: unknown[] }) => s.files) as { name: string; kind: string; heading: string; frames?: number[]; cameras?: { camera: string; purpose: string }[]; unit?: string; beat?: string }[]

describe('the blockout pack', () => {
  it('holds what its section of the kit lists', () => {
    const units = cfg.film.units.map((u: { id: string }) => u.id)
    expect(files.filter((f) => f.kind === 'page').map((f) => f.unit)).toEqual(units)
    expect(files.filter((f) => f.kind === 'beat-sheet').map((f) => f.beat)).toEqual(cfg.film.beats.filter((b: { unit: string }) => b.unit === 'step1').map((b: { id: string }) => b.id))
    const cams = files.filter((f) => f.kind === 'cameras').flatMap((f) => f.cameras!.map((c) => c.camera))
    expect([...cams].sort()).toEqual(Object.keys(cfg.cameras).filter((c) => c !== 'home' && c !== 'sheet').sort())
    expect(files.filter((f) => f.kind === 'screen').length).toBe(2)
    expect(files.some((f) => f.kind === 'type-crops')).toBe(true)
    expect(files.some((f) => f.kind === 'control-crops')).toBe(true)
  })

  it('shows the whole film in order, a frame every two seconds or closer', () => {
    const sheets = files.filter((f) => f.kind === 'film-sheet')
    const frames = sheets.flatMap((f) => f.frames!)
    expect(frames[0]).toBe(0)
    expect([...frames].sort((a, b) => a - b)).toEqual(frames)
    expect(new Set(frames).size).toBe(frames.length)
    for (const s of sheets) {
      expect(s.frames!.length).toBe(cfg.critics.contactSheetFrames)
      for (let i = 1; i < s.frames!.length; i++) expect((s.frames![i]! - s.frames![i - 1]!) / cfg.film.fps).toBeLessThanOrEqual(2)
    }
    const last = cfg.film.units.reduce((n: number, u: { seconds: number }) => n + u.seconds, 0) * cfg.film.fps - 1
    expect(last - frames[frames.length - 1]!).toBeLessThan(cfg.film.fps / cfg.film.previewFps)
  })

  it('gives no critic more files than a message carries, and every file to one critic', () => {
    for (const s of plan.sets) expect(s.files.length).toBeLessThanOrEqual(cfg.critics.maxFilesPerMessage)
    expect(new Set(files.map((f) => f.name)).size).toBe(files.length)
    expect(plan.sets.map((s: { critic: string }) => s.critic)).toEqual(plan.sets.map((_: unknown, i: number) => `reviewer-${String(i + 1).padStart(2, '0')}`))
  })

  it('uses neutral names and headings', () => {
    for (const f of files) {
      expect(neutral(f.name)).toBe(true)
      expect(BANNED.test(f.heading)).toBe(false)
      for (const c of f.cameras ?? []) expect(BANNED.test(c.purpose)).toBe(false)
    }
    expect(neutral('set-A-07.png')).toBe(true)
    expect(neutral('final-A-07.png')).toBe(false)
    expect(neutral('set-A-7.png')).toBe(false)
    expect(BANNED.test('the tray tips')).toBe(false)
    expect(BANNED.test('a final frame')).toBe(true)
    expect(fileName('C', 4)).toBe('set-C-04.png')
  })

  it('is the same plan every time', () => {
    expect(JSON.stringify(packPlan(cfg, { role: 'R4-blockout', round: 1, unit: 'blockout' }))).toBe(JSON.stringify(plan))
  })

  it('names a purpose for every pinball camera', () => {
    for (const c of pinballCameras(cfg)) {
      expect(c.purpose.length).toBeGreaterThan(10)
      expect(c.from.key || c.from.sheet).toBeTruthy()
    }
  })

  it('refuses a role or a unit it does not know', () => {
    expect(() => packPlan(cfg, { role: 'R0', round: 1, unit: 'x' })).toThrow(/No pack is defined/)
    expect(() => packPlan(cfg, { role: 'R4-blockout', round: 1, unit: 'step1' })).toThrow(/judges the unit/)
  })
})

describe('splitting a pack over critics', () => {
  const g = (id: string, n: number) => ({ id, items: Array.from({ length: n }, (_, i) => ({ kind: id, n: i })) })
  it('keeps groups whole and fills a set that has room', () => {
    const sets = splitGroups([g('a', 10), g('b', 9), g('c', 7), g('d', 3)], 10)
    expect(sets.map((s: { items: unknown[] }) => s.items.length)).toEqual([10, 9, 10])
    expect(sets[2].groups).toEqual(['c', 'd'])
  })
  it('cuts a group that is larger than a message into whole pictures', () => {
    const sets = splitGroups([g('a', 23)], 10)
    expect(sets.map((s: { items: unknown[] }) => s.items.length)).toEqual([10, 10, 3])
  })
  it('matches the groups of the blockout', () => {
    expect(blockoutGroups(cfg).map((x: { id: string }) => x.id)).toEqual(['pages', 'film', 'beats', 'cameras'])
  })
})

describe("a critic's brief", () => {
  const brief = briefFor(plan, plan.sets[0].set, kit)
  const section = (heading: string) => {
    const lines = kit.split('\n')
    const start = lines.findIndex((l) => l.trim() === `### ${heading}`)
    const end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l))
    return lines.slice(start, end).join('\n').trim()
  }
  it('carries its section and the severity scale word for word', () => {
    expect(brief).toContain(section('R4 blockout · Phase 2 only'))
    expect(brief).toContain(section('The severity scale'))
    expect(brief).toContain('"issues": [')
    expect(brief).toContain('`score` is 1 to 10. Issues are listed most severe first.')
  })
  it('carries nothing of another critic, of the kit beyond that, or of the repo', () => {
    expect(brief).not.toMatch(/R1 · Match|R3 · |R5 · |PROGRESS|kit\/|out\/work|scorecards|github/)
    expect(brief).toContain(`${plan.sets[0].files[0].name} to ${plan.sets[0].files[plan.sets[0].files.length - 1].name}`)
  })
})

describe('crops', () => {
  it('keeps a window inside the picture', () => {
    expect(windowRound([10, 10, 20, 10], 696, 187, 1920, 1080)).toEqual([0, 0, 696, 187])
    expect(windowRound([1900, 1070, 20, 10], 696, 187, 1920, 1080)).toEqual([1224, 893, 696, 187])
    expect(windowRound([950, 535, 20, 10], 696, 187, 1920, 1080)).toEqual([612, 447, 696, 187])
  })
  it('gives an acting sheet the tile itself for a small arrow and a wider window in the same proportions for a large one', () => {
    expect(actingWindow(70, 462, 320, 1920, 1080)).toEqual([462, 320])
    expect(actingWindow(227, 462, 320, 1920, 1080)).toEqual([983, 681])
    expect(actingWindow(900, 462, 320, 1920, 1080)).toEqual([1559, 1080])
  })
  it('puts the cursor box round the arrow, whose body lies below and to the right of its tip', () => {
    expect(ARROW_BODY[0]).toBeGreaterThan(0)
    expect(ARROW_BODY[1]).toBeGreaterThan(ARROW_BODY[0])
    const box = cursorBox({ onPage: true, x: 1000, y: 500, screenHeightPx: 220 }) as number[]
    expect(box).toEqual([901, 445, 330, 330])
    expect(box[1]).toBeLessThan(500)
    expect(box[1] + box[3]).toBeGreaterThan(500 + 220)
    expect(box[0]).toBeLessThan(1000)
    expect(box[0] + box[2]).toBeGreaterThan(1000 + 220 * 0.7)
    expect(cursorBox({ onPage: false, x: 0, y: 0, screenHeightPx: 70 })).toBeNull()
  })
  it('shows the left end of a run wider than the window, with ground before it', () => {
    expect(windowRound([128, 400, 1200, 24], 696, 187, 1920, 1080, true)).toEqual([104, 319, 696, 187])
    expect(windowRound([128, 400, 640, 24], 696, 187, 1920, 1080, true)).toEqual([100, 319, 696, 187])
    expect(windowRound([10, 400, 1200, 24], 696, 187, 1920, 1080, true)).toEqual([0, 319, 696, 187])
    expect(windowRound([128, 400, 1200, 24], 696, 187, 1920, 1080)).toEqual([380, 319, 696, 187])
  })
  it('picks the smallest type, then the least contrast outside that window', () => {
    const runs = [
      { key: 'a', text: 'Head', box: [100, 100, 600, 60], px: 48, contrast: 9 },
      { key: 'b', text: 'small', box: [100, 900, 200, 14], px: 12, contrast: 6 },
      { key: 'c', text: 'faint', box: [1200, 300, 200, 20], px: 16, contrast: 2.5 },
      { key: 'd', text: 'off the screen', box: [100, 1400, 200, 12], px: 10, contrast: 2 },
      { key: 'e', text: ' ', box: [100, 500, 200, 12], px: 8, contrast: 1 }
    ]
    const got = riskyType(runs, 696, 187, 1920, 1080)
    expect(got.map((p: { run: { key: string } }) => p.run.key)).toEqual(['b', 'c'])
  })
  it('joins controls that stand together and gives the two ends of a long bar', () => {
    const live = controlWindows([[128, 14, 174, 32], [100, 20, 20, 20]], 696, 200, 1920, 1080)
    expect(live.length).toBe(1)
    const film = controlWindows([[156, 996, 32, 32], [208, 996, 1397, 32], [1625, 1002, 87, 19], [1732, 996, 32, 32], [912, 492, 96, 96]], 696, 200, 1920, 1080)
    expect(film.map((w: { part: string }) => w.part)).toEqual(['', ', its left end', ', its right end'])
    for (const w of film) {
      expect(w.window[0]).toBeGreaterThanOrEqual(0)
      expect(w.window[0] + w.window[2]).toBeLessThanOrEqual(1920)
      expect(w.window[1] + w.window[3]).toBeLessThanOrEqual(1080)
    }
  })
  it('wraps a long label over lines', () => {
    const lines = wrap('Camera 5 of 10. It is for: fixed above the ball on the wire ramp, looking down and a little ahead, the cursor seen inside the ball.', 680, 13)
    expect(lines.length).toBeGreaterThan(1)
    for (const l of lines) expect(l.length * 13 * 0.6).toBeLessThanOrEqual(680)
  })
})
