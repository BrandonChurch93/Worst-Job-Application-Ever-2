// Frames in a row at real size, before above and after below, the frame and its time under each.
// node pipeline/phase5/polish-tug3-pair.mjs BEFORE_DIR AFTER_DIR FIRST COUNT LEFT TOP W H COLS OUT [MARK,MARK ...]   a MARK is a frame whose label is drawn bright (the strain's frame)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [, , before, after, first, count, left, top, w, h, cols, out, marks = ''] = process.argv
const n = Number(count)
const c = Number(cols)
const W = Number(w)
const H = Number(h)
const GAP = 2
const BAR = 14
const HEAD = 16
const rows = Math.ceil(n / c)
const block = HEAD + rows * (H + BAR)
const width = c * (W + GAP) - GAP
const bright = new Set(marks.split(',').filter(Boolean).map(Number))
const parts = []
const words = []
const word = (x, y, s, fill) => words.push(`<text x="${x}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-size="11" fill="${fill}">${s}</text>`)
for (const [k, dir, name] of [[0, before, 'BEFORE'], [1, after, 'AFTER']]) {
  word(2, k * block + 12, `${name}, frames ${first} to ${Number(first) + n - 1}, each 1/60 s, real size, page x ${left} to ${Number(left) + W}, y ${top} to ${Number(top) + H}`, '#ffffff')
  for (let i = 0; i < n; i++) {
    const f = Number(first) + i
    const file = path.join(dir, `${String(f).padStart(6, '0')}.png`)
    if (!fs.existsSync(file)) continue
    const x = (i % c) * (W + GAP)
    const y = k * block + HEAD + Math.floor(i / c) * (H + BAR)
    parts.push({ input: await sharp(file).extract({ left: Number(left), top: Number(top), width: W, height: H }).png().toBuffer(), left: x, top: y })
    word(x + 2, y + H + 11, `${f}  ${(f / 60).toFixed(3)} s`, bright.has(f) ? '#ffd24a' : '#c8c8c8')
  }
}
const height = block * 2
parts.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${words.join('')}</svg>`), left: 0, top: 0 })
await sharp({ create: { width, height, channels: 3, background: { r: 24, g: 24, b: 27 } } }).composite(parts).png().toFile(out)
console.log(`${out} ${width} x ${height}, ${((width * height) / 1e6).toFixed(3)} megapixels`)
