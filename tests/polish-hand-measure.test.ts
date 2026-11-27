import fs from 'node:fs'
import { it } from 'vitest'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import { fork, PER, resting, rowOf, stroking, table, turnsOf, visit, type Row } from './polish-hand-run'

const out = process.env.HAND_OUT

// How far the arrow goes by itself: its way over the page while the pointer lies still, and how far it stands from the pointer when the page is flat.
const own = (rows: Row[], from: number, to: number): { px: number; frames: number } => {
  let px = 0
  let frames = 0
  for (let k = from + 1; k <= to && k < rows.length; k++) {
    const d = Math.hypot(rows[k]!.x - rows[k - 1]!.x, rows[k]!.y - rows[k - 1]!.y)
    px += d
    if (d > 0.5) frames++
  }
  return { px, frames }
}

it.skipIf(!out)('prints the arrow through every page turn and after a hit, a row a frame of 60', () => {
  const v = visit(400)
  const turns = turnsOf(v.rows)
  const lines: string[] = [`visitor finished: ${v.finished}, frames ${v.rows.length}, turns ${turns.length}`]
  turns.forEach((t, n) => {
    const mark = { [v.rows[t.start]!.i]: 'turn starts', [v.rows[t.half]!.i]: 'arriving page', [v.rows[t.flat]!.i]: 'given to play' }
    const kinds: [string, Row[]][] = [
      ['visitor', v.rows.slice(t.start - 10, t.flat + 31)],
      ['resting', fork(v, t.start, t.flat - t.start + 31, resting, 10)],
      ['stroking', fork(v, t.start, t.flat - t.start + 31, stroking(70), 10)]
    ]
    for (const [kind, rows] of kinds) {
      fs.writeFileSync(`${out}-turn${n + 1}-${kind}.txt`, table(rows, mark))
      const s = 10
      const f = 10 + t.flat - t.start
      const h = 10 + t.half - t.start
      const leave = own(rows, s - 1, h - 1)
      const after = own(rows, f, rows.length - 1)
      const at = rows[f]!
      const off = Math.hypot(at.x - at.px, at.y - (at.py + at.scroll))
      let back = -1
      for (let k = f; k < rows.length; k++) if (Math.hypot(rows[k]!.x - rows[k]!.px, rows[k]!.y - (rows[k]!.py + rows[k]!.scroll)) <= 2) { back = k - f; break }
      let far = 0
      for (let k = s; k < rows.length; k++) far = Math.max(far, Math.hypot(rows[k]!.x - rows[k]!.px, rows[k]!.y - (rows[k]!.py + rows[k]!.scroll)))
      lines.push(`turn ${n + 1} ${t.from} to ${t.to} (${kind}): starts frame ${v.rows[t.start]!.i}; on the leaving page the arrow goes ${leave.px.toFixed(1)} px over ${leave.frames} frames; when given to play it stands ${off.toFixed(1)} px from the pointer, goes ${after.px.toFixed(1)} px over ${after.frames} frames after, within 2 px ${back} frames after; furthest from the pointer on the page ${far.toFixed(1)} px`)
    }
  })
  const hits = v.rows.filter((r) => r.hit)
  lines.push(`hits: ${hits.map((r) => `${r.i} ${r.page}`).join(', ')}`)
  hits.slice(0, 3).forEach((h, n) => {
    const k = v.rows.indexOf(h)
    fs.writeFileSync(`${out}-hit${n + 1}-visitor.txt`, table(v.rows.slice(k - 3, k + 41), { [h.i]: 'hit' }))
    fs.writeFileSync(`${out}-hit${n + 1}-resting.txt`, table(fork(v, h.i - 2, 43, resting, 1), { [h.i]: 'hit' }))
  })
  const film = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
  const rows: Row[] = []
  let seen = 0
  for (let i = 0; i < 32 * 60; i++) {
    const p = film.page.script(film.pageTime)
    film.advance(PER)
    const hit = film.events.slice(seen).some((e) => e.hitsCursor && e.name === 'bolt-hit-cursor')
    seen = film.events.length
    rows.push(rowOf(film, i, { x: p.x, y: p.y - film.page.scroll() }, hit))
  }
  rows.filter((r) => r.hit).slice(0, 3).forEach((h, n) => fs.writeFileSync(`${out}-film-hit${n + 1}.txt`, table(rows.slice(h.i - 3, h.i + 41), { [h.i]: 'hit' })))
  lines.push(`film hits of step 1, frames of the page at 60: ${rows.filter((r) => r.hit).map((r) => r.i).join(', ')}`)
  fs.writeFileSync(`${out}-summary.txt`, lines.join('\n') + '\n')
}, 900000)
