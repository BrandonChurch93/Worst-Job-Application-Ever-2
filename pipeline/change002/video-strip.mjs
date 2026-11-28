import sharp from 'sharp'
const [out, w, ...files] = process.argv.slice(2)
const W = Number(w)
const imgs = await Promise.all(files.map(async (f) => { const b = await sharp(f).resize({ width: W }).png().toBuffer(); const m = await sharp(b).metadata(); return { b, h: m.height } }))
const H = Math.max(...imgs.map((i) => i.h))
await sharp({ create: { width: W * imgs.length + 8 * (imgs.length - 1), height: H, channels: 3, background: '#ff00ff' } }).composite(imgs.map((i, k) => ({ input: i.b, left: k * (W + 8), top: 0 }))).jpeg({ quality: 88 }).toFile(out)
