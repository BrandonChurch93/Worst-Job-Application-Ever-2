// Cuts a sheet from the whole pictures polish-save-shots.mjs kept (--keep <dir>): pictures in a row, unscaled or scaled, with the page's seconds under each.
// node pipeline/phase5/polish-save-sheet.mjs --from <dir> --first 0 --count 12 --every 2 --crop 720,620,480,460 --cols 6 --scale 1 --words "after" --out /tmp/sheet.png
import fs from 'node:fs'
import sharp from 'sharp'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const from = arg('from', '')
const first = Number(arg('first', 0))
const count = Number(arg('count', 12))
const every = Number(arg('every', 1))
const cols = Number(arg('cols', 6))
const scale = Number(arg('scale', 1))
const [x, y, w0, h0] = arg('crop', '0,0,1920,1080').split(',').map(Number)
const words = arg('words', '')
const out = arg('out', '/tmp/polish-save-sheet.png')
const times = fs.existsSync(`${from}/times.json`) ? JSON.parse(fs.readFileSync(`${from}/times.json`, 'utf8')) : null
const w = Math.round(w0 * scale)
const h = Math.round(h0 * scale)
const strip = 16
const head = 22
const rows = Math.ceil(count / cols)
const text = (s, width, height, size) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="${Math.round(height * 0.75)}" font-family="monospace" font-size="${size}" fill="#fff">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`)
const parts = [{ input: text(`${words}  ${(1 / (60 / every)).toFixed(4)} s apart, ${scale === 1 ? 'unscaled' : `scaled by ${scale}`}`, cols * w, head, 13), left: 0, top: 0 }]
for (let i = 0; i < count; i++) {
  const n = first + i * every
  const left = (i % cols) * w
  const top = head + Math.floor(i / cols) * (h + strip)
  let cut = sharp(`${from}/${String(n).padStart(3, '0')}.png`).extract({ left: x, top: y, width: w0, height: h0 })
  if (scale !== 1) cut = cut.resize(w, h, { kernel: 'lanczos3' })
  parts.push({ input: await cut.png().toBuffer(), left, top })
  parts.push({ input: text(`${i + 1}  ${times ? `${times[n].toFixed(3)} s` : `picture ${n}`}`, w, strip, 11), left, top: top + h })
}
await sharp({ create: { width: cols * w, height: head + rows * (h + strip), channels: 3, background: '#111' } }).composite(parts).png().toFile(out)
console.log(`wrote ${out}: ${count} pictures of ${w} by ${h} px, ${cols * w} by ${head + rows * (h + strip)} px`)
