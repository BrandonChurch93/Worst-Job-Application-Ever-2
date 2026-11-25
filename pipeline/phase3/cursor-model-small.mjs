import sharp from 'sharp'
const [src, out, w] = process.argv.slice(2)
await sharp(src).resize(Number(w || 1400)).jpeg({ quality: 88 }).toFile(out)
