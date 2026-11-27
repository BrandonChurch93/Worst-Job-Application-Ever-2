// node pipeline/change002/pinball-frames.mjs --from S --to S [--every K] [--name N] [--columns C] [--format F]: a sheet of film frames in a row of step 3, from and to in seconds of the scene, every K-th frame.
import path from 'node:path'
import { args, at, config } from '../../tools/lib/paths.mjs'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'
import { composeSheet } from '../../tools/lib/film-sheet.mjs'

const a = args()
const cfg = config()
const plan = filmPlan(cfg)
const fps = cfg.film.fps
const unit = plan.units.find((u) => u.id === 'pinball')
const every = Number(a.every ?? 1)
const first = unit.first + Math.round(Number(a.from ?? 0) * fps)
const last = unit.first + Math.round(Number(a.to ?? 1) * fps)
const session = await openSession({ format: String(a.format ?? 'preview'), assets: 'full' })
const tiles = []
for (let f = first; f <= last; f += every) {
  await session.page.evaluate(async ([n, t]) => {
    window.showcase.setDiagnostic('beauty')
    await window.showcase.renderFilmFrame(n, t)
  }, [f, 'draft'])
  tiles.push({ png: await readCanvas(session.page), label: `${((f - unit.first) / fps).toFixed(2)} s` })
}
const file = at('out', 'work', 'sheets', `pinball-${String(a.name ?? 'frames')}.jpg`)
const g = await composeSheet(tiles, file, { edge: Number(a.edge ?? 1200), heading: `step 3, ${a.from} s to ${a.to} s, every ${every} frame of ${fps}`, columns: Number(a.columns ?? 0) })
console.log(`wrote ${path.relative(at(), file)}: ${tiles.length} pictures, ${g.width} by ${g.height}; problems: ${[...new Set(session.problems)].join(' | ') || 'none'}`)
await session.close()
process.exit(0)
