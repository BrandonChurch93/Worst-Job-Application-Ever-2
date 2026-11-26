// Fix agent tug: one picture of a moment before and after, in consecutive steps at real size, no wider than 1200 px.
// node pipeline/phase5/fix-tug-pair.mjs NAME TITLE LEFT TOP W H COLS BEFORE_DIR FIRST STRIDE COUNT AFTER_DIR FIRST STRIDE COUNT
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [, , name, title, ...n] = process.argv
const [left, top, w, h, cols] = n.slice(0, 5).map(Number)
const sets = [
  { tag: 'before', dir: n[5], first: Number(n[6]), stride: Number(n[7]), count: Number(n[8]) },
  { tag: 'after', dir: n[9], first: Number(n[10]), stride: Number(n[11]), count: Number(n[12]) }
]
const GAP = 4
const BAR = 18
const HEAD = 24
const wide = cols * w + (cols - 1) * GAP
const parts = []
let y = 0
const text = (s, width, height, size, fill) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${fill}"/><text x="6" y="${height - 6}" font-family="sans-serif" font-size="${size}" fill="#fff">${s}</text></svg>`)
for (const set of sets) {
  const run = JSON.parse(fs.readFileSync(path.join(set.dir, 'run.json'), 'utf8'))
  parts.push({ input: text(`${set.tag}: ${title}, every 2 steps of 60 a second, real size`, wide, HEAD, 14, set.tag === 'before' ? '#7a2e2e' : '#2e6a3c'), left: 0, top: y })
  y += HEAD
  for (let i = 0; i < set.count; i++) {
    const step = set.first + i * set.stride
    const file = path.join(set.dir, `${String(step).padStart(6, '0')}.png`)
    const row = run.rows.find((r) => r[0] === step)
    const x = (i % cols) * (w + GAP)
    const ty = y + Math.floor(i / cols) * (h + BAR + GAP)
    parts.push({ input: await sharp(file).extract({ left, top, width: w, height: h }).png().toBuffer(), left: x, top: ty })
    parts.push({ input: text(`${row ? row[1].toFixed(2) : ''} s  step ${step}`, w, BAR, 11, '#16161a'), left: x, top: ty + h })
  }
  y += Math.ceil(set.count / cols) * (h + BAR + GAP) + 4
}
const out = path.join('out', 'work', 'fix-tug', `pair-${name}.png`)
await sharp({ create: { width: wide, height: y, channels: 3, background: '#000' } }).composite(parts).png().toFile(out)
console.log(out, wide, y)
