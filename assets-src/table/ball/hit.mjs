// node assets-src/table/ball/hit.mjs --frame 5010 --count 8 --step 2 --tier draft --size 300
// Renders consecutive film frames round a frame and writes the ball of each, at its real size, in one row.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at } from '../../../tools/lib/paths.mjs'
import { openSession } from '../../../tools/lib/capture.mjs'

const a = args()
const frame = Number(a.frame || 5010)
const count = Number(a.count || 8)
const step = Number(a.step || 2)
const lead = Number(a.lead || 2)
const tier = a.tier || 'draft'
const size = Number(a.size || 300)
const dir = at('out', 'work', 'ball-diag')
fs.mkdirSync(dir, { recursive: true })
const session = await openSession({ format: 'hd' })
const tiles = []
try {
  for (let i = 0; i < count + lead; i++) {
    const n = frame + (i - lead - 2) * step
    const t0 = Date.now()
    const b64 = await session.page.evaluate(async ([f, t]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderFilmFrame(f, t)
      return document.querySelector('canvas').toDataURL('image/png').split(',')[1]
    }, [n, tier])
    const state = await session.page.evaluate((f) => window.showcase.filmState(f), n)
    const png = Buffer.from(b64, 'base64')
    const meta = await sharp(png).metadata()
    const k = meta.width / 1920
    const c = state.cursor
    const left = Math.max(0, Math.min(meta.width - size, Math.round(c.ballX * k - size / 2)))
    const top = Math.max(0, Math.min(meta.height - size, Math.round(c.ballY * k - size / 2)))
    console.log(n, state.beat, Math.round(c.ballX), Math.round(c.ballY), Math.round(c.ballScreenPx), state.events.map((e) => e.name).join(','), ((Date.now() - t0) / 1000).toFixed(1), 's')
    if (i >= lead) tiles.push(await sharp(png).extract({ left, top, width: size, height: size }).toBuffer())
  }
} finally {
  await session.close()
}
const file = path.join(dir, `hit-${frame}-${tier}.png`)
await sharp({ create: { width: tiles.length * (size + 4) - 4, height: size, channels: 3, background: '#111111' } }).composite(tiles.map((input, i) => ({ input, left: i * (size + 4), top: 0 }))).png().toFile(file)
console.log('row', file)
