import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { visit } from './polish-tug2-run'
import { film } from './polish-tug3-run'

const deg = (r: number): number => (r * 180) / Math.PI
const f = (n: number, d = 2): string => n.toFixed(d)

describe.skipIf(!process.env.POLISH_TUG3_TABLE)('polish tug 3: what turns the arrow at the take, a row for each frame of 60', () => {
  for (const who of ['visitor', 'keen'] as const) {
    it(`writes the table of the ${who}`, () => {
      const rows = visit(who)
      expect(rows.length).toBeGreaterThan(600)
      const head = 'frame\ttime\ttipX\ttipY\tz\tangle\tlean\tspin\tbend\tsquash\tacting\treaction\treactionAt\tsprout\tstrain\tgrip0\tgrip1\thand0\thand1\tpaperX\tpaperY\tpaperDeg\tamount\tevents'
      const out = rows.map((r) => {
        const p = r.pose
        const h = p.hands
        return [r.i, f(r.time, 3), f(p.x, 1), f(p.y, 1), f(p.z, 1), f(r.angle), f(deg(p.lean)), f(deg(p.spin)), f(p.bend, 3), f(p.squash, 3), p.acting, p.reaction ?? '-', f(p.reactionAt), f(p.sprout), f(p.strain), f(p.grip[0]), f(p.grip[1]),
          h ? `${f(h[0].x, 0)},${f(h[0].y, 0)}` : '-', h ? `${f(h[1].x, 0)},${f(h[1].y, 0)}` : '-', f(r.paperX, 1), f(r.paperY, 1), f(r.paper, 1), f((r.list.find((x) => x.id === 'resume-paper')?.v?.[2] as number | undefined) ?? 0, 3), r.events.filter((e) => e !== 'step').join(' ')].join('\t')
      })
      fs.writeFileSync(`${process.env.POLISH_TUG3_TABLE}-${who}.tsv`, [head, ...out].join('\n') + '\n')
    })
  }
  it('writes the table of the film', () => {
    const rows = film()
    const head = 'film\ttipX\ttipY\tz\tangle\tlean\tspin\tbend\tsquash\tacting\treaction\tsprout\tstrain\tgrip\ttaken\tevents'
    const out = rows.map((r) => {
      const p = r.pose
      return [r.frame, f(p.x, 1), f(p.y, 1), f(p.z, 1), f(deg(p.lean + p.spin)), f(deg(p.lean)), f(deg(p.spin)), f(p.bend, 3), f(p.squash, 3), p.acting, p.reaction ?? '-', f(p.arms ? p.sprout : 0), f(p.strain), f(p.grip[0]), p.taken ? 1 : 0, r.events.filter((e) => e !== 'step').join(' ')].join('\t')
    })
    fs.writeFileSync(`${process.env.POLISH_TUG3_TABLE}-film.tsv`, [head, ...out].join('\n') + '\n')
  })
})
