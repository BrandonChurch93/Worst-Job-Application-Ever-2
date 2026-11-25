import sharp from 'sharp'
const [out, width, ...files] = process.argv.slice(2)
const w = Number(width)
const bufs = []
for (const f of files) bufs.push(await sharp(f).resize(w).toBuffer())
let y = 0
const placed = []
for (const b of bufs) {
  const m = await sharp(b).metadata()
  placed.push({ input: b, left: 0, top: y })
  y += m.height + 6
}
await sharp({ create: { width: w, height: y, channels: 3, background: '#222222' } }).composite(placed).jpeg({ quality: 88 }).toFile(out)
