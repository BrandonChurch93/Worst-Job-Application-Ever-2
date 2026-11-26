// node assets-src/table/lights/cells.mjs <name> <key>: the mean brightness of a still of out/work/lights by blocks of an 8 by 6 grid, the approved image's on the left.
import sharp from 'sharp'
import { at } from '../../../tools/lib/paths.mjs'

const [name, key] = process.argv.slice(2)
const grid = async (file) => {
  const { data, info } = await sharp(file).resize(960, 540).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const sum = Array.from({ length: 6 }, () => new Float64Array(8))
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const o = (y * info.width + x) * 3
    sum[Math.floor((y * 6) / info.height)][Math.floor((x * 8) / info.width)] += 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]
  }
  return sum.map((r) => Array.from(r).map((v) => v / ((info.width / 8) * (info.height / 6))))
}
const a = await grid(at('references', 'approved', `${key}.png`))
const b = await grid(at('out', 'work', 'lights', `${name}-${key}.png`))
for (let y = 0; y < 6; y++) console.log(a[y].map((v) => v.toFixed(0).padStart(4)).join(' '), '  |  ', b[y].map((v) => v.toFixed(0).padStart(4)).join(' '))
