// node pipeline/change002/step1-frames.mjs <name> <from> <to> <every> <x> <y> <w> <h> <columns> <tileWidth> [panel]: frames in a row of the film of step 1, by seconds of the unit, cut to one place of the page and laid in rows, the second of each on its tile.
import fs from 'node:fs'
import sharp from 'sharp'
import { at, config } from '../../tools/lib/paths.mjs'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'

const [name, from, to, every, x, y, w, h, columns, tileWidth, panel] = process.argv.slice(2)
const cfg = config()
const fps = cfg.film.fps ?? 60
let start = 0
for (const u of cfg.film.units) {
  if (u.id === 'step1') break
  start += u.seconds
}
const cut = { left: Number(x), top: Number(y), width: Number(w), height: Number(h) }
const tw = Number(tileWidth)
const th = Math.round((tw * cut.height) / cut.width)
const session = await openSession({ format: 'hd', assets: 'full' })
const tiles = []
for (let t = Number(from); t <= Number(to) + 1e-9; t += Number(every)) {
  const frame = Math.round((start + t) * fps)
  await session.page.evaluate(async ([n, tier]) => {
    window.showcase.setDiagnostic('beauty')
    await window.showcase.renderFilmFrame(n, tier)
  }, [frame, 'draft'])
  let png = await readCanvas(session.page)
  if (panel) {
    const [px, py, pw, ph] = panel.split(',').map(Number)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="rgba(24,24,26,0.72)"/><text x="${px + pw / 2}" y="${py + 40}" font-family="sans-serif" font-size="26" fill="#f4f1ea" text-anchor="middle">a line of spoken words stands here while the keyboard is up,</text><text x="${px + pw / 2}" y="${py + 76}" font-family="sans-serif" font-size="26" fill="#f4f1ea" text-anchor="middle">and a second row of them under it, in a panel 900 by 96</text></svg>`
    png = await sharp(png).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).png().toBuffer()
  }
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${th}"><rect x="4" y="4" width="64" height="22" rx="4" fill="rgba(20,20,22,0.8)"/><text x="36" y="20" font-family="sans-serif" font-size="14" fill="#fff" text-anchor="middle">${t.toFixed(2)} s</text></svg>`)
  tiles.push(await sharp(png).extract(cut).resize(tw, th).composite([{ input: label, left: 0, top: 0 }]).png().toBuffer())
}
const cols = Number(columns)
const lines = Math.ceil(tiles.length / cols)
fs.mkdirSync(at('out', 'work'), { recursive: true })
const file = at('out', 'work', `step1-${name}.jpg`)
await sharp({ create: { width: cols * (tw + 2), height: lines * (th + 2), channels: 3, background: '#17181a' } }).composite(tiles.map((input, i) => ({ input, left: (i % cols) * (tw + 2) + 1, top: Math.floor(i / cols) * (th + 2) + 1 }))).jpeg({ quality: 88 }).toFile(file)
console.log(`step1-frames: wrote ${file}, ${tiles.length} frames, ${cols * (tw + 2)} by ${lines * (th + 2)}`)
await session.close()
