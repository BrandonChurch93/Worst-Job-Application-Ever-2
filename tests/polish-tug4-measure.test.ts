import fs from 'node:fs'
import { it } from 'vitest'
import { visit } from './polish-tug2-run'
import { film } from './polish-tug3-run'

// Writes the rows this work was measured on: set POLISH_TUG4_TABLE to a path prefix. One row for each frame of 60 of step 1, under the pack's visitor and in the film's path.
const to = process.env.POLISH_TUG4_TABLE
const f = (n: number | undefined, d = 2): string => (n === undefined || !Number.isFinite(n) ? '-' : n.toFixed(d))
const deg = (r: number): number => (r * 180) / Math.PI

it.skipIf(!to)('writes the rows of step 1', () => {
  const head = 'frame\ttime\tgag\tpx\tpy\ttipX\ttipY\tz\tangle\tbend\tsquash\ttaken\tsprout\tgrip0\tstrain\thand0\thand1\tboxX\tboxY\tboxH\tboxDeg\tv\tevents'
  const row = (i: number, time: number, gag: string, px: number, py: number, p: ReturnType<typeof film>[number]['pose'], list: ReturnType<typeof film>[number]['list'], events: string[]): string => {
    const paper = list.find((x) => x.id === 'resume-paper')
    const h = p.hands
    return [i, f(time, 3), gag, f(px, 1), f(py, 1), f(p.x, 2), f(p.y, 2), f(p.z, 2), f(deg(p.lean + p.spin)), f(p.bend, 3), f(p.squash, 3), p.taken ? 1 : 0, f(p.arms ? p.sprout : 0, 3), f(p.grip[0], 2), f(p.strain, 2),
      h ? `${f(h[0].x, 1)},${f(h[0].y, 1)}` : '-', h ? `${f(h[1].x, 1)},${f(h[1].y, 1)}` : '-', f(paper?.x, 2), f(paper?.y, 2), f(paper?.h, 2), f(deg(paper?.rot ?? 0), 2), (paper?.v ?? []).map((n) => f(n as number, 3)).join(','), events.filter((e) => e !== 'step').join(' ')].join('\t')
  }
  fs.writeFileSync(`${to}-visitor.tsv`, [head, ...visit('visitor').map((r) => row(r.i, r.time, r.gag, r.px, r.py, r.pose, r.list, r.events))].join('\n') + '\n')
  fs.writeFileSync(`${to}-film.tsv`, [head, ...film().map((r) => row(r.frame, r.frame / 60, '', 0, 0, r.pose, r.list, r.events))].join('\n') + '\n')
})
