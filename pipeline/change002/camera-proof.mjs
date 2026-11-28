// node pipeline/change002/camera-proof.mjs [--only film16,views,turn,rise,apart] [--tier draft]
// The film's finish through the four views: strips and single frames into pipeline/change002/proof/camera/. Software GL, one browser.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'

const a = args()
const out = at('pipeline', 'change002', 'proof', 'camera')
const raw = String(a.raw ?? '/tmp/cam/proof')
fs.mkdirSync(out, { recursive: true })
fs.mkdirSync(raw, { recursive: true })
const ARMS = 10818
const FIRE = 11065
const row = (from, count, every = 1) => Array.from({ length: count }, (_, i) => from + i * every)
const JOBS = {
  views: { frames: [11005, 11064, 11087, 11150], single: ['v1-charge', 'v2-fire', 'v3-blast', 'v4-above'] },
  film16: { frames: row(ARMS, 20, 21), cols: 4 },
  turn: { frames: row(11036, 12), cols: 4 },
  rise: { frames: row(FIRE + 27, 12), cols: 4 },
  apart: { frames: row(FIRE + 18, 24, 5), cols: 4 }
}
const only = a.only ? String(a.only).split(',') : Object.keys(JOBS)
const session = await openSession({ format: 'hd', assets: 'full' })
const seconds = []
try {
  const cache = new Map()
  const frame = async (n) => {
    if (cache.has(n)) return cache.get(n)
    const file = path.join(raw, `f${String(n).padStart(6, '0')}.png`)
    if (!fs.existsSync(file) || a.force) {
      const t0 = process.hrtime.bigint()
      fs.writeFileSync(file, await renderJob(session, { kind: 'film', frame: n, tier: String(a.tier ?? 'draft') }))
      seconds.push(Number(process.hrtime.bigint() - t0) / 1e9)
    }
    const png = fs.readFileSync(file)
    cache.set(n, png)
    return png
  }
  for (const name of only) {
    const job = JOBS[name]
    if (job.single) {
      for (let i = 0; i < job.frames.length; i++) await sharp(await frame(job.frames[i])).resize(960, 540).png().toFile(path.join(out, `${job.single[i]}-f${job.frames[i]}.png`))
      continue
    }
    const w = 300
    const h = 169
    const tiles = []
    for (const n of job.frames) tiles.push({ input: await sharp(await frame(n)).resize(w, h).png().toBuffer(), left: (tiles.length % job.cols) * w, top: Math.floor(tiles.length / job.cols) * h })
    await sharp({ create: { width: w * job.cols, height: h * Math.ceil(job.frames.length / job.cols), channels: 3, background: '#000' } }).composite(tiles).jpeg({ quality: 90 }).toFile(path.join(out, `${name}.jpg`))
    fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify({ frames: job.frames, cols: job.cols, tile: [w, h], readsFrom: 'left to right, top to bottom' }) + '\n')
    console.log(name, 'done')
  }
  if (seconds.length) console.log(`frames drawn ${seconds.length}, mean ${(seconds.reduce((p, q) => p + q, 0) / seconds.length).toFixed(2)} s`)
  if (session.problems.length) console.log(session.problems.slice(0, 5).join('\n'))
} finally {
  await session.close()
}
