#!/usr/bin/env node
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sharp = createRequire(path.join(root, 'package.json'))('sharp')
const dir = path.join(root, 'out/work/careers')
const before = path.join(dir, 'careers-page-before.png')
const after = path.join(dir, 'careers-page.png')
const picture = path.join(root, 'references/approved-002/careers-page.png')
const GAP = 12

const places = [
  { name: 'cards', strips: [[before, 190, 1340, 1200, 366], [after, 190, 1340, 1200, 393], [picture, 190, 1340, 1200, 366]] },
  { name: 'steps', strips: [[before, 420, 4842, 1200, 260], [after, 420, 4529, 1200, 260], [picture, 420, 4526, 1200, 260]] },
  { name: 'quotes', strips: [[before, 316, 2216, 1200, 746], [after, 316, 2270, 1200, 379]] }
]

for (const p of places) {
  const parts = []
  let y = 0
  for (const [file, left, top, width, height] of p.strips) {
    parts.push({ input: await sharp(file).extract({ left, top, width, height }).png().toBuffer(), left: 0, top: y })
    y += height + GAP
  }
  const out = path.join(dir, `careers-change-${p.name}.png`)
  await sharp({ create: { width: 1200, height: y - GAP, channels: 3, background: '#3a3a3a' } }).composite(parts).png().toFile(out)
  console.log(`${out}: 1200 by ${y - GAP}`)
}
