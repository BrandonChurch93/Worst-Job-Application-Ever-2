// node pipeline/change002/boss-level.mjs --level high --second 8 [--bot keen] [--seed 1] --out /tmp/live-high.png
// One picture of the boss page of the live build at one fixed level of the live picture, 1920 by 1080 at a pixel ratio of 1, on the stepped clock (`clock=steps`):
// stepped without a picture to three frames before the second, then drawn three frames running, the last one kept.
import fs from 'node:fs'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const a = args()
const level = String(a.level ?? 'high')
const second = Number(a.second ?? 8)
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `&bot=${String(a.bot ?? 'keen')}&seed=${Number(a.seed ?? 1)}&step=4&quality=${level}&clock=steps` })
try {
  const got = await session.page.evaluate((to) => {
    const gap = to - 3 / 60 - window.liveRun.told().time
    if (gap > 0) window.liveRun.advance(gap, true)
    let shot = null
    for (let i = 0; i < 3; i++) shot = window.liveRun.advance(1 / 60, false)
    const c = document.getElementById('stage')
    return { time: shot.time, page: shot.page, png: shot.png, canvas: [c.width, c.height] }
  }, second)
  const out = String(a.out ?? `/tmp/live-${level}.png`)
  fs.writeFileSync(out, Buffer.from(got.png.split(',')[1], 'base64'))
  console.log(`level asked ${level}, page ${got.page}, second ${got.time.toFixed(3)}, canvas ${got.canvas.join(' by ')}, ${out}`)
  if (session.problems.length) console.log('problems', session.problems.slice(0, 5).join(' | '))
} finally {
  await session.close()
}
