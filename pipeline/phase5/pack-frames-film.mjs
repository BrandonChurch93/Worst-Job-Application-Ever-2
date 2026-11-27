// node pipeline/phase5/pack-frames-film.mjs CACHE_DIR FIRST LAST: draws the film's frames FIRST to LAST as the pack does and prints what the film tells of each.
import { config } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'
import { filmFrames, shaOf } from '../../tools/lib/pack-site.mjs'

const [cache, first, last] = process.argv.slice(2)
const cfg = config()
const session = await openSession({ format: cfg.formats.hd.id, assets: 'full' })
try {
  const frames = Array.from({ length: Number(last) - Number(first) + 1 }, (_, i) => Number(first) + i)
  const got = await filmFrames(cfg, session, frames, { cache, log: (l) => console.log(l) })
  for (const [n, f] of got) console.log(JSON.stringify({ frame: n, sha256: shaOf(f.png).slice(0, 16), camera: f.camera.map((v) => Math.round(v * 100) / 100), cursor: f.cursor }))
} finally {
  await session.close()
}
