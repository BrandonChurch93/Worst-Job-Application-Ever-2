// node pipeline/change002/step1-still.mjs <name> <seconds> [tier]: one whole film frame of step 1 at 1920 by 1080, by seconds of the unit, with nothing drawn over it.
import fs from 'node:fs'
import sharp from 'sharp'
import { at, config } from '../../tools/lib/paths.mjs'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'

const [name, seconds, tier = 'draft'] = process.argv.slice(2)
const cfg = config()
let start = 0
for (const u of cfg.film.units) {
  if (u.id === 'step1') break
  start += u.seconds
}
const frame = Math.round((start + Number(seconds)) * cfg.film.fps)
const session = await openSession({ format: 'hd', assets: 'full' })
await session.page.evaluate(async ([n, t]) => {
  window.showcase.setDiagnostic('beauty')
  await window.showcase.renderFilmFrame(n, t)
}, [frame, tier])
fs.mkdirSync(at('out', 'work'), { recursive: true })
const file = at('out', 'work', `step1-${name}.jpg`)
const info = await sharp(await readCanvas(session.page)).jpeg({ quality: 92 }).toFile(file)
console.log(`step1-still: wrote ${file}, frame ${frame}, ${info.width} by ${info.height}`)
await session.close()
