// node pipeline/change002/boss-live.mjs --at 53.9,54.45,55.5 --out /tmp/live [--bot keen]
// Pictures of the live site at step 4 with a bot driving, at the given seconds of the visit, one file each.
import fs from 'node:fs'
import path from 'node:path'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const a = args()
const out = String(a.out ?? '/tmp/live')
const bot = String(a.bot ?? 'keen')
const seed = Number(a.seed ?? 20261124)
fs.mkdirSync(out, { recursive: true })
const session = await openSession({ format: 'preview', assets: 'web', mode: 'live', query: `&bot=${bot}&seed=${seed}&clock=steps&step=4` })
try {
  let now = (await session.page.evaluate(() => window.liveRun.state())).time
  for (const t of String(a.at).split(',').map(Number)) {
    const s = await session.page.evaluate((dt) => window.liveRun.advance(dt), Math.max(0, t - now))
    now = s.time
    fs.writeFileSync(path.join(out, `t${s.time.toFixed(2)}.png`), Buffer.from(s.png.split(',')[1], 'base64'))
    console.log(`${s.time.toFixed(2)} s ${s.page} ${s.gag ?? ''}`)
    if (s.finished) break
  }
} finally {
  await session.close()
}
