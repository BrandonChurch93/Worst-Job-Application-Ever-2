// node pipeline/phase5/pack-frames-look.mjs RUN.json OUT_DIR PX STEP [STEP ...]: plays the recorded run again and keeps the whole picture of each step named,
// drawn at PX device pixels to a pixel (1 or 2), to look at where things lie before a window is chosen.
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../../tools/lib/paths.mjs'
import { momentsOf, replay } from '../../tools/lib/pack-site.mjs'

const [file, out, px, ...steps] = process.argv.slice(2)
const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(file, 'utf8')))
fs.mkdirSync(out, { recursive: true })
const t0 = Date.now()
const got = await replay(cfg, run, steps.map(Number), { px: Number(px), log: (l) => console.log(l) })
for (const [i, png] of got) fs.writeFileSync(path.join(out, `step-${String(i).padStart(6, '0')}-x${px}.png`), png)
console.log(`look: ${got.size} pictures in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
