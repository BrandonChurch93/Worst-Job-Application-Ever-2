// Film frames of the Decision unit with the narrator's caption laid over each, as sheets.
// First: node pipeline/change002/shell-film-captions.mjs --name decision   (the pictures of the captions and the frames each is on)
// node pipeline/change002/decision-frames.mjs --name line --at 5.434,5.9,... [--columns 4] [--cut x,y,w,h as shares of the picture]
// node pipeline/change002/decision-frames.mjs --name press --from 13.4 --count 43 [--columns 6]      every frame from a second of the unit on
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config, readJson } from '../../tools/lib/paths.mjs'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'
import { composeSheet } from '../../tools/lib/film-sheet.mjs'

const a = args()
const cfg = config()
const plan = filmPlan(cfg)
const unit = plan.units.find((u) => u.id === 'decision')
const fps = plan.fps
const name = String(a.name ?? 'line')
const cut = typeof a.cut === 'string' ? a.cut.split(',').map(Number) : null
const last = unit.last
const frames = (typeof a.from === 'string'
  ? Array.from({ length: Number(a.count ?? 24) }, (_, i) => unit.first + Math.round(Number(a.from) * fps) + i)
  : String(a.at).split(',').map((t) => unit.first + Math.round(Number(t) * fps))).map((n) => Math.min(last, n))
const caps = readJson(at('out', 'work', 'captions-decision', 'decision.json')).captions
const cache = at('out', 'work', 'decision-frames')
fs.mkdirSync(cache, { recursive: true })

const session = await openSession({ format: 'hd', assets: 'full' })
const tiles = []
try {
  for (const n of frames) {
    const file = path.join(cache, `${n}.png`)
    if (!fs.existsSync(file)) {
      await session.page.evaluate(async ([f, t]) => {
        window.showcase.setDiagnostic('beauty')
        await window.showcase.renderFilmFrame(f, t)
      }, [n, String(a.tier ?? 'draft')])
      fs.writeFileSync(file, await readCanvas(session.page))
    }
    const cap = caps.find((x) => n >= x.first && n <= x.last)
    let png = cap ? await sharp(file).composite([{ input: at(cap.file) }]).png().toBuffer() : fs.readFileSync(file)
    if (cut) {
      const m = await sharp(png).metadata()
      png = await sharp(png).extract({ left: Math.round(cut[0] * m.width), top: Math.round(cut[1] * m.height), width: Math.round(cut[2] * m.width), height: Math.round(cut[3] * m.height) }).png().toBuffer()
    }
    tiles.push({ png, label: `${((n - unit.first) / fps).toFixed(3)} s${cap ? `  ${cap.draft ? '(draft) ' : ''}${cap.words}` : ''}` })
  }
} finally {
  await session.close()
}
const file = at('out', 'work', 'sheets', `decision-${name}.jpg`)
const g = await composeSheet(tiles, file, { edge: Number(a.edge ?? 1200), heading: `The Decision unit in the film, ${typeof a.from === 'string' ? `every frame from ${a.from} s at ${fps} a second` : 'chosen frames'}${cut ? ', cut to the arrow' : ''}. Under each: the second of the unit and the caption on that frame.`, columns: Number(a.columns ?? 4) })
console.log(`wrote ${path.relative(at(), file)} ${g.width} by ${g.height}, ${tiles.length} frames`)
process.exit(0)
