// node assets-src/table/lights/means.mjs [--keys a,b] [--tier draft]: the mean colour of each key's still beside its approved image, whole frame, and the share of the frame darker than 24 and brighter than 200 of 255.
import fs from 'node:fs'
import sharp from 'sharp'
import { at } from '../../../tools/lib/paths.mjs'

const arg = (name, otherwise) => (process.argv.includes(`--${name}`) ? process.argv[process.argv.indexOf(`--${name}`) + 1] : otherwise)
const keys = arg('keys', 'loader-page,table-wide,tier-corporate,lobby-doors,tier-office,reply-all,tier-street,youre-fired,rail-cam,last-save').split(',')
const tier = arg('tier', 'draft')

async function stats(file) {
  const { data, info } = await sharp(file).resize(960, 540).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const n = info.width * info.height
  const sum = [0, 0, 0]
  let dark = 0
  let bright = 0
  for (let i = 0; i < n; i++) {
    const r = data[i * 3]
    const g = data[i * 3 + 1]
    const b = data[i * 3 + 2]
    sum[0] += r
    sum[1] += g
    sum[2] += b
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (y < 24) dark++
    if (y > 200) bright++
  }
  return { mean: sum.map((v) => Math.round(v / n)), dark: dark / n, bright: bright / n }
}

for (const key of keys) {
  const build = at('out', 'work', 'stills', `key-${key}-hd-${tier}.png`)
  if (!fs.existsSync(build)) continue
  const a = await stats(at('references', 'approved', `${key}.png`))
  const b = await stats(build)
  const lum = (m) => 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]
  console.log(`${key.padEnd(15)} approved (${a.mean.join(', ')}) dark ${(a.dark * 100).toFixed(0)}% bright ${(a.bright * 100).toFixed(1)}%   build (${b.mean.join(', ')}) dark ${(b.dark * 100).toFixed(0)}% bright ${(b.bright * 100).toFixed(1)}%   build over approved ${(lum(b.mean) / lum(a.mean)).toFixed(2)}`)
}
