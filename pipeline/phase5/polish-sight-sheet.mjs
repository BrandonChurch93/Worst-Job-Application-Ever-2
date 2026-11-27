// Sheets cut from the whole pictures polish-gate-shots.mjs kept, with the ball found by the measure's rows (polish-sight-measure.mjs --json): no picture is scaled where the ball is judged.
// node pipeline/phase5/polish-sight-sheet.mjs --mode pair --a <dir before> --rowsA <rows before> --b <dir after> --rowsB <rows after> --first 0 --count 45 --cols 9 --w 128 --out sheet.png
// node pipeline/phase5/polish-sight-sheet.mjs --mode strip --a <dir> --rowsA <rows> --first 8 --count 12 --w 100 --out strip.png
// node pipeline/phase5/polish-sight-sheet.mjs --mode low --a <dir> --rowsA <rows> --first 0 --count 14 --every 2 --cols 7 --w 150 --out low.png
// pair: each frame's whole screen laid small, and under it the ball's own crop at real size (w by w px round the shell's middle as the measure has it); the first set of pictures above, the second below. strip: frames in a row at real size, each cell w px wide round the ball and the whole screen high. low: the screen's lower 400 px at real size round the ball, and under the screen's lower edge a band in which the shell's outline as the measure has it is drawn where the screen ends.
// Beyond the screen's edges the sheet is dark red, and the edge itself is a yellow line one px outside the picture. Under each cell: the frame, the page's seconds and the view's place (the page's scroll).
import fs from 'node:fs'
import sharp from 'sharp'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const mode = arg('mode', 'pair')
const first = Number(arg('first', 0))
const count = Number(arg('count', 12))
const every = Number(arg('every', 1))
const w = Number(arg('w', 128))
const cols = Number(arg('cols', count))
const out = arg('out', '/tmp/polish-sight-sheet.png')
const words = arg('words', '')
const PAD = 160
const LABEL = 26
const HEAD = 18
const sets = ['a', 'b'].filter((k) => arg(k, '')).map((k) => {
  const dir = arg(k, '')
  const times = JSON.parse(fs.readFileSync(`${dir}/times.json`, 'utf8'))
  const rows = JSON.parse(fs.readFileSync(arg(`rows${k.toUpperCase()}`, ''), 'utf8'))
  return { dir, times, rows, name: arg(`name${k.toUpperCase()}`, k === 'a' ? 'before' : 'after') }
})
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const text = (lines, width, height, size = 11) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#111"/>${lines.map((s, i) => `<text x="3" y="${size + i * (size + 1)}" font-family="monospace" font-size="${size}" fill="#fff">${esc(s)}</text>`).join('')}</svg>`)
const rowOf = (set, n) => set.rows[Math.round(set.times[n] * 60) - 1]
const padded = async (set, n) => {
  const base = await sharp(`${set.dir}/${String(n).padStart(3, '0')}.png`).removeAlpha().extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: '#5a1010' }).png().toBuffer()
  const edge = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${1920 + 2 * PAD}" height="${1080 + 2 * PAD}"><rect x="${PAD - 0.5}" y="${PAD - 0.5}" width="1921" height="1081" fill="none" stroke="#ffe000" stroke-width="1"/></svg>`)
  return sharp(base).composite([{ input: edge, left: 0, top: 0 }]).png().toBuffer()
}
const label = (r) => [`f${r.f} ${r.t.toFixed(3)} s`, `view ${r.scroll.toFixed(1)}`]
const parts = []
let width = 0
let height = 0
if (mode === 'pair') {
  const small = Math.round((w * 9) / 16)
  const cell = small + w + LABEL
  const block = sets.length * (HEAD + cell) + 8
  const lines = Math.ceil(count / cols)
  width = cols * w
  height = lines * block
  for (let i = 0; i < count; i++) {
    const n = first + i * every
    for (let k = 0; k < sets.length; k++) {
      const set = sets[k]
      const r = rowOf(set, n)
      const b = r.balls[0].box
      const left = (i % cols) * w
      const top = Math.floor(i / cols) * block + k * (HEAD + cell)
      if (i % cols === 0) parts.push({ input: text([`${set.name}${words ? `, ${words}` : ''}: whole screen small, the ball's crop at real size under it`], width, HEAD, 12), left: 0, top })
      parts.push({ input: await sharp(`${set.dir}/${String(n).padStart(3, '0')}.png`).removeAlpha().resize(w - 2, small - 2, { kernel: 'lanczos3' }).extend({ top: 1, bottom: 1, left: 1, right: 1, background: '#444' }).png().toBuffer(), left, top: top + HEAD })
      const cx = Math.round((b.l + b.r) / 2)
      const cy = Math.round((b.t + b.b) / 2)
      parts.push({ input: await sharp(await padded(set, n)).extract({ left: Math.max(0, Math.min(1920 + 2 * PAD - w, cx - w / 2 + PAD)), top: Math.max(0, Math.min(1080 + 2 * PAD - w, cy - w / 2 + PAD)), width: w - 2, height: w - 2 }).extend({ top: 1, bottom: 1, left: 1, right: 1, background: '#444' }).png().toBuffer(), left, top: top + HEAD + small })
      parts.push({ input: text(label(r), w, LABEL), left, top: top + HEAD + small + w })
    }
  }
} else if (mode === 'strip') {
  const set = sets[0]
  const band = 6
  width = count * w
  height = HEAD + 1080 + 2 * band + LABEL
  parts.push({ input: text([`${set.name}${words ? `, ${words}` : ''}: frames in a row at real size, the whole screen high, ${w} px wide round the ball; yellow lines are the screen's edges`], width, HEAD, 12), left: 0, top: 0 })
  for (let i = 0; i < count; i++) {
    const n = first + i * every
    const r = rowOf(set, n)
    const b = r.balls[0].box
    const cx = Math.round((b.l + b.r) / 2)
    parts.push({ input: await sharp(await padded(set, n)).extract({ left: cx - w / 2 + PAD, top: PAD - band, width: w - 1, height: 1080 + 2 * band }).extend({ right: 1, background: '#444' }).png().toBuffer(), left: i * w, top: HEAD })
    parts.push({ input: text(label(r), w, LABEL, 10), left: i * w, top: HEAD + 1080 + 2 * band })
  }
} else {
  const set = sets[0]
  const under = 100
  const high = 400
  const cell = high + under + LABEL
  const lines = Math.ceil(count / cols)
  width = cols * w
  height = HEAD + lines * cell
  parts.push({ input: text([`${set.name}${words ? `, ${words}` : ''}: the screen's lower ${high} px at real size; the yellow line is the screen's lower edge, the white outline the ball's shell as measured`], width, HEAD, 12), left: 0, top: 0 })
  for (let i = 0; i < count; i++) {
    const n = first + i * every
    const r = rowOf(set, n)
    const b = r.balls[0].box
    const cx = Math.round((b.l + b.r) / 2)
    const x0 = cx - w / 2
    const y0 = 1080 - high
    const left = (i % cols) * w
    const top = HEAD + Math.floor(i / cols) * cell
    const ring = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w - 1}" height="${high + under}"><ellipse cx="${(b.l + b.r) / 2 - x0}" cy="${(b.t + b.b) / 2 - y0}" rx="${(b.r - b.l) / 2}" ry="${(b.b - b.t) / 2}" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3 3"/></svg>`)
    parts.push({ input: await sharp(await sharp(await padded(set, n)).extract({ left: x0 + PAD, top: y0 + PAD, width: w - 1, height: high + under }).png().toBuffer()).composite([{ input: ring, left: 0, top: 0 }]).extend({ right: 1, background: '#444' }).png().toBuffer(), left, top })
    parts.push({ input: text([...label(r), ''].slice(0, 2), w, LABEL, 10), left, top: top + high + under })
  }
}
await sharp({ create: { width, height, channels: 3, background: '#111' } }).composite(parts).png().toFile(out)
console.log(`wrote ${out}: ${count} frames, ${width} by ${height} px`)
