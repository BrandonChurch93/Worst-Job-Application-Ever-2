import sharp from 'sharp'
const parts = process.argv.slice(2).map((a) => a.split(':'))
const bufs = []
for (const [set, from, to] of parts) {
  const f = `out/work/cursor-model/sweep-${set}.png`
  const m = await sharp(f).metadata()
  const left = Math.round(m.width * Number(from))
  const width = Math.round(m.width * (Number(to) - Number(from)))
  bufs.push(await sharp(f).extract({ left, top: 0, width, height: m.height }).resize({ height: 800 }).toBuffer())
}
let x = 0
const placed = []
for (const b of bufs) {
  const m = await sharp(b).metadata()
  placed.push({ input: b, left: x, top: 0 })
  x += m.width
}
await sharp({ create: { width: x, height: 800, channels: 3, background: '#222222' } }).composite(placed).jpeg({ quality: 90 }).toFile('out/work/cursor-model/pair.jpg')
