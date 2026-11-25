import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { quality, qualityIds } from '../src/core/quality'
import { labels } from '../src/probe/labels'
import { fpsText, measure, report, slowestFps, wouldPick, type ProbeScene } from '../src/probe/stats'
import type { QualityLevel } from '../src/ui/picker'

const levels: QualityLevel[] = qualityIds.map((id) => ({ id, minFps: quality(id).minFps }))
const scenes: ProbeScene[] = [
  { id: 'careers', unit: 'marketing', beat: 'marketing.stroll' },
  { id: 'step1-fire', unit: 'step1', beat: 'step1.firstName' },
  { id: 'reply-all', unit: 'pinball', beat: 'pinball.replyAll' },
  { id: 'boss', unit: 'boss', beat: 'boss.slabs' }
]
const steady = (fps: number, seconds = config.perf.probeSeconds) => Array.from({ length: Math.round(fps * seconds) }, () => 1 / fps)
const all = (fps: (level: string, scene: string) => number) => levels.flatMap((l) => scenes.map((s) => measure(s.id, l.id, steady(fps(l.id, s.id)))))
const machine = { card: 'A card', screen: '2560 x 1440 at 2', window: '1600 x 900', browser: 'A browser' }

describe('the numbers of the probe', () => {
  it('names four scenes that are beats of the film', () => {
    const beats = new Map(config.film.beats.map((b) => [b.id, b.unit]))
    expect(scenes).toHaveLength(4)
    for (const s of scenes) expect(beats.get(s.beat), s.id).toBe(s.unit)
  })

  it('measures the median and the slowest one percent', () => {
    const times = [...steady(60, 9.9), ...Array.from({ length: 6 }, () => 0.1)]
    const r = measure('boss', 'high', times)
    expect(r.frames).toBe(600)
    expect(r.medianFps).toBeCloseTo(60, 5)
    expect(r.slowestFps).toBeCloseTo(10, 5)
    expect(slowestFps([0.02])).toBeCloseTo(50)
    expect(slowestFps([])).toBe(0)
  })

  it('marks a scene that gave no frame', () => {
    expect(measure('boss', 'high', []).failed).toBe(true)
    expect(measure('boss', 'high', [0, Number.NaN]).failed).toBe(true)
  })

  it('picks the best level every scene can hold', () => {
    const [best, middle, worst] = levels as [QualityLevel, QualityLevel, QualityLevel]
    expect(wouldPick(all(() => best.minFps + 5), levels)).toBe(best.id)
    expect(wouldPick(all((l, s) => (l === best.id && s === 'boss' ? best.minFps - 5 : 200)), levels)).toBe(middle.id)
    expect(wouldPick(all(() => 4), levels)).toBe(worst.id)
  })

  it('writes one plain block with every number and every fact', () => {
    const results = all((l) => (l === 'high' ? 44.44 : 121))
    const text = report(results, levels, scenes, machine, config.perf.probeSeconds)
    const lines = text.split('\n')
    expect(lines).toHaveLength(2 + levels.length * scenes.length + 5)
    for (const l of levels) for (const s of scenes) expect(lines.some((line) => line.startsWith(l.id) && line.includes(s.id))).toBe(true)
    expect(text).toContain('44.4')
    expect(text).toContain('121')
    expect(text).toContain(`${labels.card}: A card`)
    expect(text).toContain(`${labels.screen}: 2560 x 1440 at 2`)
    expect(text).toContain(`${labels.pick}: ${wouldPick(results, levels)}`)
    expect(text).not.toMatch(/[\u2014!<>]/)
    expect(fpsText(59.94)).toBe('59.9')
  })

  it('says so when the browser does not report the card', () => {
    const text = report(all(() => 60), levels, scenes, { ...machine, card: '' }, config.perf.probeSeconds)
    expect(text).toContain(`${labels.card}: ${labels.unknown}`)
  })
})
