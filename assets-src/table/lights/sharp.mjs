// node assets-src/table/lights/sharp.mjs <name> [keys]: the fine detail of each still of out/work/lights against its approved image at the same size, as the measure M3 reads it.
import fs from 'node:fs'
import sharp from 'sharp'
import { at } from '../../../tools/lib/paths.mjs'
import { highFrequencyEnergy } from '../../../tools/lib/measure-core.mjs'

const name = process.argv[2] ?? 'look'
const keys = (process.argv[3] ?? 'table-wide,tier-corporate,lobby-doors,tier-office,reply-all,tier-street,youre-fired,rail-cam,last-save').split(',')
const energy = async (file, w, h) => {
  const { data, info } = await sharp(file).resize(w, h).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return highFrequencyEnergy(data, info.width, info.height, info.channels)
}
for (const key of keys) {
  const file = at('out', 'work', 'lights', `${name}-${key}.png`)
  if (!fs.existsSync(file)) continue
  const meta = await sharp(file).metadata()
  const a = await energy(at('references', 'approved', `${key}.png`), meta.width, meta.height)
  const b = await energy(file, meta.width, meta.height)
  console.log(`${key.padEnd(15)} still ${b.toFixed(5)} approved ${a.toFixed(5)} ratio ${(b / a).toFixed(3)}`)
}
