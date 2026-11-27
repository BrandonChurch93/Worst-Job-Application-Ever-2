// Sets sheets one above the other (or side by side with --row) into one picture, unscaled, for a before above and an after below.
// node pipeline/phase5/polish-gate-stack.mjs [--row] --out /tmp/pair.png a.png b.png [c.png]
import sharp from 'sharp'

const row = process.argv.includes('--row')
const out = process.argv[process.argv.indexOf('--out') + 1]
const files = process.argv.slice(2).filter((a, i, all) => a.endsWith('.png') && all[i - 1] !== '--out')
const sizes = []
for (const f of files) {
  const m = await sharp(f).metadata()
  sizes.push({ w: m.width, h: m.height })
}
const width = row ? sizes.reduce((n, s) => n + s.w, 0) + 4 * (files.length - 1) : Math.max(...sizes.map((s) => s.w))
const height = row ? Math.max(...sizes.map((s) => s.h)) : sizes.reduce((n, s) => n + s.h, 0) + 4 * (files.length - 1)
let at = 0
const put = []
for (const [i, f] of files.entries()) {
  put.push(row ? { input: f, left: at, top: 0 } : { input: f, left: 0, top: at })
  at += (row ? sizes[i].w : sizes[i].h) + 4
}
await sharp({ create: { width, height, channels: 3, background: '#101010' } }).composite(put).png().toFile(out)
console.log(`wrote ${out}: ${width} by ${height} px`)
