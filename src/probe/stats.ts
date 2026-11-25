import { medianFps, type QualityLevel } from '../ui/picker'
import { labels } from './labels'

export interface ProbeScene { id: string; unit: string; beat: string }

export interface ProbeResult { scene: string; level: string; frames: number; medianFps: number; slowestFps: number; failed?: boolean }

export interface ProbeMachine { card: string; screen: string; window: string; browser: string }

// The frame rate of the slowest one percent of frames: one over the mean time of the slowest hundredth, at least one frame.
export function slowestFps(times: number[]): number {
  if (!times.length) return 0
  const sorted = [...times].sort((a, b) => b - a)
  const n = Math.max(1, Math.ceil(sorted.length / 100))
  let sum = 0
  for (let i = 0; i < n; i++) sum += sorted[i]!
  return sum > 0 ? n / sum : 0
}

export function measure(scene: string, level: string, times: number[]): ProbeResult {
  const good = times.filter((t) => t > 0 && Number.isFinite(t))
  return { scene, level, frames: good.length, medianFps: medianFps(good), slowestFps: slowestFps(good), failed: good.length === 0 }
}

// The level the site would settle on: the best level whose slowest scene still holds that level's minFps, and the last level if none does.
export function wouldPick(results: ProbeResult[], levels: QualityLevel[]): string {
  for (const level of levels) {
    const mine = results.filter((r) => r.level === level.id && !r.failed)
    if (mine.length && Math.min(...mine.map((r) => r.medianFps)) >= level.minFps) return level.id
  }
  return levels[levels.length - 1]?.id ?? ''
}

export const fpsText = (fps: number): string => (fps >= 100 ? fps.toFixed(0) : fps.toFixed(1))

const pad = (s: string, n: number): string => (s.length >= n ? s : s + ' '.repeat(n - s.length))

// The block Brandon pastes into the thread: plain text, one line a level and scene.
export function report(results: ProbeResult[], levels: QualityLevel[], scenes: ProbeScene[], machine: ProbeMachine, seconds: number): string {
  const lines: string[] = []
  const w = Math.max(...levels.map((l) => l.id.length), 5) + 2
  const s = Math.max(...scenes.map((x) => x.id.length), 5) + 2
  lines.push(`${labels.title}: ${levels.length} x ${scenes.length} x ${seconds} s`)
  lines.push(`${pad('level', w)}${pad('scene', s)}${pad(labels.median, 14)}${pad(labels.slowest, 18)}${labels.frames}`)
  for (const level of levels) {
    for (const scene of scenes) {
      const r = results.find((x) => x.level === level.id && x.scene === scene.id)
      if (!r) continue
      lines.push(r.failed
        ? `${pad(level.id, w)}${pad(scene.id, s)}${labels.failed}`
        : `${pad(level.id, w)}${pad(scene.id, s)}${pad(fpsText(r.medianFps), 14)}${pad(fpsText(r.slowestFps), 18)}${r.frames}`)
    }
  }
  lines.push(`${labels.card}: ${machine.card || labels.unknown}`)
  lines.push(`${labels.screen}: ${machine.screen}`)
  lines.push(`${labels.window}: ${machine.window}`)
  lines.push(`${labels.browser}: ${machine.browser}`)
  lines.push(`${labels.pick}: ${wouldPick(results, levels)}`)
  return lines.join('\n')
}
