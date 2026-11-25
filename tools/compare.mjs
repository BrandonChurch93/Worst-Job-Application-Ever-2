// npm run compare -- --key ID | --sheet ID: the approved image beside the build's still, and under them matching crops at native size.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config, readJson } from './lib/paths.mjs'
import { openSession, still } from './lib/capture.mjs'
import { cropTile, fit, label, sheet } from './lib/image.mjs'
import { finder } from './lib/pack-look.mjs'
import { addLook } from './lib/looks.mjs'

const a = args()
const c = config()
const id = a.key || a.sheet
if (!id) {
  console.error('compare: --key ID or --sheet ID')
  process.exit(1)
}
const entry = a.key ? c.keys.find((k) => k.id === a.key) : c.sheets.find((s) => s.id === a.sheet)
if (!entry) {
  console.error(`compare: no ${a.key ? 'key' : 'sheet'} called "${id}"`)
  process.exit(1)
}
const approved = at(entry.image)
if (!fs.existsSync(approved)) {
  console.error(`compare: no approved image ${path.relative(at(), approved)}`)
  process.exit(1)
}
const tier = a.tier || 'review'
const format = a.format || 'hd'
const edge = c.critics.maxImageLongEdgePx
const gap = 8
const half = Math.floor((edge - gap) / 2)

const session = await openSession({ format })
let out
let state
try {
  out = await still(session, { ...(a.key ? { key: a.key } : { sheet: a.sheet }), tier }, { force: Boolean(a.force) })
  state = await session.page.evaluate((spec) => window.showcase.stillState(spec), out.record.what.still)
} finally {
  await session.close()
}

const meta = await sharp(approved).metadata()
const shot = await sharp(out.file).metadata()
const topH = Math.round((half * shot.height) / shot.width)
const rows = [
  [
    { input: await label(`approved: ${path.basename(approved)}`, half), width: half, height: 26 },
    { input: await label(`this build: ${path.basename(out.file)}, ${tier}, ${shot.width} by ${shot.height}`, half), width: half, height: 26 }
  ],
  [
    { input: await fit(approved, half, topH), width: half, height: topH },
    { input: await fit(out.file, half, topH), width: half, height: topH }
  ]
]

// Where each kind of part lies in the approved image, as fractions of its width and height.
const boxes = readJson(at('tools', 'assets', 'approved-boxes.json'))[id] || null
const kinds = boxes ? Object.keys(boxes) : []
const built = finder(state, 1920, 1080)
const pairs = []
for (const kind of kinds) {
  const b = built(kind)
  if (!b) continue
  const f = boxes[kind].box || boxes[kind]
  pairs.push({ kind, approvedBox: [f[0] * meta.width, f[1] * meta.height, f[2] * meta.width, f[3] * meta.height], buildBox: [(b[0] / 1920) * shot.width, (b[1] / 1080) * shot.height, (b[2] / 1920) * shot.width, (b[3] / 1080) * shot.height] })
}
const perRow = 2
const tileW = Math.floor((half - gap * (perRow - 1)) / perRow)
const tileH = Math.min(Math.round(tileW * 0.62), Math.floor((edge - topH - 26 - gap * 2) / Math.max(1, Math.ceil(pairs.length / perRow)) - 26 - gap * 2))
if (tileH >= 80) {
  for (let i = 0; i < pairs.length; i += perRow) {
    const group = pairs.slice(i, i + perRow)
    const names = []
    const tiles = []
    for (const side of ['approvedBox', 'buildBox']) {
      for (const p of group) {
        names.push({ input: await label(`${p.kind}, ${side === 'approvedBox' ? 'approved' : 'this build'}, native size`, tileW, 26, { size: 13 }), width: tileW, height: 26 })
        tiles.push({ input: await cropTile(side === 'approvedBox' ? approved : out.file, p[side], tileW, tileH), width: tileW, height: tileH })
      }
      for (let k = group.length; k < perRow; k++) {
        names.push({ input: await label('', tileW, 26), width: tileW, height: 26 })
        tiles.push({ input: await label('', tileW, tileH), width: tileW, height: tileH })
      }
    }
    rows.push(names, tiles)
  }
}
const file = at('out', 'work', 'compare', `compare-${id}.jpg`)
fs.mkdirSync(path.dirname(file), { recursive: true })
const size = await sheet(rows, file, { gap })
fs.writeFileSync(file.replace(/\.jpg$/, '.json'), JSON.stringify({ ...out.record, compare: { id, approved: path.relative(at(), approved), still: path.relative(at(), out.file), crops: pairs.map((p) => p.kind), width: size.width, height: size.height } }, null, 2) + '\n')
addLook(file, `${a.key ? 'Key' : 'Sheet'} ${id}: approved on the left, this build on the right, ${tier} tier${pairs.length ? `, with crops of ${pairs.map((p) => p.kind).join(', ')}` : ''}`)
console.log(`compare: ${path.relative(at(), file)} (${size.width} by ${size.height}), from ${out.reused ? 'a reused' : 'a new'} still${pairs.length ? `, crops: ${pairs.map((p) => p.kind).join(', ')}` : ', no crops (no boxes for this image)'}`)
