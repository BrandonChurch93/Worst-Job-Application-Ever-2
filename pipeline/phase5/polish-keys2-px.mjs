import sharp from 'sharp'
const [, , x, y, w, h, ...files] = process.argv
for (const f of files) {
  const m = await sharp(f).metadata(); const k = m.width / 1920
  const { data, info } = await sharp(f).extract({ left: Math.round(x * k), top: Math.round(y * k), width: Math.round(w * k), height: Math.round(h * k) }).raw().toBuffer({ resolveWithObject: true })
  let r = 0, g = 0, b = 0; const n = info.width * info.height
  for (let i = 0; i < data.length; i += info.channels) { r += data[i]; g += data[i + 1]; b += data[i + 2] }
  console.log(f.split('/').slice(-2).join('/'), (r / n).toFixed(1), (g / n).toFixed(1), (b / n).toFixed(1))
}
