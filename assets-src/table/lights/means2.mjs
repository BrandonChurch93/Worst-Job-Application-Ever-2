import fs from 'node:fs'
import sharp from 'sharp'
const name = process.argv[2]
const keys = (process.argv[3] ?? 'loader-page,table-wide,tier-corporate,lobby-doors,tier-office,reply-all,tier-street,youre-fired,rail-cam,last-save').split(',')
async function stats(file) {
  const { data, info } = await sharp(file).resize(960, 540, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const n = info.width * info.height
  const sum = [0, 0, 0]
  let dark = 0, bright = 0, sat = 0
  for (let i = 0; i < n; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
    sum[0] += r; sum[1] += g; sum[2] += b
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (y < 24) dark++
    if (y > 200) bright++
    sat += Math.max(r, g, b) - Math.min(r, g, b)
  }
  return { mean: sum.map((v) => Math.round(v / n)), dark: dark / n, bright: bright / n, sat: sat / n }
}
const lum = (m) => 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]
for (const key of keys) {
  const build = `out/work/lights/${name}-${key}.png`
  if (!fs.existsSync(build)) continue
  const a = await stats(`references/approved/${key}.png`)
  const b = await stats(build)
  console.log(`${key.padEnd(15)} appr (${a.mean.join(',')}) dk ${(a.dark * 100).toFixed(0)}% br ${(a.bright * 100).toFixed(1)}% sat ${a.sat.toFixed(0)} | build (${b.mean.join(',')}) dk ${(b.dark * 100).toFixed(0)}% br ${(b.bright * 100).toFixed(1)}% sat ${b.sat.toFixed(0)} | ratio ${(lum(b.mean) / lum(a.mean)).toFixed(2)}`)
}
