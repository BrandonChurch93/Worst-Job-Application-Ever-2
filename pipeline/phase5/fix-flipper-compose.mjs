// Lays the pictures of one run of fix-flipper-sheet.mjs as sheets at their real size: the same window of every picture, a line of the site's numbers under each.
// node pipeline/phase5/fix-flipper-compose.mjs --name NAME [--cx X --cy Y] [--w 380 --h 300] [--cols 3 --rows 2] [--title TEXT]
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at } from '../../tools/lib/paths.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const name = arg('name', 'run')
const dir = at('out', 'work', 'fix-flipper', name)
const run = JSON.parse(fs.readFileSync(path.join(dir, 'rows.json'), 'utf8'))
const w = Number(arg('w', 380))
const h = Number(arg('h', 300))
const cols = Number(arg('cols', 3))
const perSheet = cols * Number(arg('rows', 2))
const title = arg('title', name)
const GAP = 8
const CAP = 22
const HEAD = 26
const meta = await sharp(path.join(dir, run.rows[0].file)).metadata()
const cx = Number(arg('cx', Math.round(run.rows.reduce((s, r) => s + r.heroX, 0) / run.rows.length)))
const cy = Number(arg('cy', Math.round(run.rows.reduce((s, r) => s + r.heroY - r.scroll, 0) / run.rows.length)))
const left = Math.max(0, Math.min(meta.width - w, Math.round(cx - w / 2)))
const top = Math.max(0, Math.min(meta.height - h, Math.round(cy - h / 2)))
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const text = (s, width, height, size = 13) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#15161a"/><text x="4" y="${Math.round(height * 0.72)}" font-family="DejaVu Sans, sans-serif" font-size="${size}" fill="#e8e8ea">${esc(s)}</text></svg>`)
const sheets = Math.ceil(run.rows.length / perSheet)
for (let s = 0; s < sheets; s++) {
  const part = run.rows.slice(s * perSheet, (s + 1) * perSheet)
  const rowsN = Math.ceil(part.length / cols)
  const W = cols * w + (cols + 1) * GAP
  const H = HEAD + rowsN * (h + CAP + GAP) + GAP
  const layers = [{ input: text(`${title}, pictures ${part[0].n + 1} to ${part[part.length - 1].n + 1} of ${run.rows.length}, the window ${w} by ${h} px at its real size (the ball is 96 px)`, W, HEAD, 14), left: 0, top: 0 }]
  for (let i = 0; i < part.length; i++) {
    const r = part[i]
    const x = GAP + (i % cols) * (w + GAP)
    const y = HEAD + GAP + Math.floor(i / cols) * (h + CAP + GAP)
    layers.push({ input: await sharp(path.join(dir, r.file)).extract({ left, top, width: w, height: h }).png().toBuffer(), left: x, top: y })
    const since = r.sincePress === null ? 'before the key' : `key +${r.sincePress}${run.fine ? `.${r.part}` : ''}`
    layers.push({ input: text(`${r.n + 1}  ${r.pageTime.toFixed(3)} s  ${since}  ${r.left ? 'L' : ''}${r.right ? 'R' : ''}${r.left || r.right ? ' down' : 'keys up'}`, w, CAP), left: x, top: y + h })
  }
  const out = path.join(dir, `sheet-${String(s + 1).padStart(2, '0')}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#15161a' } }).composite(layers).png().toFile(out)
  console.log(`${out}: ${W} by ${H}`)
}
console.log(`window: left ${left}, top ${top}, ${w} by ${h}`)
