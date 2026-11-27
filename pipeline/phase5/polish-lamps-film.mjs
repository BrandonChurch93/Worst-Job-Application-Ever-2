// Film frames at the draft tier, 1920 by 1080, kept whole as PNG: the pictures the windows' work is compared on.
// node pipeline/phase5/polish-lamps-film.mjs OUT_DIR FRAME [FRAME ...]   a frame is a frame of the film, or FIRST-LAST
import fs from 'node:fs'
import path from 'node:path'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'

const [out, ...list] = process.argv.slice(2)
if (!out || list.length === 0) throw new Error('give a folder and the film frames')
const frames = []
for (const item of list) {
  const [a, b] = item.split('-').map(Number)
  for (let n = a; n <= (b ?? a); n++) frames.push(n)
}
fs.mkdirSync(out, { recursive: true })
const session = await openSession({ format: 'hd', assets: 'full' })
try {
  for (const n of frames) {
    const file = path.join(out, `film-${n}.png`)
    if (fs.existsSync(file)) continue
    await session.page.evaluate(async ([f, t]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderFilmFrame(f, t)
    }, [n, 'draft'])
    fs.writeFileSync(file, await readCanvas(session.page))
    console.log(`film ${n}`)
  }
} finally {
  await session.close()
}
