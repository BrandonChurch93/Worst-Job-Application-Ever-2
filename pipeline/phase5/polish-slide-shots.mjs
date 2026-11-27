// A sheet of steps in a row of the live pinball page with a bot at the flippers, in the browser, at the site's own pixels.
// node pipeline/phase5/polish-slide-shots.mjs --bot keen --seed 1 --at 19.05 --count 24 --every 1 --crop 700,300,200,280 --cols 6 --words "before" --out /tmp/sheet.png [--whole /tmp/frame.png]
// --at is the page's seconds of the first picture, --every the frames (60 a second) between two pictures, --crop the left, top, width and height cut from every picture, unscaled.
import fs from 'node:fs'
import sharp from 'sharp'
import { openSession } from '../../tools/lib/capture.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const bot = arg('bot', 'keen')
const seed = Number(arg('seed', 1))
const at = Number(arg('at', 19))
const count = Number(arg('count', 24))
const every = Number(arg('every', 1))
const cols = Number(arg('cols', 6))
const crop = arg('crop', '').split(',').filter(Boolean).map(Number)
const words = arg('words', '')
const out = arg('out', '/tmp/polish-slide-sheet.png')
const hand = bot === 'held'
const session = await openSession({ format: arg('format', 'hd'), assets: 'web', mode: 'live', query: `${hand ? '' : `&bot=${bot}`}&seed=${seed}&clock=steps&step=3` })
const tiles = []
try {
  if (hand) {
    await session.page.mouse.move(40, 40)
    await session.page.mouse.down({ button: 'left' })
    await session.page.mouse.down({ button: 'right' })
  }
  let s = await session.page.evaluate((dt) => window.liveRun.advance(dt), at)
  for (let i = 0; i < count; i++) {
    if (i > 0) s = await session.page.evaluate((dt) => window.liveRun.advance(dt), every / 60)
    tiles.push({ time: s.time, png: Buffer.from(s.png.split(',')[1], 'base64') })
  }
} finally {
  await session.close()
}
if (arg('whole', '')) fs.writeFileSync(arg('whole'), tiles[0].png)
const meta = await sharp(tiles[0].png).metadata()
const [x, y, w, h] = crop.length === 4 ? crop : [0, 0, meta.width, meta.height]
const strip = 16
const head = 22
const rows = Math.ceil(count / cols)
const text = (s, width, height, size) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="${Math.round(height * 0.75)}" font-family="monospace" font-size="${size}" fill="#fff">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`)
const parts = [{ input: text(`${words}  ${bot} seed ${seed}, page ${tiles[0].time.toFixed(2)} to ${tiles[count - 1].time.toFixed(2)} s, ${every === 1 ? 'every frame' : `every ${every} frames`}, unscaled`, cols * w, head, 13), left: 0, top: 0 }]
for (let i = 0; i < count; i++) {
  const left = (i % cols) * w
  const top = head + Math.floor(i / cols) * (h + strip)
  parts.push({ input: await sharp(tiles[i].png).extract({ left: x, top: y, width: w, height: h }).png().toBuffer(), left, top })
  parts.push({ input: text(`${i + 1}  ${tiles[i].time.toFixed(3)} s`, w, strip, 11), left, top: top + h })
}
await sharp({ create: { width: cols * w, height: head + rows * (h + strip), channels: 3, background: '#111' } }).composite(parts).png().toFile(out)
console.log(`wrote ${out}: ${count} pictures of ${w} by ${h} px from page ${tiles[0].time.toFixed(3)} s`)
