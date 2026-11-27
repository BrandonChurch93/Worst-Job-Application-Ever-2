// Film frames in a row at the draft tier, 1920 by 1080, each kept whole as film-<frame>.png with its sha256 in frames.json.
// node pipeline/phase5/polish-port2-film.mjs --keep <folder> --frames 4157-4177,4217-4298,4332
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { args } from '../../tools/lib/paths.mjs'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'

const a = args()
const keep = String(a.keep)
const frames = []
for (const part of String(a.frames).split(',')) {
  const [from, to = from] = part.split('-').map(Number)
  for (let n = from; n <= to; n++) frames.push(n)
}
fs.mkdirSync(keep, { recursive: true })
const file = path.join(keep, 'frames.json')
const sums = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
const session = await openSession({ format: 'hd', assets: 'full' })
try {
  for (const n of frames) {
    await session.page.evaluate(async ([f, t]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderFilmFrame(f, t)
    }, [n, 'draft'])
    const png = await readCanvas(session.page)
    fs.writeFileSync(path.join(keep, `film-${n}.png`), png)
    sums[n] = crypto.createHash('sha256').update(png).digest('hex')
    fs.writeFileSync(file, JSON.stringify(sums, null, 1) + '\n')
    console.log(`${new Date().toISOString().slice(11, 19)} film frame ${n} ${sums[n].slice(0, 12)}`)
  }
} finally {
  await session.close()
}
