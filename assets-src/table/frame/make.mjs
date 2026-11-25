import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const BAND = { left: 1, top: 331, width: 1670, height: 528 }
const SETS = { web: { dir: 'public/assets/table/frame', w: 1296, h: 336, quality: 86 }, full: { dir: 'assets-full/table/frame', w: 1670, h: 433, quality: 92 } }

for (const [name, s] of Object.entries(SETS)) {
  const out = path.join(root, s.dir, 'marquee-skyline.webp')
  await sharp(path.join(here, 'marquee-skyline-take-1.png')).extract(BAND).resize(s.w, s.h, { kernel: 'lanczos3' }).webp({ quality: s.quality, effort: 6 }).toFile(out)
  const m = await sharp(out).metadata()
  console.log(`${name}: ${path.relative(root, out)} ${m.width} by ${m.height}`)
}
