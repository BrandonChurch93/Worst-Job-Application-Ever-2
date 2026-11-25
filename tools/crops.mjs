// npm run crops -- --key ID: grids of native-size crops of a still: the cursor, every kind of control, the smallest type, a contact shadow, a glass edge.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config } from './lib/paths.mjs'
import { openSession, still } from './lib/capture.mjs'
import { cropTile, cursorBox, label, sheet } from './lib/image.mjs'
import { addLook } from './lib/looks.mjs'

const a = args()
const c = config()
const tier = a.tier || 'review'
const format = a.format || 'hd'
const edge = c.critics.maxImageLongEdgePx
const gap = 8

const session = await openSession({ format })
let out
let state
try {
  out = await still(session, { ...a, tier }, { force: Boolean(a.force) })
  state = await session.page.evaluate((spec) => window.showcase.stillState(spec), out.record.what.still)
} finally {
  await session.close()
}
const shot = await sharp(out.file).metadata()
const sx = shot.width / 1920
const sy = shot.height / 1080
const px = (b) => [b[0] * sx, b[1] * sy, b[2] * sx, b[3] * sy]

const wanted = []
if (cursorBox(state.cursor)) wanted.push({ name: 'the cursor', box: px(cursorBox(state.cursor)) })
const seen = new Set()
for (const part of state.layout) {
  if (seen.has(part.kind)) continue
  seen.add(part.kind)
  wanted.push({ name: `${part.kind} (${part.id})`, box: px(part.drawn), kind: part.kind })
}
const runs = [...state.type].sort((x, y) => x.px - y.px)
if (runs.length) wanted.push({ name: `the smallest type, ${runs[0].px.toFixed(1)} px`, about: runs[0].key, box: px(runs[0].box) })
const standing = state.layout.filter((p) => p.height > 0).sort((x, y) => y.height - x.height)[0]
if (standing) {
  const b = px(standing.drawn)
  wanted.push({ name: `a contact shadow, under ${standing.id}`, box: [b[0] + b[2] * 0.5, b[1] + b[3] * 0.6, b[2] * 0.7, b[3] * 0.8] })
}
const glass = state.layout.find((p) => p.kind === 'field')
if (glass) {
  const b = px(glass.drawn)
  wanted.push({ name: `a glass edge, of ${glass.id}`, box: [b[0] - 20 * sx, b[1] - 20 * sy, 40 * sx, 40 * sy] })
}
for (const extra of state.about || []) wanted.push({ name: extra.name, box: px(extra.box) })

const perRow = 3
const tileW = Math.floor((edge - gap * (perRow - 1)) / perRow)
const tileH = Math.round(tileW * 0.6)
const rowsPerSheet = Math.max(1, Math.floor((edge + gap) / (tileH + 26 + gap * 2)))
const perSheet = perRow * rowsPerSheet
const files = []
const base = path.basename(out.file, '.png')
for (let s = 0; s * perSheet < wanted.length; s++) {
  const group = wanted.slice(s * perSheet, (s + 1) * perSheet)
  const rows = []
  for (let i = 0; i < group.length; i += perRow) {
    const line = group.slice(i, i + perRow)
    const names = []
    const tiles = []
    for (const w of line) {
      names.push({ input: await label(`${w.name}, native size`, tileW, 26, { size: 13 }), width: tileW, height: 26 })
      tiles.push({ input: await cropTile(out.file, w.box, tileW, tileH), width: tileW, height: tileH })
    }
    rows.push(names, tiles)
  }
  const file = at('out', 'work', 'crops', `crops-${base}-${s + 1}.jpg`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const size = await sheet(rows, file, { gap })
  fs.writeFileSync(file.replace(/\.jpg$/, '.json'), JSON.stringify({ ...out.record, crops: { still: path.relative(at(), out.file), parts: group.map((w) => w.name), width: size.width, height: size.height } }, null, 2) + '\n')
  addLook(file, `Crops at native size from ${base}: ${group.map((w) => (w.about ? `${w.name} (${w.about})` : w.name)).join('; ')}`)
  files.push(file)
  console.log(`crops: ${path.relative(at(), file)} (${size.width} by ${size.height}): ${group.map((w) => w.name).join('; ')}`)
}
if (!files.length) console.log('crops: the still reports no parts to crop')
