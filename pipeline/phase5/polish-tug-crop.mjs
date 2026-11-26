import sharp from 'sharp'
import fs from 'node:fs'
const [, , label, first, count, cx, cy, w, h, zoom, out, stride = '2'] = process.argv
const tiles = []
for (let n = 0; n < +count; n++) {
  const i = +first + n * +stride
  const f = `out/work/fix-tug/${label}/${String(i).padStart(6, '0')}.png`
  if (!fs.existsSync(f)) continue
  const m = await sharp(f).metadata()
  const k = m.width / 1920
  tiles.push(await sharp(f).extract({ left: Math.round(+cx * k - +w / 2), top: Math.round(+cy * k - +h / 2), width: +w, height: +h }).resize(+w * +zoom, +h * +zoom, { kernel: 'nearest' }).png().toBuffer())
}
const cols = Math.min(tiles.length, Math.floor(1200 / (+w * +zoom + 4)))
const rows = Math.ceil(tiles.length / cols)
await sharp({ create: { width: cols * (+w * +zoom + 4), height: rows * (+h * +zoom + 4), channels: 3, background: '#000' } }).composite(tiles.map((t, n) => ({ input: t, left: (n % cols) * (+w * +zoom + 4), top: Math.floor(n / cols) * (+h * +zoom + 4) }))).png().toFile(out)
console.log(out, tiles.length)
